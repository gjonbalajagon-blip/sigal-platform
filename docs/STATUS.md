# Status - SIGAL Health Platform

> **Gjendja AKTUALE** e platformës. Ky file ndryshon shpesh.
> ⚠️ **UPDATE INKREMENTAL** - pas çdo task-u, jo në fund të sesionit.

**Përditësuar i fundit:** 2026-05-04 (krijim fillestar nga 13 fazat)

---

## 📊 Status i Përgjithshëm

**Faza aktuale:** Pas Faza 13 → drejt Faza 14 (theme-v2 bug fixes)

**Cka punon mirë:**
- Login + Auth system
- Kontratat (REFERENCE module)
- Stafi (komplet)
- Word generation (me limite custom)
- Email (Brevo)

**Cka kërkon vëmendje urgjente:**
- Faturimi + Rinovimet u kthyen në theme të vjetër
- Drawers nuk janë të unifikuar
- Sidebar disa link të prishur

---

## 📦 Status i Moduleve

| Moduli | Status | Detaje |
|---|---|---|
| **Login** | ✅ Funksional | superadmin: `agon` / `sigal2026` |
| **Dashboard** | ⚠️ Migruar, KPI icons jo unik | Ka 2 donut + 12-month line chart |
| **Oferta** | ⚠️ Migruar, polish nevojshëm | KPI nuk filtron, drawer jo unik, llojet chips position e gabuar |
| **Oferta-View** | 🔄 Në redesign | 3-col compact layout në design phase |
| **Kontratat** | ✅ **REFERENCE** | Modeli për të gjitha modulet |
| **Faturimi** | ❌ Theme i vjetër | U kthye në `#002B5C` strip + ngjyra në numra |
| **Rinovimet** | ❌ Theme i vjetër | + dropdown importo bosh |
| **Debitoret** | ⚠️ Stats të prishura | Kolona të mungueshme, status filters punë |
| **Raportet** | ⚠️ CSS migruar | Pret Chart.js për grafikët |
| **Stafi** | ✅ Komplet | KPI + drawer + organogram |
| **Detyrat** | ❌ Nuk ka filluar | - |
| **Produkti** | ❌ Nuk ka filluar | Pret Excel data |
| **Dokumentet** | ❌ Pret cloud storage | Placeholder |

---

## 🐛 Bug-et / Të Papërfundu (kërkojnë rregullim)

### 🔴 Kritike (blokojnë përdorim)

- **Sidebar:** Disa `<a>` kanë `href="#"` (jo funksionale). Shembull: tek `kontratat.html`, klikimi te `raportet` nuk punon.
- **Faturimi:** I gjithë moduli u kthye në theme-v1 (`#002B5C` navy strip, ngjyra të kuqe/jeshile në numra). Duhet ri-migrim te theme-v2.
- **Rinovimet:** I njëjti problem si Faturimi. Plus dropdown "Importo Excel" për muajin shfaqet bosh.

### 🟠 Të rëndësishme

- **Drawers nuk janë të unifikuar:**
  - `+ Ofertë e re` - drawer i vjetër
  - `+ Kontratë e re` - drawer i vjetër
  - Të tjerat - inkonsistent
  - Spec-i (DEC-020): mbyllen me click jashtë + ESC, kanë struktura të njëjtë

- **Drawers nuk mbyllen me click jashtë** - mungojnë `onclick="if(event.target===this)"`
- **Drawers nuk mbyllen me ESC** - duhet handler global në `main.js`

- **Anulo / Ruaj butona:** disa drawer kanë plain text, disa ngjyra/madhësi tjera. Duhet standardizuar me `!important` (shih DESIGN-SYSTEM.md).

- **Oferta KPI nuk filtron:** Klikimi shfaqet active state, por `renderTabela()` nuk respekton `window.__activeKpiFilter`.

- **Oferta llojet chips position:** janë në djathtas (gabim), duhet në majtas të filter-row. Plus `<select id="filter-lloji">` ekziston ende - duhet hequr.

- **KPI icons jo unik:** Disa kanë gloss/shadow (oferta, raportet old), tjera flat (dashboard). Duhet të gjithë flat (DEC-016).

### 🟡 Specifike për modul

#### Debitoret (Faza 13 spec):
- **Stats top:** Duhen 4 stats (Borxhi total, Mbi 365, Paguar, Mbetur). Mos shto 91-180 në stats (duhet kolonë).
- **Statuset row:** Duhet të jetë në një rresht, clickable, me count + euro value:
  - Kontaktuar (0 · 0€)
  - Premtim (1 · 340€)
  - Pjesshëm, Kontestuar, Pamundshëm
