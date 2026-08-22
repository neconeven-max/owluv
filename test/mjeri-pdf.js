#!/usr/bin/env node
/* OwlUV - mjerenje koliko traje obrada PDF-a.
   Pokretanje:  node test/mjeri-pdf.js

   ZASTO OVAKO: unutar preglednika bez sucelja sat tece "virtualno", pa se
   trajanje ne moze mjeriti iznutra. Zato se mjeri STVARNO vrijeme cijelog
   procesa, i to dvaput: jednom s jednom obradom, jednom sa sest. Razlika
   podijeljena s pet je trajanje jedne obrade, a pokretanje preglednika i
   ucitavanje knjiznice se pritom samo od sebe ponisti. */
'use strict';
const {spawnSync}=require('child_process');
const path=require('path'), fs=require('fs'), os=require('os');

const CHROME=process.env.CHROME||[
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome','/usr/bin/chromium'
].find(p=>fs.existsSync(p));
if(!CHROME){ console.error('Ne nalazim Chrome. Postavi CHROME=/putanja/do/chrome'); process.exit(2); }

const MALO=1, PUNO=4;
const DATOTEKE=[
  {ime:'pdf-1-stranica.pdf',  opis:'1 stranica'},
  {ime:'pdf-10-stranica.pdf', opis:'10 stranica'},
  {ime:'pdf-50-stranica.pdf', opis:'50 stranica'}
];

function stranica(ime,puta){
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>m</title></head><body>\n'+
    '<pre id="out">radim</pre>\n'+
    '<script src="../vendor/pdfjs/pdf.min.js"></script>\n'+
    '<script src="../vendor/pdfjs/pdf.worker.min.js"></script>\n'+
    '<script src="../js/pdfread.js"></script>\n'+
    '<script>\n'+
    '(async()=>{\n'+
    '  let str=0;\n'+
    (ime?
    '  const buf=await (await fetch('+JSON.stringify(ime)+')).arrayBuffer();\n'+
    '  for(let i=0;i<'+puta+';i++){\n'+
    '    const r=await window.OwlUV.pdf.parse(new Uint8Array(buf.slice(0)));\n'+
    '    str=r.pages;\n'+
    '  }\n' : '')+
    '  document.getElementById("out").textContent="gotovo,stranica="+str;\n'+
    '  document.title="GOTOVO";\n'+
    '})().catch(e=>{document.getElementById("out").textContent="GRESKA "+e.message;document.title="GOTOVO";});\n'+
    '</script></body></html>\n';
}

function pokreni(html){
  const put=path.join(__dirname,'_mjera-'+process.pid+'.html');
  fs.writeFileSync(put,html);
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'owluv-mjera-'));
  const t0=Date.now();
  const res=spawnSync(CHROME,['--headless','--disable-gpu','--no-sandbox','--no-first-run',
    '--no-default-browser-check','--allow-file-access-from-files','--user-data-dir='+profile,
    '--virtual-time-budget=60000','--dump-dom','file://'+put],
    {encoding:'utf8',maxBuffer:64*1024*1024,stdio:['ignore','pipe','ignore'],
     timeout:600000,killSignal:'SIGKILL'});
  const ms=Date.now()-t0;
  fs.rmSync(profile,{recursive:true,force:true});
  try{ fs.unlinkSync(put); }catch(e){}
  const m=/<pre id="out">([\s\S]*?)<\/pre>/.exec(res.stdout||'');
  const ispis=m?m[1].trim():'NEMA ISPISA';
  if(/GRESKA|NEMA/.test(ispis)) throw new Error(ispis);
  return ms;
}

console.log('Mjerim obradu PDF-a: razlika izmedu '+MALO+' i '+PUNO+' obrada iste datoteke.\n');
console.log('  Datoteka        '+MALO+' obrada   '+PUNO+' obrada   Jedna obrada');
console.log('  --------------  ---------  ---------  ------------');
const rezultati=[];
DATOTEKE.forEach(d=>{
  const a=pokreni(stranica(d.ime,MALO));
  const b=pokreni(stranica(d.ime,PUNO));
  const jedna=Math.max(0,Math.round((b-a)/(PUNO-MALO)));
  rezultati.push({opis:d.opis,jedna});
  console.log('  '+d.opis.padEnd(14)+'  '+String(a).padStart(7)+' ms  '+
              String(b).padStart(7)+' ms  '+String(jedna).padStart(8)+' ms');
});
console.log('\nZa README:');
rezultati.forEach(r=>console.log('  | '+r.opis+' | oko '+r.jedna+' ms |'));
