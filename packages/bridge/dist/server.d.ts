import { BridgeStatus, JobInputSpec } from "@flow-connect/shared";
import { JobQueue } from "./queue.js";
export declare class BridgeServer {
    private server;
    private wss;
    private queue;
    private port;
    private extSocket;
    private extVersion;
    private flowTabOpen;
    private flowTabVisible;
    private userLoggedIn;
    constructor(port?: number);
    getQueue(): JobQueue;
    getStatus(): BridgeStatus;
    start(): Promise<number>;
    stop(): Promise<void>;
    private handleWsConnection;
    submitJob(spec: JobInputSpec, imagePaths?: string[]): Promise<string>;
    private handleHttp;
    private readJsonBody;
}
