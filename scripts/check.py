"""Real-browser regression checks. Run against the local server with Playwright + Chrome."""
import os,re
from playwright.sync_api import sync_playwright
URL=os.environ.get('MAP_URL','http://127.0.0.1:8000')
CHROME=os.environ.get('CHROME_PATH','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
IDS=['mecca','medina','damascus','baghdad','nile','tigris','euphrates','indus','sahara','empty-quarter','nile-agriculture','mesopotamia']

def ready(page):
 page.goto(URL);page.wait_for_selector('body[data-interactions-ready="true"]')
def enter(page):
 page.locator('#enter').click();page.wait_for_selector('body[data-entered="true"]')
def anchor(page,id):
 return page.locator('#hit-'+id+' .focus-halo').evaluate('(el)=>{const p=new DOMPoint(+el.getAttribute("cx"),+el.getAttribute("cy")).matrixTransform(el.getScreenCTM());return {x:p.x,y:p.y}}')
def hitpoint(page,id):
 return page.locator('#hit-'+id).evaluate('''el=>{
 const halo=el.querySelector('.focus-halo'),a=new DOMPoint(+halo.getAttribute('cx'),+halo.getAttribute('cy')).matrixTransform(el.getScreenCTM());
 const matches=(x,y)=>[[0,0],[.5,0],[-.5,0],[0,.5],[0,-.5]].every(([dx,dy])=>document.elementFromPoint(x+dx,y+dy)?.closest('.feature-target')===el);
 for(let r=0;r<100;r+=2)for(let i=0;i<24;i++){let x=a.x+r*Math.cos(i*Math.PI/12),y=a.y+r*Math.sin(i*Math.PI/12);if(matches(x,y))return {x,y};}
 const b=el.getBoundingClientRect();for(let y=Math.max(100,b.top);y<Math.min(innerHeight-150,b.bottom);y+=3)for(let x=Math.max(1,b.left);x<Math.min(innerWidth-1,b.right);x+=3)if(matches(x,y))return {x,y};
 throw new Error('No hit point: '+el.id);
 }''')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=CHROME,headless=True)
 page=browser.new_page(viewport={'width':1366,'height':768},device_scale_factor=1)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 ready(page)
 assert page.locator('main').evaluate('(e)=>e.inert')
 assert page.locator('#experience').evaluate('(e)=>getComputedStyle(e).clipPath').startswith('circle(0px at ')
 assert page.locator('body').evaluate('(e)=>getComputedStyle(e).backgroundColor')=='rgb(24, 40, 32)'
 page.mouse.move(830,350);assert page.locator('body').evaluate('(e)=>getComputedStyle(e).cursor')!='none'
 page.screenshot(path='/tmp/caliphate-introduction.png')
 page.locator('#enter').click();page.wait_for_timeout(420)
 clip=page.locator('#experience').evaluate('(e)=>getComputedStyle(e).clipPath')
 assert clip.startswith('circle(') and '0px at' not in clip,clip
 page.screenshot(path='/tmp/caliphate-circular-reveal.png')
 page.wait_for_selector('body[data-entered="true"]')
 assert page.locator('#intro').evaluate('(e)=>e.hidden && e.inert')
 assert not page.locator('main').evaluate('(e)=>e.inert')
 assert page.locator('.feature-target').count()==12
 assert page.locator('.feature-label,.leader').count()==0
 assert page.locator('#map-labels .sea-label').count()==6
 assert page.locator('#feature-banner').evaluate('(e)=>getComputedStyle(e).pointerEvents')=='none'
 assert page.locator('#feature-flag').evaluate('(e)=>getComputedStyle(e).pointerEvents')=='none'
 page.mouse.move(1300,700);page.wait_for_timeout(400)
 page.screenshot(path='/tmp/caliphate-unlabeled-map.png')
 # Every feature has a genuine pointer hit and the same keyboard information.
 for id in IDS:
  at=hitpoint(page,id);page.mouse.move(**at);page.wait_for_timeout(340)
  assert page.locator('#feature-banner').get_attribute('data-feature')==id,id
  assert page.locator('#feature-banner').get_attribute('aria-hidden')=='false'
  assert page.locator('#feature-flag').get_attribute('data-feature')==id
  assert page.locator('#feature-flag.is-visible').count()==1
  flag_position=page.locator('#feature-flag').get_attribute('transform')
  page.mouse.move(at['x']+.1,at['y']+.1)
  assert page.locator('#feature-flag').get_attribute('transform')==flag_position,(id,page.locator('#feature-banner').get_attribute('data-feature'))
  page.mouse.move(1300,700);page.wait_for_timeout(100)
  assert page.locator('#feature-banner').get_attribute('aria-hidden')=='true'
  page.locator('#hit-'+id).focus();page.wait_for_timeout(30)
  assert page.locator('#feature-banner').get_attribute('data-feature')==id
  assert page.locator('#feature-description').inner_text() in page.locator('#hit-'+id).get_attribute('aria-label')
  page.keyboard.press('Escape');assert page.locator('#feature-banner').get_attribute('aria-hidden')=='true'
  page.locator('#hit-'+id).evaluate('(e)=>e.blur()')
 print('PASS: all 12 features on real hover and keyboard focus; one anchored flag/banner.')
 # Overlap priority: city > river > cultivation > desert.
 for id in ['mecca','medina','damascus','baghdad']:
  at=anchor(page,id)
  assert page.evaluate('(p)=>document.elementFromPoint(p.x,p.y).closest(".feature-target").dataset.id',at)==id
 overlap=page.evaluate('''()=>{
 const results={};for(const id of ['nile','tigris','euphrates']){
 for(const path of document.querySelectorAll(`[data-feature-id="${id}"].river`)){
 const n=path.getTotalLength();for(let l=0;l<n;l+=2){const p=path.getPointAtLength(l),s=new DOMPoint(p.x,p.y).matrixTransform(path.getScreenCTM());
 const all=document.elementsFromPoint(s.x,s.y).map(e=>e.closest('.feature-target')).filter(Boolean);
 if(all.some(e=>e.dataset.type==='Agricultural area')&&all[0]?.dataset.type!=='City')results.river=all[0].dataset.type;
 }}}
 const farm=document.querySelector('#hit-nile-agriculture .hit-area'),r=farm.getBoundingClientRect();
 for(let x=r.left;x<r.right;x+=2)for(let y=r.top;y<r.bottom;y+=2){const all=document.elementsFromPoint(x,y).map(e=>e.closest('.feature-target')).filter(Boolean);if(all[0]?.dataset.type==='Agricultural area'&&all.some(e=>e.dataset.type==='Desert'))results.farm=all[0].dataset.type;}
 return results;
 }''')
 assert overlap.get('river')=='River',overlap
 assert page.locator('[data-target-layer]').evaluate_all('(els)=>els.map(e=>e.dataset.targetLayer)')==['Desert','Agricultural area','River','City']
 # Bounding and threshold: a tiny movement does not pan; a drag dismisses.
 at=hitpoint(page,'mecca');page.mouse.move(**at);page.mouse.down();page.mouse.move(at['x']+2,at['y']+1);page.mouse.up()
 assert page.locator('#map').get_attribute('data-pan-x')=='0'
 page.mouse.move(**at);page.mouse.down();page.mouse.move(at['x']+30,at['y']+20,steps=4)
 assert page.locator('#feature-banner').get_attribute('aria-hidden')=='true'
 page.mouse.move(1300,650,steps=10);page.mouse.up()
 assert float(page.locator('#map').get_attribute('data-pan-x'))==120
 assert float(page.locator('#map').get_attribute('data-pan-y'))==55
 transform=page.locator('#map-pan').get_attribute('transform')
 assert page.locator('#map-viewport').get_attribute('transform') is None
 assert page.locator('#feature-banner').evaluate('(e)=>!e.closest("#map-pan")')
 paths=[]
 for i in range(3):
  page.locator(f'.node[data-state="{i}"]').click();page.wait_for_timeout(1020)
  assert page.locator('#map-pan').get_attribute('transform')==transform
  paths.append(page.locator('#territory-main').get_attribute('d'))
  assert page.locator('#baghdad').evaluate('(e)=>e.classList.contains("baghdad-muted")')==(i!=2)
 assert len(set(paths))==3
 page.locator('.node[data-state="0"]').click();page.wait_for_timeout(1000)
 before=page.locator('#territory-main').get_attribute('d');color=page.locator('#territory-main').get_attribute('fill')
 page.locator('.node[data-state="1"]').click();page.wait_for_timeout(350)
 mid=page.locator('#territory-main').get_attribute('d');assert mid!=before
 assert page.locator('#territory-main').get_attribute('fill')!=color
 page.wait_for_timeout(750);assert mid!=page.locator('#territory-main').get_attribute('d')
 # Hover stays suppressed until the next mouse movement after a drag.
 page.mouse.move(650,350);page.mouse.down();page.mouse.move(40,110,steps=10);page.mouse.up()
 assert float(page.locator('#map').get_attribute('data-pan-x'))==-120
 assert float(page.locator('#map').get_attribute('data-pan-y'))==-55
 page.mouse.move(1000,550)
 page.locator('#hit-baghdad').focus();assert 'after the displayed period' in page.locator('#feature-description').inner_text()
 page.locator('.node[data-state="2"]').click();page.locator('#hit-baghdad').focus();assert 'after the displayed period' not in page.locator('#feature-description').inner_text()
 page.wait_for_timeout(1100);page.screenshot(path='/tmp/caliphate-panned-feature.png')
 # Timeline keyboard and drag leave map pan unchanged.
 transform=page.locator('#map-pan').get_attribute('transform')
 page.locator('#period-slider').focus();page.keyboard.press('Home');page.wait_for_timeout(1000)
 assert page.locator('.node[data-state="0"]').get_attribute('aria-pressed')=='true'
 track=page.locator('#period-slider').bounding_box();page.mouse.move(track['x']+10,track['y']+12);page.mouse.down();page.mouse.move(track['x']+track['width']/2,track['y']+12,steps=8);page.mouse.up();page.wait_for_timeout(1000)
 assert page.locator('.node[data-state="1"]').get_attribute('aria-pressed')=='true'
 assert page.locator('#map-pan').get_attribute('transform')==transform
 page.locator('#sources-open').click();assert page.locator('dialog').is_visible();page.keyboard.press('Escape')
 assert page.locator('#sources-open').evaluate('(e)=>e===document.activeElement')
 for w,h in [(1366,768),(1440,900),(1280,720)]:
  page.set_viewport_size({'width':w,'height':h});page.locator('#hit-mesopotamia').focus();page.wait_for_timeout(400)
  assert page.evaluate('document.documentElement.scrollHeight<=innerHeight && document.documentElement.scrollWidth<=innerWidth')
  assert page.locator('#feature-banner').bounding_box()['y']+page.locator('#feature-banner').bounding_box()['height']<page.locator('.timeline').bounding_box()['y']
 print('PASS: overlap priorities, bounded pan, threshold, timeline isolation, and morphing after pan.')
 # Reduced motion: short entrance, instantaneous state, no waving fabric.
 reduced=browser.new_page(viewport={'width':1366,'height':768},reduced_motion='reduce')
 ready(reduced);enter(reduced)
 assert reduced.locator('.scroll-curl').evaluate('(e)=>getComputedStyle(e).transitionDuration')=='0s'
 assert reduced.locator('.scroll-sheet').evaluate('(e)=>getComputedStyle(e).clipPath')=='none'
 reduced.locator('.node[data-state="2"]').click();assert reduced.locator('#map').get_attribute('data-transitioning')=='false'
 # Touch taps and an actual CDP touch drag, plus coarse-pointer native cursor.
 mobile=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
 mobile.on('pageerror',lambda e:errors.append(str(e)));ready(mobile);mobile.locator('#enter').tap();mobile.wait_for_selector('body[data-entered="true"]')
 at=hitpoint(mobile,'mecca');mobile.touchscreen.tap(**at);assert mobile.locator('#feature-banner').get_attribute('data-feature')=='mecca'
 assert mobile.locator('body').evaluate('(e)=>getComputedStyle(e).cursor')!='none'
 mobile.wait_for_timeout(400)
 assert mobile.locator('#feature-banner').evaluate('(e)=>getComputedStyle(e).opacity')=='1'
 mobile.screenshot(path='/tmp/caliphate-touch-feature.png')
 bounds=mobile.locator('#map').bounding_box();x,y=bounds['x']+20,bounds['y']+bounds['height']-20
 mobile.touchscreen.tap(x,y);assert mobile.locator('#feature-banner').get_attribute('aria-hidden')=='true'
 cdp=mobile.context.new_cdp_session(mobile)
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
 cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+70,'y':y-60}]})
 cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 assert float(mobile.locator('#map').get_attribute('data-pan-x'))>0
 assert float(mobile.locator('#map').get_attribute('data-pan-y'))<0
 assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 print('PASS: reduced motion, touch tap/dismiss/pan, native cursors, zero console errors.')
 browser.close()
