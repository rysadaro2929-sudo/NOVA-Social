/* KAISOR AI ↔ Classic Timeline bridge. This is an additive integration layer. */
(function(){
 'use strict';
 const trText={
  en:{import:'+ Import',export:'Export',empty:'Tap + to add a video',ai:'AI Smart',language:'Language',settings:'Settings',kh:'Khmer',eng:'English',analyze:'Analyze highlights',add:'Add selected clips to timeline',hook:'Put strongest Hook first',range:'Analysis range',start:'Start (seconds)',end:'End (seconds)',target:'Target duration',prompt:'Editing instructions',endpoint:'Cloud AI endpoint (optional)',sensitivity:'Scene sensitivity',local:'Local analysis uses visual heuristics. It does not understand story meaning or speech.',done:'AI clips added to Classic Timeline.'},
  km:{import:'+ Import',export:'Export',empty:'ចុច + ដើម្បីបន្ថែមវីដេអូ',ai:'AI ឆ្លាតវៃ',language:'ភាសា',settings:'ការកំណត់',kh:'ភាសាខ្មែរ',eng:'English',analyze:'វិភាគឈុតសំខាន់ៗ',add:'បញ្ចូលឈុតដែលបានជ្រើសទៅ Timeline',hook:'ដាក់ Hook ដែលមានពិន្ទុខ្ពស់បំផុតនៅដើម',range:'ចន្លោះពេលវិភាគ',start:'ចាប់ពី (វិនាទី)',end:'ដល់ (វិនាទី)',target:'រយៈពេលគោលដៅ',prompt:'សេចក្ដីណែនាំការកាត់ត',endpoint:'Cloud AI Endpoint (ជាជម្រើស)',sensitivity:'កម្រិតស្វែងរកឈុតឆាក',local:'Local analysis ប្រើការវាយតម្លៃរូបភាព/ចលនា មិនទាន់យល់អត្ថន័យរឿង ឬសំឡេងនិយាយទេ។',done:'បានបញ្ចូលឈុត AI ទៅ Classic Timeline។'}
 };
 const EDITOR_LANG_KEY='kaiser-editor-language';
 if(!localStorage.getItem(EDITOR_LANG_KEY)){const legacy=localStorage.getItem('kaisor-language');if(legacy==='en'||legacy==='km')localStorage.setItem(EDITOR_LANG_KEY,legacy)}
 let uiLang=localStorage.getItem(EDITOR_LANG_KEY)==='en'?'en':'km';
 const L=()=>trText[uiLang];
 function applyLanguage(){
  document.documentElement.lang=uiLang==='km'?'km':'en';
  const imp=document.getElementById('imp'),exp=document.getElementById('exp'),empty=document.querySelector('#empty span');
  if(imp)imp.textContent=L().import;if(exp)exp.textContent=L().export;if(empty)empty.textContent=L().empty;
  if(typeof menu==='function')menu('main');
 }
 T.settings=function(){
  open(L().settings,c=>{
   const label=document.createElement('div');label.className='lbl';label.textContent=L().language;c.appendChild(label);
   const choices=document.createElement('div');choices.className='chips';
   [['km','🇰🇭 '+L().kh],['en','🇬🇧 '+L().eng]].forEach(([v,name])=>{const b=document.createElement('button');b.className='chip'+(uiLang===v?' sel':'');b.textContent=name;b.onclick=()=>{uiLang=v;localStorage.setItem(EDITOR_LANG_KEY,v);applyLanguage();T.settings()};choices.appendChild(b)});
   c.appendChild(choices);
   const note=document.createElement('div');note.className='ai-note';note.textContent=uiLang==='km'?'ការប្ដូរភាសានេះអនុវត្តលើប៊ូតុងសំខាន់ៗ និងផ្ទាំង AI។ ការបកប្រែផ្ទាំងកំណត់លម្អិតផ្សេងៗនឹងបន្តជាដំណាក់កាលបន្ទាប់។':'This first language pass covers the main controls and AI panel. Remaining detailed editor sheets will be localized in a later pass.';c.appendChild(note);
  });
 };
 T.ai=function(){
  if(!C.length)return toast(uiLang==='km'?'សូម Import វីដេអូមុន':'Import a video first');
  const source=C[cur],sourceUrl=source.el.currentSrc||source.el.src;
  open('✦ '+L().ai,c=>{
   const box=document.createElement('div');box.className='ai-box';
   const promptLabel=document.createElement('label');promptLabel.textContent=L().prompt;box.appendChild(promptLabel);
   const prompt=document.createElement('textarea');prompt.placeholder=uiLang==='km'?'ឧ. ជ្រើសរើសឈុតទាក់ទាញបំផុត ដាក់នៅដើម ហើយរៀបចំឈុតសំខាន់ៗបន្ត...':'e.g. Put the strongest moment first, then arrange the most important scenes...';box.appendChild(prompt);
   const rangeTitle=document.createElement('label');rangeTitle.textContent=L().range;box.appendChild(rangeTitle);
   const grid=document.createElement('div');grid.className='ai-grid';
   const makeField=(label,value,min,max,step)=>{const w=document.createElement('div'),l=document.createElement('label'),i=document.createElement('input');l.textContent=label;i.type='number';i.min=min;i.max=max;i.step=step;i.value=value;w.append(l,i);grid.appendChild(w);return i};
   const start=makeField(L().start,0,0,Math.floor(source.el.duration),0.1);
   const end=makeField(L().end,Math.floor(source.el.duration),0,Math.floor(source.el.duration),0.1);box.appendChild(grid);
   const opts=document.createElement('div');opts.className='ai-grid';
   const targetWrap=document.createElement('div'),targetLabel=document.createElement('label'),target=document.createElement('select');targetLabel.textContent=L().target;[30,60,90,120].forEach(n=>{const o=document.createElement('option');o.value=n;o.textContent=n+'s';target.appendChild(o)});target.value='60';targetWrap.append(targetLabel,target);opts.appendChild(targetWrap);
   const sensWrap=document.createElement('div'),sensLabel=document.createElement('label'),sens=document.createElement('select');sensLabel.textContent=L().sensitivity;[['low','Low'],['medium','Balanced'],['high','High']].forEach(([v,n])=>{const o=document.createElement('option');o.value=v;o.textContent=n;sens.appendChild(o)});sens.value='medium';sensWrap.append(sensLabel,sens);opts.appendChild(sensWrap);box.appendChild(opts);
   const epLabel=document.createElement('label');epLabel.textContent=L().endpoint;box.appendChild(epLabel);const endpoint=document.createElement('input');endpoint.type='url';endpoint.placeholder='https://your-server.example/analyze';box.appendChild(endpoint);
   const hookRow=document.createElement('label');hookRow.className='ai-row';const hook=document.createElement('input');hook.type='checkbox';hook.checked=true;const hookText=document.createElement('span');hookText.textContent=L().hook;hookRow.append(hook,hookText);box.appendChild(hookRow);
   const privacy=document.createElement('div');privacy.className='ai-note';privacy.textContent=L().local;box.appendChild(privacy);
   const progress=document.createElement('div');progress.className='ai-progress';const fill=document.createElement('i');progress.appendChild(fill);box.appendChild(progress);
   const status=document.createElement('div');status.className='ai-note';status.textContent=uiLang==='km'?'ត្រៀមវិភាគ':'Ready to analyze';box.appendChild(status);
   const results=document.createElement('div');results.className='ai-results';box.appendChild(results);
   const actions=document.createElement('div');actions.className='ai-actions';const run=document.createElement('button');run.className='ai-primary';run.textContent=L().analyze;const add=document.createElement('button');add.className='ai-secondary';add.textContent=L().add;add.disabled=true;actions.append(run,add);box.appendChild(actions);c.appendChild(box);
   let found=[];
   run.onclick=async()=>{
    const a=Math.max(0,Number(start.value)||0),b=Math.min(source.el.duration,Number(end.value)||0);
    if(!(b>a+1.5)){status.textContent=uiLang==='km'?'ចន្លោះពេលមិនត្រឹមត្រូវ (ត្រូវលើស 1.5 វិនាទី)':'Invalid range (must exceed 1.5 seconds)';return}
    run.disabled=true;add.disabled=true;results.innerHTML='';fill.style.width='0%';
    let probe;
    try{
     status.textContent=uiLang==='km'?'កំពុងរៀបចំវីដេអូសម្រាប់វិភាគ...':'Preparing video for analysis...';
     probe=await loadV(sourceUrl);probe.muted=true;
     if(probe.readyState<2)await new Promise((resolve,reject)=>{probe.addEventListener('loadeddata',resolve,{once:true});probe.addEventListener('error',()=>reject(new Error('Video frame data could not be loaded')), {once:true})});
     const analysis=await window.KAISORAI.analyzeVideo(probe,{sensitivity:sens.value,sampleEvery:1.25,maxSamples:240},(p,msg)=>{fill.style.width=p+'%';status.textContent=msg});
     let candidates=analysis.scenes.filter(s=>s.end>a&&s.start<b).map(s=>({...s,start:Math.max(a,s.start),end:Math.min(b,s.end)})).filter(s=>s.end-s.start>=1.5);
     const ep=endpoint.value.trim();let mode='LOCAL HEURISTIC';
     if(ep){try{status.textContent=uiLang==='km'?'កំពុងស្នើ Cloud AI...':'Requesting Cloud AI...';const cloud=await window.KAISORAI.enhanceWithCloud(ep,{...analysis,scenes:candidates},{duration:probe.duration,width:probe.videoWidth,height:probe.videoHeight},prompt.value);if(cloud&&cloud.length){candidates=cloud.filter(s=>s.end>a&&s.start<b);mode='HYBRID CLOUD'}}catch(err){console.warn(err);status.textContent=(uiLang==='km'?'Cloud AI មិនអាចប្រើបាន៖ ':'Cloud AI unavailable: ')+err.message+' · Using local analysis';}}
     found=window.KAISORAI.chooseHighlights(candidates,Number(target.value));
     if(hook.checked&&found.length>1){const best=found.reduce((x,y)=>y.score>x.score?y:x);found=[best,...found.filter(x=>x!==best).sort((x,y)=>x.start-y.start)];}
     results.innerHTML='';
     found.forEach((clip,i)=>{const row=document.createElement('label');row.className='ai-result';const check=document.createElement('input');check.type='checkbox';check.checked=true;clip._selected=true;check.onchange=()=>clip._selected=check.checked;const info=document.createElement('div');info.textContent=(hook.checked&&i===0?'★ HOOK · ':'CLIP '+String(i+1).padStart(2,'0')+' · ')+fmt(clip.start)+' – '+fmt(clip.end);const meta=document.createElement('small');meta.textContent=(clip.end-clip.start).toFixed(1)+'s · '+(clip.reason||mode);info.appendChild(meta);const score=document.createElement('b');score.textContent=clip.score+'/100';row.append(check,info,score);results.appendChild(row)});
     status.textContent=(uiLang==='km'?'បានរកឃើញ ':'Found ')+found.length+' clips · '+mode;fill.style.width='100%';add.disabled=!found.length;
    }catch(err){status.textContent=(uiLang==='km'?'វិភាគបរាជ័យ៖ ':'Analysis failed: ')+(err.message||err);console.error(err)}finally{if(probe){probe.pause();probe.remove()}run.disabled=false}
   };
   add.onclick=async()=>{
    const chosen=found.filter(x=>x._selected);if(!chosen.length)return;
    add.disabled=true;run.disabled=true;
    try{
     snp();
     for(let i=0;i<chosen.length;i++){
      const clip=chosen[i],el=await loadV(sourceUrl);
      C.push({el,name:'AI · '+String(i+1).padStart(2,'0'),th:clip.thumbnail||'',in:clip.start,out:clip.end,spd:1,vol:1,fil:'None',adj:{brightness:100,contrast:100,saturation:100,exposure:100},tr:{t:'None',d:.6},pr:{...P0},kf:[]});
     }
     recalc();build();
     seekG(st[Math.max(0,C.length-chosen.length)]||0);closeSheet();toast(L().done);
    }catch(err){toast((uiLang==='km'?'បញ្ចូលឈុត AI បរាជ័យ៖ ':'Could not add AI clips: ')+(err.message||err));console.error(err)}finally{run.disabled=false}
   };
  });
 };
 // Keep the current visual design and main controls; language preference is persistent.
 const oldMenu=menu;
 const translatedMenuLabels={km:{'AI Smart':'AI ឆ្លាតវៃ','Language':'ភាសា','Split':'កាត់','Delete':'លុប','Transition':'ចន្លោះឈុត','Animation':'ចលនា','Keyframe':'Keyframe','Text':'អក្សរ','Speed':'ល្បឿន','Volume':'សំឡេង','Filter':'Filter','Size':'ទំហំ','Color':'ពណ៌','Overlay':'Overlay','Media':'Media','Undo':'ត្រឡប់ក្រោយ',Crop:'កាត់រូប',Add:'បន្ថែម',Copy:'ចម្លង',Opacity:'ភាពច្បាស់',Mirror:'ត្រឡប់ក្រោម',Flip:'ត្រឡប់',Rotate:'បង្វិល',Fit:'ក្នុងស៊ុម',Fill:'ពេញស៊ុម',Stretch:'ទាញពេញ',Corners:'ជ្រុងមូល',Border:'ស៊ុម',Layer:'ស្រទាប់',Blend:'លាយ',Reset:'កំណត់ឡើងវិញ',Done:'រួចរាល់',Free:'សេរី',Original:'ដើម',Me:'ខ្ញុំ',Voice:'ថតសំឡេង',Effects:'អេហ្វិច'},en:{}};
 menu=function(k){oldMenu(k);if(uiLang==='km')document.querySelectorAll('#tools button span').forEach(s=>{const v=translatedMenuLabels.km[s.textContent];if(v)s.textContent=v})};
 applyLanguage();
})();
