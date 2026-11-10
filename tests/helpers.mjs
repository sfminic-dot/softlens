import {chromium} from 'playwright';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
export async function launchExtension(){
 await mkdir('artifacts',{recursive:true});
 const profile=await mkdtemp(join(tmpdir(),'softlens-test-'));
 const dir=resolve('dist');
 const context=await chromium.launchPersistentContext(profile,{...(process.env.SOFTLENS_CHROMIUM_PATH?{executablePath:process.env.SOFTLENS_CHROMIUM_PATH}:{channel:'chromium'}),headless:true,args:['--disable-extensions-except='+dir,'--load-extension='+dir]});
 const close=context.close.bind(context);context.close=async()=>{try{await close()}finally{await rm(profile,{recursive:true,force:true})}};
 return context;
}
