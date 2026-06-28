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

## DEC-036: Stable-ID Migration për oferta/kontratat/faturimi (BUG i njohur)
**Data:** 2026-05-16 (propozim) / 2026-06-23 (implementim)
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2A.3, commit 15ebd60)

### Konteksti
Audit pas Faza 2A zbuloi inkonsistencë në `referencaId` te detyrat auto:

| Trigger | Moduli | referencaId | Stabil? |
|---|---|---|---|
| #1 Kontratë skadon | kontratat | array index | ❌ Jo |
| #2 Ofertë skadon | oferta | array index | ❌ Jo |
| #3 Ofertë konfirmuar | oferta | array index | ❌ Jo |
| #4 Faturim pa kërkesë | faturimi | array index | ❌ Jo |
| #5 Debitor 365d | debitoret | `d.id` (stable) | ✅ Po |

Rinovimet/debitoret kishin `id` stabil para Faza 2A. Oferta/kontratat/faturimi përdorin pozicion në array si "identitet" — që do të thotë:

**Bug-u real:** Nëse `ofertat[3]` fshihet, detyra me `referencaId: 5` tani hap rekordin që ishte në pozicion 6. User-i sheh "Krijo kontratë për Klient A" → drawer hap Klient B.

Aktualisht latente sepse fshirjet janë të rralla, por **load-bearing pas adoption**.

### Vendimi
Para Faza 2B (Supabase mini), bëj migrim 3-hapësh:

1. **Shto `id: generateId()`** te `shtoOferte()`, `shtoKontrate()`, `shtoKlient()` (oferta.js, kontratat.js, faturimi.js)
2. **Backfill për rekordet ekzistuese**: skript një-herëshëm që loop-on array-in dhe vendos `id` nëse mungon
3. **Ndërro `?hap=INDEX` → `?hap=ID`**:
   - Handler-at te tre modulet bëhen `.find(x => x.id === param)` në vend të `array[parseInt(param)]`
   - `detyrat.js:351 hapModulNgaDetyra` mbetet i njëjti (passon `referencaId` siç është)
   - Triggers te `detyrat.js` ndërrojnë `referencaId: idx` → `referencaId: k.id`

### Alternativat e Refuzuara
- ❌ **Lë siç është** — bug i sigurt kur fshirjet bëhen të zakonshme
- ❌ **Përdor `kontrataNr` ose `nrPersonal` si ID** — jo unike, mund të ndryshohen
- ❌ **Mbaj edhe index edhe ID** — kompleks, dy burime të vërtetës

### Konsekuencat
- ✅ Detyrat auto nuk gabojnë target-in pas fshirjeve
- ✅ Konsistencë me rinovimet/debitoret
- ⚠️ Migrimi duhet bërë para se database të rritet — sa më shpejt aq më mirë
- ⚠️ User-përdoruesit mund të kenë URL-të e ruajtura me `?hap=INDEX` që do të prishen — i pranuar (përdorimi është minimal)

### Trigger për implementim
Para Faza 2B fillon, ose nëse user-i raporton sjellje të çuditshme nga detyrat → hap rekordi i gabuar.

### Implementim final (Faza 2A.3, 2026-06-23)
- **Utility në `js/main.js`**: `generateRecordId(prefix)`, `backfillRecordIds(key, prefix)`, `backfillAllIds()`
- **Prefiks ID**: `oft_` (oferta), `kon_` (kontratat), `fat_` (faturimi)
- **Backfill idempotent** thirret në krye të çdo moduli para `let xxx = JSON.parse(...)` — siguron që rekordet ekzistues marrin id automatikisht në load
- **Rekorde të rinj** marrin id në `ruajOferte/Kontrate/Klient` + në `rinovoKontrate` + në auto-faturim record të krijuar nga kontratat
- **Edit ruan id ekzistues** — `kontrata.id = kontratat[editIndex].id`
- **Handler `?hap=`** te 3 modulet: lookup me regex prefix, fallback me numeric për URL legacy
- **Triggers detyrat** përdorin `rekord.id` jo `idx` (4 nga 5 trigger-at; trigger 5 për debitoret ishte stable nga fillimi)
- **`migroDetyratReferences()`** te detyrat.js bootstrap: zëvendëson referencaId numerik (legacy) → stable id (lookup arr[idx].id pas backfill)

---

## DEC-037: localStorage Keys për Detyrat Module
**Data:** 2026-05-16
**Statusi:** ✅ Approved (Faza 2A — dokumentim)

### Konteksti
Modul Detyrat ka çelësa në localStorage. Audit zbuloi mospërputhje me specifikimin origjinal (`detyrat_accordion_state` u zëvendësua me `detyrat_group_state` gjatë implementimit).

### Vendimi
Standardizim përfundimtar (kodi është burim i vërtetës):

| Key | Lloji | Përmbajtja | Persistencë |
|---|---|---|---|
| `detyrat` | array JSON | Të gjitha detyrat (auto + manuale) | Permanente |
| `detyrat_filter_state` | string | `'all'` / `'te-miat'` / `'pa-pergjegjes'` | Permanente |
| `detyrat_group_state` | object JSON | `{kritike: bool, te_rendesishme: bool, normale: bool, e_perfunduar: bool, ...nën-grupe me çelës "kritike__kontratat"...}` | Permanente |
| `detyrat_last_run` | ISO string | Timestamp i auto-trigger run-it të fundit (info-only) | Permanente |

**Update Faza 2A.2:** `detyrat_group_state` është zgjeruar për të mbajtur edhe state të nën-grupeve me çelësa të përbërë (psh `kritike__kontratat`). Nuk u krijua çelës i ri.

### Konsekuencat
- ✅ State i ruajtur cross-session (filter, accordion collapse, sub-group collapse)
- ✅ Dokumentim i qartë i naming-ut
- ✅ Çelësi `detyrat_group_state` është dimensional — mund të mbajë state të çdo niveli grupimi pa shtim key-sh të rinj
- ⚠️ 4 çelësa total — pjesë e parashikuar e rritjes së localStorage (pastro auto >90d ndihmon)

---

## DEC-038: Dense Row Layout në Detyrat (zëvendëson .det-card)
**Data:** 2026-06-23
**Statusi:** ✅ Approved (Faza 2A.2)

