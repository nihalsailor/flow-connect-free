import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import { basename, extname } from "path";
import { JobSpecSchema } from "@flow-connect/shared";
export class JobQueue {
    jobs = new Map();
    fileCache = new Map();
    jobWaiters = new Map();
    constructor() { }
    async registerInputFile(filePath) {
        const buffer = await readFile(filePath);
        const name = basename(filePath);
        const ext = extname(filePath).toLowerCase();
        let mime = "application/octet-stream";
        if (ext === ".png")
            mime = "image/png";
        else if (ext === ".jpg" || ext === ".jpeg")
            mime = "image/jpeg";
        else if (ext === ".webp")
            mime = "image/webp";
        else if (ext === ".mp4")
            mime = "video/mp4";
        const token = randomUUID();
        this.fileCache.set(token, { token, name, mime, buffer });
        const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
        return {
            name,
            mime,
            size: buffer.length,
            token,
            dataUrl
        };
    }
    getFileByToken(token) {
        return this.fileCache.get(token);
    }
    createJob(spec) {
        const parsedSpec = JobSpecSchema.parse(spec);
        const id = randomUUID();
        const now = Date.now();
        const record = {
            id,
            spec: parsedSpec,
            stage: "queued",
            files: [],
            createdAt: now,
            updatedAt: now
        };
        this.jobs.set(id, record);
        return record;
    }
    getJob(id) {
        return this.jobs.get(id);
    }
    listJobs() {
        return Array.from(this.jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
    }
    updateStage(id, stage, pct, message) {
        const job = this.jobs.get(id);
        if (!job)
            return;
        job.stage = stage;
        if (pct !== undefined)
            job.progressPct = pct;
        if (message !== undefined)
            job.message = message;
        job.updatedAt = Date.now();
        this.notifyWaiters(job);
    }
    completeJob(id, files) {
        const job = this.jobs.get(id);
        if (!job)
            return;
        job.stage = "done";
        job.progressPct = 100;
        job.files = files;
        job.updatedAt = Date.now();
        this.notifyWaiters(job);
    }
    failJob(id, reason) {
        const job = this.jobs.get(id);
        if (!job)
            return;
        job.stage = "failed";
        job.error = reason;
        job.updatedAt = Date.now();
        this.notifyWaiters(job);
    }
    async waitForJob(id, timeoutMs = 180000) {
        const existing = this.jobs.get(id);
        if (existing && (existing.stage === "done" || existing.stage === "failed")) {
            return existing;
        }
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.jobWaiters.delete(id);
                const current = this.jobs.get(id);
                if (current) {
                    resolve(current);
                }
                else {
                    reject(new Error(`Timeout waiting for job ${id}`));
                }
            }, timeoutMs);
            this.jobWaiters.set(id, (record) => {
                if (record.stage === "done" || record.stage === "failed") {
                    clearTimeout(timer);
                    this.jobWaiters.delete(id);
                    resolve(record);
                }
            });
        });
    }
    notifyWaiters(record) {
        const waiter = this.jobWaiters.get(record.id);
        if (waiter) {
            waiter(record);
        }
    }
}
