import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const meta = JSON.parse(read("data/paper.json"));
const geo = JSON.parse(read("data/demo.geojson"));
const html = read("index.html");

test("required research sections and navigation are present", () => {
  for (const id of ["overview", "explorer", "method", "semantics", "benchmarks", "models", "cite"]) {
    assert.match(html, new RegExp('id="' + id + '"'));
    assert.match(html, new RegExp('href="#' + id + '"'));
  }
});
test("resources contain no fake preprint or model links", () => {
  assert.equal(meta.paperUrl, null);
  assert.equal(meta.arxivUrl, null);
  assert.equal(meta.modelsUrl, null);
  for (const name of ["paper", "arxiv", "code", "models", "images", "demo"]) {
    assert.match(html, new RegExp('data-resource="' + name + '"'));
  }
});
test("citation metadata is reusable and explicitly a template", () => {
  assert.equal(typeof meta.title, "string");
  assert.ok(meta.title.length > 20);
  assert.ok(Array.isArray(meta.authors) && meta.authors.length > 0);
  assert.match(meta.citationNote, /template/i);
});
test("GeoJSON is synthetic and RFC 7946 style", () => {
  assert.equal(geo.type, "FeatureCollection");
  assert.match(geo.description, /synthetic/i);
  assert.ok(geo.features.length >= 10);
  const seenIds = new Set();
  const kinds = new Set();
  for (const f of geo.features) {
    assert.equal(f.type, "Feature");
    assert.ok(!seenIds.has(f.id), "duplicate ID: " + f.id);
    seenIds.add(f.id);
    kinds.add(f.properties.kind);
    assert.ok(["Point", "Polygon", "LineString"].includes(f.geometry.type));
    const walk = (arr) => {
      if (typeof arr[0] === "number") {
        assert.ok(arr[0] >= -180 && arr[0] <= 180);
        assert.ok(arr[1] >= -90 && arr[1] <= 90);
      } else { for (const child of arr) walk(child); }
    };
    walk(f.geometry.coordinates);
    if (f.properties.kind === "site") {
      assert.ok(f.properties.base >= 0 && f.properties.base <= 100);
      assert.ok(f.properties.coverage >= 0 && f.properties.coverage <= 100);
    }
  }
  assert.deepEqual([...kinds].sort(), ["route", "site", "zone"]);
});
test("license and deployment essentials exist", () => {
  for (const path of ["LICENSE", "CONTENT_LICENSE.md", "CITATION.cff", ".nojekyll", "assets/app.js", "assets/styles.css", "assets/favicon.svg"]) {
    assert.ok(existsSync(new URL("../" + path, import.meta.url)), "missing " + path);
  }
});
