# Status objave OwlUV v6.3

Ovaj dokument opisuje **dokle je objava stigla**, što je već konfigurirano i što
još nedostaje, da bilo koji stroj može nastaviti gdje smo stali. Upute korak po
korak (postavke na GitHubu, DNS zapisi, preusmjeravanje druge domene) stoje u
[README.md](../README.md), odjeljak *Setting up the website*, odnosno u
[README.hr.md](../README.hr.md), odjeljak *Postavljanje stranice*.

Zadnja provjera: **23.08.2026.**

---

## Kratko stanje

| Korak | Stanje |
|---|---|
| Kod v6.3 na GitHubu, grana `main` | **gotovo** |
| Repozitorij javan | **gotovo** |
| Datoteke za posluživanje (`CNAME`, `.nojekyll`) | **gotovo** |
| GitHub Pages uključen | **gotovo**, grana `main`, mapa `/` |
| Stranica živi na github.io adresi | **gotovo**, za testiranje |
| Datoteka `CNAME` | **privremeno izvađena**, vidi na dnu |
| DNS za `owluv.com` | **blokirano** - vidi niže |
| `owluv.com` kao vlastita domena na GitHubu | čeka DNS |
| HTTPS na `owluv.com` | čeka vlastitu domenu |
| Preusmjeravanje `hiddentextscanner.com` | blokirano istim uzrokom |

---

## Što je provjereno i potvrđeno

Repozitorij `github.com/neconeven-max/owluv`:

- vidljivost: **javan** (potvrđeno preko javnog API-ja, `private: false`)
- zadana grana: `main`, lokalno stanje i `origin/main` su u koraku
- `CNAME` je u repozitoriju i sadrži točno `owluv.com`
- `.nojekyll`, `index.html`, `manifest.webmanifest` i `sw.js` su na `main`
- GitHub Pages: **još nije uključen** (`has_pages: false`)

Alat `gh` (GitHub CLI) instaliran je na MacBook Air preko Homebrewa,
verzija 2.98.0. **Još nije prijavljen na GitHub račun.**

---

## Blokada: domene nemaju DNS

Obje domene **jesu uredno registrirane**:

| Domena | Registrirana | Registrar | Poslužitelji imena |
|---|---|---|---|
| `owluv.com` | 19.08.2026. | COREhub, S.R.L. | `dns.iskon.hr`, `dns2.iskon.hr` |
| `hiddentextscanner.com` | 19.08.2026. | COREhub, S.R.L. | `dns.iskon.hr`, `dns2.iskon.hr` |

**Ali te domene se trenutno ne mogu razriješiti.** Upit prema oba poslužitelja
imena koja su upisana u registru vraća `REFUSED`:

```
dig @dns.iskon.hr owluv.com SOA     ->  status: REFUSED
dig @dns2.iskon.hr owluv.com SOA    ->  status: REFUSED
```

`REFUSED` znači da su ti poslužitelji **upisani kao nadležni za domenu, ali
zonu ne poslužuju** - kod njih ta zona nije stvorena. Zbog toga svaki upit
prema `owluv.com` završi s `SERVFAIL`, i to vrijedi za cijeli internet, ne samo
za ovo računalo.

**Dok se to ne riješi, DNS zapisi se nemaju gdje upisati** i nema smisla
postavljati vlastitu domenu na GitHubu, jer provjera domene ne može proći.

Dva su moguća puta, i biraju se kod davatelja usluge, ne ovdje:

1. **Zona se stvori kod Iskona** (ako su domene kupljene preko Iskona, tamo je i
   upravljanje DNS-om). Nakon toga se upisuju zapisi iz README-a.
2. **Poslužitelji imena se promijene** na davatelja koji zonu stvarno poslužuje.
   Tada se zapisi upisuju kod tog davatelja.

---

## Redoslijed koji preostaje

1. **Prijava na GitHub:** `gh auth login` (traži da čovjek klikne u pregledniku).
2. **Uključivanje GitHub Pagesa** s grane `main`, mapa `/` (root).
   Preko CLI-ja: `gh api -X POST repos/neconeven-max/owluv/pages -f source[branch]=main -f source[path]=/`
3. **Riješiti DNS** za `owluv.com` (vidi blokadu gore).
4. **Upisati DNS zapise** iz README-a: četiri `A` zapisa na GitHubove adrese i
   `CNAME` za `www`.
5. **Vlastita domena na GitHubu:** `owluv.com`, pa pričekati da provjera
   pozeleni, pa uključiti **Enforce HTTPS**.
6. **Preusmjeravanje** `hiddentextscanner.com` na `https://owluv.com`, trajno
   (301), kod registrara.
7. **Provjera:** stranica radi na `https://owluv.com`, HTTPS vrijedi, a
   `hiddentextscanner.com` preusmjerava na nju.

---

## VAŽNO: datoteka CNAME je privremeno izvađena

**Kad DNS proradi, `CNAME` se mora vratiti.** Bez nje stranica nikad neće raditi
na `owluv.com`.

Zašto je izvađena: `CNAME` u repozitoriju je ono što GitHubu **postavlja**
vlastitu domenu. Čim je Pages uključen, GitHub je pročitao i svaki zahtjev na
`neconeven-max.github.io/owluv/` počeo preusmjeravati na `http://owluv.com/`,
koji se ne može razriješiti. Stranica time nije bila dostupna nigdje.

Kako se vraća, kad DNS zapisi prorade:

```
cd ~/owluv
echo "owluv.com" > CNAME
git add CNAME
git commit -m "DD.MM.GGGG. Vracen CNAME, domena owluv.com je spremna"
git push
```

Zatim na GitHubu, pod *Settings -> Pages -> Custom domain*, pričekati da provjera
pozeleni, pa uključiti **Enforce HTTPS**. Isto se može i s CLI-ja:

```
gh api -X PUT repos/neconeven-max/owluv/pages -f cname=owluv.com
gh api -X PUT repos/neconeven-max/owluv/pages -F https_enforced=true
```
