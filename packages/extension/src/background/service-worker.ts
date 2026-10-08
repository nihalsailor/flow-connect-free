// Background Service Worker for Flow Connect Free
import {
  BRIDGE_DEFAULT_PORT,
  BridgeToExtMessage,
  ExtToBridgeMessage,
  JobResultFile
} from "@flow-connect/shared";

const EXT_VERSION = "1.0.0";
const WS_URL = `ws://127.0.0.1:${BRIDGE_DEFAULT_PORT}/ws`;

let socket: WebSocket | null = null;
let currentTabId: number | null = null;
let debuggerAttached = false;
let pendingDownloads = new Map<number, { jobId: string; file: Partial<JobResultFile> }>();
let completedFiles = new Map<string, JobResultFile[]>();

console.log("[FlowConnectFree] Service worker starting (v" + EXT_VERSION + ")");

// Open side panel when action icon is clicked
if (chrome.sidePanel?.setPanelBehavior) {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
}

// Connect to local bridge WebSocket
function connectToBridge() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    socket = new WebSocket(WS_URL);

    socket.onopen = async () => {
      console.log("[FlowConnectFree] Connected to Bridge WebSocket");
      const status = await getFlowStatus();
      sendToBridge({
        t: "ext.hello",
        extVersion: EXT_VERSION,
        flowTabOpen: status.tabOpen,
        flowTabVisible: status.tabVisible,
        userLoggedIn: status.loggedIn
      });
    };

    socket.onmessage = async (e) => {
      try {
        const msg = JSON.parse(e.data.toString()) as BridgeToExtMessage;
        await handleBridgeMessage(msg);
      } catch (err) {
        console.error("[FlowConnectFree] Error parsing bridge message:", err);
      }
    };

    socket.onclose = () => {
      socket = null;
      setTimeout(connectToBridge, 3000);
    };

    socket.onerror = () => {
      socket = null;
    };
  } catch (e) {
    socket = null;
    setTimeout(connectToBridge, 3000);
  }
}

function sendToBridge(msg: ExtToBridgeMessage) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(msg));
  }
}

// Check Google Flow tab presence and visibility
async function getFlowStatus(): Promise<{ tabId: number | null; tabOpen: boolean; tabVisible: boolean; loggedIn: boolean }> {
  const tabs = await chrome.tabs.query({ url: ["*://flow.google.com/*", "*://labs.google/*"] });
  if (tabs.length === 0) {
    return { tabId: null, tabOpen: false, tabVisible: false, loggedIn: false };
  }

  const activeTab = tabs.find((t) => t.active) || tabs[0];
  const tabId = activeTab.id || null;
  const isFocused = activeTab.active;

  let loggedIn = true;
  if (tabId) {
    try {
      const resp = await chrome.tabs.sendMessage(tabId, { t: "status.check" });
      if (resp) {
        loggedIn = resp.loggedIn;
      }
    } catch {}
  }

  return {
    tabId,
    tabOpen: true,
    tabVisible: isFocused,
    loggedIn
  };
}

async function ensureContentScript(tabId: number): Promise<boolean> {
  try {
    const test = await chrome.tabs.sendMessage(tabId, { t: "status.check" });
    if (test) return true;
  } catch {}

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["result-capture.js"],
      world: "MAIN"
    }).catch(() => {});
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["flow-driver.js"]
    });
    await new Promise((r) => setTimeout(r, 400));
    return true;
  } catch (err) {
    console.error("[FlowConnectFree] Failed to inject content script:", err);
    return false;
  }
}

// Attach Chrome Debugger to tab for trusted input events
async function attachDebugger(tabId: number): Promise<boolean> {
  if (debuggerAttached && currentTabId === tabId) return true;
  try {
    if (debuggerAttached && currentTabId) {
      await chrome.debugger.detach({ tabId: currentTabId }).catch(() => {});
    }
    await chrome.debugger.attach({ tabId }, "1.3");
    debuggerAttached = true;
    currentTabId = tabId;
    console.log(`[FlowConnectFree] Debugger attached to tab ${tabId}`);
    return true;
  } catch (err) {
    console.warn("[FlowConnectFree] Debugger attach error:", err);
    return false;
  }
}

async function detachDebugger() {
  if (debuggerAttached && currentTabId) {
    try {
      await chrome.debugger.detach({ tabId: currentTabId });
    } catch {}
    debuggerAttached = false;
    currentTabId = null;
  }
}

