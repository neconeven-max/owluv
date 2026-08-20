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

## Što slijedi

- Faza 2b: PDF. Sučelje već ima poruku da PDF još nije podržan.
- Nije podržano i namjerno je izostavljeno: stari `.doc` (poruka korisniku da
  spremi kao `.docx`), `.odt`, `.rtf`.
