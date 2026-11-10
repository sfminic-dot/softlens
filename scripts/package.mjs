import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {zipSync} from 'fflate';
async function collect(dir,prefix=''){const files={};for(const entry of await readdir(dir,{withFileTypes:true})){const name=prefix+entry.name;if(entry.isDirectory())Object.assign(files,await collect(join(dir,entry.name),name+'/'));else files[name]=new Uint8Array(await readFile(join(dir,entry.name)));}return files;}
await mkdir('artifacts',{recursive:true});const files=await collect('dist');files['README.md']=new Uint8Array(await readFile('README.md'));await writeFile('artifacts/soft-lens-install.zip',zipSync(files));console.log('Created artifacts/soft-lens-install.zip');
