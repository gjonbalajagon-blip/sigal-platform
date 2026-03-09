function llogaritStats() {
    const kontratat = JSON.parse(localStorage.getItem('kontratat')) || [];
    const ofertat = JSON.parse(localStorage.getItem('ofertat')) || [];
    const faturimi = JSON.parse(localStorage.getItem('faturimi_klientet')) || [];

    const tani = new Date();

    // Kontratat
    const aktive = kontratat.filter(k => !k.arkivuar && k.mbarimi && new Date(k.mbarimi) >= tani).length;
    const skadojne = kontratat.filter(k => {
        if (!k.mbarimi || k.arkivuar) return false;
        const dite = Math.ceil((new Date(k.mbarimi) - tani) / 86400000);
        return dite >= 0 && dite <= 35;
    }).length;
    const skaduar = kontratat.filter(k => !k.arkivuar && k.mbarimi && new Date(k.mbarimi) < tani).length;

    // Ofertat
    const ofertatAktive = ofertat.filter(o => !o.dataSkadon || new Date(o.dataSkadon) >= tani).length;
    const ofertatRealizuara = ofertat.filter(o => o.realizuar).length;

    // Faturimi — muaji aktual
    const muaji = tani.getMonth() + 1;
    const faturimiLeshuar = faturimi.filter(k => (k.statuset?.[muaji] || '') === 'leshuar').length;
    const faturimiProcess = faturimi.filter(k => (k.statuset?.[muaji] || '') === 'process').length;

    // Lloji
    const individ = kontratat.filter(k => !k.arkivuar && k.lloji === 'individ').length;
    const familje = kontratat.filter(k => !k.arkivuar && k.lloji === 'familje').length;
    const biznes = kontratat.filter(k => !k.arkivuar && k.lloji === 'biznes').length;

    // Shfaq
    document.getElementById('stat-kontratat-aktive').textContent = aktive;
    document.getElementById('stat-skadojne').textContent = skadojne;
    document.getElementById('stat-skaduar').textContent = skaduar;
    document.getElementById('stat-ofertat-aktive').textContent = ofertatAktive;
    document.getElementById('stat-ofertat-realizuara').textContent = ofertatRealizuara;
    document.getElementById('stat-faturimi-leshuar').textContent = faturimiLeshuar;
    document.getElementById('stat-faturimi-process').textContent = faturimiProcess;
    document.getElementById('stat-individ').textContent = individ;
    document.getElementById('stat-familje').textContent = familje;
    document.getElementById('stat-biznes').textContent = biznes;
    document.getElementById('stat-total').textContent = kontratat.filter(k => !k.arkivuar).length;

    // Kontratat që skadojnë — lista
    const listaSkadon = kontratat
        .filter(k => {
            if (!k.mbarimi || k.arkivuar) return false;
            const dite = Math.ceil((new Date(k.mbarimi) - tani) / 86400000);
            return dite >= 0 && dite <= 35;
        })
        .sort((a, b) => new Date(a.mbarimi) - new Date(b.mbarimi))
        .slice(0, 5);

    const listaEl = document.getElementById('lista-skadon');
    if (listaSkadon.length === 0) {
        listaEl.innerHTML = '<p style="color:#94a3b8;font-size:13px;">Asnjë kontratë nuk skadon së shpejti.</p>';
    } else {
        listaEl.innerHTML = listaSkadon.map(k => {
            const dite = Math.ceil((new Date(k.mbarimi) - tani) / 86400000);
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--sigal-border);">
                <div>
                    <strong style="font-size:13px;">${k.emri}</strong>
                    <span style="font-size:11px;color:#6b7a8d;margin-left:8px;">${k.lloji}</span>
                </div>
                <span style="font-size:12px;font-weight:600;color:${dite <= 7 ? '#b91c1c' : '#b45309'}">⚠️ ${dite} ditë</span>
            </div>`;
        }).join('');
    }
}

document.addEventListener('DOMContentLoaded', llogaritStats);