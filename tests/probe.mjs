// Sondagem das fontes públicas (roda no GitHub Actions, que tem internet).
async function probe(name, url, opts = {}, show = 600) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { ...opts, headers: { origin: "https://tdeottis.com.br", "user-agent": "OmegaAnalista/1.0 (tdeottis.com.br)", ...(opts.headers || {}) }, signal: AbortSignal.timeout(120000) });
    const txt = await r.text();
    console.log(`\n### ${name}\nHTTP ${r.status} ${Date.now() - t0}ms cors=${r.headers.get("access-control-allow-origin")} type=${r.headers.get("content-type")} len=${txt.length}\n${txt.slice(0, show)}`);
    return txt;
  } catch (e) { console.log(`\n### ${name}\nERRO ${Date.now() - t0}ms ${e.message}`); return null; }
}
const lat = -23.5614961, lon = -46.6559677; // Av. Paulista
function ring(lat, lon, r, n = 48) { const p = []; for (let i = 0; i <= n; i++) { const t = 2 * Math.PI * i / n; p.push([+(lon + r * Math.sin(t) / (111320 * Math.cos(lat * Math.PI / 180))).toFixed(6), +(lat + r * Math.cos(t) / 110540).toFixed(6)]); } return p; }
const gj = { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring(lat, lon, 2000)] } }] };
const tail = (t) => { if (!t) return; const i = t.indexOf("{\""); console.log("JSON PART:", i, t.slice(i, i + 700)); };
tail(await probe("worldpop sync", `https://api.worldpop.org/v1/services/stats?dataset=wpgppop&year=2020&geojson=${encodeURIComponent(JSON.stringify(gj))}&runasync=false`, {}, 50));
const pre = await fetch("https://api.worldpop.org/v1/services/stats?dataset=wpgppop&year=2020&geojson=x", { method: "OPTIONS", headers: { origin: "https://tdeottis.com.br", "access-control-request-method": "GET" } }).catch(e => null);
console.log("OPTIONS", pre?.status, pre && [...pre.headers].join(" | "));
for (const t of [1685, 10295, 10296, 10304, 9954, 10069, 10313, 10180, 10071]) {
  const x = await probe("sidra " + t, `https://apisidra.ibge.gov.br/values/t/${t}/n6/3550308/v/all/p/last%201`, {}, 0);
  try { const j = JSON.parse(x); console.log(j.slice(1).map(r => `${r.D2C}|${r.D2N}|${r.V}|${r.MN}|${r.D3N}`).join("\n").slice(0, 2500)); } catch (e) { console.log("parse", e.message, (x || "").slice(0, 200)); }
}
const m = await probe("sidra muni SP list", `https://apisidra.ibge.gov.br/values/t/4714/n6/in%20n3%2035/v/93/p/2022`, {}, 0);
try { const j = JSON.parse(m); console.log(j.length, JSON.stringify(j[1])); } catch (e) { console.log("parse", e.message); }
await probe("servicodados municipios", "https://servicodados.ibge.gov.br/api/v1/localidades/estados/SP/municipios", {}, 120);
const A = `(around:3000,${lat},${lon})`;
await probe("overpass name gyms", "https://overpass-api.de/api/interpreter", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(`[out:json][timeout:60];(nwr${A}["name"~"academia|fitness|crossfit|pilates|smart ?fit|bodytech|bluefit|selfit|gym",i][!"highway"];);out center tags;`) }, 300);
