#!/usr/bin/env node
/* OwlUV - pokretac automatskog testa.

   Radi tri prolaza:
     1. higijena repozitorija  - cita datoteke s diska i trazi sto ne smije
                                 biti u javnom repozitoriju
     2. alat iz mape           - test-runner.html otvoren kao file://
     3. alat s posluzitelja    - isti test-runner.html posluzen preko http,
                                 iz privremenog lokalnog posluzitelja koji se
                                 poslije gasi

   Prolazi 2 i 3 moraju dati POTPUNO ISTI rezultat. Time je dokazano da alat
   radi jednako otvoren iz mape i posluzen kao web stranica.

   Nema mreze prema van ni u jednom prolazu.
   Pokretanje:  node test/pokreni-test.js  */
const {spawnSync,spawn}=require('child_process');
const path=require('path'), fs=require('fs'), http=require('http'), os=require('os');

const KORIJEN=path.join(__dirname,'..');
let ukupnoProslo=0, ukupnoPalo=0;

function reci(s){ console.log(s); }
function provjera(naziv,uvjet,dodatak){
  if(uvjet){ ukupnoProslo++; reci('  PROSAO   '+naziv); }
  else { ukupnoPalo++; reci('  PAO      '+naziv+(dodatak?'  -> '+dodatak:'')); }
}

/* ==================== 1. HIGIJENA REPOZITORIJA ====================
   Alat ide u javnost, pa u njemu ne smije biti tudih osobnih podataka, tragova
   privatnih mapa i strojeva, ni bilo cega iz privatnih biljezaka. Ovo se ne
   provjerava u pregledniku nego ovdje, jer se ovdje moze citati cijeli
   repozitorij. */

// Sto je namjerno u repozitoriju i smije proci.
const DOPUSTENO_MAIL=[
  'marko.horvat@example.com'   // izmisljena osoba u testnom zivotopisu;
];                             // example.com je sluzbeno rezerviran za primjere
const DOPUSTEN_TELEFON='+385 91 000 0000';   // ocito lazan broj u istom zivotopisu

// Dvije datoteke se ne pretrazuju, jer bi same sebe prijavile:
//  - ova datoteka, koja te uzorke drzi kao podatke
//  - .gitignore, koji iste uzorke drzi kao zastitu od ulaska u repozitorij
const NE_PRETRAZUJE_SE=['test/pokreni-test.js','.gitignore'];

const NE_SMIJE_BITI=[
  // privatne mape i pohrana
  {re:/\/Users\/[A-Za-z0-9._-]+/g,           opis:'putanja do korisnicke mape'},
  {re:/\/home\/[a-z][A-Za-z0-9._-]*/g,       opis:'putanja do korisnicke mape'},
  {re:/OneDrive|Dropbox|iCloud Drive/gi,     opis:'putanja do oblacne pohrane'},
  {re:/~\/owluv|~\/OwlUV/g,                  opis:'privatna radna putanja'},
  // CLAUDE.md smije reci DA privatna biljeska postoji i gdje je; sadrzaj ne.
  {re:/INFRASTRUKTURA/g,                     opis:'privatni dokument infrastrukture',
   osim:['CLAUDE.md']},
  // strojevi, racuni, posluzitelji
  {re:/neventulic|Nevens-MacBook|imac1tb|imac-27|imac272/gi, opis:'ime racuna ili stroja'},
  {re:/\b100\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, opis:'adresa stroja u privatnoj mrezi'},
  {re:/tailscale/gi,                         opis:'privatna mreza'},
  {re:/id_ed25519|id_rsa|ssh-ed25519|ssh-rsa/g, opis:'SSH kljuc'},
  {re:/MacBook|iMac Air|Mac mini/g,           opis:'model racunala'},
  // tajne
  {re:/\bsbp_[A-Za-z0-9]{8,}|\bghp_[A-Za-z0-9]{8,}|\bAKIA[0-9A-Z]{12,}/g, opis:'token ili kljuc'},
  {re:/-----BEGIN [A-Z ]*PRIVATE KEY-----/g, opis:'privatni kljuc'},
  // poslovni plan i naplata
  {re:/poslovni plan|business plan/gi,       opis:'poslovni plan'},
  {re:/naplat\w*|napla[ćc]uj\w*|pretplat\w*|cjenik|monetiz\w*/gi, opis:'naplata'},
  {re:/\bpricing\b|\bsubscription\b|\bpaid plan\b|\bper seat\b|\brevenue\b/gi, opis:'naplata'},
  {re:/skupna obrada|skupnu obradu|\bbatch processing\b/gi, opis:'skupna obrada'}
];

