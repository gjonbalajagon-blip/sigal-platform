// ============================================================
// RAPORTET.JS — Moduli i raporteve (v2)
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

const SUBTABS_DEB = [
    { key:'permbledhje', label:'Përmbledhje' },
    { key:'krahasim', label:'Krahasim mujor' },
    { key:'deget', label:'Sipas degëve' },
    { key:'agjentet', label:'Sipas agjentëve' },
    { key:'topklient', label:'Top klientët' }
];

const SUBTABS_RIN = [
    { key:'permbledhje', label:'Përmbledhje' },
    { key:'krahasim', label:'Krahasim mujor' },
    { key:'deget', label:'Sipas degëve' },
    { key:'agjentet', label:'Sipas agjentëve' },
    { key:'performanca', label:'Performanca (LR/CR)' }
];

const STATUSET_PAGUAR = ['paguar_total','paguar_pjesshem'];

let currentModule = 'hub';
let currentDebSubtab = 'permbledhje';
let currentRinSubtab = 'permbledhje';
let sortState = {};

document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    renderModulesRow();
    renderHub();
    initFilters();
    renderSubtabsDeb();
    renderSubtabsRin();
    const params = new URLSearchParams(window.location.search);
    const mod = params.get('modul');
    if (mod && MODULET.find(m => m.key === mod)) switchModule(mod);
});

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
            { label:'Kontrata', value:'—' },
            { label:'Të siguruar', value:'—' },
            { label:'Pako top', value:'—' },
            { label:'Vlera', value:'—' }
        ],
        status:'Së shpejti'
    });
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

