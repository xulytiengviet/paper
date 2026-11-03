# GeoPaper — GIS / WebGIS Academic Preprint Website Template

A research-first, responsive and reusable static website for **GIS, WebGIS, spatial AI, geospatial modelling and reproducible research**.

**Website (after enabling GitHub Pages):** https://xulytiengviet.github.io/paper/  
**Source:** https://github.com/xulytiengviet/paper  
**Layout reference:** https://de-fm.github.io/ — visual hierarchy inspired by the academic project page, not a copy of its illustrations or code.

> [!IMPORTANT]
> This repository is a **website template**, not a completed scientific experiment. The included GeoJSON, site locations, risk/coverage scores and polygon boundaries are fictional/synthetic. There is no real trained model, measured benchmark, published preprint or arXiv identifier bundled with the template.

## Features

- Seven research sections: **Overview · Explorer · Method · Semantics · Benchmarks · Models & Data · Cite**.
- Hero with scientific title, author/affiliation metadata, abstract, keywords and visual figure.
- Paper / arXiv / Code / 🤗 Models / Images / Demo resource bar. Unknown resources remain **pending** (disabled, no fabricated links).
- Interactive Leaflet map with synthetic GeoJSON **Point**, **Polygon** and **LineString** layers; scenario, time, mode, filtering, feature inspector and deterministic demo scoring.
- Explainable spatial semantics switcher for hydrology, urban fabric and connectivity.
- Benchmark protocol matrix that says **Not reported** until verified results exist.
- Dynamic BibTeX copy + download; structured source code and content licensing.
- Static frontend: no server, database, authentication, build framework or telemetry. Leaflet CDN + OSM background tiles require a network connection; the site remains readable without them.
- Responsive, keyboard-friendly layout and reduced-motion support.

## Quick start

~~~bash
git clone https://github.com/xulytiengviet/paper.git
cd paper
python -m http.server 8080
~~~

Open http://localhost:8080. You can also run:

~~~bash
npm test
~~~

Requires Node.js 18+ only for automated tests; no npm installation or runtime build step is required. **Do not** double-click index.html as a file URL if you need GeoJSON or metadata loading: browsers normally block local file fetches.

## Repository structure

~~~text
paper/
├── index.html                 # Semantic HTML; seven sections and UI
├── assets/
│   ├── styles.css             # Academic design system, responsive
│   ├── app.js                 # Leaflet demo, synthetic scoring, BibTeX
│   └── favicon.svg
├── data/
│   ├── paper.json             # Reusable paper metadata and link registry
│   └── demo.geojson           # Entirely synthetic map data
├── tests/
│   └── smoke.test.mjs         # Site/metadata/GeoJSON validity checks
├── .github/workflows/
│   └── validate.yml           # Node smoke tests on push and PR
├── CITATION.cff               # Citation for the website template
├── CONTENT_LICENSE.md         # CC BY-SA 4.0 website content
├── LICENSE                    # MIT source code license
├── package.json               # npm test (no dependencies)
├── .nojekyll                  # Safe static file serving via Pages
└── README.md
~~~

## Reuse as a new research paper

1. **Create a copy** (fork the repository, or use it as a repository template after enabling the "Template repository" option in GitHub Settings). Keep attribution for borrowed content and third-party libraries.
2. Edit **data/paper.json**: real title, authors, affiliations, abstract, year, citation key, DOI, publication URL, code repository, dataset and model links. Use null for anything not yet published; the resource button is then explicitly pending.
3. Replace **data/demo.geojson** with authorized GeoJSON if needed. Its Feature properties are demo-specific: site objects require kind=site, base (0–100), coverage (0–100), name and semantic. The map expects RFC 7946 lon/lat (WGS84). To use actual scientific data, replace the demo formula in assets/app.js with a documented and validated model, not simply new coordinates.
4. Revise the HTML paragraphs, figure, method and semantic cards for the **actual study**, preserving the seven section IDs for navigation. Add figure sources and licenses, not screenshots without permission.
5. Replace the benchmark protocol's Not reported cells **only after** you have experimental outputs, evaluation splits and reproducibility information. Provide CI, hardware, data versions and seeds.
6. Update **CITATION.cff**, LICENSE copyright holders where relevant, content license and acknowledgments. Never attribute sponsors, institutions, peer review or arXiv IDs without confirmation.
7. Run **npm test**, review desktop/mobile, test keyboard navigation, and enable Pages.

### How to enable GitHub Pages

On GitHub, go to **Settings → Pages → Build and deployment → Source: Deploy from a branch → main / (root) → Save**.

The site should then be available at **https://xulytiengviet.github.io/paper/** after Pages deploys. This repository ships a root index.html and does not require GitHub Actions for publishing. If repository settings are already configured, a push to main should trigger the normal Pages deployment.

### Data & CRS cautions

- The included GeoJSON follows RFC 7946 geographic coordinates (longitude, latitude; WGS84). Leaflet renders the visual base map using Web Mercator EPSG:3857.
- Do **not** calculate accurate area, distance or spatial buffers directly in lat/lon degrees. Reproject to a suitable metric CRS in a real scientific pipeline.
- The fictional demo polygons are not administrative boundaries. Demo sites are not actual monitoring stations. Synthetic scores are not hazards, predictions, accuracy claims or environmental measurements.
- The demo is for client-side interaction; use a real backend and access controls for large rasters, protected data, geoprocessing jobs or regulated observations.

## Minimum publication checklist

- [ ] Research question and novel contribution are explicitly stated.
- [ ] Data provenance, time coverage, consent/license and repository/hash documented.
- [ ] CRS, axis order, units and topology validation documented.
- [ ] Dataset splits avoid spatial/temporal leakage; baseline is meaningful.
- [ ] Metrics computed on real, held-out observations; variance and confidence intervals reported.
- [ ] Demo clearly distinguishes measured output from simulated illustration.
- [ ] Paper/DOI/arXiv/model links actually exist and match version.
- [ ] Code, figures, funding, authorship and citations verified.

## Credits and licensing

This is an independent implementation with academic layout inspiration from [DeFM](https://de-fm.github.io/). DeFM's page credits the [Academic Project Page Template](https://github.com/eliahuhorwitz/Academic-project-page-template), inspired by [Nerfies](https://nerfies.github.io/). This repository links back as acknowledgment but does not claim authorship of or affiliation with those projects.

- **Code:** [MIT License](LICENSE).
- **Original site narrative & generated artwork:** [CC BY-SA 4.0](CONTENT_LICENSE.md), except third-party material.
- **Synthetic demo fixture:** CC0-1.0.
- **Base-map tiles:** © OpenStreetMap contributors, subject to their own terms; Leaflet is a third-party library governed by its own license.

Maintained by xulytiengviet contributors. Please cite the **actual paper**, when one exists, rather than the template itself.
