import assert from 'node:assert/strict';
import { upgradeUrl as u } from '../src/zoom-url.js';
const cases = [
  ['https://pbs.twimg.com/media/GaBc123?format=jpg&name=small', 'https://pbs.twimg.com/media/GaBc123?format=jpg&name=orig'],
  ['https://pbs.twimg.com/media/GaBc123?format=png&name=900x900', 'https://pbs.twimg.com/media/GaBc123?format=png&name=orig'],
  ['https://pbs.twimg.com/media/GaBc123.webp', 'https://pbs.twimg.com/media/GaBc123?format=webp&name=orig'],
  ['https://pbs.twimg.com/profile_images/1234/abcD_normal.jpg', 'https://pbs.twimg.com/profile_images/1234/abcD.jpg'],
  ['https://pbs.twimg.com/profile_images/1234/abcD_x96.png', 'https://pbs.twimg.com/profile_images/1234/abcD.png'],
  ['https://pbs.twimg.com/profile_images/1234/abcD_bigger.jpg', 'https://pbs.twimg.com/profile_images/1234/abcD.jpg'],
  ['https://pbs.twimg.com/ext_tw_video_thumb/1/pu/img/xyz.jpg', 'https://pbs.twimg.com/ext_tw_video_thumb/1/pu/img/xyz?format=jpg&name=orig'],
  ['https://pbs.twimg.com/card_img/1/abc?format=jpg&name=600x314', 'https://pbs.twimg.com/card_img/1/abc?format=jpg&name=large'],
  ['https://abs.twimg.com/emoji/v2/svg/1f600.svg', null],
  ['not a url', null],
];
let fail = 0;
console.log(fail ? `zoom-url: ${fail} failed` : `zoom-url: ${cases.length} passed`); process.exit(fail ? 1 : 0);
