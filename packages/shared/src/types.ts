import { z } from "zod";

export const ModeSchema = z.enum([
  "flow-text-to-image",
  "flow-image-to-image",
  "flow-text-to-video",
  "flow-frame-to-video",
  "flow-ingredients-to-video",
  "flow-extend-video"
]);
export type GenerationMode = z.infer<typeof ModeSchema>;

export const AspectRatioSchema = z.enum([
  "16:9",
  "9:16",
  "1:1",
  "4:3",
  "3:4",
  "2:3",
  "3:2"
]);
export type AspectRatio = z.infer<typeof AspectRatioSchema>;

export const VideoDurationSchema = z.enum(["4s", "6s", "8s", "10s"]);
export type VideoDuration = z.infer<typeof VideoDurationSchema>;

export const ImageModelSchema = z.enum([
  "nano-banana-pro",
  "nano-banana-2",
  "nano-banana-2-lite"
]);
export type ImageModel = z.infer<typeof ImageModelSchema>;

export const VideoModelSchema = z.enum([
  "omni-flash",
  "veo-3.1-lite",
  "veo-3.1-fast",
  "veo-3.1-quality"
]);
export type VideoModel = z.infer<typeof VideoModelSchema>;

export const JobStageSchema = z.enum([
  "queued",
  "preparing",
  "navigating",
  "uploading",
  "configuring",
  "submitting",
  "generating",
  "downloading",
  "done",
  "failed"
]);
export type JobStage = z.infer<typeof JobStageSchema>;

export const InputFileMetaSchema = z.object({
  name: z.string(),
  mime: z.string(),
  size: z.number().optional(),
  token: z.string().optional(),
  dataUrl: z.string().optional()
});
export type InputFileMeta = z.infer<typeof InputFileMetaSchema>;

export const JobParamsSchema = z.object({
  aspectRatio: AspectRatioSchema.optional().default("16:9"),
  duration: VideoDurationSchema.optional(),
  model: z.string().optional(),
  outputsPerPrompt: z.number().int().min(1).max(4).optional().default(1),
  downloadFolder: z.string().optional().default("FlowConnect")
});
export type JobParams = {
  aspectRatio?: AspectRatio;
  duration?: VideoDuration;
  model?: string;
  outputsPerPrompt?: number;
  downloadFolder?: string;
};

export const JobSpecSchema = z.object({
  prompt: z.string().min(1),
  mode: ModeSchema,
  params: JobParamsSchema.default({}),
  inputImages: z.array(InputFileMetaSchema).default([])
});
export type JobSpec = z.infer<typeof JobSpecSchema>;
export type JobInputSpec = z.input<typeof JobSpecSchema>;

export const JobResultFileSchema = z.object({
  name: z.string(),
  path: z.string(),
  url: z.string().optional(),
  mime: z.string(),
  size: z.number().optional()
});
export type JobResultFile = z.infer<typeof JobResultFileSchema>;

export const JobRecordSchema = z.object({
  id: z.string(),
  spec: JobSpecSchema,
  stage: JobStageSchema,
  progressPct: z.number().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
  files: z.array(JobResultFileSchema).default([]),
  createdAt: z.number(),
  updatedAt: z.number()
});
export type JobRecord = z.infer<typeof JobRecordSchema>;
