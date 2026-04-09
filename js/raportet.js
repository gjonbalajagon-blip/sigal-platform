// ============================================================
// RAPORTET.JS — Moduli i raporteve
// ============================================================

const MUAJT_REP = ['janar','shkurt','mars','prill','maj','qershor','korrik','gusht','shtator','tetor','nentor','dhjetor'];
const MUAJT_LABEL = ['Janar','Shkurt','Mars','Prill','Maj','Qershor','Korrik','Gusht','Shtator','Tetor','Nentor','Dhjetor'];

const MODULET = [
    { key:'hub', label:'Hub', icon:'home' },
    { key:'oferta', label:'Oferta', icon:'clipboard-list' },
    { key:'kontratat', label:'Kontratat', icon:'file-text' },
    { key:'faturimi', label:'Faturimi', icon:'receipt' },
    { key:'rinovimet', label:'Rinovimet', icon:'refresh-cw' },
    { key:'debitoret', label:'Debitorët', icon:'wallet' },
    { key:'detyrat', label:'Detyrat', icon:'check-circle' },
    { key:'stafi', label:'Stafi', icon:'users' },
    { key:'produkti', label:'Produkti', icon:'package' }
];

const SUBTABS_DEB = [
    { key:'permbledhje', label:'Përmbledhje' },
    { key:'krahasim', label:'Krahasim mujor' },
    { key:'deget', label:'Sipas degëve' },
    { key:'agjentet', label:'Sipas agjentëve' },
    { key:'trend', label:'Trend vjetor' }
];

const SUBTABS_RIN = [
    { key:'permbledhje', label:'Përmbledhje' },
    { key:'krahasim', label:'Krahasim mujor' },
    { key:'deget', label:'Sipas degëve' },
    { key:'agjentet', label:'Sipas agjentëve' },
    { key:'performanca', label:'Performanca (LR/CR)' }
];

let currentModule = 'hub';
let currentDebSubtab = 'permbledhje';
let currentRinSubtab = 'permbledhje';

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    renderModulesRow();
    renderHub();
    initFilters();
    renderSubtabsDeb();
    renderSubtabsRin();

    // Lexo query string ?modul=debitoret
    const params = new URLSearchParams(window.location.search);
    const mod = params.get('modul');
    if (mod && MODULET.find(m => m.key === mod)) {
        switchModule(mod);
    }
});

// ============================================================
// USER & ROLE FILTERING
// ============================================================
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
    return ['superadmin','management','dep_management','admin'].includes(r);
}

function filtroSipasRolit(list, opts = {}) {
    if (eshteMenaxher()) return list;
    const u = merrUser();
    const fieldDega = opts.dega || 'dega';
    const fieldAgjent = opts.agjenti || 'agjenti';

    return list.filter(x => {
        const xd = (x[fieldDega] || '').toLowerCase();
        const xa = (x[fieldAgjent] || '').toLowerCase();
        if (u.dega && xd === u.dega.toLowerCase()) return true;
        if (u.agjenti && xa === u.agjenti.toLowerCase()) return true;
        return false;
    });
}

// ============================================================
// MODULES ROW (TAB ROW 1)
// ============================================================
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

    // Update URL pa reload
    const url = new URL(window.location);
    if (key === 'hub') url.searchParams.delete('modul');
    else url.searchParams.set('modul', key);
    window.history.replaceState({}, '', url);

    // Render përmbajtjen
    if (key === 'hub') renderHub();
    if (key === 'debitoret') renderRaportiDebitoret();
    if (key === 'rinovimet') renderRaportiRinovimet();
}

