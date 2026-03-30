// ============================================================
// RINOVIMET.JS — Moduli i Rinovimeve
// ============================================================

// ===== STORAGE KEY =====
const RIN_STORAGE_KEY = 'rinovimet_data';
const RIN_IMPORT_KEY  = 'rinovimet_imports';

// ===== STATUS CONFIG =====
const STATUSET = {
    pa_filluar:  { emri: 'Pa filluar',  ngjyra: '#94a3b8' },
    kontaktuar:  { emri: 'Kontaktuar',  ngjyra: '#f59e0b' },
    negociata:   { emri: 'Negociata',   ngjyra: '#3b82f6' },
    rinovuar:    { emri: 'Rinovuar',    ngjyra: '#22c55e' },
    humbur:      { emri: 'Humbur',      ngjyra: '#ef4444' },
    anuluar:     { emri: 'Anuluar',     ngjyra: '#6b7280' }
};

// ===== STATE =====
let rinovimet = [];          // Array e të gjitha rinovimeve
let filteredList = [];       // Pas filtrimit
let currentFilter = 'total'; // Filtri aktual i statusit
let currentDrawerId = null;  // ID e rinovimit të hapur në drawer
let importParsedData = null; // Të dhënat e parsuara nga importi
let importStep = 1;

// ===== COLUMN MAP — maps Excel header names to our fields =====
const COLUMN_MAP = {
    'nr.':               'nr_rreshti',
    'lloji i polices':   'lloji',
    'dega':              'dega',
    'agjenti':           'agjenti',
    'id':                'kontraktues_id',
    'kontraktuesi':      'kontraktuesi',
    'nr i kontrates':    'nr_kontrates',
    'nr i pro-fatures':  'nr_profatures',
    'data e fatures':    'data_fatures',
    'fillon':            'data_fillimit',
    'mbaron':            'data_mbarimit',
    'primi(v)':          'primi',
    'tvsh(v)':           'tvsh',
    'total(v)':          'total_primi',
    'valuta':            'valuta'
};

// Dëme kolonat (positional after 'valuta') — header ka 'nr','paguar','nr','pezull'
const DEME_COLS = ['deme_nr_paguar','deme_vlera_paguar','deme_nr_pezull','deme_vlera_pezull'];


// ==============================================================
// INIT
// ==============================================================
document.addEventListener('DOMContentLoaded', function() {
    ngarkoTedhena();
    renderTabela();
    perditesoStats();
    perditesoSubtitle();
    populoFiltrat();
});


// ==============================================================
// STORAGE
// ==============================================================
function ngarkoTedhena() {
    try {
        const data = localStorage.getItem(RIN_STORAGE_KEY);
        rinovimet = data ? JSON.parse(data) : [];
    } catch(e) {
        console.error('Gabim në ngarkim:', e);
        rinovimet = [];
    }
}

function ruajTedhena() {
    localStorage.setItem(RIN_STORAGE_KEY, JSON.stringify(rinovimet));
}

function ruajImportMeta(meta) {
    try {
        let imports = JSON.parse(localStorage.getItem(RIN_IMPORT_KEY) || '[]');
        imports.push(meta);
        localStorage.setItem(RIN_IMPORT_KEY, JSON.stringify(imports));
    } catch(e) { console.error(e); }
}

function merrLastImport() {
    try {
        let imports = JSON.parse(localStorage.getItem(RIN_IMPORT_KEY) || '[]');
        return imports.length > 0 ? imports[imports.length - 1] : null;
    } catch(e) { return null; }
}


// ==============================================================
// SUBTITLE
// ==============================================================
function perditesoSubtitle() {
    const el = document.getElementById('rinSubtitle');
    if (rinovimet.length === 0) {
        el.textContent = 'Asnjë import ende';
        return;
    }
    const lastImport = merrLastImport();
    if (lastImport) {
        el.textContent = `${lastImport.periudha || ''} · ${rinovimet.length} kontrata · Importuar ${lastImport.data}`;
    } else {
        el.textContent = `${rinovimet.length} kontrata`;
    }
}


// ==============================================================
// STATS
// ==============================================================
function perditesoStats() {
    const counts = { total: rinovimet.length };
    Object.keys(STATUSET).forEach(s => counts[s] = 0);
    rinovimet.forEach(r => {
        if (counts[r.statusi] !== undefined) counts[r.statusi]++;
    });

    document.getElementById('statTotal').textContent = counts.total;
    document.getElementById('statPaFilluar').textContent = counts.pa_filluar || 0;
    document.getElementById('statKontaktuar').textContent = counts.kontaktuar || 0;
    document.getElementById('statNegociata').textContent = counts.negociata || 0;
    document.getElementById('statRinovuar').textContent = counts.rinovuar || 0;
    document.getElementById('statHumbur').textContent = (counts.humbur || 0) + (counts.anuluar || 0);
}


