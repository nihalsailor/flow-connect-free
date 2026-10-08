"use strict";
(() => {
  // src/content/selectors.ts
  var SELECTORS = {
    promptInput: [
      { kind: "css", css: 'textarea[placeholder*="want to create" i]' },
      { kind: "css", css: 'div[contenteditable="true"][role="textbox"]' },
      { kind: "css", css: 'div[contenteditable="true"]' },
      { kind: "css", css: "textarea" }
    ],
    submitButton: [
      { kind: "text", text: "arrow_forward.*create", role: "button" },
      { kind: "aria", label: "generate", tag: "button" },
      { kind: "aria", label: "submit", tag: "button" },
      { kind: "aria", label: "send", tag: "button" },
      { kind: "css", css: 'button[type="submit"]' },
      { kind: "text", text: "create", role: "button" }
    ],
    tabImage: [
      { kind: "text", text: "^image\\s*image$", role: "radio" },
      { kind: "text", text: "^image\\s*image$", role: "tab" },
      { kind: "text", text: "^image$", role: "radio" },
      { kind: "text", text: "^image$", role: "tab" }
    ],
    tabVideo: [
      { kind: "text", text: "^videocam\\s*video$", role: "radio" },
      { kind: "text", text: "^videocam\\s*video$", role: "tab" },
      { kind: "text", text: "^video$", role: "radio" },
      { kind: "text", text: "^video$", role: "tab" }
    ],
    tabFrames: [
      { kind: "text", text: "^crop_free\\s*frames$", role: "radio" },
      { kind: "text", text: "^crop_free\\s*frames$", role: "tab" },
      { kind: "text", text: "^frames$", role: "tab" }
    ],
    tabIngredients: [
      { kind: "text", text: "^chrome_extension\\s*ingredients$", role: "radio" },
      { kind: "text", text: "^chrome_extension\\s*ingredients$", role: "tab" },
      { kind: "text", text: "^ingredients$", role: "tab" }
    ],
    aspectRatioChip: [
      { kind: "css", css: '[role="radiogroup"] button' },
      { kind: "css", css: "flow-toggles button" }
    ],
    durationChip: [
      { kind: "css", css: '[role="radiogroup"] button' },
      { kind: "css", css: "flow-toggles button" }
    ],
    modelPill: [
      { kind: "text", text: "arrow_drop_down$", role: "button" },
      { kind: "aria", label: "model" },
      { kind: "css", css: "button.model-selector" }
    ],
    attachButton: [
      { kind: "css", css: 'button[aria-label="Add ingredients to the prompt box"]' },
      { kind: "css", css: 'button[aria-label="Add media menu"]' },
      { kind: "css", css: 'button[aria-haspopup="dialog"]' },
      { kind: "text", text: "add_2.*create", role: "button" }
    ],
    parkedFileInput: [
      { kind: "css", css: "input[data-flow-parked]", hidden: true }
    ],
    resultImage: [
      { kind: "css", css: "flow-image-tile img[data-media-id]" },
      { kind: "css", css: "img[data-media-id][src*='flow-content.google']" },
      { kind: "css", css: "img[src*='media.getMediaUrlRedirect']" },
      { kind: "css", css: "img[src*='/generated/']" },
      { kind: "css", css: 'div[role="listitem"] img' }
    ],
    resultVideo: [
      { kind: "css", css: "flow-video-tile img.thumbnail" },
      { kind: "css", css: "flow-video-tile img" },
      { kind: "css", css: "video[src*='flow-content.google']", hidden: true },
      { kind: "css", css: "video[src*='media.getMediaUrlRedirect']", hidden: true },
      { kind: "css", css: "video[src]", hidden: true }
    ],
    progressIndicator: [
      { kind: "css", css: "div.animate-spin" },
      { kind: "css", css: "[class*='progress'], [role='progressbar']" },
      { kind: "css", css: "[class*='shimmer'], [class*='skeleton'], [class*='animate-pulse']" },
      { kind: "text", text: "(generating|creating)(\\.\\.\\.|\u2026|\\s*\\d+%)" }
    ],
    loginIndicator: [
      { kind: "text", text: "sign in|log in", role: "button" },
      { kind: "css", css: "a[href*='accounts.google.com/ServiceLogin'], a[href*='accounts.google.com/signin']" }
    ],
    newProjectButton: [
      { kind: "css", css: "button.new-project-button" },
      { kind: "text", text: "^add(?:_2)?\\s*new project$", role: "button" },
      { kind: "text", text: "new project", role: "button" },
      { kind: "text", text: "new project" }
    ]
  };
  function findElement(items) {
    for (const item of items) {
      if (item.kind === "css" && item.css) {
        const el = document.querySelector(item.css);
        if (el && (item.hidden || isElementVisible(el))) return el;
      } else if (item.kind === "aria" && item.label) {
        const tag = item.tag || "*";
        const el = document.querySelector(`${tag}[aria-label*="${item.label}" i]`);
        if (el && isElementVisible(el)) return el;
      } else if (item.kind === "text" && item.text) {
        const regex = new RegExp(item.text, "i");
        const candidates = document.querySelectorAll(
          item.role ? `[role="${item.role}"]` : item.tag || "button, a, div, span"
        );
        for (const c of Array.from(candidates)) {
          if (regex.test(c.textContent || "") && isElementVisible(c)) {
            return c;
          }
        }
      }
    }
    return null;
  }
  function isElementVisible(el) {
    if (!el.offsetParent && el.offsetWidth === 0 && el.offsetHeight === 0) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }

  // src/content/flow-driver.ts
  console.log("[FlowConnectFree] Content driver loaded on flow.google.com");
  var capturedMediaUrls = [];
  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data?.__flowNet) return;
    if (event.data.kind === "media-ready" && event.data.url) {
      console.log("[FlowConnectFree] Captured media URL:", event.data.url);
      if (!capturedMediaUrls.includes(event.data.url)) {
        capturedMediaUrls.push(event.data.url);
      }
    }
  });
  async function clickTrusted(element) {
    const rect = element.getBoundingClientRect();
    const x = Math.round(rect.left + rect.width / 2);
    const y = Math.round(rect.top + rect.height / 2);
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ t: "click.trusted", x, y }, (response) => {
        if (chrome.runtime.lastError) {
          element.click();
          resolve();
        } else {
          resolve();
        }
      });
    });
  }
  function checkPageStatus() {
    const loginBtn = findElement(SELECTORS.loginIndicator);
    const promptBox = findElement(SELECTORS.promptInput);
    return {
      loggedIn: !loginBtn,
      ready: !!promptBox,
      visible: document.visibilityState === "visible"
    };
  }
  async function setPromptText(text) {
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
  async function selectModeTab(mode) {
    let targetTab = null;
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
  async function selectAspectRatio(ratio) {
    if (!ratio) return;
    const buttons = document.querySelectorAll('flow-toggles button, [role="radiogroup"] button');
    for (const btn of Array.from(buttons)) {
      if ((btn.textContent || "").trim() === ratio) {
        await clickTrusted(btn);
        break;
      }
    }
  }
  async function selectDuration(duration) {
    if (!duration) return;
    const durClean = duration.toLowerCase();
    const buttons = document.querySelectorAll('flow-toggles button, [role="radiogroup"] button');
    for (const btn of Array.from(buttons)) {
      if ((btn.textContent || "").trim().toLowerCase() === durClean) {
        await clickTrusted(btn);
        break;
      }
    }
  }
  async function injectFiles(files) {
    if (!files || files.length === 0) return;
    window.postMessage({ __flowUpload: "arm" }, window.location.origin);
    await new Promise((r) => setTimeout(r, 200));
    const attachBtn = findElement(SELECTORS.attachButton);
    if (attachBtn) {
      await clickTrusted(attachBtn);
      await new Promise((r) => setTimeout(r, 500));
    }
    const parkedInput = document.querySelector("input[data-flow-parked]");
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
  async function executeJob(jobId, spec, inputFiles) {
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
      await new Promise((r) => setTimeout(r, 1e3));
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
    const baselineUrls = /* @__PURE__ */ new Set();
    document.querySelectorAll("img, video, source").forEach((el) => {
      const src = el.src || el.currentSrc;
      if (src) baselineUrls.add(src);
    });
    capturedMediaUrls = [];
    chrome.runtime.sendMessage({ t: "job.progress", jobId, stage: "generating", message: "Generating media on Google Flow" });
    await clickTrusted(submitBtn);
    await new Promise((r) => setTimeout(r, 4e3));
    const startTime = Date.now();
    const timeoutMs = spec.mode.includes("video") ? 3e5 : 12e4;
    while (Date.now() - startTime < timeoutMs) {
      await new Promise((r) => setTimeout(r, 1500));
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
      const mediaEls = document.querySelectorAll(
        spec.mode.includes("video") ? "flow-video-tile img, video[src], flow-video-tile video" : "flow-image-tile img, img[data-media-id], img[src*='flow-content']"
      );
      const newDomUrls = [];
      for (const el of Array.from(mediaEls)) {
        const src = el.src || el.currentSrc;
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
})();
