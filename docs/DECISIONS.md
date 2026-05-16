# Decisions - SIGAL Health Platform

> Vendimet teknike kryesore: pse zgjodhëm X, çka konsideruam, çka refuzuam.
> Format: ADR (Architecture Decision Records).
> ⚠️ **MOS modifiko entries ekzistuese.** Vetëm shto të reja. Nëse vendim ndryshon, shto vendim të ri që e zëvendëson.

---

## 📋 Si të shtosh vendim të ri

```markdown
## DEC-NNN: Titulli i shkurtë
**Data:** YYYY-MM-DD
**Statusi:** ✅ Approved | ⏳ Proposed | ❌ Rejected | 🔄 Superseded by DEC-XXX

### Konteksti
Çka po na detyronte me marrë vendim?

### Vendimi
Çka zgjodhëm.

### Alternativat e Konsideruara
- Opsion A - pse jo
- Opsion B - pse jo

### Konsekuencat
- Pozitive: çka fitojmë
- Negative: çka humbim/komplikojmë
```

---

## DEC-001: localStorage si Storage Fillestar (jo Supabase)
**Data:** 2026-03-Early
**Statusi:** ✅ Approved (i shtyrë qëllimisht për Supabase)

### Konteksti
Platforma kishte nevojë për storage për MVP. Mundësitë: Supabase (PostgreSQL hosted), Firebase, ose localStorage.

### Vendimi
Përdor **localStorage** për MVP. Supabase do shtohet pasi platforma të jetë e qëndrueshme dhe vëllimi i klientëve të justifikojë koston/kompleksitetin.

### Alternativat
- **Supabase**: kompleksitet shtesë, kosto, kërkon migrim të dhënash, login real
- **Firebase**: vendor lock-in
- **localStorage**: i thjeshtë, pa kosto, mjaft për MVP

### Konsekuencat
- ✅ Zhvillim i shpejtë, pa kosto, pa setup
- ❌ Të dhënat nuk ndahen midis pajisjeve/browserëve
- ❌ Klientët realë (oferta-view) nuk mund të ndajnë të dhëna me agjentin
- ⏳ Migrim duhet bërë para se të kemi përdorues realë

---

## DEC-002: Custom merge-docx.js (Heqja e docx-merger)
**Data:** 2026-03-Early
**Statusi:** 🔄 Superseded by DEC-008 (aneksi2 injection)

### Konteksti
Paketa npm `docx-merger` u hoq nga npm registry. Aneksi 2 nuk mund të bashkohej.

### Vendimi
Krijuam `merge-docx.js` custom që përdor PizZip për të bashkuar dokumente XML.

### Alternativat
- Përdor versionin e vjetër nga GitHub - jo i sigurt
- Riprodho funksionalitetin - kjo që u zgjodh

### Konsekuencat
- ✅ Pa varësi të jashtme të prishura
- ❌ Më vonë (DEC-008) doli që merger në vetvete prishte dokumentin
- 🔄 Zëvendësuar nga injection direkt në document XML

---

## DEC-003: PowerShell Encoding - Mos Përdor `Set-Content -Encoding UTF8`
**Data:** 2026-03-09
**Statusi:** ✅ Approved (rule)

### Konteksti
Kur editonim file HTML me PowerShell, karakteret shqipe (ë, ç) korruptoheshin si `Ã«`, `Ã§`.

### Vendimi
**KURRË** mos përdor `Set-Content -Encoding UTF8` për file me karaktere shqipe. Përdor VS Code ose Notepad.

### Pse
PowerShell `Set-Content -Encoding UTF8` shton **BOM** (Byte Order Mark) që korrupton encoding-un.

### Konsekuencat
- ✅ Karakteret shqipe ruhen si duhet
- ⚠️ Edituesit duhet të dinë këtë rregull

---

## DEC-004: Lucide Icons - Pas innerHTML, JO inline createIcons()
**Data:** 2026-03-09
**Statusi:** ✅ Approved (rule)

### Konteksti
Lucide Icons CDN nuk i transformonte ikonat e shtuara dinamikisht me `innerHTML`.

### Vendimi
Dy zgjidhje:
1. **Inline SVG** për buttonat e tabelës (gjenerated dinamikisht)
2. `<i data-lucide="...">` për content static + thirrje `lucide.createIcons()` pas çdo `innerHTML` update

### Konsekuencat
- ✅ Ikonat shfaqen kudo
- ⚠️ Duhet kujtuar `lucide.createIcons()` pas çdo render dinamik

---

## DEC-005: Resend → Brevo për Email
**Data:** 2026-03-15
**Statusi:** ✅ Approved (replaces Resend)

### Konteksti
Resend dështonte 403 kur dërgoheshin emails te klientët realë. `onboarding@resend.dev` mund dërgonte vetëm te email i pronarit (`gjonbalajagon@gmail.com`). Verifikim domain kërkohej, por nuk ishte i mundshëm pa domain kompanie.

### Vendimi
Migrim te **Brevo API** (300 email/ditë free tier, **pa kërkesë domain verification**).

