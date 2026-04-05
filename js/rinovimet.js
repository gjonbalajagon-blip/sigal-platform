// ============================================================
// RINOVIMET.JS — v5
// ============================================================
const RIN_KEY='rinovimet_data', RIN_IMP_KEY='rinovimet_imports';
const MUAJT=['Janar','Shkurt','Mars','Prill','Maj','Qershor','Korrik','Gusht','Shtator','Tetor','Nëntor','Dhjetor'];
const STATUSET={
    pa_filluar:{emri:'Pa filluar',ngjyra:'#94a3b8',bar:'#94a3b8'},
    kontaktuar:{emri:'Kontaktuar',ngjyra:'#f59e0b',bar:'#fbbf24'},
    rinovuar:{emri:'Rinovuar',ngjyra:'#22c55e',bar:'#4ade80'},
    humbur:{emri:'Humbur',ngjyra:'#ef4444',bar:'#fca5a5'}
};
const ARSYET_HUMBJES=['Çmimi shumë i lartë','Klienti zgjodhi sigurim tjetër','Klienti nuk dëshiron më sigurim','Mbulesa jo e mjaftueshme','I pakënaqur me shërbimet','I pakënaqur me vlerësimin e dëmeve','Tjetër'];
const COLUMN_MAP={'nr.':'nr_rreshti','lloji i polices':'lloji','dega':'dega','agjenti':'agjenti','id':'kontraktues_id','kontraktuesi':'kontraktuesi','nr i kontrates':'nr_kontrates','nr i pro-fatures':'nr_profatures','data e fatures':'data_fatures','fillon':'data_fillimit','mbaron':'data_mbarimit','primi(v)':'primi','tvsh(v)':'tvsh','total(v)':'total_primi','valuta':'valuta'};
const DEME_COLS=['deme_nr_paguar','deme_vlera_paguar','deme_nr_pezull','deme_vlera_pezull'];

function merrSugjerime(r){
    const s=[],cr=r.cr_percent||0,p=r.primi_vjetor||0;
    if(cr>100)s.push({tipi:'danger',teksti:'CR mbi 100% — shpenzimet dhe dëmet tejkalojnë primin',ikona:'🔴'});
    else if(cr>80)s.push({tipi:'warning',teksti:'CR '+cr.toFixed(0)+'% — afër kufirit të profitabilitetit',ikona:'⚠️'});
    else if(cr<30&&cr>0&&p>5000)s.push({tipi:'success',teksti:'CR '+cr.toFixed(0)+'% — kontratë me profitabilitet të lartë',ikona:'✅'});
    if(p>50000)s.push({tipi:'info',teksti:'Primi '+formatMoney(p)+' — kontratë me peshë të lartë në portofol',ikona:'⭐'});
    return s;
}

// STATE
let rinovimet=[],filteredList=[],currentMuaj=null,currentSort='primi',currentStatusFilter='total',currentDega='',currentAgjent='',currentDrawerId=null,importParsedData=null,importStep=1;

// INIT
document.addEventListener('DOMContentLoaded',function(){
    ngarkoTedhena();renderTabs();aplikoFiltrat();populoChips();populoImportMuajt();
    const p=new URLSearchParams(window.location.search),hId=p.get('hap');
    if(hId){const rec=rinovimet.find(r=>r.id===hId);if(rec&&rec.muaji){currentMuaj=rec.muaji;renderTabs();aplikoFiltrat();}setTimeout(()=>hapDrawer(hId),200);}
});

// STORAGE
function ngarkoTedhena(){try{rinovimet=JSON.parse(localStorage.getItem(RIN_KEY)||'[]');}catch(e){rinovimet=[];}}
function ruajTedhena(){localStorage.setItem(RIN_KEY,JSON.stringify(rinovimet));}
function merrImports(){try{return JSON.parse(localStorage.getItem(RIN_IMP_KEY)||'[]');}catch(e){return[];}}
function ruajImportMeta(m){const a=merrImports();a.push(m);localStorage.setItem(RIN_IMP_KEY,JSON.stringify(a));}

// USER
function merrUser(){
    try{const u=JSON.parse(localStorage.getItem('user_aktual')||localStorage.getItem('currentUser')||'{}');
    return{username:u.username||'',emri:u.emri||u.emriPlote||u.username||'System',roli:u.role||u.roli||'staff',dega:u.dega||''};}
    catch(e){return{username:'',emri:'System',roli:'superadmin',dega:''};}
}
function filtroSipasRolit(list){
    const u=merrUser(),r=(u.roli||'').toLowerCase();
    if(r==='superadmin'||r==='management'||r==='dep_management')return list;
    const d=(u.dega||'').toLowerCase();if(!d)return list;
    return list.filter(x=>(x.dega||'').toLowerCase()===d);
}

// TABS
function getMuajt(){const s=new Set();rinovimet.forEach(r=>{if(r.muaji)s.add(r.muaji);});return[...s].sort((a,b)=>{const[ma,ya]=a.split('_'),[mb,yb]=b.split('_');return(parseInt(ya)-parseInt(yb))||(MUAJT.indexOf(capitalizeFirst(ma))-MUAJT.indexOf(capitalizeFirst(mb)));});}
function renderTabs(){
    const c=document.getElementById('rinTabs'),m=getMuajt();
    if(m.length===0){c.innerHTML='<span style="padding:7px 18px;font-size:12px;color:#94a3b8">Asnjë import ende</span>';currentMuaj=null;return;}
    if(!currentMuaj||!m.includes(currentMuaj))currentMuaj=m[m.length-1];
    c.innerHTML=m.map(k=>{const cnt=filtroSipasRolit(rinovimet.filter(r=>r.muaji===k)).length;return`<button class="tab-btn ${k===currentMuaj?'active':''}" onclick="ndryshoMuaj('${k}')">${formatMuajLabel(k)} <span class="tab-count">${cnt}</span></button>`;}).join('');
}
function ndryshoMuaj(m){currentMuaj=m;currentDega='';currentAgjent='';renderTabs();populoChips();aplikoFiltrat();}
function formatMuajLabel(k){if(!k)return'';const[m,y]=k.split('_');return capitalizeFirst(m)+' '+y;}
function capitalizeFirst(s){return s?s.charAt(0).toUpperCase()+s.slice(1):'';}

