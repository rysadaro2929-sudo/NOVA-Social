(function(){
'use strict';
const D=document,$$=s=>D.querySelector(s);
const kmL=()=>localStorage.getItem('kaiser-editor-language')!=='en';
const L2=(a,b)=>kmL()?a:b;
const say=m=>{try{toast(m)}catch(_){}};
Object.assign(P,{
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/>',
 spark:'<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 16v4M17 18h4M5 3v3M3.5 4.5h3"/>'
});
/* =============== 1. VOICE STUDIO (record + 20 voices) =============== */
const VOICES=[
 ['normal','🎙️','Original','ដើម',{rate:1}],
 ['male','👨','Male','ប្រុស',{rate:.9,low:70,high:9000}],
 ['deep','🧔','Deep man','ប្រុសធំ',{rate:.78,low:50,high:5500}],
 ['female','👩','Female','ស្រី',{rate:1.13,low:180,high:15000}],
 ['girl','👧','Girl','ក្មេងស្រី',{rate:1.26,low:220,high:16000}],
 ['boy','👦','Boy','ក្មេងប្រុស',{rate:1.18,low:140,high:14000}],
 ['child','🧒','Child','កុមារ',{rate:1.32,low:250,high:16000}],
 ['baby','👶','Baby','ទារក',{rate:1.6,low:300,high:17000,vib:.02}],
 ['elder','👴','Old man','ចាស់ប្រុស',{rate:.82,low:90,high:6500,vib:.015}],
 ['oldw','👵','Old woman','ចាស់ស្រី',{rate:1.02,low:200,high:7000,vib:.03}],
 ['funny','🤡','Funny','កំប្លែង',{rate:1.22,low:120,high:15000,vib:.025,dist:.12}],
 ['chip','🐿️','Chipmunk','កំប្រុក',{rate:1.6,low:200,high:18000}],
 ['monster','👹','Monster','បិសាច',{rate:.62,low:40,high:3500,dist:.2}],
 ['robot','🤖','Robot','មនុស្សយន្ត',{rate:1,low:100,high:9000,ring:50}],
 ['alien','👽','Alien','មនុស្សក្រៅភព',{rate:1.12,low:150,high:12000,ring:180,vib:.05}],
 ['echo','🔊','Echo','បន្ទរ',{rate:1,echo:.28,fb:.42}],
 ['hall','🏛️','Big hall','សាលធំ',{rate:1,reverb:1.8}],
 ['phone','📞','Telephone','ទូរសព្ទ',{rate:1,low:450,high:3300}],
 ['mega','📢','Megaphone','បំពង់ឡូ',{rate:1,low:500,high:4200,dist:.3}],
 ['whisper','🤫','Whisper','ខ្សឹប',{rate:1,low:1400,high:12000,gain:.75}],
 ['tremble','😨','Trembling','ញ័រ',{rate:1,low:100,high:12000,vib:.07,dist:.04,lfo:7}]
];
let voiceSel='normal',VR={rec:null,stream:null,parts:[],t0:0,timer:null,analyser:null,raf:0,onlevel:null,onstate:null,pausedAt:0,pausedMs:0,stopping:false};
function voiceRecordElapsed(){if(!VR.t0)return 0;const now=VR.pausedAt||Date.now();return Math.max(0,(now-VR.t0-VR.pausedMs)/1000)}
async function voiceProcess(blob,cfg){
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('Web Audio មិនត្រូវបានគាំទ្រ');
 ac=ac||new AC();if(ac.state==='suspended')await ac.resume();
 const raw=await blob.arrayBuffer(),inb=await ac.decodeAudioData(raw.slice(0));
 const sr=inb.sampleRate,rate=cfg.rate||1,tail=(cfg.echo?1.5:0)+(cfg.reverb||0);
 const outLen=Math.ceil(inb.length/rate)+Math.ceil(tail*sr);
 const Off=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!Off)throw new Error('Offline Audio មិនត្រូវបានគាំទ្រ');
 const off=new Off(Math.min(2,inb.numberOfChannels),outLen,sr);
 const src=off.createBufferSource();src.buffer=inb;src.playbackRate.value=rate;
 const hp=off.createBiquadFilter();hp.type='highpass';hp.frequency.value=cfg.low||20;
 const lp=off.createBiquadFilter();lp.type='lowpass';lp.frequency.value=Math.min(cfg.high||19000,sr/2-200);
 src.connect(hp);hp.connect(lp);let last=lp;
 if(cfg.ring){const rg=off.createGain();rg.gain.value=0;const o=off.createOscillator();o.frequency.value=cfg.ring;o.connect(rg.gain);last.connect(rg);last=rg;o.start(0)}
 if(cfg.dist){const sh=off.createWaveShaper(),cu=new Float32Array(44100);for(let i=0;i<cu.length;i++){const x=i*2/(cu.length-1)-1;cu[i]=Math.tanh(x*(1+cfg.dist*18))}sh.curve=cu;last.connect(sh);last=sh}
 if(cfg.echo){const d=off.createDelay(1.5);d.delayTime.value=cfg.echo;const fb=off.createGain();fb.gain.value=cfg.fb||.4;const wet=off.createGain(),mix=off.createGain();wet.gain.value=.6;
  last.connect(d);d.connect(fb);fb.connect(d);d.connect(wet);last.connect(mix);wet.connect(mix);last=mix}
 if(cfg.reverb){const len=Math.floor(sr*cfg.reverb),ir=off.createBuffer(2,len,sr);for(let ch=0;ch<2;ch++){const a=ir.getChannelData(ch);for(let i=0;i<len;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6)}
  const cvn=off.createConvolver();cvn.buffer=ir;const wet=off.createGain();wet.gain.value=.55;const dry=off.createGain();dry.gain.value=.8;const mix=off.createGain();
  last.connect(cvn);cvn.connect(wet);last.connect(dry);wet.connect(mix);dry.connect(mix);last=mix}
 const out=off.createGain();out.gain.value=cfg.gain||.95;last.connect(out);out.connect(off.destination);
 if(cfg.vib){const lfo=off.createOscillator(),dp=off.createGain();lfo.frequency.value=cfg.lfo||4.5;dp.gain.value=cfg.vib;lfo.connect(dp);dp.connect(src.playbackRate);lfo.start(0)}
 src.start(0);const buf=await off.startRendering();
 /* normalise so every voice has similar loudness */
 let pk=0;for(let ch=0;ch<buf.numberOfChannels;ch++){const a=buf.getChannelData(ch);for(let i=0;i<a.length;i++){const v=Math.abs(a[i]);if(v>pk)pk=v}}
 if(pk>.0005){const k=Math.min(4,.9/pk);if(Math.abs(k-1)>.05)for(let ch=0;ch<buf.numberOfChannels;ch++){const a=buf.getChannelData(ch);for(let i=0;i<a.length;i++)a[i]*=k}}
 return buf}
const vCfg=id=>(VOICES.find(v=>v[0]===id)||VOICES[0])[4];
const vName=id=>{const v=VOICES.find(x=>x[0]===id)||VOICES[0];return v[1]+' '+(kmL()?v[3]:v[2])};
async function addVoice(blob,id,startAt){
 const buf=await voiceProcess(blob,vCfg(id));
 voiceClips.push({name:'Voice '+(voiceClips.length+1)+' · '+vName(id),buffer:buf,start:Number.isFinite(startAt)?startAt:g,duration:buf.duration,trimStart:0,trimEnd:buf.duration,baseStart:Number.isFinite(startAt)?startAt:g,volume:1});
 return buf}
function releaseMic(){try{VR.stream&&VR.stream.getTracks().forEach(t=>t.stop())}catch(_){}VR.stream=null;clearInterval(VR.timer);cancelAnimationFrame(VR.raf)}
async function startRecord(){
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||typeof MediaRecorder==='undefined'){VR.err=L2('Browser នេះមិនអាចថតផ្ទាល់ក្នុង App បាន (ត្រូវការ HTTPS)','This browser cannot record live here (needs HTTPS)');return false}
 try{
  if(g>=total-.05)seekG(0);
  VR.startG=g;
  VR.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
  const mt=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg'].find(m=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(m));
  VR.rec=mt?new MediaRecorder(VR.stream,{mimeType:mt}):new MediaRecorder(VR.stream);VR.parts=[];VR.pausedAt=0;VR.pausedMs=0;VR.stopping=false;
  VR.rec.ondataavailable=e=>{if(e.data&&e.data.size)VR.parts.push(e.data)};
  VR.rec.onpause=()=>{if(!VR.pausedAt)VR.pausedAt=Date.now()};
  VR.rec.onresume=()=>{if(VR.pausedAt){VR.pausedMs+=Date.now()-VR.pausedAt;VR.pausedAt=0}};
  VR.rec.start(250);VR.t0=Date.now();
  /* Start video immediately after microphone permission is granted, so both share the same timeline. */
  if(!playing)play();
  try{const AC=window.AudioContext||window.webkitAudioContext;ac=ac||new AC();if(ac.state==='suspended')await ac.resume();
   const an=ac.createAnalyser();an.fftSize=256;ac.createMediaStreamSource(VR.stream).connect(an);VR.analyser=an;const buf=new Uint8Array(an.fftSize);
   const tick=()=>{if(!VR.rec||VR.rec.state==='inactive')return;an.getByteTimeDomainData(buf);let m=0;for(const v of buf)m=Math.max(m,Math.abs(v-128));VR.onlevel&&VR.onlevel(m/128);VR.raf=requestAnimationFrame(tick)};tick()}catch(_){}
  VR.timer=setInterval(()=>{const s=voiceRecordElapsed();VR.onstate&&VR.onstate(VR.rec&&VR.rec.state==='paused'?'paused':'rec',s);if(s>=180&&VR.onlimit&&!VR.stopping){VR.stopping=true;VR.onlimit()}},200);
  return true
 }catch(err){releaseMic();VR.err=L2('មិនអាចបើក Microphone៖ ','Cannot open microphone: ')+(err.message||err);return false}}
