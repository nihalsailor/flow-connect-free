import { InputFileMeta, JobInputSpec, JobRecord, JobResultFile, JobStage } from "@flow-connect/shared";
interface FileEntry {
    token: string;
    name: string;
    mime: string;
    buffer: Buffer;
}
export declare class JobQueue {
    private jobs;
    private fileCache;
    private jobWaiters;
    constructor();
    registerInputFile(filePath: string): Promise<InputFileMeta>;
    getFileByToken(token: string): FileEntry | undefined;
    createJob(spec: JobInputSpec): JobRecord;
    getJob(id: string): JobRecord | undefined;
    listJobs(): JobRecord[];
    updateStage(id: string, stage: JobStage, pct?: number, message?: string): void;
    completeJob(id: string, files: JobResultFile[]): void;
    failJob(id: string, reason: string): void;
    waitForJob(id: string, timeoutMs?: number): Promise<JobRecord>;
    private notifyWaiters;
}
export {};