### Konteksti
Pas Faza 2A, user-i testoi me 300+ detyra reale dhe gjeti se kartelat e gjera (~110px lartësi, 3 badge meta + 3 butona aksioni në vijën e fundit) bëjnë listën të padurueshme — scroll i pafund, vështirë të orientohesh.

### Vendimi
Zëvendësim i `.det-card` me `.det-row-wrapper` (rresht i dendur ~40px):
- Layout 1-rresht: `[checkbox] [icon auto/hand] [titulli ellipsis] [pergj] [badge afati] [chevron]`
- Title truncated me `white-space:nowrap; overflow:hidden; text-overflow:ellipsis`
- Klik mbi rresht → toggle expand (in-memory only, **jo persistent** ndryshe nga group state)
- Expanded view shfaq: meta badges, përshkrim, burimi, 3 aktivitete të fundit, butona aksioni

`.det-card` MBETET në theme-v2.css (jo i fshirë) sepse mund të ripërdoret diku tjetër — vetëm s'përdoret nga `js/detyrat.js`.

### Alternativat e Refuzuara
- ❌ **Mbaj kartela, vetëm ngji më shumë në lartësi** — humbet info, ende e gjerë
- ❌ **Virtual scroll** — overkill për <500 items
- ❌ **Tabela e sheshtë** — humbet ngjyrosja prioritet via border-left

### Konsekuencat
- ✅ Reduktim hapësire: ~110px → ~40px për rresht (~63%)
- ✅ Më shumë detyra të dukshme pa scroll
- ✅ Detaje të plota disponibile përmes expand (1-klik)
- ⚠️ Klasat e vjetra `.det-card-*` mbeten "dead CSS" derisa të kërkohen për tjetër modul

---

## DEC-039: Helper `eshteImja(detyra)` për "Detyrat e mia"
**Data:** 2026-06-23
**Statusi:** ✅ Approved (Faza 2A.2)

### Konteksti
Filter "Detyrat e mia" dhe theksim vizual (inset shadow) i rresht-it kërkojnë logjikë të përsëritur. Ngatërresë me `filtroSipasPermissions()` (që përfshin `krijuarNga` për access control).

### Vendimi
Krijim i 2 helper-ave të dedikuar:

```js
function eshteImja(d) {
    const u = getUserAktual();
    if (!u || !d) return false;
    return (d.pergjegjesi || '').toLowerCase() === (u.username || '').toLowerCase();
}
function eshtePaPergjegjes(d) {
    return !d || !d.pergjegjesi;
}
```

**Pse vetëm `pergjegjesi`** (jo edhe `krijuarNga`): "Detyrat e mia" semantikisht do të thotë "ato që duhet t'i përfundoj", jo "ato që unë krijova".

`filtroSipasPermissions()` ruan logjikën e access control (krijuarNga OR pergjegjesi) — të ndarë qartë.

### Konsekuencat
- ✅ Logjikë e centralizuar, e ripërdorshme në 5+ vende
- ✅ Ndarje e qartë midis "access" (filtroSipasPermissions) dhe "ownership UI" (eshteImja)

---

## DEC-040: Semantic Color Variables në theme-v2.css
**Data:** 2026-06-23
**Statusi:** ✅ Approved (Faza 2A.2)

### Konteksti
Klasat `.det-card-*` dhe `.det-badge-afati-*` përdornin hardcoded hex (#ef4444, #f59e0b, #10b981) që dublojnë `--s-red-dot`, `--s-orange-dot`, `--s-green-dot` ekzistuese. Audit-i kërkonte semantic naming për module të reja (psh `.det-row-kritike` është më ekspresiv me `var(--s-danger)` se `var(--s-red-dot)`).

### Vendimi
Shtim te `:root` (theme-v2.css linja ~52):

```css
--s-danger:      #ef4444;
--s-danger-bg:   #fef2f2;
--s-danger-text: #991b1b;
--s-warning:     #f59e0b;
--s-warning-bg:  #fffbeb;
--s-warning-text:#b45309;
--s-success:     #10b981;
--s-success-bg:  #ecfdf5;
--s-success-text:#065f46;
```

**KUSHT KRITIK i respektuar:** Variabla ekzistuese (`--s-red-dot`, etj.) MUND BUMËE preken. Vlerat e ngjyrave nuk ndryshuan; vetëm aliases të rinj semantic u shtuan. Klasat ekzistuese që përdornin hardcoded → refactored të përdorin variabla të rinj.

### Konsekuencat
- ✅ Naming më ekspresiv për semantic states (danger > red)
- ✅ Lehtëson tema të ardhshme (psh dark mode mund të ndryshojë vetëm variabla, jo hex në kod)
- ✅ Zero rritje në bundle size
- ⚠️ Dy konvencione tani bashkë-ekzistojnë (`--s-red-dot` brand-old, `--s-danger` semantic-new). Per konvencion: brand-old për KPI/strip-statuset, semantic-new për module/error states.

---

## DEC-041: Staff Lejohet të Krijojë Detyra Manuale (prioriteti=normale)
**Data:** 2026-06-23
**Statusi:** ✅ Approved (Faza 2A.2)

### Konteksti
Faza 2A kishte: staff/staff_hq NUK mund të krijonin detyra manuale fare (hard-block te `hapDrawerKrijim`). User-i kërkoi që stafi të mundet të krijojë detyra për veten ose ekipin, por pa pasur fuqi të caktojnë prioritet "Kritike" për punët e tyre rutinore.

### Vendimi
Heqje e block-ut, por bllokim i select-it të prioritetit:

- Stafi mund të hapë drawerin
- `<select id="d-prioriteti">` → `disabled=true`, `value='normale'` për staff
- Edhe nëse staff manipulon DOM → `ruajDetyre()` server-side forcë `prioriteti='normale'` për staff
- Pergjegjesi: mund të caktojnë çdo staf (jo lock i mëtejshëm — vendim i marrë gjatë rrugës per default-i lejues)

### Alternativat e Refuzuara
- ❌ **Mbaj block të plotë** — staff s'mund të dokumentojnë punën që duhet të bëjnë
- ❌ **Vetëm priot. normale e disponueshme në UI** (kufizimi në frontend i mjaftueshëm) — manipulim DOM trivial; kërkoi edhe server-side enforce

### Konsekuencat
- ✅ Staff mund të planifikojë vetë punën
- ✅ Management+ mban kontroll mbi detyrat kritike/te_rendesishme
- ⚠️ Konfigurim "kush e cakton kujt" mbetet i lirë — bug latent nëse staff cakton detyrë te superior. Per default i pranuar; mund të rishikohet.

---

## DEC-042: Supabase Mini — vetëm tracking, jo migrim i plotë
**Data:** 2026-06-23
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2B, commit b5861f7)

