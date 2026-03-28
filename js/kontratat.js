let kontratat = JSON.parse(localStorage.getItem('kontratat')) || [];
function reloadData() { kontratat = JSON.parse(localStorage.getItem('kontratat')) || []; }
let editIndex = -1;
let activeTab = 'aktive';
let activeSort = 'skadon';

function formatData(data) {
    if (!data) return '-';
    if (data.includes('-') && data.split('-')[0].length === 4) {
        const [y, m, d] = data.split('-');
        return `${d}/${m}/${y}`;
    }
    return data;
}
function ruajNeStorage() { localStorage.setItem('kontratat', JSON.stringify(kontratat)); }

function parseDate(data) {
    if (!data) return null;
    if (data.includes('/')) { const [d, m, y] = data.split('/'); return new Date(`${y}-${m}-${d}`); }
    return new Date(data);
}

function llogaritStatus(mbarimi) {
    if (!mbarimi) return 'ne-pritje';
    const dite = Math.ceil((parseDate(mbarimi) - new Date()) / (1000 * 60 * 60 * 24));
    if (dite < 0) return 'skaduar';
    if (dite <= 35) return 'skadon';
    return 'aktive';
}

function llogaritDitet(mbarimi) {
    if (!mbarimi) return { teksti: '-', klasa: '' };
    const dite = Math.ceil((parseDate(mbarimi) - new Date()) / (1000 * 60 * 60 * 24));
    if (dite < 0) return { teksti: `${Math.abs(dite)}d`, klasa: 'skadon-expired' };
    if (dite <= 35) return { teksti: `${dite}d`, klasa: 'skadon-warning' };
    return { teksti: `${dite}d`, klasa: 'skadon-ok' };
}

function ndryshoTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    filtro();
}
function ndryshoSort(sort) {
    activeSort = sort;
    document.getElementById('sort-skadon').classList.toggle('active', sort === 'skadon');
    document.getElementById('sort-re').classList.toggle('active', sort === 're');
    filtro();
}

