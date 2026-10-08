// DOM Selector definitions and element finders for flow.google.com

export interface SelectorItem {
  kind: "css" | "text" | "aria";
  css?: string;
  text?: string;
  label?: string;
  role?: string;
  tag?: string;
  hidden?: boolean;
}

export const SELECTORS: Record<string, SelectorItem[]> = {
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
    { kind: "text", text: "(generating|creating)(\\.\\.\\.|…|\\s*\\d+%)" }
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

// Helper to query element from a list of selector strategies
export function findElement(items: SelectorItem[]): HTMLElement | null {
  for (const item of items) {
    if (item.kind === "css" && item.css) {
      const el = document.querySelector<HTMLElement>(item.css);
      if (el && (item.hidden || isElementVisible(el))) return el;
    } else if (item.kind === "aria" && item.label) {
      const tag = item.tag || "*";
      const el = document.querySelector<HTMLElement>(`${tag}[aria-label*="${item.label}" i]`);
      if (el && isElementVisible(el)) return el;
    } else if (item.kind === "text" && item.text) {
      const regex = new RegExp(item.text, "i");
      const candidates = document.querySelectorAll<HTMLElement>(
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

export function isElementVisible(el: HTMLElement): boolean {
  if (!el.offsetParent && el.offsetWidth === 0 && el.offsetHeight === 0) return false;
  const style = window.getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
}