### Konteksti
Trigger #6 (oferta parë 3-5 herë) kërkon counter persistent të view-imeve. Backend ekzistues kishte vetëm in-memory `ofertaTracking{}` — humbej në çdo Render restart. Migrim i plotë te Supabase (DEC-PROPOSED-001) ishte overkill; vetëm tracking ka nevojë për persistencë reale.

### Vendimi
Setup minimal i Supabase me **vetëm 1 tabelë** dhe arkitekturë **dual-write**:

**Schema (krijuar manualisht në Supabase):**
```sql
CREATE TABLE oferta_tracking (
  id BIGSERIAL PRIMARY KEY,
  oferta_id TEXT NOT NULL UNIQUE,    -- stable id si oft_xxx
  here_pare INTEGER NOT NULL DEFAULT 0,
  data_pare_pare TIMESTAMPTZ,
  data_pare_fundit TIMESTAMPTZ,
  ip_agjent TEXT,
  user_agent_pare TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
RLS enabled me policy `USING(false)` — vetëm SUPABASE_SECRET_KEY kalon.

**Backend (`js-server/supabaseClient.js` + `server.js`):**
- Klient fallback-safe: nëse `SUPABASE_URL`/`SUPABASE_SECRET_KEY` mungojnë → null + warning, backend vazhdon me in-memory pa crash
- `/api/oferta-track event=hapje`: dual-write (memory primary për response speed, Supabase persist async best-effort)
- Endpoint-et e reja: `GET /api/oferta-tracking/:id`, `POST /api/oferta-tracking-bulk`

### Alternativat e Refuzuara
- ❌ **Migrim i plotë i të dhënave te Supabase** (DEC-PROPOSED-001) — overkill për MVP, mban kompleks scope-in
- ❌ **Vetëm Supabase, pa in-memory** — humbet response speed, vulnerable ndaj Supabase outage
- ❌ **Vetëm in-memory** (status quo) — humb counter në çdo Render restart, bug i njohur

### Konsekuencat
- ✅ Tracking persistent (mbijeton restart Render)
- ✅ Dual-write garanton që asnjë response s'pret Supabase (latencë e ulët)
- ✅ Fallback-safe — outage Supabase nuk crashon backend
- ⚠️ Konsistencë eventuale (jo immediate) midis memory dhe Supabase për disa sekonda
- ⚠️ Skema vetëm për tracking; oferta/kontratat data ende localStorage (DEC-001 vazhdon)

### Env vars (vendosur te Render)
- `SUPABASE_URL` (psh `https://xxxxxxxxxxxxx.supabase.co`)
- `SUPABASE_SECRET_KEY` (service_role key — vetëm backend)

**MOS vendos** anon key — RLS bllokon klientin direkt; vetëm backend duhet të lexojë/shkruajë.

---

## DEC-043: Trigger #6 — Oferta Parë 3-5 Herë → Detyrë Kritike
**Data:** 2026-06-23
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2B, commit b5861f7)

### Konteksti
Pas Faza 2A.2, kishim 5 triggers auto te detyrat. Mungonte signal i fortë interesi: kur klienti e hap ofertën disa herë por nuk konfirmon, kjo është "warm lead" që agjenti duhet ta kontaktojë IMENDËT.

Range 3-5 hapje është "sweet spot":
- <3 hapje → klienti është thjesht duke parë, ende jo i interesuar
- 3-5 hapje → seriozisht duke shqyrtuar, kontaktim me një telefonatë mund të mbyllë shitjen
- >5 hapje → ka kaluar pikën e shqyrtimit, ndoshta diçka tjetër (ndarje me familjar, etj.) — më pak veprues

### Vendimi
Trigger asinkron i ri te `gjeneroDetyratAuto()`, që:

1. Filtron ofertat **kandidate**: ka `id`, jo konfirmuar, jo realizuar, jo anuluar, jo i skaduar
2. POST `/api/oferta-tracking-bulk` me ID-të (max 100 për thirrje)
3. Për secilën me `here_pare ∈ [3, 5]`: krijon detyrë
4. **Prioriteti: kritike** (sinjal interesi i fortë)
5. **Afati: nesër** (kontaktim urgjent)
6. **De-dup**: `makeRregullKey({moduli:'oferta', referencaId:o.id, rregulla:'auto_oferta_pare_35'})`

**Cache strategjia:**
- sessionStorage `oferta_tracking_cache` me TTL 30 sekonda
- Cache invalidohet nëse lista e kandidatëve ndryshon (psh oferta e re shtuar)
- Mbron nga fetch i dyfishtë nëse user refresh-on shumë herë

**Error handling:**
- Nëse `/api/oferta-tracking-bulk` fail (network, Supabase down) → `console.warn` dhe SKIP trigger #6
- Nuk crashon gjenerimin auto të 5 trigger-ave të tjerë

### Alternativat e Refuzuara
- ❌ **Range >5** — humb urgjencën; lead-i është "i ftohur"
- ❌ **Range >=3 pa upper bound** — krijon detyra dublikate për oferta parë 10+ herë (psh klienti e dërgon kolegët ta shohin)
- ❌ **Sync fetch (blocking)** — vonon hapjen e detyrat.html me 100-500ms
- ❌ **Cache pa TTL** — vonon refresh të dhënave kur user pret aktualizimin

### Konsekuencat
- ✅ Agjentët kapin "warm leads" pa kërkuar manual
- ✅ Pa rrezik shtimi i 5-6 detyrash dublikate për një ofertë (range bound)
- ✅ Fallback i sigurt: pa Supabase → skip silent, jo crash
- ⚠️ Kërkon që oferta link të përdorë stable id (oft_xxx) — implementuar në commit të njëjtë (kopjoLink/dergoEmail në oferta.js)
- ⚠️ Oferta legacy me URL të bazuara në index (email të vjetra) nuk do të triggerohen — i pranuar (rare case)

