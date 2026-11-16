(function(){
 'use strict';
 if(window.__KAISER_AI_STUDIO_V310__)return;
 window.__KAISER_AI_STUDIO_V310__=true;
 /* ===== V6.3.35 · INSTANT MODE: use AI Studio immediately, no website connection, with daily credits ===== */
 // Adjust the free daily allowance here. Image = 1 credit, Video = 5 credits.
 const CREDIT_CFG={daily:15,image:1,video:5};
 // Publishable (pk_) App key of KAISER-AI-STUDIO. pk_ keys are designed to be public; calls are billed to the app owner's Pollinations balance.
 const INSTANT_KEY_DEFAULT='pk_T4xDt82WBUe1T0OT';
 const CR_KEY='kaiser-ai-credits';
 const dayKey=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
 const CR={
  load(){let v=null;try{v=JSON.parse(localStorage.getItem(CR_KEY)||'null')}catch(_){}if(!v||v.day!==dayKey()||!Number.isFinite(v.used))v={day:dayKey(),used:0};return v},
  save(v){try{localStorage.setItem(CR_KEY,JSON.stringify(v))}catch(_){}},
  left(){return Math.max(0,CREDIT_CFG.daily-this.load().used)},
  spend(n){const v=this.load();v.used=Math.min(CREDIT_CFG.daily,v.used+n);this.save(v)},
  resetMs(){const n=new Date(),m=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1);return m-n}
 };
 const isPk=k=>/^pk_[A-Za-z0-9_-]+$/.test(String(k||'').trim());
 const getInstantKey=()=>{const a=(localStorage.getItem('kaiser-pollinations-app-key')||'').trim();return isPk(a)?a:(isPk(INSTANT_KEY_DEFAULT)?INSTANT_KEY_DEFAULT:'')};
 /* Developer-only switch: open the app with ?dev=1 (or set localStorage kaiser-dev-mode=1) to reveal the Pollinations connect box. General users never see any key field. */
 const DEV_MODE=(()=>{try{return localStorage.getItem('kaiser-dev-mode')==='1'||/[?&]dev=1(&|$)/.test(location.search)}catch(_){return false}})();
 /* Provider chain for ordinary members: 1) free anonymous request  2) the app's own public key. Falls through only on access/limit/network problems. */
 async function aiRequest(kind,base,query,own,instantKey,readErr){
  if(!own)throw new Error('Pollinations account is not connected. Connect your account to generate media.');
  const headers={Authorization:'Bearer '+own};if(kind==='video')headers.Prefer='respond-async';
  const response=await fetch(base+'?'+query,{method:'GET',headers});
  if(!response.ok)throw await readErr(response);
  return {response,token:own,via:'user-authorized'}
 }
 window.KAISER_CREDITS={cfg:CREDIT_CFG,left:()=>CR.left(),resetMs:()=>CR.resetMs()};
 const fmtReset=ms=>{const m=Math.max(1,Math.round(ms/60000)),h=Math.floor(m/60);return (h?h+'ម ':'')+(m%60)+'ន'};
 function friendlyAiError(err,instant){
  const st=err&&err.status,m=String(err&&err.message||err||'');
  if(/Failed to fetch|NetworkError|network/i.test(m)&&!st)return 'មិនអាចតភ្ជាប់ Internet ទេ។ សូមពិនិត្យការតភ្ជាប់ រួចសាកម្ដងទៀត។';
  if(st===400)return 'Prompt នេះមិនអាចបង្កើតបាន។ សូមសរសេរឱ្យខុសពីមុន ឬងាយជាងមុន។ ('+m.slice(0,80)+')';
  if(!instant)return m+' · សូមពិនិត្យ Internet និង Model។';
  if(st===401||st===402||st===403||st===429||st>=500||!st)return 'ម៉ាស៊ីន AI កំពុងមមាញឹក ឬអស់សមត្ថភាពបណ្ដោះអាសន្ន។ Credit របស់អ្នកមិនត្រូវកាត់ទេ។ សូមរង់ចាំបន្តិចរួចចុច Generate ម្ដងទៀត។'+(st?' ['+st+']':'');
  return m}
 // OAuth callback: validate state and exchange the one-time code with PKCE.
 window.__KAISER_POLLINATIONS_AUTH_READY__=(async()=>{
  const u=new URL(location.href),code=u.searchParams.get('code'),returnedState=u.searchParams.get('state'),oauthError=u.searchParams.get('error');
  if(!code&&!oauthError)return;
  const expectedState=sessionStorage.getItem('kaiser-polli-oauth-state');
  const verifier=sessionStorage.getItem('kaiser-polli-pkce-verifier');
  const clientId=localStorage.getItem('kaiser-pollinations-app-key');
  const redirectUri=location.origin+location.pathname;
  u.searchParams.delete('code');u.searchParams.delete('state');u.searchParams.delete('error');u.searchParams.delete('error_description');
  history.replaceState({},document.title,u.pathname+u.search+u.hash);
  sessionStorage.removeItem('kaiser-polli-oauth-state');sessionStorage.removeItem('kaiser-polli-pkce-verifier');
  if(oauthError)throw new Error('Pollinations authorization was not approved: '+oauthError);
  if(!expectedState||!returnedState||returnedState!==expectedState||!verifier||!clientId)throw new Error('OAuth state/PKCE validation failed. សូមចុច Connect ម្ដងទៀត។');
  const body=new URLSearchParams({grant_type:'authorization_code',code,client_id:clientId,redirect_uri:redirectUri,code_verifier:verifier});
  const response=await fetch('https://enter.pollinations.ai/api/oauth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
  if(!response.ok){let detail='HTTP '+response.status;try{const j=await response.json();detail=j.error_description||j.error||j.message||detail}catch(_){}throw new Error('OAuth token exchange failed: '+detail)}
  const data=await response.json();if(!data.access_token)throw new Error('OAuth response did not contain an access token');
  window.__KAISER_POLLINATIONS_TOKEN__=data.access_token;window.__KAISER_POLLINATIONS_AUTH_ERROR__='';
  return true;
 })().catch(err=>{console.error('KAISER Pollinations OAuth:',err);window.__KAISER_POLLINATIONS_AUTH_ERROR__=err.message;return false});
 const oldMenu=window.menu;
 function addStudioButton(){
  const tools=document.getElementById('tools');
  if(!tools||tools.querySelector('[data-kaiser-ai-studio]'))return;
  const btn=document.createElement('button');btn.type='button';btn.className='kaiser-studio-launch';
  btn.dataset.kaiserAiStudio='1';
  btn.innerHTML='<span class="studio-icon" aria-hidden="true">✦</span><span class="studio-label">KAISER AI<br>STUDIO</span>';
  btn.addEventListener('click',()=>window.T&&typeof window.T.aiStudio==='function'&&window.T.aiStudio());
  const ai=tools.querySelector('[data-action="ai"]');
  if(ai&&ai.nextSibling)tools.insertBefore(btn,ai.nextSibling);else if(ai)tools.appendChild(btn);else tools.insertBefore(btn,tools.firstChild);
 }
 if(typeof oldMenu==='function')window.menu=function(k){oldMenu(k);if(k==='main')addStudioButton()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addStudioButton,{once:true});else addStudioButton();
 window.T=window.T||{};
 window.T.aiStudio=function(){
  if(typeof window.open!=='function')return;
  window.open('✦ KAISER AI STUDIO',function(container){
   const root=document.createElement('section');root.className='kaiser-studio';
   const options=document.createElement('div');options.className='studio-options';root.appendChild(options);
   let selected='image';
   const imageBtn=document.createElement('button');imageBtn.type='button';imageBtn.className='studio-option active';imageBtn.textContent='🖼 AI Image Generator';
   const videoBtn=document.createElement('button');videoBtn.type='button';videoBtn.className='studio-option';videoBtn.textContent='🎬 AI Video Generator';options.append(imageBtn,videoBtn);
   const credit=document.createElement('div');credit.className='studio-credit';
    credit.innerHTML='<div class="sc-top"><b class="sc-title"></b><span class="sc-reset"></span></div><div class="sc-bar"><i></i></div><div class="sc-note"></div>';
    root.appendChild(credit);let refreshCredit=function(){};
    const promptLabel=document.createElement('label');promptLabel.textContent='Prompt';root.appendChild(promptLabel);
   const prompt=document.createElement('textarea');prompt.placeholder='សរសេរពិពណ៌នារូបភាព ឬវីដេអូដែលអ្នកចង់បង្កើត...';root.appendChild(prompt);
    const chips=document.createElement('div');chips.className='studio-chips';
    [['🎬 Cinematic','cinematic lighting, dramatic, film still'],['🎌 Anime','anime style, vibrant colors, detailed'],['📷 Realistic','photorealistic, ultra detailed, 8k'],['🧊 3D','3D render, soft lighting, high detail'],['🏛 Khmer','Angkor Wat Khmer art style, golden hour'],['✨ Fantasy','epic fantasy, magical glow, intricate']].forEach(([t,add])=>{const b=document.createElement('button');b.type='button';b.className='studio-chip';b.textContent=t;b.addEventListener('click',()=>{if(!prompt.value.toLowerCase().includes(add.toLowerCase()))prompt.value=(prompt.value.trim()?prompt.value.trim()+', ':'')+add});chips.appendChild(b)});
    root.appendChild(chips);
   const promptRow=document.createElement('div');promptRow.className='studio-row';root.appendChild(promptRow);
   const improve=document.createElement('button');improve.type='button';improve.className='studio-action';improve.textContent='រៀបចំ Prompt';promptRow.appendChild(improve);
   const modelWrap=document.createElement('div');modelWrap.className='studio-field';const modelLabel=document.createElement('label');modelLabel.textContent='AI Model';modelWrap.appendChild(modelLabel);
   const model=document.createElement('select');modelWrap.appendChild(model);root.appendChild(modelWrap);
   // V6.3.30: two social image formats; API dimensions are requested and output is normalized locally.
   const sizeWrap=document.createElement('div');sizeWrap.className='studio-field';
   const sizeLabel=document.createElement('label');sizeLabel.textContent='ទំហំរូបភាព · Image Size';sizeWrap.appendChild(sizeLabel);
   const imageSize=document.createElement('select');imageSize.className='studio-size-select';
   [['youtube','YouTube · 16:9 · 1920 × 1080','1920','1080'],['tiktok','TikTok / Shorts · 9:16 · 1080 × 1920','1080','1920']].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;imageSize.appendChild(o)});
   sizeWrap.appendChild(imageSize);
   const sizeNote=document.createElement('p');sizeNote.className='studio-size-note';sizeNote.textContent='រូបភាពនឹងត្រូវកែសមាមាត្រទៅតាមទំហំដែលបានជ្រើស។';sizeWrap.appendChild(sizeNote);
   root.appendChild(sizeWrap);
   const durationWrap=document.createElement('div');durationWrap.className='studio-field';const durationLabel=document.createElement('label');durationLabel.textContent='រយៈពេលវីដេអូ';durationWrap.appendChild(durationLabel);
   const duration=document.createElement('select');[['10','10 វិនាទី'],['11','11 វិនាទី'],['12','12 វិនាទី'],['13','13 វិនាទី'],['14','14 វិនាទី'],['15','15 វិនាទី']].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;duration.appendChild(o)});durationWrap.appendChild(duration);const durationNote=document.createElement('p');durationNote.className='studio-note';durationNote.textContent='ជ្រើសរើស 10–15 វិនាទី។ រយៈពេលដែលអាច Generate បាន អាស្រ័យលើសមត្ថភាពរបស់ AI Model ដែលបានជ្រើស។';durationWrap.appendChild(durationNote);root.appendChild(durationWrap);
   const advToggle=document.createElement('button');advToggle.type='button';advToggle.className='studio-adv-toggle';advToggle.textContent='🔗 Connect AI Account · Pollinations';advToggle.hidden=false;root.appendChild(advToggle);
    const advBox=document.createElement('div');advBox.className='studio-adv';advBox.hidden=false;root.appendChild(advBox);
    advToggle.addEventListener('click',()=>{advBox.hidden=!advBox.hidden});
    const authLabel=document.createElement('label');authLabel.textContent='Pollinations Connect · BYOP';advBox.appendChild(authLabel);
   const appKey=document.createElement('input');appKey.type='text';appKey.autocomplete='off';appKey.spellcheck=false;appKey.placeholder='App Key របស់ KAISER (pk_...)';appKey.value=localStorage.getItem('kaiser-pollinations-app-key')||INSTANT_KEY_DEFAULT;advBox.appendChild(appKey);
   const authActions=document.createElement('div');authActions.className='studio-row';advBox.appendChild(authActions);
   const connect=document.createElement('button');connect.type='button';connect.className='studio-action';connect.textContent='Connect Pollinations';authActions.appendChild(connect);
   const disconnect=document.createElement('button');disconnect.type='button';disconnect.className='studio-action';disconnect.textContent='Disconnect';authActions.appendChild(disconnect);
   const keyNote=document.createElement('p');keyNote.className='studio-note';keyNote.textContent='សូមភ្ជាប់គណនី Pollinations របស់អ្នក។ App Key (pk_) ប្រើសម្រាប់បើកទំព័រអនុញ្ញាត OAuth ប៉ុណ្ណោះ។ ក្រោយពេលអ្នកយល់ព្រម កម្មវិធីទទួលបាន Token (sk_) ដែលមានថវិកា និងថ្ងៃផុតកំណត់តាមការអនុញ្ញាត។ Token រក្សាទុកតែក្នុង memory នៃផ្ទាំងនេះ មិនរក្សាទុកក្នុង LocalStorage ទេ។ ការបង្កើតមាតិកាប្រើ Pollen តាមគណនីដែលអ្នកបានអនុញ្ញាត។';advBox.appendChild(keyNote);
   const redirectNote=document.createElement('p');redirectNote.className='studio-note';redirectNote.textContent='Redirect URI ត្រូវចុះឈ្មោះក្នុង Pollinations App ឱ្យត្រូវគ្នាពិតប្រាកដ៖ '+location.origin+location.pathname;advBox.appendChild(redirectNote);
   const status=document.createElement('p');status.className='studio-note';status.setAttribute('aria-live','polite');status.textContent=window.__KAISER_POLLINATIONS_TOKEN__?'បានភ្ជាប់គណនី Pollinations រួចរាល់។':(window.__KAISER_POLLINATIONS_AUTH_ERROR__||'សូមភ្ជាប់គណនី Pollinations មុនពេល Generate។');root.appendChild(status);
   const actions=document.createElement('div');actions.className='studio-row';root.appendChild(actions);
   const generate=document.createElement('button');generate.type='button';generate.className='studio-action gold';generate.textContent='Generate Image';actions.appendChild(generate);
   const previewWrap=document.createElement('div');previewWrap.className='studio-preview-wrap';root.appendChild(previewWrap);
   let currentUrl=null,currentBlob=null,currentKind=null,currentName='';
   const importEditor=document.createElement('button');importEditor.type='button';importEditor.className='studio-action gold';importEditor.textContent='បញ្ចូលទៅក្នុង Editor';importEditor.hidden=true;previewWrap.appendChild(importEditor);
   importEditor.addEventListener('click',()=>{
    if(!currentBlob||!currentKind){status.textContent='មិនមាន Media សម្រាប់បញ្ចូលទេ។';return}
    try{
     const id=currentKind==='image'?'overlayFile':'file';
     const input=document.getElementById(id);
     if(!input)throw new Error('រកមិនឃើញ Media Import របស់ Editor');
     if(currentKind==='image'&&(typeof C==='undefined'||!C.length)){status.textContent='សូមបញ្ចូលវីដេអូមេក្នុង Editor ជាមុនសិន រួចទើបបញ្ចូលរូបភាព AI ជា Overlay។';return}
     if(typeof File!=='function'||typeof DataTransfer!=='function')throw new Error('កម្មវិធីរុករកនេះមិនគាំទ្រការផ្ទេរ Media ដោយផ្ទាល់ទេ។ សូមទាញយកឯកសារជាមុន។');
     const file=new File([currentBlob],currentName,{type:currentBlob.type|| (currentKind==='image'?'image/png':'video/mp4'),lastModified:Date.now()});
     const transfer=new DataTransfer();transfer.items.add(file);input.files=transfer.files;
     input.dispatchEvent(new Event('change',{bubbles:true}));
     status.textContent=currentKind==='image'?'បានបញ្ជូនរូបភាព AI ទៅ Overlay ក្នុង Editor។':'បានបញ្ជូនវីដេអូ AI ទៅ Timeline ក្នុង Editor។';
    }catch(err){console.error('KAISER AI Studio import:',err);status.textContent='បញ្ចូលទៅ Editor មិនបាន៖ '+(err.message||err)}
   });
   const genSuffix=m=>window.__KAISER_POLLINATIONS_TOKEN__?' · BYOP':' · Connect required';
    const models={image:[['black-forest-labs/flux.1-schnell','Flux Schnell'],['openai/gpt-image-1.5','GPT Image']],video:[['google/veo-3.1-fast','Veo 3.1 Fast'],['bytedance/seedance-2.0-fast','Seedance 2.0 Fast'],['alibaba/wan-2.6','Wan 2.6'],['x-ai/grok-imagine-video','Grok Imagine Video']]};
   const modelMeta={image:{},video:{}};
   function modelRows(payload){const a=Array.isArray(payload)?payload:(Array.isArray(payload.data)?payload.data:(Array.isArray(payload.models)?payload.models:[]));return a.map(x=>{const id=typeof x==='string'?x:(x&& (x.id||x.name||x.model));if(!id)return null;return {id:String(id),label:String((x&& (x.name||x.title||x.display_name))||id),meta:x||{}}}).filter(Boolean)}
   async function loadLiveModels(mode){try{const r=await fetch('https://gen.pollinations.ai/'+mode+'/models',{method:'GET',headers:{Accept:'application/json'}});if(!r.ok)throw new Error('HTTP '+r.status);const rows=modelRows(await r.json());if(!rows.length)return;const old=model.value;models[mode]=rows.map(x=>[x.id,x.label]);modelMeta[mode]={};rows.forEach(x=>modelMeta[mode][x.id]=x.meta);if(selected===mode){model.innerHTML='';models[mode].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;model.appendChild(o)});if(rows.some(x=>x.id===old))model.value=old;updateDurations()} }catch(err){console.warn('KAISER live model catalog unavailable:',mode,err)}}
   function updateDurations(){if(selected!=='video')return;const meta=modelMeta.video[model.value]||{},allowed=Array.isArray(meta.allowed_durations)?meta.allowed_durations.map(Number).filter(Number.isFinite):null;const min=Number(meta.min_duration)||4,max=Number(meta.max_duration)||15;let values=allowed&&allowed.length?allowed:[4,5,6,8,10,12,15].filter(n=>n>=min&&n<=max);if(!values.length)values=[min];const prior=Number(duration.value)||values[0];duration.innerHTML='';values.forEach(n=>{const o=document.createElement('option');o.value=String(n);o.textContent=n+' វិនាទី';duration.appendChild(o)});duration.value=String(values.includes(prior)?prior:values[0]);durationNote.textContent='រយៈពេលត្រូវបានកំណត់តាមសមត្ថភាព Model ដែលទាញយកពី Pollinations។'}
   model.addEventListener('change',updateDurations);
   function setMode(mode){selected=mode;imageBtn.classList.toggle('active',mode==='image');videoBtn.classList.toggle('active',mode==='video');durationWrap.style.display=mode==='video'?'flex':'none';sizeWrap.style.display=mode==='image'?'flex':'none';generate.textContent=(mode==='image'?'Generate Image':'Generate Video')+genSuffix(mode);model.innerHTML='';models[mode].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;model.appendChild(o)});status.textContent=mode==='image'?'រួចរាល់សម្រាប់បង្កើតរូបភាព។':'រួចរាល់សម្រាប់បង្កើតវីដេអូ។';if(mode==='video')updateDurations();loadLiveModels(mode)}
   imageBtn.addEventListener('click',()=>setMode('image'));videoBtn.addEventListener('click',()=>setMode('video'));
   improve.addEventListener('click',()=>{const p=prompt.value.trim();if(!p){status.textContent='សូមសរសេរ Prompt ជាមុនសិន។';return}prompt.value=p+'. High quality, detailed composition, cinematic lighting, clear subject, professional visual quality.';status.textContent='បានរៀបចំ Prompt រួចរាល់។ សូមពិនិត្យមុន Generate។'});
   async function readError(response){let msg='HTTP '+response.status;try{const j=await response.json();msg=j.error?.message||j.message||j.detail||msg}catch(_){}const e=new Error(msg);e.status=response.status;return e}
   connect.addEventListener('click',async()=>{
    const clientId=appKey.value.trim();
    if(!/^pk_[A-Za-z0-9_-]+$/.test(clientId)){status.textContent='សូមបញ្ចូល App Key ដែលចាប់ផ្ដើមដោយ pk_។';appKey.focus();return}
    if(location.protocol==='file:'||!location.origin||location.origin==='null'){status.textContent='OAuth ត្រូវការបើកកម្មវិធីតាម HTTP/HTTPS (ឧ. localhost) មិនអាចប្រើ file:// បានទេ។';return}
    const redirectUri=location.origin+location.pathname;
    try{
     connect.disabled=true;status.textContent='កំពុងរៀបចំការភ្ជាប់ដោយសុវត្ថិភាព...';
     const randomBytes=n=>{const b=new Uint8Array(n);crypto.getRandomValues(b);return b};
     const toB64Url=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
     const verifier=toB64Url(randomBytes(32));
     const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
     const challenge=toB64Url(digest);
     const state=toB64Url(randomBytes(24));
     sessionStorage.setItem('kaiser-polli-pkce-verifier',verifier);
     sessionStorage.setItem('kaiser-polli-oauth-state',state);
     localStorage.setItem('kaiser-pollinations-app-key',clientId);
     const q=new URLSearchParams({response_type:'code',client_id:clientId,redirect_uri:redirectUri,models:'image,video',budget:'5',expiry:'7',state,code_challenge:challenge,code_challenge_method:'S256'});
     location.href='https://enter.pollinations.ai/authorize?'+q.toString();
    }catch(err){status.textContent='មិនអាចចាប់ផ្ដើម OAuth៖ '+err.message;connect.disabled=false}
   });
   disconnect.addEventListener('click',()=>{window.__KAISER_POLLINATIONS_TOKEN__=null;status.textContent='បានផ្ដាច់ Pollinations។ ត្រឡប់ទៅ Instant Mode វិញ។';refreshCredit()});
   async function waitForVideoJob(jobId,token){const url='https://gen.pollinations.ai/v1/jobs/'+encodeURIComponent(jobId);for(let i=0;i<120;i++){await new Promise(r=>setTimeout(r,5000));const r=await fetch(url,{headers:token?{Authorization:'Bearer '+token}:{}});if(!r.ok)throw await readError(r);const j=await r.json();if(j.status==='failed')throw new Error(j.error?.message||'Video generation failed');if(j.status==='succeeded'){const result=j.result_url||j.url;if(result){const v=await fetch(result);if(!v.ok)throw new Error('Could not download generated video');return await v.blob()}const rr=await fetch(url+'/result',{headers:token?{Authorization:'Bearer '+token}:{}});if(!rr.ok)throw await readError(rr);return await rr.blob()}status.textContent='កំពុងបង្កើតវីដេអូ... '+(i+1)*5+'s'}throw new Error('Video generation timed out. សូមព្យាយាមម្ដងទៀត។')}
   // Ensure the downloaded/imported image has the selected exact pixel dimensions.
   async function normalizeImageSize(blob,width,height){
    const bitmap=await createImageBitmap(blob);
    if(bitmap.width===width&&bitmap.height===height){bitmap.close&&bitmap.close();return blob}
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d');if(!ctx){bitmap.close&&bitmap.close();throw new Error('Browser cannot prepare the selected image size')}
    const scale=Math.max(width/bitmap.width,height/bitmap.height),sw=width/scale,sh=height/scale;
    const sx=(bitmap.width-sw)/2,sy=(bitmap.height-sh)/2;
    ctx.drawImage(bitmap,sx,sy,sw,sh,0,0,width,height);bitmap.close&&bitmap.close();
    const out=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not encode resized image')),'image/png'));
    return out;
   }
   generate.addEventListener('click',async()=>{
    const p=prompt.value.trim();await (window.__KAISER_POLLINATIONS_AUTH_READY__||Promise.resolve());const own=window.__KAISER_POLLINATIONS_TOKEN__,instant=false,cost=selected==='video'?CREDIT_CFG.video:CREDIT_CFG.image;if(!p){status.textContent='សូមសរសេរ Prompt ជាមុនសិន។';return}if(!own){status.textContent='សូមចុច Connect AI Account និងអនុញ្ញាត Pollinations ជាមុនសិន។';advBox.hidden=false;advToggle.scrollIntoView({behavior:'smooth',block:'center'});return}
    generate.disabled=true;improve.disabled=true;previewWrap.querySelectorAll('img,video,a').forEach(n=>n.remove());importEditor.hidden=true;currentBlob=null;currentKind=null;currentName='';if(currentUrl){URL.revokeObjectURL(currentUrl);currentUrl=null}
    try{
     const base='https://gen.pollinations.ai/'+(selected==='image'?'image/':'video/')+encodeURIComponent(p);
     const params=new URLSearchParams({model:model.value});if(selected==='video')params.set('duration',duration.value);else{const dims=imageSize.value==='tiktok'?{width:1080,height:1920}:{width:1920,height:1080};params.set('width',String(dims.width));params.set('height',String(dims.height))}
     status.textContent=selected==='image'?'កំពុងបង្កើតរូបភាព...':'កំពុងផ្ញើសំណើបង្កើតវីដេអូ...';
     const picked=await aiRequest(selected,base,params.toString(),own,getInstantKey(),readError);const response=picked.response,usedToken=picked.token;console.info('KAISER AI route:',picked.via);
     let blob;
     if(selected==='video'&&response.status===202){const job=await response.json();if(!job.id)throw new Error('API did not return a job id');blob=await waitForVideoJob(job.id,usedToken)}else blob=await response.blob();
     if(!blob||!blob.size)throw new Error('API returned an empty media file');
     const isImage=selected==='image';if(isImage&&!blob.type.startsWith('image/'))throw new Error('API did not return an image file');if(!isImage&&!blob.type.startsWith('video/'))throw new Error('API did not return an MP4/video file');
     let sizeSuffix='';if(isImage){const dims=imageSize.value==='tiktok'?{width:1080,height:1920,label:'tiktok-1080x1920'}:{width:1920,height:1080,label:'youtube-1920x1080'};status.textContent='កំពុងរៀបចំទំហំរូបភាព '+dims.width+' × '+dims.height+'...';blob=await normalizeImageSize(blob,dims.width,dims.height);sizeSuffix='-'+dims.label}
     currentBlob=blob;currentKind=isImage?'image':'video';const ext=isImage?'png':(blob.type.includes('webm')?'webm':'mp4');currentName='kaiser-ai-'+(isImage?'image'+sizeSuffix+'.':'video.')+ext;
     currentUrl=URL.createObjectURL(blob);const media=document.createElement(isImage?'img':'video');media.className='studio-preview';media.src=currentUrl;if(!isImage){media.controls=true;media.playsInline=true}previewWrap.insertBefore(media,importEditor);
     const download=document.createElement('a');download.href=currentUrl;download.download=currentName;download.className='studio-action';download.textContent='ទាញយក '+(isImage?'រូបភាព':'វីដេអូ');download.style.textAlign='center';download.style.textDecoration='none';previewWrap.insertBefore(download,importEditor);
     importEditor.hidden=false;if(instant){CR.spend(cost);refreshCredit()}
     status.textContent='បានបង្កើត '+(isImage?'រូបភាព':'វីដេអូ')+' រួចរាល់។ អ្នកអាចមើល ទាញយក ឬបញ្ចូលទៅក្នុង Editor បាន។';
    }catch(err){console.error('KAISER AI Studio:',err);status.textContent='បង្កើតមិនបាន៖ '+friendlyAiError(err,instant);}finally{generate.disabled=false;improve.disabled=false}
   });
   refreshCredit=function(){
     const unl=!!window.__KAISER_POLLINATIONS_TOKEN__,left=CR.left(),d=CREDIT_CFG.daily;
     credit.querySelector('.sc-title').textContent=unl?'✓ Pollinations Connected':'🔒 ត្រូវភ្ជាប់ Pollinations';
     credit.querySelector('.sc-reset').textContent=unl?'Authorized':'BYOP · Your account';
     credit.querySelector('.sc-bar i').style.width=(unl?100:0)+'%';
     credit.querySelector('.sc-note').textContent=unl?'ការប្រើប្រាស់អាស្រ័យលើថវិកា និងសិទ្ធិដែលអ្នកបានអនុញ្ញាត។':'ចុច Connect AI Account ខាងលើ ដើម្បីអនុញ្ញាតការបង្កើតរូបភាព និងវីដេអូ។';
     generate.textContent=(selected==='image'?'Generate Image':'Generate Video')+genSuffix(selected)};
    const crTimer=setInterval(()=>{if(!root.isConnected){clearInterval(crTimer);return}refreshCredit()},30000);
    setMode('image');refreshCredit();container.appendChild(root);
  });
 };
 addStudioButton();
})();
