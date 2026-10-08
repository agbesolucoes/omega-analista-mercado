// Teste com as APIs reais (roda no GitHub Actions, que tem internet).
// Analisa endereços conhecidos e falha se uma fonte essencial não responder.
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const OUT = path.resolve(__dirname, '../test-results'); fs.mkdirSync(OUT, { recursive: true });
const ADDRS = (process.env.SMOKE_ADDRS || 'Avenida Paulista, 1578, São Paulo - SP|Rua da Bahia, 1148, Belo Horizonte - MG').split('|');
(async () => {
  const b = await chromium.launch(); const failures = []; const report = [];
  for (const addr of ADDRS) {
    const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.resolve(__dirname, '../index.html'));
    await p.fill('#addr', addr); await p.check('#nocache'); await p.click('#go');
    try { await p.waitForFunction(() => window.__ANALISE__ || document.querySelector('#report .callout.bad'), null, { timeout: 300000 }); }
    catch (e) { failures.push(`${addr}: análise não terminou`); }
    // O Overpass rejeita picos de uso vindos dos IPs compartilhados do GitHub: uma segunda tentativa após 60 s.
    if (await p.evaluate(() => !!(window.__ANALISE__ && (__ANALISE__.S.errs.fit || __ANALISE__.S.errs.ctx)))) {
      console.log(`${addr}: OpenStreetMap falhou na primeira tentativa, repetindo em 60 s`);
      await new Promise(res => setTimeout(res, 60000));
      await p.evaluate(() => { window.__ANALISE__ = null; });
      await p.uncheck('#nocache'); await p.click('#bRetry');
      await p.waitForFunction(() => window.__ANALISE__, null, { timeout: 300000 }).catch(() => {});
    }
    const r = await p.evaluate(() => window.__ANALISE__ ? ({
      geo: __ANALISE__.S.geo, mun: __ANALISE__.S.mun && { nome: __ANALISE__.S.mun.nome, pop: __ANALISE__.S.mun.pop, idade: !!__ANALISE__.S.mun.idade, pibpc: __ANALISE__.S.mun.pibpc },
      errs: __ANALISE__.S.errs, pop: __ANALISE__.S.pop, comp: __ANALISE__.R.compR, omega: __ANALISE__.R.omega.map(o => o.name),
      parecer: __ANALISE__.R.parecer.call, score: __ANALISE__.R.score }) : null);
    await p.screenshot({ path: path.join(OUT, addr.replace(/[^a-z0-9]+/gi, '_') + '.png'), fullPage: true });
    report.push({ addr, r, pageErrors: errs });
    if (!r) { failures.push(`${addr}: endereço não localizado`); continue; }
    if (errs.length) failures.push(`${addr}: erro de JavaScript: ${errs[0]}`);
    if (!r.mun || !r.mun.pop) failures.push(`${addr}: IBGE sem população (${r.errs.ibge || ''})`);
    if (r.errs.fit) failures.push(`${addr}: OpenStreetMap concorrência falhou (${r.errs.fit})`);
    if (r.errs.ctx) failures.push(`${addr}: OpenStreetMap entorno falhou (${r.errs.ctx})`);
    // Fontes auxiliares: registradas, mas não derrubam o teste.
    ['wp', 'idade', 'pib', 'bar', 'cnt'].forEach(k => r.errs[k] && console.log(`AVISO ${addr}: ${k} falhou: ${r.errs[k]}`));
    await p.close(); await new Promise(res => setTimeout(res, 5000)); // respeita limites das APIs
  }
  fs.writeFileSync(path.join(OUT, 'smoke.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await b.close();
  if (failures.length) { console.error('FALHAS:\n' + failures.join('\n')); process.exit(1); }
  console.log('OK: fontes essenciais responderam');
})();
