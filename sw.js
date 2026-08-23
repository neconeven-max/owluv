/* OwlUV - radnik za rad bez interneta (service worker).

   Sluzi samo jednoj svrsi: da alat dodan na pocetni zaslon telefona radi i kad
   mreze nema. Sve datoteke se pri prvoj posjeti spreme u lokalnu ostavu, a
   poslije se citaju iz nje.

   NIKAD NE DOHVACA NISTA IZVANA. U popisu su iskljucivo datoteke iz ovog
   repozitorija. Ako zahtjev ide na neko drugo posluziteljsko ime, radnik ga
   uopce ne dira, pa ga ne moze ni napraviti umjesto stranice.

   Datoteke korisnika ne prolaze kroz radnika: citaju se u pregledniku iz
   memorije i nikad ne odlaze u mrezni sloj. */

const OSTAVA = 'owluv-v6.3';

// Sve sto alat treba za rad. Test i standalone inacica namjerno nisu tu.
const DATOTEKE = [
  '.',
  'index.html',
  'manifest.webmanifest',
  'js/i18n.js',
  'js/detect.js',
  'js/docx.js',
  'js/files.js',
  'js/pdfread.js',
  'js/signals.js',
  'js/docxout.js',
  'js/app.js',
  'vendor/fflate/fflate.umd.js',
  'vendor/pdfjs/pdf.min.js',
  'vendor/pdfjs/pdf.worker.min.js',
  'vendor/pdfjs/standard_fonts/FoxitDingbats.pfb',
  'vendor/pdfjs/standard_fonts/FoxitFixed.pfb',
  'vendor/pdfjs/standard_fonts/FoxitFixedBold.pfb',
  'vendor/pdfjs/standard_fonts/FoxitFixedBoldItalic.pfb',
  'vendor/pdfjs/standard_fonts/FoxitFixedItalic.pfb',
  'vendor/pdfjs/standard_fonts/FoxitSerif.pfb',
  'vendor/pdfjs/standard_fonts/FoxitSerifBold.pfb',
  'vendor/pdfjs/standard_fonts/FoxitSerifBoldItalic.pfb',
  'vendor/pdfjs/standard_fonts/FoxitSerifItalic.pfb',
  'vendor/pdfjs/standard_fonts/FoxitSymbol.pfb',
  'vendor/pdfjs/standard_fonts/LiberationSans-Bold.ttf',
  'vendor/pdfjs/standard_fonts/LiberationSans-BoldItalic.ttf',
  'vendor/pdfjs/standard_fonts/LiberationSans-Italic.ttf',
  'vendor/pdfjs/standard_fonts/LiberationSans-Regular.ttf',
  'assets/sovaweb_logo.svg',
  'assets/sovaweb_owl.png',
  'assets/sovaweb_favicon.ico',
  'assets/sovaweb_favicon_192.png',
  'assets/sovaweb_favicon_512.png'
];

// Prva posjeta: sve se sprema. Ako neka datoteka zakaze, ostale svejedno idu u
// ostavu, jer je bolje raditi djelomicno nego ne raditi uopce.
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const o = await caches.open(OSTAVA);
    await Promise.all(DATOTEKE.map(p => o.add(p).catch(() => {})));
    self.skipWaiting();
  })());
});

// Nova verzija: stare ostave se brisu, da se ne vuce zastarjeli kod.
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const imena = await caches.keys();
    await Promise.all(imena.filter(n => n !== OSTAVA).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

// Citanje: prvo ostava, pa tek onda mreza. Tudi poslužitelji se ne diraju.
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;   // nista izvana

  e.respondWith((async () => {
    const iz = await caches.match(r, {ignoreSearch: true});
    if (iz) return iz;
    try {
      const svjeze = await fetch(r);
      // sto je s naseg posluzitelja i uredno stiglo, sprema se za sljedeci put
      if (svjeze && svjeze.ok && svjeze.type === 'basic') {
        const o = await caches.open(OSTAVA);
        o.put(r, svjeze.clone());
      }
      return svjeze;
    } catch (err) {
      // bez mreze: za stranicu vrati pocetnu, za ostalo neka padne
      if (r.mode === 'navigate') {
        const p = await caches.match('index.html');
        if (p) return p;
      }
      throw err;
    }
  })());
});
