# SIGAL Platform — Migration Context për Claude Code

**Data:** 2026-04-19
**Përdoruesi:** Agon Gjonbalaj (jo-teknik, shqip)
**Projekti:** sigal-platform-shendet.vercel.app
**Backend:** sigal-platform-production.up.railway.app/api/
**Stack:** HTML/CSS/JS vanilla + Railway Node.js backend

---

## 🎯 OBJEKTIVI KRYESOR

Migrimi i të gjitha faqeve në **theme-v2 design system** duke marrë si referencë **`pages/kontratat.html`** + **`js/kontratat.js`** (moduli i vetëm i përfunduar plotësisht).

**Çdo modul duhet të duket dhe sillet si kontratat.**

---

## 📊 STATUSI I MIGRIMIT

| Modul | HTML | JS | Status | Shënime |
|---|---|---|---|---|
| **kontratat** | ✅ | ✅ | Complete (reference) | Përdore si model |
| **raportet** | ✅ | ⚠️ | Partial | CSS migruar, duhet graph charts shtesë |
| **stafi** | ✅ | ✅ | Complete | KPI + drawer + organogram |
| **oferta** | ✅ | ✅ | Needs polish | KPI nuk filtron, butonat e tabelës të prishur, llojet duhen majtas |
| **rinovimet** | ❌ | ❌ | CSS link u ndryshua por HTML/JS i vjetër | Migration pending |
| **debitoret** | ❌ | ❌ | CSS link u ndryshua por HTML/JS i vjetër | Migration pending |
| **faturimi** | ❌ | ❌ | CSS link u ndryshua por HTML/JS i vjetër | Migration pending |
| **dashboard** | ❌ | ❌ | Duhet redesign komplet | Graph charts + donut + bars/tabela toggle |
| **oferta-view** | ❌ | ❌ | Client-facing page | Tjetër prioritet, por duhet migruar |

---

## 🎨 DESIGN SYSTEM (theme-v2.css)

### Brand
- **Primary gradient:** `#1e3a8a → #3b82f6 → #60a5fa` (royal blue soft)
- **Font:** Montserrat (Google Fonts)
- **Background:** `linear-gradient(135deg, #f4f5f7 0%, #f0f1f4 40%, #ecedf0 100%)`
- **Glass:** `rgba(255,255,255,0.82)` + `backdrop-filter: blur(20px)`

### CSS Variables (të gjitha në `:root`)
```css
--s-brand-dark:  #1e3a8a;
--s-brand:       #3b82f6;
--s-brand-light: #60a5fa;
--s-green: #059669; --s-green-dot: #10b981;
--s-orange: #d97706; --s-orange-dot: #f59e0b;
--s-red: #dc2626; --s-red-dot: #ef4444;
--s-text: #0f172a; --s-text-sub: #4b5563; --s-text-muted: #7c8aa8;
--r-sm: 8px; --r-md: 12px; --r-lg: 16px;
--sh-sm/md/lg/brand (shadows);
--sidebar-w: 76px;
```

### NDALOHEN
- ❌ `#002B5C` (navy i vjetër — përdor brand gradient)
- ❌ `#6366f1`, `#8b5cf6` (purple — përdoruesi urren)
- ❌ IBM Plex Sans, Inter (përdor Montserrat)
- ❌ Inline `style=""` kudo që ka klasë
- ❌ Pill/tag për numra në tabelë (plain text)

---

## 📐 STRUKTURA STANDARDE E ÇDO FAQE

```
┌─────────────────────────────────────────────────┐
│ TOPBAR                                          │
│ [Titulli gradient]    [btn] [🔔] [👤 User]     │
├─────────────────────────────────────────────────┤
│ TABS + PERIOD FILTER                            │
│ [Aktive 24] [Skaduar 1]        [Viti][Muaji]   │
├─────────────────────────────────────────────────┤
│ KPI CARDS (4 glassmorphism, clickable)          │
│ [📊 Total][✅ X][⚠️ Y][❌ Z]                    │
├─────────────────────────────────────────────────┤
│ FILTERS ROW                                     │
│ [Lloji▾] [Agjenti▾] [Kërko...] [Chips] [Sort]  │
├─────────────────────────────────────────────────┤
│ TABLE (glassmorphism)                           │
└─────────────────────────────────────────────────┘
```

