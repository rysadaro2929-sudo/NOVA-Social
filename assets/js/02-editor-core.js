const $=s=>document.querySelector(s),cv=$('#cv'),ctx=cv.getContext('2d'),snap=document.createElement('canvas'),sctx=snap.getContext('2d');
const P={scissors:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',swap:'<path d="M7 7h13l-3-3M17 17H4l3 3"/>',speed:'<path d="M12 14l4-5"/><path d="M4 18a9 9 0 1 1 16 0"/>',vol:'<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6"/>',fil:'<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/>',ratio:'<rect x="5" y="3" width="14" height="18" rx="2"/>',text:'<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',anim:'<path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',back:'<path d="M15 5l-7 7 7 7"/>',dia:'<path d="M12 3l9 9-9 9-9-9z"/>',plus:'<path d="M12 5v14M5 12h14"/>',check:'<path d="M5 12l5 5 9-10"/>',play:'<path d="M8 5v14l11-7z"/>',pause:'<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>'};
var MNK='main',cropEdit=false,tkOn=false;
const I=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${P[n]}</svg>`;
Object.assign(P,{
 crop:'<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
 flip:'<path d="M12 3v18"/><path d="M8 7 3 12l5 5V7z"/><path d="M16 7l5 5-5 5V7z"/>',
 flipv:'<path d="M3 12h18"/><path d="M7 8l5-5 5 5H7z"/><path d="M7 16l5 5 5-5H7z"/>',
 rotate:'<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
 copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
 layer:'<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/>',
 opacity:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
 fill:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
 fit:'<rect x="6" y="6" width="12" height="12" rx="1"/><path d="M2 8V3h5M22 8V3h-5M2 16v5h5M22 16v5h-5"/>',
 stretch:'<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>',
 corner:'<path d="M4 20V11a7 7 0 0 1 7-7h9"/>',
 border:'<rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="3 3"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
 blend:'<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/>',
 reset:'<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/>'
});
const fmt=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
const sm=p=>p*p*(3-2*p),cl=(n,a,b)=>Math.max(a,Math.min(b,n));
function toast(m){const e=$('#toast');e.textContent=m;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),1900)}
const FIL={None:'',Vivid:'saturate(1.6) contrast(1.1)',Warm:'sepia(.35) saturate(1.3)',Cool:'hue-rotate(190deg) saturate(1.1)','B&W':'grayscale(1)',Fade:'contrast(.85) brightness(1.1) saturate(.8)'};
const PL={TikTok:'9:16',YouTube:'16:9',X:'1:1'},plat=()=>Object.keys(PL).find(k=>PL[k]===ratio),dimTxt=()=>{const R=ratio.split(':').map(Number),s=expShort;return R[0]<R[1]?s+'×'+Math.round(s*R[1]/R[0]):R[0]>R[1]?Math.round(s*R[0]/R[1])+'×'+s:s+'×'+s};
const TR={None:'⊘',Fade:'◐','Slide Left':'←','Slide Right':'→','Slide Up':'↑','Slide Down':'↓',Zoom:'⤢',Wipe:'▥',Flip:'⇋','Dip Black':'■'};
let kpOn=false,kdrag=false,TX=[],selT=-1,selOV=-1,td=0,moved=false;
let mediaAudio=[],mediaPreview=null,voiceClips=[],voiceNodes=[];let C=[],OV=[],st=[],dur=[],total=0,cur=0,g=0,playing=false,hist=[],ex=null,pvEnd=0,ac=null,adest=null,PPS=60,lastSet=-9,expShort=1080,expFps=30,expBitrate='auto',expFormat='auto',expAudioBitrate=256,ratio='9:16',expBlob=null,expName='';
$('#add').innerHTML=I('plus');$('#imp2').innerHTML=I('plus');$('#play').innerHTML=I('play');$('#ok').innerHTML=I('check');
/* layout */
function recalc(){let a=0;st=[];dur=[];C.forEach((c,i)=>{const d=(c.out-c.in)/c.spd;st.push(a);dur.push(d);a+=d});total=a}
function setCanvas(short){const R={'9:16':[9,16],'16:9':[16,9],'1:1':[1,1]}[ratio];let w,h;if(R[0]<R[1]){w=short;h=Math.round(short*R[1]/R[0])}else{h=short;w=Math.round(short*R[0]/R[1])}cv.width=snap.width=w&~1;cv.height=snap.height=h&~1}
function build(){
 recalc();const tk=$('#tk');tk.querySelectorAll('.clip,.jn').forEach(e=>e.remove());const add=$('#add');
 C.forEach((c,i)=>{const b=document.createElement('div');b.className='clip';b.dataset.i=i;b.innerHTML='<div class="cb"></div><i></i><div class="hd l"></div><div class="hd r"></div>';
  b.firstChild.onclick=e=>{selOV=-1;document.querySelectorAll('.tb.sel').forEach(x=>x.classList.remove('sel'));const r=b.firstChild.getBoundingClientRect();seekG(st[i]+Math.max(.01,(e.clientX-r.left)/PPS))};tk.insertBefore(b,add);
  if(i<C.length-1){const j=document.createElement('button');j.className='jn'+(c.tr.t!=='None'?' on':'');j.dataset.i=i;j.innerHTML=I('swap');j.onclick=e=>{e.stopPropagation();trSheet(i)};tk.appendChild(j)}});
 $('#empty').classList.toggle('off',!!C.length);cv.classList.toggle('in',!!C.length);lay();mark()}
function lay(){
 recalc();const half=$('#tw').clientWidth/2;
 document.querySelectorAll('.clip').forEach(b=>{const i=+b.dataset.i,c=C[i];if(!c)return;b.style.width=dur[i]*PPS+'px';b.querySelector('i').textContent=dur[i].toFixed(1)+'s';
  b.querySelectorAll('.kd').forEach(x=>x.remove());(c.kf||[]).forEach((q,ki)=>{const d=document.createElement('button');d.type='button';d.className='kd';d.dataset.clip=i;d.dataset.key=ki;d.setAttribute('aria-label','Keyframe');d.style.left=q.t*PPS+'px';b.appendChild(d)});
  const cb=b.firstChild,sp=c.el.strip;
  if(sp){cb.style.backgroundImage='url('+sp+')';cb.style.backgroundSize=(c.el.duration/c.spd*PPS)+'px 100%';cb.style.backgroundPosition=(-c.in/c.spd*PPS)+'px 0'}
  else if(c.th){cb.style.backgroundImage='url('+c.th+')';cb.style.backgroundSize='auto 100%';cb.style.backgroundRepeat='repeat-x'}});
 document.querySelectorAll('.jn').forEach(j=>{const i=+j.dataset.i;j.style.left=half+(st[i]+dur[i])*PPS+'px'});
 const tt=$('#tt');tt.innerHTML='';
 OV.forEach((o,i)=>{if(!o.uid)o.uid='ov-'+i+'-'+Math.round((o.start||0)*1000);const b=document.createElement('div');b.className='tb ov'+(i===selOV?' sel':'');b.dataset.kind='ov';b.dataset.index=i;b.style.left=half+o.start*PPS+'px';b.style.width=Math.max(28,o.duration*PPS)+'px';b.style.top=((o.lane??(i%3))*30)+'px';b.textContent='▣ '+o.name+(TX.some(t=>t.attachTo===o.uid)?' · T':'');b.classList.toggle('has-text',TX.some(t=>t.attachTo===o.uid));b.insertAdjacentHTML('afterbegin','<span class="edge l"></span>');b.insertAdjacentHTML('beforeend','<span class="edge r"></span>');tt.appendChild(b)});
 TX.forEach((t,i)=>{if(!t._laneV2){t.lane=t.attachTo?cl(t.lane??1,0,4):(t.lane??(i%2))+3;t._laneV2=true}const b=document.createElement('div');b.className='tb tx'+(i===selT?' sel':'')+(t.attachTo?' attached':'');b.dataset.kind='tx';b.dataset.index=i;b.style.left=half+t.st*PPS+'px';b.style.width=Math.max(28,t.d*PPS)+'px';b.style.top=((t.lane??3)*30)+'px';b.textContent=(t.attachTo?'🔗 ':'T · ')+t.s;b.insertAdjacentHTML('afterbegin','<span class="edge l"></span>');b.insertAdjacentHTML('beforeend','<span class="edge r"></span>');(t.kf||[]).forEach(q=>{const m=document.createElement('i');m.className='tkd';m.style.left=q.t*PPS+'px';b.appendChild(m)});tt.appendChild(b)});
 $('#clipn').textContent=C.length+' clip';info();if((MNK==='ovl'||MNK==='crop')&&!OV[selOV]){cropEdit=false;menu('main')}if(tkOn&&!TX[selT])tkClose()}

let trackDrag=null,trackSuppressClick=false;
/* Timeline: two-finger pinch zoom, preserving the time under the fingers. */
(()=>{
 const el=$('#tw'),pts=new Map();let pinch=null;
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 el.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch')return;
  pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pts.size===2){
   e.preventDefault();e.stopImmediatePropagation();
   const a=[...pts.values()],mid=(a[0].x+a[1].x)/2;
   const rect=el.getBoundingClientRect();
   pinch={d:Math.max(1,dist(a[0],a[1])),pps:PPS,
    time:(el.scrollLeft+mid-rect.left-el.clientWidth/2)/PPS,
    offset:mid-rect.left};
   trackDrag=null;dr=null;
   try{el.setPointerCapture(e.pointerId)}catch(_){}
  }
 },true);
 el.addEventListener('pointermove',e=>{
  if(!pinch||!pts.has(e.pointerId))return;
  e.preventDefault();e.stopImmediatePropagation();
  pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pts.size<2)return;
  const a=[...pts.values()],d=Math.max(1,dist(a[0],a[1]));
  PPS=cl(pinch.pps*d/pinch.d,20,240);
  lay();
  el.scrollLeft=Math.max(0,el.clientWidth/2+pinch.time*PPS-pinch.offset);
  lastSet=el.scrollLeft;
 },true);
 const finish=e=>{
  pts.delete(e.pointerId);
  if(pts.size<2)pinch=null;
 };
 el.addEventListener('pointerup',finish,true);
 el.addEventListener('pointercancel',finish,true);
})();


/* V6.3.17 Timeline magnet + vertical lane drag + text/overlay timing attachment.
   Snaps layer edges to nearby clip/layer edges; linked text follows its overlay. */
function timelineSnap(value,excludeKind,excludeIndex){
 const threshold=.16;let best=value,dist=threshold;
 const targets=[];
 C.forEach((c,i)=>{targets.push(st[i],st[i]+dur[i])});
 OV.forEach((o,i)=>{if(excludeKind==='ov'&&i===excludeIndex)return;targets.push(o.start,o.start+o.duration)});
 TX.forEach((t,i)=>{if(excludeKind==='tx'&&i===excludeIndex)return;targets.push(t.st,t.st+t.d)});
 targets.forEach(x=>{const d=Math.abs(x-value);if(d<dist){dist=d;best=x}});
 return best;
}
function syncAttachedText(overlay,oldStart,oldDuration){
 if(!overlay||!overlay.uid)return;
 const delta=(overlay.start||0)-oldStart;
 TX.forEach(t=>{if(t.attachTo===overlay.uid){t.st=Math.max(0,t.st+delta);t.d=Math.max(.2,overlay.duration||t.d)}});
}
function attachTextToOverlay(textIndex){
 const t=TX[textIndex];if(!t||!OV.length)return toast('សូមបន្ថែម Overlay ជាមុន');
 const candidates=OV.map((o,i)=>({o,i,overlap:Math.max(0,Math.min(t.st+t.d,o.start+o.duration)-Math.max(t.st,o.start))}));
 candidates.sort((a,b)=>b.overlap-a.overlap);
 const chosen=candidates[0].o;
 if(!chosen.uid)chosen.uid='ov-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
 snp();t.attachTo=chosen.uid;t.st=chosen.start;t.d=Math.max(.2,chosen.duration);t.lane=cl((chosen.lane??0)+1,0,4);t._laneV2=true;
 lay();toast('បានភ្ជាប់ Text ជាមួយ Overlay · អូស Overlay ដើម្បីផ្លាស់ទីជាមួយគ្នា');
}

$('#tt').addEventListener('pointerdown',e=>{
 const b=e.target.closest('.tb');if(!b||playing||ex)return;e.preventDefault();e.stopPropagation();
 const kind=b.dataset.kind,i=+b.dataset.index,obj=kind==='tx'?TX[i]:OV[i];if(!obj)return;
 const edge=e.target.closest('.edge'),mode=edge?(edge.classList.contains('l')?'left':'right'):'move';
 document.querySelectorAll('.tb.sel').forEach(x=>x.classList.remove('sel'));if(kind==='tx'){selT=i;selOV=-1}else{selOV=i;selT=-1;b.classList.add('sel')}
 trackDrag={kind,i,mode,x:e.clientX,y:e.clientY,start:kind==='tx'?obj.st:obj.start,duration:kind==='tx'?obj.d:obj.duration,sourceStart:obj.sourceStart||0,lane:obj.lane??(kind==='tx'?3:0),el:b,moved:false,verticalMoved:false};
 try{b.setPointerCapture(e.pointerId)}catch(_){}
});
addEventListener('pointermove',e=>{
 if(!trackDrag)return;const d=trackDrag,obj=d.kind==='tx'?TX[d.i]:OV[d.i];if(!obj)return;
 const delta=(e.clientX-d.x)/PPS,min=.2,end=d.start+d.duration;
 const oldStart=obj.st??obj.start,oldDuration=obj.d??obj.duration;
 if(d.mode==='move'&&Math.abs(e.clientY-d.y)>=13){
  const lane=cl(Math.round(d.lane+(e.clientY-d.y)/30),0,4);
  if(lane!==(obj.lane??d.lane)){if(!d.moved){snp();d.moved=true}obj.lane=lane;d.verticalMoved=true;d.el.style.top=(lane*30)+'px'}
 }
 if(d.mode==='move'){
  let ns=cl(d.start+delta,0,Math.max(0,total-d.duration));
  ns=timelineSnap(ns,d.kind,d.i);
  const snappedEnd=timelineSnap(ns+d.duration,d.kind,d.i);if(Math.abs(snappedEnd-(ns+d.duration))<.16)ns=cl(snappedEnd-d.duration,0,Math.max(0,total-d.duration));
  if(Math.abs(ns-d.start)>.01&&!d.moved){snp();d.moved=true}
  if(d.kind==='tx')obj.st=ns;else obj.start=ns;
 }else if(d.mode==='left'){
  let ns=cl(d.start+delta,0,end-min);ns=cl(timelineSnap(ns,d.kind,d.i),0,end-min);
  if(Math.abs(ns-d.start)>.01&&!d.moved){snp();d.moved=true}
  if(d.kind==='tx'){obj.st=ns;obj.d=end-ns}else{obj.start=ns;obj.duration=end-ns;if(obj.type==='video')obj.sourceStart=d.sourceStart+(ns-d.start)}
 }else{
  const maxDuration=d.kind==='ov'&&obj.type==='video'?Math.max(min,(obj.el.duration||Infinity)-(obj.sourceStart||0)):Math.max(min,total-d.start);
  let nd=cl(d.duration+delta,min,maxDuration);const snappedEnd=timelineSnap(d.start+nd,d.kind,d.i);nd=cl(snappedEnd-d.start,min,maxDuration);
  if(Math.abs(nd-d.duration)>.01&&!d.moved){snp();d.moved=true}
  if(d.kind==='tx')obj.d=nd;else obj.duration=nd;
 }
 if(d.kind==='ov'&&(obj.start!==oldStart||obj.duration!==oldDuration))syncAttachedText(obj,oldStart,oldDuration);
 const start=d.kind==='tx'?obj.st:obj.start,dur2=d.kind==='tx'?obj.d:obj.duration;
 d.el.style.left=(($('#tw').clientWidth/2)+start*PPS)+'px';d.el.style.width=Math.max(28,dur2*PPS)+'px';
});
addEventListener('pointerup',e=>{
 if(!trackDrag)return;const d=trackDrag;trackDrag=null;
 if(d.moved){trackSuppressClick=true;setTimeout(()=>trackSuppressClick=false,250);lay();seekG(cl(g,0,Math.max(0,total-.01)));toast(d.verticalMoved?(d.kind==='tx'?'បានផ្លាស់ប្ដូរជួរ Text ឡើង/ចុះ':'បានផ្លាស់ប្ដូរជួរ Overlay ឡើង/ចុះ'):(d.kind==='tx'?'បានកែទីតាំង/រយៈពេល Text':'បានកែទីតាំង/រយៈពេល Overlay'))}
 else if(d.kind==='tx'){selT=d.i;lay();{const q=TX[d.i];if(g<q.st||g>=q.st+q.d)seekG(cl(q.st+.01,0,Math.max(0,total-.01)))}tkOpen(d.i)}
 else{selOV=d.i;selT=-1;lay();{const q=OV[d.i];if(g<q.start||g>=q.start+q.duration)seekG(cl(q.start+.01,0,Math.max(0,total-.01)))}overlaySheet(d.i)}
});
let tchain=Promise.resolve();
async function strip(el){
 const F=Math.max(2,Math.min(36,Math.ceil(el.duration/1.2))),tv=document.createElement('video');
 tv.muted=true;tv.playsInline=true;tv.preload='auto';tv.style.cssText=el.style.cssText;document.body.appendChild(tv);tv.src=el.src;
 try{
  await new Promise((r,j)=>{tv.onloadeddata=r;tv.onerror=j;setTimeout(r,6000)});
  const k=document.createElement('canvas'),tw=64,th=60;k.width=tw*F;k.height=th;const x=k.getContext('2d');
  for(let n=0;n<F;n++){
   tv.currentTime=Math.min(el.duration-.05,(n+.5)*el.duration/F);
   await new Promise(r=>{tv.onseeked=r;setTimeout(r,900)});await new Promise(r=>setTimeout(r,70));
   const q=Math.max(tw/tv.videoWidth,th/tv.videoHeight);
   x.drawImage(tv,n*tw+(tw-tv.videoWidth*q)/2,(th-tv.videoHeight*q)/2,tv.videoWidth*q,tv.videoHeight*q);
   if(n%6==5||n==F-1){el.strip=k.toDataURL('image/jpeg',.55);lay()}}
 }catch(_){}
 tv.remove()}
/* trim handles */
let dr=null,trimming=false;
$('#tk').addEventListener('pointerdown',e=>{const h=e.target.closest('.hd');if(!h||playing)return;e.preventDefault();const i=+h.parentNode.dataset.i,c=C[i];snp();h.setPointerCapture(e.pointerId);dr={i,l:h.classList.contains('l'),x:e.clientX,in:c.in,out:c.out,sc:$('#tw').scrollLeft}});
addEventListener('pointermove',e=>{
 if(!dr)return;const c=C[dr.i],dx=e.clientX-dr.x,ds=dx/PPS*c.spd;trimming=true;cur=dr.i;
 if(dr.l){c.in=cl(dr.in+ds,0,c.out-.2);const a=(c.in-dr.in)/c.spd*PPS;lay();lastSet=Math.max(0,dr.sc-a);$('#tw').scrollLeft=lastSet;c.el.currentTime=c.in}
 else{c.out=cl(dr.out+ds,c.in+.2,c.el.duration);lay();c.el.currentTime=Math.max(c.in,c.out-.05)}
 mark()});
addEventListener('pointerup',()=>{if(!dr)return;dr=null;trimming=false;lay();seekG($('#tw').scrollLeft/PPS)});

/* Timeline keyframe diamonds: tap to jump/open controls; drag horizontally to retime. */
let kfTimelineDrag=null;
$('#tk').addEventListener('pointerdown',e=>{
 const marker=e.target.closest('.kd');if(!marker||playing||ex)return;
 e.preventDefault();e.stopPropagation();
 const ci=+marker.dataset.clip,ki=+marker.dataset.key,c=C[ci],q=c&&c.kf&&c.kf[ki];if(!q)return;
 kfTimelineDrag={ci,key:q,x:e.clientX,start:q.t,moved:false,marker};
 try{marker.setPointerCapture(e.pointerId)}catch(_){}
},true);
addEventListener('pointermove',e=>{
 const d=kfTimelineDrag;if(!d)return;
 const c=C[d.ci];if(!c)return;
 const next=cl(d.start+(e.clientX-d.x)/PPS,0,Math.max(0,dur[d.ci]-.01));
 if(Math.abs(next-d.key.t)>.015&&!d.moved){snp();d.moved=true}
 if(d.moved){d.key.t=next;d.marker.style.left=next*PPS+'px'}
});
addEventListener('pointerup',()=>{
 const d=kfTimelineDrag;if(!d)return;kfTimelineDrag=null;
 const c=C[d.ci];if(!c)return;
 if(d.moved){c.kf.sort((a,b)=>a.t-b.t);cur=d.ci;seekG(st[d.ci]+d.key.t);lay();toast('បានផ្លាស់ទី Keyframe')}
 else{cur=d.ci;seekG(st[d.ci]+d.key.t);if(!kpOn)T.kf();else kpRefresh()}
});
addEventListener('pointercancel',()=>{if(!kfTimelineDrag)return;const d=kfTimelineDrag;kfTimelineDrag=null;if(C[d.ci]){C[d.ci].kf.sort((a,b)=>a.t-b.t);lay()}});

function mark(){document.querySelectorAll('.clip').forEach(b=>b.classList.toggle('sel',+b.dataset.i===cur))}
function info(){$('#cur').textContent=fmt(g)+' / '+fmt(total);if(kpOn&&!kdrag)kpRefresh();if(tkOn&&!kdrag)tkRefresh()}
/* import */
$('#imp').onclick=$('#imp2').onclick=$('#add').onclick=()=>$('#file').click();
function freeLane(list,start,duration,startKey,endKey,maxLanes){
 for(let lane=0;lane<maxLanes;lane++){
  const clash=list.some(o=>(o.lane??0)===lane&&start<(o[startKey]+o[endKey])&&start+duration>o[startKey]);
  if(!clash)return lane;
 }
 return Math.max(0,...list.map(o=>o.lane??0))+1;
}
$('#overlayFile').onchange=async e=>{const fs=[...e.target.files];for(const f of fs){try{const url=URL.createObjectURL(f);let item;if(f.type.startsWith('image/')){const im=new Image();await new Promise((r,j)=>{im.onload=r;im.onerror=j;im.src=url});item={uid:'ov-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),el:im,type:'image',name:f.name,start:g,duration:5,sourceStart:0,lane:freeLane(OV,g,5,'start','duration',3),x:0,y:0,scale:.42,opacity:1,adj:{brightness:100,contrast:100,saturation:100,exposure:100}}}else{const el=await loadV(url);if(!isFinite(el.duration)||!el.duration)throw 'រកប្រវែងវីដេអូមិនឃើញ';el.muted=true;item={uid:'ov-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),el,type:'video',name:f.name,start:g,duration:el.duration,sourceStart:0,lane:freeLane(OV,g,el.duration,'start','duration',3),x:0,y:0,scale:.42,opacity:1,adj:{brightness:100,contrast:100,saturation:100,exposure:100}}}OV.push(item);lay()}catch(err){toast('Overlay បរាជ័យ: '+(err.message||err))}}e.target.value='';if(OV.length){selOV=OV.length-1;selT=-1;cropEdit=false;closeSheet();menu('ovl');lay()}toast('បានបន្ថែម Overlay '+OV.length+'')};
/* Mobile media readiness: metadata alone does not guarantee a decoded video frame. */
function waitVideoFrame(el,timeout=10000){return new Promise((resolve,reject)=>{
 let settled=false,timer;
 const clean=()=>{clearTimeout(timer);el.removeEventListener('loadeddata',check);el.removeEventListener('canplay',check);el.removeEventListener('seeked',check);el.removeEventListener('error',fail)};
 const done=()=>{if(settled)return;settled=true;clean();requestAnimationFrame(()=>resolve(el))};
 const check=()=>{if(el.readyState>=2&&el.videoWidth>0&&el.videoHeight>0&&!el.seeking)done()};
 const fail=()=>{if(settled)return;settled=true;clean();reject(new Error('មិនអាច Decode រូបភាពវីដេអូបាន (code '+(el.error&&el.error.code||'unknown')+')'))};
 el.addEventListener('loadeddata',check);el.addEventListener('canplay',check);el.addEventListener('seeked',check);el.addEventListener('error',fail);
 timer=setTimeout(()=>{if(el.readyState>=2&&el.videoWidth>0&&!el.seeking)done();else{if(settled)return;settled=true;clean();reject(new Error('រង់ចាំ Frame រូបភាពយូរពេក'))}},timeout);
 check();
 if(typeof el.requestVideoFrameCallback==='function'){try{el.requestVideoFrameCallback(()=>check())}catch(_){}}
 })}
function seekVideoFrame(el,time,timeout=5000){return new Promise((resolve,reject)=>{
 let settled=false;const finish=err=>{if(settled)return;settled=true;clearTimeout(timer);el.removeEventListener('seeked',onSeek);el.removeEventListener('error',onError);err?reject(err):resolve(el)};
 const onSeek=()=>{if(el.readyState>=2&&el.videoWidth>0)finish()};const onError=()=>finish(new Error('មិនអាចអាន Frame រូបភាពបាន'));
 const timer=setTimeout(()=>{if(el.readyState>=2&&el.videoWidth>0)finish();else finish(new Error('រង់ចាំ Frame រូបភាពយូរពេក'))},timeout);
 el.addEventListener('seeked',onSeek);el.addEventListener('error',onError);
 try{if(Math.abs((el.currentTime||0)-time)<.015&&!el.seeking){if(el.readyState>=2&&el.videoWidth>0)finish();else waitVideoFrame(el,timeout).then(()=>finish(),finish)}else el.currentTime=time}catch(err){finish(err)}
 })}
function loadV(url){return new Promise((res,rej)=>{
 const el=document.createElement('video');el.playsInline=true;el.setAttribute('playsinline','');el.preload='auto';
 el.style.cssText='position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none;z-index:-1';document.body.appendChild(el);
 const to=setTimeout(()=>{el.removeAttribute('src');el.load();rej(new Error('ចំណាយពេលផ្ទុកវីដេអូយូរពេក'))},25000);
 el.onloadedmetadata=()=>{waitVideoFrame(el,12000).then(()=>{clearTimeout(to);res(el)}).catch(err=>{clearTimeout(to);rej(err)})};
 el.onerror=()=>{clearTimeout(to);rej(new Error('Format មិនគាំទ្រ (code '+(el.error&&el.error.code)+')'))};
 el.src=url;el.load()})}
$('#file').onchange=async e=>{
 const inp=e.target,fs=[...inp.files];if(!fs.length)return;
 const urls=fs.map(f=>URL.createObjectURL(f));let first=!C.length;toast('កំពុងផ្ទុកវីដេអូ...');
 for(let n=0;n<fs.length;n++){
  try{
   const el=await loadV(urls[n]);
   if(!isFinite(el.duration)||!el.duration)throw 'រកប្រវែងវីដេអូមិនឃើញ';
   let th='';
   try{await seekVideoFrame(el,Math.min(.1,el.duration/2),5000);
    const k=document.createElement('canvas');k.width=45;k.height=80;const q=Math.max(45/el.videoWidth,80/el.videoHeight);
    k.getContext('2d').drawImage(el,(45-el.videoWidth*q)/2,(80-el.videoHeight*q)/2,el.videoWidth*q,el.videoHeight*q);th=k.toDataURL('image/jpeg',.6)}catch(_){}
   C.push({el,name:fs[n].name,th,in:0,out:el.duration,spd:1,vol:1,fil:'None',adj:{brightness:100,contrast:100,saturation:100,exposure:100},tr:{t:'None',d:.6},pr:{...P0},kf:[]});
   build();tchain=tchain.then(()=>strip(el));if(first){first=false;cur=0;seekG(0)}toast('បានបន្ថែម '+C.length+' ក្លិប')
  }catch(err){toast('បរាជ័យ: '+(err&&err.message||err))}
 }
 inp.value='';
};
/* playback */
function seekG(t){
 if(!C.length)return;
 t=Number(t);if(!Number.isFinite(t))t=0;
 if(playing)pause();
 t=cl(t,0,Math.max(0,total-.001));let i=0;while(i<C.length-1&&t>=st[i]+dur[i])i++;
 C.forEach((c,k)=>{if(k!==i&&c.el!==C[i].el)c.el.pause()});
 cur=i;g=t;const c=C[i];c.el.currentTime=c.in+(t-st[i])*c.spd;OV.forEach(o=>{if(o.type==='video'){o.el.pause();if(t>=o.start&&t<o.start+o.duration)o.el.currentTime=cl((o.sourceStart||0)+t-o.start,0,Math.max(0,o.el.duration-.05))}});mark();info();sync()}
function sync(){const x=g*PPS;lastSet=x;$('#tw').scrollLeft=x}
$('#tw').onscroll=()=>{const x=$('#tw').scrollLeft;if(Math.abs(x-lastSet)<2||!C.length)return;if(playing)pause();const t=cl(x/PPS,0,total);if(Math.abs(t-g)>.001)seekG(t)};
function icon(on){$('#tk').classList.toggle('pl',on);$('#play').innerHTML=I(on?'pause':'play')}
function stopVoicePlayback(){
 voiceNodes.forEach(n=>{try{n.stop()}catch(_){};try{n.disconnect()}catch(_){}});
 voiceNodes=[];
}
function startVoicePlayback(){
 if(!voiceClips.length)return;
 const AudioCtx=window.AudioContext||window.webkitAudioContext;
 if(!AudioCtx)return;
 ac=ac||new AudioCtx();
 const destination=adest||ac.destination;
 const now=ac.currentTime;
 voiceClips.forEach(v=>{
  const end=v.start+v.duration;
  if(g>=end)return;
  const offset=(v.trimStart||0)+Math.max(0,g-v.start);
  const delay=Math.max(0,v.start-g);
  try{
   const node=ac.createBufferSource();node.buffer=v.buffer;
   const gain=ac.createGain();gain.gain.value=cl(v.volume??1,0,1);
   node.connect(gain);gain.connect(destination);
   node.onended=()=>{try{node.disconnect();gain.disconnect()}catch(_){}};
   node.start(now+delay,offset,Math.max(.01,v.duration-Math.max(0,g-v.start)));
   voiceNodes.push(node);
  }catch(err){console.warn('Voice playback:',err)}
 });
}
function pause(){
 playing=false;C.forEach(c=>c.el.pause());OV.forEach(o=>{if(o.type==='video')o.el.pause()});
 stopVoicePlayback();
 /* Voice capture follows the video transport: pausing playback also pauses the mic recorder. */
 if(typeof VR!=='undefined'&&VR.rec&&VR.rec.state==='recording'){try{VR.rec.pause()}catch(_){}}
 icon(false)
}
function play(){
 if(!C.length)return toast('សូមបន្ថែមវីដេអូជាមុន');
 if(playing)return pause();
 if(g>=total-.05)seekG(0);
 try{ac&&ac.resume()}catch(_){}
 /* Resume an in-progress voice take only when the video resumes. */
 if(typeof VR!=='undefined'&&VR.rec&&VR.rec.state==='paused'){try{VR.rec.resume()}catch(_){}}
 const c=C[cur];c.el.playbackRate=c.spd;c.el.volume=c.vol;
 const mainPlay=c.el.play();if(mainPlay&&typeof mainPlay.catch==='function')mainPlay.catch(err=>{if(playing){pause();console.warn('KAISER playback blocked:',err);toast('មិនអាចចាក់វីដេអូបានទេ សូមចុច Play ម្ដងទៀត')}});
 OV.forEach(o=>{if(o.type==='video'&&g>=o.start&&g<o.start+o.duration){o.el.currentTime=cl((o.sourceStart||0)+g-o.start,0,Math.max(0,o.el.duration-.05));const overlayPlay=o.el.play();if(overlayPlay&&typeof overlayPlay.catch==='function')overlayPlay.catch(err=>{console.warn('Overlay playback:',err);o.el.pause()})}});playing=true;startVoicePlayback();icon(true)}
$('#play').onclick=play;
function adv(){
 const c=C[cur];
 if(cur<C.length-1){const n=C[cur+1];if(n.el!==c.el||Math.abs(c.el.currentTime-n.in)>.3){c.el.pause();n.el.currentTime=n.in}
  n.el.playbackRate=n.spd;n.el.volume=n.vol;cur++;mark();const nextPlay=n.el.play();if(nextPlay&&typeof nextPlay.catch==='function')nextPlay.catch(err=>{if(playing){pause();console.warn('KAISER next clip playback:',err);toast('មិនអាចចាក់ឈុតបន្ទាប់បានទេ')}})}
 else{pause();g=total;info();if(ex)finishExport()}
}
/* drawing */
function put(src,o){
 const sw=src.videoWidth||src.width,sh=src.videoHeight||src.height;if(!sw)return;
 const W=cv.width,H=cv.height,r=Math.max(W/sw,H/sh);
 ctx.save();ctx.globalAlpha=o.a??1;ctx.translate(W/2+(o.x||0)*W,H/2+(o.y||0)*H);ctx.rotate(o.r||0);ctx.scale(o.sx??1,o.sy??1);ctx.filter=o.f||'none';ctx.drawImage(src,-sw*r/2,-sh*r/2,sw*r,sh*r);ctx.restore()}
function filterFor(c){
 const a=c.adj||{brightness:100,contrast:100,saturation:100,exposure:100};
 const exposure=cl(a.exposure??100,50,200);
 return (FIL[c.fil]||'')+' brightness('+(a.brightness*exposure/100)+'%) contrast('+a.contrast+'%) saturate('+a.saturation+'%)'
}
/* ===== V6.3.12 Overlay engine: stretch / rotate / crop / animation / blend ===== */
function ovInit(o){if(!o)return o;
 if(o.scale==null)o.scale=.42;if(o.stx==null)o.stx=1;if(o.sty==null)o.sty=1;if(o.rot==null)o.rot=0;if(o.fx==null)o.fx=1;if(o.fy==null)o.fy=1;
 if(!o.crop)o.crop={l:0,t:0,r:0,b:0};if(!o.an)o.an={in:'None',out:'None',combo:'None',d:.5};
 if(o.round==null)o.round=0;if(o.border==null)o.border=0;if(!o.bcol)o.bcol='#ffffff';if(!o.fil)o.fil='None';if(!o.blend)o.blend='source-over';
 if(o.opacity==null)o.opacity=1;if(!o.adj)o.adj={brightness:100,contrast:100,saturation:100,exposure:100};return o}
function ovGeom(o){
 ovInit(o);const e=o.el,sw=e.videoWidth||e.naturalWidth||e.width,sh=e.videoHeight||e.naturalHeight||e.height;
 if(!sw||!sh)return null;
 const r=Math.max(cv.width/sw,cv.height/sh),w0=sw*r,h0=sh*r,W=w0*o.scale*o.stx,H=h0*o.scale*o.sty,c=o.crop;
 return {w0,h0,W,H,cx:cv.width/2+(o.x||0)*cv.width,cy:cv.height/2+(o.y||0)*cv.height,rot:o.rot||0,
  x0:-W/2+c.l*W,x1:W/2-c.r*W,y0:-H/2+c.t*H,y1:H/2-c.b*H};
}
function rrPath(x,y,w,h,rad){rad=Math.max(0,Math.min(rad,w/2,h/2));ctx.beginPath();ctx.moveTo(x+rad,y);ctx.arcTo(x+w,y,x+w,y+h,rad);ctx.arcTo(x+w,y+h,x,y+h,rad);ctx.arcTo(x,y+h,x,y,rad);ctx.arcTo(x,y,x+w,y,rad);ctx.closePath()}
function drawOverlay(o,editing){
 const gm=ovGeom(o);if(!gm)return;const e=o.el,A=an(o.an,g-o.start,o.duration,g);
 const vx=gm.x0,vy=gm.y0,vw=gm.x1-gm.x0,vh=gm.y1-gm.y0;
 ctx.save();
 ctx.globalAlpha=cl((o.opacity??1)*A.a,0,1);
 try{ctx.globalCompositeOperation=o.blend||'source-over'}catch(_){}
 ctx.translate(gm.cx+A.x*cv.width,gm.cy+A.y*cv.height);ctx.rotate(gm.rot+A.r);ctx.scale(A.sx,A.sy);
 ctx.filter=(FIL[o.fil]||'')+' brightness('+((o.adj?.brightness??100)*(o.adj?.exposure??100)/100)+'%) contrast('+(o.adj?.contrast??100)+'%) saturate('+(o.adj?.saturation??100)+'%)';
 ctx.save();
 if(!editing){rrPath(vx,vy,vw,vh,(o.round||0)*Math.min(vw,vh)/2);ctx.clip()}
 ctx.scale(o.fx||1,o.fy||1);ctx.drawImage(e,-gm.W/2,-gm.H/2,gm.W,gm.H);
 ctx.restore();
 if(!editing&&o.border>0){ctx.filter='none';ctx.globalCompositeOperation='source-over';rrPath(vx,vy,vw,vh,(o.round||0)*Math.min(vw,vh)/2);ctx.lineWidth=o.border*cv.width/360;ctx.strokeStyle=o.bcol||'#fff';ctx.stroke()}
 ctx.restore();
}
function ovHandles(gm){const mx=(gm.x0+gm.x1)/2,my=(gm.y0+gm.y1)/2;return [['tl',gm.x0,gm.y0],['tr',gm.x1,gm.y0],['bl',gm.x0,gm.y1],['br',gm.x1,gm.y1],['l',gm.x0,my],['r',gm.x1,my],['t',mx,gm.y0],['b',mx,gm.y1]]}
function ovLocal(gm,px,py){const dx=px-gm.cx,dy=py-gm.cy,c=Math.cos(gm.rot),s=Math.sin(gm.rot);return {x:dx*c+dy*s,y:-dx*s+dy*c}}
let ovGuide=null,ovClickGuard=false,ovTapT=0,ovTapI=-1;
function drawOvHandles(o,crop){
 const gm=ovGeom(o);if(!gm)return;const kk=cv.width/720,x0=gm.x0,y0=gm.y0,x1=gm.x1,y1=gm.y1,w=x1-x0,h=y1-y0;
 ctx.save();ctx.translate(gm.cx,gm.cy);ctx.rotate(gm.rot);ctx.filter='none';ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 if(crop){
  ctx.fillStyle='rgba(0,0,0,.62)';ctx.beginPath();ctx.rect(-gm.W/2,-gm.H/2,gm.W,gm.H);ctx.rect(x0,y0,w,h);ctx.fill('evenodd');
  ctx.strokeStyle='#fff';ctx.lineWidth=2*kk;ctx.strokeRect(x0,y0,w,h);
  ctx.globalAlpha=.45;ctx.lineWidth=1.5*kk;ctx.beginPath();
  for(let k=1;k<3;k++){ctx.moveTo(x0+w*k/3,y0);ctx.lineTo(x0+w*k/3,y1);ctx.moveTo(x0,y0+h*k/3);ctx.lineTo(x1,y0+h*k/3)}
  ctx.stroke();ctx.globalAlpha=1;
  const Ln=Math.max(8*kk,Math.min(34*kk,w/3,h/3));ctx.lineWidth=6*kk;ctx.lineCap='square';ctx.strokeStyle='#fff';ctx.beginPath();
  [[x0,y0,1,1],[x1,y0,-1,1],[x0,y1,1,-1],[x1,y1,-1,-1]].forEach(([x,y,sx,sy])=>{ctx.moveTo(x+sx*Ln,y);ctx.lineTo(x,y);ctx.lineTo(x,y+sy*Ln)});
  const mx=(x0+x1)/2,my=(y0+y1)/2;
  if(w>Ln*3){ctx.moveTo(mx-Ln/2,y0);ctx.lineTo(mx+Ln/2,y0);ctx.moveTo(mx-Ln/2,y1);ctx.lineTo(mx+Ln/2,y1)}
  if(h>Ln*3){ctx.moveTo(x0,my-Ln/2);ctx.lineTo(x0,my+Ln/2);ctx.moveTo(x1,my-Ln/2);ctx.lineTo(x1,my+Ln/2)}
  ctx.stroke();
 }else{
  ctx.setLineDash([10*kk,7*kk]);ctx.lineWidth=3*kk;ctx.strokeStyle='#f5b301';ctx.strokeRect(x0,y0,w,h);ctx.setLineDash([]);
  const R=11*kk;
  ctx.fillStyle='#f5b301';ctx.strokeStyle='#17131f';ctx.lineWidth=3*kk;
  [[x0,y0],[x1,y0],[x0,y1],[x1,y1]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,R,0,Math.PI*2);ctx.fill();ctx.stroke()});
  const mx=(x0+x1)/2,my=(y0+y1)/2,pw=26*kk,ph=9*kk,lim=cv.width*.13;
  if(w>lim){[[mx,y0],[mx,y1]].forEach(([x,y])=>{rrPath(x-pw/2,y-ph/2,pw,ph,ph/2);ctx.fill();ctx.stroke()})}
  if(h>lim){[[x0,my],[x1,my]].forEach(([x,y])=>{rrPath(x-ph/2,y-pw/2,ph,pw,ph/2);ctx.fill();ctx.stroke()})}
 }
 ctx.restore();
}
function drawOverlays(){
 OV.forEach((o,i)=>{
  if(g<o.start||g>=o.start+o.duration)return;const o2=ovInit(o);
  if(o2.type==='video'){const e=o2.el,t=cl((o2.sourceStart||0)+g-o2.start,0,Math.max(0,(e.duration||o2.duration)-.04));if(Math.abs(e.currentTime-t)>.18&&!playing)e.currentTime=t;if(playing&&e.paused){e.play().catch(()=>{})}}
  const sel=i===selOV&&!playing&&!ex;
  drawOverlay(o2,sel&&cropEdit);
  if(sel)drawOvHandles(o2,cropEdit);
 });
 if(ovGuide&&!playing&&!ex){ctx.save();ctx.strokeStyle='#22d3ee';ctx.lineWidth=2*cv.width/720;ctx.setLineDash([12,8]);ctx.beginPath();
  if(ovGuide.x){ctx.moveTo(cv.width/2,0);ctx.lineTo(cv.width/2,cv.height)}
  if(ovGuide.y){ctx.moveTo(0,cv.height/2);ctx.lineTo(cv.width,cv.height/2)}
  ctx.stroke();ctx.restore()}
}
/* No pop-up sheet any more: selecting an overlay (timeline or preview) just switches the bottom tool bar. */
function overlaySheet(i){if(!OV[i])return;selOV=i;selT=-1;cropEdit=false;closeSheet();menu('ovl');lay()}
function trans(t,p,A,B,fa,fb){
 const a={f:fa},b={f:fb};
 switch(t){
  case'Fade':put(A,a);b.a=p;put(B,b);break;
  case'Slide Left':a.x=-p;b.x=1-p;put(A,a);put(B,b);break;
  case'Slide Right':a.x=p;b.x=p-1;put(A,a);put(B,b);break;
  case'Slide Up':a.y=-p;b.y=1-p;put(A,a);put(B,b);break;
  case'Slide Down':a.y=p;b.y=p-1;put(A,a);put(B,b);break;
  case'Zoom':put(A,a);b.a=p;b.sx=b.sy=.4+.6*p;put(B,b);break;
  case'Wipe':put(A,a);ctx.save();ctx.beginPath();ctx.rect(0,0,cv.width*p,cv.height);ctx.clip();put(B,b);ctx.restore();break;
  case'Flip':if(p<.5){a.sx=1-2*p;put(A,a)}else{b.sx=2*p-1;put(B,b)}break;
  case'Dip Black':if(p<.5){a.a=1-2*p;put(A,a)}else{b.a=2*p-1;put(B,b)}break;
  default:put(B,b)}
}
function loop(timestamp){
 try{
 if(C.length){
  const c=C[cur],e=c.el;
  if(playing){
   g=st[cur]+(e.currentTime-c.in)/c.spd;
   if(e.currentTime>=c.out-.04||e.ended)adv();
   else{const n=C[cur+1];if(n&&n.el!==e&&st[cur]+dur[cur]-g<.9&&Math.abs(n.el.currentTime-n.in)>.05&&n.el.paused)n.el.currentTime=n.in}
   if(pvEnd&&g>=pvEnd){pvEnd=0;pause()}
   sync();info()}
  ctx.fillStyle='#000';ctx.fillRect(0,0,cv.width,cv.height);
  const cc=C[cur],lt=g-st[cur],pr=C[cur-1];
  if(!trimming&&pr&&pr.tr.t!=='None'&&lt<Math.min(pr.tr.d,dur[cur]*.9)&&snap._ok){trans(pr.tr.t,sm(lt/Math.min(pr.tr.d,dur[cur]*.9)),snap,cc.el,'none',filterFor(cc))}
  else put(cc.el,{...fx(cc,lt,dur[cur]),f:filterFor(cc)});
   if(cc.efx&&cc.efx.k&&cc.efx.k!=='None'){try{applyFx(cc.efx,g)}catch(_){}}
  if(cur<C.length-1&&cc.tr.t!=='None'&&st[cur]+dur[cur]-g<.12){sctx.drawImage(cv,0,0);snap._ok=true}
  drawOverlays();
  drawText();
  /* V6.3.6: capture only after the complete canvas frame is rendered.
     Use the RAF clock instead of a separate setInterval to reduce timer/paint drift. */
  if(ex&&ex.started&&ex.manualFrameCapture&&ex.videoTrack&&ex.videoTrack.readyState==='live'){
   const now=Number.isFinite(timestamp)?timestamp:performance.now();
   const interval=1000/Math.max(1,expFps);
   if(ex.lastCaptureTime===undefined||now-ex.lastCaptureTime>=interval-1){
    try{ex.videoTrack.requestFrame();ex.lastCaptureTime=now}catch(_){}
   }
  }
 }
 }catch(err){console.warn('KAISER render frame recovered:',err)}
 finally{requestAnimationFrame(loop)}
}
/* edit tools */
const snp=()=>{hist.push({C:C.map(cp),OV:OV.map(o=>({...o,adj:{...(o.adj||{})},an:o.an&&{...o.an},crop:o.crop&&{...o.crop}})),TX:TX.map(t=>({...t,an:t.an&&{...t.an},kf:(t.kf||[]).map(q=>({...q})),pr:t.pr&&{...t.pr}}))});if(hist.length>30)hist.shift()};
function fix(){recalc();build();seekG(Math.min(g,Math.max(0,total-.01)))}
const T={
 split(){
  // Split the selected purple overlay first; otherwise split the main video at the playhead.
  if(selOV>=0&&OV[selOV]){
   const o=OV[selOV],offset=g-o.start;
   if(offset<.2||o.duration-offset<.2)return toast('ដាក់ playhead នៅខាងក្នុង Overlay ហើយឱ្យឆ្ងាយពីគែមបន្តិច');
   snp();const right={...o,adj:{...(o.adj||{})},an:o.an&&{...o.an},crop:o.crop&&{...o.crop},start:g,duration:o.duration-offset,sourceStart:(o.sourceStart||0)+offset};
   o.duration=offset;OV.splice(selOV+1,0,right);selOV=selOV+1;lay();seekG(g);toast('✂ បានកាត់ Overlay ជាពីរផ្នែក');return;
  }
  if(!C.length)return toast('សូមបន្ថែមវីដេអូជាមុន');const c=C[cur],t=g-st[cur];if(t<.2||dur[cur]-t<.2)return toast('ដាក់ playhead ឱ្យឆ្ងាយពីគែមបន្តិច');
  snp();const b=cp(c),m=c.in+t*c.spd;c.out=m;b.in=m;{const k=c.kf||[];c.kf=k.filter(q=>q.t<t);b.kf=k.filter(q=>q.t>=t).map(q=>({...q,t:q.t-t}))}c.tr={t:'None',d:.6};C.splice(cur+1,0,b);const at=g;recalc();build();seekG(at);toast('✂ កាត់រួចរាល់')},
 del(){if(selOV>=0&&OV[selOV]){snp();const o=OV[selOV];if(o.type==='video')o.el.pause();OV.splice(selOV,1);selOV=-1;lay();toast('🗑 បានលុប Overlay');return}if(!C.length)return;snp();const at=st[cur];C.splice(cur,1);cur=Math.min(cur,C.length-1);recalc();build();if(C.length)seekG(Math.min(at,total-.01));else{g=0;info();ctx.clearRect(0,0,cv.width,cv.height)}toast('🗑 បានលុប')},
 undo(){if(!hist.length)return toast('គ្មានអ្វីត្រូវដកវិញទេ');const h=hist.pop();if(Array.isArray(h)){C=h}else{C=h.C;OV=h.OV;TX=h.TX;selOV=-1;selT=-1}const at=g;recalc();build();if(C.length)seekG(Math.min(at,total-.01));else{g=0;lay();info();ctx.clearRect(0,0,cv.width,cv.height)}toast('↶ បានត្រឡប់ក្រោយ')},
 tr(){if(C.length<2)return toast('ត្រូវការវីដេអូយ៉ាងតិច ២ ដើម្បីដាក់ Transition');trSheet(cur<C.length-1?cur:cur-1)},
 spd(){if(!C.length)return;open('Speed',c=>chips(c,[.5,1,1.5,2,3],C[cur].spd,k=>{snp();C[cur].spd=k;const i=cur;recalc();build();seekG(st[i]+.01)}))},
 vol(){if(!C.length)return;open('Volume',c=>{const l=document.createElement('div');l.className='lbl';l.textContent='Volume';const r=document.createElement('input');r.type='range';r.max=100;r.value=C[cur].vol*100;r.oninput=()=>{C[cur].vol=r.value/100;C[cur].el.volume=C[cur].vol};c.append(l,r)})},
 fil(){if(!C.length)return;open('Filter',c=>chips(c,Object.keys(FIL),C[cur].fil,k=>C[cur].fil=k))},
 ratio(){open('Size',c=>{
  const l=document.createElement('div');l.className='lbl';l.textContent='Platform';c.appendChild(l);
  chips(c,Object.keys(PL).map(k=>k+' '+PL[k]),Object.keys(PL).map(k=>k+' '+PL[k]).find(x=>x.endsWith(ratio)),k=>{ratio=k.split(' ')[1];setCanvas(720)});
  const q=document.createElement('div');q.className='lbl';q.textContent='Quality';c.appendChild(q);
  chips(c,['720p','1080p','2K'],expShort===1440?'2K':expShort+'p',k=>{expShort=k==='2K'?1440:parseInt(k,10);expBlob=null})})}
};
const MN={main:[['anim','AI Smart','ai'],['ratio','Language','settings'],['scissors','Split','split'],['trash','Delete','del'],['swap','Transition','tr'],['anim','Animation','anim'],['dia','Keyframe','kf'],['text','Text','>text'],['speed','Speed','spd'],['vol','Volume','vol'],['fil','Filter','fil'],['ratio','Size','ratio'],['fil','Color','adjust'],['plus','Overlay','overlay'],['vol','Media','media'],['undo','Undo','undo']],
 media:[['vol','Audio Library','media'],['plus','Add image / sticker','overlay']],
 text:[['text','Add text','addt'],['anim','Text anim','tanim']]};
MN.ovl=[['anim','Animation','ovAnim'],['crop','Crop','ovCrop'],['scissors','Split','split'],['plus','Add','overlay'],['copy','Copy','ovCopy'],['opacity','Opacity','ovOpa'],['sun','Color','ovAdj'],['fil','Filter','ovFil'],['flip','Flip','ovFlipH'],['flipv','Mirror','ovFlipV'],['rotate','Rotate','ovRot'],['fit','Fit','ovFit'],['fill','Fill','ovFill'],['stretch','Stretch','ovStretch'],['corner','Corners','ovRound'],['border','Border','ovBorder'],['layer','Layer','ovLayer'],['blend','Blend','ovBlend'],['reset','Reset','ovReset'],['trash','Delete','ovDel']];
MN.crop=[['check','Done','ovCropDone'],['ratio','Free','cropFree'],['ratio','1:1','cropA11'],['ratio','9:16','cropA916'],['ratio','16:9','cropA169'],['ratio','4:3','cropA43'],['ratio','3:4','cropA34'],['reset','Original','cropReset']];
function menuBack(k){if(k==='crop'){cropEdit=false;menu('ovl');return}if(k==='ovl'){selOV=-1;cropEdit=false;closeSheet();lay();menu('main');return}menu('main')}
function menu(k){MNK=k;const t=$('#tools');t.innerHTML='';
 if(k!=='main'){const b=document.createElement('button');b.innerHTML=I('back')+'<span>Back</span>';b.onclick=()=>menuBack(k);t.appendChild(b)}
 MN[k].forEach(([i,n,a])=>{const b=document.createElement('button');if(a==='ai')b.classList.add('ai-tool-entry');if(a==='settings')b.classList.add('language-tool-entry');b.dataset.action=a;b.innerHTML=I(i)+'<span>'+n+'</span>';b.onclick=()=>a[0]==='>'?menu(a.slice(1)):T[a]();t.appendChild(b)})}
menu('main');
/* animation + text */
const AIN={None:'⊘',Fade:'◐','Zoom In':'⤢','Slide Left':'←','Slide Right':'→','Slide Up':'↑','Slide Down':'↓',Spin:'↻',Bounce:'◉'},CMB={None:'⊘',Pulse:'◎',Sway:'≋',Float:'⇅'};
function an(a,lt,d,t){
 const o={a:1,x:0,y:0,sx:1,sy:1,r:0};if(!a)return o;
 const f=(k,p)=>{switch(k){
  case'Fade':o.a*=p;break;
  case'Zoom In':o.sx*=.5+.5*p;o.sy*=.5+.5*p;o.a*=p;break;
  case'Slide Left':o.x+=1-p;break;case'Slide Right':o.x-=1-p;break;case'Slide Up':o.y+=1-p;break;case'Slide Down':o.y-=1-p;break;
  case'Spin':o.r+=(1-p)*6.283;o.sx*=.5+.5*p;o.sy*=.5+.5*p;o.a*=p;break;
  case'Bounce':{const q=p-1,s=1+2.70158*q*q*q+1.70158*q*q;o.sx*=s;o.sy*=s;break}}};
 if(a.in!=='None'&&lt<a.d)f(a.in,sm(lt/a.d));
 if(a.out!=='None'&&d-lt<a.d)f(a.out,sm(Math.max(0,d-lt)/a.d));
 if(a.combo==='Pulse'){const s=1+.05*Math.sin(t*5);o.sx*=s;o.sy*=s}
 if(a.combo==='Sway')o.r+=.05*Math.sin(t*3.5);
 if(a.combo==='Float')o.y+=.015*Math.sin(t*3);
 return o}
function drawText(){
 const W=cv.width,H=cv.height;
 TX.forEach((t,i)=>{if(g<t.st||g>=t.st+t.d)return;const lt=g-t.st,o=an(t.an,lt,t.d,lt),k=kfVal(t,lt),fs=t.size*W,L=t.s.split('\n');
  ctx.save();ctx.globalAlpha=o.a*k.o;ctx.translate(t.x*W+(o.x+k.x)*W,t.y*H+(o.y+k.y)*H);ctx.rotate(o.r+k.r*Math.PI/180);ctx.scale(o.sx*k.sc,o.sy*k.sc);
  ctx.font='700 '+fs+'px "'+(t.font||'Noto Sans Khmer')+'","Noto Sans Khmer",system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=fs*.14;ctx.strokeStyle='#000c';ctx.fillStyle=t.col;
  L.forEach((l,k)=>{const y=(k-(L.length-1)/2)*fs*1.25;ctx.strokeText(l,0,y);ctx.fillText(l,0,y)});
  if(i===selT&&!ex&&!playing){const w=Math.max(...L.map(l=>ctx.measureText(l).width))+fs*.5;ctx.setLineDash([10,7]);ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.strokeRect(-w/2,-L.length*fs*.7,w,L.length*fs*1.4)}
  ctx.restore()})}

// V6.3.12 direct manipulation: drag body, corners (uniform zoom), edges (stretch), two fingers (zoom + rotate), crop frame.
let overlayPointers=new Map(),overlayGesture=null;
function overlayHit(px,py){
 const R=cv.width*.06,sel=OV[selOV];
 if(sel&&g>=sel.start&&g<sel.start+sel.duration){
  const gm=ovGeom(sel);
  if(gm){const L=ovLocal(gm,px,py),w=gm.x1-gm.x0,h=gm.y1-gm.y0;let best=null,bd=R;
   ovHandles(gm).forEach(([hn,x,y])=>{
    if(hn.length===1){if((hn==='l'||hn==='r')&&h<R*2.4)return;if((hn==='t'||hn==='b')&&w<R*2.4)return}
    const d=Math.hypot(L.x-x,L.y-y);if(d<bd){bd=d;best=hn}});
   if(best)return {i:selOV,handle:best}}
 }
 for(let i=OV.length-1;i>=0;i--){
  const o=OV[i];if(g<o.start||g>=o.start+o.duration)continue;
  const gm=ovGeom(o);if(!gm)continue;const L=ovLocal(gm,px,py);
  if(L.x>=gm.x0&&L.x<=gm.x1&&L.y>=gm.y0&&L.y<=gm.y1)return {i,handle:'move'};
 }
 return null;
}
function touchDist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function ovSnap(o){return {x:o.x||0,y:o.y||0,scale:o.scale,stx:o.stx,sty:o.sty,rot:o.rot||0,crop:{...o.crop}}}
cv.addEventListener('pointerdown',e=>{
 if(ex||playing||trackDrag)return;
 const p=canvasPoint(e);
 if(overlayPointers.size===0){
  const hit=overlayHit(p.x,p.y);if(!hit)return;
  const o=ovInit(OV[hit.i]),gm=ovGeom(o);if(!gm)return;
  const changed=selOV!==hit.i;selOV=hit.i;selT=-1;snp();overlayPointers.set(e.pointerId,p);
  const mode=hit.handle==='move'?'move':(cropEdit?'crop':(hit.handle.length===2?'corner':'edge'));
  overlayGesture={i:hit.i,mode,h:hit.handle,px:p.x,py:p.y,dx:p.x-gm.cx,dy:p.y-gm.cy,gm,s0:ovSnap(o),baseDist:Math.max(1,Math.hypot(p.x-gm.cx,p.y-gm.cy))};
  if(changed||(MNK!=='ovl'&&MNK!=='crop')){cropEdit=false;closeSheet();menu('ovl')}
  try{cv.setPointerCapture(e.pointerId)}catch(_){}
  e.preventDefault();e.stopImmediatePropagation();lay();return;
 }
 if(selOV<0||!OV[selOV])return;
 overlayPointers.set(e.pointerId,p);try{cv.setPointerCapture(e.pointerId)}catch(_){}
 if(overlayPointers.size===2){
  const a=[...overlayPointers.values()],o=OV[selOV],ang=Math.atan2(a[1].y-a[0].y,a[1].x-a[0].x);
  overlayGesture={i:selOV,mode:'pinch',d:Math.max(1,touchDist(a[0],a[1])),prevAng:ang,rotAcc:0,mid:{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2},s0:ovSnap(o)};
  e.preventDefault();e.stopImmediatePropagation();
 }
},true);
cv.addEventListener('pointermove',e=>{
 if(!overlayPointers.has(e.pointerId)||!overlayGesture)return;
 const p=canvasPoint(e);overlayPointers.set(e.pointerId,p);const G=overlayGesture,o=OV[G.i];if(!o)return;const s0=G.s0;if(G.px!=null&&Math.hypot(p.x-G.px,p.y-G.py)>10)G.moved=true;
 if(G.mode==='pinch'&&overlayPointers.size>=2){
  const a=[...overlayPointers.values()],d=Math.max(1,touchDist(a[0],a[1])),mid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};
  const ang=Math.atan2(a[1].y-a[0].y,a[1].x-a[0].x);let da=ang-G.prevAng;da=Math.atan2(Math.sin(da),Math.cos(da));G.rotAcc+=da;G.prevAng=ang;
  o.scale=cl(s0.scale*d/G.d,.03,8);
  let r=s0.rot+G.rotAcc;const q=Math.PI/2,nr=Math.round(r/q)*q;if(Math.abs(r-nr)<.05)r=nr;o.rot=r;
  o.x=cl(s0.x+(mid.x-G.mid.x)/cv.width,-2,2);o.y=cl(s0.y+(mid.y-G.mid.y)/cv.height,-2,2);
 }else if(G.mode==='corner'&&overlayPointers.size===1){
  const cx=G.gm.cx,cy=G.gm.cy,d=Math.max(8,Math.hypot(p.x-cx,p.y-cy));
  o.scale=cl(s0.scale*d/G.baseDist,.03,8);
 }else if(G.mode==='edge'&&overlayPointers.size===1){
  const gm=G.gm,L=ovLocal(gm,p.x,p.y),c=s0.crop,minV=cv.width*.05,h=G.h;let cLx=0,cLy=0,stx=s0.stx,sty=s0.sty;
  if(h==='r'||h==='l'){
   const fv=Math.max(.02,1-c.l-c.r),vis=h==='r'?Math.max(minV,L.x-gm.x0):Math.max(minV,gm.x1-L.x),W2=cl(vis/fv,minV,cv.width*12);
   cLx=h==='r'?gm.x0+W2/2-c.l*W2:gm.x1-W2/2+c.r*W2;stx=s0.stx*W2/gm.W;
  }else{
   const fv=Math.max(.02,1-c.t-c.b),vis=h==='b'?Math.max(minV,L.y-gm.y0):Math.max(minV,gm.y1-L.y),H2=cl(vis/fv,minV,cv.height*12);
   cLy=h==='b'?gm.y0+H2/2-c.t*H2:gm.y1-H2/2+c.b*H2;sty=s0.sty*H2/gm.H;
  }
  const co=Math.cos(gm.rot),si=Math.sin(gm.rot);
  o.stx=stx;o.sty=sty;o.x=s0.x+(cLx*co-cLy*si)/cv.width;o.y=s0.y+(cLx*si+cLy*co)/cv.height;
 }else if(G.mode==='crop'&&overlayPointers.size===1){
  const gm=G.gm,L=ovLocal(ovGeom(o),p.x,p.y),W=gm.W,H=gm.H,mn=.08,c=o.crop,h=G.h;
  if(h.includes('l'))c.l=cl((L.x+W/2)/W,0,1-c.r-mn);
  if(h.includes('r'))c.r=cl((W/2-L.x)/W,0,1-c.l-mn);
  if(h.includes('t'))c.t=cl((L.y+H/2)/H,0,1-c.b-mn);
  if(h.includes('b'))c.b=cl((H/2-L.y)/H,0,1-c.t-mn);
 }else if(G.mode==='move'&&overlayPointers.size===1){
  let nx=(p.x-G.dx-cv.width/2)/cv.width,ny=(p.y-G.dy-cv.height/2)/cv.height;const T0=.012;ovGuide={x:false,y:false};
  if(Math.abs(nx)<T0){nx=0;ovGuide.x=true}if(Math.abs(ny)<T0){ny=0;ovGuide.y=true}
  o.x=cl(nx,-2,2);o.y=cl(ny,-2,2);
 }
 e.preventDefault();e.stopImmediatePropagation();
},true);
function finishOverlayPointer(e){
 if(!overlayPointers.has(e.pointerId))return;
 overlayPointers.delete(e.pointerId);
 if(overlayPointers.size===1&&overlayGesture&&overlayGesture.mode==='pinch'){
  const [id,p]=[...overlayPointers.entries()][0],o=OV[overlayGesture.i];
  if(o){const gm=ovGeom(o);overlayGesture={i:overlayGesture.i,mode:'move',h:'move',dx:p.x-gm.cx,dy:p.y-gm.cy,gm,s0:ovSnap(o),baseDist:1}}
 }
 if(overlayPointers.size===0){const G0=overlayGesture;if(G0&&G0.mode==='move'&&!G0.moved&&G0.px!=null){const now=Date.now();if(ovTapT&&now-ovTapT<320&&ovTapI===G0.i){ovTapT=0;selOV=G0.i;ovPlace('stretch')}else{ovTapT=now;ovTapI=G0.i}}overlayGesture=null;ovGuide=null;ovClickGuard=true;setTimeout(()=>{ovClickGuard=false},350);lay()}
}
cv.addEventListener('pointerup',finishOverlayPointer,true);
cv.addEventListener('pointercancel',finishOverlayPointer,true);

let textDrag=null,textPointers=new Map(),textPinch=null;
function textHit(px,py){
 const W=cv.width,H=cv.height;
 for(let i=TX.length-1;i>=0;i--){const t=TX[i];if(g<t.st||g>=t.st+t.d)continue;
  const fs=t.size*W,lines=t.s.split('\n');ctx.save();ctx.font='700 '+fs+'px "'+(t.font||'Noto Sans Khmer')+'","Noto Sans Khmer",system-ui,sans-serif';
  const width=Math.max(...lines.map(v=>ctx.measureText(v).width))+fs*.65,height=lines.length*fs*1.45;ctx.restore();
  const x=t.x*W,y=t.y*H;
  if(px>=x-width/2&&px<=x+width/2&&py>=y-height/2&&py<=y+height/2)return i;
 }
 return -1;
}
function canvasPoint(e){
 const r=cv.getBoundingClientRect();
 return {x:(e.clientX-r.left)*cv.width/r.width,y:(e.clientY-r.top)*cv.height/r.height};
}
const pointerDistance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
cv.addEventListener('pointerdown',e=>{
 if(ex||playing||trackDrag)return;
 const p=canvasPoint(e);textPointers.set(e.pointerId,p);
 if(textPointers.size===1){
  const i=textHit(p.x,p.y);if(i<0){textPointers.delete(e.pointerId);return}
  selT=i;const t=TX[i];
  textDrag={i,dx:p.x-t.x*cv.width,dy:p.y-t.y*cv.height};td=1;moved=false;
  try{cv.setPointerCapture(e.pointerId)}catch(_){}
  lay();
 }else if(textPointers.size===2&&selT>=0){
  e.preventDefault();e.stopImmediatePropagation();
  const a=[...textPointers.values()],t=TX[selT];
  textPinch={i:selT,d:Math.max(1,pointerDistance(a[0],a[1])),
   size:t.size,x:t.x,y:t.y,mid:{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2}};
  textDrag=null;
  try{cv.setPointerCapture(e.pointerId)}catch(_){}
 }
},true);
cv.addEventListener('pointermove',e=>{
 if(!textPointers.has(e.pointerId))return;
 const p=canvasPoint(e);textPointers.set(e.pointerId,p);
 if(textPinch&&textPointers.size>=2){
  e.preventDefault();e.stopImmediatePropagation();
  const a=[...textPointers.values()],t=TX[textPinch.i];
  if(!t)return;
  const d=Math.max(1,pointerDistance(a[0],a[1]));
  const mid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};
  t.size=cl(textPinch.size*d/textPinch.d,.015,.35);
  t.x=cl(textPinch.x+(mid.x-textPinch.mid.x)/cv.width,0,1);
  t.y=cl(textPinch.y+(mid.y-textPinch.mid.y)/cv.height,0,1);
  moved=true;return;
 }
 if(textDrag&&textPointers.size===1){
  const t=TX[textDrag.i];if(!t)return;
  t.x=cl((p.x-textDrag.dx)/cv.width,0,1);
  t.y=cl((p.y-textDrag.dy)/cv.height,0,1);moved=true;
 }
},true);
function finishTextPointer(e){
 textPointers.delete(e.pointerId);
 if(textPointers.size<2)textPinch=null;
 if(textPointers.size===0){
  textDrag=null;td=0;
  if(moved)lay();
 }
}
cv.addEventListener('pointerup',finishTextPointer,true);
cv.addEventListener('pointercancel',finishTextPointer,true);
function rng(l,min,max,step,v,fn){const d=document.createElement('div');d.className='lbl';const s=document.createElement('span');s.textContent=(+v).toFixed(1);d.innerHTML='<span>'+l+'</span>';d.appendChild(s);const r=document.createElement('input');r.type='range';r.min=min;r.max=max;r.step=step;r.value=v;r.oninput=()=>{s.textContent=(+r.value).toFixed(1);fn(+r.value)};return[d,r]}
function animSheet(o,title,pv){
 o.an=o.an||{in:'None',out:'None',combo:'None',d:.5};const a=o.an;let tab='in';
 open(title,c=>{const tb=document.createElement('div');tb.className='chips';const gr=document.createElement('div');gr.className='grid';
  const draw=()=>{gr.innerHTML='';const m=tab==='combo'?CMB:AIN;Object.keys(m).forEach(k=>{const t=document.createElement('div');t.className='tile'+(a[tab]===k?' sel':'');t.innerHTML='<div>'+m[k]+'</div>'+k;t.onclick=()=>{a[tab]=k;draw();if(k!=='None')pv()};gr.appendChild(t)})};
  [['in','In'],['out','Out'],['combo','Combo']].forEach(([k,n])=>{const b=document.createElement('button');b.className='chip'+(k===tab?' sel':'');b.textContent=n;b.onclick=()=>{tab=k;tb.querySelectorAll('.chip').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');draw()};tb.appendChild(b)});
  const[l,r]=rng('Duration',.2,1.5,.1,a.d,v=>a.d=v);c.append(tb,l,r,gr);draw()})}
function textSheet(i){
 const t=TX[i];selT=i;
 open('Text',c=>{
  const ta=document.createElement('textarea');ta.className='ta';ta.rows=2;ta.value=t.s;ta.oninput=()=>{t.s=ta.value;lay()};c.appendChild(ta);
  const fontLabel=document.createElement('div');fontLabel.className='lbl';fontLabel.textContent='Font / ពុម្ពអក្សរ';c.appendChild(fontLabel);
  const font=document.createElement('select');font.className='font-select';
  [['Noto Sans Khmer','Noto Sans Khmer'],['Kantumruy Pro','Kantumruy Pro'],['Battambang','Battambang'],['Inter','Inter'],['Arial','Arial']].forEach(([label,value])=>{const op=document.createElement('option');op.value=value;op.textContent=label;font.appendChild(op)});
  font.value=t.font||'Noto Sans Khmer';font.onchange=()=>{t.font=font.value;lay()};c.appendChild(font);
  const ds=document.createElement('div');ds.className='dots';
  ['#ffffff','#ffd400','#ff3b6b','#22d3ee','#7cff6b','#000000'].forEach(k=>{const d=document.createElement('button');d.className='dot'+(t.col===k?' sel':'');d.style.background=k;d.onclick=()=>{t.col=k;ds.querySelectorAll('.dot').forEach(x=>x.classList.remove('sel'));d.classList.add('sel')};ds.appendChild(d)});c.appendChild(ds);
  c.append(...rng('Size',3,14,1,t.size*100,v=>t.size=v/100),...rng('Start time',0,Math.max(1,total),.1,t.st,v=>{t.st=cl(v,0,Math.max(0,total-t.d));lay()}),...rng('Duration',.2,Math.max(.2,total-t.st),.1,t.d,v=>{t.d=cl(v,.2,Math.max(.2,total-t.st));lay()}),...rng('Position X',0,100,1,t.x*100,v=>{t.x=v/100}),...rng('Position Y',0,100,1,t.y*100,v=>{t.y=v/100}));
  const r=document.createElement('div');r.className='chips';
  [['Match Overlay',()=>attachTextToOverlay(i)],['Split at playhead',()=>splitText(i)],['Animation',()=>T.tanim()],['Delete',()=>{TX.splice(i,1);selT=-1;lay();closeSheet()}]].forEach(([n,f])=>{const b=document.createElement('button');b.className='chip';b.textContent=n;b.onclick=f;r.appendChild(b)});c.appendChild(r)})}
function splitText(i){
 const t=TX[i];if(!t)return;const cut=g;
 if(cut<=t.st+.15||cut>=t.st+t.d-.15)return toast('ដាក់បន្ទាត់ពេលវេលានៅកណ្ដាលអក្សរ ដើម្បី Split');
 const right={...t,st:cut,d:t.st+t.d-cut,an:t.an?{...t.an}:t.an,pr:{...(t.pr||P0)},kf:(t.kf||[]).filter(q=>q.t>=cut-t.st).map(q=>({...q,t:q.t-(cut-t.st)}))};t.d=cut-t.st;t.kf=(t.kf||[]).filter(q=>q.t<t.d);
 TX.splice(i+1,0,right);selT=i+1;lay();closeSheet();seekG(cut);toast('បានកាត់ Text ជាពីរផ្នែក')}

T.anim=()=>{if(!C.length)return toast('សូមបន្ថែមវីដេអូជាមុន');const i=cur;animSheet(C[i],'Animation',()=>{seekG(st[i]);pvEnd=st[i]+Math.min(dur[i],2.4);play()})};
T.addt=()=>{if(!C.length)return toast('សូមបន្ថែមវីដេអូជាមុន');TX.push({s:'អត្ថបទ',font:'Noto Sans Khmer',st:g,d:3,lane:3+freeLane(TX,g,3,'st','d',2),_laneV2:true,col:'#ffffff',size:.08,x:.5,y:.5,an:{in:'None',out:'None',combo:'None',d:.5}});selT=TX.length-1;lay();tkOpen(selT);textSheet(selT)};
T.tanim=()=>{const t=TX[selT];if(!t)return toast('សូមចុចលើអត្ថបទក្នុង Timeline ជាមុន');animSheet(t,'Text Animation',()=>{seekG(t.st);pvEnd=t.st+Math.min(t.d,2.4);play()})};
T.overlay=()=>{if(!C.length)return toast('សូមបន្ថែមវីដេអូមេជាមុន');$('#overlayFile').click()};

T.media=()=>{
 open('Media Library · បណ្ណាល័យមេឌៀ',c=>{
  const intro=document.createElement('div');intro.className='media-note';
  intro.textContent='បន្ថែមបទភ្លេង និងសំឡេងផ្ទាល់ខ្លួន ដើម្បីស្ដាប់សាកល្បង។ រូបភាព និង Sticker អាចបន្ថែមទៅ Preview តាម Overlay។';
  c.appendChild(intro);
  const actions=document.createElement('div');actions.className='media-head';
  const audioBtn=document.createElement('button');audioBtn.className='media-action gold';audioBtn.textContent='+ Import Music / Sound';
  audioBtn.onclick=()=>$('#audioLibraryFile').click();
  const imageBtn=document.createElement('button');imageBtn.className='media-action';imageBtn.textContent='+ Add Image / Sticker';
  imageBtn.onclick=()=>$('#overlayFile').click();
  const recordBtn=document.createElement('button');recordBtn.className='media-action';recordBtn.textContent='🎙 Record Voice';
  actions.append(audioBtn,imageBtn,recordBtn);c.appendChild(actions);

  const voicePanel=document.createElement('div');voicePanel.className='ai-box';
  voicePanel.style.cssText='background:#20202d;border:1px solid #39394b;border-radius:12px;padding:11px;margin:0 0 12px';
  const voiceTitle=document.createElement('div');voiceTitle.style.cssText='font-weight:700;font-size:14px;color:#f5b301';voiceTitle.textContent='🎙 Direct Voice Studio';
  const voiceHint=document.createElement('div');voiceHint.className='media-note';voiceHint.textContent='ជ្រើសរើសទម្រង់សំឡេង រួចចុចថត។ សំឡេងនឹងដាក់នៅទីតាំង Playhead បច្ចុប្បន្ន ហើយអាច Preview និង Export បាន។';
  const voiceSelect=document.createElement('select');voiceSelect.className='font-select';
  [
   ['normal','Original · សំឡេងដើម'],['male','Male · សំឡេងប្រុស'],['female','Female · សំឡេងស្រី'],
   ['child','Child · សំឡេងក្មេង'],['elder','Elder · សំឡេងចាស់'],
   ['funny','Funny · សំឡេងកំប្លែង'],['tremble','Trembling · សំឡេងញ័រ']
  ].forEach(([v,label])=>{const op=document.createElement('option');op.value=v;op.textContent=label;voiceSelect.appendChild(op)});
  const voiceStatus=document.createElement('div');voiceStatus.className='media-note';voiceStatus.textContent='រួចរាល់សម្រាប់ថត · ត្រូវអនុញ្ញាត Microphone';
  const voiceControls=document.createElement('div');voiceControls.className='media-head';
  const startRec=document.createElement('button');startRec.className='media-action gold';startRec.textContent='● Start Recording';
  const stopRec=document.createElement('button');stopRec.className='media-action';stopRec.textContent='■ Stop & Save';stopRec.disabled=true;stopRec.style.opacity='.45';
  voiceControls.append(startRec,stopRec);
  voicePanel.append(voiceTitle,voiceHint,voiceSelect,voiceControls,voiceStatus);
  c.appendChild(voicePanel);

  let micStream=null,voiceRecorder=null,voiceParts=[],recordStartedAt=0;
  const releaseMic=()=>{if(micStream){micStream.getTracks().forEach(t=>t.stop());micStream=null}};
  const setRecState=on=>{startRec.disabled=on;stopRec.disabled=!on;startRec.style.opacity=on?'.45':'1';stopRec.style.opacity=on?'1':'.45'};
  startRec.onclick=async()=>{
   if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.MediaRecorder){
    voiceStatus.textContent='Browser មិនគាំទ្រការថត Microphone ទេ។ សូមប្រើ HTTPS ឬ localhost និង Browser ដែលទាន់សម័យ។';return;
   }
   try{
    micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
    const types=['audio/webm;codecs=opus','audio/webm','audio/mp4'];
    const mime=types.find(t=>MediaRecorder.isTypeSupported(t));
    voiceRecorder=mime?new MediaRecorder(micStream,{mimeType:mime}):new MediaRecorder(micStream);
    voiceParts=[];voiceRecorder.ondataavailable=e=>{if(e.data&&e.data.size)voiceParts.push(e.data)};
    voiceRecorder.onerror=()=>{voiceStatus.textContent='ការថតមានបញ្ហា';releaseMic();setRecState(false)};
    voiceRecorder.onstop=async()=>{
     releaseMic();setRecState(false);
     const blob=new Blob(voiceParts,{type:voiceRecorder.mimeType||'audio/webm'});
     if(!blob.size){voiceStatus.textContent='មិនមានទិន្នន័យសំឡេងទេ';return}
     try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)throw new Error('Web Audio មិនត្រូវបានគាំទ្រ');
      ac=ac||new AC();if(ac.state==='suspended')await ac.resume();
      const raw=await blob.arrayBuffer();const inputBuffer=await ac.decodeAudioData(raw.slice(0));
      const preset=voiceSelect.value;
      const cfg={
       normal:{rate:1,low:20,high:19000,vib:0,dist:0},
       male:{rate:.88,low:70,high:9000,vib:0,dist:0},
       female:{rate:1.12,low:180,high:15000,vib:0,dist:0},
       child:{rate:1.28,low:250,high:16000,vib:0,dist:0},
       elder:{rate:.82,low:90,high:6500,vib:.015,dist:0},
       funny:{rate:1.22,low:120,high:15000,vib:.025,dist:.12},
       tremble:{rate:1,low:100,high:12000,vib:.07,dist:.04}
      }[preset];
      const outLength=Math.ceil(inputBuffer.length/cfg.rate);
      const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
      if(!Offline)throw new Error('Offline Audio មិនត្រូវបានគាំទ្រ');
      const offline=new Offline(inputBuffer.numberOfChannels,outLength,inputBuffer.sampleRate);
      const source=offline.createBufferSource();source.buffer=inputBuffer;source.playbackRate.value=cfg.rate;
      const filter=offline.createBiquadFilter();filter.type='lowpass';filter.frequency.value=cfg.high;
      const highpass=offline.createBiquadFilter();highpass.type='highpass';highpass.frequency.value=cfg.low;
      let last=highpass;source.connect(highpass);highpass.connect(filter);last=filter;
      if(cfg.dist){
       const shaper=offline.createWaveShaper();const curve=new Float32Array(44100);
       for(let i=0;i<curve.length;i++){const x=i*2/(curve.length-1)-1;curve[i]=Math.tanh(x*(1+cfg.dist*18))}
       shaper.curve=curve;last.connect(shaper);last=shaper;
      }
      const gain=offline.createGain();gain.gain.value=.96;last.connect(gain);gain.connect(offline.destination);
      if(cfg.vib){
       const lfo=offline.createOscillator(),depth=offline.createGain();
       lfo.frequency.value=preset==='tremble'?7:4.5;depth.gain.value=cfg.vib;
       lfo.connect(depth);depth.connect(source.playbackRate);lfo.start(0);lfo.stop(outLength/inputBuffer.sampleRate);
      }
      source.start(0);const processed=await offline.startRendering();
      voiceClips.push({name:'Voice '+(voiceClips.length+1)+' · '+preset,buffer:processed,start:g,duration:processed.duration,volume:1});
      voiceStatus.textContent='បានរក្សាសំឡេង '+processed.duration.toFixed(1)+' វិនាទី · ចាប់ផ្ដើមនៅ '+g.toFixed(1)+'s';
      renderVoiceList();
     }catch(err){voiceStatus.textContent='មិនអាចដំណើរការសំឡេងបាន៖ '+(err.message||err)}
    };
    voiceRecorder.start(250);recordStartedAt=Date.now();setRecState(true);
    voiceStatus.textContent='កំពុងថតសំឡេង… '+new Date(recordStartedAt).toLocaleTimeString();
   }catch(err){releaseMic();voiceStatus.textContent='មិនអាចបើក Microphone បាន៖ '+(err.message||err)}
  };
  stopRec.onclick=()=>{if(voiceRecorder&&voiceRecorder.state!=='inactive'){voiceRecorder.stop();voiceStatus.textContent='កំពុងរៀបចំសំឡេង…'}};

  const voiceList=document.createElement('div');voiceList.className='media-list';voicePanel.appendChild(voiceList);
  const renderVoiceList=()=>{
   voiceList.innerHTML='';
   voiceClips.forEach((v,i)=>{
    const row=document.createElement('div');row.className='media-item';
    const info=document.createElement('div');info.className='mi-name';info.textContent='🎙 '+v.name;
    const meta=document.createElement('small');meta.textContent=v.duration.toFixed(1)+'s · Start '+v.start.toFixed(1)+'s';info.appendChild(meta);
    const preview=document.createElement('button');preview.textContent='Preview';preview.onclick=()=>{
     try{pause();const AC=window.AudioContext||window.webkitAudioContext;ac=ac||new AC();if(ac.state==='suspended')ac.resume();
      const node=ac.createBufferSource();node.buffer=v.buffer;node.connect(ac.destination);node.onended=()=>{try{node.disconnect()}catch(_){}};
      node.start();voiceNodes.push(node);
     }catch(err){toast('មិនអាច Preview សំឡេងបាន')}
    };
    const del=document.createElement('button');del.textContent='Delete';del.onclick=()=>{voiceClips.splice(i,1);renderVoiceList()};
    row.append(info,preview,del);voiceList.appendChild(row);
   });
  };
  renderVoiceList();

  const list=document.createElement('div');list.className='media-list';c.appendChild(list);
  const render=()=>{
   list.innerHTML='';
   if(!mediaAudio.length){const empty=document.createElement('div');empty.className='media-note';empty.textContent='មិនទាន់មានបទភ្លេងទេ។ ចុច Import Music / Sound ដើម្បីបន្ថែមឯកសារសំឡេងពីទូរសព្ទ។';list.appendChild(empty);return}
   mediaAudio.forEach((m,i)=>{
    const row=document.createElement('div');row.className='media-item';
    const info=document.createElement('div');info.className='mi-name';info.textContent='♫ '+m.name;
    const meta=document.createElement('small');meta.textContent='Audio file · '+(m.duration?Math.round(m.duration)+'s':'Duration loading');info.appendChild(meta);
    const playBtn=document.createElement('button');playBtn.textContent=mediaPreview===m?'Stop':'Preview';
    playBtn.onclick=()=>{if(mediaPreview===m){m.el.pause();m.el.currentTime=0;mediaPreview=null;render();return}
      if(mediaPreview){mediaPreview.el.pause();mediaPreview.el.currentTime=0}
      mediaPreview=m;m.el.currentTime=0;m.el.play().then(render).catch(()=>toast('មិនអាចចាក់សំឡេងនេះបាន'));render();m.el.onended=()=>{mediaPreview=null;render()}
    };
    const del=document.createElement('button');del.textContent='Delete';del.onclick=()=>{if(mediaPreview===m){m.el.pause();mediaPreview=null}URL.revokeObjectURL(m.url);mediaAudio.splice(i,1);render()};
    row.append(info,playBtn,del);list.appendChild(row);
   });
  };
  render();
  const note=document.createElement('div');note.className='media-note';note.textContent='ចំណាំ៖ សំឡេងដែលថតក្នុង Direct Voice Studio ត្រូវបានដាក់តាមពេល Playhead និងអាច Preview / Export ជាមួយវីដេអូបាន។ សំឡេងបន្ថែមពី Audio Library នៅតែជា Preview ក្នុងបណ្ណាល័យប៉ុណ្ណោះ។';
  c.appendChild(note);
 });
};
$('#audioLibraryFile').onchange=e=>{
 const files=[...e.target.files];
 files.forEach(f=>{
  if(!f.type.startsWith('audio/'))return;
  const url=URL.createObjectURL(f),el=new Audio(url);
  const item={name:f.name,url,el,duration:0};
  el.addEventListener('loadedmetadata',()=>{item.duration=el.duration});
  mediaAudio.push(item);
 });
 e.target.value='';
 toast('បានបន្ថែមសំឡេង '+files.length+' ឯកសារ');
 if($('#sheet').classList.contains('open'))T.media();
};
T.adjust=()=>{
 if(!C.length)return toast('សូមបន្ថែមវីដេអូជាមុន');
 const c=C[cur];c.adj=c.adj||{brightness:100,contrast:100,saturation:100,exposure:100};
 if(c.adj.exposure==null)c.adj.exposure=100;
 open('Color & Light',box=>{
  let saved=false;const save=()=>{if(!saved){snp();saved=true}};
  const presets=[
   ['Original',{brightness:100,contrast:100,saturation:100,exposure:100}],
   ['Bright',{brightness:112,contrast:105,saturation:108,exposure:125}],
   ['Night Fix',{brightness:118,contrast:92,saturation:105,exposure:145}],
   ['Vivid',{brightness:105,contrast:118,saturation:135,exposure:108}],
   ['Soft',{brightness:108,contrast:92,saturation:92,exposure:112}]
  ];
  const presetWrap=document.createElement('div');presetWrap.className='chips';
  presets.forEach(([name,val])=>{const b=document.createElement('button');b.className='chip';b.textContent=name;b.onclick=()=>{save();c.adj={...val};T.adjust()};presetWrap.appendChild(b)});
  const hint=document.createElement('div');hint.className='lbl';hint.textContent='Quick presets · ជ្រើសរើសពន្លឺតាមវីដេអូ';
  box.append(hint,presetWrap);
  [['Brightness','brightness',0,200],['Exposure','exposure',50,200],['Contrast','contrast',50,180],['Saturation','saturation',0,200]].forEach(([n,k,min,max])=>{
   const [l,r]=rng(n,min,max,1,c.adj[k]??100,v=>{save();c.adj[k]=v;lay()});box.append(l,r)
  });
  const reset=document.createElement('button');reset.className='chip';reset.textContent='Reset · Original';
  reset.onclick=()=>{save();c.adj={brightness:100,contrast:100,saturation:100,exposure:100};T.adjust()};
  box.appendChild(reset)
 })
};

/* ===== V6.3.12 Overlay tools (bottom toolbar, no auto pop-up) ===== */
const ovCur=()=>{const o=OV[selOV];if(!o){toast('សូមជ្រើសរើស Overlay ជាមុន');return null}return ovInit(o)};
const ovShow=o=>{if(g<o.start||g>=o.start+o.duration)seekG(o.start+.01)};
T.ovAnim=()=>{const o=ovCur();if(!o)return;ovShow(o);animSheet(o,'Overlay Animation',()=>{seekG(o.start);pvEnd=o.start+Math.min(o.duration,2.4);play()})};
T.ovCrop=()=>{const o=ovCur();if(!o)return;ovShow(o);cropEdit=true;closeSheet();menu('crop');toast('ទាញជ្រុង ឬគែមស៊ុមស ដើម្បីកាត់')};
T.ovCropDone=()=>{cropEdit=false;menu('ovl')};
function ovCropAspect(ar){const o=ovCur();if(!o)return;const gm=ovGeom(o);if(!gm)return;snp();
 let w=Math.min(gm.W,gm.H*ar),h=w/ar;if(h>gm.H){h=gm.H;w=h*ar}
 o.crop={l:(1-w/gm.W)/2,r:(1-w/gm.W)/2,t:(1-h/gm.H)/2,b:(1-h/gm.H)/2}}
T.cropFree=()=>toast('ទាញជ្រុង ឬគែមស៊ុមដោយម្រាមដៃ');
T.cropA11=()=>ovCropAspect(1);T.cropA916=()=>ovCropAspect(9/16);T.cropA169=()=>ovCropAspect(16/9);T.cropA43=()=>ovCropAspect(4/3);T.cropA34=()=>ovCropAspect(3/4);
T.cropReset=()=>{const o=ovCur();if(!o)return;snp();o.crop={l:0,t:0,r:0,b:0}};
T.ovCopy=async()=>{const o=ovCur();if(!o)return;snp();
 const c={...o,uid:'ov-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),adj:{...o.adj},an:{...o.an},crop:{...o.crop},x:(o.x||0)+.05,y:(o.y||0)+.05};
 try{if(o.type==='video'){const el=await loadV(o.el.currentSrc||o.el.src);el.muted=true;c.el=el}}catch(err){return toast('ចម្លងបរាជ័យ')}
 c.lane=freeLane(OV,c.start,c.duration,'start','duration',3);OV.push(c);selOV=OV.length-1;lay();toast('បានចម្លង Overlay')};
T.ovOpa=()=>{const o=ovCur();if(!o)return;open('Opacity',c=>{c.append(...rng('Opacity',0,1,.01,o.opacity,v=>{o.opacity=v}))})};
T.ovAdj=()=>{
 const o=ovCur();if(!o)return;
 o.adj=o.adj||{brightness:100,contrast:100,saturation:100,exposure:100};
 if(o.adj.exposure==null)o.adj.exposure=100;
 open('Color & Light',c=>{
  let saved=false;const save=()=>{if(!saved){snp();saved=true}};
  const presets=[
   ['Original',{brightness:100,contrast:100,saturation:100,exposure:100}],
   ['Bright',{brightness:112,contrast:105,saturation:108,exposure:125}],
   ['Night Fix',{brightness:118,contrast:92,saturation:105,exposure:145}],
   ['Vivid',{brightness:105,contrast:118,saturation:135,exposure:108}],
   ['Soft',{brightness:108,contrast:92,saturation:92,exposure:112}]
  ];
  const wrap=document.createElement('div');wrap.className='chips';
  presets.forEach(([name,val])=>{const b=document.createElement('button');b.className='chip';b.textContent=name;b.onclick=()=>{save();o.adj={...val};T.ovAdj()};wrap.appendChild(b)});
  c.appendChild(wrap);
  [['Brightness','brightness',0,200],['Exposure','exposure',50,200],['Contrast','contrast',50,180],['Saturation','saturation',0,200]].forEach(([n,k,min,max])=>{const [l,r]=rng(n,min,max,1,o.adj[k]??100,v=>{save();o.adj[k]=v;lay()});c.append(l,r)});
  const b=document.createElement('button');b.className='chip';b.textContent='Reset · Original';b.onclick=()=>{save();o.adj={brightness:100,contrast:100,saturation:100,exposure:100};T.ovAdj()};c.appendChild(b)
 })
};
T.ovFil=()=>{const o=ovCur();if(!o)return;open('Filter',c=>chips(c,Object.keys(FIL),o.fil,k=>{o.fil=k}))};
T.ovFlipH=()=>{const o=ovCur();if(!o)return;snp();o.fx=-(o.fx||1);const c=o.crop;[c.l,c.r]=[c.r,c.l];toast('↔ បានត្រឡប់ឆ្វេង/ស្ដាំ')};
T.ovFlipV=()=>{const o=ovCur();if(!o)return;snp();o.fy=-(o.fy||1);const c=o.crop;[c.t,c.b]=[c.b,c.t];toast('↕ បានត្រឡប់លើ/ក្រោម')};
T.ovRot=()=>{const o=ovCur();if(!o)return;snp();o.rot=((o.rot||0)+Math.PI/2)%(Math.PI*2);toast('↻ បង្វិល 90° · ប្រើ ២ម្រាមដៃដើម្បីបង្វិលដោយសេរី')};
function ovPlace(mode){const o=ovCur();if(!o)return;const gm=ovGeom(o);if(!gm)return;snp();
 const c=o.crop,fw=Math.max(.02,1-c.l-c.r),fh=Math.max(.02,1-c.t-c.b);o.rot=0;
 if(mode==='stretch'){o.scale=1;o.stx=cv.width/(fw*gm.w0);o.sty=cv.height/(fh*gm.h0)}
 else{o.stx=1;o.sty=1;const sw=cv.width/(fw*gm.w0),sh=cv.height/(fh*gm.h0);o.scale=mode==='fit'?Math.min(sw,sh):Math.max(sw,sh)}
 const W=gm.w0*o.scale*o.stx,H=gm.h0*o.scale*o.sty;
 o.x=-((c.l-c.r)/2*W)/cv.width;o.y=-((c.t-c.b)/2*H)/cv.height;
 toast(mode==='fit'?'ដាក់ឱ្យនៅក្នុងស៊ុមវីដេអូ':mode==='fill'?'ពេញស៊ុមវីដេអូ (មិនបាត់សមាមាត្រ)':'ទាញពេញស៊ុមវីដេអូ')}
T.ovFit=()=>ovPlace('fit');T.ovFill=()=>ovPlace('fill');T.ovStretch=()=>ovPlace('stretch');
T.ovRound=()=>{const o=ovCur();if(!o)return;open('Corners',c=>{c.append(...rng('Corners',0,1,.01,o.round||0,v=>{o.round=v}))})};
T.ovBorder=()=>{const o=ovCur();if(!o)return;open('Border',c=>{
 c.append(...rng('Width',0,20,1,o.border||0,v=>{o.border=v}));
 const ds=document.createElement('div');ds.className='dots';
 ['#ffffff','#ffd400','#ff3b6b','#22d3ee','#7cff6b','#000000'].forEach(k=>{const d=document.createElement('button');d.className='dot'+(o.bcol===k?' sel':'');d.style.background=k;d.onclick=()=>{o.bcol=k;ds.querySelectorAll('.dot').forEach(x=>x.classList.remove('sel'));d.classList.add('sel')};ds.appendChild(d)});c.appendChild(ds)})};
T.ovLayer=()=>{const o=ovCur();if(!o)return;open('Layer',c=>{const z=document.createElement('div');z.className='chips';
 [['Bring to front',()=>{const i=OV.indexOf(o);OV.splice(i,1);OV.push(o);selOV=OV.length-1;lay();toast('នាំមកមុខ')}],['Send backward',()=>{const i=OV.indexOf(o);OV.splice(i,1);OV.unshift(o);selOV=0;lay();toast('ដាក់ទៅក្រោយ')}]].forEach(([n,f])=>{const q=document.createElement('button');q.className='chip';q.textContent=n;q.onclick=f;z.appendChild(q)});c.appendChild(z)})};
T.ovBlend=()=>{const o=ovCur();if(!o)return;const M={Normal:'source-over',Multiply:'multiply',Screen:'screen',Overlay:'overlay',Lighten:'lighten',Darken:'darken'};
 open('Blend',c=>chips(c,Object.keys(M),Object.keys(M).find(k=>M[k]===o.blend)||'Normal',k=>{o.blend=M[k]}))};
T.ovReset=()=>{const o=ovCur();if(!o)return;snp();Object.assign(o,{x:0,y:0,scale:.42,stx:1,sty:1,rot:0,fx:1,fy:1,crop:{l:0,t:0,r:0,b:0}});toast('កំណត់ទីតាំង/ទំហំឡើងវិញ')};
T.ovDel=()=>{const o=OV[selOV];if(!o)return;snp();if(o.type==='video'){try{o.el.pause()}catch(_){}}const removed=OV[selOV];if(removed&&removed.uid)TX.forEach(t=>{if(t.attachTo===removed.uid)delete t.attachTo});OV.splice(selOV,1);selOV=-1;cropEdit=false;closeSheet();menu('main');lay();toast('🗑 បានលុប Overlay')};

/* sheet */
const sheet=$('#sheet');
function open(title,fn){$('#st').textContent=title;const c=$('#sc');c.innerHTML='';fn(c);sheet.classList.add('open')}
const closeSheet=()=>sheet.classList.remove('open');$('#ok').onclick=closeSheet;$('.grab').onclick=closeSheet;$('#stage').onclick=()=>{if(moved){moved=false;return}if(ovClickGuard)return;const wasOpen=sheet.classList.contains('open');closeSheet();selT=-1;if(!wasOpen&&selOV>=0&&MNK==='ovl'){selOV=-1;menu('main')}lay()};
function chips(c,list,curv,fn){const d=document.createElement('div');d.className='chips';list.forEach(k=>{const b=document.createElement('button');b.className='chip'+(String(k)===String(curv)?' sel':'');b.textContent=k;b.onclick=()=>{d.querySelectorAll('.chip').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');fn(k)};d.appendChild(b)});c.appendChild(d)}
const openAIUHD=()=>open('AI UHD · Export quality',c=>{const note=document.createElement('div');note.className='media-note';note.textContent='ជ្រើសរើសកម្រិតគុណភាពសម្រាប់វីដេអូ Export';c.appendChild(note);chips(c,['720p','1080p','2K'],expShort===1440?'2K':expShort+'p',k=>{expShort=k==='2K'?1440:parseInt(k,10);expBlob=null;toast('បានជ្រើសរើស '+k);$('#brandMode').textContent='AI UHD'})});
$('#brandMode').onclick=openAIUHD;$('#brandMode').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openAIUHD()}};
function trSheet(j){
 open('Transition',c=>{
  let all=false;const a=document.createElement('div');a.className='all';a.innerHTML='<u>'+I('check')+'</u>Apply to all';a.onclick=()=>{all=!all;a.classList.toggle('on',all)};c.appendChild(a);
  const l=document.createElement('div');l.className='lbl';const lv=document.createElement('span');lv.textContent=C[j].tr.d.toFixed(1)+'s';l.innerHTML='<span>Duration</span>';l.appendChild(lv);
  const r=document.createElement('input');r.type='range';r.min=.2;r.max=1.5;r.step=.1;r.value=C[j].tr.d;
  r.oninput=()=>{lv.textContent=(+r.value).toFixed(1)+'s';(all?C.slice(0,-1):[C[j]]).forEach(x=>x.tr.d=+r.value)};
  c.append(l,r);
  const g2=document.createElement('div');g2.className='grid';c.appendChild(g2);
  Object.keys(TR).forEach(k=>{
   const t=document.createElement('div');t.className='tile'+(C[j].tr.t===k?' sel':'');t.innerHTML='<div>'+TR[k]+'</div>'+k;
   t.onclick=()=>{snp();g2.querySelectorAll('.tile').forEach(x=>x.classList.remove('sel'));t.classList.add('sel');
    (all?C.slice(0,-1):[C[j]]).forEach(x=>{x.tr.t=k;x.tr.d=+r.value});build();
    if(k!=='None'){seekG(Math.max(0,st[j+1]-.8));pvEnd=st[j+1]+C[j].tr.d+.3;play()}};
   g2.appendChild(t)});
 })}
/* export · V6.3.19 Quality Profiles + Format Selection + Original Audio Preservation */
$('#exp').onclick=()=>open('Professional Export · V6.3.19',c=>{
 if(!C.length)return c.textContent='សូមបន្ថែមវីដេអូជាមុន';
 const line=(label)=>{const d=document.createElement('div');d.className='lbl';d.textContent=label;c.appendChild(d);return d};
 const select=(label,values,current,onchange)=>{
  line(label);
  const el=document.createElement('select');
  el.style.cssText='width:100%;padding:11px;border-radius:10px;background:#2a2a3c;color:#fff;border:1px solid #444;margin:0 0 12px;font-size:14px';
  values.forEach(v=>{const o=document.createElement('option');o.value=v.value??v;o.textContent=v.label??v;if(String(o.value)===String(current))o.selected=true;el.appendChild(o)});
  el.onchange=()=>{onchange(el.value);expBlob=null;downloadBtn.textContent='Start export';updateEstimate()};
  c.appendChild(el);return el;
 };
 const profile=line('Output profile');
 const updateProfile=()=>{profile.textContent=plat()+' · '+ratio+' · '+dimTxt()};
 updateProfile();
 select('Resolution',[
  {value:480,label:'480p · 854×480 / 480×854'},
  {value:720,label:'720p · HD'},
  {value:1080,label:'1080p · Full HD'},
  {value:1440,label:'2K · QHD'},
  {value:2160,label:'4K · UHD'}
 ],expShort,v=>{expShort=Number(v);updateProfile()});
 select('File format',[
  {value:'auto',label:'Auto · Best supported'},
  {value:'mp4',label:'MP4 · H.264 (if supported)'},
  {value:'webm',label:'WebM · VP9 / VP8'}
 ],expFormat,v=>{expFormat=String(v)});
 select('Frame rate',[
  {value:24,label:'24 FPS · Cinematic'},
  {value:25,label:'25 FPS'},
  {value:30,label:'30 FPS · Standard'},
  {value:50,label:'50 FPS'},
  {value:60,label:'60 FPS · Smooth'}
 ],expFps,v=>{expFps=Number(v)});
 select('Video bitrate',[
  {value:'auto',label:'Auto · Recommended for resolution'},
  {value:8,label:'8 Mbps · Compact'},
  {value:12,label:'12 Mbps · Standard'},
  {value:16,label:'16 Mbps · High quality 1080p'},
  {value:24,label:'24 Mbps · Very high'},
  {value:35,label:'35 Mbps · 2K / 4K'},
  {value:50,label:'50 Mbps · Maximum'}
 ],expBitrate,v=>{expBitrate=v==='auto'?'auto':Number(v)});
 select('Audio bitrate',[
  {value:128,label:'128 kbps · Compact'},
  {value:192,label:'192 kbps · High'},
  {value:256,label:'256 kbps · Very high'}
 ],expAudioBitrate,v=>{expAudioBitrate=Number(v)});
 line('Estimated file size');
 const estimate=document.createElement('div');
 estimate.style.cssText='font-size:13px;color:#b9b9c8;margin:0 0 12px';
 c.appendChild(estimate);
 const recommendedBitrate=()=>({480:3,720:6,1080:16,1440:28,2160:45}[expShort]||16);
 const activeVideoBitrate=()=>expBitrate==='auto'?recommendedBitrate():Number(expBitrate);
 const updateEstimate=()=>{const vb=activeVideoBitrate(),ab=expAudioBitrate/1000;estimate.textContent='ប្រហែល '+((vb+ab)*total/8).toFixed(1)+' MB · Video '+vb+' Mbps + Audio '+expAudioBitrate+' kbps'};
 updateEstimate();
 const note=document.createElement('div');
 note.style.cssText='font-size:11px;line-height:1.55;color:#9a9aae;margin:4px 0 12px';
 note.textContent='V6.3.6៖ កែលម្អការកំណត់ចន្លោះពេល Frame ដោយប្រើ Animation Frame Clock ដើម្បីកាត់បន្ថយ Frame ស្ទួន និងការរអាក់រអួលពី Timer មិនស៊ីគ្នា។ លំនាំដើម 1080p · 30 FPS · 12 Mbps។ សំឡេងដើមរក្សាតាម Audio Pipeline។ FPS ចេញពិតប្រាកដនៅតែអាស្រ័យលើ FPS ប្រភព និងសមត្ថភាពទូរសព្ទ។ 2K/4K និង Bitrate ខ្ពស់ប្រើ RAM និងថ្មច្រើន។ AI UHD Upscaling មិនទាន់មានទេ។';
 c.appendChild(note);
 const status=document.createElement('div');
 status.style.cssText='font-size:12px;color:#c5c5d3;margin:0 0 10px;min-height:18px';
 status.textContent=expBlob?'Export រួចរាល់ · អាចទាញយកបាន':'ត្រៀមនាំចេញ';
 c.appendChild(status);
 const downloadBtn=document.createElement('button');
 downloadBtn.className='pill';downloadBtn.id='ebtn';
 downloadBtn.textContent=expBlob?'⬇ Download':'Start export';
 downloadBtn.onclick=()=>expBlob?save():runExport(downloadBtn,status,cancelBtn);
 c.appendChild(downloadBtn);
 const cancelBtn=document.createElement('button');
 cancelBtn.className='pill';cancelBtn.textContent='Cancel export';
 cancelBtn.style.cssText='display:none;margin-top:8px;background:#383044;color:#fff';
 cancelBtn.onclick=()=>cancelExport(downloadBtn,status,cancelBtn);
 c.appendChild(cancelBtn);
});
function save(){if(!expBlob)return toast('មិនទាន់មានឯកសារ Export ទេ');const url=URL.createObjectURL(expBlob),a=document.createElement('a');a.href=url;a.download=expName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);toast('កំពុងទាញយក...')}
function exportCleanup(state,restoreCanvas=true){
 if(state&&state.iv)clearInterval(state.iv);
 if(state&&state.frameTimer)clearInterval(state.frameTimer);
 if(state&&state.startTimer)clearTimeout(state.startTimer);
 if(state&&state.stream)state.stream.getTracks().forEach(t=>{try{t.stop()}catch(_){}});
 if(state&&state.mediaStates){state.mediaStates.forEach((v,el)=>{try{el.muted=v.muted;el.volume=v.volume}catch(_){}})}
 if(state&&state.stream)adest=null;
 if(ex===state)ex=null;
 if(restoreCanvas)setCanvas(720);
}
function cancelExport(btn,status,cancelBtn){
 const state=ex;if(!state)return;
 state.cancelled=true;
 pause();
 if(state.rec&&state.rec.state!=='inactive'){
  try{state.rec.stop()}catch(_){exportCleanup(state)}
 }else{
  exportCleanup(state);
  btn.disabled=false;btn.textContent='Start export';
  cancelBtn.style.display='none';
  status.textContent='ការនាំចេញត្រូវបានបោះបង់';
  toast('បានបោះបង់ Export');
 }
}
/* V6.3.6 Audio pipeline: preserve original clip music and speech in exports. */
async function prepareExportAudio(stream){
 const AudioCtx=window.AudioContext||window.webkitAudioContext;
 if(!AudioCtx)throw new Error('Browser មិនគាំទ្រ Web Audio សម្រាប់បញ្ចូលសំឡេងក្នុង Export ទេ');
 ac=ac||new AudioCtx();
 if(ac.state==='suspended')await ac.resume();
 if(ac.state!=='running')throw new Error('មិនអាចបើក Audio Engine បាន');
 /* A fresh destination is required for every export because its tracks are
    stopped during cleanup. Reuse each media element source, never recreate it. */
 adest=ac.createMediaStreamDestination();
 const connected=new Set();
 const mediaStates=new Map();
 try{
  for(const c of C){
   const el=c.el;
   if(!el||connected.has(el))continue;
   connected.add(el);mediaStates.set(el,{muted:el.muted,volume:el.volume});
   let source=el._kaiserAudioSource;
   if(!source){
    source=ac.createMediaElementSource(el);
    el._kaiserAudioSource=source;
    source.connect(ac.destination); // keep normal preview audio audible
   }
   if(el._kaiserExportDestination){
    try{source.disconnect(el._kaiserExportDestination)}catch(_){}
   }
   source.connect(adest);
   el._kaiserExportDestination=adest;
   el.muted=false;
   const clip=C.find(x=>x.el===el);
   if(clip)el.volume=cl(clip.vol??1,0,1);
  }
  const audioTracks=adest.stream.getAudioTracks();
  if(!audioTracks.length)throw new Error('មិនអាចបង្កើត Audio Track សម្រាប់ Export បាន');
  audioTracks.forEach(track=>stream.addTrack(track));
  return {audioTracks:audioTracks.length,mediaStates};
 }catch(err){
  mediaStates.forEach((v,el)=>{try{el.muted=v.muted;el.volume=v.volume}catch(_){}});
  try{adest.stream.getTracks().forEach(track=>track.stop())}catch(_){}
  adest=null;
  throw err;
 }
}
async function runExport(btn,status,cancelBtn){
 if(!window.MediaRecorder)return toast('Browser នេះមិនគាំទ្រ MediaRecorder Export ទេ');
 if(!cv.captureStream)return toast('Browser នេះមិនគាំទ្រ Canvas Capture ទេ');
 pause();expBlob=null;setCanvas(expShort);snap._ok=false;seekG(0);
 btn.disabled=true;btn.textContent='Preparing export…';cancelBtn.style.display='block';
 try{
  await waitVideoFrame(C[cur].el,12000);
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 }catch(err){
  btn.disabled=false;btn.textContent='Start export';cancelBtn.style.display='none';setCanvas(720);build();
  status.textContent='មិនអាច Decode រូបភាពដំបូងសម្រាប់ Export បាន';toast(err.message||'មិនអាចរៀបចំរូបភាពសម្រាប់ Export បាន');return;
 }
 let stm=cv.captureStream(0);
 let videoTrack=stm.getVideoTracks()[0];
 let manualFrameCapture=!!(videoTrack&&typeof videoTrack.requestFrame==='function');
 if(!manualFrameCapture){stm.getTracks().forEach(t=>{try{t.stop()}catch(_){}});stm=cv.captureStream(expFps);videoTrack=stm.getVideoTracks()[0]}
 let exportAudio;
 try{
  exportAudio=await prepareExportAudio(stm);
 }catch(err){
  stm.getTracks().forEach(t=>{try{t.stop()}catch(_){}});
  adest=null;setCanvas(720);btn.disabled=false;btn.textContent='Start export';cancelBtn.style.display='none';
  status.textContent='មិនអាចរៀបចំសំឡេងសម្រាប់ Export បាន';
  toast(err&&err.message?err.message:'Audio Export មិនដំណើរការ');return;
 }
 const mp4Candidates=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4'];
 const webmCandidates=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
 const candidates=expFormat==='mp4'?mp4Candidates:expFormat==='webm'?webmCandidates:[...mp4Candidates,...webmCandidates];
 const mime=candidates.find(m=>MediaRecorder.isTypeSupported(m));
 if(!mime){stm.getTracks().forEach(t=>{try{t.stop()}catch(_){}});exportAudio.mediaStates.forEach((v,el)=>{try{el.muted=v.muted;el.volume=v.volume}catch(_){}});adest=null;setCanvas(720);btn.disabled=false;btn.textContent='Start export';cancelBtn.style.display='none';status.textContent=expFormat==='mp4'?'Browser មិនគាំទ្រ MP4 នៅលើឧបករណ៍នេះទេ':'Browser មិនគាំទ្រ WebM នៅលើឧបករណ៍នេះទេ';return toast('សូមជ្រើសរើសទម្រង់ផ្សេងដែល Browser គាំទ្រ')}
 const chunks=[];let rec;
 try{
  rec=new MediaRecorder(stm,{mimeType:mime,videoBitsPerSecond:Math.max(500000,Math.round((expBitrate==='auto'?({480:3,720:6,1080:16,1440:28,2160:45}[expShort]||16):Number(expBitrate))*1000000)),audioBitsPerSecond:Math.max(64000,Math.round(expAudioBitrate*1000))});
 }catch(err){
  stm.getTracks().forEach(t=>{try{t.stop()}catch(_){}});exportAudio.mediaStates.forEach((v,el)=>{try{el.muted=v.muted;el.volume=v.volume}catch(_){}});adest=null;setCanvas(720);btn.disabled=false;cancelBtn.style.display='none';
  status.textContent='មិនអាចបង្កើត Encoder សម្រាប់ការកំណត់នេះបាន';
  return toast('Quality នេះមិនគាំទ្រ សូមជ្រើសរើសកម្រិតទាបជាងនេះ');
 }
 const state={rec,stream:stm,mediaStates:exportAudio.mediaStates,iv:null,frameTimer:null,videoTrack,manualFrameCapture,lastCaptureTime:undefined,startTimer:null,cancelled:false,started:false};
 ex=state;
 rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
 rec.onerror=()=>{
  exportCleanup(state);btn.disabled=false;btn.textContent='Start export';cancelBtn.style.display='none';
  status.textContent='Export មានបញ្ហា សូមសាកម្ដងទៀត';toast('Export មានបញ្ហា សូមសាកម្ដងទៀត');
 };
 rec.onstop=()=>{
  const cancelled=state.cancelled;
  const actualMime=rec.mimeType||mime;
  exportCleanup(state);btn.disabled=false;cancelBtn.style.display='none';
  if(cancelled){
   expBlob=null;btn.textContent='Start export';status.textContent='ការនាំចេញត្រូវបានបោះបង់';toast('បានបោះបង់ Export');seekG(0);return;
  }
  expBlob=new Blob(chunks,{type:actualMime});
  const isMp4=actualMime.toLowerCase().includes('mp4');
  expName='KAISER_'+expShort+'p_'+expFps+'fps_'+ratio.replace(':','x')+'.'+(isMp4?'mp4':'webm');
  btn.textContent='⬇ Download';
  status.textContent='Export រួចរាល់ · '+(isMp4?'MP4':'WebM')+' · '+expShort+'p · '+expFps+' FPS target · '+(Math.round((rec.videoBitsPerSecond||0)/1000000))+' Mbps · Original audio · '+(expBlob.size/1048576).toFixed(1)+' MB';
  toast('Export រួចរាល់ · រក្សាសំឡេងដើម');seekG(0);
 };
 state.iv=setInterval(()=>{
  const pct=total>0?Math.min(99,Math.round(g/total*100)):0;
  btn.textContent='Exporting '+pct+'%';
  status.textContent='កំពុងនាំចេញ · '+fmt(g)+' / '+fmt(total)+' · '+pct+'% · Audio';
 },200);
 state.startTimer=setTimeout(async()=>{
  if(ex!==state||state.cancelled)return;
  try{
   /* Let the editor paint the real opening frame before capture begins.
      This avoids a black first-frame poster in Gallery on many Android devices. */
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   if(ex!==state||state.cancelled)return;
   rec.start(1000);state.started=true;btn.textContent='Exporting 0%';
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   if(state.manualFrameCapture&&state.videoTrack&&state.videoTrack.readyState==='live'){
    try{state.videoTrack.requestFrame()}catch(_){}
   }
   play();
   if(!playing)throw new Error('Playback did not start');
  }catch(err){
   state.cancelled=true;
   try{if(rec.state!=='inactive')rec.stop()}catch(_){}
   exportCleanup(state);btn.disabled=false;btn.textContent='Start export';cancelBtn.style.display='none';
   status.textContent='មិនអាចចាប់ផ្ដើមការចាក់វីដេអូសម្រាប់ Export បាន';
   toast('មិនអាចចាប់ផ្ដើម Export បាន');
  }
 },350);
}
function finishExport(){if(!ex)return;const r=ex.rec;setTimeout(()=>{if(ex&&r.state!=='inactive')r.stop()},300)}
const P0={sc:1,x:0,y:0,r:0,o:1},cp=c=>({...c,tr:{...c.tr},adj:{...(c.adj||{brightness:100,contrast:100,saturation:100,exposure:100})},an:c.an&&{...c.an},kf:(c.kf||[]).map(q=>({...q})),pr:{...(c.pr||P0)}});
function kfVal(c,lt){const k=c.kf;if(!k||!k.length)return c.pr||P0;if(lt<=k[0].t)return k[0];const L=k[k.length-1];if(lt>=L.t)return L;let i=0;while(k[i+1].t<lt)i++;
 const a=k[i],b=k[i+1],p=sm((lt-a.t)/(b.t-a.t)),o={};for(const q in P0)o[q]=a[q]+(b[q]-a[q])*p;return o}
function fx(c,lt,d){const o=an(c.an,lt,d,lt),k=kfVal(c,lt);o.sx*=k.sc;o.sy*=k.sc;o.x+=k.x;o.y+=k.y;o.r+=k.r*Math.PI/180;o.a*=k.o;return o}
const KR=[['Scale','sc',.2,3,.01],['X','x',-1,1,.01],['Y','y',-1,1,.01],['Rotate','r',-180,180,1],['Opacity','o',0,1,.01]];
(function(){const p=$('#kp');p.innerHTML='<div class="kh"><b>Keyframe</b><button id="kadd"></button><button id="kok"></button></div>';
 KR.forEach(([l,k,a,b,st2])=>{const d=document.createElement('div');d.className='kr';d.innerHTML='<span>'+l+'</span><input type="range" min="'+a+'" max="'+b+'" step="'+st2+'" data-k="'+k+'"><em></em>';p.appendChild(d)});
 $('#kok').innerHTML=I('check');$('#kadd').innerHTML=I('dia');
 p.querySelectorAll('input').forEach(r=>{r.addEventListener('pointerdown',()=>kdrag=true);r.oninput=()=>{setProp(r.dataset.k,+r.value);kpRefresh(r)}});
 addEventListener('pointerup',()=>kdrag=false);
 $('#kok').onclick=()=>{kpOn=false;$('#kp').classList.remove('on');$('#app').classList.remove('kpo')};
 $('#kadd').onclick=()=>{const c=C[cur];if(!c)return;const lt=g-st[cur];c.kf=c.kf||[];const i=c.kf.findIndex(z=>Math.abs(z.t-lt)<.12);
  if(i>=0)c.kf.splice(i,1);else{c.kf.push({...kfVal(c,lt),t:lt});c.kf.sort((a,b)=>a.t-b.t)}lay();kpRefresh()}})();
function setProp(k,v){const c=C[cur];if(!c)return;const lt=g-st[cur];
 if(c.kf&&c.kf.length){let q=c.kf.find(z=>Math.abs(z.t-lt)<.12);if(!q){q={...kfVal(c,lt),t:lt};c.kf.push(q);c.kf.sort((a,b)=>a.t-b.t)}q[k]=v}
 else{c.pr=c.pr||{...P0};c.pr[k]=v}lay()}
function kpRefresh(skip){const c=C[cur];if(!c)return;const lt=g-st[cur],v=kfVal(c,lt);
 $('#kp').querySelectorAll('.kr').forEach(d=>{const r=d.querySelector('input'),x=v[r.dataset.k];if(r!==skip)r.value=x;d.querySelector('em').textContent=(+x).toFixed(r.dataset.k==='r'?0:2)});
 $('#kadd').classList.toggle('on',!!(c.kf||[]).find(z=>Math.abs(z.t-lt)<.12))}
T.kf=()=>{if(!C.length)return toast('សូមបន្ថែមវីដេអូជាមុន');kpOn=true;$('#kp').classList.add('on');$('#app').classList.add('kpo');closeSheet();kpRefresh()};

/* ===== V6.3.15 Text Keyframe panel: same layout and behaviour as the Keyframe panel ===== */
(function(){
 const p=document.createElement('div');p.id='tkp';$('#kp').after(p);
 p.innerHTML='<div class="kh"><b>Text</b><button id="taa" type="button" style="font-weight:700">Aa</button><button id="tadd" type="button"></button><button id="tok" type="button"></button></div>';
 KR.forEach(([l,k,a,b,s2])=>{const d=document.createElement('div');d.className='kr';d.innerHTML='<span>'+l+'</span><input type="range" min="'+a+'" max="'+b+'" step="'+s2+'" data-k="'+k+'"><em></em>';p.appendChild(d)});
 $('#tok').innerHTML=I('check');$('#tadd').innerHTML=I('dia');
 p.querySelectorAll('input').forEach(r=>{r.addEventListener('pointerdown',()=>kdrag=true);r.oninput=()=>{setTProp(r.dataset.k,+r.value);tkRefresh(r)}});
 $('#tok').onclick=()=>tkClose();
 $('#taa').onclick=()=>{if(TX[selT])textSheet(selT)};
 $('#tadd').onclick=()=>{const t=TX[selT];if(!t)return;snp();const lt=g-t.st;t.kf=t.kf||[];const i=t.kf.findIndex(z=>Math.abs(z.t-lt)<.12);
  if(i>=0)t.kf.splice(i,1);else{t.kf.push({...kfVal(t,lt),t:lt});t.kf.sort((a,b)=>a.t-b.t)}lay();tkRefresh()};
})();
function setTProp(k,v){const t=TX[selT];if(!t)return;const lt=g-t.st;
 if(t.kf&&t.kf.length){let q=t.kf.find(z=>Math.abs(z.t-lt)<.12);if(!q){q={...kfVal(t,lt),t:lt};t.kf.push(q);t.kf.sort((a,b)=>a.t-b.t)}q[k]=v}
 else{t.pr=t.pr||{...P0};t.pr[k]=v}lay()}
function tkRefresh(skip){const t=TX[selT];if(!t){tkClose();return}const lt=g-t.st,v=kfVal(t,lt);
 $('#tkp').querySelectorAll('.kr').forEach(d=>{const r=d.querySelector('input'),x=v[r.dataset.k];if(r!==skip)r.value=x;d.querySelector('em').textContent=(+x).toFixed(r.dataset.k==='r'?0:2)});
 $('#tadd').classList.toggle('on',!!(t.kf||[]).find(z=>Math.abs(z.t-lt)<.12))}
function tkClose(){tkOn=false;$('#tkp').classList.remove('on');if(!kpOn)$('#app').classList.remove('kpo')}
function tkOpen(i){const t=TX[i];if(!t)return;selT=i;selOV=-1;
 if(kpOn){kpOn=false;$('#kp').classList.remove('on')}
 if(g<t.st||g>=t.st+t.d)seekG(cl(t.st+.01,0,Math.max(0,total-.01)));
 tkOn=true;closeSheet();$('#tkp').classList.add('on');$('#app').classList.add('kpo');tkRefresh();lay()}
{const kf0=T.kf;T.kf=()=>{tkClose();kf0()}}
setCanvas(720);build();loop();
addEventListener('resize',build);
