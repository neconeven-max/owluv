# Status objave OwlUV

**Ovo je jedino mjesto istine o objavi.** Piše dokle je stiglo, što je već
napravljeno, gdje smo stali i što je sljedeće. Napisano je tako da ga može
pročitati netko tko o projektu ne zna ništa i nastaviti bez ijednog pitanja.

Zadnja izmjena: **13.09.2026.**, preusmjeravanje `hiddentextscanner.com`

Upute korak po korak za GitHub i DNS stoje u [README.md](../README.md), odjeljak
*Setting up the website*, odnosno u [README.hr.md](../README.hr.md), odjeljak
*Postavljanje stranice*. Ovaj dokument bilježi **stvarno stanje**, a README
opisuje **postupak**.

---

## Stranica je ŽIVA na vlastitoj domeni

> ### https://owluv.com

Od 12.09.2026. alat radi na vlastitoj domeni, preko HTTPS-a, s valjanim
certifikatom. Sve ostale adrese vode na nju trajnim preusmjeravanjem (301):
`http://owluv.com`, `www.owluv.com` (oba protokola) i stara privremena adresa
`neconeven-max.github.io/owluv/`.

---

## Kratko stanje

| Korak | Stanje |
|---|---|
| Kod v6.3 na GitHubu, grana `main` | **gotovo** |
| Repozitorij javan | **gotovo** |
| GitHub Pages uključen, grana `main`, mapa `/` | **gotovo** |
| DNS za `owluv.com` na Cloudflareu | **gotovo**, 12.09.2026. |
| Datoteka `CNAME` vraćena u repozitorij | **gotovo**, commit `c1813e7` |
| `owluv.com` kao vlastita domena na GitHubu | **gotovo** |
| Certifikat i Enforce HTTPS | **gotovo**, certifikat vrijedi do 10.12.2026. |
| Stranica provjerena na `https://owluv.com` | **gotovo**, 380 provjera, sve prošle |
| SEO: jezične stranice, hreflang, OG, JSON-LD, sitemap, robots | **gotovo**, v6.4, 12.09.2026. |
| GitHub: polje Website i opis repozitorija | **gotovo** |
| Google Search Console: vlasništvo i sitemap | **čeka Nevena**, vidi niže |
| Preusmjeravanje `hiddentextscanner.com` na `owluv.com` | **ZAVRŠENO**, 13.09.2026., 301 na sve varijante |
| Pro blok u zaglavlju s kontaktom `info@sovavid.hr` | **gotovo**, 13.09.2026., 6 jezika |
| Analitika posjeta | **gotovo**, 13.09.2026., Cloudflare proxy, bez ijedne skripte u kodu |

---

## Provjereno na živoj stranici, 12.09.2026.

Cijeli automatski test iz repozitorija (`test/test-runner.html`) pokrenut je u
Chromeu bez sučelja **izravno protiv `https://owluv.com`**, dakle isti test koji
inače ide iz mape i s lokalnog poslužitelja, samo protiv prave stranice:

> **380 provjera, 0 palo.** Isti broj kao u lokalnom prolazu.

Uz to, rukom u pravom pregledniku:

| Provjera | Rezultat |
|---|---|
| Verzija u podnožju | `v6.3` |
| Certifikat | Let's Encrypt, za `owluv.com` i `www.owluv.com`, vrijedi do 10.12.2026. |
| `http://owluv.com` | 301 na `https://owluv.com/` |
| `http://www.owluv.com`, `https://www.owluv.com` | 301 na `https://owluv.com/` |
| `neconeven-max.github.io/owluv/` | 301 na `https://owluv.com/` |
| "Isprobaj primjer" | **crvena** presuda, 4 nalaza (skriveni tekst, 3 fraze, 4 nevidljiva znaka, 3 rečenice) |
| Servisni radnik (rad bez interneta) | prijavljen na `https://owluv.com/`, ostava `owluv-v6.3` |
| **Zahtjevi izvan `owluv.com`** | **nijedan** (15 zahtjeva, svi na `owluv.com`) |

Zadnji redak je najvažniji: alat na živoj stranici ne dohvaća ništa izvana, kako
i obećava.

---

## Što je konfigurirano

### GitHub

Repozitorij `github.com/neconeven-max/owluv`:

