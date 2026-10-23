// Both store packages: valid MV3 manifest, referenced files exist, A has no <all_urls>/zoom, B has no X/NSFW code
const fs = require('fs'), path = require('path'); let fail = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fail++; };
for (const dir of ['extension', 'zoom-extension']) {
  const D = path.join(__dirname, '../..', dir), m = JSON.parse(fs.readFileSync(path.join(D, 'manifest.json'), 'utf8'));
  ok(m.manifest_version === 3 && /^1\.0\.\d$/.test(m.version) && (m.description || '').length <= 132, dir + ': MV3, 1.0.x, description <= 132');
  const files = [m.background && m.background.service_worker, ...m.content_scripts.flatMap(c => [...(c.js || []), ...(c.css || [])]), m.action.default_popup, ...Object.values(m.icons || {})].filter(Boolean);
  ok(files.every(f => fs.existsSync(path.join(D, f))), dir + ': all referenced files exist');
  const raw = JSON.stringify(m);
  if (dir === 'extension') ok(!raw.includes('<all_urls>') && !fs.existsSync(path.join(D, 'zoom.js')), 'A: no <all_urls>, no zoom.js');
  else { ok(JSON.stringify(m.permissions) === '["storage"]' && !m.host_permissions && !m.background, 'B: only storage permission');
    const code = fs.readdirSync(D).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(D, f), 'utf8')).join('');
    ok(!/nsfw|openai|offscreen|tensorflow/i.test(code), 'B: no NSFW/OpenAI/offscreen code'); }
}
console.log(fail ? `manifests: ${fail} failed` : 'manifests: all passed'); process.exit(fail ? 1 : 0);
