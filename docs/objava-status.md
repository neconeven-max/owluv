# Status objave OwlUV

**Ovo je jedino mjesto istine o objavi.** Piše dokle je stiglo, što je već
napravljeno, gdje smo stali i što je sljedeće. Napisano je tako da ga može
pročitati netko tko o projektu ne zna ništa i nastaviti bez ijednog pitanja.

Zadnja izmjena: **12.09.2026.**

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
| Preusmjeravanje `hiddentextscanner.com` | **nije napravljeno**, vidi sljedeće korake |

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
| Proxy (narančasti oblačić) | **isključen** na svim zapisima, "DNS only" |

Iskonovi poslužitelji imena su obrisani s Regice. Provjera s bilo kojeg
računala:

```
dig +short owluv.com NS      # dva Cloudflareova poslužitelja
dig +short owluv.com A       # četiri GitHubove adrese
dig +short www.owluv.com     # neconeven-max.github.io.
```

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
mijenjao, samo poslužitelji imena. To je za `owluv.com` napravljeno i radi.
Isti put vrijedi i za `hiddentextscanner.com`, koja još nije prebačena.

---

## Sljedeći koraci, redom

1. **`hiddentextscanner.com` na Cloudflare.** Dodati domenu u Cloudflare,
   zabilježiti par poslužitelja imena koji Cloudflare ponudi (za svaku domenu
   može biti drugi par), pa ih na Regici upisati **na stranici te konkretne
   domene**, umjesto Iskonovih. Provjera: `dig +short hiddentextscanner.com NS`.
2. **Preusmjeravanje** `hiddentextscanner.com` i `www.hiddentextscanner.com` na
   `https://owluv.com`, trajno (301), pravilom u Cloudflareu. Postupak s točnim
   vrijednostima je u README-u, odjeljak *Postavljanje stranice*, točka 3.
3. **Provjeriti** da `hiddentextscanner.com` preusmjerava, pa **ažurirati ovaj
   dokument**.
4. Provjeriti popis "Moje domene" na Regici i zabilježiti postoji li i
   **`owluv.hr`**. Ako postoji, odlučiti preusmjerava li se i ona na `owluv.com`.
5. Tek nakon toga: **poznati bugovi iz testiranja v6.3**, popis niže.

---

## Poznati bugovi iz testiranja v6.3

Nađeni su na pravim poslovnim dokumentima. **Ne rješavaju se prije nego domena
proradi** - ovo je popis za poslije, da se ne izgubi.

Nijedan od njih ne izmišlja nalaz i nijedan ne prešućuje pravu zamku. Sva tri su
greške u **prikazu i etiketiranju**, ne u detekciji.

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
