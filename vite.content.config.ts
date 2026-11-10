import { defineConfig } from 'vite';
export default defineConfig({publicDir:false,build:{outDir:'dist',emptyOutDir:false,lib:{entry:'src/content.ts',name:'SoftLens',formats:['iife'],fileName:()=> 'content.js'}}});
