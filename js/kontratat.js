let kontratat = JSON.parse(localStorage.getItem('kontratat')) || [];
let editIndex = -1;

function formatData(data) {
    if (!data) return '-';
    const [y, m, d] = data.split('-');
    if (!y || !m || !d) return data;
    return `${d}/${m}/${y}`;
}

function ruajNeStorage() {
    localStorage.setItem('kontratat', JSON.stringify(kontratat));
}

function zgjidhLlojin(lloji, btn) {
    document.getElementById('m-lloji').value = lloji;
    document.querySelectorAll('.lloji-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.getElementById('field-nr-biznesit').style.display = (lloji === 'biznes') ? 'block' : 'none';
    document.getElementById('field-perfaqesuesi').style.display = (lloji === 'biznes' || lloji === 'familje') ? 'block' : 'none';
    document.getElementById('field-nr-personal').style.display = (lloji === 'individ' || lloji === 'familje') ? 'block' : 'none';
    document.getElementById('field-pozita').style.display = (lloji === 'biznes') ? 'block' : 'none';

    // Ndrro pakot sipas llojit
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
    zgjidhLlojin('individ', document.querySelectorAll('.lloji-btn')[0]);

    // Kontrollo nese ka te dhena nga oferta
    const params = new URLSearchParams(window.location.search);
    if (params.get('nga_oferta') === 'true') {
        const data = JSON.parse(localStorage.getItem('oferta_per_kontrate') || '{}');
        if (data.emri) {
            document.getElementById('m-emri').value = data.emri;
            const btns = document.querySelectorAll('.lloji-btn');
            const llojiMap = { individ: 0, biznes: 1, familje: 2 };
            zgjidhLlojin(data.lloji || 'individ', btns[llojiMap[data.lloji] || 0]);

            // Tick pakot
            setTimeout(() => {
                document.querySelectorAll('.pako-check input').forEach(cb => {
                    cb.checked = (data.pakot || []).includes(cb.value);
                });
            }, 100);
        }
        // Pastro URL-ne dhe localStorage
        window.history.replaceState({}, '', 'kontratat.html');
        localStorage.removeItem('oferta_per_kontrate');
    }

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

        // Transfer automatik në Faturimi
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

function rinovoKontrate(index) {
    if (!confirm('Rinovo kontratën për 1 vit?')) return;
    const k = kontratat[index];
    kontratat[index].arkivuar = true;

    const fillimRi = k.mbarimi ? new Date(new Date(k.mbarimi).getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const mbarimRi = new Date(new Date(fillimRi).setFullYear(new Date(fillimRi).getFullYear() + 1) - 86400000).toISOString().split('T')[0];

    const kontratRe = { ...k, fillimi: fillimRi, mbarimi: mbarimRi, dataKontrates: fillimRi, dataKrijimit: new Date().toISOString().split('T')[0], arkivuar: false };
    kontratat.push(kontratRe);
    ruajNeStorage();

    // Përditëso Faturimi
    const faturimi = JSON.parse(localStorage.getItem('faturimi_klientet')) || [];
    const idxFaturimi = faturimi.findIndex(f =>
        f.emri === k.emri && (f.nrPersonal === k.nrPersonal || f.nrBiznesit === k.nrBiznesit)
    );
    if (idxFaturimi >= 0) {
        faturimi[idxFaturimi].dataFillimit = fillimRi;
        faturimi[idxFaturimi].dataMbarimit = mbarimRi;
        localStorage.setItem('faturimi_klientet', JSON.stringify(faturimi));
    }

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
    document.getElementById('m-nr-personal').value = k.nrPersonal || '';
    document.getElementById('m-perfaqesuesi').value = k.perfaqesuesi || '';
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
        const arkivuarOk = filterStatusi === 'skaduar' ? true : !k.arkivuar;
        const statusOk = filterStatusi === 'all' ? !k.arkivuar : statusi === filterStatusi;
        const searchOk = k.emri.toLowerCase().includes(search) || (k.nr || '').toLowerCase().includes(search);
        return llojiOk && statusOk && arkivuarOk && searchOk;
    }).sort((a, b) => {
        if (!a.mbarimi) return 1;
        if (!b.mbarimi) return -1;
        return new Date(a.mbarimi) - new Date(b.mbarimi);
    });

    // Stats
    document.getElementById('count-aktive').textContent = kontratat.filter(k => llogaritStatus(k.mbarimi) === 'aktive').length;
    document.getElementById('count-skadon').textContent = kontratat.filter(k => {
        if (!k.mbarimi) return false;
        const dite = Math.ceil((new Date(k.mbarimi) - new Date()) / (1000 * 60 * 60 * 24));
        return dite >= 0 && dite <= 35;
    }).length;
    document.getElementById('count-skaduar').textContent = kontratat.filter(k => llogaritStatus(k.mbarimi) === 'skaduar').length;
    document.getElementById('count-individ').textContent = kontratat.filter(k => k.lloji === 'individ').length;
    document.getElementById('count-familje').textContent = kontratat.filter(k => k.lloji === 'familje').length;
    document.getElementById('count-biznes').textContent = kontratat.filter(k => k.lloji === 'biznes').length;
    document.getElementById('count-total').textContent = kontratat.length;

    const statusLabels = {
        aktive: 'Aktive',
        skaduar: 'Skaduar',
        'ne-pritje': 'Në Pritje'
    };

    const llojiLabels = {
        individ: 'Individ',
        biznes: 'Biznes',
        familje: 'Familje'
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
        <tr${k.arkivuar ? ' style="opacity:0.5"' : ''}>
            <td>
                <div style="display:flex;align-items:center;gap:6px;">
                    <button class="btn-rinovo" onclick="rinovoKontrate(${idx})" title="Rinovo"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></button>
                    ${k.emri}${k.arkivuar ? ' <span style="font-size:10px;color:#94a3b8;font-weight:600;">ARKIVUAR</span>' : ''}
                </div>
            </td>
            <td>${k.lloji === 'biznes' ? (k.nrBiznesit || '-') : (k.nrPersonal || '-')}</td>
              <td><span class="badge-lloji ${k.lloji}">${llojiLabels[k.lloji]}</span></td>
            <td>${(k.pakot || []).join(', ') || '-'}</td>
            <td>${formatData(k.fillimi)}</td>
            <td>${formatData(k.mbarimi)}</td>
            <td class="${ditet.klasa}">${ditet.teksti}</td>
            <td><span class="badge-status ${statusi}">${statusLabels[statusi]}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="editoKontrate(${idx})" title="Edito"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                    <button class="btn-word" onclick="gjeneroWord(${idx})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg> Word</button>
                    <button class="btn-delete" onclick="fshijKontrate(${idx})" title="Fshi"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
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
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('m-fillimi').addEventListener('change', function() {
        const fillimi = new Date(this.value);
        if (!fillimi) return;
        const mbarimi = new Date(fillimi);
        mbarimi.setFullYear(mbarimi.getFullYear() + 1);
        mbarimi.setDate(mbarimi.getDate() - 1);
        document.getElementById('m-mbarimi').value = mbarimi.toISOString().split('T')[0];
    });
    renderTabela();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    // Hap modal automatikisht nese vjen nga oferta
    const params = new URLSearchParams(window.location.search);
    if (params.get('nga_oferta') === 'true') {
        shtoKontrate();
    }
});