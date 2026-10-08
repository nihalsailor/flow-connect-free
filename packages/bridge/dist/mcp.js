import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { resolve } from "path";
import { AspectRatioSchema, ImageModelSchema, VideoDurationSchema, VideoModelSchema } from "@flow-connect/shared";
export function createMcpServer(client) {
    const server = new McpServer({
        name: "flow-connect-free",
        version: "1.0.0"
    });
    const formatJobResult = (job) => {
        if (job.stage === "failed") {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Generation failed: ${job.error || "Unknown error"}\nJob ID: ${job.id}`
                    }
                ],
                isError: true
            };
        }
        if (job.stage === "done") {
            const fileList = job.files.map((f) => `- ${f.name} (${f.path || f.url})`).join("\n");
            return {
                content: [
                    {
                        type: "text",
                        text: `✅ Generation complete!\nJob ID: ${job.id}\nFiles generated (${job.files.length}):\n${fileList}`
                    }
                ]
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `⏳ Job is ${job.stage} (Progress: ${job.progressPct || 0}%). Call flow_get_job with id "${job.id}" to check status.`
                }
            ]
        };
    };
    // Tool 1: flow_status
    server.tool("flow_status", "Check Google Flow connection: is the bridge server running, is the Chrome extension connected, and is flow.google.com open and visible?", {}, async () => {
        const status = await client.getStatus();
        if (!status) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ Local bridge server is not responding. Run 'flow-free start' or ensure the bridge daemon is running."
                    }
                ]
            };
        }
        const extStatus = status.extensionConnected
            ? "🟢 Connected"
            : "🔴 Disconnected (Make sure Chrome is running with Flow Connect Free extension installed)";
        const tabStatus = status.flowTabOpen
            ? status.flowTabVisible
                ? "🟢 Open & Visible on screen"
                : "🟡 Open but HIDDEN/MINIMIZED (Flow will stall; bring window to front!)"
            : "🔴 Flow tab not open (Navigate to https://flow.google.com in Chrome)";
        const authStatus = status.userLoggedIn ? "🟢 Logged in" : "🔴 Not logged in to Google account";
        return {
            content: [
                {
                    type: "text",
                    text: `### Flow Connect Status\n- **Extension:** ${extStatus}\n- **Flow Tab:** ${tabStatus}\n- **Google Account:** ${authStatus}\n- **Active Jobs:** ${status.activeJobs}`
                }
            ]
        };
    });
    // Tool 2: flow_text_to_image
    server.tool("flow_text_to_image", "Generate images on Google Flow using Nano Banana Pro/2/Lite models for free via your logged-in Google session.", {
        prompt: z.string().describe("Detailed visual description of the image to generate"),
        aspect_ratio: AspectRatioSchema.default("16:9").describe("Aspect ratio: 16:9, 9:16, 1:1, 4:3, 3:4, 2:3, 3:2"),
        model: ImageModelSchema.default("nano-banana-pro").describe("Nano Banana model: nano-banana-pro, nano-banana-2, nano-banana-2-lite"),
        outputs: z.number().int().min(1).max(4).default(1).describe("Number of output images (1-4)"),
        folder: z.string().default("FlowConnect").describe("Subfolder name inside Downloads")
    }, async (args) => {
        const jobId = await client.submitJob({
            mode: "flow-text-to-image",
            prompt: args.prompt,
            params: {
                aspectRatio: args.aspect_ratio,
                model: args.model,
                outputsPerPrompt: args.outputs,
                downloadFolder: args.folder
            },
            inputImages: []
        });
        const result = await client.waitForJob(jobId, 180000);
        return formatJobResult(result);
    });
    // Tool 3: flow_image_to_image
    server.tool("flow_image_to_image", "Generate an image variation on Google Flow guided by an input reference image and a prompt.", {
        prompt: z.string().describe("Instructions for modifying the reference image"),
        image_paths: z.array(z.string()).min(1).describe("Absolute local paths to reference images"),
        aspect_ratio: AspectRatioSchema.default("16:9").describe("Aspect ratio: 16:9, 9:16, 1:1, 4:3, 3:4, 2:3, 3:2"),
        model: ImageModelSchema.default("nano-banana-pro").describe("Model"),
        outputs: z.number().int().min(1).max(4).default(1).describe("Number of output images (1-4)"),
        folder: z.string().default("FlowConnect").describe("Subfolder name inside Downloads")
    }, async (args) => {
        const resolvedPaths = args.image_paths.map((p) => resolve(p));
        const jobId = await client.submitJob({
            mode: "flow-image-to-image",
            prompt: args.prompt,
            params: {
                aspectRatio: args.aspect_ratio,
                model: args.model,
                outputsPerPrompt: args.outputs,
                downloadFolder: args.folder
            },
            inputImages: []
        }, resolvedPaths);
        const result = await client.waitForJob(jobId, 240000);
        return formatJobResult(result);
    });
    // Tool 4: flow_text_to_video
    server.tool("flow_text_to_video", "Generate videos on Google Flow using Google Veo 3.1 or Omni Flash models for free.", {
        prompt: z.string().describe("Scene action and camera movement description"),
        duration: VideoDurationSchema.default("6s").describe("Video length: 4s, 6s, 8s, 10s"),
        aspect_ratio: z.enum(["16:9", "9:16"]).default("16:9").describe("Aspect ratio: 16:9 or 9:16"),
        model: VideoModelSchema.default("veo-3.1-fast").describe("Video model: veo-3.1-fast, veo-3.1-lite, veo-3.1-quality, omni-flash"),
        outputs: z.number().int().min(1).max(4).default(1).describe("Number of video variations (1-4)"),
        folder: z.string().default("FlowConnect").describe("Subfolder name inside Downloads")
    }, async (args) => {
        const jobId = await client.submitJob({
            mode: "flow-text-to-video",
            prompt: args.prompt,
            params: {
                aspectRatio: args.aspect_ratio,
                duration: args.duration,
                model: args.model,
                outputsPerPrompt: args.outputs,
                downloadFolder: args.folder
            },
            inputImages: []
        });
        const result = await client.waitForJob(jobId, 360000);
        return formatJobResult(result);
    });
    // Tool 5: flow_frame_to_video
    server.tool("flow_frame_to_video", "Generate a video transitioning from a start frame to an end frame on Google Flow.", {
        prompt: z.string().describe("Description of motion between the frames"),
        image_paths: z.array(z.string()).min(1).max(2).describe("Array containing 1 image (start frame) or 2 images (start and end frames)"),
        duration: VideoDurationSchema.default("6s").describe("Video length: 4s, 6s, 8s, 10s"),
        aspect_ratio: z.enum(["16:9", "9:16"]).default("16:9").describe("Aspect ratio: 16:9 or 9:16"),
        model: VideoModelSchema.default("veo-3.1-fast").describe("Video model"),
        folder: z.string().default("FlowConnect").describe("Subfolder name inside Downloads")
    }, async (args) => {
        const resolvedPaths = args.image_paths.map((p) => resolve(p));
        const jobId = await client.submitJob({
            mode: "flow-frame-to-video",
            prompt: args.prompt,
            params: {
                aspectRatio: args.aspect_ratio,
                duration: args.duration,
                model: args.model,
                downloadFolder: args.folder
            },
            inputImages: []
        }, resolvedPaths);
        const result = await client.waitForJob(jobId, 360000);
        return formatJobResult(result);
    });
    // Tool 6: flow_ingredients_to_video
    server.tool("flow_ingredients_to_video", "Generate a video using multiple reference images (characters, props, style ingredients) on Google Flow.", {
        prompt: z.string().describe("Scene prompt describing how characters and elements interact"),
        image_paths: z.array(z.string()).min(1).max(7).describe("Reference images for ingredients"),
        duration: VideoDurationSchema.default("6s").describe("Video length: 4s, 6s, 8s, 10s"),
        aspect_ratio: z.enum(["16:9", "9:16"]).default("16:9").describe("Aspect ratio: 16:9 or 9:16"),
        model: VideoModelSchema.default("omni-flash").describe("Video model (omni-flash supports up to 7 ingredients)"),
        folder: z.string().default("FlowConnect").describe("Subfolder name inside Downloads")
    }, async (args) => {
        const resolvedPaths = args.image_paths.map((p) => resolve(p));
        const jobId = await client.submitJob({
            mode: "flow-ingredients-to-video",
            prompt: args.prompt,
            params: {
                aspectRatio: args.aspect_ratio,
                duration: args.duration,
                model: args.model,
                downloadFolder: args.folder
            },
            inputImages: []
        }, resolvedPaths);
        const result = await client.waitForJob(jobId, 360000);
        return formatJobResult(result);
    });
    // Tool 7: flow_extend_video
    server.tool("flow_extend_video", "Extend the video clip currently open in Google Flow's scene editor.", {
        prompt: z.string().describe("What happens next in the extended clip"),
        folder: z.string().default("FlowConnect").describe("Subfolder name inside Downloads")
    }, async (args) => {
        const jobId = await client.submitJob({
            mode: "flow-extend-video",
            prompt: args.prompt,
            params: {
                downloadFolder: args.folder
            },
            inputImages: []
        });
        const result = await client.waitForJob(jobId, 360000);
        return formatJobResult(result);
    });
    // Tool 8: flow_list_jobs
    server.tool("flow_list_jobs", "List generation jobs with their statuses and downloaded file paths.", {}, async () => {
        const jobs = await client.listJobs();
        if (jobs.length === 0) {
            return {
                content: [{ type: "text", text: "No generation jobs recorded." }]
            };
        }
        const summary = jobs
            .slice(0, 15)
            .map((j) => `- [${j.id.slice(0, 8)}] ${j.spec.mode} | Stage: ${j.stage} | Files: ${j.files.length} | Prompt: "${j.spec.prompt.slice(0, 50)}..."`)
            .join("\n");
        return {
            content: [{ type: "text", text: `### Recent Generation Jobs\n${summary}` }]
        };
    });
    // Tool 9: flow_get_job
    server.tool("flow_get_job", "Get details or check progress of a specific generation job by its job ID.", {
        job_id: z.string().describe("The job ID to check")
    }, async (args) => {
        const job = await client.getJob(args.job_id);
        return formatJobResult(job);
    });
    return server;
}
export async function runMcpServerStdio(client) {
    const server = createMcpServer(client);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[FlowConnect MCP] MCP Server running on stdio transport");
}
