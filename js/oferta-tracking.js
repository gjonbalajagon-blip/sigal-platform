// ============================================
// oferta-tracking.js — Shtohet në oferta.html si <script src="../js/oferta-tracking.js"></script>
// DUHET pas <script src="../js/oferta.js"></script>
// ============================================

const TAPI = 'https://sigal-platform-production.up.railway.app';
const STATUSET = {
    e_krijuar: { label: 'E krijuar', color: '#6b7a8d', bg: '#f4f6f9', step: 0 },
    e_derguar: { label: 'E dërguar', color: '#0047AB', bg: '#dbeafe', step: 1 },
    e_pare: { label: 'E parë', color: '#d97706', bg: '#fef3c7', step: 2 },
    e_konfirmuar: { label: 'Konfirmuar', color: '#059669', bg: '#dcfce7', step: 3 },
    kontrate: { label: 'Kontratë', color: '#002B5C', bg: '#e8f0fe', step: 4 }
};

// --- Status Badge për listën e ofertave ---
function statusBadge(statusi) {
    const s = STATUSET[statusi] || STATUSET.e_krijuar;
    return '<span style="font-size:9px;font-weight:700;padding:3px 8px;border-radius:10px;background:' + s.bg + ';color:' + s.color + '">' + s.label + '</span>';
}

// --- Progress Bar për detajet e ofertës ---
function statusProgressBar(data) {
    const s = STATUSET[data.statusi] || STATUSET.e_krijuar;
    const cur = s.step;
    const steps = ['Krijuar', 'Dërguar', 'Parë', 'Konfirmuar', 'Kontratë'];
    let h = '<div style="padding:12px 16px;background:#f8fafc;border-radius:8px;margin:12px 0">';
    h += '<div style="font-size:11px;font-weight:700;color:#002B5C;margin-bottom:10px">Statusi i ofertës</div>';
    h += '<div style="display:flex;align-items:center;gap:0;margin-bottom:10px">';
    steps.forEach((label, i) => {
        const done = i <= cur;
        h += '<div style="flex:1;text-align:center">';
        h += '<div style="width:24px;height:24px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;background:' + (done ? '#002B5C;color:white' : '#e5e9f0;color:#6b7a8d') + '">' + (i + 1) + '</div>';
        h += '<div style="font-size:8px;margin-top:3px;color:' + (i === cur ? '#002B5C;font-weight:700' : '#6b7a8d') + '">' + label + '</div></div>';
        if (i < steps.length - 1) {
            h += '<div style="flex:0.5;height:2px;background:' + (i < cur ? '#002B5C' : '#e5e9f0') + ';margin-top:-12px"></div>';
        }
    });
    h += '</div>';
    // Info
    if (data.hapjet > 0) {
        const min = Math.round(data.kohaTotale / 60);
        h += '<div style="font-size:10px;color:#4a5568;line-height:1.6">';
        h += '<strong>E parë:</strong> ' + (data.hapjaFundit ? new Date(data.hapjaFundit).toLocaleString('sq-AL') : '—');
        h += ' · <strong>' + data.hapjet + '</strong> herë';
        if (min > 0) h += ' · <strong>~' + min + ' min</strong> gjithsej';
        h += '</div>';
    }
    if (data.konfirmimi) {
        h += '<div style="font-size:10px;color:#059669;margin-top:4px;font-weight:600">✓ Konfirmuar: ' + new Date(data.konfirmimi.data).toLocaleString('sq-AL') + '</div>';
        h += '<div style="font-size:10px;color:#4a5568;margin-top:2px">Paketa: <strong>' + (data.konfirmimi.pakot || '—') + '</strong>';
        if (data.konfirmimi.koment) h += '<br>Koment: "' + data.konfirmimi.koment + '"';
        h += '</div>';
    }
    h += '</div>';
    return h;
}

// --- Shëno si "e dërguar" kur dërgohet email ose kopjohet linku ---
async function shenoDerguar(index) {
    try {
        await fetch(TAPI + '/api/oferta-derguar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ofertaId: String(index) })
        });
    } catch (e) {}
    // Përditëso localStorage
    const ofertat = JSON.parse(localStorage.getItem('ofertat')) || [];
    if (ofertat[index]) {
        ofertat[index].statusi = 'e_derguar';
        ofertat[index].dataDergimit = new Date().toISOString().split('T')[0];
        localStorage.setItem('ofertat', JSON.stringify(ofertat));
    }
}

// --- Merr statusin nga Railway ---
async function merrStatusin(ofertaId) {
    try {
        const r = await fetch(TAPI + '/api/oferta-status/' + ofertaId);
        if (!r.ok) return null;
        return await r.json();
    } catch (e) { return null; }
}

// --- Override dergoEmail për tracking ---
const _dergoEmailOrig = dergoEmail;
dergoEmail = function(index) {
    _dergoEmailOrig(index);
    shenoDerguar(index);
};

// --- Override kopjoLink për tracking ---
const _kopjoLinkOrig = kopjoLink;
kopjoLink = function(index) {
    _kopjoLinkOrig(index);
    shenoDerguar(index);
};

// --- Ngarko status badges pas renderimit të tabelës ---
const _renderTabelaOrig = renderTabela;
renderTabela = function() {
    _renderTabelaOrig();
    // Pas renderimit, shto status badges async
    setTimeout(async () => {
        const rows = document.querySelectorAll('#ofertat-tbody tr');
        for (const row of rows) {
            const editBtn = row.querySelector('.btn-edit');
            if (!editBtn) continue;
            const onclickStr = editBtn.getAttribute('onclick') || '';
            const match = onclickStr.match(/editoOferte\((\d+)\)/);
            if (!match) continue;
            const idx = match[1];
            // Kontrollo localStorage first
            const ofertat = JSON.parse(localStorage.getItem('ofertat')) || [];
            const o = ofertat[idx];
            let statusi = o?.statusi || 'e_krijuar';
            if (o?.konfirmuar) statusi = 'e_konfirmuar';
            if (o?.realizuar) statusi = 'kontrate';
            // Try Railway
            const remote = await merrStatusin(idx);
            if (remote && remote.statusi) {
                // Railway ka precedencë, por nëse localStorage thotë kontratë, mbetet
                if (statusi !== 'kontrate') statusi = remote.statusi;
            }
            // Shto badge në kolonën e statusit
            const statusCell = row.querySelector('.badge-status');
            if (statusCell) {
                statusCell.parentElement.innerHTML = statusBadge(statusi);
            }
        }
    }, 100);
};

// --- Shto progress bar kur hapet drawer-i ---
const _editoOferteOrig = editoOferte;
editoOferte = async function(index) {
    _editoOferteOrig(index);
    // Shto progress bar në drawer
    const data = await merrStatusin(index);
    if (data) {
        let container = document.getElementById('tracking-bar');
        if (!container) {
            container = document.createElement('div');
            container.id = 'tracking-bar';
            const drawerBody = document.querySelector('.drawer-body');
            if (drawerBody) drawerBody.insertBefore(container, drawerBody.firstChild);
        }
        container.innerHTML = statusProgressBar(data);
    }
};