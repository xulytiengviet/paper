/* GeoPaper: framework-free, client-side interactive research demonstration.
 * All map observations and derived scores are SYNTHETIC.
 * No user data is uploaded or stored.
 */
(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const repoUrl = "https://github.com/xulytiengviet/paper";
  const defaultMeta = {
    title: "GeoPaper: An Interactive & Reproducible GIS / WebGIS Research Template",
    subtitle: "Một khung công bố nghiên cứu không gian: từ dữ liệu, ngữ nghĩa địa lý tới mô phỏng bản đồ và đánh giá có thể tái lập.",
    authors: [{ name: "GeoPaper contributors", affiliation: "1" }],
    affiliations: ["Example affiliation — replace before publication"],
    abstract: "This reusable GIS/WebGIS preprint template demonstrates transparent spatial data handling, reproducibility and interactive GeoJSON layers. All observations and scores are synthetic; no empirical performance is claimed.",
    year: 2026,
    bibtexKey: "geopaper_template_2026",
    citationNote: "Reusable demonstration template; not a published study",
    paperUrl: null,
    arxivUrl: null,
    codeUrl: repoUrl,
    modelsUrl: null,
    imagesUrl: "#figures",
    demoUrl: "#explorer",
    doi: null
  };
  let metadata = defaultMeta;
  let geojson = null;
  let leafletMap = null;
  let groupSites = null;
  let groupZones = null;
  let groupRoutes = null;
  let latestBibtex = "";

  const scenarios = {
    rain: { label: "Hydrology", offset: 0, color: "#608ca0" },
    heat: { label: "Urban heat", offset: 9, color: "#c17b51" },
    access: { label: "Accessibility", offset: -7, color: "#8077a4" }
  };
  const semantics = {
    hydro: {
      title: "Hydrological context",
      description: "Mô tả các điểm quan trắc theo quan hệ gần sông, trong lưu vực và theo thời gian. Mối quan hệ chỉ mang tính minh họa.",
      nodes: ["Sensor", "Waterway", "Basin"],
      edges: ["near", "within"],
      audit: "Khoảng cách được tính trong hệ quy chiếu nào? Nguồn nào chứng minh quan hệ gần?"
    },
    urban: {
      title: "Urban fabric & land use",
      description: "Minh họa việc liên kết quan trắc với lớp sử dụng đất, bề mặt xây dựng và mật độ đô thị theo ngữ cảnh.",
      nodes: ["Observation", "Land-cover", "Urban unit"],
      edges: ["overlaps", "belongs to"],
      audit: "Ngày hiệu lực lớp phủ đất là khi nào? Chất lượng phân loại được kiểm chứng ra sao?"
    },
    network: {
      title: "Network connectivity",
      description: "Biểu diễn các nút và cạnh trong đồ thị giao thông hoặc phân bố dịch vụ, xét kết nối thay vì khoảng cách thẳng.",
      nodes: ["Site", "Route", "Service area"],
      edges: ["connects to", "reaches"],
      audit: "Đã dùng mạng đường thực và chi phí di chuyển, hay mới chỉ dùng khoảng cách Euclid?"
    }
  };

  function node(id) { return document.getElementById(id); }
  function text(id, value) { const el = node(id); if (el) el.textContent = value; }
  function safeUrl(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    const v = value.trim();
    if (/^#[a-z0-9_-]+$/i.test(v)) return v;
    if (/^(assets|data)\/[a-z0-9_./-]+$/i.test(v) && !v.includes("..")) return v;
    try {
      const u = new URL(v);
      return (u.protocol === "https:" || u.protocol === "http:") ? u.href : null;
    } catch (_) { return null; }
  }
  function setResource(key, url) {
    const a = document.querySelector('[data-resource="' + key + '"]');
    if (!a) return;
    const good = safeUrl(url);
    a.classList.toggle("unavailable", !good);
    if (good) {
      a.setAttribute("href", good);
      a.removeAttribute("aria-disabled");
      a.removeAttribute("title");
      if (good.startsWith("http")) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      } else {
        a.removeAttribute("target");
        a.removeAttribute("rel");
      }
    } else {
      a.removeAttribute("href");
      a.setAttribute("aria-disabled", "true");
      a.title = "Resource not yet published";
    }
    const small = a.querySelector("small");
    if (small) small.hidden = !!good;
  }
  function bibSafe(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/[{}\\]/g, "").replace(/[\r\n]+/g, " ").trim();
  }
  function buildBib(meta) {
    const names = Array.isArray(meta.authors) ? meta.authors.map((a) => bibSafe(a.name)).filter(Boolean) : [];
    const fields = [
      "  title = {" + bibSafe(meta.title) + "}",
      "  author = {" + (names.join(" and ") || "GeoPaper contributors") + "}",
      "  year = {" + (Number(meta.year) || 2026) + "}"
    ];
    if (safeUrl(meta.doi)) fields.push("  doi = {" + bibSafe(meta.doi) + "}");
    const publicationUrl = safeUrl(meta.paperUrl) || safeUrl(meta.arxivUrl) || safeUrl(meta.codeUrl) || repoUrl;
    fields.push("  url = {" + bibSafe(publicationUrl) + "}");
    fields.push("  note = {" + bibSafe(meta.citationNote || defaultMeta.citationNote) + "}");
    const key = /^[A-Za-z0-9_:-]+$/.test(String(meta.bibtexKey)) ? meta.bibtexKey : "geopaper_template_2026";
    return "@misc{" + key + ",\n" + fields.join(",\n") + "\n}";
  }
  function applyMetadata(source) {
    metadata = Object.assign({}, defaultMeta, source || {});
    text("paper-title", metadata.title);
    text("paper-subtitle", metadata.subtitle);
    text("paper-abstract", metadata.abstract);
    text("footerYear", String(metadata.year || 2026));
    document.title = metadata.title + " | GeoPaper";
    const og = $('meta[property="og:title"]');
    if (og) og.content = metadata.title;
    const authorsEl = node("paper-authors");
    const affiliationEl = node("paper-affiliations");
    if (authorsEl && Array.isArray(metadata.authors)) {
      authorsEl.replaceChildren();
      metadata.authors.forEach((a, idx) => {
        if (idx > 0) authorsEl.append(document.createTextNode(",  "));
        const span = document.createElement("span");
        span.textContent = a.name || "Author";
        const sup = document.createElement("sup");
        sup.textContent = a.affiliation || "1";
        span.append(" ", sup);
        authorsEl.append(span);
      });
    }
    if (affiliationEl && Array.isArray(metadata.affiliations)) {
      affiliationEl.textContent = metadata.affiliations.join(" · ");
    }
    setResource("paper", metadata.paperUrl);
    setResource("arxiv", metadata.arxivUrl);
    setResource("code", metadata.codeUrl || repoUrl);
    setResource("models", metadata.modelsUrl);
    setResource("images", metadata.imagesUrl || "#figures");
    setResource("demo", metadata.demoUrl || "#explorer");
    latestBibtex = buildBib(metadata);
    text("bibtex", latestBibtex);
    text("citeStatus", "Template citation only; replace metadata and link actual scholarly outputs before submission.");
  }
  async function loadMetadata() {
    try {
      const resp = await fetch("data/paper.json");
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      applyMetadata(await resp.json());
    } catch (err) {
      applyMetadata(defaultMeta);
      console.info("GeoPaper metadata fallback:", err.message);
    }
  }

  function controls() {
    return {
      scenario: node("scenarioSelect").value,
      mode: node("modeSelect").value,
      year: Number(node("yearRange").value),
      sites: node("layerSites").checked,
      zones: node("layerZones").checked,
      routes: node("layerRoutes").checked
    };
  }
  function clamp(value) { return Math.max(0, Math.min(100, value)); }
  function scoreFor(feature, c) {
    const p = feature.properties || {};
    const base = c.mode === "coverage" ? Number(p.coverage || 0) : Number(p.base || 0);
    return Math.round(clamp(base + 4 * (c.year - 2024) + (scenarios[c.scenario] || scenarios.rain).offset));
  }
  function riskColor(value) {
    return value < 35 ? "#5ba68b" : value < 65 ? "#dda45b" : "#c66e58";
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }
  function isFeatureKind(feature, kind) {
    return feature && feature.properties && feature.properties.kind === kind;
  }
  function featureRows(kind) {
    return (geojson && Array.isArray(geojson.features) ? geojson.features : [])
      .filter((feature) => isFeatureKind(feature, kind));
  }
  function inspect(feature, score, c) {
    const coord = feature.geometry.coordinates;
    const p = feature.properties || {};
    text("inspectResult",
      String(p.name || feature.id || "Synthetic site") +
      " · ID " + String(feature.id || "N/A") +
      " · Lat " + Number(coord[1]).toFixed(4) +
      ", Lon " + Number(coord[0]).toFixed(4) +
      " · " + (c.mode === "risk" ? "Toy index " : "Toy coverage ") +
      score + "/100 · " + (p.semantic || "illustrative feature"));
  }
  function updateNumbers(c) {
    const sites = c.sites ? featureRows("site") : [];
    const values = sites.map((s) => scoreFor(s, c));
    const avg = values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : null;
    text("metricSites", String(sites.length));
    text("metricIndex", avg === null ? "—" : String(avg) + " / 100");
    text("metricScenario", (scenarios[c.scenario] || scenarios.rain).label);
    text("yearOutput", String(c.year));
  }
  function makePopup(f, score, c) {
    const p = f.properties || {};
    return "<strong>" + escapeHtml(p.name || f.id) + "</strong>" +
      "<br><small>Fictional observation, not a real station</small>" +
      "<br>ID: " + escapeHtml(f.id || "N/A") +
      "<br>" + (c.mode === "risk" ? "Toy index: " : "Toy coverage: ") + score + " / 100";
  }
  function renderMap(c) {
    updateNumbers(c);
    if (!leafletMap || !geojson || !window.L) return;
    groupSites.clearLayers();
    groupZones.clearLayers();
    groupRoutes.clearLayers();
    if (c.zones) {
      featureRows("zone").forEach((feature) => {
        L.geoJSON(feature, {
          style: { color: "#bf8d55", weight: 1.5, fillColor: scenarios[c.scenario].color, fillOpacity: 0.13, dashArray: "5 5" }
        }).addTo(groupZones);
      });
    }
    if (c.routes) {
      featureRows("route").forEach((feature) => {
        L.geoJSON(feature, { style: { color: "#dc9561", weight: 3, opacity: 0.9, dashArray: "8 6" } }).addTo(groupRoutes);
      });
    }
    if (c.sites) {
      featureRows("site").forEach((feature) => {
        const lat = Number(feature.geometry.coordinates[1]);
        const lon = Number(feature.geometry.coordinates[0]);
        const score = scoreFor(feature, c);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
        const marker = L.circleMarker([lat, lon], {
          radius: 8, color: "#fff", weight: 2.4,
          fillColor: riskColor(score), fillOpacity: 1
        });
        marker.bindTooltip(escapeHtml(feature.properties.name || feature.id), { direction: "top" });
        marker.bindPopup(makePopup(feature, score, c));
        marker.on("click", () => inspect(feature, score, c));
        marker.addTo(groupSites);
      });
    }
  }
  function initMap() {
    if (!window.L) {
      const fallback = node("mapFallback");
      if (fallback) fallback.hidden = false;
      text("mapStatus", "Leaflet unavailable · read-only fallback");
      return;
    }
    try {
      leafletMap = L.map("map", { scrollWheelZoom: false, zoomControl: true });
      leafletMap.setView([10.18, 106.20], 8);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
        maxZoom: 18
      }).addTo(leafletMap);
      groupZones = L.layerGroup().addTo(leafletMap);
      groupRoutes = L.layerGroup().addTo(leafletMap);
      groupSites = L.layerGroup().addTo(leafletMap);
      text("mapStatus", "EPSG:4326 · Web Mercator display");
    } catch (err) {
      text("mapStatus", "Map initialization failed");
      console.error("GeoPaper map:", err);
    }
  }
  async function loadGeojson() {
    try {
      const resp = await fetch("data/demo.geojson");
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();
      if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) throw new Error("Not a FeatureCollection");
      geojson = data;
      renderMap(controls());
      text("mapStatus", "EPSG:4326 · synthetic layer fixtures");
    } catch (err) {
      text("mapStatus", "Sample data unavailable; serve through HTTP");
      console.warn("GeoPaper GeoJSON:", err);
      text("inspectResult", "Không tải được GeoJSON. Chạy python -m http.server 8080 trong thư mục dự án.");
    }
  }
  function runSimulation() {
    const c = controls();
    renderMap(c);
    text("mapStatus", "Simulated " + c.year + " · " + scenarios[c.scenario].label + " · toy output only");
  }
  function resetDemo() {
    node("scenarioSelect").value = "rain";
    node("modeSelect").value = "risk";
    node("yearRange").value = "2024";
    node("layerSites").checked = true;
    node("layerZones").checked = true;
    node("layerRoutes").checked = true;
    text("inspectResult", "Chọn một điểm trên bản đồ để xem ID, tọa độ, chỉ số giả lập và nhãn ngữ nghĩa.");
    runSimulation();
    if (leafletMap) leafletMap.setView([10.18, 106.20], 8);
  }
  function installExplorer() {
    ["scenarioSelect", "modeSelect", "yearRange", "layerSites", "layerZones", "layerRoutes"].forEach((id) => {
      node(id).addEventListener("input", runSimulation);
    });
    node("runDemo").addEventListener("click", runSimulation);
    node("resetDemo").addEventListener("click", resetDemo);
    initMap();
    loadGeojson();
    updateNumbers(controls());
  }
  function installSemantics() {
    $$(".semantic-choice").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.semantic;
        const s = semantics[key];
        if (!s) return;
        $$(".semantic-choice").forEach((other) => {
          const active = other === btn;
          other.classList.toggle("is-active", active);
          other.setAttribute("aria-pressed", String(active));
        });
        text("semanticTitle", s.title);
        text("semanticDescription", s.description);
        text("semanticAudit", s.audit);
        const graph = node("semanticGraph");
        graph.replaceChildren();
        s.nodes.forEach((name, i) => {
          if (i > 0) {
            const edge = document.createElement("b");
            edge.textContent = "→ " + s.edges[i - 1] + " →";
            graph.append(edge);
          }
          const item = document.createElement("span");
          item.textContent = name;
          graph.append(item);
        });
      });
    });
  }
  async function copyText(value, statusId, success) {
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        copied = true;
      } else {
        const t = document.createElement("textarea");
        t.value = value;
        t.style.position = "fixed";
        t.style.left = "-9999px";
        document.body.append(t);
        t.select();
        copied = document.execCommand("copy");
        t.remove();
      }
    } catch (_) { copied = false; }
    if (statusId) text(statusId, copied ? success : "Không thể sao chép tự động. Hãy chọn và sao chép đoạn mã.");
    return copied;
  }
  function installCitation() {
    node("copyBib").addEventListener("click", () =>
      copyText(latestBibtex, "citeStatus", "Copied BibTeX to clipboard."));
    node("downloadBib").addEventListener("click", () => {
      const file = new Blob([latestBibtex + "\n"], { type: "text/plain;charset=utf-8" });
      const objectUrl = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "geopaper.bib";
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      text("citeStatus", "BibTeX file generated locally. Verify bibliographic fields before citation.");
    });
    node("copySetup").addEventListener("click", async () => {
      const command = "git clone " + repoUrl + ".git\ncd paper\npython -m http.server 8080";
      const copied = await copyText(command);
      node("copySetup").textContent = copied ? "Copied ✓" : "Select text";
    });
  }
  function installNav() {
    const links = $$(".primary-nav a");
    if (!("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id));
        }
      });
    }, { rootMargin: "-15% 0px -70% 0px", threshold: 0 });
    ["overview", "explorer", "method", "semantics", "benchmarks", "models", "cite"].forEach((id) => {
      const el = node(id);
      if (el) obs.observe(el);
    });
  }
  applyMetadata(defaultMeta);
  installExplorer();
  installSemantics();
  installCitation();
  installNav();
  loadMetadata();
})();
