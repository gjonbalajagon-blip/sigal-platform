// ============================================================
// RINOVIMET.JS — v2 komplet
// ============================================================

const RIN_KEY = 'rinovimet_data';
const RIN_IMP_KEY = 'rinovimet_imports';
const MUAJT = ['Janar','Shkurt','Mars','Prill','Maj','Qershor','Korrik','Gusht','Shtator','Tetor','Nëntor','Dhjetor'];

const STATUSET = {
    pa_filluar:  { emri: 'Pa filluar',  ngjyra: '#94a3b8', bar: '#94a3b8' },
    kontaktuar:  { emri: 'Kontaktuar',  ngjyra: '#f59e0b', bar: '#fbbf24' },
    rinovuar:    { emri: 'Rinovuar',    ngjyra: '#22c55e', bar: '#4ade80' },
    humbur:      { emri: 'Humbur',      ngjyra: '#ef4444', bar: '#fca5a5' }
};

const ARSYET_HUMBJES = [
    'Çmimi shumë i lartë',
    'Klienti zgjodhi sigurim tjetër',
    'Klienti nuk dëshiron më sigurim',
    'Mbulesa jo e mjaftueshme',
    'I pakënaqur me shërbimet',
    'I pakënaqur me vlerësimin e dëmeve',
    'Tjetër'
];

const COLUMN_MAP = {
    'nr.':'nr_rreshti','lloji i polices':'lloji','dega':'dega','agjenti':'agjenti',
    'id':'kontraktues_id','kontraktuesi':'kontraktuesi','nr i kontrates':'nr_kontrates',
    'nr i pro-fatures':'nr_profatures','data e fatures':'data_fatures',
    'fillon':'data_fillimit','mbaron':'data_mbarimit',
    'primi(v)':'primi','tvsh(v)':'tvsh','total(v)':'total_primi','valuta':'valuta'
};
const DEME_COLS = ['deme_nr_paguar','deme_vlera_paguar','deme_nr_pezull','deme_vlera_pezull'];

// ===== SCORING & SUGJERIME =====
function kalkuloSkor(r) {
    const primi = r.primi_vjetor || 0;
    const cr = r.cr_percent || 0;
    // Primi score (40%): higher primi = higher score, log scale
    let primiScore = 0;
    if (primi > 0) primiScore = Math.min(100, Math.log10(primi) / Math.log10(100000) * 100);
    // CR score (40%): lower CR = higher score (more profitable)
    let crScore = 100;
    if (cr > 0) crScore = Math.max(0, 100 - cr);
    // Pezull risk (20%): no pezull = full score
    const pezullRatio = primi > 0 ? ((r.deme_vlera_pezull || 0) / primi * 100) : 0;
    let pezullScore = Math.max(0, 100 - pezullRatio * 2);
    return Math.round(primiScore * 0.4 + crScore * 0.4 + pezullScore * 0.2);
}

function merrSugjerime(r) {
    const suggestions = [];
    const cr = r.cr_percent || 0;
    const primi = r.primi_vjetor || 0;
    if (cr > 100) suggestions.push({ tipi: 'danger', teksti: 'CR mbi 100% — shpenzimet dhe dëmet tejkalojnë primin', ikona: '🔴' });
    else if (cr > 80) suggestions.push({ tipi: 'warning', teksti: 'CR ' + cr.toFixed(0) + '% — afër kufirit të profitabilitetit', ikona: '⚠️' });
    else if (cr < 30 && cr > 0 && primi > 5000) suggestions.push({ tipi: 'success', teksti: 'CR ' + cr.toFixed(0) + '% — kontratë me profitabilitet të lartë', ikona: '✅' });
    if (primi > 50000) suggestions.push({ tipi: 'info', teksti: 'Primi ' + formatMoney(primi) + ' — kontratë me peshë të lartë në portofol', ikona: '⭐' });
    return suggestions;
}

// ===== STATE =====
let rinovimet = [];
let filteredList = [];
let currentMuaj = null;    // 'maj_2026' format
let currentSort = 'primi';
let currentStatusFilter = 'total';
let currentDrawerId = null;
let importParsedData = null;
let importStep = 1;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    ngarkoTedhena();
    renderTabs();
    aplikoFiltrat();
    populoFiltrat();
    populoImportMuajt();
});

// ===== STORAGE =====
function ngarkoTedhena() {
    try { rinovimet = JSON.parse(localStorage.getItem(RIN_KEY) || '[]'); } catch(e) { rinovimet = []; }
}
function ruajTedhena() { localStorage.setItem(RIN_KEY, JSON.stringify(rinovimet)); }
function merrImports() { try { return JSON.parse(localStorage.getItem(RIN_IMP_KEY) || '[]'); } catch(e) { return []; } }
function ruajImportMeta(m) { const a = merrImports(); a.push(m); localStorage.setItem(RIN_IMP_KEY, JSON.stringify(a)); }

// ===== ROLE-BASED FILTERING =====
function merrUser() {
    try {
        const u = JSON.parse(localStorage.getItem('currentUser') || '{}');
        return { username: u.username||'', emri: u.emriPlote||u.username||'System', roli: u.roli||'staff', dega: u.dega||'' };
    } catch(e) { return { username:'', emri:'System', roli:'superadmin', dega:'' }; }
}

function filtroSipasRolit(list) {
    const user = merrUser();
    const r = (user.roli || '').toLowerCase();
    if (r === 'superadmin' || r === 'management' || r === 'dep_management') return list;
    // staff and staff_hq see only their branch
    const dega = (user.dega || '').toLowerCase();
    if (!dega) return list;
    return list.filter(x => (x.dega || '').toLowerCase() === dega);
}