### Topbar Pattern
```html
<div class="topbar">
    <h1>Titulli</h1>
    <div class="topbar-right">
        <button class="btn-primary" onclick="...">
            <i data-lucide="plus"></i> Veprim
        </button>
        <!-- bell + user tag injektohen automatikisht nga main.js -->
    </div>
</div>
```

### KPI Cards Pattern (CLICKABLE + FILTRON)
```html
<div class="stats-strip">
    <div class="kpi-card" data-filter="all">
        <div class="kpi-icon kpi-icon-total"><i data-lucide="bar-chart-3"></i></div>
        <div class="kpi-body">
            <div class="sm-lbl">Total</div>
            <div class="sm-num" id="st-total">0</div>
        </div>
        <div class="kpi-arrow"><i data-lucide="arrow-up-right"></i></div>
    </div>
    <!-- Variantet: kpi-icon-aktive (green), kpi-icon-skadon (orange), kpi-icon-skaduar (red) -->
</div>
```

### Llojet Chips (MAJTAS, PARA FILTRIT LLOJI)
**KUSHT I RI (feedback nga Agon):**
- Llojet chips (Individ/Familje/Biznes) duhen vendosur **MAJTAS filter row**
- **HIQ** filtrin e parë `<select id="filter-lloji">` sepse chips e bëjnë atë punë
- Numrat brenda chips duhet të kenë **ngjyra të njëjta si KPI boxes** (blue=Individ, purple=Familje, green=Biznes — si te kontratat)

```html
<div class="filters-row">
    <!-- MAJTAS: Llojet chips (zëvendësojnë select-in) -->
    <div class="llojet-chips-inline" id="llojet-chips"></div>
    <!-- Pastaj: agjenti select, search, sort -->
    <select id="filter-agjenti" class="filter-select">...</select>
    <input type="text" id="search-..." placeholder="Kërko...">
    <div class="sort-btns">
        <button class="sort-btn active">Skadon shpejt</button>
        <button class="sort-btn">Më e re</button>
    </div>
</div>
```

### Tags Pattern në Tabelë
```html
<!-- Lloji -->
<span class="badge-lloji tag-individ">Individuale</span>
<span class="badge-lloji tag-familje">Familjare</span>
<span class="badge-lloji tag-biznes">Biznese</span>

<!-- Status minimal (dot + glow) -->
<span class="tag-status tag-aktive">Aktive</span>
<span class="tag-status tag-skadon">Skadon</span>
<span class="tag-status tag-skaduar">Skaduar</span>

<!-- Skadon cell -->
<span class="skadon-cell green"><span class="skadon-dot"></span>45d</span>
<span class="skadon-cell orange"><span class="skadon-dot"></span>12d</span>
<span class="skadon-cell red"><span class="skadon-dot"></span>Skaduar</span>
```

### Action Buttons (DUHEN PËRMIRËSUAR)
**Problem aktual te oferta + kontratat:** butonat duken të mëdhenj/jo-konsistent.
**Zgjidhje:** përdor `.action-icon-btns` + ikona të vogla (14×14px) + buton `.btn-word` për label shkurt.

```html
<td style="text-align:right;">
    <div class="action-icon-btns" style="justify-content:flex-end;">
        <button title="Modifiko"><i data-lucide="pencil"></i></button>
        <button class="btn-word"><i data-lucide="file-text"></i> Word</button>
        <button title="Email"><i data-lucide="mail"></i></button>
        <button title="Fshi"><i data-lucide="trash-2"></i></button>
    </div>
</td>
```

---

## 🛠️ JAVASCRIPT PATTERNS

### KPI Clickable Filter (aplikohet në ÇDO modul)
Vendose në fund të `[modul].js`:

