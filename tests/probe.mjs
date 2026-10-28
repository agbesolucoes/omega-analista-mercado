// Sondagem de geocodificação (roda no GitHub Actions, que tem internet).
const H = { "user-agent": "OmegaAnalista/1.0 (tdeottis.com.br)", "accept-language": "pt-BR" };
const qs = ["Estrada Crispim, 477, Jardim Santa Júlia Itapecerica da Serra, São Paulo, SP", "Estrada Crispim, 477, Itapecerica da Serra, SP", "Estrada Crispim, Itapecerica da Serra", "Crispim, Itapecerica da Serra", "Jardim Santa Júlia, Itapecerica da Serra", "Itapecerica da Serra, SP"];
for (const q of qs) {
  for (const [n, u] of [["nominatim", `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=br&q=${encodeURIComponent(q)}`], ["photon", `https://photon.komoot.io/api/?limit=5&q=${encodeURIComponent(q + ", Brasil")}`]]) {
    try { const r = await fetch(u, { headers: H }); const j = await r.json(); const list = n === "nominatim" ? j.map(x => `${x.display_name} [${x.addresstype}]`) : (j.features || []).map(f => `${f.properties.name}|${f.properties.street}|${f.properties.city}|${f.properties.state}|${f.properties.countrycode} [${f.properties.type}]`); console.log(`\n${n} :: ${q}\n  ` + (list.join("\n  ") || "(nada)")); } catch (e) { console.log(n, q, "ERRO", e.message); }
    await new Promise(r => setTimeout(r, 1200));
  }
}
const s = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=br&street=${encodeURIComponent("477 Estrada Crispim")}&city=${encodeURIComponent("Itapecerica da Serra")}&state=SP`, { headers: H }).then(r => r.json()).catch(e => e.message);
console.log("\nstructured", JSON.stringify(s).slice(0, 800));
