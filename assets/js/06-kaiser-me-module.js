(function(){
'use strict';
const $q=s=>document.querySelector(s),root=$q('#kme');
const LS=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(_){return d}};
const SS=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
const SOCIAL_LANG_KEY='kaiser-social-language';
const SOCIAL_LANGS=[['en-US','🇺🇸 English (United States)'],['en-CA','🇨🇦 English (Canada)'],['en-GB','🇬🇧 English (United Kingdom)'],['km','🇰🇭 ភាសាខ្មែរ (Khmer)'],['th','🇹🇭 ภาษาไทย (Thai)'],['vi','🇻🇳 Tiếng Việt (Vietnamese)'],['zh-CN','🇨🇳 简体中文 (Chinese)'],['zh-TW','🇹🇼 繁體中文 (Traditional Chinese)'],['ja','🇯🇵 日本語 (Japanese)'],['ko','🇰🇷 한국어 (Korean)'],['fr','🇫🇷 Français (French)'],['es','🇪🇸 Español (Spanish)'],['de','🇩🇪 Deutsch (German)'],['id','🇮🇩 Bahasa Indonesia'],['fil','🇵🇭 Filipino'],['pt-BR','🇧🇷 Português (Brazil)'],['ar','🇸🇦 العربية (Arabic)'],['hi','🇮🇳 हिन्दी (Hindi)']];
const socialLanguage=()=>{const v=localStorage.getItem(SOCIAL_LANG_KEY)||'km';return v==='en'?'en-US':v};
/* Khmer strings are localized; remaining language packs currently use English fallback until their translations are added. */
const km=()=>socialLanguage()==='km';
const tr=(a,b)=>km()?a:b;
const tst=m=>{try{toast(m)}catch(_){}};
const E=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* ---- saved settings applied at start ---- */
const S=Object.assign({q:1080,fps:30},LS('kaiser-settings',{}));
try{if(typeof expShort!=='undefined')expShort=S.q;if(typeof expFps!=='undefined')expFps=S.fps}catch(_){}
/* ---- local account ---- */
let accounts=LS('kaiser-accounts',null);
if(!accounts){accounts=[];const old=LS('kaiser-account',null);if(old)accounts.push(old);SS('kaiser-accounts',accounts)}
let logged=LS('kaiser-logged',false),acc=accounts.find(a=>a.uid===LS('kaiser-current',null))||(logged?accounts[0]:null)||null;
if(!acc)logged=false;
function saveAcc(){if(!acc)return;const i=accounts.findIndex(a=>a.uid===acc.uid);if(i>=0)accounts[i]=acc;else accounts.push(acc);SS('kaiser-accounts',accounts);SS('kaiser-current',acc.uid)}
function setLogged(v){logged=!!v;SS('kaiser-logged',logged);if(logged&&acc)SS('kaiser-current',acc.uid);if(!logged)sessionStorage.removeItem(TOKEN_KEY)}
/* pure-JS SHA-256 so the same password gives the same hash in every browser context */
const SHA=(()=>{const K=[],H0=[];const isP=x=>{for(let i=2;i*i<=x;i++)if(x%i===0)return false;return true};
 for(let n=2;K.length<64;n++)if(isP(n)){K.push(Math.floor((Math.cbrt(n)%1)*4294967296)>>>0);if(H0.length<8)H0.push(Math.floor((Math.sqrt(n)%1)*4294967296)>>>0)}
 const rr=(x,n)=>(x>>>n)|(x<<(32-n));
 return str=>{const b=[...new TextEncoder().encode(str)],l=b.length*8;b.push(0x80);while(b.length%64!==56)b.push(0);for(let i=7;i>=0;i--)b.push(i>3?0:(l>>>(i*8))&255);
  const H=H0.slice(),w=new Array(64);
  for(let o=0;o<b.length;o+=64){for(let i=0;i<16;i++)w[i]=(b[o+i*4]<<24)|(b[o+i*4+1]<<16)|(b[o+i*4+2]<<8)|b[o+i*4+3];
   for(let i=16;i<64;i++){const s0=rr(w[i-15],7)^rr(w[i-15],18)^(w[i-15]>>>3),s1=rr(w[i-2],17)^rr(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0}
   let [a,b2,c,d,e,f,g2,h]=H;
   for(let i=0;i<64;i++){const S1=rr(e,6)^rr(e,11)^rr(e,25),ch=(e&f)^(~e&g2),t1=(h+S1+ch+K[i]+w[i])|0,S0=rr(a,2)^rr(a,13)^rr(a,22),mj=(a&b2)^(a&c)^(b2&c),t2=(S0+mj)|0;h=g2;g2=f;f=e;e=(d+t1)|0;d=c;c=b2;b2=a;a=(t1+t2)|0}
   H[0]=(H[0]+a)|0;H[1]=(H[1]+b2)|0;H[2]=(H[2]+c)|0;H[3]=(H[3]+d)|0;H[4]=(H[4]+e)|0;H[5]=(H[5]+f)|0;H[6]=(H[6]+g2)|0;H[7]=(H[7]+h)|0}
  return H.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('')}})();
window.__kaiserSha=SHA;
const legacyHash=p=>{let h=5381;for(const c of 'kaiser|'+p)h=((h<<5)+h+c.charCodeAt(0))>>>0;return 'f'+h};
async function hash(p){return SHA('kaiser|'+p)}
const pwOk=async(a,p)=>a.ph===SHA('kaiser|'+p)||a.ph===legacyHash(p)||(window.crypto&&crypto.subtle?a.ph===await (async()=>{try{const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('kaiser|'+p));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('')}catch(_){return null}})():false);
function shrink(file,size=256){return new Promise((res,rej)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),r=Math.max(size/im.width,size/im.height);x.drawImage(im,(size-im.width*r)/2,(size-im.height*r)/2,im.width*r,im.height*r);URL.revokeObjectURL(u);res(c.toDataURL('image/jpeg',.85))};im.onerror=()=>rej(new Error('image'));im.src=u})}
/* ---- IndexedDB community (stored on this phone) ---- */
let dbp=null;
const DB=()=>dbp||(dbp=new Promise((res,rej)=>{const r=indexedDB.open('kaiser-community',1);r.onupgradeneeded=()=>r.result.createObjectStore('posts',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
const tx=async(mode,fn)=>{const d=await DB();return new Promise((res,rej)=>{const t=d.transaction('posts',mode),s=t.objectStore('posts');const q=fn(s);t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)})};
const allPosts=async()=>((await tx('readonly',s=>s.getAll()))||[]).sort((a,b)=>b.ts-a.ts);
const putPost=p=>tx('readwrite',s=>s.put(p));
const delPost=id=>tx('readwrite',s=>s.delete(id));
const socialId=()=>('p'+(window.crypto&&crypto.randomUUID?crypto.randomUUID().replace(/-/g,''):Date.now().toString(36)+Math.random().toString(36).slice(2)));
const currentSocialUid=()=>logged&&acc&&acc.uid?String(acc.uid):'';
const likedByCurrentUser=p=>{const uid=currentSocialUid();return !!uid&&Array.isArray(p.likedBy)&&p.likedBy.includes(uid)};
const normalizeSocialPost=p=>{
 if(!p||typeof p!=='object')return p;
 if(!Array.isArray(p.likedBy))p.likedBy=[];
 if(!Array.isArray(p.comments))p.comments=[];
 p.likes=p.likedBy.length;
 return p;
};

const videoURL=p=>{if(p&&p.blob instanceof Blob){const u=URL.createObjectURL(p.blob);urls.push(u);return u}if(p&&typeof p.videoUrl==='string'){try{const u=new URL(p.videoUrl,cleanServerURL(cloudCfg().url));if(u.protocol==='https:'&&u.origin===new URL(cleanServerURL(cloudCfg().url)).origin)return u.href}catch(_){}}return ''};
/* ---- V6.3.27 server + cloud transport (backend is user-configured) ---- */
const CLOUD_KEY='kaiser-v6327-server',TOKEN_KEY='kaiser-v6327-token';
const cloudCfg=()=>{const c=LS(CLOUD_KEY,{url:''});return c&&typeof c.url==='string'?c:{url:''}};
function cleanServerURL(raw){let u;try{u=new URL(String(raw||'').trim())}catch(_){throw new Error(tr('Server URL មិនត្រឹមត្រូវ','Invalid server URL'))}if(u.username||u.password)throw new Error(tr('មិនអនុញ្ញាត URL ដែលមាន Username/Password','Server URL must not contain embedded credentials'));if(u.protocol!=='https:'&&!(u.protocol==='http:'&&['localhost','127.0.0.1','::1'].includes(u.hostname)))throw new Error(tr('ត្រូវប្រើ HTTPS (លើកលែង localhost)','Use HTTPS (except localhost)'));u.hash='';return u.toString().replace(/\/$/,'')}
function serverToken(){try{return sessionStorage.getItem(TOKEN_KEY)||''}catch(_){return ''}}
async function serverFetch(path,opts={}){const base=cleanServerURL(cloudCfg().url);if(!base)throw new Error(tr('សូមកំណត់ Server URL ជាមុន','Configure the server URL first'));if(!/^\/[a-z0-9/_-]+$/i.test(path))throw new Error('Invalid API path');const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),25000);try{const headers=new Headers(opts.headers||{});if(serverToken())headers.set('Authorization','Bearer '+serverToken());if(opts.json){headers.set('Content-Type','application/json');opts.body=JSON.stringify(opts.json)}const res=await fetch(base+path,{...opts,headers,signal:ctl.signal});let data={};try{data=await res.json()}catch(_){}if(!res.ok)throw new Error((data&&data.message)||('HTTP '+res.status));return data}finally{clearTimeout(timer)}}
async function cloudHealth(){return serverFetch('/api/health',{method:'GET'})}
async function cloudBackup(){if(!logged||!acc)throw new Error(tr('សូមចូលគណនីជាមុន','Log in first'));const posts=await allPosts(),items=[];for(const p of posts.filter(x=>x.uid===acc.uid)){items.push({id:p.id,caption:p.caption||'',ts:p.ts,likes:p.likes||0,comments:p.comments||[],video:p.blob||null})}const payload={profile:{uid:acc.uid,name:acc.name,email:acc.email,bio:acc.bio||'',avatar:acc.avatar||''},posts:items.map(x=>({id:x.id,caption:x.caption,ts:x.ts,likes:x.likes,comments:x.comments}))};const data=await serverFetch('/api/cloud/backup',{method:'POST',json:payload});let uploaded=0;for(const item of items){if(!item.video)continue;const fd=new FormData();fd.append('postId',item.id);fd.append('video',item.video,'kaiser-'+item.id+'.mp4');await serverFetch('/api/cloud/videos',{method:'POST',body:fd});uploaded++}return {data,posts:items.length,videos:uploaded}}
async function cloudRestore(){if(!logged||!acc)throw new Error(tr('សូមចូលគណនីជាមុន','Log in first'));const data=await serverFetch('/api/cloud/backup',{method:'GET'});if(!data||!Array.isArray(data.posts))throw new Error('Server response missing posts[]');let merged=0;for(const p of data.posts){if(!p||!p.id)continue;const existing=(await allPosts()).find(x=>x.id===p.id);if(!existing){/* metadata-only restore; videos require a signed download URL */await putPost({id:String(p.id),uid:acc.uid,author:acc.name,caption:String(p.caption||''),ts:Number(p.ts)||Date.now(),likes:Number(p.likes)||0,likedBy:[],comments:Array.isArray(p.comments)?p.comments.map(c=>({...c,uid:c&&c.uid?String(c.uid):''})):[],blob:null,cloudOnly:true,videoUrl:typeof p.videoUrl==='string'?p.videoUrl:''});merged++}}return {merged,data}}

/* ---- shell ---- */
let view='home',urls=[];
const clearUrls=()=>{urls.forEach(u=>URL.revokeObjectURL(u));urls=[]};
function open(v='home'){root.classList.add('open');go(v)}
function close(){clearUrls();root.querySelectorAll('video').forEach(v=>v.pause());root.classList.remove('open','social-front');root.innerHTML=''}
function shell(title,back){root.innerHTML='';clearUrls();const h=E('div','kh'),b=E('button','kb','‹');b.onclick=back||(()=>view==='home'?close():go('home'));h.append(b,E('b','',esc(title)));root.appendChild(h);const s=E('div','ks');root.appendChild(s);return s}
function avatar(size){const a=E('div','av');if(size)a.style.cssText='width:'+size+'px;height:'+size+'px';if(logged&&acc){if(acc.avatar){const i=new Image();i.src=acc.avatar;a.appendChild(i)}else a.textContent=(acc.name||'?').trim().charAt(0).toUpperCase()}else a.textContent='👤';return a}
function go(v){view=v;({home,profile,settings,auth,edit,feed,post,search,notifs})[v]()}
/* ---- V6.3.33 social helpers: follow, views, thumbnails, search, notifications ---- */
const FOLLOW_KEY='kaiser-follows',VIEW_KEY='kaiser-views',THUMB_KEY='kaiser-thumbs',SEEN_KEY='kaiser-notif-seen',LIKESEEN_KEY='kaiser-like-seen';
const meKey=()=>currentSocialUid()||'guest';
const followsOf=()=>{const m=LS(FOLLOW_KEY,{});return Array.isArray(m[meKey()])?m[meKey()]:[]};
const isFollowing=uid=>!!uid&&followsOf().includes(String(uid));
function toggleFollow(uid){
 if(!uid)return null;if(!currentSocialUid()){tst(tr('សូមចូលគណនីដើម្បីតាមដាន','Log in to follow creators'));return null}
 if(String(uid)===currentSocialUid())return null;
 const m=LS(FOLLOW_KEY,{}),k=meKey(),a=new Set(m[k]||[]);let on;
 if(a.has(String(uid))){a.delete(String(uid));on=false}else{a.add(String(uid));on=true}
 m[k]=[...a];SS(FOLLOW_KEY,m);return on}
const viewsOf=p=>(LS(VIEW_KEY,{})[p.id]||0);
function addView(p){const m=LS(VIEW_KEY,{});m[p.id]=(m[p.id]||0)+1;SS(VIEW_KEY,m)}
const scoreOf=p=>{const ageH=Math.max(0,(Date.now()-(p.ts||0))/36e5);return ((p.likedBy||[]).length*3+(p.comments||[]).length*2+viewsOf(p)*.5+1)/(1+ageH/72)};
const popOf=p=>(p.likedBy||[]).length*3+(p.comments||[]).length*2+viewsOf(p);
const hashtagsOf=t=>(String(t||'').match(/#[\p{L}\p{N}_]+/gu)||[]).slice(0,6);
const fmtN=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);
const ago=ts=>{const m=Math.max(0,(Date.now()-ts)/6e4);if(m<1)return tr('ឥឡូវ','now');if(m<60)return Math.round(m)+tr(' នាទី','m');if(m<1440)return Math.round(m/60)+tr(' ម៉ោង','h');return Math.round(m/1440)+tr(' ថ្ងៃ','d')};
let thumbs=LS(THUMB_KEY,{}),thumbQ=Promise.resolve();
const saveThumbs=()=>{const k=Object.keys(thumbs);if(k.length>60)k.slice(0,k.length-60).forEach(x=>delete thumbs[x]);SS(THUMB_KEY,thumbs)};
function makeThumb(p){
 if(thumbs[p.id])return Promise.resolve(thumbs[p.id]);
 if(!(p.blob instanceof Blob))return Promise.resolve('');
 thumbQ=thumbQ.then(()=>new Promise(res=>{
  const v=document.createElement('video'),u=URL.createObjectURL(p.blob);let done=false;
  const fin=d=>{if(done)return;done=true;try{URL.revokeObjectURL(u);v.removeAttribute('src');v.load()}catch(_){}if(d){thumbs[p.id]=d;saveThumbs()}res(d||'')};
  v.muted=true;v.playsInline=true;v.preload='auto';
  v.onloadeddata=()=>{try{v.currentTime=Math.min(.6,(v.duration||1)/3)}catch(_){fin('')}};
  v.onseeked=()=>{try{const w=240,c=document.createElement('canvas');c.width=w;c.height=Math.round(w*((v.videoHeight||16)/(v.videoWidth||9)));c.getContext('2d').drawImage(v,0,0,c.width,c.height);fin(c.toDataURL('image/jpeg',.72))}catch(_){fin('')}};
  v.onerror=()=>fin('');setTimeout(()=>fin(''),7000);v.src=u})).catch(()=>'');
 return thumbQ}
function avatarOf(p,size){const a=E('span','kx-av');a.style.cssText='width:'+size+'px;height:'+size+'px;font-size:'+Math.round(size*.42)+'px';if(p.avatar){const i=new Image();i.src=p.avatar;i.alt='';a.appendChild(i)}else a.textContent=(p.author||'?').trim().charAt(0).toUpperCase();return a}
function lazyThumb(el,p){
 if(thumbs[p.id]){el.style.backgroundImage='url('+thumbs[p.id]+')';el.classList.add('ready');return}
 el.classList.add('kx-skel');
 const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();makeThumb(p).then(d=>{if(d){el.style.backgroundImage='url('+d+')'}el.classList.remove('kx-skel');el.classList.add('ready')})}},{rootMargin:'160px'});
 io.observe(el)}
