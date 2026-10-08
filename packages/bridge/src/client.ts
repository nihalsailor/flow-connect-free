import { spawn } from "child_process";
import { resolve } from "path";
import {
  BRIDGE_DEFAULT_PORT,
  BRIDGE_HOST,
  BridgeStatus,
  JobInputSpec,
  JobRecord,
  JobSpec
} from "@flow-connect/shared";

export class BridgeClient {
  private baseUrl: string;

  constructor(port: number = BRIDGE_DEFAULT_PORT) {
    this.baseUrl = `http://${BRIDGE_HOST}:${port}`;
  }

  public async isRunning(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(1000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async getStatus(): Promise<BridgeStatus | null> {
    try {
      const res = await fetch(`${this.baseUrl}/status`, { signal: AbortSignal.timeout(2000) });
      if (!res.ok) return null;
      return (await res.json()) as BridgeStatus;
    } catch {
      return null;
    }
  }

  public async ensureBridge(spawnEntryPath?: string): Promise<BridgeStatus> {
    const existing = await this.getStatus();
    if (existing) return existing;

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
        if (st) return st;
      }
    }

    throw new Error("Bridge server is not running. Please start it using 'flow-free start'.");
  }

  public async submitJob(spec: JobInputSpec, imagePaths: string[] = []): Promise<string> {
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

  public async getJob(jobId: string): Promise<JobRecord> {
    const res = await fetch(`${this.baseUrl}/jobs/${jobId}`);
    if (!res.ok) {
      throw new Error(`Job ${jobId} not found`);
    }
    return (await res.json()) as JobRecord;
  }

  public async waitForJob(jobId: string, timeoutMs: number = 180000): Promise<JobRecord> {
    const res = await fetch(`${this.baseUrl}/jobs/${jobId}/wait?timeout=${timeoutMs}`);
    if (!res.ok) {
      throw new Error(`Error waiting for job ${jobId}`);
    }
    return (await res.json()) as JobRecord;
  }

  public async listJobs(): Promise<JobRecord[]> {
    const res = await fetch(`${this.baseUrl}/jobs`);
    if (!res.ok) return [];
    return (await res.json()) as JobRecord[];
  }
}
