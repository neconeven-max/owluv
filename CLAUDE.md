# OwlUV - pravila projekta

Ovaj dokument čita svaka nova sesija prije nego išta dirne. Cilj je da se
kontekst ne mora ponovno objašnjavati.

## Što je alat

OwlUV provjerava sadrži li tekst ili dokument sadržaj nevidljiv ljudskom oku,
a koji AI ipak pročita: bijela slova, mikroskopski font, skrivene elemente,
nevidljive Unicode znakove i fraze koje pokušavaju podmetnuti AI-ju odgovor
ili naredbu.

Tipični slučajevi: profesor sakrije zamku u zadaću da otkrije tko je slijepo
kopirao u chat; kandidat sakrije u životopis uputu da ga AI izabere kao
najboljeg.

Repozitorij: `github.com/neconeven-max/OwlUV` (privatan). Domena kasnije:
`owluv.com`.

## Pravila koja se ne krše

1. **Sve radi lokalno u pregledniku.** Nikakvo pozivanje vanjskih poslužitelja,
   nikakav CDN, nikakva analitika. Sve knjižnice idu u `vendor/` i moraju biti
   u repozitoriju. Alat mora raditi bez interneta, s USB-a i iz mape na disku
   (`file://`). To je temeljno obećanje proizvoda.
2. **Dokument bez teksta nikad ne dobiva zelenu presudu.** Ako se iz datoteke
   ne može pročitati nijedno slovo (npr. skenirana stranica koja je zapravo
   slika), alat daje zasebnu presudu `v-none` — "nema što provjeriti". Lažna
   sigurnost je gora od nikakve.
3. **Svaki novi tekst u sučelju ide na svih 6 jezika** (HR, EN, DE, FR, ES, IT).
   Automatski test pada ako neki jezik nema ključ ili ako se u sučelju pojavi
   goli ključ umjesto prijevoda.
4. **Detekcijska jezgra se ne prepravlja usput.** `js/detect.js` je prenesen iz
   v3.3 i mijenja se samo namjerno i uz zapis u README. Novi formati datoteka
   su novi *ulaz* u isti mehanizam, ne nova detekcija.
5. **Koriste se isključivo datoteke ovog projekta.** Ne povlače se imena,
   adrese ni podaci iz drugih projekata.

## Struktura

```
index.html                 glavni alat
js/i18n.js                 prijevodi, 6 jezika, isti ključevi u svakom
js/detect.js               detekcijska jezgra (iz v3.3)
js/docx.js                 čitač .docx datoteka, izravno iz XML-a
js/files.js                ulaz za datoteke: povuci-i-pusti, odabir, formati
js/app.js                  sučelje, tijek skeniranja, presuda
assets/                    logo i ikone SOVA WEB (u repozitoriju, ne s OneDrivea)
vendor/fflate/             raspakiravanje ZIP-a (MIT), vendorirano
standalone/                zamrznuta v3.3, jedna datoteka za slanje mailom
test/                      generator testnih .docx i automatski test
```

`standalone/uv-skener-v3.3.html` je **zamrznut**. Ostaje verzija za brzo slanje
mailom i rad bez ičega drugog, radi samo s lijepljenjem teksta. Ne dodaju mu se
nove mogućnosti.

## Zašto .docx čitamo iz XML-a, a ne kroz pretvarač

Knjižnice koje `.docx` pretvaraju u HTML (mammoth i slične) rade suprotno od
onoga što nama treba: njihov cilj je prikazati dokument **kakav izgleda**, pa
tiho izbace tekst označen kao skriven, komentare, obrisani tekst iz praćenja
izmjena i zaglavlja. To bi značilo da alat ne vidi ono zbog čega postoji.

Zato `js/docx.js` raspakira ZIP i čita XML izravno, a rekonstrukciju za prikaz
gradi zasebno i namjerno: sve što je Word sakrio ostaje u rekonstrukciji, samo
označeno tako da ga detektor prepozna.

Wordove oznake koje CSS ne može opisati (`w:vanish`, okvir izvan stranice)
prenose se atributom `data-uv-reason`, koji `hiddenReasons()` čita.

## Kako pokrenuti

Alat: otvori `index.html` u pregledniku. Ne treba poslužitelj.

Test:
```
node test/napravi-testne-docx.js     # napravi testne .docx (već su u repou)
node test/pokreni-test.js            # pokrene Chrome bez sučelja i ispiše rezultat
```
Test se **mora** izvršiti prije nego se prijavi da je nešto gotovo.

## Radni tijek