// Handle incoming messages from Bridge
async function handleBridgeMessage(msg: BridgeToExtMessage) {
  switch (msg.t) {
    case "bridge.hello":
      console.log(`[FlowConnectFree] Bridge hello received (v${msg.bridgeVersion})`);
      break;

    case "status.query": {
      const status = await getFlowStatus();
      sendToBridge({
        t: "ext.status",
        flowTabOpen: status.tabOpen,
        flowTabVisible: status.tabVisible,
        userLoggedIn: status.loggedIn,
        activeJobs: 0
      });
      break;
    }

    case "job.submit": {
      console.log(`[FlowConnectFree] Received job submit: ${msg.jobId}`);
      const status = await getFlowStatus();
      if (!status.tabOpen || !status.tabId) {
        sendToBridge({
          t: "job.failed",
          jobId: msg.jobId,
          reason: "flow.google.com tab is not open. Please open flow.google.com in Chrome."
        });
        return;
      }

      await chrome.tabs.update(status.tabId, { active: true }).catch(() => {});
      await attachDebugger(status.tabId);
      sendToBridge({ t: "job.accepted", jobId: msg.jobId });

      completedFiles.set(msg.jobId, []);

      // Ensure content script is running
      await ensureContentScript(status.tabId);

      // Send execution instructions to content script
      chrome.tabs.sendMessage(
        status.tabId,
        {
          t: "job.execute",
          jobId: msg.jobId,
          job: msg.job,
          inputFiles: msg.inputFiles
        },
        (resp) => {
          if (chrome.runtime.lastError) {
            sendToBridge({
              t: "job.failed",
              jobId: msg.jobId,
              reason: "Could not communicate with Flow page: " + chrome.runtime.lastError.message
            });
            detachDebugger();
          }
        }
      );
      break;
    }

    case "job.cancel": {
      await detachDebugger();
      break;
    }

    case "ext.reload": {
      console.log("[FlowConnectFree] Reloading extension at bridge request");
      chrome.runtime.reload();
      break;
    }
  }
}

// Handle messages from content script & side panel
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req?.t === "click.trusted") {
    const tabId = sender.tab?.id || currentTabId;
    if (tabId && debuggerAttached) {
      chrome.debugger
        .sendCommand({ tabId }, "Input.dispatchMouseEvent", {
          type: "mousePressed",
          x: req.x,
          y: req.y,
          button: "left",
          clickCount: 1
        })
        .then(() =>
          chrome.debugger.sendCommand({ tabId }, "Input.dispatchMouseEvent", {
            type: "mouseReleased",
            x: req.x,
            y: req.y,
            button: "left",
            clickCount: 1
          })
        )
        .then(() => sendResponse({ ok: true }))
        .catch(() => sendResponse({ ok: false }));
      return true;
    }
    sendResponse({ ok: false });
    return true;
  }

  if (req?.t === "job.progress") {
    sendToBridge({
      t: "job.progress",
      jobId: req.jobId,
      stage: req.stage,
      pct: req.pct,
      message: req.message
    });
    return;
  }

  if (req?.t === "job.failed") {
    sendToBridge({
      t: "job.failed",
      jobId: req.jobId,
      reason: req.reason,
      retryable: req.retryable || false
    });
    detachDebugger();
    return;
  }

  if (req?.t === "job.media_ready") {
    const { jobId, urls, folder } = req;
    sendToBridge({
      t: "job.progress",
      jobId,
      stage: "downloading",
      message: `Downloading ${urls.length} media file(s)`
    });

    handleMediaDownloads(jobId, urls, folder);
    return;
  }

  if (req?.t === "panel.get_status") {
    getFlowStatus().then((flow) => {
      sendResponse({
        bridgeConnected: socket !== null && socket.readyState === WebSocket.OPEN,
        flow
      });
    });
    return true;
  }
});

// Download media files and track their filesystem paths
async function handleMediaDownloads(jobId: string, urls: string[], folder: string) {
  const downloadedFiles: JobResultFile[] = [];

  for (let i = 0; i < urls.length; i++) {
    const rawUrl = urls[i];
    const cleanUrl = rawUrl
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
      .replace(/\\/g, "");

    const isVideo = cleanUrl.includes(".mp4") || cleanUrl.includes("/video/");
    const ext = isVideo ? "mp4" : "png";
    const filename = `${folder}/flow_${Date.now()}_${i + 1}.${ext}`;

    try {
      const downloadId = await chrome.downloads.download({
        url: cleanUrl,
        filename,
        conflictAction: "uniquify"
      });

      // Poll download completion
      const filePath = await waitForDownload(downloadId);
      downloadedFiles.push({
        name: filename.split("/").pop() || `flow_output.${ext}`,
        path: filePath,
        url: cleanUrl,
        mime: isVideo ? "video/mp4" : "image/png"
      });
    } catch (err) {
      console.error("[FlowConnectFree] Download failed for url:", cleanUrl, err);
    }
  }

  detachDebugger();

  if (downloadedFiles.length > 0) {
    sendToBridge({
      t: "job.result",
      jobId,
      files: downloadedFiles
    });
  } else {
    sendToBridge({
      t: "job.failed",
      jobId,
      reason: "Failed to download generated media"
    });
  }
}

function waitForDownload(downloadId: number, timeoutMs = 60000): Promise<string> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const interval = setInterval(async () => {
      const [item] = await chrome.downloads.search({ id: downloadId });
      if (item && item.state === "complete") {
        clearInterval(interval);
        resolve(item.filename);
      } else if (item && item.state === "interrupted") {
        clearInterval(interval);
        resolve("");
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        resolve("");
      }
    }, 500);
  });
}

// Periodic reconnect & status broadcast alarm
chrome.alarms.create("flow-keepalive", { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "flow-keepalive") {
    connectToBridge();
    sendToBridge({ t: "ext.heartbeat" });
  }
});

connectToBridge();