function stopRecord(){return new Promise(res=>{
 const r=VR.rec;if(!r||r.state==='inactive'){res(null);return}
 if(VR.stopping&&r.state==='inactive'){res(null);return}VR.stopping=true;VR.endG=g;
 r.onstop=()=>{const blob=new Blob(VR.parts,{type:r.mimeType||'audio/webm'});releaseMic();VR.rec=null;VR.stopping=false;VR.pausedAt=0;res({blob,start:VR.startG,end:VR.endG})};
 try{r.stop()}catch(_){releaseMic();VR.rec=null;VR.stopping=false;res(null)}
})}
T.voice=()=>{
 if(!C.length)return say('សូមបន្ថែមវីដេអូជាមុន');
 open('🎙 Voice Studio · ថតសំឡេង',c=>{
  const hint=D.createElement('div');hint.className='media-note';hint.textContent=L2('ជ្រើសសំឡេង រួចចុចថត ខណៈវីដេអូកំពុងដើរ។ ចុចឈប់ថតដើម្បីបញ្ចប់ផ្នែកមួយ រួចថតផ្នែកបន្ទាប់បាន។ អាចកាត់ដើម/ចុង ឬលុបផ្នែកមិនល្អ ហើយថតជំនួស។ សំឡេងនឹងត្រូវនឹង Playhead និង Export ជាមួយវីដេអូ។','Pick a voice and record while the video plays. Stop to finish a take, then record another segment. Trim the start/end or delete a bad take and record a replacement. Voice stays aligned to the playhead and exports with the video.');
  const grid=D.createElement('div');grid.className='vgrid';
  const draw=()=>{grid.innerHTML='';VOICES.forEach(v=>{const t=D.createElement('div');t.className='vtile'+(voiceSel===v[0]?' sel':'');t.innerHTML='<div>'+v[1]+'</div>'+(kmL()?v[3]:v[2]);t.onclick=()=>{voiceSel=v[0];draw()};grid.appendChild(t)})};draw();
  const lv=D.createElement('div');lv.className='vlevel';lv.innerHTML='<i></i>';
  const st=D.createElement('div');st.className='media-note';st.textContent=L2('រួចរាល់ · ត្រូវអនុញ្ញាត Microphone','Ready · allow the microphone');
  const row=D.createElement('div');row.className='vrec';
  const rb=D.createElement('button');rb.className='media-action rec';rb.textContent='● '+L2('ថត','Record');
  const fb=D.createElement('button');fb.className='media-action';fb.textContent='📁 '+L2('ប្តូរសំឡេងពីឯកសារ','Voice from file');
  const fi=D.createElement('input');fi.type='file';fi.accept='audio/*,video/*';fi.hidden=true;
  const capIn=D.createElement('input');capIn.type='file';capIn.accept='audio/*';capIn.setAttribute('capture','');capIn.hidden=true;
  const pb2=D.createElement('button');pb2.className='media-action';pb2.textContent='📱 '+L2('ថតដោយ App ទូរសព្ទ','Phone recorder app');
  row.append(rb,pb2,fb,fi,capIn);
  const list=D.createElement('div');list.className='media-list';
  const paintList=()=>{list.innerHTML='';voiceClips.forEach((v,i)=>{
   const r=D.createElement('div');r.className='media-item';r.style.flexWrap='wrap';
   const n=D.createElement('div');n.className='mi-name';n.textContent='🎙 '+v.name;
   const m=D.createElement('small');m.textContent=v.duration.toFixed(1)+'s · '+L2('ចាប់ផ្តើម ','start ')+v.start.toFixed(1)+'s';n.appendChild(m);
   const pv=D.createElement('button');pv.textContent='▶';pv.onclick=()=>{try{pause();const AC=window.AudioContext||window.webkitAudioContext;ac=ac||new AC();if(ac.state==='suspended')ac.resume();const nd=ac.createBufferSource();nd.buffer=v.buffer;nd.connect(ac.destination);nd.start(0,v.trimStart||0,Math.max(.01,(v.trimEnd??v.buffer.duration)-(v.trimStart||0)));voiceNodes.push(nd)}catch(_){say('Preview មិនបាន')}};
   const mv=D.createElement('button');mv.textContent='⇥ '+L2('នៅ Playhead','Here');mv.onclick=()=>{v.baseStart=g-(v.trimStart||0);v.start=g;paintList();say(L2('ផ្លាស់ទីទៅ ','Moved to ')+g.toFixed(1)+'s')};
   const sp=D.createElement('button');sp.textContent='✂ '+L2('កាត់ត្រង់ Playhead','Split at Playhead');sp.onclick=()=>{
    const clipStart=v.start,clipEnd=v.start+v.duration,cut=g;
    if(cut<=clipStart+.05||cut>=clipEnd-.05){say(L2('ដាក់ Playhead នៅខាងក្នុង Voice Clip','Move the playhead inside this voice clip'));return}
    try{const sr=v.buffer.sampleRate,ch=v.buffer.numberOfChannels,trim0=v.trimStart||0,trim1=v.trimEnd??v.buffer.duration,cutAt=trim0+(cut-clipStart);
     const leftFrames=Math.max(1,Math.floor((cutAt-trim0)*sr)),rightFrames=Math.max(1,Math.floor((trim1-cutAt)*sr));
     const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('AudioContext unavailable');ac=ac||new AC();
     const left=ac.createBuffer(ch,leftFrames,sr),right=ac.createBuffer(ch,rightFrames,sr);
     for(let k=0;k<ch;k++){const src=v.buffer.getChannelData(k);left.getChannelData(k).set(src.subarray(Math.floor(trim0*sr),Math.floor(trim0*sr)+leftFrames));right.getChannelData(k).set(src.subarray(Math.floor(cutAt*sr),Math.floor(cutAt*sr)+rightFrames))}
     const a={...v,name:v.name+' · A',buffer:left,start:clipStart,duration:left.duration,trimStart:0,trimEnd:left.duration,baseStart:clipStart};
     const b={...v,name:v.name+' · B',buffer:right,start:cut,duration:right.duration,trimStart:0,trimEnd:right.duration,baseStart:cut};
     voiceClips.splice(i,1,a,b);paintList();say(L2('បានកាត់ Voice ជាពីរផ្នែក','Voice clip split into two parts'));
    }catch(err){say(L2('មិនអាចកាត់ Voice បាន','Could not split voice clip'))}
   };
   const dl=D.createElement('button');dl.textContent='🗑';dl.onclick=()=>{voiceClips.splice(i,1);paintList()};
   const trim=D.createElement('div');trim.style.cssText='width:100%;display:grid;grid-template-columns:1fr;gap:4px';
   const la=D.createElement('label');la.textContent=L2('កាត់ដើមសំឡេង','Trim audio start')+' · '+(v.trimStart||0).toFixed(1)+'s';
   const ra=D.createElement('input');ra.type='range';ra.min='0';ra.max=Math.max(.1,v.buffer.duration-.1);ra.step='.05';ra.value=v.trimStart||0;
   const lb=D.createElement('label');lb.textContent=L2('កាត់ចុងសំឡេង','Trim audio end')+' · '+(v.trimEnd??v.buffer.duration).toFixed(1)+'s';
   const re=D.createElement('input');re.type='range';re.min=Math.min(v.buffer.duration,(v.trimStart||0)+.1);re.max=v.buffer.duration;re.step='.05';re.value=v.trimEnd??v.buffer.duration;
   ra.oninput=()=>{v.trimStart=Math.min(+ra.value,(v.trimEnd??v.buffer.duration)-.1);v.start=(v.baseStart??v.start)+v.trimStart;v.duration=(v.trimEnd??v.buffer.duration)-v.trimStart;la.textContent=L2('កាត់ដើមសំឡេង','Trim audio start')+' · '+v.trimStart.toFixed(1)+'s';m.textContent=v.duration.toFixed(1)+'s · '+L2('ចាប់ផ្តើម ','start ')+v.start.toFixed(1)+'s';re.min=v.trimStart+.1};
   re.oninput=()=>{v.trimEnd=Math.max(v.trimStart+.1,+re.value);v.duration=v.trimEnd-v.trimStart;lb.textContent=L2('កាត់ចុងសំឡេង','Trim audio end')+' · '+v.trimEnd.toFixed(1)+'s';m.textContent=v.duration.toFixed(1)+'s · '+L2('ចាប់ផ្តើម ','start ')+v.start.toFixed(1)+'s'};
   trim.append(la,ra,lb,re);r.append(n,pv,mv,sp,dl,trim);list.appendChild(r)})};paintList();
  const setUI=(rec,s)=>{rb.textContent=rec?'■ '+L2('ឈប់ & រក្សាទុក','Stop & Save')+' · '+(s||0).toFixed(1)+'s':'● '+L2('ថត','Record')};
  VR.onlevel=x=>{const i=lv.firstChild;if(i)i.style.width=Math.min(100,x*160)+'%'};
  VR.onstate=(k,s)=>{setUI(k==='rec',s);if(k==='paused')st.textContent=L2('បានផ្អាកការថត · ចុច Play ដើម្បីបន្ត','Recording paused · press Play to resume')};
  const finish=async take=>{
   const blob=take&&take.blob?take.blob:take;
   if(!blob||!blob.size){st.textContent=L2('មិនមានសំឡេង','No audio captured');return}
   st.textContent=L2('កំពុងប្តូរសំឡេង…','Processing voice…');
   try{const b=await addVoice(blob,voiceSel,take&&Number.isFinite(take.start)?take.start:g);st.textContent=L2('✓ បានរក្សាទុក ','✓ Saved ')+b.duration.toFixed(1)+'s · '+vName(voiceSel);paintList();say('✓ Voice')}
   catch(e){st.textContent=L2('មិនអាចដំណើរការសំឡេង៖ ','Could not process: ')+(e.message||e)}
  };
  VR.onlimit=async()=>{if(VR.rec&&VR.rec.state!=='inactive'){setUI(false);await finish(await stopRecord())}};
  rb.onclick=async()=>{
   if(VR.rec&&VR.rec.state!=='inactive'){setUI(false);st.textContent=L2('កំពុងរៀបចំ…','Preparing…');VR.onlevel&&VR.onlevel(0);await finish(await stopRecord());return}
   if(await startRecord()){st.textContent=L2('កំពុងថត… និយាយឥឡូវ','Recording… speak now');setUI(true,0)}
   else{st.textContent=(VR.err||'')+' → '+L2('កំពុងបើកកម្មវិធីថតសំឡេងរបស់ទូរសព្ទ… ថតរួចត្រឡប់មកវិញ សំឡេងនឹងប្តូរដោយស្វ័យប្រវត្តិ','opening the phone recorder… record, come back, and the voice is applied automatically');capIn.click()}};
  pb2.onclick=()=>{st.textContent=L2('កំពុងបើកកម្មវិធីថតសំឡេងរបស់ទូរសព្ទ…','Opening the phone recorder…');capIn.click()};
  capIn.onchange=async()=>{const f=capIn.files[0];capIn.value='';if(f)await finish(f)};
  fb.onclick=()=>fi.click();
  fi.onchange=async()=>{const f=fi.files[0];fi.value='';if(f)await finish(f)};
  if(VR.rec&&VR.rec.state!=='inactive'){setUI(VR.rec.state==='recording',voiceRecordElapsed());st.textContent=VR.rec.state==='paused'?L2('បានផ្អាកការថត','Recording paused'):L2('កំពុងថត…','Recording…')}
  c.append(row,lv,st,hint,grid,list);
  setTimeout(()=>{c.scrollTop=0;const q=D.querySelector('#sheet .body,#sheet #sc');if(q)q.scrollTop=0},0);
 })};