- Jedan datirani commit po dovršenoj cjelini.
- Svaka dovršena promjena dobiva unos u README, odjeljak "Povijest izmjena",
  jednostavnim jezikom: što je napravljeno i zašto.
- Promjena se bilježi i u `~/INFRASTRUKTURA.md`.
- Rad ide naizmjenično s tri stroja, pa se sve zapisuje lokalno.

## Gdje je projekt stao — stanje na 20.08.2026.

**Faza 2a je gotova, provjerena pravim Wordovim dokumentom i dopunjena
verzijom v4.1.** Grana `main`, `origin` je `git@github.com:neconeven-max/owluv.git`.

Radi i provjereno je testom (**77 provjera, sve prošle**):

- učitavanje datoteka na četiri načina: povuci-i-pusti, gumb za odabir,
  lijepljenje same datoteke iz međuspremnika (ovisi o pregledniku, pouzdano u
  Chromeu), i lijepljenje teksta; ime i veličina u zaglavlju, jedna datoteka
  odjednom
- formati: obični tekst, HTML, `.docx`; `.doc` i PDF daju jasnu poruku
- čitanje `.docx`-a izravno iz XML-a: Wordova oznaka skrivenog teksta, bijela
  slova, sitan font, skrivanje kroz stil, komentari, obrisani tekst iz praćenja
  izmjena, zaglavlja i podnožja, fusnote, svojstva dokumenta, tekstualni okviri
  izvan stranice (VML i DrawingML)
- četvrta presuda "nema što provjeriti" za dokument bez teksta
- klik na nalaz skače na mjesto u desnom panelu; svojstva dokumenta nemaju
  mjesto u tekstu pa nisu kliknabilna i to se vidi
- tijek provjere prikazuje stvarne korake, bez umjetnog kašnjenja
- sve sučelje na 6 jezika, test pada ako neki jezik nešto nema

Rad se vodi **s MacBook Aira**, repozitorij je kloniran u `~/owluv`. Sva tri
stroja imaju vlastiti SSH ključ na GitHubu (stavka O-7 u INFRASTRUKTURI je
zatvorena 20.08.2026.).

## Što je test pravim Wordom pokazao

**Test je prošao.** Pravi Wordov dokument od 2,1 MB sa slikama, s dvije skrivene
poruke u bijeloj boji i veličini 1,3 px. Obje su otkrivene i točno prikazane, uz
autora iz svojstava dokumenta.

### ✅ Riješeno — sumnja oko boje zadane preko teme dokumenta

Ranija sumnja bila je da bi bijela boja zadana **preko teme dokumenta**
(`w:themeColor` bez upotrebljivog `w:val`) mogla promaknuti, jer `readRPr()` u
`js/docx.js` čita samo `w:val`, a `word/theme/theme1.xml` se uopće ne čita.

**Sumnja se nije obistinila.** Provjereno je na stvarnom dokumentu spremljenom
iz Worda: Word je bijelu boju zapisao tako da je alat pouzdano prepoznao, i obje
skrivene poruke su nađene. Razrješavanje tema nije bilo potrebno. Stavka se
zatvara.

Ako se ikad pojavi dokument u kojem bijelo promakne, provjera je i dalje ista:

```
unzip -p dokument.docx word/document.xml | grep -o '<w:color[^/]*/>'
```

### ✅ Riješeno — lažna uzbuna iz međuspremnika

Kad se sadržaj kopira iz Worda i zalijepi kao tekst, sustav sam ubaci
`StartFragment` i `EndFragment` kao HTML komentare. Alat ih je prijavljivao kao
skriveni sadržaj, pa je umjesto dvije prave zamke javljao četiri nalaza i crtao
ih u desnom panelu s bubom.

**Popravljeno u v4.1.** U `js/detect.js` funkcija `isClipMarker()` prepoznaje
poznate tehničke oznake koje sustav sam dodaje pri kopiranju i one se potpuno
preskaču, i u nalazima i u desnom panelu. **HTML komentari općenito i dalje
jesu nalaz** — to je ravnoteža koju ne treba dirati, jer se u komentarima
stvarno kriju poruke. Test pokriva oba slučaja.

## Sljedeći korak

### Faza 2b — PDF

Sučelje već ima poruku da PDF nije podržan, pa korisnik dotad ne dobiva lažnu
presudu. Prije bilo čega drugog treba odlučiti kako se PDF čita, uz isto
pravilo kao kod Worda: cilj nije prikazati dokument kakav izgleda, nego vidjeti
sve što je u datoteci.

### Namjerno izostavljeno

Stari `.doc` (poruka korisniku da spremi kao `.docx`), `.odt`, `.rtf`.
