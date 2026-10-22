# Changelog

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
