const {JSDOM}=require('jsdom');const fs=require('fs');const code=fs.readFileSync(process.argv[2]||require('path').join(__dirname,'../../extension/content.js'),'utf8');
function setup(){const dom=new JSDOM(`<body><div role="dialog" id="compose"><div data-testid="tweetTextarea_0" contenteditable></div><div id="slot"></div><input type="file" id="f"></div></body>`,{runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;
w.IntersectionObserver=class{observe(){}unobserve(){}};w.URL.createObjectURL=()=>'blob:x';w.URL.revokeObjectURL=()=>{};
w.chrome={storage:{local:{get:async()=>({}),set:async()=>{}},onChanged:{addListener(){}}},runtime:{onMessage:{addListener(){}},sendMessage:async m=>m.type==='modelStatus'?{status:'ready'}:{ok:true,preds:[{className:'Neutral',probability:1}]}}};
w.console.debug=()=>{};w.eval(code);return w;}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function att(w){const d=w.document.createElement('div');d.setAttribute('data-testid','attachments');d.innerHTML='<img src="blob:https://x.com/abc-123">';w.document.getElementById('slot').appendChild(d);return d;}
async function addFile(w){const f=new w.File(['x'],'a.png',{type:'image/png',lastModified:1});const inp=w.document.getElementById('f');Object.defineProperty(inp,'files',{value:[f]});inp.dispatchEvent(new w.Event('change',{bubbles:true}));}
const count=w=>w.document.querySelectorAll('#xnp-panel li .xnp-ask').length;
(async()=>{
 let w=setup();let a=att(w);await addFile(w);await sleep(6500);const c0=count(w);
 a.remove();await sleep(300);att(w);await sleep(2500);console.log('T1 remount<500ms keep:',c0,'->',count(w));
 w=setup();a=att(w);await addFile(w);await sleep(6500);a.remove();const dlg=w.document.createElement('div');dlg.setAttribute('role','dialog');dlg.textContent='內容揭露';w.document.body.appendChild(dlg);await sleep(3000);console.log('T2 disclosure dialog 3s keep:',count(w));dlg.remove();att(w);await sleep(2000);console.log('T2b after close:',count(w));
 w=setup();a=att(w);await addFile(w);await sleep(800);a.remove();await sleep(2600);console.log('T3 real removal -> 0:',count(w));
 process.exit(0);})();
