#!/usr/bin/env node
import { Command } from "commander";
import { BridgeServer } from "./server.js";
import { BridgeClient } from "./client.js";
import { runMcpServerStdio } from "./mcp.js";
import { ModeSchema } from "@flow-connect/shared";
const program = new Command();
const client = new BridgeClient();
program
    .name("flow-free")
    .description("Free, open-source Google Flow bridge and MCP integration")
    .version("1.0.0");
program
    .command("start")
    .description("Start the local Bridge server on 127.0.0.1:8791")
    .option("-p, --port <port>", "Port to listen on", "8791")
    .action(async (opts) => {
    const port = parseInt(opts.port, 10);
    const server = new BridgeServer(port);
    await server.start();
    console.log(`[FlowConnect] Bridge running. Keep this terminal open, or run in background.`);
});
program
    .command("status")
    .description("Check connection status of the bridge, Chrome extension, and Google Flow tab")
    .action(async () => {
    const status = await client.getStatus();
    if (!status) {
        console.log("\n❌ Bridge server is NOT running.");
        console.log("   Start it with: flow-free start\n");
        process.exit(1);
    }
    console.log("\n=== Flow Connect Status ===");
    console.log(`Bridge:              🟢 ${status.bridge} (v${status.bridgeVersion})`);
    console.log(`Chrome Extension:    ${status.extensionConnected
        ? `🟢 Connected (v${status.extensionVersion || "1.0"})`
        : "🔴 Disconnected"}`);
    console.log(`Google Flow Tab:     ${status.flowTabOpen
        ? status.flowTabVisible
            ? "🟢 Open and visible"
            : "🟡 Open, but HIDDEN/MINIMIZED (will stall!)"
        : "🔴 Not open (open https://flow.google.com in Chrome)"}`);
    console.log(`Google Sign-in:      ${status.userLoggedIn ? "🟢 Logged in" : "🔴 Not signed in"}`);
    console.log(`Active Jobs:         ${status.activeJobs}\n`);
});
program
    .command("generate <mode>")
    .description("Generate media on Google Flow")
    .requiredOption("-p, --prompt <prompt>", "Generation prompt")
    .option("-i, --image <paths...>", "Input image paths (for image-to-image or video references)")
    .option("-a, --aspect-ratio <ratio>", "Aspect ratio (16:9, 9:16, 1:1, etc.)", "16:9")
    .option("-m, --model <model>", "Model name (nano-banana-pro, veo-3.1-fast, etc.)")
    .option("-d, --duration <duration>", "Video duration (4s, 6s, 8s, 10s)", "6s")
    .option("-o, --outputs <count>", "Number of outputs (1-4)", "1")
    .option("--folder <folder>", "Download subfolder", "FlowConnect")
    .option("-w, --wait", "Wait for generation to complete and print downloaded files", true)
    .action(async (mode, opts) => {
    const parsedMode = ModeSchema.safeParse(mode);
    if (!parsedMode.success) {
        console.error(`Invalid mode "${mode}". Supported modes: ${ModeSchema.options.join(", ")}`);
        process.exit(1);
    }
    console.log(`Submitting ${mode} job: "${opts.prompt}"...`);
    try {
        const jobId = await client.submitJob({
            mode: parsedMode.data,
            prompt: opts.prompt,
            params: {
                aspectRatio: opts.aspectRatio,
                duration: opts.duration,
                model: opts.model,
                outputsPerPrompt: parseInt(opts.outputs, 10),
                downloadFolder: opts.folder
            },
            inputImages: []
        }, opts.image || []);
        console.log(`Job queued with ID: ${jobId}`);
        if (opts.wait) {
            console.log("Waiting for generation in Google Flow...");
            const result = await client.waitForJob(jobId, 360000);
            if (result.stage === "failed") {
                console.error(`❌ Generation failed: ${result.error}`);
                process.exit(1);
            }
            else {
                console.log(`✅ Done! Downloaded ${result.files.length} file(s):`);
                for (const f of result.files) {
                    console.log(`   - ${f.name} (${f.path || f.url})`);
                }
            }
        }
    }
    catch (e) {
        console.error(`Error: ${e.message}`);
        process.exit(1);
    }
});
program
    .command("mcp")
    .description("Run the Model Context Protocol (MCP) server over stdio")
    .action(async () => {
    await runMcpServerStdio(client);
});
program.parse(process.argv);
