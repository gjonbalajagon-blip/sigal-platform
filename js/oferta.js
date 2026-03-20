let ofertat = JSON.parse(localStorage.getItem('ofertat')) || [];
let editIndex = -1;

// ====== TRACKING STATUSET ======
const TAPI='https://sigal-platform-production.up.railway.app';
const STATUSET_TRACK={
    e_krijuar:{label:'E krijuar',color:'#6b7a8d',bg:'#f4f6f9'},
    e_derguar:{label:'E dërguar',color:'#0047AB',bg:'#dbeafe'},
    e_pare:{label:'E parë',color:'#d97706',bg:'#fef3c7'},
    e_konfirmuar:{label:'Konfirmuar ✓',color:'#059669',bg:'#dcfce7'},
    kontrate:{label:'Kontratë',color:'#002B5C',bg:'#e8f0fe'}
};

function getTrackStatus(o) {
    if (o.realizuar) return 'kontrate';
    if (o.konfirmuar) return 'e_konfirmuar';
    if (o.statusi) return o.statusi;
    return 'e_krijuar';
}

function trackBadge(statusi) {
    const s = STATUSET_TRACK[statusi] || STATUSET_TRACK.e_krijuar;
    return '<span style="font-size:9px;font-weight:700;padding:3px 8px;border-radius:10px;background:'+s.bg+';color:'+s.color+';white-space:nowrap">'+s.label+'</span>';
}

function ruajNeStorage() {
    localStorage.setItem('ofertat', JSON.stringify(ofertat));
}

// ====== DRAWER MODAL ======
function shtoOferte() {
    editIndex = -1;
    document.getElementById('modal-title').textContent = 'Ofertë e Re';
    document.getElementById('m-emri').value = '';
    document.getElementById('m-email').value = '';
    document.getElementById('m-kerkuar-nga').value = 'direkt';
    document.getElementById('m-agjenti').value = '';
    document.getElementById('field-agjenti').style.display = 'none';
    document.getElementById('version-panel').style.display = 'none';
    zgjidhLlojin('individ', document.querySelectorAll('.drawer-lloji-btn')[0]);
    document.getElementById('drawer-overlay').classList.add('active');
}

function mbyllDrawer() {
    document.getElementById('drawer-overlay').classList.remove('active');
}
function mbyllModal() { mbyllDrawer(); }

// ====== INLINE EDITING: Pako Card System ======

