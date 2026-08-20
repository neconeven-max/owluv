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

**Faza 2a je gotova i poslana na GitHub.** Grana `main`, 6 commitova, oznaka
`0e2bc41`, `origin` je `git@github.com:neconeven-max/owluv.git`.

Radi i provjereno je testom (47 provjera, sve prošle):

- učitavanje datoteka: povuci-i-pusti, gumb za odabir, ime i veličina u
  zaglavlju, jedna datoteka odjednom
- formati: obični tekst, HTML, `.docx`; `.doc` i PDF daju jasnu poruku
- čitanje `.docx`-a izravno iz XML-a: Wordova oznaka skrivenog teksta, bijela
  slova, sitan font, skrivanje kroz stil, komentari, obrisani tekst iz praćenja
  izmjena, zaglavlja i podnožja, fusnote, svojstva dokumenta, tekstualni okviri
  izvan stranice (VML i DrawingML)
- četvrta presuda "nema što provjeriti" za dokument bez teksta
- sve sučelje na 6 jezika, test pada ako neki jezik nešto nema

Rad se nastavlja **s MacBook Aira**. Upute za preuzimanje i pokretanje su u
README-u, odjeljak "Nastavak rada na drugom stroju". Prije rada provjeriti
`ssh -T git@github.com` — vidi otvorenu stavku O-7 u INFRASTRUKTURI.

## Sljedeći korak, tim redom

### 1. Test pravim Wordovim dokumentom — PRVO OVO

Prije bilo kakvog novog razvoja. Napraviti dokument **u pravom Wordu**, ručno
posakrivati u njega iste zamke koje ima `test/test-skriveno.docx`, provući ga
kroz alat i usporediti nalaze.

### ⚠️ Otvorena sumnja koju treba provjeriti prvu

**Testni `.docx`-evi su strojno generirani** — napisao ih je
`test/napravi-testne-docx.js`, pa zapisuju formatiranje onako kako je nama bilo
zgodno, a ne nužno onako kako to radi pravi Word.

Konkretna sumnja: **bijela boja slova.** Naš generator zapisuje je izravno, kao
`<w:color w:val="FFFFFF"/>`, i to alat pouzdano hvata. Pravi Word bijelu boju
često zapisuje **preko teme dokumenta**, otprilike ovako:

```xml
<w:color w:val="FFFFFF" w:themeColor="background1"/>
```

a zna zapisati i samo `w:themeColor` bez `w:val`, ili `w:val="auto"` uz
`w:themeColor`. **U ta dva zadnja slučaja naš čitač boju ne vidi**, jer u
`js/docx.js`, funkcija `readRPr()`, grana `case 'color'` (oko 44. linije) čita
isključivo atribut `w:val` i preskače vrijednost `auto`. Teme se nigdje ne
razrješavaju — `word/theme/theme1.xml` se uopće ne čita.

Ista sumnja vrijedi i za boju zadanu **kroz definiciju stila** u `styles.xml`,
i za veličinu fonta zapisanu kao `w:szCs` umjesto `w:sz`.

Vjerojatnost da to promaši: **umjerena, ne sigurna** — Word najčešće ispiše i
`w:val` i `w:themeColor` zajedno, pa bi tada sve radilo. Ali dok se ne provjeri
na pravom dokumentu, ovo se **ne smije smatrati riješenim**, jer bi značilo da
alat na pravom životopisu propusti upravo ono zbog čega postoji.

**Kako provjeriti:** u pravom Wordu napisati tekst, obojati ga bijelo preko
palete boja teme (gornji red palete, ne "More Colors"), spremiti kao `.docx`,
pa pogledati što je Word stvarno zapisao:

```
unzip -p dokument.docx word/document.xml | grep -o '<w:color[^/]*/>'
```

Ako se pojavi `w:themeColor` bez upotrebljivog `w:val`, treba u `readRPr()`
dodati razrješavanje tema iz `word/theme/theme1.xml`, i tek onda dalje.

### 2. Faza 2b — PDF

Tek kad prva točka prođe. Sučelje već ima poruku da PDF nije podržan, pa
korisnik dotad ne dobiva lažnu presudu.

### Namjerno izostavljeno

Stari `.doc` (poruka korisniku da spremi kao `.docx`), `.odt`, `.rtf`.
