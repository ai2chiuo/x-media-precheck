import assert from 'node:assert/strict';
import { upgradeUrl as u, largestFromSrcset, isImageLink, skipHost } from '../src/zoom-url.js';
const cases = [
  ['https://pbs.twimg.com/media/GaBc123?format=jpg&name=small', 'https://pbs.twimg.com/media/GaBc123?format=jpg&name=orig'],
  ['https://pbs.twimg.com/media/GaBc123?format=png&name=900x900', 'https://pbs.twimg.com/media/GaBc123?format=png&name=orig'],
  ['https://pbs.twimg.com/media/GaBc123.webp', 'https://pbs.twimg.com/media/GaBc123?format=webp&name=orig'],
  ['https://pbs.twimg.com/profile_images/1234/abcD_normal.jpg', 'https://pbs.twimg.com/profile_images/1234/abcD.jpg'],
  ['https://pbs.twimg.com/profile_images/1234/abcD_x96.png', 'https://pbs.twimg.com/profile_images/1234/abcD.png'],
  ['https://pbs.twimg.com/ext_tw_video_thumb/1/pu/img/xyz.jpg', 'https://pbs.twimg.com/ext_tw_video_thumb/1/pu/img/xyz?format=jpg&name=orig'],
  ['https://pbs.twimg.com/card_img/1/abc?format=jpg&name=600x314', 'https://pbs.twimg.com/card_img/1/abc?format=jpg&name=large'],
  ['https://preview.redd.it/abc123xyz.jpg?width=640&crop=smart&auto=webp&s=deadbeef', 'https://i.redd.it/abc123xyz.jpg'],
  ['https://i.imgur.com/AbCdEfGm.jpg', 'https://i.imgur.com/AbCdEfG.jpg'],
  ['https://i.imgur.com/AbCdEfG.jpg', null],
  ['https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Some_File.jpg/320px-Some_File.jpg', 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Some_File.jpg'],
  ['https://upload.wikimedia.org/wikipedia/en/thumb/1/12/X.png/220px-X.png', 'https://upload.wikimedia.org/wikipedia/en/1/12/X.png'],
  ['https://abs.twimg.com/emoji/v2/svg/1f600.svg', null],
  ['https://example.com/a.jpg', null],
  ['not a url', null],
];
let fail = 0; const eq = (got, want, label) => { try { assert.equal(got, want); } catch (e) { fail++; console.log('FAIL', label, '=>', got, 'want', want); } };
for (const [i, want] of cases) eq(u(i), want, i);
eq(largestFromSrcset('a.jpg 320w, b.jpg 1024w, c.jpg 640w', 'https://ex.com/p/'), 'https://ex.com/p/b.jpg', 'srcset w');
eq(largestFromSrcset('a.jpg 1x, b.jpg 2x', 'https://ex.com/'), 'https://ex.com/b.jpg', 'srcset x');
eq(largestFromSrcset('https://cdn.ex.com/i.jpg?w=100,200 100w, https://cdn.ex.com/j.jpg 900w', 'https://ex.com/'), 'https://cdn.ex.com/j.jpg', 'srcset comma in url');
eq(isImageLink('https://ex.com/photo.PNG?x=1'), true, 'link png'); eq(isImageLink('https://ex.com/page.html'), false, 'link html');
eq(skipHost('https://i.pximg.net/img/1.jpg'), true, 'skip pixiv');
const n = cases.length + 6;
console.log(fail ? `zoom-url: ${fail} failed` : `zoom-url: ${n} passed`); process.exit(fail ? 1 : 0);