- vidljivost: **javan**
- zadana grana: `main`
- GitHub Pages: **uključen**, izvor je grana `main`, mapa `/` (root),
  `build_type: legacy`
- vlastita domena: **`owluv.com`** (postavljena 12.09.2026. preko `gh api`)
- Enforce HTTPS: **uključen**
- `CNAME` (sadržaj `owluv.com`), `.nojekyll`, `index.html`,
  `manifest.webmanifest`, `sw.js`: svi na `main`

Alat `gh` (GitHub CLI) instaliran je preko Homebrewa na radnom računalu,
prijavljen na račun `neconeven-max`, opseg `repo`. Zbog toga se Pages može
podešavati i provjeravati s naredbenog retka:

```
gh api repos/neconeven-max/owluv/pages                 # stanje, domena, certifikat
gh api repos/neconeven-max/owluv/pages/builds/latest   # zadnja gradnja
```

### DNS, Cloudflare

Domena `owluv.com` ostaje kupljena na Regici; Regica prijavljuje registru
Cloudflareove poslužitelje imena, a zonu poslužuje Cloudflare (besplatan plan):

| Što | Vrijednost |
|---|---|
| Poslužitelji imena (na Regici) | `lilyana.ns.cloudflare.com`, `matteo.ns.cloudflare.com` |
| `A` zapisi za `owluv.com` | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| `CNAME` za `www` | `neconeven-max.github.io` |
| Proxy (narančasti oblačić) | **uključen** od 13.09.2026. (do tada DNS only), vidi "Analitika" niže |
| SSL/TLS mode | **Full (strict)** |

Iskonovi poslužitelji imena su obrisani s Regice. Provjera s bilo kojeg
računala:

```
dig +short owluv.com NS      # dva Cloudflareova poslužitelja
dig +short owluv.com A       # četiri GitHubove adrese
dig +short www.owluv.com     # neconeven-max.github.io.
```

### hiddentextscanner.com: parkirana, 301 na owluv.com (13.09.2026.)

Druga domena ne poslužuje ništa svoje. Sve što na nju stigne Cloudflare na
rubu trajno preusmjeri na `owluv.com`, uz čuvanje putanje i upita. Isti
Cloudflareov račun kao `owluv.com`, isti par poslužitelja imena, upisan na
Regici na stranici te domene.

| Što | Vrijednost |
|---|---|
| `A` zapis za `hiddentextscanner.com` | `192.0.2.1`, **Proxied** (narančasti oblačić) |
| `A` zapis za `www` | `192.0.2.1`, **Proxied** |
| Redirect Rule, naziv | `hiddentextscanner -> owluv` |
| When incoming requests match | **All incoming requests** |
| Then, URL redirect, Type | **Dynamic** |
| Expression | `concat("https://owluv.com", http.request.uri.path)` |
| Status code | **301** |
| Preserve query string | **uključeno** |

Adresa `192.0.2.1` je namjerno lažna (rezervirani TEST-NET raspon): zapis
postoji samo da bi domena bila aktivna i prošla kroz proxy, a do te adrese
promet nikad ne stiže jer pravilo odgovori prije. Bez pravila bi Cloudflare
vraćao 522; to je bilo izmjereno prije nego je pravilo postavljeno.

**Testirano 13.09.2026.:**

| Zahtjev | Odgovor |
|---|---|
| `http://hiddentextscanner.com/` | 301 na `https://owluv.com/` |
| `https://hiddentextscanner.com/` | 301 na `https://owluv.com/` |
| `http://www.hiddentextscanner.com/` | 301 na `https://owluv.com/` |
| `https://www.hiddentextscanner.com/` | 301 na `https://owluv.com/` |
| `https://hiddentextscanner.com/en?x=1&y=2` | 301 na `https://owluv.com/en?x=1&y=2` |
| `http://www.hiddentextscanner.com/de` | 301 na `https://owluv.com/de` |
| Certifikat za `www.hiddentextscanner.com` | Let's Encrypt, preko Cloudflarea, valjan |

Neven je uz to provjerio apex i www u pregledniku, preko mobilnih podataka:
oboje radi.

