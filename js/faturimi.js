function llogaritSkadon(dataMbarimit) {
    if (!dataMbarimit) return { teksti: '-', klasa: '' };
    const tani = new Date();
    const skadon = new Date(dataMbarimit);
    const diferencaDite = Math.ceil((skadon - tani) / (1000 * 60 * 60 * 24));

    if (diferencaDite < 0) return { teksti: `Skaduar ${Math.abs(diferencaDite)} ditë`, klasa: 'skadon-expired' };
    if (diferencaDite <= 35) return { teksti: `⚠️ ${diferencaDite} ditë`, klasa: 'skadon-warning' };
    return { teksti: `${diferencaDite} ditë`, klasa: 'skadon-ok' };
}let klientet = JSON.parse(localStorage.getItem('faturimi_klientet')) || [];
let editIndex = -1; let tabAktual = 'mujor';

function ndryshoTab(tab) {
    tabAktual = tab;
    document.getElementById('tab-mujor').classList.toggle('active', tab === 'mujor');
    document.getElementById('tab-vjetor').classList.toggle('active', tab === 'vjetor');
    renderTabela();
}
let statusIndex = -1;

const muajt = ['', 'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
                'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'];

function ruajNeStorage() {
    localStorage.setItem('faturimi_klientet', JSON.stringify(klientet));
}

function shtoKlient() {
    editIndex = -1;
    document.getElementById('modal-title').textContent = 'Shto Klient';
    document.getElementById('m-emri').value = '';
    document.getElementById('m-kontrata-nr').value = '';
    document.getElementById('m-data-fillimit').value = '';
    document.getElementById('m-data-mbarimit').value = '';
    document.getElementById('m-dergesa').value = 'email';
    document.getElementById('m-email').value = '';
    document.getElementById('m-afati').value = '';
    document.getElementById('modal-overlay').classList.add('active');
}

function mbyllModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

function mbyllStatusModal() {
    document.getElementById('status-overlay').classList.remove('active');
}

function ruajKlient() {
    const emri = document.getElementById('m-emri').value.trim();
    const kontrataНр = document.getElementById('m-kontrata-nr').value.trim();
    const dataFillimit = document.getElementById('m-data-fillimit').value;
    const dataMbarimit = document.getElementById('m-data-mbarimit').value;
    const dergesa = document.getElementById('m-dergesa').value;
    const email = document.getElementById('m-email').value.trim();
    const afati = document.getElementById('m-afati').value;

    if (!emri) { alert('Ju lutem shkruani emrin e klientit!'); return; }

    const faturimiLloji = document.getElementById('m-faturimi-lloji').value;

    const klienti = {
        emri, kontrataНр, dataFillimit, dataMbarimit,
        dergesa, email, afati, faturimiLloji,
        statuset: {}
    };

    if (editIndex >= 0) {
        klienti.statuset = klientet[editIndex].statuset;
        klientet[editIndex] = klienti;
    } else {
        klientet.push(klienti);
    }

    ruajNeStorage();
    mbyllModal();
    renderTabela();
}

function fshijKlient(index) {
    if (confirm('A jeni i sigurt që doni të fshini këtë klient?')) {
        klientet.splice(index, 1);
        ruajNeStorage();
        renderTabela();
    }
}

function editoKlient(index) {
    editIndex = index;
    const k = klientet[index];
    document.getElementById('modal-title').textContent = 'Edito Klient';
    document.getElementById('m-emri').value = k.emri;
    document.getElementById('m-kontrata-nr').value = k.kontrataНр || '';
    document.getElementById('m-data-fillimit').value = k.dataFillimit || '';
    document.getElementById('m-data-mbarimit').value = k.dataMbarimit || '';
    document.getElementById('m-dergesa').value = k.dergesa;
    document.getElementById('m-email').value = k.email;
    document.getElementById('m-afati').value = k.afati || '';
    document.getElementById('modal-overlay').classList.add('active');
}
function ndryshoStatusMuaj(klientIndex, muaji, vlera) {
    if (!klientet[klientIndex].statuset) {
        klientet[klientIndex].statuset = {};
    }
    klientet[klientIndex].statuset[muaji] = vlera;
    ruajNeStorage();
    renderTabela();
}

function muajiAktual() {
    return new Date().getMonth() + 1;
}

function filtroKlientet() {
    renderTabela();
}

