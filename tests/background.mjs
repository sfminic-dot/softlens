import {launchExtension} from './helpers.mjs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const c=await launchExtension();
try {
const p=await c.newPage();
await c.route('https://soft-lens.test/**',r=>r.fulfill({contentType:'text/html',body:`<body style="background:white"><h1>清晰文字 Black text</h1><div id="white" style="background:#fff;width:300px;height:120px">White card</div><div id="dark" style="background:#222;color:white">Dark card</div><img id="image" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='white'/%3E%3C/svg%3E"><button>Button</button></body>`}));
await p.goto('https://soft-lens.test/a');
await p.waitForFunction(()=>document.querySelector('#white').hasAttribute('data-soft-lens-background'));
assert.match(await p.locator('#white').evaluate(e=>getComputedStyle(e).backgroundImage),/radial-gradient/);
assert.equal(await p.locator('h1').evaluate(e=>getComputedStyle(e).color),'rgb(0, 0, 0)');
for(const id of ['dark','image'])assert.equal(await p.locator('#'+id).evaluate(e=>getComputedStyle(e).backgroundImage),'none');
assert.equal(await p.locator('#image').evaluate(e=>getComputedStyle(e).opacity),'1');
await p.evaluate(()=>{const e=document.createElement('div');e.id='dynamic';e.style.background='white';document.body.append(e)});
await p.waitForFunction(()=>document.querySelector('#dynamic').hasAttribute('data-soft-lens-background'));
await p.locator('#white').evaluate(e=>e.style.backgroundColor='#222');
await p.waitForFunction(()=>getComputedStyle(document.querySelector('#white')).backgroundImage==='none');
await p.screenshot({path:resolve('artifacts/background-preview.png')});
console.log('PASS: white backgrounds tinted; black text, images, dark backgrounds preserved; dynamic additions and theme changes');
}finally{await c.close()}
