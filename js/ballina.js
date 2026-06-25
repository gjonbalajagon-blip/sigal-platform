// =====================================================
// BALLINA.JS — Faza 2C
// Split-view Dashboard | Detyrat + 6 module-cards + modal
// Përdor:
//   - dashboard.js (popullon KPI + charts ekzistues)
//   - detyrat.js (state global `detyrat`, helpers renderDenseRow,
//     rendisDetyrat, ngrupo, eshteImja, makeRregullKey, etj.)
// Ky file: orkestrim layout + 6 module cards + modal + mobile tabs
//          + 2 KPI të reja (Borxh, Rinovime) + 1 chart (Aging)
// =====================================================

const BALLINA_LS_POZ = 'ballina_pozicioni';
const BALLINA_LS_VIEW = 'detyrat_view_mode';
const BALLINA_LS_TAB_MOBILE = 'ballina_tab_mobile';
let _ballinaViewMode = localStorage.getItem(BALLINA_LS_VIEW) || 'modul';
let _ballinaPoz = localStorage.getItem(BALLINA_LS_POZ) || 'split';

// =====================================================
// POZICIONI (full-dashboard / split / full-detyrat)
// =====================================================
function setPozicioni(poz) {
    if (!['full-dashboard', 'split', 'full-detyrat'].includes(poz)) poz = 'split';
    _ballinaPoz = poz;
    localStorage.setItem(BALLINA_LS_POZ, poz);
    const layout = document.getElementById('ballina-layout');
    if (layout) layout.setAttribute('data-pozicioni', poz);
    // Trigger resize që Chart.js ri-llogaritë permasën
    setTimeout(() => window.dispatchEvent(new Event('resize')), 360);
}

// =====================================================
// MOBILE TABS
// =====================================================
function setMobileTab(tab) {
    if (tab !== 'dashboard' && tab !== 'detyrat') tab = 'detyrat';
    localStorage.setItem(BALLINA_LS_TAB_MOBILE, tab);
    const layout = document.getElementById('ballina-layout');
    if (layout) layout.setAttribute('data-mobile-tab', tab);
    document.querySelectorAll('.ballina-tab').forEach(b => {
        b.classList.toggle('ballina-tab-active', b.dataset.tab === tab);
    });
}

// =====================================================
// VIEW TOGGLE (Modul / Prioritet)
// =====================================================
function ballinaSetView(mode) {
    if (mode !== 'modul' && mode !== 'prioritet') mode = 'modul';
    _ballinaViewMode = mode;
    localStorage.setItem(BALLINA_LS_VIEW, mode);
    const cards = document.getElementById('detyrat-cards-grid');
    const accordion = document.getElementById('det-accordion');
    if (cards) cards.style.display = mode === 'modul' ? '' : 'none';
    if (accordion) accordion.style.display = mode === 'prioritet' ? '' : 'none';
    document.getElementById('toggle-modul')?.classList.toggle('det-toggle-active', mode === 'modul');
    document.getElementById('toggle-prioritet')?.classList.toggle('det-toggle-active', mode === 'prioritet');
    if (mode === 'modul') renderModuleCards();
    else if (typeof renderAccordion === 'function') renderAccordion();
}

// =====================================================
// 6 MODULE CARDS
// =====================================================
const MODULE_CARDS = [
    { id: 'oferta', label: 'OFERTA', icon: 'clipboard-list' },
    { id: 'kontratat', label: 'KONTRATA', icon: 'file-check' },
    { id: 'faturimi', label: 'FATURIMI', icon: 'receipt' },
    { id: 'rinovimet', label: 'RINOVIME', icon: 'refresh-cw' },
    { id: 'debitoret', label: 'DEBITORËT', icon: 'alert-circle' },
    { id: 'manual', label: 'MANUALE', icon: 'hand' }
];

function ballinaDetyratVisible() {
    if (typeof detyrat === 'undefined') return [];
    let list = (typeof filtroSipasPermissions === 'function') ? filtroSipasPermissions(detyrat) : detyrat;
    if (typeof aplikoFilter === 'function') list = aplikoFilter(list);
    return list.filter(d => d.statusi !== 'e_anuluar' && d.statusi !== 'e_perfunduar');
}

function detyratPerModul(moduli) {
    return ballinaDetyratVisible().filter(d => {
        if (moduli === 'manual') return d.lloji === 'manual';
        return d.burimi && d.burimi.moduli === moduli;
    });
}