// STATS STRIP
function perditesoStats(){
    const data=filtroSipasRolit(rinovimet.filter(r=>r.muaji===currentMuaj));
    const counts={};Object.keys(STATUSET).forEach(s=>counts[s]=0);
    let tP=0,tD=0;data.forEach(r=>{if(counts[r.statusi]!==undefined)counts[r.statusi]++;tP+=(r.primi_vjetor||0);tD+=(r.deme_total_vlera||0);});
    const total=data.length,avgLR=tP>0?(tD/tP*100):0;
    const af=currentStatusFilter||'total';
    const ms=(k)=>`cursor:pointer;${af===k?'opacity:1;border-bottom:2px solid #fff;padding-bottom:14px':'opacity:0.7'}`;
    document.getElementById('stripMetrics').innerHTML=`
        <div class="strip-metric" style="${ms('total')}" onclick="filtroStatusStrip('total')"><div class="sm-num">${total}</div><div class="sm-lbl">Total</div></div>
        <div class="strip-metric s-pafilluar" style="${ms('pa_filluar')}" onclick="filtroStatusStrip('pa_filluar')"><div class="sm-num">${counts.pa_filluar}</div><div class="sm-lbl">Pa filluar</div></div>
        <div class="strip-metric s-kontaktuar" style="${ms('kontaktuar')}" onclick="filtroStatusStrip('kontaktuar')"><div class="sm-num">${counts.kontaktuar}</div><div class="sm-lbl">Kontaktuar</div></div>
        <div class="strip-metric s-rinovuar" style="${ms('rinovuar')}" onclick="filtroStatusStrip('rinovuar')"><div class="sm-num">${counts.rinovuar}</div><div class="sm-lbl">Rinovuar</div></div>
        <div class="strip-metric s-humbur" style="${ms('humbur')}" onclick="filtroStatusStrip('humbur')"><div class="sm-num">${counts.humbur}</div><div class="sm-lbl">Humbur</div></div>`;
    const rPct=total>0?(counts.rinovuar/total*100):0;
    document.getElementById('stripChips').innerHTML=`
        <div class="strip-chip">Primi <span class="sc-num">${formatMoneyShort(tP)}</span></div>
        <div class="strip-chip">Dëme <span class="sc-num">${formatMoneyShort(tD)}</span></div>
        <div class="strip-chip">LR <span class="sc-num">${avgLR.toFixed(1)}%</span></div>
        <div class="strip-chip" style="gap:8px;min-width:140px">Rinovuar <span class="sc-num">${counts.rinovuar}/${total}</span>
            <span style="flex:1;height:4px;background:rgba(255,255,255,.15);border-radius:2px;overflow:hidden;min-width:30px;display:inline-block"><span style="display:block;height:100%;width:${rPct}%;background:#4ade80;border-radius:2px"></span></span>
            <span style="font-size:10px;font-weight:700;color:#4ade80">${rPct.toFixed(0)}%</span></div>`;
    const bar=document.getElementById('stripBar'),leg=document.getElementById('stripLegend');
    if(total>0){let bH='',lH='';Object.keys(STATUSET).forEach(s=>{const p=(counts[s]/total*100).toFixed(1);bH+=`<div class="strip-bar-seg" style="width:${p}%;background:${STATUSET[s].bar}"></div>`;lH+=`<span><span class="sl-dot" style="background:${STATUSET[s].bar}"></span>${STATUSET[s].emri} ${counts[s]}</span>`;});bar.innerHTML=bH;leg.innerHTML=lH;}
    else{bar.innerHTML='<div class="strip-bar-seg" style="width:100%;background:rgba(255,255,255,.1)"></div>';leg.innerHTML='';}
}

// CHIPS — HIERARKIKE (1 rresht degë, klik zgjeron agjentët)
function populoChips(){
    const data=filtroSipasRolit(rinovimet.filter(r=>r.muaji===currentMuaj));
    const degaStats={};data.forEach(r=>{
        const d=r.dega||'Pa degë';
        if(!degaStats[d])degaStats[d]={total:0,rinovuar:0,agjentet:{}};
        degaStats[d].total++;if(r.statusi==='rinovuar')degaStats[d].rinovuar++;
        const a=r.agjenti||'Pa agjent';
        if(!degaStats[d].agjentet[a])degaStats[d].agjentet[a]={total:0,rinovuar:0};
        degaStats[d].agjentet[a].total++;if(r.statusi==='rinovuar')degaStats[d].agjentet[a].rinovuar++;
    });
    const totalRin=data.filter(r=>r.statusi==='rinovuar').length;
    const deget=Object.keys(degaStats).sort();
    // Dega row
    let h=`<button class="chip-filter ${currentDega===''?'active':''}" onclick="filtroDega('')">Të gjitha <span class="chip-count">${data.length}/${totalRin}✓</span></button>`;
    deget.forEach(d=>{const s=degaStats[d];h+=`<button class="chip-filter ${currentDega===d?'active':''}" onclick="filtroDega('${esc(d)}')">${esc(d)} <span class="chip-count">${s.total}/${s.rinovuar}✓</span></button>`;});
    document.getElementById('chipsDega').innerHTML=h;
    // Agjent sub-row (only if dega selected)
    const agjEl=document.getElementById('chipsAgjent');
    if(currentDega&&degaStats[currentDega]){
        const agj=degaStats[currentDega].agjentet;const aKeys=Object.keys(agj).sort();
        const degaStat=degaStats[currentDega];
        let aH=`<button class="chip-filter ${currentAgjent===''?'active':''}" onclick="filtroAgjent('')" style="margin-left:16px">Të gjithë <span class="chip-count">${degaStat.total}/${degaStat.rinovuar}✓</span></button>`;
        aKeys.forEach(a=>{const s=agj[a];aH+=`<button class="chip-filter ${currentAgjent===a?'active':''}" onclick="filtroAgjent('${esc(a)}')">${esc(a)} <span class="chip-count">${s.total}/${s.rinovuar}✓</span></button>`;});
        agjEl.innerHTML=aH;agjEl.style.display='';
    }else{agjEl.innerHTML='';agjEl.style.display='none';}
}
function filtroDega(d){currentDega=d;currentAgjent='';populoChips();aplikoFiltrat();}
function filtroAgjent(a){currentAgjent=a;aplikoFiltrat();populoChips();}
function filtroStatusStrip(s){currentStatusFilter=(currentStatusFilter===s)?'total':s;aplikoFiltrat();}

