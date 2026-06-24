# Architecture - SIGAL Health Platform

> Përshkrim teknik i platformës: stack, struktura, data models, dhe rrjedha e të dhënave.

---

## 🏗️ Tech Stack

### Frontend
- **HTML5 / CSS3 / Vanilla JavaScript** (pa framework)
- **Font:** Montserrat (Google Fonts CDN)
- **Icons:** Lucide Icons CDN (`<i data-lucide="...">`)
- **Charts:** Chart.js (CDN, për dashboard dhe raportet)
- **Hosting:** Vercel (auto-deploy nga `main` branch)

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **CORS:** `cors` package
- **Document generation:** `docxtemplater` + `pizzip` + custom XML manipulation
- **Document generation (shtesë):** officegen, fast-xml-parser, jszip
- **Email:** Brevo API (HTTP, jo SMTP - sepse Railway bllokon SMTP)
- **Email (DEPRECATED, ende në package.json):** nodemailer (Railway bllokon SMTP, mos përdor)
- **Hosting:** **Render Free Tier** (Frankfurt, auto-deploy nga `main` branch) — migrim 2026-05-07, shih DEC-028
- **Anti-sleep:** UptimeRobot ping te `/api/health` çdo 5 min

### Storage
- **Frontend primary:** `localStorage` (browser) — kontratat, ofertat, klientet faturimi, rinovimet, debitorët, detyrat, stafi
- **Backend memory:** `ofertaStore{}`, `ofertaTracking{}` — humbet me Render restart
- **Supabase mini (Faza 2B, DEC-042):** Vetëm tabela `oferta_tracking` për persistencë view-counter (trigger #6). Dual-write me in-memory fallback. **NUK** është migrim i plotë; ofertat/kontratat data mbeten te localStorage (DEC-001).
- **Planifikuar i plotë:** Migrim te Supabase për gjithë data (DEC-PROPOSED-001) kur volumi justifikon

---

## 📁 Struktura e Folderave

```
sigal-platform/
├── css/
│   ├── theme-v2.css       ← MAIN theme (~1800 lines, glassmorphism + Montserrat)
│   ├── pako-editor.css    ← Spreadsheet styles (oferta + kontratat)
│   ├── theme.css          ← OLD (i papërdorur, vetëm referencë)
│   ├── kontratat.css      ← Module-specific (legacy)
│   ├── dashboard.css      ← Module-specific (legacy)
│   ├── faturimi.css       ← Module-specific (legacy)
│   ├── oferta.css         ← Module-specific (legacy)
│   ├── module-shared.css  ← Shared styles për module të ndryshëm
│   └── style.css          ← Legacy
├── js/
│   ├── auth.js                 ← Login/logout, role management
│   ├── main.js                 ← Bell notifications, sidebar, filtroSipasRolit
│   ├── pakot.js                ← Të dhënat e pakove (constants)
│   ├── kontratat.js            ← REFERENCE module logic
│   ├── oferta.js               ← Logjika e ofertave (admin)
│   ├── oferta-tracking.js      ← Status tracking për oferta
│   ├── faturimi.js             ← Logjika e faturimit
│   ├── rinovimet.js            ← Logjika e rinovimeve
│   ├── debitoret.js            ← Logjika e debitorëve
│   ├── dashboard.js            ← Dashboard widgets + charts
│   ├── raportet.js             ← Raportet (1989 lines)
│   ├── stafi.js                ← Stafi + organogram
│   ├── detyrat.js              ← Detyrat (6 auto-triggers, dense rows, bulk actions)
│   ├── ballina.js              ← Ballina split-view orkestrim + 6 module-cards + modal (Faza 2C)
│   └── gjenero-kontrate.js     ← Word contract generation (përdoret nga server.js)
├── js-server/                 ← Module server-only (jo për frontend)
│   └── supabaseClient.js       ← Klient Supabase fallback-safe (Faza 2B)
├── pages/
│   ├── kontratat.html          ← REFERENCE
│   ├── oferta.html
│   ├── oferta-view.html        ← Faqe publike për klientin
│   ├── faturimi.html
│   ├── rinovimet.html
│   ├── debitoret.html
│   ├── dashboard.html
│   ├── raportet.html
│   ├── stafi.html
│   ├── detyrat.html             ← Detyrat module (Faza 2A.2) — ende disponueshme
│   ├── ballina.html             ← Faqja kryesore (Faza 2C, Dashboard + Detyrat split-view)
│   └── dashboard.html           ← Redirect stub te ballina.html (Faza 2C, mbetet 1-2 javë)
├── templates/                  ← Word templates (.docx)
│   ├── kontrata-individ.docx
│   ├── kontrata-familje.docx
│   ├── kontrata-biznes.docx
│   ├── PAKOT_INDIVID_BAZE.docx
│   ├── PAKOT_INDIVID_STANDARD.docx
│   ├── PAKOT_INDIVID_STANDARD PLUS.docx
│   ├── PAKOT_FAMILJE_DHE_BIZNES_BAZE.docx
│   ├── PAKOT_FAMILJE_DHE_BIZNES_STANARD.docx       ← Note: typo intentional in filename
│   ├── PAKOT_FAMILJE_DHE_BIZNES_STANDARD_PLUS.docx
│   ├── PAKOT_FAMILJE_DHE_BIZNES_PREMIUM.docx
│   ├── PAKOT_FAMILJE_DHE_BIZNES_SILVER.docx
│   ├── PAKOT_FAMILJE_DHE_BIZNES_GOLD.docx
│   ├── PAKO_JETE_PLUS_CASH.docx
│   ├── PAKO_OPINIONI_I_DYTE_MJEKESOR.docx
│   └── aneksi2.docx
├── output/                     ← Generated Word docs (runtime)
├── server.js                   ← Backend Express server
├── package.json
├── index.html                  ← Login page
├── Sigal-KS-Logo.webp
└── README.md + docs/
```

---

## 🔗 Backend Endpoints

### Server: `server.js`

| Endpoint | Method | Përshkrim |
|---|---|---|
| `/api/health` | GET | Health check (Render + UptimeRobot) — kthe `{status:'ok',uptime,...}` |
| `/api/gjenero-kontrate` | POST | Gjeneron Word kontratë (përdor `js/gjenero-kontrate.js`) |
| `/api/gjenero-oferte` | POST | Gjeneron Word ofertë me limite custom |
| `/api/konfirmo-oferte` | POST | Dërgon email konfirmimi (Brevo) |
| `/api/oferta-track` | POST | Tracking events (hapje, koha, konfirmim) — **dual-write** te Supabase për event=hapje (Faza 2B) |
| `/api/oferta-status/:id` | GET | Lexon statusin e ofertës |
| `/api/oferta-derguar` | POST | Markon ofertën si "e dërguar" |
| `/api/oferta-tracking/:id` | GET | (Faza 2B) Kthen `{here_pare, data_pare_pare, data_pare_fundit}` (Supabase primary, memory fallback) |
| `/api/oferta-tracking-bulk` | POST | (Faza 2B) Body `{ids:[...]}` (max 100) — bulk read për trigger #6 |
| `/api/oferta-save` | POST | Ruan oferta në backend memory (cross-device viewing) |
| `/api/oferta-sync-all` | POST | Bulk push i të gjitha ofertave nga agjenti |
| `/api/oferta-data/:id` | GET | Kthen ofertën specifike (përdoret nga oferta-view.html) |
| `/api/shkarko/:fileName` | GET | Download i skedarit të gjeneruar |

### Backend URL
- **Production:** `https://sigal-platform.onrender.com`
- **Health check:** `https://sigal-platform.onrender.com/api/health`

### Render Environment Variables

```
PORT                  # auto nga Render
NODE_VERSION          # 20.0.0 (sipas render.yaml)
BREVO_API_KEY         # vendoset manualisht (sync:false në yaml)
SENDER_EMAIL          # gjonbalajagon@gmail.com
SUPABASE_URL          # (Faza 2B) p.sh. https://xxx.supabase.co
SUPABASE_SECRET_KEY   # (Faza 2B) service_role key — vetëm backend
```

> ⚠️ Brevo "Authorized IPs" duhet të jetë i disable (ose Render IP të shtohet manualisht — IP mund të ndryshojë)
> ⚠️ Supabase **service_role** key (jo anon!) — RLS bllokon klientin direkt, vetëm backend kalon

---

## 🗄️ Supabase Integration (Faza 2B / DEC-042)

**Scope:** Mini — vetëm tracking views, jo migrim i plotë i të dhënave.

### Tabela: `oferta_tracking`

```sql
CREATE TABLE oferta_tracking (
  id BIGSERIAL PRIMARY KEY,
  oferta_id TEXT NOT NULL UNIQUE,    -- stable id (oft_xxx)
  here_pare INTEGER NOT NULL DEFAULT 0,
  data_pare_pare TIMESTAMPTZ,
  data_pare_fundit TIMESTAMPTZ,
  ip_agjent TEXT,
  user_agent_pare TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS:** Enabled, policy `USING (false)` — vetëm `SUPABASE_SECRET_KEY` kalon.

### Data Flow — Trigger #6

```
                       ┌─────────────────────┐
                       │  Klienti hap link   │
                       │  oferta-view.html   │
                       │  ?id=oft_xxx        │
                       └──────────┬──────────┘
                                  │ trackHapje()
                                  ▼
                   ┌──────────────────────────────┐
                   │  POST /api/oferta-track      │
                   │  { ofertaId, event:'hapje' } │
                   └──────────────┬───────────────┘
                                  │
                       ┌──────────┴──────────┐
                       │                     │
                       ▼                     ▼
              ┌────────────────┐    ┌─────────────────┐
              │ ofertaTracking │    │  Supabase       │
              │  (in-memory)   │    │  upsert/update  │
              │  PRIMARY       │    │  PERSISTENT     │
              └────────────────┘    └─────────────────┘
                                              │
                                              │ async
                                              ▼
                                     ┌──────────────────┐
                                     │ oferta_tracking  │
                                     │ here_pare++      │
                                     └──────────────────┘

                       ┌─────────────────────┐
                       │  detyrat.html hapet │
                       └──────────┬──────────┘
                                  │ skanoOfertaParEHere35()
                                  ▼
                  ┌──────────────────────────────────┐
                  │ POST /api/oferta-tracking-bulk   │
                  │ { ids: [oft_a, oft_b, ...] }     │
                  └──────────────┬───────────────────┘
                                 │
                       ┌─────────┴──────────┐
                       │                    │
                       ▼                    ▼
              ┌──────────────────┐  ┌────────────────┐
              │  Supabase SELECT │  │ Memory fallback│
              │  WHERE id IN(...)│  │ për ids që     │
              │  PRIMARY         │  │ mungojnë       │
              └────────┬─────────┘  └────────────────┘
                       │
                       ▼
              ┌──────────────────────────────┐
              │ Për secilën me here_pare 3-5:│
              │ krijo detyrë kritike auto    │
              │ (de-dup me makeRregullKey)   │
              └──────────────────────────────┘
```

### Fallback behavior

| Skenari | Sjellja |
|---|---|
| Supabase OK | Primary = Supabase; memory si cache + speed boost |
| Supabase down | Backend log warning; memory bëhet sole; **trigger #6 prap punon** për oferta që janë në memory |
| Env vars mungojnë (dev) | `supabaseClient.js` eksporton `null`; backend startup OK; trigger #6 lexon vetëm memory |
| Render restart | Memory humbet; Supabase ruan; pas restart, oferta të vjetra mund të humbasin disa view-ime memory-only që s'u sinkronizuan |

### Konvencione

- **Çelësi** te `oferta_tracking.oferta_id` është **stable id** (`oft_xxx`), JO array index
- Oferta links e gjeneruara nga `kopjoLink`/`dergoEmail` përdorin stable id (Faza 2B në `js/oferta.js`)
- Oferta legacy me URL `?id=N` (numeric) prap funksionojnë te tracking (Supabase mban çfarëdo string), por NUK triggerojnë #6 sepse detyrat.js filtron vetëm me stable id

---

## 💾 Data Models (localStorage)

### `user_aktual` (Auth)
```javascript
{
    username: 'agon',
    emri: 'Agon Gjonbalaj',     // jo emriPlote
    role: 'superadmin',          // jo roli
    dega: 'Drejtoria Qendrore'
}
```

**Rolet:**
- `superadmin` - qasje e plotë
- `management`, `dep_management`, `ceo`, `deputy_ceo`, `director`, `deputy_director` - shohin gjithçka
- `staff_hq`, `staff` - vetëm të dhënat e veta

### `kontratat`
```javascript
{
    emri, lloji,                 // 'individ' | 'familje' | 'biznes'
    adresa, nrBiznesit, nrPersonal,
    perfaqesuesi, pozita,
    dataKontrates, fillimi, mbarimi,
    pakot: [],                   // emrat
    pakotData: [{...}],          // pakot e plota me limite custom
    email, faturimiLloji,        // 'mujor' | 'vjetor'
    dataKrijimit, arkivuar: bool,
    krijuarNga: 'username',
    krijuarNgaEmri: 'Emri Mbiemri'
}
```

### `ofertat`
```javascript
{
    emri, lloji, email,
    kerkuarNga,                  // 'direkt' | 'online' | 'agjenti'
    agjenti,
    pakot: [{ id, zona, shuma, hospitalore, ambulantore, primi_madh, primi_femije, tjera_pikat[] }],
    krijuarNga, krijuarNgaEmri, krijuarNgaEmail,
    dataKrijimit, dataSkadon,    // +30 ditë
    realizuar: bool,
    konfirmuar: bool,
    pakaZgjedhur: 'emri',
    komentKlient: '',
    dataKonfirmimit,
    totalMujor: number,          // Total i kalkuluar - Faza 14
    extras: [                    // Extras të zgjedhura nga klienti - Faza 14
        { type: 'jete' | 'opinion', data: {...} }
    ],
    versione: [                  // history of changes
        {
            data, pakot,
            burim: 'krijim_fillestar' | 'edit_agjenti' | 'konfirmim_klient',
            ...
        }
    ],
    notification: { type, msg, data, lexuar }
}
```

### `faturimi_klientet`
```javascript
{
    emri, kontrataNr, nrPersonal, nrBiznesit, lloji,
    dataFillimit, dataMbarimit,
    dergesa,                     // 'email' | 'direkt' | 'poste'
    email, afati,
    faturimiLloji,               // 'mujor' | 'vjetor'
    statuset: {                  // muaji 1-12 → status
        1: 'asgje' | 'kerkesa' | 'process' | 'leshuar',
        2: '...',
        ...
    },
    krijuarNga, krijuarNgaEmri
}
```

### `rinovimet_data`
```javascript
{
    id, muaji,                   // 'maj_2026'
    nr_kontrates, kontraktues_id, kontraktuesi, dega, agjenti,
    data_fillimit, data_mbarimit,
    primi_vjetor, total_primi,
    deme_nr_paguar, deme_vlera_paguar,
    deme_nr_pezull, deme_vlera_pezull,
    deme_total_nr, deme_total_vlera,
    shpenzimet, kosto_totale,
    lr_percent,                  // deme/primi
    cr_percent,                  // (deme + shpenzime) / primi
    statusi,                     // 'pa_filluar' | 'kontaktuar' | 'rinovuar' | 'humbur'
    komente: [{teksti, autori, data, tipi}],
    humbje_arsyeja, humbje_koment,
    kontrata_derguar, kontrata_derguar_data,
    importi_id, importuar_nga, created_at, updated_at
}
```

### `debitoret_data_v1`
```javascript
{
    id, muaji,
    klienti, klienti_normalized, agjenti, dega,
    debitori_total,
    'borxh_0_31', 'borxh_31_60', 'borxh_61_90',
    'borxh_91_180', 'borxh_181_365', 'borxh_mbi_365',
    e_pamaturuar,
    statusi,                     // 'i_ri' | 'kontaktuar' | 'premtim_pagese' | 'paguar_total' | 'paguar_pjesshem' | 'kontestuar' | 'i_pamundshem'
    shuma_paguar, data_pageses, premtim_data, premtim_shuma,
    komente: []
}
```

### `stafi`
```javascript
{
    emri, mbiemri, pozita, email, telefoni,
    username, password, role, dega,
    dataShtimit
}
```

### Të Tjera (transfer keys)
- `oferta_per_kontrate` - bart nga oferta te kontratat
- `rinovim_per_kontrate` - bart nga rinovimi te kontratat
- `rinovimet_imports`, `debitoret_imports_v1` - metadata e import-eve
- `agjent_dega_overrides_v1` - manual overrides

---

## 🔄 Data Flow (Rrjedhat e të Dhënave)

### Flow 1: Krijimi i Ofertës (Klient i Ri)

```
Agjenti: oferta.html (krijim)
    ↓ ruan në localStorage
ofertat[i].versione = [{burim: 'krijim_fillestar', ...}]
    ↓
Agjenti dërgon email/link te klienti
    ↓ POST /api/oferta-derguar (statusi: 'e_derguar')
Klienti: oferta-view.html?id=X
    ↓ shfaq pakot, klienti zgjedh
Klienti konfirmon
    ↓ POST /api/konfirmo-oferte (Brevo email te agjenti + klienti)
    ↓ ruan version i ri: {burim: 'konfirmim_klient', pakot: [zgjedhura]}
    ↓ ofertat[i].konfirmuar = true
    ↓ ofertat[i].notification = {type: 'konfirmim', lexuar: false}
    ↓
Agjenti sheh badge në tabelë → hap drawer (notification.lexuar = true)
    ↓ spreadsheet locked, banner jeshil "Klienti konfirmoi"
```

### Flow 2: Oferta → Kontratë

```
Agjenti klikon "Kontratë" në ofertë të konfirmuar
    ↓ ofertat[i].realizuar = true
    ↓ localStorage.setItem('oferta_per_kontrate', JSON.stringify(oferta))
    ↓ redirect to kontratat.html?nga_oferta=true
Kontratat: drawer hapet me të dhëna pre-filled
    ↓ pakot locked (nga konfirmimi i klientit)
Agjenti plotëson të dhëna shtesë (data, adresa) dhe ruan
    ↓ kontratat[].push({...})
    ↓ AUTO: faturimi_klientet[].push({...})  // transfer automatik
```

### Flow 3: Kontratë → Faturim

```
Kontratë e re ruhet
    ↓ ruajKontrate() në kontratat.js
    ↓ AUTO push në faturimi_klientet me:
        - emri, kontrataNr (nrPersonal/nrBiznesit), lloji
        - dataFillimit, dataMbarimit, email
        - faturimiLloji ('mujor' | 'vjetor')
        - statuset: { 1-12: 'asgje' }
```

### Flow 4: Kontratë → Rinovim (skadim)

```
Bell notification (main.js):
    - kontratë me <30 ditë skadim → notification reminder
Klikon te bell → rinovimet.html?hap=ID
    ↓ drawer hap automatikisht me kontratën
Agjenti ndryshon status: pa_filluar → kontaktuar → rinovuar/humbur
    ↓ Klikon "Përgatit & Dërgo Kontratën"
    ↓ localStorage.setItem('rinovim_per_kontrate', JSON.stringify(...))
    ↓ redirect to kontratat.html?nga_rinovimi=ID
Kontratat: drawer hap me të dhëna nga kontrata e vjetër + data +1 vit
```

### Flow 5: Word Generation (Kontratat)

```
Agjenti klikon "Word"
    ↓ POST /api/gjenero-kontrate
        body: { kontrata, pakotData[] }
    ↓ server.js → js/gjenero-kontrate.js:
        1. Lexo template (kontrata-individ/familje/biznes.docx)
        2. applyCustomValues() → zëvendëso limite në pako templates
        3. Inject pakot te {~pakot} placeholder
        4. docxtemplater render për fushat tjera
        5. Merge aneksi2.docx (vetëm media, jo OLE)
        6. Save në /output/, return filename
    ↓ GET /api/shkarko/:filename → download
```

---

## 📊 Pakot (PAKOT.js Structure)

### Individ (3 pako)
- `individ_baze` - KS, €20k, €270/vit
- `individ_standard` - KS+ALB, €30k, €360/vit
- `individ_standard_plus` - 7 vende, €50k, €450/vit

### Familje/Biznes (6 pako)
- `fb_baze` - KS, €20k
- `fb_standard` - KS+ALB, €30k
- `fb_standard_plus` - 7 vende, €50k
- `fb_premium` - 7 vende, €70k
- `fb_silver` - +TR, €100k
- `fb_gold` - Bota (pa SHBA/CA/CH), €200k

### Opsionale
- `jete_plus_cash` - €2/muaj (çmim varion sipas moshës/gjinisë)
- `opinioni_dyte` - €1/muaj / €12/vit

### `tjera_pikat[]` (9 fusha, indeks 0-8)

| Index | Përfitim |
|---|---|
| 0 | Shtatzënia |
| 1 | Dentar |
| 2 | Optik |
| 3 | Dëgim |
| 4 | Psikiatrik |
| 5 | Fizioterapi |
| 6 | Autoambulanca |
| 7 | Aksidenti |
| 8 | Onkologjike |

### Hospitalore (7 pika - njëjtë për të gjitha)
1. Mjeku i përgjithshëm
2. Mjeku specialist
3. Operacion
4. Kujdes intensiv
5. Kontrolle diagnostifikuese (rreze X, CT, MRI, PET)
6. Analiza laboratorike
7. Ilaçe

### Ambulantore (6 pika)
1. Mjeku i përgjithshëm
2. Mjeku specialist
3. Kirurgji ditore
4. Kontrolle diagnostifikuese
5. Analiza laboratorike
6. Ilaçe

---

## 🌍 Degët

`HQ`, `Prishtinë`, `Prizren`, `Ferizaj`, `Pejë`, `Gjilan`, `Gjakovë`, `Mitrovicë`

---

## 🔧 Document Generation - Detaje Teknike

### Word Template Structure
- Placeholder-at standardë: `{EMRI}`, `{ADRESA}`, `{NR_PERSONAL}`, `{NR_BIZNESIT}`, `{PERFAQESUESI}`, `{POZITA}`, `{DATA_KONTRATES}`, `{DATA_FILLIMIT}`, `{DATA_MBARIMIT}`, `{KONTRAKTUESI_EMRI}`, `{EMRI_KLIENTIT}`, `{POZITA_KLIENTIT}`
- Special: `{~pakot}` - placeholder ku injektohen pako templates

### Radha e dokumentit:
1. Body i kontratës (terms & conditions)
2. "Aneksi 1 – Lista e Përfitimeve dhe Primet"
3. Pako templates (në `{~pakot}` position)
4. Sekcioni i nënshkrimit
5. Aneksi 2 (vetëm media, OLE objects të hequra)

### ROW_MAP (template Word → fusha pakot)
```javascript
{
    1: 'zona', 2: 'shuma',
    19: 'tjera_0', ..., 27: 'tjera_8',
    29: 'primi_madh', 30: 'primi_femije'
}
HOSP_ROWS = [4..10]    // hospitalore
AMB_ROWS = [12..17]    // ambulantore
```

### Çka punon ✅ / Çka NUK punon ❌
- ✅ Limite custom (kur klienti ka modifiku oferta)
- ✅ Multiple pakot bashkohen me page break
- ✅ Aneksi 2 media (images)
- ❌ Aneksi 2 embedded Word doc (OLE objects të hequra)
- ❌ Nënshkrimi mund të ndahet mes faqeve (page break control mungon)
- ❌ Faqe boshe para Aneks 2 (nga template origjinal)

---

## 🔐 Auth Flow

```
index.html (login form)
    ↓ user submit username + password
    ↓ auth.js → login()
    ↓ kontrollo në `stafi` localStorage (ose hardcoded superadmin)
    ↓ Sukses: localStorage.setItem('user_aktual', {...})
    ↓ redirect to dashboard.html

Çdo faqe tjetër:
    ↓ DOMContentLoaded
    ↓ checkAuth() në auth.js
    ↓ Nëse !user_aktual → redirect to index.html
    ↓ Aplikoji role-based filtering: filtroSipasRolit(data, 'krijuarNga')
```

---

## 📡 External Services

| Shërbimi | Përdorim | API/Limit |
|---|---|---|
| **Brevo** | Email transactional | 300/ditë (free tier); IP authorization OFF |
| **Vercel** | Frontend hosting | Auto-deploy nga `main` |
| **Render** | Backend hosting | Free tier (750h/muaj), Frankfurt; auto-deploy nga `main` |
| **UptimeRobot** | Anti-sleep ping | Health check `/api/health` çdo 5 min (free tier) |
| **Railway** | ❌ DEPRECATED (zëvendësuar nga Render — DEC-028) | - |
| **Google Fonts** | Montserrat | CDN |
| **Lucide Icons** | UI icons | CDN |
| **Chart.js** | Charts | CDN |
| **Resend** | ❌ DEPRECATED (zëvendësuar nga Brevo) | - |
| **Nodemailer** | ❌ DEPRECATED (Railway bllokon SMTP) | - |

---

## 🚦 Rules & Conventions

### File Naming
- ✅ `oferta.js` / `oferta.html` (JO `oferte.js`)
- ✅ `oferta-view.html` (klient-facing)
- ✅ `gjenero-kontrate.js` është në `js/` folder

### JavaScript
- `parseDate()` - trajton `dd/mm/yyyy` dhe `yyyy-mm-dd`
- `formatData()` - konverton `yyyy-mm-dd` → `dd/mm/yyyy`
- `filtroSipasRolit(data, fushaKrijuesi)` - case-insensitive
- Lucide icons në `innerHTML` → përdor `<i data-lucide="...">` + `lucide.createIcons()` PASTAJ
- `PizZip folder().forEach` → JO funksion - përdor `Object.keys(zip.files).forEach()`

### Encoding
- ⛔ KURRË mos përdor PowerShell `Set-Content -Encoding UTF8` (korrupton ë, ç)
- ✅ Përdor VS Code ose Notepad për edit HTML

### Git Workflow
```bash
git add .
git commit -m "Mesazh i qartë"
git push
```
- Vercel auto-deploy
- Railway auto-deploy (nëse aktiv)

---

*Për gjendjen aktuale, shih STATUS.md. Për vendimet, shih DECISIONS.md.*
