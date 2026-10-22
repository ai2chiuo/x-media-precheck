# Contributing

Thanks for helping!

- **Bugs**: use the Bug report template. Include browser + version, extension version, and `[xnp]` lines from DevTools console (filter by `[xnp]`). **Never attach sensitive or explicit images** — describe them instead.
- **Code**: edit `build-src/src/*.js` (not the bundled `extension/content.js` / `offscreen.js`), then `cd build-src && npm ci --ignore-scripts && npm run build`. Small files in `extension/` (popup, background, css, manifest) are edited directly.
- Run checks before a PR: `node --check extension/*.js` and make sure `extension/manifest.json` is valid JSON. CI does the same.
- Keep it local-first: no analytics, no remote code, no new host permissions without discussion.
- UI text is Traditional Chinese; English translations welcome.