// FILTERS
function aplikoFiltrat(){
    let data=rinovimet.filter(r=>r.muaji===currentMuaj);data=filtroSipasRolit(data);
    const search=document.getElementById('rinSearch').value.toLowerCase().trim();
    if(currentStatusFilter&&currentStatusFilter!=='total')data=data.filter(r=>r.statusi===currentStatusFilter);
    if(currentDega)data=data.filter(r=>r.dega===currentDega);
    if(currentAgjent)data=data.filter(r=>r.agjenti===currentAgjent);
    if(search)data=data.filter(r=>(r.kontraktuesi||'').toLowerCase().includes(search)||(r.nr_kontrates||'').toLowerCase().includes(search));
    filteredList=data;renderTabela();perditesoStats();
}

// SORT
function ndryshoSort(t){currentSort=t;document.querySelectorAll('.sort-btn').forEach(b=>b.classList.remove('active'));document.getElementById('sort-'+t)?.classList.add('active');renderTabela();}
function sortoListen(l){return[...l].sort((a,b)=>{if(currentSort==='primi')return(b.primi_vjetor||0)-(a.primi_vjetor||0);if(currentSort==='lr')return(b.lr_percent||0)-(a.lr_percent||0);if(currentSort==='skadon')return parseDateStr(a.data_mbarimit)-parseDateStr(b.data_mbarimit);return 0;});}

// TABLE
function renderTabela(){
    const tbody=document.getElementById('rinTableBody');
    if(!currentMuaj||rinovimet.length===0){tbody.innerHTML='<tr><td colspan="8"><div class="rin-empty"><div class="rin-empty-icon">📋</div><div class="rin-empty-title">Asnjë rinovim ende</div><div class="rin-empty-sub">Kliko "Importo" për të filluar</div></div></td></tr>';return;}
    if(filteredList.length===0){tbody.innerHTML='<tr><td colspan="8"><div class="rin-no-results">Asnjë rezultat me këto filtra</div></td></tr>';return;}
    const sorted=sortoListen(filteredList);let html='';
    sorted.forEach(r=>{
        const p=r.primi_vjetor||0,d=r.deme_total_vlera||0,lr=r.lr_percent,cr=r.cr_percent;
        const lrC=lr>80?'rin-lr-bad':lr>50?'rin-lr-warn':lr>0?'rin-lr-good':'rin-deme-none';
        const crC=cr>90?'rin-lr-bad':cr>50?'rin-lr-warn':cr>0?'rin-lr-good':'rin-deme-none';
        const rowBg=cr>90?'background:rgba(254,202,202,.18);':'';
        html+=`<tr onclick="hapDrawer('${r.id}')" style="cursor:pointer;${rowBg}">
            <td><div class="klient-name">${esc(r.kontraktuesi)}${cr>90?' <span style="font-size:9px;color:#ef4444;font-weight:700">⚠</span>':''}</div><div class="klient-sub">${esc(r.dega)} · ${esc(r.agjenti)}</div></td>
            <td style="font-size:11px;color:#64748b">${esc(r.nr_kontrates)}</td>
            <td class="rin-primi" style="text-align:right">${formatMoney(p)}</td>
            <td style="text-align:right" class="${d>0?'rin-deme-val':'rin-deme-none'}">${d>0?formatMoney(d):'—'}</td>
            <td style="text-align:right" class="${lrC}">${lr>0?lr.toFixed(1)+'%':'—'}</td>
            <td style="text-align:right" class="${crC}">${cr>0?cr.toFixed(1)+'%':'—'}</td>
            <td><span class="rin-badge rin-badge-${r.statusi}">${STATUSET[r.statusi]?.emri||r.statusi}</span></td>
            <td style="text-align:center;font-size:11px">${formatDateShort(r.data_mbarimit)}</td></tr>`;
    });tbody.innerHTML=html;
}

// ===== DRAWER (COMPACT) =====
function hapDrawer(id){
    const r=rinovimet.find(x=>x.id===id);if(!r)return;currentDrawerId=id;
    document.getElementById('drKontraktuesi').textContent=r.kontraktuesi;
    document.getElementById('drSubtitle').textContent=`${r.nr_kontrates} · ${r.dega} · ${r.agjenti}`;
    // Excel note
    const noteEl=document.getElementById('drExcelNote');
    const exK=(r.komente||[]).find(k=>k.tipi==='import');
    noteEl.innerHTML=exK?`<div style="padding:8px 20px;background:#fffbeb;border-bottom:1px solid #fde68a;font-size:11px;color:#92400e;display:flex;align-items:center;gap:5px"><span>📝</span><strong>Shënim:</strong> ${esc(exK.teksti)}</div>`:'';
    renderStatusPills(r.statusi);renderHumbjeSection(r);
    // Compact info — 1 row
    document.getElementById('drInfo').innerHTML=`<div class="rin-compact-grid"><div><div class="rin-cg-label">Fillon</div><div class="rin-cg-value">${r.data_fillimit||'—'}</div></div><div><div class="rin-cg-label">Mbaron</div><div class="rin-cg-value">${r.data_mbarimit||'—'}</div></div><div><div class="rin-cg-label">ID klienti</div><div class="rin-cg-value">${r.kontraktues_id||'—'}</div></div></div>`;
    // Compact finance
    const p=r.primi_vjetor||0,d=r.deme_total_vlera||0,lr=r.lr_percent||0,cr=r.cr_percent||0;
    const lrCol=lr>80?'#ef4444':lr>50?'#f59e0b':'#22c55e';
    const crCol=cr>90?'#ef4444':cr>50?'#f59e0b':'#22c55e';
    document.getElementById('drFinance').innerHTML=`
        <div class="rin-compact-grid" style="margin-bottom:6px">
            <div><div class="rin-cg-label">Primi</div><div class="rin-cg-value" style="font-size:15px">${formatMoney(p)}</div></div>
            <div><div class="rin-cg-label">Dëme totale</div><div class="rin-cg-value" style="color:${d>0?'#ef4444':'#94a3b8'}">${d>0?formatMoney(d):'—'}</div></div>
            <div><div class="rin-cg-label">Kosto totale</div><div class="rin-cg-value">${formatMoney(r.kosto_totale||0)}</div></div>
        </div>
        <div style="display:flex;gap:12px;font-size:11px;color:#64748b;margin-bottom:6px">
            <span>Dëme paguar: ${r.deme_nr_paguar||0} / ${formatMoney(r.deme_vlera_paguar||0)}</span>
            <span>Pezull: ${r.deme_nr_pezull||0} / ${formatMoney(r.deme_vlera_pezull||0)}</span>
            <span>Shpenzime: ${formatMoney(r.shpenzimet||0)}</span>
        </div>
        <div class="rin-ratio-inline">
            <div class="rin-ratio-item"><span style="color:#64748b">LR</span><div class="rin-ratio-bar"><div class="rin-ratio-fill" style="width:${Math.min(lr,100)}%;background:${lrCol}"></div></div><span style="font-weight:600;color:${lrCol}">${lr>0?lr.toFixed(1)+'%':'—'}</span></div>
            <div class="rin-ratio-item"><span style="color:#64748b">CR</span><div class="rin-ratio-bar"><div class="rin-ratio-fill" style="width:${Math.min(cr,100)}%;background:${crCol}"></div></div><span style="font-weight:600;color:${crCol}">${cr>0?cr.toFixed(1)+'%':'—'}</span></div>
        </div>`;
    // Sugjerime
    const sug=merrSugjerime(r),sugEl=document.getElementById('drSugjerime');
    if(sug.length>0){const bgM={danger:'#fef2f2',warning:'#fffbeb',success:'#f0fdf4',info:'#eff6ff'},bM={danger:'#fecaca',warning:'#fed7aa',success:'#bbf7d0',info:'#bfdbfe'},cM={danger:'#991b1b',warning:'#92400e',success:'#166534',info:'#1e40af'};
        sugEl.innerHTML=sug.map(s=>`<div style="padding:6px 10px;background:${bgM[s.tipi]};border:1px solid ${bM[s.tipi]};border-radius:6px;font-size:11px;color:${cM[s.tipi]};margin-bottom:3px;display:flex;align-items:center;gap:5px"><span>${s.ikona}</span>${esc(s.teksti)}</div>`).join('');sugEl.style.display='';
    }else{sugEl.innerHTML='';sugEl.style.display='none';}
    // Propozimi
    renderPropozimPrimi(r);
    // Buton kontrate
    renderKontrateBtn(r);
    renderKomente(r);
    document.getElementById('rinOverlay').classList.add('open');document.getElementById('rinDrawer').classList.add('open');document.body.style.overflow='hidden';
}
function mbyllDrawer(){document.getElementById('rinOverlay').classList.remove('open');document.getElementById('rinDrawer').classList.remove('open');document.body.style.overflow='';currentDrawerId=null;}

