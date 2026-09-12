/* OwlUV - generator jezicnih stranica i sitemapa.

   Alat je jedna stranica koja jezik mijenja u pregledniku, bez ucitavanja.
   Trazilice to ne vide: one procitaju HTML kakav stigne, a to je hrvatski.
   Zato za svaki jezik postoji vlastita stranica u korijenu repozitorija:

     index.html  hrvatski, pocetni       https://owluv.com/
     en.html     engleski                https://owluv.com/en
     de.html, fr.html, es.html, it.html  https://owluv.com/de ...

   (GitHub Pages poslzuje en.html i na adresi /en, bez nastavka.)

   Sve su to ISTA stranica: isti HTML, isti JS, iste putanje. Razlikuju se samo
   u onome sto trazilica cita prije nego JS uopce krene:
     - <html lang>, <title> i <meta name="description"> na jeziku stranice
     - tekst zaglavlja i podnozja upisan u sam HTML, ne samo kroz JS
     - canonical, hreflang na svih 6 jezika, Open Graph, Twitter card, JSON-LD
     - aktivan gumb jezika

   index.html je IZVOR: generator ga cita, u njega upisuje hrvatsku inacicu i iz
   njega izvodi ostalih pet. Promjena izgleda ili sucelja radi se u index.html,
   pa se pokrene:

     node test/napravi-jezicne-stranice.js            # napise stranice i sitemap.xml
     node test/napravi-jezicne-stranice.js --provjeri # samo javi slazu li se datoteke

   Higijena u test/pokreni-test.js zove --provjeri, pa test pada ako netko
   izmijeni index.html, a ne pokrene generator, ili ako rucno dira en.html.

   Nista se ne dohvaca izvana: adrese ovdje su samo tekst koji trazilica cita. */
'use strict';
const fs=require('fs'), path=require('path');

const KORIJEN=path.join(__dirname,'..');
const DOMENA='https://owluv.com';
const JEZICI=['hr','en','de','fr','es','it'];
const LOKALE={hr:'hr_HR',en:'en_US',de:'de_DE',fr:'fr_FR',es:'es_ES',it:'it_IT'};
const SLIKA=DOMENA+'/assets/sovaweb_favicon_512.png';   // sova, 512x512

const datoteka=L=>L==='hr'?'index.html':L+'.html';
const adresa=L=>L==='hr'?DOMENA+'/':DOMENA+'/'+L;

