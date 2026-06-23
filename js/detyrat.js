// =====================================================
// DETYRAT.JS — Faza 2A.2 (dense rows + nën-grupim + bulk)
// Moduli standalone i detyrave (manual + auto)
// 5 triggers: kontrate-skadim, oferte-skadim, oferte-konf-pa-kontrate,
//            faturim-pa-kerkese, debitor-borxh-365
// =====================================================

// Stable-ID backfill (DEC-036 / Faza 2A.3)
if (typeof backfillAllIds === 'function') backfillAllIds();
let detyrat = JSON.parse(localStorage.getItem('detyrat')) || [];

// Faza 2B: backend API për trigger #6
const DET_API_BASE = 'https://sigal-platform.onrender.com';
let currentFilter = localStorage.getItem('detyrat_filter_state') || 'all';
let groupState = (() => {
    try { return JSON.parse(localStorage.getItem('detyrat_group_state')) || {}; }
    catch (e) { return {}; }
})();
let pendingUndo = null; // {detyraId, prevState, timer}

// Faza 2A.2 — state shtesë (in-memory)
let expandedRows = new Set();    // id detyrash që janë expanded (in-memory only)
let _selectionMode = false;       // mode i përzgjedhjes së shumëfishtë
let _selectedIds = new Set();     // id detyrash të zgjedhura
let _confirmCallback = null;      // callback i ngjitur te modali i konfirmimit
let _afatiModalId = null;         // id e detyrës që po editohet
const NEN_GRUP_THRESHOLD = 10;    // nën-grupim aktivizohet kur grup > N detyra

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

// Helper i ri (DEC-039): a është kjo detyra ime?
function eshteImja(d) {
    const u = getUserAktual();
    if (!u || !d) return false;
    return (d.pergjegjesi || '').toLowerCase() === (u.username || '').toLowerCase();
}
function eshtePaPergjegjes(d) {
    return !d || !d.pergjegjesi;
}

