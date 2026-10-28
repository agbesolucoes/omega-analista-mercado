// Sondagem das fontes públicas (roda no GitHub Actions, que tem internet).
const f = (u, o = {}) => fetch(u, { ...o, signal: AbortSignal.timeout(90000) }).then(async r => ({ s: r.status, cors: r.headers.get("access-control-allow-origin"), t: await r.text() })).catch(e => ({ s: "ERRO " + e.message, t: "" }));
const lat = -23.5614961, lon = -46.6559677;
function ring(lat, lon, r, n = 48) { const p = []; for (let i = 0; i <= n; i++) { const t = 2 * Math.PI * i / n; p.push([+(lon + r * Math.sin(t) / (111320 * Math.cos(lat * Math.PI / 180))).toFixed(6), +(lat + r * Math.cos(t) / 110540).toFixed(6)]); } return p; }
const gj = { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring(lat, lon, 2000)] } }] };
const out = [];
const G = "https://geoservicos.ibge.gov.br/geoserver/ows?service=WFS&version=2.0.0";
const dl = 0.0181, dn = 0.0197, bb = `${lat - dl},${lon - dn},${lat + dl},${lon + dn},urn:ogc:def:crs:EPSG::4326`;
for (const L of ["CGMAT:qg_2022_600_setcensitario__v02", "CGMAT:qg_2022_600_setcensitario__v00prelim", "CGMAT:qg_2021_600_setcensitario"]) {
  const d = await f(`${G}&request=DescribeFeatureType&typeNames=${L}`);
  out.push(`DESC ${L} ${d.s}: ` + [...d.t.matchAll(/name="([^"]+)" nillable/g)].map(m => m[1]).join(","));
  const x = await f(`${G}&request=GetFeature&outputFormat=application/json&srsName=EPSG:4326&typeNames=${L}&count=2&bbox=${bb}`);
  try { const j = JSON.parse(x.t); out.push(`FEAT ${L} n=${j.numberMatched} ` + JSON.stringify(j.features?.[0]?.properties)); } catch (e) { out.push(`FEAT ${L} ${x.s} ${x.t.slice(0, 200)}`); }
}
const t0 = Date.now();
const full = await f(`${G}&request=GetFeature&outputFormat=application/json&srsName=EPSG:4326&typeNames=CGMAT:qg_2022_600_setcensitario__v02&bbox=${bb}`);
out.push(`FULL ${full.s} ${full.t.length} bytes ${Date.now() - t0}ms`);
const w = await f(`https://api.worldpop.org/v1/services/stats?dataset=wpgppop&year=2020&geojson=${encodeURIComponent(JSON.stringify(gj))}&runasync=false`);
out.push("WP " + w.s + " " + JSON.stringify(w.t.replace(/<br \/>\s*<b>Deprecated<\/b>:[^\n]*\n?/g, "").slice(-700)));
for (const t of ["9923", "9514", "10310"]) { const s = await f(`https://apisidra.ibge.gov.br/values/t/${t}/n10/355030807000126/v/all/p/2022`); out.push(`SIDRA setor ${t} ${s.s} ${s.t.slice(0, 200)}`); }
console.log("\n===== RESUMO =====\n" + out.join("\n"));
