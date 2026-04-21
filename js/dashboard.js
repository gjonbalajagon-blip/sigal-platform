document.addEventListener('DOMContentLoaded', function () {
    const kontratat = JSON.parse(localStorage.getItem('kontratat')) || [];
    const ofertat = JSON.parse(localStorage.getItem('ofertat')) || [];
    const faturimi = JSON.parse(localStorage.getItem('faturimi_klientet')) || [];
    const tani = new Date();
    const muaji = tani.getMonth() + 1;

    // --- KPI ---
    const aktive = kontratat.filter(k => !k.arkivuar && k.mbarimi && new Date(k.mbarimi) >= tani);
    const individ = aktive.filter(k => k.lloji === 'individ').length;
    const familje = aktive.filter(k => k.lloji === 'familje').length;
    const biznes  = aktive.filter(k => k.lloji === 'biznes').length;

    document.getElementById('kpi-aktive').textContent = aktive.length;
    document.getElementById('kpi-aktive-sub').textContent = `${individ} individ / ${familje} familje / ${biznes} biznes`;

    const skadon = kontratat.filter(k => {
        if (!k.mbarimi || k.arkivuar) return false;
        const d = Math.ceil((new Date(k.mbarimi) - tani) / 86400000);
        return d >= 0 && d <= 35;
    }).length;
    document.getElementById('kpi-skadon').textContent = skadon;

    const ofertatAktive = ofertat.filter(o => !o.dataSkadon || new Date(o.dataSkadon) >= tani).length;
    const realizuara = ofertat.filter(o => o.realizuar).length;
    document.getElementById('kpi-ofertat').textContent = ofertatAktive;
    document.getElementById('kpi-ofertat-sub').textContent = `${realizuara} të realizuara`;

    const leshuar = faturimi.filter(k => (k.statuset?.[muaji] || '') === 'leshuar').length;
    const process  = faturimi.filter(k => (k.statuset?.[muaji] || '') === 'process').length;
    document.getElementById('kpi-leshuar').textContent = leshuar;
    document.getElementById('kpi-leshuar-sub').textContent = `${process} në proces — muaji aktual`;

    // --- Chart 1: Bar — Kontratat sipas llojit ---
    new Chart(document.getElementById('chart-lloji'), {
        type: 'bar',
        data: {
            labels: ['Individ', 'Familje', 'Biznes'],
            datasets: [{
                label: 'Kontratat',
                data: [individ, familje, biznes],
                backgroundColor: ['#1e40af', '#166534', '#b45309'],
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f0f4fa' } },
                x: { grid: { display: false } }
            }
        }
    });

    // --- Chart 2: Donut — Statusi faturimi ---
    const asgje   = faturimi.filter(k => (k.statuset?.[muaji] || 'asgje') === 'asgje').length;
    const kerkesa = faturimi.filter(k => (k.statuset?.[muaji] || '') === 'kerkesa').length;
    new Chart(document.getElementById('chart-faturimi'), {
        type: 'doughnut',
        data: {
            labels: ['Asgjë', 'Kërkesë', 'Në Proces', 'E Lëshuar'],
            datasets: [{
                data: [asgje, kerkesa, process, leshuar],
                backgroundColor: ['#e2e8f0', '#f59e0b', '#1e40af', '#22c55e'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { font: { size: 11 }, boxWidth: 12 }
                }
            },
            cutout: '65%'
        }
    });

    // --- Lista: Skadojnë së shpejti ---
    const listaSkadon = kontratat
        .filter(k => {
            if (!k.mbarimi || k.arkivuar) return false;
            const d = Math.ceil((new Date(k.mbarimi) - tani) / 86400000);
            return d >= 0 && d <= 35;
        })
        .sort((a, b) => new Date(a.mbarimi) - new Date(b.mbarimi))
        .slice(0, 5);

    const listaEl = document.getElementById('lista-skadon');
    if (listaSkadon.length === 0) {
        listaEl.innerHTML = '<p style="color:#94a3b8;font-size:13px;">Asnjë kontratë nuk skadon brenda 35 ditëve.</p>';
    } else {
        listaEl.innerHTML = listaSkadon.map(k => {
            const dite = Math.ceil((new Date(k.mbarimi) - tani) / 86400000);
            const pct = Math.max(5, Math.round((dite / 35) * 100));
            const ngjyra = dite <= 7 ? '#b91c1c' : dite <= 14 ? '#b45309' : '#ca8a04';
            return `<div class="skadon-row">
                <div class="skadon-name">${k.emri}</div>
                <span class="skadon-lloji ${k.lloji}">${k.lloji}</span>
                <div class="skadon-bar-wrap">
                    <div class="skadon-bar" style="width:${pct}%;background:${ngjyra}"></div>
                </div>
                <div class="skadon-dite" style="color:${ngjyra}">⚠️ ${dite}d</div>
            </div>`;
        }).join('');
    }
});