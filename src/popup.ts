import './popup.css';
import {defaults,normalize,palettes,paletteGroups,gradient,siteKey,supported,SCRIPT_VERSION,type Settings,type Palette} from './settings';
document.documentElement.style.setProperty('--popup-width',`${Math.min(440,Math.max(280,screen.availWidth-32))}px`);
document.documentElement.style.setProperty('--popup-height',`${Math.min(600,Math.max(320,screen.availHeight-80))}px`);
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const enabled=el<HTMLInputElement>('enabled'),site=el<HTMLInputElement>('site'),intensity=el<HTMLInputElement>('intensity'),motion=el<HTMLInputElement>('motion'),notice=el('notice');
motion.disabled=true;motion.closest('section')!.querySelector('p')!.textContent='背景保护模式使用静态渐变';
let settings:Settings={...defaults},key:string|undefined,ready=false;
el('palettes').closest('fieldset')!.querySelector('legend')!.textContent='选择配色 · 16 套（滚动查看更多）';
for(const group of paletteGroups){
 const heading=document.createElement('div');heading.className='palette-group';heading.textContent=group.name;el('palettes').append(heading);
 for(const id of group.ids){const p=palettes[id];const label=document.createElement('label');label.className='palette';label.title=p.name+' · '+group.name;const input=document.createElement('input');input.type='radio';input.name='palette';input.value=id;input.setAttribute('aria-label',p.name);const swatch=document.createElement('span');swatch.className='swatch';swatch.style.backgroundImage=gradient(id);const name=document.createElement('span');name.className='name';name.textContent=p.name;label.append(input,swatch,name);el('palettes').append(label);input.addEventListener('change',()=>save({palette:id}));}
}
function render(){enabled.checked=settings.enabled;intensity.value=String(settings.intensity);el('percent').textContent=`${settings.intensity}%`;motion.checked=false;document.querySelectorAll<HTMLInputElement>('[name=palette]').forEach(i=>i.checked=i.value===settings.palette);}
let queue=Promise.resolve();
function write(data:Record<string,unknown>){el('saved').textContent='正在保存…';queue=queue.then(()=>chrome.storage.local.set(data)).then(()=>{el('saved').textContent='已自动保存';}).catch(()=>{el('saved').textContent='保存失败，请重试';});}
let sliderTimer:ReturnType<typeof setTimeout>|undefined;
function flushSlider(){if(sliderTimer!==undefined){clearTimeout(sliderTimer);sliderTimer=undefined;write({settings:{...settings}});}}
function save(patch:Partial<Settings>,delay=false){if(!ready)return;settings={...settings,...patch};render();if(sliderTimer!==undefined)clearTimeout(sliderTimer);sliderTimer=undefined;if(delay)sliderTimer=setTimeout(()=>{sliderTimer=undefined;write({settings:{...settings}});},100);else write({settings:{...settings}});}
enabled.addEventListener('change',()=>save({enabled:enabled.checked}));intensity.addEventListener('input',()=>save({intensity:Number(intensity.value)},true));intensity.addEventListener('change',flushSlider);window.addEventListener('pagehide',flushSlider);motion.addEventListener('change',()=>save({motion:motion.checked}));site.addEventListener('change',()=>{if(key)write({[key]:site.checked});});
el('reset').addEventListener('click',()=>{if(!ready)return;settings={...defaults};site.checked=!!key;render();write({settings,...(key?{[key]:true}:{})});});
async function init(){try{const data=await chrome.storage.local.get(null);settings=normalize(data.settings);render();ready=true;const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(tab?.url&&supported(tab.url)){const hostname=new URL(tab.url).hostname;key=siteKey(hostname);el('hostname').textContent=hostname;site.checked=data[key]!==false;site.disabled=false;try{const status=await chrome.tabs.sendMessage(tab.id!,{type:'soft-lens:ping'});if(status?.version!==SCRIPT_VERSION){notice.hidden=false;notice.textContent='网页脚本仍是旧版：请在扩展管理页重新加载扩展，再刷新网页，新配色才能生效。';}}catch{notice.hidden=false;notice.textContent='请刷新网页以加载效果；也请检查扩展的网站访问权限。';}}else{el('hostname').textContent='浏览器受限制页面';notice.hidden=false;notice.textContent='此页面不支持渐变效果';}}catch{notice.hidden=false;notice.textContent='无法读取设置，请关闭弹窗后重试。';}}
chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;if(changes.settings){settings=normalize(changes.settings.newValue);render();}if(key&&changes[key])site.checked=changes[key].newValue!==false;});
void init();
