# Sensitive-Media Pre-check for X

[繁體中文說明](README.zh-TW.md)

A Chrome / Brave (MV3) extension that **estimates locally, before you post on X (x.com), whether attached images or videos might be marked as sensitive media**, and reminds you how many flagged media posts you made in the last 24 hours.

> **Not affiliated with X.** It uses the open-source NSFWJS model, **not X's classifier**. Scores are guidance only.

## Features
- **Compose pre-check**: when you attach, paste or drop media into the X compose box, a panel shows 正常 / 疑似 / 高風險 (Normal / Suspected / High risk) with a %. Videos/GIFs: 5 frames sampled, max score used.
- **24h counter**: logs media posts when you click Post and warns when you have 2 flagged media posts in 24h (a 3rd may trigger an account-level label for ~7 days), or 2 of the last 5 were high risk.
- **Timeline badges** (optional, off by default): small risk badge on post images visible on screen (video = poster image).
- **Ask AI / 問 AI** (optional): sends a thumbnail to OpenAI with *your own API key* and shows a compact card: risk 低/中/高, verdict, factor grid, up to 3 edit suggestions. AI 中/高 can upgrade (never downgrade) the local label.
- One shared model per browser (offscreen document) — refreshing tabs doesn't reload it.

## Install (unpacked)
1. Download/clone this repo.
2. Open `chrome://extensions` (or `brave://extensions`), enable **Developer mode**.
3. **Load unpacked** → select the `extension/` folder.
Requires Chrome/Brave **116+**.

## How scoring works
- Model: NSFWJS 4.3.0 **InceptionV3** (299×299) on TensorFlow.js 4.22.0 (WebGL, CPU fallback), bundled in `extension/offscreen.js`.
- Risk = `Porn + Hentai + 0.6 × Sexy` (capped at 100%).
- Thresholds (chosen by this project, not X's): image ≥ 50% → 疑似, video ≥ 35% → 疑似, ≥ 80% → 高風險.
- Account rules used for warnings come from reading X's open-sourced recommendation code (default values; production values may differ).

## Privacy
- All classification runs locally. No servers of ours, no analytics.
- Stored in `chrome.storage.local`: settings, optional OpenAI API key, post log (time + flagged/high booleans, max 30 days/200 entries).
- Data leaves your device only when you click **問 AI**: a ≤768px JPEG thumbnail goes to `api.openai.com` with your key. If your OpenAI org has data sharing enabled, OpenAI may use it for training.
- Full policy: [docs/privacy-policy.en.md](docs/privacy-policy.en.md).

## Limitations
- Not X's model; X may flag what this passes and vice versa.
- **Blind spots**: NSFWJS is weak on sheer/see-through or tight clothing, body-contour emphasis and suggestive framing/poses without nudity — exactly what often gets flagged. Use 問 AI for these.
- Counter only sees posts made from this browser profile with the extension; failed posts are still counted.
- Depends on X's DOM (`data-testid` attributes); X UI changes can break detection.
- InceptionV3 is slow on CPU (~12 s/image in Node); WebGL is much faster but untested on all GPUs.

## Build
See [build-src/README.md](build-src/README.md). The committed `extension/offscreen.js` (~31 MB, under GitHub's 100 MB limit, so no Git LFS) is reproducible from source.

## License
MIT — see [LICENSE](LICENSE). Bundled third-party code: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
