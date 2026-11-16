(function(){
'use strict';
if(window.__KAISER_V2626__)return;window.__KAISER_V2626__=true;
const KA=window.KAISORAI;if(!KA||typeof KA.analyzeVideo!=='function'){console.warn('KAISER V6.3.26: KAISORAI missing');return}
const D=document,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const isKm=()=>localStorage.getItem('kaiser-editor-language')!=='en';
const tr=(km,en)=>isKm()?km:en;
const say=m=>{try{toast(m)}catch(_){}};
const clock=n=>{n=Math.max(0,Number(n)||0);return String(Math.floor(n/60)).padStart(2,'0')+':'+String(Math.floor(n%60)).padStart(2,'0')};
const E=(t,c,x)=>{const e=D.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const oldHighlights=T.ai;                       /* classic highlight-reel panel stays available */
/* ---------- shared analysis cache: Engine measures once, Smart reuses ---------- */
const cache=new Map(),baseAnalyze=KA.analyzeVideo;
const keyOf=v=>(v.currentSrc||v.src||'')+'|'+Math.round((v.duration||0)*100);
function pruneCache(){
 const now=Date.now();
 for(const [k,v] of cache)if(v.ts&&now-v.ts>30*60*1000)cache.delete(k);
 while(cache.size>8){const first=cache.keys().next().value;if(first==null)break;cache.delete(first)}
}
function blend(res){(res.scenes||[]).forEach(s=>{if(s.editorScore!=null&&s.rawScore==null){s.rawScore=s.score;s.score=s.editorScore}})}
let curCtl=null;
KA.analyzeVideo=function(video,opt,cb0){
 const k=keyOf(video);opt=Object.assign({},opt||{});pruneCache();if(opt.force)cache.delete(k);
 if(!opt.signal){curCtl=new AbortController();opt.signal=curCtl.signal}
 const t0=Date.now(),cb=cb0&&((p,m)=>{let eta='';if(p>6&&p<99){const left=Math.round((Date.now()-t0)/1000*(100-p)/p);eta=' · ~'+left+'s'}cb0(p,String(m||'')+eta)});
 const hit=cache.get(k);
 if(hit&&hit.res){cb&&cb(100,tr('ប្រើទិន្នន័យ AI Engine ដែលមានស្រាប់ (មិនស្កេនម្តងទៀត)','Using data AI Engine already measured (no rescan)'));return Promise.resolve(hit.res)}
 if(hit&&hit.pending)return hit.pending;
 const p=Promise.resolve(baseAnalyze.call(KA,video,opt,cb)).then(res=>{blend(res);cache.set(k,{res,ts:Date.now()});pruneCache();return res}).catch(e=>{cache.delete(k);throw e});
 cache.set(k,{pending:p,ts:Date.now()});return p};
const hasData=url=>{pruneCache();for(const [k,v] of cache)if(v.res&&k.startsWith(url+'|'))return v.res;return null};
window.KAISER_AI={cache,hasData,version:'6.3.33',cancel(){try{curCtl&&curCtl.abort()}catch(_){}}};
/* ---------- helpers ---------- */
const srcOf=c=>c.el.currentSrc||c.el.src;
async function probeVideo(url){
 const probe=await loadV(url);probe.muted=true;
 if(probe.readyState<2)await new Promise((res,rej)=>{probe.addEventListener('loadeddata',res,{once:true});probe.addEventListener('error',()=>rej(new Error('Cannot read video frames')),{once:true})});
 return probe}
function clipScenes(res,source){
 const a=Number(source.in)||0,b=Number.isFinite(Number(source.out))?Number(source.out):res.duration;
 return (res.scenes||[]).filter(s=>s.end>a&&s.start<b).map(s=>({...s,start:Math.max(s.start,a),end:Math.min(s.end,b)})).filter(s=>s.end-s.start>=.6)}
function roleCard(kind,step){
 const c=E('div','role-card '+kind);
 if(kind==='engine'){c.appendChild(E('b',null,'🔍 AI Engine · '+tr('អ្នកត្រួតពិនិត្យគុណភាព','Quality Inspector')));
  c.appendChild(E('span',null,tr('វាស់ពន្លឺ, Contrast, ភាពច្បាស់ និងចលនាក្នុងទូរសព្ទ ហើយអាចកែពន្លឺ/Contrast ឱ្យដោយស្វ័យប្រវត្តិ។ វា «មិនកាត់» ទេ ការសម្រេចកាត់ជាតួនាទីរបស់ AI Smart។','Measures exposure, contrast, sharpness and motion on your phone and can auto-fix brightness/contrast. It never cuts — deciding cuts is AI Smart’s job.')))}
 else{c.appendChild(E('b',null,'✂ AI Smart · '+tr('អ្នកជួយសម្រេចកាត់ត','Editing Assistant')));
  c.appendChild(E('span',null,tr('សម្រេចថាត្រូវលុប/រក្សាឈុតណា និងដាក់ Hook ណា ដោយប្រើទិន្នន័យគុណភាពពី AI Engine ហើយអ្នកចុចអនុវត្តបានភ្លាម (ត្រឡប់ក្រោយបាន)។','Decides what to remove/keep and which moment is the Hook, using quality data from AI Engine. You apply with one tap (undo supported).')))}
 const s=E('div','role-steps');
 [['① AI Engine '+tr('វាស់','measures'),1],['② AI Smart '+tr('សម្រេច','decides'),2],['③ '+tr('អ្នកបញ្ជាក់','You confirm'),3]].forEach(([t,n],i)=>{if(i)s.appendChild(E('i',null,'›'));s.appendChild(E('span',n===step?'on':'',t))});
 c.appendChild(s);return c}
/* ---------- timeline edit helpers (ripple-aware, undoable) ---------- */
function snapAll(){snp();try{hist[hist.length-1].V=voiceClips.map(v=>v.start)}catch(_){}}
const _undo=T.undo;
T.undo=function(){const top=hist[hist.length-1],V=top&&top.V;_undo.apply(this,arguments);if(V)voiceClips.forEach((v,i)=>{if(V[i]!=null)v.start=V[i]})};
function ripple(from,delta,to){
 const f=x=>x>=from?x+delta:(to!=null&&x>to?to:x);
 if(delta<0){const lo=from+delta;OV.forEach(o=>{o.start=o.start>=from?o.start+delta:(o.start>lo?lo:o.start)});TX.forEach(t=>{t.st=t.st>=from?t.st+delta:(t.st>lo?lo:t.st)});voiceClips.forEach(v=>{v.start=v.start>=from?v.start+delta:(v.start>lo?lo:v.start)})}
 else{OV.forEach(o=>{if(o.start>=from)o.start+=delta});TX.forEach(t=>{if(t.st>=from)t.st+=delta});voiceClips.forEach(v=>{if(v.start>=from)v.start+=delta})}}
function findPiece(url,a,b){return C.findIndex(c=>srcOf(c)===url&&c.in<=a+.06&&c.out>=b-.06)}
function removeRange(url,a,b){
 const i=findPiece(url,a,b);if(i<0)return 'missing';const c=C[i];a=Math.max(a,c.in);b=Math.min(b,c.out);
 if(b-a<.3)return 'short';
 const left=a-c.in,right=c.out-b;if(left<.25&&right<.25)return 'whole';
 snapAll();
 const spd=c.spd||1,tA=(a-c.in)/spd,tB=(b-c.in)/spd,kf=c.kf||[],pieces=[];
 if(left>=.25){const Lp=cp(c);Lp.out=a;Lp.kf=kf.filter(q=>q.t<tA).map(q=>({...q}));pieces.push(Lp)}
 if(right>=.25){const Rp=cp(c);Rp.in=b;Rp.kf=kf.filter(q=>q.t>=tB).map(q=>({...q,t:q.t-tB}));pieces.push(Rp)}
 pieces.forEach((p,k)=>{p.tr=k===pieces.length-1?{...(c.tr||{t:'None',d:.6})}:{t:'None',d:.6}});
 const tl1=st[i]+tA,tl2=st[i]+tB;
 C.splice(i,1,...pieces);ripple(tl2,-(tl2-tl1),tl1);
 recalc();build();seekG(clamp(tl1,0,Math.max(0,total-.01)));return 'ok'}
function hookToStart(url,a,b){
 const i=findPiece(url,a,b);if(i<0)return 'missing';const c=C[i];
 a=Math.max(a,c.in);b=Math.min(b,c.out);if(b-a<.5)return 'short';
 snapAll();const h=cp(c);h.in=a;h.out=b;h.kf=[];h.tr={t:'None',d:.6};h.pr={...P0};
 const d=(b-a)/(c.spd||1);C.splice(0,0,h);ripple(0,d);recalc();build();seekG(0);return 'ok'}
/* ================= AI ENGINE (Inspector) ================= */
T.aiEngine=function(){
 if(!C.length)return say(tr('សូម Import វីដេអូមុន','Import a video first'));
 const index=cur,source=C[index],url=srcOf(source);
 open('✧ AI ENGINE · '+tr('អ្នកត្រួតពិនិត្យ','Inspector'),box=>{
  box.classList.add('kaiser-engine-panel');box.appendChild(roleCard('engine',1));
  const stats=E('div','kaiser-engine-stats');
  const stat=l=>{const d=E('div','kaiser-engine-stat'),v=E('b',null,'—');d.append(v,E('small',null,l));stats.appendChild(d);return v};
  const sceneStat=stat(tr('ចំនួន Scene','Scenes')),qualityStat=stat(tr('គុណភាពមធ្យម','Avg. quality')),flagStat=stat(tr('ត្រូវពិនិត្យ','Review flags'));box.appendChild(stats);
  const prog=E('div','kaiser-engine-progress'),fill=E('i');prog.appendChild(fill);box.appendChild(prog);
  const status=E('div','kaiser-engine-status',tr('ត្រៀមស្កេនវីដេអូ','Ready to scan video'));box.appendChild(status);
  const fwrap=E('div','chips');box.appendChild(fwrap);
  const results=E('div');results.style.cssText='display:flex;flex-direction:column;gap:7px';box.appendChild(results);
  const fixInfo=E('div','kaiser-engine-status');box.appendChild(fixInfo);
  const actions=E('div','kaiser-engine-actions');
  const run=E('button','primary','✧ '+tr('វិភាគកម្រិតខ្ពស់','Deep Analyze')),fix=E('button',null,'✨ '+tr('កែពន្លឺ/Contrast ស្វ័យប្រវត្តិ','Auto Enhance')),go=E('button',null,'→ AI Smart');
  fix.disabled=true;const stopE=E('button',null,'■ '+tr('បោះបង់','Cancel'));stopE.style.display='none';stopE.onclick=()=>window.KAISER_AI.cancel();actions.append(run,stopE,fix,go);box.appendChild(actions);
  let scenes=[],filter='all',res=null;
  const preview=t=>{const off=clamp((t-(source.in||0))/(source.spd||1),0,Math.max(0,dur[index]||0));seekG(st[index]+off);closeSheet();say(tr('បានទៅកាន់ Scene ដែលបានជ្រើស','Moved to selected scene'))};
  const FL=[['all',tr('ទាំងអស់','All')],['flag','⚠ '+tr('ត្រូវពិនិត្យ','Flagged')],['best','⭐ '+tr('ល្អបំផុត','Best')]];
  const draw=()=>{
   fwrap.innerHTML='';FL.forEach(([k,n])=>{const b=E('button','chip'+(filter===k?' sel':''),n);b.onclick=()=>{filter=k;draw()};fwrap.appendChild(b)});
   results.innerHTML='';let list=[...scenes].sort((a,b)=>(b.editorScore??b.rawScore??b.score)-(a.editorScore??a.rawScore??a.score));
   if(filter==='flag')list=list.filter(s=>s.qualityMetrics&&s.qualityMetrics.flags.length);
   if(filter==='best')list=list.slice(0,5);
   if(!list.length){results.appendChild(E('div','kaiser-engine-status',scenes.length?tr('គ្មាន Scene ក្នុងប្រភេទនេះ','No scenes in this filter'):''));return}
   list.slice(0,24).forEach((s,i)=>{
    const row=E('button','kaiser-engine-scene');row.type='button';row.onclick=()=>preview(s.start);
    const img=E('img');img.alt='Scene';img.src=s.thumbnail||'';
    const info=E('span','engine-scene-info'),head=E('b',null,'SCENE '+String(scenes.indexOf(s)+1).padStart(2,'0')+' · '+s.start.toFixed(1)+'s – '+s.end.toFixed(1)+'s');
    const m=s.qualityMetrics,det=E('small',null,m?tr('គុណភាព ','Quality ')+s.quality+'/100 · '+tr('ពន្លឺ ','Light ')+Math.round(m.brightness)+'/255 · '+tr('ចលនា ','Motion ')+s.motion+'/100'+(m.flags.length?' · '+m.flags.join(' · '):' · '+tr('គ្មានសញ្ញាបញ្ហាបច្ចេកទេសធំ','No major technical flags')):tr('ពិន្ទុ ','Score ')+(s.rawScore??s.score)+'/100');
    info.append(head,det);row.append(img,info,E('span','kaiser-engine-score',(s.editorScore??s.score)+'/100'));results.appendChild(row)})};
  const show=r=>{res=r;scenes=clipScenes(r,source);
   sceneStat.textContent=String(scenes.length);qualityStat.textContent=r.averageQuality==null?'—':r.averageQuality+'/100';
   flagStat.textContent=String(scenes.filter(s=>s.qualityMetrics&&s.qualityMetrics.flags.length).length);fix.disabled=!scenes.some(s=>s.qualityMetrics);draw()};
  const cached=hasData(url);if(cached){show(cached);status.textContent=tr('✓ មានទិន្នន័យស្កេនរួចហើយ (AI Smart ប្រើបានភ្លាម) · ចុច «វិភាគ» ដើម្បីស្កេនឡើងវិញ','✓ Scan data already available (AI Smart can use it now) · tap Analyze to rescan');fill.style.width='100%'}
  run.onclick=async()=>{
   run.disabled=fix.disabled=go.disabled=true;stopE.style.display='';results.innerHTML='';fill.style.width='0%';fixInfo.textContent='';let probe;
   try{status.textContent=tr('កំពុងរៀបចំវីដេអូ...','Preparing video...');probe=await probeVideo(url);
    const r=await KA.analyzeVideo(probe,{sensitivity:'medium',sampleEvery:1.2,maxSamples:240,force:true},(p,msg)=>{fill.style.width=p+'%';status.textContent=msg});
    show(r);status.textContent=tr('ស្កេនរួចរាល់ · ចុចលើ Scene ដើម្បីពិនិត្យ ឬចុច → AI Smart ដើម្បីសម្រេចកាត់។ ពិន្ទុជាការវាយតម្លៃបច្ចេកទេស មិនមែនការយល់អត្ថន័យទេ។','Scan complete · Tap a scene to review, or → AI Smart to decide cuts. Scores are technical estimates, not story understanding.');fill.style.width='100%'}
   catch(err){status.textContent=err&&err.name==='AbortError'?tr('បានបោះបង់ការវិភាគ','Analysis cancelled'):tr('វិភាគបរាជ័យ៖ ','Analysis failed: ')+(err.message||err);console.error('KAISER AI Engine:',err)}
   finally{stopE.style.display='none';if(probe){probe.pause();probe.remove()}run.disabled=go.disabled=false;fix.disabled=!scenes.some(s=>s.qualityMetrics)}};
  fix.onclick=()=>{
   const ms=scenes.filter(s=>s.qualityMetrics);if(!ms.length)return;
   let w=0,b=0,c=0;ms.forEach(s=>{const l=s.end-s.start;w+=l;b+=s.qualityMetrics.brightness*l;c+=s.qualityMetrics.contrast*l});b/=w;c/=w;
   const bAdj=Math.round(clamp(100+(126-b)/126*55,75,135)),cAdj=Math.round(c<28?clamp(100+(32-c)*2.2,100,135):c>75?92:100),sAdj=c<20?106:100;
   const now=source.adj||{brightness:100,contrast:100,saturation:100,exposure:100};
   if(Math.abs(bAdj-100)<4&&cAdj===100&&sAdj===100)return fixInfo.textContent=tr('✓ ពន្លឺ និង Contrast ល្អរួចហើយ មិនចាំបាច់កែទេ','✓ Exposure and contrast already look good — no fix needed');
   snp();source.adj={...now,brightness:bAdj,contrast:cAdj,saturation:sAdj,exposure:100};try{seekG(g)}catch(_){}
   fixInfo.textContent=tr('✓ បានកែ Clip នេះ៖ ពន្លឺ ','✓ Applied to this clip: Brightness ')+bAdj+'% · Contrast '+cAdj+'% · '+tr('ពណ៌ ','Saturation ')+sAdj+'% '+tr('(ចុច ត្រឡប់ក្រោយ ដើម្បីដកចេញ)','(use Undo to revert)');
   say('✨ Auto Enhance')};
  go.onclick=()=>{closeSheet();T.ai()};
 })};
/* ================= AI SMART (Editor) ================= */
function planLocal(scenes,level){
 const P={gentle:{thr:30,frac:.15},balanced:{thr:38,frac:.25},strict:{thr:48,frac:.4}}[level]||{thr:38,frac:.25};
 const n=scenes.length,asc=[...scenes].sort((a,b)=>a.score-b.score),maxN=Math.min(Math.max(0,n-1),Math.max(1,Math.ceil(n*P.frac)));
 const bad=s=>(s.score<P.thr||(s.quality!=null&&s.quality<28));
 const reason=(s,k)=>{const m=s.qualityMetrics,p=[];
  if(k==='remove'){if(m&&m.flags.length)p.push(m.flags.join(' · '));if(s.quality!=null&&s.quality<45)p.push(tr('គុណភាព ','Quality ')+s.quality);if(s.motion<8)p.push(tr('ចលនាតិច','Low motion'));if(!p.length)p.push(tr('ពិន្ទុសរុបទាប ','Low overall score ')+s.score);return p.join(' · ')+' — '+tr('សូមពិនិត្យមុនលុប','review before removing')}
  return tr('ពិន្ទុ ','Score ')+s.score+(s.quality!=null?' · '+tr('គុណភាព ','Quality ')+s.quality:'')+' · '+tr('ចលនា ','Motion ')+s.motion};
 const remove=asc.filter(s=>bad(s)&&s.end-s.start>=1).slice(0,maxN).sort((a,b)=>a.start-b.start).map(s=>({start:s.start,end:s.end,reason:reason(s,'remove')}));
 const rm=new Set(remove.map(x=>x.start));
 const keep=[...scenes].filter(s=>!rm.has(s.start)).sort((a,b)=>b.score-a.score).slice(0,Math.max(1,Math.ceil(n*.5))).sort((a,b)=>a.start-b.start).map(s=>({start:s.start,end:s.end,reason:reason(s,'keep')}));
 const hs=[...scenes].filter(s=>!rm.has(s.start)&&s.end-s.start>=1.5).sort((a,b)=>b.score-a.score)[0]||[...scenes].sort((a,b)=>b.score-a.score)[0];
 const hook=hs?{start:hs.start,end:hs.start+Math.min(8,hs.end-hs.start),reason:tr('ឈុតពិន្ទុខ្ពស់បំផុត ','Highest-scoring scene ')+hs.score+' · '+tr('ចលនា ','motion ')+hs.motion+(hs.quality!=null?' · '+tr('គុណភាព ','quality ')+hs.quality:'')}:null;
 return {remove,keep,hook,mode:'LOCAL · ENGINE DATA'}}
function rangeList(input,scenes,duration){
 if(!Array.isArray(input)||!Array.isArray(scenes))return [];
 const out=[];
 input.slice(0,120).forEach(x=>{
  if(!x||typeof x!=='object')return;
  const rawA=Number(x.start),rawB=Number(x.end);
  if(!Number.isFinite(rawA)||!Number.isFinite(rawB)||rawB<=rawA)return;
  const a=clamp(rawA,0,duration),b=clamp(rawB,0,duration);if(b-a<.5)return;
  /* Never let a Cloud suggestion escape the actual analyzed source scenes. */
  scenes.forEach(scene=>{
   const start=Math.max(a,scene.start),end=Math.min(b,scene.end);
   if(end-start>=.5)out.push({start,end,reason:typeof x.reason==='string'?x.reason.slice(0,220):''});
  });
 });
 out.sort((a,b)=>a.start-b.start);
 const safe=[];out.forEach(x=>{
  const last=safe[safe.length-1];
  if(last&&x.start<last.end-.05){if(x.end>last.end)last.end=x.end;if(x.reason&&!last.reason)last.reason=x.reason}
  else safe.push({...x});
 });
 return safe;
}
function validateCloudEndpoint(value){
 let u;try{u=new URL(value)}catch(_){throw new Error(tr('Endpoint មិនមែនជា URL ត្រឹមត្រូវទេ','Cloud endpoint is not a valid URL'))}
 const local=['localhost','127.0.0.1','::1'].includes(u.hostname);
 if((u.protocol!=='https:'&&!(u.protocol==='http:'&&local))||u.username||u.password)
  throw new Error(tr('សុវត្ថិភាព៖ ប្រើ HTTPS (ឬ HTTP សម្រាប់ localhost) និងកុំដាក់ username/password ក្នុង URL','Security: use HTTPS (or HTTP on localhost) and do not embed credentials in the URL'));
 return u.href;
}
async function cloudPlan(endpoint,res,scenes,instruction,info){
 const safeEndpoint=validateCloudEndpoint(endpoint),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
 try{
  /* Uniformly sample at most 80 scenes to keep mobile uploads manageable. */
  const limit=80,step=Math.max(1,Math.ceil(scenes.length/limit)),sampled=scenes.filter((_,i)=>i%step===0).slice(0,limit);
  const r=await fetch(safeEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({task:'analyze_edit_plan',language:isKm()?'km':'en',instruction:String(instruction||'').slice(0,2000),video:info,
   scenes:sampled.map(x=>({id:x.id,start:x.start,end:x.end,score:x.score,motion:x.motion,quality:x.quality??null,flags:(x.qualityMetrics&&x.qualityMetrics.flags)||[],reason:x.reason,thumbnail_jpeg_data_url:x.thumbnail}))})});
  if(!r.ok)throw new Error('Cloud AI HTTP '+r.status);
  const d=await r.json();if(!d||(!Array.isArray(d.remove)&&!Array.isArray(d.keep)&&!d.hook))throw new Error(tr('Cloud response ត្រូវមាន remove, keep ឬ hook','Cloud response must contain remove, keep, or hook'));
  const remove=rangeList(d.remove,scenes,res.duration),keep=rangeList(d.keep,scenes,res.duration),hook=d.hook?rangeList([d.hook],scenes,res.duration)[0]||null:null;
  return {remove,keep,hook,mode:'HYBRID CLOUD'};
 }catch(err){if(err&&err.name==='AbortError')throw new Error(tr('Cloud AI អស់ពេលរង់ចាំ 45 វិនាទី','Cloud AI timed out after 45 seconds'));throw err}
 finally{clearTimeout(timer)}
}
T.ai=function(){
 if(!C.length)return say(tr('សូម Import វីដេអូមុន','Import a video first'));
 const source=C[cur],url=srcOf(source);
 open('✦ AI SMART · '+tr('អ្នកជួយកាត់ត','Editing Assistant'),box=>{
  box.classList.add('ai-box');box.appendChild(roleCard('smart',2));buildAutoEdit(box,source,url);
  const ds=E('div','ai-datastat');box.appendChild(ds);
  const paintData=()=>{const d=hasData(url);ds.className='ai-datastat'+(d?'':' warn');ds.innerHTML='';
   if(d){const sc=clipScenes(d,source);ds.append(E('span',null,'🔍 AI Engine:'),E('b',null,tr('✓ មានទិន្នន័យ ','✓ data ready · ')+sc.length+' scenes'+(d.averageQuality!=null?' · Q '+d.averageQuality:'')))}
   else ds.append(E('span',null,'🔍 AI Engine:'),E('b',null,tr('មិនទាន់ស្កេន — AI Smart នឹងស្កេនឱ្យដោយស្វ័យប្រវត្តិ','not scanned yet — AI Smart will scan automatically')))};paintData();
  box.appendChild(E('label',null,tr('សេចក្ដីណែនាំទៅកាន់ AI (សម្រាប់ Cloud)','Instructions for AI (used by Cloud)')));
  const prompt=E('textarea');prompt.value=tr('សូមកាត់ចំណុចមិនល្អចេញ ទុកចំណុចល្អ ហើយណែនាំឈុតដែលគួរដាក់នៅក្បាលវីដេអូ។ សូមបង្ហាញពេលវេលាច្បាស់ៗ។','Remove weak or unnecessary moments, keep the best parts, and recommend the strongest opening hook. Give exact timestamps.');box.appendChild(prompt);
  box.appendChild(E('label',null,tr('ភាពម៉ឺងម៉ាត់នៃការកាត់','Cut strictness')));
  let level='balanced';const lv=E('div','chips');
  [['gentle',tr('ស្រាល','Gentle')],['balanced',tr('មធ្យម','Balanced')],['strict',tr('ម៉ឺងម៉ាត់','Strict')]].forEach(([k,n])=>{const b=E('button','chip'+(k===level?' sel':''),n);b.onclick=()=>{level=k;lv.querySelectorAll('.chip').forEach(x=>x.classList.remove('sel'));b.classList.add('sel')};lv.appendChild(b)});box.appendChild(lv);
  box.appendChild(E('label',null,tr('Cloud AI Endpoint (ជាជម្រើស)','Cloud AI endpoint (optional)')));
  const endpoint=E('input');endpoint.type='url';endpoint.placeholder='https://your-server.example/analyze-edit-plan';endpoint.value=localStorage.getItem('kaiser-hybrid-endpoint')||'';box.appendChild(endpoint);
  box.appendChild(E('div','ai-note',tr('Local AI ប្រើទិន្នន័យគុណភាពពី AI Engine។ បើបញ្ចូល Endpoint នោះ Cloud AI អាចវិភាគអត្ថន័យបន្ថែម ដោយផ្ញើតែរូបភាពគំរូ មិនផ្ញើវីដេអូពេញទេ។','Local AI uses quality data from AI Engine. With an endpoint, Cloud AI can add semantic analysis; only sampled thumbnails are sent, never the full video.')));
  const prog=E('div','ai-progress'),fill=E('i');prog.appendChild(fill);box.appendChild(prog);
  const status=E('div','ai-note',tr('ត្រៀមវិភាគ','Ready to analyze'));box.appendChild(status);
  const sum=E('div','ai-sum');sum.style.display='none';box.appendChild(sum);
  const results=E('div','ai-results');box.appendChild(results);
  const run=E('button','ai-primary','✦ '+tr('វិភាគ និងផ្តល់ផែនការ','Analyze & build plan'));box.appendChild(run);const stopS=E('button','ai-secondary','■ '+tr('បោះបង់','Cancel'));stopS.style.display='none';stopS.onclick=()=>window.KAISER_AI.cancel();box.appendChild(stopS);
  const sec=E('div','ai-actions');const toEng=E('button','ai-secondary','🔍 '+tr('បើក AI Engine','Open AI Engine')),classic=E('button','ai-secondary','🎞 '+tr('Highlight Reel (បុរាណ)','Highlight Reel (classic)'));
  sec.append(toEng,classic);box.appendChild(sec);toEng.onclick=()=>{closeSheet();T.aiEngine()};classic.onclick=()=>{closeSheet();if(typeof oldHighlights==='function')oldHighlights()};
  box.appendChild(E('div','ai-note',tr('ចំណាំ៖ ផែនការជាការណែនាំបឋម មិនមែនការយល់ដឹងអំពីសាច់រឿងទេ។ ចុច ▶ ដើម្បីមើលមុន ហើយអ្នកអាចចុច ត្រឡប់ក្រោយ បន្ទាប់ពីអនុវត្ត។','Note: the plan is a first-pass suggestion, not story understanding. Tap ▶ to preview first; Undo works after applying.')));
  const addRow=(host,x,kind)=>{
   const row=E('div','ai-result');row.style.borderLeft='3px solid '+(kind==='remove'?'#e06b75':kind==='hook'?'#d8ad42':'#53c99b');
   const play=E('button','ai-mini','▶');play.onclick=()=>{const off=clamp((x.start-(source.in||0))/(source.spd||1),0,Math.max(0,dur[cur]||0));const i=findPiece(url,x.start,x.start+.1);seekG((i>=0?st[i]:st[cur])+(i>=0?(x.start-C[i].in)/(C[i].spd||1):off));closeSheet()};
   const t=E('div');t.append(E('b',null,clock(x.start)+' – '+clock(x.end)+' · '+(x.end-x.start).toFixed(1)+'s'),E('small',null,x.reason||''));
   const act=E('div','ai-act');
   if(kind==='remove'){const b=E('button','ai-mini danger','✂ '+tr('លុប','Remove'));b.onclick=()=>{const r=removeRange(url,x.start,x.end);msg(r,b,row)};act.appendChild(b);x._b=b;x._row=row}
   if(kind==='hook'){const b=E('button','ai-mini gold','⭐ '+tr('ដាក់នៅដើម','Put first'));b.onclick=()=>{const r=hookToStart(url,x.start,x.end);if(r==='ok'){b.disabled=true;row.classList.add('done');say(tr('⭐ បានដាក់ Hook នៅដើមវីដេអូ','⭐ Hook placed at the start'))}else say(errText(r))};act.appendChild(b)}
   row.append(play,t,act);host.appendChild(row);return row};
  const errText=r=>r==='missing'?tr('រកមិនឃើញឈុតនេះក្នុង Timeline ទៀតទេ (បានកែរួច?)','This range is no longer on the timeline (already edited?)'):r==='whole'?tr('ឈុតនេះគឺជា Clip ទាំងមូល សូមប្រើប៊ូតុង លុប ធម្មតា','This is the whole clip — use the normal Delete button'):tr('ចន្លោះខ្លីពេក','Range too short');
  const msg=(r,b,row)=>{if(r==='ok'){b.disabled=true;row.classList.add('done');say(tr('✂ បានលុបចន្លោះនេះ','✂ Range removed'))}else say(errText(r))};
  const group=(title,items,kind,extra)=>{
   const h=E('div','lbl',title+' ('+items.length+')');h.style.marginTop='12px';results.appendChild(h);
   if(extra)results.appendChild(extra);
   if(!items.length){results.appendChild(E('div','ai-note',tr('មិនមានការណែនាំក្នុងផ្នែកនេះទេ','No suggestions in this category')));return}
   items.forEach(x=>addRow(results,x,kind))};
  let busy=false;
  run.onclick=async()=>{
   if(busy)return;busy=true;run.disabled=true;stopS.style.display='';results.innerHTML='';sum.style.display='none';fill.style.width='0%';let probe;
   try{status.textContent=tr('កំពុងរៀបចំវីដេអូ...','Preparing video...');probe=await probeVideo(url);
    const res=await KA.analyzeVideo(probe,{sensitivity:'medium',sampleEvery:1.2,maxSamples:240},(p,m)=>{fill.style.width=p+'%';status.textContent=m});paintData();
    const scenes=clipScenes(res,source);if(!scenes.length)throw new Error(tr('រកមិនឃើញ Scene គ្រប់គ្រាន់','Not enough scenes found'));
    let plan=planLocal(scenes,level);const ep=endpoint.value.trim();
    if(ep){try{validateCloudEndpoint(ep);localStorage.setItem('kaiser-hybrid-endpoint',ep);status.textContent=tr('កំពុងវិភាគបន្ថែមដោយ Cloud AI...','Requesting semantic Cloud AI analysis...');plan=await cloudPlan(ep,res,scenes,prompt.value,{duration:probe.duration,width:probe.videoWidth,height:probe.videoHeight})}catch(err){console.warn(err);status.textContent=tr('Cloud AI មិនអាចប្រើបាន៖ ','Cloud AI unavailable: ')+err.message+tr('។ បង្ហាញលទ្ធផល Local ជំនួស។','; showing local results instead.')}}
    const rmTotal=plan.remove.reduce((n,x)=>n+(x.end-x.start),0);
    sum.innerHTML='';[[scenes.length,tr('Scene','Scenes')],[plan.remove.length+' · '+rmTotal.toFixed(1)+'s',tr('ត្រូវលុប','To remove')],[res.averageQuality==null?'—':res.averageQuality,tr('គុណភាព','Quality')]].forEach(([v,l])=>{const d=E('div');d.append(E('b',null,String(v)),E('small',null,l));sum.appendChild(d)});sum.style.display='grid';
    if(plan.hook)group(tr('ឈុតណែនាំឱ្យដាក់នៅដើម','Recommended opening hook'),[plan.hook],'hook');
    let all=null;if(plan.remove.length>1){all=E('button','ai-mini danger','✂ '+tr('លុបទាំងអស់ដែលបានណែនាំ','Remove all suggested')+' ('+plan.remove.length+')');all.style.margin='4px 0';
     all.onclick=()=>{if(!confirm(tr('លុបចន្លោះទាំង ','Remove all ')+plan.remove.length+tr(' នេះ? (អាច ត្រឡប់ក្រោយ មួយៗបាន)',' ranges? (Undo works step by step)')))return;let ok=0;[...plan.remove].sort((a,b)=>b.start-a.start).forEach(x=>{if(removeRange(url,x.start,x.end)==='ok'){ok++;if(x._b){x._b.disabled=true;x._row.classList.add('done')}}});all.disabled=true;say('✂ '+ok+'/'+plan.remove.length)}}
    group(tr('ចំណុចណែនាំឱ្យកាត់ចេញ','Suggested parts to remove'),plan.remove,'remove',all);
    group(tr('ចំណុចណែនាំឱ្យរក្សាទុក','Suggested parts to keep'),plan.keep,'keep');
    status.textContent=tr('វិភាគរួចរាល់ · ','Analysis complete · ')+plan.mode+tr(' · សូមពិនិត្យមុនអនុវត្ត',' · Review before applying');fill.style.width='100%'}
   catch(err){status.textContent=err&&err.name==='AbortError'?tr('បានបោះបង់ការវិភាគ','Analysis cancelled'):tr('វិភាគបរាជ័យ៖ ','Analysis failed: ')+(err.message||err);console.error('KAISER AI Smart:',err)}
   finally{stopS.style.display='none';if(probe){probe.pause();probe.remove()}run.disabled=false;busy=false}};
 })};

/* ================= V6.3.33 · AUTO EDIT (one tap) ================= */
function calcEnhance(scenes){
 const ms=scenes.filter(s=>s.qualityMetrics);if(!ms.length)return null;
 let w=0,b=0,c=0;ms.forEach(s=>{const l=s.end-s.start;w+=l;b+=s.qualityMetrics.brightness*l;c+=s.qualityMetrics.contrast*l});b/=w;c/=w;
 const bAdj=Math.round(clamp(100+(126-b)/126*55,75,135)),cAdj=Math.round(c<28?clamp(100+(32-c)*2.2,100,135):c>75?92:100),sAdj=c<20?106:100;
 return {bAdj,cAdj,sAdj,needed:!(Math.abs(bAdj-100)<4&&cAdj===100&&sAdj===100)}}
const adaptiveMax=()=>{const mem=navigator.deviceMemory||4,cores=navigator.hardwareConcurrency||4;return mem<=2||cores<=4?160:240};
async function runAutoEdit(source,url,o,step){
 const mark=hist.length,t0=total;let probe;
 try{
  step(tr('កំពុងស្កេនវីដេអូ...','Scanning video...'),2);
  probe=await probeVideo(url);
  const res=await KA.analyzeVideo(probe,{sensitivity:'medium',sampleEvery:1.2,maxSamples:adaptiveMax()},(p,m)=>step(m,Math.round(p*.7)));
  try{probe.pause();probe.remove()}catch(_){}probe=null;
  const scenes=clipScenes(res,source);if(scenes.length<2)throw new Error(tr('ឈុតតិចពេកសម្រាប់កាត់ស្វ័យប្រវត្តិ','Too few scenes for automatic editing'));
  step(tr('កំពុងសម្រេចចិត្ត...','Deciding what to cut...'),74);
  const plan=planLocal(scenes,o.level),hook=o.hook&&plan.hook?{...plan.hook}:null;
  let rm=plan.remove.map(x=>({...x}));
  if(hook)rm=rm.filter(x=>x.end<=hook.start+.05||x.start>=hook.end-.05);
  const inHook=s=>hook&&s.start<=hook.start+.05&&s.end>=hook.end-.05;
  const clipDur=scenes.reduce((n,s)=>n+(s.end-s.start),0);let remain=clipDur-rm.reduce((n,x)=>n+x.end-x.start,0);
  if(o.target>0){
   const used=new Set(rm.map(x=>x.start)),hd=hook?hook.end-hook.start:0;
   for(const s of [...scenes].filter(s=>!used.has(s.start)&&!inHook(s)).sort((a,b)=>a.score-b.score)){
    if(remain+hd<=o.target)break;
    if(remain-(s.end-s.start)+hd<Math.max(3,o.target*.6))continue;
    rm.push({start:s.start,end:s.end,reason:'target'});remain-=s.end-s.start}}
  step(tr('កំពុងកាត់ចេញ...','Cutting...'),80);
  let removed=0,saved=0;
  for(const x of [...rm].sort((a,b)=>b.start-a.start)){if(removeRange(url,x.start,x.end)==='ok'){removed++;saved+=x.end-x.start}}
  let hooked=false;if(hook){step(tr('កំពុងដាក់ Hook...','Placing hook...'),86);hooked=hookToStart(url,hook.start,hook.end)==='ok'}
  const kept=scenes.filter(s=>!rm.some(x=>s.start>=x.start-.05&&s.end<=x.end+.05));
  let enhanced=null;
  if(o.enhance){step(tr('កំពុងកែពន្លឺ...','Enhancing...'),90);const en=calcEnhance(kept.length?kept:scenes);
   if(en&&en.needed){snapAll();C.forEach(c=>{if(srcOf(c)===url)c.adj={...(c.adj||{brightness:100,contrast:100,saturation:100,exposure:100}),brightness:en.bAdj,contrast:en.cAdj,saturation:en.sAdj,exposure:100}});enhanced=en}}
  let trans=0;
  if(o.trans){step(tr('កំពុងដាក់ Transition...','Adding transitions...'),94);snapAll();
   for(let i=0;i<C.length-1;i++){if(srcOf(C[i])!==url||srcOf(C[i+1])!==url)continue;const jump=Math.abs((C[i].out||0)-(C[i+1].in||0))>.2||(hooked&&i===0);if(!jump)continue;
    const d=Math.min(.35,.4*Math.min(dur[i]||1,dur[i+1]||1));if(d>=.12){C[i].tr={t:'Fade',d};trans++}}}
  let punched=0;
  if(o.punch){step(tr('កំពុងដាក់ Zoom...','Adding punch-in zoom...'),97);snapAll();let k=0;
   C.forEach((c,i)=>{if(srcOf(c)!==url||(c.kf&&c.kf.length))return;const d=dur[i];if(!(d>=2))return;const a=k%2===0;c.kf=[{...P0,t:0,sc:a?1:1.07},{...P0,t:d,sc:a?1.07:1}];k++;punched++})}
  recalc();build();seekG(0);step(tr('រួចរាល់','Done'),100);
  return {mark,removed,saved,hooked,enhanced,trans,punched,from:t0,to:total}
 }finally{if(probe){try{probe.pause();probe.remove()}catch(_){}}}}
function buildAutoEdit(box,source,url){
 const card=E('div','role-card auto');
 card.appendChild(E('b',null,'⚡ Auto Edit · '+tr('កាត់តដោយស្វ័យប្រវត្តិ','One-tap automatic edit')));
 card.appendChild(E('span',null,tr('AI Engine វាស់ ហើយ AI Smart សម្រេចរួចអនុវត្តភ្លាម៖ លុបចំណុចខ្សោយ ដាក់ Hook ដើម កែពន្លឺ និង Transition។ ចុច ត្រឡប់ក្រោយ មួយប៊ូតុងដើម្បីដកចេញទាំងអស់។','AI Engine measures, AI Smart decides, then it applies: removes weak parts, puts a hook first, fixes light and adds transitions. One Undo button reverts everything.')));
 const o={target:0,level:'balanced',hook:true,enhance:true,trans:true,punch:false};
 const row=(label,items,key)=>{const w=E('div');w.style.cssText='margin-top:8px';w.appendChild(E('small',null,label));w.firstChild.style.cssText='display:block;color:#9a9aae;margin-bottom:4px';const c=E('div','chips');
  items.forEach(([v,n])=>{const b=E('button','chip'+(o[key]===v?' sel':''),n);b.onclick=()=>{o[key]=v;c.querySelectorAll('.chip').forEach(x=>x.classList.remove('sel'));b.classList.add('sel')};c.appendChild(b)});w.appendChild(c);return w};
 card.appendChild(row(tr('រយៈពេលគោលដៅ','Target length'),[[0,tr('ដើម','Original')],[15,'15s'],[30,'30s'],[60,'60s']],'target'));
 card.appendChild(row(tr('ភាពម៉ឺងម៉ាត់','Strictness'),[['gentle',tr('ស្រាល','Gentle')],['balanced',tr('មធ្យម','Balanced')],['strict',tr('ម៉ឺងម៉ាត់','Strict')]],'level'));
 const tg=E('div','chips');tg.style.marginTop='8px';
 [['hook','⭐ Hook'],['enhance','✨ '+tr('កែពន្លឺ','Enhance')],['trans','🎞 Transition'],['punch','🔍 Zoom']].forEach(([k,n])=>{const b=E('button','chip'+(o[k]?' sel':''),n);b.onclick=()=>{o[k]=!o[k];b.classList.toggle('sel',o[k])};tg.appendChild(b)});card.appendChild(tg);
 const prog=E('div','ai-progress'),fill=E('i');prog.appendChild(fill);prog.style.marginTop='10px';card.appendChild(prog);
 const status=E('div','ai-note','');card.appendChild(status);
 const btn=E('button','ai-primary','⚡ '+tr('កាត់តស្វ័យប្រវត្តិឥឡូវនេះ','Auto Edit now'));btn.style.cssText+=';background:linear-gradient(90deg,#f5b301,#ff8a00);color:#111';card.appendChild(btn);
 const stop=E('button','ai-secondary','■ '+tr('បោះបង់','Cancel'));stop.style.display='none';stop.onclick=()=>window.KAISER_AI.cancel();card.appendChild(stop);
 const undo=E('button','ai-secondary','↶ '+tr('ត្រឡប់ក្រោយ Auto Edit ទាំងអស់','Undo the whole Auto Edit'));undo.style.display='none';card.appendChild(undo);
 let busy=false,last=null;
 btn.onclick=async()=>{
  if(busy)return;busy=true;btn.disabled=true;stop.style.display='';undo.style.display='none';status.textContent='';
  try{const r=await runAutoEdit(source,url,o,(m,p)=>{fill.style.width=p+'%';status.textContent=m});last=r;
   const bits=[tr('លុប ','Removed ')+r.removed+tr(' ចំណុច · សន្សំ ',' parts · saved ')+r.saved.toFixed(1)+'s'];
   if(r.hooked)bits.push('⭐ Hook');if(r.enhanced)bits.push('✨ '+r.enhanced.bAdj+'%/'+r.enhanced.cAdj+'%');if(r.trans)bits.push('🎞 '+r.trans);if(r.punched)bits.push('🔍 '+r.punched);
   status.textContent='✓ Auto Edit · '+bits.join(' · ')+' · '+r.from.toFixed(1)+'s → '+r.to.toFixed(1)+'s';undo.style.display='';closeSheet();say('⚡ '+tr('Auto Edit រួចរាល់ — សូមមើលជាមុន ហើយចុច ត្រឡប់ក្រោយ បើមិនពេញចិត្ត','Auto Edit done — preview it, Undo if you do not like it'))}
  catch(err){status.textContent=err&&err.name==='AbortError'?tr('បានបោះបង់ការវិភាគ','Analysis cancelled'):tr('Auto Edit បរាជ័យ៖ ','Auto Edit failed: ')+(err.message||err);console.error('KAISER Auto Edit:',err)}
  finally{busy=false;btn.disabled=false;stop.style.display='none'}};
 undo.onclick=()=>{if(!last)return;let n=0;while(hist.length>last.mark&&n<40){T.undo();n++}undo.style.display='none';status.textContent=tr('បានត្រឡប់ទៅដើមវិញ','Reverted to the original');last=null};
 box.appendChild(card)}
window.KAISER_AI.removeRange=removeRange;window.KAISER_AI.hookToStart=hookToStart;window.KAISER_AI.planLocal=planLocal;window.KAISER_AI.roles={engine:'inspect-and-score',smart:'recommend-and-edit'};
})();