function zgjidhLlojin(lloji, btn) {
    document.getElementById('m-lloji').value = lloji;
    document.querySelectorAll('.drawer-lloji-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const pakotList = lloji === 'individ' ? PAKOT.individ : PAKOT.familje_biznes;
    const eshteIndivid = lloji === 'individ';
    const container = document.getElementById('pakot-container');

    container.innerHTML = pakotList.map(p => {
        const tjeraFields = [
            {key:'shtatzania', label:'Shtatzënia'},
            {key:'dentar', label:'Dentar'},
            {key:'optik', label:'Optik'},
            {key:'degim', label:'Dëgim'},
            {key:'psikiatrik', label:'Psikiatrik'},
            {key:'fizioterapi', label:'Fizioterapi'},
            {key:'autoambulanca', label:'Autoambulanca'},
            {key:'aksidentit', label:'Aksidenti'},
            {key:'onkologjike', label:'Onkologjike'}
        ];

        const tjeraHTML = tjeraFields.map(f =>
            `<div class="pe-inline-field pe-half">
                <span class="pe-field-label">${f.label}</span>
                <span class="pe-field-value" data-pako="${p.id}" data-field="${f.key}" onclick="inlineEdit(this)" title="Kliko për të edituar">${p[f.key] || '-'}</span>
            </div>`
        ).join('');

        return `
        <div class="pe-card" id="pe-${p.id}">
            <div class="pe-card-header" onclick="togglePakoCard('${p.id}')">
                <input type="checkbox" class="pako-check-input" value="${p.id}" onclick="event.stopPropagation();togglePakoEditor('${p.id}', this.checked)">
                <span class="pe-card-name">${p.emri}</span>
                <span class="pe-card-shuma">€ ${p.shuma}</span>
                <span class="pe-card-chevron">▾</span>
            </div>
            <div class="pe-card-body" id="peb-${p.id}">
                <div class="pe-row-top">
                    <div class="pe-inline-field">
                        <span class="pe-field-label">Zona</span>
                        <span class="pe-field-value" data-pako="${p.id}" data-field="zona" onclick="inlineEdit(this)">${p.zona}</span>
                    </div>
                    <div class="pe-inline-field">
                        <span class="pe-field-label">Shuma e siguruar</span>
                        <span class="pe-field-value" data-pako="${p.id}" data-field="shuma" onclick="inlineEdit(this)">€ ${p.shuma}</span>
                    </div>
                </div>

                <div class="pe-section">
                    <div class="pe-section-hdr">
                        <span class="pe-section-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M9 8h6M12 8v6M9 21V8a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3v13"/></svg></span>
                        Hospitalore
                    </div>
                    <div class="pe-inline-field pe-full">
                        <span class="pe-field-label">Mbulimi</span>
                        <span class="pe-field-value" data-pako="${p.id}" data-field="hospitalore" onclick="inlineEdit(this)">${p.hospitalore || '100%'}</span>
                    </div>
                </div>

                <div class="pe-section">
                    <div class="pe-section-hdr">
                        <span class="pe-section-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M12 11v6M9 14h6"/></svg></span>
                        Ambulantore
                    </div>
                    <div class="pe-inline-field pe-full">
                        <span class="pe-field-label">Mbulimi</span>
                        <span class="pe-field-value" data-pako="${p.id}" data-field="ambulatore" onclick="inlineEdit(this)">${p.ambulatore || '-'}</span>
                    </div>
                </div>

                <div class="pe-section">
                    <div class="pe-section-hdr">
                        <span class="pe-section-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span>
                        Trajtime tjera
                    </div>
                    <div class="pe-tjera-grid">${tjeraHTML}</div>
                </div>

                <div class="pe-primi-row">
                    <div class="pe-inline-field">
                        <span class="pe-field-label">Primi mbi 18 vjeç (€)</span>
                        <span class="pe-field-value pe-primi-val" data-pako="${p.id}" data-field="primi_madh" onclick="inlineEdit(this)">${p.primi_madh}</span>
                        <span class="pe-primi-suffix">${eshteIndivid ? '/vit' : '/muaj'}</span>
                    </div>
                    ${!eshteIndivid ? `<div class="pe-inline-field">
                        <span class="pe-field-label">Primi fëmijë (€)</span>
                        <span class="pe-field-value pe-primi-val" data-pako="${p.id}" data-field="primi_femije" onclick="inlineEdit(this)">${p.primi_femije || '-'}</span>
                        <span class="pe-primi-suffix">/muaj</span>
                    </div>` : ''}
                </div>
            </div>
        </div>`;
    }).join('');
}

function togglePakoCard(id) {
    const card = document.getElementById('pe-' + id);
    const cb = card.querySelector('.pako-check-input');
    // Toggle checkbox nëse nuk është checked, ose thjesht toggle expand/collapse
    if (!cb.checked) {
        cb.checked = true;
        togglePakoEditor(id, true);
    } else {
        // Toggle collapse/expand
        card.classList.toggle('collapsed');
    }
}

function togglePakoEditor(id, checked) {
    const body = document.getElementById('peb-' + id);
    const card = document.getElementById('pe-' + id);
    if (checked) {
        card.classList.add('selected');
        card.classList.remove('collapsed');
        body.style.display = 'block';
    } else {
        card.classList.remove('selected');
        body.style.display = 'none';
    }
}

// Inline edit: kliko vlerën → bëhet input → ruaje me blur/enter
function inlineEdit(el) {
    if (el.querySelector('input')) return; // tashmë në editim
    const currentVal = el.textContent.trim();
    const field = el.dataset.field;

    // Largo "€ " prefix nëse ka (vetëm për shuma)
    let editVal = currentVal;
    if (field === 'shuma') editVal = currentVal.replace(/^€\s*/, '');

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'pe-inline-input';
    input.value = editVal;

    el.textContent = '';
    el.appendChild(input);
    input.focus();
    input.select();

    const finalize = () => {
        const newVal = input.value.trim() || '-';
        if (field === 'shuma') {
            el.textContent = '€ ' + newVal;
            // Përditëso edhe header-in e kartës
            const card = el.closest('.pe-card');
            if (card) {
                const shumaDisp = card.querySelector('.pe-card-shuma');
                if (shumaDisp) shumaDisp.textContent = '€ ' + newVal;
            }
        } else {
            el.textContent = newVal;
        }
    };

    input.addEventListener('blur', finalize);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { el.textContent = currentVal; }
    });
}

function tregoBoxAgjenti() {
    const val = document.getElementById('m-kerkuar-nga').value;
    document.getElementById('field-agjenti').style.display = val === 'agjenti' ? 'block' : 'none';
}