function afatiBadgeClass(dataAfati) {
    if (!dataAfati || typeof parseDataAny !== 'function') return { cls: 'det-afati-muted', txt: '—' };
    const da = parseDataAny(dataAfati);
    if (!da) return { cls: 'det-afati-muted', txt: '—' };
    const dite = Math.ceil((da - new Date()) / 86400000);
    if (dite < 0) return { cls: 'det-afati-danger', txt: 'Skaduar ' + Math.abs(dite) + 'd' };
    if (dite <= 3) return { cls: 'det-afati-danger', txt: dite + 'd' };
    if (dite <= 7) return { cls: 'det-afati-warning', txt: dite + 'd' };
    return { cls: 'det-afati-success', txt: dite + 'd' };
}

function escapeHtmlSafe(s) {
    if (typeof escapeHtml === 'function') return escapeHtml(s);
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderModuleCards() {
    const cont = document.getElementById('detyrat-cards-grid');
    if (!cont) return;

    // Update filter counts (rifresko chip-et nga detyrat.js)
    if (typeof renderFiltersCounts === 'function' && typeof detyrat !== 'undefined' && typeof filtroSipasPermissions === 'function') {
        renderFiltersCounts(filtroSipasPermissions(detyrat));
    }

    let html = '';
    MODULE_CARDS.forEach(mc => {
        const items = detyratPerModul(mc.id);
        const total = items.length;
        const kritike = items.filter(d => d.prioriteti === 'kritike').length;
        const rendesishme = items.filter(d => d.prioriteti === 'te_rendesishme').length;
        const normale = items.filter(d => d.prioriteti === 'normale').length;
        const sorted = (typeof rendisDetyrat === 'function') ? rendisDetyrat(items) : items;
        const top3 = sorted.slice(0, 3);
        const emptyCls = total === 0 ? ' det-card-modul-empty' : '';
        const dangerCls = kritike > 0 ? ' det-card-modul-danger' : '';

        let previewHtml = '';
        if (top3.length === 0) {
            previewHtml = '<div class="det-card-modul-preview-empty">Asnjë detyrë aktive</div>';
        } else {
            previewHtml = top3.map(d => {
                const af = afatiBadgeClass(d.data_afati);
                return `<div class="det-preview-row" data-prioriteti="${escapeHtmlSafe(d.prioriteti)}">
                    <span class="det-preview-title" title="${escapeHtmlSafe(d.titulli)}">${escapeHtmlSafe(d.titulli)}</span>
                    <span class="det-preview-afati ${af.cls}">${escapeHtmlSafe(af.txt)}</span>
                </div>`;
            }).join('');
        }

        const filterChip = (currentFilter === 'all') ? '' : ` (${currentFilter === 'te-miat' ? 'mia' : 'pa përgj.'})`;

        html += `<div class="det-card-modul${dangerCls}${emptyCls}" data-moduli="${mc.id}">
            <div class="det-card-modul-header">
                <i data-lucide="${mc.icon}"></i>
                <span class="det-card-modul-name">${mc.label}</span>
                <span class="det-card-modul-count">${total}</span>
            </div>
            <div class="det-card-modul-stats">
                <span class="det-stat-kritike">• ${kritike}</span>
                <span class="det-stat-rendesishme">▲ ${rendesishme}</span>
                <span class="det-stat-normale">─ ${normale}</span>
            </div>
            <div class="det-card-modul-preview">${previewHtml}</div>
            <button class="det-card-modul-shih" type="button" tabindex="-1">
                Shih të ${total}${filterChip} <i data-lucide="arrow-right"></i>
            </button>
        </div>`;
    });

    cont.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// =====================================================
// MODAL "Shih të gjitha" — pattern unifikuar me drawer
// =====================================================
let _modulModalActive = null;

function hapModulModal(moduli) {
    _modulModalActive = moduli;
    const mc = MODULE_CARDS.find(m => m.id === moduli);
    if (!mc) return;
    const items = detyratPerModul(moduli);
    document.getElementById('modul-modal-titulli').textContent = mc.label.charAt(0) + mc.label.slice(1).toLowerCase();
    document.getElementById('modul-modal-count').textContent = items.length;
    document.getElementById('modul-modal-subtitle').textContent = items.length === 0 ? 'Asnjë detyrë aktive' : `${items.length} detyra aktive`;
    renderModulModalBody(items);
    document.getElementById('modul-modal-overlay').classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function mbyllModulModal() {
    document.getElementById('modul-modal-overlay').classList.remove('active');
    _modulModalActive = null;
}

function renderModulModalBody(items) {
    const body = document.getElementById('modul-modal-body');
    if (!body) return;

    if (items.length === 0) {
        body.innerHTML = '<div class="det-empty"><i data-lucide="check-circle-2" style="width:36px;height:36px;color:var(--s-success)"></i><div>Asnjë detyrë aktive për këtë modul</div></div>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    // Ngrupo + sort identik me renderAccordion
    const groups = (typeof ngrupo === 'function') ? ngrupo(items) : { kritike: items, te_rendesishme: [], normale: [], e_perfunduar: [] };
    const groupDefs = [
        { id: 'kritike', titulli: 'Kritike', iconLucide: 'alert-octagon', items: groups.kritike },
        { id: 'te_rendesishme', titulli: 'Të rëndësishme', iconLucide: 'alert-triangle', items: groups.te_rendesishme },
        { id: 'normale', titulli: 'Normale', iconLucide: 'circle-dot', items: groups.normale },
        { id: 'e_perfunduar', titulli: 'Të përfunduara', iconLucide: 'check-circle-2', items: groups.e_perfunduar }
    ];

    let html = '<div class="det-accordion">';
    groupDefs.forEach(g => {
        if (g.items.length === 0) return;
        const sorted = (typeof rendisDetyrat === 'function') ? rendisDetyrat(g.items) : g.items;
        const rows = (typeof renderDenseRow === 'function')
            ? sorted.map(renderDenseRow).join('')
            : '<div class="det-empty">renderDenseRow s\'është ngarkuar</div>';
        html += `<div class="det-group open">
            <div class="det-group-header" style="cursor:default">
                <div class="det-group-title">
                    <i data-lucide="${g.iconLucide}" class="det-group-icon-${g.id}"></i>
                    <span>${escapeHtmlSafe(g.titulli)}</span>
                </div>
                <span class="det-group-count">${g.items.length}</span>
            </div>
            <div class="det-group-body">${rows}</div>
        </div>`;
    });
    html += '</div>';
    body.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Klikim KPI → ndrysho filtrin në modul përkatës (hap modalin)
function filtroDetyratPerModul(moduli) {
    hapModulModal(moduli);
}

// =====================================================
// KPI të reja (Borxh + Rinovime) + Aging chart
// =====================================================
function ballinaKpiShtese() {
    const debitoret = JSON.parse(localStorage.getItem('debitoret_data_v1') || '[]');
    const rinovimet = JSON.parse(localStorage.getItem('rinovimet_data') || '[]');

    // KPI Borxh total
    let totalBorxh = 0, nrDebitor = 0;
    const aging = { '0-30': 0, '31-60': 0, '61-90': 0, '>90': 0 };
    debitoret.forEach(d => {
        const b = Number(d.borxh_total || d.borxh || 0);
        if (b <= 0) return;
        totalBorxh += b;
        nrDebitor++;
        const b30 = Number(d.borxh_0_30 || 0);
        const b60 = Number(d.borxh_31_60 || 0);
        const b90 = Number(d.borxh_61_90 || 0);
        const bMbi365 = Number(d.borxh_mbi_365 || d.borxh_mbi_90 || 0);
        aging['0-30'] += b30;
        aging['31-60'] += b60;
        aging['61-90'] += b90;
        aging['>90'] += bMbi365;
    });
    const elBorxh = document.getElementById('kpi-borxh');
    if (elBorxh) elBorxh.textContent = '€' + Math.round(totalBorxh).toLocaleString('de-DE');
    const elBorxhSub = document.getElementById('kpi-borxh-sub');
    if (elBorxhSub) elBorxhSub.textContent = nrDebitor + ' debitorë';

    // KPI Rinovime në pritje
    const tani = new Date();
    let pritje = 0, urgjent15 = 0;
    rinovimet.forEach(r => {
        const st = r.statusi || 'pa_filluar';
        if (st !== 'pa_filluar' && st !== 'kontaktuar') return;
        pritje++;
        if (r.data_mbarimit) {
            const dm = (typeof parseDataAny === 'function') ? parseDataAny(r.data_mbarimit) : new Date(r.data_mbarimit);
            if (dm) {
                const dite = Math.ceil((dm - tani) / 86400000);
                if (dite <= 15 && dite >= 0) urgjent15++;
            }
        }
    });
    const elRin = document.getElementById('kpi-rinovime');
    if (elRin) elRin.textContent = pritje;
    const elRinSub = document.getElementById('kpi-rinovime-sub');
    if (elRinSub) elRinSub.textContent = urgjent15 > 0 ? (urgjent15 + ' urgjent ≤15d') : 'Pa urgjent';

    // Aging chart
    renderAgingChart(aging);
}

let _agingChart = null;
function renderAgingChart(aging) {
    const cv = document.getElementById('chart-debitor-aging');
    if (!cv || typeof Chart === 'undefined') return;
    if (_agingChart) { _agingChart.destroy(); _agingChart = null; }
    const data = [aging['0-30'], aging['31-60'], aging['61-90'], aging['>90']];
    const total = data.reduce((a, b) => a + b, 0);
    const colorsArr = ['#10b981', '#f59e0b', '#ef4444', '#7f1d1d'];
    _agingChart = new Chart(cv.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['0-30 ditë', '31-60 ditë', '61-90 ditë', '>90 ditë'],
            datasets: [{ data, backgroundColor: colorsArr, borderWidth: 0 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '65%',
            plugins: { legend: { display: false } }
        }
    });
    // Legend custom
    const legend = document.getElementById('legendAging');
    if (legend) {
        legend.innerHTML = ['0-30', '31-60', '61-90', '>90'].map((lbl, i) => {
            const v = data[i] || 0;
            const pct = total > 0 ? Math.round((v / total) * 100) : 0;
            return `<div class="dash-legend-item"><span class="swatch" style="background:${colorsArr[i]}"></span><span class="dash-legend-label">${lbl}d</span><span class="dash-legend-val">${pct}%</span></div>`;
        }).join('');
    }
}

// =====================================================
// HOOK: kur detyrat ndryshojnë (krijim/edit/anulim) → ri-renderoj cards
// =====================================================
function ballinaOnDetyratChange() {
    if (_ballinaViewMode === 'modul') renderModuleCards();
    // accordion renderon vetë nga detyrat.js
}

// Monkey-patch renderAccordion për të kapur ndryshime detyrash (best-effort)
(function() {
    if (typeof renderAccordion === 'function') {
        const orig = renderAccordion;
        window.renderAccordion = function() {
            try { orig.apply(this, arguments); } catch(e) {}
            if (_ballinaViewMode === 'modul') {
                try { renderModuleCards(); } catch(e) {}
            }
        };
    }
})();

// =====================================================
// EVENT DELEGATION (Faza 2D P4): siguri për klikim te module-cards
// =====================================================
function ballinaBindDelegatedHandlers() {
    const grid = document.getElementById('detyrat-cards-grid');
    if (!grid) return;
    grid.addEventListener('click', function(e) {
        const card = e.target.closest('.det-card-modul');
        if (!card) return;
        const moduli = card.getAttribute('data-moduli');
        if (moduli) hapModulModal(moduli);
    });
}

// Garanto që funksionet janë në window scope (siguri ndaj script-loading edge cases)
if (typeof window !== 'undefined') {
    window.hapModulModal = hapModulModal;
    window.mbyllModulModal = mbyllModulModal;
    window.setPozicioni = setPozicioni;
    window.setMobileTab = setMobileTab;
    window.ballinaSetView = ballinaSetView;
    window.filtroDetyratPerModul = filtroDetyratPerModul;
}

// =====================================================
// BOOTSTRAP
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    // Apliko pozicionin e ruajtur
    setPozicioni(_ballinaPoz);

    // Apliko mobile tab e ruajtur
    const mobileTab = localStorage.getItem(BALLINA_LS_TAB_MOBILE) || 'detyrat';
    setMobileTab(mobileTab);

    // Apliko view mode (Modul / Prioritet)
    ballinaSetView(_ballinaViewMode);

    // Popullo KPI shtesë (pas renderAll nga dashboard.js)
    // dashboard.js shkrep DOMContentLoaded → initGreeting + renderAll
    // Por renderAll() nuk prek elementet tona të reja. Thirrim direkt.
    setTimeout(() => {
        try { ballinaKpiShtese(); } catch(e) { console.warn('KPI shtesë:', e.message); }
        renderModuleCards();
        ballinaBindDelegatedHandlers();
    }, 100);

    // Mobile tab badge: count i detyrave aktive
    const badge = document.getElementById('ballina-tab-badge-detyrat');
    if (badge) {
        try {
            const n = ballinaDetyratVisible().length;
            badge.textContent = n;
        } catch(e) {}
    }
});
