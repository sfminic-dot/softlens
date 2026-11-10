import {defaults,normalize,gradient,siteKey,SCRIPT_VERSION,type Settings} from './settings';
(() => {
 if(window.top!==window||document.getElementById('soft-lens-background-style'))return;
 const marker='data-soft-lens-background',style=document.createElement('style');style.id='soft-lens-background-style';
 const key=siteKey(location.hostname),excluded=new Set(['IMG','VIDEO','CANVAS','SVG','IFRAME','PICTURE','INPUT','TEXTAREA','SELECT','BUTTON','SCRIPT','STYLE','LINK','META','HEAD']);
 let settings:Settings={...defaults},siteEnabled=true,revision=0,loaded=false,running=false;
 let idle:number|undefined,walker:TreeWalker|undefined;
 const pending=new Map<Element,boolean>();
 function schedule(){if(running&&idle===undefined&&(walker||pending.size))idle=requestIdleCallback(process,{timeout:500});}
 function enqueue(e:Element,subtree:boolean){
  if(!e.isConnected||e===style)return;
  if(pending.size>=1024){pending.clear();pending.set(document.documentElement,true);}
  else pending.set(e,subtree||pending.get(e)===true);
  schedule();
 }
 function qualifies(e:HTMLElement){
  const c=getComputedStyle(e),color=c.backgroundColor;
  const values=color.match(/[\d.]+/g)?.map(Number)??[];
  const white=values.length>=3&&values[0]>=242&&values[1]>=242&&values[2]>=242&&Math.max(values[0],values[1],values[2])-Math.min(values[0],values[1],values[2])<=8&&(values[3]??1)>=.98;
  const canvas=e===document.documentElement&&color==='rgba(0, 0, 0, 0)'&&getComputedStyle(document.body).backgroundColor==='rgba(0, 0, 0, 0)';
  return (white||canvas)&&(c.backgroundImage==='none'||e.hasAttribute(marker));
 }
 function process(deadline:IdleDeadline){
  idle=undefined;if(!running)return;
  const changes:[HTMLElement,boolean][]=[],start=performance.now();let count=0;
  // Read first, then write; each chunk yields after 80 nodes or ~3 ms.
  do{
   let e:Element|undefined;
   if(walker){if(!walker.root.isConnected){walker=undefined;continue;}const next=walker.nextNode();if(next)e=next as Element;else{walker=undefined;continue;}}
   else{const task=pending.entries().next().value as [Element,boolean]|undefined;if(!task)break;pending.delete(task[0]);e=task[0];if(!e.isConnected)continue;if(task[1])walker=document.createTreeWalker(e,NodeFilter.SHOW_ELEMENT);}
   count++;
   if(!(e instanceof HTMLElement)||excluded.has(e.tagName))continue;
   const wanted=qualifies(e);if(wanted!==e.hasAttribute(marker))changes.push([e,wanted]);
  }while(count<80&&performance.now()-start<3&&(deadline.didTimeout||deadline.timeRemaining()>1));
  for(const [e,wanted]of changes)if(e.isConnected){if(wanted)e.setAttribute(marker,'');else e.removeAttribute(marker);}
  schedule();
 }
 const observer=new MutationObserver(records=>{
  for(const record of records){
   if(record.target===style)continue;
   if(record.type==='attributes')enqueue(record.target as Element,false);
   else for(const node of Array.from(record.addedNodes))if(node instanceof HTMLElement&&node!==style){if(!pending.get(node.parentElement!))enqueue(node,true);}
  }
  if(!style.isConnected)document.documentElement.append(style);
 });
 function lifecycle(){
  const active=loaded&&settings.enabled&&siteEnabled&&settings.intensity>0&&!document.fullscreenElement;
  const bg=gradient(settings.palette).replace(/#[0-9a-f]{6}/gi,hex=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${settings.intensity/100*.62})`;});
  const css=active?`[${marker}]{background-image:${bg}!important;background-attachment:fixed!important;background-size:100vw 100vh!important;background-repeat:no-repeat!important;background-position:0 0!important;}`:'';
  if(style.textContent!==css)style.textContent=css;
  const next=active&&!document.hidden;
  if(next===running)return;running=next;
  if(running){if(!style.isConnected)document.documentElement.append(style);observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});enqueue(document.documentElement,true);}
  else{observer.disconnect();if(idle!==undefined)cancelIdleCallback(idle);idle=undefined;walker=undefined;pending.clear();}
 }
 chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local'||(!changes.settings&&!changes[key]))return;revision++;if(changes.settings)settings=normalize(changes.settings.newValue);if(changes[key])siteEnabled=changes[key].newValue!==false;lifecycle();});
 const initial=revision;chrome.storage.local.get(['settings',key]).then(data=>{if(revision===initial){settings=normalize(data.settings);siteEnabled=data[key]!==false;}loaded=true;lifecycle();}).catch(()=>{loaded=true;lifecycle();});
 document.addEventListener('fullscreenchange',lifecycle);document.addEventListener('visibilitychange',lifecycle);
 chrome.runtime.onMessage.addListener((message,_sender,reply)=>{if(message?.type==='soft-lens:ping')reply({ready:true,version:SCRIPT_VERSION,palette:settings.palette});});
 document.documentElement.append(style);
})();
