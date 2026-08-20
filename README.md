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

U alat se sadržaj unosi na tri načina:
- zalijepiš tekst (Cmd+V) — najbolje direktno iz izvornika, jer se tako čuva
  formatiranje koje skener pregledava
- povučeš datoteku preko lijevog panela
- klikneš "Odaberi datoteku" (za mobitel, gdje povlačenje ne radi)

Jedna datoteka odjednom. Gumb "Novi tekst" (ili Esc) briše i datoteku.

**Podržani formati:** obični tekst, HTML, Word `.docx`.
Stari `.doc` nije podržan — alat javlja da dokument treba spremiti kao `.docx`.
PDF još nije podržan — alat to jasno kaže umjesto da se pravi da je pregledao.

## Struktura mapa

```
index.html                    glavni alat
js/
  i18n.js                     prijevodi sučelja, 6 jezika
  detect.js                   detekcijska jezgra (prenesena iz v3.3)
  docx.js                     čitač .docx datoteka, izravno iz XML-a
  files.js                    ulaz za datoteke i prepoznavanje formata
  app.js                      sučelje, tijek skeniranja, presuda
vendor/
  fflate/                     raspakiravanje ZIP-a (MIT licenca), u repozitoriju
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

## Test

```
node test/napravi-testne-docx.js     # napravi testne .docx (već su u repozitoriju)
node test/pokreni-test.js            # pokrene test i ispiše rezultat
```

Test otvara **pravi `index.html`** u Chromeu bez sučelja, izravno s diska, i
poziva iste funkcije koje pozivaju gumbi. Nema poslužitelja i nema mreže, pa
test ujedno provjerava i obećanje da alat radi s `file://`.

Testni dokument `test-skriveno.docx` sadrži sve vrste skrivenog sadržaja
odjednom. `test-bez-teksta.docx` sadrži samo sliku i nijedno slovo.
`test-cist.docx` je kontrolni uzorak bez ijedne zamke.

### Rezultat zadnjeg pokretanja: 20.08.2026., 47 provjera, sve prošle

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

### Ranije — v3.3 (postojeća radna verzija)

Jedna datoteka, radi potpuno lokalno u pregledniku. Sučelje na 6 jezika, dva
panela (lijevo dokument u izvornom izgledu, desno isti dokument pod UV lampom)
i detekcija fraza na svih 6 jezika. Ta je verzija sačuvana u `standalone/`.

---

## Sljedeći korak

Faza 2b: PDF. Sučelje već ima poruku da PDF nije podržan, pa korisnik ne dobiva
lažnu presudu dok ga ne dodamo.
