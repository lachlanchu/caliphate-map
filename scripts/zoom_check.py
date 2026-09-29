from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless=True)
 page=b.new_page(viewport={'width':1366,'height':768});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8000');page.wait_for_selector('body[data-interactions-ready="true"]');page.locator('#enter').click();page.wait_for_selector('body[data-entered="true"]')
 def z():return float(page.locator('#map').get_attribute('data-zoom'))
 assert z()==1
 page.locator('#zoom-in').click();assert z()==1.4
 page.locator('#zoom-in').click();assert z()>1.9
 page.locator('#hit-baghdad').focus();assert page.locator('#feature-banner').get_attribute('data-feature')=='baghdad'
 transform=page.locator('#map-pan').get_attribute('transform')
 for i in [1,2,0]:
  page.locator(f'.node[data-state="{i}"]').click();page.wait_for_timeout(980)
  assert page.locator('#map-pan').get_attribute('transform')==transform
 page.locator('#zoom-reset').click();assert z()==1 and page.locator('#map').get_attribute('data-pan-x')=='0'
 # Wheel zoom preserves the location underneath the cursor.
 at=page.locator('#hit-baghdad .focus-halo').evaluate('(el)=>{const p=new DOMPoint(+el.getAttribute("cx"),+el.getAttribute("cy")).matrixTransform(el.getScreenCTM());return {x:p.x,y:p.y}}')
 page.mouse.move(**at);page.mouse.wheel(0,-120);page.wait_for_timeout(100);assert z()>1
 after=page.locator('#hit-baghdad .focus-halo').evaluate('(el)=>{const p=new DOMPoint(+el.getAttribute("cx"),+el.getAttribute("cy")).matrixTransform(el.getScreenCTM());return {x:p.x,y:p.y}}')
 assert abs(at['x']-after['x'])<1 and abs(at['y']-after['y'])<1
 page.mouse.move(at['x']+1,at['y']+1);page.wait_for_timeout(350)
 assert page.locator('#feature-banner').get_attribute('data-feature')=='baghdad'
 for _ in range(6):
  if page.locator('#zoom-in').is_enabled():page.locator('#zoom-in').click()
 assert z()==4 and page.locator('#zoom-in').is_disabled()
 page.locator('#map').focus();page.keyboard.press('-');assert z()<4
 page.keyboard.press('0');assert z()==1
 page.mouse.move(**at);page.mouse.wheel(0,-120);page.wait_for_timeout(100)
 page.mouse.wheel(0,-120);page.wait_for_timeout(100)
 page.mouse.move(at['x']+1,at['y']+1);page.wait_for_timeout(400)
 page.screenshot(path='/tmp/caliphate-zoom.png')
 # Pinch on an actual touch-capable browser context.
 m=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 m.on('pageerror',lambda e:errors.append(str(e)))
 m.goto('http://127.0.0.1:8000');m.wait_for_selector('body[data-interactions-ready="true"]');m.locator('#enter').tap();m.wait_for_selector('body[data-entered="true"]')
 c=m.context.new_cdp_session(m)
 c.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':170,'y':330,'id':1},{'x':220,'y':360,'id':2}]})
 c.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':130,'y':310,'id':1},{'x':260,'y':380,'id':2}]})
 c.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 assert float(m.locator('#map').get_attribute('data-zoom'))>2
 assert not m.locator('#map').evaluate('(e)=>e.classList.contains("is-panning")')
 m.locator('#zoom-reset').tap();assert m.locator('#map').get_attribute('data-zoom')=='1'
 assert not errors,errors
 print('PASS: buttons, 1–4× bounds, cursor anchoring, hover after zoom, keyboard, reset, state changes at zoom, and touch pinch; no JS errors.')
 b.close()