// ====== VERSIONING ======
function toggleVersions() {
    document.getElementById('version-body').classList.toggle('open');
}

function renderVersions(versione, oferta) {
    if (!versione || versione.length === 0) return;
    const body = document.getElementById('version-body');
    document.getElementById('version-count').textContent = versione.length;

    body.innerHTML = versione.map((v, i) => {
        const pakotTxt = (v.pakot || []).map(p => typeof p === 'object' ? (p.emri || p.id) : p).join(', ');
        const llojiV = v.lloji || (oferta ? oferta.lloji : 'individ');
        const eshteIndivid = llojiV === 'individ';
        const pakotList = eshteIndivid ? PAKOT.individ : PAKOT.familje_biznes;
        const pakotDetaje = (v.pakot || []).map(p => {
            if (typeof p === 'object') { const base = pakotList.find(pk => pk.id === p.id); return base ? { ...base, ...p } : p; }
            const found = pakotList.find(pk => pk.emri === p || `Pako ${pk.emri}` === p || pk.id === p);
            return found || null;
        }).filter(Boolean);

        const detajeHtml = pakotDetaje.map(p => `
            <div class="v-pako-item">
                <div class="v-pako-name" onclick="this.nextElementSibling.classList.toggle('open')">
                    <span>${p.emri || p.id}</span>
                    <span class="v-pako-primi">€ ${p.primi_madh || '-'}${eshteIndivid ? '/vit' : '/muaj'}</span>
                </div>
                <div class="v-pako-details">
                    <table>
                        <tr><td>Zona</td><td>${p.zona || '-'}</td></tr>
                        <tr><td>Shuma</td><td>€ ${p.shuma || '-'}</td></tr>
                        <tr class="summary-section-hdr"><td colspan="2">Hospitalore</td></tr>
                        <tr><td>Mbulimi</td><td>${p.hospitalore || '-'}</td></tr>
                        <tr class="summary-section-hdr"><td colspan="2">Ambulantore</td></tr>
                        <tr><td>Mbulimi</td><td>${p.ambulatore || '-'}</td></tr>
                        <tr class="summary-section-hdr"><td colspan="2">Trajtime tjera</td></tr>
                        <tr><td>Shtatzania</td><td>${p.shtatzania || '-'}</td></tr>
                        <tr><td>Dentar</td><td>${p.dentar || '-'}</td></tr>
                        <tr><td>Optik</td><td>${p.optik || '-'}</td></tr>
                        <tr><td>Dëgim</td><td>${p.degim || '-'}</td></tr>
                        <tr><td>Psikiatrik</td><td>${p.psikiatrik || '-'}</td></tr>
                        <tr><td>Fizioterapi</td><td>${p.fizioterapi || '-'}</td></tr>
                        <tr><td>Autoambulanca</td><td>${p.autoambulanca || '-'}</td></tr>
                        <tr><td>Aksidenti</td><td>${p.aksidentit || '-'}</td></tr>
                        <tr><td>Onkologjike</td><td>${p.onkologjike || '-'}</td></tr>
                        <tr class="summary-section-hdr"><td colspan="2">Primet</td></tr>
                        <tr><td>Primi mbi 18 vjeç</td><td>€ ${p.primi_madh || '-'}${eshteIndivid ? '/vit' : '/muaj'}</td></tr>
                        ${p.primi_femije ? `<tr><td>Primi fëmijë</td><td>€ ${p.primi_femije}${eshteIndivid ? '/vit' : '/muaj'}</td></tr>` : ''}
                    </table>
                </div>
            </div>
        `).join('');

        return `<div class="version-item-block">
            <div class="version-item" onclick="this.nextElementSibling.classList.toggle('open')">
                <span class="version-dot"></span>
                <span class="v-date">${v.data || '-'}</span>
                <span class="v-pakot">${pakotTxt || '-'}</span>
                <div style="margin-left:auto;display:flex;gap:6px;align-items:center;">
                    <span class="v-detail-toggle">Detajet ▾</span>
                    <button class="v-restore" onclick="event.stopPropagation();riktheVersion(${i})">Rikthe</button>
                </div>
            </div>
            <div class="v-details-panel">${detajeHtml}</div>
        </div>`;
    }).reverse().join('');
}

