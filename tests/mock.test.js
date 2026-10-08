const { chromium } = require('playwright');
// Teste offline: todas as APIs externas são simuladas.
const OUT=process.argv[2]||require('path').resolve(__dirname,'../test-results'); require('fs').mkdirSync(OUT,{recursive:true});
const assert=require('assert');
const LAT=-23.5613, LON=-46.6565;
const off=(dm,dn)=>({lat:LAT+dm/110540, lon:LON+dn/(111320*Math.cos(LAT*Math.PI/180))});
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1300,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push('console: '+m.text())});
  await p.route('**/*', require('./mock-apis'));
  await p.goto('file://'+require('path').resolve(__dirname,'../index.html'));
  await p.fill('#addr','Avenida Paulista, 1000, São Paulo - SP');
  await p.click('#opt summary');
  for(const [k,v] of Object.entries({area:900,areaMin:800,aluguel:45000,fixos:80000,ticket:149,margem:70,invest:2500000,cap:3000})) await p.fill('#'+k,String(v));
  await p.click('#go');
  await p.waitForSelector('#s-resumo',{timeout:20000});
  await p.screenshot({path:OUT+'/shot1.png',fullPage:true});
  // PDF executivo
  const [dl]=await Promise.all([p.waitForEvent('download',{timeout:60000}),p.click('#bPdf')]);
  const pdfPath=OUT+'/relatorio.pdf'; await dl.saveAs(pdfPath);
  const pdfBuf=require('fs').readFileSync(pdfPath); const pages=(pdfBuf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
  console.log('pdf bytes',pdfBuf.length,'pages',pages);
  assert.ok(pdfBuf.slice(0,4).toString()==='%PDF' && pages>=8,'PDF executivo gerado');
  // segunda análise (com cache) e comparação
  await p.fill('#aluguel','90000'); await p.click('#go'); await p.waitForFunction(()=>document.querySelectorAll('.hitem').length===2,{timeout:20000});
  console.log('cache note:', await p.evaluate(()=>__ANALISE__.S.cache));
  await p.check('.hitem:nth-child(1) input'); await p.check('.hitem:nth-child(2) input'); await p.click('#bCmp');
  console.log('compare rows:', await p.evaluate(()=>document.querySelectorAll('#report tbody tr').length));
  await p.screenshot({path:OUT+'/cmp.png'});
  await p.click('.hitem:nth-child(2) button'); await p.waitForSelector('#s-resumo');
  await p.setViewportSize({width:400,height:900}); await p.emulateMedia({colorScheme:'dark'});
  await p.screenshot({path:OUT+'/shot2.png',fullPage:false});
  const sw=await p.evaluate(()=>document.documentElement.scrollWidth);
  if(sw>400) console.log('LARGOS',await p.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>402&&true}).filter(e=>!e.parentElement||e.parentElement.getBoundingClientRect().right<=402).slice(0,8).map(e=>e.tagName+'.'+e.className+' '+Math.round(e.getBoundingClientRect().right)))); console.log('scrollWidth@400',sw);
  console.log(await p.evaluate(()=>JSON.stringify({call:__ANALISE__.R.parecer, score:__ANALISE__.R.score, fin:{be:__ANALISE__.R.fin.be, scen:__ANALISE__.R.fin.scen.map(s=>[s.n,Math.round(s.alunos),Math.round(s.res),s.pay])}, mun:__ANALISE__.S.mun, errs:__ANALISE__.S.errs})));
  const pageErrs=errs.filter(e=>!e.startsWith('console: Failed to load resource'));
  console.log('ERRS',pageErrs);
  const res=await p.evaluate(()=>({call:__ANALISE__.R.parecer.call,cov:__ANALISE__.R.score.coverage,comp:__ANALISE__.R.compR.r2000,omega:__ANALISE__.R.omega.length,pop:__ANALISE__.R.pop2k}));
  assert.strictEqual(pageErrs.length,0,'erros de JavaScript na página');
  assert.strictEqual(sw,400,'rolagem horizontal no celular');
  assert.strictEqual(res.cov,1,'cobertura deveria ser 100% com todos os dados');
  assert.ok(res.comp>0&&res.omega===1&&res.pop>100000,'indicadores calculados');
  console.log('OK: teste simulado passou');
  await b.close();
})();
