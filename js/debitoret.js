// ============================================================
// DEBITORET.JS — v1
// ============================================================
const DEB_KEY = 'debitoret_data_v1';
const DEB_IMP_KEY = 'debitoret_imports_v1';

const MUAJT = ['Janar','Shkurt','Mars','Prill','Maj','Qershor','Korrik','Gusht','Shtator','Tetor','Nentor','Dhjetor'];

const STATUSET = {
    i_ri: { emri:'I ri', bar:'#cbd5e1' },
    kontaktuar: { emri:'Kontaktuar', bar:'#fbbf24' },
    premtim_pagese: { emri:'Premtim pagese', bar:'#93c5fd' },
    paguar_total: { emri:'Paguar total', bar:'#4ade80' },
    paguar_pjesshem: { emri:'Paguar pjesshem', bar:'#86efac' },
    kontestuar: { emri:'Kontestuar', bar:'#fca5a5' },
    i_pamundshem: { emri:'I pamundshem', bar:'#f87171' }
};

const COLUMN_MAP = {
    'konto': 'konto',
    'pershkrimi i kontos': 'pershkrimi_kontos',
    'emri i klientit': 'klienti',
    'lloji i polices': 'lloji_polices',
    'pershkrimi i llojit te polices': 'pershkrimi_llojit',
    'numri i dokumentit': 'nr_dokumentit',
    'njesa organizative': 'njesia_organizative',
    'te pamaturuara': 'te_pamaturuara',
    '< 31': 'borxh_0_31',
    '31 - 60': 'borxh_31_60',
    '61 - 90': 'borxh_61_90',
    '91 - 180': 'borxh_91_180',
    '181 - 365': 'borxh_181_365',
    '> 365': 'borxh_mbi_365',
    'debitoret – total': 'debitori_total',
    'debitoret - total': 'debitori_total',
    'gjithsej total': 'gjithsej_total'
};

let debitoret = [];
let filteredList = [];
let currentMuaj = null;
let currentSort = 'borxh';
let currentStatusFilter = 'total';
let currentDega = '';
let currentAgjent = '';
let currentDrawerId = null;
let importParsedData = null;
let pendingStatus = null;

document.addEventListener('DOMContentLoaded', function () {
    lucide.createIcons();
    ngarkoTedhenat();
    populoImportMuajt();
    renderTabs();
    populoChips();
    aplikoFiltrat();
});

function ngarkoTedhenat() {
    try { debitoret = JSON.parse(localStorage.getItem(DEB_KEY) || '[]'); }
    catch { debitoret = []; }
}
function ruajTedhenat() {
    localStorage.setItem(DEB_KEY, JSON.stringify(debitoret));
}
function merrImports() {
    try { return JSON.parse(localStorage.getItem(DEB_IMP_KEY) || '[]'); }
    catch { return []; }
}
function ruajImportMeta(meta) {
    const arr = merrImports();
    arr.push(meta);
    localStorage.setItem(DEB_IMP_KEY, JSON.stringify(arr));
}

function merrUser() {
    try {
        const u = JSON.parse(localStorage.getItem('user_aktual') || localStorage.getItem('currentUser') || '{}');
        return {
            username: u.username || '',
            emri: u.emri || u.emriPlote || u.username || 'System',
            roli: u.role || u.roli || 'staff',
            dega: u.dega || ''
        };
    } catch {
        return { username:'', emri:'System', roli:'superadmin', dega:'' };
    }
}
function filtroSipasRolit(list) {
    const u = merrUser();
    const r = (u.roli || '').toLowerCase();
    if (['superadmin','management','dep_management'].includes(r)) return list;
    const d = (u.dega || '').toLowerCase();
    if (!d) return list;
    return list.filter(x => (x.dega || '').toLowerCase() === d);
}