### Lidhje
- Mbështetet te DEC-036 (stable-ID) për konsistencën e burimi.referencaId
- Mbështetet te DEC-042 (Supabase mini) për burim të dhënash
- Mbështetet te DEC-034 (de-duplikim) për mos-përsëritjen

---

## DEC-044: Ballina — Faqe e Bashkuar Dashboard + Detyrat
**Data:** 2026-06-24
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2C, commit ad5f383)

### Konteksti
Pas Faza 2A/2B, user-i kishte 2 faqe që përdoreshin së bashku: Dashboard (overview) dhe Detyrat (todo). Navigim mes tyre kushtonte kohë; agjentët raportonin që kërkonin "kthim te dashboard pas detyre". Cross-referencë (klik KPI → filtruar detyra) nuk ekzistonte.

### Vendimi
Krijim i faqes së re `pages/ballina.html` me **split-view** të konfigurueshëm:
- 3 pozicione: `full-dashboard` / `split` (default) / `full-detyrat`
- Divider me 3 shigjeta (◀ ▢ ▶) që ndryshojnë pozicionin
- localStorage `ballina_pozicioni` ruan pozicionin cross-session
- Mobile (≤768px): tabs Detyrat | Dashboard, divider hiqet
- Sidebar: Dashboard nav-item → Ballina (icon home)

`dashboard.html` mbetet si **redirect stub** për 1-2 javë test compatibility (jo i fshirë).

### Alternativat e Refuzuara
- ❌ **Fshi dashboard.html plotësisht** — rrezikon humbjen e bookmarks/lidhjeve
- ❌ **Mbaj Dashboard dhe Detyrat të ndarë me cross-link** — humbet konteksti vizual njëkohshëm
- ❌ **Tab-based UI** (jo split) — humbet sinkronizimi vizual (KPI ndryshim duhet kthim te tab)

### Konsekuencat
- ✅ Agjent sheh kontekstin (KPI) dhe puna (detyra) njëkohësisht
- ✅ Klik KPI → modul-modal me detyrat e modulit përkatës (cross-ref)
- ✅ Mobile UX e qartë (tabs)
- ⚠️ `dashboard.html` redirect stub mbetet derisa të verifikohet kalimi (post-deploy, ~1-2 javë)
- ⚠️ Chart.js duhet `resize` event pas pozicionim change (implementuar me `setTimeout(360ms)`)

---

## DEC-045: Detyrat me 6 Module-Cards View (default) + Toggle Prioritet
**Data:** 2026-06-24
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2C, commit ad5f383)

### Konteksti
Te Ballina, paneli Detyrat ka hapësirë të kufizuar (50% në split). Lista e plotë me dense-rows do të mbushte hapësirën por humbet overview vizuale për çdo modul. User-i kërkoi **6 module-cards** (oferta/kontratat/faturimi/rinovimet/debitoret/manual) që tregojnë:
- Count total
- Stats kritike/të rëndësishme/normale
- Top 3 detyra preview
- Buton "Shih të X" → hap modal me listë të plotë

Por DENSE-list view (siç është te `pages/detyrat.html`) duhet të mbetet disponueshëm për përdoruesit që preferojnë listim klasik.

### Vendimi
**Default view: Modul (6 cards).** Toggle button në toolbar:
- `Modul` → grid 6 kartesh (2x3 në split, 3x2 në full-detyrat)
- `Prioritet` → accordion klasik (renderAccordion ekzistuese)

localStorage `detyrat_view_mode` ruan zgjedhjen e user-it.

Modulet me 0 detyra: kartë me opacity 0.55 dhe placeholder "Asnjë detyrë aktive".
Modulet me >=1 detyrë kritike: outline `var(--s-danger)`.

### Alternativat e Refuzuara
- ❌ **Vetëm dense-list view** — humbet overview vizuale modular
- ❌ **Vetëm module-cards view** — humbet sortim global sipas prioritetit
- ❌ **Default Prioritet** — humb fokusin te modulet (kontekst kryesor i agjentit)

### Konsekuencat
- ✅ Overview i menjëhershëm: cili modul ka punë më shumë / më kritike
- ✅ Detajet e plota disponueshme me 1 klik (modal)
- ✅ User-i mund të kalojë te dense-list nëse preferon
- ⚠️ Modulet me kategori të reja (psh detyra për oferta-tracking) mund të kërkojnë kartë të re — extensible nga `MODULE_CARDS` array

---

## DEC-046: Modal "Shih të gjitha" me Pattern të Unifikuar (drawer-overlay)
**Data:** 2026-06-24
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2C, commit ad5f383)

### Konteksti
Klik te kartë moduli → hap detyrat e filtruara. Pyetja: si t'i shfaqim? Modal? Drawer? Faqe e re?

### Vendimi
**Modal me të njëjtin pattern visual si drawer i krijimit të detyrës** (klasa `drawer-overlay` + `drawer-panel`). Konsistencë me UI ekzistues (Faza 2A.2):
- Overlay full-screen me rgba(15,23,42,0.55)
- Container max-width 920px, max-height 92vh
- Header me ikonë moduli + titull + count badge + buton mbyll
- Body: accordion (Kritike/Të rëndësishme/Normale/Të përfunduara) me **renderDenseRow ekzistues** (jo HTML i ri)
- Mbyllje: klik jashtë / ESC / buton mbyll

### Konsekuencat
- ✅ Konsistencë vizuale ndërmjet drawer dhe modal (njëjti pattern CSS)
- ✅ Ripërdorim total i `renderDenseRow` (DRY) — pa duplikim logjike rendering
- ✅ Bulk actions, expand, action buttons funksionojnë identik brenda modal-it
- ⚠️ Klasa `.ballina-modal-panel` shton max-width override mbi `.drawer-panel` standard — dokumentuar

---

## DEC-047: Period Filter + Role Filtering te Ballina (Implementim Real)
**Data:** 2026-06-24
**Statusi:** ⏳ Pjesërisht IMPLEMENTUAR (Faza 2C)

### Konteksti
Dashboard kishte period chips (Muaji/Viti) që nuk filtronin asgjë (dead code). User-i kërkoi implementim real. Po ashtu role filtering (staff sheh të vetat, mgmt sheh të gjitha).