function riktheVersion(vIdx) {
    if (editIndex < 0) return;
    const o = ofertat[editIndex];
    const v = o.versione[vIdx];
    if (!v || !confirm('Rikthe versionin e dates ' + (v.data || '?') + '?')) return;
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
                    // Set inline values
                    document.querySelectorAll(`.pe-field-value[data-pako="${cb.value}"]`).forEach(el => {
                        const field = el.dataset.field;
                        if (customPako[field] !== undefined) {
                            el.textContent = field === 'shuma' ? '€ ' + customPako[field] : customPako[field];
                        }
                    });
                }
            }
        });
    }, 50);
}

// ====== RUAJ — lexo vlerat nga inline spans ======
function ruajOferte() {
    const emri = document.getElementById('m-emri').value.trim();
    if (!emri) { alert('Ju lutem shkruani emrin e klientit!'); return; }
    const today = new Date();
    const skadon = new Date(today);
    skadon.setDate(skadon.getDate() + 30);
    const kerkuarNga = document.getElementById('m-kerkuar-nga').value;
    const agjenti = document.getElementById('m-agjenti').value.trim();

    // Lexo pakot nga inline editing spans
    const pakotAktuale = Array.from(document.querySelectorAll('.pako-check-input:checked')).map(cb => {
        const pakoId = cb.value;
        const vlerat = {};
        document.querySelectorAll(`.pe-field-value[data-pako="${pakoId}"]`).forEach(el => {
            let val = el.textContent.trim();
            const field = el.dataset.field;
            // Largo "€ " prefix për shuma
            if (field === 'shuma') val = val.replace(/^€\s*/, '');
            vlerat[field] = val;
        });
        return { id: pakoId, ...vlerat };
    });
    if (pakotAktuale.length === 0) { alert('Ju lutem zgjidhni së paku një paketë!'); return; }

    const oferta = {
        emri, lloji: document.getElementById('m-lloji').value,
        email: document.getElementById('m-email').value.trim(),
        kerkuarNga, agjenti: kerkuarNga === 'agjenti' ? agjenti : '',
        pakot: pakotAktuale,
        krijuarNga: JSON.parse(localStorage.getItem('user_aktual'))?.username || 'agon',
        krijuarNgaEmri: (() => { const u = JSON.parse(localStorage.getItem('user_aktual')); return u ? `${u.emri} ${u.mbiemri||''}`.trim() : 'Agon'; })(),
        krijuarNgaEmail: JSON.parse(localStorage.getItem('user_aktual'))?.email || 'gjonbalajagon@gmail.com',
        dataKrijimit: today.toISOString().split('T')[0],
        dataSkadon: skadon.toISOString().split('T')[0]
    };

    if (editIndex >= 0) {
        oferta.realizuar = ofertat[editIndex].realizuar;
        oferta.konfirmuar = ofertat[editIndex].konfirmuar;
        oferta.pakaZgjedhur = ofertat[editIndex].pakaZgjedhur;
        oferta.komentKlient = ofertat[editIndex].komentKlient;
        oferta.dataKonfirmimit = ofertat[editIndex].dataKonfirmimit;
        oferta.statusi = ofertat[editIndex].statusi;
        const versionetEVjetra = ofertat[editIndex].versione || [];
        versionetEVjetra.push({ data: ofertat[editIndex].dataKrijimit || new Date().toISOString().split('T')[0], lloji: ofertat[editIndex].lloji, pakot: ofertat[editIndex].pakot, emri: ofertat[editIndex].emri });
        oferta.versione = versionetEVjetra;
        oferta.dataKrijimit = ofertat[editIndex].dataKrijimit;
        ofertat[editIndex] = oferta;
    } else {
        oferta.realizuar = false;
        oferta.versione = [];
        oferta.statusi = 'e_krijuar';
        ofertat.push(oferta);
    }
    ruajNeStorage();
    mbyllDrawer();
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
    const btns = document.querySelectorAll('.drawer-lloji-btn');
    const llojiMap = { 'individ': 0, 'familje': 1, 'biznes': 2 };
    zgjidhLlojin(o.lloji, btns[llojiMap[o.lloji] || 0]);

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
                    document.querySelectorAll(`.pe-field-value[data-pako="${cb.value}"]`).forEach(el => {
                        const field = el.dataset.field;
                        if (customPako[field] !== undefined) {
                            el.textContent = field === 'shuma' ? '€ ' + customPako[field] : customPako[field];
                        }
                    });
                    // Përditëso edhe header shuma
                    const card = document.getElementById('pe-' + cb.value);
                    if (card && customPako.shuma) {
                        const shumaDisp = card.querySelector('.pe-card-shuma');
                        if (shumaDisp) shumaDisp.textContent = '€ ' + customPako.shuma;
                    }
                }
            }
        });
    }, 50);

    const vPanel = document.getElementById('version-panel');
    if (o.versione && o.versione.length > 0) { vPanel.style.display = 'block'; renderVersions(o.versione, o); }
    else { vPanel.style.display = 'none'; }
    document.getElementById('drawer-overlay').classList.add('active');
}