// KONTRATE BUTTON
function renderKontrateBtn(r){
    const el=document.getElementById('drKontrateBtn');
    if(r.kontrata_derguar){
        el.innerHTML=`<div style="display:flex;align-items:center;gap:8px;padding:8px 0">
            <span style="color:#22c55e;font-size:14px">✓</span>
            <span style="font-size:12px;color:#166534;font-weight:500">Kontrata e dërguar ${r.kontrata_derguar_data?formatKomentDate(r.kontrata_derguar_data):''}</span>
        </div>`;
    } else if(r.statusi==='rinovuar'){
        el.innerHTML=`<button onclick="krijoKontrate()" style="width:100%;padding:10px;background:#002B5C;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px">
            📄 Krijo Kontratën në Sistem
        </button>`;
    } else {
        el.innerHTML=`<button onclick="hapKontrateWizard()" style="width:100%;padding:10px;background:#002B5C;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px">
            📄 Përgatit & Dërgo Kontratën
        </button>`;
    }
}

function hapKontrateWizard(){
    // TODO: Wizard modal me fushat + spreadsheet + Word gjenerim
    // Për momentin redirect te kontratat me të dhënat bazë
    if(!currentDrawerId)return;
    const r=rinovimet.find(x=>x.id===currentDrawerId);if(!r)return;
    // Ruaj të dhënat për kontratat
    localStorage.setItem('rinovim_per_kontrate',JSON.stringify({
        nga_rinovimi:true,
        rinovimi_id:r.id,
        emri:r.kontraktuesi,
        kontraktues_id:r.kontraktues_id,
        dega:r.dega,
        agjenti:r.agjenti,
        data_fillimit:r.data_fillimit,
        data_mbarimit:r.data_mbarimit
    }));
    // Ndrysho statusin në kontaktuar
    if(r.statusi==='pa_filluar'){
        r.statusi='kontaktuar';r.updated_at=new Date().toISOString();
        r.kontrata_derguar=true;r.kontrata_derguar_data=new Date().toISOString();
        const u=merrUser();r.komente=r.komente||[];
        r.komente.unshift({teksti:'Kontrata u përgatit dhe u dërgua klientit',autori:u.emri,data:new Date().toISOString(),tipi:'sistem'});
        ruajTedhena();if(typeof perditesoNjoftimet==='function')perditesoNjoftimet();
    }
    window.location.href='kontratat.html?nga_rinovimi='+r.id;
}

function krijoKontrate(){
    if(!currentDrawerId)return;
    const r=rinovimet.find(x=>x.id===currentDrawerId);if(!r)return;
    localStorage.setItem('rinovim_per_kontrate',JSON.stringify({
        nga_rinovimi:true,
        rinovimi_id:r.id,
        emri:r.kontraktuesi,
        kontraktues_id:r.kontraktues_id,
        dega:r.dega,
        agjenti:r.agjenti,
        data_fillimit:r.data_fillimit,
        data_mbarimit:r.data_mbarimit
    }));
    window.location.href='kontratat.html?nga_rinovimi='+r.id;
}

// PROPOZIMI (simple — just % suggestion)
function renderPropozimPrimi(r){
    const el=document.getElementById('drPropozimi');
    const p=r.primi_vjetor||0,cr=r.cr_percent||0,k=r.kosto_totale||0;
    if(p<=0||cr<=0){el.innerHTML='';el.style.display='none';return;}
    el.style.display='';
    if(cr<=90){el.innerHTML='<div style="padding:8px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;font-size:12px;color:#166534;display:flex;align-items:center;gap:6px"><span>✅</span> Nuk nevojitet rritje — CR brenda normës</div>';}
    else{const prop=Math.ceil(k/0.9),rPct=((prop-p)/p*100),rCol=rPct>30?'#991b1b':rPct>15?'#92400e':'#1e40af',rBg=rPct>30?'#fef2f2':rPct>15?'#fffbeb':'#eff6ff',rBd=rPct>30?'#fecaca':rPct>15?'#fde68a':'#bfdbfe';
        el.innerHTML=`<div style="padding:10px 12px;background:${rBg};border:1px solid ${rBd};border-radius:6px;color:${rCol}"><div style="font-size:18px;font-weight:700">+${rPct.toFixed(1)}% rritje e propozuar</div><div style="font-size:11px;opacity:.8">Bazuar në CR ${cr.toFixed(0)}%</div></div>`;}
}

