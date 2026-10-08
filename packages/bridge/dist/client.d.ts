import { BridgeStatus, JobInputSpec, JobRecord } from "@flow-connect/shared";
export declare class BridgeClient {
    private baseUrl;
    constructor(port?: number);
    isRunning(): Promise<boolean>;
    getStatus(): Promise<BridgeStatus | null>;
    ensureBridge(spawnEntryPath?: string): Promise<BridgeStatus>;
    submitJob(spec: JobInputSpec, imagePaths?: string[]): Promise<string>;
    getJob(jobId: string): Promise<JobRecord>;
    waitForJob(jobId: string, timeoutMs?: number): Promise<JobRecord>;
    listJobs(): Promise<JobRecord[]>;
}