/* =============== 2. EFFECTS =============== */
const FXN={None:'🚫',Glitch:'📺',Shake:'📳',Pulse:'💓',Blur:'🌫️',Dream:'✨',Vignette:'⚫',Grain:'🎞️',VHS:'📼',OldFilm:'🎬',Neon:'💡',Mirror:'🪞',Pixel:'🟦',Snow:'❄️',Hearts:'💖',Sparkle:'⭐',Rain:'🌧️'};
let fxT=null,noiseP=null,scanP=null;
const fxTmp=()=>{if(!fxT||fxT.width!==cv.width||fxT.height!==cv.height){fxT=D.createElement('canvas');fxT.width=cv.width;fxT.height=cv.height}const x=fxT.getContext('2d');x.globalCompositeOperation='source-over';x.globalAlpha=1;x.filter='none';x.clearRect(0,0,fxT.width,fxT.height);x.drawImage(cv,0,0);return fxT};
const rnd=seed=>{let a=seed|0;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}};
function vignette(a){const W=cv.width,H=cv.height,gr=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.25,W/2,H/2,Math.max(W,H)*.75);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,'+(.8*a)+')');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H)}
function grain(a,t){if(!noiseP){const n=D.createElement('canvas');n.width=n.height=128;const x=n.getContext('2d'),im=x.createImageData(128,128);for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255}x.putImageData(im,0,0);noiseP=ctx.createPattern(n,'repeat')}
 const r=rnd(Math.floor(t*24)+7);ctx.save();ctx.globalAlpha=.22*a;ctx.globalCompositeOperation='overlay';ctx.translate(r()*128,r()*128);ctx.fillStyle=noiseP;ctx.fillRect(-128,-128,cv.width+256,cv.height+256);ctx.restore()}
