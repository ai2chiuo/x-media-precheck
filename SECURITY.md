# Security Policy

## Threat model
- **No remote code.** All JavaScript and model weights are bundled. Nothing is fetched and executed at runtime; there is no `eval`/`new Function` in extension code.
- **OpenAI API key**: entered by the user in the popup (masked input), stored only in `chrome.storage.local`, never logged, and only sent as the `Authorization` header to `https://api.openai.com/v1/chat/completions`. `chrome.storage.local` is not encrypted; anyone with access to your browser profile or other code running in this extension could read it. Use a key with a spending limit and revoke it if your device is compromised.
- **Image data**: classified locally in an offscreen document. A downscaled JPEG thumbnail is sent to OpenAI **only** when the user clicks 問 AI.
- **Network scope**: host permissions are limited to x.com, twitter.com, pbs.twimg.com (image download, credentials omitted, URL allow-listed in the background worker) and api.openai.com.
- **Rendering**: AI responses are parsed as JSON or escaped text; never inserted as raw HTML.
- **Out of scope**: X's own moderation decisions; the accuracy of NSFWJS.

## Reporting a vulnerability
Please open a private security advisory on GitHub (Security → Report a vulnerability) or email [security contact]. Please do not open public issues for security problems.
