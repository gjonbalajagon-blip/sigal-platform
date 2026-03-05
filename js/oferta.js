let ofertat = JSON.parse(localStorage.getItem('ofertat')) || [];
let editIndex = -1;

function ruajNeStorage() {
    localStorage.setItem('ofertat', JSON.stringify(ofertat));
}

function zgjidhLlojin(lloji, btn) {
    document.getElementById('m-lloji').value = lloji;
    document.querySelectorAll('.lloji-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const container = document.getElementById('pakot-container');
    if (lloji === 'individ') {
        container.innerHTML = `
            <label class="pako-check"><input type="checkbox" value="Pako Bazë"> Pako Bazë</label>
            <label class="pako-check"><input type="checkbox" value="Pako Standard"> Pako Standard</label>
            <label class="pako-check"><input type="checkbox" value="Pako Standard Plus"> Pako Standard Plus</label>
        `;
    } else {
        container.innerHTML = `
            <label class="pako-check"><input type="checkbox" value="Pako Bazë"> Pako Bazë</label>
            <label class="pako-check"><input type="checkbox" value="Pako Standard"> Pako Standard</label>
            <label class="pako-check"><input type="checkbox" value="Pako Standard Plus"> Pako Standard Plus</label>
            <label class="pako-check"><input type="checkbox" value="Pako Premium"> Pako Premium</label>
            <label class="pako-check"><input type="checkbox" value="Pako Silver"> Pako Silver</label>
            <label class="pako-check"><input type="checkbox" value="Pako Gold"> Pako Gold</label>
        `;
    }
}

function tregoBoxAgjenti() {
    const val = document.getElementById('m-kerkuar-nga').value;
    document.getElementById('field-agjenti').style.display = val === 'agjenti' ? 'block' : 'none';
}

function shtoOferte() {
    editIndex = -1;
    document.getElementById('modal-title').textContent = 'Ofertë e Re';
    document.getElementById('m-emri').value = '';
    document.getElementById('m-email').value = '';
    document.getElementById('m-kerkuar-nga').value = 'direkt';
    document.getElementById('m-agjenti').value = '';
    document.getElementById('field-agjenti').style.display = 'none';
    document.querySelectorAll('.pako-check input').forEach(cb => cb.checked = false);
    zgjidhLlojin('individ', document.querySelectorAll('.lloji-btn')[0]);
    document.getElementById('modal-overlay').classList.add('active');
}

function mbyllModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

function ruajOferte() {
    const emri = document.getElementById('m-emri').value.trim();
    if (!emri) { alert('Ju lutem shkruani emrin e klientit!'); return; }

    const today = new Date();
    const skadon = new Date(today);
    skadon.setDate(skadon.getDate() + 30);

    const kerkuarNga = document.getElementById('m-kerkuar-nga').value;
    const agjenti = document.getElementById('m-agjenti').value.trim();

    const oferta = {
        emri,
        lloji: document.getElementById('m-lloji').value,
        email: document.getElementById('m-email').value.trim(),
        kerkuarNga: kerkuarNga,
        agjenti: kerkuarNga === 'agjenti' ? agjenti : '',
        pakot: Array.from(document.querySelectorAll('.pako-check input:checked')).map(cb => cb.value),
        krijuarNga: 'Agon', // Mund te ndryshohet me login system
        dataKrijimit: today.toISOString().split('T')[0],
        dataSkadon: skadon.toISOString().split('T')[0]
    };

    if (editIndex >= 0) {
        ofertat[editIndex] = oferta;
    } else {
        ofertat.push(oferta);
    }

    ruajNeStorage();
    mbyllModal();
    renderTabela();
}

function editoOferte(index) {
    editIndex = index;
    const o = ofertat[index];
    document.getElementById('modal-title').textContent = 'Edito Ofertën';
    document.getElementById('m-emri').value = o.emri;
    document.getElementById('m-email').value = o.email || '';
    document.getElementById('m-kerkuar-nga').value = o.kerkuarNga || 'direkt';
    document.getElementById('m-agjenti').value = o.agjenti || '';
    tregoBoxAgjenti();

    const btns = document.querySelectorAll('.lloji-btn');
    const llojiMap = { 'individ': 0, 'familjare-biznes': 1 };
    zgjidhLlojin(o.lloji, btns[llojiMap[o.lloji] || 0]);

    document.querySelectorAll('.pako-check input').forEach(cb => {
        cb.checked = (o.pakot || []).includes(cb.value);
    });

    document.getElementById('modal-overlay').classList.add('active');
}

function fshijOferte(index) {
    if (confirm('A jeni i sigurt që doni të fshini këtë ofertë?')) {
        ofertat.splice(index, 1);
        ruajNeStorage();
        renderTabela();
    }
}

function llogaritStatus(dataSkadon) {
    if (!dataSkadon) return 'aktive';
    const tani = new Date();
    const skadon = new Date(dataSkadon);
    return tani > skadon ? 'skaduar' : 'aktive';
}

function llogaritDitet(dataSkadon) {
    if (!dataSkadon) return { teksti: '-', klasa: '' };
    const tani = new Date();
    const skadon = new Date(dataSkadon);
    const dite = Math.ceil((skadon - tani) / (1000 * 60 * 60 * 24));
    if (dite < 0) return { teksti: 'Skaduar', klasa: 'skadon-expired' };
    if (dite <= 7) return { teksti: `⚠️ ${dite} ditë`, klasa: 'skadon-warning' };
    return { teksti: `${dite} ditë`, klasa: 'skadon-ok' };
}

function dergoEmail(index) {
    const o = ofertat[index];
    if (!o.email) {
        alert('Klienti nuk ka email të regjistruar!');
        return;
    }
    const subject = encodeURIComponent(`Ofertë nga SIGAL Insurance Group - ${o.emri}`);
    const body = encodeURIComponent(
        `I nderuar ${o.emri},\n\nJu dërgojmë ofertën tonë për sigurim shëndetësor.\n\nPakot e zgjedhura: ${(o.pakot || []).join(', ')}\nValiditeti: 30 ditë nga ${o.dataKrijimit}\n\nMe respekt,\nSIGAL Insurance Group`
    );
    window.open(`mailto:${o.email}?subject=${subject}&body=${body}`);
}

function krijoKontrate(index) {
    const confirmed = confirm('A jeni i sigurt që doni të krijoni kontratë?\nOferta është pranuar?');
    if (!confirmed) return;

    const o = ofertat[index];
    const kontratData = {
        emri: o.emri,
        lloji: o.lloji === 'individ' ? 'individ' : 'biznes',
        email: o.email || '',
        pakot: o.pakot || [],
        ngaOferta: true
    };
    localStorage.setItem('oferta_per_kontrate', JSON.stringify(kontratData));
    window.location.href = 'kontratat.html?nga_oferta=true';
}

async function gjeneroWord(index) {
    const o = ofertat[index];
    try {
        const response = await fetch('https://sigal-platform-production.up.railway.app/api/gjenero-oferte', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(o)
        });
        const data = await response.json();
        if (data.success) {
            window.open(`https://sigal-platform-production.up.railway.app/api/shkarko/${data.fileName}`, '_blank');
        } else {
            alert('Gabim: ' + data.error);
        }
    } catch (err) {
        alert('Serveri nuk është aktiv ose endpoint nuk ekziston ende!');
    }
}

