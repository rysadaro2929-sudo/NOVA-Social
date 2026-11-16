/* KAISER V6.3.2 — additive Hybrid AI Cut Assistant.
   Local mode is heuristic. Semantic suggestions require a trusted Cloud endpoint
   implementing task=analyze_edit_plan and returning remove/keep/hook ranges.
   Only sampled frame thumbnails and timestamps are sent; never the full video. */
(function(){
 'use strict';
 const oldAI=T.ai;
 const lang=()=>localStorage.getItem('kaiser-editor-language')==='en'?'en':'km';
 const tr=(km,en)=>lang()==='km'?km:en;
 const clock=n=>{n=Math.max(0,Number(n)||0);return String(Math.floor(n/60)).padStart(2,'0')+':'+String(Math.floor(n%60)).padStart(2,'0')};
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function rangeList(input,scenes,duration){
  if(!Array.isArray(input))return [];
  return input.map(x=>{const a=clamp(Number(x.start),0,duration),b=clamp(Number(x.end),0,duration);if(!Number.isFinite(a)||!Number.isFinite(b)||b-a<.5)return null;
   const base=scenes.find(s=>a>=s.start-.1&&b<=s.end+.1)||scenes.find(s=>a<s.end&&b>s.start);
   return {start:a,end:b,reason:typeof x.reason==='string'?x.reason.slice(0,220):(base?.reason||'')};
  }).filter(Boolean).sort((a,b)=>a.start-b.start);
 }
 function localPlan(scenes,duration){
  const ordered=[...scenes].sort((a,b)=>a.score-b.score), count=Math.max(1,Math.ceil(ordered.length*.25));
  const remove=ordered.slice(0,count).filter(x=>x.score<38).map(x=>({start:x.start,end:x.end,reason:tr('ពិន្ទុរូបភាព/ចលនាទាប — សូមពិនិត្យមុនកាត់','Low visual/motion score — review before cutting')}));
  const keep=[...scenes].sort((a,b)=>b.score-a.score).slice(0,Math.max(1,Math.ceil(scenes.length*.5))).map(x=>({start:x.start,end:x.end,reason:tr('ឈុតមានពិន្ទុរូបភាព/ចលនាខ្ពស់','Higher visual/motion score')}));
  const hook=[...scenes].sort((a,b)=>b.score-a.score)[0];
  return {remove,keep,hook:hook?{start:hook.start,end:Math.min(hook.end,hook.start+Math.min(8,hook.end-hook.start)),reason:tr('ឈុតមានពិន្ទុខ្ពស់បំផុតក្នុងការវិភាគមូលដ្ឋាន','Highest-scoring local segment')}:null,mode:'LOCAL HEURISTIC'};
 }
 async function cloudPlan(endpoint,analysis,instruction,videoInfo){
  const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task:'analyze_edit_plan',language:lang()==='km'?'km':'en',instruction:instruction.slice(0,2000),video:videoInfo,
   scenes:analysis.scenes.map(x=>({id:x.id,start:x.start,end:x.end,score:x.score,motion:x.motion,reason:x.reason,thumbnail_jpeg_data_url:x.thumbnail}))})});
  if(!r.ok)throw new Error('Cloud AI HTTP '+r.status);
  const d=await r.json();if(!d||(!Array.isArray(d.remove)&&!Array.isArray(d.keep)&&!d.hook))throw new Error('Cloud response ត្រូវមាន remove, keep និង hook');
  return {remove:rangeList(d.remove,analysis.scenes,analysis.duration),keep:rangeList(d.keep,analysis.scenes,analysis.duration),hook:d.hook?rangeList([d.hook],analysis.scenes,analysis.duration)[0]||null:null,mode:'HYBRID CLOUD'};
 }
 T.ai=function(){
  if(!C.length)return toast(tr('សូម Import វីដេអូមុន','Import a video first'));
  const source=C[cur],sourceUrl=source.el.currentSrc||source.el.src;
  open(tr('AI Cut Assistant · V6.3.2','AI Cut Assistant · V6.3.2'),box=>{
   box.classList.add('ai-box');
   const promptLabel=document.createElement('label');promptLabel.textContent=tr('សេចក្ដីណែនាំទៅកាន់ AI','Instructions for AI');box.appendChild(promptLabel);
   const prompt=document.createElement('textarea');prompt.value=tr('សូមកាត់ចំណុចមិនល្អចេញ ទុកចំណុចល្អ ហើយណែនាំឈុតដែលគួរដាក់នៅក្បាលវីដេអូ។ សូមបង្ហាញពេលវេលាច្បាស់ៗ។','Remove weak or unnecessary moments, keep the best parts, and recommend the strongest opening hook. Give exact timestamps.');box.appendChild(prompt);
   const epLabel=document.createElement('label');epLabel.textContent=tr('Cloud AI Endpoint (ជាជម្រើស)','Cloud AI endpoint (optional)');box.appendChild(epLabel);
   const endpoint=document.createElement('input');endpoint.type='url';endpoint.placeholder='https://your-server.example/analyze-edit-plan';endpoint.value=localStorage.getItem('kaiser-hybrid-endpoint')||'';box.appendChild(endpoint);
   const note=document.createElement('div');note.className='ai-note';note.textContent=tr('Local AI វិភាគរូបភាព/ចលនាជាមុន។ បើបញ្ចូល Endpoint នោះ Cloud AI អាចវិភាគអត្ថន័យបន្ថែម។ ផ្ញើតែរូបភាពគំរូ មិនផ្ញើវីដេអូពេញទេ។','Local analysis checks visual/motion signals. With an endpoint, Cloud AI can add semantic analysis. Only sampled thumbnails are sent, not the full video.');box.appendChild(note);
   const progress=document.createElement('div');progress.className='ai-progress';const fill=document.createElement('i');progress.appendChild(fill);box.appendChild(progress);
   const status=document.createElement('div');status.className='ai-note';status.textContent=tr('ត្រៀមវិភាគ','Ready to analyze');box.appendChild(status);
   const results=document.createElement('div');results.className='ai-results';box.appendChild(results);
   const run=document.createElement('button');run.className='ai-primary';run.textContent=tr('វិភាគវីដេអូ','Analyze video');box.appendChild(run);
   const explain=document.createElement('div');explain.className='ai-note';explain.textContent=tr('ចំណាំ៖ របាយការណ៍ Local គឺជាការណែនាំបឋម មិនមែនជាការយល់ដឹងអំពីសាច់រឿងទេ។ សូមចុចពេលវេលាដើម្បីពិនិត្យ ហើយ Split/Delete ដោយដៃ។','Note: Local results are preliminary visual heuristics, not story understanding. Tap a timestamp to review, then Split/Delete manually.');box.appendChild(explain);
   function addGroup(title,items,color){
    const h=document.createElement('div');h.className='lbl';h.style.marginTop='12px';h.textContent=title+' ('+items.length+')';results.appendChild(h);
    if(!items.length){const empty=document.createElement('div');empty.className='ai-note';empty.textContent=tr('មិនមានការណែនាំក្នុងផ្នែកនេះទេ','No suggestions in this category');results.appendChild(empty);return}
    items.forEach((x,i)=>{const row=document.createElement('button');row.type='button';row.className='ai-result';row.style.width='100%';row.style.textAlign='left';row.style.borderLeft='3px solid '+color;row.style.cursor='pointer';
     const title=document.createElement('b');title.textContent=clock(x.start)+' – '+clock(x.end)+' · '+(x.end-x.start).toFixed(1)+'s';
     const reason=document.createElement('small');reason.textContent=x.reason||'';row.append(title,reason);row.onclick=()=>{const offset=cl((x.start-(source.in||0))/(source.spd||1),0,Math.max(0,dur[cur]||0));seekG(st[cur]+offset);closeSheet();toast(tr('បានទៅកាន់ទីតាំងដែល AI ណែនាំ','Moved to suggested timestamp'))};results.appendChild(row);
    });
   }
   run.onclick=async()=>{
    run.disabled=true;results.innerHTML='';fill.style.width='0%';let probe;
    try{
     status.textContent=tr('កំពុងរៀបចំវីដេអូ...','Preparing video...');probe=await loadV(sourceUrl);probe.muted=true;
     if(probe.readyState<2)await new Promise((res,rej)=>{probe.addEventListener('loadeddata',res,{once:true});probe.addEventListener('error',()=>rej(new Error('Cannot read video frames')),{once:true})});
     const analysis=await window.KAISORAI.analyzeVideo(probe,{sensitivity:'medium',sampleEvery:1.25,maxSamples:240},(p,msg)=>{fill.style.width=p+'%';status.textContent=msg});
     let plan=localPlan(analysis.scenes,analysis.duration);const ep=endpoint.value.trim();
     if(ep){localStorage.setItem('kaiser-hybrid-endpoint',ep);try{status.textContent=tr('កំពុងវិភាគបន្ថែមដោយ Cloud AI...','Requesting semantic Cloud AI analysis...');plan=await cloudPlan(ep,analysis,prompt.value,{duration:probe.duration,width:probe.videoWidth,height:probe.videoHeight});}catch(err){console.warn(err);status.textContent=tr('Cloud AI មិនអាចប្រើបាន៖ ','Cloud AI unavailable: ')+err.message+tr('។ បង្ហាញលទ្ធផល Local ជំនួស។','; showing local results instead.')}}
     results.innerHTML='';
     if(plan.hook)addGroup(tr('ឈុតណែនាំឱ្យដាក់នៅដើម','Recommended opening hook'),[plan.hook],'#d8ad42');
     addGroup(tr('ចំណុចណែនាំឱ្យកាត់ចេញ','Suggested parts to remove'),plan.remove,'#e06b75');
     addGroup(tr('ចំណុចណែនាំឱ្យរក្សាទុក','Suggested parts to keep'),plan.keep,'#53c99b');
     status.textContent=tr('វិភាគរួចរាល់ · ','Analysis complete · ')+plan.mode+tr(' · សូមពិនិត្យមុនកាត់',' · Review before editing');fill.style.width='100%';
    }catch(err){status.textContent=tr('វិភាគបរាជ័យ៖ ','Analysis failed: ')+(err.message||err);console.error(err)}finally{if(probe){probe.pause();probe.remove()}run.disabled=false}
   };
  });
 };
})();