### Vendimi
- **Period filter te dashboard.js**: variabla `__dashPeriod` ekzistonte. `renderAll()` përdoret nga ndryshim. **Mbeten të testohet vizualisht** se filtri prek vërtetë të dhënat — implementimi i plotë i logjikës month-vs-year do bëhet incremental.
- **Role filtering te Ballina**: helper `filtroSipasRolit()` ekziston te `auth.js`. Te detyrat.js përdoret `filtroSipasPermissions()` (Option B, DEC-030). Te ballina.js: `ballinaDetyratVisible()` thërret `filtroSipasPermissions` për module-cards. **Pjesërisht**: KPI dashboard nuk filtrohen nga role aktualisht.

### Konsekuencat
- ✅ Detyrat (module cards + modal) filtrohen sipas rolit korrekt
- ⚠️ KPI dashboard ende tregojnë data globale — fix incremental kur kërkohet nga user-i
- ⚠️ Period filter punon vetëm sa kujt ka logjikë te dashboard.js — testim manual i nevojshëm

### Trigger për implementim të plotë
Kur user-i raporton se "shoh kontrata të kolegut në KPI" → atëherë wrap KPI render me role filter në dashboard.js.

---

## DEC-048: KPI të Reja te Ballina (Borxh Total + Rinovime në Pritje + Aging Donut)
**Data:** 2026-06-24
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2C, commit ad5f383)

### Konteksti
Dashboard origjinal kishte 4 KPI (Kontrata Aktive / Skadojnë / Ofertat / Fatura). Mungonte signal direkt për:
- **Borxh total**: shuma e debitorëve aktivë (paratë e ngrirura)
- **Rinovime në pritje**: kontrata që duhen rinovuar tani

Plus dashboard duhet të kishte grafik për **aging debitorësh** (sa borxh në secilën bandë moshe).

### Vendimi
Shtim 2 KPI cards te Ballina (jo Dashboard, sepse Dashboard u zëvendësua):
- `kpi-borxh` — sum nga `debitoret_data_v1.borxh_total`, sub: "{N} debitorë", icon: alert-circle, kpi-icon-red
- `kpi-rinovime` — count nga `rinovimet_data` me statusi pa_filluar/kontaktuar, sub: "{N} urgjent ≤15d", icon: refresh-cw, kpi-icon-orange

Plus 1 chart i ri:
- `chart-debitor-aging` — donut me 4 banda: 0-30 / 31-60 / 61-90 / >90 ditë
- Data: agregim nga `debitoret_data_v1` (fields: `borxh_0_30`, `borxh_31_60`, `borxh_61_90`, `borxh_mbi_365`)

Total KPI tani: 6 (3-kolone në split, 6-kolone në full-dashboard).
Total donut chart: 3 (Llojit / Faturimit / Aging).

### Konsekuencat
- ✅ Signal i drejtpërdrejtë i parave të ngrirura (Borxh total)
- ✅ Lista e rinovimeve të afërta visible në KPI
- ✅ Aging analizë vizuale
- ⚠️ Schema `debitoret_data_v1.borxh_*` fields kërkohen — backfill nuk është automatik (mvc nga import excel)
- ⚠️ Donut Aging mund të tregojë gjithçka në `>90` nëse aging fields nuk janë populluar — fallback OK

---

## DEC-049: Headers për Panelet Ballina (sfond + emër moduli)
**Data:** 2026-06-26
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2D, commit b71af94)

### Konteksti
Pas Faza 2C, user-i raportoi që në split-view, dy panelet (Dashboard + Detyrat) ishin vizualisht të ngjashëm — vështirë të orientohej se ku ishte. Mungonte header me titull për secilin panel.

### Vendimi
Shtim i `.ballina-panel-header` te krye e secilit panel:
- Header me ikonë lucide (layout-dashboard / check-circle) + emër
- Font-size 14px, font-weight 500
- Padding 12px 16px, border-bottom 1px solid var(--s-border)
- **JO sticky** — për t'i lejuar user-it të bëjë scroll te i gjithë paneli

Sfond i ndryshëm për dallim subtil:
- Panel Dashboard: `var(--s-bg-flat)` (pak më i butë/gri)
- Panel Detyrat: `var(--s-bg)` (i bardhë default)

### Konsekuencat
- ✅ Orientim i menjëhershëm vizual ("ku jam në UI")
- ✅ Header ka edhe vend për butona (DEC-052: Shto detyrë + Përzgjedh)
- ⚠️ Margin: -4px -18px për të shkuar edge-to-edge brenda padding-ut të panelit

---

## DEC-050: Modal Full-Screen (100vh) për Ballina
**Data:** 2026-06-26
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2D, commit b71af94)

### Konteksti
Modal "Shih të gjitha" për module-cards kishte max-height 92vh me padding nga edges. Në mobile dhe edhe desktop split-view, kjo lejonte sfondin (panelat) të dukej nga anët, duke shkaktuar konfuzion mes kontekst-it të ri (modal) dhe kontekst-it ekzistues (panel).

### Vendimi
Modal tani full-screen 100vh:
- `height: 100vh; max-height: 100vh; border-radius: 0`
- Header sticky top:0 (mbetet i dukshëm kur user-i scroll-on)
- Body flex:1 overflow-y:auto
- Width: max-width 920px mbetet (jo full-width për readability)

### Konsekuencat
- ✅ Modal "fillon-mbaron" — konteksti aktual është modal, jo paneli
- ✅ Header gjithmonë i dukshëm gjatë scroll-it
- ⚠️ Animation drawerSlide ende vlen (slide nga djathtas)

---

## DEC-051: KPI Klik Hap Modal-in (jo Filter)
**Data:** 2026-06-26
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2D, commit b71af94)

### Konteksti
Te Faza 2C, KPI cards klikoheshin → filter detyrat në panel. Por kjo prishte view-in aktual (force `modul` view, filtrim modul) dhe user-i humbiste fokusin. User-i preferon që KPI të hapë të NJËJTIN modal si module-cards.

### Vendimi
KPI cards onclick → `hapModulModal('moduli')` (njësoj si klik te module-card).

Mapping KPI → moduli:
- `kpi-aktive` → 'kontratat'
- `kpi-skadon` → 'kontratat'
- `kpi-ofertat` → 'oferta'
- `kpi-leshuar` → 'faturimi'
- `kpi-borxh` → 'debitoret'
- `kpi-rinovime` → 'rinovimet'

