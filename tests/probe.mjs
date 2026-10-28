// Sondagem das fontes públicas (roda no GitHub Actions, que tem internet).
async function probe(name, url, opts = {}, show = 600) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { ...opts, headers: { "user-agent": "OmegaAnalista/1.0 (tdeottis.com.br)", ...(opts.headers || {}) }, signal: AbortSignal.timeout(90000) });
    const txt = await r.text();
    console.log(`\n### ${name}\nHTTP ${r.status} ${Date.now() - t0}ms cors=${r.headers.get("access-control-allow-origin")} type=${r.headers.get("content-type")} len=${txt.length}\n${txt.slice(0, show)}`);
    return txt;
  } catch (e) { console.log(`\n### ${name}\nERRO ${Date.now() - t0}ms ${e.message}`); return null; }
}
const lat = -23.5614961, lon = -46.6559677;
function ring(lat, lon, r, n = 48) { const p = []; for (let i = 0; i <= n; i++) { const t = 2 * Math.PI * i / n; p.push([+(lon + r * Math.sin(t) / (111320 * Math.cos(lat * Math.PI / 180))).toFixed(6), +(lat + r * Math.cos(t) / 110540).toFixed(6)]); } return p; }
const gj = { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring(lat, lon, 2000)] } }] };
const w = await probe("worldpop sync", `https://api.worldpop.org/v1/services/stats?dataset=wpgppop&year=2020&geojson=${encodeURIComponent(JSON.stringify(gj))}&runasync=false`, {}, 0);
if (w) console.log("TAIL:", w.replace(/<br \/>\n<b>Deprecated<\/b>:[^\n]*\n/g, "").slice(-1500));
const w2 = await probe("worldpop R25A", `https://api.worldpop.org/v1/services/stats?dataset=G2_CN_POP_R25A_100m&year=2024&geojson=${encodeURIComponent(JSON.stringify(gj))}&runasync=false`, {}, 0);
if (w2) console.log("TAIL2:", w2.replace(/<br \/>\n<b>Deprecated<\/b>:[^\n]*\n/g, "").slice(-800));
const caps = await probe("ibge geoserver caps", "https://geoservicos.ibge.gov.br/geoserver/ows?service=WFS&version=1.1.0&request=GetCapabilities", {}, 0);
if (caps) { const names = [...caps.matchAll(/<(?:wfs:)?Name>([^<]+)<\/(?:wfs:)?Name>\s*<(?:wfs:)?Title>([^<]*)/g)].map(m => m[1] + " | " + m[2]); console.log("LAYERS total", names.length); console.log(names.filter(n => /setor|grade|2022|censo|renda|rend|popula|domic/i.test(n)).slice(0, 150).join("\n")); }
const dl = 0.018, dn = 0.0196;
await probe("overpass name 2km kumi", "https://overpass.kumi.systems/api/interpreter", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(`[out:json][timeout:25];nwr(around:2000,${lat},${lon})["name"~"academia|fitness|crossfit|pilates|smart ?fit|bluefit|selfit|bodytech|muscula",i][!"highway"];out center tags;`) }, 1200);
await probe("overpass fitness main", "https://overpass-api.de/api/interpreter", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(`[out:json][timeout:60];(nwr(around:3000,${lat},${lon})["leisure"="fitness_centre"];nwr(around:3000,${lat},${lon})["amenity"="gym"];);out count;`) }, 400);