// ==============================================================
// FILTERS
// ==============================================================
function filtroStatus(status) {
    currentFilter = status;

    // Update active stat card
    document.querySelectorAll('.rin-stat-card').forEach(c => c.classList.remove('active'));
    const card = document.querySelector(`.rin-stat-card[data-status="${status}"]`);
    if (card) card.classList.add('active');

    aplikoFiltrat();
}

function aplikoFiltrat() {
    const search = document.getElementById('rinSearch').value.toLowerCase().trim();
    const agjent = document.getElementById('rinFilterAgjent').value;
    const dega   = document.getElementById('rinFilterDega').value;

    filteredList = rinovimet.filter(r => {
        // Status filter
        if (currentFilter !== 'total') {
            if (currentFilter === 'humbur') {
                if (r.statusi !== 'humbur' && r.statusi !== 'anuluar') return false;
            } else {
                if (r.statusi !== currentFilter) return false;
            }
        }
        // Search
        if (search && !r.kontraktuesi.toLowerCase().includes(search) &&
            !r.nr_kontrates.toLowerCase().includes(search)) return false;
        // Agjent
        if (agjent && r.agjenti !== agjent) return false;
        // Dega
        if (dega && r.dega !== dega) return false;

        return true;
    });

    renderTabela();
}

function populoFiltrat() {
    const agjentet = [...new Set(rinovimet.map(r => r.agjenti).filter(Boolean))].sort();
    const deget    = [...new Set(rinovimet.map(r => r.dega).filter(Boolean))].sort();

    const selAgjent = document.getElementById('rinFilterAgjent');
    selAgjent.innerHTML = '<option value="">Të gjithë agjentët</option>';
    agjentet.forEach(a => {
        selAgjent.innerHTML += `<option value="${a}">${a}</option>`;
    });

    const selDega = document.getElementById('rinFilterDega');
    selDega.innerHTML = '<option value="">Të gjitha degët</option>';
    deget.forEach(d => {
        selDega.innerHTML += `<option value="${d}">${d}</option>`;
    });
}


// ==============================================================
// TABLE RENDER
// ==============================================================
function renderTabela() {
    const tbody = document.getElementById('rinTableBody');

    // Nëse s'ka të dhëna
    if (rinovimet.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8">
            <div class="rin-empty">
                <div class="rin-empty-icon">📋</div>
                <div class="rin-empty-title">Asnjë rinovim ende</div>
                <div class="rin-empty-sub">Kliko "Importo Excel" për të filluar</div>
            </div></td></tr>`;
        return;
    }

    // Apliko filtrat nëse nuk janë aplikuar
    if (filteredList.length === 0 && currentFilter === 'total' &&
        !document.getElementById('rinSearch').value &&
        !document.getElementById('rinFilterAgjent').value &&
        !document.getElementById('rinFilterDega').value) {
        filteredList = [...rinovimet];
    }

    if (filteredList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8">
            <div class="rin-no-results">Asnjë rezultat nuk u gjet me këto filtra</div>
        </td></tr>`;
        return;
    }

    // Sort: pa_filluar first, then by data_mbarimit (soonest first)
    const statusOrder = { pa_filluar: 0, kontaktuar: 1, negociata: 2, rinovuar: 3, humbur: 4, anuluar: 5 };
    const sorted = [...filteredList].sort((a, b) => {
        const sa = statusOrder[a.statusi] ?? 9;
        const sb = statusOrder[b.statusi] ?? 9;
        if (sa !== sb) return sa - sb;
        return parseDateStr(a.data_mbarimit) - parseDateStr(b.data_mbarimit);
    });

    let html = '';
    sorted.forEach(r => {
        const primi = formatMoney(r.primi_vjetor || r.total_primi || r.primi);
        const deme  = r.deme_total_vlera ? formatMoney(r.deme_total_vlera) : null;
        const cr    = r.cr_percent;
        const mbaron = formatDateShort(r.data_mbarimit);
        const urgent = isUrgent(r.data_mbarimit);

        let crClass = 'rin-deme-none';
        if (cr !== null && cr !== undefined && !isNaN(cr)) {
            crClass = cr > 80 ? 'rin-cr-bad' : cr > 50 ? 'rin-cr-warn' : 'rin-cr-good';
        }

        html += `<tr onclick="hapDrawer('${r.id}')">
            <td>
                <div class="rin-kontraktues-name">${escHtml(r.kontraktuesi)}</div>
                <div class="rin-kontraktues-sub">${escHtml(r.dega)} · ${escHtml(r.agjenti)}</div>
            </td>
            <td>${escHtml(r.nr_kontrates)}</td>
            <td>${escHtml(r.agjenti)}</td>
            <td class="right rin-primi">${primi}</td>
            <td class="right ${deme ? 'rin-deme-val' : 'rin-deme-none'}">${deme || '—'}</td>
            <td class="right ${crClass}">${cr !== null && cr !== undefined && !isNaN(cr) ? cr.toFixed(1) + '%' : '—'}</td>
            <td><span class="rin-badge rin-badge-${r.statusi}">${STATUSET[r.statusi]?.emri || r.statusi}</span></td>
            <td class="center ${urgent ? 'rin-mbaron-urgent' : ''}">${mbaron}</td>
        </tr>`;
    });

    tbody.innerHTML = html;
}


