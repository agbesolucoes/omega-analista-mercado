// Sondagem das fontes públicas (roda no GitHub Actions, que tem internet).
async function probe(name, url, opts = {}, show = 600) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { ...opts, headers: { origin: "https://tdeottis.com.br", ...(opts.headers || {}) }, signal: AbortSignal.timeout(90000) });
    const txt = await r.text();
    console.log(`\n### ${name}\nHTTP ${r.status} ${Date.now() - t0}ms cors=${r.headers.get("access-control-allow-origin")} type=${r.headers.get("content-type")} len=${txt.length}\n${txt.slice(0, show)}`);
    return txt;
  } catch (e) { console.log(`\n### ${name}\nERRO ${Date.now() - t0}ms ${e.message}`); return null; }
}
const lat = -23.5614961, lon = -46.6559677;
function ring(lat, lon, r, n = 48) { const p = []; for (let i = 0; i <= n; i++) { const t = 2 * Math.PI * i / n; p.push([+(lon + r * Math.sin(t) / (111320 * Math.cos(lat * Math.PI / 180))).toFixed(6), +(lat + r * Math.cos(t) / 110540).toFixed(6)]); } return p; }
const gj = { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring(lat, lon, 2000)] } }] };
const w = await probe("worldpop sync", `https://api.worldpop.org/v1/services/stats?dataset=wpgppop&year=2020&geojson=${encodeURIComponent(JSON.stringify(gj))}&runasync=false`, {}, 0);
if (w) console.log("TAIL:", JSON.stringify(w.replace(/<br \/>\s*<b>Deprecated<\/b>:[^\n]*\n?/g, "").slice(-1200)));
const G = "https://geoservicos.ibge.gov.br/geoserver/ows?service=WFS&version=2.0.0&request=GetFeature&outputFormat=application/json&srsName=EPSG:4326";
const dl = 0.0181, dn = 0.0197, bb = `${lat - dl},${lon - dn},${lat + dl},${lon + dn},urn:ogc:def:crs:EPSG::4326`;
for (const L of ["CGMAT:qg_2022_600_setcensitario__v02", "CGMAT:pbqg22_26_SetoresCensitarios_SetoresCensitarios", "CGMAT:qg_2022_710_apond"]) {
  await probe("desc " + L, `https://geoservicos.ibge.gov.br/geoserver/ows?service=WFS&version=2.0.0&request=DescribeFeatureType&typeNames=${L}`, {}, 2500);
  const t = await probe("feat " + L, `${G}&typeNames=${L}&count=3&bbox=${bb}`, {}, 0);
  try { const j = JSON.parse(t); console.log("n", j.numberMatched, j.totalFeatures, JSON.stringify(j.features?.[0]?.properties)); } catch (e) { console.log("parse", e.message, (t || "").slice(0, 300)); }
}
const t2 = await probe("feat all 2km", `${G}&typeNames=CGMAT:qg_2022_600_setcensitario__v02&bbox=${bb}&propertyName=CD_SETOR`, {}, 0);
if (t2) console.log("bytes", t2.length);
