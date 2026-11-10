import {launchExtension} from './helpers.mjs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const firstColors={lens:'#95c2ff',blue:'#91c6ff',peach:'#ffd0b9',mint:'#a1e2d4',...Object.fromEntries(JSON.parse(readFileSync('palette-sources.json')).palettes.map(p=>[p.id,p.colors[0]]))};
const c=await launchExtension();
try{
const manager=await c.newPage();await manager.goto('chrome://extensions');const info=await manager.evaluate(()=>new Promise(r=>chrome.developerPrivate.getExtensionsInfo({},r)));const id=info.find(i=>i.name.includes('Soft Lens')).id;
await c.route('https://palette-test.local/**',r=>r.fulfill({contentType:'text/html',body:'<body style="background:white"><div id="white" style="background:white;width:260px;height:180px">清晰文字</div></body>'}));
const target=await c.newPage();await target.goto('https://palette-test.local/');await target.waitForFunction(()=>document.querySelector('#white').hasAttribute('data-soft-lens-background'));
const p=await c.newPage();await p.setViewportSize({width:440,height:600});await p.goto(`chrome-extension://${id}/popup.html`);
await p.waitForFunction(()=>document.querySelectorAll('[name=palette]').length===16);
const ids=await p.locator('[name=palette]').evaluateAll(es=>es.map(e=>e.value));assert.equal(new Set(ids).size,16);
const backgrounds=new Set();
for(const palette of ids){await p.locator(`[name=palette][value=${palette}]`).check();await p.waitForFunction(async palette=>(await chrome.storage.local.get('settings')).settings?.palette===palette,palette);const hex=firstColors[palette];const n=parseInt(hex.slice(1),16);const expected='rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+',';await target.waitForFunction(expected=>document.querySelector('#soft-lens-background-style').textContent.includes(expected),expected);backgrounds.add(await target.locator('#white').evaluate(e=>getComputedStyle(e).backgroundImage));}
assert.equal(backgrounds.size,16,'all 16 selections change the actual webpage gradient');
await p.reload();await p.locator('[value=meadow]').waitFor();await p.waitForFunction(()=>document.querySelector('[value=meadow]').checked);
await p.locator('[value=lens]').focus();await p.keyboard.press('ArrowRight');await p.waitForFunction(()=>document.querySelector('[value=blue]').checked);
await p.locator('[value=lens]').check();await p.locator('#palettes').evaluate(e=>e.scrollTop=0);await p.locator('#saved').click();await p.evaluate(()=>window.scrollTo(0,0));
assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=440),'no horizontal overflow');
await p.screenshot({path:resolve('artifacts/popup-preview.png')});
await p.locator('#palettes').evaluate(e=>e.scrollTop=e.scrollHeight);await p.screenshot({path:resolve('artifacts/popup-more-palettes.png')});
assert.ok(await p.locator('header').evaluate(e=>e.getBoundingClientRect().top>=0),'header visible');assert.ok(await p.locator('#palettes').evaluate(e=>e.scrollHeight>e.clientHeight),'palette panel scrolls internally');
assert.ok(await p.locator('footer').evaluate(e=>e.getBoundingClientRect().bottom<=600),'footer fits popup');
const compact=await c.newPage();await compact.setViewportSize({width:320,height:420});await compact.addInitScript(()=>{Object.defineProperty(screen,'availWidth',{value:352});Object.defineProperty(screen,'availHeight',{value:500})});await compact.goto('chrome-extension://'+id+'/popup.html');await compact.waitForFunction(()=>document.querySelectorAll('[name=palette]').length===16);assert.ok(await compact.evaluate(()=>document.documentElement.scrollWidth<=320),'compact has no horizontal overflow');await compact.screenshot({path:resolve('artifacts/popup-compact.png')});
const stale=await c.newPage();await stale.addInitScript(()=>{chrome.tabs.query=async()=>[{id:123,url:'https://palette-test.local/'}];chrome.tabs.sendMessage=async()=>({ready:true})});await stale.goto('chrome-extension://'+id+'/popup.html');await stale.waitForFunction(()=>document.querySelector('#notice').textContent.includes('旧版'));
console.log('PASS: 16 palettes, storage selection for every palette, reload persistence, keyboard arrows, actual webpage gradients, 440px and 320px layouts');
}finally{await c.close()}