**Napomena o prvom testu.** Prvi test `www` s Maca javio je
`ERR_NAME_NOT_RESOLVED`. To je bio zaostali lokalni DNS cache na tom računalu
iz vremena prije nego je `www` zapis postojao, ne greška u konfiguraciji;
preko mobilnih podataka je isti trenutak radilo. Ako se ponovi, na Macu:
`sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`.

**Status: ZAVRŠENO.**

### Analitika posjeta: Cloudflare proxy, bez skripte (13.09.2026.)

Tražilo se brojanje posjeta. Ponuđeni **Cloudflare Web Analytics JS snippet je
odbijen**, iz dva razloga: pravilo 1 u `CLAUDE.md` (nikakvo pozivanje vanjskih
poslužitelja, nikakva analitika, nula vanjskih zahtjeva) i obećanje u samom
sučelju, "Sve se obrađuje u tvom pregledniku, ništa se nikamo ne šalje".
Snippet bi učitavao skriptu s `static.cloudflareinsights.com` i pri svakom
otvaranju slao beacon; skenirani sadržaj ne bi išao nikamo, ali rečenica bi
prestala biti doslovno istinita, a tri provjere higijene i mjerenje u
pregledniku bi pale.

**Umjesto toga**: na zapisima `owluv.com` uključen je Cloudflareov **proxy**
(narančasti oblačić) uz SSL/TLS mode **Full (strict)**. Cloudflare broji
zahtjeve i posjete na svom rubu, prije nego išta stigne do GitHuba. U kod nije
ušlo ništa, stranica i dalje ne šalje nijedan zahtjev izvan `owluv.com`.

**Gdje se brojke gledaju:** Cloudflare, domena `owluv.com`, **Analytics &
Logs, Traffic** (zahtjevi, posjete, po zemlji, po putanji). **Web Analytics
site u Cloudflareu je namjerno na Disable** i tako ostaje; JS snippet se ne
ugrađuje bez razgovora.

