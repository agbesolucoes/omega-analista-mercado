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
  const res=await p.evaluate(()=>({call:__ANALISE__.R.parecer.call,cov:__ANALISE__.R.score.coverage,comp:__ANALISE__.R.compR.r2000,omega:__ANALISE__.R.omega.length,pop:__ANALISE__.R.pop2k,pod:__ANALISE__.R.score.items.pod,renda:__ANALISE__.R.power.renda,names:__ANALISE__.R.comp.map(c=>c.name)}));
  assert.strictEqual(pageErrs.length,0,'erros de JavaScript na página');
  assert.strictEqual(sw,400,'rolagem horizontal no celular');
  assert.strictEqual(res.cov,1,'cobertura deveria ser 100% com todos os dados');
  assert.ok(res.comp>0&&res.omega===1&&res.pop>100000,'indicadores calculados');
  assert.ok(res.pod&&res.pod.v===4&&res.renda.media>2700,'poder de compra pela renda do Censo 2022');
  assert.ok(res.names.includes('Academia do Bairro')&&res.names.includes('Studio Pilates Vida')&&!res.names.includes('Academia ao Ar Livre'),'busca de concorrentes pelo nome');
  const txt=await p.evaluate(()=>document.querySelector('#report').innerText);
  assert.ok(/Poder de compra/.test(txt)&&/Renda domiciliar per capita média/.test(txt),'seção de poder de compra no relatório');
  // WorldPop respondendo só avisos em HTML (como em outubro de 2026): a população vem da reserva e a matriz continua completa.
  const p2=await b.newPage();
  await p2.route('**/*', r=>r.request().url().includes('worldpop')?r.fulfill({status:200,contentType:'text/html',body:'<br />\n<b>Deprecated</b>:  Return type of Pimple\\Container::offsetExists($id)<br />\n'}):require('./mock-apis')(r));
  await p2.goto('file://'+require('path').resolve(__dirname,'../index.html'));
  await p2.fill('#addr','Avenida Paulista, 1000, São Paulo - SP'); await p2.click('#opt summary'); await p2.check('#nocache');
  for(const [k,v] of Object.entries({area:900,areaMin:800,aluguel:45000,fixos:80000,ticket:149,margem:70,invest:2500000,cap:3000})) await p2.fill('#'+k,String(v));
  await p2.click('#go'); await p2.waitForSelector('#s-resumo',{timeout:90000});
  const fb=await p2.evaluate(()=>({src:__ANALISE__.R.popSrc?.key,pop:__ANALISE__.R.pop2k,cov:__ANALISE__.R.score.coverage,txt:document.querySelector('#report').innerText}));
  console.log('reserva:',fb.src,Math.round(fb.pop),fb.cov);
  assert.strictEqual(fb.src,'dens','população pela densidade do município quando o WorldPop falha');
  assert.ok(Math.abs(fb.pop-7528.26*Math.PI*4)<1 && fb.cov===1,'reserva calculada e matriz completa');
  assert.ok(/densidade média/.test(fb.txt),'relatório avisa que a população é estimativa de reserva');
  // Endereço que só aparece no mapa com outra grafia ("Estrada do Crispim") e com o bairro colado na cidade.
  const p3=await b.newPage(); const asked=[];
  await p3.route('**/*', r=>{ const u=r.request().url();
    if(u.includes('localidades/estados/SP')) return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify([{id:3550308,nome:"São Paulo"},{id:3522208,nome:"Itapecerica da Serra"}])});
    if(u.includes('nominatim')&&u.includes('/search')){ asked.push(decodeURIComponent(u.split('&').filter(x=>/^(q|street|city)=/.test(x)).join('&')));
      const ok=u.includes('street=')&&u.includes('Itapecerica');
      return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(ok?[{lat:"-23.7561821",lon:"-46.8183618",display_name:"Estrada do Crispim, Mombaça, Itapecerica da Serra, São Paulo, 06867-210, Brasil",address:{road:"Estrada do Crispim",suburb:"Mombaça",city:"Itapecerica da Serra",state:"São Paulo","ISO3166-2-lvl4":"BR-SP",postcode:"06867-210"}}]:[])}); }
    return require('./mock-apis')(r); });
  await p3.goto('file://'+require('path').resolve(__dirname,'../index.html'));
  await p3.fill('#addr','Estrada Crispim, 477, Jardim Santa Júlia Itapecerica da Serra, São Paulo, SP'); await p3.click('#go');
  await p3.waitForSelector('#s-resumo',{timeout:90000});
  const g3=await p3.evaluate(()=>({city:__ANALISE__.S.geo.city,mun:__ANALISE__.S.mun?.id,n:__ANALISE__.S.geo.numberAsked,txt:document.querySelector('#report').innerText}));
  console.log('crispim:',asked,g3.city,g3.mun);
  assert.strictEqual(g3.mun,3522208,'município de Itapecerica da Serra reconhecido');
  assert.ok(g3.n==='477'&&/número 477 não está no mapa/.test(g3.txt),'avisa que só a rua foi localizada');
  // O mesmo endereço sem o estado no final: a cidade vem da lista de municípios do Brasil.
  const p4=await b.newPage(); const asked4=[];
  await p4.route('**/*', r=>{ const u=r.request().url();
    if(u.includes('localidades/municipios?view=nivelado')) return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify([{"municipio-id":3550308,"municipio-nome":"São Paulo","UF-sigla":"SP"},{"municipio-id":3133303,"municipio-nome":"Itapecerica","UF-sigla":"MG"},{"municipio-id":3522208,"municipio-nome":"Itapecerica da Serra","UF-sigla":"SP"},{"municipio-id":5005004,"municipio-nome":"Jardim","UF-sigla":"MS"}])});
    if(u.includes('localidades/estados/SP')) return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify([{id:3550308,nome:"São Paulo"},{id:3522208,nome:"Itapecerica da Serra"}])});
    if(u.includes('nominatim')&&u.includes('/search')){ asked4.push(decodeURIComponent(u.split('&').filter(x=>/^(q|street|city|state)=/.test(x)).join('&')));
      const ok=u.includes('street=')&&u.includes('Itapecerica');
      return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(ok?[{lat:"-23.7561821",lon:"-46.8183618",display_name:"Estrada do Crispim, Mombaça, Itapecerica da Serra, São Paulo, 06867-210, Brasil",address:{road:"Estrada do Crispim",suburb:"Mombaça",city:"Itapecerica da Serra",state:"São Paulo","ISO3166-2-lvl4":"BR-SP",postcode:"06867-210"}}]:[])}); }
    return require('./mock-apis')(r); });
  await p4.goto('file://'+require('path').resolve(__dirname,'../index.html'));
  await p4.fill('#addr','Estrada do Crispim, 477, Jardim Santa Júlia Itapecerica da Serra'); await p4.click('#go');
  await p4.waitForSelector('#s-resumo',{timeout:90000});
  const g4=await p4.evaluate(()=>({mun:__ANALISE__.S.mun?.id}));
  console.log('sem UF:',asked4,g4.mun);
  assert.strictEqual(g4.mun,3522208,'cidade achada sem o estado no texto');
  console.log('OK: teste simulado passou');
  await b.close();
})();
