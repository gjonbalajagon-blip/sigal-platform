// ============================================================
// DASHBOARD.JS — Chart.js v4.4.1 + period filter + 4 charts
// ============================================================
const MUAJT_AL = ['Janar','Shkurt','Mars','Prill','Maj','Qershor','Korrik','Gusht','Shtator','Tetor','Nëntor','Dhjetor'];
const MUAJT_AL_SHORT = ['Jan','Shk','Mar','Pri','Maj','Qer','Kor','Gus','Sht','Tet','Nën','Dhj'];

let __dashPeriod = 'muaj';
const __charts = {};

document.addEventListener('DOMContentLoaded', function () {
    initGreeting();
    renderAll();
});

function getUserName() {
    try {
        const u = JSON.parse(localStorage.getItem('user_aktual') || localStorage.getItem('currentUser') || '{}');
        return u.emri || u.emriPlote || u.username || 'Admin';
    } catch (e) { return 'Admin'; }
}

function initGreeting() {
    const name = getUserName();
    const tani = new Date();
    const muaji = MUAJT_AL[tani.getMonth()];
    const viti = tani.getFullYear();
    document.getElementById('dashGreeting').innerHTML = `Përshëndetje, ${escapeHtml(name)} 👋`;
    document.getElementById('dashSubtitle').textContent = `${muaji} ${viti}`;
    document.getElementById('periodMuajBtn').textContent = `${muaji} ${viti}`;
    document.getElementById('periodVitBtn').textContent = `Viti ${viti}`;
}

function ndryshoPeriod(p) {
    __dashPeriod = p;
    document.querySelectorAll('.dash-period-chip').forEach(b => b.classList.toggle('active', b.dataset.period === p));
    renderAll();
}

function renderAll() {
    const kontratat = JSON.parse(localStorage.getItem('kontratat') || '[]');
    const ofertat   = JSON.parse(localStorage.getItem('ofertat') || '[]');
    const faturimi  = JSON.parse(localStorage.getItem('faturimi_klientet') || '[]');
    const tani = new Date();
    const muajIdx = tani.getMonth() + 1;
    const viti = tani.getFullYear();

    // ===== KPI 1: Kontratat Aktive =====
    const aktive = kontratat.filter(k => !k.arkivuar && k.mbarimi && new Date(k.mbarimi) >= tani);
    const individ = aktive.filter(k => k.lloji === 'individ').length;
    const familje = aktive.filter(k => k.lloji === 'familje').length;
    const biznes  = aktive.filter(k => k.lloji === 'biznes').length;
    document.getElementById('kpi-aktive').textContent = aktive.length;
    document.getElementById('kpi-aktive-sub').textContent = `${individ} individ · ${familje} familje · ${biznes} biznes`;

    // ===== KPI 2: Skadojnë ≤ 35 ditë =====
    const listaSkadojne = kontratat.filter(k => {
        if (!k.mbarimi || k.arkivuar) return false;
        const d = Math.ceil((new Date(k.mbarimi) - tani) / 86400000);
        return d >= 0 && d <= 35;
    }).sort((a, b) => new Date(a.mbarimi) - new Date(b.mbarimi));
    document.getElementById('kpi-skadon').textContent = listaSkadojne.length;
    document.getElementById('badgeSkadon').textContent = listaSkadojne.length;

    // ===== KPI 3: Ofertat Aktive =====
    const ofertatAktive = ofertat.filter(o => !o.dataSkadon || new Date(o.dataSkadon) >= tani).length;
    const realizuaraVit = ofertat.filter(o => {
        if (!o.realizuar) return false;
        const dt = o.dataRealizimit ? new Date(o.dataRealizimit) : null;
        return !dt || dt.getFullYear() === viti;
    }).length;
    document.getElementById('kpi-ofertat').textContent = ofertatAktive;
    document.getElementById('kpi-ofertat-sub').textContent = `${realizuaraVit} të realizuara këtë vit`;

    // ===== KPI 4: Faturat e lëshuara =====
    const leshuar = faturimi.filter(k => (k.statuset?.[muajIdx] || '') === 'leshuar').length;
    const proces  = faturimi.filter(k => (k.statuset?.[muajIdx] || '') === 'process').length;
    const kerkesa = faturimi.filter(k => (k.statuset?.[muajIdx] || '') === 'kerkesa').length;
    const asgje   = faturimi.filter(k => (k.statuset?.[muajIdx] || 'asgje') === 'asgje').length;
    document.getElementById('kpi-leshuar').textContent = leshuar;
    document.getElementById('kpi-leshuar-sub').textContent = `${proces} në proces — muaji aktual`;

    // ===== Donut 1: Kontratat sipas llojit =====
    renderDonutLloji(individ, familje, biznes);

    // ===== Donut 2: Statusi faturimit =====
    renderDonutFaturimi(leshuar, proces, kerkesa, asgje);

    // ===== Line chart: Trendi 12 muaj =====
    renderLineTrendi(kontratat);

    // ===== Panel: Skadojnë =====
    renderPanelSkadon(listaSkadojne, tani);

    // ===== Panel: Veprimet e fundit =====
    renderPanelVeprime(kontratat, ofertat, faturimi);

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function destroyChart(key) {
    if (__charts[key]) { __charts[key].destroy(); delete __charts[key]; }
}

function renderDonutLloji(individ, familje, biznes) {
    const total = individ + familje + biznes;
    document.getElementById('donutLlojiSub').textContent = `Shpërndarja aktuale · ${total} kontrata`;
    const data = [individ, familje, biznes];
    const colors = ['#3b82f6', '#10b981', '#f59e0b'];
    const labels = ['Individ', 'Familje', 'Biznes'];

    destroyChart('lloji');
    __charts.lloji = new Chart(document.getElementById('chart-lloji'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });

    document.getElementById('legendLloji').innerHTML = labels.map((l, i) => {
        const v = data[i], pct = total > 0 ? (v / total * 100).toFixed(0) : 0;
        return `<div class="dash-donut-legend-item">
            <span class="dot" style="background:${colors[i]}"></span>
            <span class="name">${l}</span>
            <span class="num">${v}</span>
            <span class="pct">${pct}%</span>
        </div>`;
    }).join('');
}

function renderDonutFaturimi(leshuar, proces, kerkesa, asgje) {
    const total = leshuar + proces + kerkesa + asgje;
    document.getElementById('donutFatSub').textContent = `Muaji aktual · ${total} fatura`;
    const data = [leshuar, proces, kerkesa, asgje];
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#cbd5e1'];
    const labels = ['E Lëshuar', 'Në Proces', 'Kërkesë', 'Asgjë'];

    destroyChart('faturimi');
    __charts.faturimi = new Chart(document.getElementById('chart-faturimi'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });

    document.getElementById('legendFaturimi').innerHTML = labels.map((l, i) => {
        const v = data[i], pct = total > 0 ? (v / total * 100).toFixed(0) : 0;
        return `<div class="dash-donut-legend-item">
            <span class="dot" style="background:${colors[i]}"></span>
            <span class="name">${l}</span>
            <span class="num">${v}</span>
            <span class="pct">${pct}%</span>
        </div>`;
    }).join('');
}

function renderLineTrendi(kontratat) {
    const tani = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(tani.getFullYear(), tani.getMonth() - i, 1);
        months.push({ y: d.getFullYear(), m: d.getMonth(), label: MUAJT_AL_SHORT[d.getMonth()] });
    }
    const teReja    = months.map(() => 0);
    const rinovuara = months.map(() => 0);

    kontratat.forEach(k => {
        const dt = k.fillimi ? new Date(k.fillimi) : (k.dataKrijimit ? new Date(k.dataKrijimit) : null);
        if (!dt || isNaN(dt.getTime())) return;
        const idx = months.findIndex(mm => mm.y === dt.getFullYear() && mm.m === dt.getMonth());
        if (idx === -1) return;
        if (k.rinovuar || k.ngaRinovimi || k.nga_rinovimi) rinovuara[idx]++;
        else teReja[idx]++;
    });

    destroyChart('trend');
    __charts.trend = new Chart(document.getElementById('chart-trend'), {
        type: 'line',
        data: {
            labels: months.map(m => m.label),
            datasets: [
                {
                    label: 'Të reja',
                    data: teReja,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.08)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#3b82f6'
                },
                {
                    label: 'Rinovuar',
                    data: rinovuara,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.08)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#10b981'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(226,232,240,0.5)' },
                    ticks: { color: '#94a3b8', font: { size: 10 }, stepSize: 1 }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { size: 10 } }
                }
            }
        }
    });
}