function scan(a){if(!scanP){const n=D.createElement('canvas');n.width=4;n.height=4;const x=n.getContext('2d');x.fillStyle='rgba(0,0,0,.55)';x.fillRect(0,0,4,1.5);scanP=ctx.createPattern(n,'repeat')}ctx.save();ctx.globalAlpha=.28*a+.05;ctx.fillStyle=scanP;ctx.fillRect(0,0,cv.width,cv.height);ctx.restore()}
function particles(kind,a,t){const W=cv.width,H=cv.height,N=Math.round(22+a*50);ctx.save();
 for(let i=0;i<N;i++){const r=rnd(i*977+13),x0=r(),y0=r(),sp=.06+r()*.14,sz=r(),ph=r()*6.28;
  if(kind==='Snow'){const y=((y0+t*sp)%1)*H,x=(x0+Math.sin(t*.8+ph)*.03)*W,rr=(2+sz*5)*W/720;ctx.globalAlpha=.55+sz*.4;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,rr,0,6.283);ctx.fill()}
  else if(kind==='Rain'){const y=((y0+t*(sp*5+.6))%1)*H,x=((x0+t*.05)%1)*W,l=(24+sz*34)*H/1280;ctx.globalAlpha=.4;ctx.strokeStyle='#cfe8ff';ctx.lineWidth=2*W/720;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-l*.18,y+l);ctx.stroke()}
  else if(kind==='Hearts'){const y=(1-((y0+t*sp*.7)%1))*H,x=(x0+Math.sin(t*1.1+ph)*.05)*W,fs=(22+sz*34)*W/720;ctx.globalAlpha=.85;ctx.font=fs+'px sans-serif';ctx.textAlign='center';ctx.fillText('❤️',x,y)}
  else{const y=y0*H,x=x0*W,tw=.5+.5*Math.sin(t*(2+sz*3)+ph),fs=(18+sz*30)*W/720;ctx.globalAlpha=tw;ctx.font=fs+'px sans-serif';ctx.textAlign='center';ctx.fillText(i%3?'✨':'⭐',x,y)}}
 ctx.restore()}