- **Kolona shtesë:** 91-180, E pamaturuar
- **Aging columns clickable:** Filter "max delinquency" - klienti shfaqet vetëm në bucket-in e tij më të keq
- **Agent chips:** Kur dega zgjidhet → shfaq agent chips poshtë me `.dega-chip` (jo border-heavy old design)

#### Word Kontrata:
- **Nënshkrimi mund të ndahet mes 2 faqeve** kur pakot janë të shumta
- **Faqe boshe para Aneks 2** - vjen nga template origjinal (jo nga kodi)
- **Aneks 2 embedded Word doc** - hiqet (DEC-009), por përdoruesi mund ta dojë prapa

#### Raportet:
- **Chart.js mungon** - aktualisht përdor div bars primitive
- **Kontratat: routing + renderKonDeget**: Subtab "Sipas degeve" është në SUBTABS por mungon routing dhe funksioni `renderKonDeget()`
- **Strip width inkonsistent:** Oferta/Kontratat/Faturimi më të gjerë se Rinovimet

---

## ⏳ Të shtyra qëllimisht (deferred)

> Këto NUK janë bug-e. Janë vendime të marrë me arsye.

- **Supabase integration**
  - **Arsyeja:** localStorage mjafton për MVP. Migrim do bëhet kur vëllimi i klientëve të justifikojë.
  - **Trigger për ndërmarrje:** >50 klientë realë ose >5 përdorues
  - → shih `DECISIONS.md` DEC-001

- **Custom domain për Brevo email**
  - **Arsyeja:** Aktualisht emails dërgohen nga `onboarding@brevo.com`. Për brand consistency duhet domain SIGAL.
  - **Trigger:** Kur kompania t'i ofrojë domain
  - → shih `DECISIONS.md` DEC-005

- **Chart.js për Raportet**
  - **Arsyeja:** Modulet kryesore ende kanë bug-e (Faturimi, Rinovimet). Charts vijnë pasi platforma të jetë stabile.
  - **Trigger:** Pas Faza 14
  - → shih `DECISIONS.md` DEC-PROPOSED-003

- **Modul Dokumentet**
  - **Arsyeja:** Kërkon cloud storage (Supabase Storage ose Cloudinary). Nuk mund të bëhet me localStorage.
  - **Trigger:** Pas migrimit te Supabase

- **Rinovim Wizard Modal**
  - **Arsyeja:** Wizard kompleks në rinovimet u zëvendësua me redirect te kontratat (më i thjeshtë).
  - **Trigger:** Vetëm nëse përdorimi tregon nevojë reale për wizard

- **Email automatic status change**
  - **Arsyeja:** Kur dërgohet kontrata via email, statusi duhet auto-bëhet "kontaktuar". Kërkon backend aktiv.
  - **Trigger:** Kur Railway të ri-aktivizohet

- **Trend comparison (month-over-month)**
  - **Arsyeja:** I rëndësishëm për director, por jo prioritet aktual.
  - **Trigger:** Pas Faza 14

- **Primi per person (rinovimet)**
  - **Arsyeja:** Kompania ka 2 çmime fikse (nën 18 / mbi 18). Sistemi vetëm propozon % rritje, drejtori llogarit per person jashtë.
  - **Trigger:** Kur të lidhet me sistemin tjetër

- **Aneks 2 embedded Word doc**
  - **Arsyeja:** OLE objects prishin Word document (DEC-009). Hequr qëllimisht.
  - **Trigger:** Nëse përdoruesi insiston, do duhet zgjidhje tjetër (preview image)

---

## ❓ Të paqarta / Dyshime (mbetet me kontrollu)

> Pikat ku **nuk jam i sigurt** - mund të jenë bug, mund të jenë qëllimshme.

- **Rinovimet primi discrepancy:**
  - "Viva thot qe ka prim vetem 4000 e diqka" - diferencë e madhe nga e pritshme
  - **Mundësi:** Lexim i fushave të gabuara (`primi_vjetor` vs `total_primi` inconsistent)
  - **Action:** Kontrollo cila fushë përmban premium-in vjetor të saktë

- **Kontratë drawer:**
  - A duhet ridizajn me drawer të ri "+ Kontratë e re" sipas spec-it të theme-v2?
  - Apo drawer aktual i kontratat.html është ai final?
  - **Action:** Konfirmo me përdoruesin

- **Aneks 2 embedded Word:**
  - A është e domosdoshme realisht aty në kontratë?
  - Apo është artifakt nga template e vjetër që mund të hiqet?
  - **Action:** Pyet përdoruesin nëse mund të hiqet plotësisht