function fshijOferte(index) {
    if (confirm('A jeni i sigurt qe doni te fshini kete oferte?')) { ofertat.splice(index, 1); ruajNeStorage(); renderTabela(); }
}

function llogaritStatus(dataSkadon) {
    if (!dataSkadon) return 'aktive';
    return new Date() > new Date(dataSkadon) ? 'skaduar' : 'aktive';
}

function llogaritDitet(dataSkadon) {
    if (!dataSkadon) return { teksti: '-', klasa: '' };
    const dite = Math.ceil((new Date(dataSkadon) - new Date()) / (1000 * 60 * 60 * 24));
    if (dite < 0) return { teksti: 'Skaduar', klasa: 'skadon-expired' };
    if (dite <= 7) return { teksti: dite + ' dite', klasa: 'skadon-warning' };
    return { teksti: dite + ' dite', klasa: 'skadon-ok' };
}

function dergoEmail(index) {
    const o = ofertat[index];
    if (!o.email) { alert('Klienti nuk ka email te regjistruar!'); return; }
    const link = `https://sigal-platform-shendet.vercel.app/pages/oferta-view.html?id=${index}`;
    const subject = encodeURIComponent('Ofertë nga SIGAL Insurance Group - ' + o.emri);
    const body = encodeURIComponent('I nderuar ' + o.emri + ',\n\nJu dërgojmë ofertën tonë për sigurim shëndetësor.\n\nJu lutem klikoni linkun më poshtë për të parë paketën dhe për të konfirmuar zgjedhjen tuaj:\n\n' + link + '\n\nValiditeti: 30 ditë nga ' + o.dataKrijimit + '\n\nMe respekt,\nSIGAL Insurance Group');
    window.open('mailto:' + o.email + '?subject=' + subject + '&body=' + body);
    ofertat[index].statusi = ofertat[index].statusi === 'e_krijuar' ? 'e_derguar' : ofertat[index].statusi;
    ruajNeStorage();
    try { fetch(TAPI+'/api/oferta-derguar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ofertaId:String(index)})}); } catch(e){}
}

function krijoKontrate(index) {
    const confirmed = confirm('A jeni i sigurt qe doni te krijoni kontrate?\nOferta eshte pranuar?');
    if (!confirmed) return;
    const o = ofertat[index];
    const kontratData = { emri: o.emri, lloji: o.lloji, email: o.email || '', pakot: o.pakot || [], ngaOferta: true };
    ofertat[index].realizuar = true;
    ofertat[index].statusi = 'kontrate';
    ruajNeStorage();
    localStorage.setItem('oferta_per_kontrate', JSON.stringify(kontratData));
    window.location.href = 'kontratat.html?nga_oferta=true';
}

async function gjeneroWord(index) {
    const o = ofertat[index];
    try {
        const pakotEmra = (o.pakot || []).map(p => {
            if (typeof p === 'object') { const pakotList = o.lloji === 'individ' ? PAKOT.individ : PAKOT.familje_biznes; const found = pakotList.find(pk => pk.id === p.id); return found ? `Pako ${found.emri}` : p.id; }
            return p;
        });
        const response = await fetch('https://sigal-platform-production.up.railway.app/api/gjenero-oferte', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emri: o.emri, lloji: o.lloji === 'familje' || o.lloji === 'biznes' ? 'familje_biznes' : o.lloji, pakot: pakotEmra }) });
        const data = await response.json();
        if (data.success) window.open('https://sigal-platform-production.up.railway.app/api/shkarko/' + data.fileName, '_blank');
        else alert('Gabim: ' + data.error);
    } catch (err) { alert('Serveri nuk eshte aktiv!'); }
}

