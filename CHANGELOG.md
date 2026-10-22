# Changelog

## 1.0.0 — 2026-10-22
- **Split into two extensions** for the Chrome Web Store (single purpose, minimal permissions):
  - `extension/` — **Sensitive-Media Pre-check for X** 1.0.0: x.com/twitter.com only. Hover zoom, the `<all_urls>` content script and the zoom settings in the popup were removed. Everything else unchanged.
  - `zoom-extension/` — **Hover Image Zoom** (圖片懸停放大) 1.0.0: the hover-zoom feature from 0.7.4 as its own extension. Permissions: `storage` + `<all_urls>` content script only; no background, no host permissions, no remote code. Own popup (on/off, per-site disable list) and icons. The NSFW label overlay only appears if the pre-check is in the same script context, so in the split build it never shows.
- `build-src/build.mjs` builds both; `npm test` adds a manifest check for both packages. New privacy policy: `docs/hover-zoom-privacy-policy.{zh-TW,en}.md`.

## 0.7.4 — 2026-10-22
- Pinned preview: right-click shows the native context menu (Save image as…); the image can be dragged to another tab or the desktop. Manual drag-pan removed (mouse-follow pan replaces it). Close with Esc or by clicking the background.

## 0.7.3 — 2026-10-22
- zoom.js now runs at document_start so its Esc handler registers before page handlers (fixes Grok Imagine going back on Esc).

## 0.7.2 — 2026-10-22
- Esc while a preview is shown or pinned is swallowed so the page (e.g. X photo viewer) no longer navigates back.

## 0.7.1 — 2026-10-22
- Pinned preview: moving the mouse pans a zoomed image larger than the screen (Imagus-style).

## 0.7.0 — 2026-10-22
- Hover zoom now works on **all websites** as a separate lightweight content script (`zoom.js`, ~9 KB, `<all_urls>`, top frame only). The NSFW pre-check (`content.js`) still runs only on x.com / twitter.com.
- Generic rules: `<img>` shown smaller than its natural size, largest `srcset` candidate, `data-src` / `data-original`, links pointing directly to image files, CSS background images; skips images < 40 px and images already at full size. Site rules: X (`name=orig`, full-size avatars), Reddit (preview.redd.it → i.redd.it), Imgur (size suffix removed), Wikimedia (thumb → original); Pixiv skipped.
- Preview lives in a shadow DOM container to avoid page CSS conflicts. Pin mode, wheel zoom, drag, Esc and Shift unchanged.
- Popup: per-site disable list. Note: the `<all_urls>` content script makes Chrome show "Read and change all your data on all websites". No host permissions were added and zoom sends nothing anywhere.

## 0.6.0 — 2026-10-22
- New: Imagus-style hover zoom on x.com/twitter.com (toggle 「滑鼠停留顯示大圖」, default on). Hover a tweet photo, avatar, card image or video poster for 300 ms to see the original-size image (`name=orig`, full-size avatars) fitted to the viewport; shows the local NSFW label if already scanned. Hidden on mouse leave, scroll, Esc, click; hold Shift to disable.
- Right-click while the preview is shown pins it centered with a dark backdrop: wheel to zoom, drag to pan; close with right-click, Esc or clicking the backdrop. Right-click elsewhere keeps the normal browser menu.
- Tests: `test/zoom-url.test.mjs`, `test/zoom-hover.test.cjs`. No new permissions.

## 0.5.6 — 2026-10-22
- Fixed: compose panel list disappeared when opening the content disclosure (內容揭露 / AI-generated) setting. Attachment removals are now debounced (1.5 s), items are re-matched by stable image identity (blob/src) after re-renders, and the list is kept while a dialog/sheet is open or the attachments container is temporarily unmounted. AI verdicts are kept. Still cleared after posting or via ✕ / 清空.
- Added jsdom regression test (`build-src/test/attachments.test.cjs`, `npm test`).

## 0.5.5 — 2026-10-22
- Renamed to "Sensitive-Media Pre-check for X" / 發文前敏感媒體預檢; added 16/48/128 icons.
- Removed unused `https://video.twimg.com/*` permission and the legacy fetch handler.
- Reproducible build (`build-src/`), open-source release files.

## 0.5.4
- 問 AI verdict upgrades the local label (中 → at least 疑似, 高 → 高風險; never downgrades); counters and warnings use the final label.

## 0.5.3
- Fixed timeline badges never appearing (images inserted as leaf nodes or with `src` set later were not detected). Added 排隊中/掃描中 states, error reason tooltips and `[xnp]` debug logs.

## 0.5.2
- Compose panel mirrors attached media, de-duplicates files, clears after posting / closing; added 清空 button.

## 0.5.1
- 問 AI requests strict JSON and renders a compact collapsible card; plain-text fallback.

## 0.5.0
- Model moved to a shared MV3 offscreen document (loaded once for all tabs); content script reduced from ~31 MB to ~10 KB.
- Reasoning models (gpt-5/o-series) use minimal reasoning effort and larger token limit.

## 0.4.x
- 0.4.0: 問 AI button using the user's own OpenAI key.
- 0.4.1: model dropdown in popup; popup layout fixes.

## 0.3.0
- Switched to NSFWJS InceptionV3 (more accurate, slower).

## 0.2.0
- Optional timeline image scanning with badges.

## 0.1.0
- Compose pre-check with NSFWJS MobileNetV2 and 24h media-post counter.