- **Railway hosting:**
  - Trial expired. A do të rinovohet, kalohet te tjetër (Render, Fly.io, etj.)?
  - **Action:** Vendim hosting

---

## 🔧 TODO - Ndryshime nga Claude Code (DUHET KONTROLLU LOKALISHT)

> **Këto janë ndryshime që janë bërë në Claude Code direkt, jo në planifikim këtu.**
> Përdoruesi nuk i mban mend saktë. Duhet **krahasim me kodin lokal**.

**Komandat për Claude Code për të identifikuar ndryshimet:**

```bash
# 1. Shih commit history
git log --oneline --all -50

# 2. Shih ndryshimet që nga commit i fundit i njohur
git log --since="2026-04-27" --pretty=format:"%h %s" --no-merges

# 3. Listim file më të ndryshuar
git log --pretty=format: --name-only | sort | uniq -c | sort -rn | head -20

# 4. Diff i një file specifik
git log -p --since="2026-04-27" -- js/kontratat.js
```

**Pyetje për Claude Code:**

```
Lexo `git log --oneline -50` dhe identifiko commits që NUK janë në docs/PROGRESS.md.
Për secilin commit:
1. Çka bëri? (lexo diff)
2. A është milestone (PROGRESS) apo bug fix i vogël (vetëm git)?
3. A ndryshoi arkitekturë (ARCHITECTURE update)?
4. A ndryshoi UI (DESIGN-SYSTEM update)?
5. A mori vendim (DECISIONS update)?

Krijo një listë të rekomandimeve për update i dokumentacionit.
```

**Pas analizës, kategorizo:**
- [ ] Milestones që duhen shtuar në PROGRESS.md
- [ ] Vendime që duhen shtuar në DECISIONS.md
- [ ] Bug fixes që janë të zgjidhura (hiqi nga STATUS.md)
- [ ] Bug fixes të rinj që janë krijuar (shto te STATUS.md)
- [ ] Ndryshime arkitekturore që duhen në ARCHITECTURE.md
- [ ] Ndryshime UI që duhen në DESIGN-SYSTEM.md

---

## 📅 Çka vjen pastaj (Next Steps - Faza 14)

### Prioritet 1 (URGJENTE):
1. ✅ Krijim i dokumentacionit (PO BËHET tash)
2. 🔧 Sidebar fix - `href` real për të gjitha link-et
3. 🔧 Faturimi ri-migrim te theme-v2
4. 🔧 Rinovimet ri-migrim te theme-v2 + dropdown importo populim me 12 muaj
5. 🔧 Drawers unification (oferta + kontratat especially)
6. 🔧 ESC key handler + click-jashtë mbyllje për drawers

### Prioritet 2 (E rëndësishme):
1. Debitoret restructure (4 stats + statuset row + 2 kolona të reja + aging filters)
2. Action buttons standardize (Photo 2 spec)
3. KPI icons unification (flat, no shadow)
4. Oferta-view 3-col compact layout implementation
5. Oferta KPI filter wire (`window.__activeKpiFilter`)
6. Oferta llojet chips → LEFT, hiq filter-lloji select

### Prioritet 3 (Medium):
1. Raportet - Chart.js implementation
2. Kontratat: renderKonDeget routing + funksion
3. Strip width unification (oferta/kontratat/faturimi)
4. Mobile responsive verification

### Prioritet 4 (E shtyrë):
1. Detyrat module
2. Produkti module
3. Dokumentet (pas Supabase)
4. Trend comparisons në raportet

---

## 🚦 Workflow Recommended për Faza 14

```
1. Hap Claude Code lokalisht
2. Pull latest: git pull
3. Lexo README.md + STATUS.md (ky file)
4. Run komandat e mësipërme për të identifikuar ndryshime të padokumentuara
5. Update STATUS.md me gjendjen reale
6. Filloji nga Prioritet 1
7. Pas çdo task-u:
   - git add . && git commit -m "..." && git push
   - Update STATUS.md (hiq nga TODO, shto te "Çka u krye")
8. Në fund të task-eve të mëdha:
   - Update PROGRESS.md me milestone
   - Update DECISIONS.md nëse ka vendime të reja
```

---

## 📝 Update Log (kjo file)

| Data | Ndryshim | Kush |
|---|---|---|
| 2026-05-04 | Krijim fillestar nga 13 fazat | Claude.ai sesion |

> Kur të bësh update, shto rresht këtu me datë dhe çka ndryshove.

---

*Update këtë file pas çdo task-u, jo në fund. Ruaj git commits paralel.*