function applyFx(e,t){
 const k=e.k,a=cl(e.a==null?.6:e.a,.05,1),W=cv.width,H=cv.height;if(!k||k==='None')return;
 ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
 if(k==='Glitch'){const T0=fxTmp(),r=rnd(Math.floor(t*10)+3),on=r()>.35;
  if(on){const n=Math.round(3+a*7);for(let i=0;i<n;i++){const y=r()*H,h=H*(.015+r()*.05*a+.01),dx=(r()-.5)*W*.14*a;ctx.drawImage(T0,0,y,W,h,dx,y,W,h)}
   ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.28*a;ctx.filter='hue-rotate(90deg)';ctx.drawImage(T0,W*.012*a,0);ctx.filter='hue-rotate(-90deg)';ctx.drawImage(T0,-W*.012*a,0)}}
 else if(k==='Shake'){const T0=fxTmp(),dx=(Math.sin(t*47)+Math.sin(t*31))*W*.007*a,dy=(Math.cos(t*41)+Math.sin(t*27))*H*.005*a;ctx.drawImage(T0,-W*.03+dx,-H*.03+dy,W*1.06,H*1.06)}
 else if(k==='Pulse'){const T0=fxTmp(),s=1+.07*a*(.5+.5*Math.sin(t*6));ctx.drawImage(T0,W/2-W*s/2,H/2-H*s/2,W*s,H*s)}
 else if(k==='Blur'){const T0=fxTmp();ctx.filter='blur('+(a*9)+'px)';ctx.drawImage(T0,-8,-8,W+16,H+16)}
 else if(k==='Dream'){const T0=fxTmp();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.6*a;ctx.filter='blur('+(6+a*8)+'px) brightness(1.15) saturate(1.2)';ctx.drawImage(T0,0,0)}
 else if(k==='Vignette'){vignette(a)}
 else if(k==='Grain'){grain(a*1.4,t)}
 else if(k==='VHS'){const T0=fxTmp(),o=W*.008*(.5+a);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.32;ctx.filter='hue-rotate(80deg)';ctx.drawImage(T0,o,0);ctx.filter='hue-rotate(-80deg)';ctx.drawImage(T0,-o,0);ctx.filter='none';ctx.globalCompositeOperation='source-over';
  const by=((t*.23)%1)*H,r=rnd(Math.floor(t*8));ctx.globalAlpha=1;ctx.drawImage(T0,0,by,W,H*.03,(r()-.5)*W*.05*a,by,W,H*.03);scan(a);grain(a*.6,t)}
 else if(k==='OldFilm'){const T0=fxTmp();ctx.filter='sepia('+(.5+a*.5)+') contrast(1.1) brightness(.95)';ctx.drawImage(T0,0,0);ctx.filter='none';vignette(a*.9);grain(a*1.2,t);
  const r=rnd(Math.floor(t*12)+11);if(r()>.5){ctx.globalAlpha=.35;ctx.fillStyle='#fff';ctx.fillRect(r()*W,0,1.5*W/720,H)}}
 else if(k==='Neon'){const T0=fxTmp();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.55*a+.1;ctx.filter='blur(9px) saturate(2.2) brightness(1.25)';ctx.drawImage(T0,0,0)}
 else if(k==='Mirror'){const T0=fxTmp();ctx.translate(W,0);ctx.scale(-1,1);ctx.drawImage(T0,0,0,W/2,H,0,0,W/2,H)}
 else if(k==='Pixel'){const T0=fxTmp(),f=6+a*26,sw=Math.max(8,Math.round(W/f)),sh=Math.max(8,Math.round(H/f));const s=D.createElement('canvas');s.width=sw;s.height=sh;s.getContext('2d').drawImage(T0,0,0,sw,sh);ctx.imageSmoothingEnabled=false;ctx.drawImage(s,0,0,W,H)}
 else if(k==='Snow'||k==='Hearts'||k==='Sparkle'||k==='Rain'){particles(k,a,t)}
 ctx.restore()}
