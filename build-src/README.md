# Reproducible build

`extension/content.js` and `extension/offscreen.js` are generated from `src/` with esbuild.

```bash
cd build-src
npm ci --ignore-scripts   # pinned: @tensorflow/tfjs 4.22.0, nsfwjs 4.3.0 (see package-lock.json)
npm run build             # writes ../extension/content.js and ../extension/offscreen.js
```

- `--ignore-scripts` is recommended; no install scripts are needed for the build.
- `build.mjs` replaces NSFWJS's `default_models.js` so only the **InceptionV3** model is bundled (the other two models would add size without being used).
- Model weights come from the `nsfwjs` npm package (embedded as JS modules); nothing is downloaded at runtime.
- Verify: `sha256sum ../extension/content.js ../extension/offscreen.js` should match the committed files when built with the locked dependency versions and the esbuild version in `package.json`.
- `offscreen.js` is ~31 MB, below GitHub's 100 MB per-file limit, so Git LFS is not used.