function computeNotifs(posts){
 const me=currentSocialUid();if(!me)return {items:[],unread:0};
 const seen=LS(SEEN_KEY,{})[me]||0,ls=LS(LIKESEEN_KEY,{})[me]||{},items=[];let unread=0;
 posts.filter(p=>p.uid===me).forEach(p=>{
  (p.comments||[]).forEach(c=>{if(c.uid&&c.uid!==me){const isNew=(c.ts||0)>seen;if(isNew)unread++;items.push({kind:'comment',who:c.n||'User',text:c.t,ts:c.ts||p.ts,p,isNew})}});
  const others=(p.likedBy||[]).filter(u=>u!==me).length,prev=ls[p.id]||0;
  if(others>0){const isNew=others>prev;if(isNew)unread++;items.push({kind:'like',count:others,ts:p.ts,p,isNew})}});
 items.sort((a,b)=>b.ts-a.ts);return {items,unread}}
function markNotifsSeen(posts){
 const me=currentSocialUid();if(!me)return;
 const a=LS(SEEN_KEY,{});a[me]=Date.now();SS(SEEN_KEY,a);
 const l=LS(LIKESEEN_KEY,{}),m={};posts.filter(p=>p.uid===me).forEach(p=>{m[p.id]=(p.likedBy||[]).filter(u=>u!==me).length});l[me]=m;SS(LIKESEEN_KEY,l)}
let homeTab='forYou',feedFilter=null,feedStart=null,novaPillar='discover';
const openPost=(p,list)=>{feedStart=p.id;feedFilter=list||null;go('feed')};
function stat(ic,n){return '<span>'+ic+' '+fmtN(n)+'</span>'}
function postCard(p,wide){
 const c=E('button','kx-card'+(wide?' wide':''));c.type='button';
 const bg=E('div','kx-card-bg');c.appendChild(bg);
 if(p.blob instanceof Blob)lazyThumb(bg,p);else{bg.classList.add('cloud');bg.textContent='☁'}
 const top=E('div','kx-card-top');top.innerHTML=stat('❤',(p.likedBy||[]).length)+stat('👁',viewsOf(p));c.appendChild(top);
 c.appendChild(E('div','kx-card-play','▶'));
 const meta=E('div','kx-card-meta');const av=avatarOf(p,22);const tx=E('div','kx-card-tx');
 tx.innerHTML='<b>'+esc(p.caption||tr('វីដេអូ','Video'))+'</b><small>@'+esc(p.author||'KAISER')+' · '+ago(p.ts||Date.now())+'</small>';
 meta.append(av,tx);c.appendChild(meta);
 c.onclick=()=>openPost(p);return c}
function novaDiscoverBanner(){
 const b=E('section','kx-discover-banner');
 const img=E('img');img.src='https://commons.wikimedia.org/wiki/Special:FilePath/NASA-Apollo8-Dec24-Earthrise.jpg?width=1200';img.alt='Earthrise photographed by NASA during Apollo 8';img.loading='lazy';img.referrerPolicy='no-referrer';
 img.onerror=()=>{img.style.display='none'};
 const shade=E('div','kx-discover-shade');
 const body=E('div','kx-discover-copy');
 body.appendChild(E('small','','NOVA · EXPLORE THE WORLD'));
 body.appendChild(E('b','',tr('ពិភពលោកថ្មី ចាប់ផ្ដើមពីការចែករំលែក','A new world begins with sharing')));
 body.appendChild(E('span','',tr('ស្វែងយល់ពីរូបភាពដ៏អស្ចារ្យ និងចែករំលែកពេលវេលារបស់អ្នក។','Discover remarkable views and share your moments.')));
 const credit=E('a','kx-discover-credit','NASA / Bill Anders · Public domain ↗');credit.href='https://commons.wikimedia.org/wiki/File:NASA-Apollo8-Dec24-Earthrise.jpg';credit.target='_blank';credit.rel='noopener noreferrer';
 b.append(img,shade,body,credit);return b
}
function heroCard(p){
 const h=E('div','kx-hero');
 const bg=E('div','kx-hero-bg');h.appendChild(bg);
 if(p.blob instanceof Blob){lazyThumb(bg,p);const u=videoURL(p);if(u){const v=document.createElement('video');v.src=u;v.muted=true;v.loop=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='metadata';v.className='kx-hero-vid';v.onplaying=()=>v.classList.add('on');h.appendChild(v);v.play().catch(()=>{})}}
 else bg.classList.add('cloud');
 h.appendChild(E('div','kx-hero-shade'));
 h.appendChild(E('div','kx-live','● '+tr('ពេញនិយម','TRENDING')));
 const body=E('div','kx-hero-body');
 const cr=E('div','kx-hero-cr');cr.appendChild(avatarOf(p,34));const nm=E('b','', '@'+esc(p.author||'KAISER'));nm.textContent='@'+(p.author||'KAISER');cr.appendChild(nm);
 if(p.uid&&p.uid!==currentSocialUid()){const f=E('button','kx-follow'+(isFollowing(p.uid)?' on':''),isFollowing(p.uid)?tr('កំពុងតាមដាន','Following'):'+ '+tr('តាមដាន','Follow'));f.onclick=e=>{e.stopPropagation();const r=toggleFollow(p.uid);if(r!==null){f.classList.toggle('on',r);f.textContent=r?tr('កំពុងតាមដាន','Following'):'+ '+tr('តាមដាន','Follow')}};cr.appendChild(f)}
 body.appendChild(cr);
 const cap=E('div','kx-hero-cap');cap.textContent=p.caption||tr('វីដេអូថ្មី','New video');body.appendChild(cap);
 const tags=hashtagsOf(p.caption);if(tags.length){const t=E('div','kx-tags');tags.forEach(x=>t.appendChild(E('span','',x)));body.appendChild(t)}
 const st=E('div','kx-hero-stats');st.innerHTML=stat('❤',(p.likedBy||[]).length)+stat('💬',(p.comments||[]).length)+stat('👁',viewsOf(p));body.appendChild(st);
 const go1=E('button','kx-watch','▶ '+tr('មើលឥឡូវ','Watch now'));go1.onclick=e=>{e.stopPropagation();openPost(p)};body.appendChild(go1);
 h.appendChild(body);h.onclick=()=>openPost(p);return h}
