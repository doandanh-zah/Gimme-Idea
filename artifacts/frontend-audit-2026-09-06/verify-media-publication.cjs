const {chromium,expect}=require('@playwright/test');
const crypto=require('node:crypto');const fs=require('node:fs');const {execFileSync}=require('node:child_process');
const pg=require('../../packages/db/node_modules/pg');const {createClient}=require('../../apps/web/node_modules/@supabase/supabase-js');
const api='http://127.0.0.1:3001';const base='http://127.0.0.1:3010';
const pool=new pg.Pool({connectionString:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'});
const runtime=JSON.parse(execFileSync('pnpm',['exec','supabase','status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));
const storage=createClient(runtime.API_URL,runtime.SERVICE_ROLE_KEY,{auth:{persistSession:false}}).storage;
(async()=>{const browser=await chromium.launch({headless:true});let actor;const checks=[];try{
 const subject='audit-media-'+crypto.randomUUID();const payload=Buffer.from(JSON.stringify({sub:subject,sid:crypto.randomUUID(),exp:Math.floor(Date.now()/1000)+3600,provider:'dev'})).toString('base64url');const token=`dev.${payload}.${crypto.createHmac('sha256','e2e-development-auth-secret-change-me').update(payload).digest('base64url')}`;
 const response=await fetch(api+'/v1/me/sync',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({username:subject.slice(0,30),displayName:'Media Audit Fixture'})});expect(response.ok).toBe(true);actor=(await response.json()).id;
 const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
 await context.addInitScript(({token,subject})=>{localStorage.setItem('gimme-idea-auth-v3',JSON.stringify({id:'dev:'+subject,displayName:'Media Audit Fixture',username:subject.slice(0,30),avatarInitials:'MA',avatarUrl:null,authProvider:'dev',createdAt:new Date().toISOString(),wallet:null}));sessionStorage.setItem('gimme-idea-dev-access-token',token);},{token,subject});
 const page=await context.newPage();await page.goto(base+'/en/create/problem',{waitUntil:'domcontentloaded',timeout:90000});
 const video=await page.evaluate(async()=>{const canvas=document.createElement('canvas');canvas.width=96;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='#BA91F5';ctx.fillRect(0,0,96,64);const stream=canvas.captureStream(10);const recorder=new MediaRecorder(stream,{mimeType:'video/webm'});const parts=[];recorder.ondataavailable=e=>parts.push(e.data);const done=new Promise(resolve=>{recorder.onstop=async()=>resolve(Array.from(new Uint8Array(await new Blob(parts).arrayBuffer())))});recorder.start();await new Promise(resolve=>setTimeout(resolve,300));recorder.stop();const bytes=await done;stream.getTracks().forEach(t=>t.stop());return bytes;});
 await expect(page.locator('dialog.post-composer-dialog[open]')).toBeVisible();
 for(const [id,value] of Object.entries({'post-title':'Media publication recovery '+crypto.randomUUID().slice(0,8),'post-description':'A complete public media publication tested with an image and a short video.','post-problem-body':'Operators need a dependable way to publish evidence without losing it during a network interruption.','post-who':'Independent operators','post-why':'Reliable evidence helps readers understand the actual problem.'}))await page.locator('#'+id).fill(value);
 await page.locator('dialog input[type=file]').setInputFiles([{name:'audit-image.png',mimeType:'image/png',buffer:fs.readFileSync('apps/web/public/brand/logo-gmi.png')},{name:'audit-video.webm',mimeType:'video/webm',buffer:Buffer.from(video)}]);
 let failed=false,creates=0,intents=0,confirmationLost=false;
 await page.route('**/v1/uploads/*/complete',async route=>{if(!confirmationLost){confirmationLost=true;const response=await route.fetch();if(response.status()!==204)return route.fulfill({response});await route.abort('failed');}else await route.continue();});
 page.on('request',request=>{if(request.method()==='POST'&&request.url()===api+'/v1/problems')creates++;if(request.url()===api+'/v1/uploads/intents')intents++;});
 await page.route('**/v1/uploads/*/attach',async route=>{if(!failed){failed=true;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Simulated attachment interruption'})});}else await route.continue()});
 await page.route('**/v1/problems/*/publish',async route=>{
  const assets=(await pool.query('select id,bucket,object_key from public.media_assets where owner_id=$1',[actor])).rows;
  expect(assets).toHaveLength(2);
  for(const asset of assets){expect((await fetch(api+'/v1/uploads/'+asset.id+'/download')).status).toBe(404);expect((await fetch(runtime.API_URL+'/storage/v1/object/public/'+asset.bucket+'/'+asset.object_key)).ok).toBe(false);}
  checks.push('unpublished media denied through API and direct public storage URL');await route.continue();
 });
 const post=page.locator('dialog').getByRole('button',{name:'Post',exact:true});await post.click();await expect(page.getByText('The connection was interrupted. Check your network and try again.')).toBeVisible();await post.click();await expect(page.getByText('The action could not be completed. Try again; if it keeps failing, contact support.')).toBeVisible();await post.click();
 await page.waitForURL(/\/en\/problems\/media-publication-recovery-/, {timeout:60000});
 expect(creates).toBe(1);expect(intents).toBe(2);checks.push('lost upload confirmation and attachment retry created one Problem and uploaded each of two files once');
 const anon=await browser.newContext({viewport:{width:360,height:800},reducedMotion:'reduce'});const reader=await anon.newPage();reader.on('response',r=>{if(r.url().includes('/download'))console.log('Anonymous media permission:',r.status());});reader.on('pageerror',e=>console.log('Reader error:',e.message));await reader.goto(page.url(),{waitUntil:'domcontentloaded',timeout:90000});
 const gallery=reader.locator('.post-attachment-stack').filter({visible:true});
 console.log('Gallery text:',await gallery.textContent());await expect(gallery.locator('img')).toBeVisible({timeout:20000});await expect.poll(()=>gallery.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 await expect.poll(()=>gallery.locator('video').evaluate(video=>video.readyState)).toBeGreaterThanOrEqual(1);checks.push('anonymous second session reads published image and video from storage');
 const opener=gallery.locator('.stored-media-open').first();
 const imageButton=gallery.getByRole('button',{name:'audit-image.png',exact:false});
 if(await imageButton.count())await imageButton.first().click();else await gallery.locator('button').first().click();
 const dialog=reader.locator('dialog.media-viewer[open]');await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'Close media'})).toBeFocused();await reader.keyboard.press('Escape');await expect(reader.locator('dialog.media-viewer[open]')).toHaveCount(0);checks.push('published media opens a native modal and Escape closes it');
 await reader.screenshot({path:'artifacts/frontend-audit-2026-09-06/published-media-mobile.png',fullPage:true});console.log(JSON.stringify(checks));
 }finally{await browser.close();if(actor){const assets=(await pool.query('select bucket,object_key from public.media_assets where owner_id=$1',[actor])).rows;for(const bucket of new Set(assets.map(a=>a.bucket))){const result=await storage.from(bucket).remove(assets.filter(a=>a.bucket===bucket).map(a=>a.object_key));if(result.error)throw result.error;}await pool.query('delete from public.entity_media_assets where media_asset_id in(select id from public.media_assets where owner_id=$1)',[actor]);await pool.query('delete from public.media_assets where owner_id=$1',[actor]);await pool.query('delete from public.idempotency_keys where actor_id=$1',[actor]);await pool.query('delete from public.problems where created_by=$1',[actor]);await pool.query('delete from public.users where id=$1',[actor]);}await pool.end();fs.writeFileSync('artifacts/frontend-audit-2026-09-06/media-browser-check.json',JSON.stringify(checks,null,2));}
})().catch(e=>{console.error(e.message);process.exitCode=1});
