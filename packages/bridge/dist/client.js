import { spawn } from "child_process";
import { BRIDGE_DEFAULT_PORT, BRIDGE_HOST } from "@flow-connect/shared";
export class BridgeClient {
    baseUrl;
    constructor(port = BRIDGE_DEFAULT_PORT) {
        this.baseUrl = `http://${BRIDGE_HOST}:${port}`;
    }
    async isRunning() {
        try {
            const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(1000) });
            return res.ok;
        }
        catch {
            return false;
        }
    }
    async getStatus() {
        try {
            const res = await fetch(`${this.baseUrl}/status`, { signal: AbortSignal.timeout(2000) });
            if (!res.ok)
                return null;
            return (await res.json());
        }
        catch {
            return null;
        }
    }
    async ensureBridge(spawnEntryPath) {
        const existing = await this.getStatus();
        if (existing)
            return existing;
        if (spawnEntryPath) {
            console.log("[BridgeClient] Starting background bridge server...");
            const child = spawn(process.execPath, [spawnEntryPath, "start"], {
                detached: true,
                stdio: "ignore"
            });
            child.unref();
            for (let i = 0; i < 20; i++) {
                await new Promise((r) => setTimeout(r, 250));
                const st = await this.getStatus();
                if (st)
                    return st;
            }
        }
        throw new Error("Bridge server is not running. Please start it using 'flow-free start'.");
    }
    async submitJob(spec, imagePaths = []) {
        const res = await fetch(`${this.baseUrl}/jobs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ job: spec, imagePaths })
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || `HTTP ${res.status}`);
        }
        return data.jobId;
    }
    async getJob(jobId) {
        const res = await fetch(`${this.baseUrl}/jobs/${jobId}`);
        if (!res.ok) {
            throw new Error(`Job ${jobId} not found`);
        }
        return (await res.json());
    }
    async waitForJob(jobId, timeoutMs = 180000) {
        const res = await fetch(`${this.baseUrl}/jobs/${jobId}/wait?timeout=${timeoutMs}`);
        if (!res.ok) {
            throw new Error(`Error waiting for job ${jobId}`);
        }
        return (await res.json());
    }
    async listJobs() {
        const res = await fetch(`${this.baseUrl}/jobs`);
        if (!res.ok)
            return [];
        return (await res.json());
    }
}
