// ============================================================
// RAPORTET.JS — Moduli i raporteve (v3)
// 5 raporte: Debitoret, Rinovimet, Kontratat, Faturimi, Oferta
// ============================================================

const MUAJT_REP = ['janar','shkurt','mars','prill','maj','qershor','korrik','gusht','shtator','tetor','nentor','dhjetor'];
const MUAJT_LABEL = ['Janar','Shkurt','Mars','Prill','Maj','Qershor','Korrik','Gusht','Shtator','Tetor','Nentor','Dhjetor'];

const MODULET = [
    { key:'hub', label:'Hub', icon:'home' },
    { key:'produkti', label:'Produkti', icon:'package' },
    { key:'oferta', label:'Oferta', icon:'clipboard-list' },
    { key:'kontratat', label:'Kontratat', icon:'file-text' },
    { key:'rinovimet', label:'Rinovimet', icon:'refresh-cw' },
    { key:'faturimi', label:'Faturimi', icon:'receipt' },
    { key:'debitoret', label:'Debitorët', icon:'wallet' },
    { key:'detyrat', label:'Detyrat', icon:'check-circle' },
    { key:'stafi', label:'Stafi', icon:'users' }
];

const SUBTABS = {
    debitoret: [
        { key:'permbledhje', label:'Përmbledhje' },
        { key:'krahasim', label:'Krahasim mujor' },
        { key:'deget', label:'Sipas degëve' },
        { key:'agjentet', label:'Sipas agjentëve' },
        { key:'topklient', label:'Top klientët' }
    ],
    rinovimet: [
        { key:'permbledhje', label:'Përmbledhje' },
        { key:'krahasim', label:'Krahasim mujor' },
        { key:'deget', label:'Sipas degëve' },
        { key:'agjentet', label:'Sipas agjentëve' },
        { key:'performanca', label:'Performanca LR/CR' }
    ],
    kontratat: [
        { key:'permbledhje', label:'Përmbledhje' },
        { key:'krahasim', label:'Krahasim mujor' },
        { key:'lloji', label:'Sipas llojit' },
        { key:'deget', label:'Sipas degëve' },
        { key:'agjentet', label:'Sipas agjentëve' }
    ],
    faturimi: [
        { key:'permbledhje', label:'Përmbledhje' },
        { key:'krahasim', label:'Krahasim mujor' },
        { key:'agjentet', label:'Sipas agjentëve' },
        { key:'probleme', label:'Faturat me probleme' }
    ],
    oferta: [
        { key:'permbledhje', label:'Përmbledhje' },
        { key:'krahasim', label:'Krahasim mujor' },
        { key:'lloji', label:'Sipas llojit' },
        { key:'deget', label:'Sipas degëve' },
        { key:'agjentet', label:'Sipas agjentëve' },
        { key:'topoferta', label:'Top oferta' }
    ]
};

const STATUSET_DEB_PAGUAR = ['paguar_total','paguar_pjesshem'];

let currentModule = 'hub';
let currentSubtab = { debitoret:'permbledhje', rinovimet:'permbledhje', kontratat:'permbledhje', faturimi:'permbledhje', oferta:'permbledhje' };
let sortState = {};

document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    renderModulesRow();
    renderHub();
    initFilters();
    Object.keys(SUBTABS).forEach(m => renderSubtabsFor(m));
    const params = new URLSearchParams(window.location.search);
    const mod = params.get('modul');
    if (mod && MODULET.find(m => m.key === mod)) switchModule(mod);
});

// ============ USER & ROLE ============
function merrUser() {
    try {
        const u = JSON.parse(localStorage.getItem('user_aktual') || localStorage.getItem('currentUser') || '{}');
        return {
            username: u.username || '',
            emri: u.emri || u.emriPlote || u.username || 'System',
            roli: (u.role || u.roli || 'staff').toLowerCase(),
            dega: u.dega || '',
            agjenti: u.emri || u.agjenti || ''
        };
    } catch {
        return { username:'', emri:'System', roli:'superadmin', dega:'', agjenti:'' };
    }
}

function eshteMenaxher() {
    const r = merrUser().roli;
    return ['superadmin','management','dep_management','admin','ceo','deputy_ceo','director','deputy_director'].includes(r);
}

function merrStafiList() {
    try {
        const stafi = JSON.parse(localStorage.getItem('stafi') || '[]');
        const map = {};
        stafi.forEach(s => {
            const key = (s.emri || s.emriPlote || '').toLowerCase().trim();
            if (key) map[key] = s.dega || 'Pa dege';
        });
        return map;
    } catch { return {}; }
}

function filtroSipasRolit(list, opts = {}) {
    if (eshteMenaxher()) return list;
    const u = merrUser();
    const fieldAgjent = opts.agjenti || 'agjenti';
    return list.filter(x => {
        const xa = (x[fieldAgjent] || '').toLowerCase();
        if (u.agjenti && xa === u.agjenti.toLowerCase()) return true;
        return false;
    });
}

// Normalizon field-e camelCase/snake_case (perdoret per oferta)
function normalizoOferta(o) {
    return {
        ...o,
        agjenti: o.agjenti || o.perfaqesuesi || '',
        data_krijimit: o.data_krijimit || o.dataKrijimit || '',
        data_skadon: o.data_skadon || o.dataSkadon || '',
        nr_personash: o.nr_personash || o.nrPersonash || (Array.isArray(o.personat) ? o.personat.length : 1)
    };
}

