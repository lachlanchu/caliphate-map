# The Early Caliphates

A self-contained static historical atlas. No build step or API key. All runtime assets are local.

## Local preview

From this folder:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open **http://127.0.0.1:8000**. Keep the terminal running; Ctrl+C stops it. Use HTTP rather than opening `index.html` directly because the map loads local GeoJSON with `fetch`.

Click **enter** to open the circular map reveal. The map loads behind the evergreen introduction. The entrance runs once per page load.

Hover or keyboard-focus a city, river, desert, or agricultural area to reveal one geographically anchored flag and an unrolling paper information scroll. On touch, tap a feature to open its information and tap empty map space to dismiss it. Escape dismisses focused feature information. The plain triangular pennant is a decorative interface motif, not an authenticated dynastic flag.

Zoom from 100% to 400% using the +/− controls, the scroll wheel over the map, or a two-finger pinch. Wheel zoom keeps the point under the cursor stationary. Click the percentage button to reset zoom and position. With the map focused, +/− zoom and 0 resets.

Drag to pan. At 100%, movement is clamped to ±120 SVG units horizontally and ±55 vertically; the pan bounds expand with zoom to let you explore the same geographic coverage. A 5-pixel threshold separates taps from drags. The edge fade, banner, timeline and zoom controls remain fixed.

Select a timeline node, drag and release the slider, or focus the slider and use the arrow keys (Home/End also work). The preserved territorial morph takes 900 ms. Reduced motion uses a brief entrance fade, immediate territory changes, and a brief scroll fade. Sources opens a bibliographic dialog; Escape closes it.

## GitHub Pages

1. Commit `index.html`, `style.css`, `app.js`, `interactions.js`, `assets/`, and the documentation to a GitHub repository.
2. In **Settings → Pages → Build and deployment**, select **Deploy from a branch**, `main`, and `/ (root)`; click **Save**. The empty `.nojekyll` file publishes the static files without Jekyll.
3. Visit the Pages URL once deployment finishes. Relative asset paths support repository subpaths.

Do not commit the historical reference PDF or temporary tools. Keep the local material assets in `assets/textures/`; they are required by the site.

## Editing

- `style.css`: layout, typography and feature styling.
- `app.js`: shared Mercator projection, feature coordinates, manual territorial frontiers and state transitions.
- `interactions.js`: entrance, feature information, ordered hit targets, flags, bounded pan, and 1–4× zoom.
- `assets/`: local Natural Earth geography, D3, and attributed paper textures.
- `SOURCES.md`: consulted references, attribution, and historical interpretation.
- `scripts/check.py`: optional browser verification using Python Playwright and installed Google Chrome; run while the local server is active.

The main polygon is divided into matching geographic sections and resampled by arc length. Corresponding screen-space boundary vertices interpolate continuously, including fill/stroke color. Iberia is a separate polygon collapsing toward Gibraltar in the other states. Coastline clipping keeps all intermediate overlays on land. There is no territory crossfade. A shared SVG parent supplies user-driven pan; it does not modify the projection, geography, historical boundaries, or morph calculations.

Designed primarily for one laptop/desktop viewport. A compact layout is included for narrower screens, but the full geographic overview is best read on a desktop. Territorial and agricultural boundaries are approximate reconstructions, not authoritative GIS datasets.

## Verification

Run `scripts/check.py` with Python Playwright and installed Google Chrome while the local server is active. Set `CHROME_PATH` or `MAP_URL` to override the defaults. The suite checks the entrance, all twelve hover/focus interactions, hit priority, anchored flags, pointer and touch dragging, pan bounds, timeline isolation, historical state morphing after pan, reduced motion, dialog behavior, and console errors. Screenshots and temporary tools are kept outside the project.

Latest checks passed in Chrome at 1366×768, 1440×900 and 1280×720, plus touch emulation at 390×844. The entrance, circular reveal, desktop map, panned feature scroll, and touch scroll were visually inspected. All twelve features passed actual pointer hit-testing and keyboard information checks; mouse/touch pan, state transitions after pan, reduced motion, and console-error checks passed. Touch information was separately confirmed to remain open after finger release. No known blocking issues were found; physical mobile hardware and other browser engines were not tested.

Zoom-specific browser checks are in `scripts/zoom_check.py`: controls and bounds, pointer anchoring, hover after zoom, keyboard/reset, caliphate transitions at zoom, and touch pinch.

## Ancient Atlas styling

The core pigments are burnt red `#9E391A`, parchment `#C4AC7C`, sage `#5E6A58`, forest `#354536`, and water `#2D433A`, with ivory `#F2EADB` and page evergreen `#182820`. Broad climate-inspired washes use the existing land outline; the existing desert and agricultural shapes retain their textures. These washes are schematic visual treatments, not a new ecological dataset. Territory fills remain translucent; interpolated red/green/ivory outlines have a dark ink casing.

The small pennant is 82% of its previous size, with a triangular curved edge and 95% fabric opacity. The single paper panel unrolls over 560 ms: a moving vertical curl tracks the clipping edge while the text stays unscaled. Reversing hover reverses the same CSS transition; there is no continuous wind animation. Native cursors remain in use and no deleted image is loaded.

The Ancient Atlas revision passed the interaction, zoom, and `scripts/atlas_check.py` suites in Chrome. Checks cover all twelve features, mouse/touch pan, three-state morphing, pinch zoom, contrast of primary text pairs, scroll opening/closing and rapid reversal, reduced motion, and zero JavaScript errors. The introduction, three territorial states, Sources dialog, and opening/open/closing scroll frames were visually inspected. Historical frontier coordinates, projection, and boundary resampling were compared against the previous revision and remain unchanged.

## Paper and wood materials

Two local blank-paper photographs/scans supply real fibers, discoloration, scratches and creases. See [material attribution](assets/textures/ATTRIBUTION.md) for creators, sources and rights. Irregular sage pigment masks replace the smooth climate gradients; all coastlines and historical paths are unchanged. Fixed paper layers cover both land and water inside the map transform, so their placement follows pan and zoom and stays stable during territory morphs. A fixed density mask gives the territorial pigment slight unevenness. Texture is gentler around important features, and labels remain above it.

The scroll uses a lighter rendering of the same paper. Its moving edge combines a pale paper wrap with a mahogany core, longitudinal grain and exposed turned finials. Grain and soft cylindrical shading move only during the 560 ms opening or closing transition, then stop. Reduced motion retains a brief reveal.

The material revision passed the interaction, atlas and zoom suites in Chrome, plus texture decoding/anchoring and reversible wood-grain checks. The map at normal size and the open scroll were visually inspected.

Publication excludes local reference images, PDFs, credentials, caches and temporary files through `.gitignore`; these files remain on your computer. All runtime paths are relative and the browser suites also passed under `/caliphate-map/`.