### Alternativat
- **Resend me domain verification** - kërkonte blerjen/setup të domain (i shtyrë)
- **SendGrid** - pricing më i lartë për free tier
- **Brevo (Sendinblue)** - free tier i mjaftueshëm, lehtë të integrohet
- **Nodemailer/SMTP** - Railway bllokon outgoing SMTP

### Konsekuencat
- ✅ Email funksionon për të gjithë klientët
- ✅ 300/ditë e mjaftueshme për volumin aktual
- ⏳ Kur kompania të ketë domain → mund të verifikohet për brand consistency
- ⚠️ Email vijnë nga `onboarding@brevo.com` (jo nga sigal-ks.com)

---

## DEC-006: Railway bllokon SMTP - JO Nodemailer
**Data:** 2026-03-15
**Statusi:** ✅ Approved (rule)

### Konteksti
Tentuam Nodemailer me Gmail SMTP. Railway nuk lejon outgoing SMTP connections.

### Vendimi
Përdor vetëm **HTTP-based email APIs** (Brevo, Resend, etj.). Mos tento Nodemailer.

### Konsekuencat
- ✅ Email funksionon në Railway
- ❌ Nuk mund të përdorim Gmail App Password për dërgim
- 🔧 Të gjitha email shkojnë përmes Brevo HTTP API

---

## DEC-007: Hardcoded Superadmin (jo në localStorage `stafi`)
**Data:** 2026-03-15
**Statusi:** ✅ Approved

### Konteksti
Sistemi i autentifikimit kërkonte një user fillestar para se stafi të mund të krijohej.

### Vendimi
Hardcode credentials e superadmin në `auth.js`:
- Username: `agon`
- Password: `sigal2026`
- Role: `superadmin`

### Alternativat
- Database me users të paracaktuar - kompleksitet shtesë
- Hardcode - thjeshtësi për MVP

### Konsekuencat
- ✅ Login funksionon menjëherë
- ⚠️ Password është në kod (jo në secure store) - pranueshëm për MVP, jo për prod
- ⏳ Migrim te Supabase Auth duhet bërë me përdorues realë

---

## DEC-008: Aneksi 2 - Inject Direkt në XML (jo Merger)
**Data:** 2026-03-09 (refined March-Mid)
**Statusi:** ✅ Approved (replaces DEC-002 partial)

### Konteksti
`merge-docx.js` (custom merger) prishte dokumentin Word - "Unreadable content" error.

### Vendimi
Aneksi 2 **injektohet direkt në document XML** të kontratës. Procesi:
1. Kopjo media files (image1.emf, image2.jpeg)
2. Kopjo embeddings (jo OLE - shih DEC-009)
3. Remap relationship IDs (rId)
4. Update [Content_Types].xml
5. Insert content para `<w:sectPr>` me page break

### Alternativat
- Merger me PizZip - prishte dokumentin
- Inject direkt - punon

### Konsekuencat
- ✅ Word document gjenerohet pa errore
- ✅ Media files (images) kopjohen saktë
- ❌ Më kompleks për të mirëmbajtur

---

## DEC-009: OLE Objects në Aneksi 2 - HIQEN
**Data:** 2026-03-Mid
**Statusi:** ✅ Approved

### Konteksti
Aneksi 2 përmban embedded Word document (OLE object - `<w:object>`, `<o:OLEObject>`). Kur kopjohej, prishte dokumentin final.

### Vendimi
**HIQI OLE objects** kur bashkohet aneksi 2. Vetëm media (images) kopjohet.

### Konsekuencat
- ✅ Word document funksional
- ❌ Embedded Word doc i Aneksit 2 humbet
- ⏳ Nëse përdoruesi e do prapa, duhet zgjidhje tjetër (preview image, etj.)

---

## DEC-010: PAKOT.js si Single Source of Truth
**Data:** 2026-03-15
**Statusi:** ✅ Approved

### Konteksti
Të dhënat e pakove ishin scattered nëpër kod (frontend + backend). Ndryshimi i një çmimi kërkonte update në shumë vende.

### Vendimi
**`js/pakot.js`** përmban GJITHË të dhënat e pakove (limite, çmime, mbulime). Frontend dhe backend referohen vetëm te ky file.

### Struktura
- `PAKOT.individ` (3 paketa)
- `PAKOT.familje_biznes` (6 paketa)
- `PAKOT.opsionale` (jete_plus_cash, opinioni_dyte)
- `tjera_pikat[]` array me 9 elementë (indeks 0-8)

### Konsekuencat
- ✅ Update i çmimeve në një vend
- ✅ Konsistencë midis oferta-view, oferta admin, kontratat, Word
- ⚠️ Nëse pakot ndryshojnë në PAKOT.js, duhet update edhe templates Word

---

## DEC-011: Tracking System - 5 Statuse për Ofertën
**Data:** 2026-03-Mid
**Statusi:** ✅ Approved

### Konteksti
Agjentit i nevojitej me ditë në çfarë faze është oferta (klienti e ka parë? konfirmuar? etj.).