function zgjidhLlojin(lloji, btn) {
    document.getElementById('m-lloji').value = lloji;
    document.querySelectorAll('.lloji-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('field-nr-biznesit').style.display = (lloji === 'biznes') ? 'block' : 'none';
    document.getElementById('field-perfaqesuesi').style.display = (lloji === 'biznes' || lloji === 'familje') ? 'block' : 'none';
    document.getElementById('field-nr-personal').style.display = (lloji === 'individ' || lloji === 'familje') ? 'block' : 'none';
    document.getElementById('field-pozita').style.display = (lloji === 'biznes') ? 'block' : 'none';
    const container = document.getElementById('pakot-container');
    if (container) {
        if (lloji === 'individ') {
            container.innerHTML =
                '<label class="pako-check"><input type="checkbox" value="Pako Bazë"> Pako Bazë</label>' +
                '<label class="pako-check"><input type="checkbox" value="Pako Standard"> Pako Standard</label>' +
                '<label class="pako-check"><input type="checkbox" value="Pako Standard Plus"> Pako Standard Plus</label>';
        } else {
            container.innerHTML =
                '<label class="pako-check"><input type="checkbox" value="Pako Bazë"> Pako Bazë</label>' +
                '<label class="pako-check"><input type="checkbox" value="Pako Standard"> Pako Standard</label>' +
                '<label class="pako-check"><input type="checkbox" value="Pako Standard Plus"> Pako Standard Plus</label>' +
                '<label class="pako-check"><input type="checkbox" value="Pako Premium"> Pako Premium</label>' +
                '<label class="pako-check"><input type="checkbox" value="Pako Silver"> Pako Silver</label>' +
                '<label class="pako-check"><input type="checkbox" value="Pako Gold"> Pako Gold</label>';
        }
    }
}
function zgjidhFaturimin(lloji, btn) {
    document.getElementById('m-faturimi-lloji').value = lloji;
    btn.parentElement.querySelectorAll('.lloji-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function shtoKontrate() {
    editIndex = -1;
    document.getElementById('modal-title').textContent = 'Kontratë e Re';
    document.getElementById('m-emri').value = '';
    document.getElementById('m-adresa').value = '';
    document.getElementById('m-nr-biznesit').value = '';
    document.getElementById('m-nr-personal').value = '';
    document.getElementById('m-perfaqesuesi').value = '';
    document.getElementById('m-pozita').value = '';
    document.getElementById('m-data-kontrates').value = '';
    document.querySelectorAll('.pako-check input').forEach(cb => cb.checked = false);
    document.getElementById('m-fillimi').value = '';
    document.getElementById('m-mbarimi').value = '';
    if (document.getElementById('m-email')) document.getElementById('m-email').value = '';
    zgjidhLlojin('individ', document.querySelectorAll('.lloji-btn')[0]);

    const params = new URLSearchParams(window.location.search);
    if (params.get('nga_oferta') === 'true') {
        const data = JSON.parse(localStorage.getItem('oferta_per_kontrate') || '{}');
        if (data.emri) {
            document.getElementById('m-emri').value = data.emri;
            if (data.email && document.getElementById('m-email')) document.getElementById('m-email').value = data.email;
            const btns = document.querySelectorAll('.lloji-btn');
            const llojiMap = { individ: 0, biznes: 1, familje: 2 };
            zgjidhLlojin(data.lloji || 'individ', btns[llojiMap[data.lloji] || 0]);
            setTimeout(() => {
                const pakotEmra = (data.pakotEmra || data.pakot || []).map(p => typeof p === 'object' ? 'Pako ' + (p.emri || p.id) : p);
                document.querySelectorAll('.pako-check input').forEach(cb => {
                    cb.checked = pakotEmra.some(pe => pe === cb.value || cb.value.includes(pe));
                });
            }, 100);
        }
        window.history.replaceState({}, '', 'kontratat.html');
        localStorage.removeItem('oferta_per_kontrate');
    }

    document.getElementById('modal-overlay').classList.add('active');
}

function mbyllModal() { document.getElementById('modal-overlay').classList.remove('active'); }

function ruajKontrate() {
    const emri = document.getElementById('m-emri').value.trim();
    if (!emri) { alert('Ju lutem shkruani emrin e klientit!'); return; }
    const kontrata = {
        emri,
        lloji: document.getElementById('m-lloji').value,
        adresa: document.getElementById('m-adresa').value.trim(),
        nrBiznesit: document.getElementById('m-nr-biznesit').value.trim(),
        nrPersonal: document.getElementById('m-nr-personal').value.trim(),
        perfaqesuesi: document.getElementById('m-perfaqesuesi').value.trim(),
        pozita: document.getElementById('m-pozita').value.trim(),
        dataKontrates: document.getElementById('m-data-kontrates').value,
        pakot: Array.from(document.querySelectorAll('.pako-check input:checked')).map(cb => cb.value),
        fillimi: document.getElementById('m-fillimi').value,
        mbarimi: document.getElementById('m-mbarimi').value,
        email: document.getElementById('m-email') ? document.getElementById('m-email').value.trim() : '',
        faturimiLloji: document.getElementById('m-faturimi-lloji') ? document.getElementById('m-faturimi-lloji').value : 'mujor',
        dataKrijimit: new Date().toISOString().split('T')[0]
    };

    if (editIndex >= 0) {
        kontratat[editIndex] = kontrata;
    } else {
        kontratat.push(kontrata);
        const faturimi = JSON.parse(localStorage.getItem('faturimi_klientet')) || [];
        faturimi.push({
            emri: kontrata.emri,
            kontrataNr: kontrata.lloji === 'biznes' ? kontrata.nrBiznesit : kontrata.nrPersonal,
            nrPersonal: kontrata.nrPersonal,
            nrBiznesit: kontrata.nrBiznesit,
            lloji: kontrata.lloji,
            dataFillimit: kontrata.fillimi,
            dataMbarimit: kontrata.mbarimi,
            email: kontrata.email,
            faturimiLloji: kontrata.faturimiLloji || 'mujor',
            dergesa: 'email',
            afati: 30,
            statuset: {}
        });
        localStorage.setItem('faturimi_klientet', JSON.stringify(faturimi));
    }
    ruajNeStorage();
    mbyllModal();
    renderTabela();
}

function editoKontrate(index) {
    editIndex = index;
    const k = kontratat[index];
    document.getElementById('modal-title').textContent = 'Edito Kontratë';
    document.getElementById('m-emri').value = k.emri;
    document.getElementById('m-adresa').value = k.adresa || '';
    document.getElementById('m-nr-biznesit').value = k.nrBiznesit || '';
    document.getElementById('m-nr-personal').value = k.nrPersonal || '';
    document.getElementById('m-perfaqesuesi').value = k.perfaqesuesi || '';
    document.getElementById('m-pozita').value = k.pozita || '';
    document.getElementById('m-data-kontrates').value = k.dataKontrates || '';
    document.querySelectorAll('.pako-check input').forEach(cb => { cb.checked = (k.pakot || []).includes(cb.value); });
    document.getElementById('m-fillimi').value = k.fillimi || '';
    document.getElementById('m-mbarimi').value = k.mbarimi || '';
    if (document.getElementById('m-email')) document.getElementById('m-email').value = k.email || '';
    const btns = document.querySelectorAll('.lloji-btn');
    const llojiMap = { individ: 0, biznes: 1, familje: 2 };
    zgjidhLlojin(k.lloji, btns[llojiMap[k.lloji] || 0]);
    document.getElementById('modal-overlay').classList.add('active');
}

function fshijKontrate(index) {
    if (confirm('A jeni i sigurt që doni të fshini këtë kontratë?')) {
        kontratat.splice(index, 1);
        ruajNeStorage();
        renderTabela();
    }
}

function rinovoKontrate(index) {
    if (!confirm('Rinovo kontratën për 1 vit?')) return;
    const k = kontratat[index];
    kontratat[index].arkivuar = true;
    const fillimRi = k.mbarimi ? new Date(parseDate(k.mbarimi).getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const mbarimRi = new Date(new Date(fillimRi).setFullYear(new Date(fillimRi).getFullYear() + 1) - 86400000).toISOString().split('T')[0];
    const kontratRe = { ...k, fillimi: fillimRi, mbarimi: mbarimRi, dataKontrates: fillimRi, dataKrijimit: new Date().toISOString().split('T')[0], arkivuar: false };
    kontratat.push(kontratRe);
    ruajNeStorage();
    const faturimi = JSON.parse(localStorage.getItem('faturimi_klientet')) || [];
    const idxF = faturimi.findIndex(f => f.emri === k.emri && (f.nrPersonal === k.nrPersonal || f.nrBiznesit === k.nrBiznesit));
    if (idxF >= 0) {
        faturimi[idxF].dataFillimit = fillimRi;
        faturimi[idxF].dataMbarimit = mbarimRi;
        localStorage.setItem('faturimi_klientet', JSON.stringify(faturimi));
    }
    renderTabela();
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
        } else { alert('Gabim: ' + data.error); }
    } catch (err) { alert('Serveri nuk është aktiv!'); }
}

function filtro() { renderTabela(); }

let skadVitetOpen = {};

function toggleSkadViti(viti) {
    skadVitetOpen[viti] = !skadVitetOpen[viti];
    renderTabela();
}

function renderTabela() {
    const filterLloji = document.getElementById('filter-lloji').value;
    const search = document.getElementById('search-kontrate').value.toLowerCase();
    const kontratatRolit = filtroSipasRolit(kontratat, 'krijuarNga');

    const aktive = kontratatRolit.filter(k => !k.arkivuar && llogaritStatus(k.mbarimi) !== 'skaduar');
    const skaduar = kontratatRolit.filter(k => llogaritStatus(k.mbarimi) === 'skaduar' || k.arkivuar);

    document.getElementById('tab-count-aktive').textContent = aktive.length;
    document.getElementById('tab-count-skaduar').textContent = skaduar.length;

    const joArkivuar = kontratatRolit.filter(k => !k.arkivuar);
    const stTotal = joArkivuar.length;
    const stAktive = joArkivuar.filter(k => llogaritStatus(k.mbarimi) === 'aktive').length;
    const stSkadon = joArkivuar.filter(k => llogaritStatus(k.mbarimi) === 'skadon').length;
    const stSkaduar = joArkivuar.filter(k => llogaritStatus(k.mbarimi) === 'skaduar').length;

    document.getElementById('st-total').textContent = stTotal;
    document.getElementById('st-aktive').textContent = stAktive;
    document.getElementById('st-skadon').textContent = stSkadon;
    document.getElementById('st-skaduar').textContent = stSkaduar;

    const llojiNames = { individ: 'Individ', familje: 'Familje', biznes: 'Biznes' };
    document.getElementById('st-llojet').innerHTML = ['individ', 'familje', 'biznes']
        .map(ll => ({ ll, total: joArkivuar.filter(k => k.lloji === ll).length }))
        .filter(d => d.total > 0)
        .map(d => '<span class="strip-chip"><span class="sc-num">' + d.total + '</span> ' + llojiNames[d.ll] + '</span>')
        .join('');

    const barEl = document.getElementById('st-bar');
    const legEl = document.getElementById('st-legend');
    if (stTotal > 0) {
        const pA = Math.round(stAktive / stTotal * 100);
        const pS = Math.round(stSkadon / stTotal * 100);
        const pSk = 100 - pA - pS;
        barEl.innerHTML =
            '<div class="strip-bar-seg" style="width:' + pA + '%;background:#4ade80;border-radius:3px 0 0 3px;"></div>' +
            '<div class="strip-bar-seg" style="width:' + pS + '%;background:#fbbf24;"></div>' +
            '<div class="strip-bar-seg" style="width:' + pSk + '%;background:#fca5a5;border-radius:0 3px 3px 0;"></div>';
        legEl.innerHTML =
            '<span><span class="sl-dot" style="background:#4ade80;"></span>Aktive</span>' +
            '<span><span class="sl-dot" style="background:#fbbf24;"></span>Skadon shpejt</span>' +
            '<span><span class="sl-dot" style="background:#fca5a5;"></span>Skaduar</span>';
    } else {
        barEl.innerHTML = '<div class="strip-bar-seg" style="width:100%;background:rgba(255,255,255,0.08);border-radius:3px;"></div>';
        legEl.innerHTML = '';
    }

    const tbody = document.getElementById('kontratat-tbody');

    if (activeTab === 'aktive') {
        const filtered = aktive.filter(k => {
            const llojiOk = filterLloji === 'all' || k.lloji === filterLloji;
            const searchOk = k.emri.toLowerCase().includes(search) || (k.nrPersonal || '').toLowerCase().includes(search) || (k.nrBiznesit || '').toLowerCase().includes(search);
            return llojiOk && searchOk;
        });
        const sorted = [...filtered].sort((a, b) => {
            if (activeSort === 're') return (b.dataKrijimit || '').localeCompare(a.dataKrijimit || '');
            if (!a.mbarimi) return 1;
            if (!b.mbarimi) return -1;
            return parseDate(a.mbarimi) - parseDate(b.mbarimi);
        });
        if (sorted.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#888;">Nuk ka kontrata aktive.</td></tr>';
            return;
        }
        tbody.innerHTML = sorted.map(k => renderRow(k)).join('');
        return;
    }

    // Tab Skaduar — grupim foldable sipas vitit
    const filtered = skaduar.filter(k => {
        const llojiOk = filterLloji === 'all' || k.lloji === filterLloji;
        const searchOk = k.emri.toLowerCase().includes(search) || (k.nrPersonal || '').toLowerCase().includes(search) || (k.nrBiznesit || '').toLowerCase().includes(search);
        return llojiOk && searchOk;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#888;">Nuk ka kontrata të skaduara.</td></tr>';
        return;
    }

    const sipasVitit = {};
    filtered.forEach(k => {
        let viti = '?';
        const mb = k.mbarimi || '';
        if (mb.includes('-')) viti = mb.substring(0, 4);
        else if (mb.includes('/')) { const parts = mb.split('/'); viti = parts[2] || '?'; }
        if (!sipasVitit[viti]) sipasVitit[viti] = [];
        sipasVitit[viti].push(k);
    });

    const vitetSorted = Object.keys(sipasVitit).sort((a, b) => b.localeCompare(a));

    let html = '';
    vitetSorted.forEach(viti => {
        const lista = sipasVitit[viti];
        const isOpen = skadVitetOpen[viti] !== false;
        html += '<tr><td colspan="8" style="padding:0;border:none;">' +
            '<div onclick="toggleSkadViti(\'' + viti + '\')" style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:#f0f4ff;cursor:pointer;border-bottom:1px solid #e5e9f0;user-select:none;">' +
            '<span style="font-size:10px;color:#002B5C;">' + (isOpen ? '▾' : '▸') + '</span>' +
            '<span style="font-size:12px;font-weight:700;color:#002B5C;">' + viti + '</span>' +
            '<span style="font-size:10px;background:#002B5C;color:white;padding:1px 8px;border-radius:10px;font-weight:700;">' + lista.length + '</span>' +
            '</div></td></tr>';
        if (isOpen) {
            const sorted = [...lista].sort((a, b) => {
                if (!a.mbarimi) return 1;
                if (!b.mbarimi) return -1;
                return parseDate(b.mbarimi) - parseDate(a.mbarimi);
            });
            html += sorted.map(k => renderRow(k)).join('');
        }
    });
    tbody.innerHTML = html;
}

function renderRow(k) {
    const idx = kontratat.indexOf(k);
    const statusi = llogaritStatus(k.mbarimi);
    const ditet = llogaritDitet(k.mbarimi);
    const nrId = k.lloji === 'biznes' ? (k.nrBiznesit || '-') : (k.nrPersonal || '-');
    const llojiLabels = { individ: 'Individ', biznes: 'Biznes', familje: 'Familje' };
    const statusLabels = { aktive: 'Aktive', skaduar: 'Skaduar', 'ne-pritje': 'Në Pritje', skadon: 'Skadon' };
    let dotColor = '#22c55e';
    if (ditet.klasa === 'skadon-warning') dotColor = '#f59e0b';
    if (ditet.klasa === 'skadon-expired') dotColor = '#ef4444';
    const pakotArr = k.pakot || [];
    let pakotTxt = '-';
    if (pakotArr.length <= 2) pakotTxt = pakotArr.join(', ');
    else pakotTxt = pakotArr.slice(0, 2).join(', ') + ' <span style="background:#e5e9f0;color:#002B5C;font-size:9px;padding:1px 5px;border-radius:8px;font-weight:700;">+' + (pakotArr.length - 2) + '</span>';

    return '<tr>' +
        '<td><div class="klient-name">' + k.emri + (k.arkivuar ? ' <span style="font-size:9px;color:#94a3b8;font-weight:600;">RINOVUAR</span>' : '') + '</div><div class="klient-sub">' + (k.adresa || '') + '</div></td>' +
        '<td style="font-size:11px;color:#6b7a8d;">' + nrId + '</td>' +
        '<td><span class="badge-lloji ' + k.lloji + '">' + (llojiLabels[k.lloji] || k.lloji) + '</span></td>' +
        '<td style="font-size:11px;color:#6b7a8d;">' + pakotTxt + '</td>' +
        '<td style="font-size:11px;color:#6b7a8d;">' + formatData(k.fillimi) + '</td>' +
        '<td><div class="skadon-cell"><span class="skadon-dot" style="background:' + dotColor + ';"></span>' + ditet.teksti + '</div></td>' +
        '<td><span class="badge-status ' + statusi + '">' + (statusLabels[statusi] || statusi) + '</span></td>' +
        '<td><div class="action-icon-btns">' +
            '<button onclick="rinovoKontrate(' + idx + ')" title="Rinovo"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></button>' +
            '<button onclick="editoKontrate(' + idx + ')" title="Edito"><svg viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>' +
            '<button class="btn-text btn-word" onclick="gjeneroWord(' + idx + ')" title="Word"><svg viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg> Word</button>' +
            '<button onclick="fshijKontrate(' + idx + ')" title="Fshi"><svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>' +
        '</div></td>' +
    '</tr>';
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('m-fillimi').addEventListener('input', function () {
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
            document.getElementById('m-mbarimi').value =
                String(mbarimi.getDate()).padStart(2, '0') + '/' +
                String(mbarimi.getMonth() + 1).padStart(2, '0') + '/' +
                mbarimi.getFullYear();
        }
    });
    ['m-mbarimi', 'm-data-kontrates'].forEach(id => {
        document.getElementById(id).addEventListener('input', function () {
            let v = this.value.replace(/\D/g, '').slice(0, 8);
            if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
            if (v.length >= 6) v = v.slice(0, 5) + '/' + v.slice(5);
            this.value = v;
        });
    });

    renderTabela();
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const params = new URLSearchParams(window.location.search);
    if (params.get('nga_oferta') === 'true') {
        shtoKontrate();
    }
});