function filtro() {
    renderTabela();
}

function renderTabela() {
    const filterLloji = document.getElementById('filter-lloji').value;
    const filterStatusi = document.getElementById('filter-statusi').value;
    const search = document.getElementById('search-oferte').value.toLowerCase();

    const filtered = ofertat.filter(o => {
        const llojiOk = filterLloji === 'all' || o.lloji === filterLloji;
        const statusi = llogaritStatus(o.dataSkadon);
        const statusOk = filterStatusi === 'all' || statusi === filterStatusi;
        const searchOk = o.emri.toLowerCase().includes(search);
        return llojiOk && statusOk && searchOk;
    });

    document.getElementById('count-aktive').textContent = ofertat.filter(o => llogaritStatus(o.dataSkadon) === 'aktive').length;
    document.getElementById('count-skaduar').textContent = ofertat.filter(o => llogaritStatus(o.dataSkadon) === 'skaduar').length;
    document.getElementById('count-individ').textContent = ofertat.filter(o => o.lloji === 'individ').length;
    document.getElementById('count-biznes').textContent = ofertat.filter(o => o.lloji === 'familjare-biznes').length;
    document.getElementById('count-total').textContent = ofertat.length;

    const statusLabels = {
        aktive: '🟢 Aktive',
        skaduar: '🔴 Skaduar'
    };

    const llojiLabels = {
        'individ': '👤 Individuale',
        'familjare-biznes': '🏢 Familjare/Biznes'
    };

    const kerkuarLabels = {
        'direkt': 'Direkt',
        'online': 'Online',
        'agjenti': 'Agjenti'
    };

    const tbody = document.getElementById('ofertat-tbody');

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px; color:#888;">Nuk ka oferta. Shtoni me "+ Ofertë e Re"</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(o => {
        const idx = ofertat.indexOf(o);
        const statusi = llogaritStatus(o.dataSkadon);
        const ditet = llogaritDitet(o.dataSkadon);
        const kerkuar = o.kerkuarNga === 'agjenti' ? `Agjenti: ${o.agjenti}` : (kerkuarLabels[o.kerkuarNga] || '-');
        return `
        <tr>
            <td>${o.emri}</td>
            <td><span class="badge-lloji ${o.lloji}">${llojiLabels[o.lloji]}</span></td>
            <td>${(o.pakot || []).join(', ') || '-'}</td>
            <td>${o.krijuarNga || '-'}</td>
            <td>${kerkuar}</td>
            <td>${o.dataKrijimit || '-'}</td>
            <td class="${ditet.klasa}">${ditet.teksti}</td>
            <td><span class="badge-status ${statusi}">${statusLabels[statusi]}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="editoOferte(${idx})">✏️</button>
                    <button class="btn-word" onclick="gjeneroWord(${idx})">📄 Word</button>
                    <button class="btn-email" onclick="dergoEmail(${idx})">📧</button>
                    <button class="btn-kontrate" onclick="krijoKontrate(${idx})">📋 Kontratë</button>
                    <button class="btn-delete" onclick="fshijOferte(${idx})">🗑️</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

document.addEventListener('DOMContentLoaded', renderTabela);