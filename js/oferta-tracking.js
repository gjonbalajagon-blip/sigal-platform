// ============================================
// oferta-tracking.js — ngarkohet pas oferta.js
// Shton: progress bar në drawer, async status nga Railway
// ============================================

// --- Merr statusin nga Railway ---
async function merrStatusin(ofertaId) {
    try {
        const r = await fetch(TAPI + '/api/oferta-status/' + ofertaId);
        if (!r.ok) return null;
        return await r.json();
    } catch (e) { return null; }
}

// --- Progress Bar për drawer ---
function statusProgressBar(data) {
    const steps = ['Krijuar', 'Dërguar', 'Parë', 'Konfirmuar', 'Kontratë'];
    const stepKeys = ['e_krijuar','e_derguar','e_pare','e_konfirmuar','kontrate'];
    const cur = stepKeys.indexOf(data.statusi);
    let h = '<div style="padding:12px 16px;background:#f8fafc;border-radius:8px;margin:12px 0">';
    h += '<div style="font-size:11px;font-weight:700;color:#1e3a8a;margin-bottom:10px">Statusi i ofertës</div>';
    h += '<div style="display:flex;align-items:center;gap:0;margin-bottom:10px">';
    steps.forEach((label, i) => {
        const done = i <= cur;
        h += '<div style="flex:1;text-align:center">';
        h += '<div style="width:24px;height:24px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;background:' + (done ? '#1e3a8a;color:white' : '#e5e9f0;color:#6b7a8d') + '">' + (i + 1) + '</div>';
        h += '<div style="font-size:8px;margin-top:3px;color:' + (i === cur ? '#1e3a8a;font-weight:700' : '#6b7a8d') + '">' + label + '</div></div>';
        if (i < steps.length - 1) h += '<div style="flex:0.5;height:2px;background:' + (i < cur ? '#1e3a8a' : '#e5e9f0') + ';margin-top:-12px"></div>';
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

// --- Override editoOferte: shto progress bar ---
const _editoOferteOrig = editoOferte;
editoOferte = async function(index) {
    _editoOferteOrig(index);
    const data = await merrStatusin(index);
    if (data) {
        // Sync Railway → localStorage
        const ofertat = JSON.parse(localStorage.getItem('ofertat')) || [];
        if (ofertat[index] && !ofertat[index].realizuar) {
            if (data.statusi === 'e_konfirmuar' && !ofertat[index].konfirmuar) {
                ofertat[index].konfirmuar = true;
                ofertat[index].statusi = 'e_konfirmuar';
                ofertat[index].pakaZgjedhur = data.konfirmimi?.pakot || '';
                ofertat[index].komentKlient = data.konfirmimi?.koment || '';
                ofertat[index].dataKonfirmimit = data.konfirmimi?.data?.split('T')[0] || '';
                localStorage.setItem('ofertat', JSON.stringify(ofertat));
                renderTabela(); // Refresh tabela me statusin e ri
            }
        }
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