Plus heqje e outline-it shtesë nga KPI cards (`outline: none; box-shadow: none`) — vendim shtesë i përdoruesit për pamje neutrale.

### Konsekuencat
- ✅ Konsistencë: KPI dhe module-card sjellin të njëjtin UX
- ✅ Pa "side-effect" panel-i (nuk forcohet modul view)
- ⚠️ User-i që dëshironte filter në panel duhet të përdorë view toggle manualisht

---

## DEC-052: Auto-Completion i Detyrave + Backfill Afatesh
**Data:** 2026-06-26
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2D, commit b71af94)

### Konteksti
Detyrat auto krijoheshin por nuk mbylleshin automatikisht kur veprimi i lidhur ndodhte. Shembull: detyra "Krijo kontratë për X" ngelte aktive edhe pasi user-i krijoi kontratën — duhej manualisht ta shënonte si të përfunduar. Frustrim i dokumentuar.

### Vendimi
Funksion i ri `kontrolloAutoCompletion()` te detyrat.js bootstrap (pas auto-gjenerimit). 4 sinjale që mbyllin automatikisht detyrat aktive:

| Detyra (rregulla) | Sinjali që e mbyll |
|---|---|
| `auto_oferta_konfirmuar_pa_kontrate` | `ofertat[].realizuar = true` |
| `auto_kontrate_skadim_30d` | Kontratë e re me `nga_rinovimi=ID` ose `kontrata.arkivuar=true` |
| `auto_rinovim_pa_filluar_15d` | `rinovimet_data[].statusi != 'pa_filluar'` |
| `auto_faturim_pa_kerkese_20d` | `faturimi_klientet[].statuset[muajiAktual] != 'asgje'` |

Kur sinjali aktivizohet:
- `statusi = 'e_perfunduar'`
- `data_perfundimit = sot`
- `perfunduar_nga = 'system_auto'`
- Shto aktivitet me `tipi: 'auto_completion'` dhe përshkrim
- Toast info "N detyra u plotësuan automatikisht" (pa undo)
- Badge i ri "Plotësuar automatikisht" te expanded view

**Vetëm `lloji='auto'`** — detyrat manuale nuk preken.

### Alternativat e Refuzuara
- ❌ **Sinjale me undo** — nëse auto-completion gabon, user-i e rikthen. Por (a) gabimet janë rare nëse sinjali është i saktë, (b) shton kompleksitet UI
- ❌ **Mbaj detyrat aktive deri sa user-i të mbyllë manualisht** — humb gjithë vlerën e automatizimit
- ❌ **Konfirmim modal "Konfirmoni mbylljen automatike?"** — fërkim i lartë, anulon vlerën

### Konsekuencat
- ✅ Detyrat nuk grumbullohen pas veprimit
- ✅ Audit trail i ruajtur (aktivitete[] me tipi:'auto_completion')
- ⚠️ Nëse user-i e quan veprimin "gabim" pas auto-completion, duhet ta rikthejë manualisht (statusi=e_re)
- ⚠️ Sinjali për `auto_kontrate_skadim_30d` kërkon që kontrata e re të ketë `nga_rinovimi` — kjo field nuk është implementuar ende universalisht; fallback te `arkivuar=true`

---

## DEC-053: Backfill Afatesh me Opsion A (Rikalkulim sipas Trigger-it)
**Data:** 2026-06-26
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2D, commit b71af94)

### Konteksti
Faza 2A/2B krijoi detyra auto pa afat të dedikuar (ose me afat = data e skadimit gjithmonë). Pas Faza 2D ku afati duhet të diferencohet sipas rregullës (psh trigger 30d → afat = mbarimi-5d), detyrat ekzistuese duhen përditësuar.

### Vendimi
Funksion `backfillAfatet()` që loop-on detyrat ekzistuese auto dhe rikalkulon `data_afati` sipas rregullit aktual të çdo trigger-i. Idempotent me flag `backfill_afatet_v1` te localStorage.

| Trigger | Rikalkulimi |
|---|---|
| `auto_kontrate_skadim_30d` | ≤7d → mbarimi; 8-30d → mbarimi-5d |
| `auto_rinovim_pa_filluar_15d` | data_mbarimit - 3d |
| `auto_debitor_365_pa_kontakt` | sot + 5d |
| `auto_oferta_konfirmuar_pa_kontrate` | sot + 3d |
| `auto_oferta_pare_35` | sot + 1d (mbetet) |
| `auto_faturim_pa_kerkese_20d` | data 25 e muajit aktual |
| `auto_oferta_skadim_5d` | SKIP (afati = dataSkadon e ofertes, nuk recalkulohet) |

### Alternativat e Refuzuara
- ❌ **Opsion B: Lër detyrat e vjetra siç janë, vetëm të rejat me afat të ri** — krijon inkonsistencë te listim/sortim sipas afatit
- ❌ **Opsion C: Re-create të gjitha detyrat auto (fshi + gjenero rishtazi)** — humb aktivitete, status, përgjegjësi caktuar manualisht

### Konsekuencat
- ✅ Detyrat e vjetra dhe të reja kanë afate konsistente
- ✅ Idempotent — nuk re-ekzekutohet (flag check)
- ✅ Logo statistika në console: "Përditësuar: N, Kapërcyer: M"
- ⚠️ Nëse user-i ka edituar afatin manualisht para backfill-it, përditësimi e mbishkruan
- ⚠️ Flag `backfill_afatet_v1` është një herësh; nëse rregullat ndryshojnë në të ardhmen, përdor `v2`

---

## DEC-054: parseDataAny — 3 Formate (ISO, pika, slash) — Konfirmuar me Data Reale
**Data:** 2026-06-28
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2D, commit b71af94)

### Konteksti
Faza 2D zbuloi që `parseDataAny()` te detyrat.js silent-skipte data DD/MM/YYYY (33 kontrata u injoruan). Pas fix-it, është verifikuar me data reale nga production.

### Vendimi (formalizim)
`parseDataAny(s)` mbështet 3 formate në renditjen e mëposhtme:

