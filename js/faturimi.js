let klientet = JSON.parse(localStorage.getItem('faturimi_klientet')) || [];
let editIndex = -1;
let tabAktual = 'mujor';

const muajt = ['', 'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
                'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];

function parseDate(data) {
    if (!data) return null;
    if (data.includes('/')) { const [d, m, y] = data.split('/'); return new Date(`${y}-${m}-${d}`); }
    return new Date(data);
}
function formatData(data) {
    if (!data) return '-';
    if (data.includes('-') && data.split('-')[0].length === 4) { const [y, m, d] = data.split('-'); return `${d}/${m}/${y}`; }
    return data;
}
function llogaritSkadon(dataMbarimit) {
    if (!dataMbarimit) return { teksti: '-', klasa: '', dite: 9999 };
    const dite = Math.ceil((parseDate(dataMbarimit) - new Date()) / (1000 * 60 * 60 * 24));
    if (dite < 0) return { teksti: Math.abs(dite) + 'd', klasa: 'skadon-expired', dite };
    if (dite <= 35) return { teksti: dite + 'd', klasa: 'skadon-warning', dite };
    return { teksti: dite + 'd', klasa: 'skadon-ok', dite };
}
function eshteAktive(k) {
    if (!k.dataMbarimit) return true;
    const dite = Math.ceil((parseDate(k.dataMbarimit) - new Date()) / (1000 * 60 * 60 * 24));
    return dite >= 0;
}
function muajiAktual() { return new Date().getMonth() + 1; }
function ruajNeStorage() { localStorage.setItem('faturimi_klientet', JSON.stringify(klientet)); }

// ====== TABS ======
function ndryshoTab(tab) {
    tabAktual = tab;
    document.getElementById('tab-mujor').classList.toggle('active', tab === 'mujor');
    document.getElementById('tab-vjetor').classList.toggle('active', tab === 'vjetor');
    renderTabela();
}

// ====== MODAL ======
function shtoKlient() {
    editIndex = -1;
    document.getElementById('modal-title').textContent = 'Shto Klient';
    document.getElementById('m-emri').value = '';
    document.getElementById('m-kontrata-nr').value = '';
    document.getElementById('m-data-fillimit').value = '';
    document.getElementById('m-data-mbarimit').value = '';
    document.getElementById('m-dergesa').value = 'email';
    document.getElementById('m-email').value = '';
    document.getElementById('m-faturimi-lloji').value = 'mujor';
    document.querySelectorAll('.lloji-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
    document.getElementById('modal-overlay').classList.add('active');
}
function mbyllModal() { document.getElementById('modal-overlay').classList.remove('active'); }
function editoKlient(index) {
    editIndex = index; const k = klientet[index];
    document.getElementById('modal-title').textContent = 'Edito Klient';
    document.getElementById('m-emri').value = k.emri;
    document.getElementById('m-kontrata-nr').value = k.kontrataНр || k.nrPersonal || k.nrBiznesit || '';
    document.getElementById('m-data-fillimit').value = k.dataFillimit || '';
    document.getElementById('m-data-mbarimit').value = k.dataMbarimit || '';
    document.getElementById('m-dergesa').value = k.dergesa || 'email';
    document.getElementById('m-email').value = k.email || '';
    document.getElementById('m-faturimi-lloji').value = k.faturimiLloji || 'mujor';
    document.querySelectorAll('.lloji-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.lloji-btn')[(k.faturimiLloji === 'vjetor') ? 1 : 0].classList.add('active');
    document.getElementById('modal-overlay').classList.add('active');
}
function ruajKlient() {
    const emri = document.getElementById('m-emri').value.trim();
    if (!emri) { alert('Ju lutem shkruani emrin e klientit!'); return; }
    const klienti = {
        emri,
        kontrataНр: document.getElementById('m-kontrata-nr').value.trim(),
        dataFillimit: document.getElementById('m-data-fillimit').value,
        dataMbarimit: document.getElementById('m-data-mbarimit').value,
        dergesa: document.getElementById('m-dergesa').value,
        email: document.getElementById('m-email').value.trim(),
        faturimiLloji: document.getElementById('m-faturimi-lloji').value,
        statuset: {}
    };
    if (editIndex >= 0) { klienti.statuset = klientet[editIndex].statuset || {}; klientet[editIndex] = klienti; }
    else { klientet.push(klienti); }
    ruajNeStorage(); mbyllModal(); renderTabela();
}
function fshijKlient(index) { if (confirm('A jeni i sigurt?')) { klientet.splice(index, 1); ruajNeStorage(); renderTabela(); } }
function zgjidhFaturimin(lloji, btn) {
    document.getElementById('m-faturimi-lloji').value = lloji;
    btn.parentElement.querySelectorAll('.lloji-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// ====== STATUS ======
function ndryshoStatusMuaj(klientIndex, muaji, vlera) {
    if (!klientet[klientIndex].statuset) klientet[klientIndex].statuset = {};
    klientet[klientIndex].statuset[muaji] = vlera;
    ruajNeStorage(); renderTabela();
}

// ====== EMAIL ======
function dergoEmail(index) {
    const k = klientet[index];
    if (!k.email) { alert('Ky klient nuk ka email!'); return; }
    const muajiAkt = muajiAktual();
    const subject = encodeURIComponent(`Kërkesë për listën e të siguruarve - ${muajt[muajiAkt]}`);
    const body = encodeURIComponent(`I nderuar ${k.emri},\n\nJu lutem na dërgoni listën e përditësuar të të siguruarve për muajin ${muajt[muajiAkt]}.\n\nNr. Kontratës: ${k.kontrataНр || 'N/A'}\n\nFaleminderit,\nDepartamenti i Sigurimeve Shëndetësore\nSigal Insurance Group`);
    window.open(`mailto:${k.email}?subject=${subject}&body=${body}`);
}
function zgjidhTeGjitha(checked) { document.querySelectorAll('.klient-check').forEach(cb => cb.checked = checked); perditesoEmailBtn(); }
function perditesoEmailBtn() {
    const zgjedhur = document.querySelectorAll('.klient-check:checked').length;
    const btn = document.getElementById('btn-dergo-email');
    const count = document.getElementById('count-zgjedhur');
    if (zgjedhur > 0) { btn.style.display = 'inline-flex'; count.textContent = zgjedhur; }
    else { btn.style.display = 'none'; }
}
function dergoEmailZgjedhurve() {
    const emails = [];
    document.querySelectorAll('.klient-check:checked').forEach(cb => {
        const k = klientet[parseInt(cb.dataset.index)];
        if (k && k.email) emails.push(k.email);
    });
    if (emails.length === 0) { alert('Asnjë klient i zgjedhur nuk ka email!'); return; }
    const muajiAkt = muajiAktual();
    const subject = encodeURIComponent('Kërkesë për listën e të siguruarve - ' + muajt[muajiAkt]);
    const body = encodeURIComponent('Të nderuar,\n\nJu lutem na dërgoni listën e përditësuar të të siguruarve për muajin ' + muajt[muajiAkt] + '.\n\nFaleminderit,\nDepartamenti i Sigurimeve Shëndetësore\nSigal Insurance Group');
    window.open('mailto:' + emails.join(',') + '?subject=' + subject + '&body=' + body);
}

// ====== FILTER + RENDER ======
function filtroKlientet() { renderTabela(); }

function renderTabela() {
    const filterStatus = document.getElementById('filter-status').value;
    const filterMuaji = parseInt(document.getElementById('filter-muaji').value) || muajiAktual();
    const search = document.getElementById('search-klient').value.toLowerCase();
    const filterViti = document.getElementById('filter-viti').value;
    const filterKrijuar = document.getElementById('filter-krijuar').value;

    const klientetRolit = typeof filtroSipasRolit === 'function' ? filtroSipasRolit(klientet, 'krijuarNga') : klientet;

    // Vetëm kontrata aktive
    const aktive = klientetRolit.filter(k => eshteAktive(k));

    // Tab counts
    const mujorCount = aktive.filter(k => k.faturimiLloji !== 'vjetor').length;
    const vjetorCount = aktive.filter(k => k.faturimiLloji === 'vjetor').length;
    document.getElementById('tab-count-mujor').textContent = mujorCount;
    document.getElementById('tab-count-vjetor').textContent = vjetorCount;

    // Filtro sipas tab-it
    const bazaList = aktive.filter(k => tabAktual === 'vjetor' ? k.faturimiLloji === 'vjetor' : k.faturimiLloji !== 'vjetor');

    // Filtro më tej
    const filtered = bazaList.filter(k => {
        const searchOk = k.emri.toLowerCase().includes(search);
        const statusMuaj = k.statuset?.[filterMuaji] || 'asgje';
        const statusOk = filterStatus === 'all' || statusMuaj === filterStatus;
        const vitiOk = filterViti === 'all' || (k.dataFillimit || '').startsWith(filterViti);
        const krijuarOk = filterKrijuar === 'all' || (k.krijuarNgaEmri || k.krijuarNga || '') === filterKrijuar;
        return searchOk && statusOk && vitiOk && krijuarOk;
    });

    // Sort sipas skadon
    const sorted = [...filtered].sort((a, b) => {
        if (!a.dataMbarimit) return 1;
        if (!b.dataMbarimit) return -1;
        return parseDate(a.dataMbarimit) - parseDate(b.dataMbarimit);
    });

    // ====== STATS (për muajin e zgjedhur, vetëm bazaList) ======
    const stTotal = bazaList.length;
    const stAsgje = bazaList.filter(k => (k.statuset?.[filterMuaji] || 'asgje') === 'asgje').length;
    const stKerkesa = bazaList.filter(k => (k.statuset?.[filterMuaji] || 'asgje') === 'kerkesa').length;
    const stProcess = bazaList.filter(k => (k.statuset?.[filterMuaji] || 'asgje') === 'process').length;
    const stLeshuar = bazaList.filter(k => (k.statuset?.[filterMuaji] || 'asgje') === 'leshuar').length;

    document.getElementById('st-total').textContent = stTotal;
    document.getElementById('st-asgje').textContent = stAsgje;
    document.getElementById('st-kerkesa').textContent = stKerkesa;
    document.getElementById('st-process').textContent = stProcess;
    document.getElementById('st-leshuar').textContent = stLeshuar;

    // Llojet chips
    document.getElementById('st-llojet').innerHTML =
        '<span class="strip-chip"><span class="sc-num">' + mujorCount + '</span> Mujor</span>' +
        '<span class="strip-chip"><span class="sc-num">' + vjetorCount + '</span> Vjetor</span>';

    // Funnel bar
    const barEl = document.getElementById('st-bar');
    const legEl = document.getElementById('st-legend');
    if (stTotal > 0) {
        const pL = Math.round(stLeshuar / stTotal * 100);
        const pP = Math.round(stProcess / stTotal * 100);
        const pK = Math.round(stKerkesa / stTotal * 100);
        const pA = 100 - pL - pP - pK;
        barEl.innerHTML =
            '<div class="strip-bar-seg" style="width:' + pL + '%;background:#4ade80;border-radius:3px 0 0 3px;"></div>' +
            '<div class="strip-bar-seg" style="width:' + pP + '%;background:#60a5fa;"></div>' +
            '<div class="strip-bar-seg" style="width:' + pK + '%;background:#fbbf24;"></div>' +
            '<div class="strip-bar-seg" style="width:' + pA + '%;background:#94a3b8;border-radius:0 3px 3px 0;"></div>';
        legEl.innerHTML =
            '<span><span class="sl-dot" style="background:#4ade80;"></span>Lëshuar</span>' +
            '<span><span class="sl-dot" style="background:#60a5fa;"></span>Proces</span>' +
            '<span><span class="sl-dot" style="background:#fbbf24;"></span>Kërkesë</span>' +
            '<span><span class="sl-dot" style="background:#94a3b8;"></span>Asgjë</span>';
    } else {
        barEl.innerHTML = '<div class="strip-bar-seg" style="width:100%;background:rgba(255,255,255,0.08);border-radius:3px;"></div>';
        legEl.innerHTML = '';
    }

    // Populo filter krijuar nga
    const krijuarSet = new Set();
    klientetRolit.forEach(k => { if (k.krijuarNgaEmri || k.krijuarNga) krijuarSet.add(k.krijuarNgaEmri || k.krijuarNga); });
    const krijuarEl = document.getElementById('filter-krijuar');
    const krijuarVal = krijuarEl.value;
    krijuarEl.innerHTML = '<option value="all">Të gjithë agjentët</option>' + [...krijuarSet].map(k => '<option value="' + k + '"' + (k === krijuarVal ? ' selected' : '') + '>' + k + '</option>').join('');

    // ====== TABELA ======
    const tbody = document.getElementById('faturimi-tbody');

    if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#888;">Nuk ka të dhëna.</td></tr>';
        return;
    }

    const dergesaLabels = { email: 'Email', direkt: 'Direkt', poste: 'Postë' };

    tbody.innerHTML = sorted.map(k => {
        const idx = klientet.indexOf(k);
        const skadon = llogaritSkadon(k.dataMbarimit);
        const muajiZgjedhur = filterMuaji;
        const statusAktual = k.statuset?.[muajiZgjedhur] || 'asgje';
        const nrId = k.nrPersonal || k.nrBiznesit || k.kontrataНр || '-';
        const krijuarNga = k.krijuarNgaEmri || k.krijuarNga || '';
        let dotColor = '#22c55e';
        if (skadon.klasa === 'skadon-warning') dotColor = '#f59e0b';
        if (skadon.klasa === 'skadon-expired') dotColor = '#ef4444';

        const muajiOptions = muajt.slice(1).map((m, i) => {
            const muajNr = i + 1;
            return '<option value="' + muajNr + '"' + (muajNr === muajiZgjedhur ? ' selected' : '') + '>' + m + '</option>';
        }).join('');

        return '<tr>' +
            '<td><input type="checkbox" class="klient-check" data-index="' + idx + '" onchange="perditesoEmailBtn()"></td>' +
            '<td><div class="klient-name">' + k.emri + '</div><div class="klient-sub">' + (krijuarNga ? krijuarNga + ' · ' : '') + (dergesaLabels[k.dergesa] || k.dergesa) + (k.email ? ' · ' + k.email : '') + '</div></td>' +
            '<td style="font-size:11px;color:#6b7a8d;">' + nrId + '</td>' +
            '<td style="font-size:11px;color:#6b7a8d;">' + formatData(k.dataFillimit) + ' → ' + formatData(k.dataMbarimit) + '</td>' +
            '<td><div class="skadon-cell"><span class="skadon-dot" style="background:' + dotColor + ';"></span>' + skadon.teksti + '</div></td>' +
            '<td><select class="muaji-select" onchange="document.getElementById(\'filter-muaji\').value=this.value;filtroKlientet();">' + muajiOptions + '</select></td>' +
            '<td><div class="status-circles">' +
                statusDot('asgje', statusAktual, idx, muajiZgjedhur, '#94a3b8', '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>') +
                statusDot('kerkesa', statusAktual, idx, muajiZgjedhur, '#f59e0b', '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>') +
                statusDot('process', statusAktual, idx, muajiZgjedhur, '#0047AB', '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>') +
                statusDot('leshuar', statusAktual, idx, muajiZgjedhur, '#22c55e', '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>') +
            '</div></td>' +
            '<td><div class="action-icon-btns">' +
                '<button onclick="editoKlient(' + idx + ')" title="Edito"><svg viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>' +
                '<button onclick="fshijKlient(' + idx + ')" title="Fshi"><svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>' +
                '<button onclick="dergoEmail(' + idx + ')" title="Dërgo Email"><svg viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></button>' +
            '</div></td>' +
        '</tr>';
    }).join('');
}

function statusDot(status, aktual, idx, muaji, color, svgIcon) {
    const isActive = aktual === status;
    const bg = isActive ? color : '#e2e8f0';
    const strokeColor = isActive ? '#fff' : '#94a3b8';
    const svg = svgIcon.replace(/stroke-width/g, 'stroke="' + strokeColor + '" stroke-width');
    return '<span class="status-dot' + (isActive ? ' active' : '') + '" title="' + status + '" onclick="ndryshoStatusMuaj(' + idx + ',' + muaji + ',\'' + status + '\')" style="background:' + bg + '">' + svg + '</span>';
}

// ====== DATE INPUT FORMATTING ======
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('filter-muaji').value = muajiAktual();
    document.getElementById('m-data-fillimit').addEventListener('input', function() {
        let v = this.value.replace(/\D/g, '').slice(0, 8);
        if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
        if (v.length >= 6) v = v.slice(0, 5) + '/' + v.slice(5);
        this.value = v;
        if (v.length === 10) {
            const [d, m, y] = v.split('/');
            const fillimi = new Date(`${y}-${m}-${d}`);
            if (isNaN(fillimi)) return;
            const mbarimi = new Date(fillimi);
            mbarimi.setFullYear(mbarimi.getFullYear() + 1);
            mbarimi.setDate(mbarimi.getDate() - 1);
            document.getElementById('m-data-mbarimit').value =
                String(mbarimi.getDate()).padStart(2, '0') + '/' +
                String(mbarimi.getMonth() + 1).padStart(2, '0') + '/' +
                mbarimi.getFullYear();
        }
    });
    document.getElementById('m-data-mbarimit').addEventListener('input', function() {
        let v = this.value.replace(/\D/g, '').slice(0, 8);
        if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
        if (v.length >= 6) v = v.slice(0, 5) + '/' + v.slice(5);
        this.value = v;
    });
    renderTabela();
});