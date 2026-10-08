import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { BRIDGE_DEFAULT_PORT, BRIDGE_HOST, ExtToBridgeSchema, JobSpecSchema } from "@flow-connect/shared";
import { JobQueue } from "./queue.js";
export class BridgeServer {
    server;
    wss;
    queue;
    port;
    extSocket = null;
    extVersion = null;
    flowTabOpen = null;
    flowTabVisible = null;
    userLoggedIn = null;
    constructor(port = BRIDGE_DEFAULT_PORT) {
        this.port = port;
        this.queue = new JobQueue();
        this.server = http.createServer((req, res) => this.handleHttp(req, res));
        this.wss = new WebSocketServer({ noServer: true });
        this.server.on("upgrade", (req, socket, head) => {
            const url = req.url || "/";
            if (url.startsWith("/ws")) {
                this.wss.handleUpgrade(req, socket, head, (ws) => {
                    this.wss.emit("connection", ws, req);
                });
            }
            else {
                socket.destroy();
            }
        });
        this.wss.on("connection", (ws) => this.handleWsConnection(ws));
    }
    getQueue() {
        return this.queue;
    }
    getStatus() {
        return {
            bridge: "up",
            bridgeVersion: "1.0.0",
            extensionConnected: this.extSocket !== null && this.extSocket.readyState === WebSocket.OPEN,
            extensionVersion: this.extVersion ?? undefined,
            flowTabOpen: this.flowTabOpen,
            flowTabVisible: this.flowTabVisible,
            userLoggedIn: this.userLoggedIn,
            activeJobs: this.queue.listJobs().filter(j => j.stage !== "done" && j.stage !== "failed").length
        };
    }
    async start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, BRIDGE_HOST, () => {
                console.log(`[FlowConnect Bridge] Listening on http://${BRIDGE_HOST}:${this.port}`);
                resolve(this.port);
            });
            this.server.on("error", reject);
        });
    }
    async stop() {
        return new Promise((resolve) => {
            this.wss.close();
            this.server.close(() => resolve());
        });
    }
    handleWsConnection(ws) {
        console.log("[FlowConnect Bridge] Chrome Extension connected via WebSocket");
        this.extSocket = ws;
        const helloMsg = {
            t: "bridge.hello",
            bridgeVersion: "1.0.0"
        };
        ws.send(JSON.stringify(helloMsg));
        ws.on("message", (data) => {
            try {
                const raw = JSON.parse(data.toString());
                const parsed = ExtToBridgeSchema.safeParse(raw);
                if (!parsed.success) {
                    console.warn("[FlowConnect Bridge] Invalid message from extension:", parsed.error.format());
                    return;
                }
                const msg = parsed.data;
                switch (msg.t) {
                    case "ext.hello":
                        this.extVersion = msg.extVersion;
                        this.flowTabOpen = msg.flowTabOpen;
                        this.flowTabVisible = msg.flowTabVisible;
                        this.userLoggedIn = msg.userLoggedIn;
                        console.log(`[FlowConnect Bridge] Extension v${msg.extVersion} ready. FlowTab: ${msg.flowTabOpen ? "Open" : "Closed"}, Visible: ${msg.flowTabVisible}, LoggedIn: ${msg.userLoggedIn}`);
                        break;
                    case "ext.status":
                        this.flowTabOpen = msg.flowTabOpen;
                        this.flowTabVisible = msg.flowTabVisible;
                        this.userLoggedIn = msg.userLoggedIn;
                        break;
                    case "job.accepted":
                        console.log(`[FlowConnect Bridge] Job ${msg.jobId} accepted by extension`);
                        this.queue.updateStage(msg.jobId, "preparing");
                        break;
                    case "job.progress":
                        this.queue.updateStage(msg.jobId, msg.stage, msg.pct, msg.message);
                        break;
                    case "job.result":
                        console.log(`[FlowConnect Bridge] Job ${msg.jobId} completed with ${msg.files.length} file(s)`);
                        this.queue.completeJob(msg.jobId, msg.files);
                        break;
                    case "job.failed":
                        console.warn(`[FlowConnect Bridge] Job ${msg.jobId} failed: ${msg.reason}`);
                        this.queue.failJob(msg.jobId, msg.reason);
                        break;
                    case "ext.heartbeat":
                        break;
                }
            }
            catch (err) {
                console.error("[FlowConnect Bridge] Error handling WS message:", err);
            }
        });
        ws.on("close", () => {
            console.log("[FlowConnect Bridge] Extension disconnected");
            if (this.extSocket === ws) {
                this.extSocket = null;
            }
        });
    }
    async submitJob(spec, imagePaths = []) {
        const inputFiles = [];
        for (const imgPath of imagePaths) {
            const fileMeta = await this.queue.registerInputFile(imgPath);
            inputFiles.push(fileMeta);
        }
        spec.inputImages = inputFiles;
        const record = this.queue.createJob(spec);
        if (!this.extSocket || this.extSocket.readyState !== WebSocket.OPEN) {
            this.queue.failJob(record.id, "Chrome extension is not connected to local bridge");
            throw new Error("Chrome extension is not connected to local bridge. Open Chrome with Flow Connector extension installed.");
        }
        const submitMsg = {
            t: "job.submit",
            jobId: record.id,
            job: record.spec,
            inputFiles
        };
        this.extSocket.send(JSON.stringify(submitMsg));
        return record.id;
    }
    async handleHttp(req, res) {
        const url = new URL(req.url || "/", `http://${req.headers.host}`);
        const method = req.method?.toUpperCase() || "GET";
        // CORS headers
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        if (method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
        }
        try {
            if (url.pathname === "/health" || url.pathname === "/") {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ ok: true, status: "up", version: "1.0.0" }));
                return;
            }
            if (url.pathname === "/status" && method === "GET") {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(this.getStatus()));
                return;
            }
            if (url.pathname === "/jobs" && method === "GET") {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(this.queue.listJobs()));
                return;
            }
            if (url.pathname === "/jobs" && method === "POST") {
                const body = await this.readJsonBody(req);
                const parsedSpec = JobSpecSchema.safeParse(body.job || body);
                if (!parsedSpec.success) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: parsedSpec.error.format() }));
                    return;
                }
                const imagePaths = Array.isArray(body.imagePaths) ? body.imagePaths : [];
                const jobId = await this.submitJob(parsedSpec.data, imagePaths);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ jobId }));
                return;
            }
            const jobMatch = url.pathname.match(/^\/jobs\/([a-zA-Z0-9_-]+)$/);
            if (jobMatch && method === "GET") {
                const jobId = jobMatch[1];
                const job = this.queue.getJob(jobId);
                if (!job) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Job not found" }));
                    return;
                }
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(job));
                return;
            }
            const waitMatch = url.pathname.match(/^\/jobs\/([a-zA-Z0-9_-]+)\/wait$/);
            if (waitMatch && method === "GET") {
                const jobId = waitMatch[1];
                const timeoutMs = parseInt(url.searchParams.get("timeout") || "180000", 10);
                const job = await this.queue.waitForJob(jobId, timeoutMs);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(job));
                return;
            }
            const fileMatch = url.pathname.match(/^\/files\/([a-zA-Z0-9_-]+)$/);
            if (fileMatch && method === "GET") {
                const token = fileMatch[1];
                const file = this.queue.getFileByToken(token);
                if (!file) {
                    res.writeHead(404, { "Content-Type": "text/plain" });
                    res.end("File not found");
                    return;
                }
                res.writeHead(200, {
                    "Content-Type": file.mime,
                    "Content-Length": file.buffer.length
                });
                res.end(file.buffer);
                return;
            }
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Endpoint not found" }));
        }
        catch (err) {
            console.error("[FlowConnect Bridge] HTTP Error:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message || "Internal server error" }));
        }
    }
    async readJsonBody(req) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            req.on("data", (chunk) => chunks.push(chunk));
            req.on("end", () => {
                try {
                    const str = Buffer.concat(chunks).toString("utf-8");
                    resolve(str ? JSON.parse(str) : {});
                }
                catch (e) {
                    reject(e);
                }
            });
            req.on("error", reject);
        });
    }
}
