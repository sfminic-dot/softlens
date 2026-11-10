import {chromium} from 'playwright';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const browser=await chromium.launch({...(process.env.SOFTLENS_CHROMIUM_PATH?{executablePath:process.env.SOFTLENS_CHROMIUM_PATH}:{channel:'chromium'}),headless:true});
const results=[];
try {
for(const [name,path] of [['1.1',process.env.SOFT_LENS_BASELINE??'../../work/content-1.1.js'],['1.2','dist/content.js']]){
const p=await browser.newPage();await p.setContent('<body style="background:white"><main id="list">'+Array.from({length:1200},(_,i)=>`<div id="card${i}" style="background:white">Card ${i}</div>`).join('')+'</main></body>');
await p.evaluate(()=>{window.reads=0;const original=window.getComputedStyle;window.getComputedStyle=function(...args){window.reads++;return original.apply(this,args)};window.chrome={storage:{local:{get:async()=>({})},onChanged:{addListener:f=>window.change=f}},runtime:{onMessage:{addListener:()=>{}}}}});
const session=await p.context().newCDPSession(p);await session.send('Performance.enable');
await p.addScriptTag({content:readFileSync(resolve(path),'utf8')});
await p.waitForFunction(()=>document.querySelector('#card1199').hasAttribute('data-soft-lens-background'));
await p.waitForTimeout(300);
const initial=await p.evaluate(()=>window.reads);await p.evaluate(()=>window.reads=0);
const before=(await session.send('Performance.getMetrics')).metrics;
for(let i=0;i<12;i++){await p.locator('#list').evaluate((e,i)=>e.className='update-'+i,i);await p.waitForTimeout(60)}
await p.waitForTimeout(2000);
const reads=await p.evaluate(()=>window.reads),after=(await session.send('Performance.getMetrics')).metrics;
const delta=n=>Math.round((after.find(x=>x.name===n).value-before.find(x=>x.name===n).value)*1000*100)/100;
const row={version:name,nodes:1200,classChanges:12,initialStyleReads:initial,updateStyleReads:reads,scriptMs:delta('ScriptDuration'),styleRecalculationMs:delta('RecalcStyleDuration')};
await p.evaluate(()=>window.reads=0);await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>window.reads),0,'no idle scanning');
await p.evaluate(()=>window.change({settings:{newValue:{enabled:false,intensity:20,palette:'lens'}}},'local'));
await p.evaluate(()=>{window.reads=0;for(let i=0;i<100;i++){const e=document.createElement('div');e.style.background='white';document.body.append(e)}});await p.waitForTimeout(500);
row.disabledStyleReads=await p.evaluate(()=>window.reads);
if(name==='1.2')assert.equal(row.disabledStyleReads,0,'no background work when disabled');
if(name==='1.2'){
await p.evaluate(()=>window.change({settings:{newValue:{enabled:true,intensity:20,palette:'lens'}}},'local'));
await p.waitForTimeout(500);
await p.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));window.reads=0;const e=document.createElement('div');e.id='hidden-added';e.style.background='white';document.body.append(e)});
await p.waitForTimeout(300);row.hiddenStyleReads=await p.evaluate(()=>window.reads);assert.equal(row.hiddenStyleReads,0);
await p.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'))});
await p.waitForFunction(()=>document.querySelector('#hidden-added').hasAttribute('data-soft-lens-background'));
}
results.push(row);await p.close();
}
writeFileSync(resolve('../performance-results.json'),JSON.stringify({scenario:'Controlled Chromium benchmark; times vary by machine and website',results},null,2));console.log(JSON.stringify(results,null,2));
assert.ok(results[1].updateStyleReads<results[0].updateStyleReads/10);
}finally{await browser.close()}
