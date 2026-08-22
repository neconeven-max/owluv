# OwlUV

Alat koji dokument stavlja "pod UV lampu" i pokazuje što u njemu piše, a ljudsko
oko ne vidi.

Postoje dvije vrste sadržaja koje čovjek prelista, a AI pročita: tekst skriven
formatiranjem (bijela slova, font od jednog pointa, Wordova oznaka skrivenog
teksta) i tekst kojeg u dokumentu ima, ali ga miš ne može označiti (komentari,
obrisani tekst iz praćenja izmjena, zaglavlja, svojstva datoteke). OwlUV vadi i
jedno i drugo, i posebno upozorava na fraze koje pokušavaju AI-ju podmetnuti
odgovor ili naredbu.

Dva tipična slučaja: profesor sakrije zamku u zadaću da otkrije tko je slijepo
kopirao u chat, i kandidat sakrije u životopis uputu da ga AI izabere kao
najboljeg.

**Sve radi u tvom pregledniku. Ništa se nikamo ne šalje, nema poziva na vanjske
poslužitelje, nema CDN-a.** Alat radi bez interneta, s USB-a i iz mape na disku.

---

## Što otkriva

**Skriveno formatiranjem**
- bijela ili prozirna slova
- mikroskopski font (do 4 px)
- `display:none`, `visibility:hidden`, prozirnost 0
- element gurnut izvan ekrana
- Wordova oznaka skrivenog teksta (`w:vanish`) i oznaka "skriveno na webu"
- skrivanje kroz definiciju stila, ne izravnim formatiranjem

**Skriveno u PDF-u**
- **provjera vidljivosti**: stranica se nacrta dvaput, sa svim sadržajem i bez
  teksta, pa se izmjeri vidi li se tekst uopće. Time odjednom ispadaju bijelo na
  bijelom, boja jednaka podlozi koja nije bijela, tekst ispod neprozirnog
  pravokutnika ili slike, nevidljiv način crtanja, prozirnost blizu nule i svaki
  budući trik koji nitko još nije smislio
- tekst u sloju kojemu je vidljivost isključena
- tekst gurnut izvan vidljivog područja stranice
- mikroskopski font
- polja obrasca, komentari i svojstva dokumenta
- ugrađeni JavaScript, koji se **nikad ne izvršava**, samo prijavljuje

**Skriveno u strukturi datoteke** (Word)
- komentari
- obrisani tekst iz praćenja izmjena, koji je i dalje u datoteci
- zaglavlja i podnožja
- fusnote i bilješke na kraju
- svojstva dokumenta: naslov, autor, predmet, opis, ključne riječi, tvrtka
- tekstualni okviri gurnuti izvan stranice (stari VML i novi DrawingML zapis)

**Skriveno u samim znakovima**
- nevidljivi Unicode znakovi (ZWSP, ZWJ, BOM, soft hyphen, BIDI oznake…)
- poruke skrivene u Unicode TAG znakovima, koje alat dekodira i ispiše
- riječi s pomiješanim pismima (latinica + ćirilica/grčki)
- duge crtice, čest trag teksta koji je pisao AI

**Fraze koje ciljaju na AI**, na 6 jezika neovisno o jeziku sučelja:
injekcijske naredbe, poruke upućene AI-ju, podmetnuti odgovori, naredbe da se
odabere baš ovaj kandidat, i zahtjevi za tajnošću.

## Presuda

Alat daje jednu od četiri presude:

| Presuda | Značenje |
|---|---|
| **Otkriven skriveni sadržaj** | pronađena je zamka, pogledaj nalaze |
| **Oprez, anomalije** | nema jasne zamke, ali ima neuobičajenih znakova |
| **Tekst izgleda čist** | ništa nije pronađeno |
| **Nema što provjeriti** | iz datoteke se ne može pročitati nijedno slovo |

Četvrta presuda postoji zato što je lažna sigurnost gora od nikakve. Skenirani
dokument koji je zapravo slika **nikad** ne dobiva zelenu presudu, jer alat u
njemu nema što provjeriti — a korisnik bi zeleno pročitao kao "dokument je u
redu".

## Kako se pokreće

Otvori `index.html` u pregledniku. Nema instalacije, nema poslužitelja, nema
koraka izgradnje. Radi i s `file://`, dakle i iz mape na USB-u.

U alat se sadržaj unosi ovako:
- zalijepiš tekst (Cmd+V) — najbolje direktno iz izvornika, jer se tako čuva
  formatiranje koje skener pregledava
- povučeš datoteku preko lijevog panela
- klikneš "Odaberi datoteku" (za mobitel, gdje povlačenje ne radi)
- zalijepiš **samu datoteku** iz međuspremnika: u Finderu kopiraš datoteku, pa
  pritisneš Cmd+V nad lijevim panelom

Jedna datoteka odjednom. Gumb "Novi tekst" (ili Esc) briše i datoteku.

**Lijepljenje datoteke ovisi o pregledniku.** Pouzdano radi u Chromeu. Safari i
Firefox često ne prenesu uputu o datoteci, pa se u njima ne dogodi ništa. Zato
to nikad nije jedini put: **povlačenje i gumb za odabir uvijek rade**, u svakom
pregledniku. Ako Cmd+V ne donese ni datoteku ni tekst, alat to više ne prešuti
nego kaže što učiniti.

**Kod Worda je najsigurnije predati samu datoteku.** Kopiranje sadržaja iz
Worda uglavnom prenese tekst skriven bojom i veličinom fonta, ali ne prenosi
tekst skriven Wordovom oznakom skrivenog teksta, ni komentare, ni obrisani
tekst iz praćenja izmjena, ni svojstva dokumenta. Povlačenje, gumb i lijepljenje
same datoteke daju potpun i vjeran rezultat.

**Podržani formati:** obični tekst, HTML, Word `.docx`, PDF.
Stari `.doc` nije podržan — alat javlja da dokument treba spremiti kao `.docx`.

