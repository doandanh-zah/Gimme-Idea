const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({headless:true}); const results=[];
 try {
  for(const blocked of [false,true]) {
   const c=await b.newContext({viewport:{width:1440,height:1000}});
   if(blocked) await c.route(/https:\/\/.*(?:typekit\.net|adobe\.com)\//,r=>r.abort());
   await c.addInitScript(()=>{
    window.auditCLS=0;
    new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.auditCLS+=e.value}).observe({type:'layout-shift',buffered:true});
    const get=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){if(/webgl/.test(type))return null;return get.call(this,type,...args)};
   });
   const p=await c.newPage();
   const failures=[];p.on('requestfailed',r=>failures.push(r.url()));
   await p.goto('http://127.0.0.1:3011/vi',{waitUntil:'networkidle'});
   await expect(p.getByRole('heading',{level:1})).toBeVisible();
   await expect(p.locator('.brain-fallback')).toBeVisible();
   await expect(p.getByRole('button',{name:'Dừng chuyển động',exact:true})).toHaveCount(0);
   const result=await p.evaluate(()=>({fontBlocked:false,cls:window.auditCLS,overflow:document.documentElement.scrollWidth>innerWidth,displayFont:getComputedStyle(document.querySelector('h1')).fontFamily,bodyFont:getComputedStyle(document.body).fontFamily}));
   Object.assign(result,{fontBlocked:blocked,failures,webglFallback:true});results.push(result);console.log(JSON.stringify(result));
   await p.screenshot({path:`artifacts/frontend-audit-2026-09-06/production-font-${blocked?'blocked':'normal'}.png`});
   await c.close();
  }
  const c=await b.newContext({reducedMotion:'reduce'});const p=await c.newPage();
  for(const width of [320,360,760,761,768,769,1180,1181,1280,1281,1440]) {
   await p.setViewportSize({width,height:900});
   await p.goto('http://127.0.0.1:3011/vi/problems/restaurant-food-waste');
   const nav=p.locator('.page-index').filter({visible:true});
   const link=nav.getByRole('link').nth(1);const href=await link.getAttribute('href');
   await link.click();
   await expect(link).toHaveAttribute('aria-current','location');
   const positions=await p.evaluate(href=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,target:document.querySelector(href).getBoundingClientRect().top,indexBottom:[...document.querySelectorAll('.page-index')].find(n=>n.getBoundingClientRect().height>0).getBoundingClientRect().bottom}),href);
   expect(positions.overflow).toBe(false);
   expect(positions.target).toBeGreaterThanOrEqual(positions.indexBottom-1);
   expect(positions.target-positions.indexBottom).toBeLessThan(40);
   results.push(positions);console.log(JSON.stringify(positions));
  }
 } finally {fs.writeFileSync('artifacts/frontend-audit-2026-09-06/production-browser-check.json',JSON.stringify(results,null,2));await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
