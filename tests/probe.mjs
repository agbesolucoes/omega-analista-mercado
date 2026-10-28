// Sondagem das fontes públicas (roda no GitHub Actions, que tem internet).
const out = [];
async function probe(name, url, opts = {}, show = 600) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { ...opts, headers: { origin: "https://tdeottis.com.br", ...(opts.headers || {}) }, signal: AbortSignal.timeout(120000) });
    const txt = await r.text();
    console.log(`\n### ${name}\nHTTP ${r.status} ${Date.now() - t0}ms cors=${r.headers.get("access-control-allow-origin")} type=${r.headers.get("content-type")} len=${txt.length}\n${txt.slice(0, show)}`);
    return txt;
  } catch (e) { console.log(`\n### ${name}\nERRO ${Date.now() - t0}ms ${e.message}`); return null; }
}
const lat = -23.5614961, lon = -46.6559677; // Av. Paulista
function ring(lat, lon, r, n = 48) { const p = []; for (let i = 0; i <= n; i++) { const t = 2 * Math.PI * i / n; p.push([+(lon + r * Math.sin(t) / (111320 * Math.cos(lat * Math.PI / 180))).toFixed(6), +(lat + r * Math.cos(t) / 110540).toFixed(6)]); } return p; }
const gj = { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring(lat, lon, 2000)] } }] };

const mode = process.argv[2] || "all";
if (mode === "all" || mode === "wp") {
  await probe("worldpop sync", `https://api.worldpop.org/v1/services/stats?dataset=wpgppop&year=2020&geojson=${encodeURIComponent(JSON.stringify(gj))}&runasync=false`, {}, 1500);
  const a = await probe("worldpop async", `https://api.worldpop.org/v1/services/stats?dataset=wpgppop&year=2020&geojson=${encodeURIComponent(JSON.stringify(gj))}&runasync=true`, {}, 800);
  try { const id = JSON.parse(a).taskid; for (let i = 0; i < 20; i++) { await new Promise(r => setTimeout(r, 3000)); const t = await probe("worldpop task " + i, `https://api.worldpop.org/v1/tasks/${id}`, {}, 800); if (/finished/.test(t || "")) break; } } catch (e) { console.log("async parse", e.message); }
  await probe("worldpop POST", `https://api.worldpop.org/v1/services/stats`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ dataset: "wpgppop", year: "2020", geojson: JSON.stringify(gj), runasync: "false" }) }, 800);
  await probe("worldpop datasets", `https://api.worldpop.org/v1/services/stats`, {}, 1500);
  await probe("worldpop wpgp list", `https://www.worldpop.org/rest/data/pop`, {}, 1500);
}
if (mode === "all" || mode === "ibge") {
  const caps = await probe("ibge geoserver caps", "https://geoservicos.ibge.gov.br/geoserver/ows?service=WFS&version=2.0.0&request=GetCapabilities", {}, 300);
  if (caps) { const names = [...caps.matchAll(/<wfs:Name>([^<]+)<\/wfs:Name>\s*<wfs:Title>([^<]*)/g)].map(m => m[1] + " | " + m[2]); console.log("LAYERS total", names.length); console.log(names.filter(n => /setor|grade|2022|censo|renda|rend|popula/i.test(n)).join("\n")); }
  const ag = await probe("sidra agregados lista", "https://servicodados.ibge.gov.br/api/v3/agregados", {}, 200);
  if (ag) { const j = JSON.parse(ag); const hits = []; j.forEach(p => p.agregados.forEach(a => { if (/rendimento|renda|salário/i.test(a.nome)) hits.push(`${p.id} ${p.nome} :: ${a.id} ${a.nome}`); })); console.log("AGREGADOS renda:\n" + hits.filter(h => /2022|Censo Demogr|Cadastro Central|CEMPRE|PNAD/i.test(h)).slice(0, 120).join("\n")); }
  for (const t of [1685, 9954, 10295, 10296, 10304, 10069]) await probe("meta " + t, `https://servicodados.ibge.gov.br/api/v3/agregados/${t}/metadados`, {}, 1500);
  await probe("sidra 1685 SP", "https://apisidra.ibge.gov.br/values/t/1685/n6/3550308/v/all/p/last%201", {}, 1500);
  await probe("ibge indicador cidades", "https://servicodados.ibge.gov.br/api/v1/pesquisas/indicadores/29765/resultados/3550308", {}, 800);
}
if (mode === "all" || mode === "osm") {
  const A = `(around:3000,${lat},${lon})`;
  await probe("overpass name gyms", "https://overpass-api.de/api/interpreter", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(`[out:json][timeout:60];(nwr${A}["name"~"academia|fitness|crossfit|pilates|smart ?fit|bodytech|bluefit|selfit|studio|estúdio|gym",i][!"highway"];);out center tags;`) }, 300);
}
