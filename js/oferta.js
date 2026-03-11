let ofertat = JSON.parse(localStorage.getItem('ofertat')) || [];
let editIndex = -1;

function ruajNeStorage() {
    localStorage.setItem('ofertat', JSON.stringify(ofertat));
}

function zgjidhLlojin(lloji, btn) {
    document.getElementById('m-lloji').value = lloji;
    document.querySelectorAll('.lloji-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const pakotList = lloji === 'individ' ? PAKOT.individ : PAKOT.familje_biznes;
    const eshteIndivid = lloji === 'individ';
    const container = document.getElementById('pakot-container');

    container.innerHTML = pakotList.map(p => `
        <div class="pako-editor" id="pe-${p.id}">
            <div class="pako-editor-header">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                    <input type="checkbox" class="pako-check-input" value="${p.id}" onchange="togglePakoEditor('${p.id}', this.checked)">
                    <strong>Paketa ${p.emri}</strong>
                </label>
            </div>
            <div class="pako-editor-body" id="peb-${p.id}" style="display:none;">
                <table class="pako-edit-table">
                    <tr><td class="pel">Zona e mbuluar</td><td><input class="pako-input" data-pako="${p.id}" data-field="zona" value="${p.zona}"></td></tr>
                    <tr><td class="pel">Shuma e Siguruar (€)</td><td><input class="pako-input" data-pako="${p.id}" data-field="shuma" value="${p.shuma}"></td></tr>
                    <tr><td colspan="2" class="pako-section-hdr">Trajtimet Hospitalore</td></tr>
                    <tr><td class="pel">Mbulimi</td><td><input class="pako-input" data-pako="${p.id}" data-field="hospitalore" value="${p.hospitalore}"></td></tr>
                    <tr><td colspan="2" class="pako-section-hdr">Trajtimet Ambulantore</td></tr>
                    <tr><td class="pel">Mbulimi</td><td><input class="pako-input" data-pako="${p.id}" data-field="ambulatore" value="${p.ambulatore}"></td></tr>
                    <tr><td colspan="2" class="pako-section-hdr">Trajtime tjera</td></tr>
                    <tr><td class="pel">Shtatzania dhe lindja</td><td><input class="pako-input" data-pako="${p.id}" data-field="shtatzania" value="${p.shtatzania}"></td></tr>
                    <tr><td class="pel">Kujdesi dentar</td><td><input class="pako-input" data-pako="${p.id}" data-field="dentar" value="${p.dentar}"></td></tr>
                    <tr><td class="pel">Kujdesi optik</td><td><input class="pako-input" data-pako="${p.id}" data-field="optik" value="${p.optik}"></td></tr>
                    <tr><td class="pel">Kujdesi për dëgim</td><td><input class="pako-input" data-pako="${p.id}" data-field="degim" value="${p.degim}"></td></tr>
                    <tr><td class="pel">Kujdesi psikiatrik</td><td><input class="pako-input" data-pako="${p.id}" data-field="psikiatrik" value="${p.psikiatrik}"></td></tr>
                    <tr><td class="pel">Fizioterapia</td><td><input class="pako-input" data-pako="${p.id}" data-field="fizioterapi" value="${p.fizioterapi}"></td></tr>
                    <tr><td class="pel">Autoambulanca</td><td><input class="pako-input" data-pako="${p.id}" data-field="autoambulanca" value="${p.autoambulanca}"></td></tr>
                    <tr><td class="pel">Aksidenti</td><td><input class="pako-input" data-pako="${p.id}" data-field="aksidentit" value="${p.aksidentit}"></td></tr>
                    <tr><td class="pel">Onkologjike</td><td><input class="pako-input" data-pako="${p.id}" data-field="onkologjike" value="${p.onkologjike}"></td></tr>
                    <tr><td colspan="2" class="pako-section-hdr">Primet ${eshteIndivid ? 'vjetore' : 'mujore'}</td></tr>
                    <tr><td class="pel">Primi mbi 18 vjeç (€)</td><td><input class="pako-input" data-pako="${p.id}" data-field="primi_madh" value="${p.primi_madh}"></td></tr>
                    ${!eshteIndivid ? `<tr><td class="pel">Primi fëmijë nën 18 vjeç (€)</td><td><input class="pako-input" data-pako="${p.id}" data-field="primi_femije" value="${p.primi_femije}"></td></tr>` : ''}
                </table>
            </div>
        </div>
    `).join('');
}

function togglePakoEditor(id, checked) {
    document.getElementById('peb-' + id).style.display = checked ? 'block' : 'none';
}

function tregoBoxAgjenti() {
    const val = document.getElementById('m-kerkuar-nga').value;
    document.getElementById('field-agjenti').style.display = val === 'agjenti' ? 'block' : 'none';
}

function shtoOferte() {
    editIndex = -1;
    document.getElementById('modal-title').textContent = 'Oferte e Re';
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
        pakot: Array.from(document.querySelectorAll('.pako-check-input:checked')).map(cb => {
            const pakoId = cb.value;
            const vlerat = {};
            document.querySelectorAll(`.pako-input[data-pako="${pakoId}"]`).forEach(inp => {
                vlerat[inp.dataset.field] = inp.value;
            });
            return { id: pakoId, ...vlerat };
        }),
        krijuarNga: JSON.parse(localStorage.getItem('user_aktual'))?.username || 'agon',
        krijuarNgaEmri: (() => { const u = JSON.parse(localStorage.getItem('user_aktual')); return u ? `${u.emri} ${u.mbiemri||''}`.trim() : 'Agon'; })(),
        dataKrijimit: today.toISOString().split('T')[0],
        dataSkadon: skadon.toISOString().split('T')[0]
    };

    if (editIndex >= 0) {
        ofertat[editIndex] = oferta;
    } else {
        oferta.realizuar = false;
        ofertat.push(oferta);
    }

    ruajNeStorage();
    mbyllModal();
    renderTabela();
}