// STATUS
function renderStatusPills(c){
    let h='<label>Statusi:</label>';
    Object.keys(STATUSET).forEach(k=>{h+=`<span class="rin-status-pill rin-sp-${k} ${k===c?'selected':''}" onclick="ndryshStatus('${k}')">${STATUSET[k].emri}</span>`;});
    document.getElementById('drStatusRow').innerHTML=h;
}
function ndryshStatus(ns){
    if(!currentDrawerId)return;if(ns==='humbur'){hapHumbjeModal();return;}
    const r=rinovimet.find(x=>x.id===currentDrawerId);if(!r)return;const old=r.statusi;if(old===ns)return;
    r.statusi=ns;r.updated_at=new Date().toISOString();
    if(old==='humbur'){r.humbje_arsyeja=null;r.humbje_koment=null;}
    const u=merrUser();r.komente=r.komente||[];
    r.komente.unshift({teksti:`Statusi: ${STATUSET[old]?.emri} → ${STATUSET[ns]?.emri}`,autori:u.emri,data:new Date().toISOString(),tipi:'sistem'});
    ruajTedhena();renderStatusPills(ns);renderHumbjeSection(r);renderKomente(r);perditesoStats();renderTabs();populoChips();aplikoFiltrat();
    if(typeof perditesoNjoftimet==='function')perditesoNjoftimet();
}

// HUMBJE
function renderHumbjeSection(r){const el=document.getElementById('drHumbjeSection');if(r.statusi==='humbur'&&r.humbje_arsyeja){el.innerHTML=`<div class="rin-humbje-section"><div class="rin-humbje-title">Arsyeja e humbjes</div><div class="rin-humbje-arsye">${esc(r.humbje_arsyeja)}</div>${r.humbje_koment?`<div class="rin-humbje-koment">"${esc(r.humbje_koment)}"</div>`:''}</div>`;}else{el.innerHTML='';}}
function hapHumbjeModal(){let h='';ARSYET_HUMBJES.forEach((a,i)=>{h+=`<label class="rin-arsye-opt" onclick="this.querySelector('input').checked=true;document.querySelectorAll('.rin-arsye-opt').forEach(x=>x.classList.remove('selected'));this.classList.add('selected')"><input type="radio" name="arsyeHumbjes" value="${i}"> ${esc(a)}</label>`;});document.getElementById('arsyeList').innerHTML=h;document.getElementById('arsyeKoment').value='';document.getElementById('humbjeModal').classList.add('open');}
function mbyllHumbjeModal(){document.getElementById('humbjeModal').classList.remove('open');}
function konfirmoHumbje(){
    const sel=document.querySelector('input[name="arsyeHumbjes"]:checked');if(!sel){alert('Zgjedh një arsye.');return;}
    const aT=ARSYET_HUMBJES[parseInt(sel.value)],km=document.getElementById('arsyeKoment').value.trim();
    if(aT==='Tjetër'&&!km){alert('Shkruaj arsyen në koment.');return;}
    const r=rinovimet.find(x=>x.id===currentDrawerId);if(!r)return;
    r.statusi='humbur';r.humbje_arsyeja=aT;r.humbje_koment=km||null;r.updated_at=new Date().toISOString();
    const u=merrUser();r.komente=r.komente||[];r.komente.unshift({teksti:`Humbje: ${aT}${km?' — '+km:''}`,autori:u.emri,data:new Date().toISOString(),tipi:'sistem'});
    ruajTedhena();mbyllHumbjeModal();renderStatusPills('humbur');renderHumbjeSection(r);renderKomente(r);perditesoStats();renderTabs();populoChips();aplikoFiltrat();
    if(typeof perditesoNjoftimet==='function')perditesoNjoftimet();
}

// KOMENTE
function renderKomente(r){
    const el=document.getElementById('drKomente'),km=r.komente||[];
    if(km.length===0){el.innerHTML='<div style="font-size:12px;color:#94a3b8;padding:4px 0">Asnjë koment</div>';return;}
    el.innerHTML=km.map(k=>`<div class="rin-comment ${k.tipi==='sistem'?'sistem':''}" ${k.tipi==='import'?'style="border-left:3px solid #f59e0b"':''}>
        <div class="rin-comment-header"><span class="rin-comment-author">${esc(k.autori)}</span><span class="rin-comment-date">${formatKomentDate(k.data)}</span></div>
        <p class="rin-comment-text">${esc(k.teksti)}</p></div>`).join('');
}
function shtoKoment(){
    if(!currentDrawerId)return;const inp=document.getElementById('drKomentInput'),t=inp.value.trim();if(!t)return;
    const r=rinovimet.find(x=>x.id===currentDrawerId);if(!r)return;
    r.komente=r.komente||[];r.komente.unshift({teksti:t,autori:merrUser().emri,data:new Date().toISOString(),tipi:'manual'});r.updated_at=new Date().toISOString();
    ruajTedhena();renderKomente(r);inp.value='';
}