async function home(){
 root.innerHTML='';clearUrls();root.classList.add('social-front');
 let posts=[];try{posts=(await allPosts()).map(normalizeSocialPost)}catch(_){}
 const nf=computeNotifs(posts);
 const top=E('div','kx-top');
 top.innerHTML='<div class="kx-brand nova-brand"><img class="nova-logo-image" src="assets/images/nova-logo.png" alt="NOVA"><small>A NEW WORLD TO SHARE</small></div>';
 const sb=E('button','sf-icon','⌕');sb.setAttribute('aria-label','Search');sb.onclick=()=>go('search');
 const nb=E('button','sf-icon kx-bell','♧');nb.setAttribute('aria-label','Notifications');if(nf.unread)nb.appendChild(E('i','kx-badge',nf.unread>9?'9+':String(nf.unread)));nb.onclick=()=>go('notifs');
 top.append(sb,nb);root.appendChild(top);
 const tabs=E('div','sf-tabs');
 const scroll=E('div','sf-scroll');
 [['forYou',tr('សម្រាប់អ្នក','For You')],['following',tr('កំពុងតាមដាន','Following')],['popular',tr('ពេញនិយម','Popular')]].forEach(([k,n])=>{const b=E('button',k===homeTab?'active':'',esc(n));b.onclick=()=>{homeTab=k;tabs.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');paint()};tabs.appendChild(b)});
 root.appendChild(novaPillarBar());tabs.style.display=novaPillar==='discover'?'':'none';root.appendChild(tabs);root.appendChild(scroll);
 const paint=()=>{
  scroll.innerHTML='';
  if(novaPillar!=='discover'){(novaPillars[novaPillar]||novaPillars.community)(scroll,posts,nf);return}
  /* creators row */
  const seen=new Map();posts.forEach(p=>{const k=p.uid||p.author;if(!seen.has(k))seen.set(k,{uid:p.uid,author:p.author,avatar:p.avatar,n:0});seen.get(k).n++});
  const row=E('div','kx-stories');
  const mk=E('button','kx-story create');mk.innerHTML='<span class="kx-ring"><span class="kx-plus">＋</span></span><small>'+esc(tr('បង្កើត','Create'))+'</small>';mk.onclick=()=>go('post');row.appendChild(mk);
  [...seen.values()].slice(0,14).forEach(c=>{const b=E('button','kx-story'),ring=E('span','kx-ring');ring.appendChild(avatarOf(c,52));b.appendChild(ring);const sm=E('small');sm.textContent=c.author||'KAISER';b.appendChild(sm);b.onclick=()=>{feedStart=null;feedFilter={type:'creator',uid:c.uid,author:c.author};go('feed')};row.appendChild(b)});
  if(!posts.length){
   scroll.appendChild(row);
   scroll.appendChild(novaDiscoverBanner());
   const em=E('div','kx-empty');em.innerHTML='<div class="kx-empty-ic">🎬</div><h3>'+esc(tr('ស្វាគមន៍មកកាន់ NOVA','Welcome to NOVA'))+'</h3><p>'+esc(tr('កាត់វីដេអូរបស់អ្នកក្នុងកម្មវិធី ហើយចែករំលែកទីនេះ។ វីដេអូដំបូងរបស់អ្នកនឹងលេចឡើងជា Hero ដ៏ស្អាតនៅទំព័រនេះ។','Edit your video in the app and share it here. Your first video becomes the hero of this page.'))+'</p>';
   const a=E('button','kx-watch','＋ '+tr('បង្កើតវីដេអូដំបូង','Create your first video'));a.onclick=()=>go('post');const b=E('button','kx-ghost','▣ '+tr('បើកកម្មវិធីកាត់ត','Open the editor'));b.onclick=()=>{root.classList.remove('social-front');close()};em.append(a,b);scroll.appendChild(em);return}
  let list=[...posts];
  if(homeTab==='following'){const f=new Set(followsOf());list=list.filter(p=>f.has(String(p.uid)));
   if(!list.length){const em=E('div','kx-empty');em.innerHTML='<div class="kx-empty-ic">✨</div><h3>'+esc(tr('មិនទាន់តាមដានអ្នកណាទេ','You are not following anyone yet'))+'</h3><p>'+esc(tr('ចុចលើរូបអ្នកបង្កើតខាងលើ ឬប៊ូតុង តាមដាន ដើម្បីឃើញវីដេអូរបស់ពួកគេនៅទីនេះ។','Tap a creator above or a Follow button to see their videos here.'))+'</p>';scroll.appendChild(em);return}}
  else if(homeTab==='popular')list.sort((a,b)=>popOf(b)-popOf(a));
  else list.sort((a,b)=>scoreOf(b)-scoreOf(a));
  /* V6.3.37: Put the featured video before creator stories. If the signed-in
     member has posted locally, feature their newest video first; otherwise use
     the current For You / Following / Popular ranking. */
  const ownFeatured=currentSocialUid()?list.find(p=>p.uid===currentSocialUid()):null;
  scroll.appendChild(heroCard(ownFeatured||list[0]));
  scroll.appendChild(row);
  scroll.appendChild(novaDiscoverBanner());
  const trend=[...posts].sort((a,b)=>popOf(b)-popOf(a)).slice(0,8);
  if(trend.length>1){scroll.appendChild(E('div','sf-section','🔥 '+tr('កំពុងពេញនិយម','Trending now')));const car=E('div','kx-car');trend.forEach(p=>car.appendChild(postCard(p,true)));scroll.appendChild(car)}
  scroll.appendChild(E('div','sf-section','🆕 '+tr('វីដេអូថ្មីៗ','Latest videos')));
  const grid=E('div','kx-grid');list.slice(0,16).forEach((p,i)=>{const c=postCard(p);c.style.animationDelay=Math.min(i,8)*45+'ms';grid.appendChild(c)});scroll.appendChild(grid);
 };
 paint();
 const nav=E('div','sf-nav');[['⌂',tr('ទំព័រដើម','Home'),'home'],['◈',tr('ស្វែងរក','Explore'),'search'],['＋',tr('បង្កើត','Create'),'post'],['▣',tr('កាត់ត','Editor'),'editor'],['♙',tr('ខ្ញុំ','Me'),'profile']].forEach(([ic,label,k])=>{const b=E('button',(k==='home'?'active ':'')+(k==='post'?'create':''));b.innerHTML='<span class="sf-nav-icon">'+ic+'</span><span>'+label+'</span>';b.onclick=()=>{if(k==='editor'){root.classList.remove('social-front');close()}else go(k)};nav.appendChild(b)});root.appendChild(nav);
}
/* ================= V6.3.42 · NOVA SYSTEM: six pillars, one design language ================= */
const NOVA_PILLARS=[
 ['discover','✦','Discover',()=>tr('វីដេអូខ្លី និងមតិកាណែនាំតាមចំណាប់អារម្មណ៍។','Short videos and recommendations that match your interests.')],
 ['community','◎','Community',()=>tr('មិត្តភក្តិ ក្រុម និងសហគមន៍តាមប្រធានបទ។','Friends, groups and communities by topic.')],
 ['creator','★','Creator',()=>tr('Profile ស្អាតដៃ និងឧបករណ៍សម្រាប់អ្នកបង្កើតមាតិកា។','A polished profile and tools for content creators.')],
 ['connect','☍','Connect',()=>tr('អ្នកតាមដាន សកម្មភាព និងការអញ្ជើញមិត្តភក្តិ។','Followers, activity and inviting friends.')],
 ['trends','↗','Trends',()=>tr('ប្រធានបទ និងវីដេអូពេញនិយមជាងគេ។','The topics and videos people love most.')],
 ['ai','✧','NOVA AI',()=>tr('ជំនួយការ AI ជួយបង្កើត កាត់ត និងគិតគំនិត។','AI that helps you create, edit and find ideas.')]
];
function novaPillarBar(){
 const bar=E('div','nv-pillars');
 NOVA_PILLARS.forEach(([k,ic,name])=>{const b=E('button','nv-pill'+(k===novaPillar?' on':''));b.type='button';b.innerHTML='<i>'+ic+'</i><span></span>';b.lastChild.textContent=name;
  b.onclick=()=>{if(novaPillar===k)return;novaPillar=k;home()};bar.appendChild(b)});
 setTimeout(()=>{const on=bar.querySelector('.on');if(on)bar.scrollLeft=Math.max(0,on.offsetLeft-60)},0);
 return bar}
function nvHead(k,extra){
 const p=NOVA_PILLARS.find(x=>x[0]===k);
 const h=E('div','nv-head nv-'+k);h.innerHTML='<div class="nv-head-ic"></div><div class="nv-head-tx"><b></b><span></span></div>';
 h.querySelector('.nv-head-ic').textContent=p[1];h.querySelector('b').textContent='NOVA '+p[2].replace(/^NOVA /,'');h.querySelector('span').textContent=p[3]();
 if(extra)h.appendChild(extra);return h}
const nvSection=t=>E('div','sf-section',t);
const nvEmpty=(ic,title,text,btn,fn)=>{const em=E('div','kx-empty');em.innerHTML='<div class="kx-empty-ic">'+ic+'</div><h3></h3><p></p>';em.querySelector('h3').textContent=title;em.querySelector('p').textContent=text;if(btn){const b=E('button','kx-watch',btn);b.onclick=fn;em.appendChild(b)}return em};
const closeToEditor=()=>{root.classList.remove('social-front');close()};
const hue=t=>{let h=0;for(const c of String(t))h=(h*31+c.charCodeAt(0))%360;return h};
/* ---------- Community ---------- */
const COMM_KEY='kaiser-communities',COMM_CUSTOM='kaiser-comm-custom';
const joinedComms=()=>{const m=LS(COMM_KEY,{});return Array.isArray(m[meKey()])?m[meKey()]:[]};
function toggleComm(tag){const m=LS(COMM_KEY,{}),k=meKey(),a=new Set(m[k]||[]);let on;if(a.has(tag)){a.delete(tag);on=false}else{a.add(tag);on=true}m[k]=[...a];SS(COMM_KEY,m);return on}
function communitiesFrom(posts){
 const map=new Map(),add=t=>{const k=[...map.keys()].find(x=>x.toLowerCase()===t.toLowerCase());if(k)return map.get(k);const o={tag:t,posts:0,authors:new Set(),likes:0};map.set(t,o);return o};
 ['#NOVA','#KAISER','#edit','#video','#viral','#khmer'].concat(LS(COMM_CUSTOM,[])).forEach(add);
 posts.forEach(p=>hashtagsOf(p.caption).forEach(t=>{const c=add(t);c.posts++;c.authors.add(p.uid||p.author);c.likes+=(p.likedBy||[]).length}));
 return [...map.values()].sort((a,b)=>b.posts-a.posts||a.tag.localeCompare(b.tag))}
function novaCommunity(scroll,posts){
 scroll.appendChild(nvHead('community'));
 const list=communitiesFrom(posts),mine=new Set(joinedComms());
 /* create */
 const cr=E('div','nv-create');const inp=E('input');inp.placeholder=tr('ឈ្មោះសហគមន៍ថ្មី ឧ. #ចម្អិនអាហារ','New community, e.g. #cooking');inp.maxLength=24;
 const add=E('button','nv-btn','＋ '+tr('បង្កើត','Create'));
 add.onclick=()=>{let t=inp.value.trim().replace(/\s+/g,'');if(!t)return;if(t[0]!=='#')t='#'+t;if(!/^#[\p{L}\p{N}_]{2,23}$/u.test(t))return tst(tr('ឈ្មោះមិនត្រឹមត្រូវ (២–២៣ តួ មិនមានដកឃ្លា)','Invalid name (2–23 characters, no spaces)'));
  const c=LS(COMM_CUSTOM,[]);if(!c.some(x=>x.toLowerCase()===t.toLowerCase()))c.push(t);SS(COMM_CUSTOM,c);toggleCommOnce(t);novaPillar='community';home()};
 const toggleCommOnce=t=>{if(!joinedComms().includes(t))toggleComm(t)};
 cr.append(inp,add);scroll.appendChild(cr);
 /* my communities feed */
 const my=list.filter(c=>mine.has(c.tag));
 if(my.length){
  scroll.appendChild(nvSection('⭐ '+tr('សហគមន៍របស់ខ្ញុំ','My communities')));
  const tagset=new Set(my.map(c=>c.tag.toLowerCase()));
  const mp=posts.filter(p=>hashtagsOf(p.caption).some(t=>tagset.has(t.toLowerCase()))).sort((a,b)=>b.ts-a.ts).slice(0,6);
  if(mp.length){const car=E('div','kx-car');mp.forEach(p=>car.appendChild(postCard(p,true)));scroll.appendChild(car);const all=E('button','nv-link',tr('មើលទាំងអស់ →','See all →'));all.onclick=()=>{feedStart=null;feedFilter={type:'tags',tags:my.map(c=>c.tag)};go('feed')};scroll.appendChild(all)}
  else scroll.appendChild(E('div','kx-empty-s',tr('មិនទាន់មានវីដេអូក្នុងសហគមន៍ដែលអ្នកចូលរួមទេ។','No videos in your communities yet.')))}
 scroll.appendChild(nvSection('◎ '+tr('រកមើលសហគមន៍','Browse communities')));
 const grid=E('div','nv-comm-grid');
 list.forEach(c=>{
  const joined=mine.has(c.tag),h=hue(c.tag),card=E('div','nv-comm');card.style.setProperty('--h',h);
  const members=c.authors.size+(joined&&!c.authors.has(currentSocialUid())?1:0);
  card.innerHTML='<div class="nv-comm-ic"></div><div class="nv-comm-tx"><b></b><small></small></div>';
  card.querySelector('.nv-comm-ic').textContent=c.tag.charAt(1).toUpperCase();card.querySelector('b').textContent=c.tag;
  card.querySelector('small').textContent=c.posts+' '+tr('វីដេអូ','videos')+' · '+members+' '+tr('សមាជិក','members');
  const row=E('div','nv-comm-act');
  const jb=E('button','nv-btn'+(joined?' on':''),joined?'✓ '+tr('បានចូលរួម','Joined'):'＋ '+tr('ចូលរួម','Join'));
  jb.onclick=e=>{e.stopPropagation();const on=toggleComm(c.tag);jb.classList.toggle('on',on);jb.textContent=on?'✓ '+tr('បានចូលរួម','Joined'):'＋ '+tr('ចូលរួម','Join')};
  const ob=E('button','nv-btn ghost',tr('បើក','Open'));ob.onclick=e=>{e.stopPropagation();if(!c.posts)return tst(tr('មិនទាន់មានវីដេអូក្នុង ','No videos yet in ')+c.tag);feedStart=null;feedFilter={type:'tag',tag:c.tag};go('feed')};
  row.append(jb,ob);card.appendChild(row);card.onclick=()=>ob.click();grid.appendChild(card)});
 scroll.appendChild(grid);
 scroll.appendChild(E('div','nv-note',tr('សហគមន៍ត្រូវបានបង្កើតពី Hashtag ហើយរក្សាទុកលើទូរសព្ទនេះ។ ការចែករំលែករវាងមនុស្សច្រើននាក់ត្រូវការ Server។','Communities are built from hashtags and stored on this phone. Sharing across many people needs a server.')))}
/* ---------- Creator ---------- */
function novaCreator(scroll,posts){
 scroll.appendChild(nvHead('creator'));
 if(!currentSocialUid()){scroll.appendChild(nvEmpty('★',tr('ក្លាយជាអ្នកបង្កើត NOVA','Become a NOVA creator'),tr('ចូលគណនីដើម្បីមាន Profile ស្ថិតិ និងឧបករណ៍អ្នកបង្កើត។','Log in to get a profile, stats and creator tools.'),tr('ចុះឈ្មោះ / ចូលគណនី','Sign up / Log in'),()=>auth(accounts.length?'login':'signup')));return}
 const me=currentSocialUid(),mine=posts.filter(p=>p.uid===me).sort((a,b)=>b.ts-a.ts);
 const likes=mine.reduce((n,p)=>n+(p.likedBy||[]).length,0),comments=mine.reduce((n,p)=>n+(p.comments||[]).length,0),views=mine.reduce((n,p)=>n+viewsOf(p),0);
 const fm=LS(FOLLOW_KEY,{});const followers=Object.keys(fm).filter(k=>k!==me&&(fm[k]||[]).includes(String(me))).length;
 const pc=E('div','nv-profile');pc.appendChild(avatarOf({author:acc.name,avatar:acc.avatar},68));
 const tx=E('div','nv-profile-tx');tx.innerHTML='<b></b><small></small>';tx.querySelector('b').textContent=acc.name;tx.querySelector('small').textContent=acc.bio||('@'+(acc.email||'').split('@')[0]);pc.appendChild(tx);
 const eb=E('button','nv-btn ghost',tr('កែ','Edit'));eb.onclick=()=>go('edit');pc.appendChild(eb);scroll.appendChild(pc);
 const st=E('div','nv-stats');[[mine.length,tr('វីដេអូ','Videos')],[followers,tr('អ្នកតាមដាន','Followers')],[fmtN(likes),tr('ចូលចិត្ត','Likes')],[fmtN(views),tr('មើល','Views')]].forEach(([n,l])=>{const d=E('div');d.innerHTML='<b></b><small></small>';d.querySelector('b').textContent=n;d.querySelector('small').textContent=l;st.appendChild(d)});scroll.appendChild(st);
 scroll.appendChild(nvSection('🛠 '+tr('ឧបករណ៍អ្នកបង្កើត','Creator tools')));
 const tools=E('div','nv-tools');
 [['＋',tr('ចែករំលែក','New post'),()=>go('post')],['▣',tr('កម្មវិធីកាត់ត','Editor'),closeToEditor],['✧',tr('AI Studio','AI Studio'),()=>{closeToEditor();try{window.T.aiStudio()}catch(_){}}],['⚡',tr('Auto Edit','Auto Edit'),()=>{if(!C.length){tst(tr('សូម Import វីដេអូក្នុងកម្មវិធីកាត់តជាមុន','Import a video in the editor first'));closeToEditor();return}closeToEditor();try{T.ai()}catch(_){}}]].forEach(([ic,l,fn])=>{const b=E('button','nv-tool');b.type='button';b.innerHTML='<i></i><span></span>';b.firstChild.textContent=ic;b.lastChild.textContent=l;b.onclick=fn;tools.appendChild(b)});scroll.appendChild(tools);
 if(!mine.length){scroll.appendChild(nvEmpty('🎬',tr('មិនទាន់មានវីដេអូ','No videos yet'),tr('ចែករំលែកវីដេអូដំបូងរបស់អ្នក ដើម្បីមើលស្ថិតិនៅទីនេះ។','Share your first video to see stats here.'),tr('បង្កើតវីដេអូដំបូង','Create your first video'),()=>go('post')));return}
 const best=[...mine].sort((a,b)=>popOf(b)-popOf(a))[0],eng=views?Math.round((likes+comments)/views*100):0;
 const ins=E('div','nv-insight');ins.innerHTML='<b>📈 '+esc(tr('ការវិភាគ','Insights'))+'</b><span></span>';
 ins.querySelector('span').textContent=tr('វីដេអូល្អបំផុត៖ ','Best video: ')+(best.caption||tr('វីដេអូ','Video')).slice(0,40)+' · ❤ '+(best.likedBy||[]).length+' · 💬 '+(best.comments||[]).length+' · '+tr('ការចូលរួម ','engagement ')+eng+'%';
 ins.onclick=()=>openPost(best);scroll.appendChild(ins);
 scroll.appendChild(nvSection('🎞 '+tr('វីដេអូរបស់ខ្ញុំ','My videos')));
 const grid=E('div','kx-grid');mine.slice(0,16).forEach((p,i)=>{const c=postCard(p);c.style.animationDelay=Math.min(i,8)*45+'ms';grid.appendChild(c)});scroll.appendChild(grid)}
/* ---------- Connect ---------- */
async function novaInvite(){
 const url=location.origin+location.pathname,text=tr('មកចូលរួម NOVA ជាមួយខ្ញុំ! កាត់តវីដេអូ និងចែករំលែក។','Join me on NOVA! Edit and share videos.');
 try{if(navigator.share){await navigator.share({title:'NOVA',text,url});return}}catch(e){if(e&&e.name==='AbortError')return}
 try{await navigator.clipboard.writeText(text+' '+url);tst(tr('✓ បានចម្លងតំណអញ្ជើញ','✓ Invite link copied'))}catch(_){tst(url)}}
function novaConnect(scroll,posts,nf){
 const inv=E('button','nv-btn nv-inv','💌 '+tr('អញ្ជើញមិត្តភក្តិ','Invite friends'));inv.onclick=novaInvite;
 scroll.appendChild(nvHead('connect',inv));
 const me=currentSocialUid();
 scroll.appendChild(nvSection('🔔 '+tr('សកម្មភាពថ្មីៗ','Recent activity')));
 if(!me)scroll.appendChild(nvEmpty('♧',tr('ចូលគណនីដើម្បីទទួលសកម្មភាព','Log in to see activity'),tr('Like និងមតិលើវីដេអូរបស់អ្នកនឹងបង្ហាញទីនេះ។','Likes and comments on your videos appear here.'),tr('ចូលគណនី','Log in'),()=>auth('login')));
 else if(!nf.items.length)scroll.appendChild(E('div','kx-empty-s',tr('មិនទាន់មានសកម្មភាពទេ។','No activity yet.')));
 else{const l=E('div','kx-list');nf.items.slice(0,4).forEach(n=>{const r=E('button','kx-row'+(n.isNew?' new':''));r.type='button';const th=E('div','kx-row-th');if(n.p.blob instanceof Blob)lazyThumb(th,n.p);else th.textContent='☁';const t=E('div','kx-row-tx');t.innerHTML='<b></b><small></small>';t.firstChild.textContent=n.kind==='comment'?'💬 '+n.who+': '+n.text:'❤ '+n.count+' '+tr('នាក់ចូលចិត្ត','likes');t.lastChild.textContent=(n.p.caption||'')+' · '+ago(n.ts);r.append(th,t);r.onclick=()=>openPost(n.p);l.appendChild(r)});scroll.appendChild(l);const all=E('button','nv-link',tr('មើលទាំងអស់ →','See all →'));all.onclick=()=>go('notifs');scroll.appendChild(all)}
 scroll.appendChild(nvSection('👥 '+tr('កំពុងតាមដាន','Following')));
 const fl=followsOf(),people=new Map();posts.forEach(p=>{if(p.uid&&fl.includes(String(p.uid))&&!people.has(p.uid))people.set(p.uid,{uid:p.uid,author:p.author,avatar:p.avatar})});
 if(!people.size)scroll.appendChild(E('div','kx-empty-s',tr('មិនទាន់តាមដានអ្នកណាទេ។ ចុច + នៅលើវីដេអូ ដើម្បីតាមដាន។','You are not following anyone. Tap + on a video to follow.')));
 else{const row=E('div','kx-stories');[...people.values()].forEach(c=>{const b=E('button','kx-story'),ring=E('span','kx-ring');ring.appendChild(avatarOf(c,52));b.appendChild(ring);const sm=E('small');sm.textContent=c.author||'KAISER';b.appendChild(sm);b.onclick=()=>{feedStart=null;feedFilter={type:'creator',uid:c.uid,author:c.author};go('feed')};row.appendChild(b)});scroll.appendChild(row)}
 const lock=E('div','nv-lock');lock.innerHTML='<div class="nv-lock-ic">💬</div><div><b></b><span></span></div>';
 lock.querySelector('b').textContent=tr('សារឯកជន និងការហៅ','Private messages & calls');lock.querySelector('span').textContent=tr('ត្រូវការ Server ដើម្បីភ្ជាប់មនុស្សច្រើននាក់។ ឥឡូវនេះ Social ដំណើរការលើទូរសព្ទនេះប៉ុណ្ណោះ។','Needs a server to connect many people. Right now Social works on this phone only.');
 const sb=E('button','nv-btn ghost',tr('ការកំណត់ Server','Server settings'));sb.onclick=()=>go('settings');lock.appendChild(sb);scroll.appendChild(lock)}
/* ---------- Trends ---------- */
function novaTrends(scroll,posts){
 scroll.appendChild(nvHead('trends'));
 const tags=new Map();posts.forEach(p=>hashtagsOf(p.caption).forEach(t=>{const k=[...tags.keys()].find(x=>x.toLowerCase()===t.toLowerCase())||t;const o=tags.get(k)||{tag:k,n:0,pop:0};o.n++;o.pop+=popOf(p)+1;tags.set(k,o)}));
 const top=[...tags.values()].sort((a,b)=>b.pop-a.pop).slice(0,8),max=top.length?top[0].pop:1;
 scroll.appendChild(nvSection('# '+tr('Hashtag កំពុងឡើង','Rising hashtags')));
 if(!top.length)scroll.appendChild(nvEmpty('#',tr('មិនទាន់មាន Hashtag','No hashtags yet'),tr('ដាក់ #hashtag ក្នុងចំណងជើងវីដេអូ ដើម្បីបង្ហាញក្នុង Trends។','Add #hashtags to your captions to appear in Trends.'),tr('ចែករំលែកវីដេអូ','Post a video'),()=>go('post')));
 else{const l=E('div','nv-rank');top.forEach((t,i)=>{const r=E('button','nv-rank-row');r.type='button';r.innerHTML='<em></em><div><b></b><i><u></u></i></div><small></small>';r.querySelector('em').textContent=i+1;r.querySelector('b').textContent=t.tag;r.querySelector('u').style.width=Math.max(8,Math.round(t.pop/max*100))+'%';r.querySelector('small').textContent=t.n+' '+tr('វីដេអូ','videos');r.onclick=()=>{feedStart=null;feedFilter={type:'tag',tag:t.tag};go('feed')};l.appendChild(r)});scroll.appendChild(l)}
 const cm=new Map();posts.forEach(p=>{const k=p.uid||p.author,o=cm.get(k)||{uid:p.uid,author:p.author,avatar:p.avatar,pop:0,n:0};o.pop+=popOf(p);o.n++;cm.set(k,o)});
 const cs=[...cm.values()].sort((a,b)=>b.pop-a.pop).slice(0,6);
 if(cs.length){scroll.appendChild(nvSection('★ '+tr('អ្នកបង្កើតកំពុងឡើង','Rising creators')));const row=E('div','kx-stories');cs.forEach(c=>{const b=E('button','kx-story'),ring=E('span','kx-ring');ring.appendChild(avatarOf(c,52));b.appendChild(ring);const sm=E('small');sm.textContent=c.author||'KAISER';b.appendChild(sm);b.onclick=()=>{feedStart=null;feedFilter={type:'creator',uid:c.uid,author:c.author};go('feed')};row.appendChild(b)});scroll.appendChild(row)}
 const vids=[...posts].sort((a,b)=>popOf(b)-popOf(a)).slice(0,6);
 if(vids.length){scroll.appendChild(nvSection('🔥 '+tr('វីដេអូពេញនិយម','Top videos')));const grid=E('div','kx-grid');vids.forEach(p=>grid.appendChild(postCard(p)));scroll.appendChild(grid)}}
/* ---------- NOVA AI ---------- */
const CAPTION_T=()=>isKmLang()?[
 t=>t+' — មើលហើយមិនអាចឈប់បាន! 🔥',t=>'ដំណើរ '+t+' ចាប់ផ្តើមពីទីនេះ ✨',t=>'៣ រឿងអំពី '+t+' ដែលអ្នកមិនទាន់ដឹង 👀',t=>t+': មុន vs ក្រោយ 🎬',t=>'ចែករំលែក '+t+' ជាមួយមិត្តភក្តិរបស់អ្នក 💜',t=>'កុំមើលរំលង! '+t+' ថ្ងៃនេះ ⚡']:[
 t=>t+' — you will not stop watching! 🔥',t=>'The '+t+' journey starts here ✨',t=>'3 things about '+t+' you did not know 👀',t=>t+': before vs after 🎬',t=>'Share '+t+' with your friends 💜',t=>'Do not skip this! '+t+' today ⚡'];
const isKmLang=()=>localStorage.getItem('kaisor-language')!=='en';
function novaAI(scroll){
 scroll.appendChild(nvHead('ai'));
 const K=window.KAISER_CREDITS;
 if(K){const left=K.left(),d=K.cfg.daily,c=E('div','nv-credit');c.innerHTML='<div><b></b><small></small></div><i><u></u></i>';
  c.querySelector('b').textContent='⚡ '+tr('Credits ថ្ងៃនេះ៖ ','Credits today: ')+left+' / '+d;
  const m=Math.max(1,Math.round(K.resetMs()/60000));c.querySelector('small').textContent=tr('Reset ក្នុង ','Resets in ')+(m>=60?Math.floor(m/60)+'h ':'')+(m%60)+'m · '+tr('រូបភាព ','image ')+K.cfg.image+' · '+tr('វីដេអូ ','video ')+K.cfg.video;
  c.querySelector('u').style.width=Math.round(left/d*100)+'%';scroll.appendChild(c)}
 const openStudio=()=>{closeToEditor();try{window.T.aiStudio()}catch(_){tst('AI Studio')}};
 const cards=E('div','nv-ai-grid');
 [['🖼',tr('បង្កើតរូបភាព','Create image'),tr('ពី Prompt ភ្លាមៗ','From a prompt, instantly'),openStudio],
  ['🎬',tr('បង្កើតវីដេអូ','Create video'),tr('វីដេអូខ្លីដោយ AI','Short AI video'),openStudio],
  ['⚡',tr('កាត់តស្វ័យប្រវត្តិ','Auto Edit'),tr('លុបចំណុចខ្សោយ ដាក់ Hook','Cut weak parts, add a hook'),()=>{closeToEditor();if(!C.length)return tst(tr('សូម Import វីដេអូជាមុន','Import a video first'));try{T.ai()}catch(_){}}],
  ['🔍',tr('ពិនិត្យគុណភាព','Quality check'),tr('AI Engine វាស់ពន្លឺ ភាពច្បាស់','AI Engine measures light, sharpness'),()=>{closeToEditor();if(!C.length)return tst(tr('សូម Import វីដេអូជាមុន','Import a video first'));try{T.aiEngine()}catch(_){}}]
 ].forEach(([ic,t,d,fn])=>{const b=E('button','nv-ai-card');b.type='button';b.innerHTML='<i></i><b></b><small></small>';b.querySelector('i').textContent=ic;b.querySelector('b').textContent=t;b.querySelector('small').textContent=d;b.onclick=fn;cards.appendChild(b)});
 scroll.appendChild(cards);
 scroll.appendChild(nvSection('✍ '+tr('គំនិតចំណងជើង & Hashtag','Caption & hashtag ideas')));
 const box=E('div','nv-capbox');const inp=E('input');inp.placeholder=tr('ប្រធានបទ ឧ. ចម្អិនអាហារខ្មែរ','Topic, e.g. Khmer cooking');inp.maxLength=40;
 const go1=E('button','nv-btn','✨ '+tr('បង្កើតគំនិត','Generate'));const out=E('div','nv-capout');box.append(inp,go1);scroll.appendChild(box);scroll.appendChild(out);
 const gen=()=>{const t=inp.value.trim();out.innerHTML='';if(!t)return tst(tr('សូមវាយប្រធានបទ','Type a topic'));
  const tag='#'+t.replace(/[^\p{L}\p{N}_]+/gu,'');const tags=['#NOVA','#KAISER',tag.length>1?tag:'#video'].join(' ');
  CAPTION_T().forEach(f=>{const cap=f(t)+' '+tags,r=E('div','nv-cap');const tx=E('span');tx.textContent=cap;const use=E('button','nv-mini',tr('ប្រើ','Use'));use.onclick=()=>{window.__novaCaption=cap;go('post')};const cp=E('button','nv-mini ghost',tr('ចម្លង','Copy'));cp.onclick=async()=>{try{await navigator.clipboard.writeText(cap);tst('✓')}catch(_){tst(cap)}};r.append(tx,use,cp);out.appendChild(r)})};
 go1.onclick=gen;inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();gen()}})}
const novaPillars={community:novaCommunity,creator:novaCreator,connect:novaConnect,trends:novaTrends,ai:novaAI};
/* ---- search ---- */
async function search(){
 const s=shell(tr('ស្វែងរក','Search'),()=>go('home'));root.classList.remove('social-front');
 let posts=[];try{posts=(await allPosts()).map(normalizeSocialPost)}catch(_){}
 const inp=E('input');inp.placeholder=tr('ស្វែងរកអ្នកបង្កើត ចំណងជើង ឬ #hashtag','Search creators, captions or #hashtags');inp.type='search';s.appendChild(inp);
 const tagc=new Map();posts.forEach(p=>hashtagsOf(p.caption).forEach(t=>tagc.set(t,(tagc.get(t)||0)+1)));
 const chips=E('div','chips');[...tagc.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([t])=>{const b=E('button','chip');b.textContent=t;b.onclick=()=>{inp.value=t;draw()};chips.appendChild(b)});
 if(tagc.size)s.appendChild(chips);
 const res=E('div','kx-list');s.appendChild(res);
 const draw=()=>{const q=inp.value.trim().toLowerCase();res.innerHTML='';
  const list=(q?posts.filter(p=>(p.caption||'').toLowerCase().includes(q)||(p.author||'').toLowerCase().includes(q)):[...posts].sort((a,b)=>popOf(b)-popOf(a))).slice(0,30);
  if(!list.length){res.appendChild(E('div','kx-empty-s',tr('រកមិនឃើញលទ្ធផល','No results found')));return}
  if(!q)res.appendChild(E('div','sf-section','🔥 '+tr('ពេញនិយម','Popular')));
  list.forEach(p=>{const r=E('button','kx-row');r.type='button';const th=E('div','kx-row-th');if(p.blob instanceof Blob)lazyThumb(th,p);else th.textContent='☁';
   const tx=E('div','kx-row-tx');tx.innerHTML='<b></b><small></small>';tx.firstChild.textContent=p.caption||tr('វីដេអូ','Video');tx.lastChild.textContent='@'+(p.author||'KAISER')+' · ❤ '+fmtN((p.likedBy||[]).length)+' · 👁 '+fmtN(viewsOf(p));
   r.append(th,tx);r.onclick=()=>openPost(p);res.appendChild(r)})};
 inp.oninput=draw;draw();setTimeout(()=>{try{inp.focus()}catch(_){}},250)}
/* ---- notifications ---- */
async function notifs(){
 const s=shell(tr('ការជូនដំណឹង','Notifications'),()=>go('home'));root.classList.remove('social-front');
 let posts=[];try{posts=(await allPosts()).map(normalizeSocialPost)}catch(_){}
 if(!currentSocialUid()){s.appendChild(E('div','kx-empty-s',tr('សូមចូលគណនី ដើម្បីទទួលការជូនដំណឹងពី Like និងមតិ។','Log in to receive notifications for likes and comments.')));const b=E('button','btn gold full',tr('ចូលគណនី','Log in'));b.onclick=()=>auth('login');s.appendChild(b);return}
 const nf=computeNotifs(posts);
 if(!nf.items.length)s.appendChild(E('div','kx-empty-s',tr('មិនទាន់មានការជូនដំណឹងទេ។ ពេលមានអ្នក Like ឬ Comment វីដេអូរបស់អ្នក វានឹងបង្ហាញទីនេះ។','Nothing yet. Likes and comments on your videos will appear here.')));
 nf.items.forEach(n=>{const r=E('button','kx-row'+(n.isNew?' new':''));r.type='button';const th=E('div','kx-row-th');if(n.p.blob instanceof Blob)lazyThumb(th,n.p);else th.textContent='☁';
  const tx=E('div','kx-row-tx');tx.innerHTML='<b></b><small></small>';
  tx.firstChild.textContent=n.kind==='comment'?'💬 '+n.who+': '+n.text:'❤ '+n.count+' '+tr('នាក់ចូលចិត្តវីដេអូរបស់អ្នក','people liked your video');
  tx.lastChild.textContent=(n.p.caption||'')+' · '+ago(n.ts);r.append(th,tx);r.onclick=()=>openPost(n.p);s.appendChild(r)});
 markNotifsSeen(posts)}
/* ---- profile ---- */
async function profile(){
 const s=shell(tr('ខ្ញុំ','Me'));
 let posts=[];try{posts=await allPosts()}catch(_){}
 const mine=logged&&acc?posts.filter(p=>p.uid===acc.uid):[];
 const likes=mine.reduce((n,p)=>n+(p.likes||0),0);
 const c=E('div','card'),pr=E('div','prof');pr.appendChild(avatar());
 const info=E('div','',`<div class="nm">${esc(logged&&acc?acc.name:tr('ភ្ញៀវ','Guest'))}</div><div class="sub">${esc(logged&&acc?(acc.bio||acc.email):tr('ចុះឈ្មោះ ឬចូលគណនី ដើម្បីបង្កើតប្រូហ្វាល','Sign up or log in to create your profile'))}</div>`);
 pr.appendChild(info);c.appendChild(pr);
 c.appendChild(E('div','stats',`<div><b>${mine.length}</b><span>${tr('វីដេអូ','Videos')}</span></div><div><b>${likes}</b><span>${tr('ចូលចិត្ត','Likes')}</span></div><div><b>${posts.length}</b><span>${tr('សង្គម','Social')}</span></div>`));
 const b=E('button','btn gold full',logged?tr('កែប្រូហ្វាល','Edit profile'):(accounts.length?tr('ចូលគណនី','Log in'):tr('ចុះឈ្មោះ / ចូលគណនី','Sign up / Log in')));b.onclick=()=>logged?go('edit'):auth(accounts.length?'login':'signup');c.appendChild(b);s.appendChild(c);
 const m=E('div','card');
 [['🎬',tr('បណ្ដាញសង្គម NOVA','NOVA Social'),()=>go('feed')],...(logged?[['🔄',tr('ប្តូរគណនី','Switch account'),()=>{setLogged(false);auth('login')}]]:[]),['⬆️',tr('ចែករំលែកវីដេអូ','Post a video'),()=>go('post')],['⚙️',tr('ការកំណត់','Settings'),()=>go('settings')]].forEach(([i,t,f])=>{const r=E('button','row',`<i>${i}</i>${esc(t)}<em>›</em>`);r.onclick=f;m.appendChild(r)});
 s.appendChild(m);
 s.appendChild(E('div','note',tr('គណនីច្រើនអាចប្រើលើទូរសព្ទនេះបាន។ Like និង Comment ត្រូវបានបែងចែកតាមគណនី។ ការចែករំលែកជាសកលត្រូវការ Social Server។','Multiple accounts can use this phone. Likes and comments are separated by account. Global sharing requires a Social Server.')));
}
/* ---- auth ---- */
function auth(startMode){
 const s=shell(tr('គណនី','Account'));
 let mode=startMode||(accounts.length?'login':'signup'),pre=LS('kaiser-lastemail','');
 const hero=E('div','card');hero.style.textAlign='center';
 hero.innerHTML='<div class="av" style="width:64px;height:64px;margin:0 auto 8px;font-size:26px">K</div><div class="nm">KAISER</div><div class="sub"></div>';
 const tabs=E('div','tabs'),saved=E('div','card'),form=E('div','card');s.append(hero,tabs,saved,form);
 const draw=()=>{
  hero.querySelector('.sub').textContent=mode==='signup'?tr('បង្កើតគណនីម្តង បន្ទាប់មកគ្រាន់តែចូលដោយ Email និងពាក្យសម្ងាត់','Create your account once, then just log in with email and password'):tr('ចូលជាមួយ Email និងពាក្យសម្ងាត់ដែលអ្នកបានចុះឈ្មោះ','Log in with the email and password you registered');
  tabs.innerHTML='';[['login',tr('ចូលគណនី','Log in')],['signup',tr('ចុះឈ្មោះ','Sign up')]].forEach(([k,n])=>{const b=E('button','chip'+(mode===k?' sel':''),esc(n));b.onclick=()=>{mode=k;draw()};tabs.appendChild(b)});
  saved.innerHTML='';saved.style.display=mode==='login'&&accounts.length?'block':'none';
  if(mode==='login'&&accounts.length){saved.appendChild(E('label','',esc(tr('គណនីលើទូរសព្ទនេះ (ចុចដើម្បីជ្រើស)','Accounts on this phone (tap to pick)'))));
   accounts.forEach(a=>{const r=E('button','row',`<i>${a.avatar?'🖼️':'👤'}</i>${esc(a.name)}<em>${esc(a.email)}</em>`);r.onclick=()=>{pre=a.email;draw();const pw=form.querySelector('input[type=password],input[data-pw]');pw&&pw.focus()};saved.appendChild(r)})}
  form.innerHTML='';
  const field=(label,type,ph,ac,val)=>{form.appendChild(E('label','',esc(label)));const i=E('input');i.type=type;i.placeholder=ph||'';i.autocomplete=ac;i.autocapitalize='none';i.spellcheck=false;if(val)i.value=val;form.appendChild(i);return i};
  const name=mode==='signup'?field(tr('ឈ្មោះ','Name'),'text','',' name'.trim()):null;
  const email=field('Email','email','name@gmail.com',mode==='signup'?'email':'username',pre);
  form.appendChild(E('label','',esc(tr('ពាក្យសម្ងាត់','Password'))));
  const pr=E('div','');pr.style.cssText='position:relative';const pass=E('input');pass.type='password';pass.placeholder=tr('យ៉ាងតិច ៦ តួ','At least 6 characters');pass.autocomplete=mode==='signup'?'new-password':'current-password';pass.setAttribute('data-pw','1');pass.style.paddingRight='46px';
  const eye=E('button','','👁');eye.type='button';eye.style.cssText='position:absolute;right:6px;top:8px;width:36px;height:36px;font-size:18px;opacity:.8';eye.onclick=()=>{const show=pass.type==='password';pass.type=show?'text':'password';eye.style.opacity=show?'1':'.8'};
  pr.append(pass,eye);form.appendChild(pr);
  const conf=mode==='signup'?field(tr('បញ្ជាក់ពាក្យសម្ងាត់','Confirm password'),'password','','new-password'):null;
  const err=E('div','');err.style.cssText='color:#ff6b81;font-size:12px;min-height:18px;margin:2px 0 6px';form.appendChild(err);
  const go1=E('button','btn gold full',mode==='signup'?tr('បង្កើតគណនី','Create account'):tr('ចូលគណនី','Log in'));form.appendChild(go1);
  const fail=m=>{err.textContent=m};
  let busy=false;
  const submit=async()=>{
   if(busy)return;fail('');const em=email.value.trim().toLowerCase(),pw=pass.value;
   if(!/^\S+@\S+\.\S+$/.test(em))return fail(tr('Email មិនត្រឹមត្រូវ (ឧ. name@gmail.com)','Invalid email (e.g. name@gmail.com)'));
   if(pw.length<6)return fail(tr('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួ','Password must be at least 6 characters'));
   busy=true;go1.disabled=true;
   try{
    if(mode==='signup'){
     const nm=name.value.trim();if(!nm)return fail(tr('សូមបញ្ចូលឈ្មោះ','Please enter your name'));
     if(pw!==conf.value)return fail(tr('ពាក្យសម្ងាត់ទាំងពីរមិនដូចគ្នា','Passwords do not match'));
     if(cloudCfg().url){const data=await serverFetch('/api/auth/signup',{method:'POST',json:{name:nm,email:em,password:pw}});if(!data||!data.token||!data.user||!(data.user.id||data.user.uid))throw new Error('Invalid signup response: expected token and user.id');sessionStorage.setItem(TOKEN_KEY,String(data.token));const u=data.user;acc={uid:String(u.id||u.uid),name:String(u.name||nm),email:String(u.email||em),ph:await hash(pw),bio:String(u.bio||''),avatar:String(u.avatar||'')};}
     else{if(accounts.some(a=>a.email===em)){pre=em;mode='login';draw();const e2=form.querySelector('div[style*="min-height"]');e2&&(e2.textContent=tr('Email នេះបានចុះឈ្មោះរួចហើយ សូមចូលគណនី','This email is already registered. Please log in.'));return}acc={uid:'u'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:nm,email:em,ph:await hash(pw),bio:'',avatar:''};}
     saveAcc();setLogged(true);SS('kaiser-lastemail',em);tst(tr('✓ ចុះឈ្មោះជោគជ័យ សូមស្វាគមន៍ ','✓ Account created. Welcome, ')+acc.name);go('home');
    }else{
     if(cloudCfg().url){const data=await serverFetch('/api/auth/login',{method:'POST',json:{email:em,password:pw}});if(!data||!data.token||!data.user||!(data.user.id||data.user.uid))throw new Error('Invalid login response: expected token and user.id');sessionStorage.setItem(TOKEN_KEY,String(data.token));const u=data.user;acc={uid:String(u.id||u.uid),name:String(u.name||em.split('@')[0]),email:String(u.email||em),ph:await hash(pw),bio:String(u.bio||''),avatar:String(u.avatar||'')};}
     else{const a=accounts.find(x=>x.email===em);if(!a)return fail(tr('រកមិនឃើញគណនី Email នេះទេ សូមចុះឈ្មោះជាមុន','No account with this email. Please sign up first.'));if(!await pwOk(a,pw))return fail(tr('ពាក្យសម្ងាត់មិនត្រឹមត្រូវ','Wrong password'));if(a.ph!==SHA('kaiser|'+pw)){a.ph=SHA('kaiser|'+pw)}acc=a;}
     saveAcc();setLogged(true);SS('kaiser-lastemail',em);tst(tr('✓ ចូលគណនីជោគជ័យ សូមស្វាគមន៍ ','✓ Logged in. Welcome back, ')+acc.name);go('home');
    }
   }finally{busy=false;go1.disabled=false}};
  go1.onclick=submit;
  form.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submit()}}));
  if(mode==='login'){const fg=E('button','row',tr('ភ្លេចពាក្យសម្ងាត់?','Forgot password?'));fg.style.cssText='justify-content:center;color:var(--gold);border:0;font-size:13px';
   fg.onclick=async()=>{const em=email.value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(em))return fail(tr('សូមបញ្ចូល Email ត្រឹមត្រូវជាមុន','Enter a valid account email first'));if(!cloudCfg().url)return fail(tr('ការកំណត់ Password Reset ត្រូវការភ្ជាប់ Server ជាមុន។ គណនីក្នុងទូរសព្ទមិនអាច Reset តាម Email បានទេ។','Password reset requires a configured server. Phone-only accounts cannot reset by email.'));fg.disabled=true;try{await serverFetch('/api/auth/password-reset/request',{method:'POST',json:{email:em}});fail(tr('បើ Email មានក្នុងប្រព័ន្ធ នឹងមានសារណែនាំកំណត់ពាក្យសម្ងាត់ឡើងវិញ។ សូមពិនិត្យ Inbox។','If the email is registered, reset instructions will be sent. Check your inbox.'))}catch(e){fail(tr('មិនអាចស្នើ Reset បាន៖ ','Reset request failed: ')+e.message)}finally{fg.disabled=false}};form.appendChild(fg)}
  form.appendChild(E('div','note',tr('គណនី Local នៅលើទូរសព្ទនេះ។ ដើម្បីប្រើគណនីច្រើនឧបករណ៍ និង Password Reset ត្រូវភ្ជាប់ Server ដែលទុកចិត្តបាន។','Local account on this device. Multi-device login and password reset require a trusted server.')));
 };draw();
}
/* ---- edit profile ---- */
function edit(){
 if(!logged||!acc)return go('auth');
 const s=shell(tr('កែប្រូហ្វាល','Edit profile'));const c=E('div','card');s.appendChild(c);
 const av=avatar(96);av.style.margin='0 auto 10px';c.appendChild(av);
 const file=E('input');file.type='file';file.accept='image/*';file.hidden=true;c.appendChild(file);
 const pb=E('button','btn full',tr('ប្តូររូបភាព','Change photo'));pb.onclick=()=>file.click();c.appendChild(pb);
 file.onchange=async()=>{if(!file.files[0])return;try{acc.avatar=await shrink(file.files[0]);saveAcc();edit()}catch(_){tst(tr('រូបភាពមិនបាន','Image failed'))}};
 c.appendChild(E('label','',tr('ឈ្មោះ','Name')));const n=E('input');n.value=acc.name;c.appendChild(n);
 c.appendChild(E('label','','Bio'));const b=E('textarea');b.rows=3;b.value=acc.bio||'';c.appendChild(b);
 const sv=E('button','btn gold full',tr('រក្សាទុក','Save'));sv.onclick=()=>{if(!n.value.trim())return tst(tr('សូមបញ្ចូលឈ្មោះ','Enter a name'));acc.name=n.value.trim();acc.bio=b.value.trim();saveAcc();tst(tr('បានរក្សាទុក','Saved'));go('home')};c.appendChild(sv);
 const lo=E('button','btn full',tr('ចាកចេញ','Log out'));lo.onclick=()=>{setLogged(false);go('home')};c.appendChild(lo);
}
/* ---- settings ---- */
function settings(){
 const s=shell(tr('ការកំណត់','Settings'));
 const chipRow=(label,list,cur,fn)=>{const c=E('div','card');c.appendChild(E('label','',esc(label)));const d=E('div','chips');d.style.marginTop='8px';list.forEach(([v,n])=>{const b=E('button','chip'+(String(v)===String(cur)?' sel':''),esc(n));b.onclick=()=>{d.querySelectorAll('.chip').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');fn(v)};d.appendChild(b)});c.appendChild(d);s.appendChild(c)};
 const lang=E('div','card');
 lang.appendChild(E('label','',tr('ភាសាបណ្ដាញសង្គម','Social app language')));
 lang.appendChild(E('div','note',tr('ជ្រើសរើសភាសាសម្រាប់ NOVA ប៉ុណ្ណោះ។ ការកំណត់នេះមិនប៉ះពាល់ Video Editor ទេ។','Choose the language for NOVA only. This setting does not affect the Video Editor.')));
 const langChoices=E('div','kx-language-list');langChoices.style.marginTop='10px';
 SOCIAL_LANGS.forEach(([code,label])=>{const b=E('button','kx-language-option'+(socialLanguage()===code?' sel':''));b.type='button';b.textContent=label;const mark=E('span','kx-language-check',socialLanguage()===code?'✓':'');b.appendChild(mark);b.onclick=()=>{localStorage.setItem(SOCIAL_LANG_KEY,code);settings()};langChoices.appendChild(b)});
 lang.appendChild(langChoices);lang.appendChild(E('div','note',tr('ភាសាខ្មែរមានការបកប្រែពេញលេញនៅពេលនេះ។ ភាសាផ្សេងៗកំពុងរៀបចំជាកញ្ចប់បកប្រែបន្តិចម្ដងៗ ហើយបច្ចុប្បន្នប្រើ English ជំនួស។','Khmer is fully localized at present. Other language packs are being added progressively and currently fall back to English.')));s.appendChild(lang);
 chipRow(tr('គុណភាព Export លំនាំដើម','Default export quality'),[[720,'720p'],[1080,'1080p']],S.q,v=>{S.q=+v;SS('kaiser-settings',S);try{expShort=S.q;expBlob=null}catch(_){}tst('✓ '+v+'p')});
 chipRow(tr('FPS លំនាំដើម','Default FPS'),[[24,'24'],[30,'30'],[60,'60']],S.fps,v=>{S.fps=+v;SS('kaiser-settings',S);try{expFps=S.fps;expBlob=null}catch(_){}tst('✓ '+v+' FPS')});
 const server=E('div','card');server.appendChild(E('label','',tr('Server & Cloud','Server & Cloud')));server.appendChild(E('div','note',tr('បញ្ចូល HTTPS Server Endpoint របស់អ្នក។ Server ត្រូវគាំទ្រ API របស់ KAISER V6.3.27។ មិនមាន Server មកជាមួយកម្មវិធីទេ។','Enter your trusted HTTPS server endpoint. It must implement the KAISER V6.3.27 API. No server is bundled.')));server.appendChild(E('div','note','API: GET /api/health · POST /api/auth/signup · POST /api/auth/login · POST /api/auth/password-reset/request · GET/POST /api/cloud/backup · POST /api/cloud/videos'));
 const url=E('input');url.type='url';url.placeholder='https://your-server.example';url.value=cloudCfg().url||'';url.autocomplete='url';server.appendChild(url);
 const row=E('div','chips');row.style.marginTop='8px';const save=E('button','btn gold',tr('រក្សាទុក Server','Save Server'));const test=E('button','btn',tr('សាកល្បងភ្ជាប់','Test connection'));row.append(save,test);server.appendChild(row);
 const status=E('div','note',tr('ស្ថានភាព៖ មិនទាន់ភ្ជាប់','Status: Not connected'));server.appendChild(status);
 save.onclick=()=>{try{const clean=cleanServerURL(url.value);SS(CLOUD_KEY,{url:clean});url.value=clean;status.textContent=tr('បានរក្សាទុក Endpoint។ សូមសាកល្បងភ្ជាប់។','Endpoint saved. Test the connection.');tst(tr('បានរក្សាទុក','Saved'))}catch(e){status.textContent=e.message}};
 test.onclick=async()=>{test.disabled=true;status.textContent=tr('កំពុងភ្ជាប់...','Connecting...');try{const clean=cleanServerURL(url.value);SS(CLOUD_KEY,{url:clean});const r=await cloudHealth();status.textContent=tr('បានភ្ជាប់ Server ជោគជ័យ','Server connected successfully')+(r.version?' · '+String(r.version):'')}catch(e){status.textContent=tr('ភ្ជាប់មិនបាន៖ ','Connection failed: ')+e.message}finally{test.disabled=false}};
 s.appendChild(server);
 const cloud=E('div','card');cloud.appendChild(E('label','',tr('Cloud Storage','Cloud Storage')));cloud.appendChild(E('div','note',tr('Backup ផ្ញើ Profile និងព័ត៌មាន Post របស់គណនីនេះទៅ Server។ វីដេអូត្រូវ Upload ដាច់ដោយឡែក។ Restore ទាញ Metadata មកវិញ; URL វីដេអូត្រូវផ្ដល់ដោយ Server។','Backup sends this account profile and post metadata to your server. Videos upload separately. Restore imports metadata; the server must provide video URLs.')));
 const backup=E('button','btn gold full',tr('បម្រុងទុកទៅ Cloud','Back up to Cloud'));const restore=E('button','btn full',tr('ស្ដារពី Cloud','Restore from Cloud'));const cs=E('div','note','');backup.onclick=async()=>{backup.disabled=true;cs.textContent=tr('កំពុង Backup...','Backing up...');try{const r=await cloudBackup();cs.textContent=tr('Backup ជោគជ័យ៖ ','Backup complete: ')+r.posts+tr(' Posts, វីដេអូ ',' posts, ')+r.videos+tr(' វីដេអូ។',' videos.')}catch(e){cs.textContent=tr('Backup មិនបាន៖ ','Backup failed: ')+e.message}finally{backup.disabled=false}};
 restore.onclick=async()=>{if(!confirm(tr('តើអ្នកចង់ស្ដារទិន្នន័យពី Cloud មែនទេ? ទិន្នន័យដែលមានស្រាប់នឹងមិនត្រូវបានលុបទេ។','Restore data from Cloud? Existing local data will not be deleted.')))return;restore.disabled=true;cs.textContent=tr('កំពុង Restore...','Restoring...');try{const r=await cloudRestore();cs.textContent=tr('Restore ជោគជ័យ៖ បានបន្ថែម ','Restore complete: imported ')+r.merged+tr(' Posts។',' posts.')}catch(e){cs.textContent=tr('Restore មិនបាន៖ ','Restore failed: ')+e.message}finally{restore.disabled=false}};
 cloud.append(backup,restore,cs);s.appendChild(cloud);
 const d=E('div','card');const cl=E('button','row',`<i>🗑</i>${tr('លុបវីដេអូសង្គមក្នុងទូរសព្ទ','Clear Social videos on this phone')}`);
 cl.onclick=async()=>{if(!confirm(tr('លុបវីដេអូសង្គមទាំងអស់?','Delete all Social videos?')))return;try{await tx('readwrite',s=>s.clear());tst(tr('បានលុប','Cleared'))}catch(_){}};d.appendChild(cl);
 if(logged){const lo=E('button','row',`<i>🚪</i>${tr('ចាកចេញ','Log out')}`);lo.onclick=()=>{setLogged(false);go('home')};d.appendChild(lo)}
 s.appendChild(d);s.appendChild(E('div','note','KAISER Video Editor · V6.3.38'));
}
/* ---- post a video ---- */
function post(){
 if(!logged||!acc){tst(tr('សូមចូលគណនីជាមុន','Please log in first'));return go('auth')}
 root.classList.remove('social-front');
 const s=shell(tr('ចែករំលែកវីដេអូ','Post a video'),()=>go('home'));const c=E('div','card');s.appendChild(c);
 const file=E('input');file.type='file';file.accept='video/*';file.hidden=true;c.appendChild(file);
 let hasExp=false;try{hasExp=!!(expBlob&&expBlob.size)}catch(_){}
 const stage1=E('div'),stage2=E('div');stage2.style.display='none';c.append(stage1,stage2);
 let chosen=null,chosenName='';
 const pick=(blob,name)=>{chosen=blob;chosenName=name||'';stage1.style.display='none';stage2.style.display='';stage2.innerHTML='';
  const u=URL.createObjectURL(blob);urls.push(u);const v=document.createElement('video');v.src=u;v.controls=true;v.muted=true;v.playsInline=true;v.className='kx-prev';stage2.appendChild(v);
  stage2.appendChild(E('label','',tr('ចំណងជើង','Caption')));const t=E('textarea');t.rows=3;t.placeholder=tr('សរសេរអ្វីមួយ… #KAISER','Write something… #KAISER');t.value=window.__novaCaption||(name&&!/\.(mp4|webm|mov)$/i.test(name)?name:'');window.__novaCaption='';stage2.appendChild(t);
  const ch=E('div','chips');['#KAISER','#edit','#video','#viral','#khmer'].forEach(x=>{const b=E('button','chip');b.type='button';b.textContent=x;b.onclick=()=>{t.value=(t.value+' '+x).trim()};ch.appendChild(b)});stage2.appendChild(ch);
  const pub=E('button','btn gold full','🚀 '+tr('ចែករំលែក','Publish'));
  pub.onclick=async()=>{const cap=t.value.trim();if(!cap&&!chosenName){tst(tr('សូមសរសេរចំណងជើង','Please write a caption'));return}
   pub.disabled=true;pub.textContent=tr('កំពុងចែករំលែក…','Publishing…');
   try{const rec={id:socialId(),uid:acc.uid,author:acc.name,avatar:acc.avatar||'',caption:cap||chosenName,ts:Date.now(),likes:0,likedBy:[],comments:[],blob:chosen};
    await putPost(rec);try{await Promise.race([makeThumb(rec),new Promise(r=>setTimeout(r,2500))])}catch(_){}
    tst(tr('✓ បានចែករំលែក','✓ Posted'));feedStart=rec.id;feedFilter=null;go('feed')}
   catch(_){pub.disabled=false;pub.textContent='🚀 '+tr('ចែករំលែក','Publish');tst(tr('រក្សាទុកមិនបាន','Could not save'))}};
  stage2.appendChild(pub);const back=E('button','btn full',tr('ជ្រើសវីដេអូផ្សេង','Choose another video'));back.onclick=()=>{stage2.style.display='none';stage1.style.display='';v.pause()};stage2.appendChild(back)};
 if(hasExp){const b=E('button','btn gold full','🎬 '+tr('ចែករំលែកវីដេអូ Export ចុងក្រោយ','Post my last export'));b.onclick=()=>pick(expBlob,tr('វីដេអូរបស់ខ្ញុំ','My video'));stage1.appendChild(b)}
 const pb=E('button','btn full','📁 '+tr('ជ្រើសវីដេអូពីទូរសព្ទ','Choose a video'));pb.onclick=()=>file.click();stage1.appendChild(pb);
 file.onchange=()=>{if(file.files[0])pick(file.files[0],file.files[0].name)};
 if(!hasExp)stage1.appendChild(E('div','note',tr('បន្ទាប់ពី Export វីដេអូ នឹងមានប៊ូតុងចែករំលែកវីដេអូចុងក្រោយនៅទីនេះ។','After you Export a video, a button to post it will appear here.')));
}
/* ---- feed (TikTok-style, V6.3.33) ---- */
async function feed(){
 root.innerHTML='';clearUrls();root.classList.remove('social-front');
 const startId=feedStart,ff=feedFilter;feedStart=null;feedFilter=null;
 const h=E('div','kh'),b=E('button','kb','‹');b.onclick=()=>{root.querySelectorAll('video').forEach(v=>v.pause());go('home')};h.classList.add('social-feed-header');
 h.append(b,E('b','',ff&&ff.type==='creator'?'@'+esc(ff.author||''):ff&&ff.type==='tag'?esc(ff.tag):ff&&ff.type==='tags'?tr('សហគមន៍របស់ខ្ញុំ','My communities'):ff&&ff.type==='mine'?tr('វីដេអូរបស់ខ្ញុំ','My videos'):tr('វីដេអូ','Videos')));
 const pp=E('button','btn',tr('+ ចែករំលែក','+ Post'));pp.onclick=()=>go('post');h.appendChild(pp);root.appendChild(h);
 let posts=[];try{posts=(await allPosts()).map(normalizeSocialPost)}catch(_){}
 if(ff&&ff.type==='creator')posts=posts.filter(p=>(ff.uid?p.uid===ff.uid:p.author===ff.author));
 if(ff&&ff.type==='tag'){const t=String(ff.tag).toLowerCase();posts=posts.filter(p=>hashtagsOf(p.caption).some(x=>x.toLowerCase()===t))}
 if(ff&&ff.type==='tags'){const t=new Set((ff.tags||[]).map(x=>String(x).toLowerCase()));posts=posts.filter(p=>hashtagsOf(p.caption).some(x=>t.has(x.toLowerCase())))}
 if(ff&&ff.type==='mine'){const me=currentSocialUid();posts=posts.filter(p=>p.uid===me)}
 if(!posts.length){const s=E('div','ks');s.appendChild(E('div','empty',tr('មិនទាន់មានវីដេអូទេ។ ចែករំលែកវីដេអូដំបូងរបស់អ្នក!','No videos yet. Post your first one!')));root.appendChild(s);return}
 const f=E('div','feed');root.appendChild(f);
 const timers=new WeakMap();
 const ensure=el=>{const v=el.querySelector('video');if(v&&!v.src&&el._u){v.src=el._u}return v};
 const io=new IntersectionObserver(es=>es.forEach(e=>{
  const el=e.target,v=ensure(el);if(!v)return;
  if(e.isIntersecting){v.play().catch(()=>{});const nx=el.nextElementSibling;if(nx)ensure(nx);
   clearTimeout(timers.get(el));timers.set(el,setTimeout(()=>{if(el._p){addView(el._p);const sp=el.querySelector('.kx-views');if(sp)sp.textContent='👁 '+fmtN(viewsOf(el._p))}},1500))}
  else{v.pause();clearTimeout(timers.get(el))}}),{root:f,threshold:.65});
 posts.forEach(p=>{
  const el=E('div','post');el.dataset.id=p.id;el._p=p;
  const v=document.createElement('video');const u=videoURL(p);
  if(u){el._u=u;v.loop=true;v.playsInline=true;v.setAttribute('playsinline','');v.muted=true;v.preload='metadata';if(thumbs[p.id])v.poster=thumbs[p.id];el.appendChild(v)}
  else el.appendChild(E('div','sf-empty',tr('វីដេអូ Cloud៖ Preview មិនទាន់មាននៅលើឧបករណ៍នេះ','Cloud video: preview is not available on this device')));
  const burst=E('div','kx-burst','❤️');el.appendChild(burst);
  const mute=E('div','kx-mute','🔇');el.appendChild(mute);
  const prog=E('div','kx-prog');const pi=E('i');prog.appendChild(pi);el.appendChild(prog);
  v.ontimeupdate=()=>{if(v.duration)pi.style.width=(v.currentTime/v.duration*100)+'%'};
  const doLike=async(force)=>{const uid=currentSocialUid();if(!uid){tst(tr('សូមចូលគណនីដើម្បីចូលចិត្តវីដេអូ','Log in to like videos'));return}
   const set=new Set(p.likedBy);if(force&&set.has(uid))return;if(set.has(uid))set.delete(uid);else set.add(uid);p.likedBy=[...set];p.likes=p.likedBy.length;await putPost(p);lk.innerHTML='<i>'+(set.has(uid)?'❤️':'🤍')+'</i><span>'+p.likes+'</span>'};
  let tap=0,tt=null;
  el.addEventListener('click',e=>{if(e.target.closest('.side,.cap,.drawer'))return;const now=Date.now();
   if(now-tap<280){clearTimeout(tt);tap=0;const r=el.getBoundingClientRect();burst.style.left=(e.clientX-r.left-40)+'px';burst.style.top=(e.clientY-r.top-40)+'px';burst.classList.remove('go');void burst.offsetWidth;burst.classList.add('go');doLike(true)}
   else{tap=now;tt=setTimeout(()=>{const vv=el.querySelector('video');if(vv){vv.muted=!vv.muted;mute.textContent=vv.muted?'🔇':'🔊';mute.classList.remove('go');void mute.offsetWidth;mute.classList.add('go')}},280)}});
  const cap=E('div','cap'),nmb=E('b','');nmb.textContent='@'+(p.author||'KAISER');nmb.style.cursor='pointer';nmb.onclick=e=>{e.stopPropagation();feedStart=null;feedFilter={type:'creator',uid:p.uid,author:p.author};go('feed')};
  const txt=E('span','kx-captxt');const raw=p.caption||'';
  txt.innerHTML=esc(raw).replace(/#[\p{L}\p{N}_]+/gu,m=>'<em>'+m+'</em>');
  const vw=E('small','kx-views','👁 '+fmtN(viewsOf(p)));
  cap.append(nmb,txt,vw);if(raw.length>70){txt.classList.add('clamp');cap.onclick=()=>txt.classList.toggle('clamp')}
  el.appendChild(cap);
  const side=E('div','side');
  const avw=E('div','kx-sideav');avw.appendChild(avatarOf(p,46));
  if(p.uid&&p.uid!==currentSocialUid()){const fb=E('button','kx-plusbtn'+(isFollowing(p.uid)?' on':''),isFollowing(p.uid)?'✓':'+');fb.onclick=e=>{e.stopPropagation();const r=toggleFollow(p.uid);if(r!==null){fb.classList.toggle('on',r);fb.textContent=r?'✓':'+'}};avw.appendChild(fb)}
  side.appendChild(avw);
  const liked=likedByCurrentUser(p),lk=E('button','',`<i>${liked?'❤️':'🤍'}</i><span>${p.likedBy.length}</span>`),cm=E('button','',`<i>💬</i><span>${(p.comments||[]).length}</span>`),sh=E('button','','<i>↗️</i><span>'+tr('ចែក','Share')+'</span>');
  lk.onclick=e=>{e.stopPropagation();doLike(false)};
  cm.onclick=e=>{e.stopPropagation();drawer(p,el,cm)};
  sh.onclick=async e=>{e.stopPropagation();try{if(!p.blob){if(p.videoUrl)window.open(p.videoUrl,'_blank','noopener');else tst(tr('មិនមានឯកសារវីដេអូក្នុងឧបករណ៍នេះ','Video file is not available on this device'));return}const file=new File([p.blob],'kaiser-video.mp4',{type:p.blob.type||'video/mp4'});if(navigator.canShare&&navigator.canShare({files:[file]}))await navigator.share({files:[file],text:p.caption});else{const a=document.createElement('a');a.href=u;a.download='kaiser-video.mp4';a.click()}}catch(_){}};
  side.append(lk,cm,sh);
  if(logged&&acc&&p.uid===acc.uid){const d=E('button','','<i>🗑</i>');d.onclick=async e=>{e.stopPropagation();if(!confirm(tr('លុបវីដេអូនេះ?','Delete this video?')))return;await delPost(p.id);const m=LS(VIEW_KEY,{});delete m[p.id];SS(VIEW_KEY,m);delete thumbs[p.id];saveThumbs();go('feed')};side.appendChild(d)}
  el.appendChild(side);f.appendChild(el);io.observe(el)});
 if(startId){requestAnimationFrame(()=>{const t=f.querySelector('[data-id="'+startId+'"]');if(t)f.scrollTop=t.offsetTop})}
}
function drawer(p,el,btn){
 el.querySelectorAll('.drawer').forEach(x=>x.remove());
 const d=E('div','drawer'),l=E('div','list'),paint=()=>{l.innerHTML=(p.comments||[]).length?p.comments.map(c=>`<p><b>${esc(c.n||'User')}</b> ${esc(c.t||'')}${logged&&acc&&c.uid===acc.uid?' <small style="color:#a78bfa">· '+tr('អ្នក','you')+'</small>':''}</p>`).join(''):`<p style="color:#8b8b9d">${tr('មិនទាន់មានមតិ','No comments yet')}</p>`};paint();
 const i=E('input');i.placeholder=tr('សរសេរមតិ...','Add a comment...');i.style.margin='0 0 8px';
 const send=E('button','btn gold',tr('ផ្ញើ','Send')),x=E('button','btn',tr('បិទ','Close'));
 send.onclick=async()=>{if(!logged||!acc){tst(tr('សូមចូលគណនីជាមុន','Please log in first'));return}const t=i.value.trim();if(!t)return;(p.comments=p.comments||[]).push({uid:acc.uid,n:acc.name,t,ts:Date.now()});await putPost(p);i.value='';paint();btn.querySelector('span').textContent=p.comments.length};
 x.onclick=()=>d.remove();
 const r=E('div','');r.style.cssText='display:flex;gap:8px';r.append(send,x);d.append(l,i,r);el.appendChild(d);
}
/* ---- wire into toolbar ---- */
Object.assign(P,{user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'});
T.me=()=>open('home');
if(!MN.main.some(x=>x[2]==='me'))MN.main.push(['user','Me','me']);
if(typeof MNK!=='undefined'&&MNK==='main')menu('main');
window.KAISER_ME={open,close,go};
/* Social-first launch: the original editor remains intact underneath. */
open('home');
})();
