import * as tf from '@tensorflow/tfjs';
import * as nsfw from 'nsfwjs';
let modelP=null,status='idle',backend='';
function getModel(){if(!modelP){status='loading';modelP=(async()=>{try{await tf.setBackend('webgl');}catch(e){await tf.setBackend('cpu');}await tf.ready();backend=tf.getBackend();const m=await nsfw.load('InceptionV3',{size:299});status='ready';return m;})().catch(e=>{status='error';modelP=null;throw e;});}return modelP;}
const loadImg=src=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>no(new Error('圖片解碼失敗'));i.src=src;});
let chain=Promise.resolve();
chrome.runtime.onMessage.addListener((m,s,send)=>{if(!m||m.target!=='offscreen')return;
 if(m.type==='status'){send({status,backend});return;}
 if(m.type==='warm'){getModel().catch(()=>{});send({status});return;}
 if(m.type==='run'){chain=chain.then(async()=>{try{const model=await getModel();const img=await loadImg(m.dataUrl);send({ok:true,preds:await model.classify(img)});}catch(e){send({ok:false,err:String(e&&e.message||e)});}});return true;}});
getModel().catch(()=>{});
