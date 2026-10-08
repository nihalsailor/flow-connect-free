import * as esbuild from "esbuild";
import { cpSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "dist");

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

const buildOptions = [
  // Background service worker
  {
    entryPoints: [resolve(__dirname, "src/background/service-worker.ts")],
    outfile: resolve(distDir, "service-worker.js"),
    bundle: true,
    format: "esm",
    target: "es2022"
  },
  // MAIN world result-capture script
  {
    entryPoints: [resolve(__dirname, "src/content/result-capture.ts")],
    outfile: resolve(distDir, "result-capture.js"),
    bundle: true,
    format: "iife",
    target: "es2022"
  },
  // ISOLATED world content script
  {
    entryPoints: [resolve(__dirname, "src/content/flow-driver.ts")],
    outfile: resolve(distDir, "flow-driver.js"),
    bundle: true,
    format: "iife",
    target: "es2022"
  },
  // Sidepanel script
  {
    entryPoints: [resolve(__dirname, "src/sidepanel/sidepanel.ts")],
    outfile: resolve(distDir, "sidepanel/sidepanel.js"),
    bundle: true,
    format: "iife",
    target: "es2022"
  }
];

async function runBuild() {
  console.log("[Build Extension] Building with esbuild...");
  for (const opt of buildOptions) {
    await esbuild.build(opt);
  }

  // Copy static assets
  cpSync(resolve(__dirname, "src/manifest.json"), resolve(distDir, "manifest.json"));
  cpSync(resolve(__dirname, "src/sidepanel/index.html"), resolve(distDir, "sidepanel/index.html"));
  cpSync(resolve(__dirname, "src/sidepanel/style.css"), resolve(distDir, "sidepanel/style.css"));
  cpSync(resolve(__dirname, "src/icons"), resolve(distDir, "icons"), { recursive: true });

  console.log("[Build Extension] Build completed successfully to", distDir);
}

runBuild().catch((err) => {
  console.error("[Build Extension] Error:", err);
  process.exit(1);
});
