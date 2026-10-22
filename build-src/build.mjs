// Reproducible build: bundles content.js (no model) and offscreen.js (TF.js 4.22.0 + NSFWJS 4.3.0 InceptionV3 only)
import esbuild from 'esbuild';
const OUT = new URL('../extension/', import.meta.url).pathname;
// Only bundle the InceptionV3 model (NSFWJS ships 3 models; the other two would add ~10 MB)
const onlyInception = { name: 'only-inception', setup(b) {
  b.onLoad({ filter: /nsfwjs[\\/]dist[\\/]esm[\\/]default_models\.js$/ }, () => ({
    contents: 'import { InceptionV3Model } from "./models/inception_v3.js";export var DEFAULT_MODELS=[InceptionV3Model];',
    loader: 'js' }));
} };
await esbuild.build({ entryPoints: ['src/content.js'], bundle: true, minify: true, format: 'iife', outfile: OUT + 'content.js', logLevel: 'warning' });
await esbuild.build({ entryPoints: ['src/zoom.js'], bundle: true, minify: true, format: 'iife', outfile: OUT + 'zoom.js', logLevel: 'warning' });
await esbuild.build({ entryPoints: ['src/offscreen.js'], bundle: true, minify: true, format: 'iife', outfile: OUT + 'offscreen.js', logLevel: 'warning', plugins: [onlyInception] });
console.log('Built extension/content.js, zoom.js and offscreen.js');
