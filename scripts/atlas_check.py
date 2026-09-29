"""Ancient Atlas palette and scroll-animation regression checks."""
import os
from playwright.sync_api import sync_playwright

def contrast(a,b):
 def lum(c):
  v=[int(c[i:i+2],16)/255 for i in [1,3,5]]
  v=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v]
  return sum(x*w for x,w in zip(v,[.2126,.7152,.0722]))
 x,y=sorted([lum(a),lum(b)]);return (y+.05)/(x+.05)
for foreground,background in [('#F2EADB','#182820'),('#354536','#e5d7b9'),('#9E391A','#e5d7b9')]:
 assert contrast(foreground,background)>=4.5
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROME_PATH','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless=True)
 page=b.new_page(viewport={'width':1366,'height':768});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('MAP_URL','http://127.0.0.1:8000'));page.wait_for_selector('body[data-interactions-ready="true"]')
 page.locator('#enter').click();page.wait_for_selector('body[data-entered="true"]');page.mouse.move(1320,740)
 for i,color in enumerate(['#9E391A','#354536','#F2EADB']):
  page.locator(f'.node[data-state="{i}"]').click();page.wait_for_timeout(1020)
  assert page.locator('#territory-main').get_attribute('fill')==color
  assert page.locator('#territory-main').get_attribute('d')==page.locator('#territory-main-ink').get_attribute('d')
  assert float(page.locator('#territory-main').evaluate('(e)=>getComputedStyle(e).fillOpacity'))<.25
 assert page.locator('.pennant').get_attribute('transform')=='scale(.82)'
 assert page.locator('.pennant path').nth(1).get_attribute('fill-opacity')=='.95'
 assert page.locator('.banner-fabric').count()==0
 def curl():return page.locator('.scroll-curl').bounding_box()['x']
 closed=curl();page.locator('#hit-mecca').focus();page.wait_for_timeout(110)
 opening=curl();assert closed<opening<300,(closed,opening)
 text_x=page.locator('.banner-content').bounding_box()['x']
 page.screenshot(path='/tmp/atlas-roll-start.png')
 page.wait_for_timeout(550);opened=curl();assert opened>300
 assert page.locator('.banner-content').bounding_box()['x']==text_x
 assert page.locator('.banner-content').evaluate('(e)=>getComputedStyle(e).transform')=='none'
 page.keyboard.press('Escape');page.wait_for_timeout(130);closing=curl();assert closed<closing<opened
 page.screenshot(path='/tmp/atlas-roll-closing.png')
 # Reverse mid-close, then switch repeatedly without creating more panels.
 for id in ['nile','baghdad','indus','mesopotamia']:
  page.locator('#hit-'+id).focus();page.wait_for_timeout(45)
 page.wait_for_timeout(650)
 assert page.locator('#feature-banner').count()==1
 assert page.locator('#feature-banner').get_attribute('data-feature')=='mesopotamia'
 assert abs(curl()-opened)<.1
 assert page.locator('#feature-banner').evaluate('(e)=>e.getAnimations({subtree:true}).filter(a=>a.playState==="running").length')==0
 assert page.locator('#feature-banner').evaluate('(e)=>getComputedStyle(e).pointerEvents')=='none'
 page.screenshot(path='/tmp/atlas-scroll-final.png')
 page.emulate_media(reduced_motion='reduce');page.keyboard.press('Escape');page.wait_for_timeout(180)
 page.locator('#hit-mecca').focus();page.wait_for_timeout(180)
 assert page.locator('.scroll-curl').evaluate('(e)=>getComputedStyle(e).transitionDuration')=='0s'
 assert page.locator('.scroll-sheet').evaluate('(e)=>getComputedStyle(e).clipPath')=='none'
 assert not errors,errors
 print('PASS: text contrast, three pigment states, boundary casing alignment, pennant sizing/opacity, scroll unroll/retract/reversal, stable text, no ongoing wind animation, reduced motion.')
 b.close()
