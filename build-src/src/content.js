let modelReady=false;
async function modelStatus(){try{const r=await chrome.runtime.sendMessage({type:'modelStatus'});modelReady=r&&r.status==='ready';return r&&r.status;}catch(e){return 'error';}}
async function classifyData(dataUrl){const r=await chrome.runtime.sendMessage({type:'classify',dataUrl});if(!r||!r.ok)throw new Error(r&&r.err||'classify');modelReady=true;return r.preds;}
async function classifyEl(el,w,h){const k=Math.min(1,512/Math.max(w,h));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*k));c.height=Math.max(1,Math.round(h*k));c.getContext('2d').drawImage(el,0,0,c.width,c.height);return classifyData(c.toDataURL('image/jpeg',0.9));}
const IMG_T=0.5, VID_T=0.35, DAY=864e5;
function localCls(x){const t=x.kind==='video'?VID_T:IMG_T;return x.score==null?'unk':x.score>=0.8?'high':x.score>=t?'warn':'ok';}
function finalCls(x){const lc=localCls(x);const r=x.aiRisk;const rank={unk:0,ok:1,warn:2,high:3};let c=lc;if(r==='高')c='high';else if(r==='中'&&rank[lc]<2)c='warn';return {c,lc,up:c!==lc};}
let pending=[]; // {key,name,kind,score,el}
const memo=new Map();
function attEls(){return [...document.querySelectorAll('[data-testid="attachments"] img,[data-testid="attachments"] video')].filter(e=>!e.closest('#xnp-panel'));}
let syncT=null;function scheduleSync(){clearTimeout(syncT);syncT=setTimeout(syncAtt,400);}
function syncAtt(){if(!pending.length)return;const els=attEls();const before=pending.length;const now=Date.now();
 if(!els.length){pending=pending.filter(x=>now-x.t<6000);if(pending.length)scheduleSync();}
 else{pending=pending.filter(x=>!x.el||x.el.isConnected||els.length>=pending.length);
  const used=new Set(pending.map(x=>x.el).filter(e=>e&&e.isConnected));const free=els.filter(e=>!used.has(e));
  for(const x of pending)if(!x.el||!x.el.isConnected){x.el=free.shift()||null;}
  if(els.length<pending.length){const unb=pending.filter(x=>!x.el&&now-x.t>6000);pending=pending.filter(x=>!unb.includes(x));}}
 if(pending.length!==before){if(panel&&panel.style.display!=='none')render();}}
new MutationObserver(()=>{if(pending.length)scheduleSync();}).observe(document.documentElement,{childList:true,subtree:true});
const risk=p=>{const g=k=>(p.find(x=>x.className===k)||{}).probability||0;return Math.min(1,g('Porn')+g('Hentai')+0.6*g('Sexy'));};
const fmt=s=>(s*100).toFixed(0)+'%';
let panel;
function ui(){if(panel)return panel;panel=document.createElement('div');panel.id='xnp-panel';document.documentElement.appendChild(panel);return panel;}
async function stats(){const {log=[]}=await chrome.storage.local.get('log');const now=Date.now();const day=log.filter(e=>now-e.ts<DAY);return {log,day,mediaDay:day.length,flagDay:day.filter(e=>e.flag).length,last5:log.slice(-5).filter(e=>e.high).length};}
async function render(msg){const p=ui();const s=await stats();let lv='ok';
 const items=pending.map(x=>{const {c,lc,up}=finalCls(x);if(c==='high'||c==='warn')lv=c==='high'?'high':(lv==='high'?'high':'warn');const L={ok:'正常',warn:'疑似',high:'高風險',unk:'無法判斷'};return `<li class="${c}">${x.kind==='video'?'影片':'圖片'} ${x.name.slice(0,24)}：${up?`${L[c]}（AI 升級，本機 ${x.score==null?'無法判斷':L[lc]+' '+fmt(x.score)}）`:(x.score==null?'無法判斷':L[c]+' '+fmt(x.score))}${x.note?'（'+x.note+'）':''} <button class="xnp-ask" data-i="${pending.indexOf(x)}">問 AI</button>${x.ai?renderAI(x,pending.indexOf(x)):''}</li>`;}).join('');
 const flagNow=pending.some(x=>['warn','high'].includes(finalCls(x).c));
 let w=[];if(s.flagDay>=2)w.push(`24 小時內已發 ${s.flagDay} 則疑似媒體，第 3 則可能讓帳號被標記 7 天`+(flagNow?'，這則也疑似！':''));else if(s.flagDay===1&&flagNow)w.push('發出這則後，24 小時內疑似媒體就有 2 則，再一則可能觸發帳號標記');
 if(s.last5>=2&&pending.some(x=>finalCls(x).c==='high'))w.push(`最近 5 則已有 ${s.last5} 則高風險，這則再發就到 3/5`);
 if(w.length)lv='high';
 p.className='lv-'+lv;p.innerHTML=`<b>發文前敏感媒體預檢</b><span id="xnp-x" title="關閉並清空">✕</span><button id="xnp-clr" class="xnp-fold" style="margin-right:6px">清空</button>${msg?`<div>${msg}</div>`:''}<ul>${items||'<li>尚未偵測到附加媒體</li>'}</ul>${w.map(x=>`<div class="w">⚠ ${x}</div>`).join('')}<div class="s">24h 媒體貼文 ${s.mediaDay} 則，其中疑似 ${s.flagDay} 則；最近 5 則高風險 ${s.last5} 則</div><div class="n">本機開源模型（NSFWJS）估計，不是 X 的模型，僅供參考</div>`;
 p.querySelectorAll('.xnp-ask').forEach(b=>b.onclick=()=>askAI(pending[+b.dataset.i]));p.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{const x=pending[+b.dataset.i];if(!x)return;if(b.dataset.act==='fold')x.aiFold=!x.aiFold;else x.aiAll=!x.aiAll;render();});p.querySelector('#xnp-x').onclick=()=>{pending=[];p.style.display='none';};p.querySelector('#xnp-clr').onclick=()=>{pending=[];render();};p.style.display='block';}
