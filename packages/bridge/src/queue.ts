import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import { basename, extname } from "path";
import {
  InputFileMeta,
  JobInputSpec,
  JobRecord,
  JobResultFile,
  JobSpec,
  JobSpecSchema,
  JobStage
} from "@flow-connect/shared";

interface FileEntry {
  token: string;
  name: string;
  mime: string;
  buffer: Buffer;
}

export class JobQueue {
  private jobs = new Map<string, JobRecord>();
  private fileCache = new Map<string, FileEntry>();
  private jobWaiters = new Map<string, (record: JobRecord) => void>();

  constructor() {}

  public async registerInputFile(filePath: string): Promise<InputFileMeta> {
    const buffer = await readFile(filePath);
    const name = basename(filePath);
    const ext = extname(filePath).toLowerCase();
    let mime = "application/octet-stream";
    if (ext === ".png") mime = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") mime = "image/jpeg";
    else if (ext === ".webp") mime = "image/webp";
    else if (ext === ".mp4") mime = "video/mp4";

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

  public getFileByToken(token: string): FileEntry | undefined {
    return this.fileCache.get(token);
  }

  public createJob(spec: JobInputSpec): JobRecord {
    const parsedSpec = JobSpecSchema.parse(spec);
    const id = randomUUID();
    const now = Date.now();
    const record: JobRecord = {
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

  public getJob(id: string): JobRecord | undefined {
    return this.jobs.get(id);
  }

  public listJobs(): JobRecord[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public updateStage(id: string, stage: JobStage, pct?: number, message?: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    job.stage = stage;
    if (pct !== undefined) job.progressPct = pct;
    if (message !== undefined) job.message = message;
    job.updatedAt = Date.now();
    this.notifyWaiters(job);
  }

  public completeJob(id: string, files: JobResultFile[]): void {
    const job = this.jobs.get(id);
    if (!job) return;
    job.stage = "done";
    job.progressPct = 100;
    job.files = files;
    job.updatedAt = Date.now();
    this.notifyWaiters(job);
  }

  public failJob(id: string, reason: string): void {
    const job = this.jobs.get(id);
    if (!job) return;
    job.stage = "failed";
    job.error = reason;
    job.updatedAt = Date.now();
    this.notifyWaiters(job);
  }

  public async waitForJob(id: string, timeoutMs: number = 180000): Promise<JobRecord> {
    const existing = this.jobs.get(id);
    if (existing && (existing.stage === "done" || existing.stage === "failed")) {
      return existing;
    }

    return new Promise<JobRecord>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.jobWaiters.delete(id);
        const current = this.jobs.get(id);
        if (current) {
          resolve(current);
        } else {
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

  private notifyWaiters(record: JobRecord) {
    const waiter = this.jobWaiters.get(record.id);
    if (waiter) {
      waiter(record);
    }
  }
}
