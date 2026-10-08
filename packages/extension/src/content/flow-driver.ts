import { SELECTORS, findElement } from "./selectors.js";
import { JobSpec } from "@flow-connect/shared";

console.log("[FlowConnectFree] Content driver loaded on flow.google.com");

let capturedMediaUrls: string[] = [];

// Listen for network capture events from result-capture.ts (MAIN world)
window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data?.__flowNet) return;
  if (event.data.kind === "media-ready" && event.data.url) {
    console.log("[FlowConnectFree] Captured media URL:", event.data.url);
    if (!capturedMediaUrls.includes(event.data.url)) {
      capturedMediaUrls.push(event.data.url);
    }
  }
});

// Helper to request trusted click from service worker (via CDP)
async function clickTrusted(element: HTMLElement): Promise<void> {
  const rect = element.getBoundingClientRect();
  const x = Math.round(rect.left + rect.width / 2);
  const y = Math.round(rect.top + rect.height / 2);

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ t: "click.trusted", x, y }, (response) => {
      if (chrome.runtime.lastError) {
        // Fallback to normal DOM click if debugger isn't attached
        element.click();
        resolve();
      } else {
        resolve();
      }
    });
  });
}

// Check page status (logged in, ready)
function checkPageStatus() {
  const loginBtn = findElement(SELECTORS.loginIndicator);
  const promptBox = findElement(SELECTORS.promptInput);
  return {
    loggedIn: !loginBtn,
    ready: !!promptBox,
    visible: document.visibilityState === "visible"
  };
}

// Fill prompt input text
async function setPromptText(text: string): Promise<boolean> {
  const input = findElement(SELECTORS.promptInput);
  if (!input) return false;

  input.focus();
  if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    input.textContent = text;
    input.dispatchEvent(new InputEvent("input", { bubbles: true, data: text }));
  }
  return true;
}

// Select mode tab (Image, Video, Frames, Ingredients)
async function selectModeTab(mode: string): Promise<void> {
  let targetTab: HTMLElement | null = null;
  if (mode === "flow-text-to-image" || mode === "flow-image-to-image") {
    targetTab = findElement(SELECTORS.tabImage);
  } else if (mode === "flow-text-to-video") {
    targetTab = findElement(SELECTORS.tabVideo);
  } else if (mode === "flow-frame-to-video") {
    targetTab = findElement(SELECTORS.tabFrames);
  } else if (mode === "flow-ingredients-to-video") {
    targetTab = findElement(SELECTORS.tabIngredients);
  }

  if (targetTab) {
    await clickTrusted(targetTab);
    await new Promise((r) => setTimeout(r, 400));
  }
}

// Select aspect ratio
async function selectAspectRatio(ratio?: string): Promise<void> {
  if (!ratio) return;
  const buttons = document.querySelectorAll<HTMLElement>('flow-toggles button, [role="radiogroup"] button');
  for (const btn of Array.from(buttons)) {
    if ((btn.textContent || "").trim() === ratio) {
      await clickTrusted(btn);
      break;
    }
  }
}

// Select duration (for video)
async function selectDuration(duration?: string): Promise<void> {
  if (!duration) return;
  const durClean = duration.toLowerCase();
  const buttons = document.querySelectorAll<HTMLElement>('flow-toggles button, [role="radiogroup"] button');
  for (const btn of Array.from(buttons)) {
    if ((btn.textContent || "").trim().toLowerCase() === durClean) {
      await clickTrusted(btn);
      break;
    }
  }
}

// Convert dataURL to File and inject into parked file input
async function injectFiles(files: Array<{ name: string; mime: string; dataUrl?: string }>) {
  if (!files || files.length === 0) return;

  // Arm file upload in MAIN world
  window.postMessage({ __flowUpload: "arm" }, window.location.origin);
  await new Promise((r) => setTimeout(r, 200));

  const attachBtn = findElement(SELECTORS.attachButton);
  if (attachBtn) {
    await clickTrusted(attachBtn);
    await new Promise((r) => setTimeout(r, 500));
  }

  const parkedInput = document.querySelector<HTMLInputElement>("input[data-flow-parked]");
  if (parkedInput) {
    const dataTransfer = new DataTransfer();
    for (const f of files) {
      if (f.dataUrl) {
        const res = await fetch(f.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], f.name, { type: f.mime });
        dataTransfer.items.add(file);
      }
    }
    parkedInput.files = dataTransfer.files;
    parkedInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  window.postMessage({ __flowUpload: "disarm" }, window.location.origin);
}