function ucitajI18N(){
  const w={};
  new Function('window',fs.readFileSync(path.join(KORIJEN,'js/i18n.js'),'utf8'))(w);
  return w.OwlUV.I18N;
}
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function seoBlok(L,t){
  const naslov='OwlUV - '+t.tagline;
  const r=[];
  r.push('<!-- SEO:start -->');
  r.push('<link rel="canonical" href="'+adresa(L)+'">');
  for(const J of JEZICI) r.push('<link rel="alternate" hreflang="'+J+'" href="'+adresa(J)+'">');
  // x-default: tko trazi na jeziku koji nemamo, dobiva engleski
  r.push('<link rel="alternate" hreflang="x-default" href="'+adresa('en')+'">');
  r.push('<meta property="og:type" content="website">');
  r.push('<meta property="og:site_name" content="OwlUV">');
  r.push('<meta property="og:url" content="'+adresa(L)+'">');
  r.push('<meta property="og:title" content="'+esc(naslov)+'">');
  r.push('<meta property="og:description" content="'+esc(t.seoDesc)+'">');
  r.push('<meta property="og:image" content="'+SLIKA+'">');
  r.push('<meta property="og:image:width" content="512">');
  r.push('<meta property="og:image:height" content="512">');
  r.push('<meta property="og:image:alt" content="OwlUV">');
  r.push('<meta property="og:locale" content="'+LOKALE[L]+'">');
  for(const J of JEZICI) if(J!==L) r.push('<meta property="og:locale:alternate" content="'+LOKALE[J]+'">');
  r.push('<meta name="twitter:card" content="summary">');
  r.push('<meta name="twitter:title" content="'+esc(naslov)+'">');
  r.push('<meta name="twitter:description" content="'+esc(t.seoDesc)+'">');
  r.push('<meta name="twitter:image" content="'+SLIKA+'">');
  const ld={
    '@context':'https://schema.org',
    '@type':'WebApplication',
    name:'OwlUV',
    headline:naslov,
    url:adresa(L),
    description:t.seoDesc,
    inLanguage:L,
    availableLanguage:JEZICI,
    applicationCategory:'SecurityApplication',
    operatingSystem:'Any',
    browserRequirements:'Requires JavaScript. Runs entirely in the browser: no data is sent to any server.',
    isAccessibleForFree:true,
    offers:{'@type':'Offer',price:'0',priceCurrency:'EUR'},
    license:'https://www.gnu.org/licenses/gpl-3.0.html',
    image:SLIKA,
    author:{'@type':'Organization',name:'SOVA VID j.d.o.o.',url:'https://sovaweb.net'},
    publisher:{'@type':'Organization',name:'SOVA VID j.d.o.o.',url:'https://sovaweb.net'}
  };
  // </script> unutar JSON-a bi zatvorio blok; JSON.stringify ga ne moze
  // proizvesti iz nasih tekstova, ali neka stoji zastita
  r.push('<script type="application/ld+json">'+JSON.stringify(ld).replace(/<\//g,'<\\/')+'</script>');
  r.push('<!-- SEO:end -->');
  return r.join('\n');
}

function stranica(izvor,L,t){
  let s=izvor;
  const zamijeni=(re,novo)=>{
    if(!re.test(s)) throw new Error('U index.html ne nalazim '+re);
    s=s.replace(re,novo);
  };
  zamijeni(/<html lang="[a-z]{2}">/, '<html lang="'+L+'">');
  zamijeni(/<title>[^<]*<\/title>/, '<title>'+esc('OwlUV - '+t.tagline)+'</title>');
  zamijeni(/<meta name="description" content="[^"]*">/, '<meta name="description" content="'+esc(t.seoDesc)+'">');
  zamijeni(/<!-- SEO:start -->[\s\S]*?<!-- SEO:end -->/, seoBlok(L,t));
  // Tekst sucelja u sam HTML. Samo elementi bez djece i samo kljucevi koji su
  // obican tekst (brojaci su funkcije i ostaju JS-u). JS poslije upise isto.
  s=s.replace(/(<(\w+)[^>]*\sdata-i18n="(\w+)"[^>]*>)([^<]*)(<\/\2>)/g,
    (m,otvori,oznaka,kljuc,unutra,zatvori)=>typeof t[kljuc]==='string'?otvori+esc(t[kljuc])+zatvori:m);
  // aktivan gumb jezika
  s=s.replace(/class="lang active"/g,'class="lang"');
  zamijeni(new RegExp('class="lang" data-lang="'+L+'"'), 'class="lang active" data-lang="'+L+'"');
  if(L!=='hr'){
    s=s.replace(/^<!DOCTYPE html>\n/,'<!DOCTYPE html>\n<!-- GENERIRANO iz index.html: node test/napravi-jezicne-stranice.js. Ne uredjivati rucno. -->\n');
  }
  return s;
}

function sitemap(datum){
  const r=['<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
  for(const L of JEZICI){
    r.push('  <url>');
    r.push('    <loc>'+adresa(L)+'</loc>');
    r.push('    <lastmod>'+datum+'</lastmod>');
    for(const J of JEZICI) r.push('    <xhtml:link rel="alternate" hreflang="'+J+'" href="'+adresa(J)+'"/>');
    r.push('    <xhtml:link rel="alternate" hreflang="x-default" href="'+adresa('en')+'"/>');
    r.push('  </url>');
  }
  r.push('</urlset>','');
  return r.join('\n');
}

function izradi(){
  const I18N=ucitajI18N();
  const izvor=fs.readFileSync(path.join(KORIJEN,'index.html'),'utf8');
  const rezultat={};
  for(const L of JEZICI) rezultat[datoteka(L)]=stranica(izvor,L,I18N[L]);
  // datum se mijenja samo kad se promijeni sadrzaj, da provjera bude stabilna
  const postojeci=fs.existsSync(path.join(KORIJEN,'sitemap.xml'))?fs.readFileSync(path.join(KORIJEN,'sitemap.xml'),'utf8'):'';
  const stariDatum=(/<lastmod>([^<]+)<\/lastmod>/.exec(postojeci)||[])[1];
  const isteStranice=JEZICI.every(L=>{
    const p=path.join(KORIJEN,datoteka(L));
    return fs.existsSync(p)&&fs.readFileSync(p,'utf8')===rezultat[datoteka(L)];
  });
  const datum=(isteStranice&&stariDatum)?stariDatum:new Date().toISOString().slice(0,10);
  rezultat['sitemap.xml']=sitemap(datum);
  return rezultat;
}

// Vraca popis datoteka koje se ne slazu; prazan popis znaci da je sve u redu.
function provjeri(){
  const rezultat=izradi();
  return Object.keys(rezultat).filter(ime=>{
    const p=path.join(KORIJEN,ime);
    return !fs.existsSync(p)||fs.readFileSync(p,'utf8')!==rezultat[ime];
  });
}

module.exports={JEZICI,DOMENA,datoteka,adresa,izradi,provjeri};

if(require.main===module){
  if(process.argv.includes('--provjeri')){
    const krivo=provjeri();
    if(krivo.length){ console.error('Ne slazu se s generatorom: '+krivo.join(', ')+'\nPokreni: node test/napravi-jezicne-stranice.js'); process.exit(1); }
    console.log('Jezicne stranice i sitemap.xml se slazu s generatorom.'); process.exit(0);
  }
  const rezultat=izradi();
  for(const ime of Object.keys(rezultat)){
    fs.writeFileSync(path.join(KORIJEN,ime),rezultat[ime]);
    console.log('napisano '+ime+' ('+rezultat[ime].length+' znakova)');
  }
}
