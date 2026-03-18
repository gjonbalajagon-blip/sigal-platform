// ============================================
// oferta-tracking.js — ngarkohet pas oferta.js
// ============================================

const TAPI = 'https://sigal-platform-production.up.railway.app';
const STATUSET = {
    e_krijuar: { label: 'E krijuar', color: '#6b7a8d', bg: '#f4f6f9', step: 0 },
    e_derguar: { label: 'E dërguar', color: '#0047AB', bg: '#dbeafe', step: 1 },
    e_pare: { label: 'E parë', color: '#d97706', bg: '#fef3c7', step: 2 },
    e_konfirmuar: { label: 'Konfirmuar ✓', color: '#059669', bg: '#dcfce7', step: 3 },
    kontrate: { label: 'Kontratë', color: '#002B5C', bg: '#e8f0fe', step: 4 }
};

function statusBadge(statusi) {
    const s = STATUSET[statusi] || STATUSET.e_krijuar;
    const bold = statusi === 'e_konfirmuar' ? 'font-size:10px;' : 'font-size:9px;';
    return '<span style="' + bold + 'font-weight:700;padding:3px 8px;border-radius:10px;background:' + s.bg + ';color:' + s.color + ';white-space:nowrap">' + s.label + '</span>';
}

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
        if (i < steps.length - 1) h += '<div style="flex:0.5;height:2px;background:' + (i < cur ? '#002B5C' : '#e5e9f0') + ';margin-top:-12px"></div>';
    });
    h += '</div>';
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

async function shenoDerguar(index) {
    try {
        await fetch(TAPI + '/api/oferta-derguar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ofertaId: String(index) })
        });
    } catch (e) {}
    const ofertat = JSON.parse(localStorage.getItem('ofertat')) || [];
    if (ofertat[index]) {
        ofertat[index].statusi = 'e_derguar';
        ofertat[index].dataDergimit = new Date().toISOString().split('T')[0];
        localStorage.setItem('ofertat', JSON.stringify(ofertat));
    }
}

async function merrStatusin(ofertaId) {
    try {
        const r = await fetch(TAPI + '/api/oferta-status/' + ofertaId);
        if (!r.ok) return null;
        return await r.json();
    } catch (e) { return null; }
}

// --- Override dergoEmail ---
const _dergoEmailOrig = dergoEmail;
dergoEmail = function(index) {
    _dergoEmailOrig(index);
    shenoDerguar(index);
};

// --- Override kopjoLink ---
const _kopjoLinkOrig = kopjoLink;
kopjoLink = function(index) {
    _kopjoLinkOrig(index);
    shenoDerguar(index);
};

// --- Override renderTabela: largo kolonën Statusi, shto dot tek Skadon ---
const _renderTabelaOrig = renderTabela;
renderTabela = function() {
    _renderTabelaOrig();

    // 1. Largo kolonën "Statusi" nga header dhe rreshtat
    const table = document.querySelector('#ofertat-tbody')?.closest('table');
    if (table) {
        // Gjej indeksin e kolonës Statusi në header
        const headers = table.querySelectorAll('thead th');
        let statusColIdx = -1;
        headers.forEach((th, i) => {
            if (th.textContent.trim() === 'Statusi') { statusColIdx = i; }
        });
        if (statusColIdx >= 0) {
            // Largo header
            headers[statusColIdx].remove();
            // Largo çdo cell në atë index
            table.querySelectorAll('tbody tr').forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells[statusColIdx]) cells[statusColIdx].remove();
            });
        }
    }

    // 2. Shto dot me ngjyrë tek kolona Skadon
    document.querySelectorAll('#ofertat-tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach(td => {
            if (td.classList.contains('skadon-ok') || td.classList.contains('skadon-warning') || td.classList.contains('skadon-expired')) {
                const txt = td.textContent.trim();
                let dotColor = '#22c55e'; // gjelbër
                if (td.classList.contains('skadon-warning')) dotColor = '#f59e0b'; // portokall
                if (td.classList.contains('skadon-expired')) dotColor = '#ef4444'; // kuq
                td.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:50%;background:' + dotColor + ';flex-shrink:0"></span>' + txt + '</span>';
            }
        });
    });

    // 3. Shto tracking status badges async
    setTimeout(async () => {
        const rows = document.querySelectorAll('#ofertat-tbody tr');
        for (const row of rows) {
            const editBtn = row.querySelector('.btn-edit');
            if (!editBtn) continue;
            const match = (editBtn.getAttribute('onclick') || '').match(/editoOferte\((\d+)\)/);
            if (!match) continue;
            const idx = match[1];
            const ofertat = JSON.parse(localStorage.getItem('ofertat')) || [];
            const o = ofertat[idx];
            let statusi = o?.statusi || 'e_krijuar';
            if (o?.konfirmuar) statusi = 'e_konfirmuar';
            if (o?.realizuar) statusi = 'kontrate';
            const remote = await merrStatusin(idx);
            if (remote && remote.statusi && statusi !== 'kontrate') statusi = remote.statusi;
            // Shto badge pas emrit (kolona e parë)
            const firstCell = row.querySelector('td');
            if (firstCell && !firstCell.querySelector('.track-badge')) {
                firstCell.innerHTML += ' <span class="track-badge">' + statusBadge(statusi) + '</span>';
            }
        }
    }, 100);
};

// --- Override editoOferte: shto progress bar ---
const _editoOferteOrig = editoOferte;
editoOferte = async function(index) {
    _editoOferteOrig(index);
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

// --- Override krijoKontrate: përditëso statusin ---
const _krijoKontrateOrig = krijoKontrate;
krijoKontrate = function(index) {
    _krijoKontrateOrig(index);
    // Pas krijimit të kontratës, përditëso statusin
    const ofertat = JSON.parse(localStorage.getItem('ofertat')) || [];
    if (ofertat[index]) {
        ofertat[index].statusi = 'kontrate';
        localStorage.setItem('ofertat', JSON.stringify(ofertat));
    }
};