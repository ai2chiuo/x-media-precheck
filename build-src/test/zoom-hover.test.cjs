// jsdom: hover zoom on X and on generic pages (img/srcset/link/background/size rules, pin mode)
const { JSDOM } = require('jsdom'); const fs = require('fs'); const path = require('path');
const EXT = path.join(__dirname, '../../extension'), ZEXT = path.join(__dirname, '../../zoom-extension');
const zoomCode = fs.readFileSync(path.join(ZEXT, 'zoom.js'), 'utf8'), contentCode = fs.readFileSync(path.join(EXT, 'content.js'), 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms)); let fail = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };
function page(html, url, store = {}, withContent = false) {
  const dom = new JSDOM(`<body>${html}</body>`, { url, runScripts: 'outside-only', pretendToBeVisual: true }); const w = dom.window;
  w.IntersectionObserver = class { observe() {} unobserve() {} };
  w.chrome = { storage: { local: { get: async () => ({ ...store }), set: async () => {} }, onChanged: { addListener() {} } }, runtime: { onMessage: { addListener() {} }, sendMessage: async () => ({}) } };
  w.console.debug = () => {};
  // fake layout: data-w/data-h = displayed size, data-nw/data-nh = natural size
  for (const el of w.document.querySelectorAll('[data-w]')) {
    el.getBoundingClientRect = () => ({ width: +el.dataset.w, height: +el.dataset.h, top: 0, left: 0, right: +el.dataset.w, bottom: +el.dataset.h });
    if (el.dataset.nw) { Object.defineProperty(el, 'naturalWidth', { value: +el.dataset.nw }); Object.defineProperty(el, 'naturalHeight', { value: +el.dataset.nh }); }
  }
  if (withContent) w.eval(contentCode); w.eval(zoomCode); return w;
}
const over = (w, id, extra = {}) => w.document.getElementById(id).dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true, clientX: 100, clientY: 100, ...extra }));
const prev = w => { const h = w.document.querySelector('xnp-zoom-host'); return h && h.shadowRoot.querySelector('.box'); };
const shownSrc = w => { const b = prev(w); return b && b.style.display === 'block' ? b.querySelector('img').getAttribute('src') : null; };
const C = (w, id) => { const c = w.__xnpZoom.candidate(w.document.getElementById(id)); return c && c.big; };