1. **ISO `YYYY-MM-DD`** — preferuar për `<input type="date">` value dhe storage të ri
2. **`DD.MM.YYYY`** (pika) — module legacy që përdorin këtë format
3. **`DD/MM/YYYY`** (slash) — kontratat, faturimi, rinovimet (format input UI shqip)
4. **Fallback `new Date(s)`** — për çdo gjë tjetër (përfshirë ISO me kohë `T00:00:00`)

### Konvencion për module të reja
- Storage të ri: përdor **ISO YYYY-MM-DD** (lehtë për t'u sortuar dhe parsuar)
- UI: input me `placeholder="dd/mm/yyyy"` është acceptable nëse parsohet me parseDataAny

### Konsekuencat
- ✅ Të gjitha modulet ekzistuese parsojnë data konsistent
- ✅ Triggers detyrash funksionojnë me të gjitha formats
- ⚠️ **MOS** përdor `new Date("DD/MM/YYYY")` direkt — return Invalid Date në Chrome. Përdor gjithmonë parseDataAny

---

## DEC-055: Topbar Detyrat 2-Rresht Layout
**Data:** 2026-06-28
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2D v2, commit b76784a)

### Konteksti
Pas Faza 2D, panel-header i Detyrave kishte 1 rresht: title + 2 butona. Filter chips + view toggle ndodheshin në një rresht të veçantë jashtë header-it. Pamja ishte e shpërndarë dhe kërkonte më shumë hapësirë vertikale.

### Vendimi
Konsoliduar gjithçka në **panel-header me 2 rreshta** (`.detyrat-panel-header`):
- **Row 1**: title ("Detyrat" + ikon) ↔ butona [Përzgjedh] [Shto detyrë]
- **Row 2**: filter chips (Të gjitha / Mia / Pa përgjegjës) ↔ view toggle (Modul / Prioritet)

CSS:
```css
.detyrat-panel-header {
  display: flex; flex-direction: column;
  gap: 8px; padding: 12px 16px;
  border-bottom: 1px solid var(--s-border);
  background: var(--s-bg-flat);
}
.detyrat-header-row1, .detyrat-header-row2 {
  display: flex; justify-content: space-between;
  align-items: center; gap: 10px; flex-wrap: wrap;
}
```

### Konsekuencat
- ✅ Të gjitha kontrollet e Detyrave të organizuar në një bllok të vetëm
- ✅ Hapësirë vertikale e zvogëluar (jo një rresht filter të ndarë)
- ✅ Konsistencë me `.ballina-panel-header` për Dashboard (subtilisht)

---

## DEC-056: Panel Background Ndryshim Dashboard vs Detyrat — Konfirmim
**Data:** 2026-06-28
**Statusi:** ✅ Approved + KONFIRMUAR (refinim i DEC-049)

### Konteksti
DEC-049 (Faza 2D) vendosi:
- Panel Dashboard: `var(--s-bg-flat)`
- Panel Detyrat: `var(--s-bg)`

Pas Faza 2D v2 ku panel-header i Detyrave ndryshoi në 2-rresht me background `var(--s-bg-flat)`, paneli kryesor i Detyrave mbetet `var(--s-bg)` (i bardhë default). Kontrasti subtil është:
- Header me var(--s-bg-flat) (gri i butë)
- Body me var(--s-bg) (i bardhë)

### Vendimi (konfirmim)
**Nuk ndryshohet vendimi i DEC-049.** Konfirmohet:
- Panel Dashboard (kontekst KPI/charts): `var(--s-bg-flat)` (gri i butë)
- Panel Detyrat (workspace veprimesh): `var(--s-bg)` (i bardhë default)
- Header i Detyrat (banner i sipërm): `var(--s-bg-flat)` (gri i butë)

### Konsekuencat
- ✅ Dy nivele ngjyrash në një panel të vetëm (header gri / body i bardhë)
- ✅ Distinkim midis paneleve: Dashboard gri / Detyrat i bardhë me header gri
- ✅ Konsistencë vizuale me konvencionin "kontekst informativ = gri, workspace = i bardhë"

---

## DEC-057: 3-Level Background System për Panel Distinction
**Data:** 2026-06-28
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2D v2 Task 6, commit 3777678)

### Konteksti
DEC-049 vendosi 2 nivele bg (--s-bg-flat për Dashboard panel, --s-bg për Detyrat). Por header-ët kishin të njëjtin bg si Dashboard panel — konfuzion vizual. Duhej 3 nivele.

### Vendimi
3 variabla të reja te `:root` për 3 nivele distincte:
- `--s-bg-0: #ffffff` — workspace (panel-detyrat), më i bardhë
- `--s-bg-1: #f8f9fb` — kontekst informativ (panel-dashboard), gri i butë
- `--s-bg-2: #eef0f4` — headers (panel headers), gri i ndërmjetëm

### Konsekuencat
- ✅ Header < panel kontekst < panel workspace — gradient natyral i ngjyrës
- ✅ Distinkim i qartë vizual midis 2 paneleve
- ⚠️ Variablat e vjetra --s-bg / --s-bg-flat ende ekzistojnë për kompatibilitet me modulet e tjera

---

## DEC-058: Bulk Select Surgical Update (Mbron Chart.js nga Re-render)
**Data:** 2026-06-28
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2D v2 Task 3a, commit 3777678)

### Konteksti
User-i raportoi që selektimi i një detyre (bulk select mode) bënte re-render të Chart.js charts në Dashboard → tooltips humbisnin, zoom state resetohej. Shkaku: `toggleSelected()` thirrte `renderAll()` → `renderAccordion()` → monkey-patch → `renderModuleCards()`. Ndryshimet DOM shkaktonin reflow → ResizeObserver Chart.js triggerohej → ri-paint.

### Vendimi
`toggleSelected()` tani bën **update kirurgjikal**:
```js
document.querySelectorAll(`.det-row-wrapper[data-id="${id}"]`).forEach(row => {
    row.classList.toggle('det-row-selected', _selectedIds.has(id));
    const cb = row.querySelector('.det-row-checkbox input');
    if (cb) cb.checked = _selectedIds.has(id);
});
```

Pa renderAll(), pa lucide.createIcons(), pa innerHTML change. Vetëm class toggle + checkbox.checked.

### Konsekuencat
- ✅ Chart.js mbetet i prekur — state ruhet midis selektimeve
- ✅ Performancë: O(1) update në vend të O(n) re-render
- ⚠️ Nën-grupimet (group header "Zgjidh të gjitha") prap thirrin renderAll() — ato janë jo-bulk-individual operations, dhe ndodhin më rrallë

