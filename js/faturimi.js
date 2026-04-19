let klientet = JSON.parse(localStorage.getItem('faturimi_klientet')) || [];
let editIndex = -1;
let tabAktual = 'mujor';

const muajt = ['', 'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
                'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];
const STATUS_NGJYRA = { asgje:'#94a3b8', kerkesa:'#f59e0b', process:'#3b82f6', leshuar:'#22c55e' };

function parseDate(data) {
    if (!data) return null;
    if (data.includes('/')) { const [d,m,y] = data.split('/'); return new Date(y+'-'+m+'-'+d); }
    return new Date(data);
}
function formatData(data) {
    if (!data) return '-';
    if (data.includes('-') && data.split('-')[0].length === 4) { const [y,m,d] = data.split('-'); return d+'/'+m+'/'+y; }
    return data;
}
function llogaritSkadon(dm) {
    if (!dm) return { teksti:'-', klasa:'', dite:9999 };
    const dite = Math.ceil((parseDate(dm) - new Date()) / 86400000);
    if (dite < 0) return { teksti:Math.abs(dite)+'d', klasa:'skadon-expired', dite };
    if (dite <= 35) return { teksti:dite+'d', klasa:'skadon-warning', dite };
    return { teksti:dite+'d', klasa:'skadon-ok', dite };
}
function eshteAktive(k) {
    if (!k.dataMbarimit) return true;
    return Math.ceil((parseDate(k.dataMbarimit) - new Date()) / 86400000) >= 0;
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
    ['m-emri','m-kontrata-nr','m-data-fillimit','m-data-mbarimit','m-email'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('m-dergesa').value = 'email';
    document.getElementById('m-faturimi-lloji').value = 'mujor';
    document.querySelectorAll('.lloji-btn').forEach((b,i) => b.classList.toggle('active', i===0));
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
    document.querySelectorAll('.lloji-btn')[(k.faturimiLloji==='vjetor')?1:0].classList.add('active');
    document.getElementById('modal-overlay').classList.add('active');
}
function ruajKlient() {
    const emri = document.getElementById('m-emri').value.trim();
    if (!emri) { alert('Ju lutem shkruani emrin!'); return; }
    const klienti = {
        emri, kontrataНр: document.getElementById('m-kontrata-nr').value.trim(),
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
function fshijKlient(index) { if (confirm('A jeni i sigurt?')) { klientet.splice(index,1); ruajNeStorage(); renderTabela(); } }
function zgjidhFaturimin(lloji,btn) {
    document.getElementById('m-faturimi-lloji').value = lloji;
    btn.parentElement.querySelectorAll('.lloji-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// ====== STATUS ======
function ndryshoStatusMuaj(ki, muaji, vlera) {
    if (!klientet[ki].statuset) klientet[ki].statuset = {};
    klientet[ki].statuset[muaji] = vlera;
    ruajNeStorage(); renderTabela();
}

// ====== EMAIL — ndrysho statusin në 'kerkesa' kur dërgohet ======
function dergoEmail(index) {
    const k = klientet[index];
    if (!k.email) { alert('Ky klient nuk ka email!'); return; }
    const muaji = parseInt(document.getElementById('filter-muaji').value) || muajiAktual();
    const subject = encodeURIComponent('Kërkesë për listën e të siguruarve - ' + muajt[muaji]);
    const body = encodeURIComponent('I nderuar ' + k.emri + ',\n\nJu lutem na dërgoni listën e përditësuar të të siguruarve për muajin ' + muajt[muaji] + '.\n\nNr. Kontratës: ' + (k.kontrataНр || 'N/A') + '\n\nFaleminderit,\nDepartamenti i Sigurimeve Shëndetësore\nSigal Insurance Group');
    window.open('mailto:' + k.email + '?subject=' + subject + '&body=' + body);
    // Auto-ndrysho statusin në 'kerkesa' nëse është 'asgje'
    if (!klientet[index].statuset) klientet[index].statuset = {};
    if (!klientet[index].statuset[muaji] || klientet[index].statuset[muaji] === 'asgje') {
        klientet[index].statuset[muaji] = 'kerkesa';
        ruajNeStorage(); renderTabela();
    }
}
function zgjidhTeGjitha(checked) { document.querySelectorAll('.klient-check').forEach(cb => cb.checked = checked); perditesoEmailBtn(); }
function perditesoEmailBtn() {
    const n = document.querySelectorAll('.klient-check:checked').length;
    const btn = document.getElementById('btn-dergo-email');
    document.getElementById('count-zgjedhur').textContent = n;
    btn.style.display = n > 0 ? 'inline-flex' : 'none';
}
function dergoEmailZgjedhurve() {
    const muaji = parseInt(document.getElementById('filter-muaji').value) || muajiAktual();
    const emails = [], indices = [];
    document.querySelectorAll('.klient-check:checked').forEach(cb => {
        const idx = parseInt(cb.dataset.index);
        const k = klientet[idx];
        if (k && k.email) { emails.push(k.email); indices.push(idx); }
    });
    if (emails.length === 0) { alert('Asnjë klient nuk ka email!'); return; }
    const subject = encodeURIComponent('Kërkesë për listën e të siguruarve - ' + muajt[muaji]);
    const body = encodeURIComponent('Të nderuar,\n\nJu lutem na dërgoni listën e përditësuar të të siguruarve për muajin ' + muajt[muaji] + '.\n\nFaleminderit,\nDepartamenti i Sigurimeve Shëndetësore\nSigal Insurance Group');
    window.open('mailto:' + emails.join(',') + '?subject=' + subject + '&body=' + body);
    // Auto-ndrysho statusin për të gjithë
    indices.forEach(idx => {
        if (!klientet[idx].statuset) klientet[idx].statuset = {};
        if (!klientet[idx].statuset[muaji] || klientet[idx].statuset[muaji] === 'asgje') {
            klientet[idx].statuset[muaji] = 'kerkesa';
        }
    });
    ruajNeStorage(); renderTabela();
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

    // Vetëm aktive
    const aktive = klientetRolit.filter(k => eshteAktive(k));
    const mujorCount = aktive.filter(k => k.faturimiLloji !== 'vjetor').length;
    const vjetorCount = aktive.filter(k => k.faturimiLloji === 'vjetor').length;
    document.getElementById('tab-count-mujor').textContent = mujorCount;
    document.getElementById('tab-count-vjetor').textContent = vjetorCount;

    // Sipas tab-it
    const bazaList = aktive.filter(k => tabAktual === 'vjetor' ? k.faturimiLloji === 'vjetor' : k.faturimiLloji !== 'vjetor');

    // Filtro
    const filtered = bazaList.filter(k => {
        const searchOk = k.emri.toLowerCase().includes(search);
        const sm = k.statuset?.[filterMuaji] || 'asgje';
        const statusOk = filterStatus === 'all' || sm === filterStatus;
        const vitiOk = filterViti === 'all' || (k.dataFillimit || '').startsWith(filterViti);
        const krijuarOk = filterKrijuar === 'all' || (k.krijuarNgaEmri || k.krijuarNga || '') === filterKrijuar;
        return searchOk && statusOk && vitiOk && krijuarOk;
    });

    // Sort sipas skadon
    const sorted = [...filtered].sort((a,b) => {
        if (!a.dataMbarimit) return 1; if (!b.dataMbarimit) return -1;
        return parseDate(a.dataMbarimit) - parseDate(b.dataMbarimit);
    });

    // ====== STATS ======
    const stTotal = bazaList.length;
    const stAsgje = bazaList.filter(k => (k.statuset?.[filterMuaji]||'asgje') === 'asgje').length;
    const stKerkesa = bazaList.filter(k => (k.statuset?.[filterMuaji]||'asgje') === 'kerkesa').length;
    const stProcess = bazaList.filter(k => (k.statuset?.[filterMuaji]||'asgje') === 'process').length;
    const stLeshuar = bazaList.filter(k => (k.statuset?.[filterMuaji]||'asgje') === 'leshuar').length;
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
        const pL = Math.round(stLeshuar/stTotal*100), pP = Math.round(stProcess/stTotal*100), pK = Math.round(stKerkesa/stTotal*100), pA = 100-pL-pP-pK;
        barEl.innerHTML =
            '<div class="strip-bar-seg" style="width:'+pL+'%;background:#4ade80;"></div>' +
            '<div class="strip-bar-seg" style="width:'+pP+'%;background:#60a5fa;"></div>' +
            '<div class="strip-bar-seg" style="width:'+pK+'%;background:#fbbf24;"></div>' +
            '<div class="strip-bar-seg" style="width:'+pA+'%;background:#94a3b8;"></div>';
        legEl.innerHTML =
            '<span><span class="sl-dot" style="background:#4ade80;"></span>Lëshuar</span>' +
            '<span><span class="sl-dot" style="background:#60a5fa;"></span>Proces</span>' +
            '<span><span class="sl-dot" style="background:#fbbf24;"></span>Kërkesë</span>' +
            '<span><span class="sl-dot" style="background:#94a3b8;"></span>Asgjë</span>';
    } else {
        barEl.innerHTML = '<div class="strip-bar-seg" style="width:100%;background:rgba(255,255,255,.08);border-radius:3px;"></div>';
        legEl.innerHTML = '';
    }

    // Filter krijuar nga
    const krijuarSet = new Set();
    klientetRolit.forEach(k => { if (k.krijuarNgaEmri || k.krijuarNga) krijuarSet.add(k.krijuarNgaEmri || k.krijuarNga); });
    const krijuarEl = document.getElementById('filter-krijuar');
    const krijuarVal = krijuarEl.value;
    krijuarEl.innerHTML = '<option value="all">Të gjithë agjentët</option>' + [...krijuarSet].map(k => '<option value="'+k+'"'+(k===krijuarVal?' selected':'')+'>'+k+'</option>').join('');

    // ====== TABELA ======
    const tbody = document.getElementById('faturimi-tbody');
    if (sorted.length === 0) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#888;">Nuk ka të dhëna.</td></tr>'; return; }

    const dergesaLabels = { email:'Email', direkt:'Direkt', poste:'Postë' };

    tbody.innerHTML = sorted.map(k => {
        const idx = klientet.indexOf(k);
        const sk = llogaritSkadon(k.dataMbarimit);
        const muajiZ = filterMuaji;
        const stAkt = k.statuset?.[muajiZ] || 'asgje';
        const nrId = k.nrPersonal || k.nrBiznesit || k.kontrataНр || '-';
        const krijNga = k.krijuarNgaEmri || k.krijuarNga || '';
        let dotC = '#22c55e'; if (sk.klasa==='skadon-warning') dotC='#f59e0b'; if (sk.klasa==='skadon-expired') dotC='#ef4444';

        // Muaji dropdown me dots ngjyrë
        let muajiOpts = muajt.slice(1).map((m,i) => {
            const mNr = i+1;
            const mSt = k.statuset?.[mNr] || 'asgje';
            const dot = '\u25CF '; // ● karakter
            return '<option value="'+mNr+'"'+(mNr===muajiZ?' selected':'')+' style="color:'+STATUS_NGJYRA[mSt]+'">'+dot+m+'</option>';
        }).join('');

        return '<tr>' +
            '<td><input type="checkbox" class="klient-check" data-index="'+idx+'" onchange="perditesoEmailBtn()"></td>' +
            '<td><div class="klient-name">'+k.emri+'</div><div class="klient-sub">'+(krijNga?krijNga+' · ':'')+dergesaLabels[k.dergesa||'email']+(k.email?' · '+k.email:'')+'</div></td>' +
            '<td style="font-size:11px;color:#6b7a8d;">'+nrId+'</td>' +
            '<td style="font-size:11px;color:#6b7a8d;">'+formatData(k.dataFillimit)+' → '+formatData(k.dataMbarimit)+'</td>' +
            '<td><div class="skadon-cell"><span class="skadon-dot" style="background:'+dotC+';"></span>'+sk.teksti+'</div></td>' +
            '<td><select class="muaji-select" style="color:'+STATUS_NGJYRA[stAkt]+';font-weight:600;border-color:'+(STATUS_NGJYRA[stAkt]||'#e5e9f0')+'" onchange="document.getElementById(\'filter-muaji\').value=this.value;filtroKlientet();">'+muajiOpts+'</select></td>' +
            '<td><div class="status-circles">' +
                sDot('asgje',stAkt,idx,muajiZ) + sDot('kerkesa',stAkt,idx,muajiZ) + sDot('process',stAkt,idx,muajiZ) + sDot('leshuar',stAkt,idx,muajiZ) +
            '</div></td>' +
            '<td style="text-align:right;"><div class="action-icon-btns" style="justify-content:flex-end;">' +
                '<button onclick="editoKlient('+idx+')" title="Modifiko"><i data-lucide="pencil"></i></button>' +
                '<button onclick="dergoEmail('+idx+')" title="Email"><i data-lucide="mail"></i></button>' +
                '<button onclick="fshijKlient('+idx+')" title="Fshi"><i data-lucide="trash-2"></i></button>' +
            '</div></td>' +
        '</tr>';
    }).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function sDot(status, aktual, idx, muaji) {
    const isA = aktual === status;
    const bg = isA ? STATUS_NGJYRA[status] : '#e2e8f0';
    const sc = isA ? '#fff' : '#94a3b8';
    const icons = {
        asgje:'<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
        kerkesa:'<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/>',
        process:'<path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/>',
        leshuar:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>'
    };
    return '<span class="status-dot'+(isA?' active':'')+'" title="'+status+'" onclick="ndryshoStatusMuaj('+idx+','+muaji+',\''+status+'\')" style="background:'+bg+'"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="'+sc+'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'+icons[status]+'</svg></span>';
}

// ====== DATE INPUT ======
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('filter-muaji').value = muajiAktual();
    document.getElementById('m-data-fillimit').addEventListener('input', function() {
        let v = this.value.replace(/\D/g,'').slice(0,8);
        if (v.length>=3) v=v.slice(0,2)+'/'+v.slice(2);
        if (v.length>=6) v=v.slice(0,5)+'/'+v.slice(5);
        this.value = v;
        if (v.length === 10) {
            const [d,m,y] = v.split('/');
            const f = new Date(y+'-'+m+'-'+d); if (isNaN(f)) return;
            const mb = new Date(f); mb.setFullYear(mb.getFullYear()+1); mb.setDate(mb.getDate()-1);
            document.getElementById('m-data-mbarimit').value = String(mb.getDate()).padStart(2,'0')+'/'+String(mb.getMonth()+1).padStart(2,'0')+'/'+mb.getFullYear();
        }
    });
    document.getElementById('m-data-mbarimit').addEventListener('input', function() {
        let v = this.value.replace(/\D/g,'').slice(0,8);
        if (v.length>=3) v=v.slice(0,2)+'/'+v.slice(2);
        if (v.length>=6) v=v.slice(0,5)+'/'+v.slice(5);
        this.value = v;
    });
    renderTabela();
});