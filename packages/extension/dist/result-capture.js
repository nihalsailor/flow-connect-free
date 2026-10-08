"use strict";
(() => {
  // src/content/result-capture.ts
  (function() {
    console.log("[FlowConnectFree] MAIN world result-capture spy active");
    const MEDIA_REGEX = /generate|create|image|flow|media|project|asset|poll|status|batch/i;
    const MEDIA_REDIRECT_REGEX = /\/media\.getMediaUrlRedirect(\?|$)/i;
    const PARKED_ATTR = "data-flow-parked";
    let uploadArmed = false;
    function notifyExtension(payload) {
      window.postMessage({ __flowNet: true, ...payload }, window.location.origin);
    }
    function extractMediaUrls(text) {
      const unescaped = text.replace(/\\u([0-9a-fA-F]{4})/g, (_, n) => String.fromCharCode(parseInt(n, 16))).replace(/\\/g, "");
      const regex = /https:\/\/flow-content\.google\/(?:image|video)\/[^"',\s]+/g;
      const matches = unescaped.match(regex) || [];
      return [...new Set(matches)];
    }
    const originalFetch = window.fetch.bind(window);
    window.fetch = async function(...args) {
      const resource = args[0];
      const init = args[1];
      const url = typeof resource === "string" ? resource : resource instanceof URL ? resource.href : resource.url;
      const method = (init?.method ?? (resource instanceof Request ? resource.method : "GET")).toUpperCase();
      try {
        const response = await originalFetch.apply(window, args);
        if (url) {
          if (response.status === 200 && MEDIA_REDIRECT_REGEX.test(url)) {
            notifyExtension({ kind: "media-ready", url: new URL(url, location.href).href });
          } else if (MEDIA_REGEX.test(url)) {
            try {
              const clone = response.clone();
              const text = await clone.text();
              const found = extractMediaUrls(text);
              for (const mediaUrl of found) {
                notifyExtension({ kind: "media-ready", url: mediaUrl });
              }
            } catch {
            }
          }
        }
        return response;
      } catch (err) {
        throw err;
      }
    };
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this.__flowMeta = { method: method.toUpperCase(), url: String(url) };
      return originalOpen.apply(this, [method, url, ...rest]);
    };
    XMLHttpRequest.prototype.send = function(...args) {
      const meta = this.__flowMeta;
      if (meta && meta.url) {
        this.addEventListener("loadend", () => {
          if (this.status === 200) {
            if (MEDIA_REDIRECT_REGEX.test(meta.url)) {
              notifyExtension({ kind: "media-ready", url: new URL(meta.url, location.href).href });
            } else if (MEDIA_REGEX.test(meta.url)) {
              try {
                const resp = String(this.responseText || "");
                const found = extractMediaUrls(resp);
                for (const mediaUrl of found) {
                  notifyExtension({ kind: "media-ready", url: mediaUrl });
                }
              } catch {
              }
            }
          }
        });
      }
      return originalSend.apply(this, args);
    };
    window.addEventListener("message", (e) => {
      if (e.source !== window || typeof e.data?.__flowUpload !== "string") return;
      uploadArmed = e.data.__flowUpload === "arm";
      notifyExtension({ kind: uploadArmed ? "upload-armed" : "upload-disarmed" });
    });
    function parkFileInput(input, trigger) {
      input.style.display = "none";
      input.setAttribute(PARKED_ATTR, "true");
      document.body.appendChild(input);
      notifyExtension({ kind: "upload-input-parked", trigger, accept: input.accept || "*" });
    }
    const originalClick = HTMLElement.prototype.click;
    HTMLElement.prototype.click = function() {
      const isFileInput = this.tagName === "INPUT" && this.type === "file";
      if (uploadArmed && isFileInput) {
        parkFileInput(this, "click");
        notifyExtension({ kind: "upload-swallowed" });
        return;
      }
      return originalClick.apply(this);
    };
    const originalDispatchEvent = EventTarget.prototype.dispatchEvent;
    EventTarget.prototype.dispatchEvent = function(event) {
      const isFileInput = this instanceof HTMLInputElement && this.type === "file";
      if (uploadArmed && event.type === "click" && isFileInput) {
        parkFileInput(this, "dispatchEvent");
        notifyExtension({ kind: "upload-swallowed" });
        return true;
      }
      return originalDispatchEvent.apply(this, [event]);
    };
    if (typeof HTMLInputElement.prototype.showPicker === "function") {
      const originalShowPicker = HTMLInputElement.prototype.showPicker;
      HTMLInputElement.prototype.showPicker = function() {
        if (uploadArmed && this.type === "file") {
          parkFileInput(this, "showPicker");
          notifyExtension({ kind: "upload-swallowed" });
          return;
        }
        return originalShowPicker.apply(this);
      };
    }
  })();
})();
