const {chromium}=require('@playwright/test');
const AxeBuilder=require('@axe-core/playwright').default;
const fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({headless:true});
 const findings=[];
 try {
  const c=await b.newContext({reducedMotion:'reduce'});
  const p=await c.newPage();
  p.on('pageerror',e=>findings.push({pageerror:e.message}));
  for(const path of ['/vi/home','/vi/problems','/vi/ideas','/vi/projects','/vi/bounties','/vi/search?q=restaurants','/vi/problems/restaurant-food-waste','/vi/ideas/demand-pulse-for-kitchens']){
   await p.setViewportSize({width:360,height:800});
   const r=await p.goto('http://127.0.0.1:3010'+path,{waitUntil:'domcontentloaded',timeout:90000});
   const heading=p.getByRole('heading',{level:1}).first();
   await heading.waitFor({timeout:30000});
   const a=await new AxeBuilder({page:p}).include('main').analyze();
   const item={path,status:r.status(),heading:await heading.textContent(),overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),violations:a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))};
   console.log(JSON.stringify(item));findings.push(item);
   await p.screenshot({path:`artifacts/frontend-audit-2026-09-06/route-${findings.length}.png`});
  }
  for(const width of [768,1180,1181,1280,1281,1440]){
   await p.setViewportSize({width,height:900});
   await p.goto('http://127.0.0.1:3010/vi/home',{waitUntil:'domcontentloaded'});
   const item=await p.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,main:document.querySelector('.product-main')?.getBoundingClientRect().width}));
   findings.push(item);console.log(JSON.stringify(item));
   await p.screenshot({path:`artifacts/frontend-audit-2026-09-06/home-${width}.png`});
  }
 } finally {
  fs.writeFileSync('artifacts/frontend-audit-2026-09-06/route-browser-check.json',JSON.stringify(findings,null,2));
  await b.close();
 }
})().catch(e=>{console.error(e);process.exit(1)});