// ===== REPORT DRAWER =====
function hapReportDrawer(){
    if(!currentMuaj){alert('Importo të dhëna fillimisht.');return;}
    const data=filtroSipasRolit(rinovimet.filter(r=>r.muaji===currentMuaj));
    // Group by dega
    const byDega={};data.forEach(r=>{const d=r.dega||'Pa degë';if(!byDega[d])byDega[d]={total:0,rinovuar:0,humbur:0,pa_filluar:0,kontaktuar:0,primi:0,deme:0,agjentet:{}};
        const g=byDega[d];g.total++;g[r.statusi]=(g[r.statusi]||0)+1;g.primi+=(r.primi_vjetor||0);g.deme+=(r.deme_total_vlera||0);
        const a=r.agjenti||'Pa agjent';if(!g.agjentet[a])g.agjentet[a]={total:0,rinovuar:0,humbur:0,pa_filluar:0,kontaktuar:0,primi:0,deme:0};
        const ag=g.agjentet[a];ag.total++;ag[r.statusi]=(ag[r.statusi]||0)+1;ag.primi+=(r.primi_vjetor||0);ag.deme+=(r.deme_total_vlera||0);
    });
    let html=`<div class="rin-report-section"><div style="font-size:13px;font-weight:600;color:#1a2332;margin-bottom:4px">${formatMuajLabel(currentMuaj)}</div><div style="font-size:12px;color:#64748b">${data.length} kontrata · Primi ${formatMoney(data.reduce((s,r)=>s+(r.primi_vjetor||0),0))}</div></div>`;
    Object.keys(byDega).sort().forEach(dega=>{
        const g=byDega[dega];const lr=g.primi>0?(g.deme/g.primi*100):0;const rPct=g.total>0?(g.rinovuar/g.total*100):0;
        html+=`<div class="rin-report-section"><div style="font-size:13px;font-weight:600;color:#002B5C;margin-bottom:8px">${esc(dega)} <span style="font-size:11px;font-weight:400;color:#64748b">(${g.total} kontrata)</span></div>`;
        html+=`<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">
            <span style="font-size:11px;padding:3px 8px;border-radius:10px;background:#f1f5f9;color:#64748b">Pa filluar ${g.pa_filluar||0}</span>
            <span style="font-size:11px;padding:3px 8px;border-radius:10px;background:#fef3c7;color:#92400e">Kontaktuar ${g.kontaktuar||0}</span>
            <span style="font-size:11px;padding:3px 8px;border-radius:10px;background:#dcfce7;color:#166534">Rinovuar ${g.rinovuar||0}</span>
            <span style="font-size:11px;padding:3px 8px;border-radius:10px;background:#fee2e2;color:#991b1b">Humbur ${g.humbur||0}</span>
            <span style="font-size:11px;padding:3px 8px;border-radius:10px;background:#eff6ff;color:#1e40af">LR ${lr.toFixed(1)}%</span>
            <span style="font-size:11px;padding:3px 8px;border-radius:10px;background:#f0fdf4;color:#166534">Rinovuar ${rPct.toFixed(0)}%</span>
        </div>`;
        // Agjent table
        html+='<table class="rin-report-table"><thead><tr><th>Agjenti</th><th class="right">Total</th><th class="right">Rinovuar</th><th class="right">Humbur</th><th class="right">Primi</th><th class="right">LR%</th></tr></thead><tbody>';
        Object.keys(g.agjentet).sort().forEach(a=>{
            const ag=g.agjentet[a];const aLR=ag.primi>0?(ag.deme/ag.primi*100):0;
            html+=`<tr><td>${esc(a)}</td><td class="right">${ag.total}</td><td class="right" style="color:#166534;font-weight:600">${ag.rinovuar||0}</td><td class="right" style="color:#991b1b;font-weight:600">${ag.humbur||0}</td><td class="right">${formatMoney(ag.primi)}</td><td class="right" style="color:${aLR>80?'#ef4444':aLR>50?'#f59e0b':'#22c55e'};font-weight:600">${aLR>0?aLR.toFixed(1)+'%':'—'}</td></tr>`;
        });
        html+='</tbody></table></div>';
    });
    document.getElementById('reportContent').innerHTML=html;
    document.getElementById('rinOverlay').classList.add('open');document.getElementById('reportDrawer').classList.add('open');document.body.style.overflow='hidden';
}
function mbyllReportDrawer(){document.getElementById('reportDrawer').classList.remove('open');document.getElementById('rinOverlay').classList.remove('open');document.body.style.overflow='';}

