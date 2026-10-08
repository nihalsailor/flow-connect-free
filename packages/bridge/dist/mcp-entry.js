#!/usr/bin/env node
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { BridgeClient } from "./client.js";
import { runMcpServerStdio } from "./mcp.js";
const client = new BridgeClient();
// Ensure the local bridge daemon is running (auto-start if needed)
try {
    const isUp = await client.isRunning();
    if (!isUp) {
        const currentDir = dirname(fileURLToPath(import.meta.url));
        const cliPath = resolve(currentDir, "cli.js");
        await client.ensureBridge(cliPath);
    }
}
catch (e) {
    console.error("[FlowConnect MCP] Bridge status warning:", e);
}
await runMcpServerStdio(client);
