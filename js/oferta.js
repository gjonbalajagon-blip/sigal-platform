let ofertat = JSON.parse(localStorage.getItem('ofertat')) || [];
let editIndex = -1;

function ruajNeStorage() {
    localStorage.setItem('ofertat', JSON.stringify(ofertat));
}

// ====== DRAWER MODAL (Pika 6) ======
function shtoOferte() {
    editIndex = -1;
    document.getElementById('modal-title').textContent = 'Ofertë e Re';
    document.getElementById('m-emri').value = '';
    document.getElementById('m-email').value = '';
    document.getElementById('m-kerkuar-nga').value = 'direkt';
    document.getElementById('m-agjenti').value = '';
    document.getElementById('field-agjenti').style.display = 'none';
    document.getElementById('version-panel').style.display = 'none';
    document.getElementById('oferta-summary').style.display = 'none';
    zgjidhLlojin('individ', document.querySelectorAll('.drawer-lloji-btn')[0]);
    document.getElementById('drawer-overlay').classList.add('active');
}

function mbyllDrawer() {
    document.getElementById('drawer-overlay').classList.remove('active');
}
// Alias per compatibility
function mbyllModal() { mbyllDrawer(); }

function zgjidhLlojin(lloji, btn) {
    document.getElementById('m-lloji').value = lloji;
    document.querySelectorAll('.drawer-lloji-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const pakotList = lloji === 'individ' ? PAKOT.individ : PAKOT.familje_biznes;
    const eshteIndivid = lloji === 'individ';
    const container = document.getElementById('pakot-container');

    container.innerHTML = pakotList.map(p => `
        <div class="drawer-pako-editor" id="pe-${p.id}">
            <div class="drawer-pako-editor-header">
                <input type="checkbox" class="pako-check-input" value="${p.id}" onchange="togglePakoEditor('${p.id}', this.checked)">
                <strong>${p.emri}</strong>
            </div>
            <div class="drawer-pako-editor-body" id="peb-${p.id}">
                <table>
                    <tr><td>Zona e mbuluar</td><td><input class="pako-input" data-pako="${p.id}" data-field="zona" value="${p.zona}"></td></tr>
                    <tr><td>Shuma e Siguruar (€)</td><td><input class="pako-input" data-pako="${p.id}" data-field="shuma" value="${p.shuma}"></td></tr>
                    <tr><td colspan="2" class="pako-section-hdr">Hospitalore</td></tr>
                    <tr><td>Mbulimi</td><td><input class="pako-input" data-pako="${p.id}" data-field="hospitalore" value="${p.hospitalore}"></td></tr>
                    <tr><td colspan="2" class="pako-section-hdr">Ambulantore</td></tr>
                    <tr><td>Mbulimi</td><td><input class="pako-input" data-pako="${p.id}" data-field="ambulatore" value="${p.ambulatore}"></td></tr>
                    <tr><td colspan="2" class="pako-section-hdr">Trajtime tjera</td></tr>
                    <tr><td>Shtatzania</td><td><input class="pako-input" data-pako="${p.id}" data-field="shtatzania" value="${p.shtatzania}"></td></tr>
                    <tr><td>Dentar</td><td><input class="pako-input" data-pako="${p.id}" data-field="dentar" value="${p.dentar}"></td></tr>
                    <tr><td>Optik</td><td><input class="pako-input" data-pako="${p.id}" data-field="optik" value="${p.optik}"></td></tr>
                    <tr><td>Dëgim</td><td><input class="pako-input" data-pako="${p.id}" data-field="degim" value="${p.degim}"></td></tr>
                    <tr><td>Psikiatrik</td><td><input class="pako-input" data-pako="${p.id}" data-field="psikiatrik" value="${p.psikiatrik}"></td></tr>
                    <tr><td>Fizioterapi</td><td><input class="pako-input" data-pako="${p.id}" data-field="fizioterapi" value="${p.fizioterapi}"></td></tr>
                    <tr><td>Autoambulanca</td><td><input class="pako-input" data-pako="${p.id}" data-field="autoambulanca" value="${p.autoambulanca}"></td></tr>
                    <tr><td>Aksidenti</td><td><input class="pako-input" data-pako="${p.id}" data-field="aksidentit" value="${p.aksidentit}"></td></tr>
                    <tr><td>Onkologjike</td><td><input class="pako-input" data-pako="${p.id}" data-field="onkologjike" value="${p.onkologjike}"></td></tr>
                    <tr><td colspan="2" class="pako-section-hdr">Primet ${eshteIndivid ? 'vjetore' : 'mujore'}</td></tr>
                    <tr><td>Primi mbi 18 vjeç (€)</td><td><input class="pako-input" data-pako="${p.id}" data-field="primi_madh" value="${p.primi_madh}"></td></tr>
                    ${!eshteIndivid ? `<tr><td>Primi fëmijë (€)</td><td><input class="pako-input" data-pako="${p.id}" data-field="primi_femije" value="${p.primi_femije}"></td></tr>` : ''}
                </table>
            </div>
        </div>
    `).join('');
}

function togglePakoEditor(id, checked) {
    const body = document.getElementById('peb-' + id);
    const card = document.getElementById('pe-' + id);
    body.style.display = checked ? 'block' : 'none';
    if (checked) {
        card.classList.add('selected');
    } else {
        card.classList.remove('selected');
    }
}

function tregoBoxAgjenti() {
    const val = document.getElementById('m-kerkuar-nga').value;
    document.getElementById('field-agjenti').style.display = val === 'agjenti' ? 'block' : 'none';
}

// ====== VERSIONING (Pika 5) ======
function toggleVersions() {
    document.getElementById('version-body').classList.toggle('open');
}

function renderVersions(versione) {
    if (!versione || versione.length === 0) return;
    const body = document.getElementById('version-body');
    document.getElementById('version-count').textContent = versione.length;

    body.innerHTML = versione.map((v, i) => {
        const pakotTxt = (v.pakot || []).map(p => typeof p === 'object' ? (p.emri || p.id) : p).join(', ');
        const isCurrent = i === versione.length - 1;
        return `<div class="version-item">
            <span class="version-dot ${isCurrent ? '' : 'old'}"></span>
            <span class="v-date">${v.data || '-'}</span>
            <span class="v-pakot">${pakotTxt || '-'}</span>
            ${!isCurrent ? `<button class="v-restore" onclick="riktheVersion(${i})">Rikthe</button>` : '<span style="margin-left:auto;font-size:10px;color:#002B5C;font-weight:600;">Aktuale</span>'}
        </div>`;
    }).reverse().join('');
}

// ====== OFERTA SUMMARY PANEL ======
function toggleSummary() {
    document.getElementById('summary-body').classList.toggle('open');
}

function renderSummary(oferta) {
    const pakotList = oferta.lloji === 'individ' ? PAKOT.individ : PAKOT.familje_biznes;
    const eshteIndivid = oferta.lloji === 'individ';
    const pakot = (oferta.pakot || []).map(p => {
        if (typeof p === 'object') {
            const base = pakotList.find(pk => pk.id === p.id);
            return base ? { ...base, ...p } : p;
        }
        const found = pakotList.find(pk => pk.emri === p || `Pako ${pk.emri}` === p || pk.id === p);
        return found || null;
    }).filter(Boolean);

    if (pakot.length === 0) return;

    const body = document.getElementById('summary-body');
    body.classList.remove('open');
    body.innerHTML = pakot.map((p, i) => `
        <div class="summary-pako">
            <div class="summary-pako-header" onclick="this.nextElementSibling.classList.toggle('open')">
                <h5>${p.emri || p.id}</h5>
                <span class="sp-primi">€ ${p.primi_madh || '-'}${eshteIndivid ? '/vit' : '/muaj'}</span>
            </div>
            <div class="summary-pako-details">
                <table>
                    <tr><td>Zona e mbuluar</td><td>${p.zona || '-'}</td></tr>
                    <tr><td>Shuma e Siguruar</td><td>€ ${p.shuma || '-'}</td></tr>
                    <tr class="summary-section-hdr"><td colspan="2">Trajtimet Hospitalore</td></tr>
                    <tr><td>Mbulimi</td><td>${p.hospitalore || '-'}</td></tr>
                    <tr class="summary-section-hdr"><td colspan="2">Trajtimet Ambulantore</td></tr>
                    <tr><td>Mbulimi</td><td>${p.ambulatore || '-'}</td></tr>
                    <tr class="summary-section-hdr"><td colspan="2">Trajtime tjera</td></tr>
                    <tr><td>Shtatzania dhe lindja</td><td>${p.shtatzania || '-'}</td></tr>
                    <tr><td>Kujdesi dentar</td><td>${p.dentar || '-'}</td></tr>
                    <tr><td>Kujdesi optik</td><td>${p.optik || '-'}</td></tr>
                    <tr><td>Kujdesi për dëgim</td><td>${p.degim || '-'}</td></tr>
                    <tr><td>Kujdesi psikiatrik</td><td>${p.psikiatrik || '-'}</td></tr>
                    <tr><td>Fizioterapia</td><td>${p.fizioterapi || '-'}</td></tr>
                    <tr><td>Autoambulanca</td><td>${p.autoambulanca || '-'}</td></tr>
                    <tr><td>Aksidenti</td><td>${p.aksidentit || '-'}</td></tr>
                    <tr><td>Onkologjike</td><td>${p.onkologjike || '-'}</td></tr>
                    <tr class="summary-section-hdr"><td colspan="2">Primet</td></tr>
                    <tr><td>Primi mbi 18 vjeç</td><td>€ ${p.primi_madh || '-'}${eshteIndivid ? '/vit' : '/muaj'}</td></tr>
                    ${p.primi_femije ? `<tr><td>Primi fëmijë nën 18 vjeç</td><td>€ ${p.primi_femije}${eshteIndivid ? '/vit' : '/muaj'}</td></tr>` : ''}
                </table>
            </div>
        </div>
    `).join('');
}

function riktheVersion(vIdx) {
    if (editIndex < 0) return;
    const o = ofertat[editIndex];
    const v = o.versione[vIdx];
    if (!v || !confirm('Rikthe versionin e dates ' + (v.data || '?') + '?')) return;

    // Mbush format me te dhenat e versionit
    const btns = document.querySelectorAll('.drawer-lloji-btn');
    const llojiMap = { 'individ': 0, 'familje': 1, 'biznes': 2 };
    zgjidhLlojin(v.lloji || o.lloji, btns[llojiMap[v.lloji || o.lloji] || 0]);

    setTimeout(() => {
        const pakotIds = (v.pakot || []).map(p => typeof p === 'object' ? p.id : p);
        document.querySelectorAll('.pako-check-input').forEach(cb => {
            const isSelected = pakotIds.includes(cb.value);
            cb.checked = isSelected;
            togglePakoEditor(cb.value, isSelected);
            if (isSelected) {
                const customPako = (v.pakot || []).find(p => typeof p === 'object' && p.id === cb.value);
                if (customPako) {
                    document.querySelectorAll(`.pako-input[data-pako="${cb.value}"]`).forEach(inp => {
                        if (customPako[inp.dataset.field] !== undefined) {
                            inp.value = customPako[inp.dataset.field];
                        }
                    });
                }
            }
        });
    }, 50);
}

function ruajOferte() {
    const emri = document.getElementById('m-emri').value.trim();
    if (!emri) { alert('Ju lutem shkruani emrin e klientit!'); return; }

    const today = new Date();
    const skadon = new Date(today);
    skadon.setDate(skadon.getDate() + 30);

    const kerkuarNga = document.getElementById('m-kerkuar-nga').value;
    const agjenti = document.getElementById('m-agjenti').value.trim();

    const pakotAktuale = Array.from(document.querySelectorAll('.pako-check-input:checked')).map(cb => {
        const pakoId = cb.value;
        const vlerat = {};
        document.querySelectorAll(`.pako-input[data-pako="${pakoId}"]`).forEach(inp => {
            vlerat[inp.dataset.field] = inp.value;
        });
        return { id: pakoId, ...vlerat };
    });

    if (pakotAktuale.length === 0) {
        alert('Ju lutem zgjidhni së paku një paketë!');
        return;
    }

    const oferta = {
        emri,
        lloji: document.getElementById('m-lloji').value,
        email: document.getElementById('m-email').value.trim(),
        kerkuarNga: kerkuarNga,
        agjenti: kerkuarNga === 'agjenti' ? agjenti : '',
        pakot: pakotAktuale,
        krijuarNga: JSON.parse(localStorage.getItem('user_aktual'))?.username || 'agon',
        krijuarNgaEmri: (() => { const u = JSON.parse(localStorage.getItem('user_aktual')); return u ? `${u.emri} ${u.mbiemri||''}`.trim() : 'Agon'; })(),
        krijuarNgaEmail: JSON.parse(localStorage.getItem('user_aktual'))?.email || 'gjonbalajagon@gmail.com',
        dataKrijimit: today.toISOString().split('T')[0],
        dataSkadon: skadon.toISOString().split('T')[0]
    };

    if (editIndex >= 0) {
        // Ruaj fushat qe nuk duhet me u mbishkrua
        oferta.realizuar = ofertat[editIndex].realizuar;
        oferta.konfirmuar = ofertat[editIndex].konfirmuar;
        oferta.pakaZgjedhur = ofertat[editIndex].pakaZgjedhur;
        oferta.komentKlient = ofertat[editIndex].komentKlient;
        oferta.dataKonfirmimit = ofertat[editIndex].dataKonfirmimit;

        // ====== VERSIONING: Ruaj versionin paraprak ======
        const versionetEVjetra = ofertat[editIndex].versione || [];
        // Shto versionin aktual (para ndryshimit) si version historik
        versionetEVjetra.push({
            data: ofertat[editIndex].dataKrijimit || new Date().toISOString().split('T')[0],
            lloji: ofertat[editIndex].lloji,
            pakot: ofertat[editIndex].pakot,
            emri: ofertat[editIndex].emri
        });
        oferta.versione = versionetEVjetra;
        oferta.dataKrijimit = ofertat[editIndex].dataKrijimit; // Mbaj daten origjinale

        ofertat[editIndex] = oferta;
    } else {
        oferta.realizuar = false;
        oferta.versione = [];
        ofertat.push(oferta);
    }

    ruajNeStorage();
    mbyllDrawer();
    renderTabela();
}

// ====== EDIT ME PRE-SELECT (Bug fix 1 + Versioning) ======
function editoOferte(index) {
    editIndex = index;
    const o = ofertat[index];
    document.getElementById('modal-title').textContent = 'Edito Ofertën';
    document.getElementById('m-emri').value = o.emri;
    document.getElementById('m-email').value = o.email || '';
    document.getElementById('m-kerkuar-nga').value = o.kerkuarNga || 'direkt';
    document.getElementById('m-agjenti').value = o.agjenti || '';
    tregoBoxAgjenti();

    const btns = document.querySelectorAll('.drawer-lloji-btn');
    const llojiMap = { 'individ': 0, 'familje': 1, 'biznes': 2 };
    zgjidhLlojin(o.lloji, btns[llojiMap[o.lloji] || 0]);

    // Pre-select pakot
    const pakotIds = (o.pakot || []).map(p => {
        if (typeof p === 'object') return p.id;
        const pakotList = o.lloji === 'individ' ? PAKOT.individ : PAKOT.familje_biznes;
        const found = pakotList.find(pk => pk.emri === p || `Pako ${pk.emri}` === p || pk.id === p);
        return found ? found.id : p;
    });

    setTimeout(() => {
        document.querySelectorAll('.pako-check-input').forEach(cb => {
            const isSelected = pakotIds.includes(cb.value);
            cb.checked = isSelected;
            togglePakoEditor(cb.value, isSelected);
            if (isSelected) {
                const customPako = (o.pakot || []).find(p => typeof p === 'object' && p.id === cb.value);
                if (customPako) {
                    document.querySelectorAll(`.pako-input[data-pako="${cb.value}"]`).forEach(inp => {
                        if (customPako[inp.dataset.field] !== undefined) {
                            inp.value = customPako[inp.dataset.field];
                        }
                    });
                }
            }
        });
    }, 50);

    // Shfaq versioning panel nese ka versione
    const vPanel = document.getElementById('version-panel');
    if (o.versione && o.versione.length > 0) {
        vPanel.style.display = 'block';
        renderVersions(o.versione);
    } else {
        vPanel.style.display = 'none';
    }

    // Shfaq summary panel (collapsed, klikohet per me u hap)
    const sPanel = document.getElementById('oferta-summary');
    if (o.pakot && o.pakot.length > 0) {
        sPanel.style.display = 'block';
        sPanel.classList.remove('open');
        sPanel.classList.add('open');
        renderSummary(o);
    } else {
        sPanel.style.display = 'none';
    }

    document.getElementById('drawer-overlay').classList.add('active');
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
    const link = `https://sigal-platform-shendet.vercel.app/pages/oferta-view.html?id=${index}`;
    const subject = encodeURIComponent('Ofertë nga SIGAL Insurance Group - ' + o.emri);
    const body = encodeURIComponent(
        'I nderuar ' + o.emri + ',\n\nJu dërgojmë ofertën tonë për sigurim shëndetësor.\n\nJu lutem klikoni linkun më poshtë për të parë paketën dhe për të konfirmuar zgjedhjen tuaj:\n\n' + link + '\n\nValiditeti: 30 ditë nga ' + o.dataKrijimit + '\n\nMe respekt,\nSIGAL Insurance Group'
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

// ====== WORD GEN FIX (Bug fix 2) ======
async function gjeneroWord(index) {
    const o = ofertat[index];
    try {
        const pakotEmra = (o.pakot || []).map(p => {
            if (typeof p === 'object') {
                const pakotList = o.lloji === 'individ' ? PAKOT.individ : PAKOT.familje_biznes;
                const found = pakotList.find(pk => pk.id === p.id);
                return found ? `Pako ${found.emri}` : p.id;
            }
            return p;
        });

        const payload = {
            emri: o.emri,
            lloji: o.lloji === 'familje' || o.lloji === 'biznes' ? 'familje_biznes' : o.lloji,
            pakot: pakotEmra
        };

        const response = await fetch('https://sigal-platform-production.up.railway.app/api/gjenero-oferte', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
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

// ====== COPY LINK (Bug fix 3) ======
function kopjoLink(index) {
    const link = `https://sigal-platform-shendet.vercel.app/pages/oferta-view.html?id=${index}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
            tregoToast('Linku u kopjua!');
        }).catch(() => {
            kopjoFallback(link);
        });
    } else {
        kopjoFallback(link);
    }
}

function kopjoFallback(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        tregoToast('Linku u kopjua!');
    } catch (e) {
        alert('Kopjimi dështoi. Linku: ' + text);
    }
    document.body.removeChild(ta);
}

function tregoToast(msg) {
    let toast = document.getElementById('toast-msg');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-msg';
        toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#002B5C;color:white;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;opacity:0;transition:opacity 0.3s;';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

function filtro() {
    renderTabela();
}

// ====== RENDER ME STATS REALIZUARA (Pika 4) ======
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

    // Stats kryesore
    document.getElementById('count-aktive').textContent = ofertatFiltruara.filter(o => llogaritStatus(o.dataSkadon) === 'aktive').length;
    document.getElementById('count-skaduar').textContent = ofertatFiltruara.filter(o => llogaritStatus(o.dataSkadon) === 'skaduar').length;
    document.getElementById('count-total').textContent = ofertat.length;
    document.getElementById('count-realizuara').textContent = ofertatFiltruara.filter(o => o.realizuar).length;

    // Stats sipas llojit
    document.getElementById('count-individ').textContent = ofertatFiltruara.filter(o => o.lloji === 'individ').length;
    document.getElementById('count-familje').textContent = ofertatFiltruara.filter(o => o.lloji === 'familje').length;
    document.getElementById('count-biznes').textContent = ofertatFiltruara.filter(o => o.lloji === 'biznes').length;

    // ====== PIKA 4: Realizuara sipas llojit ======
    const rIndivid = ofertatFiltruara.filter(o => o.lloji === 'individ' && o.realizuar).length;
    const rFamilje = ofertatFiltruara.filter(o => o.lloji === 'familje' && o.realizuar).length;
    const rBiznes = ofertatFiltruara.filter(o => o.lloji === 'biznes' && o.realizuar).length;
    document.getElementById('count-individ-r').textContent = rIndivid > 0 ? rIndivid + ' realizuar' : '';
    document.getElementById('count-familje-r').textContent = rFamilje > 0 ? rFamilje + ' realizuar' : '';
    document.getElementById('count-biznes-r').textContent = rBiznes > 0 ? rBiznes + ' realizuar' : '';

    const statusLabels = { aktive: 'Aktive', skaduar: 'Skaduar' };
    const llojiLabels = { 'individ': 'Individuale', 'familje': 'Familjare', 'biznes': 'Biznese' };
    const kerkuarLabels = { 'direkt': 'Direkt', 'online': 'Online', 'agjenti': 'Agjenti' };

    const tbody = document.getElementById('ofertat-tbody');

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:40px; color:#888;">Nuk ka oferta. Shtoni me "+ Ofertë e Re"</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(o => {
        const idx = ofertat.indexOf(o);
        const statusi = llogaritStatus(o.dataSkadon);
        const ditet = llogaritDitet(o.dataSkadon);
        const kerkuar = o.kerkuarNga === 'agjenti' ? 'Agjenti: ' + o.agjenti : (kerkuarLabels[o.kerkuarNga] || '-');
        const vCount = (o.versione || []).length;
        const vBadge = vCount > 0 ? ` <span style="background:#e5e9f0;color:#002B5C;font-size:9px;padding:1px 5px;border-radius:8px;font-weight:700;" title="${vCount} versione">${vCount}v</span>` : '';
        return '<tr>' +
            '<td>' + o.emri + vBadge + '</td>' +
            '<td><span class="badge-lloji ' + o.lloji + '">' + (llojiLabels[o.lloji] || o.lloji) + '</span></td>' +
            '<td>' + ((o.pakot || []).map(p => typeof p === 'object' ? p.emri || p.id : p).join(', ') || '-') + '</td>' +
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
                '<button class="btn-link" onclick="kopjoLink(' + idx + ')" title="Kopjo Link"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>' +
            '</div></td>' +
        '</tr>';
    }).join('');
}

document.addEventListener('DOMContentLoaded', renderTabela);