function renderTabela() {
    const filterStatus = document.getElementById('filter-status').value;
    const filterMuaji = parseInt(document.getElementById('filter-muaji').value) || muajiAktual();
    const search = document.getElementById('search-klient').value.toLowerCase();

    const filtered = klientet.filter((k, i) => {
        const searchOk = k.emri.toLowerCase().includes(search);
        const statusMuaj = k.statuset?.[filterMuaji] || 'asgje';
        const statusOk = filterStatus === 'all' || statusMuaj === filterStatus;
        const llojiOk = tabAktual === 'vjetor' ? k.faturimiLloji === 'vjetor' : k.faturimiLloji !== 'vjetor';
        return searchOk && statusOk && llojiOk;
    });

    // Update counts per muajin e zgjedhur
    const muajiFilter = filterMuaji;
    document.getElementById('count-asgje').textContent = klientet.filter(k => (k.statuset?.[muajiFilter] || 'asgje') === 'asgje').length;
    document.getElementById('count-kerkesa').textContent = klientet.filter(k => (k.statuset?.[muajiFilter] || 'asgje') === 'kerkesa').length;
    document.getElementById('count-process').textContent = klientet.filter(k => (k.statuset?.[muajiFilter] || 'asgje') === 'process').length;
    document.getElementById('count-leshuar').textContent = klientet.filter(k => (k.statuset?.[muajiFilter] || 'asgje') === 'leshuar').length;
    document.getElementById('count-total').textContent = klientet.length;

    const statusLabels = {
        asgje: 'Asgjë',
        kerkesa: 'Kërkesë',
        process: 'Në Proces',
        leshuar: 'E Lëshuar'
    };

    const dergesaLabels = {
        email: 'Email',
        direkt: 'Direkt',
        poste: 'Postë'
    };

    const tbody = document.getElementById('faturimi-tbody');

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:40px; color:#888;">Nuk ka të dhëna. Shtoni klientë me butonin "+ Shto Klient"</td></tr>`;
        return;
    }

    const mujor = filtered.filter(k => k.faturimiLloji !== 'vjetor');
    const vjetor = filtered.filter(k => k.faturimiLloji === 'vjetor');

    const renderRows = (list) => list.map(k => {
        const idx = klientet.indexOf(k);
        const muajiZgjedhur = filterMuaji;
        const statusAktual = k.statuset?.[muajiZgjedhur] || 'asgje';

        const muajiOptions = muajt.slice(1).map((m, i) => {
            const muajNr = i + 1;
            const statusKy = k.statuset?.[muajNr] || 'kerkesa';
            const ngjyra = statusKy === 'leshuar' ? '#10b981' : statusKy === 'process' ? '#0057B8' : '#f59e0b';
            return `<option value="${muajNr}" ${muajNr === muajiZgjedhur ? 'selected' : ''} style="color:${ngjyra}">${m}</option>`;
        }).join('');

        return `
        <tr>
            <td><input type="checkbox" class="klient-check" data-index="${idx}" onchange="perditesoEmailBtn()"></td>
            <td><strong>${k.emri}</strong></td>
            <td>${k.nrPersonal || k.nrBiznesit || k.kontrataНр || '-'}</td>
            <td style="font-size:12px">${k.dataFillimit || '-'} → ${k.dataMbarimit || '-'}</td>
            <td>${dergesaLabels[k.dergesa] || k.dergesa}</td>
            <td>${k.email || '-'}</td><td class="${llogaritSkadon(k.dataMbarimit).klasa}">${llogaritSkadon(k.dataMbarimit).teksti}</td>
            <td>
                <select class="muaji-select" onchange="ndryshoStatusMuaj(${idx}, this.value, '${statusAktual}'); renderTabela()">
                    ${muajiOptions}
                </select>
            </td>
            <td>
                <div class="status-circles">
                    <span class="status-dot ${statusAktual === 'asgje' ? 'active' : ''}" title="Asgjë" onclick="ndryshoStatusMuaj(${idx}, ${muajiZgjedhur}, 'asgje')" style="background:${statusAktual === 'asgje' ? '#94a3b8' : '#e2e8f0'}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${statusAktual === 'asgje' ? '#fff' : '#94a3b8'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
                    </span>
                    <span class="status-dot ${statusAktual === 'kerkesa' ? 'active' : ''}" title="Kërkesë Dërguar" onclick="ndryshoStatusMuaj(${idx}, ${muajiZgjedhur}, 'kerkesa')" style="background:${statusAktual === 'kerkesa' ? '#f59e0b' : '#e2e8f0'}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${statusAktual === 'kerkesa' ? '#fff' : '#94a3b8'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>
                    </span>
                    <span class="status-dot ${statusAktual === 'process' ? 'active' : ''}" title="Në Proces" onclick="ndryshoStatusMuaj(${idx}, ${muajiZgjedhur}, 'process')" style="background:${statusAktual === 'process' ? '#0047AB' : '#e2e8f0'}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${statusAktual === 'process' ? '#fff' : '#94a3b8'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
                    </span>
                    <span class="status-dot ${statusAktual === 'leshuar' ? 'active' : ''}" title="Faturë e Lëshuar" onclick="ndryshoStatusMuaj(${idx}, ${muajiZgjedhur}, 'leshuar')" style="background:${statusAktual === 'leshuar' ? '#22c55e' : '#e2e8f0'}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${statusAktual === 'leshuar' ? '#fff' : '#94a3b8'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                    </span>
                </div>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="editoKlient(${idx})" title="Edito"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                    <button class="btn-delete" onclick="fshijKlient(${idx})" title="Fshi"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
                    ${k.dergesa === 'email' && k.email ? `<button class="btn-email" onclick="dergoEmail(${idx})" title="Dërgo Email"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></button>` : ''}
                </div>
        </tr>`;
    }).join('');

    let html = '';
    if (mujor.length > 0) {
        html += `<tr><td colspan="11" style="background:#f0f4fa;font-weight:700;font-size:11px;color:#0047AB;padding:6px 12px;letter-spacing:1px;">MUJOR (${mujor.length})</td></tr>`;
        html += renderRows(mujor);
    }
    if (vjetor.length > 0) {
        html += `<tr><td colspan="11" style="background:#f0f4fa;font-weight:700;font-size:11px;color:#002B5C;padding:6px 12px;letter-spacing:1px;">VJETOR (${vjetor.length})</td></tr>`;
        html += renderRows(vjetor);
    }
    tbody.innerHTML = html || `<tr><td colspan="11" style="text-align:center; padding:40px; color:#888;">Nuk ka të dhëna.</td></tr>`;
}