function editoOferte(index) {
    editIndex = index;
    const o = ofertat[index];
    document.getElementById('modal-title').textContent = 'Edito Oferten';
    document.getElementById('m-emri').value = o.emri;
    document.getElementById('m-email').value = o.email || '';
    document.getElementById('m-kerkuar-nga').value = o.kerkuarNga || 'direkt';
    document.getElementById('m-agjenti').value = o.agjenti || '';
    tregoBoxAgjenti();

    const btns = document.querySelectorAll('.lloji-btn');
    const llojiMap = { 'individ': 0, 'familje': 1, 'biznes': 2 };
    zgjidhLlojin(o.lloji, btns[llojiMap[o.lloji] || 0]);

    document.querySelectorAll('.pako-check input').forEach(cb => {
        cb.checked = (o.pakot || []).includes(cb.value);
    });

    document.getElementById('modal-overlay').classList.add('active');
}

function fshijOferte(index) {
    if (confirm('A jeni i sigurt qe doni te fshini kete oferte?')) {
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
    if (dite <= 7) return { teksti: dite + ' dite', klasa: 'skadon-warning' };
    return { teksti: dite + ' dite', klasa: 'skadon-ok' };
}

function dergoEmail(index) {
    const o = ofertat[index];
    if (!o.email) {
        alert('Klienti nuk ka email te regjistruar!');
        return;
    }
    const subject = encodeURIComponent('Oferte nga SIGAL Insurance Group - ' + o.emri);
    const body = encodeURIComponent(
        'I nderuar ' + o.emri + ',\n\nJu dergojme oferten tone per sigurim shendetsor.\n\nPakot e zgjedhura: ' + (o.pakot || []).join(', ') + '\nValiditeti: 30 dite nga ' + o.dataKrijimit + '\n\nMe respekt,\nSIGAL Insurance Group'
    );
    window.open('mailto:' + o.email + '?subject=' + subject + '&body=' + body);
}

function krijoKontrate(index) {
    const confirmed = confirm('A jeni i sigurt qe doni te krijoni kontrate?\nOferta eshte pranuar?');
    if (!confirmed) return;

    const o = ofertat[index];
    const kontratData = {
        emri: o.emri,
        lloji: o.lloji,
        email: o.email || '',
        pakot: o.pakot || [],
        ngaOferta: true
    };
    ofertat[index].realizuar = true;
    ruajNeStorage();
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
            window.open('https://sigal-platform-production.up.railway.app/api/shkarko/' + data.fileName, '_blank');
        } else {
            alert('Gabim: ' + data.error);
        }
    } catch (err) {
        alert('Serveri nuk eshte aktiv!');
    }
}