(async () => {
  // --- X ---
  let w = page(`<article><div data-testid="tweetPhoto"><img id="p" data-w="300" data-h="200" src="https://pbs.twimg.com/media/AAA?format=jpg&name=small"></div></article><div data-testid="attachments"><img id="a" data-w="300" data-h="200" src="https://pbs.twimg.com/media/BBB?format=jpg&name=small"><img id="bl" data-w="300" data-h="200" data-nw="1200" data-nh="800" src="blob:https://x.com/abc-123"></div>`, 'https://x.com/home', {}, true);
  await sleep(30); over(w, 'p'); await sleep(150); ok(!shownSrc(w), 'X: no preview before 300ms');
  await sleep(250); ok(shownSrc(w) === 'https://pbs.twimg.com/media/AAA?format=jpg&name=orig', 'X: preview uses name=orig');
  ok(w.document.querySelector('xnp-zoom-host').style.pointerEvents === 'none' && prev(w).style.pointerEvents !== 'auto', 'preview not interactive (pointer-events none)');
  w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); ok(!shownSrc(w), 'Esc hides');
  over(w, 'p'); await sleep(400);
  const ce = new w.MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }); w.document.getElementById('p').dispatchEvent(ce);
  ok(ce.defaultPrevented && prev(w).classList.contains('pin'), 'right-click pins');
  const bdEl = w.document.querySelector('xnp-zoom-host').shadowRoot.querySelector('.bd'); ok(bdEl.style.display === 'block', 'backdrop shown');
  w.dispatchEvent(new w.Event('scroll')); ok(!!shownSrc(w), 'pinned survives scroll');
  bdEl.dispatchEvent(new w.MouseEvent('mousedown', { bubbles: true, button: 0 })); ok(!shownSrc(w) && bdEl.style.display === 'none', 'click backdrop closes');
  // pinned: +/- keys and click on image
  over(w, 'p'); await sleep(400); w.document.getElementById('p').dispatchEvent(new w.MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }));
  const sc0 = prev(w).style.transform; const kp = new w.KeyboardEvent('keydown', { key: '+', bubbles: true, cancelable: true }); w.dispatchEvent(kp);
  ok(kp.defaultPrevented && /scale\(1\.25\)/.test(prev(w).style.transform), '"+" zooms in when pinned');
  w.dispatchEvent(new w.KeyboardEvent('keydown', { key: '-', bubbles: true, cancelable: true })); ok(prev(w).style.transform === sc0, '"-" zooms out');
  w.dispatchEvent(new w.KeyboardEvent('keydown', { key: '=', bubbles: true, cancelable: true })); ok(/scale\(1\.25\)/.test(prev(w).style.transform), '"=" zooms in');
  prev(w).dispatchEvent(new w.MouseEvent('click', { bubbles: true, button: 0 })); ok(!shownSrc(w), 'click on pinned image closes');
  const kn = new w.KeyboardEvent('keydown', { key: '+', bubbles: true, cancelable: true }); w.dispatchEvent(kn); ok(!kn.defaultPrevented, '"+" ignored when not pinned');
  const ce2 = new w.MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }); w.document.body.dispatchEvent(ce2); ok(!ce2.defaultPrevented, 'right-click elsewhere keeps menu');
  over(w, 'a'); await sleep(400); ok(shownSrc(w) === 'https://pbs.twimg.com/media/BBB?format=jpg&name=orig', 'compose attachments: preview shown');
  w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  over(w, 'bl'); await sleep(400); ok(shownSrc(w) === 'blob:https://x.com/abc-123', 'compose blob: image: preview shown at natural size');
  w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  over(w, 'p', { shiftKey: true }); await sleep(400); ok(!shownSrc(w), 'Shift disables');

  // --- generic ---
  w = page(`
   <img id="ss" data-w="100" data-h="100" data-nw="100" data-nh="100" src="https://ex.com/s.jpg" srcset="https://ex.com/s.jpg 100w, https://ex.com/l.jpg 1600w">
   <img id="nat" data-w="200" data-h="150" data-nw="1200" data-nh="900" src="https://ex.com/n.jpg">
   <img id="full" data-w="400" data-h="300" data-nw="400" data-nh="300" src="https://ex.com/f.jpg">
   <img id="tiny" data-w="24" data-h="24" data-nw="96" data-nh="96" src="https://ex.com/icon.png">
   <a href="https://ex.com/big.png"><img id="lnk" data-w="120" data-h="90" data-nw="120" data-nh="90" src="https://ex.com/thumb.png"></a>
   <img id="lazy" data-w="150" data-h="150" data-nw="1" data-nh="1" src="data:image/gif;base64,R0lGOD" data-src="/real.jpg">
   <img id="rd" data-w="150" data-h="150" data-nw="150" data-nh="150" src="https://preview.redd.it/abc.jpg?width=150">
   <img id="px" data-w="150" data-h="150" data-nw="1500" data-nh="1500" src="https://i.pximg.net/a.jpg">
   <div id="bg" data-w="200" data-h="200" style="background-image:url('https://ex.com/bg.jpg')"></div>
   <div id="bgt" data-w="20" data-h="20" style="background-image:url('https://ex.com/bgt.jpg')"></div>`, 'https://ex.com/page');
  await sleep(30);
  ok(C(w, 'ss') === 'https://ex.com/l.jpg', 'srcset: largest candidate');
  ok(C(w, 'nat') === 'https://ex.com/n.jpg', 'downscaled img: natural size');
  ok(C(w, 'full') === null, 'already full size: skipped');
  ok(C(w, 'tiny') === null, 'tiny (<40px): skipped');
  ok(C(w, 'lnk') === 'https://ex.com/big.png', 'link to image: href');
  ok(C(w, 'lazy') === 'https://ex.com/real.jpg', 'lazy data-src');
  ok(C(w, 'rd') === 'https://i.redd.it/abc.jpg', 'reddit rule');
  ok(C(w, 'px') === null, 'pixiv skipped');
  ok(C(w, 'bg') === 'https://ex.com/bg.jpg', 'background-image');
  ok(C(w, 'bgt') === null, 'tiny background skipped');
  over(w, 'ss'); await sleep(400); ok(shownSrc(w) === 'https://ex.com/l.jpg', 'generic hover shows srcset largest');
  // per-site disable
  w = page(`<img id="nat" data-w="200" data-h="150" data-nw="1200" data-nh="900" src="https://ex.com/n.jpg">`, 'https://news.ex.com/', { zoomDisabledSites: 'foo.org\nex.com' });
  await sleep(30); over(w, 'nat'); await sleep(400); ok(!shownSrc(w), 'per-site disable (subdomain)');
  ok(w.__xnpZoom.siteDisabled('other.com') === false, 'siteDisabled other host false');
  w = page(`<img id="nat" data-w="200" data-h="150" data-nw="1200" data-nh="900" src="https://ex.com/n.jpg">`, 'https://ex.com/', { hoverZoom: false });
  await sleep(30); over(w, 'nat'); await sleep(400); ok(!shownSrc(w), 'global toggle off');
  console.log(fail ? `zoom-hover: ${fail} failed` : 'zoom-hover: all passed'); process.exit(fail ? 1 : 0);
})();
