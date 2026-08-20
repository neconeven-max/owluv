#!/usr/bin/env node
/* OwlUV - pokretac automatskog testa.
   Otvara test/test-runner.html u Chromeu bez sucelja, izravno s diska (file://),
   i ispisuje rezultat. Nema poslužitelja, nema mreze.
   Pokretanje:  node test/pokreni-test.js  */
const {spawnSync}=require('child_process'), path=require('path'), fs=require('fs');
const CHROME=process.env.CHROME||[
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome','/usr/bin/chromium'
].find(p=>fs.existsSync(p));
if(!CHROME){ console.error('Ne nalazim Chrome. Postavi CHROME=/putanja/do/chrome'); process.exit(2); }
const page='file://'+path.join(__dirname,'test-runner.html');
const profile=fs.mkdtempSync(path.join(require('os').tmpdir(),'owluv-test-'));
let dom='';
try{
  // Chrome zna ostaviti pomocne procese koji drze izlaz otvorenim, zato tvrdi rok
  const res=spawnSync(CHROME,['--headless','--disable-gpu','--no-sandbox','--no-first-run','--no-default-browser-check',
    '--allow-file-access-from-files','--user-data-dir='+profile,
    '--virtual-time-budget=60000','--dump-dom',page],
    {encoding:'utf8',maxBuffer:64*1024*1024,stdio:['ignore','pipe','ignore'],
     timeout:150000,killSignal:'SIGKILL'});
  dom=res.stdout||'';
}finally{ fs.rmSync(profile,{recursive:true,force:true}); }
const m=/<pre id="out">([\s\S]*?)<\/pre>/.exec(dom);
if(!m){ console.error('Test se nije izvrsio - nema ispisa. Provjeri test-runner.html.'); process.exit(2); }
const txt=m[1].replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&');
console.log(txt.trim());
process.exit(/REZULTAT: PROSAO/.test(txt)?0:1);