**Provjereno kroz proxy, 13.09.2026.:** odgovor nosi `server: cloudflare` i
`cf-ray`; HTTPS valjan (Let's Encrypt, provjera 0); bez petlje
preusmjeravanja (`http://www.owluv.com/en` do `https://owluv.com/en` u jednom
skoku); `www` i `github.io` adresa i dalje 301 na `owluv.com`; svih 6
jezičnih stranica, `sitemap.xml` i `robots.txt` 200; živi HTML identičan
repozitoriju, Cloudflare ništa ne ubacuje.

**Dvije stvari koje proxy donosi, a treba ih znati:**

1. **Keš na rubu.** Cloudflare kešira `js/`, `assets/` i slično 4 sata
   (`cache-control: max-age=14400`), HTML ne (`cf-cache-status: DYNAMIC`).
   Ako se nakon slanja na GitHub nova verzija skripte ne vidi, u Cloudflareu:
   `owluv.com`, Caching, Configuration, **Purge Everything**. Ostava servisnog
   radnika u pregledniku je zasebna stvar i rješava se podizanjem verzije u
   `sw.js`, kao i prije.
2. **Email Address Obfuscation.** Cloudflare po zadanom u svaku stranicu koja
   sadrži e-mail adresu ubaci svoju skriptu i prepiše `mailto`. Pro blok sadrži
   `info@sovavid.hr`, pa je u `index.html` omotan Cloudflareovim oznakama
   `<!--email_off-->` i `<!--/email_off-->`, koje to isključuju za taj dio.
   Provjera nakon svake objave: živi HTML ne smije sadržavati `cdn-cgi`.

### Pro blok u zaglavlju (13.09.2026.)

U tamnom zaglavlju, desno, ispod gumba za jezik, stoji mali okvir "Pro" s
lokotom, jednim retkom ("Skupna obrada cijele mape") i linkom "Javite se" koji
otvara `mailto:info@sovavid.hr` s predmetom "OwlUV Pro upit". Tekst je na svih
6 jezika (ključevi `proTitle`, `proLine`, `proLink` u `js/i18n.js`), stil je
iz palete gumba za jezik, lokot je inline SVG. Bez cijene, datuma i obećanja;
u repozitoriju stoji samo činjenica da za skupnu obradu postoji kontakt.

Provjereno: nema prelijevanja na 320, 375, 560 i 768 px; na uskom zaslonu blok
ide ispod gumba i širi se na punu širinu.

**Usput popravljen stariji bug mobilnog CSS-a.** Pravila za veće gumbe za
jezik na telefonu (`.lang{padding:9px 13px;font-size:12px}` u `@media
(max-width:560px)`) stajala su ispred osnovnih pravila `.lang`, pa su ih
osnovna pregazila i nikad se nisu primijenila. Osnovna pravila `.langs`,
`.lang`, `.head-right` i `.pro` sada stoje ispred mobilnog bloka. Izmjereno:
do 560 px gumbi su 34 px visoki s fontom 12 px (prije 27 px i 11 px), od 768 px
naviše nepromijenjeno. Higijena je zbog toga dopustila
adresu `info@sovavid.hr` i prestala zabranjivati frazu "skupna obrada";
zabrane riječi o cijeni, plaćanju i poslovnom planu ostaju.

---

## Kako je domena proradila, 12.09.2026.

Zapisano da se zna što je učinjeno i kojim redom, ako ikad zatreba ponoviti
za drugu domenu.

1. Neven je na Regici zamijenio Iskonove poslužitelje imena Cloudflareovima i
   u Cloudflareu upisao četiri `A` zapisa i `CNAME` za `www`, sve bez proxyja.
   Nakon toga se `owluv.com` razrješavao, a GitHub je vraćao svoju 404 stranicu,
   jer domena još nije bila vezana uz repozitorij.
2. Vraćen je `CNAME` u repozitorij (commit `c1813e7`). Prije slanja je prošla
   higijena, `node test/pokreni-test.js --higijena`, 31 provjera.
3. Postavljena je vlastita domena:
   `gh api -X PUT repos/neconeven-max/owluv/pages -f cname=owluv.com`.
   GitHub je odmah krenuo s certifikatom (`authorization_created`), za manje od
   minute je bio `approved`, a gradnja stranice gotova za desetak minuta.
4. Uključen je Enforce HTTPS:
   `gh api -X PUT repos/neconeven-max/owluv/pages -F https_enforced=true`.
   Preusmjeravanje s `http://owluv.com` na `https` proradilo je nekoliko minuta
   nakon toga; odmah nakon uključivanja `http` je još vraćao 200.
5. Provjereno kako piše gore.

**Što treba znati za ubuduće.** GitHubov API za certifikat ne prolazi kroz
stanje `issued`; `approved` uz `expires_at` je konačno stanje i HTTPS već radi.
Petlja koja čeka na `issued` čeka zauvijek.

---

## Zašto DNS prije nije radio, sad riješeno

Domene `owluv.com` i `hiddentextscanner.com` registrirane su 19.08.2026. preko
registrara **Regica** i u registru su bile delegirane na `dns.iskon.hr` i
`dns2.iskon.hr`. Ti poslužitelji zonu nisu posluživali (`REFUSED`), pa je svaki
upit završavao sa `SERVFAIL`. Regica nudi samo polja za upis poslužitelja imena,
bez uređivanja zapisa, pa se `A` zapisi ondje nisu mogli upisati.

**Rješenje je bio Cloudflare kao DNS**, besplatan plan. Registrar se nije
mijenjao, samo poslužitelji imena. Za `owluv.com` napravljeno 12.09.2026., za
`hiddentextscanner.com` 13.09.2026.; obje rade.

---

## SEO, stanje na 12.09.2026. (v6.4)

Cilj: tko upiše "owluv" dobije `owluv.com` s opisom koji odmah kaže što alat
radi, a tko traži "skener skrivenog teksta", "hidden text scanner", "AI prompt
injection cv" i slično nađe ga na jeziku koji alat ima. Što je napravljeno,
detaljno je u README-u (povijest izmjena, v6.4) i u `CLAUDE.md` (odjeljak
"Jezične stranice piše generator, nikad ruka"). Ukratko:

| Što | Gdje |
|---|---|
| Stranica po jeziku, s tekstom u samom HTML-u | `owluv.com/` (HR), `/en`, `/de`, `/fr`, `/es`, `/it` |
| Naslov EN | `OwlUV - Hidden text and AI trap scanner` |
| Opis, jedna rečenica po jeziku | ključ `seoDesc` u `js/i18n.js` |
| canonical, hreflang (6 + x-default na EN), Open Graph, Twitter card, JSON-LD | SEO blok u svakoj stranici, piše ga generator |
| Slika kod dijeljenja | `assets/sovaweb_favicon_512.png`, sova |
| `sitemap.xml`, `robots.txt` | korijen; robots ne pušta tražilicu u `/test/` |
| GitHub: Website `https://owluv.com`, opis usklađen s naslovom, teme | postavljeno preko `gh repo edit` |

**Nula vanjskih zahtjeva ostaje nula.** Adrese u canonicalu, hreflangu i
JSON-LD-u su tekst koji tražilica čita, ne zahtjevi. Test to provjerava na tri
razine, a na živoj stranici je izmjereno rukom:

| Provjera, `https://owluv.com/en`, 12.09.2026. | Rezultat |
|---|---|
| `/`, `/en`, `/de`, `/fr`, `/es`, `/it`, `/sitemap.xml`, `/robots.txt` | svi 200, svaka stranica sa svojim `lang` i naslovom |
| Naslov kartice, `lang`, opis, aktivan gumb | engleski, od prvog trenutka |
| canonical, 7 hreflang, Open Graph, Twitter card | prisutni u HTML-u, na engleskom |
| JSON-LD | parsabilan: WebApplication, OwlUV, SOVA VID j.d.o.o., besplatno |
| "Try an example" | crvena presuda, 4 nalaza |
| Servisni radnik | ostava `owluv-v6.4`, novi `app.js` u njoj |
| **Zahtjevi izvan `owluv.com`** | **nijedan** (15 zahtjeva) |

Napomena za onoga tko provjerava ponovno: preglednik koji je stranicu već imao
s v6.3 pri **prvom** učitavanju još izvrši stari `app.js` iz stare ostave
(naslov i opis u starom obliku), a od drugog učitavanja radi novi. To je
ponašanje servisnog radnika opisano u `CLAUDE.md`, nije kvar.

**Kako se ovo održava.** `index.html` je jedini izvor. Nakon svake promjene
`index.html` ili `js/i18n.js` pokrenuti `node test/napravi-jezicne-stranice.js`;
higijena pada ako se `en.html` i ostale ne slažu s generatorom.

### Search Console javio "Blokirano datotekom robots.txt", 12.09.2026.

Nakon dodavanja `owluv.com` u Search Console, Google je za `https://owluv.com/`
javio da nije indeksiran jer je "Blokirano datotekom robots.txt" i da Googlebot
ne može dohvatiti ni naslovnicu.

**Provjereno na živoj stranici, bajt po bajt:** `https://owluv.com/robots.txt`
je identičan onome u repozitoriju, vraća 200 i Googlebotu, nema `X-Robots-Tag`
zaglavlja, nijedna jezična stranica nema `noindex`. Googleovo tumačenje
(najdulje pravilo koje se podudara) dopušta naslovnicu i sve jezične stranice,
a zabranjuje samo `/test/`.

**Uzrok je na Googleovoj strani, ne u datoteci.** "Ne može dohvatiti ni
naslovnicu" je Googleova formulacija kad mu je `robots.txt` bio **nedostupan**
(DNS ili TLS greška, ne 404): tada cijelu stranicu privremeno tretira kao
zabranjenu i to pamti. `owluv.com` stoji u javnom README-u na GitHubu od
22.08., a do jutros se nije mogao razriješiti; `robots.txt` s 200 postoji tek
od 10:39 danas. Google `robots.txt` dohvaća iznova otprilike jednom dnevno, pa
se to samo od sebe ispravi kroz najviše dan; može se i požuriti (koraci niže).

**Što je svejedno popravljeno.** Iz `robots.txt` je maknut `Allow: /`. Za
Google je bio suvišan, ali parseri koji uzimaju prvo pravilo koje se podudara
(npr. Pythonov `robotparser`) bi zbog njega propustili i `/test/`. Sadašnji
oblik, `Disallow: /test/` i ništa više, znači "sve osim `/test/`" po svakom
tumačenju. Doslovno:

```
# OwlUV: trazilice smiju sve osim testnih datoteka.
# Nema "Allow: /": to je i tako zadano, a parseri koji uzimaju prvo
# podudaranje bi zbog njega propustili i /test/.
User-agent: *
Disallow: /test/

Sitemap: https://owluv.com/sitemap.xml
```

**Test koji to čuva.** Higijena sada `robots.txt` ne gleda po izgledu nego ga
**tumači**, i to na oba načina (Googleovo najdulje podudaranje i naivno prvo
podudaranje), za `*`, Googlebot i bingbot posebno: naslovnica, svih 6 jezičnih
stranica, sitemap i sve što alat učitava moraju biti dopušteni, `/test/`
zabranjen, sitemap punom adresom, i nigdje `noindex`, `nofollow` ni `<meta
name="robots">`. Provjereno da pada na `Disallow: /`, na zabrani `/en`, na
staroj dvosmislenoj verziji, na zabrani samo za Googlebot i na `noindex`.

**Što tražilice još ne znaju.** Google indeksira sam od sebe, ali sporo i bez
povratne informacije. Da se ubrza i da se vidi što Google stvarno vidi, treba
**Google Search Console**, a to traži prijavu Googleovim računom, dakle Nevenov
klik:

1. `https://search.google.com/search-console`, "Add property", vrsta
   **Domain**, upisati `owluv.com`.
2. Google ponudi TXT zapis za potvrdu vlasništva. Taj zapis se upiše u
   **Cloudflare** (DNS, Add record, Type TXT, Name `@`, Content ono što Google
   ispiše), pa natrag u Search Consoleu "Verify".
3. U Search Consoleu "Sitemaps", upisati `https://owluv.com/sitemap.xml`.
4. **Ako piše "Blokirano datotekom robots.txt":** Settings (Postavke) ->
   Crawling -> `robots.txt` -> Open report. Ondje se vidi koju je kopiju Google
   zadnji put dohvatio i kada. Tri točkice uz `https://owluv.com/robots.txt`
   -> **Request a recrawl**. Zatim URL inspection za `https://owluv.com/` ->
   **Test live URL**: mora pisati da je URL dostupan Googleu. Tek onda
   **Request indexing**.

Isto vrijedi i za Bing (Bing Webmaster Tools zna uvesti postavke iz Search
Consolea jednim klikom). Nakon toga u ovaj dokument zapisati da je napravljeno.

---

## Sljedeći koraci, redom

1. **Google Search Console** za `owluv.com`: potvrditi da je robots.txt
   ponovno dohvaćen i naslovnica indeksirana, koraci su gore.
2. Provjeriti popis "Moje domene" na Regici i zabilježiti postoji li i
   **`owluv.hr`**. Ako postoji, odlučiti preusmjerava li se i ona na `owluv.com`
   (isti recept kao za `hiddentextscanner.com`, gore).
3. **Tri otvorena buga iz testiranja v6.3**, popis niže. Objava je gotova, pa
   su oni sada glavni posao.

Preusmjeravanje `hiddentextscanner.com` je **završeno** 13.09.2026. i više nije
na popisu.

---

## Poznati bugovi iz testiranja v6.3: sva tri OTVORENA

Nađeni su na pravim poslovnim dokumentima. Domena je proradila, pa je ovo sada
sljedeći posao. Stanje na 13.09.2026.: **nijedan od tri nije riješen.**

| Bug | Stanje | Ukratko |
|---|---|---|
| 1. Proturječje oko stranice kojoj vidljivost nije izmjerena | **otvoren** | alat za istu stranicu kaže i "nije izmjereno" i "nije vidljivo" |
| 2. Krive etikete uz sumnjive fraze na bezopasnim dokumentima | **otvoren** | razlog uz frazu ne odgovara stvarnosti, samo na graničnim slučajevima |
| 3. Spojene riječi pri čitanju PDF-a | **otvoren** | razmaci crtani pomicanjem se gube, "Nazivracuna" |
| 4. Puni test u Chromeu bez sučelja ne stane u rok od 600 s | **otvoren** | prolaz završi bez retka UKUPNO, dok isti test prolazi; utvrditi je li test usporen ili rok premalen |

Nijedan od njih ne izmišlja nalaz i nijedan ne prešućuje pravu zamku. Sva tri su
kozmetičke greške u **prikazu i etiketiranju**, ne u detekciji. Detalji i gdje
tražiti uzrok su niže.

### Bug 1: proturječje oko stranice koja nije izmjerena

Na istom dokumentu alat kaže "vidljivost nije izmjerena na stranici X", a
istovremeno za elemente **s te iste stranice** prijavi "nije vidljivo na
nacrtanoj stranici". Ako mjerenje na toj stranici nije provedeno, ne može se ni
tvrditi da nešto na njoj nije vidljivo.

U v6.3 je riješen dio problema: nalaz sada imenuje stranice na kojima mjerenje
nije provedeno. Ostalo je da se **nalazi o skrivenom tekstu vežu uz broj
stranice**, pa da se s neizmjerenih stranica ne izriče tvrdnja o vidljivosti.
Vjerojatno traži da `rez.lines` nosi broj stranice kroz `js/pdfread.js` sve do
prikaza.

### Bug 2: krive etikete uz sumnjive fraze na bezopasnim dokumentima

Uz pronađenu frazu piše razlog koji ne odgovara stvarnosti:

- "zapovjedni ton oko ocjenjivanja ili odabira" na bezopasnoj rečenici o limitu
  na bankovnom računu
- "na drugom jeziku od ostatka dokumenta" na frazi koja je na **istom** jeziku
  kao ostatak dokumenta

Važno zapažanje koje sužava potragu: **kad je zamka stvarna, etikete su točne.**
Problem je dakle u zamjenskim etiketama za granične slučajeve, a ne u samom
prepoznavanju. Gledati kako se bira `n:` uz stavku nalaza u `js/app.js` i
`langScore()` u `js/signals.js`.

### Bug 3: spojene riječi pri čitanju PDF-a

Na PDF-ovima koji razmake crtaju geometrijom, dakle pomicanjem umjesto znakom za
razmak, riječi se pri čitanju spoje ("Nazivracuna"). Tekst je i dalje čitljiv i
detekcija radi, ali prikaz izgleda neuredno i može omesti prepoznavanje fraza.

Gledati kako `js/pdfread.js` slaže retke iz stavki čitača teksta: razmak treba
umetnuti kad je vodoravni razmak između dvije stavke veći od širine znaka.


### Bug 4: puni test u Chromeu bez sučelja ne završi unutar roka od 600 s

Nađen 13.09.2026. `test/pokreni-test.js` svaki prolaz u pregledniku bez
sučelja gasi tvrdim rokom od 600 s; Chrome bez sučelja u praksi i ne izlazi
sam nego tek na taj rok. Tog dana je nasumično jedan od dva prolaza (jednom iz
mape, drugi put s poslužitelja) ostajao bez vremena usred testa, pa je završio
bez retka UKUPNO i test je prijavio pad, dok je drugi prolaz iste vrtnje prošao
380/380. Isti test u pravom Chromeu traje ispod pet minuta i prolazi.

Treba utvrditi je li test usporen (što se od jučer promijenilo u onome što
Chrome bez sučelja radi) ili je rok od 600 s jednostavno premalen za ovaj
stroj, pa ga podići. Rok je `600000` na dva mjesta u `uPregledniku()`.
Kod alata ovime nije doveden u pitanje: higijena 47/47, prolaz s poslužitelja
380/380.
---

## Nastavak rada

**Sljedeći Claude Code mora prije bilo kakvog rada pročitati, ovim redom:**

1. **`docs/objava-status.md`** - ovaj dokument. Stvarno stanje objave.
2. **`CLAUDE.md`** - pravila projekta i odluke koje se ne vraćaju bez razgovora.
3. **`README.hr.md`**, odjeljak *Postavljanje stranice* - postupak za GitHub
   Pages, DNS zapise i preusmjeravanje druge domene, s točnim vrijednostima.

Ništa se ne pretpostavlja iz sjećanja. **Repozitorij je jedino mjesto istine.**

Prije bilo kakvog slanja vrijedi pokrenuti brzu provjeru higijene:

```
node test/pokreni-test.js --higijena
```

**Prva rečenica koju Neven treba reći novom Claude Codeu:**

> Pročitaj `docs/objava-status.md` u repozitoriju owluv, pa mi reci gdje smo
> stali i koji je sljedeći korak.

Na kraju svake sesije koja išta pomakne u objavi **ovaj se dokument ažurira** i
šalje na GitHub. To je pravilo zapisano i u `CLAUDE.md`.