function renderPanelSkadon(lista, tani) {
    const el = document.getElementById('lista-skadon');
    if (!lista.length) {
        el.innerHTML = '<div class="dash-panel-empty">Asnjë kontratë nuk skadon brenda 35 ditëve</div>';
        return;
    }
    el.innerHTML = lista.slice(0, 5).map(k => {
        const dite = Math.ceil((new Date(k.mbarimi) - tani) / 86400000);
        return `<div class="dash-panel-row">
            <span class="row-text">${escapeHtml(k.emri || '—')}</span>
            <span class="row-dite">${dite}d</span>
        </div>`;
    }).join('');
}

function renderPanelVeprime(kontratat, ofertat, faturimi) {
    const tani = Date.now();
    const veprime = [];
    kontratat.slice(-10).forEach(k => {
        const dt = k.dataKrijimit ? new Date(k.dataKrijimit).getTime() : null;
        if (dt) veprime.push({ tipi: 'kontrate', text: `Kontratë e re: ${k.emri || ''}`, ts: dt });
    });
    ofertat.slice(-10).forEach(o => {
        const dt = o.dataKrijimit ? new Date(o.dataKrijimit).getTime() : null;
        if (dt) veprime.push({ tipi: 'oferte', text: `Ofertë: ${o.emriKlientit || o.emri || ''}${o.realizuar ? ' (realizuar)' : ''}`, ts: dt });
    });
    veprime.sort((a, b) => b.ts - a.ts);
    const top = veprime.slice(0, 5);

    const el = document.getElementById('lista-veprime');
    if (!top.length) {
        el.innerHTML = '<div class="dash-panel-empty">Asnjë veprim së fundi</div>';
        return;
    }
    el.innerHTML = top.map(v => {
        const diff = tani - v.ts;
        const h = Math.floor(diff / 3600000);
        const d = Math.floor(diff / 86400000);
        const koha = d >= 1 ? `${d}d` : (h >= 1 ? `${h}h` : 'tani');
        return `<div class="dash-panel-row">
            <span class="row-text">${escapeHtml(v.text)}</span>
            <span class="row-time">${koha}</span>
        </div>`;
    }).join('');
}

function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
