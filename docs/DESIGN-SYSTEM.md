# Design System - SIGAL Health Platform (theme-v2)

> Sistemi i dizajnit aktual: **theme-v2** (glassmorphism + Montserrat + soft royal blue).
> Reference module: `pages/kontratat.html` + `js/kontratat.js`.

---

## 🎨 Brand Identity

### Ngjyrat Kryesore (Brand Gradient)
```css
--s-brand-dark:  #1e3a8a;    /* navy i butë */
--s-brand:       #3b82f6;    /* blu mesatare */
--s-brand-light: #60a5fa;    /* blu e lehtë */
--s-brand-glow:  rgba(59, 130, 246, 0.3); /* Glow për highlights */

/* Brand gradient (përdoret kudo) */
background: linear-gradient(135deg, #1e3a8a, #3b82f6, #60a5fa);
```

### Status Colors
```css
--s-green:     #059669;   --s-green-dot:  #10b981;   /* Aktive, Konfirmuar, Paguar, Rinovuar */
--s-orange:    #d97706;   --s-orange-dot: #f59e0b;   /* Skadon, Presin, Premtim */
--s-red:       #dc2626;   --s-red-dot:    #ef4444;   /* Skaduar, Humbur, Kontestuar */
```

### Text Colors
```css
--s-text:       #0f172a;   /* primar (i errët) */
--s-text-sub:   #4b5563;   /* sekondar */
--s-text-muted: #7c8aa8;   /* labels të vegjël, info */
--s-text-faint: #9ca3af;   /* Tekst shumë i lehtë (placeholders) */
```

### Background
```css
background: linear-gradient(135deg, #f4f5f7 0%, #f0f1f4 40%, #ecedf0 100%);
/* Neutral gray, NUK ka tone blu */
--s-bg-flat: #f0f1f4;       /* Background flat (jo gradient) */
```

### Glass System
```css
--s-glass-strong: rgba(255, 255, 255, 0.92);   /* Glass i fortë (kartat e mëdha) */
--s-glass-border: rgba(226, 232, 240, 0.8);    /* Border i glass */
--s-glass-blur:   20px;                         /* Backdrop-filter blur */
```

### Borders
```css
--s-border:       #e5e9f0;   /* Border standard */
--s-border-light: #f1f5f9;   /* Border i lehtë */
```

### Status Backgrounds (soft)
```css
--s-green-bg:  #ecfdf5;   /* Background i lehtë jeshil */
--s-orange-bg: #fffbeb;   /* Background i lehtë portokalli */
--s-red-bg:    #fef2f2;   /* Background i lehtë i kuq */
--s-blue-bg:   #eff6ff;   /* Background i lehtë blu */
```

### Glass (Glassmorphism)
```css
background: rgba(255, 255, 255, 0.82);
backdrop-filter: blur(20px);
border: 1px solid rgba(226, 232, 240, 0.8);
```

### Border Radius
```css
--r-sm: 8px;
--r-md: 12px;
--r-lg: 16px;
```

### Sidebar
```css
--sidebar-w: 76px;
```

---

## ⛔ BANNED (Përdorimi i Ndaluar)

Përdoruesi **ka refuzuar qartë** këto elemente. Mos i përdor në asnjë rast:

| Element | Pse jo |
|---|---|
| ❌ `#002B5C` (navy i errët) | Tepër i errët, përdoruesi e urren |
| ❌ `#6366f1` / `#8b5cf6` (purple) | Përdoruesi e urren purple |
| ❌ IBM Plex Sans / Inter fonts | Vetëm Montserrat |
| ❌ Heavy gradients me gloss/shine në KPI icons | Kërkohen flat |
| ❌ `box-shadow` i rëndë në icons | Kërkohen pa shadow |
| ❌ Numra me ngjyra semantike në stat strips | Vetëm dark text (#0f172a) |
| ❌ Tags/pills për numra në tabela | Plain text |
| ❌ Inline `style=""` ku ekziston klasa | Përdor klasën |
| ❌ Strong/solid ngjyra në Word/Kontratë butona | Soft colors |
| ❌ Clock icon për "Skadon shpejt" | Përdor `alert-triangle` |

---

## 🔤 Typography

### Font Family
```css
font-family: 'Montserrat', sans-serif;
```

Source: Google Fonts CDN
```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### Font Sizes (compact UI - user preference)
- **Base:** 12-13px
- **Tabela:** 12px
- **Headers:** 14-16px
- **Stat numbers:** 13.5px
- **Labels:** 10px (uppercase, tracking-wide)
- **Buttons:** 12-12.5px

---

## 🧩 Komponente Kryesorë

### Sidebar (76px, glassmorphism)

```html
<aside class="sidebar">
    <div class="sidebar-logo">
        <img src="../Sigal-KS-Logo.webp" alt="SIGAL">
    </div>
    <nav class="sidebar-nav">
        <a href="dashboard.html" class="nav-item" data-label="Dashboard">
            <i data-lucide="layout-dashboard"></i>
        </a>
        <!-- ...më shumë nav items -->
    </nav>
    <div class="sidebar-footer">
        <a href="#" class="nav-item nav-logout" data-label="Dil" onclick="logout()">
            <i data-lucide="log-out"></i>
        </a>
    </div>
</aside>
```

**CSS Key Points:**
- Width: `76px` fixed
- Background: glassmorphism `rgba(255,255,255,0.82)` + blur 20px
- Icons: 46×46px, rounded
- Active state: brand gradient + glow
- Tooltip via CSS `::after` + `data-label` attribute
- Footer logout icon: red color

### Topbar

```html
<div class="topbar">
    <h1>Title (gradient text)</h1>
    <div class="topbar-right">
        <button class="btn-primary" onclick="...">
            <i data-lucide="plus"></i> Action
        </button>
        <!-- bell + user tag auto-injected by main.js -->
    </div>
</div>
```

**Render order në topbar-right (fixed):**
1. Main action button (`btn-primary`)
2. 🔔 Bell notifications (auto-injected nga main.js)
3. 👤 User avatar tag (auto-injected nga main.js)

### KPI Cards (Glassmorphism, Clickable)

```html
<div class="stats-strip">
    <div class="kpi-card" data-filter="all">
        <div class="kpi-icon kpi-icon-blue">
            <i data-lucide="bar-chart-3"></i>
        </div>
        <div class="kpi-body">
            <div class="sm-lbl">Total</div>
            <div class="sm-num" id="st-total">0</div>
        </div>
        <div class="kpi-arrow"><i data-lucide="arrow-up-right"></i></div>
    </div>
    <!-- variant: kpi-icon-green | kpi-icon-orange | kpi-icon-red -->
</div>
```

**KPI Icons (FLAT - jo gloss, jo shadow):**
```css
.kpi-icon {
    width: 42px !important;
    height: 42px !important;
    border-radius: 10px !important;
    box-shadow: none !important;  /* KRITIKE: pa shadow */
}
.kpi-icon-blue   { background: #3b82f6 !important; }
.kpi-icon-green  { background: #10b981 !important; }
.kpi-icon-orange { background: #f59e0b !important; }
.kpi-icon-red    { background: #ef4444 !important; }
```

**Variantet sipas modulit:**
| Modul | KPI 1 | KPI 2 | KPI 3 | KPI 4 |
|---|---|---|---|---|
| Kontratat | Total (blue) | Aktive (green) | Skadon shpejt (orange) | Skaduar (red) |
| Oferta | Total | Presin përgjigje | Konfirmuar | Realizuar |
| Faturimi | Total | Asgjë | Në Proces | E Lëshuar |
| Rinovimet | Pa filluar | Kontaktuar | Rinovuar | Humbur |
| Debitoret | Borxhi total | Mbi 365 | Paguar | Mbetur |

**JS - KPI Clickable Filter (në çdo modul):**
```javascript
document.addEventListener('DOMContentLoaded', function() {
    const kpiCards = document.querySelectorAll('.kpi-card[data-filter]');
    let activeKpi = 'all';
    document.querySelector('.kpi-card[data-filter="all"]').classList.add('kpi-active');
    
    kpiCards.forEach(card => {
        card.addEventListener('click', function() {
            const filter = this.dataset.filter;
            activeKpi = (activeKpi === filter && filter !== 'all') ? 'all' : filter;
            kpiCards.forEach(c => c.classList.remove('kpi-active'));
            document.querySelector('.kpi-card[data-filter="'+activeKpi+'"]').classList.add('kpi-active');
            window.__activeKpiFilter = activeKpi;
            renderTabela();
        });
    });
});
```

**Integro filter në `renderTabela()`:**
```javascript
const kpiFilter = window.__activeKpiFilter || 'all';
filtered = filtered.filter(o => {
    if (kpiFilter === 'all') return true;
    if (kpiFilter === 'aktive') return statusi === 'aktive';
    // etj.
});
```

### Tabs (Aktive/Skaduar)

```html
<div class="tabs">
    <button class="tab-btn active" id="tab-aktive">
        Aktive <span class="tab-count" id="tab-count-aktive">24</span>
    </button>
    <button class="tab-btn" id="tab-skaduar">
        Skaduar <span class="tab-count" id="tab-count-skaduar">1</span>
    </button>
</div>
```

**Active state:** light gray background (NUK blu gradient)
**Count badge:** dark bg kur active, gray kur jo

### Llojet Chips (LEFT side i filter-row)

⚠️ **KRITIKE:** Chips duhet të jenë në **MAJTAS** të filter-row. Fshi `<select id="filter-lloji">` (chips e zëvendësojnë).

```html
<div class="filters-row">
    <!-- LEFT: llojet chips -->
    <div class="llojet-chips-inline" id="llojet-chips"></div>
    
    <!-- Pastaj: agjenti, search, sort -->
    <select id="filter-agjenti" class="filter-select">...</select>
    <input type="text" id="search-..." placeholder="Kërko...">
    <div class="sort-btns">
        <button class="sort-btn active">Skadon shpejt</button>
        <button class="sort-btn">Më e re</button>
    </div>
</div>
```

**Numrat brenda chips - ngjyra duhen me u përshtatur me KPI:**
- Individ (blu)
- Familje (purple/violet ose - vetëm te tag, jo te numra)
- Biznes (green)

### Tags (në Tabela)

```html
<!-- Lloji: gradient soft -->
<span class="badge-lloji tag-individ">Individuale</span>
<span class="badge-lloji tag-familje">Familjare</span>
<span class="badge-lloji tag-biznes">Biznese</span>

<!-- Status: minimal (dot + glow ring) -->
<span class="tag-status tag-aktive">Aktive</span>
<span class="tag-status tag-skadon">Skadon</span>
<span class="tag-status tag-skaduar">Skaduar</span>

<!-- Skadon cell -->
<span class="skadon-cell green"><span class="skadon-dot"></span>45d</span>
<span class="skadon-cell orange"><span class="skadon-dot"></span>12d</span>
<span class="skadon-cell red"><span class="skadon-dot"></span>Skaduar</span>
```

**Lloji - Gradient Soft:**
```css
.tag-individ {
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
    color: #1e40af;
    border: 1px solid rgba(59, 130, 246, 0.25);
}
.tag-familje {
    background: linear-gradient(135deg, #faf5ff, #ede9fe);
    color: #6d28d9;
    border: 1px solid rgba(139, 92, 246, 0.25);
}
.tag-biznes {
    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
    color: #047857;
    border: 1px solid rgba(16, 185, 129, 0.25);
}
```

**Status - Minimal (vetëm dot + glow + text):**
```css
.tag-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    /* NO border, NO background */
}
.tag-status::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    box-shadow: 0 0 0 3px rgba(color, 0.2);  /* glow ring */
}
```

### Action Buttons (KRITIKE - shpesh prishet!)

⚠️ User ka dhënë Photo 2 si referencë eksakte. Mos ndrysho stilin.

```html
<div class="action-icon-btns" style="justify-content:flex-end;">
    <!-- Kontratë FIRST (left) - vetëm kur shfaqet -->
    <button class="btn-kontrate-text" onclick="krijoKontrate(X)" title="Kontratë">
        <i data-lucide="file-check"></i> Kontratë
    </button>
    
    <!-- Edit -->
    <button onclick="edito(X)" title="Modifiko">
        <i data-lucide="pencil"></i>
    </button>
    
    <!-- Word -->
    <button class="btn-word" onclick="gjeneroWord(X)" title="Word">
        <i data-lucide="file-text"></i> Word
    </button>
    
    <!-- Email -->
    <button onclick="dergoEmail(X)" title="Email">
        <i data-lucide="mail"></i>
    </button>
    
    <!-- Link -->
    <button onclick="kopjoLink(X)" title="Kopjo">
        <i data-lucide="link"></i>
    </button>
    
    <!-- Delete -->
    <button onclick="fshi(X)" title="Fshi">
        <i data-lucide="trash-2"></i>
    </button>
</div>
```

**Specifikimet:**

1. **Icon buttons** (Pencil, Email, Link, Trash):
   - White bg + gray border `#e5e9f0`
   - Pill shape `34×30px`, rounded `10px`
   
2. **Word button**: 
   - Filled lavender `#e0e7ff` + text `#4338ca`
   - **NO border**

3. **Kontratë button** (vetëm kur konfirmuar):
   - Filled blue `#dbeafe` + text `#1e40af`
   - **NO border**, **LEFT** of others

4. **Icons:** Lucide (`<i data-lucide="...">`), JO inline SVG
5. **SVG fix kritik:**
```css
.action-icon-btns > button svg,
.action-icon-btns > button svg *,
.action-icon-btns > button i,
.action-icon-btns > button i * {
    fill: none !important;
    stroke: currentColor !important;
}
```

### Drawer / Modal (Unified - duhet me qenë identik kudo!)

```html
<div class="drawer-overlay" onclick="if(event.target===this) closeDrawer()">
    <div class="drawer-panel">
        <div class="drawer-header">
            <div>
                <div class="drawer-title-gradient">Title</div>
                <div class="drawer-subtitle">Description</div>
            </div>
            <button class="drawer-close" onclick="closeDrawer()">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="drawer-body">
            <!-- form fields, spreadsheet, etc. -->
        </div>
        <div class="drawer-footer">
            <button class="btn-cancel" onclick="closeDrawer()">Anulo</button>
            <button class="btn-save btn-primary" onclick="ruaj()">
                <i data-lucide="check"></i> Ruaj
            </button>
        </div>
    </div>
</div>
```

**Kërkesa kritike:**
- ✅ Background: glassmorphism
- ✅ Title: gradient text
- ✅ Lloji buttons (kur ekzistojnë): brand gradient kur active
- ✅ **Mbyllet me click jashtë** (`onclick="if(event.target===this)"`)
- ✅ **Mbyllet me ESC** (në main.js):
```javascript
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.drawer-overlay.open').forEach(d => 
            d.classList.remove('open'));
    }
});
```

**Buttons të standardizuar:**
```css
.btn-cancel {
    padding: 10px 20px !important;
    font-size: 12.5px !important;
    font-weight: 700 !important;
    color: #4b5563 !important;
    background: white !important;
    border: 1.5px solid #e5e9f0 !important;
    border-radius: 10px !important;
}
.btn-save {
    padding: 10px 24px !important;
    color: white !important;
    background: linear-gradient(135deg, #1e3a8a, #3b82f6) !important;
    border: none !important;
    border-radius: 10px !important;
    box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3) !important;
}
```

### Stats Thin Row (përdor kudo)

```css
.stats-thin-row {
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 12px;
    padding: 12px 18px;
    display: flex;
    align-items: center;
}
.stat-thin {
    flex: 1;
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 0 12px;
}
.stat-thin-label {
    font-size: 10px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.stat-thin-value {
    font-size: 13.5px;
    font-weight: 700;
    color: #0f172a;  /* dark, jo semantic colors */
}
.stat-thin-divider {
    width: 1px;
    height: 22px;
    background: #e5e9f0;
}
```

### Dega Chips (pill rounded gray)

```css
.dega-chip {
    background: transparent;
    color: #4b5563;
    border: 1px solid #e5e9f0;
    padding: 4px 11px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
}
.dega-chip:hover { border-color: #cbd5e1; background: #f8fafc; }
.dega-chip.active {
    background: #f1f5f9;
    color: #0f172a;
    border-color: #cbd5e1;
}
.dega-chip .dega-count { color: #94a3b8; font-weight: 500; }
```

### Dropzone (Import Modal)

```css
.dropzone {
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    padding: 28px 20px;
    text-align: center;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.03), rgba(96, 165, 250, 0.03));
}
.dropzone-icon {
    width: 54px;
    height: 54px;
    background: linear-gradient(135deg, #1e3a8a, #3b82f6);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}
```

---

## 📐 Standard Page Structure

```
┌─────────────────────────────────────────────────┐
│ TOPBAR                                          │
│ [Title gradient]    [btn] [🔔] [👤 User]       │
├─────────────────────────────────────────────────┤
│ TABS + PERIOD FILTER                            │
│ [Aktive 24] [Skaduar 1]        [Viti][Muaji]   │
├─────────────────────────────────────────────────┤
│ KPI CARDS (4 glassmorphism, clickable)          │
│ [📊 Total][✅ X][⚠️ Y][❌ Z]                    │
├─────────────────────────────────────────────────┤
│ FILTERS ROW                                     │
│ [Chips MAJTAS] [Agjenti▾] [Search] [Sort]      │
├─────────────────────────────────────────────────┤
│ TABLE (glassmorphism)                           │
└─────────────────────────────────────────────────┘
```

---

## 📦 CSS Strategy: Hybrid

**Vendim:** common në `theme-v2.css`, page-specific në `<style>` brenda HTML.

### Çka shkon në `theme-v2.css`:
- Sidebar, topbar, butonat
- Tags, drawer, KPI cards
- Tabela, filters
- Form elements
- Responsive breakpoints

### Çka shkon në `<style>` brenda HTML:
- Spreadsheet styling (oferta + kontratat)
- Organogram (stafi)
- Donut charts (dashboard)
- Version panel (oferta)
- Coverage sections (oferta-view)

**Avantazhi:** Çdo HTML file vetë-përmbajtës për stil të tij specifik, por e ndan baza e përbashkët.

---

## 📱 Responsive Breakpoints

```css
@media (max-width: 1100px) { /* 2-column layouts */ }
@media (max-width: 768px)  { /* sidebar 60px, filters wrap */ }
@media (max-width: 480px)  { /* sidebar hide, single column */ }
```

**Rregull i përdoruesit:** Pakot duhet **horizontale**, jo të stacked në mobile.

---

## 🎯 Reference Implementation

✅ **`pages/kontratat.html` + `js/kontratat.js`** - modeli për të gjitha modulet

Çdo modul tjetër duhet të ndjekë po të njëjtën strukturë:
- Topbar pattern
- 4 KPI cards clickable me `data-filter`
- Llojet chips në majtas
- Tabela me tags të reja
- Action buttons sipas spec-it
- Drawer i unifikuar

---

## ✅ Per-Module Migration Checklist

Për çdo modul që migrohet në theme-v2:

- [ ] `<link>` → `theme-v2.css`
- [ ] Hiq `<style>` blocks me `#002B5C` (old navy)
- [ ] Sidebar me `data-label` për të gjitha nav-items
- [ ] Sidebar real `href` (jo `href="#"`)
- [ ] Topbar me `.topbar-right` wrapper
- [ ] Main button `.btn-primary` brenda `.topbar-right`
- [ ] Tabs `.tabs` + `.tab-btn` + `.tab-count` (light gray active)
- [ ] 4 KPI Cards me `data-filter` attribute
- [ ] Llojet chips **LEFT** në filter-row
- [ ] **Hiq** `<select id="filter-lloji">` (chips e zëvendësojnë)
- [ ] Hiq `<select id="filter-status">` (KPI e zëvendëson)
- [ ] Tabela me `tag-status`, `tag-lloji`, `skadon-cell`
- [ ] Action buttons sipas Photo 2
- [ ] Drawer me strukturë të unifikuar
- [ ] JS: integro KPI filter në `renderTabela()`
- [ ] JS: render llojet chips, bind te `window.__activeLloji`
- [ ] JS: përdor klasat për tags, jo inline styles
- [ ] JS: `<i data-lucide="...">` JO inline SVG
- [ ] JS: thirr `lucide.createIcons()` pas çdo `innerHTML` update
- [ ] Test në browser me hard refresh (Ctrl+Shift+R)

---

## 📄 Page-Specific Components (jo në theme-v2.css)

Sipas DEC-015 (Hybrid CSS), këto komponente janë vetëm në `<style>` blloku të faqes përkatëse, jo në theme-v2.css. Listuar këtu për referencë.

### Oferta-View (`pages/oferta-view.html`)

- `.float-pill` — Floating button "Konfirmoj zgjedhjen"
- `.opt-card-mini` — Karta të vogla për extras
- `.opt-mini-head` / `.opt-mini-title` / `.opt-mini-price` — Struktura e mini cards
- `.opt-tag` — Tags për extras (variantet: `rec`, `new`, `b`, `g`)
- `.popup-overlay` + `.popup` — Popup sistem për Jetë/Opinion
- `.popup-section` + `.popup-section-hdr` — Seksione brenda popup-eve
- `.jete-row` + `.jete-row-grid` + `.jete-matrix` — Multi-row kalkulator (DEC-026)
- `.net-info-block` + `.net-cat-note` — Sqarime për Kartela SIGAL (DEC-027)
- `.paketa-btn` — Buttonat e paketave në sidebar (3-col layout - DEC-023)

### Stafi (`pages/stafi.html`)

- Organogram-specific styles

### Dashboard (`pages/dashboard.html`)

- Donut chart styles

> Nëse një nga këto pattern-e fillon të përdoret në modul tjetër, **promovoje në theme-v2.css**.

---

*Çdo komponent i ri ose pattern duhet shtuar këtu. Mos ndrysho ekzistuesit pa update tek të gjithë moduleve të prekur.*