function loadImg(src){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src;});}
async function scanImage(file){const url=URL.createObjectURL(file);try{const img=await loadImg(url);return risk(await classifyEl(img,img.naturalWidth,img.naturalHeight));}finally{URL.revokeObjectURL(url);}}
async function scanVideo(file){const url=URL.createObjectURL(file);const v=document.createElement('video');v.muted=true;v.src=url;try{await new Promise((ok,no)=>{v.onloadeddata=ok;v.onerror=no;setTimeout(()=>no('timeout'),15000);});const d=v.duration||1;let max=0;
 for(const f of [0.1,0.3,0.5,0.7,0.9]){v.currentTime=d*f;await new Promise(r=>{v.onseeked=r;setTimeout(r,4000);});max=Math.max(max,risk(await classifyEl(v,v.videoWidth,v.videoHeight)));}return max;}finally{URL.revokeObjectURL(url);}}
async function handle(files){files=[...files].filter(f=>/^(image|video)\//.test(f.type));if(!files.length)return;
 for(const f of files){const key=[f.name,f.size,f.lastModified,f.type].join('|');if(pending.some(x=>x.key===key))continue;let e=memo.get(key);if(e){e.el=null;e.t=Date.now();pending.push(e);scheduleSync();await render();continue;}e={f,key,t:Date.now(),name:f.name||'貼上',kind:f.type.startsWith('video')?'video':'image',score:null};memo.set(key,e);if(memo.size>50)memo.delete(memo.keys().next().value);pending.push(e);scheduleSync();await render(modelReady?'掃描中…':((await modelStatus())==='ready'?'掃描中…':'模型載入中…（第一次約 10–30 秒，之後所有分頁共用）'));
  try{e.score=e.kind==='video'?await scanVideo(f):(f.type==='image/gif'?await scanVideo(f).catch(()=>scanImage(f)):await scanImage(f));if(e.kind==='video')e.note='抽 5 格取最高';}catch(err){e.note='讀取失敗';}
  await render();}}
document.addEventListener('change',e=>{const t=e.target;if(t instanceof HTMLInputElement&&t.type==='file'&&t.files)handle(t.files);},true);
document.addEventListener('paste',e=>{if(e.clipboardData?.files?.length)handle(e.clipboardData.files);},true);
document.addEventListener('drop',e=>{if(e.dataTransfer?.files?.length)handle(e.dataTransfer.files);},true);
document.addEventListener('click',async e=>{const b=e.target.closest?.('[data-testid="tweetButton"],[data-testid="tweetButtonInline"]');if(!b||!pending.length)return;
 const fc=pending.map(x=>finalCls(x).c);const flag=fc.some(c=>c==='warn'||c==='high');const high=fc.includes('high');
 const {log=[]}=await chrome.storage.local.get('log');log.push({ts:Date.now(),flag,high,n:pending.length});await chrome.storage.local.set({log:log.filter(x=>Date.now()-x.ts<30*DAY).slice(-200)});pending=[];render('已記錄這則貼文');},true);
chrome.runtime.onMessage.addListener(m=>{if(m==='show')render();});
// ---- 時間軸掃描 (v0.2, v0.5.3 修正) ----
let tlOn=false;const cache=new Map();const queue=[];let busy=false;const seen=new WeakMap();
const dbg=(...a)=>console.debug('[xnp]',...a);
const lvl=s=>s>=0.8?['high','高風險']:s>=IMG_T?['warn','疑似']:['ok','正常'];
const MEDIA_RE=/^https:\/\/pbs\.twimg\.com\/(media|ext_tw_video_thumb|amplify_video_thumb|tweet_video_thumb)\//;
const SEL='img[src*="pbs.twimg.com/"],video[poster*="pbs.twimg.com/"]';
function normUrl(u){try{const x=new URL(u);if(x.pathname.startsWith('/media/'))x.searchParams.set('name','small');return x.toString();}catch(e){return u;}}
function srcOf(el){return el.tagName==='VIDEO'?el.poster:(el.currentSrc||el.src||el.getAttribute('src')||'');}
function inScope(el){return !!el.closest('article,[data-testid="tweetPhoto"],[data-testid="videoPlayer"],[data-testid="videoComponent"]')&&!el.closest('#xnp-panel,[data-testid="attachments"]');}
function badge(img,txt,cls,title){const host=img.closest('[data-testid="tweetPhoto"],[data-testid="videoPlayer"],[data-testid="videoComponent"],a')||img.parentElement;if(!host)return;let b=host.querySelector(':scope > .xnp-badge');if(!b){b=document.createElement('div');if(getComputedStyle(host).position==='static')host.style.position='relative';host.appendChild(b);}b.className='xnp-badge '+cls;b.textContent=txt;b.title=title||'';}
async function pump(){if(busy)return;busy=true;try{while(queue.length&&tlOn){const {el,url}=queue.shift();if(!el.isConnected)continue;
 try{let s=cache.get(url);if(s===undefined){badge(el,'掃描中…','unk');if(!modelReady&&(await modelStatus())!=='ready')badge(el,'模型載入中…','unk');dbg('classifyUrl',url);const r=await chrome.runtime.sendMessage({type:'classifyUrl',url});if(!r||!r.ok)throw new Error(r&&r.err||'背景沒有回應');modelReady=true;s=risk(r.preds);cache.set(url,s);if(cache.size>2000)cache.delete(cache.keys().next().value);}
  const [c,t]=lvl(s);badge(el,`${t} ${fmt(s)}`,c,url);dbg('score',url,s);}catch(e){const why=String(e&&e.message||e);dbg('error',url,why);badge(el,'無法判斷','unk','原因：'+why);}}}finally{busy=false;}}
function enqueue(el){const src=srcOf(el);if(!MEDIA_RE.test(src))return;const url=normUrl(src);if(queue.some(q=>q.el===el&&q.url===url))return;queue.push({el,url});badge(el,cache.has(url)?'…':'排隊中…','unk');dbg('queued',url);pump();}
const io=new IntersectionObserver(es=>{for(const e of es){if(!e.isIntersecting)continue;io.unobserve(e.target);enqueue(e.target);}},{threshold:0,rootMargin:'200px 0px'});
function consider(el){if(!tlOn||!(el instanceof Element)||!el.matches(SEL)||!inScope(el))return;const src=srcOf(el);if(!MEDIA_RE.test(src))return;if(seen.get(el)===src)return;seen.set(el,src);io.unobserve(el);io.observe(el);}
function collect(root){if(!tlOn||!root||root.nodeType!==1&&root.nodeType!==9)return;if(root.nodeType===1)consider(root);root.querySelectorAll(SEL).forEach(consider);}
const mo=new MutationObserver(ms=>{for(const m of ms){if(m.type==='attributes')consider(m.target);else for(const n of m.addedNodes)if(n.nodeType===1)collect(n);}});
function setTl(on){tlOn=!!on;dbg('timeline scan',tlOn);if(tlOn){collect(document);mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','poster']});}else{mo.disconnect();queue.length=0;document.querySelectorAll('.xnp-badge').forEach(b=>b.remove());}}
chrome.storage.local.get('scanTimeline').then(r=>setTl(r.scanTimeline)).catch(e=>dbg('storage error',e));
chrome.storage.onChanged.addListener((c,area)=>{if(area==='local'&&c.scanTimeline)setTl(c.scanTimeline.newValue);});

// ---- 問 AI (v0.4) ----
function esc(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toJpeg(src,w,h){const k=Math.min(1,768/Math.max(w,h));const c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h*k);c.getContext('2d').drawImage(src,0,0,c.width,c.height);return c.toDataURL('image/jpeg',0.85);}
async function mediaJpeg(f){const url=URL.createObjectURL(f);try{if(f.type.startsWith('video')||f.type==='image/gif'){const v=document.createElement('video');v.muted=true;v.src=url;try{await new Promise((ok,no)=>{v.onloadeddata=ok;v.onerror=no;setTimeout(()=>no('timeout'),15000);});v.currentTime=(v.duration||1)*0.5;await new Promise(r=>{v.onseeked=r;setTimeout(r,4000);});return toJpeg(v,v.videoWidth,v.videoHeight);}catch(e){if(f.type!=='image/gif')throw e;}}
 const im=await loadImg(url);return toJpeg(im,im.naturalWidth,im.naturalHeight);}finally{URL.revokeObjectURL(url);}}
async function askAI(x){if(!x||x.asking)return;x.asking=true;x.ai='詢問中…';render();
 try{const d=await mediaJpeg(x.f);const r=await chrome.runtime.sendMessage({type:'ask',dataUrl:d,kind:x.kind});x.aiErr=!(r&&r.ok);x.aiRisk=null;if(r&&r.ok){const j=parseAI(r.text);if(j&&['低','中','高'].includes(j.risk))x.aiRisk=j.risk;}x.aiFold=false;x.ai=r&&r.ok?r.text:('無法取得回答：'+(r&&r.err||'未知錯誤'));}catch(e){x.aiErr=true;x.ai='無法處理這個檔案：'+(e&&e.message||e);}
 x.asking=false;render();}

function parseAI(t){try{const m=String(t).match(/\{[\s\S]*\}/);const j=JSON.parse(m?m[0]:t);if(j&&j.risk)return j;}catch(e){}return null;}
function plainAI(t){return esc(String(t).split('\n').filter(l=>!/^\s*\|?\s*:?-{2,}/.test(l)).map(l=>l.replace(/^\s*\|/,'').replace(/\|\s*$/,'').replace(/\s*\|\s*/g,'：').replace(/[*#`]/g,'').trim()).filter(Boolean).join('\n')).replace(/\n/g,'<br>');}
function renderAI(x,i){const head=`<div class="xnp-aih"><button data-act="fold" data-i="${i}" class="xnp-fold">${x.aiFold?'展開':'收合'}</button>AI 判斷</div>`;
 if(x.asking||x.aiErr)return `<div class="xnp-ai">${esc(x.ai)}</div>`;
 if(x.aiFold)return `<div class="xnp-ai">${head}</div>`;
 const j=parseAI(x.ai);if(!j)return `<div class="xnp-ai">${head}<div class="xnp-aib">${plainAI(x.ai)}</div></div>`;
 const rc={'低':'lo','中':'mid','高':'hi'}[j.risk]||'mid';const lc=l=>l==='有'?'hi':l==='輕微'?'mid':'lo';
 const fs=(Array.isArray(j.factors)?j.factors:[]);const shown=x.aiAll?fs:fs.filter(f=>f.level&&f.level!=='無');
 return `<div class="xnp-ai">${head}<div class="xnp-aib"><div><span class="xnp-pill ${rc}">風險 ${esc(j.risk)}</span> ${esc(j.verdict||'')}</div>
 <div class="xnp-grid">${shown.map(f=>`<div><span class="xnp-dot ${lc(f.level)}"></span>${esc(f.name||'')}・${esc(f.level||'')}</div><div class="xnp-fn">${esc(f.note||'')}</div>`).join('')||'<div>各項都是「無」</div><div></div>'}</div>
 ${fs.length?`<button data-act="all" data-i="${i}" class="xnp-fold">${x.aiAll?'只看有問題的':'顯示全部'}</button>`:''}
 ${Array.isArray(j.suggestions)&&j.suggestions.length?`<ul class="xnp-sug">${j.suggestions.slice(0,3).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}</div></div>`;}
