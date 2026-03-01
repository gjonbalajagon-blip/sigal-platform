function llogaritSkadon(dataMbarimit) {
    if (!dataMbarimit) return { teksti: '-', klasa: '' };
    const tani = new Date();
    const skadon = new Date(dataMbarimit);
    const diferencaDite = Math.ceil((skadon - tani) / (1000 * 60 * 60 * 24));

    if (diferencaDite < 0) return { teksti: `Skaduar ${Math.abs(diferencaDite)} ditë`, klasa: 'skadon-expired' };
    if (diferencaDite <= 35) return { teksti: `⚠️ ${diferencaDite} ditë`, klasa: 'skadon-warning' };
    return { teksti: `${diferencaDite} ditë`, klasa: 'skadon-ok' };
}let klientet = JSON.parse(localStorage.getItem('faturimi_klientet')) || [];
let editIndex = -1;
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

    const klienti = {
        emri, kontrataНр, dataFillimit, dataMbarimit,
        dergesa, email, afati,
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
        const statusMuaj = k.statuset?.[filterMuaji] || 'kerkesa';
        const statusOk = filterStatus === 'all' || statusMuaj === filterStatus;
        return searchOk && statusOk;
    });

    // Update counts per muajin e zgjedhur
    const muajiFilter = filterMuaji;
    document.getElementById('count-kerkesa').textContent = klientet.filter(k => (k.statuset?.[muajiFilter] || 'kerkesa') === 'kerkesa').length;
    document.getElementById('count-process').textContent = klientet.filter(k => (k.statuset?.[muajiFilter] || 'kerkesa') === 'process').length;
    document.getElementById('count-leshuar').textContent = klientet.filter(k => (k.statuset?.[muajiFilter] || 'kerkesa') === 'leshuar').length;
    document.getElementById('count-total').textContent = klientet.length;

    const statusLabels = {
        kerkesa: '🟡 Kërkesë',
        process: '🔵 Në Proces',
        leshuar: '🟢 E Lëshuar'
    };

    const dergesaLabels = {
        email: '📧 Email',
        direkt: '🤝 Direkt',
        poste: '📮 Postë'
    };

    const tbody = document.getElementById('faturimi-tbody');

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px; color:#888;">Nuk ka të dhëna. Shtoni klientë me butonin "+ Shto Klient"</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(k => {
        const idx = klientet.indexOf(k);
        const muajiZgjedhur = filterMuaji;
        const statusAktual = k.statuset?.[muajiZgjedhur] || 'kerkesa';

        const muajiOptions = muajt.slice(1).map((m, i) => {
            const muajNr = i + 1;
            const statusKy = k.statuset?.[muajNr] || 'kerkesa';
            const ngjyra = statusKy === 'leshuar' ? '#10b981' : statusKy === 'process' ? '#0057B8' : '#f59e0b';
            return `<option value="${muajNr}" ${muajNr === muajiZgjedhur ? 'selected' : ''} style="color:${ngjyra}">${m}</option>`;
        }).join('');

        return `
        <tr>
            <td><strong>${k.emri}</strong></td>
            <td>${k.kontrataНр || '-'}</td>
            <td style="font-size:12px">${k.dataFillimit || '-'} → ${k.dataMbarimit || '-'}</td>
            <td>${dergesaLabels[k.dergesa] || k.dergesa}</td>
            <td>${k.email || '-'}</td><td class="${llogaritSkadon(k.dataMbarimit).klasa}">${llogaritSkadon(k.dataMbarimit).teksti}</td>
            <td>
                <select class="muaji-select" onchange="ndryshoStatusMuaj(${idx}, this.value, '${statusAktual}'); renderTabela()">
                    ${muajiOptions}
                </select>
            </td>
            <td>
                <select class="status-select ${statusAktual}" onchange="ndryshoStatusMuaj(${idx}, ${muajiZgjedhur}, this.value)">
                    <option value="kerkesa" ${statusAktual === 'kerkesa' ? 'selected' : ''}>🟡 Kërkesë</option>
                    <option value="process" ${statusAktual === 'process' ? 'selected' : ''}>🔵 Në Proces</option>
                    <option value="leshuar" ${statusAktual === 'leshuar' ? 'selected' : ''}>🟢 E Lëshuar</option>
                </select>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="editoKlient(${idx})">✏️</button>
                    <button class="btn-delete" onclick="fshijKlient(${idx})">🗑️</button>
                    ${k.dergesa === 'email' && k.email ? `<button class="btn-email" onclick="dergoEmail(${idx})">📧</button>` : ''}
                </div>
            </td>
        </tr>`;
    }).join('');
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

// Initialize - set filter muaji to current month
document.getElementById('filter-muaji').value = muajiAktual();
renderTabela();