### Vendimi
5 statuse sequenciale:
1. `e_krijuar` - sapo u krijua nga agjenti
2. `e_derguar` - agjenti dërgoi link/email
3. `e_pare` - klienti hapi oferta-view
4. `e_konfirmuar` - klienti tha "Konfirmoj Zgjedhjen"
5. `kontrate` - agjenti klikoi "Kontratë" (realizim)

### Implementim
In-memory storage në server.js (`ofertaTracking` object). Frontend `oferta-tracking.js` overrides për stepper visual.

### Konsekuencat
- ✅ Vizibilitet i plotë i lifecycle
- ❌ Tracking humbet kur Railway bën restart (in-memory)
- ⏳ Duhet migrim te database (kur të kemi Supabase)

---

## DEC-012: Versionet - Ndarje Agjenti vs Klient
**Data:** 2026-03-Mid
**Statusi:** ✅ Approved

### Konteksti
Edituar oferta (agjenti) dhe konfirmim (klienti) janë veprime të ndryshme. Të dyja ruajnë versione, por për qëllime të ndryshme.

### Vendimi
Versionet kanë **3 burime**:
- `krijim_fillestar` - krijimi i parë
- `edit_agjenti` - kur agjenti modifikon
- `konfirmim_klient` - kur klienti konfirmon (vetëm pakot e zgjedhura)

`renderVersions()` filtron - shfaq vetëm versionet e agjentit. Versioni i klientit përdoret veçmas (banner jeshil, spreadsheet locked).

### Konsekuencat
- ✅ Historiku qartë i ndarë
- ✅ Spreadsheet i agjentit dhe i klientit ruhen ndaras
- ⚠️ Kompleksitet shtesë në kod

---

## DEC-013: Spreadsheet Editor (jo Drawer Vertikal)
**Data:** 2026-03-Mid (Faza 6)
**Statusi:** ✅ Approved

### Konteksti
Drawer vertikal me 6 paketa (Familje/Biznes) ishte tepër i gjatë dhe i parehatshëm.

### Vendimi
Popup qendror me **spreadsheet horizontale** - paketa si kolona, fusha si rreshta.

### Alternativat
- Drawer vertikal - kishte zgjatje shumë
- Tabs për çdo paketë - ndarje e panevojshme
- **Spreadsheet horizontale** - kompakt + krahasueshëm

### Konsekuencat
- ✅ Krahasim i lehtë midis paketave
- ✅ Edit inline (Tab navigation)
- ✅ Foldable "Trajtime tjera"
- ⚠️ Kërkon kujdes me responsive (mobile sidewise scroll)

---

## DEC-014: Theme V1 (`theme.css`) → Theme V2 (`theme-v2.css`)
**Data:** 2026-04-19
**Statusi:** ✅ Approved (Faza 12)

### Konteksti
Theme V1 me `#002B5C` (navy i errët) + IBM Plex Sans nuk pëlqente përdoruesit. Kërkohej dizajn më modern.

### Vendimi
Theme V2 i ri:
- **Glassmorphism** (rgba + blur)
- **Montserrat** font
- **Soft royal blue gradient** (`#1e3a8a → #3b82f6 → #60a5fa`)
- **Background neutral gray** (jo blu)
- **KPI icons flat** (jo gloss/shadow)
- **Sidebar 76px** glassmorphism