function filtro() {
    renderTabela();
}

function renderTabela() {
    const filterLloji = document.getElementById('filter-lloji').value;
    const filterStatusi = document.getElementById('filter-statusi').value;
    const search = document.getElementById('search-oferte').value.toLowerCase();

    const filterViti = document.getElementById('filter-viti') ? document.getElementById('filter-viti').value : 'all';
    const ofertatFiltruara = filtroSipasRolit(ofertat, 'krijuarNga');
    const filtered = ofertatFiltruara.filter(o => {
        const llojiOk = filterLloji === 'all' || o.lloji === filterLloji;
        const statusi = llogaritStatus(o.dataSkadon);
        const statusOk = filterStatusi === 'all' || statusi === filterStatusi;
        const searchOk = o.emri.toLowerCase().includes(search);
        const vitiOk = filterViti === 'all' || (o.dataKrijimit || '').startsWith(filterViti);
        return llojiOk && statusOk && searchOk && vitiOk;
    }).sort((a, b) => {
        if (!a.dataSkadon) return 1;
        if (!b.dataSkadon) return -1;
        return new Date(a.dataSkadon) - new Date(b.dataSkadon);
    });

    document.getElementById('count-aktive').textContent = ofertatFiltruara.filter(o => llogaritStatus(o.dataSkadon) === 'aktive').length;
    document.getElementById('count-skaduar').textContent = ofertatFiltruara.filter(o => llogaritStatus(o.dataSkadon) === 'skaduar').length;
    document.getElementById('count-individ').textContent = ofertatFiltruara.filter(o => o.lloji === 'individ').length;
    document.getElementById('count-familje').textContent = ofertatFiltruara.filter(o => o.lloji === 'familje').length;
    document.getElementById('count-biznes').textContent = ofertatFiltruara.filter(o => o.lloji === 'biznes').length;
    document.getElementById('count-total').textContent = ofertat.length;
    document.getElementById('count-realizuara').textContent = ofertatFiltruara.filter(o => o.realizuar).length;

    const statusLabels = {
        aktive: 'Aktive',
        skaduar: 'Skaduar'
    };

    const llojiLabels = {
        'individ': 'Individuale',
        'familje': 'Familjare',
        'biznes': 'Biznese'
    };

    const kerkuarLabels = {
        'direkt': 'Direkt',
        'online': 'Online',
        'agjenti': 'Agjenti'
    };

    const tbody = document.getElementById('ofertat-tbody');

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:40px; color:#888;">Nuk ka oferta. Shtoni me "+ Oferte e Re"</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(o => {
        const idx = ofertat.indexOf(o);
        const statusi = llogaritStatus(o.dataSkadon);
        const ditet = llogaritDitet(o.dataSkadon);
        const kerkuar = o.kerkuarNga === 'agjenti' ? 'Agjenti: ' + o.agjenti : (kerkuarLabels[o.kerkuarNga] || '-');
        return '<tr>' +
            '<td>' + o.emri + '</td>' +
            '<td><span class="badge-lloji ' + o.lloji + '">' + (llojiLabels[o.lloji] || o.lloji) + '</span></td>' +
            '<td>' + ((o.pakot || []).join(', ') || '-') + '</td>' +
            '<td>' + (o.krijuarNgaEmri || o.krijuarNga || '-') + '</td>' +
            '<td>' + kerkuar + '</td>' +
            '<td>' + (o.dataKrijimit || '-') + '</td>' +
            '<td class="' + ditet.klasa + '">' + ditet.teksti + '</td>' +
            '<td><span class="badge-status ' + statusi + '">' + statusLabels[statusi] + '</span></td>' +
            '<td><div class="action-btns">' +
                '<button class="btn-edit" onclick="editoOferte(' + idx + ')" title="Edito"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>' +
                '<button class="btn-word" onclick="gjeneroWord(' + idx + ')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg> Word</button>' +
                '<button class="btn-email" onclick="dergoEmail(' + idx + ')" title="Email"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></button>' +
                '<button class="btn-kontrate" onclick="krijoKontrate(' + idx + ')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg> Kontrate</button>' +
                '<button class="btn-delete" onclick="fshijOferte(' + idx + ')" title="Fshi"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>' +
            '</div></td>' +
        '</tr>';
    }).join('');
}

document.addEventListener('DOMContentLoaded', renderTabela);