// 滑鼠停留顯示大圖（所有網站）。獨立內容腳本，不需要任何 host 權限，也不傳送任何資料。
import { upgradeUrl, largestFromSrcset, isImageLink, skipHost } from './zoom-url.js';

const MIN = 40, BIG = 1.15, DELAY = 300;
let lastPin = null;
let on = true, siteOff = false, pinned = false, sc = 1, tx = 0, ty = 0, drag = null;
let timer = null, cur = null, lastXY = [0, 0], host = null, root, box, img, spin, tag, bd, probe = null;

function ensure() {
  if (host && host.isConnected) return;
  host = document.createElement('xnp-zoom-host');
  host.style.cssText = 'all:initial;position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none';
  root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
  :host{all:initial}
  .bd{position:fixed;inset:0;background:rgba(0,0,0,.78);display:none;pointer-events:auto}
  .box{position:fixed;display:none;pointer-events:none;background:#111;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.5);padding:2px;transform-origin:center center}
  .box.pin{pointer-events:auto;cursor:default}.box.drag{cursor:grabbing}
  img{display:none;max-width:none;max-height:none;border-radius:6px;user-select:none}
  .spin{color:#fff;font:12px sans-serif;padding:8px 12px}
  .tag{position:absolute;top:8px;left:8px;font:bold 11px/1.4 sans-serif;padding:1px 6px;border-radius:8px;color:#fff;display:none}
  </style><div class="bd"></div><div class="box"><div class="spin">載入中…</div><img alt=""><div class="tag"></div></div>`;
  bd = root.querySelector('.bd'); box = root.querySelector('.box'); img = root.querySelector('img'); spin = root.querySelector('.spin'); tag = root.querySelector('.tag');
  img.onload = () => { if (!cur) return; spin.style.display = 'none'; img.style.display = 'block'; place(); };
  img.onerror = () => { if (!cur) return; spin.textContent = '無法載入圖片'; place(); };
  bd.addEventListener('mousedown', e => { if (e.button === 0) { e.preventDefault(); e.stopPropagation(); hide(); } });
  // Pinned: left-press on the image starts a native drag (to another tab/desktop); don't let the page see it.
  box.addEventListener('mousedown', e => { if (pinned && e.button === 0) e.stopPropagation(); });
  img.draggable = true;
  // Pinned: a plain left-click on the image (no drag) closes the preview, like clicking the backdrop.
  box.addEventListener('click', e => { if (pinned && e.button === 0) { e.preventDefault(); e.stopPropagation(); hide(); } });
  (document.body || document.documentElement).appendChild(host);
}

function hide() {
  clearTimeout(timer); timer = null; if (probe) { probe.onload = probe.onerror = null; probe = null; }
  pinned = false; drag = null; cur = null;
  if (box) { box.style.display = 'none'; box.classList.remove('pin', 'drag'); box.style.transform = ''; img.removeAttribute('src'); img.style.display = 'none'; bd.style.display = 'none'; }
}

function place() {
  if (!box || !cur) return;
  const vw = innerWidth, vh = innerHeight, shown = img.style.display !== 'none';
  const nw = img.naturalWidth || 200, nh = img.naturalHeight || 40;
  if (pinned) {
    const m = 24, k = Math.min(1, (vw - 2 * m) / nw, (vh - 2 * m) / nh), w = Math.round(nw * k), h = Math.round(nh * k);
    if (shown) { img.style.width = w + 'px'; img.style.height = h + 'px'; }
    const bw = box.offsetWidth || w, bh = box.offsetHeight || h;
    box.style.left = Math.round((vw - bw) / 2) + 'px'; box.style.top = Math.round((vh - bh) / 2) + 'px';
    box.style.transform = `translate(${tx}px,${ty}px) scale(${sc})`; return;
  }
  const m = 12, [cx, cy] = lastXY, right = vw - cx - 2 * m, left = cx - 2 * m, side = right >= left ? 'r' : 'l';
  const availW = Math.max(100, side === 'r' ? right : left), k = Math.min(1, availW / nw, (vh - 2 * m) / nh);
  const w = Math.round(nw * k), h = Math.round(nh * k);
  if (shown) { img.style.width = w + 'px'; img.style.height = h + 'px'; }
  const bw = shown ? w + 4 : (box.offsetWidth || 100), bh = shown ? h + 4 : (box.offsetHeight || 30);
  box.style.left = Math.max(m, side === 'r' ? cx + m : cx - m - bw) + 'px';
  box.style.top = Math.max(m, Math.min(cy - bh / 2, vh - m - bh)) + 'px';
}

const isOurs = el => el === host || (el && el.closest && el.closest('xnp-zoom-host,#xnp-panel,[data-testid^="tweetTextarea_"]'));
const bgUrl = el => { try { const b = getComputedStyle(el).backgroundImage; const m = b && b.match(/url\(["']?([^"')]+)["']?\)/); return m ? new URL(m[1], location.href).toString() : null; } catch (e) { return null; } };
const abs = u => { try { return u ? new URL(u, location.href).toString() : null; } catch (e) { return null; } };
const rectOf = el => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height }; };

// 找出可放大的候選：{el, src, big, sure}
export function candidate(el) {
  if (!(el instanceof Element) || isOurs(el)) return null;
  // X：照片和影片上方常有覆蓋層，往上找容器裡的 img / video
  let t = el.tagName === 'IMG' ? el : null;
  if (!t && el.tagName === 'VIDEO' && el.poster) t = el;
  if (!t) { const hostEl = el.closest('[data-testid="tweetPhoto"],[data-testid="videoPlayer"],[data-testid="Tweet-User-Avatar"],[data-testid="card.wrapper"]'); if (hostEl) t = hostEl.querySelector('img[src],video[poster]'); }
  const link = el.closest('a[href]'); const linkImg = link && isImageLink(link.href) ? link.href : null;
  if (t) {
    if (isOurs(t)) return null;
    const src = t.tagName === 'VIDEO' ? t.poster : (t.currentSrc || t.src); if (!src) return null;
    const { w, h } = rectOf(t); if (Math.max(w, h) < MIN && !linkImg) return null;
    const best = [upgradeUrl(src), largestFromSrcset(t.getAttribute('srcset'), location.href), abs(t.getAttribute('data-src')), abs(t.getAttribute('data-original')), linkImg && (upgradeUrl(linkImg) || linkImg)].find(u => u && u !== src && !/^data:/.test(u));
    if (best && !skipHost(best)) return { el: t, src, big: best, sure: true };
    if (skipHost(src)) return null;
    const nw = t.naturalWidth || 0, nh = t.naturalHeight || 0;
    if (nw > w * BIG || nh > h * BIG) return { el: t, src, big: src, sure: true };
    return null;
  }
  if (linkImg && !skipHost(linkImg)) return { el: link, src: linkImg, big: upgradeUrl(linkImg) || linkImg, sure: true };
  // CSS 背景圖（最多往上 2 層）
  for (let e = el, i = 0; e && i < 3; e = e.parentElement, i++) {
    const u = bgUrl(e); if (!u || skipHost(u)) continue; const { w, h } = rectOf(e); if (Math.max(w, h) < MIN) return null;
    return { el: e, src: u, big: upgradeUrl(u) || u, sure: !!upgradeUrl(u), rect: { w, h } };
  }
  return null;
}

function show(c) {
  ensure(); cur = c; sc = 1; tx = 0; ty = 0;
  img.style.display = 'none'; spin.style.display = 'block'; spin.textContent = '載入中…';
  const lab = typeof globalThis.__xnpLabelFor === 'function' && globalThis.__xnpLabelFor(c.src);
  if (lab) { tag.textContent = lab.text; tag.style.background = lab.color; tag.style.display = 'block'; } else tag.style.display = 'none';
  box.style.display = 'block'; img.src = c.big; place();
}

// 不確定是否比顯示的大（例如背景圖）：先在背景載入，夠大才顯示
function maybeShow(c) {
  if (c.sure) return show(c);
  const p = new Image(); probe = p;
  p.onload = () => { if (probe !== p) return; probe = null; const r = c.rect || rectOf(c.el); if (p.naturalWidth > r.w * BIG || p.naturalHeight > r.h * BIG || c.big !== c.src) show(c); };
  p.onerror = () => { if (probe === p) probe = null; };
  p.src = c.big;
}

function pickAt(e) {
  let c = candidate(e.target); if (c) return c;
  if (document.elementsFromPoint) for (const el of document.elementsFromPoint(e.clientX, e.clientY).slice(0, 6)) { if (el.tagName === 'IMG' && (c = candidate(el))) return c; }
  return null;
}

function siteDisabled(list) {
  const h = location.hostname.toLowerCase();
  return String(list || '').split(/[\s,]+/).map(s => s.trim().toLowerCase().replace(/^\*\./, '').replace(/^https?:\/\//, '').replace(/\/.*$/, '')).filter(Boolean).some(d => h === d || h.endsWith('.' + d));
}
const active = () => on && !siteOff;

document.addEventListener('mouseover', e => {
  if (!active() || pinned || e.shiftKey) return;
  lastXY = [e.clientX, e.clientY];
  const c = pickAt(e);
  if (!c) { if (cur || timer) hide(); return; }
  if (cur && cur.el === c.el) return;
  hide(); timer = setTimeout(() => { timer = null; maybeShow(c); }, DELAY);
}, true);
function panTo(e) {
  if (!box || !pinned) return;
  const W = innerWidth, H = innerHeight, m = 24;
  const ow = (box.offsetWidth || 0) * sc, oh = (box.offsetHeight || 0) * sc;
  const ex = Math.max(0, ow - W + 2 * m), ey = Math.max(0, oh - H + 2 * m);
  tx = (0.5 - e.clientX / W) * ex; ty = (0.5 - e.clientY / H) * ey; place();
}
document.addEventListener('mousemove', e => {
  if (pinned) {
    lastPin = e;
    if (drag) { tx = drag.tx + e.clientX - drag.x; ty = drag.ty + e.clientY - drag.y; place(); return; }
    // Mouse-follow pan: when the zoomed image exceeds the viewport, moving the mouse scrolls it (mouse-follow).
    panTo(e);
    return;
  }
  lastXY = [e.clientX, e.clientY]; if (e.shiftKey && (cur || timer)) hide(); else if (cur) place();
}, true);
document.addEventListener('mouseout', e => {
  if (pinned || (!cur && !timer)) return;
  const r = e.relatedTarget && !isOurs(e.relatedTarget) && candidate(e.relatedTarget); const el = (cur && cur.el) || null;
  if (r && el && r.el === el) return; if (e.relatedTarget && el && el.contains(e.relatedTarget)) return; hide();
}, true);
document.addEventListener('mouseup', () => { if (drag) { drag = null; box && box.classList.remove('drag'); } }, true);
addEventListener('scroll', () => { if (!pinned && (cur || timer)) hide(); }, true);
addEventListener('wheel', e => { if (!pinned) return; e.preventDefault(); e.stopPropagation(); sc = Math.min(8, Math.max(0.2, sc * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); place(); if (!drag) { lastPin = e; panTo(e); } }, { capture: true, passive: false });
const eatEsc = e => { if (e.key === 'Escape' && (pinned || cur)) { e.preventDefault(); e.stopImmediatePropagation(); return true; } return false; };
// Pinned: "+" / "=" zoom in, "-" / "_" zoom out (main row and numpad).
const zoomKey = e => {
  if (!pinned || e.ctrlKey || e.metaKey || e.altKey) return false;
  const k = e.key; const up = k === '+' || k === '=', down = k === '-' || k === '_';
  if (!up && !down) return false;
  e.preventDefault(); e.stopImmediatePropagation();
  sc = Math.min(8, Math.max(0.2, sc * (up ? 1.25 : 1 / 1.25))); place(); if (lastPin) panTo(lastPin);
  return true;
};
addEventListener('keydown', e => {
  if (zoomKey(e)) return;
  const eat = eatEsc(e);
  if (eat || (e.key === 'Shift' && !pinned)) { if (cur || timer) hide(); if (eat) escUntil = Date.now() + 500; }
}, true);
// Swallow the matching keyup too so pages (e.g. X photo viewer) that act on keyup don't navigate back.
let escUntil = 0;
addEventListener('keyup', e => { if (e.key === 'Escape' && Date.now() < escUntil) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
document.addEventListener('mousedown', e => { if (pinned) return; if (e.button === 0 && (cur || timer)) hide(); }, true);
document.addEventListener('contextmenu', e => {
  if (pinned) { e.stopImmediatePropagation(); return; } // pinned: let the native menu (e.g. Save image as) show
  if (cur && box && box.style.display === 'block') { e.preventDefault(); e.stopPropagation(); pinned = true; clearTimeout(timer); bd.style.display = 'block'; box.classList.add('pin'); place(); }
}, true);

const apply = r => { on = r.hoverZoom !== false; siteOff = siteDisabled(r.zoomDisabledSites); if (!active()) hide(); };
try {
  chrome.storage.local.get(['hoverZoom', 'zoomDisabledSites']).then(apply).catch(() => {});
  chrome.storage.onChanged.addListener((c, a) => { if (a !== 'local' || !(c.hoverZoom || c.zoomDisabledSites)) return; chrome.storage.local.get(['hoverZoom', 'zoomDisabledSites']).then(apply); });
} catch (e) {}
globalThis.__xnpZoom = { candidate, hide, siteDisabled, isPinned: () => pinned };