Ako tek postavljaš alat na drugom računalu, vidi odjeljak
[Nastavak rada na drugom stroju](#nastavak-rada-na-drugom-stroju).

## Struktura mapa

```
index.html                    glavni alat
js/
  i18n.js                     prijevodi sučelja, 6 jezika
  pdfread.js                  čitač PDF-a s provjerom vidljivosti
  signals.js                  prepoznavanje AI manipulacije po signalima
  docxout.js                  gradnja nove .docx datoteke iz očišćenog teksta
  detect.js                   detekcijska jezgra (prenesena iz v3.3)
  docx.js                     čitač .docx datoteka, izravno iz XML-a
  files.js                    ulaz za datoteke i prepoznavanje formata
  app.js                      sučelje, tijek skeniranja, presuda
assets/
  sovaweb_logo.svg            logo SOVA WEB za podnožje
  sovaweb_owl.png             glava sove uz naziv, izrezana iz logotipa
  sovaweb_favicon.ico         ikona kartice preglednika
  sovaweb_favicon_512.png     ikona za dodavanje na početni zaslon
  izdvoji-sovu.py             skripta koja je izrezala glavu sove iz logotipa
vendor/
  fflate/                     raspakiravanje ZIP-a (MIT licenca), u repozitoriju
  pdfjs/                      pdf.js (Apache-2.0), u repozitoriju
standalone/
  uv-skener-v3.3.html         zamrznuta jedna datoteka, samo lijepljenje teksta
test/
  napravi-testne-docx.js      generator testnih dokumenata
  pokreni-test.js             pokretač automatskog testa
  test-runner.html            sam test
  test-*.docx                 testni dokumenti
CLAUDE.md                     pravila projekta
```

`standalone/uv-skener-v3.3.html` je namjerno zamrznut. To je verzija za brzo
slanje mailom i rad bez ičega drugog: jedna datoteka, radi samo s lijepljenjem
teksta. Ne dobiva nove mogućnosti.

## Zašto .docx čitamo izravno iz XML-a

Knjižnice koje `.docx` pretvaraju u HTML (mammoth i slične) rade **suprotno od
onoga što ovom alatu treba**. Njihov je cilj prikazati dokument kakav izgleda,
pa tiho izbace upravo ono što nas zanima: tekst označen kao skriven, komentare,
obrisani tekst iz praćenja izmjena, zaglavlja. Da smo ih upotrijebili, alat ne
bi vidio ono zbog čega postoji.

Zato `js/docx.js` raspakira ZIP i čita `word/document.xml`, `comments.xml`,
`header*.xml`, `footer*.xml`, `footnotes.xml`, `styles.xml` i `docProps/*.xml`
izravno. Prikaz za lijevi panel gradi se zasebno i namjerno: sve što je Word
sakrio ostaje u rekonstrukciji, samo označeno tako da ga detektor prepozna.
Wordove oznake koje CSS ne zna opisati (`w:vanish`, okvir izvan stranice)
prenose se atributom `data-uv-reason`.

Jedina vanjska knjižnica je **fflate** (MIT), i to samo za raspakiravanje ZIP-a.
Vendorirana je u repozitorij, jer alat mora raditi bez interneta.

**Lijevi panel je kod Worda rekonstrukcija, ne fotografija dokumenta.** Razmaci,
fontovi i prijelomi stranica neće biti identični Wordu. To piše i u sučelju, na
svih 6 jezika, da netko ne pomisli da je alat pokvaren.

## Što je promijenjeno u jezgri

Detekcijska logika iz v3.3 prenesena je doslovno — koji uvjeti okidaju nalaz
nije mijenjano. Jedina izmjena: `hiddenReasons()` sada vraća **ključeve**
razloga umjesto gotovih hrvatskih rečenica, da bi se razlozi mogli prevesti na
svih 6 jezika. Uz to funkcija čita i atribut `data-uv-reason`, kojim čitač
`.docx`-a prijavljuje razloge koje CSS ne može opisati.

**20.08.2026., v4.1** — tri izmjene u `js/detect.js`, sve namjerne:

1. **Tehničke oznake iz međuspremnika preskaču se.** Kad se sadržaj kopira iz
   Worda i zalijepi, sustav sam ubaci `StartFragment` i `EndFragment` kao HTML
   komentare. Alat ih je prijavljivao kao skriveni sadržaj, što je bila lažna
   uzbuna. Preskaču se samo poznate oznake koje dodaje sam sustav pri kopiranju
   (`StartFragment`, `EndFragment`, `StartSelection`, `EndSelection`,
   `StartHTML`, `EndHTML` i Wordovi uvjetni komentari `[if ...] ... [endif]`).
   **HTML komentari općenito i dalje jesu nalaz**, jer se u njima stvarno kriju
   poruke.
2. **Duge crtice i riječi s pomiješanim pismima sada se označavaju u desnom
   panelu.** Prije su se prijavljivale u nalazima, ali se u panelu nisu vidjele
   nigdje, pa nalaz nije imao kamo skočiti. Pravilo prepoznavanja nije dirano,
   dodan je samo prikaz, i to namjerno tanak i siv.
3. **`build()` prima već izračunate razloge skrivenosti.** Time se provjera
   boja i veličina fonta može izvršiti kao zaseban, stvaran korak prije gradnje
   prikaza. Bez tog podatka funkcija radi točno kao prije.

## Test

```
node test/napravi-testne-docx.js     # napravi testne .docx (već su u repozitoriju)
node test/napravi-testne-pdf.js      # napravi testne .pdf  (već su u repozitoriju)
node test/pokreni-test.js            # pokrene test i ispiše rezultat
```

Test otvara **pravi `index.html`** u Chromeu bez sučelja, izravno s diska, i
poziva iste funkcije koje pozivaju gumbi. Nema poslužitelja i nema mreže, pa
test ujedno provjerava i obećanje da alat radi s `file://`.

Testni dokument `test-skriveno.docx` sadrži sve vrste skrivenog sadržaja
odjednom. `test-bez-teksta.docx` sadrži samo sliku i nijedno slovo.
`test-cist.docx` je kontrolni uzorak bez ijedne zamke.

### Rezultat zadnjeg pokretanja: 22.08.2026., 296 provjera, sve prošle

| Provjera | Rezultat |
|---|---|
| Wordova oznaka skrivenog teksta (`w:vanish`) | prošao |
| bijela slova (`w:color` = FFFFFF) | prošao |
| sitan font (1 pt) | prošao |
| skriveno kroz definiciju stila | prošao |
| komentar | prošao |
| obrisani tekst iz praćenja izmjena | prošao |
| zaglavlje i podnožje | prošao |
| fusnota | prošao |
| svojstva dokumenta (naslov, autor, ključne riječi, opis) | prošao |
| tekstualni okvir izvan stranice, stari VML zapis | prošao |
| tekstualni okvir izvan stranice, novi DrawingML zapis | prošao |
| nevidljivi Unicode znakovi | prošao |
| sumnjive fraze označene | prošao |
| skriveno označeno u desnom panelu | prošao |
| presuda crvena za dokument sa zamkama | prošao |
| dokument bez teksta ne dobiva zelenu presudu | prošao |
| poruka da dokument sadrži samo slike | prošao |
| čist dokument dobiva zelenu presudu | prošao |
| `.doc` upućuje na spremanje kao `.docx` | prošao |
| `.pdf` javlja da još nije podržan | prošao |
| nepodržan format javlja jasnu poruku | prošao |
| obični tekst i HTML prolaze kroz istu provjeru | prošao |
| prazna datoteka ne dobiva zelenu presudu | prošao |
| svih 6 jezika: nema praznog teksta u sučelju | prošao |
| svih 6 jezika: nalazi i razlozi prevedeni | prošao |
| nema nijednog vanjskog zahtjeva | prošao |
| zalijepljena datoteka se učitava kao datoteka, ne kao tekst | prošao |
| prazan Cmd+V daje poruku što učiniti, na svih 6 jezika | prošao |
| tehničke oznake iz međuspremnika nisu nalaz | prošao |
| pravi HTML komentar iz dokumenta i dalje jest nalaz | prošao |
| nalazi su kliknabilni, svojstva dokumenta nisu | prošao |
| crvena presuda pulsira, zelena ne | prošao |
| zelena presuda uz plave nalaze ne tvrdi da nema ničega | prošao |
| duga crtica i pomiješano pismo označeni u desnom panelu | prošao |
| prikaz koraka se ne pojavljuje na brzoj obradi | prošao |
| kad se prikaz koraka pojavi, ne nestane prije nego se stigne pročitati | prošao |
| podnaslov postoji na svih 6 jezika | prošao |
| podnaslov ulazi u naslov kartice i u opis stranice | prošao |
| sova uz naziv se učitava iz repozitorija | prošao |
| uzastopni klikovi obilaze sve pojave redom i vraćaju se na prvu | prošao |
| brojač pokazuje točan položaj i ukupan broj | prošao |
| strelice pomiču za točno jedno mjesto | prošao |
| nalaz s jednom pojavom nema brojač ni strelice | prošao |
| napomena o velikom broju pojava se pojavljuje iznad praga, a ispod ne | prošao |
| stranica se ne prelijeva u stranu na širinama od 320 do 768 px | prošao |
| kopirani tekst ne sadrži nijednu riječ iz skrivenog sadržaja | prošao |
| kopirani tekst nema oznaka ni bilježaka na mjestu obrisanog | prošao |
| kopirani tekst nema nevidljivih znakova ni dugih crtica | prošao |
| bogata verzija ima naslove, a nema boje, veličine fonta ni skrivenih elemenata | prošao |
| dna oba panela poravnata u praznom stanju i nakon učitavanja | prošao |
| prevelika datoteka daje poruku, a datoteka od 2,1 MB prolazi | prošao |
| predug zalijepljeni tekst daje poruku | prošao |
| više odjednom bačenih datoteka daje poruku i obrađuje prvu | prošao |
| Word zaštićen lozinkom daje izričitu poruku, a ne "nema što provjeriti" | prošao |
| datoteka s krivim nastavkom daje poruku o nečitljivom sadržaju | prošao |
| izmjena teksta rukom pokreće crveno upozorenje | prošao |
| ponovno skeniranje uklanja upozorenje i osvježava nalaze | prošao |
| učitavanje, lijepljenje i primjer ne pokreću upozorenje | prošao |
| očišćena kopija sadrži zaglavlje, podnožje i fusnotu | prošao |
| očišćena kopija ne sadrži svojstva dokumenta ni natpise alata | prošao |
| spremljena .docx datoteka se otvara, ima naslove i nema skrivenog sadržaja | prošao |
| kvačice su po zadanom prazne | prošao |
| označena rečenica nestaje iz kopije i iz spremljene datoteke | prošao |
| neoznačena rečenica ostaje | prošao |
| skriveni sadržaj se briše bez obzira na kvačice | prošao |
| gumbi pokazuju koliko je stavki označeno | prošao |
| rečenica s jednim signalom se prijavljuje kao ona s više njih | prošao |
| uz svaki nalaz stoji objašnjenje koji su signali pronađeni | prošao |
| mjerenje na skupu primjera | prošao |
| skriveni tekst je prvi nalaz, nalaz po signalima posljednji | prošao |
| svojstva dokumenta se ne pojavljuju u popisu rečenica | prošao |
| rečenica koja spominje "prometni sustav" ne okida signal obraćanja stroju | prošao |
| rečenica koja se stvarno obraća AI-ju i dalje okida | prošao |
| PDF: svaka od jedanaest testnih zamki je otkrivena | prošao |
| PDF: čist PDF ne daje nijedan nalaz o skrivenom sadržaju | prošao |
| PDF: skenirani PDF daje sivu presudu, nikad zelenu | prošao |
| PDF: ugrađeni JavaScript se prijavljuje, a ne izvršava | prošao |
| PDF: napomena o rekonstrukciji postoji na svih 6 jezika | prošao |

## Granice veličine

| Što | Granica | Zašto baš tolika |
|---|---|---|
| Datoteka | **15 MB** | Životopisi su desetci KB, završni radovi sa slikama nekoliko MB. 15 MB ostavlja veliku rezervu, a sprječava da preglednik stane bez ijedne poruke pokušavajući obraditi nešto čemu nije dorastao. |
| Tekst | **1.000.000 znakova** | Vrijedi i za zalijepljeni tekst, gdje granica veličine datoteke ne pomaže jer datoteke nema. Milijun znakova je više nego što ima ijedan završni rad. |

Iznad granice alat daje jasnu poruku i **ne pokušava obraditi**. Prije je
pokušavao, pa je preglednik na vrlo velikoj datoteci znao stati bez ijedne
riječi objašnjenja, što je izgledalo kao da je alat pokvaren.

## PDF: kako se traži nevidljivo

**Ne lovimo pojedine trikove, lovimo samu nevidljivost.** Popis poznatih trikova
uvijek kasni za napadačem: netko smisli novi način skrivanja i alat ga ne vidi
dok mu se ne doda pravilo. Zato OwlUV ne provjerava popis trikova, nego mjeri
ono što je važno: **vidi li se tekst uopće.**

Postupak je jednostavan. Stranica se nacrta dvaput, jednom sa svim sadržajem i
jednom bez teksta. Ako se na mjestu nekog teksta ništa zamjetljivo ne razlikuje,
taj tekst se ne vidi. Nije važno je li skriven bijelom bojom, bojom jednakom
podlozi, pravokutnikom preko njega, nevidljivim načinom crtanja ili nečim što
još nitko nije smislio. To se ne može zaobići novim trikom.

Ono čega na nacrtanoj stranici uopće nema provjera vidljivosti ne može vidjeti,
pa se čita zasebno: isključeni slojevi, tekst gurnut izvan stranice, polja
obrasca, komentari, svojstva dokumenta i ugrađeni JavaScript.

### Knjižnica

Za čitanje PDF-a koristi se **pdf.js**, knjižnica koju održava Mozilla i koja
pokreće prikaz PDF-a u Firefoxu. Odabrana je zato što jedina daje oboje što
ovdje treba: položaj, boju i veličinu svakog znaka, **i** crtanje stranice u
sliku. Bez crtanja nema provjere vidljivosti.

- Verzija: **3.11.174**, gradnja `legacy` (radi kroz običnu `<script>` oznaku,
  pa i s `file://`, gdje moduli ne prolaze)
- Licenca: **Apache-2.0**, u `vendor/pdfjs/LICENSE`
- Sve leži u repozitoriju, ništa se ne dohvaća s mreže
- **Učitava se tek kad stigne prvi PDF**, jer je oko 1,5 MB. Tko lijepi tekst
  ili učitava Word tu cijenu ne plaća.

### Koliko traje

Mjereno u pravom pregledniku, na MacBook Airu M3, prosjek tri obrade:

| Dokument | Trajanje |
|---|---|
| 1 stranica | oko 90 ms |
| 10 stranica | oko 225 ms |
| 50 stranica | oko 1 sekundu |

Crtanje se radi samo za stranice koje uopće imaju teksta, i to u jednom prolazu
po stranici, ne po svakom retku. Prikaz tijeka provjere pojavljuje se po istom
pravilu kao i dosad, dakle tek kad obrada prijeđe pola sekunde, pa se na malom
dokumentu ne pojavljuje uopće.

### Rezultat na testnim PDF-ovima

Svaka zamka ima svoju testnu datoteku u `test/`, napravljenu generatorom
`test/napravi-testne-pdf.js`. Rezultat, 22.08.2026.:

| Testna datoteka | Rezultat |
|---|---|
| bijeli tekst na bijeloj podlozi | otkriveno, "nije vidljivo na nacrtanoj stranici" |
| tekst #FAFAFA na podlozi #FAFAFA | otkriveno |
| tekst veličine 1 pt | otkriveno, "mikroskopski font (1pt)" |
| nevidljiv način crtanja | otkriveno |
| tekst u isključenom sloju | otkriveno, zaseban nalaz o sloju |
| tekst gurnut izvan stranice | otkriveno, oba ulomka |
| tekst ispod neprozirnog pravokutnika | otkriveno |
| ugrađeni JavaScript | prijavljen, **nijednom izvršen** |
| skrivena lista vještina bez ijedne naredbe | otkriveno, sva tri retka |
| čist PDF | nijedan nalaz, zelena presuda |
| PDF koji je samo slika | siva presuda "nema što provjeriti", nikad zelena |

## Mjerenje na skupu primjera

Bez skupa primjera ne bismo znali je li nova verzija bolja ili samo drugačija.
U `test/primjeri-recenice.js` stoje dvije skupine rečenica, po pet na svakom od
šest jezika:

- **A, zamke** koje NISU na postojećem popisu fraza: napisane svojim riječima,
  uljudnim tonom, u trećem licu, zamotane u naizgled običnu rečenicu.
- **B, normalne rečenice** iz pravih dokumenata koje bi mogle okinuti signal:
  školski zadaci koji traže odgovor, natječaji koji traže najboljeg kandidata,
  tekstovi o umjetnoj inteligenciji kao temi, upute za korištenje programa.

Rezultat mjerenja, 21.08.2026., nakon sužavanja signala "obraća se stroju":

| Skupina | Okinulo signal | Po signalima |
|---|---|---|
| **A, zamke** (30) | **30 od 30, 100%** | obraćanje stroju 20, podmetanje ishoda 15, zapovjedni ton 6, tajnost 6 |
| **B, normalne** (30) | **18 od 30, 60%** | zapovjedni ton 12, podmetanje ishoda 6, obraćanje stroju **0** |

Za usporedbu, prije sužavanja: A 30 od 30, B **29 od 30 (97%)**, a signal
obraćanja stroju sam je okidao na 12 normalnih rečenica.

Na pravim dokumentima: kontrolni čisti dokument daje **1** rečenicu sa signalom
i **i dalje dobiva zelenu presudu**; dokument sa zamkama daje 11, prije 30.

**Kako čitati te brojke.** Doseg je i dalje pun: nijedna zamka nije promakla,
uključujući one napisane svojim riječima koje stari popis fraza ne bi uhvatio.
Šum je prepolovljen, a signal obraćanja stroju na normalnom tekstu više ne okida
nijednom. Ono što je ostalo je zapovjedni ton ("odgovori na pitanja") i
podmetanje ishoda ("tražimo najboljeg kandidata"), koji u pravim školskim
zadacima i natječajima stoje sasvim opravdano.

To je namjerno: alat je radar i prikazuje sve, a odluku donosi korisnik. Zato
nalaz po signalima nosi plavu težinu napomene, a ne crvenu presudu, i uz svaku
rečenicu piše koji su signali pronađeni.

Skupina B se **ne koristi za odbacivanje nalaza**. Služi da se vidi koliko se
često signal javlja na normalnom tekstu i da objašnjenja uz nalaz budu napisana
tako da korisnik odmah razazna bezopasan slučaj.

## Zašto se kroz pojave ide klikom, a ne popisom

Nalaz obično ima više pojava u tekstu. Kad alat kaže da je našao tri duge
crtice ili dvadeset sumnjivih fraza, postavlja se pitanje kako korisnika
dovesti do svake od njih.

**Popis svih pojava je odbačen.** Kod dokumenta u kojem se nešto ponavlja
stotinu puta, popis od sto stavki nitko ne čita, a stranica naraste toliko da
se u njoj više ne snalaziš. Nalaz koji je trebao biti sažetak postao bi
najduži dio stranice, a i dalje bi tražio da očima pretražuješ popis.

**Umjesto toga se kroz pojave ide klikom, kao kod traženja riječi u
pregledniku.** Taj obrazac ljudi već znaju: svaki klik vodi na sljedeću pojavu,
nakon zadnje se vraća na prvu, a brojač pokazuje na kojoj si od koliko. Uz
brojač stoje dvije strelice za preskakanje u oba smjera. Nalaz koji ima samo
jednu pojavu nema ni brojač ni strelice, jer nema kroz što hodati, a nalaz koji
uopće nema mjesto u tekstu (svojstva dokumenta) nema ni skok.

Pojava na koju se skočilo nakratko jače zasvijetli od ostalih istih oznaka, pa
ostane tanko obrubljena dok se ne skoči dalje. Tako se i nakon bljeska vidi na
kojoj si točno.

Ako neka vrsta nalaza ima više od 50 pojava, uz brojač se pojavljuje kratka
napomena da ih je puno. Kod dugih crtica ta napomena kaže i zašto je to bitno:
toliki broj dugih crtica obično znači da je tekst pisao AI, a ne da je nešto
skriveno. To je korisna informacija sama po sebi.

**Sitnica koju vrijedi znati:** broj u naslovu nalaza i ukupan broj u brojaču ne
moraju uvijek biti isti. Naslov broji koliko je puta pravilo okinulo u tekstu, a
brojač koliko ima označenih mjesta u desnom panelu na koja se može skočiti. Kad
je jedna fraza u dokumentu prelomljena formatiranjem na dva dijela, u desnom
panelu se pojavi kao dvije oznake. Zato kod fraza brojač zna pokazati koji broj
više nego naslov.

## Zašto nema prekidača za brzi i spori način

Dok se datoteka obrađuje, alat prikazuje korake koje stvarno izvodi. Na maloj
datoteci ti koraci prije su bljesnuli i nestali prije nego ih se stiglo
pročitati, pa su samo smetali. Prva pomisao je bila dati korisniku prekidač:
brzi način bez prikaza i spori način s prikazom.

**Namjerno toga nema, iz dva razloga.**

Prvo, **prekidač koji ne mijenja rezultat daje odluku bez koristi.** Što god
korisnik odabere, nalaz je isti. Jedino što bi dobio je još jedno pitanje na
koje mora odgovoriti prije nego dobije ono po što je došao, i to pitanje o
nečemu što ga se zapravo ne tiče. Postavka koja ne mijenja ishod je trošak, ne
mogućnost.

Drugo, **kod obrade više datoteka takav prikaz ionako prestaje biti tijek jedne
provjere.** Kad se odjednom preda deset dokumenata, korisnika više ne zanima
koji je korak u tijeku, nego koja je datoteka gotova i što je u njoj nađeno.
Prikaz tada postaje popis obrađenih datoteka, a prekidač za "spori način" bi se
morao ukinuti čim se to doda.

Zato odlučuje **prag, a ne korisnik**: prikaz se pojavi samo ako obrada stvarno
traje dulje od otprilike pola sekunde, dakle samo kad ima što gledati. Ako
završi prije, ne pojavi se uopće. Kad se pojavi, svaki korak ostane vidljiv
dovoljno dugo da se pročita, ali **obrada ga ne čeka** - posao teče punom
brzinom, a prikaz samo zaostane za njim i nestane nešto kasnije. Nikakvog
umjetnog usporavanja posla nema.

## Nastavak rada na drugom stroju

Rad se vodi naizmjenično s više računala. Sve je u repozitoriju, pa se na novom
stroju nastavlja u tri koraka. Naredbe se upisuju u Terminal.

### 1. Provjeri može li stroj do GitHuba

```
ssh -T git@github.com
```

- Ako javi **`Hi neconeven-max! You've successfully authenticated`** — sve je u
  redu, idi na korak 2.
- Ako javi **`Permission denied (publickey)`** — taj stroj još nema svoju
  propusnicu za GitHub. Treba upisati njegov javni ključ
  (`~/.ssh/id_ed25519.pub`) na GitHub račun, u postavkama GitHuba pod
  *Settings → SSH and GPG keys*. Bez toga preuzimanje neće raditi.

### 2. Preuzmi repozitorij

```
cd ~
git clone git@github.com:neconeven-max/owluv.git
cd owluv
```

Time nastaje mapa `~/owluv` sa svime. Ako mapa već postoji od prije, umjesto
preuzimanja povuci najnovije stanje:

```
cd ~/owluv
git pull
```

### 3. Pokreni alat

Otvori datoteku `index.html` dvoklikom, ili iz Terminala:

```
open index.html
```

To je sve. Nema instalacije i nema pokretanja poslužitelja — alat je obična
stranica koja radi iz mape na disku. Radi i bez interneta.

### Pokretanje testa

Test provjerava da alat i dalje pronalazi sve zamke. Vrijedi ga pokrenuti prije
i poslije svake veće izmjene.

```
node test/pokreni-test.js
```

Ispisat će popis provjera i na kraju **`REZULTAT: PROSAO`** ili **`PAO`**.
Traje otprilike pola minute.

Za test su potrebne dvije stvari koje alat sam **ne** treba:
- **Node.js** — provjeri s `node -v`
- **Google Chrome** — test ga pokreće bez vidljivog prozora

Ako Chrome nije na uobičajenom mjestu, može mu se reći gdje je:

```
CHROME="/putanja/do/chrome" node test/pokreni-test.js
```

Testni dokumenti su već u repozitoriju. Ako ih zatreba napraviti ponovno:

```
node test/napravi-testne-docx.js
```

### Kad završiš rad

```
git add -A
git commit -m "kratak opis onoga sto je napravljeno"
git push
```

Prije toga dopuni odjeljak *Povijest izmjena* na dnu ovog dokumenta, jednim
kratkim unosom s datumom — što je napravljeno i zašto.

## Prijevodi za provjeru

Sučelje je na 6 jezika. Hrvatski i engleski su provjereni. Za ostale je
napisan najbolji mogući prijevod, ali sljedeće izraze bi trebao pregledati
netko tko jezik govori — to su stručni pojmovi iz Worda, gdje se lokalizirani
naziv razlikuje od doslovnog prijevoda:

U `js/i18n.js`, u odjeljku `r:` svakog jezika:
- `wvanish` — naziv Wordove oznake za skriveni tekst (u hrvatskom Wordu:
  "Skriveno"; u njemačkom "Ausgeblendet"; provjeriti DE, FR, ES, IT)
- `wwebhidden` — oznaka "skriveno na webu"
- `wtextbox` — tekstualni okvir izvan stranice

U odjeljku `ax:` svakog jezika:
- `deleted` — naziv za "obrisano praćenjem izmjena" (Word: Track Changes,
  DE "Änderungsverfolgung", FR "suivi des modifications")

Te ključeve `noteRecon`, `vNoneSub` i `vNoneSubImg` vrijedi pročitati naglas na
svakom jeziku, jer su to duže rečenice koje korisnik čita u trenutku kad mu je
stalo do točnog značenja.

---

## Povijest izmjena

### 22.08.2026. — v5.0, faza 2b: OwlUV čita PDF

**PDF se sada čita, istim putem kojim ide i Word.** Datoteka se učita, pretvori
u tekst i prikaže lijevo, a sve postojeće provjere rade dalje same od sebe.
Lijevi prikaz je kod PDF-a još grublja rekonstrukcija nego kod Worda, jer PDF
nema naslove ni odlomke, nego samo slova raspoređena po stranici. To piše i uz
sam panel.

**Najvažnije: ne traže se pojedini trikovi, nego sama nevidljivost.** Popis
poznatih trikova uvijek kasni za napadačem. Umjesto toga se stranica nacrta
dvaput, jednom sa svim sadržajem i jednom bez teksta, pa se izmjeri vidi li se
tekst uopće. Time odjednom ispadaju bijelo na bijelom, boja jednaka podlozi koja
nije bijela, crno na crnom, tekst ispod neprozirnog pravokutnika ili slike,
nevidljiv način crtanja, prozirnost blizu nule, i svaki budući trik koji nitko
još nije smislio. To se ne može zaobići novim trikom.

**Ono čega na stranici uopće nema čita se zasebno**, jer ga crtanje ne može
vidjeti: tekst u sloju kojemu je vidljivost isključena (posebno podmuklo, jer ga
većina alata uopće ne pokaže), tekst gurnut izvan stranice, polja obrasca,
komentari, svojstva dokumenta i ugrađeni JavaScript.

**Ugrađeni JavaScript se nikad ne izvršava.** Čita se kao tekst i prijavljuje,
da vidiš što piše. Test to provjerava tako da presretne svaki pokušaj i traži da
ih bude nula.

**Skenirani PDF ne može dobiti zelenu presudu.** PDF koji je fotografija papira
nema teksta, pa dobiva postojeću sivu presudu "nema što provjeriti". To pravilo
je od prije, ovdje je samo provjereno da vrijedi i za PDF.

**Opis nalaza o skrivenom tekstu dopunjen je**, jer se u životopise ne skrivaju
samo naredbe nego i podaci: duge liste vještina, ključne riječi prepisane iz
natječaja, izmišljeno radno iskustvo. Tu nema nijedne naredbe pa je radar nikad
ne bi prijavio, ali skriveno se hvata uvijek. Sada to i piše.

**Knjižnica:** pdf.js (Mozilla, Apache-2.0), vendorirana u repozitorij i
učitana tek kad stigne prvi PDF. Pojedinosti i izmjereno trajanje obrade su u
zasebnom odjeljku gore.

**Napravljen je generator testnih PDF-ova** i jedanaest testnih datoteka, po
jedna za svaku vrstu zamke plus čist i skeniran uzorak. Svaka je pokrivena
provjerom u testu; rezultat je u tablici gore. Ukupno 296 provjera, sve prolaze.

### 21.08.2026. — v4.8: radar ide na samo dno, uz jasnije upozorenje

**Nalaz "rečenice koje se obraćaju stroju" sada je posljednji u popisu**, ispod
dugih crtica. U v4.7 je bio nešto više, iznad njih. Taj je nalaz najširi i
najbučniji, javlja se i na posve normalnim rečenicama, pa ne smije stajati iznad
nalaza koji su konkretni.

**Opis tog nalaza sada odmah kaže da je vjerojatno riječ o lažnoj uzbuni.** Prije
je to spominjao, ali prekasno i preblago, pa je korisnik iz naslova zaključio da
su sve te rečenice sumnjive. Sada prva rečenica opisa kaže da je većina njih
vjerojatno posve bezopasna i da ih alat pokazuje zato da ništa ne prešuti, a ne
zato što tvrdi da su zamke. Tek onda slijedi uputa: pročitaj ih i označi samo one
za koje sam procijeniš da su pisane za AI. Ako ništa ne označiš, ništa se ne
briše.

### 21.08.2026. — v4.7: redoslijed nalaza i manje šuma u novom radaru

**Najvažniji nalaz je opet na vrhu.** Novi nalaz po signalima znao je imati
dvadesetak stavki i stajati prvi, pa je nalaz o skrivenom tekstu bio zakopan
ispod njega i korisnik ga nije vidio bez pomicanja. Popis se sada slaže po
ozbiljnosti: skriveni tekst i skrivena poruka, pa okviri izvan stranice, pa
sumnjive fraze, nevidljivi znakovi, sadržaj iz strukture datoteke sa svojstvima
dokumenta, pomiješana pisma, tek onda rečenice koje se obraćaju stroju, i na
kraju duge crtice. Novi nalaz je namjerno pri dnu jer je najširi i najbučniji.

**Svojstva dokumenta više ne ulaze u popis rečenica.** U njemu su znale stajati
stavke poput "Svojstva dokumenta", "Autorkristina." i "jedvajic@gmail." - dakle
e-mail adresa razlomljena na pola kao da je rečenica, što je izgledalo kao kvar.
Uz to su se svojstva prijavljivala dvaput, jer već imaju vlastiti nalaz. Isto
vrijedi za natpise koje alat sam dodaje radi preglednosti, poput naslova
odjeljaka i imena datoteke uz zaglavlje. Nalaz o svojstvima dokumenta ostaje
netaknut.

**Signal "obraća se stroju" više ne okida na riječ "sustav".** Na pravom
dokumentu o prometu gotovo svaka rečenica koja spominje prometni sustav
završavala je u popisu s objašnjenjem da se obraća stroju. To nije obraćanje
stroju nego obična hrvatska riječ. Signal sada traži **okvir obraćanja**, a ne
samu pojavu riječi: da je riječ upotrijebljena kao netko kome se govori. Riječi
poput "sustav", "program" i "model" okidaju samo kad uz njih stoji uvjet s
čitanjem ili obradom ("ako ovo obrađuje program..."), a "upute" i "naredba"
izbačene su iz tog signala jer nisu stroj.

**To nije prag ni odbacivanje nalaza**, nego ispravak signala koji je krivo
prepoznavao. Alat i dalje prikazuje sve što nađe.

**Mjereno prije i poslije:** zamke ostaju na 30 od 30, dakle nijedna nije
izgubljena, a lažno okidanje na normalnim rečenicama palo je s 29 od 30 na 18 od
30. Signal obraćanja stroju na normalnom tekstu sada ne okida nijednom. Brojke
i objašnjenje su u odjeljku o mjerenju gore.

### 21.08.2026. — v4.6: korisnik bira što se briše, i šira mreža za AI manipulaciju

**Sada ti biraš što se briše iz kopije.** Uz svaku sumnjivu rečenicu stoji
kvačica. Kvačice su po zadanom prazne, ništa se ne briše dok ne odlučiš. Kad
označiš rečenicu, ona nestaje i iz kopiranog teksta i iz spremljene Word
datoteke; ništa se ne stavlja na njeno mjesto. Uz popis su gumbi "označi sve" i
"odznači sve", jer pojava zna biti mnogo, a uz gumbe za kopiranje i spremanje
piše koliko je stavki označeno, da se vidi što će ti dati.

**Skriveni sadržaj i dalje nema kvačicu i briše se uvijek.** Razlika je
namjerna: skrivanje je samo po sebi dokaz namjere, pa se briše bez pitanja.
Vidljivu rečenicu alat ne briše sam, jer je korisnik mogao vidjeti i sam.

**Alat sada hvata i zamke napisane svojim riječima.** Dosad je tražio gotove
fraze s popisa, što hvata lijene napade a promašuje svakoga tko istu stvar
napiše drugačije. Nije važno koje točno riječi stoje, nego da se rečenica
obraća stroju, a ne čitatelju: kao kad se u pismu upućenom tebi odjednom pojavi
rečenica upućena poštaru. Uz postojeći popis, koji ostaje netaknut, dodano je
prepoznavanje po šest signala: obraćanje stroju, zapovjedni ton oko ocjenjivanja
ili odabira, traženje tajnosti, podmetanje ishoda, rečenica na drugom jeziku od
ostatka dokumenta, i mjesto nalaza (zaglavlje, fusnota, komentar, svojstva).

**Uz svaku rečenicu piše zašto je označena**, npr. "obraća se stroju, traži
tajnost, u podnožju". Rečenica s jednim signalom ide u popis jednako kao ona s
četiri; nema praga i nema odbacivanja. Kad rečenica ima više signala, to se vidi
u objašnjenju, pa sam razaznaješ što je ozbiljnije bez da alat odlučuje umjesto
tebe.

**Napravljen je skup primjera za mjerenje**, po pet rečenica na svakom od šest
jezika u dvije skupine, pa se zna je li verzija bolja ili samo drugačija.
Rezultat i objašnjenje su u zasebnom odjeljku gore. Ukratko: sve zamke su
prepoznate, ali mreža okida i na gotovo svakoj normalnoj rečenici. Zato nalaz po
signalima nosi plavu težinu napomene, a ne crvenu presudu - inače bi svaki
školski zadatak koji traži odgovor završio kao crvena uzbuna i crvena bi
prestala išta značiti.

**Usput popravljeno:** tekst se za signale sada gradi s granicama odlomaka.
Prije se naslov i prvi odlomak spajali bez razmaka ("geografijeNapiši"), pa je
signal na tom spoju tiho promašivao.

### 21.08.2026. — v4.5: upozorenje o izmjeni, potpunija kopija, spremanje u Word

**Kad se tekst izmijeni rukom, alat to sada kaže.** Lijevi panel se može
uređivati, pa se tekst može promijeniti nakon skeniranja, a nalazi u desnom
panelu ostanu stari. Prije se to nije javljalo nikako. Sada se čim se sadržaj
dirne rukom pojavi crveno upozorenje da prikazani nalazi više ne odgovaraju
sadržaju, s gumbom koji ih osvježi. Javlja se na svaku izmjenu, i na brisanje
jednog razmaka, jer je bolje javiti previše nego prešutjeti.

**Skeniranja pri svakom pritisku tipke namjerno nema.** To je nepotreban posao
koji na velikom dokumentu vidljivo usporava rad, a korisniku ne donosi ništa dok
još piše. Zato upozorenje, a ne stalno skeniranje.

**Gumb "Skeniraj" je uklonjen iz stalne trake.** Skeniranje ide samo pri unosu,
a ručno samo kroz to upozorenje, dakle točno onda kad stvarno treba. Gumb više
ne stoji na najistaknutijem mjestu i ne navodi na pomisao da se nešto mora
pritisnuti da bi se dobio rezultat.

**Zaglavlja, podnožja i fusnote vraćeni su u očišćenu kopiju.** U v4.4 su bili
izbačeni zajedno s ostatkom aneksa. To je bilo prestrogo: zaglavlje, podnožje i
fusnota su pravi sadržaj koji je autor napisao i koji čovjek vidi kad čita
dokument. Kopija iz koje tiho nedostaje dio dokumenta je pogrešna, a korisnik ne
bi ni znao da mu nešto fali. Pravilo čišćenja vrijedi i unutar njih: ako je
nešto u zaglavlju bilo skriveno, briše se kao i drugdje. Svojstva dokumenta i
dalje ostaju vani, jer to nisu riječi dokumenta nego podaci o datoteci.
Natpisi koje je alat sam dodao radi preglednosti ne prepisuju se u kopiju.

**Očišćeni tekst se sada može spremiti kao Word datoteka.** Uz gumb za kopiranje
stoji i gumb koji sprema isti očišćeni sadržaj kao novu `.docx` datoteku, sa
sačuvanim naslovima, podebljanim i ukošenim tekstom, popisima, tablicama i
odlomcima. Ime je izvedeno iz izvornog, uz jasnu oznaku da je riječ o očišćenoj
verziji. To je **nova** datoteka; izvorna se ne dira, a prijelom stranica,
margine i točan font neće biti identični izvorniku, jer se dokument gradi iznova
iz teksta koji alat vidi. To piše i uz sam gumb.

Za spremanje **nije dodana nova knjižnica**. Datoteka se gradi ručno, uz već
vendoriranu fflate za pakiranje. Popisi se rade pravim Wordovim numeriranjem, a
ne dopisivanjem točke ili broja u tekst, jer bi to bilo dodavanje znakova kojih
u dokumentu nema.

**Test dopunjen na 221 provjeru.** Spremljena datoteka se u testu provlači kroz
vlastiti čitač alata, što je jača potvrda da se stvarno otvara nego provjera da
je ZIP. Uz to je provjerena i macOS-ovim vlastitim čitačem Worda: otvara se,
sadrži naslov, tekst, zaglavlje, podnožje i fusnotu, a od skrivenog sadržaja
nema ni jedne riječi.

### 21.08.2026. — v4.4: gumb za kopiranje sada stvarno čisti

**Glavni popravak: "Kopiraj očišćeni tekst" nije čistio ono najvažnije.** Gumb
je obećavao očišćen tekst, a uklanjao je samo nevidljive znakove i duge crtice.
Skrivene rečenice, one bijele ili u fontu od jednog piksela, ostajale su u
kopiranom tekstu. Tko bi taj tekst zalijepio u AI, zalijepio bi i injekciju,
uvjeren da je očišćena. To je bilo zavaravajuće upravo prema korisniku koji je
postupio ispravno: prepoznao je opasnost, kliknuo na čišćenje i dobio isti
otrov s etiketom da je uklonjen.

Sada se iz kopije **briše** sve što je bilo skriveno formatiranjem, sve s
Wordovom oznakom skrivenog teksta, komentari, obrisani tekst iz praćenja
izmjena i nevidljivi znakovi. Duge crtice postaju obične. Na mjesto obrisanog
**ništa se ne stavlja**: bez oznaka, bez bilježaka, bez zagrada. Tekst
jednostavno teče dalje. Ostatak teksta ostaje netaknut.

**Izvorna datoteka se pritom ne dira.** Alat je samo čita. Mijenja se isključivo
tekst koji korisnik kopira.

**Formatiranje se čuva.** U međuspremnik idu obje verzije odjednom, bogata i
obična, pa primatelj uzme ono što može primiti: u Wordu i e-pošti dobiješ
naslove, podebljano, popise i tablice, a u običnom polju i AI chatu čist tekst.
U bogatu verziju propuštaju se samo svojstva kojima se ništa ne može sakriti,
pa se skrivanje ne može provući ni slučajno.

**Drugi gumb je uklonjen.** "Kopiraj samo vidljivi tekst" nakon ovog popravka
radi isto što i prvi, pa je bio samo još jedan izbor bez razlike. Preostali
gumb preselio je u desni panel, ispod prikaza: lijevo je ono što si unio, desno
je rezultat.

**Paneli su sada jednake visine.** Lijevi je imao gumbe i savjet ispod, desni
nije, pa se dna nisu poklapala. Sada rastu zajedno, a prazan prostor upija
područje prikaza teksta.

**Granice veličine.** Vrlo velika datoteka je prije mogla zaustaviti preglednik
bez ijedne poruke. Sada postoji granica od 15 MB za datoteku i 1.000.000 znakova
za tekst, uz jasnu poruku. Objašnjenje u zasebnom odjeljku gore.

**Više datoteka odjednom više se ne prešućuje.** Kad se baci tri datoteke, alat
i dalje uzima prvu, ali sada to i kaže. Prije je šutio, pa se moglo pomisliti da
su sve provjerene.

**Tri rubna slučaja kod datoteka.** Word zaštićen lozinkom sada se prepoznaje po
potpisu datoteke i dobiva izričitu poruku koja kaže i da to **nije** potvrda o
čistoći. Prije je takav dokument mogao izgledati kao neispravan, a najgori
mogući ishod bio bi da izgleda prazan i dobije presudu "nema što provjeriti" na
dokument koji možda ima zamku. Datoteka s krivim nastavkom, primjerice slika
preimenovana u `.docx`, sada kaže da sadržaj nije čitljiv umjesto da prikaže
prazno.

**Sitnice.** Zraka iz očiju sove traje četiri sekunde umjesto dvije. Objašnjenje
na prijelaz mišem više ne iskače kod miša preko teksta nego se crta ispod gumba
i poravnato s njim. Savjet ispod lijevog panela više ne govori samo o
lijepljenju nego o tome koliko se pouzdan rezultat dobiva kojim putem, dok
uputa kako unijeti sadržaj ostaje u samom panelu. Nakon kopiranja se pojavi
kratka potvrda koja se sama povuče.

**Što nije napravljeno:** gumb "Skeniraj" je ostao. Trebao je otići jer alat
skenira sam, ali provjera je pokazala da postoji slučaj u kojem ne skenira sam:
lijevi panel se može uređivati, a utipkani tekst i naknadna izmjena ne pokreću
provjeru. Dok se to ne riješi, gumb je jedini način da se takav sadržaj
provjeri, pa ostaje.

### 20.08.2026. — v4.3: kretanje kroz pojave i tri veličine

**Klik na nalaz sada vodi na sljedeću pojavu, ne uvijek na prvu.** Prije je
svaki klik vraćao na isto mjesto, pa je kod nalaza s tri duge crtice treći klik
opet završio na prvoj i alat je djelovao pokvareno. Sada se kroz pojave ide kao
kod traženja riječi u pregledniku: klik vodi na sljedeću, nakon zadnje se vraća
na prvu, a mali brojač pokazuje na kojoj si od koliko. Uz brojač su dvije
strelice za preskakanje u oba smjera; klik na strelicu pomiče za točno jedno
mjesto i ne okida usput i skok cijele kartice. Nalaz s jednom pojavom nema ni
brojač ni strelice, a nalaz bez mjesta u tekstu nema ni skok, kao i dosad.
Zašto kretanje, a ne popis svih pojava, objašnjeno je u zasebnom odjeljku gore.

**Vidi se na kojoj si pojavi.** Ona na koju se skočilo nakratko zasvijetli jače
nego prije, pa ostane tanko obrubljena dok se ne skoči dalje. Bez toga se poslije
bljeska nije znalo koja je od nekoliko jednakih oznaka bila zadnja.

**Zaštita kad pojava ima jako puno.** Iznad 50 pojava uz brojač se pojavljuje
kratka napomena da ih je puno. Kod dugih crtica napomena kaže i zašto je to
bitno: toliki broj obično znači da je tekst pisao AI, a ne da je nešto skriveno.
Pojave se i dalje ne izlistavaju.

**Tri veličine su ispravljene.** Logo u podnožju povećan je još 20 posto, sova i
naziv "OwlUV" zajedno 30 posto da im odnos ostane isti, a podnaslov 20 posto.
Zraka je povećana u istoj mjeri kao sova, pa i dalje izlazi iz očiju.

**Popravljeno prelijevanje na uskom zaslonu.** Provjera veličina otkrila je da
se stranica na mobitelu vodoravno prelijevala: tri gumba u zaglavlju panela nisu
stala u red i gurala su cijelu stranicu u širinu, pa je tekst bježao izvan
zaslona. Sada gumbi prelaze u novi red, podnožje se prelama, a naziv i sova se
na uskom zaslonu vraćaju na manju mjeru. Test to sada mjeri na šest širina, od
320 do 768 px, i pada ako se išta prelije.

**Test dopunjen na 146 provjera.** Nove provjere: uzastopni klikovi obilaze sve
pojave redom i vraćaju se na prvu, brojač pokazuje točan položaj i ukupan broj,
strelice pomiču za točno jedno mjesto, nalaz s jednom pojavom nema brojač,
napomena o velikom broju se pojavljuje iznad praga a ispod ne, i stranica se ne
prelijeva u stranu ni na jednoj od šest provjerenih širina.

### 20.08.2026. — v4.2: dorade nakon pregleda v4.1

**Logo u podnožju je povećan otprilike tri puta.** Prije se jedva vidio, sada se
sova i natpis jasno raspoznaju, a podnožje je i dalje podnožje. Tekst i
poveznica poravnati su s logotipom po visini.

**Gumb "Novi tekst" je pojačan.** Bio je najsvjetliji od tri gumba u zaglavlju
pa ga je oko preskakalo. Dobio je jači obrub, tamniji i deblji tekst i nešto
veći razmak, ali je ostao vidljivo odvojen tankom crtom, jer to nije još jedna
radnja nad dokumentom nego izlaz iz njega.

**Prikaz tijeka provjere se više ne pojavljuje na brzoj obradi.** Na maloj
datoteci koraci su bljesnuli i nestali prije nego ih se stiglo pročitati, pa su
samo smetali. Sada je prikaz odvojen od posla: pojavi se tek ako obrada stvarno
traje dulje od otprilike pola sekunde, a ako završi prije, ne pojavi se uopće.
Kad se pojavi, svaki korak ostane vidljiv dovoljno dugo da se pročita, ali
obrada ga ne čeka - posao ide punom brzinom, prikaz samo zaostaje i nestane
nešto kasnije od njega. Nema nikakvog umjetnog usporavanja. Zašto to nije
riješeno prekidačem za brzi i spori način, piše u zasebnom odjeljku gore.

**Alat je dobio podnaslov.** Uz naziv "OwlUV" sada stoji i što alat radi, na
hrvatskom "Skener skrivenog teksta i AI zamki". Isti opis ide i u naslov kartice
preglednika i u opis stranice, jer to tražilica čita, i mijenja se sa svih 6
jezika sučelja.

**Uz naziv je dodana sova koja šalje UV zraku.** Zraka izlazi iz očiju i prijeđe
s lijeva na desno jednom, kad se stranica otvori i kad skeniranje počne, pa se
smiri. Ne vrti se stalno i ugašena je ako je u sustavu uključeno smanjenje
animacija. Nije napravljena kao gif nego se crta i animira u samoj stranici:
rubovi ostaju glatki na svakoj veličini, podloga se vidi kroz prozirne dijelove
i datoteka je lakša. Sama glava sove izrezana je iz postojećeg logotipa SOVA WEB
skriptom `assets/izdvoji-sovu.py`, koja je ostavljena u repozitoriju da se vidi
odakle je slika došla i da se izrez može ponoviti.

**Test dopunjen na 111 provjera.** Nove provjere: da se prikaz koraka ne
pojavljuje na brzoj obradi, da se kad se pojavi ne izgubi prije nego ga se
stigne pročitati, i da podnaslov postoji na svih 6 jezika te ulazi u naslov
kartice i u opis stranice. Provjera praga napisana je tako da ispituje pravilo,
a ne brzinu stroja na kojem se vrti.

### 20.08.2026. — v4.1: popravci nakon testa pravim Wordovim dokumentom

Alat je prvi put proveden kroz **pravi Wordov dokument** od 2,1 MB sa slikama i
dvije skrivene poruke u bijeloj boji, veličine 1,3 px. Obje su pronađene i
točno prikazane, zajedno s autorom iz svojstava dokumenta. Sumnja zapisana u
`CLAUDE.md`, da bi boja zadana preko teme dokumenta mogla promaknuti, nije se
obistinila i time je zatvorena. Ovo su popravci koje je test pokazao.

**Lažna uzbuna iz međuspremnika, popravljena.** Kad se sadržaj kopira iz Worda
i zalijepi kao tekst, sustav sam u međuspremnik ubaci tehničke oznake početka i
kraja odabira. Alat ih je prijavljivao kao skriveni sadržaj, pa je umjesto dvije
prave zamke javljao četiri nalaza i crtao ih u desnom panelu s bubom. To je
rušilo povjerenje u alat, jer je izgledalo kao da vidi nešto čega nema. Sada se
poznate tehničke oznake prepoznaju i potpuno preskaču. Obični HTML komentari i
dalje jesu nalaz, jer se u njima stvarno kriju poruke.

**Treći put do datoteke i nijedna tišina.** Datoteka se sada može i zalijepiti
iz međuspremnika: u Finderu kopiraš datoteku pa pritisneš Cmd+V nad lijevim
panelom. To ovisi o pregledniku, pa nikad nije jedini put; povlačenje i gumb
uvijek rade. Ako Cmd+V ne donese ni datoteku ni tekst, alat više ne šuti nego
kaže da datoteku treba povući ili odabrati gumbom. Dosad se u tom slučaju nije
dogodilo ništa, pa korisnik nije mogao znati je li alat pokvaren.

**Nalazi se sada mogu kliknuti.** Klik na nalaz pomiče desni panel na prvo
mjesto tog nalaza i nakratko ga istakne. Zbog toga su duge crtice i riječi s
pomiješanim pismima dobile vlastitu oznaku u desnom panelu, jer se prije nisu
vidjele nigdje pa nalaz nije imao kamo skočiti. Oznaka je namjerno tanka i siva:
duge crtice znaju biti česte i u sasvim normalnom tekstu, pa ne smiju bučati.
Svojstva dokumenta nemaju mjesto u tekstu, pa taj nalaz nije kliknabilan i to
se vidi.

**Nalazi su čitljiviji.** Citirani tekst je sada u UV ljubičastoj boji, a
objašnjenje u zagradi manjim sivim slovima ispod njega. Prije su citat i opis
bili u istoj sivoj boji pa se nije odmah vidjelo što je nađeno, a što je
objašnjenje.

**Crvena presuda pulsira.** Kad alat javi da je otkriven skriveni sadržaj, okvir
lagano pulsira da privuče pogled: spor puls od 1,6 sekunde po ciklusu, najviše
tri ciklusa, pa se smiruje. Nikad ni blizu granice od tri bljeska u sekundi, i
potpuno ugašen ako je u sustavu uključeno smanjenje animacija. Zelena i siva
presuda ostaju mirne.

**Dvije ispravke teksta.** Nalaz o dugim crticama je govorio "zamijenjeno", što
je zvučalo kao da alat mijenja dokument. Ne mijenja ga. Sada piše "pronađeno" i
objašnjava da se zamjena događa tek u kopiji koju daje gumb "Kopiraj očišćeni
tekst". Zelena presuda "Tekst izgleda čist" pojavljivala se i kad je bilo plavih
nalaza, što je bilo proturječno; sada u tom slučaju kaže da nema skrivenog
sadržaja ni zamki, ali da postoje napomene niže.

**Tijek provjere umjesto praznog čekanja.** Dok se datoteka obrađuje, prikazuju
se koraci koji se stvarno izvode: čitanje dokumenta, provjera boja i veličina
fonta, traženje skrivenog teksta, provjera fraza na 6 jezika i pregled svojstava
dokumenta. Prikazuju se samo koraci koji se doista izvršavaju i samo dok stvarno
traju; korak sa svojstvima dokumenta pojavljuje se samo kad je učitan Word.
Nema nijednog umjetnog kašnjenja ni izmišljenog koraka. Ako obrada završi gotovo
trenutno, prikaz samo bljesne ili se ne pojavi, i to je u redu.

**Gumb "Novi tekst" premješten je gore**, u zaglavlje lijevog panela, uz gumbe
za odabir datoteke i za primjer. Prije je bio dolje, predaleko od mjesta gdje se
datoteka mijenja.

**Logo SOVA WEB u podnožju.** Alat je proizvod robne marke SOVA WEB (SOVA VID
j.d.o.o.). U podnožje su dodani logo, napomena čiji je alat i poveznica na
`sovaweb.net`, diskretno. Ikona kartice preglednika i ikona za dodavanje na
početni zaslon također su postavljene. Sve tri datoteke leže u `assets/` unutar
repozitorija, jer alat mora raditi i bez OneDrivea, bez interneta i s USB-a.

**Test dopunjen.** Uz svih 47 postojećih provjera dodano je 30 novih, među
njima tri tražene: lijepljenje datoteke iz međuspremnika, poruka kad Cmd+V ne
donese ništa, i provjera da tehničke oznake iz međuspremnika ne postaju nalaz
dok pravi HTML komentar i dalje postaje. Ukupno 77 provjera, sve prolaze.

### 20.08.2026. — faza 2a: učitavanje datoteka i dubinsko čitanje Worda

**Postavljen repozitorij.** Alat je iz jedne datoteke prerastao u mapu:
`index.html` plus odvojene skripte plus mapa za knjižnice. Radna verzija v3.3
sačuvana je nepromijenjena u `standalone/`, kao verzija za brzo slanje mailom
koja radi bez ičega drugog. Razlog za razdvajanje: datoteka od 700 linija u
kojoj su prijevodi, detekcija i sučelje izmiješani postala je preteška za
dopunjavanje, a svaka nova mogućnost dirala bi i ono što već radi.

**Datoteke se sada mogu učitati.** Lijevi panel je postao zona za ispuštanje —
povučeš dokument preko njega i on se obradi. Dok datoteku držiš iznad panela,
panel to pokaže. Uz to je dodan i klasičan gumb za odabir datoteke, jer na
mobitelu povlačenje ne radi. Ime i veličina učitane datoteke pišu u zaglavlju
panela. Podržani su obični tekst, HTML i Word `.docx`; radi se jedna datoteka
odjednom, a "Novi tekst" briše i nju.

**Word se čita izravno iz strukture datoteke.** Ovo je bio glavni razlog cijele
faze. Iz `.docx`-a se sada vadi i ono što označavanje mišem uopće ne prenosi:
Wordova oznaka skrivenog teksta, boja i veličina fonta po dijelu teksta,
komentari, obrisani tekst iz praćenja izmjena, zaglavlja i podnožja, fusnote,
svojstva dokumenta i tekstualni okviri gurnuti izvan stranice. Nismo koristili
gotovu knjižnicu za pretvorbu u HTML jer takve knjižnice prikazuju dokument
kakav izgleda, pa tiho izbace upravo skriveni tekst — alat ne bi vidio ono zbog
čega postoji. Umjesto toga čitamo XML izravno, a prikaz gradimo zasebno.

**Dokument bez teksta više ne može dobiti zelenu presudu.** Ako se iz datoteke
ne može pročitati nijedno slovo, primjerice kod skeniranog dokumenta koji je
zapravo slika, alat daje zasebnu poruku da nema što provjeriti. Prije bi takav
dokument prošao kao čist, što je opasnije nego da nije provjeren.

**Sučelje je dopunjeno na svih 6 jezika.** Sav novi tekst — poruke o
formatima, četvrta presuda, nazivi nalaza iz Worda, razlozi skrivenosti —
postoji na hrvatskom, engleskom, njemačkom, francuskom, španjolskom i
talijanskom. Automatski test pada ako neki jezik nešto nema. Uz to je u sučelje
dodana napomena da je kod Worda lijevi prikaz rekonstrukcija sadržaja, a ne
fotografija dokumenta, da netko ne pomisli da je alat pokvaren jer razmaci nisu
identični Wordu.

**Napravljen je automatski test.** Testni `.docx` sadrži sve vrste skrivenog
sadržaja odjednom, a test ga provlači kroz pravi `index.html` u pregledniku i
provjerava da svaku od njih alat stvarno pronađe. Prošlo je svih 47 provjera.

**Poslano na GitHub i pripremljen prijelaz na drugi stroj.** Repozitorij je
poslan na `git@github.com:neconeven-max/owluv.git`, a u ovaj dokument dodan je
odjeljak *Nastavak rada na drugom stroju*, da se rad može nastaviti bez
prisjećanja kako se što pokreće.

### Ranije — v3.3 (postojeća radna verzija)

Jedna datoteka, radi potpuno lokalno u pregledniku. Sučelje na 6 jezika, dva
panela (lijevo dokument u izvornom izgledu, desno isti dokument pod UV lampom)
i detekcija fraza na svih 6 jezika. Ta je verzija sačuvana u `standalone/`.

---

## Sljedeći korak

Objava: repozitorij u javni, stranica na `owluv.com`.
