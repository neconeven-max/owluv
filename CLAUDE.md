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
6. **Izvorna datoteka korisnika se NIKAD ne mijenja.** Alat je čita, pretvara u
   tekst i skenira. Datoteka na disku ostaje netaknuta. Mijenja se samo tekst
   koji korisnik kopira u međuspremnik, i taj tekst izlazi očišćen.
7. **Očišćeno znači očišćeno.** Skriveni sadržaj se u kopiji **briše**. Ne
   označava se, ne omotava se, ne ostavlja se bilješka na njegovom mjestu.
   Ništa se ne dodaje. Tekst jednostavno teče dalje.
8. **Alat je radar.** Prikazuje SVE što je sumnjivo, i jako i malo sumnjivo. Uz
   svaki nalaz piše zašto je označen. **Korisnik odlučuje što je prijetnja.**
   Alat ne prosuđuje umjesto njega i ne prešućuje nalaz zato što mu se čini
   premalo sumnjiv. **Nema praga ispod kojeg se nalaz odbacuje.** Jedina iznimka
   su tehničke oznake koje sam sustav ubaci pri kopiranju (`StartFragment` i
   slično); one nisu sadržaj dokumenta.
9. **Skriveno se briše, vidljivo se nudi.** Skriveni sadržaj se iz kopije briše
   uvijek, bez pitanja: skrivanje je samo po sebi dokaz namjere. Vidljiva
   sumnjiva rečenica se **ne briše sama** - nju korisnik označava kvačicom.
   Alat ne briše ono što je korisnik mogao vidjeti i sam.

## Struktura

