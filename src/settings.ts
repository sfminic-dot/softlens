// Kept in the injected bundle so a stale webpage script can be detected.
export const SCRIPT_VERSION='1.4.0';
export const palettes = {
  lens: {name:'截图同款', colors:['#95c2ff','#d1b9ed','#ffbca5','#fff1a6']},
  blue: {name:'蓝紫', colors:['#91c6ff','#b69aeb','#ccbcff','#c9e5ff']},
  peach: {name:'暖桃', colors:['#ffd0b9','#eebbd4','#ffa98f','#ffe7a0']},
  mint: {name:'薄荷', colors:['#a1e2d4','#bed1f5','#b7e8bb','#f1edb4']},
  iris: {name:'雾色鸢尾', colors:["#b8baf8","#c2b5f5","#e0c4f4","#a9daed"]},
  sky: {name:'晴空流云', colors:["#8dcae3","#acd8fc","#9ddde7","#9ce0d0"]},
  jade: {name:'青玉微光', colors:["#8bceb6","#7ecfbd","#a1ded2","#c2da91"]},
  rose: {name:'玫瑰薄雾', colors:["#efbfdd","#deade3","#f3bed1","#ffd19a"]},
  amber: {name:'琥珀晨曦', colors:["#e9c162","#ffc182","#fdbdaf","#f3d768"]},
  sand: {name:'砂岩暮色', colors:["#cfceca","#dbd8e0","#dfcdc5","#d8d0bf"]},
  ocean: {name:'海盐苏打', colors:["#a5d8ff","#bac8ff","#99e9f2","#c3fae8"]},
  grape: {name:'葡萄星云', colors:["#d0bfff","#eebefa","#fcc2d7","#dbe4ff"]},
  sunset: {name:'落日橘光', colors:["#ffd8a8","#fcc2d7","#ffc9c9","#ffec99"]},
  citrus: {name:'柠檬奶油', colors:["#ffec99","#ffe8cc","#d8f5a2","#fff3bf"]},
  sakura: {name:'樱花来信', colors:["#fcc2d7","#f3d9fa","#ffe3e3","#ffe8cc"]},
  meadow: {name:'青柠旷野', colors:["#96f2d7","#b2f2bb","#d8f5a2","#fff3bf"]}
} as const;
export type Palette = keyof typeof palettes;
export const paletteGroups: {name:string;ids:Palette[]}[] = [
 {name:'经典配色',ids:['lens','blue','peach','mint']},
 {name:'Radix Colors',ids:['iris','sky','jade','rose','amber','sand']},
 {name:'Open Color',ids:['ocean','grape','sunset','citrus','sakura','meadow']}
];
export interface Settings { enabled:boolean; intensity:number; palette:Palette; motion:boolean }
export const defaults: Settings = {enabled:true,intensity:20,palette:'lens',motion:false};
export function normalize(value: unknown): Settings {
 const v = (value && typeof value === 'object' ? value : {}) as Partial<Settings>;
 return {enabled:typeof v.enabled==='boolean'?v.enabled:true,intensity:typeof v.intensity==='number'&&Number.isFinite(v.intensity)?Math.max(0,Math.min(100,v.intensity)):20,palette:Object.hasOwn(palettes,v.palette??'')?v.palette as Palette:'lens',motion:typeof v.motion==='boolean'?v.motion:false};
}
export function gradient(p:Palette) { const c=palettes[p].colors; return `radial-gradient(ellipse 70% 115% at -8% 48%, ${c[0]} 0%, transparent 84%), radial-gradient(ellipse 65% 85% at 105% -8%, ${c[1]} 0%, transparent 85%), radial-gradient(ellipse 64% 100% at 108% 100%, ${c[2]} 0%, transparent 83%), radial-gradient(ellipse 48% 55% at 63% 112%, ${c[3]} 0%, transparent 80%)`; }
export const siteKey=(hostname:string)=>`site:${hostname.toLowerCase()}`;
export function supported(url:string) { try {const u=new URL(url);return ['http:','https:'].includes(u.protocol)&&u.hostname!=='chromewebstore.google.com'&&!(u.hostname==='chrome.google.com'&&u.pathname.startsWith('/webstore'));}catch{return false;} }