### Alternativat e Refuzuara
- ❌ Inter font - i provuar, ndryshu në Montserrat
- ❌ Purple `#6366f1` / `#8b5cf6` - "I urrej purple" - user
- ❌ Heavy gradients me gloss - "skadon shpejt nuk ka oren"
- ❌ Numra me ngjyra në stat strips - dark text (#0f172a)

### Konsekuencat
- ✅ UI moderne dhe fresh
- ✅ Tek Sigal brand consistency (blue jo navy)
- ❌ Migrim i kërkuar për 9+ module
- ❌ Disa module u kthyen prapë në theme-v1 (Faturimi, Rinovimet) - duhet ri-migrim

---

## DEC-015: Hybrid CSS - common + page-specific
**Data:** 2026-04-19
**Statusi:** ✅ Approved (Faza 12)

### Konteksti
Theme-v2.css po bëhej shumë i madh (~1800 lines). Disa stile janë specifike për një faqe (organogram, spreadsheet, donut, etj.).

### Vendimi
**Hybrid approach**:
- `theme-v2.css` përmban: sidebar, topbar, butonat, tags, drawer, KPI cards, tabela, filters
- Çdo HTML file ka `<style>` bllok për stile specifike (organogram në stafi.html, spreadsheet në oferta.html, etj.)

### Alternativat
- All-in-one CSS - tepër i madh, vështirë me mirëmbajt
- Multiple CSS files - shumë HTTP requests
- **Hybrid** - balance i mirë

### Konsekuencat
- ✅ Çdo HTML file vetë-përmbajtës për stilet e veta
- ✅ Theme-v2.css mbetet i menaxhueshëm
- ⚠️ Duhet kujdes që mos të dublojmë stile midis HTML dhe CSS

---

## DEC-016: Action Buttons Spec (Photo 2 si Reference)
**Data:** 2026-04-19
**Statusi:** ✅ Approved (Faza 12)

### Konteksti
Action buttons (Edit, Word, Email, Link, Trash, Kontratë) në tabela u prishën disa herë gjatë migrimit. Përdoruesi dha foto të qartë si referencë.

### Vendimi
Spec eksakte:
1. **Icon buttons** (Pencil, Email, Link, Trash): white bg + gray border `#e5e9f0`, pill `34×30px`
2. **Word**: filled lavender `#e0e7ff` + text `#4338ca`, NO border
3. **Kontratë** (kur konfirmuar): filled blue `#dbeafe` + text `#1e40af`, NO border, **LEFT** of icons
4. Lucide icons (`<i data-lucide="...">`), JO inline SVG
5. SVG fix kritik: `fill: none !important; stroke: currentColor !important`

### Konsekuencat
- ✅ Konsistencë midis moduleve
- ⚠️ Çdo modul i ri duhet ndjekë spec-in (në `.action-icon-btns` block)

---

## DEC-017: kontratat.html si Reference Module
**Data:** 2026-04-19
**Statusi:** ✅ Approved (Faza 12)

### Konteksti
Pas migrimit te theme-v2, lipsej një modul "i artë" si referencë për të tjerët.

### Vendimi
**`pages/kontratat.html` + `js/kontratat.js`** janë reference. Çdo modul tjetër duhet të imitojë:
- Topbar pattern
- 4 KPI cards clickable
- Llojet chips në majtas
- Tabela layout
- Action buttons
- Drawer structure

### Konsekuencat
- ✅ Konsistencë e qartë
- ⚠️ Nëse kontratat.html ndryshon, duhet update tek të gjitha modulet

---

## DEC-018: Heqja e filter-status select (KPI e Zëvendëson)
**Data:** 2026-04-19
**Statusi:** ✅ Approved

### Konteksti
KPI cards janë clickable dhe filtrojnë sipas statusit (Aktive, Skadon, Skaduar). Filter-status select bëhej i tepërt.

### Vendimi
**Hiq** `<select id="filter-status">` kur KPI cards e mbulojnë funksionin.

### Konsekuencat
- ✅ Më pak rrëmujë në UI
- ✅ Klikim më i shpejtë
- ⚠️ Përdoruesi duhet të dijë që KPI është clickable (visual hint)

---

## DEC-019: Heqja e filter-lloji select (Llojet Chips e Zëvendësojnë)
**Data:** 2026-04-19
**Statusi:** ✅ Approved

### Konteksti
Të njëjtë logjikë si DEC-018 për lloji.

### Vendimi
**Hiq** `<select id="filter-lloji">`. Llojet chips në filter-row (LEFT) e zëvendësojnë.

### Konsekuencat
- ✅ Më pak rrëmujë
- ✅ Visual feedback i menjëhershëm (chip ngjyroset)

---

## DEC-020: Drawers - Mbyllen me Click Jashtë + ESC
**Data:** 2026-04-27
**Statusi:** ✅ Approved (Faza 13)

### Konteksti
Drawers të vjetër mbylleshin vetëm me X button. UX i dobët.

### Vendimi
Çdo drawer duhet:
1. `onclick="if(event.target===this) closeDrawer()"` te overlay
2. ESC key handler globalisht në `main.js`

### Konsekuencat
- ✅ UX modern
- ⚠️ Çdo drawer i ri duhet ndjekë këtë rregull

---

## DEC-021: Stats Thin Row (jo Big Cards) - Minimal
**Data:** 2026-04-27
**Statusi:** ✅ Approved (Faza 13)

### Konteksti
Stat cards të mëdha shfaqnin numra me ngjyra semantike (red, green). Përdoruesi e konsideroi tepër "të zhurmshëm".

### Vendimi
**Stats thin row**:
- Glassmorphism background
- Numra në `#0f172a` (dark text, JO ngjyra semantike)
- Labels uppercase 10px gray
- Dividers 1px gray

### Konsekuencat
- ✅ UI minimal, profesional
- ✅ Përgjigja "thin" - 12px padding (jo big cards)

---

## DEC-022: Debitoret - 4 Stats Top + Statuset Row + Aging Filters
**Data:** 2026-04-27
**Statusi:** ✅ Approved (Faza 13)

### Konteksti
Versioni fillestar i debitoret pati struktura të prishur stats. Përdoruesi qartësoi çka don.

### Vendimi
**Stats top (4 vetëm):**
- Borxhi total
- Mbi 365 ditë
- Paguar
- Mbetur

**Statuset row (clickable, count + euro):**
- Kontaktuar, Premtim, Pjesshëm, Kontestuar, Pamundshëm

**Kolona të reja në tabelë:**
- 91-180 (ishte gabimisht në stats, duhet kolonë)
- E pamaturuar (kolonë e re)

**Aging filters (clickable headers):**
- Filtër sipas "max delinquency" - klienti shfaqet vetëm në bucket-in e tij më të keq

### Implementim
```javascript
function getMaxAging(klient) {
    if (klient.borxh_mbi_365 > 0) return '>365';
    if (klient['borxh_91_180'] > 0) return '91-180';
    // etj.
}
```

### Konsekuencat
- ✅ UX më i kuptueshëm (klienti njoftohet në një vend)
- ✅ Stats reflekton realitetin (debt = state, jo akumulim)

---

## DEC-023: Oferta-View - 3-Col Layout (Paketat | Detail | Extras)
**Data:** 2026-04-27
**Statusi:** ✅ Approved (Faza 14)

### Konteksti
Oferta-view me single-column layout kërkonte shumë scroll për pakot dhe extras. Klienti humbiste fokusin.

### Vendimi
Layout 3-kolonësh: **Majtas:** Sidebar me lista e paketave (klikohen për të hapur detajet); **Qendër:** Detajet e paketës aktive + mbulimet; **Djathtas:** Extras (Jetë Plus Cash, Opinioni, Network info).

### Konsekuencat
- ✅ Pa scroll - gjithçka në një pamje
- ✅ Krahasim më i lehtë midis paketave
- ✅ Extras gjithmonë të dukshme
- ⚠️ Kërkon ekran më të gjerë (>768px)

---

## DEC-024: Jetë Plus Cash - Popup i Ndarë (Info → Calculator)
**Data:** 2026-04-27
**Statusi:** ✅ Approved (Faza 14)

### Konteksti
Popup i vetëm me info + kalkulator ishte shumë i ngarkuar. Klienti hutohej.

### Vendimi
Dy popup të veçantë: **Popup Info** (sqarime për produktin: mbulimet, kushtet) dhe **Popup Calculator** (kalkulim i çmimit me grupmosha + numër personash). Click "Vazhdo te kalkulimi" e kalon nga info → calc.

### Konsekuencat
- ✅ Më pak konfuzion vizual
- ✅ Klienti vendos pas leximit (jo paralel me kalkulim)

---

## DEC-025: Jetë Plus Cash - Dropdown Grupmoshë (jo Input Numerik)
**Data:** 2026-04-27
**Statusi:** ✅ Approved (Faza 14)

### Konteksti
Çmimet janë definuar sipas brackets fikse (21-30, 31-40, etj.), jo me formulë. Input numerik ishte i panevojshëm dhe klienti mund ta gabonte.

### Vendimi
Dropdown me grupmosha të paracaktuara: 21-30, 31-40, 41-50, 51-60, 61-70, 71-80 vjeç. Plus dropdown gjini (M/F) dhe dropdown shumë e siguruar.

### Alternativat
- Input numerik me logjikë "round to bracket" - kompleks dhe error-prone
- **Dropdown grupmosha** - eksakt çka i nevojitet kalkulimit

### Konsekuencat
- ✅ Saktësi 100%
- ✅ UI më i thjeshtë

---

## DEC-026: Jetë Plus Cash - Multi-Row Kalkulator me "Shto Kategori"
**Data:** 2026-04-27
**Statusi:** ✅ Approved (Faza 14)

### Konteksti
Familje mund të kenë anëtarë me grupmosha të ndryshme. Single-row kalkulator nuk e mbulonte këtë.

### Vendimi
Kalkulator multi-row: çdo rresht = një kategori (grupmoshë + gjini + shumë), field "Numri i personave" për këtë kategori, buton "+ Shto kategori" për familje me anëtarë të ndryshëm, total automatik.

### Konsekuencat
- ✅ Familje me 4 anëtarë (2 të rritur + 2 fëmijë) llogariten saktë
- ✅ Përdorim flexible

---

## DEC-027: Kartela SIGAL - Sjellje e Ndryshme Sipas Kategorisë
**Data:** 2026-04-27
**Statusi:** ✅ Approved (Faza 14)

### Konteksti
Rrjeti SIGAL ka 4 kategori institucionesh, secila me sjellje të ndryshme: Spitalet/Laboratoret/Dentarët → mbulim direkt me kartelë; Optika/Farmaci → vetëm zbritje (jo mbulim direkt).

### Vendimi
Në oferta-view, çdo kategori e kartelës shfaq sqarim specifik: "**Spitalet/Lab/Dent:** Prezanto kartelën dhe përfito mbulim direkt." dhe "**Optika/Farmaci:** Prezanto kartelën dhe përfito zbritje në çmime."

### Konsekuencat
- ✅ Klienti kupton qartë çka pret nga çdo kategori
- ✅ Pa keqkuptime për pagesë në vend

---

## DEC-028: Migrim Backend Railway → Render Free Tier
**Data:** 2026-05-07
**Statusi:** ✅ Approved (Faza 14.5)

### Konteksti
Railway trial skadoi → backend i shkëputur. Funksionet që humbën:
- Word generation (`/api/gjenero-kontrate`, `/api/gjenero-oferte`)
- Email konfirmim (`/api/konfirmo-oferte` via Brevo)
- Tracking i ofertave (`/api/oferta-track`, `/api/oferta-status`)

Maj 2026 është lansim i hershëm — duhej zgjidhje **e shpejtë + falas** para se të investohej në plan paid.

### Vendimi
Migrim te **Render Free Tier** (Frankfurt region) + **UptimeRobot ping** (5 min interval) për anti-sleep.

**Konfigurimi final:**
- `render.yaml` (free, frankfurt, healthCheckPath: `/api/health`)
- `engines: node >=20` te `package.json`
- `/api/health` endpoint i ri për Render dhe UptimeRobot
- CORS i kufizuar te `sigal-platform-shendet.vercel.app` + `*.vercel.app` + localhost (sigurizë e shtuar krahasuar me `cors()` open)
- `express.static('.')` u hoq (Vercel mban frontend, jo backend)
- `nodemailer` u hoq nga `package.json` (i pa-përdorur)
- Brevo "Authorized IPs" u disable (Render IP mund të ndryshojë)

### Alternativat
- **Railway Hobby paid ($5/muaj):** më e qëndrueshme por kosto. Refuzuar tani — më vonë mundësi.
- **Fly.io free:** ndërlikim më i madh, nuk ka health check pattern të thjeshtë.
- **Vercel serverless functions:** kërkon refactoring të Express → handler pattern (kohë të madhe).
- **Render Starter paid ($7/muaj):** s'ka cold start, por kosto. Mund të kalohet kur biznesi rritet.

### Konsekuencat
- ✅ **$0/muaj** kosto operative
- ✅ Render auto-deploy nga `main` branch (njësoj si Railway)
- ✅ UptimeRobot mban backend gjallë (ping çdo 5 min) → cold start vetëm pas restart-eve të rralla
- ✅ Health check: monitor i automatik
- ⚠️ **750 orë/muaj** Render free limit — wallet mjafton për 1 service 24/7
- ⚠️ Cold start 30-60 sek herën e parë pas sleep (rrallë me UptimeRobot)
- ⚠️ Tracking në kujtesë mbetet — humb nëse Render bën restart (jo problem urgjent për MVP)
- ⚠️ Brevo IP authorization off → siguria varet nga API key (mbaj atë sigurt)

### Lidhje
- **Frontend:** Vercel (pa ndryshim) — `sigal-platform-shendet.vercel.app`
- **Backend (i ri):** `https://sigal-platform.onrender.com`
- **Health:** `https://sigal-platform.onrender.com/api/health`
- **UptimeRobot:** monitor "SIGAL Backend Health" 5-min interval
- **Trigger për ndërmarrje (Render Hobby/Starter):** kur cold start bëhet problem real ose 750h/muaj nuk mjafton

---

## DEC-029: Mobile UX Redesign Oferta-View (Pakot Grid + Badge Bottom Bar)
**Data:** 2026-05-08
**Statusi:** ✅ Approved (Faza 14.6)

### Konteksti
Pas Faza 14.5, përdoruesi testoi `oferta-view.html` në iPhone real dhe identifikoi 2 probleme UX:

**Problemi 1 — Pakot horizontale të ngushta:**
6 paketa (Bazë → Gold) shfaqeshin në 1 rresht horizontal me layout flex. Çdo kartë ~50px gjerësi → tekstet stivohen vertikalisht me 5 rreshta të vegjël (emri + mbi 18 + çmimi + nën 18 + çmimi). Vështirë për të prekur me gisht, vështirë për të lexuar.

**Problemi 2 — Bottom bar pa feedback vizual:**
Footer me "TOTAL MUJOR / Konfirmo Zgjedhjen" kishte layout të varfër në mobile — gjithçka qendërzuar, "Asnjë pako e zgjedhur" duket jashtë vendit, pa feedback për pakon e zgjedhur.

### Vendimi
Krijim i breakpoint-it të ri `@media(max-width:768px)` (mes 900px dhe 640px) që zëvendëson layout horizontal me **grid 2-kolonë** për pakot dhe **badge layout** për bottom bar.

**Layout i ri:**

1. **Pakot:** `display:grid; grid-template-columns:1fr 1fr; gap:10px`
   - Çdo kartë ~150-180px (në vend të 50px)
   - Padding 14px 12px (komod për prekje)
   - 5 rreshta info të lexueshme: emri, Mbulim €X, mbi 18 €Y, nën 18 €Z

2. **Bottom bar:**
   - `.footer-info` (tekst informues) hidden në mobile (kursim hapësire)
   - `.footer-totals` inline flex: total + summary me dot separator '•'
   - `.ft-summary::before { content:'• ' }` → "€30/muaj • Standard Plus"
   - `.btn-konfirmo` full-width

### Alternativat e Refuzuara
- ❌ **Mbaj 1-rresht horizontal me boxe më të gjera** — me 6 paketa në 360px ekran, fizikisht nuk del
- ❌ **Carousel slidoj** — kërkon JS, kompleks UX
- ❌ **Paketat collapsed me click për detail** — humbet krahasim i menjëhershëm

### Konsekuencat
- ✅ Karta paketash komode për prekje (~150px wide × ~120px tall)
- ✅ Krahasim vizual i lehtë midis 6 paketave
- ✅ Bottom bar i pastër, summary i dukshëm
- ✅ Pa scroll horizontal i faqes
- ⚠️ Tabletet 768-820px portrait përdorin 900px breakpoint (1-rresht 5-rreshta) — i pranuar
- 🚫 Desktop (>768px) i pa-ndryshuar
- 🚫 JS i pa-ndryshuar (vetëm CSS)

### Implementim
Vetëm CSS shtim në `pages/oferta-view.html`:
- Bllok i ri `@media(max-width:768px)` me ~25 rregulla
- Cleanup në `@media(max-width:640px)`: hequr 5 conflicting paketa-btn rules + 5 conflicting footer-bar rules

### Anti-Patterns të shmangura
- 🚫 NUK u shtua sticky bottom bar shtesë (përdoruesi tha "siq është")
- 🚫 NUK u ndryshua background-i i bottom bar
- 🚫 NUK u prekën stilet desktop

---

## DEC-030: Detyrat — Option B Permissions (staff sheh vetëm të vetat)
**Data:** 2026-05-16
**Statusi:** ✅ Approved (Faza 2A)

### Konteksti
Modul Detyrat duhet të respektonte hierarkinë e permissioneve ekzistuese (superadmin/management/dep_management = full; staff/staff_hq = limited). Pyetja: çfarë saktësisht do të shohë një staff?

### Vendimi
**Opsioni B:** Staff/staff_hq sheh vetëm detyrat ku `krijuarNga === username` OSE `pergjegjesi === username`. Management+ shohin gjithçka.

Implementim te `filtroSipasPermissions(lista)` — funksionon si filter në krye të çdo render-i.

### Alternativat e Refuzuara
- ❌ **Opsioni A: Të gjitha të dukshme për të gjithë** — humb privacy; menaxheri sheh dhe komenton mbi detyrat e tjerëve
- ❌ **Opsioni C: Vetëm `pergjegjesi`** — staff që krijon detyrë vetë do ta humbiste menjëherë

### Konsekuencat
- ✅ Staff fokusohet vetëm në punën e vet
- ✅ Auto-triggers ende gjenerojnë për të gjithë — sepse `krijuarNga='system'` dhe `pergjegjesi=''` (në fillim Pa-përgjegjës)
- ⚠️ Detyra "Pa përgjegjës" duket vetëm te management — chip "Pa përgjegjës" fshehur për staff via `aplikoPermissions()`

---

## DEC-031: Toast Undo Pattern (timeout 5 sekonda)
**Data:** 2026-05-16
**Statusi:** ✅ Approved (Faza 2A)

### Konteksti
Veprime si "Perfundo detyrë" ose "Anulo detyrë" janë reversible në UI por kostoja e gabimit është lartë (humbje konteksti aktivitetesh, ndryshim statusi). Pyetja: si t'i japim përdoruesit mundësi rikuperimi pa confirmation dialog që rrit fërkim?

### Vendimi
**Toast me undo timeout 5s.** Veprimi aplikohet menjëherë (optimistic), por toast `.det-toast` me button "Anulo" qëndron 5 sekonda. Klikim → `callbackUndo()` rikthen state-in. Pas 5s → fshihet automatikisht.

### Alternativat e Refuzuara
- ❌ **confirm() dialog** — fërkim i lartë për veprime të zakonshme
- ❌ **Soft delete + Trash view** — overkill për mini-mod
- ❌ **Undo unlimited (Ctrl+Z stack)** — overkill, kompleks

### Konsekuencat
- ✅ Fluks i shpejtë (mendje optimistike)
- ✅ Mundësi shpëtimi për 5s pas gabimit
- ⚠️ Veprimi commit-on menjëherë në localStorage — nëse user mbyll faqen brenda 5s, undo humbet (i pranuar)

---

## DEC-032: Pastrim Auto i Arkivit (>90 ditë)
**Data:** 2026-05-16
**Statusi:** ✅ Approved (Faza 2A)

### Konteksti
localStorage ka limit ~5MB. Detyrat me status `e_perfunduar` ose `e_anuluar` grumbullohen me kohën dhe e ngarkojnë storage-in pa vlerë.

### Vendimi
`pastroDetyratEArkiva()` ekzekutohet në `DOMContentLoaded` — fshin detyra ku `status IN ('e_perfunduar', 'e_anuluar')` AND `data_e_perfundimit (ose data_e_anulimit) > 90 ditë më parë`.

### Konsekuencat
- ✅ Storage i kontrolluar pa intervenim manual
- ✅ Detyra të reja (≤90d) ende mund të rishihen për audit
- ⚠️ Audit trail jashtë 90d humbet — i pranuar (kur Supabase migrohet, do të ruhet aty)

---

## DEC-033: `?hap=INDEX` URL Pattern për Cross-Module Navigation
**Data:** 2026-05-16
**Statusi:** ✅ Approved (Faza 2A)

### Konteksti
Auto-detyra te modul Detyrat kanë lidhje me records specifike (oferta #5, kontrata #12, etj.). Klikimi te detyra duhet të hapë drawerin përkatës në modulin specifik. `rinovimet.js` dhe `kontratat.js` tashmë kishin pattern `?nga_rinovimi=ID` — ne përgjithësojmë.

### Vendimi
URL pattern uniform `?hap=INDEX` shtuar te `oferta.js`, `kontratat.js`, `faturimi.js`. Handler në `DOMContentLoaded` lexon parametrin, valido (numër + brenda kufirit të array-it), thërret edit function përkatëse (`editoOferte` / `editoKontrate` / `editoKlient`) me delay 150-200ms (që tabela të jetë e renderuar), pastaj `history.replaceState` për të hequr param-in.

### Alternativat e Refuzuara
- ❌ **localStorage handoff** (si rinovimet) — kërkon cleanup, lë state të vjetër nëse user mbyll para hapjes
- ❌ **postMessage / window.open** — i komplikuar për single-tab navigation
- ❌ **Hash routing (#)** — historinë e kthen mbrapa në mënyrë të paqartë

### Konsekuencat
- ✅ Pattern i thjeshtë, i ripërdorshëm
- ✅ Mund të ndahet linku (URL është shareable)
- ⚠️ INDEX bazohet në pozicion në array — nëse user fshin records, indexet ndryshojnë. Për MVP i pranuar; në Supabase do të bëhet me ID të vërteta.

---

## DEC-034: De-duplication via `makeRregullKey`
**Data:** 2026-05-16
**Statusi:** ✅ Approved (Faza 2A)

### Konteksti
Auto-triggers gjenerojnë detyra çdo `DOMContentLoaded`. Pa de-duplication, çdo refresh i faqes do të krijonte detyra duplikate.

### Vendimi
Çdo detyrë auto ka `rregulla_key` = `${moduli}|${referencaId}|${rregulla}` (p.sh. `kontratat|12|skadon_30d`). Para krijimit, kontrollohet nëse ekziston detyrë me të njëjtin key dhe status != `e_anuluar`/`e_perfunduar`. Nëse po → skip.

### Konsekuencat
- ✅ Idempotent — refresh nuk shton duplikate
- ✅ Pas anulimit, mund të ri-gjenerohet kur kushtet vazhdojnë
- ⚠️ Kërkon disiplinë: kur shtojmë trigger të ri, key duhet të jetë unik

---

## DEC-035: Modul Detyrat Standalone para Ballina (Faza 2A → 2B → 2C)
**Data:** 2026-05-16
**Statusi:** ✅ Approved (Faza 2A)

### Konteksti
Ideja origjinale: Dashboard + Detyrat të bashkohen në "Ballina" me split-view. Por kjo kërkon redesign të madh dhe shumë moving parts (CSS + JS + permissions + Charts).

### Vendimi
**Ndarje në 3 faza:**
- **Faza 2A** (kjo): Modul Detyrat standalone në `pages/detyrat.html` — punon i pavarur, testohet, kalibrohet
- **Faza 2B**: Supabase mini (vetëm tabela `oferta_views`) për trigger #6 "oferta e parë 3-5 herë"
- **Faza 2C**: Bashkim Dashboard + Detyrat në `ballina.html` me split-view

### Alternativat e Refuzuara
- ❌ **All-in-one (Ballina direkt)** — risk i lartë, vështirë për debug, vështirë për rollback
- ❌ **Detyrat si widget në Dashboard ekzistues** — humb hapësirë; Dashboard nuk është projektuar për këtë

### Konsekuencat
- ✅ Testim incremental, rollback i lehtë
- ✅ Çdo fazë ka deliverable të prekshëm
- ⚠️ User do të ketë 2 faqe (Dashboard + Detyrat) deri në Faza 2C — i pranuar përkohësisht

---

## 📚 Vendime në Pritje (Proposed)

### DEC-PROPOSED-001: Migrim te Supabase
**Statusi:** ⏳ Proposed
**Konteksti:** Pas DEC-001, kur platforma të jetë e qëndrueshme dhe vëllimi të kërkojë.
**Trigger:** Kur platforma të ketë >50 klientë realë ose përdorues mbi 5.

### DEC-PROPOSED-002: Custom Domain për Email
**Statusi:** ⏳ Proposed
**Konteksti:** Brevo dërgon nga `onboarding@brevo.com`. Për brand consistency, duhet domain SIGAL.
**Trigger:** Kur kompania t'i ofrojë domain.

### DEC-PROPOSED-003: Chart.js për Raportet
**Statusi:** ⏳ Proposed
**Konteksti:** Raportet aktualisht përdorin div bars primitive. Chart.js është më profesional.
**Trigger:** Pasi modulet kryesore të jenë stabile (Faza 14+).

---

*Çdo vendim i ri duhet shtuar me numër sekuencial. MOS modifiko ekzistuesit.*
