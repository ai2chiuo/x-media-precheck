const $=id=>document.getElementById(id);
const hz=$('hz');chrome.storage.local.get('hoverZoom').then(r=>{hz.checked=r.hoverZoom!==false;});hz.onchange=()=>chrome.storage.local.set({hoverZoom:hz.checked});
const zd=$('zd');chrome.storage.local.get('zoomDisabledSites').then(r=>{zd.value=r.zoomDisabledSites||'';});$('zds').onclick=async()=>{await chrome.storage.local.set({zoomDisabledSites:zd.value.trim()});$('zdok').textContent='已儲存';};
