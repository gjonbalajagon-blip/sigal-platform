// =====================================================
// DETYRAT.JS — Faza 2A
// Moduli standalone i detyrave (manual + auto)
// 5 triggers: kontrate-skadim, oferte-skadim, oferte-konf-pa-kontrate,
//            faturim-pa-kerkese, debitor-borxh-365
// =====================================================

let detyrat = JSON.parse(localStorage.getItem('detyrat')) || [];
let currentFilter = localStorage.getItem('detyrat_filter_state') || 'all';
let groupState = (() => {
    try { return JSON.parse(localStorage.getItem('detyrat_group_state')) || {}; }
    catch (e) { return {}; }
})();
let pendingUndo = null; // {detyraId, prevState, timer}

// =====================================================
// HELPERS
// =====================================================
function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function formatDataShqip(iso) {
    if (!iso) return '—';
    const m = String(iso).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    // Maybe DD.MM.YYYY from rinovimet/debitoret
    const m2 = String(iso).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (m2) return `${m2[1].padStart(2,'0')}/${m2[2].padStart(2,'0')}/${m2[3]}`;
    return iso;
}
function parseDataAny(s) {
    if (!s) return null;
    if (s instanceof Date) return s;
    const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(+m[1], +m[2]-1, +m[3]);
    const m2 = String(s).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (m2) return new Date(+m2[3], +m2[2]-1, +m2[1]);
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}
function generateId() {
    return 'det_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}
function makeRregullKey(burimi) {
    if (!burimi) return null;
    return `${burimi.moduli}|${burimi.referencaId}|${burimi.rregulla}`;
}
function ruajDetyrat() {
    localStorage.setItem('detyrat', JSON.stringify(detyrat));
}

// =====================================================
// PERMISSIONS — Opsioni B
// staff/staff_hq: sheh vetëm detyra ku është krijues OSE përgjegjës
// staff: NUK krijon manuale, NUK anulon
// management+: të gjitha
// =====================================================
function isManagement() {
    const u = getUserAktual();
    if (!u) return false;
    return ['superadmin', 'management', 'dep_management', 'ceo', 'deputy_ceo', 'director', 'deputy_director'].includes(u.role);
}
function aplikoPermissions() {
    const btnShto = document.getElementById('btn-shto-detyre');
    if (btnShto) btnShto.style.display = isManagement() ? 'inline-flex' : 'none';
    // Filter "Pa përgjegjës" — vetëm management+ e shohin
    const chipUnassigned = document.getElementById('chip-unassigned');
    if (chipUnassigned) chipUnassigned.style.display = isManagement() ? 'inline-flex' : 'none';
}
function filtroSipasPermissions(lista) {
    if (isManagement()) return lista;
    const u = getUserAktual();
    if (!u) return [];
    const un = (u.username || '').toLowerCase();
    return lista.filter(d => {
        const k = (d.krijuarNga || '').toLowerCase();
        const p = (d.pergjegjesi || '').toLowerCase();
        return k === un || p === un;
    });
}

// =====================================================
// PASTRO — fshi detyra e_anuluar / e_perfunduar > 90 ditë
// =====================================================
function pastroDetyratEArkiva() {
    const limit = Date.now() - 90 * 86400000;
    const para = detyrat.length;
    detyrat = detyrat.filter(d => {
        if (d.statusi !== 'e_anuluar' && d.statusi !== 'e_perfunduar') return true;
        const dperf = parseDataAny(d.data_perfundimit || d.data_krijimit);
        if (!dperf) return true;
        return dperf.getTime() > limit;
    });
    if (detyrat.length !== para) ruajDetyrat();
}

// =====================================================
// AUTO-GJENERIM (5 triggers)
// De-duplikim: çelës (moduli|referencaId|rregulla)
// =====================================================
function gjeneroDetyratAuto() {
    const u = getUserAktual();
    if (!u) return 0;

    // Mblidh çelësat e detyrave auto ekzistuese (jo perfunduar/anuluar)
    const ekzistues = new Set(
        detyrat
            .filter(d => d.lloji === 'auto' && d.statusi !== 'e_perfunduar' && d.statusi !== 'e_anuluar')
            .map(d => makeRregullKey(d.burimi))
    );
    let krijuara = 0;
    const tani = new Date();

    // TRIGGER 1: Kontratë skadon ≤30 ditë
    const kontratat = JSON.parse(localStorage.getItem('kontratat') || '[]');
    kontratat.forEach((k, idx) => {
        if (k.arkivuar || !k.mbarimi) return;
        const d = parseDataAny(k.mbarimi); if (!d) return;
        const dite = Math.ceil((d - tani) / 86400000);
        if (dite < 0 || dite > 30) return;
        const key = makeRregullKey({ moduli: 'kontratat', referencaId: idx, rregulla: 'auto_kontrate_skadim_30d' });
        if (ekzistues.has(key)) return;
        detyrat.push(krijoDetyreObjektAuto({
            titulli: `Përgatit rinovimin për ${k.emri || 'klient'}`,
            pershkrimi: `Kontrata skadon për ${dite} ditë (${formatDataShqip(k.mbarimi)}).`,
            prioriteti: dite <= 7 ? 'kritike' : 'te_rendesishme',
            burimi: { moduli: 'kontratat', referencaId: idx, rregulla: 'auto_kontrate_skadim_30d', metadata: { mbarimi: k.mbarimi, emri: k.emri } },
            data_afati: k.mbarimi,
            pergjegjesi: k.krijuarNga || null
        }));
        krijuara++;
    });

    // TRIGGER 2: Ofertë skadon ≤5 ditë (jo konfirmuar, jo realizuar)
    const ofertat = JSON.parse(localStorage.getItem('ofertat') || '[]');
    ofertat.forEach((o, idx) => {
        if (o.konfirmuar || o.realizuar || !o.dataSkadon) return;
        const d = parseDataAny(o.dataSkadon); if (!d) return;
        const dite = Math.ceil((d - tani) / 86400000);
        if (dite < 0 || dite > 5) return;
        const key = makeRregullKey({ moduli: 'oferta', referencaId: idx, rregulla: 'auto_oferta_skadim_5d' });
        if (ekzistues.has(key)) return;
        detyrat.push(krijoDetyreObjektAuto({
            titulli: `Follow-up ofertë për ${o.emri || 'klient'}`,
            pershkrimi: `Oferta skadon për ${dite} ditë. Kontaktoni klientin.`,
            prioriteti: 'kritike',
            burimi: { moduli: 'oferta', referencaId: idx, rregulla: 'auto_oferta_skadim_5d', metadata: { dataSkadon: o.dataSkadon, emri: o.emri } },
            data_afati: o.dataSkadon,
            pergjegjesi: o.krijuarNga || null
        }));
        krijuara++;
    });

    // TRIGGER 3: Ofertë e konfirmuar por pa kontratë (jo realizuar)
    ofertat.forEach((o, idx) => {
        if (!o.konfirmuar || o.realizuar) return;
        const key = makeRregullKey({ moduli: 'oferta', referencaId: idx, rregulla: 'auto_oferta_konfirmuar_pa_kontrate' });
        if (ekzistues.has(key)) return;
        detyrat.push(krijoDetyreObjektAuto({
            titulli: `Krijo kontratën për ${o.emri || 'klient'}`,
            pershkrimi: `Klienti konfirmoi: ${o.pakaZgjedhur || '—'}. Krijo kontratën.`,
            prioriteti: 'te_rendesishme',
            burimi: { moduli: 'oferta', referencaId: idx, rregulla: 'auto_oferta_konfirmuar_pa_kontrate', metadata: { pakaZgjedhur: o.pakaZgjedhur, emri: o.emri } },
            pergjegjesi: o.krijuarNga || null
        }));
        krijuara++;
    });

    // TRIGGER 4: Faturim pa kërkesë në muajin aktual, dita ≥20
    const sotiMuajit = tani.getDate();
    if (sotiMuajit >= 20) {
        const muajiAktual = tani.getMonth() + 1;
        const faturimi = JSON.parse(localStorage.getItem('faturimi_klientet') || '[]');
        faturimi.forEach((f, idx) => {
            const st = (f.statuset || {})[muajiAktual] || 'asgje';
            if (st !== 'asgje') return;
            // Skip nëse kontrata ka skaduar
            if (f.dataMbarimit) {
                const dMb = parseDataAny(f.dataMbarimit);
                if (dMb && dMb < tani) return;
            }
            const key = makeRregullKey({ moduli: 'faturimi', referencaId: idx, rregulla: 'auto_faturim_pa_kerkese_20d' });
            if (ekzistues.has(key)) return;
            detyrat.push(krijoDetyreObjektAuto({
                titulli: `Dërgo kërkesë faturimi për ${f.emri || 'klient'}`,
                pershkrimi: `Klienti pa kërkesë në muajin ${muajiAktual}. Dita aktuale ${sotiMuajit}.`,
                prioriteti: 'kritike',
                burimi: { moduli: 'faturimi', referencaId: idx, rregulla: 'auto_faturim_pa_kerkese_20d', metadata: { muaji: muajiAktual, emri: f.emri } },
                pergjegjesi: f.krijuarNga || null
            }));
            krijuara++;
        });
    }

    // TRIGGER 5: Debitor i_ri me borxh >365 ditë
    const debitoret = JSON.parse(localStorage.getItem('debitoret_data_v1') || '[]');
    debitoret.forEach(d => {
        if (d.statusi !== 'i_ri') return;
        const borxh = Number(d.borxh_mbi_365 || 0);
        if (borxh <= 0) return;
        const key = makeRregullKey({ moduli: 'debitoret', referencaId: d.id, rregulla: 'auto_debitor_365_pa_kontakt' });
        if (ekzistues.has(key)) return;
        detyrat.push(krijoDetyreObjektAuto({
            titulli: `URGJENT: kontaktoni ${d.klienti || 'debitor'}`,
            pershkrimi: `Debitor i ri me €${borxh.toFixed(2)} borxh mbi 365 ditë.`,
            prioriteti: 'kritike',
            burimi: { moduli: 'debitoret', referencaId: d.id, rregulla: 'auto_debitor_365_pa_kontakt', metadata: { borxh, klienti: d.klienti } },
            pergjegjesi: d.agjenti || null
        }));
        krijuara++;
    });

    if (krijuara > 0) {
        ruajDetyrat();
        localStorage.setItem('detyrat_last_run', new Date().toISOString());
    }
    return krijuara;
}

function krijoDetyreObjektAuto(opts) {
    const now = new Date().toISOString();
    return {
        id: generateId(),
        titulli: opts.titulli,
        pershkrimi: opts.pershkrimi || '',
        lloji: 'auto',
        statusi: 'e_re',
        prioriteti: opts.prioriteti || 'normale',
        pergjegjesi: opts.pergjegjesi || null,
        krijuarNga: 'sistemi',
        dega: opts.dega || null,
        data_krijimit: now.split('T')[0],
        data_afati: opts.data_afati || null,
        data_perfundimit: null,
        burimi: opts.burimi,
        aktivitete: [{ data: now, autori: 'sistemi', tipi: 'krijim', teksti: 'Krijuar automatik nga sistemi' }]
    };
}

// =====================================================
// CRUD MANUAL
// =====================================================
function hapDrawerKrijim() {
    if (!isManagement()) return;
    document.getElementById('drawer-title').textContent = 'Detyrë e re';
    document.getElementById('d-titulli').value = '';
    document.getElementById('d-pershkrimi').value = '';
    document.getElementById('d-prioriteti').value = 'normale';
    document.getElementById('d-afati').value = '';
    populateStafiDropdown();
    document.getElementById('drawer-overlay').classList.add('active');
    setTimeout(() => document.getElementById('d-titulli').focus(), 100);
}
function mbyllDrawer() {
    document.getElementById('drawer-overlay').classList.remove('active');
}
function populateStafiDropdown() {
    const stafi = JSON.parse(localStorage.getItem('stafi') || '[]');
    const sel = document.getElementById('d-pergjegjesi');
    if (!sel) return;
    let opts = '<option value="">— Pa caktuar —</option>';
    // Add superadmin always
    opts += '<option value="agon">Agon (superadmin)</option>';
    stafi.forEach(s => {
        if (s.username && s.username !== 'agon') {
            const emri = `${s.emri || ''} ${s.mbiemri || ''}`.trim() || s.username;
            opts += `<option value="${escapeHtml(s.username)}">${escapeHtml(emri)}</option>`;
        }
    });
    sel.innerHTML = opts;
}
function ruajDetyre() {
    const titulli = document.getElementById('d-titulli').value.trim();
    if (!titulli) { alert('Titulli është i detyrueshëm.'); return; }
    const u = getUserAktual();
    const now = new Date().toISOString();
    const detyra = {
        id: generateId(),
        titulli,
        pershkrimi: document.getElementById('d-pershkrimi').value.trim(),
        lloji: 'manual',
        statusi: 'e_re',
        prioriteti: document.getElementById('d-prioriteti').value,
        pergjegjesi: document.getElementById('d-pergjegjesi').value || null,
        krijuarNga: u ? u.username : 'agon',
        dega: u ? (u.dega || null) : null,
        data_krijimit: now.split('T')[0],
        data_afati: document.getElementById('d-afati').value || null,
        data_perfundimit: null,
        burimi: null,
        aktivitete: [{ data: now, autori: u ? u.username : 'agon', tipi: 'krijim', teksti: '' }]
    };
    detyrat.push(detyra);
    ruajDetyrat();
    mbyllDrawer();
    renderAll();
}

// =====================================================
// ACTIONS
// =====================================================
function merrPerSiper(id) {
    const u = getUserAktual(); if (!u) return;
    const d = detyrat.find(x => x.id === id); if (!d) return;
    const prevStatus = d.statusi, prevPergj = d.pergjegjesi;
    d.statusi = 'ne_progres';
    if (!d.pergjegjesi) d.pergjegjesi = u.username;
    d.aktivitete.push({ data: new Date().toISOString(), autori: u.username, tipi: 'status_change', teksti: 'Mori përsipër' });
    ruajDetyrat();
    renderAll();
}
function perfundoDetyre(id) {
    const u = getUserAktual(); if (!u) return;
    const d = detyrat.find(x => x.id === id); if (!d) return;
    const prev = { statusi: d.statusi, data_perfundimit: d.data_perfundimit };
    d.statusi = 'e_perfunduar';
    d.data_perfundimit = new Date().toISOString().split('T')[0];
    d.aktivitete.push({ data: new Date().toISOString(), autori: u.username, tipi: 'status_change', teksti: 'Shënuar si e përfunduar' });
    ruajDetyrat();
    renderAll();
    shfaqToast('Detyra u shënua si e përfunduar', () => {
        d.statusi = prev.statusi;
        d.data_perfundimit = prev.data_perfundimit;
        d.aktivitete.push({ data: new Date().toISOString(), autori: u.username, tipi: 'status_change', teksti: 'Anuluar përfundimi (undo)' });
        ruajDetyrat();
        renderAll();
    });
}
function anuloDetyre(id) {
    if (!isManagement()) return;
    const u = getUserAktual(); if (!u) return;
    const d = detyrat.find(x => x.id === id); if (!d) return;
    const prev = { statusi: d.statusi };
    d.statusi = 'e_anuluar';
    d.aktivitete.push({ data: new Date().toISOString(), autori: u.username, tipi: 'status_change', teksti: 'Anuluar' });
    ruajDetyrat();
    renderAll();
    shfaqToast('Detyra u anulua', () => {
        d.statusi = prev.statusi;
        d.aktivitete.push({ data: new Date().toISOString(), autori: u.username, tipi: 'status_change', teksti: 'Rikthim nga anulim (undo)' });
        ruajDetyrat();
        renderAll();
    });
}
function hapModulNgaDetyra(id) {
    const d = detyrat.find(x => x.id === id); if (!d || !d.burimi) return;
    const m = d.burimi.moduli;
    const ref = d.burimi.referencaId;
    if (m === 'kontratat' || m === 'oferta' || m === 'faturimi' || m === 'rinovimet' || m === 'debitoret') {
        window.location.href = `${m === 'oferta' ? 'oferta' : m}.html?hap=${encodeURIComponent(ref)}`;
    }
}

// =====================================================
// TOAST UNDO
// =====================================================
function shfaqToast(mesazh, callbackUndo) {
    const cont = document.getElementById('det-toast-container');
    if (!cont) return;
    // Clear any pending undo
    if (pendingUndo && pendingUndo.timer) clearTimeout(pendingUndo.timer);
    cont.innerHTML = '';
    const t = document.createElement('div');
    t.className = 'det-toast';
    t.innerHTML = `
        <span class="det-toast-icon"><i data-lucide="check-circle"></i></span>
        <span class="det-toast-msg">${escapeHtml(mesazh)}</span>
        <button class="det-toast-undo" type="button">Anulo</button>
    `;
    cont.appendChild(t);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    requestAnimationFrame(() => t.classList.add('show'));
    const undoBtn = t.querySelector('.det-toast-undo');
    const fshi = () => {
        t.classList.remove('show');
        setTimeout(() => { if (t.parentNode) t.remove(); }, 250);
        pendingUndo = null;
    };
    undoBtn.addEventListener('click', () => {
        if (typeof callbackUndo === 'function') callbackUndo();
        fshi();
    });
    const timer = setTimeout(fshi, 5000);
    pendingUndo = { timer, fshi };
}

// =====================================================
// FILTER + RENDER
// =====================================================
function setFilter(filter) {
    currentFilter = filter;
    localStorage.setItem('detyrat_filter_state', filter);
    document.querySelectorAll('.det-chip').forEach(c => c.classList.toggle('active', c.dataset.filter === filter));
    renderAccordion();
}
function aplikoFilter(lista) {
    const u = getUserAktual();
    if (currentFilter === 'te-miat') {
        if (!u) return [];
        const un = (u.username || '').toLowerCase();
        return lista.filter(d => (d.pergjegjesi || '').toLowerCase() === un);
    }
    if (currentFilter === 'pa-pergjegjes') {
        return lista.filter(d => !d.pergjegjesi);
    }
    return lista;
}
function toggleGroup(prioriteti) {
    groupState[prioriteti] = !groupState[prioriteti];
    localStorage.setItem('detyrat_group_state', JSON.stringify(groupState));
    renderAccordion();
}
function ngrupo(lista) {
    const groups = { kritike: [], te_rendesishme: [], normale: [], e_perfunduar: [] };
    lista.forEach(d => {
        if (d.statusi === 'e_anuluar') return; // hide anuluar
        if (d.statusi === 'e_perfunduar') { groups.e_perfunduar.push(d); return; }
        const p = d.prioriteti || 'normale';
        (groups[p] || groups.normale).push(d);
    });
    return groups;
}
function renderFiltersCounts(visible) {
    const u = getUserAktual();
    const un = u ? (u.username || '').toLowerCase() : '';
    const aktive = visible.filter(d => d.statusi !== 'e_anuluar' && d.statusi !== 'e_perfunduar');
    document.getElementById('c-all').textContent = aktive.length;
    document.getElementById('c-mine').textContent = aktive.filter(d => (d.pergjegjesi || '').toLowerCase() === un).length;
    document.getElementById('c-unassigned').textContent = aktive.filter(d => !d.pergjegjesi).length;
}
function renderKartelaDetyre(d) {
    const u = getUserAktual();
    const un = u ? (u.username || '').toLowerCase() : '';
    const isMine = (d.pergjegjesi || '').toLowerCase() === un;
    const isPerfunduar = d.statusi === 'e_perfunduar';
    const isProgress = d.statusi === 'ne_progres';

    // Afati badge
    let afatiBadge = '';
    if (d.data_afati && !isPerfunduar) {
        const da = parseDataAny(d.data_afati);
        if (da) {
            const dite = Math.ceil((da - new Date()) / 86400000);
            let cls = 'ok'; let txt = `${dite}d`;
            if (dite < 0) { cls = 'kaluar'; txt = `Skaduar ${Math.abs(dite)}d`; }
            else if (dite <= 3) cls = 'urgjent';
            else if (dite <= 7) cls = 'vemendje';
            afatiBadge = `<span class="det-badge det-badge-afati det-badge-afati-${cls}"><i data-lucide="calendar"></i> ${escapeHtml(txt)}</span>`;
        }
    }

    // Lloji badge
    const llojiBadge = d.lloji === 'auto'
        ? `<span class="det-badge det-badge-auto"><i data-lucide="sparkles"></i> Auto</span>`
        : `<span class="det-badge det-badge-manual"><i data-lucide="user"></i> Manual</span>`;

    // Statusi badge
    const stMap = {
        e_re: { lbl: 'E re', cls: 'e-re' },
        ne_progres: { lbl: 'Në progres', cls: 'progres' },
        e_perfunduar: { lbl: 'E përfunduar', cls: 'perfunduar' }
    };
    const st = stMap[d.statusi] || stMap.e_re;
    const statusBadge = `<span class="det-badge det-badge-status det-badge-status-${st.cls}">${escapeHtml(st.lbl)}</span>`;

    // Pergjegjesi
    const pergj = d.pergjegjesi ? escapeHtml(d.pergjegjesi) : '<em style="color:#94a3b8">Pa caktuar</em>';

    // Burimi link
    let burimiInfo = '';
    if (d.lloji === 'auto' && d.burimi && d.burimi.moduli) {
        const m = d.burimi.moduli;
        const mLabels = { kontratat: 'Kontratat', oferta: 'Oferta', faturimi: 'Faturimi', rinovimet: 'Rinovimet', debitoret: 'Debitorët' };
        burimiInfo = `<button class="det-link" onclick="hapModulNgaDetyra('${d.id}')" type="button">
            <i data-lucide="external-link"></i> Hap te ${escapeHtml(mLabels[m] || m)}
        </button>`;
    }

    // Butona action të kushtëzuara
    let actions = '';
    if (!isPerfunduar) {
        if (!isProgress) {
            actions += `<button class="det-action det-action-primary" onclick="merrPerSiper('${d.id}')" type="button">
                <i data-lucide="play"></i> Merr përsipër
            </button>`;
        }
        actions += `<button class="det-action det-action-success" onclick="perfundoDetyre('${d.id}')" type="button">
            <i data-lucide="check"></i> Përfundo
        </button>`;
        if (isManagement()) {
            actions += `<button class="det-action det-action-danger" onclick="anuloDetyre('${d.id}')" type="button">
                <i data-lucide="x"></i> Anulo
            </button>`;
        }
    }

    return `<div class="det-card det-card-${d.prioriteti}${isPerfunduar ? ' det-card-perfunduar' : ''}${isProgress ? ' det-card-progres' : ''}">
        <div class="det-card-main">
            <div class="det-card-header">
                <div class="det-card-title">${escapeHtml(d.titulli)}</div>
                <div class="det-card-meta-row">
                    ${llojiBadge} ${statusBadge} ${afatiBadge}
                </div>
            </div>
            ${d.pershkrimi ? `<div class="det-card-desc">${escapeHtml(d.pershkrimi)}</div>` : ''}
            <div class="det-card-footer">
                <span class="det-card-pergj"><i data-lucide="user-check"></i> ${pergj}</span>
                ${burimiInfo}
            </div>
        </div>
        ${actions ? `<div class="det-card-actions">${actions}</div>` : ''}
    </div>`;
}
function renderAccordion() {
    const cont = document.getElementById('det-accordion');
    if (!cont) return;

    // Apliko permissions + filter aktiv
    let visible = filtroSipasPermissions(detyrat);
    renderFiltersCounts(visible);
    visible = aplikoFilter(visible);

    const groups = ngrupo(visible);
    const groupDefs = [
        { id: 'kritike', titulli: '🔴 Kritike', items: groups.kritike, defaultOpen: true },
        { id: 'te_rendesishme', titulli: '🟠 Të rëndësishme', items: groups.te_rendesishme, defaultOpen: true },
        { id: 'normale', titulli: '🟡 Normale', items: groups.normale, defaultOpen: true },
        { id: 'e_perfunduar', titulli: '✅ Të përfunduara', items: groups.e_perfunduar, defaultOpen: false }
    ];

    let totalAll = visible.filter(d => d.statusi !== 'e_anuluar').length;
    if (totalAll === 0) {
        cont.innerHTML = '<div class="det-empty"><i data-lucide="check-circle-2" style="width:36px;height:36px;color:#10b981"></i><div>Asnjë detyrë aktualisht ✓</div></div>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    let html = '';
    groupDefs.forEach(g => {
        if (g.items.length === 0 && g.id !== 'kritike') return; // hide bosh përveç kritike
        const isOpen = groupState[g.id] !== undefined ? groupState[g.id] : g.defaultOpen;
        // Sort sipas afatit (më pa afat lart)
        const sorted = [...g.items].sort((a, b) => {
            const da = parseDataAny(a.data_afati);
            const db = parseDataAny(b.data_afati);
            if (!da && !db) return 0;
            if (!da) return 1;
            if (!db) return -1;
            return da - db;
        });
        html += `<div class="det-group${isOpen ? ' open' : ''}" data-group="${g.id}">
            <div class="det-group-header" onclick="toggleGroup('${g.id}')">
                <div class="det-group-title">
                    <i data-lucide="${isOpen ? 'chevron-down' : 'chevron-right'}"></i>
                    <span>${g.titulli}</span>
                </div>
                <span class="det-group-count">${g.items.length}</span>
            </div>
            ${isOpen ? `<div class="det-group-body">
                ${sorted.length === 0 ? '<div class="det-group-empty">Asnjë detyrë në këtë kategori</div>' : sorted.map(renderKartelaDetyre).join('')}
            </div>` : ''}
        </div>`;
    });
    cont.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
function renderAll() {
    renderAccordion();
}

// =====================================================
// BOOTSTRAP
// =====================================================
document.addEventListener('DOMContentLoaded', function () {
    const user = checkAuth();
    if (!user) return;
    aplikoPermissions();
    pastroDetyratEArkiva();
    gjeneroDetyratAuto();
    // Apliko filter të ruajtur në UI
    document.querySelectorAll('.det-chip').forEach(c => c.classList.toggle('active', c.dataset.filter === currentFilter));
    renderAccordion();
});

// ESC mbyll drawer
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        const ov = document.getElementById('drawer-overlay');
        if (ov && ov.classList.contains('active')) mbyllDrawer();
    }
});
