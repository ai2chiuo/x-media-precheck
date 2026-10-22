// 共用模型：offscreen 文件載入一次，所有分頁共用
let creating=null;
async function hasDoc(){if(chrome.runtime.getContexts){const c=await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT']});return c.length>0;}return chrome.offscreen.hasDocument?chrome.offscreen.hasDocument():false;}
async function ensureOffscreen(){if(await hasDoc())return;if(!creating)creating=chrome.offscreen.createDocument({url:'offscreen.html',reasons:['BLOBS'],justification:'在本機執行 NSFWJS 模型，讓所有分頁共用同一份已載入的模型'}).catch(e=>{if(!/single offscreen|already/i.test(String(e)))throw e;}).finally(()=>{creating=null;});await creating;}
async function toOff(msg,tries=2){for(let i=0;i<tries;i++){try{await ensureOffscreen();const r=await chrome.runtime.sendMessage({...msg,target:'offscreen'});if(r!==undefined)return r;}catch(e){if(i===tries-1)throw e;}await new Promise(r=>setTimeout(r,300));}throw new Error('offscreen 無回應');}
async function fetchDataUrl(u){const r=await fetch(u,{credentials:'omit'});if(!r.ok)throw new Error('HTTP '+r.status);const b=await r.blob();if(b.size>15e6)throw new Error('too big');const buf=new Uint8Array(await b.arrayBuffer());let bin='';for(let i=0;i<buf.length;i+=0x8000)bin+=String.fromCharCode.apply(null,buf.subarray(i,i+0x8000));return `data:${b.type||'image/jpeg'};base64,${btoa(bin)}`;}
chrome.runtime.onMessage.addListener((m,s,send)=>{if(!m||m.target)return;
 if(m.type==='modelStatus'){toOff({type:'status'}).then(r=>send(r)).catch(()=>send({status:'loading'}));return true;}
 if(m.type==='classify'){if(!/^data:image\//.test(String(m.dataUrl))){send({ok:false,err:'格式錯誤'});return;}toOff({type:'run',dataUrl:m.dataUrl}).then(send).catch(e=>send({ok:false,err:String(e)}));return true;}
 if(m.type==='classifyUrl'){const u=String(m.url);if(!/^https:\/\/pbs\.twimg\.com\//.test(u)){send({ok:false,err:'blocked'});return;}fetchDataUrl(u).then(d=>toOff({type:'run',dataUrl:d})).then(send).catch(e=>send({ok:false,err:String(e)}));return true;}});
chrome.runtime.onStartup&&chrome.runtime.onStartup.addListener(()=>{});
const PROMPT=`你是協助判斷 X（Twitter）內容審查風險的助理。請看這張{K}，判斷 X 的自動系統是否可能把它標成敏感／成人內容或限制推薦給非追蹤者。
依使用者經驗，單純露腿或露背通常沒問題；請把重點放在身體曲線強調、透視或緊身布料、暗示性構圖。
只輸出 JSON，不要其他文字，格式：
{"risk":"低|中|高","verdict":"一句話結論（30 字內）","factors":[{"name":"裸露","level":"無|輕微|有","note":"15 字內"},{"name":"乳頭或生殖器",...},{"name":"性行為",...},{"name":"身體曲線強調",...},{"name":"緊身或透視衣物",...},{"name":"暗示性姿勢或場景",...}],"suggestions":["最多 3 條、每條 20 字內的具體修改建議"]}
factors 必須剛好這 6 項，全部用繁體中文。`;
chrome.runtime.onMessage.addListener((m,s,send)=>{if(!m||m.type!=='ask')return;
 (async()=>{const {openaiKey:key,openaiModel:model='gpt-4.1-mini-2025-04-14'}=await chrome.storage.local.get(['openaiKey','openaiModel']);
  if(!key)return send({ok:false,err:'尚未在工具列彈窗設定 OpenAI API 金鑰'});
  if(!/^data:image\/jpeg;base64,/.test(String(m.dataUrl)))return send({ok:false,err:'圖片格式錯誤'});
  const reasoning=/^(gpt-5|o1|o3|o4)/i.test(model);
  let noJson=false;const call=effort=>{const body={model,max_completion_tokens:reasoning?4000:1200,response_format:{type:'json_object'},messages:[{role:'user',content:[{type:'text',text:PROMPT.replace('{K}',m.kind==='video'?'影片截圖':'圖片')},{type:'image_url',image_url:{url:m.dataUrl,detail:'low'}}]}]};if(effort)body.reasoning_effort=effort;if(noJson)delete body.response_format;return fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},body:JSON.stringify(body)});};
  try{let r=await call(reasoning?'minimal':null);let j=await r.json().catch(()=>({}));
   if(!r.ok&&reasoning&&r.status===400&&/reasoning|minimal/i.test(j.error&&j.error.message||'')){r=await call('low');j=await r.json().catch(()=>({}));}
   if(!r.ok&&r.status===400&&/response_format|json/i.test(j.error&&j.error.message||'')){noJson=true;r=await call(reasoning?'low':null);j=await r.json().catch(()=>({}));}
   if(!r.ok)return send({ok:false,err:`HTTP ${r.status}：${(j.error&&j.error.message||'').slice(0,200)}`});
   const c=j.choices&&j.choices[0];const msg=c&&c.message||{};
   if(msg.refusal)return send({ok:false,err:'模型拒絕回答：'+msg.refusal});
   if(!msg.content){if(c&&c.finish_reason==='length')return send({ok:false,err:'模型把字數額度都用在內部思考，沒寫出答案。建議在工具列彈窗改用 gpt-4.1-mini（推薦）再試一次。'});return send({ok:false,err:'模型沒有回傳內容（'+(c&&c.finish_reason||'未知')+'）'});}
   send({ok:true,text:msg.content});}catch(e){send({ok:false,err:'連線失敗'});}})();return true;});
