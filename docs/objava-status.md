# Status objave OwlUV

**Ovo je jedino mjesto istine o objavi.** Piše dokle je stiglo, što je već
napravljeno, gdje smo stali i što je sljedeće. Napisano je tako da ga može
pročitati netko tko o projektu ne zna ništa i nastaviti bez ijednog pitanja.

Zadnja izmjena: **26.08.2026.**

Upute korak po korak za GitHub i DNS stoje u [README.md](../README.md), odjeljak
*Setting up the website*, odnosno u [README.hr.md](../README.hr.md), odjeljak
*Postavljanje stranice*. Ovaj dokument bilježi **stvarno stanje**, a README
opisuje **postupak**.

---

## Stranica je ŽIVA na privremenoj adresi

> ### https://neconeven-max.github.io/owluv/

To je GitHubova zadana adresa za ovaj repozitorij. Radi odmah, preko HTTPS-a, i
na njoj se alat može koristiti i testirati dok se ne riješi domena. Kad
`owluv.com` proradi, ova adresa će preusmjeravati na njega.

---

## Kratko stanje

| Korak | Stanje |
|---|---|
| Kod v6.3 na GitHubu, grana `main` | **gotovo** |
| Repozitorij javan | **gotovo** |
| GitHub Pages uključen, grana `main`, mapa `/` | **gotovo** |
| Stranica živi na github.io adresi | **gotovo**, provjereno |
| Datoteka `CNAME` | **privremeno izvađena**, vidi niže |
| DNS za `owluv.com` | **blokirano**, ovdje smo stali |
| `owluv.com` kao vlastita domena na GitHubu | čeka DNS |
| HTTPS na `owluv.com` | čeka vlastitu domenu |
| Preusmjeravanje `hiddentextscanner.com` | čeka DNS |

---

## Provjereno na živoj stranici, 23.08.2026.

Otvoreno u pravom pregledniku na adresi gore:

| Provjera | Rezultat |
|---|---|
| Verzija u podnožju | `v6.3` |
| HTTPS | radi, valjan certifikat |
| Zaraženi životopis (`test/pdf-zivotopis.pdf`) | **crvena** presuda, 6 nalaza |
| Račun s uplatnicom (`test/pdf-racun-uplatnica.pdf`) | **narančasta**, "ne izgleda kao zamka" |
| Čist PDF (`test/pdf-cist.pdf`) | **zelena** presuda |
| Servisni radnik (rad bez interneta) | prijavljen, ostava radi |
| **Zahtjevi izvan `github.io`** | **nijedan** |

Zadnji redak je najvažniji: alat na živoj stranici ne dohvaća ništa izvana, kako
i obećava.

---

## Što je konfigurirano na GitHubu

Repozitorij `github.com/neconeven-max/owluv`:

- vidljivost: **javan**
- zadana grana: `main`
- GitHub Pages: **uključen**, izvor je grana `main`, mapa `/` (root),
  `build_type: legacy`
- vlastita domena: **nije postavljena** (namjerno, dok DNS ne proradi)
- `.nojekyll`, `index.html`, `manifest.webmanifest`, `sw.js`: svi na `main`

Alat `gh` (GitHub CLI) instaliran je preko Homebrewa na radnom računalu,
verzija 2.98.0, prijavljen na račun `neconeven-max`, opseg `repo`. Zbog toga se
Pages može podešavati s naredbenog retka:

```
gh api repos/neconeven-max/owluv/pages                 # stanje
gh api repos/neconeven-max/owluv/pages/builds/latest   # zadnja gradnja
```

---

## VAŽNO: datoteka CNAME je privremeno izvađena

**Kad DNS proradi, `CNAME` se mora vratiti.** Bez nje stranica nikad neće raditi
na `owluv.com`.

**Zašto je izvađena.** `CNAME` u repozitoriju je ono što GitHubu **postavlja**
vlastitu domenu; nije samo zapis nego prekidač. Čim je Pages uključen, GitHub ju
je pročitao i svaki zahtjev na `neconeven-max.github.io/owluv/` počeo
preusmjeravati na `http://owluv.com/`, koji se ne može razriješiti. Stranica time
nije bila dostupna **nigdje**. Zato je izvađena, da se alat može koristiti i
testirati dok se domena rješava.

**Kako se vraća**, kad Cloudflare preuzme DNS i zapisi prorade. U mapi
repozitorija:

```
echo "owluv.com" > CNAME
git add CNAME
git commit -m "DD.MM.GGGG. Vracen CNAME, domena owluv.com je spremna"
git push
```

Zatim pričekati da provjera domene na GitHubu pozeleni, pa uključiti
**Enforce HTTPS**. Preko sučelja: *Settings -> Pages -> Custom domain*. Preko
naredbenog retka:

```
gh api -X PUT repos/neconeven-max/owluv/pages -f cname=owluv.com
gh api -X PUT repos/neconeven-max/owluv/pages -F https_enforced=true
```

