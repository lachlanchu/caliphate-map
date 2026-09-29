/* Interaction-only layer. Territorial control points, projection and morphing
   remain in app.js; all pan movement is one shared SVG parent transform. */
'use strict';
(() => {
 const svg=document.querySelector('#map'),pan=document.querySelector('#map-pan');
 const intro=document.querySelector('#intro'),enter=document.querySelector('#enter');
 const experience=document.querySelector('#experience'),main=document.querySelector('main');
 const banner=document.querySelector('#feature-banner'),flag=document.querySelector('#feature-flag');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const features=[
  {id:'mecca',name:'Mecca',type:'City',coord:[39.826,21.422],fact:'Home of the Kaaba and the central destination of Islamic pilgrimage.'},
  {id:'medina',name:'Medina',type:'City',coord:[39.611,24.47],fact:'Muhammad’s migration here in 622 established a new center for the early Muslim community.'},
  {id:'damascus',name:'Damascus',type:'City',coord:[36.277,33.513],fact:'The imperial capital of the Umayyad caliphate.'},
  {id:'baghdad',name:'Baghdad',type:'City',coord:[44.367,33.315],fact:'Founded in 762 by al-Mansur as the Abbasid capital.'},
  {id:'nile',name:'Nile',type:'River',fact:'Its floodwaters and irrigation sustained agriculture in the Egyptian valley and delta.'},
  {id:'tigris',name:'Tigris',type:'River',fact:'Flowing through Baghdad, it forms the eastern river of the Mesopotamian pair.'},
  {id:'euphrates',name:'Euphrates',type:'River',fact:'Flowing through Syria and Iraq, it supported settlement and irrigation in Mesopotamia.'},
  {id:'indus',name:'Indus',type:'River',fact:'The principal river of Sindh, near the eastern reach of the early caliphates.'},
  {id:'sahara',name:'Sahara',type:'Desert',coord:[9,24],fact:'The vast desert south of North Africa’s Mediterranean settlement belt.'},
  {id:'empty-quarter',name:'Rubʿ al-Khali',type:'Desert',coord:[50.5,20.5],fact:'The Empty Quarter, a great sand desert in the southern Arabian Peninsula.'},
  {id:'nile-agriculture',name:'Nile Valley and Delta',type:'Agricultural area',coord:[31.05,30.3],fact:'An agricultural corridor sustained by the Nile within an otherwise arid landscape.'},
  {id:'mesopotamia',name:'Lower Mesopotamia',type:'Agricultural area',coord:[45.6,32],fact:'The irrigated Tigris–Euphrates plain of central and southern Iraq.'}
 ];
 let active=null,source=null,period=0,entered=false,entering=false,prepared=false,contentAnimation=null;
 let gesture=null,dragging=false,blockHover=false,hideTimer=0,flagFrame=0,entryTimer=0;
 const offset={x:0,y:0},limits={x:120,y:55};
 let zoom=1,pinch=null;
 const touches=new Map();
 const byId=new Map(features.map(f=>[f.id,f]));
 function description(f){return f.fact+(f.id==='baghdad'&&period!==2?' Its founding lies after the displayed period.':'');}
 function updateBanner(f){
  contentAnimation?.cancel();
  if(banner.classList.contains('is-visible'))contentAnimation=document.querySelector('.banner-content').animate([{opacity:.55},{opacity:1}],{duration:motion.matches?100:180,easing:'ease-out'});
  document.querySelector('#feature-name').textContent=f.name;
  document.querySelector('#feature-type').textContent=f.type;
  document.querySelector('#feature-description').textContent=description(f);
  f.target.setAttribute('aria-label',`${f.name}. ${f.type}. ${description(f)}`);
 }
 function show(id,origin='hover'){
  if(!entered||dragging||(blockHover&&origin==='hover'))return;
  clearTimeout(hideTimer);const f=byId.get(id);if(!f)return;
  if(active===f){source=origin;return;}
  if(active)active.visuals.forEach(el=>el.classList.remove('is-active'));
  active=f;source=origin;updateBanner(f);
  f.visuals.forEach(el=>el.classList.add('is-active'));
  banner.classList.add('is-visible');banner.setAttribute('aria-hidden','false');banner.dataset.feature=id;
  flag.classList.add('reset-flag');flag.classList.remove('is-visible');flag.setAttribute('transform',`translate(${f.anchor.join(' ')})`);flag.dataset.feature=id;
  // A single flag instance moves between anchors; its cloth emerges above y=0.
  cancelAnimationFrame(flagFrame);flag.getBoundingClientRect();
  flagFrame=requestAnimationFrame(()=>{flag.classList.remove('reset-flag');flag.classList.add('is-visible');});
 }
 function dismiss(immediate=false){
  clearTimeout(hideTimer);cancelAnimationFrame(flagFrame);contentAnimation?.cancel();
  if(active)active.visuals.forEach(el=>el.classList.remove('is-active'));
  active=null;source=null;banner.classList.remove('is-visible');banner.setAttribute('aria-hidden','true');
  flag.classList.remove('is-visible');delete banner.dataset.feature;
  if(immediate){flag.style.visibility='hidden';requestAnimationFrame(()=>flag.style.visibility='');}
 }
 function delayDismiss(){clearTimeout(hideTimer);hideTimer=setTimeout(()=>dismiss(),80);}
 function targetAt(event){return event.target.closest?.('.feature-target');}
 function point(event){return new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());}
 function applyPan(){
  // Keep the same geographic coverage at the viewport edges at every scale.
  offset.x=Math.max(1400-(1400+limits.x)*zoom,Math.min(limits.x*zoom,offset.x));
  offset.y=Math.max(650-(650+limits.y)*zoom,Math.min(limits.y*zoom,offset.y));
  pan.setAttribute('transform',`translate(${offset.x} ${offset.y}) scale(${zoom})`);
  svg.dataset.panX=offset.x;svg.dataset.panY=offset.y;svg.dataset.zoom=zoom;
  document.querySelector('#zoom-level').textContent=`${Math.round(zoom*100)}%`;
  document.querySelector('#zoom-out').disabled=zoom<=1;
  document.querySelector('#zoom-in').disabled=zoom>=4;
 }
 function setZoom(next,anchor={x:700,y:325}){
  if(!entered)return;
  const clamped=Math.max(1,Math.min(4,next));if(clamped===zoom)return;
  const ratio=clamped/zoom;
  offset.x=anchor.x-(anchor.x-offset.x)*ratio;offset.y=anchor.y-(anchor.y-offset.y)*ratio;
  zoom=clamped;dismiss(true);blockHover=true;applyPan();
 }
 function resetView(){if(!entered)return;zoom=1;offset.x=0;offset.y=0;dismiss(true);blockHover=true;applyPan();}
 document.querySelector('#zoom-in').addEventListener('click',()=>setZoom(zoom*1.4));
 document.querySelector('#zoom-out').addEventListener('click',()=>setZoom(zoom/1.4));
 document.querySelector('#zoom-reset').addEventListener('click',resetView);
 svg.addEventListener('wheel',event=>{
  if(!entered||gesture||pinch)return;
  event.preventDefault();const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?650:1);
  setZoom(zoom*Math.exp(-Math.max(-120,Math.min(120,delta))*.0025),point(event));
 },{passive:false});
 svg.addEventListener('keydown',event=>{
  if(event.ctrlKey||event.metaKey||event.altKey)return;
  if(['+','=','-','−','0'].includes(event.key)){
   event.preventDefault();if(event.key==='0')resetView();else setZoom(zoom*(['-','−'].includes(event.key)?1/1.4:1.4));
  }
 });
 function touchPair(){const [a,b]=[...touches.values()];return {center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},distance:Math.hypot(a.x-b.x,a.y-b.y)};}

 function riverAnchor(paths){
  // Take the arc-length midpoint of the longest visible run, not a geographic
  // centroid (which can stand off the river). Disconnected segments stay separate.
  let best={length:0,path:null,start:0,end:0};
  for(const path of paths){const total=path.getTotalLength(),step=total/600;let start=null,previous=null;
   for(let i=0;i<=600;i++){const distance=i*step,p=path.getPointAtLength(distance);
    const visible=p.x>100&&p.x<1300&&p.y>85&&p.y<545;
    const jump=previous&&Math.hypot(p.x-previous.x,p.y-previous.y)>step*3+2;
    if((!visible||jump)&&start!==null){const end=Math.max(start,distance-step);if(end-start>best.length)best={length:end-start,path,start,end};start=null;}
    if(visible&&start===null)start=distance;
    if(i===600&&start!==null&&distance-start>best.length)best={length:distance-start,path,start,end:distance};
    previous=p;
   }
  }
  if(!best.path)throw new Error('No visible river segment');
  const p=best.path.getPointAtLength((best.start+best.end)/2);return [p.x,p.y];
 }
 function buildTargets(){
  const targetLayer=d3.select('#hit-targets');
  // SVG paint order is also hit-test priority, from broadest to most specific.
  for(const type of ['Desert','Agricultural area','River','City']){
   const layer=targetLayer.append('g').attr('data-target-layer',type).attr('clip-path',['Desert','Agricultural area'].includes(type)?'url(#land-clip)':null);
   for(const f of features.filter(f=>f.type===type)){
    f.visuals=[...document.querySelectorAll(`.explorable[data-feature-id="${f.id}"]`)];
    f.anchor=f.coord?projection(f.coord):riverAnchor(f.visuals);
    const g=layer.append('g').attr('class','feature-target').attr('id',`hit-${f.id}`).attr('data-id',f.id).attr('data-type',type).attr('tabindex',0).attr('role','button').attr('aria-label',`${f.name}. ${type}. ${description(f)}`);
    f.target=g.node();
    if(type==='City')g.append('circle').attr('class','hit-city').attr('cx',f.anchor[0]).attr('cy',f.anchor[1]).attr('r',14);
    else for(const visual of f.visuals)g.append('path').attr('d',visual.getAttribute('d')).attr('class',type==='River'?'hit-river':'hit-area');
    g.append('circle').attr('class','focus-halo').attr('cx',f.anchor[0]).attr('cy',f.anchor[1]).attr('r',17);
    g.on('pointerenter',event=>{if(event.pointerType==='mouse'&&!gesture)show(f.id);});
    g.on('pointerleave',event=>{if(event.pointerType==='mouse'&&source==='hover')delayDismiss();});
    g.on('focus',()=>show(f.id,'focus'));
    g.on('blur',()=>{if(source==='focus')delayDismiss();});
    g.on('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();show(f.id,'focus');}if(event.key==='Escape'){dismiss();}});
   }
  }
 }
 svg.addEventListener('pointerdown',event=>{
  if(!entered||event.button!==0)return;
  if(event.pointerType==='touch'){
   touches.set(event.pointerId,point(event));
   if(touches.size>=2){
    if(!pinch){const pair=touchPair();pinch={distance:Math.max(1,pair.distance),zoom,world:{x:(pair.center.x-offset.x)/zoom,y:(pair.center.y-offset.y)/zoom}};gesture=null;dragging=true;dismiss(true);svg.classList.add('is-panning');}
    svg.setPointerCapture(event.pointerId);
    for(const id of touches.keys())if(!svg.hasPointerCapture(id))svg.setPointerCapture(id);
    return;
   }
  }
  if(gesture)return;
  const p=point(event);gesture={id:event.pointerId,x:event.clientX,y:event.clientY,start:p,offset:{...offset},target:targetAt(event)?.dataset.id};
 });
 svg.addEventListener('pointermove',event=>{
  if(touches.has(event.pointerId))touches.set(event.pointerId,point(event));
  if(pinch){
   event.preventDefault();const pair=touchPair();zoom=Math.max(1,Math.min(4,pinch.zoom*pair.distance/pinch.distance));
   offset.x=pair.center.x-pinch.world.x*zoom;offset.y=pair.center.y-pinch.world.y*zoom;applyPan();return;
  }
  if(!gesture){if(blockHover&&event.pointerType==='mouse'){blockHover=false;const target=targetAt(event);if(target)show(target.dataset.id);}return;}
  if(event.pointerId!==gesture.id)return;
  if(!dragging&&Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)>5){
   dragging=true;dismiss(true);svg.classList.add('is-panning');svg.setPointerCapture(event.pointerId);
   if(document.activeElement?.classList.contains('feature-target'))document.activeElement.blur();
  }
  if(dragging){event.preventDefault();const p=point(event);offset.x=gesture.offset.x+p.x-gesture.start.x;offset.y=gesture.offset.y+p.y-gesture.start.y;applyPan();}
 });
 function finishGesture(event,cancel=false){
  touches.delete(event.pointerId);
  if(pinch){
   if(touches.size<2){pinch=null;dragging=false;blockHover=true;svg.classList.remove('is-panning');}
   if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);
   return;
  }
  if(!gesture||event.pointerId!==gesture.id)return;
  const wasDrag=dragging,id=gesture.target;gesture=null;dragging=false;svg.classList.remove('is-panning');
  if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);
  if(wasDrag){blockHover=true;return;}
  if(cancel)return;
  if(id)show(id,event.pointerType==='mouse'?'hover':'touch');else dismiss();
 }
 svg.addEventListener('pointerup',event=>finishGesture(event));
 svg.addEventListener('pointercancel',event=>finishGesture(event,true));
 svg.addEventListener('lostpointercapture',event=>{if(gesture)finishGesture(event,true);});
 // A sub-threshold mouse gesture can leave the SVG before capture is needed.
 window.addEventListener('pointerup',event=>{if(gesture)finishGesture(event,true);});
 svg.addEventListener('pointerleave',()=>{if(!dragging&&source==='hover')delayDismiss();});
 svg.addEventListener('keydown',event=>{if(event.key==='Escape')dismiss();});
 window.addEventListener('blur',()=>{gesture=null;pinch=null;touches.clear();dragging=false;svg.classList.remove('is-panning');dismiss();});
 window.addEventListener('caliphate-change',event=>{period=event.detail.index;const f=byId.get('baghdad');if(f.target)f.target.setAttribute('aria-label',`${f.name}. City. ${description(f)}`);if(active?.id==='baghdad')updateBanner(active);});
 function finishEntry(){
  clearTimeout(entryTimer);experience.classList.remove('entering','reduced-entering','revealed');experience.classList.add('entered');experience.style.clipPath='';
  intro.hidden=true;intro.inert=true;main.inert=false;main.removeAttribute('aria-hidden');document.body.classList.remove('intro-pending');entered=true;entering=false;
  main.focus({preventScroll:true});document.body.dataset.entered='true';
 }
 function beginEntry(){
  if(!prepared||entered||entering)return;entering=true;intro.classList.add('leaving');intro.inert=true;
  if(motion.matches){experience.classList.add('reduced-entering');requestAnimationFrame(()=>experience.classList.add('revealed'));entryTimer=setTimeout(finishEntry,160);}
  else{experience.classList.add('entering');experience.getBoundingClientRect();experience.style.clipPath=`circle(${Math.ceil(Math.hypot(innerWidth,innerHeight)/2)+2}px at 50vw 50vh)`;entryTimer=setTimeout(finishEntry,1080);}
 }
 enter.addEventListener('click',beginEntry);
 addEventListener('resize',()=>{if(entering&&!motion.matches)experience.style.clipPath=`circle(${Math.ceil(Math.hypot(innerWidth,innerHeight)/2)+2}px at 50vw 50vh)`;});
 motion.addEventListener('change',()=>{if(entering&&motion.matches)finishEntry();});
 document.querySelector('#sources-open').addEventListener('click',()=>{dismiss();});
 function loadingError(){const status=document.querySelector('#intro-status');status.textContent='The map could not load. Please reload using the local preview server.';status.classList.add('load-failed');}
 async function prepare(){
  if(prepared)return;
  try{buildTargets();applyPan();await Promise.all(['aged-paper-scan.jpg','paper-wear.jpg'].map(name=>{const image=new Image();image.src='assets/textures/'+name;return image.decode();}));prepared=true;enter.disabled=false;document.querySelector('#intro-status').textContent='Map ready';document.body.dataset.interactionsReady='true';}
  catch(error){loadingError();console.error(error);}
 }
 window.addEventListener('map-error',loadingError);
 if(svg.dataset.ready==='true')prepare();else window.addEventListener('map-ready',prepare,{once:true});
})();