const BINARNO=/\.(png|ico|jpg|jpeg|gif|ttf|pfb|otf|woff2?|zip|docx|xlsx)$/i;

function popisDatoteka(){
  const r=spawnSync('git',['ls-files'],{cwd:KORIJEN,encoding:'utf8'});
  return (r.stdout||'').split('\n').filter(Boolean)
    .filter(f=>!f.startsWith('vendor/'))     // tude knjiznice se ne diraju
    .filter(f=>!BINARNO.test(f))
    .filter(f=>!NE_PRETRAZUJE_SE.includes(f));
}

function higijena(){
  reci('\nHIGIJENA REPOZITORIJA - sto ne smije izaci u javnost');
  const datoteke=popisDatoteka();
  reci('  (pregledano datoteka: '+datoteke.length+')');

  // --- e-mail adrese ---
  const nadeniMail=[];
  for(const f of datoteke){
    const t=fs.readFileSync(path.join(KORIJEN,f),'latin1');
    const m=t.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)||[];
    for(const a of m) if(!DOPUSTENO_MAIL.includes(a)) nadeniMail.push(f+': '+a);
  }
  provjera('nema nijedne stvarne e-mail adrese', nadeniMail.length===0,
           nadeniMail.slice(0,4).join(' | '));

  // --- telefonski brojevi ---
  const nadeniTel=[];
  for(const f of datoteke){
    const t=fs.readFileSync(path.join(KORIJEN,f),'latin1');
    const m=t.match(/\+\d{2,3}[\d ()\/-]{7,}/g)||[];
    // Usporeduju se same znamenke, jer u PDF zapisu uz broj stoje i zagrade
    // i razmaci koje je ondje stavio crtac, a ne autor broja.
    const dopusteno=DOPUSTEN_TELEFON.replace(/\D/g,'');
    for(const a of m){
      if(a.replace(/\D/g,'')!==dopusteno) nadeniTel.push(f+': '+a.trim());
    }
  }
  provjera('nema nijednog stvarnog telefonskog broja', nadeniTel.length===0,
           nadeniTel.slice(0,4).join(' | '));

  // --- privatne putanje, strojevi, tajne, poslovni plan ---
  for(const pravilo of NE_SMIJE_BITI){
    const nadeno=[];
    for(const f of datoteke){
      if(pravilo.osim&&pravilo.osim.includes(f)) continue;
      const t=fs.readFileSync(path.join(KORIJEN,f),'latin1');
      pravilo.re.lastIndex=0;
      const m=t.match(pravilo.re);
      if(m) nadeno.push(f+': '+m[0]);
    }
    provjera('nema traga: '+pravilo.opis, nadeno.length===0,
             nadeno.slice(0,3).join(' | '));
  }

  // --- poruke uz commitove ---
  const log=spawnSync('git',['log','--pretty=%s%n%b'],{cwd:KORIJEN,encoding:'utf8'}).stdout||'';
  const uPorukama=[/poslovni plan|business plan/i,/naplat|pretplat|cjenik|monetiz/i,
                   /skupna obrada|skupnu obradu/i]
    .filter(re=>re.test(log));
  provjera('poruke uz commitove ne spominju poslovni plan ni naplatu',
           uPorukama.length===0, String(uPorukama[0]||''));

  // --- dozvola i napomena o robnoj marki postoje ---
  provjera('repozitorij ima dozvolu (LICENSE)', fs.existsSync(path.join(KORIJEN,'LICENSE')));
  provjera('repozitorij ima napomenu o robnoj marki (NOTICE.md)',
           fs.existsSync(path.join(KORIJEN,'NOTICE.md')));
  const gi=fs.readFileSync(path.join(KORIJEN,'.gitignore'),'utf8');
  provjera('.gitignore stiti privatne biljeske od ulaska u repozitorij',
           /PRIVATNO|privatno/.test(gi)&&/INFRASTRUKTURA/.test(gi));

  // --- sve sto stranica treba za rad kao web stranica i kao aplikacija ---
  for(const f of ['CNAME','manifest.webmanifest','sw.js','.nojekyll'])
    provjera('postoji '+f, fs.existsSync(path.join(KORIJEN,f)));
  provjera('CNAME sadrzi owluv.com',
           fs.readFileSync(path.join(KORIJEN,'CNAME'),'utf8').trim()==='owluv.com');

  // --- rad bez interneta: popis u sw.js mora odgovarati stvarnim datotekama ---
  const sw=fs.readFileSync(path.join(KORIJEN,'sw.js'),'utf8');
  const popis=(/const DATOTEKE\s*=\s*\[([\s\S]*?)\];/.exec(sw)||[,''])[1]
    .split('\n').map(r=>(/'([^']+)'/.exec(r)||[])[1]).filter(Boolean);
  const nedostaju=popis.filter(f=>f!=='.'&&!fs.existsSync(path.join(KORIJEN,f)));
  provjera('sve datoteke iz popisa za rad bez interneta stvarno postoje',
           popis.length>10&&nedostaju.length===0, nedostaju.slice(0,3).join(' | '));
  const verzija=(/OwlUV v(\d+\.\d+)/.exec(fs.readFileSync(path.join(KORIJEN,'js/i18n.js'),'utf8'))||[])[1];
  provjera('naziv ostave u sw.js nosi tekucu verziju',
           new RegExp("OSTAVA\\s*=\\s*'owluv-v"+verzija+"'").test(sw),
           'verzija '+verzija);
  const man=JSON.parse(fs.readFileSync(path.join(KORIJEN,'manifest.webmanifest'),'utf8'));
  provjera('podaci za pocetni zaslon su ispravni i ikone postoje',
           man.name==='OwlUV'&&man.display==='standalone'&&man.icons.length>=2&&
           man.icons.every(i=>fs.existsSync(path.join(KORIJEN,i.src))),
           JSON.stringify(man.icons.map(i=>i.src)));

  // --- nijedna putanja ne pretpostavlja mapu na disku ---
  const html=fs.readFileSync(path.join(KORIJEN,'index.html'),'utf8');
  const apsolutne=(html.match(/(?:src|href)="\/[^"]*"/g)||[])
    .concat(html.match(/(?:src|href)="file:[^"]*"/g)||[]);
  provjera('nijedna putanja u index.html ne pocinje kosom crtom ni s file:',
           apsolutne.length===0, apsolutne.slice(0,3).join(' | '));
  const svePutanje=[];
  for(const f of ['index.html','sw.js','js/pdfread.js']){
    const t=fs.readFileSync(path.join(KORIJEN,f),'utf8');
    for(const m of t.match(/https?:\/\/[^\s"')]+/g)||[]) svePutanje.push(f+': '+m);
  }
  const vanjske=svePutanje.filter(x=>!/schemas\.|purl\.org|w3\.org|sovaweb\.net/.test(x));
  provjera('kod ne dohvaca nista s vanjskih posluzitelja', vanjske.length===0,
           vanjske.slice(0,3).join(' | '));
}

/* ==================== 2. i 3. ALAT U PREGLEDNIKU ==================== */

const CHROME=process.env.CHROME||[
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome','/usr/bin/chromium'
].find(p=>fs.existsSync(p));

// Preglednik se pokrece ASINKRONO, a ne sa spawnSync. Sa spawnSync bi se
// zaustavila cijela Node petlja, pa privremeni posluzitelj iz istog procesa ne
// bi stigao odgovoriti ni na jedan zahtjev i prolaz preko http bi ostao prazan.
function uPregledniku(url){
  return new Promise(rijesi=>{
    const profil=fs.mkdtempSync(path.join(os.tmpdir(),'owluv-test-'));
    const dijete=spawn(CHROME,['--headless','--disable-gpu','--no-sandbox','--no-first-run',
      '--no-default-browser-check','--allow-file-access-from-files','--user-data-dir='+profil,
      '--virtual-time-budget=600000','--dump-dom',url],
      {stdio:['ignore','pipe','ignore']});
    let dom='';
    dijete.stdout.setEncoding('utf8');
    dijete.stdout.on('data',d=>{ dom+=d; });
    // Chrome zna ostaviti pomocne procese koji drze izlaz otvorenim, zato tvrdi rok
    const rok=setTimeout(()=>{ try{ dijete.kill('SIGKILL'); }catch(e){} },600000);
    dijete.on('close',()=>{
      clearTimeout(rok);
      try{ fs.rmSync(profil,{recursive:true,force:true}); }catch(e){}
      rijesi(razlomi(dom));
    });
  });
}

function razlomi(dom){
  const m=/<pre id="out">([\s\S]*?)<\/pre>/.exec(dom);
  if(!m) return null;
  const txt=m[1].replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
                .replace(/&quot;/g,'"').replace(/&amp;/g,'&');
  const b=/UKUPNO:\s*(\d+)\s+proslo,\s*(\d+)\s+palo/.exec(txt);
  return {txt:txt.trim(), proslo:b?+b[1]:0, palo:b?+b[2]:-1};
}

const TIPOVI={'.html':'text/html','.js':'text/javascript','.json':'application/json',
  '.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml',
  '.ico':'image/x-icon','.pdf':'application/pdf','.ttf':'font/ttf','.pfb':'application/octet-stream',
  '.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};

// Privremeni posluzitelj samo za vrijeme testa, iskljucivo na ovom racunalu.
function podigniPosluzitelj(){
  return new Promise(res=>{
    const s=http.createServer((zahtjev,odgovor)=>{
      let p=decodeURIComponent(zahtjev.url.split('?')[0]);
      if(p.endsWith('/')) p+='index.html';
      const puna=path.join(KORIJEN,path.normalize(p).replace(/^(\.\.[\/\\])+/,''));
      if(!puna.startsWith(KORIJEN)||!fs.existsSync(puna)||fs.statSync(puna).isDirectory()){
        odgovor.writeHead(404); odgovor.end('ne postoji'); return;
      }
      odgovor.writeHead(200,{'Content-Type':TIPOVI[path.extname(puna).toLowerCase()]||'application/octet-stream'});
      fs.createReadStream(puna).pipe(odgovor);
    });
    s.listen(0,'127.0.0.1',()=>res(s));
  });
}

/* ==================== POKRETANJE ==================== */
(async function(){
  higijena();

  // Samo higijena, za brzu provjeru bez cekanja preglednika:
  //   node test/pokreni-test.js --higijena
  if(process.argv.includes('--higijena')){
    reci('\nUKUPNO: '+ukupnoProslo+' proslo, '+ukupnoPalo+' palo');
    process.exit(ukupnoPalo===0?0:1);
  }

  if(!CHROME){ console.error('Ne nalazim Chrome. Postavi CHROME=/putanja/do/chrome'); process.exit(2); }

  reci('\nALAT OTVOREN IZ MAPE (file://)');
  const izMape=await uPregledniku('file://'+path.join(__dirname,'test-runner.html'));
  if(!izMape){ console.error('Test se nije izvrsio iz mape - nema ispisa.'); process.exit(2); }
  reci(izMape.txt);

  reci('\nALAT POSLUZEN S LOKALNOG POSLUZITELJA (http)');
  const s=await podigniPosluzitelj();
  const luka=s.address().port;
  let sPosluzitelja=null;
  try{
    sPosluzitelja=await uPregledniku('http://127.0.0.1:'+luka+'/test/test-runner.html');
  } finally { s.close(); }
  if(!sPosluzitelja){ console.error('Test se nije izvrsio s posluzitelja - nema ispisa.'); process.exit(2); }
  reci('  (posluzeno s http://127.0.0.1:'+luka+', posluzitelj ugasen nakon testa)');

  reci('\nUSPOREDBA DVAJU NACINA');
  const higijenaProslo=ukupnoProslo, higijenaPalo=ukupnoPalo;
  provjera('alat iz mape: sve provjere prolaze',
           izMape.palo===0, izMape.palo+' palo');
  provjera('alat s posluzitelja: sve provjere prolaze',
           sPosluzitelja.palo===0, sPosluzitelja.palo+' palo');
  provjera('alat radi jednako iz mape i s posluzitelja',
           izMape.proslo===sPosluzitelja.proslo&&sPosluzitelja.palo===0,
           'iz mape '+izMape.proslo+', s posluzitelja '+sPosluzitelja.proslo);

  const sve=ukupnoProslo+izMape.proslo+sPosluzitelja.proslo;
  const palo=ukupnoPalo+izMape.palo+sPosluzitelja.palo;
  reci('\n'+'='.repeat(50));
  reci('higijena repozitorija: '+higijenaProslo+' proslo, '+higijenaPalo+' palo');
  reci('alat iz mape:          '+izMape.proslo+' proslo, '+izMape.palo+' palo');
  reci('alat s posluzitelja:   '+sPosluzitelja.proslo+' proslo, '+sPosluzitelja.palo+' palo');
  reci('usporedba dvaju nacina: '+(ukupnoProslo-higijenaProslo)+' proslo, '+
       (ukupnoPalo-higijenaPalo)+' palo');
  reci('UKUPNO: '+sve+' proslo, '+palo+' palo');
  reci('REZULTAT: '+(palo===0?'PROSAO':'PAO'));
  process.exit(palo===0?0:1);
})();