function buildHubCardDebitoret() {
    let data = [];
    try { data = JSON.parse(localStorage.getItem('debitoret_data_v1') || '[]'); } catch {}
    data = filtroSipasRolit(data);
    const total = data.length;
    const totalBorxh = data.reduce((s,r) => s + Number(r.debitori_total || 0), 0);
    const risk = data.reduce((s,r) => s + Number(r.borxh_mbi_365 || 0), 0);
    const paguar = data.filter(r => STATUSET_PAGUAR.includes(r.statusi)).length;
    return buildHubCard({
        key:'debitoret', icon:'wallet', iconClass:'ric-debitoret',
        title:'Debitorët', sub:'Borxhet dhe rikuperimet',
        metrics:[
            { label:'Klientë', value:total },
            { label:'Borxhi', value:formatMoneyShort(totalBorxh), color:'red' },
            { label:'Mbi 365', value:formatMoneyShort(risk), color:'red' },
            { label:'Rikuperuar', value:paguar, color:'green' }
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
            { label:'Degë', value:'—' }, { label:'Top performer', value:'—' }
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

// ============ SUBTABS ============
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

// ============ DEBITORET ============
function getDebPrevMonth(viti, muaji) {
    if (muaji === 'total') return null;
    const idx = MUAJT_REP.indexOf(muaji);
    if (idx === 0) return { viti: String(Number(viti)-1), muaji: 'dhjetor' };
    return { viti, muaji: MUAJT_REP[idx-1] };
}

function filterDebData(all, viti, muaji) {
    return all.filter(r => {
        if (!r.muaji) return false;
        const [m, y] = r.muaji.split('_');
        if (y !== viti) return false;
        if (muaji === 'total') return true;
        return m === muaji;
    });
}

function renderRaportiDebitoret() {
    const container = document.getElementById('repDebContent');
    if (!container) return;
    const viti = document.getElementById('repDebViti')?.value || String(new Date().getFullYear());
    const muaji = document.getElementById('repDebMuaji')?.value || 'total';
    let allData = [];
    try { allData = JSON.parse(localStorage.getItem('debitoret_data_v1') || '[]'); } catch {}
    allData = filtroSipasRolit(allData);
    const filtered = filterDebData(allData, viti, muaji);

    if (filtered.length === 0) {
        container.innerHTML = `<div class="rep-empty"><div class="rep-empty-icon">📊</div><div class="rep-empty-title">Nuk ka të dhëna</div><div class="rep-empty-sub">Për ${muaji === 'total' ? 'vitin ' + viti : MUAJT_LABEL[MUAJT_REP.indexOf(muaji)] + ' ' + viti} nuk ka rekorde debitorësh</div></div>`;
        return;
    }

    if (currentDebSubtab === 'permbledhje') container.innerHTML = renderDebPermbledhje(filtered, allData, viti, muaji);
    if (currentDebSubtab === 'krahasim') container.innerHTML = renderDebKrahasim(allData, viti);
    if (currentDebSubtab === 'deget') container.innerHTML = renderDebDeget(filtered);
    if (currentDebSubtab === 'agjentet') container.innerHTML = renderDebAgjentet(filtered);
    if (currentDebSubtab === 'topklient') container.innerHTML = renderDebTopKlient(filtered);
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
    const insights = buildDebInsights(data, allData, viti, muaji, totalBorxh);

    return `
        <div class="rep-summary-strip">
            <div class="rep-ss-item"><div class="rss-label">Borxhi total</div><div class="rss-value">${formatMoney(totalBorxh)}</div><div class="rss-sub">${data.length} klientë · ${periudha}</div></div>
            <div class="rep-ss-item danger"><div class="rss-label">Mbi 365 ditë</div><div class="rss-value">${formatMoney(totalRisk)}</div><div class="rss-sub">${totalBorxh ? ((totalRisk/totalBorxh)*100).toFixed(1) : 0}% e totalit</div></div>
            <div class="rep-ss-item highlight"><div class="rss-label">Paguar (total + pjesshëm)</div><div class="rss-value">${formatMoney(totalPaguar)}</div><div class="rss-sub">${counts.paguar_total + counts.paguar_pjesshem} klientë</div></div>
            <div class="rep-ss-item warning"><div class="rss-label">Mbetur për pagesë</div><div class="rss-value">${formatMoney(mbetur)}</div><div class="rss-sub">${totalBorxh ? ((mbetur/totalBorxh)*100).toFixed(1) : 0}% e mbetur</div></div>
        </div>

        <div class="rep-section-title">🎯 Insights kryesore</div>
        <div class="rep-insights-grid">${insights}</div>

        <div class="rep-section-title">📊 Statuset aktuale</div>
        <div class="rep-stats-grid" style="grid-template-columns:repeat(8,1fr)">
            <div class="rep-stat-card"><div class="rsc-label">I ri</div><div class="rsc-value" style="color:#94a3b8">${counts.i_ri}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">Kontaktuar</div><div class="rsc-value" style="color:#f59e0b">${counts.kontaktuar}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">Premtim</div><div class="rsc-value" style="color:#3b82f6">${counts.premtim_pagese}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">Paguar total</div><div class="rsc-value" style="color:#22c55e">${counts.paguar_total}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">Pjesshëm</div><div class="rsc-value" style="color:#84cc16">${counts.paguar_pjesshem}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">Kontestuar</div><div class="rsc-value" style="color:#f87171">${counts.kontestuar}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">I pamundshëm</div><div class="rsc-value" style="color:#dc2626">${counts.i_pamundshem}</div></div>
            <div class="rep-stat-card"><div class="rsc-label">Total</div><div class="rsc-value">${data.length}</div></div>
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

function buildDebInsights(data, allData, viti, muaji, totalBorxh) {
    const cards = [];

    // Insight 1: Po rritet borxhi?
    const prev = getDebPrevMonth(viti, muaji);
    if (prev) {
        const prevData = allData.filter(r => r.muaji === `${prev.muaji}_${prev.viti}`);
        if (prevData.length > 0) {
            const prevBorxh = prevData.reduce((s,r) => s + Number(r.debitori_total || 0), 0);
            const delta = totalBorxh - prevBorxh;
            const deltaPct = prevBorxh ? ((delta/prevBorxh)*100).toFixed(1) : 0;
            const rritet = delta > 0;
            const color = rritet ? '#ef4444' : '#22c55e';
            const icon = rritet ? '↑' : delta < 0 ? '↓' : '→';
            const status = rritet ? 'PO' : delta < 0 ? 'JO' : 'STABIL';
            cards.push(`
                <div class="rep-insight-card ${rritet ? 'danger' : 'success'}">
                    <div class="ric-question">A po rritet borxhi total?</div>
                    <div class="ric-answer">
                        <span class="ric-big" style="color:${color}">${icon} ${status}</span>
                        <span class="ric-pct" style="color:${color}">${deltaPct > 0 ? '+' : ''}${deltaPct}%</span>
                    </div>
                    <div class="ric-context">
                        ${formatMoneyShort(totalBorxh)} këtë periudhë<br>
                        ${formatMoneyShort(prevBorxh)} ${MUAJT_LABEL[MUAJT_REP.indexOf(prev.muaji)]}<br>
                        <strong>${delta >= 0 ? '+' : ''}${formatMoneyShort(delta)}</strong> diferencë
                    </div>
                </div>
            `);
        }
    }
    if (cards.length === 0) {
        cards.push(`
            <div class="rep-insight-card neutral">
                <div class="ric-question">A po rritet borxhi total?</div>
                <div class="ric-answer"><span class="ric-big">—</span></div>
                <div class="ric-context">Nuk ka të dhëna nga muaji paraprak për krahasim</div>
            </div>
        `);
    }

    // Insight 2: Agjenti me Recovery Rate më të ulët
    const agj = {};
    data.forEach(r => {
        const a = r.agjenti || 'Pa agjent';
        if (!agj[a]) agj[a] = { total:0, paguar:0 };
        agj[a].total++;
        if (STATUSET_PAGUAR.includes(r.statusi)) agj[a].paguar++;
    });
    const agjArr = Object.keys(agj).filter(a => agj[a].total >= 5).map(a => ({
        emri: a, total: agj[a].total, paguar: agj[a].paguar,
        rate: agj[a].total ? (agj[a].paguar/agj[a].total*100) : 0
    }));
    if (agjArr.length > 0) {
        const sorted = [...agjArr].sort((a,b) => a.rate - b.rate);
        const worst = sorted[0];
        const mesatarja = agjArr.reduce((s,a) => s + a.rate, 0) / agjArr.length;
        cards.push(`
            <div class="rep-insight-card danger">
                <div class="ric-question">Kush rikuperon më pak?</div>
                <div class="ric-answer">
                    <span class="ric-big" style="color:#ef4444;font-size:15px">⚠ ${esc(worst.emri)}</span>
                </div>
                <div class="ric-context">
                    Recovery Rate: <strong>${worst.rate.toFixed(1)}%</strong><br>
                    ${worst.paguar} nga ${worst.total} klientë paguan<br>
                    <span style="color:#94a3b8">Mesatarja: ${mesatarja.toFixed(1)}%</span>
                </div>
            </div>
        `);
    }

    // Insight 3: Sa nga debitorët e muajit paraprak kanë paguar
    if (prev) {
        const prevData = allData.filter(r => r.muaji === `${prev.muaji}_${prev.viti}`);
        if (prevData.length > 0) {
            const prevNames = new Set(prevData.map(r => r.klienti_normalized || (r.klienti || '').toLowerCase().trim()));
            const currNames = new Set(data.map(r => r.klienti_normalized || (r.klienti || '').toLowerCase().trim()));
            const paguar = [...prevNames].filter(n => !currNames.has(n)).length;
            const ende = prevData.length - paguar;
            const rate = prevData.length ? (paguar/prevData.length*100).toFixed(1) : 0;
            cards.push(`
                <div class="rep-insight-card success">
                    <div class="ric-question">Sa klientë të muajit të kaluar kanë paguar?</div>
                    <div class="ric-answer">
                        <span class="ric-big" style="color:#22c55e">✓ ${paguar}</span>
                        <span class="ric-pct" style="color:#22c55e">${rate}%</span>
                    </div>
                    <div class="ric-context">
                        nga <strong>${prevData.length}</strong> klientë që kishin borxh<br>
                        ${ende} ende kanë borxh
                    </div>
                </div>
            `);
        }
    }

    return cards.join('');
}

function renderDebKrahasim(allData, viti) {
    const muajRows = MUAJT_REP.map((m,i) => {
        const monthData = allData.filter(r => r.muaji === `${m}_${viti}`);
        return {
            muaji: m, label: MUAJT_LABEL[i],
            klient: monthData.length,
            borxh: monthData.reduce((s,r) => s + Number(r.debitori_total || 0), 0),
            risk: monthData.reduce((s,r) => s + Number(r.borxh_mbi_365 || 0), 0),
            paguar: monthData.filter(r => STATUSET_PAGUAR.includes(r.statusi)).length
        };
    }).filter(r => r.klient > 0);

    if (muajRows.length === 0) {
        return `<div class="rep-empty"><div class="rep-empty-icon">📈</div><div class="rep-empty-title">Nuk ka të dhëna për krahasim</div></div>`;
    }

    const maxBorxh = Math.max(...muajRows.map(r => r.borxh), 1);
    const maxKlient = Math.max(...muajRows.map(r => r.klient), 1);

    return `
        <div class="rep-2col">
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">📊 Borxhi total gjatë vitit ${viti}</h3></div>
                <div style="padding:22px 24px">
                    ${muajRows.map(r => `
                        <div class="rep-bar-row" style="margin-bottom:14px">
                            <div class="rep-bar-label">${r.label}</div>
                            <div class="rep-bar-track" style="height:22px"><div class="rep-bar-fill" style="width:${(r.borxh/maxBorxh*100).toFixed(1)}%;background:linear-gradient(90deg,#002B5C,#3b82f6);height:100%"></div></div>
                            <div class="rep-bar-value">${formatMoneyShort(r.borxh)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="rep-table-wrap">
                <div class="rep-table-header"><h3 class="rep-table-title">👥 Klientë me borxh gjatë vitit ${viti}</h3></div>
                <div style="padding:22px 24px">
                    ${muajRows.map(r => `
                        <div class="rep-bar-row" style="margin-bottom:14px">
                            <div class="rep-bar-label">${r.label}</div>
                            <div class="rep-bar-track" style="height:22px"><div class="rep-bar-fill" style="width:${(r.klient/maxKlient*100).toFixed(1)}%;background:linear-gradient(90deg,#7c3aed,#a855f7);height:100%"></div></div>
                            <div class="rep-bar-value">${r.klient}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="rep-table-wrap">
            <div class="rep-table-header"><h3 class="rep-table-title">📋 Detaje mujore me delta</h3></div>
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
        if (STATUSET_PAGUAR.includes(r.statusi)) dege[d].paguar++;
        if (r.statusi === 'paguar_total') dege[d].paguarVal += Number(r.shuma_paguar || r.debitori_total || 0);
        if (r.statusi === 'paguar_pjesshem') dege[d].paguarVal += Number(r.shuma_paguar || 0);
    });

    const rows = Object.keys(dege).map(d => ({
        emri: d, klient: dege[d].klient, borxh: dege[d].borxh, risk: dege[d].risk,
        paguar: dege[d].paguar, paguarVal: dege[d].paguarVal,
        recovery: dege[d].klient ? (dege[d].paguar/dege[d].klient*100) : 0,
        riskRatio: dege[d].borxh ? (dege[d].risk/dege[d].borxh*100) : 0
    }));

    const sorted = sortRows(rows, 'deget', 'borxh', 'desc');
    const totalBorxh = rows.reduce((s,d) => s + d.borxh, 0);
    const maxBorxh = Math.max(...rows.map(d => d.borxh), 1);

    return `
        <div class="rep-2col left-bigger">
            <div class="rep-table-wrap">
                <div class="rep-table-header">
                    <h3 class="rep-table-title">Performanca sipas degëve</h3>
                    <input class="rep-table-search" placeholder="Kërko degë..." onkeyup="filtroTabelen(this,'#tblDeget')">
                </div>
                <table class="rep-table sortable" id="tblDeget">
                    <thead>
                        <tr>
                            <th onclick="sortTable('deget','emri')">Dega ${sortArrow('deget','emri')}</th>
                            <th class="right" onclick="sortTable('deget','klient')">Klientë ${sortArrow('deget','klient')}</th>
                            <th class="right" onclick="sortTable('deget','borxh')">Borxhi ${sortArrow('deget','borxh')}</th>
                            <th class="right">% e totalit</th>
                            <th class="right" onclick="sortTable('deget','recovery')">Recovery % ${sortArrow('deget','recovery')}</th>
                            <th class="right" onclick="sortTable('deget','riskRatio')">Risk % ${sortArrow('deget','riskRatio')}</th>
                            <th class="right" onclick="sortTable('deget','risk')">Mbi 365 ${sortArrow('deget','risk')}</th>
                            <th class="right" onclick="sortTable('deget','paguarVal')">Paguar € ${sortArrow('deget','paguarVal')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(d => `
                            <tr data-name="${esc(d.emri).toLowerCase()}">
                                <td><strong>${esc(d.emri)}</strong></td>
                                <td class="right">${d.klient}</td>
                                <td class="right"><strong>${formatMoney(d.borxh)}</strong></td>
                                <td class="right">${totalBorxh ? ((d.borxh/totalBorxh)*100).toFixed(1) : 0}%</td>
                                <td class="right" style="color:${d.recovery<20?'#ef4444':d.recovery<40?'#f59e0b':'#22c55e'};font-weight:700">${d.recovery.toFixed(1)}%<div style="font-size:9px;color:#94a3b8;font-weight:400">${d.paguar}/${d.klient}</div></td>
                                <td class="right" style="color:${d.riskRatio>30?'#ef4444':d.riskRatio>15?'#f59e0b':'#22c55e'};font-weight:600">${d.riskRatio.toFixed(1)}%</td>
                                <td class="right" style="color:${d.risk>0?'#ef4444':'#94a3b8'}">${formatMoney(d.risk)}</td>
                                <td class="right" style="color:#22c55e;font-weight:600">${formatMoney(d.paguarVal)}</td>
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
        if (STATUSET_PAGUAR.includes(r.statusi)) agj[a].paguar++;
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

    const sorted = sortRows(rows, 'agjentet', 'recovery', 'asc');
    const alarmAgj = rows.filter(a => a.iRi > 0 && a.total >= 5).sort((a,b) => b.iRi - a.iRi);

    return `
        ${alarmAgj.length > 0 ? `
            <div class="rep-alarm-box">
                <div class="rep-alarm-title">🚨 Alarm: Agjentë me klientë të pakontaktuar</div>
                <div class="rep-alarm-items">
                    ${alarmAgj.slice(0, 6).map(a => `
                        <div class="rep-alarm-item">
                            <div class="raa-name">${esc(a.emri)}</div>
                            <div class="raa-count"><strong>${a.iRi}</strong> / ${a.total} i panisur</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        <div class="rep-table-wrap">
            <div class="rep-table-header">
                <h3 class="rep-table-title">Performanca sipas agjentëve (default: Recovery Rate më i ulët lart)</h3>
                <input class="rep-table-search" placeholder="Kërko agjent..." onkeyup="filtroTabelen(this,'#tblAgjentet')">
            </div>
            <table class="rep-table sortable" id="tblAgjentet">
                <thead>
                    <tr>
                        <th onclick="sortTable('agjentet','emri')">Agjenti ${sortArrow('agjentet','emri')}</th>
                        <th>Dega</th>
                        <th class="right" onclick="sortTable('agjentet','total')">Klientë ${sortArrow('agjentet','total')}</th>
                        <th class="right" onclick="sortTable('agjentet','iRi')">I ri ⚠ ${sortArrow('agjentet','iRi')}</th>
                        <th class="right" onclick="sortTable('agjentet','borxh')">Borxhi ${sortArrow('agjentet','borxh')}</th>
                        <th class="right" onclick="sortTable('agjentet','recovery')">Recovery % ${sortArrow('agjentet','recovery')}</th>
                        <th class="right" onclick="sortTable('agjentet','risk')">Mbi 365 ${sortArrow('agjentet','risk')}</th>
                        <th class="right" onclick="sortTable('agjentet','paguarVal')">Paguar € ${sortArrow('agjentet','paguarVal')}</th>
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
        const colors = {
            i_ri:'#94a3b8', kontaktuar:'#f59e0b', premtim_pagese:'#3b82f6',
            paguar_total:'#22c55e', paguar_pjesshem:'#84cc16',
            kontestuar:'#f87171', i_pamundshem:'#dc2626'
        };
        const labels = {
            i_ri:'I ri', kontaktuar:'Kontaktuar', premtim_pagese:'Premtim',
            paguar_total:'Paguar', paguar_pjesshem:'Pjesshëm',
            kontestuar:'Kontestuar', i_pamundshem:'I pamundshëm'
        };
        return `<span style="padding:3px 9px;border-radius:12px;font-size:10px;font-weight:600;background:${colors[s]||'#e2e8f0'}20;color:${colors[s]||'#64748b'}">${labels[s]||s}</span>`;
    };

    return `
        <div class="rep-table-wrap">
            <div class="rep-table-header">
                <h3 class="rep-table-title">🏆 Top 20 klientët me borxhin më të madh</h3>
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
                        <th class="center">Aging dominant</th>
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
                            <td class="right"><strong style="font-size:13px">${formatMoney(r.debitori_total||0)}</strong></td>
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

// ============ SORTIM ============
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

function sortTable(tableKey, field) {
    const current = sortState[tableKey];
    if (current && current.field === field) {
        sortState[tableKey] = { field, dir: current.dir === 'asc' ? 'desc' : 'asc' };
    } else {
        sortState[tableKey] = { field, dir: 'desc' };
    }
    renderRaportiDebitoret();
}

function sortArrow(tableKey, field) {
    const s = sortState[tableKey];
    if (!s || s.field !== field) return '';
    return s.dir === 'asc' ? '▲' : '▼';
}

// ============ RINOVIMET (placeholder — sesioni i ardhshem) ============
function renderRaportiRinovimet() {
    const container = document.getElementById('repRinContent');
    if (!container) return;
    container.innerHTML = `<div class="rep-coming-soon"><div class="rep-cs-icon">🔄</div><div class="rep-cs-title">Raporti i Rinovimeve</div><div class="rep-cs-text">Do të rindërtohet me strukturën e re të Debitorëve në sesionin e ardhshëm.</div></div>`;
}

// ============ EXPORT ============
function eksportoRaportin(modul) {
    let data = [], filename = '';
    if (modul === 'debitoret') {
        const viti = document.getElementById('repDebViti').value;
        const muaji = document.getElementById('repDebMuaji').value;
        let raw = [];
        try { raw = JSON.parse(localStorage.getItem('debitoret_data_v1') || '[]'); } catch {}
        raw = filtroSipasRolit(raw);
        data = filterDebData(raw, viti, muaji).map(r => ({
            Muaji: r.muaji, Klienti: r.klienti, Dega: r.dega, Agjenti: r.agjenti,
            'Borxhi total': r.debitori_total, 'Mbi 365': r.borxh_mbi_365, Statusi: r.statusi
        }));
        filename = `raport_debitoret_${viti}_${muaji}.xlsx`;
    }
    if (modul === 'rinovimet') { alert('Së shpejti'); return; }
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