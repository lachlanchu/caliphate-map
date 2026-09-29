/* All geographic coordinates are longitude, latitude. No modern country boundaries
   are used as historical borders. See SOURCES.md for reconstruction decisions. */
'use strict';
const states = [
  {name:'Rashidun',dates:'632–661',extent:'Extent at the end of the period',description:'Rashidun Caliphate, approximate extent by 661',color:'#9E391A'},
  {name:'Umayyad',dates:'661–750',extent:'Approximate greatest extent · early 8th century',description:'Umayyad Caliphate, approximate greatest extent in the early eighth century',color:'#354536'},
  {name:'Abbasid',dates:'786–809',extent:'Under Harun al-Rashid',description:'Abbasid Caliphate under Harun al-Rashid, 786–809',color:'#F2EADB'}
];
const projection = d3.geoMercator().center([34,30]).scale(700).translate([700,300]);
const geoPath = d3.geoPath(projection);
const line = d3.line().curve(d3.curveLinearClosed);
const map = d3.select('#geography');
const labelLayer = d3.select('#map-labels');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let selected = 0, frame = 0, liveShapes, liveColor = states[0].color, targets;
const slider = document.querySelector('#period-slider');
const root = document.documentElement;

// Matching semantic sections preserve the coastline/frontier correspondence
// during interpolation; each section is independently arc-length resampled.
const northernCoasts = [
 [[13,34],[17,34],[20,33.5],[24,32.6],[28,31.8],[32,32.2],[34.2,32],[35.8,36.5]],
 [[-10,36],[-5,36],[1,37.5],[8,38],[12,37.8],[17,34],[20,33.5],[24,32.6],[28,31.8],[32,32.2],[34.2,32],[35.8,36.5]],
 [[7.5,37.5],[10,38],[12,37.8],[17,34],[20,33.5],[24,32.6],[28,31.8],[32,32.2],[34.2,32],[35.8,36.5]]
];
const northernFrontiers = [
 [[35.8,36.5],[38.1,37.4],[40.2,39.5],[43.5,41.5],[46,42],[49.3,41.5],[49,38],[51,36.7],[54,37.3],[57,38.5],[60,37.3],[63.5,36.4]],
 [[35.8,36.5],[37,37.3],[39,39.4],[43.5,41.5],[46,42.4],[49.5,42.5],[49.2,38],[52,37.5],[55,38.5],[57.5,41.5],[60,43.8],[63,43.5],[65.2,42.1],[69,42.4],[72,42.2],[74,41]],
 [[35.8,36.5],[37,37.5],[39.5,39],[43,41.6],[46,42.5],[49.5,42.3],[49,38],[52,37.4],[55,38.4],[58,41.7],[60,43.2],[63,43],[65.5,41.5],[69,42],[72,42],[73.5,40.5]]
];
const easternFrontiers = [
 [[63.5,36.4],[64.8,35],[63,32.5],[62.5,30],[64,28],[65.5,26],[65.5,24.5],[60,24]],
 [[74,41],[72.2,39.8],[70.7,38.8],[70.4,36.5],[69,34.8],[70.8,32],[71.5,30],[70,28.5],[71.5,26.5],[70.2,24],[66,24],[60,24]],
 [[73.5,40.5],[72,39],[70.7,37.8],[70.5,36],[69,34.8],[71,32.5],[71.6,30],[70.8,28],[71.2,26],[69.5,24],[66,24],[60,24]]
];
const arabia = [[60,24],[59.8,21.5],[58,18.5],[54,16],[50,14],[45,12],[43.3,12.7],[42.4,15],[40.5,18],[38.5,21.5],[36,26],[34.6,28.5],[34,28],[35.5,24],[33.3,22],[30.5,22]];
const southernFrontiers = [
 [[30.5,22],[29,25],[27,28],[23,29.7],[19,29.9],[16,31],[13,32],[13,34]],
 [[30.5,22],[28.7,25],[26,27.5],[23,29],[19,29],[15,29.5],[11,30.5],[8,31],[5,32],[2,32],[-2,31],[-6,29.5],[-10,29],[-11,31],[-10,36]],
 [[30.5,22],[28.7,25],[26,27.5],[23,29],[19,29],[15,29.5],[11,30.5],[8.8,32],[7.5,34.5],[7.5,37.5]]
];
// A separate Iberian component avoids a fictitious land bridge across Gibraltar.
const iberia = [[-9.8,36],[-9.7,39],[-9.4,42.1],[-8.2,43],[-6.3,42.7],[-5.5,42.2],[-3.5,42.3],[-1.8,42.7],[.5,42.8],[2.8,43.3],[3.3,43.4],[3.4,42],[3.4,41.7],[1.5,40.3],[.5,39.7],[.2,38.8],[-.5,37.6],[-2,36.5],[-5.5,35.8],[-9.8,36]];
function resample(coords,count){
 const pts=coords.map(projection), lengths=[0];
 for(let i=1;i<pts.length;i++) lengths.push(lengths[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
 return d3.range(count).map(i=>{const dist=lengths.at(-1)*i/(count-1);let k=1;while(k<lengths.length-1&&lengths[k]<dist)k++;const t=(dist-lengths[k-1])/(lengths[k]-lengths[k-1]||1);return [pts[k-1][0]+(pts[k][0]-pts[k-1][0])*t,pts[k-1][1]+(pts[k][1]-pts[k-1][1])*t];});
}
function polygon(coords){return line(coords.map(projection));}
function addText(parent,coord,text,cls){const p=projection(coord);return parent.append('text').attr('x',p[0]).attr('y',p[1]).attr('class',cls).attr('text-anchor','middle').text(text);}
function drawLabels(){
 addText(labelLayer,[-12,29],'ATLANTIC','sea-label').attr('transform',`rotate(-75,${projection([-12,29]).join(',')})`);
 addText(labelLayer,[17,36],'Mediterranean Sea','sea-label');
 addText(labelLayer,[35,44.2],'Black Sea','sea-label');
 addText(labelLayer,[51.5,43],'Caspian Sea','sea-label').style('font-size','11px').attr('transform',`rotate(-70,${projection([51.5,43]).join(',')})`);
 addText(labelLayer,[63,16],'Arabian Sea','sea-label');
 addText(labelLayer,[38,20],'Red Sea','sea-label').style('font-size','10px').attr('transform',`rotate(62,${projection([38,20]).join(',')})`);
 for(const [coord,text] of [[[-3,39],'IBERIA'],[[11,28],'NORTH AFRICA'],[[57,32],'PERSIA'],[[63,45],'CENTRAL ASIA']])addText(labelLayer,coord,text,coord[1]>38?'region-label northern-region':'region-label');
 const cities=[['mecca',[39.826,21.422]],['medina',[39.611,24.47]],['damascus',[36.277,33.513]],['baghdad',[44.367,33.315]]];
 for(const [id,coord] of cities){const p=projection(coord),g=labelLayer.append('g').attr('id',id).attr('class','explorable city-feature').attr('data-feature-id',id);
 g.append('circle').attr('class','city-ring').attr('cx',p[0]).attr('cy',p[1]).attr('r',5);
 g.append('circle').attr('class','city-dot').attr('cx',p[0]).attr('cy',p[1]).attr('r',2);}
}

function paint(shapes,color){
 liveShapes=shapes;liveColor=color;
 d3.select('#territory-main').attr('d',line(shapes[0])).attr('fill',color).attr('stroke',color);
 d3.select('#territory-iberia').attr('d',line(shapes[1])).attr('fill',color).attr('stroke',color);
 d3.select('#territory-main-ink').attr('d',line(shapes[0]));
 d3.select('#territory-iberia-ink').attr('d',line(shapes[1]));
 root.style.setProperty('--accent',color);
 root.style.setProperty('--accent-ink',d3.interpolateRgb(color,'#F2EADB')(.65));
}
function selectState(index,animate=true){
 selected=index;const state=states[index];slider.value=index;slider.setAttribute('aria-valuetext',`${state.name}, ${state.dates}, ${state.extent}`);
 document.querySelectorAll('.node').forEach((el,i)=>{el.classList.toggle('active',i===index);el.setAttribute('aria-pressed',String(i===index));});
 document.querySelector('#state-number').textContent=`0${index+1} / 03`;
 document.querySelector('#state-title').textContent=state.name+' Caliphate';
 document.querySelector('#state-dates').textContent=state.dates;
 document.querySelector('#state-extent').textContent=state.extent;
 document.querySelector('#map-title').textContent=state.description;
 document.querySelector('#slider-progress').style.width=`${index*50}%`;
 d3.select('#baghdad').classed('baghdad-muted',index!==2);
 window.dispatchEvent(new CustomEvent('caliphate-change',{detail:{index}}));
 if(!targets)return;
 cancelAnimationFrame(frame);
 const to=targets[index];
 if(!animate||reducedMotion.matches){paint(to,state.color);document.querySelector('#map').dataset.transitioning='false';return;}
 const from=liveShapes.map(s=>s.map(p=>p.slice())),interpolateColor=d3.interpolateRgb(liveColor,state.color),start=performance.now();
 document.querySelector('#map').dataset.transitioning='true';
 function tick(now){const progress=Math.min(1,(now-start)/900),t=d3.easeCubicInOut(progress);
 paint(from.map((shape,s)=>shape.map((p,i)=>[p[0]+(to[s][i][0]-p[0])*t,p[1]+(to[s][i][1]-p[1])*t])),interpolateColor(t));
 if(progress<1)frame=requestAnimationFrame(tick);else{paint(to,state.color);document.querySelector('#map').dataset.transitioning='false';}
 }frame=requestAnimationFrame(tick);
}
async function init(){
 try{
 const [land,rivers,lakes]=await Promise.all(['land','rivers','lakes'].map(name=>fetch(`assets/${name}.geojson`).then(r=>{if(!r.ok)throw new Error(`Cannot load ${name}`);return r.json();})));
 const landD=geoPath(land);
 d3.select('#land-clip').append('path').attr('d',landD);
 map.append('rect').attr('x',-150).attr('y',-75).attr('width',1700).attr('height',800).attr('fill','#2D433A');
 map.append('path').attr('class','land').attr('d',landD);
 // Uneven sage pigment uses the existing land silhouette, not political borders.
 map.append('path').attr('class','vegetation-pigment').attr('mask','url(#vegetation-wash)').attr('d',landD);
 map.append('path').attr('class','graticule').attr('d',geoPath(d3.geoGraticule().step([10,10])()));
 const territory=map.append('g').attr('clip-path','url(#land-clip)').attr('mask','url(#ink-density)');
 territory.append('path').attr('id','territory-main-ink').attr('class','territory-ink');
 territory.append('path').attr('id','territory-iberia-ink').attr('class','territory-ink');
 territory.append('path').attr('id','territory-main').attr('class','territory');
 territory.append('path').attr('id','territory-iberia').attr('class','territory');
 const physical=map.append('g').attr('clip-path','url(#land-clip)');
 const sahara=[[-12,27],[-5,31],[8,31],[20,28],[28,25],[29,21],[20,18],[2,18],[-10,21]];
 const empty=[[44,21.7],[48,23],[53,22.8],[56,20],[53,17.2],[48,18],[44,20]];
 [sahara,empty].forEach((c,i)=>physical.append('path').attr('class','explorable desert').attr('data-feature-id',['sahara','empty-quarter'][i]).attr('d',polygon(c)));
 // Nile: narrow corridor widening only at the delta; one combined region.
 const nileFarm=[[32.72,24],[32.64,25.1],[32.58,25.7],[32.83,26.1],[32.25,26.65],[31.62,27.3],[31.15,28],[30.55,29.2],[30.85,30.05],[29.85,31.2],[30.4,31.55],[31.25,31.6],[32.25,31.25],[31.25,30],[30.94,29.2],[31.48,28],[31.95,27.3],[32.55,26.9],[33.1,26.2],[32.9,25.5],[32.96,24]];
 const mesopotamia=[[43.95,33.5],[44.55,33.5],[45.35,32.9],[46.2,32.5],[47.15,31.8],[47.9,30.7],[48.1,30.1],[47.35,30.25],[46.25,30.9],[45.2,31.45],[44.35,32],[43.6,32.6]];
 [nileFarm,mesopotamia].forEach((c,i)=>physical.append('path').attr('class','explorable farm').attr('data-feature-id',['nile-agriculture','mesopotamia'][i]).attr('d',polygon(c)));
 map.append('path').attr('class','lake').attr('d',geoPath(lakes));
 map.selectAll('.river').data(rivers.features).join('path').attr('class','explorable river').attr('data-feature-id',d=>d.properties.name.toLowerCase()).attr('data-river',d=>d.properties.name).attr('d',geoPath);
 // Both source photographs share one stable map-space extent across every layer.
 // Labels and city markers are drawn afterward to keep their ink clean.
 const material=map.append('g').attr('id','map-material').attr('mask','url(#weathering-strength)').attr('pointer-events','none');
 material.append('image').attr('class','paper-fibers').attr('href','assets/textures/aged-paper-scan.jpg').attr('x',-150).attr('y',-75).attr('width',1700).attr('height',800).attr('preserveAspectRatio','xMidYMid slice');
 material.append('image').attr('class','paper-wear').attr('href','assets/textures/paper-wear.jpg').attr('x',-150).attr('y',-75).attr('width',1700).attr('height',800).attr('preserveAspectRatio','none');
 drawLabels();
 const iberiaPoints=resample(iberia,150),gibraltar=projection([-5.6,35.95]);
 targets=states.map((_,i)=>[
 [northernCoasts[i],northernFrontiers[i],easternFrontiers[i],arabia,southernFrontiers[i]].flatMap(section=>resample(section,75)),
 i===1?iberiaPoints:iberiaPoints.map(()=>gibraltar.slice())
 ]);
 selectState(selected,false);
 document.querySelector('#map').dataset.ready='true';
 window.dispatchEvent(new Event('map-ready'));
 }catch(error){document.querySelector('#load-error').hidden=false;console.error(error);window.dispatchEvent(new Event('map-error'));}
}
let pointerDragging=false;
slider.addEventListener('pointerdown',()=>{pointerDragging=true;});
slider.addEventListener('input',()=>{if(!pointerDragging)selectState(Number(slider.value));});
slider.addEventListener('change',()=>selectState(Number(slider.value)));
slider.addEventListener('pointerup',()=>{pointerDragging=false;selectState(Number(slider.value));});
slider.addEventListener('pointercancel',()=>{pointerDragging=false;slider.value=selected;});
slider.addEventListener('blur',()=>{pointerDragging=false;});
// Buttons are native keyboard-accessible controls as well as pointer targets.
document.querySelectorAll('.node').forEach(button=>button.addEventListener('click',()=>selectState(Number(button.dataset.state))));
reducedMotion.addEventListener('change',()=>{if(targets&&reducedMotion.matches)selectState(selected,false);});
const dialog=document.querySelector('#sources-dialog');
document.querySelector('#sources-open').addEventListener('click',()=>dialog.showModal());
document.querySelector('#sources-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
init();