// ===== IMPORT =====
function populoImportMuajt(){const sel=document.getElementById('importMuaji'),now=new Date();let h='';for(let i=-1;i<6;i++){const d=new Date(now.getFullYear(),now.getMonth()+i,1);const k=MUAJT[d.getMonth()].toLowerCase()+'_'+d.getFullYear();h+=`<option value="${k}" ${i===0?'selected':''}>${MUAJT[d.getMonth()]+' '+d.getFullYear()}</option>`;}sel.innerHTML=h;}
function hapImportModal(){importStep=1;importParsedData=null;document.getElementById('rinImportModal').classList.add('open');document.getElementById('fileInput').value='';showImportStep(1);document.body.style.overflow='hidden';}
function mbyllImportModal(){document.getElementById('rinImportModal').classList.remove('open');if(!currentDrawerId)document.body.style.overflow='';importParsedData=null;}
function showImportStep(step){
    importStep=step;[1,2,3].forEach(i=>{document.getElementById('importStep'+i).style.display=i===step?'':'none';const n=document.getElementById('stepNum'+i),t=document.getElementById('stepText'+i);n.classList.remove('active','done');t.classList.remove('active');if(i<step)n.classList.add('done');if(i===step){n.classList.add('active');t.classList.add('active');}});
    const btn=document.getElementById('importNextBtn');
    if(step===1){btn.textContent='Vazhdo';btn.disabled=true;btn.onclick=()=>showImportStep(2);}
    else if(step===2){btn.textContent='Vazhdo';btn.disabled=false;btn.onclick=()=>showImportStep(3);renderImportStep2();}
    else{renderImportStep3();btn.textContent=`Importo ${importParsedData.records.length} kontrata`;btn.disabled=false;btn.onclick=()=>ekzekutoImport();}
}
function handleFileSelect(e){const f=e.target.files[0];if(f)processFile(f);}
function handleDrop(e){e.preventDefault();e.target.closest('.rin-upload-zone')?.classList.remove('dragover');const f=e.dataTransfer.files[0];if(f)processFile(f);}
function processFile(file){
    if(!file.name.match(/\.xlsx?$/i)){alert('Vetëm .xlsx ose .xls');return;}
    const reader=new FileReader();reader.onload=function(e){try{const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array',cellDates:false,cellFormula:false});const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:null,rawNumbers:true});const parsed=parseExcelRows(rows);if(!parsed)return;parsed.fileName=file.name;parsed.fileSize=(file.size/1024).toFixed(0)+' KB';importParsedData=parsed;document.getElementById('importNextBtn').disabled=false;showImportStep(2);}catch(err){console.error(err);alert('Gabim: '+err.message);}};reader.readAsArrayBuffer(file);
}
function parseExcelRows(rows){
    let hIdx=-1;for(let i=0;i<Math.min(5,rows.length);i++){const c=(rows[i]||[]).map(c=>c?String(c).toLowerCase().trim():'');if(c.includes('nr.')||c.includes('kontraktuesi')||c.includes('nr i kontrates')){hIdx=i;break;}}
    if(hIdx===-1){alert('Header nuk u gjet.');return null;}
    const headers=rows[hIdx].map(h=>h?String(h).toLowerCase().trim():'');const dataRows=rows.slice(hIdx+1).filter(r=>r&&r.some(c=>c!==null&&c!==''&&c!==undefined));
    const colMap={};headers.forEach((h,i)=>{if(COLUMN_MAP[h])colMap[COLUMN_MAP[h]]=i;});
    const vIdx=colMap['valuta'];if(vIdx!==undefined)DEME_COLS.forEach((col,i)=>{const idx=vIdx+1+i;if(idx<headers.length)colMap[col]=idx;});
    const rawRecords=[];
    dataRows.forEach(row=>{
        const rec={};Object.keys(colMap).forEach(f=>{let v=row[colMap[f]];if(typeof v==='string'&&v.startsWith('='))v=null;rec[f]=v;});
        if(!rec.kontraktuesi&&!rec.nr_kontrates)return;
        ['primi','tvsh','total_primi','deme_nr_paguar','deme_vlera_paguar','deme_nr_pezull','deme_vlera_pezull'].forEach(f=>{if(rec[f]!==null&&rec[f]!==undefined)rec[f]=parseFloat(rec[f])||0;});
        rec._koment_excel=null;for(let ci=row.length-1;ci>=0;ci--){const cv=row[ci];if(cv!==null&&cv!==undefined&&String(cv).trim()!==''&&!String(cv).startsWith('=')){if(!Object.values(colMap).includes(ci)){rec._koment_excel=String(cv).trim();break;}break;}}
        rawRecords.push(rec);
    });
    const grouped={};rawRecords.forEach(rec=>{
        const key=rec.nr_kontrates||('noid_'+Math.random().toString(36).substr(2,6));
        if(!grouped[key]){grouped[key]={...rec,_rc:1};}
        else{const g=grouped[key];g._rc++;g.primi=(g.primi||0)+(rec.primi||0);g.tvsh=(g.tvsh||0)+(rec.tvsh||0);g.total_primi=(g.total_primi||0)+(rec.total_primi||0);g.deme_nr_paguar=(g.deme_nr_paguar||0)+(rec.deme_nr_paguar||0);g.deme_vlera_paguar=(g.deme_vlera_paguar||0)+(rec.deme_vlera_paguar||0);g.deme_nr_pezull=(g.deme_nr_pezull||0)+(rec.deme_nr_pezull||0);g.deme_vlera_pezull=(g.deme_vlera_pezull||0)+(rec.deme_vlera_pezull||0);
            if(rec.data_fillimit&&(!g.data_fillimit||parseDateStr(rec.data_fillimit)<parseDateStr(g.data_fillimit)))g.data_fillimit=rec.data_fillimit;
            if(rec.data_mbarimit&&(!g.data_mbarimit||parseDateStr(rec.data_mbarimit)>parseDateStr(g.data_mbarimit)))g.data_mbarimit=rec.data_mbarimit;
            if(rec._koment_excel&&!g._koment_excel)g._koment_excel=rec._koment_excel;}
    });
    const muaj=document.getElementById('importMuaji').value;
    const records=Object.values(grouped).map(g=>{g.deme_total_nr=(g.deme_nr_paguar||0)+(g.deme_nr_pezull||0);g.deme_total_vlera=(g.deme_vlera_paguar||0)+(g.deme_vlera_pezull||0);const tp=g.total_primi||g.primi||0;g.shpenzimet=tp*0.31;g.kosto_totale=g.deme_total_vlera+g.shpenzimet;g.lr_percent=tp>0?(g.deme_total_vlera/tp*100):0;g.cr_percent=tp>0?(g.kosto_totale/tp*100):0;g.primi_vjetor=tp;return g;});
    const existingMap={};rinovimet.filter(r=>r.muaji===muaj).forEach(r=>{existingMap[r.nr_kontrates]=r.id;});
    let uC=0,nC=0;records.forEach(r=>{if(existingMap[r.nr_kontrates]){r._action='update';r._existId=existingMap[r.nr_kontrates];uC++;}else{r._action='new';nC++;}});
    return{records,rawCount:rawRecords.length,groupedCount:rawRecords.length-records.length,withDeme:records.filter(r=>r.deme_total_vlera>0).length,withoutDeme:records.filter(r=>r.deme_total_vlera<=0).length,updateCount:uC,newCount:nC,agents:[...new Set(records.map(r=>r.agjenti).filter(Boolean))],branches:[...new Set(records.map(r=>r.dega).filter(Boolean))],muaj};
}
function renderImportStep2(){
    if(!importParsedData)return;const d=importParsedData;
    let h=`<div class="rin-file-info"><span style="font-size:20px">📄</span><div style="flex:1"><div class="rin-file-name">${esc(d.fileName)}</div><div class="rin-file-meta">${d.rawCount} rreshta · ${d.fileSize} · ${formatMuajLabel(d.muaj)}</div></div></div>
        <div style="margin-bottom:16px"><div style="font-size:12px;font-weight:600;color:#64748b;margin-bottom:8px">Rezultati i analizës</div>
        <div class="rin-validation-item"><span class="rin-v-ok">✓</span> ${d.records.length} kontrata unike (nga ${d.rawCount} rreshta)</div>
        ${d.groupedCount>0?`<div class="rin-validation-item"><span class="rin-v-ok">✓</span> ${d.groupedCount} rreshta u grupuan</div>`:''}
        <div class="rin-validation-item"><span class="rin-v-ok">✓</span> ${d.withDeme} kontrata me dëme</div>
        ${d.withoutDeme>0?`<div class="rin-validation-item"><span class="rin-v-warn">⚠</span> ${d.withoutDeme} kontrata pa dëme</div>`:''}
        <div class="rin-validation-item"><span class="rin-v-ok">✓</span> ${d.agents.length} agjentë · ${d.branches.length} degë</div></div>`;
    if(d.updateCount>0||d.newCount>0)h+=`<div class="rin-match-info">${d.updateCount>0?`<strong>${d.updateCount} ekzistuese</strong> do të përditësohen.<br>`:''}<strong>${d.newCount} të reja</strong> do të shtohen.</div>`;
    const prev=d.records.slice(0,4);h+=`<div class="rin-preview-label">Shembull</div><div class="rin-preview-wrap"><table class="rin-preview-table"><thead><tr><th style="width:30%">Kontraktuesi</th><th style="width:22%">Nr kontratës</th><th style="text-align:right;width:16%">Primi</th><th style="text-align:right;width:16%">Dëme</th><th style="text-align:right;width:16%">LR%</th></tr></thead><tbody>`;
    prev.forEach(r=>{h+=`<tr><td>${esc(r.kontraktuesi||'—')}</td><td>${esc(r.nr_kontrates||'—')}</td><td style="text-align:right">${formatMoney(r.primi_vjetor||0)}</td><td style="text-align:right;${r.deme_total_vlera>0?'color:#ef4444':'color:#cbd5e1'}">${r.deme_total_vlera>0?formatMoney(r.deme_total_vlera):'—'}</td><td style="text-align:right">${r.lr_percent>0?r.lr_percent.toFixed(1)+'%':'—'}</td></tr>`;});
    h+='</tbody></table></div>';document.getElementById('importStep2').innerHTML=h;
}
function renderImportStep3(){if(!importParsedData)return;const d=importParsedData;document.getElementById('importStep3').innerHTML=`<div style="text-align:center;padding:20px 0"><div style="font-size:32px;margin-bottom:12px">✅</div><div style="font-size:16px;font-weight:600;color:#1a2332;margin-bottom:4px">Gati për import — ${formatMuajLabel(d.muaj)}</div><div style="font-size:13px;color:#64748b">${d.records.length} kontrata${d.updateCount>0?' · '+d.updateCount+' përditësohen':''}</div></div>`;}
function ekzekutoImport(){
    if(!importParsedData)return;const d=importParsedData,u=merrUser(),now=new Date().toISOString(),impId='imp_'+Date.now().toString(36),muaj=d.muaj;
    d.records.forEach(rec=>{
        if(rec._action==='update'&&rec._existId){const ex=rinovimet.find(r=>r.id===rec._existId);if(ex){['primi','tvsh','total_primi','primi_vjetor','deme_nr_paguar','deme_vlera_paguar','deme_nr_pezull','deme_vlera_pezull','deme_total_nr','deme_total_vlera','shpenzimet','kosto_totale','lr_percent','cr_percent','data_fillimit','data_mbarimit'].forEach(f=>{ex[f]=rec[f];});if(rec.agjenti)ex.agjenti=rec.agjenti;if(rec.dega)ex.dega=rec.dega;ex.updated_at=now;ex.komente=ex.komente||[];ex.komente.unshift({teksti:'Të dhënat u përditësuan nga importi.',autori:u.emri,data:now,tipi:'sistem'});}}
        else{rinovimet.push({id:'rin_'+Date.now().toString(36)+'_'+Math.random().toString(36).substr(2,4),muaji:muaj,nr_kontrates:rec.nr_kontrates||'',kontraktues_id:rec.kontraktues_id||'',kontraktuesi:rec.kontraktuesi||'',dega:rec.dega||'',agjenti:rec.agjenti||'',lloji:rec.lloji||'',nr_profatures:rec.nr_profatures||'',data_fatures:rec.data_fatures||'',data_fillimit:rec.data_fillimit||'',data_mbarimit:rec.data_mbarimit||'',primi:rec.primi||0,tvsh:rec.tvsh||0,total_primi:rec.total_primi||0,primi_vjetor:rec.primi_vjetor||0,valuta:rec.valuta||'EUR',deme_nr_paguar:rec.deme_nr_paguar||0,deme_vlera_paguar:rec.deme_vlera_paguar||0,deme_nr_pezull:rec.deme_nr_pezull||0,deme_vlera_pezull:rec.deme_vlera_pezull||0,deme_total_nr:rec.deme_total_nr||0,deme_total_vlera:rec.deme_total_vlera||0,shpenzimet:rec.shpenzimet||0,kosto_totale:rec.kosto_totale||0,lr_percent:rec.lr_percent||0,cr_percent:rec.cr_percent||0,statusi:'pa_filluar',komente:[],humbje_arsyeja:null,humbje_koment:null,importi_id:impId,importuar_nga:u.emri,created_at:now,updated_at:now});
            if(rec._koment_excel){const nr=rinovimet[rinovimet.length-1];nr.komente.push({teksti:rec._koment_excel,autori:'Import Excel',data:now,tipi:'import'});}}
    });
    ruajTedhena();ruajImportMeta({id:impId,data:formatKomentDate(now),fileName:d.fileName,muaj:muaj,total:d.records.length,importuarNga:u.emri});
    currentMuaj=muaj;currentDega='';currentAgjent='';renderTabs();populoChips();aplikoFiltrat();mbyllImportModal();
    if(typeof perditesoNjoftimet==='function')perditesoNjoftimet();
}

// EXPORT
function eksportoExcel(){
    if(!currentMuaj){alert('Asnjë muaj.');return;}const data=filtroSipasRolit(rinovimet.filter(r=>r.muaji===currentMuaj));if(data.length===0){alert('Asnjë të dhënë.');return;}
    const rows=data.map(r=>({'Kontraktuesi':r.kontraktuesi,'Nr Kontratës':r.nr_kontrates,'Dega':r.dega,'Agjenti':r.agjenti,'Fillon':r.data_fillimit,'Mbaron':r.data_mbarimit,'Primi Vjetor':r.primi_vjetor||0,'Dëme Paguar (Nr)':r.deme_nr_paguar||0,'Dëme Paguar (€)':r.deme_vlera_paguar||0,'Dëme Pezull (Nr)':r.deme_nr_pezull||0,'Dëme Pezull (€)':r.deme_vlera_pezull||0,'Dëme Total (€)':r.deme_total_vlera||0,'Shpenzimet':Math.round(r.shpenzimet||0),'Kosto Totale':Math.round(r.kosto_totale||0),'LR%':r.lr_percent?r.lr_percent.toFixed(1):'','CR%':r.cr_percent?r.cr_percent.toFixed(1):'','Statusi':STATUSET[r.statusi]?.emri||r.statusi,'Arsyeja Humbjes':r.humbje_arsyeja||'','Koment Humbjes':r.humbje_koment||''}));
    const ws=XLSX.utils.json_to_sheet(rows),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Rinovimet');XLSX.writeFile(wb,`Rinovimet_${formatMuajLabel(currentMuaj).replace(' ','_')}.xlsx`);
}

// HELPERS
function parseDateStr(s){if(!s)return new Date(0);if(s instanceof Date)return s;s=String(s);const p=s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);if(p)return new Date(parseInt(p[3]),parseInt(p[2])-1,parseInt(p[1]));const d=new Date(s);return isNaN(d.getTime())?new Date(0):d;}
function formatDateShort(s){if(!s)return'—';const d=parseDateStr(s);if(!d||d.getTime()===0)return'—';return String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0');}
function formatKomentDate(s){if(!s)return'';const d=parseDateStr(s);if(!d||isNaN(d.getTime()))return'';return String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear();}
function formatMoney(v){if(v===null||v===undefined||isNaN(v))return'—';return Math.round(v).toLocaleString('de-DE')+'€';}
function formatMoneyShort(v){if(!v||isNaN(v))return'0€';if(v>=1000000)return(v/1000000).toFixed(1)+'M€';if(v>=1000)return Math.round(v/1000)+'K€';return Math.round(v)+'€';}
function esc(s){return s?String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'):'';}