// Main execution routine
async function executeJob(jobId: string, spec: JobSpec, inputFiles: any[]) {
  console.log(`[FlowConnectFree] Starting execution for job ${jobId}`);
  capturedMediaUrls = [];

  chrome.runtime.sendMessage({ t: "job.progress", jobId, stage: "configuring", message: "Setting mode and parameters" });

  await selectModeTab(spec.mode);
  await selectAspectRatio(spec.params.aspectRatio);
  if (spec.params.duration) {
    await selectDuration(spec.params.duration);
  }

  if (inputFiles && inputFiles.length > 0) {
    chrome.runtime.sendMessage({ t: "job.progress", jobId, stage: "uploading", message: "Uploading reference media" });
    await injectFiles(inputFiles);
    await new Promise((r) => setTimeout(r, 1000));
  }

  let promptEl = findElement(SELECTORS.promptInput);
  if (!promptEl) {
    const newProjBtn = findElement(SELECTORS.newProjectButton);
    if (newProjBtn) {
      chrome.runtime.sendMessage({ t: "job.progress", jobId, stage: "navigating", message: "Opening new project in Flow" });
      await clickTrusted(newProjBtn);
      await new Promise((r) => setTimeout(r, 2500));
    }
  }

  chrome.runtime.sendMessage({ t: "job.progress", jobId, stage: "submitting", message: "Entering prompt" });
  const filled = await setPromptText(spec.prompt);
  if (!filled) {
    chrome.runtime.sendMessage({ t: "job.failed", jobId, reason: "Could not find Google Flow prompt input box" });
    return;
  }

  await new Promise((r) => setTimeout(r, 500));

  const submitBtn = findElement(SELECTORS.submitButton);
  if (!submitBtn) {
    chrome.runtime.sendMessage({ t: "job.failed", jobId, reason: "Could not find Generate button" });
    return;
  }

  // Gather baseline URLs already on the page before submit
  const baselineUrls = new Set<string>();
  document.querySelectorAll<HTMLImageElement | HTMLVideoElement>("img, video, source").forEach((el) => {
    const src = (el as HTMLImageElement).src || (el as HTMLVideoElement).currentSrc;
    if (src) baselineUrls.add(src);
  });

  capturedMediaUrls = [];

  chrome.runtime.sendMessage({ t: "job.progress", jobId, stage: "generating", message: "Generating media on Google Flow" });
  await clickTrusted(submitBtn);

  // Wait a minimum of 4 seconds so Flow receives the submit and begins processing
  await new Promise((r) => setTimeout(r, 4000));

  const startTime = Date.now();
  const timeoutMs = spec.mode.includes("video") ? 300000 : 120000;

  while (Date.now() - startTime < timeoutMs) {
    await new Promise((r) => setTimeout(r, 1500));

    // Filter captured URLs to only those that were NOT already present
    const newCaptured = capturedMediaUrls.filter((u) => !baselineUrls.has(u));
    if (newCaptured.length > 0) {
      console.log(`[FlowConnectFree] Generation finished with ${newCaptured.length} new media item(s)`);
      chrome.runtime.sendMessage({
        t: "job.media_ready",
        jobId,
        urls: newCaptured,
        folder: spec.params.downloadFolder || "FlowConnect"
      });
      return;
    }

    // Secondary DOM check for NEW elements
    const mediaEls = document.querySelectorAll<HTMLImageElement | HTMLVideoElement>(
      spec.mode.includes("video")
        ? "flow-video-tile img, video[src], flow-video-tile video"
        : "flow-image-tile img, img[data-media-id], img[src*='flow-content']"
    );
    const newDomUrls: string[] = [];
    for (const el of Array.from(mediaEls)) {
      const src = (el as HTMLImageElement).src || (el as HTMLVideoElement).currentSrc;
      if (src && !src.startsWith("data:") && !baselineUrls.has(src)) {
        newDomUrls.push(src);
      }
    }

    if (newDomUrls.length > 0) {
      console.log(`[FlowConnectFree] Found ${newDomUrls.length} new media element(s) in DOM`);
      chrome.runtime.sendMessage({
        t: "job.media_ready",
        jobId,
        urls: newDomUrls,
        folder: spec.params.downloadFolder || "FlowConnect"
      });
      return;
    }
  }

  chrome.runtime.sendMessage({ t: "job.failed", jobId, reason: "Timed out waiting for generation result" });
}

// Listen for messages from background service worker
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.t === "status.check") {
    sendResponse(checkPageStatus());
    return true;
  }

  if (msg?.t === "job.execute") {
    executeJob(msg.jobId, msg.job, msg.inputFiles);
    sendResponse({ ok: true });
    return true;
  }
});