// ==============================================================
// DRAWER
// ==============================================================
function hapDrawer(id) {
    const r = rinovimet.find(x => x.id === id);
    if (!r) return;

    currentDrawerId = id;

    // Title
    document.getElementById('drKontraktuesi').textContent = r.kontraktuesi;
    document.getElementById('drSubtitle').textContent = `${r.nr_kontrates} · ${r.dega}`;

    // Status pills
    renderStatusPills(r.statusi);

    // Info grid
    document.getElementById('drInfoGrid').innerHTML = `
        ${infoCell('Agjenti', r.agjenti)}
        ${infoCell('ID klienti', r.kontraktues_id)}
        ${infoCell('Fillon', r.data_fillimit)}
        ${infoCell('Mbaron', r.data_mbarimit)}
        ${r.nr_profatures ? infoCell('Nr pro-faturës', r.nr_profatures) : ''}
        ${infoCell('Valuta', r.valuta || 'EUR')}
    `;

    // Financiare
    const primi = r.primi_vjetor || r.total_primi || r.primi || 0;
    const demeTotal = r.deme_total_vlera || 0;
    const cr = r.cr_percent;
    const crColor = cr > 80 ? '#ef4444' : cr > 50 ? '#f59e0b' : '#22c55e';

    document.getElementById('drMetrics').innerHTML = `
        <div class="rin-metric">
            <div class="rin-metric-label">Primi vjetor</div>
            <div class="rin-metric-value" style="color:#1e293b">${formatMoney(primi)}</div>
        </div>
        <div class="rin-metric">
            <div class="rin-metric-label">Dëme totale</div>
            <div class="rin-metric-value" style="color:${demeTotal > 0 ? '#ef4444' : '#94a3b8'}">${demeTotal > 0 ? formatMoney(demeTotal) : '—'}</div>
        </div>
        <div class="rin-metric">
            <div class="rin-metric-label">CR%</div>
            <div class="rin-metric-value" style="color:${!isNaN(cr) && cr !== null ? crColor : '#94a3b8'}">${!isNaN(cr) && cr !== null ? cr.toFixed(1) + '%' : '—'}</div>
        </div>
    `;

    // Breakdown
    document.getElementById('drBreakdown').innerHTML = `
        ${breakdownItem('Dëme paguar', r.deme_nr_paguar, r.deme_vlera_paguar)}
        ${breakdownItem('Dëme pezull', r.deme_nr_pezull, r.deme_vlera_pezull)}
        ${breakdownItem('Shpenzimet', null, r.shpenzimet)}
        ${breakdownItem('Kosto totale', null, r.kosto_totale)}
    `;

    // CR Bar
    const crSection = document.getElementById('drCrSection');
    if (!isNaN(cr) && cr !== null && cr > 0) {
        const barWidth = Math.min(cr, 100);
        crSection.innerHTML = `<div class="rin-cr-bar-row">
            <span class="rin-cr-bar-label">Loss ratio</span>
            <div class="rin-cr-bar-track">
                <div class="rin-cr-bar-fill" style="width:${barWidth}%;background:${crColor}"></div>
            </div>
            <span class="rin-cr-bar-value" style="color:${crColor}">${cr.toFixed(1)}%</span>
        </div>`;
        crSection.style.display = '';
    } else {
        crSection.style.display = 'none';
    }

    // Komente
    renderKomente(r);

    // Open drawer
    document.getElementById('rinOverlay').classList.add('open');
    document.getElementById('rinDrawer').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function mbyllDrawer() {
    document.getElementById('rinOverlay').classList.remove('open');
    document.getElementById('rinDrawer').classList.remove('open');
    document.body.style.overflow = '';
    currentDrawerId = null;
}

function renderStatusPills(currentStatus) {
    const container = document.getElementById('drStatusRow');
    let html = '<label>Statusi:</label>';
    Object.keys(STATUSET).forEach(key => {
        const selected = key === currentStatus ? 'selected' : '';
        html += `<span class="rin-status-pill rin-sp-${key} ${selected}" 
                       onclick="ndryshStatus('${key}')">${STATUSET[key].emri}</span>`;
    });
    container.innerHTML = html;
}

function ndryshStatus(newStatus) {
    if (!currentDrawerId) return;
    const r = rinovimet.find(x => x.id === currentDrawerId);
    if (!r) return;

    const oldStatus = r.statusi;
    r.statusi = newStatus;
    r.updated_at = new Date().toISOString();

    // Auto-koment nëse ndryshohet statusi
    if (oldStatus !== newStatus) {
        const user = merrPerdoruesinAktual();
        r.komente = r.komente || [];
        r.komente.unshift({
            teksti: `Statusi u ndryshua: ${STATUSET[oldStatus]?.emri} → ${STATUSET[newStatus]?.emri}`,
            autori: user.emri,
            data: new Date().toISOString(),
            tipi: 'sistem'
        });
    }

    ruajTedhena();
    renderStatusPills(newStatus);
    perditesoStats();
    aplikoFiltrat();
}


// ==============================================================
// KOMENTE
// ==============================================================
function renderKomente(r) {
    const container = document.getElementById('drKomente');
    const komente = r.komente || [];

    if (komente.length === 0) {
        container.innerHTML = '<div style="font-size:13px;color:#94a3b8;padding:8px 0;">Asnjë koment ende</div>';
        return;
    }

    let html = '';
    komente.forEach(k => {
        const isSistem = k.tipi === 'sistem';
        html += `<div class="rin-comment" ${isSistem ? 'style="border-left:3px solid #3b82f6;"' : ''}>
            <div class="rin-comment-header">
                <span class="rin-comment-author">${escHtml(k.autori)}</span>
                <span class="rin-comment-date">${formatKomentDate(k.data)}</span>
            </div>
            <p class="rin-comment-text">${escHtml(k.teksti)}</p>
        </div>`;
    });
    container.innerHTML = html;
}

function shtoKoment() {
    if (!currentDrawerId) return;
    const input = document.getElementById('drKomentInput');
    const teksti = input.value.trim();
    if (!teksti) return;

    const r = rinovimet.find(x => x.id === currentDrawerId);
    if (!r) return;

    const user = merrPerdoruesinAktual();
    r.komente = r.komente || [];
    r.komente.unshift({
        teksti: teksti,
        autori: user.emri,
        data: new Date().toISOString(),
        tipi: 'manual'
    });
    r.updated_at = new Date().toISOString();

    ruajTedhena();
    renderKomente(r);
    input.value = '';
}


// ==============================================================
// IMPORT — Modal Control
// ==============================================================
function hapImportModal() {
    importStep = 1;
    importParsedData = null;
    document.getElementById('rinImportModal').classList.add('open');
    document.getElementById('fileInput').value = '';
    showImportStep(1);
    document.body.style.overflow = 'hidden';
}

function mbyllImportModal() {
    document.getElementById('rinImportModal').classList.remove('open');
    if (!currentDrawerId) document.body.style.overflow = '';
    importParsedData = null;
    importStep = 1;
}

function showImportStep(step) {
    importStep = step;
    document.getElementById('importStep1').style.display = step === 1 ? '' : 'none';
    document.getElementById('importStep2').style.display = step === 2 ? '' : 'none';
    document.getElementById('importStep3').style.display = step === 3 ? '' : 'none';

    // Update step indicators
    [1,2,3].forEach(i => {
        const num = document.getElementById(`stepNum${i}`);
        const txt = document.getElementById(`stepText${i}`);
        num.classList.remove('active','done');
        txt.classList.remove('active');
        if (i < step) num.classList.add('done');
        if (i === step) { num.classList.add('active'); txt.classList.add('active'); }
    });

    // Update footer button
    const btn = document.getElementById('importNextBtn');
    if (step === 1) {
        btn.textContent = 'Vazhdo';
        btn.disabled = true;
        btn.onclick = () => showImportStep(2);
    } else if (step === 2) {
        btn.textContent = 'Vazhdo';
        btn.disabled = false;
        btn.onclick = () => showImportStep(3);
        renderImportStep2();
    } else if (step === 3) {
        btn.textContent = `Importo ${importParsedData.records.length} kontrata`;
        btn.disabled = false;
        btn.onclick = () => ekzekutoImport();
        renderImportStep3();
    }
}


// ==============================================================
// IMPORT — File Handling
// ==============================================================
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) processFile(file);
}