---

## DEC-059: Greeting Global te Topbar (visible në full-detyrat)
**Data:** 2026-06-28
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2D v2 Task 5, commit 3777678)

### Konteksti
Greeting "Përshëndetje, Agon — Qershor 2026" ekzistonte vetëm te panel-dashboard. Kur user kalonte në full-detyrat mode, dashboard panel fshihet → greeting humbet → user humb sense identiteti.

### Vendimi
Greeting i ri minimal te topbar (jashtë panelesh):
- HTML: `<div class="topbar-greeting" id="topbarGreeting">` mes h1 dhe topbar-right
- Visible vetëm kur `_ballinaPoz === 'full-detyrat'` (kur dashboard panel hidden)
- Tekst: "Përshëndetje, {emri} — {muaji} {viti}"
- Default greeting i madh te panel-dashboard mbetet i paprekur

### Alternativat e Refuzuara
- ❌ **Move greeting nga panel-dashboard te topbar gjithmonë** — humbet greeting i madh me subtitle në kontekst dashboard
- ❌ **Dupliko greeting (visible në të dy vendet)** — redundancë vizuale në split mode

### Konsekuencat
- ✅ Greeting visible në çdo pozicion (3 layouts)
- ✅ Pa duplikim — 1 lokacion aktiv në çdo moment
- ⚠️ Logjika `getGreeting` u dyfishua (ballina.js + dashboard.js) — minor, ndajme funksion në të ardhmen nëse ndryshim formati

---

## DEC-060: Greeting në Topbar Qendër (jo brenda Panel)
**Data:** 2026-06-29
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2D v3, commit 353f4ae)

### Konteksti
DEC-059 (Faza 2D v2) vendosi greeting të vogël te topbar, visible vetëm në full-detyrat (kur dashboard panel hidden). Por user-i vuri re që greeting i madh te panel-dashboard ishte i shkëputur vizualisht nga topbar — vizualisht "humbur" në fund-majtas. Greeting duhet të jetë i menjëhershëm dhe i lidhur me identitetin e user-it në çdo pozicion.

### Vendimi
**Greeting tani GJITHMONË visible te topbar qendër**, jashtë paneleve:
- 2 rreshta: "Mirëmëngjes/Mirëdita/Mirëmbrëma, {emri}" + "Muaji Viti"
- Dinamik sipas orës (<12 = Mirëmëngjes, <18 = Mirëdita, ≥18 = Mirëmbrëma)
- Heqje nga panel-dashboard (h2 + subtitle e madhe nuk ka më vend)
- Hidden helpers për dashGreeting/dashSubtitle (kompatibël me dashboard.js)
- Pozicionim: topbar grid `auto 1fr auto` — h1 majtas, greeting qendër, bell+user djathtas

### Konsekuencat
- ✅ Greeting i menjëhershëm në çdo pozicion (3 layouts + mobile)
- ✅ Lidhje vizuale e qartë me topbar (identitet i user-it)
- ✅ Dinamik sipas orës — UX më personal
- ⚠️ Greeting i madh me h2 te panel-dashboard u zhduk — për arsye konsistence (jo dy greeting në të njëjtin moment)

### Lidhje
Zëvendëson logjikën conditional të DEC-059 (visible vetëm në full-detyrat). DEC-059 mbetet i regjistruar si pjesë e evolucionit por DEC-060 është final.

---

## DEC-061: Panel Headers Lartësi Identike (44px) + Ikona Majtas
**Data:** 2026-06-29
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2D v3, commit 353f4ae)

### Konteksti
Pas Faza 2D v2 task 7 (Detyrat panel-header 2-rresht), Dashboard header dhe Detyrat header (row1) nuk kishin lartësi identike. Kjo krijonte asimetri vizuale midis dy paneleve — content i Dashboard fillonte në një Y të ndryshëm nga content i Detyrat.

### Vendimi
**Të dy headers (row1) kanë `min-height: 44px`** dhe strukturë identike:
- `panel-header-left`: ikon + titull (majtas)
- `panel-header-actions`: butona ose chips (djathtas)
- Ikona: class `.panel-icon` me `color: var(--s-brand)`
- Titulli: class `.panel-title` me `font-weight: 600`

Ikona të standardizuara:
- Dashboard: `layout-dashboard`
- Detyrat: `check-square` (jo `check-circle` siç ishte)

### Konsekuencat
- ✅ Content i të dy paneleve fillon në të njëjtën Y → simetri vizuale
- ✅ Klasa e re `.panel-icon` + `.panel-title` ripërdorshme për module të reja
- ⚠️ Detyrat panel-header tani ka 2 rreshta (row1 me min-height 44px + row2 me filter/toggle)

---

## DEC-062: Detyrat Panel Border Vijëzim me Dashboard (Container)
**Data:** 2026-06-29
**Statusi:** ✅ Approved + IMPLEMENTUAR (Faza 2D v3, commit 353f4ae)

### Konteksti
Të dy panelet shfaqen "lirisht" — pa border që i bashkon vizualisht. Kjo bën që ato të duken si dy faqe të veçanta, jo si dy seksione të një faqe të vetme.

### Vendimi
Wrap të dyja panelet (plus divider) brenda `.ballina-layout` me border container:
```css
.ballina-layout {
  border: 1px solid var(--s-border);
  border-radius: 12px;
  overflow: hidden;
  margin: 0 16px 16px;
}
```

Plus heqje e padit-it të brendshëm — panelet shtrihen edge-to-edge brenda container-it.

### Alternativat e Refuzuara
- ❌ **Heqje totale e divider-it** (zëvendësuar me border-right te dashboard panel) — humbet funksionaliteti i 3 shigjetave për pozicione
- ❌ **Gap mes paneleve** (jo border) — humbet vijëzimi vizual

### Konsekuencat
- ✅ Dy panelet duken si një entitet i bashkuar
- ✅ Border-radius i jep formën card-like të platformës
- ✅ Divider-i me shigjeta mbetet i papreur (3 pozicione)
- ⚠️ Overflow:hidden mbi border-radius mund të kufizojë popup-et që dalin jashtë layout — i pranueshëm

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
