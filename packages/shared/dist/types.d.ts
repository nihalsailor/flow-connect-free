import { z } from "zod";
export declare const ModeSchema: z.ZodEnum<["flow-text-to-image", "flow-image-to-image", "flow-text-to-video", "flow-frame-to-video", "flow-ingredients-to-video", "flow-extend-video"]>;
export type GenerationMode = z.infer<typeof ModeSchema>;
export declare const AspectRatioSchema: z.ZodEnum<["16:9", "9:16", "1:1", "4:3", "3:4", "2:3", "3:2"]>;
export type AspectRatio = z.infer<typeof AspectRatioSchema>;
export declare const VideoDurationSchema: z.ZodEnum<["4s", "6s", "8s", "10s"]>;
export type VideoDuration = z.infer<typeof VideoDurationSchema>;
export declare const ImageModelSchema: z.ZodEnum<["nano-banana-pro", "nano-banana-2", "nano-banana-2-lite"]>;
export type ImageModel = z.infer<typeof ImageModelSchema>;
export declare const VideoModelSchema: z.ZodEnum<["omni-flash", "veo-3.1-lite", "veo-3.1-fast", "veo-3.1-quality"]>;
export type VideoModel = z.infer<typeof VideoModelSchema>;
export declare const JobStageSchema: z.ZodEnum<["queued", "preparing", "navigating", "uploading", "configuring", "submitting", "generating", "downloading", "done", "failed"]>;
export type JobStage = z.infer<typeof JobStageSchema>;
export declare const InputFileMetaSchema: z.ZodObject<{
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
}>;
export type InputFileMeta = z.infer<typeof InputFileMetaSchema>;
export declare const JobParamsSchema: z.ZodObject<{
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
}>;
export type JobParams = {
    aspectRatio?: AspectRatio;
    duration?: VideoDuration;
    model?: string;
    outputsPerPrompt?: number;
    downloadFolder?: string;
};
export declare const JobSpecSchema: z.ZodObject<{
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
export type JobSpec = z.infer<typeof JobSpecSchema>;
export type JobInputSpec = z.input<typeof JobSpecSchema>;
export declare const JobResultFileSchema: z.ZodObject<{
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
}>;
export type JobResultFile = z.infer<typeof JobResultFileSchema>;
export declare const JobRecordSchema: z.ZodObject<{
    id: z.ZodString;
    spec: z.ZodObject<{
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
    stage: z.ZodEnum<["queued", "preparing", "navigating", "uploading", "configuring", "submitting", "generating", "downloading", "done", "failed"]>;
    progressPct: z.ZodOptional<z.ZodNumber>;
    message: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
    files: z.ZodDefault<z.ZodArray<z.ZodObject<{
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
    }>, "many">>;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    spec: {
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
    stage: "queued" | "preparing" | "navigating" | "uploading" | "configuring" | "submitting" | "generating" | "downloading" | "done" | "failed";
    files: {
        path: string;
        name: string;
        mime: string;
        size?: number | undefined;
        url?: string | undefined;
    }[];
    createdAt: number;
    updatedAt: number;
    message?: string | undefined;
    progressPct?: number | undefined;
    error?: string | undefined;
}, {
    id: string;
    spec: {
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
    stage: "queued" | "preparing" | "navigating" | "uploading" | "configuring" | "submitting" | "generating" | "downloading" | "done" | "failed";
    createdAt: number;
    updatedAt: number;
    message?: string | undefined;
    progressPct?: number | undefined;
    error?: string | undefined;
    files?: {
        path: string;
        name: string;
        mime: string;
        size?: number | undefined;
        url?: string | undefined;
    }[] | undefined;
}>;
export type JobRecord = z.infer<typeof JobRecordSchema>;