// ===== MONTH TABS =====
function getMuajt() {
    const muajSet = new Set();
    rinovimet.forEach(r => { if (r.muaji) muajSet.add(r.muaji); });
    return [...muajSet].sort((a, b) => {
        const [ma, ya] = a.split('_'); const [mb, yb] = b.split('_');
        return (parseInt(ya) - parseInt(yb)) || (MUAJT.indexOf(capitalizeFirst(ma)) - MUAJT.indexOf(capitalizeFirst(mb)));
    });
}

function renderTabs() {
    const container = document.getElementById('rinTabs');
    const muajt = getMuajt();
    if (muajt.length === 0) {
        container.innerHTML = '<span style="padding:7px 18px;font-size:12px;color:#94a3b8;">Asnjë import ende</span>';
        currentMuaj = null;
        return;
    }
    if (!currentMuaj || !muajt.includes(currentMuaj)) currentMuaj = muajt[muajt.length - 1];

    let html = '';
    muajt.forEach(m => {
        const count = filtroSipasRolit(rinovimet.filter(r => r.muaji === m)).length;
        const label = formatMuajLabel(m);
        const active = m === currentMuaj ? 'active' : '';
        html += `<button class="tab-btn ${active}" onclick="ndryshoMuaj('${m}')">${label} <span class="tab-count">${count}</span></button>`;
    });
    container.innerHTML = html;
}

function ndryshoMuaj(m) {
    currentMuaj = m;
    renderTabs();
    aplikoFiltrat();
}

function formatMuajLabel(key) {
    if (!key) return '';
    const [m, y] = key.split('_');
    return capitalizeFirst(m) + ' ' + y;
}

function capitalizeFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

// ===== STATS STRIP =====
function perditesoStats() {
    const data = filtroSipasRolit(rinovimet.filter(r => r.muaji === currentMuaj));
    const counts = {};
    Object.keys(STATUSET).forEach(s => counts[s] = 0);
    let totalPrimi = 0, totalDeme = 0;
    data.forEach(r => {
        if (counts[r.statusi] !== undefined) counts[r.statusi]++;
        totalPrimi += (r.primi_vjetor || 0);
        totalDeme += (r.deme_total_vlera || 0);
    });
    const total = data.length;
    const avgLR = totalPrimi > 0 ? (totalDeme / totalPrimi * 100) : 0;

    // Metrics — clickable
    const activeFilter = currentStatusFilter || 'total';
    const metricStyle = (key) => `cursor:pointer;${activeFilter===key?'opacity:1;border-bottom:2px solid #fff;padding-bottom:14px':'opacity:0.7'}`;
    document.getElementById('stripMetrics').innerHTML = `
        <div class="strip-metric" style="${metricStyle('total')}" onclick="filtroStatusStrip('total')"><div class="sm-num">${total}</div><div class="sm-lbl">Total</div></div>
        <div class="strip-metric s-pafilluar" style="${metricStyle('pa_filluar')}" onclick="filtroStatusStrip('pa_filluar')"><div class="sm-num">${counts.pa_filluar}</div><div class="sm-lbl">Pa filluar</div></div>
        <div class="strip-metric s-kontaktuar" style="${metricStyle('kontaktuar')}" onclick="filtroStatusStrip('kontaktuar')"><div class="sm-num">${counts.kontaktuar}</div><div class="sm-lbl">Kontaktuar</div></div>
        <div class="strip-metric s-rinovuar" style="${metricStyle('rinovuar')}" onclick="filtroStatusStrip('rinovuar')"><div class="sm-num">${counts.rinovuar}</div><div class="sm-lbl">Rinovuar</div></div>
        <div class="strip-metric s-humbur" style="${metricStyle('humbur')}" onclick="filtroStatusStrip('humbur')"><div class="sm-num">${counts.humbur}</div><div class="sm-lbl">Humbur</div></div>
    `;

    // Chips — with target tracking
    const rinovuarPct = total > 0 ? (counts.rinovuar / total * 100) : 0;
    const humburPct = total > 0 ? (counts.humbur / total * 100) : 0;
    document.getElementById('stripChips').innerHTML = `
        <div class="strip-chip">Primi <span class="sc-num">${formatMoneyShort(totalPrimi)}</span></div>
        <div class="strip-chip">Dëme <span class="sc-num">${formatMoneyShort(totalDeme)}</span></div>
        <div class="strip-chip">LR <span class="sc-num">${avgLR.toFixed(1)}%</span></div>
        <div class="strip-chip" style="gap:8px;min-width:160px">
            Rinovuar <span class="sc-num">${counts.rinovuar}/${total}</span>
            <span style="flex:1;height:4px;background:rgba(255,255,255,.15);border-radius:2px;overflow:hidden;min-width:40px;display:inline-block">
                <span style="display:block;height:100%;width:${rinovuarPct}%;background:#4ade80;border-radius:2px"></span>
            </span>
            <span style="font-size:10px;font-weight:700;color:#4ade80">${rinovuarPct.toFixed(0)}%</span>
        </div>
    `;

    // Bar
    const bar = document.getElementById('stripBar');
    const legend = document.getElementById('stripLegend');
    if (total > 0) {
        let barHtml = '', legHtml = '';
        Object.keys(STATUSET).forEach(s => {
            const pct = (counts[s] / total * 100).toFixed(1);
            barHtml += `<div class="strip-bar-seg" style="width:${pct}%;background:${STATUSET[s].bar}"></div>`;
            legHtml += `<span><span class="sl-dot" style="background:${STATUSET[s].bar}"></span>${STATUSET[s].emri} ${counts[s]}</span>`;
        });
        bar.innerHTML = barHtml;
        legend.innerHTML = legHtml;
    } else {
        bar.innerHTML = '<div class="strip-bar-seg" style="width:100%;background:rgba(255,255,255,.1)"></div>';
        legend.innerHTML = '';
    }
}

