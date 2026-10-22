# Third-party notices

extension/offscreen.js bundles the following third-party software (built with build-src/build.mjs):

## NSFWJS 4.3.0 (including the InceptionV3 model weights) — MIT
https://github.com/infinitered/nsfwjs

```
MIT License

Copyright (c) 2019 Infinite Red, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## TensorFlow.js 4.22.0 (@tensorflow/tfjs and its sub-packages) — Apache License 2.0
https://github.com/tensorflow/tfjs

Copyright 2018–2024 Google LLC. Licensed under the Apache License, Version 2.0. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0. Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

## Other bundled dependencies
Transitive runtime dependencies pulled in by the above (e.g. seedrandom MIT, long Apache-2.0) are included in the minified bundle under their respective licenses; run `npx license-checker` in build-src/ for the full list.
