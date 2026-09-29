# Sources and reconstruction notes

## Actually consulted

Malise Ruthven with Azim Nanji, *Historical Atlas of the Islamic World* (2004), digital copy:
https://www.emaanlibrary.com/wp-content/uploads/2015/06/Historical-Atlas-Of-Islam-.pdf

No PDF was initially present in the project. The online copy was downloaded temporarily for inspection and is not redistributed. Printed pp. 16–17, 25, 28–29, 36–37, 66–67 were rendered and visually inspected; p. 142's text was inspected for Baghdad's founding. PDF viewer page numbers are printed page numbers + 1.

- **Rashidun, 632–661:** the first four expansion colors on pp. 28–29, with western detail from pp. 66–67. Approximate end-of-period extent, including Arabia, Egypt, eastern coastal North Africa, the Levant, Iraq, Armenia and Persia into Khurasan/Makran; not the later Transoxiana/Sindh expansion.
- **Umayyad, 661–750:** all five expansion colors on pp. 28–29 and western detail pp. 66–67. Approximate greatest early-eighth-century extent, including most of Iberia (excluding northern enclaves), western North Africa, Transoxiana and Sindh. Not a snapshot claiming identical control everywhere in 750.
- **Abbasid:** only the legend's **Extent of Abbasid Empire 786–809** on pp. 36–37. Western frontier retracts to the Ifriqiya/eastern Maghreb region. Spain and separately colored western Maghreb states are excluded. Later island conquests and campaign arrows do not establish control. The mixed-period map heading “c. 850” is not the chosen date. Harun's erroneous 764 accession on p. 36 is corrected to 786, following the assignment's explicit correction and the map legend.
- **Agriculture:** pp. 16–17 identify the irrigated Nile and Mesopotamian river valleys. The two schematic regions drawn here are the Egyptian Nile Valley and Delta (one connected area) and Lower Mesopotamia from Baghdad toward Basra. They are approximate cultivation zones, not traced field boundaries.
- **Physical features:** p. 25 inspected as geographic context. Baghdad's founding in AD 762 appears on p. 142. The city remains labeled and muted before its foundation.

Frontiers are manually authored longitude/latitude control points interpreted from the atlas, not georeferenced pixel tracings. Generalization is intentional at this overview scale. Broad colored territories do not imply uniform administration of every desert area. Modern coastlines and rivers are reference geometry; ancient shorelines, Nile branches and Mesopotamian channels differed.

## Geographic data

**Natural Earth**, 1:50 million, public domain:
https://www.naturalearthdata.com/about/terms-of-use/

Original files, retrieved from the Natural Earth repository:
- https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson
- https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_rivers_lake_centerlines.geojson
- https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_lakes.geojson

Local land/lake datasets retain intersecting features in the regional view and omit attributes. River data retain all source line segments named Nile, Tigris, Euphrates or Indus (some rivers consist of multiple features). No invented river polylines replace the source geometry. Natural Earth gives modern generalized centerlines; use them as an orientation aid, not a historical hydrological reconstruction.

## Design and software

- **Mapbox Dark:** https://www.mapbox.com/maps/dark — consulted for grayscale visual direction. No Mapbox tiles, logos, fonts, APIs or source code used.
- **D3.js v7:** https://d3js.org/ — local distribution downloaded from https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js. ISC license in `assets/D3-LICENSE`.
- Native HTML, CSS, SVG, JavaScript. System fonts. No analytics or external runtime dependencies.

## Animation

A single fixed Mercator projection maps every layer. Mainland outlines share semantic sections (Mediterranean, northern frontier, eastern frontier, Arabia, southern frontier), each resampled to 75 corresponding vertices. Those vertices are linearly interpolated with cubic temporal easing over 900 ms, simultaneously interpolating RGB color. Iberia is a separate 150-vertex component collapsing toward Gibraltar outside the Umayyad state. All territory is clipped to Natural Earth's land. Final territory boundaries are approximate historical interpretations; every intermediate shape is expressly illustrative. Interrupted animations begin from the currently displayed geometry.

## Interface markers and interaction revision

Feature pennants use plain monochrome SVG shapes as decorative interface markers, not authenticated historical flags. Feature facts follow the user’s supplied copy; Baghdad includes an explicit pre-foundation note in Rashidun and Umayyad states.

This revision preserves the historical control points, geographic datasets, projection and territory interpolation. It removes the twelve permanent feature labels and leader lines, replacing them with ordered invisible targets and a single information overlay. At the initial 100% scale, the shared map parent pans within ±120 by ±55 SVG units. Zoom scales that same parent from 1× to 4×, with pan bounds adjusted to the available geographic coverage; the viewport mask and interface remain stationary. River flag anchors use arc-length midpoints of visible source paths, not centroids or cursor positions.

## Ancient Atlas appearance

The palette was supplied by the user. Broad irregular sage/parchment pigment washes are clipped to the existing Natural Earth land geometry; these are schematic physical-geography styling, not measured vegetation or land-cover data. Existing desert regions and agricultural footprints retain their geographic shapes and textures. No modern political borders guide the coloring. The interface uses a plain triangular paper-colored pennant and an unrolling paper scroll; no deleted reference artwork is requested or loaded.

## Material references

The supplied `atlas-texture-reference.png` was visually inspected for aged paper and uneven printing, but is not embedded in the site. Its cartography and decorative mountains are not used.

The local blank 1902 paper scan from Internet Archive Book Images and George Hodan’s blank worn-paper photograph were visually inspected and used as layered rendering textures. Complete source links, rights statements and asset details are in [assets/textures/ATTRIBUTION.md](assets/textures/ATTRIBUTION.md). The mahogany grain is an original lightweight vector texture. Displacement affects only the broad color mask, never coastline, river or historical frontier geometry.
