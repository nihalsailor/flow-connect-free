import { z } from "zod";
import {
  InputFileMetaSchema,
  JobParamsSchema,
  JobResultFileSchema,
  JobSpecSchema,
  JobStageSchema
} from "./types.js";

export const BRIDGE_DEFAULT_PORT = 8791;
export const BRIDGE_HOST = "127.0.0.1";

// Messages sent from Extension to Bridge
export const ExtToBridgeSchema = z.discriminatedUnion("t", [
  z.object({
    t: z.literal("ext.hello"),
    extVersion: z.string(),
    flowTabOpen: z.boolean(),
    flowTabVisible: z.boolean(),
    userLoggedIn: z.boolean()
  }),
  z.object({
    t: z.literal("ext.heartbeat")
  }),
  z.object({
    t: z.literal("ext.status"),
    flowTabOpen: z.boolean(),
    flowTabVisible: z.boolean(),
    userLoggedIn: z.boolean(),
    activeJobs: z.number(),
    currentJobId: z.string().optional()
  }),
  z.object({
    t: z.literal("job.accepted"),
    jobId: z.string()
  }),
  z.object({
    t: z.literal("job.progress"),
    jobId: z.string(),
    stage: JobStageSchema,
    pct: z.number().optional(),
    message: z.string().optional()
  }),
  z.object({
    t: z.literal("job.result"),
    jobId: z.string(),
    files: z.array(JobResultFileSchema),
    warning: z.string().optional()
  }),
  z.object({
    t: z.literal("job.failed"),
    jobId: z.string(),
    reason: z.string(),
    retryable: z.boolean().default(false)
  })
]);
export type ExtToBridgeMessage = z.infer<typeof ExtToBridgeSchema>;

// Messages sent from Bridge to Extension
export const BridgeToExtSchema = z.discriminatedUnion("t", [
  z.object({
    t: z.literal("bridge.hello"),
    bridgeVersion: z.string()
  }),
  z.object({
    t: z.literal("job.submit"),
    jobId: z.string(),
    job: JobSpecSchema,
    inputFiles: z.array(InputFileMetaSchema).default([])
  }),
  z.object({
    t: z.literal("job.cancel"),
    jobId: z.string()
  }),
  z.object({
    t: z.literal("status.query")
  }),
  z.object({
    t: z.literal("ext.reload")
  })
]);
export type BridgeToExtMessage = z.infer<typeof BridgeToExtSchema>;

export const BridgeStatusSchema = z.object({
  bridge: z.literal("up"),
  bridgeVersion: z.string(),
  extensionConnected: z.boolean(),
  extensionVersion: z.string().optional(),
  flowTabOpen: z.boolean().nullable(),
  flowTabVisible: z.boolean().nullable(),
  userLoggedIn: z.boolean().nullable(),
  activeJobs: z.number()
});
export type BridgeStatus = z.infer<typeof BridgeStatusSchema>;
