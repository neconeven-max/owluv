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
assets/                    logo, sova i ikone SOVA WEB (u repozitoriju, ne s OneDrivea)
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
verzijama v4.1, v4.2 i v4.3.** Grana `main`, `origin` je
`git@github.com:neconeven-max/owluv.git`.

Radi i provjereno je testom (**146 provjera, sve prošle**):

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
- klik na nalaz skače na SLJEDEĆU pojavu, uz brojač i strelice; svojstva
  dokumenta nemaju mjesto u tekstu pa nisu kliknabilna i to se vidi
- stranica se ne prelijeva u stranu ni na jednoj širini od 320 do 768 px
- tijek provjere prikazuje stvarne korake, bez umjetnog kašnjenja, i pojavljuje
  se samo kad obrada stvarno traje dulje od otprilike pola sekunde
- naziv ima podnaslov koji ide i u naslov kartice i u opis stranice, na 6 jezika
- uz naziv je sova s UV zrakom, crtana i animirana u stranici, ne gif
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

## Odluke koje se ne vraćaju natrag

### Prikaz tijeka nema prekidač za brzi i spori način

Prikaz koraka pojavljuje se samo ako obrada traje dulje od praga
(`PROG_APPEAR_MS` u `js/app.js`, 500 ms). To je **namjerno riješeno pragom, a ne
postavkom.** Prekidač koji ne mijenja rezultat daje korisniku odluku bez
koristi, a kod obrade više datoteka takav prikaz ionako postaje popis obrađenih
datoteka, pa bi se prekidač morao ukinuti čim se to doda. Obrazloženje u cijelosti
je u README-u, odjeljak *Zašto nema prekidača za brzi i spori način*.

Prikaz je odvojen od posla: posao upisuje korake u red i ide punom brzinom,
prikaz zaostaje i nestane nešto kasnije. **Nikad se ne dodaje kašnjenje u samu
obradu.** `OwlUV.app.progressTiming()` postoji isključivo zato da automatski
test može provjeriti mehaniku prikaza bez ovisnosti o brzini stroja; sučelje je
ne poziva nikad.

### Kroz pojave se ide klikom, ne popisom

Nalaz s više pojava ne izlistava ih. Kroz njih se hoda klikom, kao kod traženja
riječi u pregledniku: svaki klik vodi na sljedeću, nakon zadnje na prvu, brojač
pokazuje položaj. **Popis je namjerno odbačen** jer kod stotinu pojava nitko ne
čita popis, a stranica naraste toliko da se u njoj više ne snalaziš. Iznad
`MANY_HITS` (50) uz brojač ide kratka napomena; kod dugih crtica ona kaže i da
toliki broj obično znači AI, a ne skrivanje. Obrazloženje u cijelosti je u
README-u, odjeljak *Zašto se kroz pojave ide klikom, a ne popisom*.

**Broj u naslovu i ukupan broj u brojaču ne moraju biti isti.** Naslov broji
koliko je puta pravilo okinulo nad tekstom, brojač koliko ima označenih mjesta u
desnom panelu. Oznake se crtaju po tekstualnom čvoru, pa se fraza prelomljena
formatiranjem pojavi kao dvije oznake. To **nije kvar** i ne popravlja se
diranjem detekcije ni načina označavanja, jer bi to bio zahvat u jezgru.

### Sova uz naziv se ne crta iznova

Glava sove izrezana je iz postojećeg logotipa SOVA WEB skriptom
`assets/izdvoji-sovu.py`. Ako zatreba drugi izrez, mijenja se `BOX` u toj
skripti. Ne crta se nova sova.

## Sljedeći korak

### Faza 2b — PDF

Sučelje već ima poruku da PDF nije podržan, pa korisnik dotad ne dobiva lažnu
presudu. Prije bilo čega drugog treba odlučiti kako se PDF čita, uz isto
pravilo kao kod Worda: cilj nije prikazati dokument kakav izgleda, nego vidjeti
sve što je u datoteci.

### Namjerno izostavljeno

Stari `.doc` (poruka korisniku da spremi kao `.docx`), `.odt`, `.rtf`.