// ============================================================
// HUB
// ============================================================
function renderHub() {
    const grid = document.getElementById('repHubGrid');
    const cards = [
        buildHubCardOferta(),
        buildHubCardKontratat(),
        buildHubCardFaturimi(),
        buildHubCardRinovimet(),
        buildHubCardDebitoret(),
        buildHubCardDetyrat(),
        buildHubCardStafi(),
        buildHubCardProdukti()
    ];
    grid.innerHTML = cards.join('');
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

function buildHubCardOferta() {
    let data = [];
    try { data = JSON.parse(localStorage.getItem('ofertat') || '[]'); } catch {}
    const total = data.length;
    const konfirmuar = data.filter(o => o.statusi === 'konfirmuar' || o.statusi === 'realizuar').length;
    const realizuar = data.filter(o => o.statusi === 'realizuar').length;
    const presin = data.filter(o => o.statusi === 'presin' || o.statusi === 'aktive').length;

    return buildHubCard({
        key:'oferta', icon:'clipboard-list', iconClass:'ric-oferta',
        title:'Oferta', sub:'Menaxhimi i ofertave',
        metrics:[
            { label:'Total', value:total },
            { label:'Realizuar', value:realizuar, color:'green' },
            { label:'Konfirmuar', value:konfirmuar, color:'blue' },
            { label:'Presin', value:presin, color:'amber' }
        ],
        status:'Së shpejti'
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
        title:'Kontratat', sub:'Të gjitha kontratat aktive',
        metrics:[
            { label:'Total', value:total },
            { label:'Aktive', value:aktive, color:'green' },
            { label:'Skaduar', value:skaduar, color:'red' },
            { label:'Biznes', value:llojet.biznes, color:'blue' }
        ],
        status:'Së shpejti'
    });
}

function buildHubCardFaturimi() {
    let data = [];
    try { data = JSON.parse(localStorage.getItem('faturimi_klientet') || '[]'); } catch {}
    const total = data.length;
    const leshuar = data.filter(f => f.statusi === 'leshuar').length;
    const proces = data.filter(f => f.statusi === 'ne_proces').length;

    return buildHubCard({
        key:'faturimi', icon:'receipt', iconClass:'ric-faturimi',
        title:'Faturimi', sub:'Faturat dhe pagesat',
        metrics:[
            { label:'Total', value:total },
            { label:'Lëshuar', value:leshuar, color:'green' },
            { label:'Në proces', value:proces, color:'amber' },
            { label:'Pa veprim', value:total - leshuar - proces }
        ],
        status:'Së shpejti'
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
            { label:'Primi total', value:formatMoneyShort(primi), color:'blue' }
        ],
        status:'I disponueshëm'
    });
}

function buildHubCardDebitoret() {
    let data = [];
    try { data = JSON.parse(localStorage.getItem('debitoret_data_v1') || '[]'); } catch {}
    data = filtroSipasRolit(data);

    const total = data.length;
    const totalBorxh = data.reduce((s,r) => s + Number(r.debitori_total || 0), 0);
    const risk = data.reduce((s,r) => s + Number(r.borxh_mbi_365 || 0), 0);
    const paguar = data.filter(r => r.statusi === 'paguar_total').length;

    return buildHubCard({
        key:'debitoret', icon:'wallet', iconClass:'ric-debitoret',
        title:'Debitorët', sub:'Borxhet dhe pagesat',
        metrics:[
            { label:'Klientë', value:total },
            { label:'Borxhi', value:formatMoneyShort(totalBorxh), color:'red' },
            { label:'Mbi 365 ditë', value:formatMoneyShort(risk), color:'red' },
            { label:'Paguar', value:paguar, color:'green' }
        ],
        status:'I disponueshëm'
    });
}

function buildHubCardDetyrat() {
    return buildHubCard({
        key:'detyrat', icon:'check-circle', iconClass:'ric-detyrat',
        title:'Detyrat', sub:'Follow-ups dhe aktivitete',
        metrics:[
            { label:'Aktive', value:'—' },
            { label:'Përfunduar', value:'—' },
            { label:'Vonuar', value:'—' },
            { label:'Sot', value:'—' }
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
            { label:'Total', value:data.length || '—' },
            { label:'Aktivë', value:'—' },
            { label:'Degë', value:'—' },
            { label:'Top performer', value:'—' }
        ],
        status:'Së shpejti'
    });
}

function buildHubCardProdukti() {
    return buildHubCard({
        key:'produkti', icon:'package', iconClass:'ric-produkti',
        title:'Produkti', sub:'Importohet nga sistemi i shitjeve',
        metrics:[
            { label:'Kontrata', value:'—' },
            { label:'Të siguruar', value:'—' },
            { label:'Pako top', value:'—' },
            { label:'Vlera', value:'—' }
        ],
        status:'Importohet me Excel'
    });
}

// ============================================================
// FILTRAT (Viti / Muaji)
// ============================================================
function initFilters() {
    const tani = new Date();
    const aktualVit = tani.getFullYear();
    const aktualMuaj = MUAJT_REP[tani.getMonth()];

    // Vitet nga të dhënat e debitoreve dhe rinovimeve
    const vitet = new Set();
    try {
        const deb = JSON.parse(localStorage.getItem('debitoret_data_v1') || '[]');
        deb.forEach(r => { if (r.muaji) { const y = r.muaji.split('_')[1]; if (y) vitet.add(y); } });
    } catch {}
    try {
        const rin = JSON.parse(localStorage.getItem('rinovimet_data') || '[]');
        rin.forEach(r => { if (r.muaji) { const y = r.muaji.split('_')[1]; if (y) vitet.add(y); } });
    } catch {}
    vitet.add(String(aktualVit));
    const vitArr = [...vitet].sort().reverse();

    const vitOptions = vitArr.map(v => `<option value="${v}">${v}</option>`).join('');
    const muajOptions = '<option value="total">Total viti</option>' +
        MUAJT_REP.map((m,i) => `<option value="${m}">${MUAJT_LABEL[i]}</option>`).join('');

    ['repDebViti','repRinViti'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) { sel.innerHTML = vitOptions; sel.value = String(aktualVit); }
    });
    ['repDebMuaji','repRinMuaji'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) { sel.innerHTML = muajOptions; sel.value = aktualMuaj; }
    });
}

