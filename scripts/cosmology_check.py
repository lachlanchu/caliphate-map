"""Companion browser checks. Serve the repository root on port 8000 first.

Uses Python Playwright and installed Chrome, like check.py. MAP_URL is the
atlas root; a temporary copy and server also exercise the GitHub Pages subpath.
Screenshots and the US Letter print PDF go in the ignored screenshots folder.
"""
import functools
import http.server
import os
from pathlib import Path
import shutil
import tempfile
import threading
from urllib.parse import urljoin, urlparse

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'screenshots'
URL = os.environ.get('MAP_URL', 'http://127.0.0.1:8000').rstrip('/') + '/'
CHROME = os.environ.get('CHROME_PATH', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
SPHERES = ['Sphere of spheres (the Throne)', 'Fixed stars', 'Saturn',
           'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon']


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def check(browser, base, label):
    for width, height, touch in [(1440, 900, False), (1366, 768, False), (390, 844, True)]:
        context = browser.new_context(viewport={'width': width, 'height': height},
                                      is_mobile=touch, has_touch=touch, device_scale_factor=1)
        page = context.new_page()
        errors, failed, textures = [], [], []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        page.on('requestfailed', lambda r: failed.append((r.url, r.failure)))
        page.on('response', lambda r: failed.append((r.url, r.status)) if r.status >= 400 else None)
        page.on('response', lambda r: textures.append((r.url, r.status))
                if r.url.endswith('/assets/textures/aged-paper-scan.jpg') else None)
        companion = urljoin(base, 'cosmology/')
        assert page.goto(companion).status == 200
        page.wait_for_load_state('networkidle')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert page.locator('html').get_attribute('lang') == 'en'
        assert page.locator('figure').get_attribute('aria-labelledby') == 'scheme-caption'
        assert page.locator('script').count() == 0
        assert page.locator('svg').count() == 1
        assert page.locator('.band h3').count() == 3
        assert page.locator('.level h4').count() == 13
        count = len(page.locator('#explanation').inner_text().split())
        print(f'{label} {width}×{height}: #explanation = {count} words', flush=True)
        assert count <= 200, count
        legend = page.locator('#sphere-legend li').all_text_contents()
        assert legend == SPHERES, legend
        assert 'Earth' not in page.locator('#sphere-legend').inner_text()
        assert page.locator('svg title').text_content() == 'The nine rotating spheres'
        assert all(name in page.locator('svg desc').text_content() for name in SPHERES)
        # The break has two distinct dashed segments, no generated arrowhead,
        # and no arrow element. The equals mark has only two horizontal bars.
        assert page.locator('#originator + #origination-break').count() == 1
        assert page.locator('#origination-break .break-line').count() == 2
        assert page.locator('#origination-break .down-arrow, #origination-break .up-arrow').count() == 0
        assert page.locator('#origination-break').evaluate('''e => {
          return [e, ...e.querySelectorAll('*')].every(n =>
            ['::before', '::after'].every(p => ['none', 'normal'].includes(getComputedStyle(n,p).content)));
        }''')
        for segment in page.locator('.break-line').all():
            assert segment.evaluate('e => getComputedStyle(e).borderLeftStyle') == 'dashed'
        assert page.locator('#command + #equals-connector + #first-intellect').count() == 1
        assert page.locator('#equals-connector .down-arrow, #equals-connector .up-arrow').count() == 0
        assert page.locator('.equals-mark').evaluate('''e => {
          const s=getComputedStyle(e); return s.borderTopStyle==='solid' && s.borderBottomStyle==='solid'
            && parseFloat(s.borderLeftWidth)===0 && parseFloat(s.borderRightWidth)===0;
        }''')
        # Catch overflowing card text, even when it doesn't reach the viewport edge.
        assert page.locator('.level').evaluate_all('''es => es.every(e => {
          const box=e.getBoundingClientRect();
          return [...e.querySelectorAll('p, h4, li')].every(n => {
            const range=document.createRange(); range.selectNodeContents(n);
            const r=range.getBoundingClientRect();
            return r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom;
          });
        })'''), 'card text overflow'
        assert page.evaluate('document.getAnimations().length') == 0
        rail = page.locator('.side-rail').bounding_box()
        bands = page.locator('.bands').bounding_box()
        if touch:
            assert rail['y'] >= bands['y'] + bands['height']
            for group in ['.triad', '.pair']:
                cards = page.locator(group + ' .level').all()
                for prev, following in zip(cards, cards[1:]):
                    a, b = prev.bounding_box(), following.bounding_box()
                    assert b['y'] >= a['y'] + a['height']
        else:
            assert rail['x'] >= bands['x'] + bands['width']
        assert textures and all(status == 200 for _, status in textures), textures
        assert all(url == urljoin(base, 'assets/textures/aged-paper-scan.jpg') for url, _ in textures)
        if label == 'root' and width in [1440, 390]:
            name = 'desktop' if width == 1440 else 'mobile'
            page.screenshot(path=str(OUTPUT / f'cosmology-{name}.png'), full_page=True)
        if width == 1440:
            page.emulate_media(media='print')
            assert page.locator('.folio').evaluate('e => getComputedStyle(e).backgroundImage') == 'none'
            assert not page.locator('.header-actions').is_visible()
            assert page.locator('.equals-mark').is_visible()
            assert page.locator('#origination-break').is_visible()
            if label == 'root':
                page.pdf(path=str(OUTPUT / 'cosmology.pdf'), format='Letter',
                         print_background=True, prefer_css_page_size=True)
            page.emulate_media(media='screen')
        atlas_link = page.get_by_role('link', name='← Atlas')
        assert atlas_link.evaluate('e => e.href') == base
        atlas_link.click()
        page.wait_for_selector('body[data-interactions-ready="true"]')
        page.locator('#enter').click()
        page.wait_for_selector('body[data-entered="true"]')
        link = page.locator('header a.sources-button')
        assert link.evaluate('e => e.href') == companion
        # Both atlas pills remain single-line at the phone width.
        for pill in page.locator('.header-actions .sources-button').all():
            assert pill.evaluate('''e => {
              const r=document.createRange(); r.selectNodeContents(e);
              return r.getBoundingClientRect().height <= parseFloat(getComputedStyle(e).fontSize)*1.8;
            }''')
        link.click()
        page.wait_for_url(companion)
        assert urlparse(page.url).path == urlparse(companion).path
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert not errors, errors
        assert not failed, failed
        print(f'PASS: {label} {width}×{height}, assets, layout, connectors, legend, links, zero console/request errors.', flush=True)
        context.close()


def main():
    OUTPUT.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='cosmology-subpath-') as temp:
        shutil.copytree(ROOT, Path(temp) / 'caliphate-map',
                        ignore=shutil.ignore_patterns('.git', 'screenshots', '__pycache__', '*.pyc'))
        handler = functools.partial(QuietHandler, directory=temp)
        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(executable_path=CHROME, headless=True)
                check(browser, URL, 'root')
                check(browser, f'http://127.0.0.1:{server.server_port}/caliphate-map/', 'subpath')
                browser.close()
        finally:
            server.shutdown()
            server.server_close()
            thread.join()
    print('PASS: root and /caliphate-map/; desktop/mobile screenshots and print PDF saved.', flush=True)


if __name__ == '__main__':
    main()