// ============ MODULES ROW ============
function renderModulesRow() {
    const c = document.getElementById('repModulesRow');
    c.innerHTML = MODULET.map(m => `
        <button class="rep-mod-tab ${m.key === currentModule ? 'active' : ''}" onclick="switchModule('${m.key}')">
            <i data-lucide="${m.icon}"></i>
            ${m.label}
        </button>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function switchModule(key) {
    currentModule = key;
    document.querySelectorAll('.rep-content').forEach(el => el.classList.remove('active'));
    document.getElementById('rep-' + key)?.classList.add('active');
    renderModulesRow();
    const url = new URL(window.location);
    if (key === 'hub') url.searchParams.delete('modul');
    else url.searchParams.set('modul', key);
    window.history.replaceState({}, '', url);
    if (key === 'hub') renderHub();
    if (key === 'debitoret') renderRaportiDebitoret();
    if (key === 'rinovimet') renderRaportiRinovimet();
    if (key === 'kontratat') renderRaportiKontratat();
    if (key === 'faturimi') renderRaportiFaturimi();
    if (key === 'oferta') renderRaportiOferta();
}

// ============ HUB ============
function renderHub() {
    const grid = document.getElementById('repHubGrid');
    grid.innerHTML = [
        buildHubCardProdukti(),
        buildHubCardOferta(),
        buildHubCardKontratat(),
        buildHubCardRinovimet(),
        buildHubCardFaturimi(),
        buildHubCardDebitoret(),
        buildHubCardDetyrat(),
        buildHubCardStafi()
    ].join('');
    if (window.lucide) lucide.createIcons();
}

function buildHubCard({ key, icon, iconClass, title, sub, metrics, status }) {
    return `
        <div class="rep-card" onclick="switchModule('${key}')">
            <div class="rep-card-header">
                <div class="rep-card-icon ${iconClass}"><i data-lucide="${icon}"></i></div>
                <div>
                    <h3 class="rep-card-title">${title}</h3>
                    <div class="rep-card-sub">${sub}</div>
                </div>
            </div>
            <div class="rep-card-metrics">
                ${metrics.map(m => `
                    <div class="rep-card-metric">
                        <div class="rcm-label">${m.label}</div>
                        <div class="rcm-value ${m.color || ''}">${m.value}</div>
                    </div>
                `).join('')}
            </div>
            <div class="rep-card-footer">
                <span class="rep-card-link">Hap raportin <i data-lucide="arrow-right"></i></span>
                <span class="rep-card-status">${status || ''}</span>
            </div>
        </div>
    `;
}

function buildHubCardProdukti() {
    return buildHubCard({
        key:'produkti', icon:'package', iconClass:'ric-produkti',
        title:'Produkti', sub:'Importohet nga sistemi i shitjeve',
        metrics:[
            { label:'Kontrata', value:'—' }, { label:'Të siguruar', value:'—' },
            { label:'Pako top', value:'—' }, { label:'Vlera', value:'—' }
        ],
        status:'Së shpejti'
    });
}

function buildHubCardOferta() {
    let data = [];
    try { data = JSON.parse(localStorage.getItem('ofertat') || '[]'); } catch {}
    const total = data.length;
    const realizuar = data.filter(o => o.statusi === 'realizuar' || o.statusi === 'kontrate').length;
    const presin = data.filter(o => o.statusi === 'presin' || o.statusi === 'aktive').length;
    const conv = total ? ((realizuar/total)*100).toFixed(0) : 0;
    return buildHubCard({
        key:'oferta', icon:'clipboard-list', iconClass:'ric-oferta',
        title:'Oferta', sub:'Pipeline i shitjeve',
        metrics:[
            { label:'Total', value:total },
            { label:'Realizuar', value:realizuar, color:'green' },
            { label:'Conversion', value:conv+'%', color:'blue' },
            { label:'Presin', value:presin, color:'amber' }
        ],
        status:'I disponueshëm'
    });
}

function buildHubCardKontratat() {
    let data = [];
    try { data = JSON.parse(localStorage.getItem('kontratat') || '[]'); } catch {}
    const total = data.length;
    const aktive = data.filter(k => !k.statusi || k.statusi === 'aktive').length;
    const skaduar = data.filter(k => k.statusi === 'skaduar').length;
    const llojet = { individ:0, familje:0, biznes:0 };
    data.forEach(k => { if (llojet[k.lloji] !== undefined) llojet[k.lloji]++; });
    return buildHubCard({
        key:'kontratat', icon:'file-text', iconClass:'ric-kontratat',
        title:'Kontratat', sub:'Portfolio aktive',
        metrics:[
            { label:'Total', value:total },
            { label:'Aktive', value:aktive, color:'green' },
            { label:'Skaduar', value:skaduar, color:'red' },
            { label:'Individ', value:llojet.individ }
        ],
        status:'I disponueshëm'
    });
}

function buildHubCardRinovimet() {
    let data = [];
    try { data = JSON.parse(localStorage.getItem('rinovimet_data') || '[]'); } catch {}
    data = filtroSipasRolit(data);
    const total = data.length;
    const rinovuar = data.filter(r => r.statusi === 'rinovuar').length;
    const humbur = data.filter(r => r.statusi === 'humbur').length;
    const primi = data.reduce((s,r) => s + (Number(r.primi_vjetor || r.total_primi) || 0), 0);
    return buildHubCard({
        key:'rinovimet', icon:'refresh-cw', iconClass:'ric-rinovimet',
        title:'Rinovimet', sub:'Procesi i rinovimeve',
        metrics:[
            { label:'Total', value:total },
            { label:'Rinovuar', value:rinovuar, color:'green' },
            { label:'Humbur', value:humbur, color:'red' },
            { label:'Primi', value:formatMoneyShort(primi), color:'blue' }
        ],
        status:'I disponueshëm'
    });
}

function buildHubCardFaturimi() {
    let data = [];
    try { data = JSON.parse(localStorage.getItem('faturimi_klientet') || '[]'); } catch {}
    const total = data.length;
    const leshuar = data.filter(f => f.statusi === 'leshuar').length;
    const proces = data.filter(f => f.statusi === 'ne_proces').length;
    const rate = total ? ((leshuar/total)*100).toFixed(0) : 0;
    return buildHubCard({
        key:'faturimi', icon:'receipt', iconClass:'ric-faturimi',
        title:'Faturimi', sub:'Faturat dhe lëshimi',
        metrics:[
            { label:'Total', value:total },
            { label:'Lëshuar', value:leshuar, color:'green' },
            { label:'Issuance', value:rate+'%', color:'blue' },
            { label:'Proces', value:proces, color:'amber' }
        ],
        status:'I disponueshëm'
    });
}

function buildHubCardDebitoret() {
    let data = [];
    try { data = JSON.parse(localStorage.getItem('debitoret_data_v1') || '[]'); } catch {}
    data = filtroSipasRolit(data);
    const muajt = [...new Set(data.map(r => r.muaji).filter(Boolean))].sort((a,b) => {
        const [ma, ya] = a.split('_'); const [mb, yb] = b.split('_');
        return (parseInt(ya) - parseInt(yb)) || (MUAJT_REP.indexOf(ma) - MUAJT_REP.indexOf(mb));
    });
    const lastMuaj = muajt[muajt.length - 1];
    const filtered = lastMuaj ? data.filter(r => r.muaji === lastMuaj) : [];
    const total = filtered.length;
    const totalBorxh = filtered.reduce((s,r) => s + Number(r.debitori_total || 0), 0);
    const risk = filtered.reduce((s,r) => s + Number(r.borxh_mbi_365 || 0), 0);
    const paguar = filtered.filter(r => STATUSET_DEB_PAGUAR.includes(r.statusi)).reduce((s,r) => s + Number(r.shuma_paguar || r.debitori_total || 0), 0);
    return buildHubCard({
        key:'debitoret', icon:'wallet', iconClass:'ric-debitoret',
        title:'Debitorët', sub:'Borxhet dhe rikuperimet',
        metrics:[
            { label:'Klientë', value:total },
            { label:'Borxhi', value:formatMoneyShort(totalBorxh), color:'red' },
            { label:'Mbi 365', value:formatMoneyShort(risk), color:'red' },
            { label:'Rikuperuar', value:formatMoneyShort(paguar), color:'green' }
        ],
        status:'I disponueshëm'
    });
}

function buildHubCardDetyrat() {
    return buildHubCard({
        key:'detyrat', icon:'check-circle', iconClass:'ric-detyrat',
        title:'Detyrat', sub:'Follow-ups dhe aktivitete',
        metrics:[
            { label:'Aktive', value:'—' }, { label:'Përfunduar', value:'—' },
            { label:'Vonuar', value:'—' }, { label:'Sot', value:'—' }
        ],
        status:'Së shpejti'
    });
}

function buildHubCardStafi() {
    let data = [];
    try { data = JSON.parse(localStorage.getItem('stafi') || '[]'); } catch {}
    return buildHubCard({
        key:'stafi', icon:'users', iconClass:'ric-stafi',
        title:'Stafi', sub:'Performanca e ekipit',
        metrics:[
            { label:'Total', value:data.length || '—' }, { label:'Aktivë', value:'—' },
            { label:'Degë', value:'—' }, { label:'Top', value:'—' }
        ],
        status:'Së shpejti'
    });
}

// ============ FILTRAT ============
function initFilters() {
    const tani = new Date();
    const aktualVit = tani.getFullYear();
    const aktualMuaj = MUAJT_REP[tani.getMonth()];
    const vitet = new Set();
    ['debitoret_data_v1','rinovimet_data'].forEach(k => {
        try {
            const arr = JSON.parse(localStorage.getItem(k) || '[]');
            arr.forEach(r => { if (r.muaji) { const y = r.muaji.split('_')[1]; if (y) vitet.add(y); } });
        } catch {}
    });
    vitet.add(String(aktualVit));
    const vitArr = [...vitet].sort().reverse();
    const vitOptions = vitArr.map(v => `<option value="${v}">${v}</option>`).join('');
    const muajOptionsTotal = '<option value="total">Total viti</option>' + MUAJT_REP.map((m,i) => `<option value="${m}">${MUAJT_LABEL[i]}</option>`).join('');
    const muajOptionsNoTotal = MUAJT_REP.map((m,i) => `<option value="${m}">${MUAJT_LABEL[i]}</option>`).join('');

    const debViti = document.getElementById('repDebViti');
    const debMuaji = document.getElementById('repDebMuaji');
    if (debViti) { debViti.innerHTML = vitOptions; debViti.value = String(aktualVit); }
    if (debMuaji) { debMuaji.innerHTML = muajOptionsNoTotal; debMuaji.value = aktualMuaj; }

    ['repRinViti','repKonViti','repFatViti','repOfeViti'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) { sel.innerHTML = vitOptions; sel.value = String(aktualVit); }
    });
    ['repRinMuaji','repKonMuaji','repFatMuaji','repOfeMuaji'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) { sel.innerHTML = muajOptionsTotal; sel.value = 'total'; }
    });
}

// ============ SUBTABS ============
function renderSubtabsFor(modul) {
    const containerId = {
        debitoret:'repDebSubtabs', rinovimet:'repRinSubtabs',
        kontratat:'repKonSubtabs', faturimi:'repFatSubtabs', oferta:'repOfeSubtabs'
    }[modul];
    const c = document.getElementById(containerId);
    if (!c) return;
    c.innerHTML = SUBTABS[modul].map(t =>
        `<button class="rep-subtab ${t.key === currentSubtab[modul] ? 'active' : ''}" onclick="switchSubtab('${modul}','${t.key}')">${t.label}</button>`
    ).join('');
}

function switchSubtab(modul, key) {
    currentSubtab[modul] = key;
    renderSubtabsFor(modul);
    if (modul === 'debitoret') renderRaportiDebitoret();
    if (modul === 'rinovimet') renderRaportiRinovimet();
    if (modul === 'kontratat') renderRaportiKontratat();
    if (modul === 'faturimi') renderRaportiFaturimi();
    if (modul === 'oferta') renderRaportiOferta();
}

// ============================================================
// HELPERS TË PËRBASHKËT
// ============================================================
function buildSummaryStrip(items) {
    return `
        <div class="rep-summary-strip">
            ${items.map(it => `
                <div class="rep-ss-item ${it.cls || ''}">
                    <div class="rss-label">${it.label}</div>
                    <div class="rss-value">${it.value}</div>
                    ${it.sub ? `<div class="rss-sub">${it.sub}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function buildInsightCardSmall(question, mainValue, deltaPct, context, isPositive) {
    const color = isPositive === null ? '#64748b' : isPositive ? '#22c55e' : '#ef4444';
    const cls = isPositive === null ? 'neutral' : isPositive ? 'success' : 'danger';
    return `
        <div class="rep-insight-small ${cls}">
            <div class="ris-q">${question}</div>
            <div class="ris-main">
                <span class="ris-val" style="color:${color}">${mainValue}</span>
                ${deltaPct ? `<span class="ris-pct" style="color:${color}">${deltaPct}</span>` : ''}
            </div>
            <div class="ris-ctx">${context}</div>
        </div>
    `;
}

function buildStatsCards3x2(items) {
    return `
        <div class="rep-statuset-grid">
            ${items.map(s => `
                <div class="rep-statuset-card">
                    <div class="rsg-label">${s.label}</div>
                    <div class="rsg-num" style="color:${s.color}">${s.count}</div>
                    ${s.value !== undefined ? `<div class="rsg-val">${formatMoneyShort(s.value)}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function buildBarChartHorizontal(rows, valueKey, labelKey, colorGradient, formatter) {
    const max = Math.max(...rows.map(r => Math.abs(r[valueKey] || 0)), 1);
    return rows.map(r => `
        <div class="rep-bar-row" style="margin-bottom:14px">
            <div class="rep-bar-label">${esc(r[labelKey])}</div>
            <div class="rep-bar-track" style="height:22px"><div class="rep-bar-fill" style="width:${(Math.abs(r[valueKey] || 0)/max*100).toFixed(1)}%;background:${colorGradient};height:100%"></div></div>
            <div class="rep-bar-value">${formatter ? formatter(r[valueKey]) : r[valueKey]}</div>
        </div>
    `).join('');
}

function sortRows(rows, tableKey, defaultField, defaultDir) {
    const s = sortState[tableKey] || { field: defaultField, dir: defaultDir };
    return [...rows].sort((a, b) => {
        const va = a[s.field], vb = b[s.field];
        if (typeof va === 'string') {
            return s.dir === 'asc' ? va.localeCompare(vb, 'sq') : vb.localeCompare(va, 'sq');
        }
        return s.dir === 'asc' ? (va - vb) : (vb - va);
    });
}

function sortTable(tableKey, field, modul) {
    const current = sortState[tableKey];
    if (current && current.field === field) {
        sortState[tableKey] = { field, dir: current.dir === 'asc' ? 'desc' : 'asc' };
    } else {
        sortState[tableKey] = { field, dir: 'desc' };
    }
    if (modul === 'debitoret') renderRaportiDebitoret();
    if (modul === 'rinovimet') renderRaportiRinovimet();
    if (modul === 'kontratat') renderRaportiKontratat();
    if (modul === 'faturimi') renderRaportiFaturimi();
    if (modul === 'oferta') renderRaportiOferta();
}

function sortArrow(tableKey, field) {
    const s = sortState[tableKey];
    if (!s || s.field !== field) return '';
    return s.dir === 'asc' ? '▲' : '▼';
}

function getPrevMonth(viti, muaji) {
    if (muaji === 'total') return null;
    const idx = MUAJT_REP.indexOf(muaji);
    if (idx === 0) return { viti: String(Number(viti)-1), muaji: 'dhjetor' };
    return { viti, muaji: MUAJT_REP[idx-1] };
}

function filterByMuaj(all, viti, muaji, field='muaji') {
    return all.filter(r => {
        if (!r[field]) return false;
        const [m, y] = r[field].split('_');
        if (y !== viti) return false;
        if (muaji === 'total') return true;
        return m === muaji;
    });
}

// Lexon date nga ndonje field (mbulon camelCase + snake_case)
function readRecordDate(r) {
    const fields = ['dataKrijimit','dataSkadon','data_krijimit','data_kontratës','data_kontrates','data_fillimit','data_oferta','data_skadon','created_at','createdAt'];
    for (const f of fields) {
        if (r[f]) {
            const d = new Date(r[f]);
            if (!isNaN(d)) return d;
        }
    }
    return null;
}

// Grupon rekorde sipas muajit, duke perdorur ndonje date field qe ekziston
function groupByMonth(all, viti) {
    const g = {};
    MUAJT_REP.forEach(m => g[m] = []);
    all.forEach(r => {
        const dt = readRecordDate(r);
        if (!dt || dt.getFullYear() !== Number(viti)) return;
        const m = MUAJT_REP[dt.getMonth()];
        if (g[m]) g[m].push(r);
    });
    return g;
}

// Filter sipas vitit/muajit duke perdorur readRecordDate
function filterByAnyDate(all, viti, muaji) {
    return all.filter(r => {
        const dt = readRecordDate(r);
        if (!dt) return false;
        if (dt.getFullYear() !== Number(viti)) return false;
        if (muaji === 'total') return true;
        return MUAJT_REP[dt.getMonth()] === muaji;
    });
}

// ============================================================
// RAPORTI 1: DEBITORET
// ============================================================
function renderRaportiDebitoret() {
    const container = document.getElementById('repDebContent');
    if (!container) return;
    const viti = document.getElementById('repDebViti')?.value || String(new Date().getFullYear());
    const muaji = document.getElementById('repDebMuaji')?.value || MUAJT_REP[new Date().getMonth()];
    let allData = [];
    try { allData = JSON.parse(localStorage.getItem('debitoret_data_v1') || '[]'); } catch {}
    allData = filtroSipasRolit(allData);
    const filtered = filterByMuaj(allData, viti, muaji);

    if (filtered.length === 0) {
        container.innerHTML = `<div class="rep-empty"><div class="rep-empty-title">Nuk ka të dhëna</div><div class="rep-empty-sub">Për ${MUAJT_LABEL[MUAJT_REP.indexOf(muaji)]} ${viti} nuk ka rekorde debitorësh</div></div>`;
        return;
    }

    const sub = currentSubtab.debitoret;
    if (sub === 'permbledhje') container.innerHTML = renderDebPermbledhje(filtered, allData, viti, muaji);
    if (sub === 'krahasim') container.innerHTML = renderDebKrahasim(allData, viti);
    if (sub === 'deget') container.innerHTML = renderDebDeget(filtered);
    if (sub === 'agjentet') container.innerHTML = renderDebAgjentet(filtered);
    if (sub === 'topklient') container.innerHTML = renderDebTopKlient(filtered);
    if (window.lucide) lucide.createIcons();
}

function renderDebPermbledhje(data, allData, viti, muaji) {
    const totalBorxh = data.reduce((s,r) => s + Number(r.debitori_total || 0), 0);
    const totalRisk = data.reduce((s,r) => s + Number(r.borxh_mbi_365 || 0), 0);
    const paguarTotal = data.filter(r => r.statusi === 'paguar_total').reduce((s,r) => s + Number(r.shuma_paguar || r.debitori_total || 0), 0);
    const paguarPjess = data.filter(r => r.statusi === 'paguar_pjesshem').reduce((s,r) => s + Number(r.shuma_paguar || 0), 0);
    const totalPaguar = paguarTotal + paguarPjess;
    const mbetur = totalBorxh - totalPaguar;

    const counts = {};
    ['kontaktuar','premtim_pagese','paguar_total','paguar_pjesshem','kontestuar','i_pamundshem'].forEach(k => counts[k] = { c:0, v:0 });
    data.forEach(r => {
        if (counts[r.statusi]) {
            counts[r.statusi].c++;
            counts[r.statusi].v += Number(r.debitori_total || 0);
        }
    });

    const aging = { p0_31:0, p31_60:0, p61_90:0, p91_180:0, p181_365:0, mbi_365:0 };
    data.forEach(r => {
        aging.p0_31 += Number(r.borxh_0_31 || 0);
        aging.p31_60 += Number(r.borxh_31_60 || 0);
        aging.p61_90 += Number(r.borxh_61_90 || 0);
        aging.p91_180 += Number(r.borxh_91_180 || 0);
        aging.p181_365 += Number(r.borxh_181_365 || 0);
        aging.mbi_365 += Number(r.borxh_mbi_365 || 0);
    });
    const maxAging = Math.max(...Object.values(aging), 1);
    const periudha = `${MUAJT_LABEL[MUAJT_REP.indexOf(muaji)]} ${viti}`;

    const prev = getPrevMonth(viti, muaji);
    let insight = '';
    if (prev) {
        const prevData = allData.filter(r => r.muaji === `${prev.muaji}_${prev.viti}`);
        if (prevData.length > 0) {
            const prevBorxh = prevData.reduce((s,r) => s + Number(r.debitori_total || 0), 0);
            const delta = totalBorxh - prevBorxh;
            const deltaPct = prevBorxh ? ((delta/prevBorxh)*100).toFixed(1) : 0;
            const rritet = delta > 0;
            insight = buildInsightCardSmall(
                'A po rritet borxhi total?',
                rritet ? 'PO' : delta < 0 ? 'JO' : 'STABIL',
                (delta >= 0 ? '+' : '') + deltaPct + '%',
                `${formatMoneyShort(prevBorxh)} → ${formatMoneyShort(totalBorxh)}<br>Diferenca: <strong>${delta >= 0 ? '+' : ''}${formatMoneyShort(delta)}</strong>`,
                !rritet
            );
        }
    }
    if (!insight) {
        insight = buildInsightCardSmall('A po rritet borxhi total?', '—', '', 'Nuk ka të dhëna nga muaji paraprak', null);
    }

    return `
        <div class="rep-perm-row">
            <div class="rep-perm-strip">
                ${buildSummaryStrip([
                    { label:'Borxhi total', value:formatMoney(totalBorxh), sub:`${data.length} klientë · ${periudha}` },
                    { label:'Mbi 365 ditë', value:formatMoney(totalRisk), cls:'danger', sub:`${totalBorxh ? ((totalRisk/totalBorxh)*100).toFixed(1) : 0}% e totalit` },
                    { label:'Paguar', value:formatMoney(totalPaguar), cls:'highlight', sub:`${counts.paguar_total.c + counts.paguar_pjesshem.c} klientë` },
                    { label:'Mbetur', value:formatMoney(mbetur), cls:'warning', sub:`${totalBorxh ? ((mbetur/totalBorxh)*100).toFixed(1) : 0}% e mbetur` }
                ])}
            </div>
            <div class="rep-perm-insight">${insight}</div>
        </div>

        <div class="rep-section-title">Statuset</div>
        ${buildStatsCards3x2([
            { label:'Kontaktuar', count:counts.kontaktuar.c, value:counts.kontaktuar.v, color:'#f59e0b' },
            { label:'Premtim pagese', count:counts.premtim_pagese.c, value:counts.premtim_pagese.v, color:'#3b82f6' },
            { label:'Paguar total', count:counts.paguar_total.c, value:counts.paguar_total.v, color:'#22c55e' },
            { label:'Paguar pjesshëm', count:counts.paguar_pjesshem.c, value:counts.paguar_pjesshem.v, color:'#84cc16' },
            { label:'Kontestuar', count:counts.kontestuar.c, value:counts.kontestuar.v, color:'#f87171' },
            { label:'I pamundshëm', count:counts.i_pamundshem.c, value:counts.i_pamundshem.v, color:'#dc2626' }
        ])}

        <div class="rep-table-wrap" style="margin-top:18px">
            <div class="rep-table-header"><h3 class="rep-table-title">Shpërndarja sipas aging-ut</h3></div>
            <div style="padding:18px 22px">
                ${[
                    {l:'0–31 ditë', v:aging.p0_31, c:'#22c55e'},
                    {l:'31–60 ditë', v:aging.p31_60, c:'#84cc16'},
                    {l:'61–90 ditë', v:aging.p61_90, c:'#fbbf24'},
                    {l:'91–180 ditë', v:aging.p91_180, c:'#f59e0b'},
                    {l:'181–365 ditë', v:aging.p181_365, c:'#f87171'},
                    {l:'Mbi 365 ditë', v:aging.mbi_365, c:'#dc2626'}
                ].map(b => `
                    <div class="rep-bar-row">
                        <div class="rep-bar-label">${b.l}</div>
                        <div class="rep-bar-track"><div class="rep-bar-fill" style="width:${(b.v/maxAging*100).toFixed(1)}%;background:${b.c}"></div></div>
                        <div class="rep-bar-value">${formatMoney(b.v)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderDebKrahasim(allData, viti) {
    const muajRows = MUAJT_REP.map((m,i) => {
        const monthData = allData.filter(r => r.muaji === `${m}_${viti}`);
        return {
            muaji: m, label: MUAJT_LABEL[i],
            klient: monthData.length,
            borxh: monthData.reduce((s,r) => s + Number(r.debitori_total || 0), 0),
            risk: monthData.reduce((s,r) => s + Number(r.borxh_mbi_365 || 0), 0),
            paguar: monthData.filter(r => STATUSET_DEB_PAGUAR.includes(r.statusi)).length
        };
    }).filter(r => r.klient > 0);

    if (muajRows.length === 0) {
        return `<div class="rep-empty"><div class="rep-empty-title">Nuk ka të dhëna për krahasim</div></div>`;
    }

    return `
        <div class="rep-table-wrap" style="margin-bottom:18px">
            <div class="rep-table-header"><h3 class="rep-table-title">Detaje mujore me delta</h3></div>
            <table class="rep-table">
                <thead>
                    <tr>
                        <th>Muaji</th>
                        <th class="right">Klientë</th>
                        <th class="right">Δ</th>
                        <th class="right">Borxhi total</th>
                        <th class="right">Δ %</th>
                        <th class="right">Mbi 365</th>
                        <th class="right">Rikuperuar</th>
                    </tr>
                </thead>
                <tbody>
                    ${muajRows.map((r,i) => {
                        const prev = i > 0 ? muajRows[i-1] : null;
                        const dKlient = prev ? r.klient - prev.klient : 0;
                        const dBorxh = prev ? r.borxh - prev.borxh : 0;
                        const dBorxhPct = prev && prev.borxh ? ((dBorxh/prev.borxh)*100).toFixed(1) : '0.0';
                        const arrow = (n) => n > 0 ? '↑' : n < 0 ? '↓' : '→';
                        const cls = (n) => n > 0 ? 'up' : n < 0 ? 'down' : 'neutral';
                        return `
                            <tr>
                                <td><strong>${r.label}</strong></td>
                                <td class="right">${r.klient}</td>
                                <td class="right">${prev ? `<span class="rep-delta ${cls(dKlient)}">${arrow(dKlient)} ${Math.abs(dKlient)}</span>` : '—'}</td>
                                <td class="right"><strong>${formatMoney(r.borxh)}</strong></td>
                                <td class="right">${prev ? `<span class="rep-delta ${cls(dBorxh)}">${arrow(dBorxh)} ${dBorxhPct}%</span>` : '—'}</td>
                                <td class="right" style="color:${r.risk>0?'#ef4444':'#94a3b8'}">${formatMoney(r.risk)}</td>
                                <td class="right" style="color:#22c55e;font-weight:600">${r.paguar}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <div class="rep-3col">
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Borxhi total</h3></div>
                <div style="padding:18px 22px">
                    ${buildBarChartHorizontal(muajRows, 'borxh', 'label', 'linear-gradient(90deg,#002B5C,#3b82f6)', formatMoneyShort)}
                </div>
            </div>
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Klientë me borxh</h3></div>
                <div style="padding:18px 22px">
                    ${buildBarChartHorizontal(muajRows, 'klient', 'label', 'linear-gradient(90deg,#7c3aed,#a855f7)', n=>n)}
                </div>
            </div>
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Mbi 365 ditë</h3></div>
                <div style="padding:18px 22px">
                    ${buildBarChartHorizontal(muajRows, 'risk', 'label', 'linear-gradient(90deg,#dc2626,#f87171)', formatMoneyShort)}
                </div>
            </div>
        </div>
    `;
}

function renderDebDeget(data) {
    const dege = {};
    data.forEach(r => {
        const d = r.dega || 'Pa degë';
        if (!dege[d]) dege[d] = { klient:0, borxh:0, risk:0, paguar:0, paguarVal:0 };
        dege[d].klient++;
        dege[d].borxh += Number(r.debitori_total || 0);
        dege[d].risk += Number(r.borxh_mbi_365 || 0);
        if (STATUSET_DEB_PAGUAR.includes(r.statusi)) dege[d].paguar++;
        if (r.statusi === 'paguar_total') dege[d].paguarVal += Number(r.shuma_paguar || r.debitori_total || 0);
        if (r.statusi === 'paguar_pjesshem') dege[d].paguarVal += Number(r.shuma_paguar || 0);
    });

    const rows = Object.keys(dege).map(d => ({
        emri: d, klient: dege[d].klient, borxh: dege[d].borxh, risk: dege[d].risk,
        paguar: dege[d].paguar, paguarVal: dege[d].paguarVal,
        recovery: dege[d].klient ? (dege[d].paguar/dege[d].klient*100) : 0,
        riskRatio: dege[d].borxh ? (dege[d].risk/dege[d].borxh*100) : 0
    }));

    const sorted = sortRows(rows, 'debDeget', 'borxh', 'desc');
    const maxBorxh = Math.max(...rows.map(d => d.borxh), 1);

    return `
        <div class="rep-2col left-bigger">
            <div class="rep-table-wrap">
                <div class="rep-table-header">
                    <h3 class="rep-table-title">Performanca sipas degëve</h3>
                    <input class="rep-table-search" placeholder="Kërko degë..." onkeyup="filtroTabelen(this,'#tblDebDeget')">
                </div>
                <table class="rep-table sortable" id="tblDebDeget">
                    <thead>
                        <tr>
                            <th onclick="sortTable('debDeget','emri','debitoret')">Dega ${sortArrow('debDeget','emri')}</th>
                            <th class="right" onclick="sortTable('debDeget','klient','debitoret')">Kl. ${sortArrow('debDeget','klient')}</th>
                            <th class="right" onclick="sortTable('debDeget','borxh','debitoret')">Borxhi ${sortArrow('debDeget','borxh')}</th>
                            <th class="right" onclick="sortTable('debDeget','recovery','debitoret')">Rec% ${sortArrow('debDeget','recovery')}</th>
                            <th class="right" onclick="sortTable('debDeget','riskRatio','debitoret')">Risk% ${sortArrow('debDeget','riskRatio')}</th>
                            <th class="right" onclick="sortTable('debDeget','risk','debitoret')">Mbi 365 ${sortArrow('debDeget','risk')}</th>
                            <th class="right" onclick="sortTable('debDeget','paguarVal','debitoret')">Paguar ${sortArrow('debDeget','paguarVal')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(d => `
                            <tr data-name="${esc(d.emri).toLowerCase()}">
                                <td><strong>${esc(d.emri)}</strong></td>
                                <td class="right">${d.klient}</td>
                                <td class="right"><strong>${formatMoneyShort(d.borxh)}</strong></td>
                                <td class="right" style="color:${d.recovery<20?'#ef4444':d.recovery<40?'#f59e0b':'#22c55e'};font-weight:700">${d.recovery.toFixed(1)}%</td>
                                <td class="right" style="color:${d.riskRatio>30?'#ef4444':d.riskRatio>15?'#f59e0b':'#22c55e'};font-weight:600">${d.riskRatio.toFixed(1)}%</td>
                                <td class="right" style="color:${d.risk>0?'#ef4444':'#94a3b8'}">${formatMoneyShort(d.risk)}</td>
                                <td class="right" style="color:#22c55e;font-weight:600">${formatMoneyShort(d.paguarVal)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Vizualizim</h3></div>
                <div style="padding:18px 22px">
                    ${sorted.map(d => `
                        <div class="rep-bar-row">
                            <div class="rep-bar-label" title="${esc(d.emri)}">${esc(d.emri)}</div>
                            <div class="rep-bar-track"><div class="rep-bar-fill" style="width:${(d.borxh/maxBorxh*100).toFixed(1)}%;background:linear-gradient(90deg,#002B5C,#3b82f6)"></div></div>
                            <div class="rep-bar-value">${formatMoneyShort(d.borxh)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderDebAgjentet(data) {
    const agj = {};
    data.forEach(r => {
        const a = r.agjenti || 'Pa agjent';
        if (!agj[a]) agj[a] = { total:0, iRi:0, paguar:0, borxh:0, risk:0, paguarVal:0, dega:r.dega || 'Pa degë' };
        agj[a].total++;
        if (r.statusi === 'i_ri') agj[a].iRi++;
        if (STATUSET_DEB_PAGUAR.includes(r.statusi)) agj[a].paguar++;
        agj[a].borxh += Number(r.debitori_total || 0);
        agj[a].risk += Number(r.borxh_mbi_365 || 0);
        if (r.statusi === 'paguar_total') agj[a].paguarVal += Number(r.shuma_paguar || r.debitori_total || 0);
        if (r.statusi === 'paguar_pjesshem') agj[a].paguarVal += Number(r.shuma_paguar || 0);
    });

    const rows = Object.keys(agj).map(a => ({
        emri: a, dega: agj[a].dega, total: agj[a].total, iRi: agj[a].iRi,
        paguar: agj[a].paguar, borxh: agj[a].borxh, risk: agj[a].risk,
        paguarVal: agj[a].paguarVal,
        recovery: agj[a].total ? (agj[a].paguar/agj[a].total*100) : 0
    }));

    const sorted = sortRows(rows, 'debAgj', 'recovery', 'asc');

    return `
        <div class="rep-table-wrap">
            <div class="rep-table-header">
                <h3 class="rep-table-title">Performanca sipas agjentëve (default: Recovery Rate më i ulët lart)</h3>
                <input class="rep-table-search" placeholder="Kërko agjent..." onkeyup="filtroTabelen(this,'#tblDebAgj')">
            </div>
            <table class="rep-table sortable" id="tblDebAgj">
                <thead>
                    <tr>
                        <th onclick="sortTable('debAgj','emri','debitoret')">Agjenti ${sortArrow('debAgj','emri')}</th>
                        <th>Dega</th>
                        <th class="right" onclick="sortTable('debAgj','total','debitoret')">Klientë ${sortArrow('debAgj','total')}</th>
                        <th class="right" onclick="sortTable('debAgj','iRi','debitoret')">I ri ${sortArrow('debAgj','iRi')}</th>
                        <th class="right" onclick="sortTable('debAgj','borxh','debitoret')">Borxhi ${sortArrow('debAgj','borxh')}</th>
                        <th class="right" onclick="sortTable('debAgj','recovery','debitoret')">Recovery % ${sortArrow('debAgj','recovery')}</th>
                        <th class="right" onclick="sortTable('debAgj','risk','debitoret')">Mbi 365 ${sortArrow('debAgj','risk')}</th>
                        <th class="right" onclick="sortTable('debAgj','paguarVal','debitoret')">Paguar € ${sortArrow('debAgj','paguarVal')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(a => `
                        <tr data-name="${esc(a.emri).toLowerCase()}">
                            <td><strong>${esc(a.emri)}</strong></td>
                            <td><span style="font-size:11px;color:#64748b">${esc(a.dega)}</span></td>
                            <td class="right">${a.total}</td>
                            <td class="right" style="color:${a.iRi>0?'#ef4444':'#94a3b8'};font-weight:${a.iRi>0?'700':'400'}">${a.iRi}</td>
                            <td class="right"><strong>${formatMoney(a.borxh)}</strong></td>
                            <td class="right" style="color:${a.recovery<20?'#ef4444':a.recovery<40?'#f59e0b':'#22c55e'};font-weight:700">${a.recovery.toFixed(1)}%<div style="font-size:9px;color:#94a3b8;font-weight:400">${a.paguar}/${a.total}</div></td>
                            <td class="right" style="color:${a.risk>0?'#ef4444':'#94a3b8'}">${formatMoney(a.risk)}</td>
                            <td class="right" style="color:#22c55e;font-weight:600">${formatMoney(a.paguarVal)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderDebTopKlient(data) {
    const sorted = [...data].sort((a,b) => Number(b.debitori_total||0) - Number(a.debitori_total||0)).slice(0, 20);
    const agingLabel = (r) => {
        const buckets = [
            { label:'>365d', v:Number(r.borxh_mbi_365||0) },
            { label:'181-365d', v:Number(r.borxh_181_365||0) },
            { label:'91-180d', v:Number(r.borxh_91_180||0) },
            { label:'61-90d', v:Number(r.borxh_61_90||0) },
            { label:'31-60d', v:Number(r.borxh_31_60||0) },
            { label:'0-31d', v:Number(r.borxh_0_31||0) }
        ];
        const top = buckets.sort((a,b) => b.v - a.v)[0];
        return top.v > 0 ? top.label : '—';
    };
    const statusBadge = (s) => {
        const colors = { i_ri:'#94a3b8', kontaktuar:'#f59e0b', premtim_pagese:'#3b82f6', paguar_total:'#22c55e', paguar_pjesshem:'#84cc16', kontestuar:'#f87171', i_pamundshem:'#dc2626' };
        const labels = { i_ri:'I ri', kontaktuar:'Kontaktuar', premtim_pagese:'Premtim', paguar_total:'Paguar', paguar_pjesshem:'Pjesshëm', kontestuar:'Kontestuar', i_pamundshem:'I pamundshëm' };
        return `<span style="padding:3px 9px;border-radius:12px;font-size:10px;font-weight:600;background:${colors[s]||'#e2e8f0'}20;color:${colors[s]||'#64748b'}">${labels[s]||s}</span>`;
    };
    return `
        <div class="rep-table-wrap">
            <div class="rep-table-header">
                <h3 class="rep-table-title">Top 20 klientët me borxhin më të madh</h3>
                <input class="rep-table-search" placeholder="Kërko klient..." onkeyup="filtroTabelen(this,'#tblTopKlient')">
            </div>
            <table class="rep-table" id="tblTopKlient">
                <thead>
                    <tr>
                        <th style="width:40px">#</th>
                        <th>Klienti</th>
                        <th>Dega / Agjenti</th>
                        <th class="right">Borxhi total</th>
                        <th class="right">Mbi 365</th>
                        <th class="center">Aging</th>
                        <th class="center">Statusi</th>
                        <th class="center">Veprim</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map((r, i) => `
                        <tr data-name="${esc(r.klienti).toLowerCase()}">
                            <td style="font-weight:800;color:#64748b">${i+1}</td>
                            <td><strong>${esc(r.klienti)}</strong></td>
                            <td><div style="font-size:11px">${esc(r.dega||'—')}</div><div style="font-size:10px;color:#94a3b8">${esc(r.agjenti||'—')}</div></td>
                            <td class="right"><strong>${formatMoney(r.debitori_total||0)}</strong></td>
                            <td class="right" style="color:${Number(r.borxh_mbi_365||0)>0?'#ef4444':'#94a3b8'};font-weight:600">${formatMoney(r.borxh_mbi_365||0)}</td>
                            <td class="center" style="font-size:11px;color:#64748b">${agingLabel(r)}</td>
                            <td class="center">${statusBadge(r.statusi)}</td>
                            <td class="center"><a href="debitoret.html?hap=${esc(r.id)}" style="font-size:11px;color:#002B5C;font-weight:600;text-decoration:none">Hap →</a></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ============================================================
// RAPORTI 2: RINOVIMET
// ============================================================
function renderRaportiRinovimet() {
    const container = document.getElementById('repRinContent');
    if (!container) return;
    const viti = document.getElementById('repRinViti')?.value || String(new Date().getFullYear());
    const muaji = document.getElementById('repRinMuaji')?.value || 'total';
    let allData = [];
    try { allData = JSON.parse(localStorage.getItem('rinovimet_data') || '[]'); } catch {}
    allData = filtroSipasRolit(allData);
    const filtered = filterByMuaj(allData, viti, muaji);

    if (filtered.length === 0) {
        container.innerHTML = `<div class="rep-empty"><div class="rep-empty-title">Nuk ka të dhëna</div><div class="rep-empty-sub">Për ${muaji === 'total' ? 'vitin ' + viti : MUAJT_LABEL[MUAJT_REP.indexOf(muaji)] + ' ' + viti} nuk ka rinovime</div></div>`;
        return;
    }

    const sub = currentSubtab.rinovimet;
    if (sub === 'permbledhje') container.innerHTML = renderRinPermbledhje(filtered, allData, viti, muaji);
    if (sub === 'krahasim') container.innerHTML = renderRinKrahasim(allData, viti);
    if (sub === 'deget') container.innerHTML = renderRinDeget(filtered);
    if (sub === 'agjentet') container.innerHTML = renderRinAgjentet(filtered);
    if (sub === 'performanca') container.innerHTML = renderRinPerformanca(filtered);
    if (window.lucide) lucide.createIcons();
}

function renderRinPermbledhje(data, allData, viti, muaji) {
    const total = data.length;
    const rinovuar = data.filter(r => r.statusi === 'rinovuar').length;
    const humbur = data.filter(r => r.statusi === 'humbur').length;
    const paFilluar = data.filter(r => r.statusi === 'pa_filluar' || !r.statusi).length;
    const kontaktuar = data.filter(r => r.statusi === 'kontaktuar').length;
    const renewalRate = total ? (rinovuar/total*100) : 0;

    const primi = data.reduce((s,r) => s + Number(r.primi_vjetor || r.total_primi || 0), 0);
    const primiRinovuar = data.filter(r => r.statusi === 'rinovuar').reduce((s,r) => s + Number(r.primi_vjetor || r.total_primi || 0), 0);
    const primiHumbur = data.filter(r => r.statusi === 'humbur').reduce((s,r) => s + Number(r.primi_vjetor || r.total_primi || 0), 0);
    const deme = data.reduce((s,r) => s + Number(r.deme_total_vlera || 0), 0);
    const lr = primi ? (deme/primi*100) : 0;

    const periudha = muaji === 'total' ? `Total viti ${viti}` : `${MUAJT_LABEL[MUAJT_REP.indexOf(muaji)]} ${viti}`;

    let insight = '';
    if (humbur > 0) {
        insight = buildInsightCardSmall(
            'Sa prim humbet nga kontratat e pa-rinovuara?',
            formatMoneyShort(primiHumbur), '',
            `${humbur} kontrata te humbura<br>${total ? ((humbur/total)*100).toFixed(1) : 0}% e totalit`,
            false
        );
    } else {
        insight = buildInsightCardSmall('Asnje kontrate e humbur', 'OK', '', `${rinovuar} rinovuar nga ${total} total`, true);
    }

    return `
        <div class="rep-perm-row">
            <div class="rep-perm-strip">
                ${buildSummaryStrip([
                    { label:'Total kontrata', value:total, sub:periudha },
                    { label:'Renewal Rate', value:renewalRate.toFixed(1)+'%', cls:renewalRate>=70?'highlight':renewalRate>=50?'warning':'danger', sub:`${rinovuar} rinovuar` },
                    { label:'Primi total', value:formatMoney(primi), sub:'Vjetor' },
                    { label:'Loss Ratio', value:lr.toFixed(1)+'%', cls:lr>90?'danger':lr>60?'warning':'highlight', sub:`Dëme ${formatMoneyShort(deme)}` }
                ])}
            </div>
            <div class="rep-perm-insight">${insight}</div>
        </div>

        <div class="rep-section-title">Statuset</div>
        ${buildStatsCards3x2([
            { label:'Pa filluar', count:paFilluar, color:'#94a3b8' },
            { label:'Kontaktuar', count:kontaktuar, color:'#f59e0b' },
            { label:'Rinovuar', count:rinovuar, value:primiRinovuar, color:'#22c55e' },
            { label:'Humbur', count:humbur, value:primiHumbur, color:'#ef4444' },
            { label:'Primi mesatar', count:total ? formatMoneyShort(primi/total) : '0€', color:'#3b82f6' },
            { label:'Combined Ratio', count:(primi ? ((deme + data.reduce((s,r)=>s+Number(r.shpenzimet||0),0))/primi*100) : 0).toFixed(1)+'%', color:'#7c3aed' }
        ])}
    `;
}

function renderRinKrahasim(allData, viti) {
    const muajRows = MUAJT_REP.map((m,i) => {
        const monthData = allData.filter(r => r.muaji === `${m}_${viti}`);
        const primi = monthData.reduce((s,r) => s + Number(r.primi_vjetor || r.total_primi || 0), 0);
        const deme = monthData.reduce((s,r) => s + Number(r.deme_total_vlera || 0), 0);
        const rinovuar = monthData.filter(r => r.statusi === 'rinovuar').length;
        const shpenz = monthData.reduce((s,r) => s + Number(r.shpenzimet || 0), 0);
        return {
            muaji: m, label: MUAJT_LABEL[i],
            total: monthData.length, rinovuar,
            humbur: monthData.filter(r => r.statusi === 'humbur').length,
            primi, deme,
            cr: primi ? ((deme+shpenz)/primi*100) : 0,
            renewalRate: monthData.length ? (rinovuar/monthData.length*100) : 0
        };
    }).filter(r => r.total > 0);

    if (muajRows.length === 0) return `<div class="rep-empty"><div class="rep-empty-title">Nuk ka të dhëna për krahasim</div></div>`;

    return `
        <div class="rep-table-wrap" style="margin-bottom:18px">
            <div class="rep-table-header"><h3 class="rep-table-title">Detaje mujore me delta</h3></div>
            <table class="rep-table">
                <thead>
                    <tr>
                        <th>Muaji</th>
                        <th class="right">Total</th>
                        <th class="right">Rinovuar</th>
                        <th class="right">Humbur</th>
                        <th class="right">Renewal %</th>
                        <th class="right">Primi</th>
                        <th class="right">CR%</th>
                    </tr>
                </thead>
                <tbody>
                    ${muajRows.map(r => `
                        <tr>
                            <td><strong>${r.label}</strong></td>
                            <td class="right">${r.total}</td>
                            <td class="right" style="color:#22c55e;font-weight:600">${r.rinovuar}</td>
                            <td class="right" style="color:#ef4444;font-weight:600">${r.humbur}</td>
                            <td class="right" style="color:${r.renewalRate>=70?'#22c55e':r.renewalRate>=50?'#f59e0b':'#ef4444'};font-weight:700">${r.renewalRate.toFixed(1)}%</td>
                            <td class="right"><strong>${formatMoney(r.primi)}</strong></td>
                            <td class="right" style="color:${r.cr>100?'#ef4444':r.cr>90?'#f59e0b':'#22c55e'}">${r.cr.toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="rep-3col">
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Primi total</h3></div>
                <div style="padding:18px 22px">${buildBarChartHorizontal(muajRows, 'primi', 'label', 'linear-gradient(90deg,#002B5C,#3b82f6)', formatMoneyShort)}</div>
            </div>
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Renewal Rate %</h3></div>
                <div style="padding:18px 22px">${buildBarChartHorizontal(muajRows, 'renewalRate', 'label', 'linear-gradient(90deg,#22c55e,#84cc16)', n=>n.toFixed(1)+'%')}</div>
            </div>
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Combined Ratio %</h3></div>
                <div style="padding:18px 22px">${buildBarChartHorizontal(muajRows, 'cr', 'label', 'linear-gradient(90deg,#dc2626,#f87171)', n=>n.toFixed(1)+'%')}</div>
            </div>
        </div>
    `;
}

function renderRinDeget(data) {
    const dege = {};
    data.forEach(r => {
        const d = r.dega || 'Pa degë';
        if (!dege[d]) dege[d] = { total:0, rinovuar:0, humbur:0, primi:0, deme:0, shpenz:0 };
        dege[d].total++;
        if (r.statusi === 'rinovuar') dege[d].rinovuar++;
        if (r.statusi === 'humbur') dege[d].humbur++;
        dege[d].primi += Number(r.primi_vjetor || r.total_primi || 0);
        dege[d].deme += Number(r.deme_total_vlera || 0);
        dege[d].shpenz += Number(r.shpenzimet || 0);
    });
    const rows = Object.keys(dege).map(d => ({
        emri: d, total: dege[d].total, rinovuar: dege[d].rinovuar, humbur: dege[d].humbur,
        primi: dege[d].primi, deme: dege[d].deme,
        renewalRate: dege[d].total ? (dege[d].rinovuar/dege[d].total*100) : 0,
        lr: dege[d].primi ? (dege[d].deme/dege[d].primi*100) : 0,
        cr: dege[d].primi ? ((dege[d].deme+dege[d].shpenz)/dege[d].primi*100) : 0
    }));
    const sorted = sortRows(rows, 'rinDeget', 'primi', 'desc');

    return `
        <div class="rep-table-wrap">
            <div class="rep-table-header">
                <h3 class="rep-table-title">Performanca sipas degëve</h3>
                <input class="rep-table-search" placeholder="Kërko degë..." onkeyup="filtroTabelen(this,'#tblRinDeget')">
            </div>
            <table class="rep-table sortable" id="tblRinDeget">
                <thead>
                    <tr>
                        <th onclick="sortTable('rinDeget','emri','rinovimet')">Dega ${sortArrow('rinDeget','emri')}</th>
                        <th class="right" onclick="sortTable('rinDeget','total','rinovimet')">Total ${sortArrow('rinDeget','total')}</th>
                        <th class="right" onclick="sortTable('rinDeget','rinovuar','rinovimet')">Rinovuar ${sortArrow('rinDeget','rinovuar')}</th>
                        <th class="right" onclick="sortTable('rinDeget','humbur','rinovimet')">Humbur ${sortArrow('rinDeget','humbur')}</th>
                        <th class="right" onclick="sortTable('rinDeget','renewalRate','rinovimet')">Renewal % ${sortArrow('rinDeget','renewalRate')}</th>
                        <th class="right" onclick="sortTable('rinDeget','primi','rinovimet')">Primi ${sortArrow('rinDeget','primi')}</th>
                        <th class="right" onclick="sortTable('rinDeget','lr','rinovimet')">LR% ${sortArrow('rinDeget','lr')}</th>
                        <th class="right" onclick="sortTable('rinDeget','cr','rinovimet')">CR% ${sortArrow('rinDeget','cr')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(d => `
                        <tr data-name="${esc(d.emri).toLowerCase()}">
                            <td><strong>${esc(d.emri)}</strong></td>
                            <td class="right">${d.total}</td>
                            <td class="right" style="color:#22c55e;font-weight:600">${d.rinovuar}</td>
                            <td class="right" style="color:#ef4444;font-weight:600">${d.humbur}</td>
                            <td class="right" style="color:${d.renewalRate>=70?'#22c55e':d.renewalRate>=50?'#f59e0b':'#ef4444'};font-weight:700">${d.renewalRate.toFixed(1)}%</td>
                            <td class="right"><strong>${formatMoney(d.primi)}</strong></td>
                            <td class="right" style="color:${d.lr>90?'#ef4444':d.lr>60?'#f59e0b':'#22c55e'};font-weight:600">${d.lr.toFixed(1)}%</td>
                            <td class="right" style="color:${d.cr>100?'#ef4444':d.cr>90?'#f59e0b':'#22c55e'};font-weight:600">${d.cr.toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderRinAgjentet(data) {
    const agj = {};
    data.forEach(r => {
        const a = r.agjenti || 'Pa agjent';
        if (!agj[a]) agj[a] = { total:0, rinovuar:0, humbur:0, primi:0, deme:0, dega:r.dega || 'Pa degë' };
        agj[a].total++;
        if (r.statusi === 'rinovuar') agj[a].rinovuar++;
        if (r.statusi === 'humbur') agj[a].humbur++;
        agj[a].primi += Number(r.primi_vjetor || r.total_primi || 0);
        agj[a].deme += Number(r.deme_total_vlera || 0);
    });
    const rows = Object.keys(agj).map(a => ({
        emri: a, dega: agj[a].dega, total: agj[a].total, rinovuar: agj[a].rinovuar,
        humbur: agj[a].humbur, primi: agj[a].primi, deme: agj[a].deme,
        renewalRate: agj[a].total ? (agj[a].rinovuar/agj[a].total*100) : 0,
        lr: agj[a].primi ? (agj[a].deme/agj[a].primi*100) : 0
    }));
    const sorted = sortRows(rows, 'rinAgj', 'renewalRate', 'asc');

    return `
        <div class="rep-table-wrap">
            <div class="rep-table-header">
                <h3 class="rep-table-title">Performanca sipas agjentëve (default: Renewal Rate më i ulët lart)</h3>
                <input class="rep-table-search" placeholder="Kërko agjent..." onkeyup="filtroTabelen(this,'#tblRinAgj')">
            </div>
            <table class="rep-table sortable" id="tblRinAgj">
                <thead>
                    <tr>
                        <th onclick="sortTable('rinAgj','emri','rinovimet')">Agjenti ${sortArrow('rinAgj','emri')}</th>
                        <th>Dega</th>
                        <th class="right" onclick="sortTable('rinAgj','total','rinovimet')">Total ${sortArrow('rinAgj','total')}</th>
                        <th class="right" onclick="sortTable('rinAgj','rinovuar','rinovimet')">Rinovuar ${sortArrow('rinAgj','rinovuar')}</th>
                        <th class="right" onclick="sortTable('rinAgj','humbur','rinovimet')">Humbur ${sortArrow('rinAgj','humbur')}</th>
                        <th class="right" onclick="sortTable('rinAgj','renewalRate','rinovimet')">Renewal % ${sortArrow('rinAgj','renewalRate')}</th>
                        <th class="right" onclick="sortTable('rinAgj','primi','rinovimet')">Primi ${sortArrow('rinAgj','primi')}</th>
                        <th class="right" onclick="sortTable('rinAgj','lr','rinovimet')">LR% ${sortArrow('rinAgj','lr')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(a => `
                        <tr data-name="${esc(a.emri).toLowerCase()}">
                            <td><strong>${esc(a.emri)}</strong></td>
                            <td><span style="font-size:11px;color:#64748b">${esc(a.dega)}</span></td>
                            <td class="right">${a.total}</td>
                            <td class="right" style="color:#22c55e;font-weight:600">${a.rinovuar}</td>
                            <td class="right" style="color:#ef4444;font-weight:600">${a.humbur}</td>
                            <td class="right" style="color:${a.renewalRate>=70?'#22c55e':a.renewalRate>=50?'#f59e0b':'#ef4444'};font-weight:700">${a.renewalRate.toFixed(1)}%</td>
                            <td class="right"><strong>${formatMoney(a.primi)}</strong></td>
                            <td class="right" style="color:${a.lr>90?'#ef4444':a.lr>60?'#f59e0b':'#22c55e'}">${a.lr.toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderRinPerformanca(data) {
    const withCR = data.filter(r => Number(r.primi_vjetor || r.total_primi || 0) > 0).map(r => {
        const primi = Number(r.primi_vjetor || r.total_primi || 0);
        const deme = Number(r.deme_total_vlera || 0);
        const shpenz = Number(r.shpenzimet || 0);
        return {
            klient: r.kontraktuesi || '—',
            dega: r.dega || '—',
            agjenti: r.agjenti || '—',
            primi, deme, shpenz,
            lr: primi ? (deme/primi*100) : 0,
            cr: primi ? ((deme+shpenz)/primi*100) : 0
        };
    });
    const fitimprurese = [...withCR].sort((a,b) => a.cr - b.cr).slice(0, 10);
    const problematike = [...withCR].sort((a,b) => b.cr - a.cr).slice(0, 10);
    const buildRow = (r) => `
        <tr>
            <td><strong>${esc(r.klient)}</strong><div style="font-size:10px;color:#94a3b8">${esc(r.dega)} · ${esc(r.agjenti)}</div></td>
            <td class="right">${formatMoney(r.primi)}</td>
            <td class="right" style="color:${r.lr>90?'#ef4444':'#334155'}">${r.lr.toFixed(1)}%</td>
            <td class="right" style="color:${r.cr>100?'#ef4444':r.cr>90?'#f59e0b':'#22c55e'};font-weight:700">${r.cr.toFixed(1)}%</td>
        </tr>
    `;
    return `
        <div class="rep-2col">
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Top 10 fitimprurës (CR më i ulët)</h3></div>
                <table class="rep-table">
                    <thead><tr><th>Klienti</th><th class="right">Primi</th><th class="right">LR%</th><th class="right">CR%</th></tr></thead>
                    <tbody>${fitimprurese.map(buildRow).join('') || '<tr><td colspan="4" style="text-align:center;color:#94a3b8">Asnjë rekord</td></tr>'}</tbody>
                </table>
            </div>
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Top 10 problematikë (CR më i lartë)</h3></div>
                <table class="rep-table">
                    <thead><tr><th>Klienti</th><th class="right">Primi</th><th class="right">LR%</th><th class="right">CR%</th></tr></thead>
                    <tbody>${problematike.map(buildRow).join('') || '<tr><td colspan="4" style="text-align:center;color:#94a3b8">Asnjë rekord</td></tr>'}</tbody>
                </table>
            </div>
        </div>
    `;
}

// ============================================================
// RAPORTI 3: KONTRATAT
// ============================================================
function renderRaportiKontratat() {
    const container = document.getElementById('repKonContent');
    if (!container) return;
    const viti = document.getElementById('repKonViti')?.value || String(new Date().getFullYear());
    const muaji = document.getElementById('repKonMuaji')?.value || 'total';
    let allData = [];
    try { allData = JSON.parse(localStorage.getItem('kontratat') || '[]'); } catch {}
    allData = filtroSipasRolit(allData);
    const dataToUse = filterByAnyDate(allData, viti, muaji);

    if (dataToUse.length === 0) {
        container.innerHTML = `<div class="rep-empty"><div class="rep-empty-title">Nuk ka të dhëna</div><div class="rep-empty-sub">Për ${muaji === 'total' ? 'vitin ' + viti : MUAJT_LABEL[MUAJT_REP.indexOf(muaji)] + ' ' + viti} nuk ka kontrata</div></div>`;
        return;
    }

    const sub = currentSubtab.kontratat;
    if (sub === 'permbledhje') container.innerHTML = renderKonPermbledhje(dataToUse, allData, viti, muaji);
    if (sub === 'krahasim') container.innerHTML = renderKonKrahasim(allData, viti);
    if (sub === 'lloji') container.innerHTML = renderKonLloji(dataToUse);
    if (sub === 'deget') container.innerHTML = renderKonDeget(dataToUse);
    if (sub === 'agjentet') container.innerHTML = renderKonAgjentet(dataToUse);
    if (window.lucide) lucide.createIcons();
}

function renderKonPermbledhje(data, allData, viti, muaji) {
    const total = data.length;
    const aktive = data.filter(k => !k.statusi || k.statusi === 'aktive').length;
    const skaduar = data.filter(k => k.statusi === 'skaduar').length;
    const skadojneShpejt = data.filter(k => {
        if (!k.data_mbarimit) return false;
        const d = new Date(k.data_mbarimit);
        const diff = (d - new Date()) / (1000*60*60*24);
        return diff > 0 && diff <= 30;
    }).length;

    const llojet = { individ:0, familje:0, biznes:0 };
    data.forEach(k => { if (llojet[k.lloji] !== undefined) llojet[k.lloji]++; });

    const periudha = muaji === 'total' ? `Total viti ${viti}` : `${MUAJT_LABEL[MUAJT_REP.indexOf(muaji)]} ${viti}`;

    let insight = '';
    if (skadojneShpejt > 0) {
        insight = buildInsightCardSmall('Kontrata që skadojnë në 30 ditë', String(skadojneShpejt), '', `nga ${aktive} aktive<br>Veprim preventiv kërkohet`, false);
    } else {
        insight = buildInsightCardSmall('Asnjë kontratë në rrezik', 'OK', '', `${aktive} kontrata aktive<br>Pa skadime në 30 ditë`, true);
    }

    return `
        <div class="rep-perm-row">
            <div class="rep-perm-strip">
                ${buildSummaryStrip([
                    { label:'Total', value:total, sub:periudha },
                    { label:'Aktive', value:aktive, cls:'highlight' },
                    { label:'Skadojnë <30d', value:skadojneShpejt, cls:skadojneShpejt>0?'warning':'highlight' },
                    { label:'Skaduar', value:skaduar, cls:'danger' }
                ])}
            </div>
            <div class="rep-perm-insight">${insight}</div>
        </div>

        <div class="rep-section-title">Sipas llojit</div>
        ${buildStatsCards3x2([
            { label:'Individ', count:llojet.individ, color:'#3b82f6' },
            { label:'Familje', count:llojet.familje, color:'#7c3aed' },
            { label:'Biznes', count:llojet.biznes, color:'#0f766e' },
            { label:'Aktive', count:aktive, color:'#22c55e' },
            { label:'Skadojnë shpejt', count:skadojneShpejt, color:'#f59e0b' },
            { label:'Skaduar', count:skaduar, color:'#ef4444' }
        ])}
    `;
}

function renderKonKrahasim(allData, viti) {
    const groups = groupByMonth(allData, viti);
    const muajRows = MUAJT_REP.map((m,i) => {
        const dataReal = groups[m];
        return {
            label: MUAJT_LABEL[i],
            total: dataReal.length,
            individ: dataReal.filter(k => k.lloji === 'individ').length,
            familje: dataReal.filter(k => k.lloji === 'familje').length,
            biznes: dataReal.filter(k => k.lloji === 'biznes').length
        };
    }).filter(r => r.total > 0);

    if (muajRows.length === 0) return `<div class="rep-empty"><div class="rep-empty-title">Nuk ka të dhëna</div></div>`;

    return `
        <div class="rep-2col left-bigger">
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Kontrata sipas muajit</h3></div>
                <table class="rep-table">
                    <thead><tr><th>Muaji</th><th class="right">Total</th><th class="right">Individ</th><th class="right">Familje</th><th class="right">Biznes</th></tr></thead>
                    <tbody>
                        ${muajRows.map(r => `
                            <tr>
                                <td><strong>${r.label}</strong></td>
                                <td class="right"><strong>${r.total}</strong></td>
                                <td class="right">${r.individ}</td>
                                <td class="right">${r.familje}</td>
                                <td class="right">${r.biznes}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Trend i kontratave</h3></div>
                <div style="padding:14px 18px">${buildBarChartHorizontal(muajRows, 'total', 'label', 'linear-gradient(90deg,#10b981,#047857)', n=>n)}</div>
            </div>
        </div>
    `;
}

function renderKonLloji(data) {
    const llojet = ['individ','familje','biznes'].map(l => {
        const f = data.filter(k => k.lloji === l);
        return {
            lloji: l,
            label: l.charAt(0).toUpperCase() + l.slice(1),
            total: f.length,
            aktive: f.filter(k => !k.statusi || k.statusi === 'aktive').length,
            skaduar: f.filter(k => k.statusi === 'skaduar').length
        };
    });
    return `
        <div class="rep-table-wrap">
            <div class="rep-table-header"><h3 class="rep-table-title">Sipas llojit të kontratës</h3></div>
            <table class="rep-table">
                <thead><tr><th>Lloji</th><th class="right">Total</th><th class="right">Aktive</th><th class="right">Skaduar</th><th class="right">% e portofolit</th></tr></thead>
                <tbody>
                    ${llojet.map(l => {
                        const total = data.length;
                        return `
                            <tr>
                                <td><strong>${l.label}</strong></td>
                                <td class="right">${l.total}</td>
                                <td class="right" style="color:#22c55e;font-weight:600">${l.aktive}</td>
                                <td class="right" style="color:#ef4444;font-weight:600">${l.skaduar}</td>
                                <td class="right">${total ? ((l.total/total)*100).toFixed(1) : 0}%</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderKonDeget(data) {
    const stafi = merrStafiList();
    const dege = {};
    data.forEach(k => {
        const agjent = (k.agjenti || '').toLowerCase().trim();
        const d = stafi[agjent] || k.dega || 'Pa degë';
        if (!dege[d]) dege[d] = { total:0, aktive:0, skaduar:0, individ:0, familje:0, biznes:0 };
        dege[d].total++;
        if (!k.statusi || k.statusi === 'aktive') dege[d].aktive++;
        if (k.statusi === 'skaduar') dege[d].skaduar++;
        if (k.lloji === 'individ') dege[d].individ++;
        if (k.lloji === 'familje') dege[d].familje++;
        if (k.lloji === 'biznes') dege[d].biznes++;
    });
    const rows = Object.keys(dege).map(d => ({
        emri: d, total: dege[d].total, aktive: dege[d].aktive, skaduar: dege[d].skaduar,
        individ: dege[d].individ, familje: dege[d].familje, biznes: dege[d].biznes,
        retention: dege[d].total ? (dege[d].aktive/dege[d].total*100) : 0
    }));
    const sorted = sortRows(rows, 'konDeget', 'total', 'desc');
    return `
        <div class="rep-2col left-bigger">
            <div class="rep-table-wrap">
                <div class="rep-table-header">
                    <h3 class="rep-table-title">Performanca sipas degëve</h3>
                    <input class="rep-table-search" placeholder="Kërko degë..." onkeyup="filtroTabelen(this,'#tblKonDeget')">
                </div>
                <table class="rep-table sortable" id="tblKonDeget">
                    <thead><tr>
                        <th onclick="sortTable('konDeget','emri','kontratat')">Dega ${sortArrow('konDeget','emri')}</th>
                        <th class="right" onclick="sortTable('konDeget','total','kontratat')">Total ${sortArrow('konDeget','total')}</th>
                        <th class="right" onclick="sortTable('konDeget','aktive','kontratat')">Aktive ${sortArrow('konDeget','aktive')}</th>
                        <th class="right" onclick="sortTable('konDeget','skaduar','kontratat')">Skaduar ${sortArrow('konDeget','skaduar')}</th>
                        <th class="right" onclick="sortTable('konDeget','retention','kontratat')">Retention % ${sortArrow('konDeget','retention')}</th>
                        <th class="right" onclick="sortTable('konDeget','individ','kontratat')">Individ ${sortArrow('konDeget','individ')}</th>
                        <th class="right" onclick="sortTable('konDeget','familje','kontratat')">Familje ${sortArrow('konDeget','familje')}</th>
                        <th class="right" onclick="sortTable('konDeget','biznes','kontratat')">Biznes ${sortArrow('konDeget','biznes')}</th>
                    </tr></thead>
                    <tbody>
                        ${sorted.map(d => `
                            <tr data-name="${esc(d.emri).toLowerCase()}">
                                <td><strong>${esc(d.emri)}</strong></td>
                                <td class="right"><strong>${d.total}</strong></td>
                                <td class="right" style="color:#22c55e;font-weight:600">${d.aktive}</td>
                                <td class="right" style="color:#ef4444;font-weight:600">${d.skaduar}</td>
                                <td class="right" style="color:${d.retention>=80?'#22c55e':d.retention>=60?'#f59e0b':'#ef4444'};font-weight:700">${d.retention.toFixed(1)}%</td>
                                <td class="right">${d.individ}</td>
                                <td class="right">${d.familje}</td>
                                <td class="right">${d.biznes}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Vizualizim</h3></div>
                <div style="padding:14px 18px">${buildBarChartHorizontal(sorted, 'total', 'emri', 'linear-gradient(90deg,#10b981,#047857)', n=>n)}</div>
            </div>
        </div>
    `;
}

function renderKonAgjentet(data) {
    const agj = {};
    data.forEach(k => {
        const a = k.agjenti || 'Pa agjent';
        if (!agj[a]) agj[a] = { total:0, aktive:0, skaduar:0, individ:0, familje:0, biznes:0 };
        agj[a].total++;
        if (!k.statusi || k.statusi === 'aktive') agj[a].aktive++;
        if (k.statusi === 'skaduar') agj[a].skaduar++;
        if (k.lloji === 'individ') agj[a].individ++;
        if (k.lloji === 'familje') agj[a].familje++;
        if (k.lloji === 'biznes') agj[a].biznes++;
    });
    const rows = Object.keys(agj).map(a => ({
        emri: a, total: agj[a].total, aktive: agj[a].aktive, skaduar: agj[a].skaduar,
        individ: agj[a].individ, familje: agj[a].familje, biznes: agj[a].biznes,
        retention: agj[a].total ? (agj[a].aktive/agj[a].total*100) : 0
    }));
    const sorted = sortRows(rows, 'konAgj', 'total', 'desc');

    return `
        <div class="rep-table-wrap">
            <div class="rep-table-header">
                <h3 class="rep-table-title">Performanca sipas agjentëve</h3>
                <input class="rep-table-search" placeholder="Kërko agjent..." onkeyup="filtroTabelen(this,'#tblKonAgj')">
            </div>
            <table class="rep-table sortable" id="tblKonAgj">
                <thead>
                    <tr>
                        <th onclick="sortTable('konAgj','emri','kontratat')">Agjenti ${sortArrow('konAgj','emri')}</th>
                        <th class="right" onclick="sortTable('konAgj','total','kontratat')">Total ${sortArrow('konAgj','total')}</th>
                        <th class="right" onclick="sortTable('konAgj','aktive','kontratat')">Aktive ${sortArrow('konAgj','aktive')}</th>
                        <th class="right" onclick="sortTable('konAgj','skaduar','kontratat')">Skaduar ${sortArrow('konAgj','skaduar')}</th>
                        <th class="right" onclick="sortTable('konAgj','retention','kontratat')">Retention % ${sortArrow('konAgj','retention')}</th>
                        <th class="right" onclick="sortTable('konAgj','individ','kontratat')">Individ ${sortArrow('konAgj','individ')}</th>
                        <th class="right" onclick="sortTable('konAgj','familje','kontratat')">Familje ${sortArrow('konAgj','familje')}</th>
                        <th class="right" onclick="sortTable('konAgj','biznes','kontratat')">Biznes ${sortArrow('konAgj','biznes')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(a => `
                        <tr data-name="${esc(a.emri).toLowerCase()}">
                            <td><strong>${esc(a.emri)}</strong></td>
                            <td class="right">${a.total}</td>
                            <td class="right" style="color:#22c55e;font-weight:600">${a.aktive}</td>
                            <td class="right" style="color:#ef4444;font-weight:600">${a.skaduar}</td>
                            <td class="right" style="color:${a.retention>=80?'#22c55e':a.retention>=60?'#f59e0b':'#ef4444'};font-weight:700">${a.retention.toFixed(1)}%</td>
                            <td class="right">${a.individ}</td>
                            <td class="right">${a.familje}</td>
                            <td class="right">${a.biznes}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ============================================================
// RAPORTI 4: FATURIMI
// ============================================================
function renderRaportiFaturimi() {
    const container = document.getElementById('repFatContent');
    if (!container) return;
    const viti = document.getElementById('repFatViti')?.value || String(new Date().getFullYear());
    const muaji = document.getElementById('repFatMuaji')?.value || 'total';
    let allData = [];
    try { allData = JSON.parse(localStorage.getItem('faturimi_klientet') || '[]'); } catch {}
    allData = filtroSipasRolit(allData);

    const filtered = allData.filter(r => {
        if (r.muaji_aktiv) {
            if (muaji === 'total') return true;
            return r.muaji_aktiv === muaji;
        }
        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="rep-empty"><div class="rep-empty-title">Nuk ka të dhëna</div></div>`;
        return;
    }

    const sub = currentSubtab.faturimi;
    if (sub === 'permbledhje') container.innerHTML = renderFatPermbledhje(filtered, viti, muaji);
    if (sub === 'krahasim') container.innerHTML = renderFatKrahasim(filtered);
    if (sub === 'agjentet') container.innerHTML = renderFatAgjentet(filtered);
    if (sub === 'probleme') container.innerHTML = renderFatProbleme(filtered);
    if (window.lucide) lucide.createIcons();
}

function renderFatPermbledhje(data, viti, muaji) {
    const total = data.length;
    const leshuar = data.filter(f => f.statusi === 'leshuar').length;
    const proces = data.filter(f => f.statusi === 'ne_proces').length;
    const kerkese = data.filter(f => f.statusi === 'kerkese').length;
    const asgje = data.filter(f => !f.statusi || f.statusi === 'asgje').length;
    const issuanceRate = total ? (leshuar/total*100) : 0;
    const periudha = muaji === 'total' ? `Total viti ${viti}` : `${MUAJT_LABEL[MUAJT_REP.indexOf(muaji)]} ${viti}`;

    let insight = buildInsightCardSmall('Issuance Rate aktual', issuanceRate.toFixed(1) + '%', '', `${leshuar} faturuar nga ${total} total<br>${asgje} pa veprim`, issuanceRate >= 70);

    return `
        <div class="rep-perm-row">
            <div class="rep-perm-strip">
                ${buildSummaryStrip([
                    { label:'Total fatura', value:total, sub:periudha },
                    { label:'Lëshuar', value:leshuar, cls:'highlight' },
                    { label:'Issuance Rate', value:issuanceRate.toFixed(1)+'%', cls:issuanceRate>=70?'highlight':'warning' },
                    { label:'Pa veprim', value:asgje, cls:asgje>0?'danger':'highlight' }
                ])}
            </div>
            <div class="rep-perm-insight">${insight}</div>
        </div>

        <div class="rep-section-title">Statuset</div>
        ${buildStatsCards3x2([
            { label:'Asgjë', count:asgje, color:'#94a3b8' },
            { label:'Kërkesë', count:kerkese, color:'#f59e0b' },
            { label:'Në proces', count:proces, color:'#3b82f6' },
            { label:'Lëshuar', count:leshuar, color:'#22c55e' },
            { label:'Issuance Rate', count:issuanceRate.toFixed(1)+'%', color:'#7c3aed' },
            { label:'Total', count:total, color:'#1a2332' }
        ])}
    `;
}

function renderFatKrahasim(data) {
    return `<div class="rep-empty"><div class="rep-empty-title">Krahasimi mujor i faturimit</div><div class="rep-empty-sub">Faturimi kërkon fushën "muaji_aktiv" për të bërë krahasime mujore.</div></div>`;
}

function renderFatAgjentet(data) {
    const agj = {};
    data.forEach(f => {
        const a = f.agjenti || 'Pa agjent';
        if (!agj[a]) agj[a] = { total:0, leshuar:0, asgje:0, proces:0 };
        agj[a].total++;
        if (f.statusi === 'leshuar') agj[a].leshuar++;
        if (!f.statusi || f.statusi === 'asgje') agj[a].asgje++;
        if (f.statusi === 'ne_proces') agj[a].proces++;
    });
    const rows = Object.keys(agj).map(a => ({
        emri: a, total: agj[a].total, leshuar: agj[a].leshuar, asgje: agj[a].asgje, proces: agj[a].proces,
        issuanceRate: agj[a].total ? (agj[a].leshuar/agj[a].total*100) : 0
    }));
    const sorted = sortRows(rows, 'fatAgj', 'issuanceRate', 'asc');

    return `
        <div class="rep-table-wrap">
            <div class="rep-table-header">
                <h3 class="rep-table-title">Performanca sipas agjentëve</h3>
                <input class="rep-table-search" placeholder="Kërko agjent..." onkeyup="filtroTabelen(this,'#tblFatAgj')">
            </div>
            <table class="rep-table sortable" id="tblFatAgj">
                <thead>
                    <tr>
                        <th onclick="sortTable('fatAgj','emri','faturimi')">Agjenti ${sortArrow('fatAgj','emri')}</th>
                        <th class="right" onclick="sortTable('fatAgj','total','faturimi')">Total ${sortArrow('fatAgj','total')}</th>
                        <th class="right" onclick="sortTable('fatAgj','leshuar','faturimi')">Lëshuar ${sortArrow('fatAgj','leshuar')}</th>
                        <th class="right" onclick="sortTable('fatAgj','proces','faturimi')">Në proces ${sortArrow('fatAgj','proces')}</th>
                        <th class="right" onclick="sortTable('fatAgj','asgje','faturimi')">Pa veprim ${sortArrow('fatAgj','asgje')}</th>
                        <th class="right" onclick="sortTable('fatAgj','issuanceRate','faturimi')">Issuance % ${sortArrow('fatAgj','issuanceRate')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(a => `
                        <tr data-name="${esc(a.emri).toLowerCase()}">
                            <td><strong>${esc(a.emri)}</strong></td>
                            <td class="right">${a.total}</td>
                            <td class="right" style="color:#22c55e;font-weight:600">${a.leshuar}</td>
                            <td class="right" style="color:#3b82f6">${a.proces}</td>
                            <td class="right" style="color:${a.asgje>0?'#ef4444':'#94a3b8'};font-weight:${a.asgje>0?'700':'400'}">${a.asgje}</td>
                            <td class="right" style="color:${a.issuanceRate>=70?'#22c55e':a.issuanceRate>=40?'#f59e0b':'#ef4444'};font-weight:700">${a.issuanceRate.toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderFatProbleme(data) {
    const probleme = data.filter(f => !f.statusi || f.statusi === 'asgje');
    if (probleme.length === 0) {
        return `<div class="rep-empty"><div class="rep-empty-title">Asnjë faturë me probleme</div><div class="rep-empty-sub">Të gjitha faturat janë të procesuar</div></div>`;
    }
    return `
        <div class="rep-table-wrap">
            <div class="rep-table-header"><h3 class="rep-table-title">Faturat pa veprim (kërkojnë vëmendje)</h3></div>
            <table class="rep-table">
                <thead><tr><th>Klienti</th><th>NRB / NID</th><th>Agjenti</th><th class="right">Skadon</th></tr></thead>
                <tbody>
                    ${probleme.slice(0, 50).map(f => `
                        <tr>
                            <td><strong>${esc(f.klienti || f.emri || '—')}</strong></td>
                            <td>${esc(f.nrb || f.nr_personal || '—')}</td>
                            <td>${esc(f.agjenti || '—')}</td>
                            <td class="right">${esc(f.data_mbarimit || '—')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ============================================================
// RAPORTI 5: OFERTA
// ============================================================
function renderRaportiOferta() {
    const container = document.getElementById('repOfeContent');
    if (!container) return;
    const viti = document.getElementById('repOfeViti')?.value || String(new Date().getFullYear());
    const muaji = document.getElementById('repOfeMuaji')?.value || 'total';
    let allData = [];
    try { allData = JSON.parse(localStorage.getItem('ofertat') || '[]'); } catch {}
    allData = allData.map(normalizoOferta);
    allData = filtroSipasRolit(allData);

    const filtered = filterByAnyDate(allData, viti, muaji);

    if (filtered.length === 0) {
        container.innerHTML = `<div class="rep-empty"><div class="rep-empty-title">Nuk ka të dhëna</div></div>`;
        return;
    }

    const sub = currentSubtab.oferta;
    if (sub === 'permbledhje') container.innerHTML = renderOfePermbledhje(filtered, viti, muaji);
    if (sub === 'krahasim') container.innerHTML = renderOfeKrahasim(allData, viti);
    if (sub === 'lloji') container.innerHTML = renderOfeLloji(filtered);
    if (sub === 'deget') container.innerHTML = renderOfeDeget(filtered);
    if (sub === 'agjentet') container.innerHTML = renderOfeAgjentet(filtered);
    if (sub === 'topoferta') container.innerHTML = renderOfeTop(filtered);
    if (window.lucide) lucide.createIcons();
}

function renderOfePermbledhje(data, viti, muaji) {
    const total = data.length;
    const realizuar = data.filter(o => o.statusi === 'realizuar' || o.statusi === 'kontrate').length;
    const konfirmuar = data.filter(o => o.statusi === 'konfirmuar').length;
    const presin = data.filter(o => o.statusi === 'presin' || o.statusi === 'aktive').length;
    const skaduar = data.filter(o => o.statusi === 'skaduar').length;
    const refuzuar = data.filter(o => o.statusi === 'refuzuar').length;
    const conversionRate = total ? (realizuar/total*100) : 0;
    const periudha = muaji === 'total' ? `Total viti ${viti}` : `${MUAJT_LABEL[MUAJT_REP.indexOf(muaji)]} ${viti}`;

    let insight = buildInsightCardSmall('Sa oferta ende presin pergjigje?', presin.toString(), '', `${konfirmuar} konfirmuar<br>${refuzuar} refuzuar`, presin === 0);

    return `
        <div class="rep-perm-row">
            <div class="rep-perm-strip">
                ${buildSummaryStrip([
                    { label:'Total oferta', value:total, sub:periudha },
                    { label:'Realizuar', value:realizuar, cls:'highlight' },
                    { label:'Conversion', value:conversionRate.toFixed(1)+'%', cls:conversionRate>=30?'highlight':'warning' },
                    { label:'Presin', value:presin, cls:'warning' }
                ])}
            </div>
            <div class="rep-perm-insight">${insight}</div>
        </div>

        <div class="rep-section-title">Statuset</div>
        ${buildStatsCards3x2([
            { label:'Presin', count:presin, color:'#f59e0b' },
            { label:'Konfirmuar', count:konfirmuar, color:'#3b82f6' },
            { label:'Realizuar', count:realizuar, color:'#22c55e' },
            { label:'Skaduar', count:skaduar, color:'#94a3b8' },
            { label:'Refuzuar', count:refuzuar, color:'#ef4444' },
            { label:'Total', count:total, color:'#1a2332' }
        ])}
    `;
}

function renderOfeKrahasim(allData, viti) {
    const groups = groupByMonth(allData, viti);
    const muajRows = MUAJT_REP.map((m,i) => {
        const monthData = groups[m];
        const realizuar = monthData.filter(o => o.statusi === 'realizuar' || o.statusi === 'kontrate').length;
        return {
            label: MUAJT_LABEL[i],
            total: monthData.length,
            realizuar,
            conversionRate: monthData.length ? (realizuar/monthData.length*100) : 0
        };
    }).filter(r => r.total > 0);

    if (muajRows.length === 0) return `<div class="rep-empty"><div class="rep-empty-title">Nuk ka të dhëna</div></div>`;

    return `
        <div class="rep-2col left-bigger">
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Oferta sipas muajit</h3></div>
                <table class="rep-table">
                    <thead><tr><th>Muaji</th><th class="right">Total</th><th class="right">Realizuar</th><th class="right">Conversion %</th></tr></thead>
                    <tbody>
                        ${muajRows.map(r => `
                            <tr>
                                <td><strong>${r.label}</strong></td>
                                <td class="right"><strong>${r.total}</strong></td>
                                <td class="right" style="color:#22c55e;font-weight:600">${r.realizuar}</td>
                                <td class="right" style="color:${r.conversionRate>=30?'#22c55e':'#f59e0b'};font-weight:700">${r.conversionRate.toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Trend i ofertave</h3></div>
                <div style="padding:14px 18px">${buildBarChartHorizontal(muajRows, 'total', 'label', 'linear-gradient(90deg,#3b82f6,#1d4ed8)', n=>n)}</div>
            </div>
        </div>
    `;
}

function renderOfeLloji(data) {
    const llojet = ['individ','familje','biznes','individuale','familjare-biznes','familjare'].map(l => {
        const f = data.filter(o => o.lloji === l);
        if (f.length === 0) return null;
        const realizuar = f.filter(o => o.statusi === 'realizuar' || o.statusi === 'kontrate').length;
        return {
            label: l.charAt(0).toUpperCase() + l.slice(1),
            total: f.length, realizuar,
            conversionRate: f.length ? (realizuar/f.length*100) : 0
        };
    }).filter(Boolean);
    return `
        <div class="rep-2col left-bigger">
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Sipas llojit te ofertes</h3></div>
                <table class="rep-table">
                    <thead><tr><th>Lloji</th><th class="right">Total</th><th class="right">Realizuar</th><th class="right">Conversion %</th></tr></thead>
                    <tbody>
                        ${llojet.map(l => `
                            <tr>
                                <td><strong>${l.label}</strong></td>
                                <td class="right">${l.total}</td>
                                <td class="right" style="color:#22c55e;font-weight:600">${l.realizuar}</td>
                                <td class="right" style="color:${l.conversionRate>=30?'#22c55e':'#f59e0b'};font-weight:700">${l.conversionRate.toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Vizualizim</h3></div>
                <div style="padding:14px 18px">${buildBarChartHorizontal(llojet, 'total', 'label', 'linear-gradient(90deg,#3b82f6,#1d4ed8)', n=>n)}</div>
            </div>
        </div>
    `;
}

function renderOfeDeget(data) {
    const stafi = merrStafiList();
    const dege = {};
    data.forEach(o => {
        const agjent = (o.agjenti || '').toLowerCase().trim();
        const degaStafi = stafi[agjent] || o.dega || 'Pa dege';
        if (!dege[degaStafi]) dege[degaStafi] = { total:0, realizuar:0, presin:0 };
        dege[degaStafi].total++;
        if (o.statusi === 'realizuar' || o.statusi === 'kontrate') dege[degaStafi].realizuar++;
        if (o.statusi === 'presin' || o.statusi === 'aktive') dege[degaStafi].presin++;
    });
    const rows = Object.keys(dege).map(d => ({
        emri: d, total: dege[d].total, realizuar: dege[d].realizuar, presin: dege[d].presin,
        conversionRate: dege[d].total ? (dege[d].realizuar/dege[d].total*100) : 0
    }));
    const sorted = sortRows(rows, 'ofeDeget', 'total', 'desc');
    return `
        <div class="rep-2col left-bigger">
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Performanca sipas degeve</h3></div>
                <table class="rep-table sortable">
                    <thead><tr>
                        <th onclick="sortTable('ofeDeget','emri','oferta')">Dega ${sortArrow('ofeDeget','emri')}</th>
                        <th class="right" onclick="sortTable('ofeDeget','total','oferta')">Total ${sortArrow('ofeDeget','total')}</th>
                        <th class="right" onclick="sortTable('ofeDeget','realizuar','oferta')">Realizuar ${sortArrow('ofeDeget','realizuar')}</th>
                        <th class="right" onclick="sortTable('ofeDeget','presin','oferta')">Presin ${sortArrow('ofeDeget','presin')}</th>
                        <th class="right" onclick="sortTable('ofeDeget','conversionRate','oferta')">Conv% ${sortArrow('ofeDeget','conversionRate')}</th>
                    </tr></thead>
                    <tbody>
                        ${sorted.map(d => `
                            <tr>
                                <td><strong>${esc(d.emri)}</strong></td>
                                <td class="right">${d.total}</td>
                                <td class="right" style="color:#22c55e;font-weight:600">${d.realizuar}</td>
                                <td class="right" style="color:#f59e0b">${d.presin}</td>
                                <td class="right" style="color:${d.conversionRate>=30?'#22c55e':'#f59e0b'};font-weight:700">${d.conversionRate.toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">Vizualizim</h3></div>
                <div style="padding:14px 18px">${buildBarChartHorizontal(sorted, 'total', 'emri', 'linear-gradient(90deg,#002B5C,#3b82f6)', n=>n)}</div>
            </div>
        </div>
    `;
}

function renderOfeAgjentet(data) {
    const agj = {};
    data.forEach(o => {
        const a = o.agjenti || 'Pa agjent';
        if (!agj[a]) agj[a] = { total:0, realizuar:0, presin:0, refuzuar:0 };
        agj[a].total++;
        if (o.statusi === 'realizuar' || o.statusi === 'kontrate') agj[a].realizuar++;
        if (o.statusi === 'presin' || o.statusi === 'aktive') agj[a].presin++;
        if (o.statusi === 'refuzuar') agj[a].refuzuar++;
    });
    const rows = Object.keys(agj).map(a => ({
        emri: a, total: agj[a].total, realizuar: agj[a].realizuar, presin: agj[a].presin, refuzuar: agj[a].refuzuar,
        conversionRate: agj[a].total ? (agj[a].realizuar/agj[a].total*100) : 0
    }));
    const sorted = sortRows(rows, 'ofeAgj', 'conversionRate', 'asc');

    return `
        <div class="rep-table-wrap">
            <div class="rep-table-header">
                <h3 class="rep-table-title">Performanca sipas agjentëve</h3>
                <input class="rep-table-search" placeholder="Kërko agjent..." onkeyup="filtroTabelen(this,'#tblOfeAgj')">
            </div>
            <table class="rep-table sortable" id="tblOfeAgj">
                <thead>
                    <tr>
                        <th onclick="sortTable('ofeAgj','emri','oferta')">Agjenti ${sortArrow('ofeAgj','emri')}</th>
                        <th class="right" onclick="sortTable('ofeAgj','total','oferta')">Total ${sortArrow('ofeAgj','total')}</th>
                        <th class="right" onclick="sortTable('ofeAgj','realizuar','oferta')">Realizuar ${sortArrow('ofeAgj','realizuar')}</th>
                        <th class="right" onclick="sortTable('ofeAgj','presin','oferta')">Presin ${sortArrow('ofeAgj','presin')}</th>
                        <th class="right" onclick="sortTable('ofeAgj','refuzuar','oferta')">Refuzuar ${sortArrow('ofeAgj','refuzuar')}</th>
                        <th class="right" onclick="sortTable('ofeAgj','conversionRate','oferta')">Conversion % ${sortArrow('ofeAgj','conversionRate')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(a => `
                        <tr data-name="${esc(a.emri).toLowerCase()}">
                            <td><strong>${esc(a.emri)}</strong></td>
                            <td class="right">${a.total}</td>
                            <td class="right" style="color:#22c55e;font-weight:600">${a.realizuar}</td>
                            <td class="right" style="color:#f59e0b">${a.presin}</td>
                            <td class="right" style="color:#ef4444">${a.refuzuar}</td>
                            <td class="right" style="color:${a.conversionRate>=30?'#22c55e':a.conversionRate>=15?'#f59e0b':'#ef4444'};font-weight:700">${a.conversionRate.toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderOfeTop(data) {
    const sorted = [...data]
        .map(o => ({ ...o, _persona: Number(o.nr_personash || o.persona || 1) }))
        .sort((a,b) => b._persona - a._persona)
        .slice(0, 20);

    return `
        <div class="rep-table-wrap">
            <div class="rep-table-header">
                <h3 class="rep-table-title">Top 20 oferta sipas numrit të personave</h3>
                <input class="rep-table-search" placeholder="Kërko klient..." onkeyup="filtroTabelen(this,'#tblOfeTop')">
            </div>
            <table class="rep-table" id="tblOfeTop">
                <thead><tr><th style="width:40px">#</th><th>Klienti</th><th>Lloji</th><th>Agjenti</th><th class="right">Persona</th><th class="center">Statusi</th></tr></thead>
                <tbody>
                    ${sorted.map((o, i) => `
                        <tr data-name="${esc(o.emri || o.klienti || '').toLowerCase()}">
                            <td style="font-weight:800;color:#64748b">${i+1}</td>
                            <td><strong>${esc(o.emri || o.klienti || '—')}</strong></td>
                            <td>${esc(o.lloji || '—')}</td>
                            <td>${esc(o.agjenti || '—')}</td>
                            <td class="right"><strong>${o._persona}</strong></td>
                            <td class="center"><span style="font-size:10px;color:#64748b">${esc(o.statusi || '—')}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ============ EXPORT ============
function eksportoRaportin(modul) {
    let data = [], filename = '';
    const cfgs = {
        debitoret: { storage:'debitoret_data_v1', vit:'repDebViti', muaj:'repDebMuaji', map:r=>({Muaji:r.muaji,Klienti:r.klienti,Dega:r.dega,Agjenti:r.agjenti,'Borxhi':r.debitori_total,'Mbi 365':r.borxh_mbi_365,Statusi:r.statusi}) },
        rinovimet: { storage:'rinovimet_data', vit:'repRinViti', muaj:'repRinMuaji', map:r=>({Muaji:r.muaji,Kontraktuesi:r.kontraktuesi,Dega:r.dega,Agjenti:r.agjenti,Primi:r.primi_vjetor||r.total_primi,Deme:r.deme_total_vlera,Statusi:r.statusi}) },
        kontratat: { storage:'kontratat', vit:'repKonViti', muaj:'repKonMuaji', map:r=>({Klienti:r.emri||r.kontraktuesi,Lloji:r.lloji,Agjenti:r.agjenti,'Data fillimit':r.data_fillimit,'Data mbarimit':r.data_mbarimit,Statusi:r.statusi}) },
        faturimi: { storage:'faturimi_klientet', vit:'repFatViti', muaj:'repFatMuaji', map:r=>({Klienti:r.emri||r.klienti,NRB:r.nrb||r.nr_personal,Agjenti:r.agjenti,Statusi:r.statusi}) },
        oferta: { storage:'ofertat', vit:'repOfeViti', muaj:'repOfeMuaji', map:r=>({Klienti:r.emri||r.klienti,Lloji:r.lloji,Agjenti:r.agjenti||r.perfaqesuesi,Statusi:r.statusi}) }
    };
    const cfg = cfgs[modul];
    if (!cfg) return;
    const viti = document.getElementById(cfg.vit).value;
    const muaji = document.getElementById(cfg.muaj).value;
    let raw = [];
    try { raw = JSON.parse(localStorage.getItem(cfg.storage) || '[]'); } catch {}
    if (modul === 'oferta') raw = raw.map(normalizoOferta);
    raw = filtroSipasRolit(raw);
    if (modul === 'debitoret') data = filterByMuaj(raw, viti, muaji).map(cfg.map);
    else data = raw.map(cfg.map);
    filename = `raport_${modul}_${viti}_${muaji}.xlsx`;
    if (!data.length) { alert('Nuk ka të dhëna për eksport.'); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Raporti');
    XLSX.writeFile(wb, filename);
}

// ============ HELPERS ============
function filtroTabelen(input, selector) {
    const q = input.value.toLowerCase();
    document.querySelectorAll(`${selector} tbody tr`).forEach(tr => {
        tr.style.display = tr.dataset.name?.includes(q) ? '' : 'none';
    });
}

function esc(v) {
    return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatMoney(v) {
    const n = Number(v || 0);
    return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n) + '€';
}

function formatMoneyShort(v) {
    const n = Number(v || 0);
    if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + 'M€';
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(0) + 'K€';
    return formatMoney(n);
}