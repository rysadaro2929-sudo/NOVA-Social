(function(){
 'use strict';
 if(window.__KAISER_AI_ENGINE_V6323__)return;
 window.__KAISER_AI_ENGINE_V6323__=true;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const isKm=()=>localStorage.getItem('kaiser-editor-language')!=='en';
 const tr=(km,en)=>isKm()?km:en;
 const oldAnalyze=window.KAISORAI&&window.KAISORAI.analyzeVideo;
 if(typeof oldAnalyze!=='function')return;
 function waitSeek(video,time){
  return new Promise((resolve,reject)=>{
   if(Math.abs(video.currentTime-time)<.035)return resolve();
   const done=()=>{clean();resolve()},fail=()=>{clean();reject(new Error('Video seek failed'))};
   const clean=()=>{video.removeEventListener('seeked',done);video.removeEventListener('error',fail)};
   video.addEventListener('seeked',done,{once:true});video.addEventListener('error',fail,{once:true});
   try{video.currentTime=time}catch(e){clean();reject(e)}
  });
 }
 function measureFrame(ctx,w,h){
  const d=ctx.getImageData(0,0,w,h).data;let sum=0,sum2=0,black=0,white=0,edge=0,count=0;
  const gray=new Uint8Array(w*h);
  for(let i=0,p=0;i<d.length;i+=4,p++){
   const y=.299*d[i]+.587*d[i+1]+.114*d[i+2];gray[p]=y;sum+=y;sum2+=y*y;
   if(y<18)black++;if(y>245)white++;
  }
  for(let y=1;y<h;y++)for(let x=1;x<w;x++){
   const i=y*w+x;edge+=Math.abs(gray[i]-gray[i-1])+Math.abs(gray[i]-gray[i-w]);count++;
  }
  const n=w*h,brightness=sum/n,contrast=Math.sqrt(Math.max(0,sum2/n-brightness*brightness));
  return {brightness,contrast,sharpness:count?edge/(count*2):0,blackRatio:black/n,whiteRatio:white/n};
 }
 function combineMetrics(a,b){
  const m={};for(const k of ['brightness','contrast','sharpness','blackRatio','whiteRatio'])m[k]=(a[k]+b[k])/2;
  const exposure=100-clamp(Math.abs(m.brightness-126)/126*100,0,100);
  const contrastScore=clamp((m.contrast-7)/38*100,0,100);
  const sharpnessScore=clamp((m.sharpness-1.5)/18*100,0,100);
  const clippingPenalty=clamp((m.blackRatio+m.whiteRatio)*115,0,32);
  m.qualityScore=Math.round(clamp(exposure*.34+contrastScore*.30+sharpnessScore*.36-clippingPenalty,0,100));
  const flags=[];
  if(m.brightness<34||m.blackRatio>.52)flags.push(tr('ងងឹតខ្លាំង','Very dark'));
  if(m.brightness>222||m.whiteRatio>.48)flags.push(tr('ភ្លឺខ្លាំង/បាត់ព័ត៌មាន Highlight','Overexposed highlights'));
  if(m.contrast<10)flags.push(tr('Contrast ទាប','Low contrast'));
  if(m.sharpness<2.4)flags.push(tr('រូបភាពទន់ ឬព្រិល','Soft or blurry image'));
  m.flags=flags;return m;
 }
 async function analyzeVideoAdvanced(video,options,onProgress){
  const result=await oldAnalyze(video,options,(p,msg)=>onProgress&&onProgress(Math.round(p*.72),msg));
  const scenes=result.scenes||[];if(!scenes.length)return {...result,engine:'KAISER AI ENGINE · LOCAL VISUAL SCAN'};
  const oldTime=video.currentTime,wasPaused=video.paused;
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=54;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const limit=Math.min(scenes.length,36),step=Math.max(1,Math.ceil(scenes.length/limit));
  try{
   let processed=0;
   for(let i=0;i<scenes.length;i+=step){
    if(options&&options.signal&&options.signal.aborted)throw new DOMException('Cancelled','AbortError');
    const scene=scenes[i],len=Math.max(.1,scene.end-scene.start),points=[scene.start+len*.28,scene.start+len*.72],metrics=[];
    for(const t of points){
     const at=clamp(t,0,Math.max(0,result.duration-.06));
     try{await waitSeek(video,at);ctx.drawImage(video,0,0,canvas.width,canvas.height);metrics.push(measureFrame(ctx,canvas.width,canvas.height))}catch(_){ }
    }
    if(metrics.length){
     const m=combineMetrics(metrics[0],metrics[1]||metrics[0]);
     scene.quality=m.qualityScore;scene.qualityMetrics=m;
     scene.editorScore=Math.round(scene.score*.58+m.qualityScore*.42);
     if(scene.motion<3&&len>8)m.flags.push(tr('ចលនាតិច (ពិនិត្យថាតើជាប់ Frame ឬអត់)','Low motion (check for a frozen frame)'));
    }else{scene.quality=null;scene.qualityMetrics=null;scene.editorScore=scene.score}
    processed++;
    if(onProgress)onProgress(72+Math.round(processed/Math.ceil(scenes.length/step)*27),tr('កំពុងវាស់គុណភាពឈុត ','Measuring scene quality ')+processed+'/'+Math.ceil(scenes.length/step));
    await new Promise(r=>setTimeout(r,0));
   }
  }finally{
   try{await waitSeek(video,clamp(oldTime,0,Math.max(0,result.duration-.05)))}catch(_){ }
   if(!wasPaused)video.play().catch(()=>{});
  }
  const measured=scenes.filter(s=>Number.isFinite(s.quality));
  result.averageQuality=measured.length?Math.round(measured.reduce((n,s)=>n+s.quality,0)/measured.length):null;
  result.flaggedScenes=measured.filter(s=>s.qualityMetrics.flags.length).length;
  result.engine='KAISER AI ENGINE · LOCAL VISUAL SCAN';
  if(onProgress)onProgress(100,tr('វិភាគគុណភាពរួចរាល់','Visual quality scan complete'));
  return result;
 }
 window.KAISORAI.analyzeVideo=analyzeVideoAdvanced;
 window.KAISER_AI_ENGINE={analyzeVideo:analyzeVideoAdvanced,measureFrame,version:'6.3.26'};

 function addEngineButton(){
  const tools=document.getElementById('tools');if(!tools||tools.querySelector('[data-kaiser-ai-engine]'))return;
  const btn=document.createElement('button');btn.type='button';btn.className='kaiser-ai-engine-entry';btn.dataset.kaiserAiEngine='1';
  btn.innerHTML='<span class="engine-glyph" aria-hidden="true">✧</span><span>'+tr('AI Engine','AI Engine')+'</span>';
  btn.addEventListener('click',()=>T.aiEngine());
  const first=tools.querySelector('[data-action="ai"]')||tools.firstElementChild;
  if(first&&first.nextSibling)tools.insertBefore(btn,first.nextSibling);else if(first)tools.appendChild(btn);else tools.appendChild(btn);
 }
 const previousMenu=menu;
 menu=function(k){previousMenu(k);if(k==='main')addEngineButton()};
 T.aiEngine=function(){
  if(!C.length)return toast(tr('សូម Import វីដេអូមុន','Import a video first'));
  const index=cur,source=C[index],sourceUrl=source.el.currentSrc||source.el.src;
  open('✧ KAISER AI ENGINE · DEEP SCAN',box=>{
   box.classList.add('kaiser-engine-panel');
   const intro=document.createElement('div');intro.className='kaiser-engine-intro';
   const title=document.createElement('b');title.textContent=tr('ការវិភាគវីដេអូកម្រិតខ្ពស់','Advanced video analysis');
   const desc=document.createElement('span');desc.textContent=tr('ពិនិត្យ Scene, ពន្លឺ, Contrast, ភាពច្បាស់ និងចលនា ដើម្បីផ្តល់ពិន្ទុបច្ចេកទេស និងសម្គាល់ឈុតដែលគួរពិនិត្យ។ ការវិភាគនេះដំណើរការក្នុងទូរសព្ទ មិនផ្ញើវីដេអូទៅ Server ទេ។','Checks scenes, exposure, contrast, sharpness and motion to provide technical quality scores and flag moments worth reviewing. This scan runs on-device and does not upload the video.');intro.append(title,desc);box.appendChild(intro);
   const stats=document.createElement('div');stats.className='kaiser-engine-stats';
   const stat=(label)=>{const d=document.createElement('div');d.className='kaiser-engine-stat';const v=document.createElement('b');v.textContent='—';const l=document.createElement('small');l.textContent=label;d.append(v,l);stats.appendChild(d);return v};
   const sceneStat=stat(tr('ចំនួន Scene','Scenes')),qualityStat=stat(tr('គុណភាពមធ្យម','Avg. quality')),flagStat=stat(tr('ត្រូវពិនិត្យ','Review flags'));box.appendChild(stats);
   const progress=document.createElement('div');progress.className='kaiser-engine-progress';const fill=document.createElement('i');progress.appendChild(fill);box.appendChild(progress);
   const status=document.createElement('div');status.className='kaiser-engine-status';status.textContent=tr('ត្រៀមស្កេនវីដេអូ','Ready to scan video');box.appendChild(status);
   const results=document.createElement('div');results.style.display='flex';results.style.flexDirection='column';results.style.gap='7px';box.appendChild(results);
   const actions=document.createElement('div');actions.className='kaiser-engine-actions';const run=document.createElement('button');run.className='primary';run.textContent=tr('✧ វិភាគកម្រិតខ្ពស់','✧ Deep Analyze');const cut=document.createElement('button');cut.textContent=tr('បើក AI Cut Assistant','Open AI Cut Assistant');actions.append(run,cut);box.appendChild(actions);
   let last=null;
   cut.onclick=()=>{closeSheet();T.ai()};
   function preview(time){const offset=clamp((time-(source.in||0))/(source.spd||1),0,Math.max(0,dur[index]||0));seekG(st[index]+offset);closeSheet();toast(tr('បានទៅកាន់ Scene ដែលបានជ្រើស','Moved to selected scene'))}
   run.onclick=async()=>{
    run.disabled=true;cut.disabled=true;results.innerHTML='';fill.style.width='0%';sceneStat.textContent='—';qualityStat.textContent='—';flagStat.textContent='—';let probe;
    try{
     status.textContent=tr('កំពុងរៀបចំវីដេអូ...','Preparing video...');probe=await loadV(sourceUrl);probe.muted=true;
     if(probe.readyState<2)await new Promise((resolve,reject)=>{probe.addEventListener('loadeddata',resolve,{once:true});probe.addEventListener('error',()=>reject(new Error('Cannot load video frames')),{once:true})});
     last=await analyzeVideoAdvanced(probe,{sensitivity:'medium',sampleEvery:1.1,maxSamples:240},(p,msg)=>{fill.style.width=p+'%';status.textContent=msg});
     const inPoint=Number(source.in)||0,outPoint=Number.isFinite(Number(source.out))?Number(source.out):probe.duration;
     const scenes=last.scenes.filter(s=>s.end>inPoint&&s.start<outPoint).map(s=>({...s,start:Math.max(s.start,inPoint),end:Math.min(s.end,outPoint)})).filter(s=>s.end-s.start>=.6);
     sceneStat.textContent=String(scenes.length);qualityStat.textContent=last.averageQuality==null?'—':last.averageQuality+'/100';flagStat.textContent=String(scenes.filter(s=>s.qualityMetrics&&s.qualityMetrics.flags.length).length);
     results.innerHTML='';
     const sorted=[...scenes].sort((a,b)=>(b.editorScore??b.score)-(a.editorScore??a.score));
     sorted.slice(0,24).forEach((s,i)=>{
      const row=document.createElement('button');row.type='button';row.className='kaiser-engine-scene';row.onclick=()=>preview(s.start);
      const img=document.createElement('img');img.alt='Scene '+(i+1);img.src=s.thumbnail||'';
      const info=document.createElement('span');info.className='engine-scene-info';const head=document.createElement('b');head.textContent='SCENE '+String(i+1).padStart(2,'0')+' · '+s.start.toFixed(1)+'s – '+s.end.toFixed(1)+'s';
      const met=s.qualityMetrics;const detail=document.createElement('small');detail.textContent=met?tr('គុណភាព ','Quality ')+s.quality+'/100 · '+tr('ពន្លឺ ','Light ')+Math.round(met.brightness)+'/255 · '+tr('ចលនា ','Motion ')+s.motion+'/100'+(met.flags.length?' · '+met.flags.join(' · '):' · '+tr('គ្មានសញ្ញាបញ្ហាបច្ចេកទេសធំ','No major technical flags')):tr('ពិន្ទុរូបភាព/ចលនា ','Visual/motion ')+s.score+'/100';
      info.append(head,detail);const score=document.createElement('span');score.className='kaiser-engine-score';score.textContent=(s.editorScore??s.score)+'/100';row.append(img,info,score);results.appendChild(row);
     });
     status.textContent=tr('ស្កេនរួចរាល់ · ចុចលើ Scene ដើម្បីពិនិត្យ។ ពិន្ទុជាការវាយតម្លៃបច្ចេកទេស មិនមែនការយល់អត្ថន័យសាច់រឿងទេ។','Scan complete · Tap a scene to review. Scores are technical estimates, not story understanding.');fill.style.width='100%';
    }catch(err){status.textContent=tr('វិភាគបរាជ័យ៖ ','Analysis failed: ')+(err.message||err);console.error('KAISER AI Engine:',err)}finally{if(probe){probe.pause();probe.remove()}run.disabled=false;cut.disabled=false}
   };
  });
 };
 addEngineButton();
})();