function handleDrop(event) {
    event.preventDefault();
    event.target.closest('.rin-upload-zone')?.classList.remove('dragover');
    const file = event.dataTransfer.files[0];
    if (file) processFile(file);
}

function processFile(file) {
    if (!file.name.match(/\.xlsx?$/i)) {
        alert('Vetëm skedarë .xlsx ose .xls pranohen.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, { type: 'array', cellDates: false, cellFormula: false });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, rawNumbers: true });

            const parsed = parseExcelRows(rows, file.name);
            if (!parsed) return;

            importParsedData = parsed;
            importParsedData.fileName = file.name;
            importParsedData.fileSize = (file.size / 1024).toFixed(0) + ' KB';

            // Enable next button and auto-advance
            document.getElementById('importNextBtn').disabled = false;
            showImportStep(2);

        } catch(err) {
            console.error('Excel parse error:', err);
            alert('Gabim në leximin e skedarit Excel: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}


// ==============================================================
// IMPORT — Excel Parsing
// ==============================================================
function parseExcelRows(rows, fileName) {
    // Find header row (look for 'Nr.' or 'Kontraktuesi' in first 5 rows)
    let headerIdx = -1;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
        const row = rows[i];
        if (!row) continue;
        const cells = row.map(c => c ? String(c).toLowerCase().trim() : '');
        if (cells.includes('nr.') || cells.includes('kontraktuesi') || cells.includes('nr i kontrates')) {
            headerIdx = i;
            break;
        }
    }

    if (headerIdx === -1) {
        alert('Nuk u gjet rreshti i header-it në Excel. Sigurohu që ka kolona si "Nr.", "Kontraktuesi", "Nr i kontrates".');
        return null;
    }

    const headers = rows[headerIdx].map(h => h ? String(h).toLowerCase().trim() : '');
    const dataRows = rows.slice(headerIdx + 1).filter(row =>
        row && row.some(cell => cell !== null && cell !== '' && cell !== undefined)
    );

    // Map columns
    const colMap = {};
    headers.forEach((h, idx) => {
        if (COLUMN_MAP[h]) {
            colMap[COLUMN_MAP[h]] = idx;
        }
    });

    // Find dëme columns (positional: after 'valuta')
    const valutaIdx = colMap['valuta'];
    if (valutaIdx !== undefined) {
        DEME_COLS.forEach((col, i) => {
            const idx = valutaIdx + 1 + i;
            if (idx < headers.length) colMap[col] = idx;
        });
    }

    // Parse data rows
    const rawRecords = [];
    dataRows.forEach(row => {
        const rec = {};
        Object.keys(colMap).forEach(field => {
            let val = row[colMap[field]];
            // Handle formula strings (=N8*31% etc.) — skip them
            if (typeof val === 'string' && val.startsWith('=')) val = null;
            rec[field] = val;
        });

        // Skip if no kontraktuesi or nr_kontrates
        if (!rec.kontraktuesi && !rec.nr_kontrates) return;

        // Parse numbers
        ['primi','tvsh','total_primi','deme_nr_paguar','deme_vlera_paguar',
         'deme_nr_pezull','deme_vlera_pezull'].forEach(f => {
            if (rec[f] !== null && rec[f] !== undefined) {
                rec[f] = parseFloat(rec[f]) || 0;
            }
        });

        rawRecords.push(rec);
    });

    // Group by nr_kontrates
    const grouped = {};
    rawRecords.forEach(rec => {
        const key = rec.nr_kontrates || ('no_id_' + Math.random().toString(36).substr(2, 6));
        if (!grouped[key]) {
            grouped[key] = { ...rec, _rowCount: 1 };
        } else {
            const g = grouped[key];
            g._rowCount++;
            // Sum primi
            g.primi = (g.primi || 0) + (rec.primi || 0);
            g.tvsh  = (g.tvsh || 0) + (rec.tvsh || 0);
            g.total_primi = (g.total_primi || 0) + (rec.total_primi || 0);
            // Sum dëme
            g.deme_nr_paguar   = (g.deme_nr_paguar || 0)   + (rec.deme_nr_paguar || 0);
            g.deme_vlera_paguar = (g.deme_vlera_paguar || 0) + (rec.deme_vlera_paguar || 0);
            g.deme_nr_pezull   = (g.deme_nr_pezull || 0)   + (rec.deme_nr_pezull || 0);
            g.deme_vlera_pezull = (g.deme_vlera_pezull || 0) + (rec.deme_vlera_pezull || 0);
            // Date range: earliest start, latest end
            if (rec.data_fillimit && (!g.data_fillimit || parseDateStr(rec.data_fillimit) < parseDateStr(g.data_fillimit))) {
                g.data_fillimit = rec.data_fillimit;
            }
            if (rec.data_mbarimit && (!g.data_mbarimit || parseDateStr(rec.data_mbarimit) > parseDateStr(g.data_mbarimit))) {
                g.data_mbarimit = rec.data_mbarimit;
            }
        }
    });

    // Build final records with calculated fields
    const records = Object.values(grouped).map(g => {
        // Calculate totals
        g.deme_total_nr    = (g.deme_nr_paguar || 0) + (g.deme_nr_pezull || 0);
        g.deme_total_vlera = (g.deme_vlera_paguar || 0) + (g.deme_vlera_pezull || 0);

        const totalPrimi = g.total_primi || g.primi || 0;
        g.shpenzimet  = totalPrimi * 0.31;
        g.kosto_totale = g.deme_total_vlera + g.shpenzimet;
        g.cr_percent  = totalPrimi > 0 ? (g.kosto_totale / totalPrimi * 100) : null;
        g.primi_vjetor = totalPrimi;

        return g;
    });

    // Detect existing records for update
    const existingMap = {};
    rinovimet.forEach(r => { existingMap[r.nr_kontrates] = r.id; });

    let updateCount = 0;
    let newCount = 0;
    records.forEach(r => {
        if (existingMap[r.nr_kontrates]) {
            r._action = 'update';
            r._existingId = existingMap[r.nr_kontrates];
            updateCount++;
        } else {
            r._action = 'new';
            newCount++;
        }
    });

    // Count grouped rows
    const groupedCount = rawRecords.length - records.length;
    const withDeme = records.filter(r => r.deme_total_vlera > 0).length;
    const withoutDeme = records.length - withDeme;

    // Detect unique agents and branches
    const agents = [...new Set(records.map(r => r.agjenti).filter(Boolean))];
    const branches = [...new Set(records.map(r => r.dega).filter(Boolean))];

    // Try to detect period from title row
    let periudha = '';
    // Check first row for period info
    if (rows[0] && rows[0][0]) {
        const titleStr = String(rows[0][0]);
        const dateMatch = titleStr.match(/(\d{2}\.\d{2}\.\d{4})\s*-\s*(\d{2}\.\d{2}\.\d{4})/);
        if (dateMatch) {
            periudha = `${dateMatch[1]} - ${dateMatch[2]}`;
        }
    }

    return {
        records,
        rawCount: rawRecords.length,
        groupedCount,
        withDeme,
        withoutDeme,
        updateCount,
        newCount,
        agents,
        branches,
        periudha
    };
}


// ==============================================================
// IMPORT — Step 2 (Verify)
// ==============================================================
function renderImportStep2() {
    if (!importParsedData) return;
    const d = importParsedData;

    let html = `
        <div class="rin-file-info">
            <span class="rin-file-icon">📄</span>
            <div style="flex:1">
                <div class="rin-file-name">${escHtml(d.fileName)}</div>
                <div class="rin-file-meta">${d.rawCount} rreshta · ${d.fileSize}</div>
            </div>
        </div>

        <div style="margin-bottom:16px">
            <div style="font-size:12px;font-weight:600;color:#64748b;margin-bottom:8px;">Rezultati i analizës</div>
            <div class="rin-validation-item"><span class="rin-v-ok">✓</span> ${d.records.length} kontrata unike (nga ${d.rawCount} rreshta)</div>
            ${d.groupedCount > 0 ? `<div class="rin-validation-item"><span class="rin-v-ok">✓</span> ${d.groupedCount} rreshta u grupuan (nr kontratë e njëjtë)</div>` : ''}
            <div class="rin-validation-item"><span class="rin-v-ok">✓</span> ${d.withDeme} kontrata me të dhëna dëmesh</div>
            ${d.withoutDeme > 0 ? `<div class="rin-validation-item"><span class="rin-v-warn">⚠</span> ${d.withoutDeme} kontrata pa të dhëna dëmesh</div>` : ''}
            <div class="rin-validation-item"><span class="rin-v-ok">✓</span> ${d.agents.length} agjentë · ${d.branches.length} degë</div>
        </div>
    `;

    if (d.updateCount > 0 || d.newCount > 0) {
        html += `<div class="rin-match-info">
            ${d.updateCount > 0 ? `<strong>${d.updateCount} kontrata ekzistuese</strong> do të përditësohen.<br>` : ''}
            <strong>${d.newCount} kontrata të reja</strong> do të shtohen.
        </div>`;
    }

    // Preview table
    const preview = d.records.slice(0, 4);
    html += `
        <div class="rin-preview-label">Shembull (${Math.min(4, d.records.length)} rreshtat e parë)</div>
        <div class="rin-preview-wrap">
            <table class="rin-preview-table">
                <thead><tr>
                    <th style="width:30%">Kontraktuesi</th>
                    <th style="width:22%">Nr kontratës</th>
                    <th style="text-align:right;width:18%">Primi</th>
                    <th style="text-align:right;width:15%">Dëme</th>
                    <th style="text-align:right;width:15%">CR%</th>
                </tr></thead>
                <tbody>
    `;
    preview.forEach(r => {
        const cr = r.cr_percent;
        html += `<tr>
            <td>${escHtml(r.kontraktuesi || '—')}</td>
            <td>${escHtml(r.nr_kontrates || '—')}</td>
            <td style="text-align:right">${formatMoney(r.primi_vjetor || 0)}</td>
            <td style="text-align:right;${r.deme_total_vlera > 0 ? 'color:#ef4444' : 'color:#cbd5e1'}">${r.deme_total_vlera > 0 ? formatMoney(r.deme_total_vlera) : '—'}</td>
            <td style="text-align:right">${cr !== null && !isNaN(cr) ? cr.toFixed(1)+'%' : '—'}</td>
        </tr>`;
    });
    html += '</tbody></table></div>';

    document.getElementById('importStep2').innerHTML = html;
}


// ==============================================================
// IMPORT — Step 3 (Confirm)
// ==============================================================
function renderImportStep3() {
    if (!importParsedData) return;
    const d = importParsedData;

    document.getElementById('importStep3').innerHTML = `
        <div style="text-align:center;padding:20px 0">
            <div style="font-size:32px;margin-bottom:12px">✅</div>
            <div style="font-size:16px;font-weight:600;color:#1e293b;margin-bottom:4px">Gati për import</div>
            <div style="font-size:13px;color:#64748b;margin-bottom:20px">
                ${d.records.length} kontrata do të importohen.<br>
                ${d.updateCount > 0 ? `${d.updateCount} ekzistuese do të përditësohen. ` : ''}
                ${d.newCount} të reja do të shtohen.
            </div>
            <div style="font-size:12px;color:#94a3b8">Kliko "Importo" për të vazhduar.</div>
        </div>
    `;

    document.getElementById('importNextBtn').textContent = `Importo ${d.records.length} kontrata`;
}


// ==============================================================
// IMPORT — Execute
// ==============================================================
function ekzekutoImport() {
    if (!importParsedData) return;
    const d = importParsedData;
    const user = merrPerdoruesinAktual();
    const now = new Date().toISOString();
    const importId = 'imp_' + Date.now().toString(36);

    d.records.forEach(rec => {
        if (rec._action === 'update' && rec._existingId) {
            // Update existing
            const existing = rinovimet.find(r => r.id === rec._existingId);
            if (existing) {
                // Update financial data, keep status and comments
                existing.primi = rec.primi;
                existing.tvsh = rec.tvsh;
                existing.total_primi = rec.total_primi;
                existing.primi_vjetor = rec.primi_vjetor;
                existing.deme_nr_paguar = rec.deme_nr_paguar;
                existing.deme_vlera_paguar = rec.deme_vlera_paguar;
                existing.deme_nr_pezull = rec.deme_nr_pezull;
                existing.deme_vlera_pezull = rec.deme_vlera_pezull;
                existing.deme_total_nr = rec.deme_total_nr;
                existing.deme_total_vlera = rec.deme_total_vlera;
                existing.shpenzimet = rec.shpenzimet;
                existing.kosto_totale = rec.kosto_totale;
                existing.cr_percent = rec.cr_percent;
                existing.data_fillimit = rec.data_fillimit;
                existing.data_mbarimit = rec.data_mbarimit;
                existing.agjenti = rec.agjenti || existing.agjenti;
                existing.dega = rec.dega || existing.dega;
                existing.updated_at = now;

                // Add system comment
                existing.komente = existing.komente || [];
                existing.komente.unshift({
                    teksti: 'Të dhënat u përditësuan nga importi.',
                    autori: user.emri,
                    data: now,
                    tipi: 'sistem'
                });
            }
        } else {
            // New record
            rinovimet.push({
                id: 'rin_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4),
                nr_kontrates: rec.nr_kontrates || '',
                kontraktues_id: rec.kontraktues_id || '',
                kontraktuesi: rec.kontraktuesi || '',
                dega: rec.dega || '',
                agjenti: rec.agjenti || '',
                lloji: rec.lloji || '',
                nr_profatures: rec.nr_profatures || '',
                data_fatures: rec.data_fatures || '',
                data_fillimit: rec.data_fillimit || '',
                data_mbarimit: rec.data_mbarimit || '',
                primi: rec.primi || 0,
                tvsh: rec.tvsh || 0,
                total_primi: rec.total_primi || 0,
                primi_vjetor: rec.primi_vjetor || 0,
                valuta: rec.valuta || 'EUR',
                deme_nr_paguar: rec.deme_nr_paguar || 0,
                deme_vlera_paguar: rec.deme_vlera_paguar || 0,
                deme_nr_pezull: rec.deme_nr_pezull || 0,
                deme_vlera_pezull: rec.deme_vlera_pezull || 0,
                deme_total_nr: rec.deme_total_nr || 0,
                deme_total_vlera: rec.deme_total_vlera || 0,
                shpenzimet: rec.shpenzimet || 0,
                kosto_totale: rec.kosto_totale || 0,
                cr_percent: rec.cr_percent,
                statusi: 'pa_filluar',
                komente: [],
                importi_id: importId,
                importuar_me: now,
                importuar_nga: user.emri,
                created_at: now,
                updated_at: now
            });
        }
    });

    // Save
    ruajTedhena();

    // Save import metadata
    ruajImportMeta({
        id: importId,
        data: formatDateShort(now),
        fileName: d.fileName,
        periudha: d.periudha,
        total: d.records.length,
        new: d.newCount,
        updated: d.updateCount,
        importuarNga: user.emri
    });

    // Refresh UI
    currentFilter = 'total';
    filteredList = [...rinovimet];
    renderTabela();
    perditesoStats();
    perditesoSubtitle();
    populoFiltrat();

    // Close modal
    mbyllImportModal();
}


// ==============================================================
// HELPERS
// ==============================================================
function merrPerdoruesinAktual() {
    // Consistent with auth.js pattern
    try {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        return {
            username: user.username || 'unknown',
            emri: user.emriPlote || user.username || 'System'
        };
    } catch(e) {
        return { username: 'unknown', emri: 'System' };
    }
}

function parseDateStr(str) {
    if (!str) return new Date(0);
    if (str instanceof Date) return str;
    str = String(str);
    // dd.mm.yyyy
    const parts = str.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (parts) return new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
    // ISO
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date(0) : d;
}

function formatDateShort(str) {
    if (!str) return '—';
    const d = parseDateStr(str);
    if (!d || isNaN(d.getTime()) || d.getTime() === 0) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}`;
}

function formatKomentDate(str) {
    if (!str) return '';
    const d = parseDateStr(str);
    if (!d || isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
}

function formatMoney(val) {
    if (val === null || val === undefined || isNaN(val)) return '—';
    val = Math.round(val);
    return val.toLocaleString('de-DE') + '€';
}

function isUrgent(dateStr) {
    const d = parseDateStr(dateStr);
    if (!d || d.getTime() === 0) return false;
    const now = new Date();
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff >= 0;
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function infoCell(label, value) {
    return `<div>
        <div class="rin-info-label">${label}</div>
        <div class="rin-info-value">${escHtml(value || '—')}</div>
    </div>`;
}

function breakdownItem(label, count, value) {
    let display = '—';
    if (count !== null && count !== undefined && value !== null && value !== undefined) {
        display = `${count} / ${formatMoney(value)}`;
    } else if (value !== null && value !== undefined && !isNaN(value) && value > 0) {
        display = formatMoney(value);
    }
    return `<div class="rin-breakdown-item"><span>${label}</span><span>${display}</span></div>`;
}