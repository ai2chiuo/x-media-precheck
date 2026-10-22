const DAY=864e5,DEF='gpt-4.1-mini-2025-04-14',$=id=>document.getElementById(id);
async function stats(){const {log=[]}=await chrome.storage.local.get('log');const d=log.filter(e=>Date.now()-e.ts<DAY);$('s').innerHTML=`24 小時內媒體貼文：${d.length} 則<br>其中疑似成人內容：${d.filter(e=>e.flag).length} 則（到 2 則就警告）<br>最近 5 則高風險：${log.slice(-5).filter(e=>e.high).length} 則`;}
stats();
let armed=false;$('c').onclick=async()=>{if(!armed){armed=true;$('c').textContent='再按一次確認清除';setTimeout(()=>{armed=false;$('c').textContent='清除 24h 發文計數';},3000);return;}armed=false;await chrome.storage.local.set({log:[]});$('c').textContent='清除 24h 發文計數';stats();};
const tl=$('tl');tl.onchange=()=>chrome.storage.local.set({scanTimeline:tl.checked});
const k=$('k'),ms=$('ms'),mc=$('mc');
const mask=v=>'已儲存（'+v.slice(0,3)+'…'+v.slice(-4)+'）';
const showCustom=()=>{mc.style.display=ms.value==='__custom'?'block':'none';};
ms.onchange=showCustom;
chrome.storage.local.get(['openaiKey','openaiModel','scanTimeline']).then(r=>{tl.checked=!!r.scanTimeline;if(r.openaiKey)k.placeholder=mask(r.openaiKey);const m=r.openaiModel||DEF;
 if([...ms.options].some(o=>o.value===m&&m!=='__custom'))ms.value=m;else{ms.value='__custom';mc.value=m;}showCustom();});
$('sv').onclick=async()=>{const model=ms.value==='__custom'?(mc.value.trim()||DEF):ms.value;const o={openaiModel:model};if(k.value.trim())o.openaiKey=k.value.trim();await chrome.storage.local.set(o);k.value='';if(o.openaiKey)k.placeholder=mask(o.openaiKey);$('ok').textContent='已儲存：'+model;};
const hz=$('hz');chrome.storage.local.get('hoverZoom').then(r=>{hz.checked=r.hoverZoom!==false;});hz.onchange=()=>chrome.storage.local.set({hoverZoom:hz.checked});
const zd=$('zd');chrome.storage.local.get('zoomDisabledSites').then(r=>{zd.value=r.zoomDisabledSites||'';});$('zds').onclick=async()=>{await chrome.storage.local.set({zoomDisabledSites:zd.value.trim()});$('zdok').textContent='已儲存';};