window.applyFx=applyFx;
T.fxs=()=>{
 if(!C.length)return say('សូមបន្ថែមវីដេអូជាមុន');
 const i=cur;let all=false;
 open('✨ Effects · អេហ្វិច',c=>{
  const tg=()=>all?C:[C[i]],now=()=>C[i].efx||{k:'None',a:.6};
  const prev=()=>{try{seekG(st[i]);pvEnd=st[i]+Math.min(dur[i],2.6);play()}catch(_){}};
  const tabs=D.createElement('div');tabs.className='chips';
  [['one',L2('ក្លីបនេះ','This clip')],['all',L2('ក្លីបទាំងអស់','All clips')]].forEach(([k,n])=>{const b=D.createElement('button');b.className='chip'+((k==='all')===all?' sel':'');b.textContent=n;b.onclick=()=>{all=k==='all';tabs.querySelectorAll('.chip').forEach(x=>x.classList.remove('sel'));b.classList.add('sel')};tabs.appendChild(b)});
  const gr=D.createElement('div');gr.className='grid';
  const paint=()=>{gr.innerHTML='';Object.keys(FXN).forEach(k=>{const t=D.createElement('div');t.className='tile'+(now().k===k?' sel':'');t.innerHTML='<div>'+FXN[k]+'</div>'+k;
   t.onclick=()=>{snp();const a=now().a;tg().forEach(x=>{x.efx={k,a}});paint();if(k!=='None')prev()};gr.appendChild(t)})};
  const [l,r]=rng('Intensity',.1,1,.05,now().a,v=>{tg().forEach(x=>{x.efx={k:(x.efx&&x.efx.k)||'None',a:v}})});
  c.append(tabs,l,r,gr);paint()})};
/* hook: apply the effect right after the clip frame is drawn */
{const src=loop.toString();
 if(src.indexOf('applyFx')<0)console.warn('KAISER: effect hook missing')}
/* =============== 3. toolbar wiring =============== */
if(!MN.main.some(x=>x[2]==='voice')){const i=MN.main.findIndex(x=>x[2]==='vol');MN.main.splice(i<0?MN.main.length:i+1,0,['mic','Voice','voice'])}
if(!MN.main.some(x=>x[2]==='fxs')){const i=MN.main.findIndex(x=>x[2]==='fil');MN.main.splice(i<0?MN.main.length:i+1,0,['spark','Effects','fxs'])}
if(MNK==='main')menu('main');
window.KAISER_V20={VOICES,FXN,voiceProcess};
})();
