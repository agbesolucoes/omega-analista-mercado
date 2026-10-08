const { chromium } = require('playwright');
// Teste offline: todas as APIs externas são simuladas.
const OUT=process.argv[2]||require('path').resolve(__dirname,'../test-results'); require('fs').mkdirSync(OUT,{recursive:true});
const assert=require('assert');
const LAT=-23.5613, LON=-46.6565;
const off=(dm,dn)=>({lat:LAT+dm/110540, lon:LON+dn/(111320*Math.cos(LAT*Math.PI/180))});
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1300,height:900}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push('console: '+m.text())});
  await p.route('**/*', async r=>{
    const u=r.request().url(); if(u.startsWith('file:')) return r.continue();
    const lib=[['pdfmake/0.2.10/pdfmake.min.js','pdfmake/build/pdfmake.min.js'],['pdfmake/0.2.10/vfs_fonts.js','pdfmake/build/vfs_fonts.js'],['leaflet/1.9.4/leaflet.min.js','leaflet/dist/leaflet.js']].find(([k])=>u.includes(k));
    if(lib) return r.fulfill({status:200,contentType:'application/javascript',body:require('fs').readFileSync(require.resolve(lib[1]))}); const J=o=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(o)});
    if(u.includes('nominatim')) return J([{lat:String(LAT),lon:String(LON),display_name:"Avenida Paulista, 1000, Bela Vista, São Paulo, SP",address:{house_number:"1000",road:"Avenida Paulista",suburb:"Bela Vista",city:"São Paulo",state:"São Paulo","ISO3166-2-lvl4":"BR-SP",postcode:"01310-100"}},{lat:"-23.56",lon:"-46.65",display_name:"Alternativa",address:{road:"Av Paulista",city:"São Paulo","ISO3166-2-lvl4":"BR-SP"}}]);
    if(u.includes('localidades/estados/SP')) return J([{id:3550308,nome:"São Paulo"},{id:3509502,nome:"Campinas"}]);
    if(u.includes('/t/4714/')) return J([{NC:"Nível",V:"Valor",D1C:"Município (Código)",D2N:"Variável",D2C:"Variável (Código)",D3N:"Ano",MN:"Unidade de Medida"},{V:"11451999",D2C:"93",D2N:"População residente",D3N:"2022",MN:"Pessoas"},{V:"1521.202",D2C:"6318",D3N:"2022"},{V:"7528.26",D2C:"614",D3N:"2022"}]);
    if(u.includes('/t/9514/')){ const rows=[{D4N:"Idade",V:"Valor"},{D4N:"Total",V:"11451999"}]; const w=[5,5,5,7,8,8,8,8,8,7,7,6,6,5,4,3,2,1.5,1,0.4,0.1]; const s=w.reduce((a,b)=>a+b); w.forEach((x,i)=>{const a=i*5; rows.push({D4N:i===20?"100 anos ou mais":`${a} a ${a+4} anos`,V:String(Math.round(11451999*x/s))});}); rows.push({D4N:"5 anos",V:"100000"}); rows.push({D4N:"15 a 64 anos",V:"8000000"}); return J(rows);}
    if(u.includes('/t/5938/')) return J([{V:"Valor",D2C:"Variável (Código)",D3N:"Ano"},{V:"828980607",D2C:"37",D3N:"2021"}]);
    if(u.includes('/t/6579/')) return J([{V:"Valor",D2C:"Variável (Código)",D3N:"Ano"},{V:"12396372",D2C:"9324",D3N:"2021"}]);
    if(u.includes('worldpop')){ const gj=JSON.parse(decodeURIComponent(u.split('geojson=')[1].split('&')[0])); const pt=gj.features[0].geometry.coordinates[0][0]; const r=(pt[1]-LAT)*110540; return J({status:"finished",error:false,data:{total_population:11000*Math.PI*(r/1000)**2}}); }
    if(u.includes('interpreter')){ const q=decodeURIComponent(r.request().postData().slice(5));
      if(q.includes('fitness_centre')){ const el=[]; for(let i=0;i<14;i++){const c=off(Math.sin(i)*200*i,Math.cos(i)*180*i); el.push({type:'node',id:100+i,lat:c.lat,lon:c.lon,tags:{leisure:'fitness_centre',name:['Smart Fit','Bodytech','Studio Pilates Ana','CrossFit Paulista','Academia Força'][i%5]+' '+i,sport:i%5===2?'pilates':i%5===3?'crossfit':'fitness',...(i%5===0?{brand:'Smart Fit'}:{}),opening_hours:i%2?'Mo-Fr 06:00-23:00':undefined,'addr:street':'Rua Teste','addr:housenumber':String(i)}});}
        const o=off(1500,900); el.push({type:'way',id:999,center:o,tags:{leisure:'fitness_centre',name:'Omega Academia Jardins'}}); return J({elements:el}); }
      if(q.includes('out count')) return J({elements:Array.from({length:10},(_,k)=>({type:'count',id:0,tags:{total:String(300+k*250)}}))});
      if(q.includes('bus_stop')){ const el=[]; const add=(k,tags,n,maxd)=>{for(let i=0;i<n;i++){const c=off((i*137%maxd)-maxd/2,(i*71%maxd)-maxd/2); el.push({type:'node',id:k*1000+i,lat:c.lat,lon:c.lon,tags});}};
        add(1,{highway:'bus_stop',name:'Ponto'},40,2600); add(2,{railway:'station',name:'Estação Trianon-Masp'},2,1200); add(3,{amenity:'school',name:'Escola X'},12,3000); add(4,{shop:'supermarket',name:'Pão de Açúcar'},6,3000); add(5,{amenity:'university',name:'FGV'},3,2000);
        return J({elements:el}); }
      const g=n=>[off(n,-2000),off(n,2000)]; return J({elements:[{type:'way',id:1,tags:{highway:'trunk',name:'Av. 23 de Maio'},geometry:g(600)},{type:'way',id:2,tags:{highway:'primary',name:'Avenida Paulista'},geometry:g(30)},{type:'way',id:3,tags:{waterway:'river',name:'Rio Pinheiros'},geometry:g(1900)}]}); }
    return r.abort();
  });
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