```javascript
document.addEventListener('DOMContentLoaded', function() {
    const kpiCards = document.querySelectorAll('.kpi-card[data-filter]');
    let activeKpi = 'all';
    const allCard = document.querySelector('.kpi-card[data-filter="all"]');
    if (allCard) allCard.classList.add('kpi-active');

    kpiCards.forEach(card => {
        card.addEventListener('click', function() {
            const filter = this.dataset.filter;
            if (activeKpi === filter && filter !== 'all') activeKpi = 'all';
            else activeKpi = filter;
            kpiCards.forEach(c => c.classList.remove('kpi-active'));
            document.querySelector('.kpi-card[data-filter="'+activeKpi+'"]').classList.add('kpi-active');
            window.__activeKpiFilter = activeKpi;
            if (typeof filtro === 'function') filtro();
            else if (typeof renderTabela === 'function') renderTabela();
        });
    });
});
```

**KUJDES:** Filtrimi real duhet integrohet në `renderTabela()` — e.g.:
```javascript
const kpiFilter = window.__activeKpiFilter || 'all';
filtered = filtered.filter(o => {
    if (kpiFilter === 'all') return true;
    if (kpiFilter === 'aktive') return status === 'aktive';
    // etj.
});
```

### Llojet Chips — render + filter
```javascript
function renderLlojetChips() {
    const chipsEl = document.getElementById('llojet-chips');
    if (!chipsEl) return;
    const activeL = window.__activeLloji || 'all';
    const llojiLabels = {individ: 'Individ', familje: 'Familje', biznes: 'Biznes'};
    const counts = {};
    ['individ','familje','biznes'].forEach(ll => {
        counts[ll] = ofertat.filter(o => o.lloji === ll).length;
    });
    chipsEl.innerHTML = Object.keys(llojiLabels).map(ll => `
        <span class="ll-chip ${ll} ${activeL === ll ? 'active' : ''}" onclick="toggleLloji('${ll}')">
            <span class="ll-num">${counts[ll]}</span> ${llojiLabels[ll]}
        </span>
    `).join('');
}

function toggleLloji(ll) {
    window.__activeLloji = (window.__activeLloji === ll) ? 'all' : ll;
    renderTabela();
}
```

Pas kësaj, në `renderTabela()` filtro nga `window.__activeLloji`.

---

## 🔴 PROBLEME TË DITURA (nga feedback i Agon)

### 1. Oferta — KPI nuk filtron të dhënat
- Klikimi ndërron `active` state, por `renderTabela()` nuk e respekton filtrin.
- **Zgjidhje:** lidh `window.__activeKpiFilter` me filtrin real.

### 2. Oferta — Llojet duhen MAJTAS dhe duhet hequr filtri i parë
- Aktualisht chips janë djathtas (pas input-it).
- Filtri `<select id="filter-lloji">` bën të njëjtën gjë → **hiq atë**.

### 3. Oferta + Kontratat — butonat e tabelës të mëdhenj/keq-konsistent
- Përdor `.action-icon-btns` me `width: 30px; height: 30px;`
- Ikonat: 14×14px
- Word button me `.btn-word` (soft `#e0e7ff` bg)

### 4. Dashboard — duhet redesign total
Referencë vizuale nga përdoruesi: **bars chart + donut + summary strip**.
Shiko skemën: https://imgur.com/photo.png (ekziston në kontekst të mëparshëm)

Elemente që duhen:
- Përshëndetje header ("Përshëndetje, Agon 👋")
- 4 KPI cards (oferta aktive, kontrata, debitorë, rinovime)
- **Bars/Tabela toggle** card (shpërndarja sipas aging-ut)
- **Donut chart** card (statuset)
- Veprime të fundit + Skadojnë së shpejti