// ============================================================
// SUBTABS
// ============================================================
function renderSubtabsDeb() {
    document.getElementById('repDebSubtabs').innerHTML = SUBTABS_DEB.map(t =>
        `<button class="rep-subtab ${t.key === currentDebSubtab ? 'active' : ''}" onclick="switchDebSubtab('${t.key}')">${t.label}</button>`
    ).join('');
}
function switchDebSubtab(key) {
    currentDebSubtab = key;
    renderSubtabsDeb();
    renderRaportiDebitoret();
}

function renderSubtabsRin() {
    document.getElementById('repRinSubtabs').innerHTML = SUBTABS_RIN.map(t =>
        `<button class="rep-subtab ${t.key === currentRinSubtab ? 'active' : ''}" onclick="switchRinSubtab('${t.key}')">${t.label}</button>`
    ).join('');
}
function switchRinSubtab(key) {
    currentRinSubtab = key;
    renderSubtabsRin();
    renderRaportiRinovimet();
}

// ============================================================
// RAPORTI DEBITORET
// ============================================================
function renderRaportiDebitoret() {
    const container = document.getElementById('repDebContent');
    if (!container) return;

    const viti = document.getElementById('repDebViti')?.value || String(new Date().getFullYear());
    const muaji = document.getElementById('repDebMuaji')?.value || 'total';

    let data = [];
    try { data = JSON.parse(localStorage.getItem('debitoret_data_v1') || '[]'); } catch {}
    data = filtroSipasRolit(data);

    // Filtër viti/muaji
    const filtered = data.filter(r => {
        if (!r.muaji) return false;
        const [m, y] = r.muaji.split('_');
        if (y !== viti) return false;
        if (muaji === 'total') return true;
        return m === muaji;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="rep-empty"><div class="rep-empty-icon">📊</div><div class="rep-empty-title">Nuk ka të dhëna</div><div class="rep-empty-sub">Për ${muaji === 'total' ? 'vitin ' + viti : MUAJT_LABEL[MUAJT_REP.indexOf(muaji)] + ' ' + viti} nuk ka rekorde debitorësh</div></div>`;
        return;
    }

    if (currentDebSubtab === 'permbledhje') container.innerHTML = renderDebPermbledhje(filtered, viti, muaji);
    if (currentDebSubtab === 'krahasim') container.innerHTML = renderDebKrahasim(data, viti, muaji);
    if (currentDebSubtab === 'deget') container.innerHTML = renderDebDeget(filtered);
    if (currentDebSubtab === 'agjentet') container.innerHTML = renderDebAgjentet(filtered);
    if (currentDebSubtab === 'trend') container.innerHTML = renderDebTrend(data, viti);

    if (window.lucide) lucide.createIcons();
}

function renderDebPermbledhje(data, viti, muaji) {
    const totalBorxh = data.reduce((s,r) => s + Number(r.debitori_total || 0), 0);
    const totalRisk = data.reduce((s,r) => s + Number(r.borxh_mbi_365 || 0), 0);
    const totalPaguar = data.filter(r => r.statusi === 'paguar_total').reduce((s,r) => s + Number(r.shuma_paguar || r.debitori_total || 0), 0);
    const totalPaguarPjess = data.filter(r => r.statusi === 'paguar_pjesshem').reduce((s,r) => s + Number(r.shuma_paguar || 0), 0);
    const mbetur = totalBorxh - totalPaguar - totalPaguarPjess;

    const counts = {};
    ['i_ri','kontaktuar','premtim_pagese','paguar_total','paguar_pjesshem','kontestuar','i_pamundshem'].forEach(k => counts[k] = 0);
    data.forEach(r => { if (counts[r.statusi] !== undefined) counts[r.statusi]++; });

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

    const periudha = muaji === 'total' ? `Total viti ${viti}` : `${MUAJT_LABEL[MUAJT_REP.indexOf(muaji)]} ${viti}`;

    return `
        <div class="rep-summary-strip">
            <div class="rep-ss-item"><div class="rss-label">Borxhi total</div><div class="rss-value">${formatMoney(totalBorxh)}</div><div class="rss-sub">${data.length} klientë · ${periudha}</div></div>
            <div class="rep-ss-item danger"><div class="rss-label">Mbi 365 ditë</div><div class="rss-value">${formatMoney(totalRisk)}</div><div class="rss-sub">${((totalRisk/totalBorxh)*100||0).toFixed(1)}% e totalit</div></div>
            <div class="rep-ss-item highlight"><div class="rss-label">Paguar (total + pjesshëm)</div><div class="rss-value">${formatMoney(totalPaguar+totalPaguarPjess)}</div><div class="rss-sub">${counts.paguar_total + counts.paguar_pjesshem} klientë</div></div>
            <div class="rep-ss-item warning"><div class="rss-label">Mbetur për pagesë</div><div class="rss-value">${formatMoney(mbetur)}</div><div class="rss-sub">${(((mbetur)/totalBorxh)*100||0).toFixed(1)}% e mbetur</div></div>
        </div>

        <div class="rep-stats-grid">
            <div class="rep-stat-card"><div class="rsc-label">I ri</div><div class="rsc-value" style="color:#94a3b8">${counts.i_ri}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">Kontaktuar</div><div class="rsc-value" style="color:#f59e0b">${counts.kontaktuar}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">Premtim pagese</div><div class="rsc-value" style="color:#3b82f6">${counts.premtim_pagese}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">Paguar total</div><div class="rsc-value" style="color:#22c55e">${counts.paguar_total}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">Paguar pjesshëm</div><div class="rsc-value" style="color:#84cc16">${counts.paguar_pjesshem}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">Kontestuar</div><div class="rsc-value" style="color:#f87171">${counts.kontestuar}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">I pamundshëm</div><div class="rsc-value" style="color:#dc2626">${counts.i_pamundshem}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">Total klientë</div><div class="rsc-value">${data.length}</div></div>
        </div>

        <div class="rep-table-wrap">
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

function renderDebKrahasim(allData, viti, _muaji) {
    // Të dhënat për të gjitha muajt e vitit të zgjedhur
    const muajRows = MUAJT_REP.map((m,i) => {
        const monthData = allData.filter(r => r.muaji === `${m}_${viti}`);
        return {
            muaji: m,
            label: MUAJT_LABEL[i],
            klient: monthData.length,
            borxh: monthData.reduce((s,r) => s + Number(r.debitori_total || 0), 0),
            risk: monthData.reduce((s,r) => s + Number(r.borxh_mbi_365 || 0), 0),
            paguar: monthData.filter(r => r.statusi === 'paguar_total').length
        };
    }).filter(r => r.klient > 0);

    if (muajRows.length === 0) {
        return `<div class="rep-empty"><div class="rep-empty-icon">📈</div><div class="rep-empty-title">Nuk ka të dhëna për krahasim</div><div class="rep-empty-sub">Importoni të paktën 2 muaj për të parë trendin</div></div>`;
    }

    const arrow = (n) => n > 0 ? '↑' : n < 0 ? '↓' : '→';
    const cls = (n) => n > 0 ? 'up' : n < 0 ? 'down' : 'neutral';

    return `
        <div class="rep-table-wrap">
            <div class="rep-table-header"><h3 class="rep-table-title">Krahasim mes muajve · Viti ${viti}</h3></div>
            <table class="rep-table">
                <thead>
                    <tr>
                        <th>Muaji</th>
                        <th class="right">Klientë</th>
                        <th class="right">Δ</th>
                        <th class="right">Borxhi total</th>
                        <th class="right">Δ %</th>
                        <th class="right">Mbi 365</th>
                        <th class="right">Paguar</th>
                    </tr>
                </thead>
                <tbody>
                    ${muajRows.map((r,i) => {
                        const prev = i > 0 ? muajRows[i-1] : null;
                        const dKlient = prev ? r.klient - prev.klient : 0;
                        const dBorxh = prev ? r.borxh - prev.borxh : 0;
                        const dBorxhPct = prev && prev.borxh ? ((dBorxh/prev.borxh)*100).toFixed(1) : '0.0';
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
        if (r.statusi === 'paguar_total') { dege[d].paguar++; dege[d].paguarVal += Number(r.shuma_paguar || r.debitori_total || 0); }
        if (r.statusi === 'paguar_pjesshem') dege[d].paguarVal += Number(r.shuma_paguar || 0);
    });
    const sorted = Object.keys(dege).sort((a,b) => dege[b].borxh - dege[a].borxh);
    const totalBorxh = sorted.reduce((s,d) => s + dege[d].borxh, 0);
    const maxBorxh = Math.max(...sorted.map(d => dege[d].borxh), 1);

    return `
        <div class="rep-2col left-bigger">
            <div class="rep-table-wrap">
                <div class="rep-table-header">
                    <h3 class="rep-table-title">Performanca sipas degëve</h3>
                    <input class="rep-table-search" placeholder="Kërko degë..." onkeyup="filtroTabelen(this,'#tblDeget')">
                </div>
                <table class="rep-table" id="tblDeget">
                    <thead>
                        <tr>
                            <th>Dega</th>
                            <th class="right">Klientë</th>
                            <th class="right">Borxhi</th>
                            <th class="right">% e totalit</th>
                            <th class="right">Mbi 365</th>
                            <th class="right">Paguar (€)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(d => `
                            <tr data-name="${esc(d).toLowerCase()}">
                                <td><strong>${esc(d)}</strong></td>
                                <td class="right">${dege[d].klient}</td>
                                <td class="right"><strong>${formatMoney(dege[d].borxh)}</strong></td>
                                <td class="right">${((dege[d].borxh/totalBorxh)*100||0).toFixed(1)}%</td>
                                <td class="right" style="color:${dege[d].risk>0?'#ef4444':'#94a3b8'}">${formatMoney(dege[d].risk)}</td>
                                <td class="right" style="color:#22c55e;font-weight:600">${formatMoney(dege[d].paguarVal)}</td>
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
                            <div class="rep-bar-label" title="${esc(d)}">${esc(d)}</div>
                            <div class="rep-bar-track"><div class="rep-bar-fill" style="width:${(dege[d].borxh/maxBorxh*100).toFixed(1)}%;background:linear-gradient(90deg,#002B5C,#3b82f6)"></div></div>
                            <div class="rep-bar-value">${formatMoneyShort(dege[d].borxh)}</div>
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
        if (!agj[a]) agj[a] = { klient:0, borxh:0, risk:0, paguarVal:0, dega:r.dega || 'Pa degë' };
        agj[a].klient++;
        agj[a].borxh += Number(r.debitori_total || 0);
        agj[a].risk += Number(r.borxh_mbi_365 || 0);
        if (r.statusi === 'paguar_total') agj[a].paguarVal += Number(r.shuma_paguar || r.debitori_total || 0);
        if (r.statusi === 'paguar_pjesshem') agj[a].paguarVal += Number(r.shuma_paguar || 0);
    });
    const sorted = Object.keys(agj).sort((a,b) => agj[b].borxh - agj[a].borxh);

    return `
        <div class="rep-table-wrap">
            <div class="rep-table-header">
                <h3 class="rep-table-title">Të gjithë agjentët (renditur sipas borxhit)</h3>
                <input class="rep-table-search" placeholder="Kërko agjent..." onkeyup="filtroTabelen(this,'#tblAgjentet')">
            </div>
            <table class="rep-table" id="tblAgjentet">
                <thead>
                    <tr>
                        <th>Agjenti</th>
                        <th>Dega</th>
                        <th class="right">Klientë</th>
                        <th class="right">Borxhi</th>
                        <th class="right">Mbi 365</th>
                        <th class="right">Paguar (€)</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(a => `
                        <tr data-name="${esc(a).toLowerCase()}">
                            <td><strong>${esc(a)}</strong></td>
                            <td><span style="font-size:11px;color:#64748b">${esc(agj[a].dega)}</span></td>
                            <td class="right">${agj[a].klient}</td>
                            <td class="right"><strong>${formatMoney(agj[a].borxh)}</strong></td>
                            <td class="right" style="color:${agj[a].risk>0?'#ef4444':'#94a3b8'}">${formatMoney(agj[a].risk)}</td>
                            <td class="right" style="color:#22c55e;font-weight:600">${formatMoney(agj[a].paguarVal)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderDebTrend(allData, viti) {
    const muajRows = MUAJT_REP.map((m,i) => {
        const monthData = allData.filter(r => r.muaji === `${m}_${viti}`);
        return {
            label: MUAJT_LABEL[i],
            borxh: monthData.reduce((s,r) => s + Number(r.debitori_total || 0), 0),
            risk: monthData.reduce((s,r) => s + Number(r.borxh_mbi_365 || 0), 0)
        };
    });
    const max = Math.max(...muajRows.map(r => r.borxh), 1);

    return `
        <div class="rep-table-wrap">
            <div class="rep-table-header"><h3 class="rep-table-title">Trend i borxhit gjatë vitit ${viti}</h3></div>
            <div style="padding:24px 26px">
                ${muajRows.map(r => `
                    <div class="rep-bar-row" style="margin-bottom:12px">
                        <div class="rep-bar-label">${r.label}</div>
                        <div class="rep-bar-track" style="height:20px"><div class="rep-bar-fill" style="width:${(r.borxh/max*100).toFixed(1)}%;background:linear-gradient(90deg,#002B5C,#3b82f6);height:100%"></div></div>
                        <div class="rep-bar-value">${formatMoneyShort(r.borxh)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ============================================================
// RAPORTI RINOVIMET
// ============================================================
function renderRaportiRinovimet() {
    const container = document.getElementById('repRinContent');
    if (!container) return;

    const viti = document.getElementById('repRinViti')?.value || String(new Date().getFullYear());
    const muaji = document.getElementById('repRinMuaji')?.value || 'total';

    let data = [];
    try { data = JSON.parse(localStorage.getItem('rinovimet_data') || '[]'); } catch {}
    data = filtroSipasRolit(data);

    const filtered = data.filter(r => {
        if (!r.muaji) return false;
        const [m, y] = r.muaji.split('_');
        if (y !== viti) return false;
        if (muaji === 'total') return true;
        return m === muaji;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="rep-empty"><div class="rep-empty-icon">📊</div><div class="rep-empty-title">Nuk ka të dhëna</div><div class="rep-empty-sub">Për ${muaji === 'total' ? 'vitin ' + viti : MUAJT_LABEL[MUAJT_REP.indexOf(muaji)] + ' ' + viti} nuk ka rekorde rinovimesh</div></div>`;
        return;
    }

    if (currentRinSubtab === 'permbledhje') container.innerHTML = renderRinPermbledhje(filtered, viti, muaji);
    if (currentRinSubtab === 'krahasim') container.innerHTML = renderRinKrahasim(data, viti);
    if (currentRinSubtab === 'deget') container.innerHTML = renderRinDeget(filtered);
    if (currentRinSubtab === 'agjentet') container.innerHTML = renderRinAgjentet(filtered);
    if (currentRinSubtab === 'performanca') container.innerHTML = renderRinPerformanca(filtered);

    if (window.lucide) lucide.createIcons();
}

function renderRinPermbledhje(data, viti, muaji) {
    const total = data.length;
    const rinovuar = data.filter(r => r.statusi === 'rinovuar').length;
    const humbur = data.filter(r => r.statusi === 'humbur').length;
    const paFilluar = data.filter(r => r.statusi === 'pa_filluar' || !r.statusi).length;
    const kontaktuar = data.filter(r => r.statusi === 'kontaktuar').length;

    const primi = data.reduce((s,r) => s + Number(r.primi_vjetor || r.total_primi || 0), 0);
    const deme = data.reduce((s,r) => s + Number(r.deme_total_vlera || 0), 0);
    const shpenz = data.reduce((s,r) => s + Number(r.shpenzimet || 0), 0);
    const lr = primi ? (deme/primi*100) : 0;
    const cr = primi ? ((deme+shpenz)/primi*100) : 0;
    const rinovRate = total ? (rinovuar/total*100) : 0;

    const periudha = muaji === 'total' ? `Total viti ${viti}` : `${MUAJT_LABEL[MUAJT_REP.indexOf(muaji)]} ${viti}`;

    return `
        <div class="rep-summary-strip">
            <div class="rep-ss-item"><div class="rss-label">Total kontrata</div><div class="rss-value">${total}</div><div class="rss-sub">${periudha}</div></div>
            <div class="rep-ss-item"><div class="rss-label">Primi total</div><div class="rss-value">${formatMoney(primi)}</div><div class="rss-sub">Vjetor</div></div>
            <div class="rep-ss-item highlight"><div class="rss-label">Rinovuar</div><div class="rss-value">${rinovuar}</div><div class="rss-sub">${rinovRate.toFixed(1)}% rinovim rate</div></div>
            <div class="rep-ss-item danger"><div class="rss-label">Humbur</div><div class="rss-value">${humbur}</div><div class="rss-sub">${total ? (humbur/total*100).toFixed(1) : 0}% humbje</div></div>
        </div>

        <div class="rep-stats-grid">
            <div class="rep-stat-card"><div class="rsc-label">Pa filluar</div><div class="rsc-value" style="color:#94a3b8">${paFilluar}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">Kontaktuar</div><div class="rsc-value" style="color:#f59e0b">${kontaktuar}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">Dëme totale</div><div class="rsc-value" style="color:#ef4444">${formatMoneyShort(deme)}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">Shpenzime</div><div class="rsc-value">${formatMoneyShort(shpenz)}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">LR (Loss Ratio)</div><div class="rsc-value" style="color:${lr>90?'#ef4444':lr>60?'#f59e0b':'#22c55e'}">${lr.toFixed(1)}%</div></div>
            <div class="rep-stat-card"><div class="rsc-label">CR (Combined Ratio)</div><div class="rsc-value" style="color:${cr>100?'#ef4444':cr>90?'#f59e0b':'#22c55e'}">${cr.toFixed(1)}%</div></div>
            <div class="rep-stat-card"><div class="rsc-label">Marzhi</div><div class="rsc-value" style="color:${(100-cr)<0?'#ef4444':'#22c55e'}">${(100-cr).toFixed(1)}%</div></div>
            <div class="rep-stat-card"><div class="rsc-label">Primi mesatar</div><div class="rsc-value">${total ? formatMoneyShort(primi/total) : '0€'}</div></div>
        </div>
    `;
}

function renderRinKrahasim(allData, viti) {
    const muajRows = MUAJT_REP.map((m,i) => {
        const monthData = allData.filter(r => r.muaji === `${m}_${viti}`);
        const primi = monthData.reduce((s,r) => s + Number(r.primi_vjetor || r.total_primi || 0), 0);
        const deme = monthData.reduce((s,r) => s + Number(r.deme_total_vlera || 0), 0);
        return {
            label: MUAJT_LABEL[i],
            total: monthData.length,
            rinovuar: monthData.filter(r => r.statusi === 'rinovuar').length,
            humbur: monthData.filter(r => r.statusi === 'humbur').length,
            primi, deme,
            lr: primi ? (deme/primi*100) : 0
        };
    }).filter(r => r.total > 0);

    if (muajRows.length === 0) return `<div class="rep-empty"><div class="rep-empty-icon">📈</div><div class="rep-empty-title">Nuk ka të dhëna për krahasim</div></div>`;

    const arrow = (n) => n > 0 ? '↑' : n < 0 ? '↓' : '→';
    const cls = (n, inverse) => {
        if (n === 0) return 'neutral';
        if (inverse) return n > 0 ? 'down' : 'up';
        return n > 0 ? 'up' : 'down';
    };

    return `
        <div class="rep-table-wrap">
            <div class="rep-table-header"><h3 class="rep-table-title">Krahasim mes muajve · Viti ${viti}</h3></div>
            <table class="rep-table">
                <thead>
                    <tr>
                        <th>Muaji</th>
                        <th class="right">Total</th>
                        <th class="right">Rinovuar</th>
                        <th class="right">Humbur</th>
                        <th class="right">Primi</th>
                        <th class="right">Δ Primi</th>
                        <th class="right">LR%</th>
                    </tr>
                </thead>
                <tbody>
                    ${muajRows.map((r,i) => {
                        const prev = i > 0 ? muajRows[i-1] : null;
                        const dPrimi = prev ? r.primi - prev.primi : 0;
                        const dPct = prev && prev.primi ? ((dPrimi/prev.primi)*100).toFixed(1) : '0.0';
                        return `
                            <tr>
                                <td><strong>${r.label}</strong></td>
                                <td class="right">${r.total}</td>
                                <td class="right" style="color:#22c55e;font-weight:600">${r.rinovuar}</td>
                                <td class="right" style="color:#ef4444;font-weight:600">${r.humbur}</td>
                                <td class="right"><strong>${formatMoney(r.primi)}</strong></td>
                                <td class="right">${prev ? `<span class="rep-delta ${cls(dPrimi,true)}">${arrow(dPrimi)} ${dPct}%</span>` : '—'}</td>
                                <td class="right" style="color:${r.lr>90?'#ef4444':r.lr>60?'#f59e0b':'#22c55e'}">${r.lr.toFixed(1)}%</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderRinDeget(data) {
    const dege = {};
    data.forEach(r => {
        const d = r.dega || 'Pa degë';
        if (!dege[d]) dege[d] = { total:0, rinovuar:0, humbur:0, primi:0, deme:0 };
        dege[d].total++;
        if (r.statusi === 'rinovuar') dege[d].rinovuar++;
        if (r.statusi === 'humbur') dege[d].humbur++;
        dege[d].primi += Number(r.primi_vjetor || r.total_primi || 0);
        dege[d].deme += Number(r.deme_total_vlera || 0);
    });
    const sorted = Object.keys(dege).sort((a,b) => dege[b].primi - dege[a].primi);

    return `
        <div class="rep-table-wrap">
            <div class="rep-table-header">
                <h3 class="rep-table-title">Performanca sipas degëve</h3>
                <input class="rep-table-search" placeholder="Kërko degë..." onkeyup="filtroTabelen(this,'#tblRinDeget')">
            </div>
            <table class="rep-table" id="tblRinDeget">
                <thead>
                    <tr>
                        <th>Dega</th>
                        <th class="right">Total</th>
                        <th class="right">Rinovuar</th>
                        <th class="right">Humbur</th>
                        <th class="right">Rate %</th>
                        <th class="right">Primi</th>
                        <th class="right">LR%</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(d => {
                        const rate = dege[d].total ? (dege[d].rinovuar/dege[d].total*100) : 0;
                        const lr = dege[d].primi ? (dege[d].deme/dege[d].primi*100) : 0;
                        return `
                            <tr data-name="${esc(d).toLowerCase()}">
                                <td><strong>${esc(d)}</strong></td>
                                <td class="right">${dege[d].total}</td>
                                <td class="right" style="color:#22c55e;font-weight:600">${dege[d].rinovuar}</td>
                                <td class="right" style="color:#ef4444;font-weight:600">${dege[d].humbur}</td>
                                <td class="right">${rate.toFixed(1)}%</td>
                                <td class="right"><strong>${formatMoney(dege[d].primi)}</strong></td>
                                <td class="right" style="color:${lr>90?'#ef4444':lr>60?'#f59e0b':'#22c55e'}">${lr.toFixed(1)}%</td>
                            </tr>
                        `;
                    }).join('')}
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
    const sorted = Object.keys(agj).sort((a,b) => agj[b].primi - agj[a].primi);

    return `
        <div class="rep-table-wrap">
            <div class="rep-table-header">
                <h3 class="rep-table-title">Performanca sipas agjentëve</h3>
                <input class="rep-table-search" placeholder="Kërko agjent..." onkeyup="filtroTabelen(this,'#tblRinAgjentet')">
            </div>
            <table class="rep-table" id="tblRinAgjentet">
                <thead>
                    <tr>
                        <th>Agjenti</th>
                        <th>Dega</th>
                        <th class="right">Total</th>
                        <th class="right">Rinovuar</th>
                        <th class="right">Rate %</th>
                        <th class="right">Primi</th>
                        <th class="right">LR%</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map(a => {
                        const rate = agj[a].total ? (agj[a].rinovuar/agj[a].total*100) : 0;
                        const lr = agj[a].primi ? (agj[a].deme/agj[a].primi*100) : 0;
                        return `
                            <tr data-name="${esc(a).toLowerCase()}">
                                <td><strong>${esc(a)}</strong></td>
                                <td><span style="font-size:11px;color:#64748b">${esc(agj[a].dega)}</span></td>
                                <td class="right">${agj[a].total}</td>
                                <td class="right" style="color:#22c55e;font-weight:600">${agj[a].rinovuar}</td>
                                <td class="right">${rate.toFixed(1)}%</td>
                                <td class="right"><strong>${formatMoney(agj[a].primi)}</strong></td>
                                <td class="right" style="color:${lr>90?'#ef4444':lr>60?'#f59e0b':'#22c55e'}">${lr.toFixed(1)}%</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderRinPerformanca(data) {
    // Top 10 ma fitimprurës (CR më i ulët) dhe top 10 problematikë (CR më i lartë)
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
                <div class="rep-table-header"><h3 class="rep-table-title">🏆 Top 10 fitimprurës (CR më i ulët)</h3></div>
                <table class="rep-table">
                    <thead><tr><th>Klienti</th><th class="right">Primi</th><th class="right">LR%</th><th class="right">CR%</th></tr></thead>
                    <tbody>${fitimprurese.map(buildRow).join('') || '<tr><td colspan="4" style="text-align:center;color:#94a3b8">Asnjë rekord</td></tr>'}</tbody>
                </table>
            </div>
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">⚠ Top 10 problematikë (CR më i lartë)</h3></div>
                <table class="rep-table">
                    <thead><tr><th>Klienti</th><th class="right">Primi</th><th class="right">LR%</th><th class="right">CR%</th></tr></thead>
                    <tbody>${problematike.map(buildRow).join('') || '<tr><td colspan="4" style="text-align:center;color:#94a3b8">Asnjë rekord</td></tr>'}</tbody>
                </table>
            </div>
        </div>
    `;
}

// ============================================================
// EXPORT
// ============================================================
function eksportoRaportin(modul) {
    let data = [], filename = '';
    if (modul === 'debitoret') {
        const viti = document.getElementById('repDebViti').value;
        const muaji = document.getElementById('repDebMuaji').value;
        let raw = [];
        try { raw = JSON.parse(localStorage.getItem('debitoret_data_v1') || '[]'); } catch {}
        raw = filtroSipasRolit(raw);
        data = raw.filter(r => {
            if (!r.muaji) return false;
            const [m, y] = r.muaji.split('_');
            return y === viti && (muaji === 'total' || m === muaji);
        }).map(r => ({
            Muaji: r.muaji, Klienti: r.klienti, Dega: r.dega, Agjenti: r.agjenti,
            'Borxhi total': r.debitori_total, 'Mbi 365': r.borxh_mbi_365, Statusi: r.statusi
        }));
        filename = `raport_debitoret_${viti}_${muaji}.xlsx`;
    }
    if (modul === 'rinovimet') {
        const viti = document.getElementById('repRinViti').value;
        const muaji = document.getElementById('repRinMuaji').value;
        let raw = [];
        try { raw = JSON.parse(localStorage.getItem('rinovimet_data') || '[]'); } catch {}
        raw = filtroSipasRolit(raw);
        data = raw.filter(r => {
            if (!r.muaji) return false;
            const [m, y] = r.muaji.split('_');
            return y === viti && (muaji === 'total' || m === muaji);
        }).map(r => ({
            Muaji: r.muaji, Kontraktuesi: r.kontraktuesi, Dega: r.dega, Agjenti: r.agjenti,
            Primi: r.primi_vjetor || r.total_primi, Deme: r.deme_total_vlera, Statusi: r.statusi
        }));
        filename = `raport_rinovimet_${viti}_${muaji}.xlsx`;
    }
    if (!data.length) { alert('Nuk ka të dhëna për eksport.'); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Raporti');
    XLSX.writeFile(wb, filename);
}

// ============================================================
// HELPERS
// ============================================================
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