// =====================================================
// PERMISSIONS — Opsioni B
// staff/staff_hq: sheh vetëm detyra ku është krijues OSE përgjegjës
// staff: KRIJON manuale me prioriteti=normale (locked); NUK anulon
// management+: të gjitha
// =====================================================
function isManagement() {
    const u = getUserAktual();
    if (!u) return false;
    return ['superadmin', 'management', 'dep_management', 'ceo', 'deputy_ceo', 'director', 'deputy_director'].includes(u.role);
}
function aplikoPermissions() {
    // Button "Shto detyrë" tani është i dukshëm për të gjithë (staff lejohet të krijojë)
    const btnShto = document.getElementById('btn-shto-detyre');
    if (btnShto) btnShto.style.display = 'inline-flex';
    // Filter "Pa përgjegjës" — vetëm management+ e shohin
    const chipUnassigned = document.getElementById('chip-unassigned');
    if (chipUnassigned) chipUnassigned.style.display = isManagement() ? 'inline-flex' : 'none';
    // Bulk action buttons që janë vetëm për management+
    const btnBulkAnulo = document.getElementById('btn-bulk-anulo');
    const btnBulkRicakto = document.getElementById('btn-bulk-ricakto');
    if (btnBulkAnulo) btnBulkAnulo.style.display = isManagement() ? 'inline-flex' : 'none';
    if (btnBulkRicakto) btnBulkRicakto.style.display = isManagement() ? 'inline-flex' : 'none';
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
// MIGRATION (DEC-036 / Faza 2A.3)
// Detyrat e vjetra me referencaId numerik për kontratat/oferta/faturimi
// → kthim te stable id i rekordit (që tani backfill e ka populluar).
// I sigurt për t'u ekzekutuar disa herë (idempotent).
// =====================================================
function migroDetyratReferences() {
    const kontratat = JSON.parse(localStorage.getItem('kontratat') || '[]');
    const ofertat = JSON.parse(localStorage.getItem('ofertat') || '[]');
    const faturimi = JSON.parse(localStorage.getItem('faturimi_klientet') || '[]');
    let changed = false;
    detyrat.forEach(d => {
        if (d.lloji !== 'auto' || !d.burimi) return;
        const m = d.burimi.moduli;
        if (m !== 'kontratat' && m !== 'oferta' && m !== 'faturimi') return;
        const ref = d.burimi.referencaId;
        // Skip nëse është tashmë stable id (string me prefix)
        if (typeof ref === 'string' && /^(kon|oft|fat)_/.test(ref)) return;
        // Konverto numerikisht
        const idx = (typeof ref === 'number') ? ref : parseInt(ref, 10);
        if (isNaN(idx) || idx < 0) return;
        let arr;
        if (m === 'kontratat') arr = kontratat;
        else if (m === 'oferta') arr = ofertat;
        else if (m === 'faturimi') arr = faturimi;
        const rec = arr[idx];
        if (rec && rec.id) {
            d.burimi.referencaId = rec.id;
            changed = true;
        }
    });
    if (changed) ruajDetyrat();
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
// AUTO-GJENERIM (5 triggers) — MOS PREK LOGJIKËN (DEC-032)
// De-duplikim: çelës (moduli|referencaId|rregulla)
// =====================================================
function gjeneroDetyratAuto() {
    const u = getUserAktual();
    if (!u) return 0;

    const ekzistues = new Set(
        detyrat
            .filter(d => d.lloji === 'auto' && d.statusi !== 'e_perfunduar' && d.statusi !== 'e_anuluar')
            .map(d => makeRregullKey(d.burimi))
    );
    let krijuara = 0;
    const tani = new Date();

    // TRIGGER 1: Kontratë skadon ≤30 ditë
    const kontratat = JSON.parse(localStorage.getItem('kontratat') || '[]');
    kontratat.forEach((k) => {
        if (!k.id || k.arkivuar || !k.mbarimi) return;
        const d = parseDataAny(k.mbarimi); if (!d) return;
        const dite = Math.ceil((d - tani) / 86400000);
        if (dite < 0 || dite > 30) return;
        const key = makeRregullKey({ moduli: 'kontratat', referencaId: k.id, rregulla: 'auto_kontrate_skadim_30d' });
        if (ekzistues.has(key)) return;
        detyrat.push(krijoDetyreObjektAuto({
            titulli: `Përgatit rinovimin për ${k.emri || 'klient'}`,
            pershkrimi: `Kontrata skadon për ${dite} ditë (${formatDataShqip(k.mbarimi)}).`,
            prioriteti: dite <= 7 ? 'kritike' : 'te_rendesishme',
            burimi: { moduli: 'kontratat', referencaId: k.id, rregulla: 'auto_kontrate_skadim_30d', metadata: { mbarimi: k.mbarimi, emri: k.emri } },
            data_afati: k.mbarimi,
            pergjegjesi: k.krijuarNga || null
        }));
        krijuara++;
    });

    // TRIGGER 2: Ofertë skadon ≤5 ditë
    const ofertat = JSON.parse(localStorage.getItem('ofertat') || '[]');
    ofertat.forEach((o) => {
        if (!o.id || o.konfirmuar || o.realizuar || !o.dataSkadon) return;
        const d = parseDataAny(o.dataSkadon); if (!d) return;
        const dite = Math.ceil((d - tani) / 86400000);
        if (dite < 0 || dite > 5) return;
        const key = makeRregullKey({ moduli: 'oferta', referencaId: o.id, rregulla: 'auto_oferta_skadim_5d' });
        if (ekzistues.has(key)) return;
        detyrat.push(krijoDetyreObjektAuto({
            titulli: `Follow-up ofertë për ${o.emri || 'klient'}`,
            pershkrimi: `Oferta skadon për ${dite} ditë. Kontaktoni klientin.`,
            prioriteti: 'kritike',
            burimi: { moduli: 'oferta', referencaId: o.id, rregulla: 'auto_oferta_skadim_5d', metadata: { dataSkadon: o.dataSkadon, emri: o.emri } },
            data_afati: o.dataSkadon,
            pergjegjesi: o.krijuarNga || null
        }));
        krijuara++;
    });

    // TRIGGER 3: Ofertë konfirmuar pa kontratë
    ofertat.forEach((o) => {
        if (!o.id || !o.konfirmuar || o.realizuar) return;
        const key = makeRregullKey({ moduli: 'oferta', referencaId: o.id, rregulla: 'auto_oferta_konfirmuar_pa_kontrate' });
        if (ekzistues.has(key)) return;
        detyrat.push(krijoDetyreObjektAuto({
            titulli: `Krijo kontratën për ${o.emri || 'klient'}`,
            pershkrimi: `Klienti konfirmoi: ${o.pakaZgjedhur || '—'}. Krijo kontratën.`,
            prioriteti: 'te_rendesishme',
            burimi: { moduli: 'oferta', referencaId: o.id, rregulla: 'auto_oferta_konfirmuar_pa_kontrate', metadata: { pakaZgjedhur: o.pakaZgjedhur, emri: o.emri } },
            pergjegjesi: o.krijuarNga || null
        }));
        krijuara++;
    });

    // TRIGGER 4: Faturim pa kërkesë, dita ≥20
    const sotiMuajit = tani.getDate();
    if (sotiMuajit >= 20) {
        const muajiAktual = tani.getMonth() + 1;
        const faturimi = JSON.parse(localStorage.getItem('faturimi_klientet') || '[]');
        faturimi.forEach((f) => {
            if (!f.id) return;
            const st = (f.statuset || {})[muajiAktual] || 'asgje';
            if (st !== 'asgje') return;
            if (f.dataMbarimit) {
                const dMb = parseDataAny(f.dataMbarimit);
                if (dMb && dMb < tani) return;
            }
            const key = makeRregullKey({ moduli: 'faturimi', referencaId: f.id, rregulla: 'auto_faturim_pa_kerkese_20d' });
            if (ekzistues.has(key)) return;
            detyrat.push(krijoDetyreObjektAuto({
                titulli: `Dërgo kërkesë faturimi për ${f.emri || 'klient'}`,
                pershkrimi: `Klienti pa kërkesë në muajin ${muajiAktual}. Dita aktuale ${sotiMuajit}.`,
                prioriteti: 'kritike',
                burimi: { moduli: 'faturimi', referencaId: f.id, rregulla: 'auto_faturim_pa_kerkese_20d', metadata: { muaji: muajiAktual, emri: f.emri } },
                pergjegjesi: f.krijuarNga || null
            }));
            krijuara++;
        });
    }

    // TRIGGER 5: Debitor i_ri me borxh >365d
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

    // TRIGGER 6 (async, Faza 2B): Oferta parë 3-5 herë
    skanoOfertaParEHere35().catch(e => console.warn('[T6] skip:', e.message));

    return krijuara;
}

// =====================================================
// TRIGGER #6 (Faza 2B / DEC-043): Oferta parë 3-5 herë → detyrë kritike
// Burimi: Supabase oferta_tracking përmes /api/oferta-tracking-bulk
// Cache: sessionStorage 30 sek (mos thirr përsëri menjëherë)
// =====================================================
async function skanoOfertaParEHere35() {
    const ofertatLs = JSON.parse(localStorage.getItem('ofertat') || '[]');
    // Filter: ka stable id, jo konfirmuar, jo realizuar, jo anuluar/skaduar
    const tani = new Date();
    const kandidate = ofertatLs.filter(o => {
        if (!o || !o.id) return false;
        if (o.konfirmuar || o.realizuar) return false;
        if (o.statusi === 'e_anuluar') return false;
        // Skip nëse skaduar (>30d nga krijimi pa konfirmim)
        if (o.dataSkadon) {
            const ds = parseDataAny(o.dataSkadon);
            if (ds && ds < tani) return false;
        }
        return true;
    });
    if (kandidate.length === 0) return 0;

    // Cache check (30s)
    const cacheKey = 'oferta_tracking_cache';
    let cache = null;
    try { cache = JSON.parse(sessionStorage.getItem(cacheKey) || 'null'); } catch (e) {}
    const tashTs = Date.now();
    let tracking = null;
    if (cache && cache.ts && (tashTs - cache.ts) < 30000 && cache.ids && cache.data) {
        // Vetëm nëse cache mbulon TË GJITHA kandidatët aktualë
        const idsKandidat = kandidate.map(o => o.id).sort().join(',');
        const idsCache = (cache.ids || []).sort().join(',');
        if (idsKandidat === idsCache) tracking = cache.data;
    }

    if (!tracking) {
        // Fetch nga backend
        const ids = kandidate.map(o => o.id).slice(0, 100);
        try {
            const r = await fetch(DET_API_BASE + '/api/oferta-tracking-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const json = await r.json();
            tracking = json.tracking || {};
            try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: tashTs, ids, data: tracking })); } catch (e) {}
        } catch (e) {
            console.warn('[T6] bulk fetch failed:', e.message);
            return 0;
        }
    }

    // De-dup: mblidh çelësat e detyrave T6 ekzistues
    const ekzT6 = new Set(
        detyrat
            .filter(d => d.lloji === 'auto' && d.statusi !== 'e_perfunduar' && d.statusi !== 'e_anuluar' && d.burimi && d.burimi.rregulla === 'auto_oferta_pare_35')
            .map(d => makeRregullKey(d.burimi))
    );

    let krijuara = 0;
    const sotIso = new Date().toISOString().split('T')[0];
    const afatiNeser = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    kandidate.forEach(o => {
        const t = tracking[o.id];
        if (!t || !t.here_pare) return;
        const n = Number(t.here_pare);
        if (n < 3 || n > 5) return;
        const key = makeRregullKey({ moduli: 'oferta', referencaId: o.id, rregulla: 'auto_oferta_pare_35' });
        if (ekzT6.has(key)) return;
        detyrat.push(krijoDetyreObjektAuto({
            titulli: `Oferta parë ${n} herë — ${o.emri || 'klient'}`,
            pershkrimi: `Klienti e ka hapur ofertën ${n} herë por s'ka konfirmuar — sinjal interesi i fortë. Kontaktoje sa më parë.`,
            prioriteti: 'kritike',
            burimi: { moduli: 'oferta', referencaId: o.id, rregulla: 'auto_oferta_pare_35', metadata: { here_pare: n, emri: o.emri } },
            data_afati: afatiNeser,
            pergjegjesi: o.krijuarNga || null
        }));
        krijuara++;
    });

    if (krijuara > 0) {
        ruajDetyrat();
        // Re-render aksesibël për UI të hapur
        if (typeof renderAccordion === 'function') {
            try { renderAccordion(); } catch (e) {}
        }
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
// CRUD MANUAL (DEC-041: staff lejohet, prioriteti locked='normale')
// =====================================================
function hapDrawerKrijim() {
    const u = getUserAktual();
    if (!u) return;
    document.getElementById('drawer-title').textContent = 'Detyrë e re';
    document.getElementById('d-titulli').value = '';
    document.getElementById('d-pershkrimi').value = '';
    document.getElementById('d-afati').value = '';
    populateStafiDropdown('d-pergjegjesi');

    // Permission lock për staff: prioriteti vetëm 'normale'
    const selPrio = document.getElementById('d-prioriteti');
    if (selPrio) {
        if (isManagement()) {
            selPrio.disabled = false;
            selPrio.value = 'normale';
        } else {
            selPrio.value = 'normale';
            selPrio.disabled = true;
            selPrio.title = 'Stafi mund të krijojë vetëm detyra me prioritet normal';
        }
    }

    document.getElementById('drawer-overlay').classList.add('active');
    setTimeout(() => document.getElementById('d-titulli').focus(), 100);
}
function mbyllDrawer() {
    document.getElementById('drawer-overlay').classList.remove('active');
}
function populateStafiDropdown(selectId) {
    const stafi = JSON.parse(localStorage.getItem('stafi') || '[]');
    const sel = document.getElementById(selectId);
    if (!sel) return;
    let opts = '<option value="">— Pa caktuar —</option>';
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
    const afati = document.getElementById('d-afati').value;
    if (!afati) { alert('Afati është i detyrueshëm për detyrat manuale.'); return; }
    const u = getUserAktual();
    const now = new Date().toISOString();
    // Prioriteti: staff lejohet vetëm 'normale' (lock i imponuar nga server-side logic)
    let prioriteti = document.getElementById('d-prioriteti').value;
    if (!isManagement()) prioriteti = 'normale';
    const detyra = {
        id: generateId(),
        titulli,
        pershkrimi: document.getElementById('d-pershkrimi').value.trim(),
        lloji: 'manual',
        statusi: 'e_re',
        prioriteti,
        pergjegjesi: document.getElementById('d-pergjegjesi').value || null,
        krijuarNga: u ? u.username : 'agon',
        dega: u ? (u.dega || null) : null,
        data_krijimit: now.split('T')[0],
        data_afati: afati,
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
// ACTIONS (single)
// =====================================================
function merrPerSiper(id, e) {
    if (e) e.stopPropagation();
    const u = getUserAktual(); if (!u) return;
    const d = detyrat.find(x => x.id === id); if (!d) return;
    d.statusi = 'ne_progres';
    if (!d.pergjegjesi) d.pergjegjesi = u.username;
    d.aktivitete.push({ data: new Date().toISOString(), autori: u.username, tipi: 'status_change', teksti: 'Mori përsipër' });
    ruajDetyrat();
    renderAll();
}
function perfundoDetyre(id, e) {
    if (e) e.stopPropagation();
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
function anuloDetyre(id, e) {
    if (e) e.stopPropagation();
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
function hapModulNgaDetyra(id, e) {
    if (e) e.stopPropagation();
    const d = detyrat.find(x => x.id === id); if (!d || !d.burimi) return;
    const m = d.burimi.moduli;
    const ref = d.burimi.referencaId;
    if (m === 'kontratat' || m === 'oferta' || m === 'faturimi' || m === 'rinovimet' || m === 'debitoret') {
        window.location.href = `${m}.html?hap=${encodeURIComponent(ref)}`;
    }
}

// =====================================================
// MODIFIKIM AFATI (Hapi 6, mgmt+ only)
// =====================================================
function hapAfatiModal(id, e) {
    if (e) e.stopPropagation();
    if (!isManagement()) return;
    const d = detyrat.find(x => x.id === id); if (!d) return;
    _afatiModalId = id;
    const inp = document.getElementById('afati-modal-input');
    if (inp) inp.value = d.data_afati || '';
    document.getElementById('afati-modal-overlay').classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    setTimeout(() => { if (inp) inp.focus(); }, 100);
}
function mbyllAfatiModal() {
    document.getElementById('afati-modal-overlay').classList.remove('active');
    _afatiModalId = null;
}
function ruajAfatin() {
    if (!_afatiModalId) return;
    const u = getUserAktual(); if (!u) return;
    const d = detyrat.find(x => x.id === _afatiModalId); if (!d) return;
    const ri = document.getElementById('afati-modal-input').value;
    if (!ri) { alert('Zgjidh një datë.'); return; }
    const old = d.data_afati;
    d.data_afati = ri;
    d.aktivitete.push({ data: new Date().toISOString(), autori: u.username, tipi: 'afat_change', teksti: `Afati: ${old || '—'} → ${ri}` });
    ruajDetyrat();
    mbyllAfatiModal();
    renderAll();
    shfaqToast('Afati u ndryshua', null);
}

// =====================================================
// CONFIRM MODAL (helper për bulk actions)
// =====================================================
function showConfirmDialog(mesazhi, callback) {
    document.getElementById('confirm-modal-msg').textContent = mesazhi;
    _confirmCallback = callback;
    document.getElementById('confirm-modal-overlay').classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();
    const okBtn = document.getElementById('confirm-modal-ok');
    okBtn.onclick = function() {
        const cb = _confirmCallback;
        mbyllConfirmModal();
        if (typeof cb === 'function') cb();
    };
}
function mbyllConfirmModal() {
    document.getElementById('confirm-modal-overlay').classList.remove('active');
    _confirmCallback = null;
}

// =====================================================
// SELECTION MODE + BULK ACTIONS
// =====================================================
function toggleSelectionMode() {
    _selectionMode = !_selectionMode;
    _selectedIds.clear();
    const btn = document.getElementById('btn-perzgjedh');
    const toolbar = document.getElementById('det-selection-toolbar');
    if (btn) btn.style.display = _selectionMode ? 'none' : 'inline-flex';
    if (toolbar) toolbar.style.display = _selectionMode ? 'flex' : 'none';
    renderAll();
}
function toggleSelected(id, e) {
    if (e) e.stopPropagation();
    if (_selectedIds.has(id)) _selectedIds.delete(id);
    else _selectedIds.add(id);
    updateSelectionCount();
    // re-render vetëm rreshtin për performancë (DEC marrë gjatë: re-render i plotë për konsistencë me checkbox-et e nën-grupit)
    renderAll();
}
function selectAllInGroup(groupId, items, e) {
    if (e) e.stopPropagation();
    const allSelected = items.every(d => _selectedIds.has(d.id));
    if (allSelected) items.forEach(d => _selectedIds.delete(d.id));
    else items.forEach(d => _selectedIds.add(d.id));
    updateSelectionCount();
    renderAll();
}
function updateSelectionCount() {
    const el = document.getElementById('det-selection-count');
    if (el) el.textContent = _selectedIds.size;
}

function getSelectedDetyrat() {
    return detyrat.filter(d => _selectedIds.has(d.id));
}
function bulkMerrPersiper() {
    const u = getUserAktual(); if (!u) return;
    const sel = getSelectedDetyrat().filter(d => d.statusi !== 'ne_progres' && d.statusi !== 'e_perfunduar' && d.statusi !== 'e_anuluar');
    if (sel.length === 0) {
        shfaqToast('Asnjë detyrë e vlefshme për "Merr përsipër"', null);
        return;
    }
    showConfirmDialog(`Merr përsipër ${sel.length} detyra?`, () => {
        sel.forEach(d => {
            d.statusi = 'ne_progres';
            if (!d.pergjegjesi) d.pergjegjesi = u.username;
            d.aktivitete.push({ data: new Date().toISOString(), autori: u.username, tipi: 'status_change', teksti: 'Mori përsipër (bulk)' });
        });
        ruajDetyrat();
        shfaqToast(`${sel.length} detyra u morën përsipër`, null);
        toggleSelectionMode();
    });
}
function bulkPerfundo() {
    const u = getUserAktual(); if (!u) return;
    const sel = getSelectedDetyrat().filter(d => d.statusi !== 'e_perfunduar' && d.statusi !== 'e_anuluar');
    if (sel.length === 0) {
        shfaqToast('Asnjë detyrë e vlefshme për "Përfundo"', null);
        return;
    }
    showConfirmDialog(`Përfundo ${sel.length} detyra? (pa undo)`, () => {
        const today = new Date().toISOString().split('T')[0];
        sel.forEach(d => {
            d.statusi = 'e_perfunduar';
            d.data_perfundimit = today;
            d.aktivitete.push({ data: new Date().toISOString(), autori: u.username, tipi: 'status_change', teksti: 'Përfunduar (bulk)' });
        });
        ruajDetyrat();
        shfaqToast(`${sel.length} detyra u përfunduan`, null);
        toggleSelectionMode();
    });
}
function bulkAnulo() {
    if (!isManagement()) return;
    const u = getUserAktual(); if (!u) return;
    const sel = getSelectedDetyrat().filter(d => d.statusi !== 'e_anuluar' && d.statusi !== 'e_perfunduar');
    if (sel.length === 0) {
        shfaqToast('Asnjë detyrë e vlefshme për "Anulo"', null);
        return;
    }
    showConfirmDialog(`Anulo ${sel.length} detyra? (pa undo)`, () => {
        sel.forEach(d => {
            d.statusi = 'e_anuluar';
            d.aktivitete.push({ data: new Date().toISOString(), autori: u.username, tipi: 'status_change', teksti: 'Anuluar (bulk)' });
        });
        ruajDetyrat();
        shfaqToast(`${sel.length} detyra u anuluan`, null);
        toggleSelectionMode();
    });
}
function hapModalRicakto() {
    if (!isManagement()) return;
    const sel = getSelectedDetyrat();
    if (sel.length === 0) {
        shfaqToast('Asnjë detyrë e zgjedhur', null);
        return;
    }
    document.getElementById('ricakto-count').textContent = sel.length;
    populateStafiDropdown('ricakto-pergjegjesi');
    document.getElementById('ricakto-pergjegjesi').value = '';
    document.getElementById('ricakto-modal-overlay').classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
function mbyllRicaktoModal() {
    document.getElementById('ricakto-modal-overlay').classList.remove('active');
}
function ruajRicakto() {
    if (!isManagement()) return;
    const u = getUserAktual(); if (!u) return;
    const noviPergj = document.getElementById('ricakto-pergjegjesi').value || null;
    const sel = getSelectedDetyrat();
    if (sel.length === 0) return;
    sel.forEach(d => {
        const old = d.pergjegjesi || '—';
        d.pergjegjesi = noviPergj;
        d.aktivitete.push({ data: new Date().toISOString(), autori: u.username, tipi: 'pergjegjesi_change', teksti: `Përgjegjësi: ${old} → ${noviPergj || 'Pa caktuar'}` });
    });
    ruajDetyrat();
    mbyllRicaktoModal();
    shfaqToast(`${sel.length} detyra u ricaktuan`, null);
    toggleSelectionMode();
}

// =====================================================
// TOAST UNDO (mos prek logjikën — DEC-031)
// =====================================================
function shfaqToast(mesazh, callbackUndo) {
    const cont = document.getElementById('det-toast-container');
    if (!cont) return;
    if (pendingUndo && pendingUndo.timer) clearTimeout(pendingUndo.timer);
    cont.innerHTML = '';
    const t = document.createElement('div');
    t.className = 'det-toast';
    const undoBtn = (typeof callbackUndo === 'function') ? `<button class="det-toast-undo" type="button">Anulo</button>` : '';
    t.innerHTML = `
        <span class="det-toast-icon"><i data-lucide="check-circle"></i></span>
        <span class="det-toast-msg">${escapeHtml(mesazh)}</span>
        ${undoBtn}
    `;
    cont.appendChild(t);
    if (typeof lucide !== 'undefined') lucide.createIcons();
    requestAnimationFrame(() => t.classList.add('show'));
    const fshi = () => {
        t.classList.remove('show');
        setTimeout(() => { if (t.parentNode) t.remove(); }, 250);
        pendingUndo = null;
    };
    const btn = t.querySelector('.det-toast-undo');
    if (btn) {
        btn.addEventListener('click', () => {
            if (typeof callbackUndo === 'function') callbackUndo();
            fshi();
        });
    }
    const timer = setTimeout(fshi, 5000);
    pendingUndo = { timer, fshi };
}

// =====================================================
// FILTERS + STATE
// =====================================================
function setFilter(filter) {
    currentFilter = filter;
    localStorage.setItem('detyrat_filter_state', filter);
    document.querySelectorAll('.det-chip').forEach(c => c.classList.toggle('active', c.dataset.filter === filter));
    renderAccordion();
}
function aplikoFilter(lista) {
    if (currentFilter === 'te-miat') return lista.filter(eshteImja);
    if (currentFilter === 'pa-pergjegjes') return lista.filter(eshtePaPergjegjes);
    return lista;
}
function toggleGroup(prioriteti) {
    groupState[prioriteti] = !(groupState[prioriteti] !== false);
    localStorage.setItem('detyrat_group_state', JSON.stringify(groupState));
    renderAccordion();
}
function toggleNenGrup(key) {
    groupState[key] = !groupState[key];
    localStorage.setItem('detyrat_group_state', JSON.stringify(groupState));
    renderAccordion();
}
function toggleExpand(id, e) {
    if (e) e.stopPropagation();
    if (_selectionMode) {
        toggleSelected(id);
        return;
    }
    if (expandedRows.has(id)) expandedRows.delete(id);
    else expandedRows.add(id);
    renderAccordion();
}

// =====================================================
// SORTING (Hapi 7) — ne_progres lart, pastaj sipas afatit ASC
// =====================================================
function rendisDetyrat(lista) {
    const statusiRank = (s) => {
        if (s === 'ne_progres') return 0;
        if (s === 'e_re') return 1;
        if (s === 'e_perfunduar') return 2;
        return 3;
    };
    return [...lista].sort((a, b) => {
        const ra = statusiRank(a.statusi), rb = statusiRank(b.statusi);
        if (ra !== rb) return ra - rb;
        const da = parseDataAny(a.data_afati);
        const db = parseDataAny(b.data_afati);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return da - db;
    });
}

// =====================================================
// NËN-GRUPIM SIPAS MODULIT
// =====================================================
const MODULI_LABELS = {
    kontratat: 'Kontratat',
    oferta: 'Oferta',
    faturimi: 'Faturimi',
    rinovimet: 'Rinovimet',
    debitoret: 'Debitorët',
    manual: 'Detyra manuale'
};
const MODULI_ORDER = ['kontratat', 'oferta', 'faturimi', 'rinovimet', 'debitoret', 'manual'];
function grupoSipasModulit(lista) {
    const out = { kontratat: [], oferta: [], faturimi: [], rinovimet: [], debitoret: [], manual: [] };
    lista.forEach(d => {
        const m = (d.burimi && d.burimi.moduli) ? d.burimi.moduli : 'manual';
        if (out[m]) out[m].push(d);
        else out.manual.push(d);
    });
    return out;
}

// =====================================================
// RENDER — Dense Rows
// =====================================================
function renderDenseRow(d) {
    const isPerfunduar = d.statusi === 'e_perfunduar';
    const isProgress = d.statusi === 'ne_progres';
    const isExpanded = expandedRows.has(d.id);
    const isSelected = _selectedIds.has(d.id);
    const isMine = eshteImja(d);

    // Klasa border-left sipas prioritetit (kur përfunduar → success ngjyrë)
    const prioritetiCls = isPerfunduar ? 'det-row-perfunduar' : `det-row-${d.prioriteti || 'normale'}`;

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
            afatiBadge = `<span class="det-badge det-badge-afati det-badge-afati-${cls}">${escapeHtml(txt)}</span>`;
        }
    } else if (isPerfunduar) {
        afatiBadge = `<span class="det-badge det-badge-status-perfunduar"><i data-lucide="check"></i> Mbaroi</span>`;
    }

    // Ikona auto/manual
    const iconCls = d.lloji === 'auto' ? 'det-row-icon-auto' : '';
    const iconName = d.lloji === 'auto' ? 'bot' : 'hand';

    // Përgjegjësi (truncate)
    const pergj = d.pergjegjesi
        ? `<span class="det-row-pergj"><i data-lucide="user-check"></i>${escapeHtml(d.pergjegjesi)}</span>`
        : `<span class="det-row-pergj det-row-pergj-faint"><i data-lucide="user-x"></i>Pa caktuar</span>`;

    // Checkbox (kur selection mode)
    const cb = `<label class="det-row-checkbox" onclick="event.stopPropagation()">
        <input type="checkbox" ${isSelected ? 'checked' : ''} onclick="toggleSelected('${d.id}', event)">
    </label>`;

    // Klasat wrapper
    const wrapperClasses = [
        'det-row-wrapper',
        prioritetiCls,
        isProgress ? 'det-row-progres' : '',
        isMine ? 'det-row-imja' : '',
        isSelected ? 'det-row-selected' : '',
        isExpanded ? 'expanded' : '',
        _selectionMode ? 'det-selection-active' : ''
    ].filter(Boolean).join(' ');

    let html = `<div class="${wrapperClasses}" data-id="${d.id}">
        <div class="det-row-main" onclick="toggleExpand('${d.id}', event)">
            ${cb}
            <div class="det-row-icon ${iconCls}" title="${d.lloji === 'auto' ? 'Auto' : 'Manuale'}"><i data-lucide="${iconName}"></i></div>
            <div class="det-row-title" title="${escapeHtml(d.titulli)}">${escapeHtml(d.titulli)}</div>
            ${pergj}
            <div class="det-row-afati">${afatiBadge}</div>
            <div class="det-row-chevron"><i data-lucide="chevron-down"></i></div>
        </div>`;
    if (isExpanded) {
        html += `<div class="det-row-expanded">${renderExpandedDetails(d)}</div>`;
    }
    html += `</div>`;
    return html;
}

function renderExpandedDetails(d) {
    const isPerfunduar = d.statusi === 'e_perfunduar';
    const isProgress = d.statusi === 'ne_progres';
    const isAnuluar = d.statusi === 'e_anuluar';

    // Meta badges (lloji + status + afati i plotë)
    const llojiBadge = d.lloji === 'auto'
        ? `<span class="det-badge det-badge-auto"><i data-lucide="bot"></i> Auto</span>`
        : `<span class="det-badge det-badge-manual"><i data-lucide="hand"></i> Manuale</span>`;
    const stMap = {
        e_re: { lbl: 'E re', cls: 'e-re' },
        ne_progres: { lbl: 'Në progres', cls: 'progres' },
        e_perfunduar: { lbl: 'E përfunduar', cls: 'perfunduar' },
        e_anuluar: { lbl: 'E anuluar', cls: 'perfunduar' }
    };
    const st = stMap[d.statusi] || stMap.e_re;
    const statusBadge = `<span class="det-badge det-badge-status det-badge-status-${st.cls}">${escapeHtml(st.lbl)}</span>`;
    const dataAfatiTxt = d.data_afati ? `Afati: ${formatDataShqip(d.data_afati)}` : 'Pa afat';
    const dataKrijTxt = d.data_krijimit ? `Krijuar: ${formatDataShqip(d.data_krijimit)}` : '';

    // Burimi link
    let burimi = '';
    if (d.lloji === 'auto' && d.burimi && d.burimi.moduli) {
        const m = d.burimi.moduli;
        burimi = `<div class="det-row-exp-burimi">
            <button class="det-link" onclick="hapModulNgaDetyra('${d.id}', event)" type="button">
                <i data-lucide="external-link"></i> Hap te ${escapeHtml(MODULI_LABELS[m] || m)}
            </button>
        </div>`;
    }

    // Aktivitete (3 të fundit)
    let aktTxt = '';
    if (d.aktivitete && d.aktivitete.length > 0) {
        const lastFew = d.aktivitete.slice(-3).reverse();
        aktTxt = `<div class="det-row-exp-akt" style="margin-top:8px;font-size:11px;color:var(--s-text-muted);">
            <div style="font-weight:700;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.3px;">Aktiviteti i fundit</div>
            ${lastFew.map(a => `<div>• ${escapeHtml(a.teksti || a.tipi)} <em>(${escapeHtml(a.autori || '')}, ${formatDataShqip(a.data)})</em></div>`).join('')}
        </div>`;
    }

    // Veprimet
    let actions = '';
    if (!isPerfunduar && !isAnuluar) {
        if (!isProgress) {
            actions += `<button class="det-action det-action-primary" onclick="merrPerSiper('${d.id}', event)" type="button">
                <i data-lucide="play"></i> Merr përsipër
            </button>`;
        }
        actions += `<button class="det-action det-action-success" onclick="perfundoDetyre('${d.id}', event)" type="button">
            <i data-lucide="check"></i> Përfundo
        </button>`;
        if (isManagement()) {
            actions += `<button class="det-action det-action-neutral" onclick="hapAfatiModal('${d.id}', event)" type="button">
                <i data-lucide="calendar-clock"></i> Ndrysho afatin
            </button>`;
            actions += `<button class="det-action det-action-danger" onclick="anuloDetyre('${d.id}', event)" type="button">
                <i data-lucide="x"></i> Anulo
            </button>`;
        }
    }

    return `<div class="det-row-expanded-content">
        <div class="det-row-exp-meta">${llojiBadge}${statusBadge}<span class="det-badge det-badge-status-e-re">${escapeHtml(dataAfatiTxt)}</span>${dataKrijTxt ? `<span class="det-badge det-badge-status-e-re">${escapeHtml(dataKrijTxt)}</span>` : ''}</div>
        ${d.pershkrimi ? `<div class="det-row-exp-desc">${escapeHtml(d.pershkrimi)}</div>` : ''}
        ${burimi}
        ${aktTxt}
        ${actions ? `<div class="det-row-exp-actions">${actions}</div>` : ''}
    </div>`;
}

// =====================================================
// RENDER ACCORDION (4 grupe + nën-grupim opsional)
// =====================================================
function ngrupo(lista) {
    const groups = { kritike: [], te_rendesishme: [], normale: [], e_perfunduar: [] };
    lista.forEach(d => {
        if (d.statusi === 'e_anuluar') return;
        if (d.statusi === 'e_perfunduar') { groups.e_perfunduar.push(d); return; }
        const p = d.prioriteti || 'normale';
        (groups[p] || groups.normale).push(d);
    });
    return groups;
}
function renderFiltersCounts(visible) {
    const aktive = visible.filter(d => d.statusi !== 'e_anuluar' && d.statusi !== 'e_perfunduar');
    document.getElementById('c-all').textContent = aktive.length;
    document.getElementById('c-mine').textContent = aktive.filter(eshteImja).length;
    document.getElementById('c-unassigned').textContent = aktive.filter(eshtePaPergjegjes).length;
}
function renderAccordion() {
    const cont = document.getElementById('det-accordion');
    if (!cont) return;

    let visible = filtroSipasPermissions(detyrat);
    renderFiltersCounts(visible);
    visible = aplikoFilter(visible);

    const groups = ngrupo(visible);
    const groupDefs = [
        { id: 'kritike', titulli: 'Kritike', iconLucide: 'alert-octagon', items: groups.kritike, defaultOpen: true },
        { id: 'te_rendesishme', titulli: 'Të rëndësishme', iconLucide: 'alert-triangle', items: groups.te_rendesishme, defaultOpen: true },
        { id: 'normale', titulli: 'Normale', iconLucide: 'circle-dot', items: groups.normale, defaultOpen: true },
        { id: 'e_perfunduar', titulli: 'Të përfunduara', iconLucide: 'check-circle-2', items: groups.e_perfunduar, defaultOpen: false }
    ];

    let totalAll = visible.filter(d => d.statusi !== 'e_anuluar').length;
    if (totalAll === 0) {
        cont.innerHTML = '<div class="det-empty"><i data-lucide="check-circle-2" style="width:36px;height:36px;color:var(--s-success)"></i><div>Asnjë detyrë aktualisht</div></div>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    let html = '';
    groupDefs.forEach(g => {
        if (g.items.length === 0 && g.id !== 'kritike') return;
        const isOpen = groupState[g.id] !== undefined ? groupState[g.id] : g.defaultOpen;
        const sorted = rendisDetyrat(g.items);

        // Group header checkbox (vetëm në selection mode)
        const allSel = sorted.length > 0 && sorted.every(d => _selectedIds.has(d.id));
        const groupCbSafe = _selectionMode
            ? `<label class="det-group-checkbox" onclick="event.stopPropagation()"><input type="checkbox" ${allSel ? 'checked' : ''} data-group-select="${g.id}"></label>`
            : '';

        let bodyHtml = '';
        if (isOpen) {
            if (sorted.length === 0) {
                bodyHtml = '<div class="det-group-empty">Asnjë detyrë në këtë kategori</div>';
            } else if (sorted.length > NEN_GRUP_THRESHOLD) {
                // Nën-grupim sipas modulit
                const byMod = grupoSipasModulit(sorted);
                bodyHtml = MODULI_ORDER.map(modKey => {
                    const items = byMod[modKey];
                    if (!items || items.length === 0) return '';
                    const ngKey = `${g.id}__${modKey}`;
                    const ngOpen = groupState[ngKey] !== undefined ? groupState[ngKey] : true;
                    const ngAllSel = items.length > 0 && items.every(d => _selectedIds.has(d.id));
                    return `<div class="det-nen-grup${ngOpen ? ' open' : ''}" data-key="${ngKey}">
                        <div class="det-nen-grup-header" onclick="toggleNenGrup('${ngKey}')">
                            <i class="det-nen-grup-chevron" data-lucide="chevron-right"></i>
                            ${_selectionMode ? `<label class="det-nen-grup-checkbox" onclick="event.stopPropagation()"><input type="checkbox" ${ngAllSel ? 'checked' : ''} data-nengrup-select="${ngKey}"></label>` : ''}
                            <span class="det-nen-grup-title">${escapeHtml(MODULI_LABELS[modKey] || modKey)}</span>
                            <span class="det-nen-grup-count">${items.length}</span>
                        </div>
                        ${ngOpen ? `<div class="det-nen-grup-body">${rendisDetyrat(items).map(renderDenseRow).join('')}</div>` : ''}
                    </div>`;
                }).join('');
            } else {
                bodyHtml = sorted.map(renderDenseRow).join('');
            }
        }

        html += `<div class="det-group${isOpen ? ' open' : ''}${_selectionMode ? ' det-selection-active' : ''}" data-group="${g.id}">
            <div class="det-group-header" onclick="toggleGroup('${g.id}')">
                ${groupCbSafe}
                <div class="det-group-title">
                    <i data-lucide="${isOpen ? 'chevron-down' : 'chevron-right'}"></i>
                    <i data-lucide="${g.iconLucide}" class="det-group-icon-${g.id}"></i>
                    <span>${escapeHtml(g.titulli)}</span>
                </div>
                <span class="det-group-count">${g.items.length}</span>
            </div>
            ${isOpen ? `<div class="det-group-body">${bodyHtml}</div>` : ''}
        </div>`;
    });
    cont.innerHTML = html;

    // Bind data-attribute checkbox handlers (më e sigurt se inline onclick me JSON)
    cont.querySelectorAll('input[data-group-select]').forEach(inp => {
        inp.addEventListener('click', function(ev) {
            ev.stopPropagation();
            const gid = this.dataset.groupSelect;
            // Gjej items nga grupi aktual
            let visible2 = aplikoFilter(filtroSipasPermissions(detyrat));
            const groups2 = ngrupo(visible2);
            const items = (groups2[gid] || []).map(d => d.id);
            const allSelected = items.length > 0 && items.every(id => _selectedIds.has(id));
            if (allSelected) items.forEach(id => _selectedIds.delete(id));
            else items.forEach(id => _selectedIds.add(id));
            updateSelectionCount();
            renderAccordion();
        });
    });
    cont.querySelectorAll('input[data-nengrup-select]').forEach(inp => {
        inp.addEventListener('click', function(ev) {
            ev.stopPropagation();
            const [gid, mod] = this.dataset.nengrupSelect.split('__');
            let visible2 = aplikoFilter(filtroSipasPermissions(detyrat));
            const groups2 = ngrupo(visible2);
            const byMod = grupoSipasModulit(groups2[gid] || []);
            const items = (byMod[mod] || []).map(d => d.id);
            const allSelected = items.length > 0 && items.every(id => _selectedIds.has(id));
            if (allSelected) items.forEach(id => _selectedIds.delete(id));
            else items.forEach(id => _selectedIds.add(id));
            updateSelectionCount();
            renderAccordion();
        });
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}
function renderAll() {
    renderAccordion();
    updateSelectionCount();
}

// =====================================================
// BOOTSTRAP
// =====================================================
document.addEventListener('DOMContentLoaded', function () {
    const user = checkAuth();
    if (!user) return;
    aplikoPermissions();
    pastroDetyratEArkiva();
    migroDetyratReferences();
    gjeneroDetyratAuto();
    document.querySelectorAll('.det-chip').forEach(c => c.classList.toggle('active', c.dataset.filter === currentFilter));
    renderAccordion();
});

// ESC mbyll drawer-at dhe modal-et
document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    const ov = document.getElementById('drawer-overlay');
    if (ov && ov.classList.contains('active')) { mbyllDrawer(); return; }
    const ov2 = document.getElementById('afati-modal-overlay');
    if (ov2 && ov2.classList.contains('active')) { mbyllAfatiModal(); return; }
    const ov3 = document.getElementById('confirm-modal-overlay');
    if (ov3 && ov3.classList.contains('active')) { mbyllConfirmModal(); return; }
    const ov4 = document.getElementById('ricakto-modal-overlay');
    if (ov4 && ov4.classList.contains('active')) { mbyllRicaktoModal(); return; }
});
