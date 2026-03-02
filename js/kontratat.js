let kontratat = [];
let editIndex = -1;

const llojiLabels = {
    individ: '👤 Individ',
    biznes: '🏢 Biznes',
    familje: '👨‍👩‍👧 Familje'
};

const statusLabels = {
    aktive: '🟢 Aktive',
    skaduar: '🔴 Skaduar',
    'ne-pritje': '🟡 Në Pritje'
};

function ngarkoDheato() {
    const saved = localStorage.getItem('kontratat');
    if (saved) kontratat = JSON.parse(saved);
    renderTabela();
}

function ruajNeStorage() {
    localStorage.setItem('kontratat', JSON.stringify(kontratat));
}

function llogaritStatus(mbarimi) {
    if (!mbarimi) return 'ne-pritje';
    const sot = new Date();
    const mb = new Date(mbarimi);
    if (mb < sot) return 'skaduar';
    return 'aktive';
}

function llogaritDitet(mbarimi) {
    if (!mbarimi) return { teksti: '-', klasa: '' };
    const sot = new Date();
    const mb = new Date(mbarimi);
    const diff = Math.ceil((mb - sot) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { teksti: `Skaduar ${Math.abs(diff)}d`, klasa: 'text-red' };
    if (diff <= 35) return { teksti: `⚠️ ${diff} ditë`, klasa: 'text-orange' };
    return { teksti: `${diff} ditë`, klasa: 'text-green' };
}

function zgjidhLlojin(lloji, btn) {
    document.getElementById('m-lloji').value = lloji;
    document.querySelectorAll('.lloji-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.getElementById('field-nr-biznesit').style.display = lloji === 'biznes' ? 'block' : 'none';
    document.getElementById('field-perfaqesuesi').style.display = (lloji === 'biznes' || lloji === 'familje') ? 'block' : 'none';
    document.getElementById('field-nr-personal').style.display = (lloji === 'individ' || lloji === 'familje') ? 'block' : 'none';
    document.getElementById('field-pozita').style.display = lloji === 'biznes' ? 'block' : 'none';

    const emriInput = document.getElementById('m-emri');
    const prefix = document.getElementById('emri-prefix');
    if (lloji === 'familje') {
        prefix.style.display = 'inline';
        emriInput.placeholder = 'Mbiemri i familjes';
    } else {
        prefix.style.display = 'none';
        emriInput.placeholder = lloji === 'biznes' ? 'Emri i Biznesit' : 'Emri Mbiemri';
    }
}

function shtoKontrate() {
    editIndex = -1;
    document.getElementById('modal-title').textContent = 'Kontratë e Re';
    document.getElementById('m-emri').value = '';
    document.getElementById('m-adresa').value = '';
    document.getElementById('m-nr-biznesit').value = '';
    document.getElementById('m-perfaqesuesi').value = '';
    document.getElementById('m-nr-personal').value = '';
    document.getElementById('m-pozita').value = '';
    document.getElementById('m-data-kontrates').value = '';
    document.getElementById('m-fillimi').value = '';
    document.getElementById('m-mbarimi').value = '';
    document.querySelectorAll('.pako-check input').forEach(cb => cb.checked = false);
    zgjidhLlojin('individ', document.querySelectorAll('.lloji-btn')[0]);
    document.getElementById('modal-overlay').classList.add('active');
}

function mbyllModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

function ruajKontrate() {
    const emri = document.getElementById('m-emri').value.trim();
    if (!emri) { alert('Ju lutem shkruani emrin e klientit!'); return; }

    const kontrata = {
        emri,
        lloji: document.getElementById('m-lloji').value,
        adresa: document.getElementById('m-adresa').value.trim(),
        nrBiznesit: document.getElementById('m-nr-biznesit').value.trim(),
        perfaqesuesi: document.getElementById('m-perfaqesuesi').value.trim(),
        nrPersonal: document.getElementById('m-nr-personal').value.trim(),
        pozita: document.getElementById('m-pozita').value.trim(),
        dataKontrates: document.getElementById('m-data-kontrates').value,
        pakot: Array.from(document.querySelectorAll('.pako-check input:checked')).map(cb => cb.value),
        fillimi: document.getElementById('m-fillimi').value,
        mbarimi: document.getElementById('m-mbarimi').value,
        dataKrijimit: new Date().toISOString().split('T')[0]
    };

    if (editIndex >= 0) {
        kontratat[editIndex] = kontrata;
    } else {
        kontratat.push(kontrata);
    }

    ruajNeStorage();
    mbyllModal();
    renderTabela();
}

function fshijKontrate(index) {
    if (confirm('A jeni i sigurt që doni të fshini këtë kontratë?')) {
        kontratat.splice(index, 1);
        ruajNeStorage();
        renderTabela();
    }
}

function editoKontrate(index) {
    editIndex = index;
    const k = kontratat[index];
    document.getElementById('modal-title').textContent = 'Edito Kontratë';
    document.getElementById('m-emri').value = k.emri;
    document.getElementById('m-adresa').value = k.adresa || '';
    document.getElementById('m-nr-biznesit').value = k.nrBiznesit || '';
    document.getElementById('m-perfaqesuesi').value = k.perfaqesuesi || '';
    document.getElementById('m-nr-personal').value = k.nrPersonal || '';
    document.getElementById('m-pozita').value = k.pozita || '';
    document.getElementById('m-data-kontrates').value = k.dataKontrates || '';
    document.querySelectorAll('.pako-check input').forEach(cb => {
        cb.checked = (k.pakot || []).includes(cb.value);
    });
    document.getElementById('m-fillimi').value = k.fillimi || '';
    document.getElementById('m-mbarimi').value = k.mbarimi || '';
    const btns = document.querySelectorAll('.lloji-btn');
    const llojiMap = { individ: 0, biznes: 1, familje: 2 };
    zgjidhLlojin(k.lloji, btns[llojiMap[k.lloji] || 0]);
    document.getElementById('modal-overlay').classList.add('active');
}

function filtro() {
    renderTabela();
}

function renderTabela() {
    const lloji = document.getElementById('filter-lloji').value;
    const statusi = document.getElementById('filter-statusi').value;
    const search = document.getElementById('search-kontrate').value.toLowerCase();

    let filtered = kontratat.filter(k => {
        const st = llogaritStatus(k.mbarimi);
        const klientiShfaqur = k.lloji === 'familje' ? (k.perfaqesuesi || k.emri) : k.emri;
        return (lloji === 'all' || k.lloji === lloji) &&
               (statusi === 'all' || st === statusi) &&
               (klientiShfaqur.toLowerCase().includes(search) || (k.emri || '').toLowerCase().includes(search));
    });

    const tbody = document.getElementById('kontratat-tbody');

    // Stats
    document.getElementById('count-aktive').textContent = kontratat.filter(k => llogaritStatus(k.mbarimi) === 'aktive').length;
    document.getElementById('count-skadon').textContent = kontratat.filter(k => {
        const diff = Math.ceil((new Date(k.mbarimi) - new Date()) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 35;
    }).length;
    document.getElementById('count-biznes').textContent = kontratat.filter(k => k.lloji === 'biznes').length;
    document.getElementById('count-total').textContent = kontratat.length;

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px; color:#888;">Nuk ka kontrata. Shtoni me "+ Kontratë e Re"</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(k => {
        const idx = kontratat.indexOf(k);
        const statusi = llogaritStatus(k.mbarimi);
        const ditet = llogaritDitet(k.mbarimi);
        const klientiShfaqur = k.lloji === 'familje' ? (k.perfaqesuesi || k.emri) : k.emri;
        return `
        <tr>
            <td>${klientiShfaqur}</td>
            <td><span class="badge-lloji ${k.lloji}">${llojiLabels[k.lloji]}</span></td>
            <td>${(k.pakot || []).join(', ') || '-'}</td>
            <td>${k.fillimi || '-'}</td>
            <td>${k.mbarimi || '-'}</td>
            <td class="${ditet.klasa}">${ditet.teksti}</td>
            <td><span class="badge-status ${statusi}">${statusLabels[statusi]}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="editoKontrate(${idx})">✏️</button>
                    <button class="btn-word" onclick="gjeneroWord(${idx})">📄 Word</button>
                    <button class="btn-delete" onclick="fshijKontrate(${idx})">🗑️</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

async function gjeneroWord(index) {
    const k = kontratat[index];
    try {
        const response = await fetch('http://localhost:3000/api/gjenero-kontrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(k)
        });
        const data = await response.json();
        if (data.success) {
            window.open(`http://localhost:3000/api/shkarko/${data.fileName}`, '_blank');
        } else {
            alert('Gabim: ' + data.error);
        }
    } catch (err) {
        alert('Serveri nuk është aktiv! Hap terminalen dhe shkruaj: node server.js');
    }
}

document.addEventListener('DOMContentLoaded', ngarkoDheato);