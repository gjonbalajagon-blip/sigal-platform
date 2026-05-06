# Status - SIGAL Health Platform

> **Gjendja AKTUALE** e platformës. Ky file ndryshon shpesh.
> ⚠️ **UPDATE INKREMENTAL** - pas çdo task-u, jo në fund të sesionit.

**Përditësuar i fundit:** 2026-05-06

---

## 📊 Status i Përgjithshëm

**Faza aktuale:** Faza 14 e përfunduar → drejt Faza 15

**Cka punon mirë:**
- Login + Auth system
- Kontratat (REFERENCE module)
- Stafi (komplet)
- Word generation (me limite custom)
- Email (Brevo)

**Cka kërkon vëmendje urgjente:**
Aktualisht nuk ka bug kritik. Modulet e mbetura: Detyrat, Produkti, Dokumentet (pres triggers).

---

## 📦 Status i Moduleve

| Moduli | Status | Detaje |
|---|---|---|
| **Login** | ✅ Funksional | superadmin: `agon` / `sigal2026` |
| **Dashboard** | ✅ | KPI flat icons, 2 donut + 12-month line chart |
| **Oferta** | ✅ | Drawer unified, KPI filter, llojet chips në LEFT |
| **Oferta-View** | ✅ 3-col layout implementuar | Faza 14 - glassmorphism, popup-based extras, kalkulator multi-row |
| **Kontratat** | ✅ **REFERENCE** | Modeli për të gjitha modulet |
| **Faturimi** | ✅ Komplet (ri-migruar) | theme-v2 i kthyer (commit b70f65a) |
| **Rinovimet** | ✅ Komplet (ri-migruar) | theme-v2 i kthyer (commit b70f65a) |
| **Debitoret** | ✅ Stats restructure aplikuar | 4 stats + statuset row + aging filters |
| **Raportet** | ⚠️ CSS migruar | Pret Chart.js për grafikët |
| **Stafi** | ✅ Komplet | KPI + drawer + organogram |
| **Detyrat** | ❌ Nuk ka filluar | - |
| **Produkti** | ❌ Nuk ka filluar | Pret Excel data |
| **Dokumentet** | ❌ Pret cloud storage | Placeholder |

---

## 🐛 Bug-et / Të Papërfundu (kërkojnë rregullim)

### 🔴 Kritike (blokojnë përdorim)

_Asnjë bug kritik aktualisht._

### 🟠 Të rëndësishme

### 🟡 Specifike për modul

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

## 📅 Çka vjen pastaj (Next Steps - Faza 15)

### Prioritet 1 (URGJENTE):
1. Modulet e mbetura: Detyrat, Produkti, Dokumentet
2. Verifikim funksionaliteti (testing pas çdo migrimi)

### Prioritet 2 (E rëndësishme):
1. Action buttons standardize (Photo 2 spec)

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

## 🚦 Workflow Recommended për Faza 15

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
| 2026-05-04 | Update pas verifikimit Claude Code: hequr bug fixes të zgjidhura | Claude Code |
| 2026-05-06 | Cleanup: hequr 7 .bak files + 5 CSS legacy + migrate script + untrack node_modules + .gitignore | Claude Code |

> Kur të bësh update, shto rresht këtu me datë dhe çka ndryshove.

---

*Update këtë file pas çdo task-u, jo në fund. Ruaj git commits paralel.*
