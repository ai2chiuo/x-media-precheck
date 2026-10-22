// 把 X 圖片網址升級成原圖（hover zoom 用）
export function upgradeUrl(u){
  let x;try{x=new URL(u);}catch(e){return null;}
  if(x.hostname!=='pbs.twimg.com')return null;
  const p=x.pathname;
  if(p.startsWith('/profile_images/')){x.pathname=p.replace(/_(normal|bigger|mini|x96|200x200|400x400)(\.[a-z]+)$/i,'$2');x.search='';return x.toString();}
  if(p.startsWith('/profile_banners/')){x.pathname=p.replace(/\/\d+x\d+$/,'/1500x500');return x.toString();}
  if(/^\/(media|ext_tw_video_thumb|amplify_video_thumb|tweet_video_thumb|card_img)\//.test(p)){
    const m=p.match(/\.(jpg|jpeg|png|webp|gif)$/i);
    if(m){x.pathname=p.slice(0,-m[0].length);if(!x.searchParams.get('format'))x.searchParams.set('format',m[1].toLowerCase());}
    x.searchParams.set('name',p.startsWith('/card_img/')?'large':'orig');
    return x.toString();}
  return null;}
