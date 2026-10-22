# Privacy Policy — Sensitive-Media Pre-check for X

Last updated: October 22, 2026 (applies to version 1.0.0)
URL: https://github.com/ai2chiuo/x-media-precheck/blob/main/docs/privacy-policy.en.md

## Summary
This extension estimates, before you post on X (x.com), how likely your images or videos are to be treated as sensitive media. **We run no servers. We do not collect, upload, or sell any data, and the extension contains no analytics or tracking.**

## Processed locally on your device
- **Images and video frames**: media you attach in the X compose box and, if you enable "Scan timeline images", post images visible on screen are analyzed inside your browser by the open-source NSFWJS model bundled with the extension. Results never leave your device.
- Timeline images are downloaded by the extension directly from X's image server (pbs.twimg.com) for local analysis, without your login cookies.

## Stored locally (chrome.storage.local)
- Media-post log: for each post only the time, whether it was flagged, whether it was high-risk, and the number of media items; max 30 days / 200 entries. No images, text, or account data. Clearable from the popup.
- Settings: timeline-scan toggle and chosen OpenAI model name.
- Your own OpenAI API key (optional): stored only locally, never sent to us, used only for "Ask AI" requests you trigger.
- Scores and AI answers are cached in tab memory only and vanish when the tab closes.

## Shared with a third party: only when you click "Ask AI" (問 AI)
- The media's thumbnail (JPEG, longest side 768px; one frame for video) and a fixed prompt are sent directly to OpenAI (api.openai.com) using **your own API key**. No X account info or post text is sent.
- OpenAI handles this data under its policies and your account settings. **If your OpenAI organization has data sharing enabled (e.g. for complimentary tokens), these images and answers may be used by OpenAI to train models.** See https://openai.com/policies/
- Nothing is sent to OpenAI unless you click "Ask AI".

## What we don't do
- No selling, renting, or sharing of data.
- No analytics, ads, or trackers.
- No access to your X messages, passwords, or credentials.
- No remote code is downloaded or executed.

## Deleting data
Uninstalling removes all local data. You can also clear the counter in the popup.

## Contact
xoman222@gmail.com
