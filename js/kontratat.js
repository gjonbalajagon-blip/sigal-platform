let kontratat = JSON.parse(localStorage.getItem('kontratat')) || [];
let editIndex = -1;

function ruajNeStorage() {
    localStorage.setItem('kontratat', JSON.stringify(kontratat));
}

function zgjidhLlojin(lloji, btn) {
    document.getElementById('m-lloji').value = lloji;
    document.querySelectorAll('.lloji-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Shfaq/fsheh fushat sipas llojit
    document.getElementById('field-nr-biznesit').style.display = (lloji === 'biznes') ? 'block' : 'none';
    document.getElementById('field-perfaqesuesi').style.display = (lloji === 'biznes' || lloji === 'familje') ? 'block' : 'none';
}

function shtoKontrate() {
    editIndex = -1;
    document.getElementById('modal-title').textContent = 'Kontratë e Re';
    document.getElementById('m-emri').value = '';
    document.getElementById('m-adresa').value = '';
    document.getElementById('m-nr-biznesit').value = '';
    document.getElementById('m-perfaqesuesi').value = '';
    document.querySelectorAll('.pako-check input').forEach(cb => cb.checked = false);
    document.getElementById('m-fillimi').value = '';
    document.getElementById('m-mbarimi').value = '';
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
    document.getElementById('m-nr').value = k.nr || '';
    document.getElementById('m-emri').value = k.emri;
    document.getElementById('m-adresa').value = k.adresa || '';
    document.getElementById('m-nr-biznesit').value = k.nrBiznesit || '';
    document.getElementById('m-perfaqesuesi').value = k.perfaqesuesi || '';
    document.querySelectorAll('.pako-check input').forEach(cb => {
    cb.checked = (k.pakot || []).includes(cb.value);
});
    document.getElementById('m-fillimi').value = k.fillimi || '';
    document.getElementById('m-mbarimi').value = k.mbarimi || '';
    document.getElementById('m-email').value = k.email || '';
    document.getElementById('m-telefoni').value = k.telefoni || '';
    const btns = document.querySelectorAll('.lloji-btn');
    const llojiMap = { individ: 0, biznes: 1, familje: 2 };
    zgjidhLlojin(k.lloji, btns[llojiMap[k.lloji] || 0]);
    document.getElementById('modal-overlay').classList.add('active');
}

function llogaritStatus(mbarimi) {
    if (!mbarimi) return 'ne-pritje';
    const tani = new Date();
    const skadon = new Date(mbarimi);
    const dite = Math.ceil((skadon - tani) / (1000 * 60 * 60 * 24));
    if (dite < 0) return 'skaduar';
    return 'aktive';
}

function llogaritDitet(mbarimi) {
    if (!mbarimi) return { teksti: '-', klasa: '' };
    const tani = new Date();
    const skadon = new Date(mbarimi);
    const dite = Math.ceil((skadon - tani) / (1000 * 60 * 60 * 24));
    if (dite < 0) return { teksti: `Skaduar ${Math.abs(dite)}d`, klasa: 'skadon-expired' };
    if (dite <= 35) return { teksti: `⚠️ ${dite} ditë`, klasa: 'skadon-warning' };
    return { teksti: `${dite} ditë`, klasa: 'skadon-ok' };
}

function filtro() {
    renderTabela();
}

function renderTabela() {
    const filterLloji = document.getElementById('filter-lloji').value;
    const filterStatusi = document.getElementById('filter-statusi').value;
    const search = document.getElementById('search-kontrate').value.toLowerCase();

    const filtered = kontratat.filter(k => {
        const llojiOk = filterLloji === 'all' || k.lloji === filterLloji;
        const statusi = llogaritStatus(k.mbarimi);
        const statusOk = filterStatusi === 'all' || statusi === filterStatusi;
        const searchOk = k.emri.toLowerCase().includes(search) || (k.nr || '').toLowerCase().includes(search);
        return llojiOk && statusOk && searchOk;
    });

    // Stats
    document.getElementById('count-aktive').textContent = kontratat.filter(k => llogaritStatus(k.mbarimi) === 'aktive').length;
    document.getElementById('count-skadon').textContent = kontratat.filter(k => {
        if (!k.mbarimi) return false;
        const dite = Math.ceil((new Date(k.mbarimi) - new Date()) / (1000 * 60 * 60 * 24));
        return dite >= 0 && dite <= 35;
    }).length;
    document.getElementById('count-biznes').textContent = kontratat.filter(k => k.lloji === 'biznes').length;
    document.getElementById('count-total').textContent = kontratat.length;

    const statusLabels = {
        aktive: '🟢 Aktive',
        skaduar: '🔴 Skaduar',
        'ne-pritje': '🟡 Në Pritje'
    };

    const llojiLabels = {
        individ: '👤 Individ',
        biznes: '🏢 Biznes',
        familje: '👨‍👩‍👧 Familje'
    };

    const tbody = document.getElementById('kontratat-tbody');

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px; color:#888;">Nuk ka kontrata. Shtoni me "+ Kontratë e Re"</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(k => {
        const idx = kontratat.indexOf(k);
        const statusi = llogaritStatus(k.mbarimi);
        const ditet = llogaritDitet(k.mbarimi);
        return `
        <tr>
            <td>${k.emri}</td>
            <td><span class="badge-lloji ${k.lloji}">${llojiLabels[k.lloji]}</span></td>
            <td>${(k.pakot || []).join(', ') || '-'}</td>
            <td>${k.fillimi || '-'}</td>
            <td>${k.mbarimi || '-'}</td>
            <td class="${ditet.klasa}">${ditet.teksti}</td>
            <td><span class="badge-status ${statusi}">${statusLabels[statusi]}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="editoKontrate(${idx})">✏️</button><button class="btn-word" onclick="gjeneroWord(${idx})">📄 Word</button>
                    <button class="btn-delete" onclick="fshijKontrate(${idx})">🗑️</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

async function gjeneroWord(index) {
    const k = kontratat[index];
    try {
        const response = await fetch('https://sigal-platform-production.up.railway.app/api/gjenero-kontrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(k)
        });
        const data = await response.json();
        if (data.success) {
            window.open(`https://sigal-platform-production.up.railway.app/api/shkarko/${data.fileName}`, '_blank');
        } else {
            alert('Gabim: ' + data.error);
        }
    } catch (err) {
        alert('Serveri nuk është aktiv!');
    }
}