# Progress - SIGAL Health Platform

> Timeline i milestones, ndryshimeve të mëdha, dhe fundeve të fazave.
> ⚠️ **MOS shto bug fixes të vogla këtu** - vetëm milestones. Bug fixes janë në git history.

---

## 📋 Si të shtosh entry të re

Format:
```markdown
## YYYY-MM-DD - Titulli i milestone-it
- ✅ Çka u krye
- 🔧 Çka u rregullu (vetëm gjëra të mëdha)
- 📌 Vendim i marrë → shih DECISIONS.md #N (nëse ka)
- ⏳ Çka mbeti
```

**Trigger:** Shto entry vetëm kur:
- Mbarove modul të ri
- Bëre migrim/redesign të madh
- Ndryshove arkitekturë (DB, hosting, library kryesore)
- Mori vendim të rëndësishëm

**MOS shto për:** typo fixes, spacing, ngjyra, optimizime të vogla → vetëm git commits.

---

## 2026-04-27 - Faza 13: Theme-v2 Bug Reports & oferta-view redesign

- 🔧 Faturimi u kthye në theme të vjetër (#002B5C strip + ngjyra në numra) - duhet ri-migrim
- 🔧 Rinovimet u kthye në theme të vjetër + dropdown "Importo" bosh
- 🔧 Drawers nuk janë të unifikuar (oferta + kontratat ndryshojnë nga modeli)
- 🔧 Drawers nuk mbyllen me click jashtë + ESC
- 🔧 Sidebar - disa link kanë `href="#"` (jo funksionalë)
- 🔧 KPI icons inkonsistent (disa kanë gloss/shadow, duhen flat)
- 🔧 Debitoret stats restructure: 4 stats kryesorë + statuset row clickable + 2 kolona të reja (91-180, E pamaturuar) + aging filters
- 📐 Oferta-view redesign final: 3-column compact layout (laptop-friendly)
- ⏳ Mbeten: Faza 14 - bug fixes të theme-v2 + oferta-view implementation

## 2026-04-19 - Faza 12: Theme-v2 Migration (faza e parë)

- ✅ **Migrim i madh**: theme.css → theme-v2.css (glassmorphism + Montserrat + soft royal blue)
- ✅ Modulet e migruara: kontratat (REFERENCE), stafi, dashboard, oferta (me polish nevojshëm), raportet (CSS only)
- 📌 Vendim: Hybrid CSS approach (common në theme-v2, page-specific në `<style>` brenda HTML)
- 📌 Vendim: kontratat.html bëhet REFERENCE module - modeli për çdo modul tjetër
- 📌 Vendim: Action buttons spec final (Photo 2 si referencë):
  - Icon buttons: white bg + gray border 34×30px
  - Word: lavender filled `#e0e7ff/#4338ca`
  - Kontratë: blue filled `#dbeafe/#1e40af`, LEFT i të tjerëve
- ✅ Llojet chips replaced filter-lloji select
- ✅ KPI cards clickable me `data-filter`
- ⏳ Mbeten: faturimi, rinovimet, debitoret (CSS link u ndryshu, HTML/JS jo akoma)

## 2026-04-Mid - Faza 11: Raportet Module

- ✅ **Modul i ri**: Raportet (`pages/raportet.html` + `js/raportet.js` - 1989 lines)
- ✅ 5 raporte: Hub, Debitoret, Rinovimet, Kontratat, Faturimi, Oferta
- ✅ Çdo raport ka subtabs: Përmbledhje, Krahasim mujor, Sipas degëve, Sipas agjentëve, etj.
- ✅ Filter Viti + Muaji (Debitoret pa "Total viti" - është GJENDJE jo akumulim)
- ✅ Role-based filtering (staff sheh vetëm të vetën)
- ✅ Helper functions: `filterByAnyDate()`, `merrStafiList()`, `formatMoney()`, etj.
- 📌 Vendim: Use Chart.js për grafikët (planifikuar, ende përdor div bars primitive)
- 📌 Vendim: `kontrate` status = realizuar në oferta conversion calculations
- ⏳ Mbeten: Implementimi i Chart.js për grafikët realë

## 2026-04-Early - Faza 10: Debitoret Module

- ✅ **Modul i ri**: Debitorët (`pages/debitoret.html` + `js/debitoret.js`)
- ✅ Excel import me struktura mujore
- ✅ 7 statuse: i_ri, kontaktuar, premtim_pagese, paguar_total, paguar_pjesshem, kontestuar, i_pamundshem
- ✅ Aging columns (0-31, 31-60, 61-90, 91-180, 181-365, >365)
- ✅ Status modal me dynamic fields
- ✅ Hierarchical chips Dega → Agjent
- ✅ Report drawer
- 📊 Excel analizu: 831 rows, 794 unique clients, €679,923 total debt

## 2026-03-Late - Faza 9: Rinovimet Module

- ✅ **Modul i ri**: Rinovimet (`pages/rinovimet.html` + `js/rinovimet.js`)
- ✅ Excel import me tabs mujore (historik i ruajtur)
- ✅ 4 statuse: pa_filluar → kontaktuar → rinovuar / humbur
- ✅ Humbje modal me 7 arsye fikse
- ✅ LR (Loss Ratio) + CR (Combined Ratio) separat (CR përfshin pezull)
- ✅ Hierarchical chips Dega → Agjent
- ✅ Suggestion system në drawer (CR > 100% danger, < 30% success, etj.)
- ✅ Propozimi i primit (% rritje bazuar në CR)
- ✅ Report drawer (sipas degëve & agjentëve breakdown)
- ✅ Bell notifications në main.js (skadojnë <15 ditë → red, etj.)
- ✅ Auth fixes: `user_aktual` (jo `currentUser`), `role` (jo `roli`), `emri` (jo `emriPlote`)
- 📌 Vendim: Drawer Opsioni A approved (info + finance merged në gray block)
- ⏳ Mbeten: Rinovim wizard modal (button redirects te kontratat instead)

## 2026-03-Mid - Faza 8: Word Generation Fix Komplet

- ✅ **Rishkruar**: `js/gjenero-kontrate.js` (Word kontratë me limite custom)
- ✅ `formatData()` fix NaN.NaN.NaN
- ✅ `applyCustomValues()` zëvendëson limite custom në pako templates
- ✅ `mergeMediaAndRels()` kopjon vetëm images nga aneksi2 (jo OLE)
- ✅ Pakot insertohen te `{~pakot}` placeholder
- ✅ Aneksi2 bashkohet në fund (OLE objects të hequra)
- ✅ Faturimi ridizajn komplet (identik me kontratat layout)
- ✅ Email auto-status change (kur dërgohet → status "kërkesë")
- 📌 Vendim: OLE objects në Aneksi 2 hiqen - prishin Word, vetëm media kopjohet
- ⏳ Mbeten: Nënshkrimi mund të ndahet mes faqeve, faqe boshe para Aneksi 2

## 2026-03-Mid - Faza 7: Kontrata-Oferta Sync + Spreadsheet

- ✅ Locked state për spreadsheet (banner jeshil "Klienti konfirmoi")
- ✅ `spCustomValues` persistence (vlerat e ruajtura kalojnë midis fold/unfold)
- ✅ tjera_pikat → tjera_0..8 conversion (oferta-view → spreadsheet)
- ✅ Kontratat ridizajn (drawer + spreadsheet, locked kur nga oferta)
- ✅ Faturimi ridizajn (struktura identike me kontratat)
- ✅ Tab "Skaduar" me grupim foldable sipas vitit
- 📌 Vendim: Versionet e klientit (`konfirmim_klient`) të ndara nga ato të agjentit
- 📌 Vendim: Tracking system me 5 statuse (e_krijuar → e_derguar → e_pare → e_konfirmuar → kontrate)
- ⏳ Mbeten: Faza 8 (Word generation fix komplet)

## 2026-03-Mid - Faza 6: Spreadsheet Editor Redesign

- ✅ **Ridizajn i madh**: Drawer pakot → Popup spreadsheet horizontale
- ✅ Inline cell editing me Tab navigation
- ✅ Foldable "Trajtime tjera (9 fusha)"
- ✅ Versioning automatik kur klienti konfirmon
- ✅ Historiku i ndryshimeve (foldable, me detaje)
- ✅ oferta-view klient: hequr checkbox, kartë komplet clickable, "Shih detajet ▾"
- 📌 Vendim: Spreadsheet horizontale (jo drawer vertikal) - më kompakt për 6 pakot
- ⏳ Mbeten: Locked state, banner konfirmimi, historik me limite të plota

## 2026-03-Mid - Faza 5: Oferta-View Redesign + Tracking

- ✅ Oferta-view layout final: tab switcher (Option D) + tabs me 6 pako
- ✅ Coverage sections: Hospitalore/Ambulantore/Trajtime tjera (3 navy headers clickable)
- ✅ Floating pill me selection counter
- ✅ Tracking system (in-memory ofertaTracking në server.js)
- ✅ "Kërko Ndryshim" button removed (vetëm "Konfirmoj Zgjedhjen")
- 📌 Vendim: Static price table për Jetë Plus Cash (interactive calculator hequr)
- 📌 Vendim: Sigal Network popup me 31 institucione mjekësore
- ⏳ Mbeten: 8 refinements visual (shërbimet identike si Word, etj.)

## 2026-03-15 - Faza 4: Brevo Email + Oferta Bug Fixes

- ✅ **Migrim email**: Resend → Brevo (300/ditë free tier, pa domain verification)
- 📌 Vendim: Resend dështonte 403 (vetëm `onboarding@resend.dev` te emaili i vet)
- ✅ Bug fix: Edit oferte ruan pakot e selektuara
- ✅ Bug fix: Word generation funksionon me array objektesh
- ✅ Bug fix: Copy link me clipboard + fallback
- ✅ Stats realizuar sipas llojit (Individ/Familje/Biznes me conversion)
- ✅ Drawer modal (slide-from-right) zëvendësoi modalin e vjetër
- ✅ Versioning sistem (historiku i ndryshimeve me badge "Nv" pranë emrit)
- ✅ PAKOT.js me të dhëna të sakta nga dokumentet Word zyrtare
- ⏳ Mbeten: Oferta-view redesign (Faza 5)

## 2026-03-15 - Faza 3: Stafi + Dokumentet + Auth System

- ✅ **Modul i ri**: Stafi (`pages/stafi.html` + `js/stafi.js`)
- ✅ Stafi me lista + organogram + tabs
- ✅ Sistemi i autentifikimit: 5 role (superadmin, management, dep_management, staff_hq, staff)
- ✅ `filtroSipasRolit(data, fushaKrijuesi)` për filtrim case-insensitive
- ✅ Resend API integration (zëvendësoi Nodemailer që Railway bllokon)
- 📌 Vendim: Resend API zgjedhur (jo Nodemailer/SMTP) - Railway bllokon SMTP outgoing
- 📌 Vendim: Oferta-view publike funksion (klienti zgjedh paket + konfirmon)
- 📌 Vendim: PAKOT.js si single source of truth për të dhënat e pakove
- ⏳ Modul Dokumentet placeholder (kërkon cloud storage)

## 2026-03-09 - Faza 2: UI Redesign + Module të Reja

- ✅ **Ridizajn UI**: Single CSS `theme.css` zëvendësoi 5 file të ndryshëm
- ✅ Color palette: SIGAL Navy `#002B5C` (i vjetër), monochrome blues/grays
- ✅ Font: IBM Plex Sans (më vonë do bëhet Montserrat në Faza 11+)
- ✅ Sidebar compact 54px collapsed, 196px on hover
- ✅ Lucide Icons CDN (zëvendësoi emojis)
- ✅ **Modul i ri**: Oferta (`pages/oferta.html` + `js/oferta.js`)
- ✅ Oferta-view publike (klienti hap me `?id=INDEX`)
- ✅ Faturimi: 4 statuse rrethore (Asgjë, Kërkesë, Në Proces, E Lëshuar)
- ✅ Faturimi: Select All + Send Email (mailto)
- ✅ Faturimi: Mujor/Vjetor butona (jo dropdown)
- ✅ Stats cards me border-left accents
- ✅ Auto Kontrata → Faturimi (transfer automatik)
- 📌 Vendim: PowerShell `Set-Content -Encoding UTF8` korrupton karaktere shqipe → përdor VS Code
- 📌 Vendim: `lucide.createIcons()` nuk punon për dynamic innerHTML → përdor inline SVG ose `<i>` + thirrje pas
- ⏳ Mbeten: Stafi, Dokumentet (Faza 3)

## 2026-03-Early - Faza 1: Setup Fillestar + Word Generation

- ✅ **Projekti themelu**: Express server + frontend HTML/CSS/JS
- ✅ Deploy: Vercel (frontend) + Railway (backend)
- ✅ GitHub repo: `gjonbalajagon-blip/sigal-platform`
- ✅ Word generation: docxtemplater + pizzip
- ✅ Custom `merge-docx.js` zëvendësoi `docx-merger` (npm i hequr)
- ✅ 3 lloje kontrate (individ, familje, biznes)
- ✅ 9 pako templates (3 individ + 6 familje/biznes)
- ✅ Aneksi 2 (dokumentacion shtesë)
- 📌 Vendim: localStorage për MVP, Supabase i shtyrë (kompleksitet jo i nevojshëm akoma)
- 📌 Vendim: `docx-merger` u hoq nga npm → custom merger me PizZip
- 📌 Vendim: Aneksi 2 injektohet direkt në document XML (jo merger - merger prishte dokumentin)
- ⏳ Mbeten: UI redesign + module të reja (Faza 2)

---

## 🎯 Milestones Kryesorë

| Data | Milestone |
|---|---|
| 2026-03-Early | Projekti themelu, Word generation funksional |
| 2026-03-09 | UI redesign me theme.css single, Oferta module |
| 2026-03-15 | Stafi module, Auth system, Brevo email migrim |
| 2026-03-Mid | Spreadsheet editor, Versioning, Tracking |
| 2026-03-Late | Word generation fix komplet, Faturimi ridizajn |
| 2026-04-Early | Debitoret module |
| 2026-04-Mid | Raportet module (1989 lines) |
| 2026-04-19 | **Theme-v2 migration** - glassmorphism + Montserrat |
| 2026-04-27 | Theme-v2 bug reports + oferta-view redesign |

---

*Për gjendjen aktuale, shih STATUS.md. Për vendimet detaje, shih DECISIONS.md.*
