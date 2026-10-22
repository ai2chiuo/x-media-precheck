// 大圖網址規則（hover zoom 用）。回傳升級後網址，沒有規則時回傳 null。
export const IMG_EXT = /\.(jpe?g|png|gif|webp|avif|bmp)(?:[?#].*)?$/i;

function xRule(x) {
  const p = x.pathname;
  if (p.startsWith('/profile_images/')) { x.pathname = p.replace(/_(normal|bigger|mini|x96|200x200|400x400)(\.[a-z]+)$/i, '$2'); x.search = ''; return x.toString(); }
  if (p.startsWith('/profile_banners/')) { x.pathname = p.replace(/\/\d+x\d+$/, '/1500x500'); return x.toString(); }
  if (/^\/(media|ext_tw_video_thumb|amplify_video_thumb|tweet_video_thumb|card_img)\//.test(p)) {
    const m = p.match(/\.(jpg|jpeg|png|webp|gif)$/i);
    if (m) { x.pathname = p.slice(0, -m[0].length); if (!x.searchParams.get('format')) x.searchParams.set('format', m[1].toLowerCase()); }
    x.searchParams.set('name', p.startsWith('/card_img/') ? 'large' : 'orig');
    return x.toString();
  }
  return null;
}

const RULES = [
  // X / Twitter
  [h => h === 'pbs.twimg.com', xRule],
  // Reddit: preview.redd.it/<id>.<ext>?width=… -> i.redd.it/<id>.<ext>
  [h => h === 'preview.redd.it', x => { if (!IMG_EXT.test(x.pathname)) return null; return 'https://i.redd.it' + x.pathname; }],
  [h => h === 'external-preview.redd.it', () => null],
  // Imgur: abcdefgs.jpg / abcdefgm.jpg / abcdefgl.jpg / abcdefgh.jpg / abcdefgt.jpg (7-char id + size letter) -> abcdefg.jpg
  [h => h === 'i.imgur.com', x => { const m = x.pathname.match(/^\/([A-Za-z0-9]{7})[sbtmlh](\.[a-z]+)$/); return m ? `https://i.imgur.com/${m[1]}${m[2]}` : null; }],
  // Wikipedia / Wikimedia: /wikipedia/commons/thumb/a/ab/File.jpg/320px-File.jpg -> /wikipedia/commons/a/ab/File.jpg
  [h => h === 'upload.wikimedia.org', x => { const m = x.pathname.match(/^(\/[^/]+\/[^/]+)\/thumb\/([0-9a-f]\/[0-9a-f]{2}\/[^/]+)\/[^/]+$/); return m ? `${x.origin}${m[1]}/${m[2]}` : null; }],
];

// 不處理的網站（防盜連或需要登入）
const SKIP = [h => /(^|\.)pximg\.net$/.test(h), h => /(^|\.)pixiv\.net$/.test(h)];

export function skipHost(u) { try { const h = new URL(u).hostname; return SKIP.some(f => f(h)); } catch (e) { return true; } }

export function upgradeUrl(u) {
  let x; try { x = new URL(u); } catch (e) { return null; }
  if (!/^https?:$/.test(x.protocol)) return null;
  for (const [match, rule] of RULES) if (match(x.hostname)) { try { return rule(x); } catch (e) { return null; } }
  return null;
}

// srcset 中最大的候選（依 w 或 x 描述子）
export function largestFromSrcset(srcset, base) {
  if (!srcset) return null; let best = null, bestV = -1;
  for (const part of srcset.split(/,\s+(?=\S)/)) {
    const [url, d] = part.trim().split(/\s+/); if (!url) continue;
    let v = 1; if (d) { const n = parseFloat(d); v = /w$/i.test(d) ? n : /x$/i.test(d) ? n * 10000 : n; }
    if (v > bestV) { bestV = v; best = url; }
  }
  try { return best ? new URL(best, base).toString() : null; } catch (e) { return null; }
}

export function isImageLink(href) { try { const x = new URL(href); return /^https?:$/.test(x.protocol) && (IMG_EXT.test(x.pathname) || /^\/media\//.test(x.pathname) && x.hostname === 'pbs.twimg.com'); } catch (e) { return false; } }