// ===== FILTERS =====
function filtroStatusStrip(status) {
    currentStatusFilter = (currentStatusFilter === status) ? 'total' : status;
    aplikoFiltrat();
}

function aplikoFiltrat() {
    let data = rinovimet.filter(r => r.muaji === currentMuaj);
    data = filtroSipasRolit(data);

    const agjent = document.getElementById('rinFilterAgjent').value;
    const dega   = document.getElementById('rinFilterDega').value;
    const search = document.getElementById('rinSearch').value.toLowerCase().trim();

    if (currentStatusFilter && currentStatusFilter !== 'total') data = data.filter(r => r.statusi === currentStatusFilter);
    if (agjent) data = data.filter(r => r.agjenti === agjent);
    if (dega)   data = data.filter(r => r.dega === dega);
    if (search)  data = data.filter(r =>
        (r.kontraktuesi||'').toLowerCase().includes(search) ||
        (r.nr_kontrates||'').toLowerCase().includes(search)
    );

    filteredList = data;
    renderTabela();
    perditesoStats();
}

function populoFiltrat() {
    const data = filtroSipasRolit(rinovimet);
    const agjentet = [...new Set(data.map(r => r.agjenti).filter(Boolean))].sort();
    const deget    = [...new Set(data.map(r => r.dega).filter(Boolean))].sort();

    const selA = document.getElementById('rinFilterAgjent');
    selA.innerHTML = '<option value="">Të gjithë agjentët</option>';
    agjentet.forEach(a => { selA.innerHTML += `<option value="${esc(a)}">${esc(a)}</option>`; });

    const selD = document.getElementById('rinFilterDega');
    selD.innerHTML = '<option value="">Të gjitha degët</option>';
    deget.forEach(d => { selD.innerHTML += `<option value="${esc(d)}">${esc(d)}</option>`; });
}

// ===== SORT =====
function ndryshoSort(type) {
    currentSort = type;
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('sort-' + type)?.classList.add('active');
    renderTabela();
}

function sortoListen(list) {
    return [...list].sort((a, b) => {
        if (currentSort === 'primi') return (b.primi_vjetor || 0) - (a.primi_vjetor || 0);
        if (currentSort === 'lr') return (b.lr_percent || 0) - (a.lr_percent || 0);
        if (currentSort === 'skadon') return parseDateStr(a.data_mbarimit) - parseDateStr(b.data_mbarimit);
        return 0;
    });
}