Automatski test pada ako se `CNAME` izvadi, a razlog ne bude zapisan u ovom
dokumentu. Tako se ne može zaboraviti vratiti.

---

## Zašto DNS ne radi

Obje domene **jesu uredno registrirane**, 19.08.2026., preko registrara
**Regica**. U registru su delegirane na Iskonove poslužitelje imena:

| Domena | Poslužitelji imena u registru |
|---|---|
| `owluv.com` | `dns.iskon.hr`, `dns2.iskon.hr` |
| `hiddentextscanner.com` | `dns.iskon.hr`, `dns2.iskon.hr` |

**Ali te domene se ne mogu razriješiti.** Upit prema oba poslužitelja vraća
`REFUSED`:

```
dig @dns.iskon.hr  owluv.com SOA     ->  status: REFUSED
dig @dns2.iskon.hr owluv.com SOA     ->  status: REFUSED
```

`REFUSED` znači da su ti poslužitelji upisani kao nadležni za domenu, **ali zonu
ne poslužuju** - kod njih ta zona nikad nije stvorena. Zbog toga svaki upit
prema `owluv.com` završi sa `SERVFAIL`, i to za cijeli internet, ne samo za
jedno računalo.

**Regica nudi samo polja za upis poslužitelja imena, bez uređivanja zapisa.**
Ondje se dakle ne mogu upisati `A` zapisi koje GitHub Pages traži. Zbog toga
domene trebaju davatelja koji stvarno poslužuje zonu.

---

## Odluka: Cloudflare kao DNS

**Cloudflare, besplatan plan**, preuzima DNS za domene. Preko njega ide i
preusmjeravanje `hiddentextscanner.com` na `owluv.com`.

Zašto baš to:

- Regica ne nudi uređivanje zapisa, a Iskon zonu nije stvorio; treba netko tko
  zonu stvarno poslužuje. Cloudflare to radi besplatno.
- Preusmjeravanje druge domene se kod Cloudflarea rješava pravilom, bez posebne
  usluge kod registrara.
- Ništa se ne mijenja na strani GitHuba: Pages i dalje očekuje ista četiri `A`
  zapisa i `CNAME` za `www`, kako piše u README-u.

**Ovo ne mijenja registrara.** Domene ostaju kupljene na Regici; mijenjaju se
samo poslužitelji imena koje Regica prijavljuje registru.

---

## Sljedeći koraci, redom

1. **Provjeriti popis "Moje domene" na Regici.** Zabilježiti **točno** koje
   domene ondje stoje. Moguće je da uz `owluv.com` i `hiddentextscanner.com`
   postoji i **`owluv.hr`**. Ako postoji, odlučiti ide li i ona na Cloudflare i
   preusmjerava li se na `owluv.com`.
2. **Otvoriti besplatan račun na Cloudflareu**, ako već ne postoji.
3. **Dodati domene** u Cloudflare, jednu po jednu. Cloudflare pri dodavanju sam
   ponudi svoj par poslužitelja imena, oblika `nesto.ns.cloudflare.com`.
   **Zabilježiti ih točno onako kako ih Cloudflare ispiše**, jer je svaki račun
   dobiva svoj par.
4. **Upisati Cloudflareove poslužitelje na Regici.** Ovo je korak na kojem se
   najlakše pogriješi:

   > Poslužitelji se upisuju na stranici **KONKRETNE domene**, a **ne** na
   > stranici sa zadanim postavkama za buduće domene. Zadane postavke vrijede
   > samo za domene koje će se tek kupiti i **ne mijenjaju ništa** za domene
   > koje već postoje.

   Iskonove poslužitelje pritom **zamijeniti**, ne dodati uz njih.
5. **Pričekati proširenje.** Cloudflare javi kad preuzme domenu; obično kroz
   nekoliko sati, ponekad dulje. Provjera s bilo kojeg računala:

   ```
   dig +short owluv.com NS
   ```

   Kad ispiše Cloudflareove poslužitelje umjesto Iskonovih, može se dalje.
6. **Upisati zapise u Cloudflareu** za `owluv.com`: četiri `A` zapisa na
   GitHubove adrese i `CNAME` za `www`. Točne vrijednosti su u README-u,
   odjeljak *Postavljanje stranice*. Ako Cloudflare nudi narančasti oblačić za
   posredovanje prometa (proxy), za GitHub Pages ga **isključiti** (siva
   strelica, "DNS only"), inače provjera domene na GitHubu zna zapeti.
7. **Vratiti `CNAME`** u repozitorij; postupak je gore.
8. **Uključiti vlastitu domenu i HTTPS** na GitHubu; postupak je gore.
9. **Postaviti preusmjeravanje** `hiddentextscanner.com` na `https://owluv.com`
   u Cloudflareu, trajno (301).
10. **Provjeriti sve:** stranica radi na `https://owluv.com`, certifikat vrijedi,
    `www.owluv.com` vodi na isto, a `hiddentextscanner.com` preusmjerava na nju.
    Nakon toga **ažurirati ovaj dokument**.

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
