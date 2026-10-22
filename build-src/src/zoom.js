import { upgradeUrl } from './zoom-url.js';
// Imagus 式滑鼠停留放大：只在 x.com/twitter.com 的內容腳本中執行
export function initZoom({ labelFor }) {
  let on = true, pinned = false, bd = null, sc = 1, tx = 0, ty = 0, drag = null, timer = null, cur = null, box = null, img = null, spin = null, tag = null, lastXY = [0, 0];
  const css = 'position:fixed;z-index:2147483646;pointer-events:none;display:none;background:#111;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.5);padding:2px;max-width:none';
  function ensure() {
    if (box) return;
    box = document.createElement('div'); box.id = 'xnp-zoom'; box.style.cssText = css;
    img = document.createElement('img'); img.style.cssText = 'display:block;max-width:none;border-radius:6px';
    spin = document.createElement('div'); spin.textContent = '載入中…'; spin.style.cssText = 'color:#fff;font:12px sans-serif;padding:8px 12px';
    tag = document.createElement('div'); tag.style.cssText = 'position:absolute;top:8px;left:8px;font:bold 11px/1.4 sans-serif;padding:1px 6px;border-radius:8px;color:#fff;display:none';
    box.append(spin, img, tag); document.documentElement.appendChild(box);
    img.onload = () => { if (!cur) return; spin.style.display = 'none'; img.style.display = 'block'; place(); };
    img.onerror = () => { spin.textContent = '無法載入原圖'; place(); };
  }
  function hide() { if (pinned) unpin(); clearTimeout(timer); timer = null; cur = null; if (box) { box.style.display = 'none'; img.removeAttribute('src'); } }
  function place() {
    if (!box || !cur) return;
    if (pinned) return placePinned();
    const vw = innerWidth, vh = innerHeight, m = 12, [cx, cy] = lastXY;
    const nw = img.naturalWidth || 200, nh = img.naturalHeight || 40;
    const right = vw - cx - 2 * m, left = cx - 2 * m; const side = right >= left ? 'r' : 'l';
    const availW = Math.max(100, side === 'r' ? right : left), availH = vh - 2 * m;
    const k = Math.min(1, availW / nw, availH / nh);
    const w = Math.round(nw * k), h = Math.round(nh * k);
    if (img.style.display !== 'none') { img.style.width = w + 'px'; img.style.height = h + 'px'; }
    const bw = img.style.display !== 'none' ? w : box.offsetWidth || 100, bh = img.style.display !== 'none' ? h : box.offsetHeight || 30;
    const x = side === 'r' ? cx + m : cx - m - bw;
    const y = Math.min(Math.max(m, cy - bh / 2), vh - m - bh);
    box.style.left = Math.max(m, x) + 'px'; box.style.top = Math.max(m, y) + 'px';
  }
  function placePinned() {
    const vw = innerWidth, vh = innerHeight, m = 24; const nw = img.naturalWidth || 200, nh = img.naturalHeight || 40;
    const k = Math.min(1, (vw - 2 * m) / nw, (vh - 2 * m) / nh); const w = Math.round(nw * k), h = Math.round(nh * k);
    if (img.style.display !== 'none') { img.style.width = w + 'px'; img.style.height = h + 'px'; }
    const bw = box.offsetWidth || w, bh = box.offsetHeight || h;
    box.style.left = Math.round((vw - bw) / 2) + 'px'; box.style.top = Math.round((vh - bh) / 2) + 'px';
    box.style.transform = `translate(${tx}px,${ty}px) scale(${sc})`;
  }
  function pin() {
    if (!cur || pinned) return; pinned = true; clearTimeout(timer); sc = 1; tx = 0; ty = 0;
    if (!bd) { bd = document.createElement('div'); bd.id = 'xnp-zoom-bd'; bd.style.cssText = 'position:fixed;inset:0;z-index:2147483645;background:rgba(0,0,0,.78);display:none';
      bd.addEventListener('mousedown', e => { if (e.button === 0) { e.preventDefault(); e.stopPropagation(); hide(); } });
      document.documentElement.appendChild(bd); }
    bd.style.display = 'block'; box.style.pointerEvents = 'auto'; box.style.cursor = 'grab'; box.style.transformOrigin = 'center center'; place();
  }
  function unpin() { pinned = false; drag = null; if (bd) bd.style.display = 'none'; if (box) { box.style.pointerEvents = 'none'; box.style.transform = ''; box.style.cursor = ''; } }
  addEventListener('wheel', e => { if (!pinned) return; e.preventDefault(); e.stopPropagation(); sc = Math.min(8, Math.max(0.2, sc * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); place(); }, { capture: true, passive: false });
  function target(el) {
    if (!(el instanceof Element)) return null;
    if (el.closest('#xnp-panel,#xnp-zoom,[data-testid="attachments"],[data-testid="tweetTextarea_0"]')) return null;
    let t = el.tagName === 'IMG' ? el : null;
    if (!t) { const host = el.closest('[data-testid="tweetPhoto"],[data-testid="videoPlayer"],[data-testid="Tweet-User-Avatar"],[data-testid="card.wrapper"],a'); t = host && host.querySelector('img[src*="pbs.twimg.com/"],video[poster*="pbs.twimg.com/"]'); }
    if (!t) return null;
    const src = t.tagName === 'VIDEO' ? t.poster : (t.currentSrc || t.src);
    const big = upgradeUrl(src); return big ? { el: t, src, big } : null;
  }
  function show(t) {
    ensure(); cur = t; img.style.display = 'none'; spin.style.display = 'block'; spin.textContent = '載入中…';
    const lab = labelFor && labelFor(t.src);
    if (lab) { tag.textContent = lab.text; tag.style.background = lab.color; tag.style.display = 'block'; } else tag.style.display = 'none';
    box.style.display = 'block'; img.src = t.big; place();
  }
  document.addEventListener('mouseover', e => {
    if (!on || pinned || e.shiftKey) return; const t = target(e.target);
    if (!t) { if (cur || timer) hide(); return; }
    if (cur && cur.el === t.el) return;
    hide(); timer = setTimeout(() => { timer = null; show(t); }, 300);
  }, true);
  document.addEventListener('mousemove', e => { if (pinned) { if (drag) { tx = drag.tx + e.clientX - drag.x; ty = drag.ty + e.clientY - drag.y; place(); } return; } lastXY = [e.clientX, e.clientY]; if (e.shiftKey && (cur || timer)) hide(); else if (cur) place(); }, true);
  document.addEventListener('mouseout', e => { if (pinned || (!cur && !timer)) return; const r = e.relatedTarget && target(e.relatedTarget); const me = target(e.target); if (r && me && r.el === me.el) return; hide(); }, true);
  addEventListener('scroll', () => { if (!pinned && (cur || timer)) hide(); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' || (e.key === 'Shift' && !pinned)) hide(); }, true);
  document.addEventListener('mousedown', e => {
    if (pinned) { if (box && box.contains(e.target) && e.button === 0) { e.preventDefault(); drag = { x: e.clientX, y: e.clientY, tx, ty }; box.style.cursor = 'grabbing'; } return; }
    if (e.button === 0 && (cur || timer)) hide(); }, true);
  document.addEventListener('mouseup', () => { if (drag) { drag = null; if (box) box.style.cursor = 'grab'; } }, true);
  document.addEventListener('contextmenu', e => {
    if (pinned) { e.preventDefault(); e.stopPropagation(); hide(); return; }
    if (cur && box && box.style.display === 'block') { e.preventDefault(); e.stopPropagation(); pin(); }
  }, true);
  const apply = v => { on = v !== false; if (!on) hide(); };
  chrome.storage.local.get('hoverZoom').then(r => apply(r.hoverZoom)).catch(() => {});
  chrome.storage.onChanged.addListener((c, a) => { if (a === 'local' && c.hoverZoom) apply(c.hoverZoom.newValue); });
  return { hide, pin, _target: target, _show: show };
}
