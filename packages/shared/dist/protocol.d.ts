import { z } from "zod";
export declare const BRIDGE_DEFAULT_PORT = 8791;
export declare const BRIDGE_HOST = "127.0.0.1";
export declare const ExtToBridgeSchema: z.ZodDiscriminatedUnion<"t", [z.ZodObject<{
    t: z.ZodLiteral<"ext.hello">;
    extVersion: z.ZodString;
    flowTabOpen: z.ZodBoolean;
    flowTabVisible: z.ZodBoolean;
    userLoggedIn: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    t: "ext.hello";
    extVersion: string;
    flowTabOpen: boolean;
    flowTabVisible: boolean;
    userLoggedIn: boolean;
}, {
    t: "ext.hello";
    extVersion: string;
    flowTabOpen: boolean;
    flowTabVisible: boolean;
    userLoggedIn: boolean;
}>, z.ZodObject<{
    t: z.ZodLiteral<"ext.heartbeat">;
}, "strip", z.ZodTypeAny, {
    t: "ext.heartbeat";
}, {
    t: "ext.heartbeat";
}>, z.ZodObject<{
    t: z.ZodLiteral<"ext.status">;
    flowTabOpen: z.ZodBoolean;
    flowTabVisible: z.ZodBoolean;
    userLoggedIn: z.ZodBoolean;
    activeJobs: z.ZodNumber;
    currentJobId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    t: "ext.status";
    flowTabOpen: boolean;
    flowTabVisible: boolean;
    userLoggedIn: boolean;
    activeJobs: number;
    currentJobId?: string | undefined;
}, {
    t: "ext.status";
    flowTabOpen: boolean;
    flowTabVisible: boolean;
    userLoggedIn: boolean;
    activeJobs: number;
    currentJobId?: string | undefined;
}>, z.ZodObject<{
    t: z.ZodLiteral<"job.accepted">;
    jobId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    t: "job.accepted";
    jobId: string;
}, {
    t: "job.accepted";
    jobId: string;
}>, z.ZodObject<{
    t: z.ZodLiteral<"job.progress">;
    jobId: z.ZodString;
    stage: z.ZodEnum<["queued", "preparing", "navigating", "uploading", "configuring", "submitting", "generating", "downloading", "done", "failed"]>;
    pct: z.ZodOptional<z.ZodNumber>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    stage: "queued" | "preparing" | "navigating" | "uploading" | "configuring" | "submitting" | "generating" | "downloading" | "done" | "failed";
    t: "job.progress";
    jobId: string;
    message?: string | undefined;
    pct?: number | undefined;
}, {
    stage: "queued" | "preparing" | "navigating" | "uploading" | "configuring" | "submitting" | "generating" | "downloading" | "done" | "failed";
    t: "job.progress";
    jobId: string;
    message?: string | undefined;
    pct?: number | undefined;
}>, z.ZodObject<{
    t: z.ZodLiteral<"job.result">;
    jobId: z.ZodString;
    files: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        path: z.ZodString;
        url: z.ZodOptional<z.ZodString>;
        mime: z.ZodString;
        size: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        name: string;
        mime: string;
        size?: number | undefined;
        url?: string | undefined;
    }, {
        path: string;
        name: string;
        mime: string;
        size?: number | undefined;
        url?: string | undefined;
    }>, "many">;
    warning: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    files: {
        path: string;
        name: string;
        mime: string;
        size?: number | undefined;
        url?: string | undefined;
    }[];
    t: "job.result";
    jobId: string;
    warning?: string | undefined;
}, {
    files: {
        path: string;
        name: string;
        mime: string;
        size?: number | undefined;
        url?: string | undefined;
    }[];
    t: "job.result";
    jobId: string;
    warning?: string | undefined;
}>, z.ZodObject<{
    t: z.ZodLiteral<"job.failed">;
    jobId: z.ZodString;
    reason: z.ZodString;
    retryable: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    t: "job.failed";
    jobId: string;
    reason: string;
    retryable: boolean;
}, {
    t: "job.failed";
    jobId: string;
    reason: string;
    retryable?: boolean | undefined;
}>]>;
export type ExtToBridgeMessage = z.infer<typeof ExtToBridgeSchema>;
export declare const BridgeToExtSchema: z.ZodDiscriminatedUnion<"t", [z.ZodObject<{
    t: z.ZodLiteral<"bridge.hello">;
    bridgeVersion: z.ZodString;
}, "strip", z.ZodTypeAny, {
    t: "bridge.hello";
    bridgeVersion: string;
}, {
    t: "bridge.hello";
    bridgeVersion: string;
}>, z.ZodObject<{
    t: z.ZodLiteral<"job.submit">;
    jobId: z.ZodString;
    job: z.ZodObject<{
        prompt: z.ZodString;
        mode: z.ZodEnum<["flow-text-to-image", "flow-image-to-image", "flow-text-to-video", "flow-frame-to-video", "flow-ingredients-to-video", "flow-extend-video"]>;
        params: z.ZodDefault<z.ZodObject<{
            aspectRatio: z.ZodDefault<z.ZodOptional<z.ZodEnum<["16:9", "9:16", "1:1", "4:3", "3:4", "2:3", "3:2"]>>>;
            duration: z.ZodOptional<z.ZodEnum<["4s", "6s", "8s", "10s"]>>;
            model: z.ZodOptional<z.ZodString>;
            outputsPerPrompt: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
            downloadFolder: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            aspectRatio: "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "2:3" | "3:2";
            outputsPerPrompt: number;
            downloadFolder: string;
            duration?: "4s" | "6s" | "8s" | "10s" | undefined;
            model?: string | undefined;
        }, {
            aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "2:3" | "3:2" | undefined;
            duration?: "4s" | "6s" | "8s" | "10s" | undefined;
            model?: string | undefined;
            outputsPerPrompt?: number | undefined;
            downloadFolder?: string | undefined;
        }>>;
        inputImages: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            mime: z.ZodString;
            size: z.ZodOptional<z.ZodNumber>;
            token: z.ZodOptional<z.ZodString>;
            dataUrl: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            mime: string;
            size?: number | undefined;
            token?: string | undefined;
            dataUrl?: string | undefined;
        }, {
            name: string;
            mime: string;
            size?: number | undefined;
            token?: string | undefined;
            dataUrl?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        params: {
            aspectRatio: "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "2:3" | "3:2";
            outputsPerPrompt: number;
            downloadFolder: string;
            duration?: "4s" | "6s" | "8s" | "10s" | undefined;
            model?: string | undefined;
        };
        prompt: string;
        mode: "flow-text-to-image" | "flow-image-to-image" | "flow-text-to-video" | "flow-frame-to-video" | "flow-ingredients-to-video" | "flow-extend-video";
        inputImages: {
            name: string;
            mime: string;
            size?: number | undefined;
            token?: string | undefined;
            dataUrl?: string | undefined;
        }[];
    }, {
        prompt: string;
        mode: "flow-text-to-image" | "flow-image-to-image" | "flow-text-to-video" | "flow-frame-to-video" | "flow-ingredients-to-video" | "flow-extend-video";
        params?: {
            aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "2:3" | "3:2" | undefined;
            duration?: "4s" | "6s" | "8s" | "10s" | undefined;
            model?: string | undefined;
            outputsPerPrompt?: number | undefined;
            downloadFolder?: string | undefined;
        } | undefined;
        inputImages?: {
            name: string;
            mime: string;
            size?: number | undefined;
            token?: string | undefined;
            dataUrl?: string | undefined;
        }[] | undefined;
    }>;
    inputFiles: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        mime: z.ZodString;
        size: z.ZodOptional<z.ZodNumber>;
        token: z.ZodOptional<z.ZodString>;
        dataUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        mime: string;
        size?: number | undefined;
        token?: string | undefined;
        dataUrl?: string | undefined;
    }, {
        name: string;
        mime: string;
        size?: number | undefined;
        token?: string | undefined;
        dataUrl?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    t: "job.submit";
    jobId: string;
    job: {
        params: {
            aspectRatio: "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "2:3" | "3:2";
            outputsPerPrompt: number;
            downloadFolder: string;
            duration?: "4s" | "6s" | "8s" | "10s" | undefined;
            model?: string | undefined;
        };
        prompt: string;
        mode: "flow-text-to-image" | "flow-image-to-image" | "flow-text-to-video" | "flow-frame-to-video" | "flow-ingredients-to-video" | "flow-extend-video";
        inputImages: {
            name: string;
            mime: string;
            size?: number | undefined;
            token?: string | undefined;
            dataUrl?: string | undefined;
        }[];
    };
    inputFiles: {
        name: string;
        mime: string;
        size?: number | undefined;
        token?: string | undefined;
        dataUrl?: string | undefined;
    }[];
}, {
    t: "job.submit";
    jobId: string;
    job: {
        prompt: string;
        mode: "flow-text-to-image" | "flow-image-to-image" | "flow-text-to-video" | "flow-frame-to-video" | "flow-ingredients-to-video" | "flow-extend-video";
        params?: {
            aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "2:3" | "3:2" | undefined;
            duration?: "4s" | "6s" | "8s" | "10s" | undefined;
            model?: string | undefined;
            outputsPerPrompt?: number | undefined;
            downloadFolder?: string | undefined;
        } | undefined;
        inputImages?: {
            name: string;
            mime: string;
            size?: number | undefined;
            token?: string | undefined;
            dataUrl?: string | undefined;
        }[] | undefined;
    };
    inputFiles?: {
        name: string;
        mime: string;
        size?: number | undefined;
        token?: string | undefined;
        dataUrl?: string | undefined;
    }[] | undefined;
}>, z.ZodObject<{
    t: z.ZodLiteral<"job.cancel">;
    jobId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    t: "job.cancel";
    jobId: string;
}, {
    t: "job.cancel";
    jobId: string;
}>, z.ZodObject<{
    t: z.ZodLiteral<"status.query">;
}, "strip", z.ZodTypeAny, {
    t: "status.query";
}, {
    t: "status.query";
}>, z.ZodObject<{
    t: z.ZodLiteral<"ext.reload">;
}, "strip", z.ZodTypeAny, {
    t: "ext.reload";
}, {
    t: "ext.reload";
}>]>;
export type BridgeToExtMessage = z.infer<typeof BridgeToExtSchema>;
export declare const BridgeStatusSchema: z.ZodObject<{
    bridge: z.ZodLiteral<"up">;
    bridgeVersion: z.ZodString;
    extensionConnected: z.ZodBoolean;
    extensionVersion: z.ZodOptional<z.ZodString>;
    flowTabOpen: z.ZodNullable<z.ZodBoolean>;
    flowTabVisible: z.ZodNullable<z.ZodBoolean>;
    userLoggedIn: z.ZodNullable<z.ZodBoolean>;
    activeJobs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    flowTabOpen: boolean | null;
    flowTabVisible: boolean | null;
    userLoggedIn: boolean | null;
    activeJobs: number;
    bridgeVersion: string;
    bridge: "up";
    extensionConnected: boolean;
    extensionVersion?: string | undefined;
}, {
    flowTabOpen: boolean | null;
    flowTabVisible: boolean | null;
    userLoggedIn: boolean | null;
    activeJobs: number;
    bridgeVersion: string;
    bridge: "up";
    extensionConnected: boolean;
    extensionVersion?: string | undefined;
}>;
export type BridgeStatus = z.infer<typeof BridgeStatusSchema>;
