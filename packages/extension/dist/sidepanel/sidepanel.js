"use strict";
(() => {
  // src/sidepanel/sidepanel.ts
  var bridgeStatusEl = document.getElementById("bridge-status");
  var tabStatusEl = document.getElementById("tab-status");
  var tabVisibilityEl = document.getElementById("tab-visibility");
  var copyBtn = document.getElementById("copy-btn");
  var testSubmitBtn = document.getElementById("test-submit");
  var testModeSelect = document.getElementById("test-mode");
  var testPromptInput = document.getElementById("test-prompt");
  var testOutputEl = document.getElementById("test-output");
  async function updateStatus() {
    chrome.runtime.sendMessage({ t: "panel.get_status" }, (res) => {
      if (chrome.runtime.lastError || !res) {
        bridgeStatusEl.textContent = "Error";
        bridgeStatusEl.className = "badge red";
        return;
      }
      if (res.bridgeConnected) {
        bridgeStatusEl.textContent = "Connected";
        bridgeStatusEl.className = "badge green";
      } else {
        bridgeStatusEl.textContent = "Disconnected";
        bridgeStatusEl.className = "badge red";
      }
      if (res.flow?.tabOpen) {
        tabStatusEl.textContent = "Open";
        tabStatusEl.className = "badge green";
        if (res.flow?.tabVisible) {
          tabVisibilityEl.textContent = "Visible";
          tabVisibilityEl.className = "badge green";
        } else {
          tabVisibilityEl.textContent = "Hidden / Background";
          tabVisibilityEl.className = "badge yellow";
        }
      } else {
        tabStatusEl.textContent = "Not Open";
        tabStatusEl.className = "badge red";
        tabVisibilityEl.textContent = "N/A";
        tabVisibilityEl.className = "badge gray";
      }
    });
  }
  copyBtn.addEventListener("click", () => {
    const code = document.getElementById("mcp-config-json")?.textContent || "";
    navigator.clipboard.writeText(code).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy Config";
      }, 2e3);
    });
  });
  testSubmitBtn.addEventListener("click", async () => {
    const mode = testModeSelect.value;
    const prompt = testPromptInput.value.trim();
    if (!prompt) return;
    testOutputEl.classList.remove("hidden");
    testOutputEl.textContent = "Submitting job to bridge...";
    try {
      const res = await fetch("http://127.0.0.1:8791/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: {
            prompt,
            mode,
            params: {
              aspectRatio: "16:9",
              downloadFolder: "FlowConnect"
            }
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        testOutputEl.textContent = `\u274C Error: ${data.error || "Failed to submit"}`;
        return;
      }
      testOutputEl.textContent = `\u23F3 Job submitted: ${data.jobId}. Generation started in Flow tab...`;
    } catch (err) {
      testOutputEl.textContent = `\u274C Bridge error: ${err.message}. Is bridge server running?`;
    }
  });
  setInterval(updateStatus, 2e3);
  updateStatus();
})();