Bibliotekat e disponueshme (mund t'i importosh via CDN):
- Chart.js
- ApexCharts

### 5. Raportet — duhet graph charts
**Kërkesa nga Agon:**
- Krahasim mujor → **line chart** ose **bars chart** (dy vite pas njëri-tjetrit)
- Sipas llojit → **pie/donut chart**
- Sipas agjentëve → **horizontal bars** (ranking)
- Sipas degëve → **vertical bars**

Aktualisht raportet kanë vetëm bars primitive me div-e. Duhet të integrohet Chart.js për charts të vërtetë.

### 6. Rinovimet — strip navy akoma ekziston
- Te `rinovimet.html` ende ka stat-strip të vjetër
- Drawer-at brenda janë të vjetër (shih screenshots)

### 7. Debitoret — raport modal + import modal
- Raport modal (foto 8) me strip navy → përditëso me KPI cards
- Import modal (foto 10) OK veç topbar brenda modalit

---

## 📦 SKEDARËT E RËNDËSISHËM

```
sigal-platform/
├── css/
│   ├── theme.css          (OLD — ignored)
│   ├── theme-v2.css       (ACTIVE — 1800+ rreshta)
│   ├── pako-editor.css    (spreadsheet — OK)
│   ├── kontratat.css      (module-specific)
│   ├── dashboard.css      (module-specific)
│   ├── faturimi.css       (module-specific)
│   ├── oferta.css         (module-specific)
│   └── style.css          (legacy)
├── js/
│   ├── auth.js
│   ├── main.js            (injects bell + user tag into .topbar-right)
│   ├── pakot.js           (spreadsheet data)
│   ├── kontratat.js       ✅ REFERENCE
│   ├── raportet.js        (1989 rreshta)
│   ├── oferta.js          ✅ Migrated (needs polish)
│   ├── oferta-tracking.js
│   ├── faturimi.js
│   ├── rinovimet.js
│   ├── debitoret.js
│   ├── dashboard.js
│   └── stafi.js           ✅ Migrated
├── pages/
│   ├── kontratat.html     ✅ REFERENCE
│   ├── raportet.html      ✅ Migrated (needs graph charts)
│   ├── oferta.html        ✅ Migrated (needs polish)
│   ├── oferta-view.html   ❌ Not migrated (client-facing)
│   ├── faturimi.html      ❌ Pending
│   ├── rinovimet.html     ❌ Pending
│   ├── debitoret.html     ❌ Pending
│   ├── dashboard.html     ❌ Pending (needs redesign)
│   └── stafi.html         ✅ Migrated
├── Sigal-KS-Logo.webp
└── index.html (login)
```

---

## 🎯 PLAN I REKOMANDUAR PËR CLAUDE CODE

Pavarësisht nga limiti i context, propozo këtë rend:

### FAZA 1: Polish (gjërat e vogla + feedback) — 1 seancë
1. **oferta.html + oferta.js** → fix (llojet chips majtas, KPI real filter, butonat)
2. **kontratat.html + kontratat.js** → fix butonat e tabelës (të jenë konsistent me oferta)
3. **stafi.html + stafi.js** → quick review

### FAZA 2: Migrimi i moduleve të thjeshta — 1-2 seanca
1. **faturimi.html + faturimi.js** → duhet KPI cards për Kërkesa/Process/Lëshuar + llojet chips
2. **rinovimet.html + rinovimet.js** → KPI (Pa filluar/Kontaktuar/Rinovuar/Humbur) + dega chips
3. **debitoret.html + debitoret.js** → KPI (Borxhi total/>365/Paguar/Mbetur) + dega chips

### FAZA 3: Redesign moduletë komplekse — 2 seanca
1. **dashboard.html + dashboard.js** → redesign total me Chart.js (bars/tabela toggle, donut)
2. **raportet.html + raportet.js** → shto Chart.js për line/donut/bars charts

### FAZA 4: Client-facing — 1 seancë
1. **oferta-view.html** → migrim me theme-v2, ruaj "coverage sections default FOLDED"

---

## 🔧 TOOLS/COMMANDS PËR CLAUDE CODE

### Verifiko statusin aktual
```bash
# Kontrollo cili modul përdor theme-v2
grep -l "theme-v2.css" pages/*.html

# Kontrollo ku mbetet ngjyra navy e vjetër
grep -n "#002B5C" pages/*.html js/*.js css/*.css

# Kontrollo ku përdoren klasat e reja
grep -rn "kpi-card\|tag-status\|skadon-cell" pages/ js/
```

### Pas çdo moduli
```bash
# Lokalisht
git add .
git status

# Kur përfundon disa module
git commit -m "Migrate [modulet] to theme-v2 with KPI + chips + charts"
git push
```

---

## ✅ CHECKLIST PËR ÇDO MODUL

Kopjo këtë listë dhe shënoje për secilin modul:

- [ ] `<link>` → `theme-v2.css`
- [ ] Hiq blloku `<style>` inline (vetëm specifikat mbajnë lokale)
- [ ] Sidebar me `data-label` për çdo nav-item
- [ ] Sidebar linke të sakta për debitoret, raportet, stafi (jo `href="#"`)
- [ ] Topbar me `.topbar-right` wrapper
- [ ] Butoni kryesor `.btn-primary` brenda `.topbar-right`
- [ ] Tabs `.tabs` + `.tab-btn` + `.tab-count` (light gray active, jo blue)
- [ ] 4 KPI Cards me `data-filter` atribute
- [ ] Llojet chips **MAJTAS** në filter-row
- [ ] **HIQ** filter-lloji select (chips e zëvendësojnë)
- [ ] Hiq filter-statusi select (KPI e zëvendësojnë)
- [ ] Tabela me `.table-container` + tags të reja (`tag-status`, `tag-lloji`, `skadon-cell`)
- [ ] Butonat `.action-icon-btns` + `.btn-word`
- [ ] Drawer me `.drawer-overlay` + `.drawer-panel` + `.drawer-panel-header/body/footer`
- [ ] JS: integro KPI filter te `renderTabela()`
- [ ] JS: render llojet chips dhe lidhi me `window.__activeLloji`
- [ ] JS: tags inline me klasa (jo `style="..."`)
- [ ] Testo në browser me hard refresh (Ctrl+Shift+R)

---

## 🚨 RREGULLAT PËR BASHKËPUNIM ME AGON

- Gjuha: **gjithmonë shqip**
- Përgjigje: **të shkurta**, pa monologe
- Kod: ready-to-paste me udhëzime **GJEJ/ZËVENDËSO** nëse është edit i vogël
- Git path: `pages/kontratat.html` (jo `sigal/pages/`)
- Git komanda: **3 rreshta në fund**, kur gjithçka është gati
- Kur nuk funksionon diçka: pyet për screenshot/console error, mos guess

---

## 📝 SHËNIME PËR DIZAJN

### Butonat e veprimeve (të gjitha modulet)
- Transparent bg default, hover `#eef2ff` me brand color
- Word button soft: `background: #e0e7ff; color: #4338ca`
- Size: 30×30px rrethor
- Ikonat: 14×14px, stroke-width 2

### Status colors (universalë)
- Green (Aktive/Konfirmuar/Paguar/Rinovuar): `#10b981` dot + `#059669` text
- Orange (Skadon/Presin/Premtim): `#f59e0b` dot + `#d97706` text
- Red (Skaduar/Humbur/Kontestuar): `#ef4444` dot + `#dc2626` text
- Blue brand (Total/Kontratë/Realizuar): `#3b82f6` → `#1e3a8a` gradient

### Responsive
- `<1100px`: 2-col layout
- `<768px`: sidebar 60px, filters wrap
- `<480px`: sidebar hide, single col

---

## 🎯 RRJEDHA IDEALE E PUNËS PËR CLAUDE CODE

Për çdo modul:
1. Lexo HTML-in aktual
2. Lexo JS-in aktual
3. Kompare me kontratat.html + kontratat.js
4. Bëj ndryshimet në HTML (pattern checklist)
5. Bëj ndryshimet në JS (KPI filter + chips + tags)
6. Test (mund të përdorësh `python -m http.server` për test lokal)
7. Nëse ka CSS specifike për modulin që nuk i përshtatet theme-v2, vendose në `<style>` lokal
8. Pas 2-3 moduleve, git commit + push

---

**FUND I CONTEXT.** Kur Claude Code e lexon këtë, duhet të ketë kuptim të plotë të:
- Çfarë është theme-v2
- Çfarë është bërë deri tani
- Çfarë ka mbetur
- Si duhet të duken faqet
- Cilat janë rregullat e bashkëpunimit me Agon

Sukses! 🚀