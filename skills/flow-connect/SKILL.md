---
name: flow-connect
description: Generate images and videos for free via Google Flow (flow.google.com — Nano Banana Pro/2 for images, Veo 3.1 / Omni Flash for video) using the user's logged-in browser session. Driven by the Flow Connect Free MCP server.
---

# Flow Connect (Free)

Generate images and videos on [Google Flow](https://flow.google.com) using your coding agent and logged-in Google account for free, without API costs or license paywalls.

## Prerequisites

1. **Google Flow Tab**: Must be open at `https://flow.google.com`, logged in to your Google account, and **visible** on your screen (e.g. side-by-side with your code editor).
2. **Chrome Extension**: Load unpacked from `packages/extension/dist`.
3. **Bridge Daemon**: Running on `http://127.0.0.1:8791`.

## Tools Provided via MCP

| Tool | Description |
|---|---|
| `flow_status` | Check if bridge is running and Google Flow tab is open & visible |
| `flow_text_to_image` | Generate images using Nano Banana Pro / 2 / Lite |
| `flow_image_to_image` | Modify or generate image variations with reference images |
| `flow_text_to_video` | Generate videos using Veo 3.1 (Lite / Fast / Quality) or Omni Flash |
| `flow_frame_to_video` | Generate videos transitioning between Start and End frame images |
| `flow_ingredients_to_video` | Generate videos combining multiple reference images (up to 7) |
| `flow_extend_video` | Lengthen the video clip currently open in Google Flow's scene editor |
| `flow_list_jobs` | List recent generation jobs and their downloaded file paths |
| `flow_get_job` | Poll a generation job by its ID |

## Best Practices

* **Keep Tab Visible**: Chrome throttles background and minimized tabs. Keep `flow.google.com` on one half of the monitor (Win + Left Arrow) and your editor on the other half (Win + Right Arrow).
* **Batching**: Flow Connect Free has no arbitrary single-image limits—you can submit multiple prompts concurrently.
