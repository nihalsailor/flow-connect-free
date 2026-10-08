import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BridgeClient } from "./client.js";
export declare function createMcpServer(client: BridgeClient): McpServer;
export declare function runMcpServerStdio(client: BridgeClient): Promise<void>;
