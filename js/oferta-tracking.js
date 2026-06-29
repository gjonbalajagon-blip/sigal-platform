// ============================================
// oferta-tracking.js — ngarkohet pas oferta.js
// Shton: progress bar në Tab Detajet + tracking i detajuar në Tab Tracking
// Faza 2E-A: drawer me 2 tabs, fix bug — passon stable id (jo numeric index)
// ============================================

// --- Merr statusin nga backend (in-memory mirror) ---
async function merrStatusin(ofertaId) {
    try {
        const r = await fetch(TAPI + '/api/oferta-status/' + encodeURIComponent(ofertaId));
        if (!r.ok) return null;
        return await r.json();
    } catch (e) { return null; }
}

// --- Merr tracking persistent nga Supabase ---
async function merrTrackingPersistent(ofertaId) {
    try {
        const r = await fetch(TAPI + '/api/oferta-tracking/' + encodeURIComponent(ofertaId));
        if (!r.ok) return null;
        return await r.json();
    } catch (e) { return null; }
}

// --- Tab switching (Faza 2E-A) ---
function ofertaSetTab(name) {
    document.querySelectorAll('.drawer-tab').forEach(b => b.classList.toggle('drawer-tab-active', b.dataset.tab === name));
    document.querySelectorAll('.drawer-tab-content').forEach(c => c.style.display = c.dataset.content === name ? '' : 'none');
    if (window.lucide) lucide.createIcons();
}

// --- Render i tracking-ut të detajuar te Tab 2 ---
function renderTrackingDetajuar(data, persistent) {
    const body = document.getElementById('tracking-detailed-body');
    if (!body) return;
    const hapjet = (data && data.hapjet) || (persistent && persistent.here_pare) || 0;
    const min = (data && data.kohaTotale) ? Math.round(data.kohaTotale / 60) : 0;
    const hapjaPare = persistent?.data_pare_pare || null;
    const hapjaFundit = persistent?.data_pare_fundit || (data?.hapjaFundit) || null;

    if (hapjet === 0 && !persistent) {
        body.innerHTML = '<div class="tracking-empty">Klienti ende nuk e ka hapur këtë ofertë</div>';
        return;
    }

    let h = '<div class="tracking-stat-grid">';
    h += '<div class="tracking-stat"><div class="tracking-stat-label">Herë të hapur</div><div class="tracking-stat-value">' + hapjet + '</div>';
    if (hapjaFundit) h += '<div class="tracking-stat-sub">E fundit: ' + new Date(hapjaFundit).toLocaleString('sq-AL') + '</div>';
    h += '</div>';
    h += '<div class="tracking-stat"><div class="tracking-stat-label">Kohëzgjatja</div><div class="tracking-stat-value">' + (min > 0 ? '~' + min + ' min' : '—') + '</div>';
    h += '<div class="tracking-stat-sub">Total session time</div></div>';
    if (hapjaPare) {
        h += '<div class="tracking-stat"><div class="tracking-stat-label">Hera e parë</div><div class="tracking-stat-value" style="font-size:12px;">' + new Date(hapjaPare).toLocaleString('sq-AL') + '</div></div>';
    }
    if (data?.konfirmimi) {
        h += '<div class="tracking-stat"><div class="tracking-stat-label">Konfirmimi</div><div class="tracking-stat-value" style="font-size:12px;color:var(--s-success);">' + new Date(data.konfirmimi.data).toLocaleString('sq-AL') + '</div>';
        if (data.konfirmimi.pakot) h += '<div class="tracking-stat-sub">Paketa: ' + data.konfirmimi.pakot + '</div>';
        h += '</div>';
    }
    h += '</div>';
    if (data?.konfirmimi?.koment) {
        h += '<div style="background:var(--s-bg-1);border-left:3px solid var(--s-brand);padding:10px 12px;border-radius:6px;font-size:11.5px;color:var(--s-text-sub);font-style:italic;">"' + data.konfirmimi.koment + '"</div>';
    }
    body.innerHTML = h;
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
        h += '<div style="font-size:10px;color:var(--s-green);margin-top:4px;font-weight:600;display:inline-flex;align-items:center;gap:4px"><i data-lucide="check" style="width:11px;height:11px"></i> Konfirmuar: ' + new Date(data.konfirmimi.data).toLocaleString('sq-AL') + '</div>';
        h += '<div style="font-size:10px;color:#4a5568;margin-top:2px">Paketa: <strong>' + (data.konfirmimi.pakot || '—') + '</strong>';
        if (data.konfirmimi.koment) h += '<br>Koment: "' + data.konfirmimi.koment + '"';
        h += '</div>';
    }
    h += '</div>';
    return h;
}

// --- Override editoOferte: shto progress bar + tracking detajuar te Tab 2 ---
// Faza 2E-A fix: passon stable id (jo numeric index)
const _editoOferteOrig = editoOferte;
editoOferte = async function(index) {
    _editoOferteOrig(index);
    const ofertat = JSON.parse(localStorage.getItem('ofertat')) || [];
    const oferta = ofertat[index];
    if (!oferta) return;
    const ofertaId = oferta.id || String(index); // stable id ose fallback index legacy
    console.log('[TRACKING DEBUG] Marrë për oferta:', ofertaId);

    // Reset tab te Detajet sa herë hapet
    if (typeof ofertaSetTab === 'function') ofertaSetTab('detajet');

    // Lexo paralelisht: status (memory) + tracking persistent (Supabase)
    const [data, persistent] = await Promise.all([
        merrStatusin(ofertaId),
        merrTrackingPersistent(ofertaId)
    ]);
    console.log('[TRACKING DEBUG] Data marrë:', { status: data, persistent });

    // Sync status nga backend → localStorage
    if (data && !oferta.realizuar) {
        if (data.statusi === 'e_konfirmuar' && !oferta.konfirmuar) {
            oferta.konfirmuar = true;
            oferta.statusi = 'e_konfirmuar';
            oferta.pakaZgjedhur = data.konfirmimi?.pakot || '';
            oferta.komentKlient = data.konfirmimi?.koment || '';
            oferta.dataKonfirmimit = data.konfirmimi?.data?.split('T')[0] || '';
            localStorage.setItem('ofertat', JSON.stringify(ofertat));
            if (typeof renderTabela === 'function') renderTabela();
        }
    }

    // Tab 1: progress bar status (siç ishte)
    if (data) {
        let container = document.getElementById('tracking-bar');
        if (!container) {
            container = document.createElement('div');
            container.id = 'tracking-bar';
            const detajetTab = document.querySelector('.drawer-tab-content[data-content="detajet"]');
            const drawerBody = detajetTab || document.querySelector('.drawer-panel-body');
            if (drawerBody) drawerBody.insertBefore(container, drawerBody.firstChild);
        }
        container.innerHTML = statusProgressBar(data);
    }

    // Tab 2: tracking i detajuar
    renderTrackingDetajuar(data, persistent);
    if (window.lucide) lucide.createIcons();
};