// Localização de endereços com as APIs reais (roda no GitHub Actions).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const addr of ["Estrada do Crispim, 477, Jardim Santa Júlia Itapecerica da Serra", "Estrada Crispim, 477, Jardim Santa Júlia Itapecerica da Serra, São Paulo, SP", "Avenida Paulista, 1578, São Paulo - SP"]) {
    const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + require('path').resolve(__dirname, '../index.html'));
    await p.fill('#addr', addr); await p.check('#nocache'); await p.click('#go');
    await p.waitForFunction(() => document.querySelector('#sources')?.innerText.includes('IBGE') || document.querySelector('#report .callout.bad'), null, { timeout: 120000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 20000));
    console.log('\n' + addr + '\n' + await p.evaluate(() => document.querySelector('#sources')?.innerText + '\n' + (document.querySelector('#report .callout.bad')?.innerText || '')), errs);
    await p.close();
  }
  await b.close();
})();