function dergoEmail(index) {
    const k = klientet[index];
    const muajiAkt = muajiAktual();
    const subject = encodeURIComponent(`Kërkesë për listën e të siguruarve - ${muajt[muajiAkt]}`);
    const body = encodeURIComponent(
        `I nderuar ${k.emri},\n\nJu lutem na dërgoni listën e përditësuar të të siguruarve për muajin ${muajt[muajiAkt]}.\n\nNr. Kontratës: ${k.kontrataНр || 'N/A'}\n\nFaleminderit,\nDepartamenti i Sigurimeve Shëndetësore\nSigal Insurance Group`
    );
    window.open(`mailto:${k.email}?subject=${subject}&body=${body}`);
}
function zgjidhTeGjitha(checked) {
    document.querySelectorAll('.klient-check').forEach(cb => cb.checked = checked);
    perditesoEmailBtn();
}

function perditesoEmailBtn() {
    const zgjedhur = document.querySelectorAll('.klient-check:checked').length;
    const btn = document.getElementById('btn-dergo-email');
    const count = document.getElementById('count-zgjedhur');
    if (zgjedhur > 0) {
        btn.style.display = 'inline-flex';
        count.textContent = zgjedhur;
    } else {
        btn.style.display = 'none';
    }
}

function dergoEmailZgjedhurve() {
    const zgjedhur = [];
    document.querySelectorAll('.klient-check:checked').forEach(cb => {
        const idx = parseInt(cb.dataset.index);
        const k = klientet[idx];
        if (k && k.email) zgjedhur.push(k.email);
    });

    if (zgjedhur.length === 0) {
        alert('Asnje klient i zgjedhur nuk ka email!');
        return;
    }

    const emails = zgjedhur.join(',');
    const muajiAkt = muajiAktual();
    const subject = encodeURIComponent('Kerkese per listen e te siguruarve - ' + muajt[muajiAkt]);
    const body = encodeURIComponent(
        'Te nderuar,\n\nJu lutem na dergoni listen e perditesuar te te siguruarve per muajin ' + muajt[muajiAkt] + '.\n\nFaleminderit,\nDepartamenti i Sigurimeve Shendetesore\nSigal Insurance Group'
    );
   window.open('mailto:' + emails + '?subject=' + subject + '&body=' + body);
}

function zgjidhFaturimin(lloji, btn) {
    document.getElementById('m-faturimi-lloji').value = lloji;
    btn.parentElement.querySelectorAll('.lloji-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}
// Initialize - set filter muaji to current month
document.getElementById('filter-muaji').value = muajiAktual();
renderTabela();