```
index.html                 glavni alat
js/i18n.js                 prijevodi, 6 jezika, isti ključevi u svakom
js/detect.js               detekcijska jezgra (iz v3.3)
js/docx.js                 čitač .docx datoteka, izravno iz XML-a
js/files.js                ulaz za datoteke: povuci-i-pusti, odabir, formati
js/app.js                  sučelje, tijek skeniranja, presuda
js/signals.js              prepoznavanje AI manipulacije po signalima
js/docxout.js              gradnja nove .docx datoteke iz očišćenog teksta
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
verzijama v4.1 do v4.7.** Grana `main`, `origin` je
`git@github.com:neconeven-max/owluv.git`.

Radi i provjereno je testom (**267 provjera, sve prošle**):

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
- jedan gumb za kopiranje, u desnom panelu; kopija **stvarno** briše skriveni
  sadržaj i u međuspremnik ide u dvije verzije, bogatoj i običnoj
- granice: 15 MB po datoteci i 1.000.000 znakova po tekstu
- jasne poruke za Word zaštićen lozinkom, krivi nastavak i više datoteka odjednom
- crveno upozorenje kad se tekst izmijeni rukom, s gumbom za ponovno skeniranje
- spremanje očišćenog teksta kao nove `.docx` datoteke, bez ijedne nove knjižnice
- prepoznavanje po signalima uz postojeći popis fraza, uz objašnjenje koji su
  signali pronađeni
- kvačice kojima korisnik sam bira koje se vidljive rečenice brišu iz kopije
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

### Redoslijed nalaza je po ozbiljnosti, ne po redu izračuna

Popis nalaza slaže se po polju `rank`, od najozbiljnijeg prema napomenama.
**Bez toga je najširi i najbučniji nalaz znao završiti na vrhu i zakopati
skriveni tekst**, koji je najvažniji: na pravom dokumentu je nalaz po signalima
imao 23 stavke i stajao prvi, pa se skriveni tekst nije vidio bez pomicanja.

| rank | nalaz |
|---|---|
| 10 | tekst skriven formatiranjem |
| 11 | dekodirana skrivena poruka (Unicode TAG) |
| 12 | tekstualni okviri izvan stranice |
| 20 | sumnjive fraze s popisa |
| 30 | nevidljivi znakovi |
| 38, 39 | komentari, obrisani tekst iz praćenja izmjena |
| 40 | svojstva dokumenta |
| 44, 45 | zaglavlja i podnožja, fusnote |
| 50 | pomiješana pisma |
| 60 | rečenice koje se obraćaju stroju (signali) |
| 70 | duge crtice |

Okviri izvan stranice idu gore uz skriveni tekst jer su isto skriveni sadržaj,
samo gurnut van vidljivog područja. Nalaz po signalima ide među zadnje jer je
najširi i najbučniji.

### Signali: širok radar, i to namjerno

`js/signals.js` traži šest signala, uz postojeći popis fraza koji **ostaje
netaknut**: obraćanje stroju, zapovjedni ton oko ocjenjivanja ili odabira,
traženje tajnosti, podmetanje ishoda, rečenica na drugom jeziku od dokumenta, i
mjesto nalaza (zaglavlje, fusnota, komentar, svojstva).

**Svaki pogodak se prikazuje.** Rečenica s jednim signalom ide u popis jednako
kao ona s četiri. Nema praga i nema zbrajanja bodova. Uz svaku rečenicu piše
koji su signali pronađeni, da korisnik može provjeriti alat, a ne samo vjerovati
mu.

**Težina nalaza je `info`, ne crvena.** To nije prešućivanje: svaki pogodak je u
popisu. Ali mreža je namjerno široka i okida i na posve normalnim rečenicama
(mjereno: 60% rečenica iz kontrolne skupine normalnih dokumenata), pa bi crvena
presuda na svakom školskom zadatku prestala išta značiti. Boja upozorenja
odgovara širini mreže, a odluka ostaje na korisniku.

**Signal "obraća se stroju" traži OKVIR obraćanja, a ne samu riječ.** Riječ
"sustav" u "prometni sustav" nije obraćanje stroju nego obična hrvatska riječ, a
"Umjetna inteligencija mijenja način učenja" govori O stroju, ne STROJU. Zato
`obracaSeStroju()` dijeli riječi na nedvosmislene (AI, umjetna inteligencija,
jezični model, asistent) i svakodnevne (sustav, program, model). Nedvosmislene
okidaju uz bilo koji okvir obraćanja, uključujući naredbu odmah iza; svakodnevne
samo uz jaki okvir, dakle uvjet s glagolom čitanja ili obrade ili napomenu
upućenu nekome. Riječi "upute" i "naredba" izbačene su iz tog signala jer nisu
stroj; injekcije koje ih koriste hvata popis fraza i signal zapovjednog tona.

**Ovo nije prag ni odbacivanje nalaza**, nego ispravak signala koji je krivo
prepoznavao. Alat i dalje prikazuje sve što nađe.

**Iz teksta za signale ispadaju svojstva dokumenta i natpisi alata.** Svojstva
već imaju vlastiti nalaz, pa bi se prijavljivala dvaput, a e-mail adresa se
pritom lomila na pola kao da je rečenica ("Autorkristina.", "jedvajic@gmail.")
što je izgledalo kao kvar. Isto vrijedi za natpise koje je alat sam dodao radi
preglednosti (naslovi odjeljaka, ime datoteke uz zaglavlje, autor uz komentar):
to nisu riječi dokumenta. Vidi `IZVAN_SIGNALA` u `js/app.js`.

**Tekst za signale gradi se s granicama odlomaka.** `textContent` spaja blokove
bez razmaka ("geografijeNapiši"), pa se granica riječi i granica rečenice na tom
spoju gube i signal tiho promaši. Zato `scanText()` u `js/app.js` umeće prijelom
reda na svakom prijelazu bloka i vodi mapu koja svaki znak vraća na njegov pravi
pomak, po kojem se poslije briše točno označena rečenica.

### Zašto nema skeniranja pri tipkanju nego upozorenje

Lijevi panel se može uređivati, pa se tekst može izmijeniti nakon skeniranja.
**Ne skenira se pri svakom pritisku tipke.** To je nepotreban posao koji na
velikom dokumentu vidljivo usporava rad, a korisniku ne donosi ništa dok još
piše.

Umjesto toga se čim se sadržaj izmijeni rukom pojavi **crveno upozorenje** da
prikazani nalazi više ne odgovaraju sadržaju, s gumbom koji ih osvježi.
Upozorenje se pojavljuje na svaku izmjenu, i na brisanje jednog razmaka: bolje
javiti previše nego prešutjeti.

Upozorenje nastaje **samo od ljudske izmjene**. Sadržaj koji postavlja sam alat
ide kroz `setContent()`, koji piše preko `innerHTML`, a to uopće ne okida
događaj `input`. Zastavica `settingContent` je pojas i tregeri uz to. Zato
učitavanje datoteke, lijepljenje, primjer i "Novi tekst" nikad ne podižu
upozorenje.

Stalni gumb "Skeniraj" je zato uklonjen: skeniranje ide samo pri unosu, a ručno
samo kroz ovo upozorenje, dakle točno onda kad stvarno treba.

### Spremanje .docx-a nema novu knjižnicu

`js/docxout.js` gradi novu `.docx` datoteku sam, koristeći već vendoriranu
fflate za pakiranje ZIP-a. **Nova knjižnica se ne dodaje.** Gotove knjižnice za
pisanje Worda teže nekoliko stotina kilobajta, a `test/napravi-testne-docx.js`
već je pokazao da se valjani `.docx` piše ručno u pedesetak linija.

Popisi se rade pravim Wordovim numeriranjem preko `numbering.xml`, a **ne**
dopisivanjem znaka za točku ili broja u tekst. Dopisivanje bi značilo dodavanje
znakova kojih u dokumentu nema, a pravilo je da se ništa ne dodaje.

Spremljena datoteka je **nova**, izvorna se ne dira. Prijelom stranica, margine
i točan font neće biti identični izvorniku i to je korisniku rečeno uz gumb.

### Što ulazi u očišćenu kopiju, a što ne

Kopija se gradi u `buildClean()` u `js/app.js`. Iz nje izlazi sve što je bilo
skriveno formatiranjem, sve s Wordovom oznakom skrivenog teksta, HTML komentari,
nevidljivi znakovi, komentari, obrisani tekst iz praćenja izmjena, okviri izvan
stranice i **svojstva dokumenta**.

**Zaglavlja, podnožja i fusnote OSTAJU u kopiji.** To je pravi sadržaj koji je
autor napisao i koji čovjek vidi kad čita dokument. Kopija iz koje tiho
nedostaje dio dokumenta je pogrešna, a korisnik ne bi ni znao da mu nešto fali.
Pravilo čišćenja vrijedi i unutar njih: ako je nešto u zaglavlju ili fusnoti
bilo skriveno, briše se kao i drugdje.

**Svojstva dokumenta ostaju vani.** To nisu riječi dokumenta nego podaci o
datoteci, i u testnom dokumentu su bila nositelj injekcije.

**Natpisi koje je alat sam dodao ne prepisuju se.** "KOMENTARI", "ZAGLAVLJA I
PODNOŽJA", ime datoteke, autor komentara - to su riječi kojih u dokumentu nema,
pa bi njihovo prepisivanje prekršilo pravilo da se ništa ne dodaje. Prenosi se
samo sadržaj.

**Posljedica koju treba znati:** ako injekcija stoji u zaglavlju ili fusnoti,
ona je vidljiva na ispisu, dakle nije skrivena, i **ostaje u očišćenoj kopiji**.
Očišćena kopija jamči da u njoj nema *skrivenog* sadržaja, ne da u njoj nema
nijedne sumnjive rečenice. Nalazi u desnom panelu i dalje na nju upozoravaju.

U bogatu verziju propuštaju se **samo** `font-weight`, `font-style`,
`text-decoration` i `text-align`. Boja, veličina fonta, prozirnost i položaj ne
prolaze ni slučajno, pa se skrivanje ne može provući ni ako negdje promakne.
Naslovi, popisi i tablice prežive jer su oznake, a ne stil.

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

### ✅ Riješeno — 21.08.2026. — gumb "Skeniraj" i utipkani tekst

Stavka otvorena u v4.4 zatvorena je u v4.5, ali **drugim rješenjem** od
predloženog. Nije dodano skeniranje pri tipkanju, jer je to nepotreban posao
koji na velikom dokumentu usporava rad. Umjesto toga se svaka ručna izmjena
javlja crvenim upozorenjem s gumbom za ponovno skeniranje, a stalni gumb
"Skeniraj" je uklonjen. Obrazloženje je gore, u odjeljku *Zašto nema skeniranja
pri tipkanju nego upozorenje*.

### Faza 2b — PDF

Sučelje već ima poruku da PDF nije podržan, pa korisnik dotad ne dobiva lažnu
presudu. Prije bilo čega drugog treba odlučiti kako se PDF čita, uz isto
pravilo kao kod Worda: cilj nije prikazati dokument kakav izgleda, nego vidjeti
sve što je u datoteci.

### Namjerno izostavljeno

Stari `.doc` (poruka korisniku da spremi kao `.docx`), `.odt`, `.rtf`.