function kopjoLink(index) {
    const link = `https://sigal-platform-shendet.vercel.app/pages/oferta-view.html?id=${index}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => tregoToast('Linku u kopjua!')).catch(() => kopjoFallback(link));
    } else { kopjoFallback(link); }
    ofertat[index].statusi = ofertat[index].statusi === 'e_krijuar' ? 'e_derguar' : ofertat[index].statusi;
    ruajNeStorage();
    try { fetch(TAPI+'/api/oferta-derguar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ofertaId:String(index)})}); } catch(e){}
}

function kopjoFallback(text) {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); tregoToast('Linku u kopjua!'); } catch (e) { alert('Kopjimi dështoi. Linku: ' + text); }
    document.body.removeChild(ta);
}

function tregoToast(msg) {
    let toast = document.getElementById('toast-msg');
    if (!toast) { toast = document.createElement('div'); toast.id = 'toast-msg'; toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#002B5C;color:white;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;opacity:0;transition:opacity 0.3s;'; document.body.appendChild(toast); }
    toast.textContent = msg; toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

function filtro() { renderTabela(); }

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
        if (!a.dataSkadon) return 1; if (!b.dataSkadon) return -1;
        return new Date(a.dataSkadon) - new Date(b.dataSkadon);
    });

    document.getElementById('count-aktive').textContent = ofertatFiltruara.filter(o => llogaritStatus(o.dataSkadon) === 'aktive').length;
    document.getElementById('count-skaduar').textContent = ofertatFiltruara.filter(o => llogaritStatus(o.dataSkadon) === 'skaduar').length;
    document.getElementById('count-total').textContent = ofertat.length;
    document.getElementById('count-realizuara').textContent = ofertatFiltruara.filter(o => o.realizuar).length;
    document.getElementById('count-individ').textContent = ofertatFiltruara.filter(o => o.lloji === 'individ').length;
    document.getElementById('count-familje').textContent = ofertatFiltruara.filter(o => o.lloji === 'familje').length;
    document.getElementById('count-biznes').textContent = ofertatFiltruara.filter(o => o.lloji === 'biznes').length;
    const rIndivid = ofertatFiltruara.filter(o => o.lloji === 'individ' && o.realizuar).length;
    const rFamilje = ofertatFiltruara.filter(o => o.lloji === 'familje' && o.realizuar).length;
    const rBiznes = ofertatFiltruara.filter(o => o.lloji === 'biznes' && o.realizuar).length;
    document.getElementById('count-individ-r').textContent = rIndivid > 0 ? rIndivid + ' realizuar' : '';
    document.getElementById('count-familje-r').textContent = rFamilje > 0 ? rFamilje + ' realizuar' : '';
    document.getElementById('count-biznes-r').textContent = rBiznes > 0 ? rBiznes + ' realizuar' : '';

    const llojiLabels = { 'individ': 'Individuale', 'familje': 'Familjare', 'biznes': 'Biznese' };
    const kerkuarLabels = { 'direkt': 'Direkt', 'online': 'Online', 'agjenti': 'Agjenti' };

    const tbody = document.getElementById('ofertat-tbody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:40px; color:#888;">Nuk ka oferta. Shtoni me "+ Ofertë e Re"</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(o => {
        const idx = ofertat.indexOf(o);
        const ditet = llogaritDitet(o.dataSkadon);
        const kerkuar = o.kerkuarNga === 'agjenti' ? 'Agjenti: ' + o.agjenti : (kerkuarLabels[o.kerkuarNga] || '-');
        const vCount = (o.versione || []).length;
        const vBadge = vCount > 0 ? ` <span style="background:#e5e9f0;color:#002B5C;font-size:9px;padding:1px 5px;border-radius:8px;font-weight:700;" title="${vCount} versione">${vCount}v</span>` : '';
        let dotColor = '#22c55e';
        if (ditet.klasa === 'skadon-warning') dotColor = '#f59e0b';
        if (ditet.klasa === 'skadon-expired') dotColor = '#ef4444';
        const skadonHtml = '<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:50%;background:'+dotColor+';flex-shrink:0"></span>' + ditet.teksti + '</span>';
        const trackStatus = getTrackStatus(o);
        return '<tr>' +
            '<td>' + o.emri + vBadge + '</td>' +
            '<td><span class="badge-lloji ' + o.lloji + '">' + (llojiLabels[o.lloji] || o.lloji) + '</span></td>' +
            '<td>' + ((o.pakot || []).map(p => typeof p === 'object' ? p.emri || p.id : p).join(', ') || '-') + '</td>' +
            '<td>' + (o.krijuarNgaEmri || o.krijuarNga || '-') + '</td>' +
            '<td>' + kerkuar + '</td>' +
            '<td>' + (o.dataKrijimit || '-') + '</td>' +
            '<td>' + skadonHtml + '</td>' +
            '<td>' + trackBadge(trackStatus) + '</td>' +
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