// ===== TABLE =====
function renderTabela() {
    const tbody = document.getElementById('rinTableBody');

    if (!currentMuaj || rinovimet.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="rin-empty"><div class="rin-empty-icon">📋</div><div class="rin-empty-title">Asnjë rinovim ende</div><div class="rin-empty-sub">Kliko "Importo" për të filluar</div></div></td></tr>';
        return;
    }

    if (filteredList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="rin-no-results">Asnjë rezultat me këto filtra</div></td></tr>';
        return;
    }

    const sorted = sortoListen(filteredList);
    let html = '';
    sorted.forEach(r => {
        const primi = r.primi_vjetor || 0;
        const deme = r.deme_total_vlera || 0;
        const lr = r.lr_percent;
        const cr = r.cr_percent;
        const lrClass = lr > 80 ? 'rin-lr-bad' : lr > 50 ? 'rin-lr-warn' : lr > 0 ? 'rin-lr-good' : 'rin-deme-none';
        const crClass = cr > 90 ? 'rin-lr-bad' : cr > 50 ? 'rin-lr-warn' : cr > 0 ? 'rin-lr-good' : 'rin-deme-none';
        const mbaron = formatDateShort(r.data_mbarimit);
        const rowBg = cr > 90 ? 'background:rgba(254,202,202,.18);' : '';

        html += `<tr onclick="hapDrawer('${r.id}')" style="cursor:pointer;${rowBg}">
            <td><div class="klient-name">${esc(r.kontraktuesi)}${cr>90?' <span style="font-size:9px;color:#ef4444;font-weight:700">⚠</span>':''}</div><div class="klient-sub">${esc(r.dega)} · ${esc(r.agjenti)}</div></td>
            <td style="font-size:11px;color:#64748b">${esc(r.nr_kontrates)}</td>
            <td class="rin-primi" style="text-align:right">${formatMoney(primi)}</td>
            <td style="text-align:right" class="${deme > 0 ? 'rin-deme-val' : 'rin-deme-none'}">${deme > 0 ? formatMoney(deme) : '—'}</td>
            <td style="text-align:right" class="${lrClass}">${lr > 0 ? lr.toFixed(1)+'%' : '—'}</td>
            <td style="text-align:right" class="${crClass}">${cr > 0 ? cr.toFixed(1)+'%' : '—'}</td>
            <td><span class="rin-badge rin-badge-${r.statusi}">${STATUSET[r.statusi]?.emri||r.statusi}</span></td>
            <td style="text-align:center;font-size:11px">${mbaron}</td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// ===== DRAWER =====
function hapDrawer(id) {
    const r = rinovimet.find(x => x.id === id);
    if (!r) return;
    currentDrawerId = id;

    document.getElementById('drKontraktuesi').textContent = r.kontraktuesi;
    document.getElementById('drSubtitle').textContent = `${r.nr_kontrates} · ${r.dega}`;

    renderStatusPills(r.statusi);
    renderHumbjeSection(r);

    // Info
    document.getElementById('drInfoGrid').innerHTML =
        infoCell('Agjenti', r.agjenti) + infoCell('ID klienti', r.kontraktues_id) +
        infoCell('Fillon', r.data_fillimit) + infoCell('Mbaron', r.data_mbarimit) +
        (r.nr_profatures ? infoCell('Nr pro-faturës', r.nr_profatures) : '') + infoCell('Valuta', r.valuta || 'EUR');

    // Financiare
    const primi = r.primi_vjetor || 0;
    const deme = r.deme_total_vlera || 0;
    const lr = r.lr_percent || 0;
    const cr = r.cr_percent || 0;

    document.getElementById('drMetrics').innerHTML = `
        <div class="rin-metric"><div class="rin-metric-label">Primi vjetor</div><div class="rin-metric-value" style="color:#1a2332">${formatMoney(primi)}</div></div>
        <div class="rin-metric"><div class="rin-metric-label">Dëme totale</div><div class="rin-metric-value" style="color:${deme>0?'#ef4444':'#94a3b8'}">${deme>0?formatMoney(deme):'—'}</div></div>
    `;

    document.getElementById('drBreakdown').innerHTML =
        bdi('Dëme paguar', r.deme_nr_paguar, r.deme_vlera_paguar) +
        bdi('Dëme pezull', r.deme_nr_pezull, r.deme_vlera_pezull) +
        bdi('Shpenzimet', null, r.shpenzimet) +
        bdi('Kosto totale', null, r.kosto_totale);

    // Ratio bars
    const lrColor = lr > 80 ? '#ef4444' : lr > 50 ? '#f59e0b' : '#22c55e';
    const crColor = cr > 80 ? '#ef4444' : cr > 50 ? '#f59e0b' : '#22c55e';
    const ratioBars = document.getElementById('drRatioBars');
    if (lr > 0 || cr > 0) {
        ratioBars.innerHTML = `
            ${ratioBar('Loss Ratio', lr, lrColor)}
            ${ratioBar('Combined Ratio', cr, crColor)}
        `;
        ratioBars.style.display = '';
    } else {
        ratioBars.style.display = 'none';
    }

    // Excel koment (lart si notë)
    const noteEl = document.getElementById('drExcelNote');
    const excelKoment = (r.komente || []).find(k => k.tipi === 'import');
    if (excelKoment) {
        noteEl.innerHTML = `<div style="padding:10px 22px;background:#fffbeb;border-bottom:1px solid #fde68a;font-size:12px;color:#92400e;display:flex;align-items:center;gap:6px">
            <span style="font-size:14px">📝</span> <strong>Shënim:</strong> ${esc(excelKoment.teksti)}
        </div>`;
    } else {
        noteEl.innerHTML = '';
    }

    // Sugjerime (vetëm në drawer, informuese)
    const suggestions = merrSugjerime(r);
    const sugEl = document.getElementById('drSugjerime');
    if (suggestions.length > 0) {
        let sugHtml = '';
        suggestions.forEach(s => {
            const bgMap = { danger:'#fef2f2', warning:'#fffbeb', success:'#f0fdf4', info:'#eff6ff' };
            const borderMap = { danger:'#fecaca', warning:'#fed7aa', success:'#bbf7d0', info:'#bfdbfe' };
            const colorMap = { danger:'#991b1b', warning:'#92400e', success:'#166534', info:'#1e40af' };
            sugHtml += `<div style="padding:8px 12px;background:${bgMap[s.tipi]};border:1px solid ${borderMap[s.tipi]};border-radius:8px;font-size:12px;color:${colorMap[s.tipi]};margin-bottom:4px;display:flex;align-items:center;gap:6px">
                <span>${s.ikona}</span> ${esc(s.teksti)}
            </div>`;
        });
        sugEl.innerHTML = sugHtml;
        sugEl.style.display = '';
    } else {
        sugEl.innerHTML = '';
        sugEl.style.display = 'none';
    }

    renderKomente(r);

    document.getElementById('rinOverlay').classList.add('open');
    document.getElementById('rinDrawer').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function mbyllDrawer() {
    document.getElementById('rinOverlay').classList.remove('open');
    document.getElementById('rinDrawer').classList.remove('open');
    document.body.style.overflow = '';
    currentDrawerId = null;
}

function renderStatusPills(current) {
    let html = '<label>Statusi:</label>';
    Object.keys(STATUSET).forEach(key => {
        html += `<span class="rin-status-pill rin-sp-${key} ${key===current?'selected':''}" onclick="ndryshStatus('${key}')">${STATUSET[key].emri}</span>`;
    });
    document.getElementById('drStatusRow').innerHTML = html;
}

function ndryshStatus(newStatus) {
    if (!currentDrawerId) return;
    if (newStatus === 'humbur') { hapHumbjeModal(); return; }

    const r = rinovimet.find(x => x.id === currentDrawerId);
    if (!r) return;
    const old = r.statusi;
    if (old === newStatus) return;

    r.statusi = newStatus;
    r.updated_at = new Date().toISOString();
    // Clear humbje data if changing away from humbur
    if (old === 'humbur') { r.humbje_arsyeja = null; r.humbje_koment = null; }

    const user = merrUser();
    r.komente = r.komente || [];
    r.komente.unshift({ teksti: `Statusi: ${STATUSET[old]?.emri} → ${STATUSET[newStatus]?.emri}`, autori: user.emri, data: new Date().toISOString(), tipi: 'sistem' });

    ruajTedhena();
    renderStatusPills(newStatus);
    renderHumbjeSection(r);
    renderKomente(r);
    perditesoStats();
    renderTabs();
    aplikoFiltrat();
}

// ===== HUMBJE SECTION IN DRAWER =====
function renderHumbjeSection(r) {
    const el = document.getElementById('drHumbjeSection');
    if (r.statusi === 'humbur' && r.humbje_arsyeja) {
        el.innerHTML = `<div class="rin-humbje-section">
            <div class="rin-humbje-title">Arsyeja e humbjes</div>
            <div class="rin-humbje-arsye">${esc(r.humbje_arsyeja)}</div>
            ${r.humbje_koment ? `<div class="rin-humbje-koment">"${esc(r.humbje_koment)}"</div>` : ''}
        </div>`;
    } else {
        el.innerHTML = '';
    }
}

// ===== HUMBJE MODAL =====
function hapHumbjeModal() {
    let html = '';
    ARSYET_HUMBJES.forEach((a, i) => {
        html += `<label class="rin-arsye-opt" onclick="this.querySelector('input').checked=true;document.querySelectorAll('.rin-arsye-opt').forEach(x=>x.classList.remove('selected'));this.classList.add('selected')">
            <input type="radio" name="arsyeHumbjes" value="${i}"> ${esc(a)}
        </label>`;
    });
    document.getElementById('arsyeList').innerHTML = html;
    document.getElementById('arsyeKoment').value = '';
    document.getElementById('humbjeModal').classList.add('open');
}

function mbyllHumbjeModal() {
    document.getElementById('humbjeModal').classList.remove('open');
}

function konfirmoHumbje() {
    const selected = document.querySelector('input[name="arsyeHumbjes"]:checked');
    if (!selected) { alert('Zgjedh një arsye.'); return; }

    const arsyeIdx = parseInt(selected.value);
    const arsyeTxt = ARSYET_HUMBJES[arsyeIdx];
    const koment = document.getElementById('arsyeKoment').value.trim();

    // If "Tjetër" selected, koment is required
    if (arsyeTxt === 'Tjetër' && !koment) { alert('Shkruaj arsyen në koment.'); return; }

    const r = rinovimet.find(x => x.id === currentDrawerId);
    if (!r) return;
    const old = r.statusi;

    r.statusi = 'humbur';
    r.humbje_arsyeja = arsyeTxt;
    r.humbje_koment = koment || null;
    r.updated_at = new Date().toISOString();

    const user = merrUser();
    r.komente = r.komente || [];
    r.komente.unshift({
        teksti: `Humbje: ${arsyeTxt}${koment ? ' — ' + koment : ''}`,
        autori: user.emri, data: new Date().toISOString(), tipi: 'sistem'
    });

    ruajTedhena();
    mbyllHumbjeModal();
    renderStatusPills('humbur');
    renderHumbjeSection(r);
    renderKomente(r);
    perditesoStats();
    renderTabs();
    aplikoFiltrat();
}

// ===== KOMENTE =====
function renderKomente(r) {
    const el = document.getElementById('drKomente');
    const komente = r.komente || [];
    if (komente.length === 0) { el.innerHTML = '<div style="font-size:13px;color:#94a3b8;padding:8px 0">Asnjë koment ende</div>'; return; }
    el.innerHTML = komente.map(k => `<div class="rin-comment ${k.tipi==='sistem'?'sistem':''}" ${k.tipi==='import'?'style="border-left:3px solid #f59e0b"':''}>
        <div class="rin-comment-header"><span class="rin-comment-author">${esc(k.autori)}</span><span class="rin-comment-date">${formatKomentDate(k.data)}</span></div>
        <p class="rin-comment-text">${esc(k.teksti)}</p>
    </div>`).join('');
}

function shtoKoment() {
    if (!currentDrawerId) return;
    const input = document.getElementById('drKomentInput');
    const teksti = input.value.trim();
    if (!teksti) return;
    const r = rinovimet.find(x => x.id === currentDrawerId);
    if (!r) return;
    const user = merrUser();
    r.komente = r.komente || [];
    r.komente.unshift({ teksti, autori: user.emri, data: new Date().toISOString(), tipi: 'manual' });
    r.updated_at = new Date().toISOString();
    ruajTedhena();
    renderKomente(r);
    input.value = '';
}

// ===== IMPORT MODAL =====
function populoImportMuajt() {
    const sel = document.getElementById('importMuaji');
    const now = new Date();
    let html = '';
    for (let i = -1; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const key = MUAJT[d.getMonth()].toLowerCase() + '_' + d.getFullYear();
        const label = MUAJT[d.getMonth()] + ' ' + d.getFullYear();
        const selected = i === 0 ? 'selected' : '';
        html += `<option value="${key}" ${selected}>${label}</option>`;
    }
    sel.innerHTML = html;
}

function hapImportModal() {
    importStep = 1; importParsedData = null;
    document.getElementById('rinImportModal').classList.add('open');
    document.getElementById('fileInput').value = '';
    showImportStep(1);
    document.body.style.overflow = 'hidden';
}

function mbyllImportModal() {
    document.getElementById('rinImportModal').classList.remove('open');
    if (!currentDrawerId) document.body.style.overflow = '';
    importParsedData = null;
}

function showImportStep(step) {
    importStep = step;
    document.getElementById('importStep1').style.display = step===1?'':'none';
    document.getElementById('importStep2').style.display = step===2?'':'none';
    document.getElementById('importStep3').style.display = step===3?'':'none';
    [1,2,3].forEach(i => {
        const n = document.getElementById(`stepNum${i}`), t = document.getElementById(`stepText${i}`);
        n.classList.remove('active','done'); t.classList.remove('active');
        if (i < step) n.classList.add('done');
        if (i === step) { n.classList.add('active'); t.classList.add('active'); }
    });
    const btn = document.getElementById('importNextBtn');
    if (step===1) { btn.textContent='Vazhdo'; btn.disabled=true; btn.onclick=()=>showImportStep(2); }
    else if (step===2) { btn.textContent='Vazhdo'; btn.disabled=false; btn.onclick=()=>showImportStep(3); renderImportStep2(); }
    else { renderImportStep3(); btn.textContent=`Importo ${importParsedData.records.length} kontrata`; btn.disabled=false; btn.onclick=()=>ekzekutoImport(); }
}

function handleFileSelect(e) { const f=e.target.files[0]; if(f)processFile(f); }
function handleDrop(e) { e.preventDefault(); e.target.closest('.rin-upload-zone')?.classList.remove('dragover'); const f=e.dataTransfer.files[0]; if(f)processFile(f); }

function processFile(file) {
    if (!file.name.match(/\.xlsx?$/i)) { alert('Vetëm .xlsx ose .xls'); return; }
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const wb = XLSX.read(new Uint8Array(e.target.result), { type:'array', cellDates:false, cellFormula:false });
            const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header:1, defval:null, rawNumbers:true });
            const parsed = parseExcelRows(rows);
            if (!parsed) return;
            parsed.fileName = file.name;
            parsed.fileSize = (file.size/1024).toFixed(0)+' KB';
            importParsedData = parsed;
            document.getElementById('importNextBtn').disabled = false;
            showImportStep(2);
        } catch(err) { console.error(err); alert('Gabim: ' + err.message); }
    };
    reader.readAsArrayBuffer(file);
}

function parseExcelRows(rows) {
    let headerIdx = -1;
    for (let i=0; i<Math.min(5,rows.length); i++) {
        const cells = (rows[i]||[]).map(c => c?String(c).toLowerCase().trim():'');
        if (cells.includes('nr.') || cells.includes('kontraktuesi') || cells.includes('nr i kontrates')) { headerIdx=i; break; }
    }
    if (headerIdx===-1) { alert('Header nuk u gjet.'); return null; }

    const headers = rows[headerIdx].map(h => h?String(h).toLowerCase().trim():'');
    const dataRows = rows.slice(headerIdx+1).filter(r => r && r.some(c => c!==null && c!=='' && c!==undefined));

    const colMap = {};
    headers.forEach((h,i) => { if(COLUMN_MAP[h]) colMap[COLUMN_MAP[h]]=i; });
    const valutaIdx = colMap['valuta'];
    if (valutaIdx !== undefined) DEME_COLS.forEach((col,i) => { const idx=valutaIdx+1+i; if(idx<headers.length) colMap[col]=idx; });

    const rawRecords = [];
    dataRows.forEach(row => {
        const rec = {};
        Object.keys(colMap).forEach(f => { let v=row[colMap[f]]; if(typeof v==='string'&&v.startsWith('='))v=null; rec[f]=v; });
        if (!rec.kontraktuesi && !rec.nr_kontrates) return;
        ['primi','tvsh','total_primi','deme_nr_paguar','deme_vlera_paguar','deme_nr_pezull','deme_vlera_pezull'].forEach(f => {
            if(rec[f]!==null&&rec[f]!==undefined) rec[f]=parseFloat(rec[f])||0;
        });
        // Capture comment from last non-empty, non-formula column
        rec._koment_excel = null;
        for (let ci = row.length - 1; ci >= 0; ci--) {
            const cv = row[ci];
            if (cv !== null && cv !== undefined && String(cv).trim() !== '' && !String(cv).startsWith('=')) {
                // Skip if it's a known data column (numeric or mapped)
                const isDataCol = Object.values(colMap).includes(ci);
                if (!isDataCol) { rec._koment_excel = String(cv).trim(); break; }
                break;
            }
        }
        rawRecords.push(rec);
    });

    // Group by nr_kontrates
    const grouped = {};
    rawRecords.forEach(rec => {
        const key = rec.nr_kontrates || ('noid_'+Math.random().toString(36).substr(2,6));
        if (!grouped[key]) { grouped[key]={...rec,_rc:1}; }
        else {
            const g=grouped[key]; g._rc++;
            g.primi=(g.primi||0)+(rec.primi||0); g.tvsh=(g.tvsh||0)+(rec.tvsh||0); g.total_primi=(g.total_primi||0)+(rec.total_primi||0);
            g.deme_nr_paguar=(g.deme_nr_paguar||0)+(rec.deme_nr_paguar||0); g.deme_vlera_paguar=(g.deme_vlera_paguar||0)+(rec.deme_vlera_paguar||0);
            g.deme_nr_pezull=(g.deme_nr_pezull||0)+(rec.deme_nr_pezull||0); g.deme_vlera_pezull=(g.deme_vlera_pezull||0)+(rec.deme_vlera_pezull||0);
            if(rec.data_fillimit&&(!g.data_fillimit||parseDateStr(rec.data_fillimit)<parseDateStr(g.data_fillimit))) g.data_fillimit=rec.data_fillimit;
            if(rec.data_mbarimit&&(!g.data_mbarimit||parseDateStr(rec.data_mbarimit)>parseDateStr(g.data_mbarimit))) g.data_mbarimit=rec.data_mbarimit;
            if(rec._koment_excel && !g._koment_excel) g._koment_excel=rec._koment_excel;
        }
    });

    const muaj = document.getElementById('importMuaji').value;
    const records = Object.values(grouped).map(g => {
        g.deme_total_nr=(g.deme_nr_paguar||0)+(g.deme_nr_pezull||0);
        g.deme_total_vlera=(g.deme_vlera_paguar||0)+(g.deme_vlera_pezull||0);
        const tp=g.total_primi||g.primi||0;
        g.shpenzimet=tp*0.31;
        g.kosto_totale=g.deme_total_vlera+g.shpenzimet;
        g.lr_percent=tp>0?(g.deme_total_vlera/tp*100):0;
        g.cr_percent=tp>0?(g.kosto_totale/tp*100):0;
        g.primi_vjetor=tp;
        return g;
    });

    // Detect updates
    const existingMap = {};
    rinovimet.filter(r=>r.muaji===muaj).forEach(r => { existingMap[r.nr_kontrates]=r.id; });
    let updateCount=0, newCount=0;
    records.forEach(r => {
        if(existingMap[r.nr_kontrates]) { r._action='update'; r._existId=existingMap[r.nr_kontrates]; updateCount++; }
        else { r._action='new'; newCount++; }
    });

    return {
        records, rawCount:rawRecords.length, groupedCount:rawRecords.length-records.length,
        withDeme:records.filter(r=>r.deme_total_vlera>0).length, withoutDeme:records.filter(r=>r.deme_total_vlera<=0).length,
        updateCount, newCount, agents:[...new Set(records.map(r=>r.agjenti).filter(Boolean))],
        branches:[...new Set(records.map(r=>r.dega).filter(Boolean))], muaj
    };
}

function renderImportStep2() {
    if(!importParsedData) return;
    const d=importParsedData;
    let html = `
        <div class="rin-file-info"><span style="font-size:20px">📄</span><div style="flex:1"><div class="rin-file-name">${esc(d.fileName)}</div><div class="rin-file-meta">${d.rawCount} rreshta · ${d.fileSize} · ${formatMuajLabel(d.muaj)}</div></div></div>
        <div style="margin-bottom:16px"><div style="font-size:12px;font-weight:600;color:#64748b;margin-bottom:8px">Rezultati i analizës</div>
            <div class="rin-validation-item"><span class="rin-v-ok">✓</span> ${d.records.length} kontrata unike (nga ${d.rawCount} rreshta)</div>
            ${d.groupedCount>0?`<div class="rin-validation-item"><span class="rin-v-ok">✓</span> ${d.groupedCount} rreshta u grupuan</div>`:''}
            <div class="rin-validation-item"><span class="rin-v-ok">✓</span> ${d.withDeme} kontrata me dëme</div>
            ${d.withoutDeme>0?`<div class="rin-validation-item"><span class="rin-v-warn">⚠</span> ${d.withoutDeme} kontrata pa dëme</div>`:''}
            <div class="rin-validation-item"><span class="rin-v-ok">✓</span> ${d.agents.length} agjentë · ${d.branches.length} degë</div>
        </div>`;
    if(d.updateCount>0||d.newCount>0) html+=`<div class="rin-match-info">${d.updateCount>0?`<strong>${d.updateCount} ekzistuese</strong> do të përditësohen.<br>`:''}
        <strong>${d.newCount} të reja</strong> do të shtohen.</div>`;

    const preview=d.records.slice(0,4);
    html+=`<div class="rin-preview-label">Shembull</div><div class="rin-preview-wrap"><table class="rin-preview-table">
        <thead><tr><th style="width:30%">Kontraktuesi</th><th style="width:22%">Nr kontratës</th><th style="text-align:right;width:16%">Primi</th><th style="text-align:right;width:16%">Dëme</th><th style="text-align:right;width:16%">LR%</th></tr></thead><tbody>`;
    preview.forEach(r => {
        html+=`<tr><td>${esc(r.kontraktuesi||'—')}</td><td>${esc(r.nr_kontrates||'—')}</td>
            <td style="text-align:right">${formatMoney(r.primi_vjetor||0)}</td>
            <td style="text-align:right;${r.deme_total_vlera>0?'color:#ef4444':'color:#cbd5e1'}">${r.deme_total_vlera>0?formatMoney(r.deme_total_vlera):'—'}</td>
            <td style="text-align:right">${r.lr_percent>0?r.lr_percent.toFixed(1)+'%':'—'}</td></tr>`;
    });
    html+='</tbody></table></div>';
    document.getElementById('importStep2').innerHTML=html;
}

function renderImportStep3() {
    if(!importParsedData) return;
    const d=importParsedData;
    document.getElementById('importStep3').innerHTML=`<div style="text-align:center;padding:20px 0">
        <div style="font-size:32px;margin-bottom:12px">✅</div>
        <div style="font-size:16px;font-weight:600;color:#1a2332;margin-bottom:4px">Gati për import — ${formatMuajLabel(d.muaj)}</div>
        <div style="font-size:13px;color:#64748b;margin-bottom:20px">${d.records.length} kontrata do të importohen.${d.updateCount>0?' '+d.updateCount+' do të përditësohen.':''}</div>
    </div>`;
}

function ekzekutoImport() {
    if(!importParsedData) return;
    const d=importParsedData;
    const user=merrUser();
    const now=new Date().toISOString();
    const impId='imp_'+Date.now().toString(36);
    const muaj=d.muaj;

    d.records.forEach(rec => {
        if(rec._action==='update'&&rec._existId) {
            const ex=rinovimet.find(r=>r.id===rec._existId);
            if(ex) {
                ['primi','tvsh','total_primi','primi_vjetor','deme_nr_paguar','deme_vlera_paguar','deme_nr_pezull','deme_vlera_pezull',
                 'deme_total_nr','deme_total_vlera','shpenzimet','kosto_totale','lr_percent','cr_percent','data_fillimit','data_mbarimit'].forEach(f=>{ex[f]=rec[f];});
                if(rec.agjenti)ex.agjenti=rec.agjenti; if(rec.dega)ex.dega=rec.dega;
                ex.updated_at=now;
                ex.komente=ex.komente||[];
                ex.komente.unshift({teksti:'Të dhënat u përditësuan nga importi.',autori:user.emri,data:now,tipi:'sistem'});
            }
        } else {
            rinovimet.push({
                id:'rin_'+Date.now().toString(36)+'_'+Math.random().toString(36).substr(2,4),
                muaji: muaj,
                nr_kontrates:rec.nr_kontrates||'', kontraktues_id:rec.kontraktues_id||'', kontraktuesi:rec.kontraktuesi||'',
                dega:rec.dega||'', agjenti:rec.agjenti||'', lloji:rec.lloji||'',
                nr_profatures:rec.nr_profatures||'', data_fatures:rec.data_fatures||'',
                data_fillimit:rec.data_fillimit||'', data_mbarimit:rec.data_mbarimit||'',
                primi:rec.primi||0, tvsh:rec.tvsh||0, total_primi:rec.total_primi||0, primi_vjetor:rec.primi_vjetor||0,
                valuta:rec.valuta||'EUR',
                deme_nr_paguar:rec.deme_nr_paguar||0, deme_vlera_paguar:rec.deme_vlera_paguar||0,
                deme_nr_pezull:rec.deme_nr_pezull||0, deme_vlera_pezull:rec.deme_vlera_pezull||0,
                deme_total_nr:rec.deme_total_nr||0, deme_total_vlera:rec.deme_total_vlera||0,
                shpenzimet:rec.shpenzimet||0, kosto_totale:rec.kosto_totale||0,
                lr_percent:rec.lr_percent||0, cr_percent:rec.cr_percent||0,
                statusi:'pa_filluar', komente:[], humbje_arsyeja:null, humbje_koment:null,
                importi_id:impId, importuar_nga:user.emri, created_at:now, updated_at:now
            });
            // Add Excel comment if present
            if (rec._koment_excel) {
                const newRec = rinovimet[rinovimet.length - 1];
                newRec.komente.push({ teksti: rec._koment_excel, autori: 'Import Excel', data: now, tipi: 'import' });
            }
        }
    });

    ruajTedhena();
    ruajImportMeta({id:impId, data:formatKomentDate(now), fileName:d.fileName, muaj:muaj, total:d.records.length, importuarNga:user.emri});

    currentMuaj = muaj;
    renderTabs();
    populoFiltrat();
    aplikoFiltrat();
    mbyllImportModal();
}

// ===== EXPORT =====
function eksportoExcel() {
    if(!currentMuaj) { alert('Asnjë muaj i zgjedhur.'); return; }
    const data = filtroSipasRolit(rinovimet.filter(r=>r.muaji===currentMuaj));
    if(data.length===0) { alert('Asnjë të dhënë për eksport.'); return; }

    const rows = data.map(r => ({
        'Kontraktuesi': r.kontraktuesi,
        'Nr Kontratës': r.nr_kontrates,
        'Dega': r.dega,
        'Agjenti': r.agjenti,
        'Fillon': r.data_fillimit,
        'Mbaron': r.data_mbarimit,
        'Primi Vjetor': r.primi_vjetor || 0,
        'Dëme Paguar (Nr)': r.deme_nr_paguar || 0,
        'Dëme Paguar (€)': r.deme_vlera_paguar || 0,
        'Dëme Pezull (Nr)': r.deme_nr_pezull || 0,
        'Dëme Pezull (€)': r.deme_vlera_pezull || 0,
        'Dëme Total (€)': r.deme_total_vlera || 0,
        'Shpenzimet': Math.round(r.shpenzimet || 0),
        'Kosto Totale': Math.round(r.kosto_totale || 0),
        'LR%': r.lr_percent ? r.lr_percent.toFixed(1) : '',
        'CR%': r.cr_percent ? r.cr_percent.toFixed(1) : '',
        'Statusi': STATUSET[r.statusi]?.emri || r.statusi,
        'Arsyeja Humbjes': r.humbje_arsyeja || '',
        'Koment Humbjes': r.humbje_koment || ''
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rinovimet');
    XLSX.writeFile(wb, `Rinovimet_${formatMuajLabel(currentMuaj).replace(' ','_')}.xlsx`);
}

// ===== HELPERS =====
function parseDateStr(s) {
    if(!s) return new Date(0); if(s instanceof Date) return s; s=String(s);
    const p=s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if(p) return new Date(parseInt(p[3]),parseInt(p[2])-1,parseInt(p[1]));
    const d=new Date(s); return isNaN(d.getTime())?new Date(0):d;
}
function formatDateShort(s) {
    if(!s) return '—'; const d=parseDateStr(s); if(!d||d.getTime()===0) return '—';
    return String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0');
}
function formatKomentDate(s) {
    if(!s) return ''; const d=parseDateStr(s); if(!d||isNaN(d.getTime())) return '';
    return String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear();
}
function formatMoney(v) { if(v===null||v===undefined||isNaN(v))return '—'; return Math.round(v).toLocaleString('de-DE')+'€'; }
function formatMoneyShort(v) {
    if(!v||isNaN(v)) return '0€';
    if(v>=1000000) return (v/1000000).toFixed(1)+'M€';
    if(v>=1000) return Math.round(v/1000)+'K€';
    return Math.round(v)+'€';
}
function esc(s) { return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):''; }
function infoCell(l,v) { return `<div><div class="rin-info-label">${l}</div><div class="rin-info-value">${esc(v||'—')}</div></div>`; }
function bdi(label,count,value) {
    let d='—';
    if(count!==null&&count!==undefined&&value!==null&&value!==undefined) d=`${count} / ${formatMoney(value)}`;
    else if(value!==null&&value!==undefined&&!isNaN(value)&&value>0) d=formatMoney(value);
    return `<div class="rin-breakdown-item"><span>${label}</span><span>${d}</span></div>`;
}
function ratioBar(label,val,color) {
    const w=Math.min(val||0,150);
    return `<div class="rin-ratio-row"><span class="rin-ratio-label">${label}</span>
        <div class="rin-ratio-track"><div class="rin-ratio-fill" style="width:${w}%;background:${color}"></div></div>
        <span class="rin-ratio-value" style="color:${color}">${val?val.toFixed(1)+'%':'—'}</span></div>`;
}