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