function getMuajt() {
    const s = new Set();
    debitoret.forEach(r => { if (r.muaji) s.add(r.muaji); });
    return [...s].sort((a,b) => {
        const [ma, ya] = a.split('_');
        const [mb, yb] = b.split('_');
        return (parseInt(ya) - parseInt(yb)) || (muajiIndex(ma) - muajiIndex(mb));
    });
}
function muajiIndex(m) {
    const mm = normalizeMuaj(m);
    return MUAJT.map(x => x.toLowerCase()).indexOf(mm.toLowerCase());
}
function normalizeMuaj(m) {
    if (!m) return '';
    const s = String(m).trim().toLowerCase();
    if (s === 'nentor') return 'Nentor';
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function formatMuajLabel(k) {
    if (!k) return '';
    const [m, y] = k.split('_');
    return `${normalizeMuaj(m)} ${y}`;
}

function renderTabs() {
    const c = document.getElementById('debTabs');
    const muajt = getMuajt();

    if (muajt.length === 0) {
        c.innerHTML = '<span style="padding:7px 18px;font-size:12px;color:#94a3b8">Asnje import ende</span>';
        currentMuaj = null;
        return;
    }

    if (!currentMuaj || !muajt.includes(currentMuaj)) {
        currentMuaj = muajt[muajt.length - 1];
    }

    c.innerHTML = muajt.map(m => {
        const cnt = filtroSipasRolit(debitoret.filter(x => x.muaji === m)).length;
        return `<button class="tab-btn ${m===currentMuaj?'active':''}" onclick="ndryshoMuaj('${m}')">${formatMuajLabel(m)} <span class="tab-count">${cnt}</span></button>`;
    }).join('');
}
function ndryshoMuaj(m) {
    currentMuaj = m;
    currentDega = '';
    currentAgjent = '';
    currentStatusFilter = 'total';
    populoChips();
    renderTabs();
    aplikoFiltrat();
}

function populoChips() {
    const data = filtroSipasRolit(debitoret.filter(r => r.muaji === currentMuaj));
    const degaStats = {};

    data.forEach(r => {
        const d = r.dega || 'Pa dege';
        if (!degaStats[d]) degaStats[d] = { total:0, paguar:0, agjentet:{} };
        degaStats[d].total++;
        if (r.statusi === 'paguar_total') degaStats[d].paguar++;

        const a = r.agjenti || 'Pa agjent';
        if (!degaStats[d].agjentet[a]) degaStats[d].agjentet[a] = { total:0, paguar:0 };
        degaStats[d].agjentet[a].total++;
        if (r.statusi === 'paguar_total') degaStats[d].agjentet[a].paguar++;
    });

    const totalPaguar = data.filter(r => r.statusi === 'paguar_total').length;
    const deget = Object.keys(degaStats).sort();

    let h = `<button class="chip-filter ${currentDega===''?'active':''}" onclick="filtroDega('')">Te gjitha <span class="chip-count">${data.length}/${totalPaguar}✓</span></button>`;
    deget.forEach(d => {
        const s = degaStats[d];
        h += `<button class="chip-filter ${currentDega===d?'active':''}" onclick="filtroDega('${escAttr(d)}')">${esc(d)} <span class="chip-count">${s.total}/${s.paguar}✓</span></button>`;
    });
    document.getElementById('chipsDega').innerHTML = h;

    const agjEl = document.getElementById('chipsAgjent');
    if (currentDega && degaStats[currentDega]) {
        const agj = degaStats[currentDega].agjentet;
        const keys = Object.keys(agj).sort();
        let ah = `<button class="chip-filter ${currentAgjent===''?'active':''}" onclick="filtroAgjent('')" style="margin-left:16px">Te gjithe <span class="chip-count">${degaStats[currentDega].total}/${degaStats[currentDega].paguar}✓</span></button>`;
        keys.forEach(a => {
            const s = agj[a];
            ah += `<button class="chip-filter ${currentAgjent===a?'active':''}" onclick="filtroAgjent('${escAttr(a)}')">${esc(a)} <span class="chip-count">${s.total}/${s.paguar}✓</span></button>`;
        });
        agjEl.innerHTML = ah;
        agjEl.style.display = '';
    } else {
        agjEl.innerHTML = '';
        agjEl.style.display = 'none';
    }
}
function filtroDega(d) {
    currentDega = d;
    currentAgjent = '';
    populoChips();
    aplikoFiltrat();
}
function filtroAgjent(a) {
    currentAgjent = a;
    populoChips();
    aplikoFiltrat();
}
function filtroStatusStrip(s) {
    currentStatusFilter = currentStatusFilter === s ? 'total' : s;
    aplikoFiltrat();
}

function aplikoFiltrat() {
    let data = debitoret.filter(r => r.muaji === currentMuaj);
    data = filtroSipasRolit(data);

    const search = (document.getElementById('debSearch')?.value || '').toLowerCase().trim();
    const balanceFilter = document.getElementById('balanceFilter')?.value || 'all';

    if (currentStatusFilter !== 'total') data = data.filter(r => r.statusi === currentStatusFilter);
    if (currentDega) data = data.filter(r => r.dega === currentDega);
    if (currentAgjent) data = data.filter(r => r.agjenti === currentAgjent);
    if (balanceFilter !== 'all') data = data.filter(r => r.kategori_balance === balanceFilter);
    if (search) data = data.filter(r =>
        (r.klienti || '').toLowerCase().includes(search) ||
        (r.agjenti || '').toLowerCase().includes(search) ||
        (r.dega || '').toLowerCase().includes(search)
    );

    filteredList = data;
    renderTabela();
    perditesoStats();
}

function perditesoStats() {
    const data = filtroSipasRolit(debitoret.filter(r => r.muaji === currentMuaj));
    const counts = {};
    Object.keys(STATUSET).forEach(s => counts[s] = 0);

    let totalBorxh = 0;
    let totalRisk = 0;
    let totalKredit = 0;
    let totalZero = 0;
    let totalPaguar = 0;

    data.forEach(r => {
        if (counts[r.statusi] !== undefined) counts[r.statusi]++;
        totalBorxh += Number(r.debitori_total || 0);
        totalRisk += Number(r.borxh_mbi_365 || 0);
        if (r.kategori_balance === 'kredit') totalKredit++;
        if (r.kategori_balance === 'zero') totalZero++;
        totalPaguar += Number(r.shuma_paguar || 0);
    });

    const total = data.length;
    const ms = (k) => `cursor:pointer;${currentStatusFilter===k?'opacity:1;border-bottom:2px solid #fff;padding-bottom:14px':'opacity:.72'}`;

    document.getElementById('stripMetrics').innerHTML = `
        <div class="strip-metric" style="${ms('total')}" onclick="filtroStatusStrip('total')"><div class="sm-num">${total}</div><div class="sm-lbl">Total</div></div>
        <div class="strip-metric s-i_ri" style="${ms('i_ri')}" onclick="filtroStatusStrip('i_ri')"><div class="sm-num">${counts.i_ri}</div><div class="sm-lbl">I ri</div></div>
        <div class="strip-metric s-kontaktuar" style="${ms('kontaktuar')}" onclick="filtroStatusStrip('kontaktuar')"><div class="sm-num">${counts.kontaktuar}</div><div class="sm-lbl">Kontaktuar</div></div>
        <div class="strip-metric s-premtim_pagese" style="${ms('premtim_pagese')}" onclick="filtroStatusStrip('premtim_pagese')"><div class="sm-num">${counts.premtim_pagese}</div><div class="sm-lbl">Premtim</div></div>
        <div class="strip-metric s-paguar_total" style="${ms('paguar_total')}" onclick="filtroStatusStrip('paguar_total')"><div class="sm-num">${counts.paguar_total}</div><div class="sm-lbl">Paguar total</div></div>
        <div class="strip-metric s-paguar_pjesshem" style="${ms('paguar_pjesshem')}" onclick="filtroStatusStrip('paguar_pjesshem')"><div class="sm-num">${counts.paguar_pjesshem}</div><div class="sm-lbl">Pjesshem</div></div>
    `;

    document.getElementById('stripChips').innerHTML = `
        <div class="strip-chip">Borxhi <span class="sc-num">${formatMoneyShort(totalBorxh)}</span></div>
        <div class="strip-chip">&gt;365 <span class="sc-num">${formatMoneyShort(totalRisk)}</span></div>
        <div class="strip-chip">Paguar <span class="sc-num">${formatMoneyShort(totalPaguar)}</span></div>
        <div class="strip-chip">Kredit <span class="sc-num">${totalKredit}</span></div>
        <div class="strip-chip">Zero <span class="sc-num">${totalZero}</span></div>
    `;

    if (total > 0) {
        const items = ['i_ri','kontaktuar','premtim_pagese','paguar_total','paguar_pjesshem','kontestuar','i_pamundshem'];
        document.getElementById('stripBar').innerHTML = items.map(k => {
            const p = ((counts[k] || 0) / total * 100).toFixed(1);
            return `<div class="strip-bar-seg" style="width:${p}%;background:${STATUSET[k].bar}"></div>`;
        }).join('');

        document.getElementById('stripLegend').innerHTML = items.map(k => `
            <span><span class="sl-dot" style="background:${STATUSET[k].bar}"></span>${STATUSET[k].emri} ${counts[k] || 0}</span>
        `).join('');
    } else {
        document.getElementById('stripBar').innerHTML = '<div class="strip-bar-seg" style="width:100%;background:rgba(255,255,255,.1)"></div>';
        document.getElementById('stripLegend').innerHTML = '';
    }
}

function ndryshoSort(t) {
    currentSort = t;
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('sort-' + t)?.classList.add('active');
    renderTabela();
}
function sortoListen(list) {
    return [...list].sort((a,b) => {
        if (currentSort === 'borxh') return (Number(b.debitori_total)||0) - (Number(a.debitori_total)||0);
        if (currentSort === 'risk') return (Number(b.borxh_mbi_365)||0) - (Number(a.borxh_mbi_365)||0);
        if (currentSort === 'klienti') return (a.klienti || '').localeCompare(b.klienti || '', 'sq');
        return 0;
    });
}

function renderTabela() {
    const tbody = document.getElementById('debTableBody');

    if (!currentMuaj || debitoret.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="deb-empty"><div class="deb-empty-icon">📋</div><div class="deb-empty-title">Asnje debitor ende</div><div class="deb-empty-sub">Kliko "Importo" per te ngarkuar raportin e debitoreve</div></div></td></tr>`;
        return;
    }
    if (filteredList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="deb-no-results">Asnje rezultat me keto filtra</div></td></tr>`;
        return;
    }

    const sorted = sortoListen(filteredList);
    let html = '';

    sorted.forEach(r => {
        const total = Number(r.debitori_total || 0);
        const risk = Number(r.borxh_mbi_365 || 0);
        const riskClass = risk > 0 ? 'deb-risk-high' : Number(r.borxh_91_180 || 0) > 0 ? 'deb-risk-mid' : 'deb-risk-low';
        const rowBg = risk > 0 ? 'background:rgba(254,202,202,.16);' : '';

        html += `
            <tr onclick="hapDrawer('${r.id}')" style="cursor:pointer;${rowBg}">
                <td>
                    <div class="klient-name">${esc(r.klienti)} ${risk > 0 ? '<span style="font-size:10px;color:#ef4444;font-weight:700">⚠</span>' : ''}</div>
                    <div class="klient-sub">${esc(r.dega)} · ${esc(r.agjenti)}</div>
                </td>
                <td class="deb-borxh" style="text-align:right">${formatMoney(total)}</td>
                <td style="text-align:right">${formatMoney(Number(r.borxh_0_31 || 0))}</td>
                <td style="text-align:right">${formatMoney(Number(r.borxh_31_60 || 0))}</td>
                <td style="text-align:right">${formatMoney(Number(r.borxh_61_90 || 0))}</td>
                <td style="text-align:right" class="${riskClass}">${formatMoney(risk)}</td>
                <td><span class="deb-badge deb-badge-${r.statusi}">${STATUSET[r.statusi]?.emri || r.statusi}</span></td>
                <td>${labelBalance(r.kategori_balance)}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function hapDrawer(id) {
    const r = debitoret.find(x => x.id === id);
    if (!r) return;
    currentDrawerId = id;

    document.getElementById('drKlienti').textContent = r.klienti || 'Klienti';
    document.getElementById('drSubtitle').textContent = `${r.dega || 'Pa dege'} · ${r.agjenti || 'Pa agjent'} · ${formatMuajLabel(r.muaji)}`;

    renderStatusPills(r.statusi);

    document.getElementById('drSummaryGrid').innerHTML = `
        <div class="deb-card"><div class="deb-card-label">Borxhi total</div><div class="deb-card-value">${formatMoney(r.debitori_total || 0)}</div></div>
        <div class="deb-card"><div class="deb-card-label">Balanca</div><div class="deb-card-value">${labelBalance(r.kategori_balance)}</div></div>
        <div class="deb-card"><div class="deb-card-label">Dokumenti</div><div class="deb-card-value">${esc(r.nr_dokumentit || '—')}</div></div>
        <div class="deb-card small"><div class="deb-card-label">Konto</div><div class="deb-card-value">${esc(r.konto || '—')}</div></div>
        <div class="deb-card small"><div class="deb-card-label">Lloji</div><div class="deb-card-value">${esc(r.pershkrimi_llojit || '—')}</div></div>
        <div class="deb-card small"><div class="deb-card-label">Njësia</div><div class="deb-card-value">${esc(r.njesia_organizative || '—')}</div></div>
    `;

    document.getElementById('drAgingGrid').innerHTML = `
        <div class="deb-card small"><div class="deb-card-label">Te pamaturuara</div><div class="deb-card-value">${formatMoney(r.te_pamaturuara || 0)}</div></div>
        <div class="deb-card small"><div class="deb-card-label">0 - 31</div><div class="deb-card-value">${formatMoney(r.borxh_0_31 || 0)}</div></div>
        <div class="deb-card small"><div class="deb-card-label">31 - 60</div><div class="deb-card-value">${formatMoney(r.borxh_31_60 || 0)}</div></div>
        <div class="deb-card small"><div class="deb-card-label">61 - 90</div><div class="deb-card-value">${formatMoney(r.borxh_61_90 || 0)}</div></div>
        <div class="deb-card small"><div class="deb-card-label">91 - 180</div><div class="deb-card-value">${formatMoney(r.borxh_91_180 || 0)}</div></div>
        <div class="deb-card small"><div class="deb-card-label">181 - 365</div><div class="deb-card-value">${formatMoney(r.borxh_181_365 || 0)}</div></div>
        <div class="deb-card small"><div class="deb-card-label">Mbi 365</div><div class="deb-card-value" style="color:${Number(r.borxh_mbi_365 || 0) > 0 ? '#ef4444' : '#1a2332'}">${formatMoney(r.borxh_mbi_365 || 0)}</div></div>
    `;

    const info = r.status_last_action
        ? `${STATUSET[r.statusi]?.emri || r.statusi} · ${r.status_last_action.data || '—'} · ${r.status_last_action.koment || 'Pa koment'}`
        : 'Asnje veprim ende.';
    document.getElementById('drStatusInfo').textContent = info;

    renderKomentet(r);

    document.getElementById('debOverlay').classList.add('open');
    document.getElementById('debDrawer').classList.add('open');
    document.body.style.overflow = 'hidden';
}
function mbyllDrawer() {
    document.getElementById('debDrawer').classList.remove('open');
    if (!document.getElementById('reportDrawer').classList.contains('open')) {
        document.getElementById('debOverlay').classList.remove('open');
        document.body.style.overflow = '';
    }
    currentDrawerId = null;
}
function mbyllGjithcka() {
    mbyllDrawer();
    mbyllReportDrawer();
    mbyllImportModal();
    mbyllStatusModal();
}

function renderStatusPills(current) {
    let h = '<label>Statusi:</label>';
    Object.keys(STATUSET).forEach(k => {
        h += `<span class="deb-status-pill deb-sp-${k} ${k===current?'selected':''}" onclick="hapStatusModal('${k}')">${STATUSET[k].emri}</span>`;
    });
    document.getElementById('drStatusRow').innerHTML = h;
}

function hapStatusModal(statusKey) {
    if (!currentDrawerId) return;
    pendingStatus = statusKey;

    document.getElementById('statusModalTitle').textContent = `Ndrysho statusin: ${STATUSET[statusKey].emri}`;

    let fields = '';
    if (statusKey === 'premtim_pagese') {
        fields = `
            <div class="deb-form-grid">
                <div class="deb-form-group">
                    <label>Data e premtuar</label>
                    <input type="date" id="statusDate">
                </div>
                <div class="deb-form-group">
                    <label>Shuma e premtuar (€)</label>
                    <input type="number" step="0.01" id="statusAmount" placeholder="0.00">
                </div>
            </div>
        `;
    }
    if (statusKey === 'paguar_total' || statusKey === 'paguar_pjesshem') {
        fields = `
            <div class="deb-form-grid">
                <div class="deb-form-group">
                    <label>Data e pageses</label>
                    <input type="date" id="statusDate">
                </div>
                <div class="deb-form-group">
                    <label>Shuma e paguar (€)</label>
                    <input type="number" step="0.01" id="statusAmount" placeholder="0.00">
                </div>
            </div>
        `;
    }

    fields += `
        <div class="deb-form-group">
            <label>Komenti (i detyrueshem)</label>
            <textarea id="statusComment" placeholder="Shkruaj koment per kete status..."></textarea>
        </div>
    `;

    document.getElementById('statusDynamicFields').innerHTML = fields;
    document.getElementById('statusModal').classList.add('open');
}
function mbyllStatusModal() {
    document.getElementById('statusModal').classList.remove('open');
    pendingStatus = null;
}

function ruajStatusin() {
    if (!currentDrawerId || !pendingStatus) return;
    const rec = debitoret.find(x => x.id === currentDrawerId);
    if (!rec) return;

    const koment = (document.getElementById('statusComment')?.value || '').trim();
    if (!koment) {
        alert('Komenti eshte i detyrueshem per cdo status.');
        return;
    }

    const data = document.getElementById('statusDate')?.value || '';
    const shuma = Number(document.getElementById('statusAmount')?.value || 0);

    if (pendingStatus === 'premtim_pagese' && !data) {
        alert('Te "Premtim pagese" duhet data.');
        return;
    }
    if ((pendingStatus === 'paguar_total' || pendingStatus === 'paguar_pjesshem') && (!data || !shuma)) {
        alert('Te statuset e pageses duhet data dhe shuma.');
        return;
    }

    const old = rec.statusi;
    rec.statusi = pendingStatus;
    rec.updated_at = new Date().toISOString();
    rec.status_last_action = {
        statusi: pendingStatus,
        data: data || formatDateISO(new Date()),
        shuma: shuma || null,
        koment
    };

    if (pendingStatus === 'paguar_total' || pendingStatus === 'paguar_pjesshem') {
        rec.shuma_paguar = shuma;
        rec.data_pageses = data || null;
    }
    if (pendingStatus === 'premtim_pagese') {
        rec.shuma_premtuar = shuma;
        rec.data_premtuar = data || null;
    }

    rec.komente = rec.komente || [];
    rec.komente.unshift({
        teksti: `Statusi: ${STATUSET[old]?.emri || old} → ${STATUSET[pendingStatus].emri}. ${koment}${shuma ? ` | Shuma: ${formatMoney(shuma)}` : ''}${data ? ` | Data: ${data}` : ''}`,
        autori: merrUser().emri,
        data: new Date().toISOString(),
        tipi: 'sistem'
    });

    ruajTedhenat();
    mbyllStatusModal();
    hapDrawer(rec.id);
    aplikoFiltrat();
}

function renderKomentet(r) {
    const el = document.getElementById('drComments');
    const arr = r.komente || [];
    if (arr.length === 0) {
        el.innerHTML = '<div style="font-size:12px;color:#94a3b8">Asnje koment ende.</div>';
        return;
    }
    el.innerHTML = arr.map(k => `
        <div class="deb-comment ${k.tipi==='sistem'?'sistem':''}">
            <div class="deb-comment-header">
                <span class="deb-comment-author">${esc(k.autori || 'System')}</span>
                <span class="deb-comment-date">${formatKomentDate(k.data)}</span>
            </div>
            <p class="deb-comment-text">${esc(k.teksti || '')}</p>
        </div>
    `).join('');
}
function shtoKoment() {
    if (!currentDrawerId) return;
    const input = document.getElementById('debCommentInput');
    const txt = (input.value || '').trim();
    if (!txt) return;

    const rec = debitoret.find(x => x.id === currentDrawerId);
    if (!rec) return;

    rec.komente = rec.komente || [];
    rec.komente.unshift({
        teksti: txt,
        autori: merrUser().emri,
        data: new Date().toISOString(),
        tipi: 'manual'
    });

    ruajTedhenat();
    input.value = '';
    renderKomentet(rec);
}

function hapImportModal() {
    document.getElementById('debImportModal').classList.add('open');
    document.getElementById('importStep1').style.display = '';
    document.getElementById('importStep2').style.display = 'none';
    document.getElementById('importConfirmBtn').style.display = 'none';
    importParsedData = null;
}
function mbyllImportModal() {
    document.getElementById('debImportModal').classList.remove('open');
    importParsedData = null;
}
function populoImportMuajt() {
    const sel = document.getElementById('importMuaji');
    if (!sel) return;
    const now = new Date();
    let h = '';
    for (let i = -1; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const muaji = normalizeMuaj(MUAJT[d.getMonth()]);
        const value = `${muaji.toLowerCase()}_${d.getFullYear()}`;
        h += `<option value="${value}" ${i===0?'selected':''}>${muaji} ${d.getFullYear()}</option>`;
    }
    sel.innerHTML = h;
}
function handleDrop(e) {
    e.preventDefault();
    document.getElementById('uploadZone').classList.remove('dragover');
    const file = e.dataTransfer.files?.[0];
    if (file) parseExcel(file);
}
function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) parseExcel(file);
}

function parseExcel(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type:'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });

        const parsed = parseDebitoreRows(rows);
        if (!parsed.length) {
            alert('Nuk u gjeten rreshta te vlefshem ne Excel.');
            return;
        }

        importParsedData = {
            fileName: file.name,
            rows: parsed,
            muaji: document.getElementById('importMuaji').value
        };

        showImportPreview();
    };
    reader.readAsArrayBuffer(file);
}

function parseDebitoreRows(rows) {
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
        const row = rows[i].map(x => normalizeHeader(x));
        if (row.includes('konto') && row.includes('emri i klientit') && row.includes('gjithsej total')) {
            headerRowIndex = i;
            break;
        }
    }
    if (headerRowIndex === -1) return [];

    const header = rows[headerRowIndex].map(x => normalizeHeader(x));
    const dataRows = rows.slice(headerRowIndex + 1);

    return dataRows
        .filter(r => (r || []).some(x => String(x || '').trim() !== ''))
        .map(r => rowToRecord(header, r))
        .filter(Boolean);
}

function rowToRecord(header, row) {
    const mapped = {};
    header.forEach((h, i) => {
        const field = COLUMN_MAP[h];
        if (field) mapped[field] = row[i];
    });

    const klienti = cleanClientName(mapped.klienti || '');
    if (!klienti) return null;

    const muaji = document.getElementById('importMuaji').value;
    const njesia = String(mapped.njesia_organizative || '').trim();
    const dega = deriveDega(njesia);
    const agjenti = deriveAgjenti(njesia);

    const rec = {
        id: uid(),
        muaji,
        konto: String(mapped.konto || '').trim(),
        pershkrimi_kontos: String(mapped.pershkrimi_kontos || '').trim(),
        klienti,
        klienti_normalized: normalizeText(klienti),
        lloji_polices: String(mapped.lloji_polices || '').trim(),
        pershkrimi_llojit: String(mapped.pershkrimi_llojit || '').trim(),
        nr_dokumentit: String(mapped.nr_dokumentit || '').trim(),
        njesia_organizative: njesia,
        dega,
        agjenti,

        te_pamaturuara: num(mapped.te_pamaturuara),
        borxh_0_31: num(mapped.borxh_0_31),
        borxh_31_60: num(mapped.borxh_31_60),
        borxh_61_90: num(mapped.borxh_61_90),
        borxh_91_180: num(mapped.borxh_91_180),
        borxh_181_365: num(mapped.borxh_181_365),
        borxh_mbi_365: num(mapped.borxh_mbi_365),
        debitori_total: num(mapped.debitori_total),
        gjithsej_total: num(mapped.gjithsej_total),

        kategori_balance: 'debitor',
        statusi: 'i_ri',
        komente: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    if (rec.debitori_total < 0) rec.kategori_balance = 'kredit';
    else if (rec.debitori_total === 0) rec.kategori_balance = 'zero';

    return rec;
}

function showImportPreview() {
    const step1 = document.getElementById('importStep1');
    const step2 = document.getElementById('importStep2');
    const btn = document.getElementById('importConfirmBtn');

    step1.style.display = 'none';
    step2.style.display = '';
    btn.style.display = '';

    const rows = importParsedData.rows;
    const total = rows.length;
    const deb = rows.filter(x => x.kategori_balance === 'debitor').length;
    const kred = rows.filter(x => x.kategori_balance === 'kredit').length;
    const zero = rows.filter(x => x.kategori_balance === 'zero').length;
    const risk = rows.filter(x => Number(x.borxh_mbi_365 || 0) > 0).length;

    document.getElementById('importStep2').innerHTML = `
        <div class="deb-file-info">
            <div>📄</div>
            <div>
                <div style="font-size:13px;font-weight:500;color:#1a2332">${esc(importParsedData.fileName)}</div>
                <div style="font-size:11px;color:#94a3b8">${formatMuajLabel(importParsedData.muaji)}</div>
            </div>
        </div>

        <div class="deb-info-note" style="margin-bottom:14px;">
            Total rreshta: <strong>${total}</strong> |
            Debitorë: <strong>${deb}</strong> |
            Kredit: <strong>${kred}</strong> |
            Zero: <strong>${zero}</strong> |
            Me >365 ditë: <strong>${risk}</strong>
        </div>

        <div class="deb-preview-wrap">
            <table class="deb-preview-table">
                <thead>
                    <tr>
                        <th>Klienti</th>
                        <th>Njësia</th>
                        <th style="text-align:right">Borxhi</th>
                        <th style="text-align:right">&gt;365</th>
                        <th>Balanca</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.slice(0, 12).map(r => `
                        <tr>
                            <td>${esc(r.klienti)}</td>
                            <td>${esc(r.njesia_organizative || '—')}</td>
                            <td style="text-align:right">${formatMoney(r.debitori_total || 0)}</td>
                            <td style="text-align:right">${formatMoney(r.borxh_mbi_365 || 0)}</td>
                            <td>${labelBalance(r.kategori_balance)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function konfirmoImportin() {
    if (!importParsedData) return;

    const muaji = importParsedData.muaji;
    debitoret = debitoret.filter(x => x.muaji !== muaji).concat(importParsedData.rows);

    ruajTedhenat();
    ruajImportMeta({
        muaji,
        fileName: importParsedData.fileName,
        rows: importParsedData.rows.length,
        importedAt: new Date().toISOString()
    });

    currentMuaj = muaji;
    mbyllImportModal();
    renderTabs();
    populoChips();
    aplikoFiltrat();
}

function hapReportDrawer() {
    const data = filtroSipasRolit(debitoret.filter(x => x.muaji === currentMuaj));

    let totalBorxh = 0, totalRisk = 0, totalPaguar = 0;
    const counts = {};
    Object.keys(STATUSET).forEach(s => counts[s] = 0);
    const dege = {};

    data.forEach(r => {
        totalBorxh += Number(r.debitori_total || 0);
        totalRisk += Number(r.borxh_mbi_365 || 0);
        totalPaguar += Number(r.shuma_paguar || 0);
        counts[r.statusi] = (counts[r.statusi] || 0) + 1;

        const d = r.dega || 'Pa dege';
        if (!dege[d]) dege[d] = { total:0, borxh:0, risk:0 };
        dege[d].total++;
        dege[d].borxh += Number(r.debitori_total || 0);
        dege[d].risk += Number(r.borxh_mbi_365 || 0);
    });

    const html = `
        <div class="deb-report-section">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div class="deb-card"><div class="deb-card-label">Borxhi total</div><div class="deb-card-value">${formatMoney(totalBorxh)}</div></div>
                <div class="deb-card"><div class="deb-card-label">Mbi 365</div><div class="deb-card-value" style="color:${totalRisk>0?'#ef4444':'#1a2332'}">${formatMoney(totalRisk)}</div></div>
                <div class="deb-card small"><div class="deb-card-label">Paguar</div><div class="deb-card-value">${formatMoney(totalPaguar)}</div></div>
                <div class="deb-card small"><div class="deb-card-label">Total klientë</div><div class="deb-card-value">${data.length}</div></div>
            </div>
        </div>

        <div class="deb-report-section">
            <div class="deb-section-title">Statuset</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${Object.keys(STATUSET).map(k => `<span class="deb-badge deb-badge-${k}">${STATUSET[k].emri} ${counts[k] || 0}</span>`).join('')}
            </div>
        </div>

        <div class="deb-report-section">
            <div class="deb-section-title">Sipas degëve</div>
            <table class="deb-report-table">
                <thead>
                    <tr>
                        <th>Dega</th>
                        <th class="right">Klientë</th>
                        <th class="right">Borxhi</th>
                        <th class="right">&gt;365</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.keys(dege).sort().map(d => `
                        <tr>
                            <td>${esc(d)}</td>
                            <td class="right">${dege[d].total}</td>
                            <td class="right">${formatMoney(dege[d].borxh)}</td>
                            <td class="right" style="color:${dege[d].risk>0?'#ef4444':'#334155'}">${formatMoney(dege[d].risk)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('reportContent').innerHTML = html;
    document.getElementById('debOverlay').classList.add('open');
    document.getElementById('reportDrawer').classList.add('open');
    document.body.style.overflow = 'hidden';
}
function mbyllReportDrawer() {
    document.getElementById('reportDrawer').classList.remove('open');
    if (!document.getElementById('debDrawer').classList.contains('open')) {
        document.getElementById('debOverlay').classList.remove('open');
        document.body.style.overflow = '';
    }
}

function eksportoExcel() {
    const data = sortoListen(filteredList).map(r => ({
        Muaji: formatMuajLabel(r.muaji),
        Klienti: r.klienti,
        Dega: r.dega,
        Agjenti: r.agjenti,
        'Te pamaturuara': r.te_pamaturuara,
        '0-31': r.borxh_0_31,
        '31-60': r.borxh_31_60,
        '61-90': r.borxh_61_90,
        '91-180': r.borxh_91_180,
        '181-365': r.borxh_181_365,
        '>365': r.borxh_mbi_365,
        'Borxhi total': r.debitori_total,
        Balanca: labelBalance(r.kategori_balance),
        Statusi: STATUSET[r.statusi]?.emri || r.statusi,
        'Shuma paguar': r.shuma_paguar || '',
        'Data pageses': r.data_pageses || '',
        'Komenti fundit': r.status_last_action?.koment || ''
    }));

    if (!data.length) {
        alert('Nuk ka te dhena per eksport.');
        return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Debitoret');
    XLSX.writeFile(wb, `debitoret_${currentMuaj || 'eksport'}.xlsx`);
}

// ===== helpers =====
function normalizeHeader(v) {
    return String(v || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[–—]/g, '-');
}
function normalizeText(v) {
    return String(v || '')
        .toLowerCase()
        .replace(/"/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
function cleanClientName(v) {
    return String(v || '').replace(/\s+/g, ' ').replace(/"/g, '').trim();
}
function deriveDega(njesia) {
    const s = String(njesia || '').trim();
    if (!s) return 'Pa dege';
    if (/^dega\s/i.test(s)) return s;
    if (/sigal/i.test(s)) return 'Drejtoria Qendrore';
    if (/njesia/i.test(s)) return s;
    return 'Agjentë individualë';
}
function deriveAgjenti(njesia) {
    const s = String(njesia || '').trim();
    if (!s) return 'Pa agjent';
    if (/^dega\s/i.test(s)) return s;
    if (/sigal/i.test(s)) return 'SIGAL Insurance Group';
    return s;
}
function num(v) {
    if (v === null || v === undefined || v === '') return 0;
    const n = Number(String(v).replace(/,/g, ''));
    return isNaN(n) ? 0 : n;
}
function uid() {
    return 'deb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}
function labelBalance(v) {
    if (v === 'debitor') return 'Debitor';
    if (v === 'kredit') return 'Kredit';
    if (v === 'zero') return 'Zero';
    return '—';
}
function esc(v) {
    return String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function escAttr(v) {
    return String(v ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
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
function formatKomentDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString('sq-AL', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function formatDateISO(d) {
    const dt = new Date(d);
    return dt.toISOString().slice(0,10);
}