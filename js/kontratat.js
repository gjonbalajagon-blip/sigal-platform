let kontratat = JSON.parse(localStorage.getItem('kontratat')) || [];
function reloadData(){kontratat=JSON.parse(localStorage.getItem('kontratat'))||[];}
let editIndex=-1;
let activeTab='aktive';
let activeSort='skadon';

// ====== SPREADSHEET STATE ======
let spSelectedPakot=new Set();
let spFoldOpen=false;
let spLocked=false;
let spCustomValues=null;
const SP_TJERA_LABELS=[
    {label:'Shtatzënia',idx:0},{label:'Dentar',idx:1},{label:'Optik',idx:2},
    {label:'Dëgim',idx:3},{label:'Psikiatrik',idx:4},{label:'Fizioterapi',idx:5},
    {label:'Autoambulanca',idx:6},{label:'Aksidenti',idx:7},{label:'Onkologjike',idx:8}
];

function formatData(data){if(!data)return'-';if(data.includes('-')&&data.split('-')[0].length===4){const[y,m,d]=data.split('-');return d+'/'+m+'/'+y;}return data;}
function ruajNeStorage(){localStorage.setItem('kontratat',JSON.stringify(kontratat));}
function parseDate(data){if(!data)return null;if(data.includes('/')){const[d,m,y]=data.split('/');return new Date(y+'-'+m+'-'+d);}return new Date(data);}
function llogaritStatus(mbarimi){if(!mbarimi)return'ne-pritje';const dite=Math.ceil((parseDate(mbarimi)-new Date())/(1000*60*60*24));if(dite<0)return'skaduar';if(dite<=35)return'skadon';return'aktive';}
function llogaritDitet(mbarimi){if(!mbarimi)return{teksti:'-',klasa:''};const dite=Math.ceil((parseDate(mbarimi)-new Date())/(1000*60*60*24));if(dite<0)return{teksti:Math.abs(dite)+'d',klasa:'skadon-expired'};if(dite<=35)return{teksti:dite+'d',klasa:'skadon-warning'};return{teksti:dite+'d',klasa:'skadon-ok'};}

function ndryshoTab(tab){activeTab=tab;document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.getElementById('tab-'+tab).classList.add('active');filtro();}
function ndryshoSort(sort){activeSort=sort;document.getElementById('sort-skadon').classList.toggle('active',sort==='skadon');document.getElementById('sort-re').classList.toggle('active',sort==='re');filtro();}
function mbyllDrawer(){document.getElementById('drawer-overlay').classList.remove('active');}

// ====== NOTIFICATION ======
function tregoNotification(msg,tipi){
    let n=document.getElementById('k-notification');
    if(!n){n=document.createElement('div');n.id='k-notification';n.style.cssText='position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:500;z-index:9999;display:flex;align-items:center;gap:8px;box-shadow:0 4px 16px rgba(0,0,0,.12);transition:opacity .3s;font-family:inherit;max-width:400px;';document.body.appendChild(n);}
    const colors={error:'background:#fef2f2;color:#991b1b;border:1px solid #fecaca',success:'background:#f0fdf4;color:#166534;border:1px solid #bbf7d0',info:'background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe'};
    const icons={error:'⚠️',success:'✅',info:'ℹ️'};
    n.style.cssText+=colors[tipi||'error'];n.innerHTML=icons[tipi||'error']+' '+msg;n.style.opacity='1';
    clearTimeout(n._timer);n._timer=setTimeout(()=>{n.style.opacity='0';setTimeout(()=>{if(n.parentNode)n.parentNode.removeChild(n);},300);},4000);
}

// ====== LLOJI ======
function zgjidhLlojin(lloji,btn){
    document.getElementById('m-lloji').value=lloji;
    document.querySelectorAll('.drawer-lloji-btn').forEach(b=>b.classList.remove('active'));
    if(btn)btn.classList.add('active');
    document.getElementById('field-nr-biznesit').style.display=(lloji==='biznes')?'block':'none';
    document.getElementById('field-perfaqesuesi').style.display=(lloji==='biznes'||lloji==='familje')?'block':'none';
    document.getElementById('field-nr-personal').style.display=(lloji==='individ'||lloji==='familje')?'block':'none';
    document.getElementById('field-pozita').style.display=(lloji==='biznes')?'block':'none';
    if(editIndex<0&&!spLocked){spSelectedPakot.clear();spCustomValues=null;}
    spFoldOpen=false;
    renderSpreadsheet();
}

// ====== SPREADSHEET ======
function renderSpreadsheet(){
    const lloji=document.getElementById('m-lloji').value;
    const pakotList=lloji==='individ'?PAKOT.individ:PAKOT.familje_biznes;
    const eshteIndivid=lloji==='individ';
    const container=document.getElementById('pakot-container');
    const colCount=pakotList.length+1;
    const cellClick=spLocked?'':'onclick="spEditCell(this)"';

    let h='<div class="sp-container">';
    h+='<div class="sp-toolbar"><div class="sp-toolbar-left">';
    if(!spLocked)h+='<label class="sp-select-all"><input type="checkbox" id="sp-sel-all" onchange="spToggleAll(this.checked)"> Selekto të gjitha</label>';
    else h+='<button onclick="zhbllokoSpreadsheet()" style="font-size:11px;padding:4px 10px;border:1px solid #e5e9f0;border-radius:6px;background:#fff;color:#1e3a8a;cursor:pointer;font-weight:600;font-family:inherit">🔓 Zhblloko</button>';
    h+='</div><span class="sp-hint">'+(spLocked?'🔒 Kyçur':'Kliko çelulën për edit')+'</span></div>';

    h+='<div class="sp-table-wrap"><table class="sp-table"><thead><tr><td></td>';
    pakotList.forEach(p=>{
        const sel=spSelectedPakot.has(p.id);
        h+='<td><div class="sp-pako-hdr'+(sel?' selected':'')+'"'+(spLocked?'':' onclick="spTogglePako(\''+p.id+'\')"')+'>';
        h+='<div class="sp-ph-name">';
        if(!spLocked)h+='<input type="checkbox" '+(sel?'checked':'')+' onclick="event.stopPropagation();spTogglePako(\''+p.id+'\')">';
        else if(sel)h+='<span style="color:#22c55e;font-weight:700;margin-right:4px;">✓</span>';
        h+=' '+p.emri+'</div><div class="sp-ph-shuma">€ '+p.shuma+'</div></div></td>';
    });
    h+='</tr></thead><tbody>';

    h+='<tr><td>Zona</td>';pakotList.forEach(p=>{const sel=spSelectedPakot.has(p.id);h+='<td class="'+(sel?'sp-cell':'sp-cell unselected')+'" data-pako="'+p.id+'" data-field="zona" '+cellClick+'>'+p.zona+'</td>';});h+='</tr>';
    h+='<tr><td>Shuma</td>';pakotList.forEach(p=>{const sel=spSelectedPakot.has(p.id);h+='<td class="'+(sel?'sp-cell':'sp-cell unselected')+'" data-pako="'+p.id+'" data-field="shuma" '+cellClick+'>'+p.shuma+'</td>';});h+='</tr>';
    h+='<tr class="sp-section-row"><td colspan="'+colCount+'">Hospitalore</td></tr>';
    h+='<tr><td>Mbulimi</td>';pakotList.forEach(p=>{const sel=spSelectedPakot.has(p.id);h+='<td class="'+(sel?'sp-cell':'sp-cell unselected')+'" data-pako="'+p.id+'" data-field="hospitalore" '+cellClick+'>'+p.hospitalore+'</td>';});h+='</tr>';
    h+='<tr class="sp-section-row"><td colspan="'+colCount+'">Ambulantore</td></tr>';
    h+='<tr><td>Mbulimi</td>';pakotList.forEach(p=>{const sel=spSelectedPakot.has(p.id);const val=p.ambulantore||'—';h+='<td class="'+(sel?'sp-cell':'sp-cell unselected')+'" data-pako="'+p.id+'" data-field="ambulantore" '+cellClick+'>'+val+'</td>';});h+='</tr>';
    h+='<tr class="sp-fold-row" onclick="spToggleFold()"><td colspan="'+colCount+'"><span class="sp-fold-arrow'+(spFoldOpen?' open':'')+'">▸</span> Trajtime tjera ('+SP_TJERA_LABELS.length+')</td></tr>';
    if(spFoldOpen){SP_TJERA_LABELS.forEach(t=>{h+='<tr><td>'+t.label+'</td>';pakotList.forEach(p=>{const sel=spSelectedPakot.has(p.id);let val='—';if(p.tjera_pikat&&p.tjera_pikat[t.idx])val=p.tjera_pikat[t.idx].vlera||'—';const isEmpty=val==='—'||val==='Nuk mbulohet';const cls=sel?(isEmpty?'sp-cell empty':'sp-cell'):'sp-cell unselected';const display=val==='Nuk mbulohet'?'—':val;h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="tjera_'+t.idx+'" '+cellClick+'>'+display+'</td>';});h+='</tr>';});}
    h+='<tr class="sp-primi-row"><td>Primi</td>';pakotList.forEach(p=>{const sel=spSelectedPakot.has(p.id);const suffix=eshteIndivid?'/vit':'/muaj';h+='<td class="'+(sel?'sp-cell':'sp-cell unselected')+'" data-pako="'+p.id+'" data-field="primi_madh" '+cellClick+'>€ '+p.primi_madh+suffix+'</td>';});h+='</tr>';
    if(!eshteIndivid){h+='<tr><td style="color:#6b7a8d;font-size:10px;border-right:1px solid #e5e9f0;background:#fafbfc;">Primi fëmijë</td>';pakotList.forEach(p=>{const sel=spSelectedPakot.has(p.id);const val=p.primi_femije||'';h+='<td class="'+(sel?(val?'sp-cell':'sp-cell empty'):'sp-cell unselected')+'" data-pako="'+p.id+'" data-field="primi_femije" '+cellClick+'>'+(val?'€ '+val+'/muaj':'—')+'</td>';});h+='</tr>';}

    h+='</tbody></table></div></div>';
    container.innerHTML=h;
    const cb=document.getElementById('sp-sel-all');
    if(cb){const pakotList2=lloji==='individ'?PAKOT.individ:PAKOT.familje_biznes;cb.checked=spSelectedPakot.size===pakotList2.length&&pakotList2.length>0;}
    if(spLocked&&spCustomValues)setTimeout(()=>{applyCustomValues();},10);
}

function zhbllokoSpreadsheet(){
    if(!confirm('A jeni i sigurt? Pakot do të zhbllokohen për editim.'))return;
    spLocked=false;
    renderSpreadsheet();
}

function spTogglePako(id){if(spLocked)return;if(spSelectedPakot.has(id))spSelectedPakot.delete(id);else spSelectedPakot.add(id);renderSpreadsheet();}
function spToggleAll(checked){if(spLocked)return;const lloji=document.getElementById('m-lloji').value;const pakotList=lloji==='individ'?PAKOT.individ:PAKOT.familje_biznes;spSelectedPakot.clear();if(checked)pakotList.forEach(p=>spSelectedPakot.add(p.id));renderSpreadsheet();}
function spToggleFold(){spFoldOpen=!spFoldOpen;renderSpreadsheet();if(editIndex>=0){const k=kontratat[editIndex];if(k&&k.pakotData)setTimeout(()=>{applyCustomValues(k.pakotData);},30);}}

function spEditCell(td){
    if(spLocked)return;if(td.querySelector('input'))return;if(td.classList.contains('unselected'))return;
    const field=td.dataset.field;const raw=td.textContent.trim();
    let editVal=raw.replace(/^€\s*/,'').replace(/\/(vit|muaj)$/,'').trim();if(editVal==='—')editVal='';
    const inp=document.createElement('input');inp.type='text';inp.value=editVal;td.textContent='';td.appendChild(inp);inp.focus();inp.select();
    const finalize=()=>{const nv=inp.value.trim();const lloji=document.getElementById('m-lloji').value;if(field==='primi_madh')td.textContent=nv?'€ '+nv+(lloji==='individ'?'/vit':'/muaj'):'—';else if(field==='primi_femije')td.textContent=nv?'€ '+nv+'/muaj':'—';else td.textContent=nv||'—';td.classList.toggle('empty',!nv||nv==='—');};
    inp.addEventListener('blur',finalize);
    inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();inp.blur();}if(e.key==='Escape'){td.textContent=raw;}if(e.key==='Tab'){e.preventDefault();inp.blur();const next=e.shiftKey?td.previousElementSibling:td.nextElementSibling;if(next&&next.classList.contains('sp-cell')&&!next.classList.contains('unselected'))next.click();}});
}

function applyCustomValues(pakotArr){
    if(pakotArr)spCustomValues=pakotArr;
    if(!spCustomValues)return;
    const lloji=document.getElementById('m-lloji').value;
    (spCustomValues||[]).forEach(p=>{if(typeof p!=='object')return;if(p.tjera_pikat&&Array.isArray(p.tjera_pikat))p.tjera_pikat.forEach((tp,idx)=>{if(tp&&tp.vlera&&!p['tjera_'+idx])p['tjera_'+idx]=tp.vlera;});document.querySelectorAll('td.sp-cell[data-pako="'+p.id+'"]').forEach(td=>{const field=td.dataset.field;if(p[field]!==undefined&&p[field]!==''){if(field==='primi_madh')td.textContent='€ '+p[field]+(lloji==='individ'?'/vit':'/muaj');else if(field==='primi_femije')td.textContent=p[field]?'€ '+p[field]+'/muaj':'—';else td.textContent=p[field];td.classList.toggle('empty',!p[field]);}});});
}

// ====== SHTO / EDITO / RUAJ ======
function shtoKontrate(){
    editIndex=-1;spLocked=false;spSelectedPakot.clear();spFoldOpen=false;spCustomValues=null;
    document.getElementById('modal-title').textContent='Kontratë e Re';
    document.getElementById('m-emri').value='';
    if(document.getElementById('m-email'))document.getElementById('m-email').value='';
    document.getElementById('m-adresa').value='';
    document.getElementById('m-nr-biznesit').value='';
    document.getElementById('m-nr-personal').value='';
    document.getElementById('m-perfaqesuesi').value='';
    document.getElementById('m-pozita').value='';
    document.getElementById('m-data-kontrates').value='';
    document.getElementById('m-fillimi').value='';
    document.getElementById('m-mbarimi').value='';
    document.getElementById('m-lloji').value='individ';
    document.querySelectorAll('.drawer-lloji-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById('field-nr-biznesit').style.display='none';
    document.getElementById('field-perfaqesuesi').style.display='none';
    document.getElementById('field-nr-personal').style.display='block';
    document.getElementById('field-pozita').style.display='none';
    renderSpreadsheet();

    const params=new URLSearchParams(window.location.search);
    if(params.get('nga_oferta')==='true'){
        const data=JSON.parse(localStorage.getItem('oferta_per_kontrate')||'{}');
        if(data.emri){
            document.getElementById('m-emri').value=data.emri;
            if(data.email&&document.getElementById('m-email'))document.getElementById('m-email').value=data.email;
            const btns=document.querySelectorAll('.drawer-lloji-btn');
            const llojiMap={individ:0,familje:1,biznes:2};
            zgjidhLlojin(data.lloji||'individ',btns[llojiMap[data.lloji]||0]);
            spLocked=true;
            const pakotArr=data.pakot||[];
            pakotArr.forEach(p=>{const id=typeof p==='object'?p.id:p;spSelectedPakot.add(id);});
            renderSpreadsheet();
            const pakotData=pakotArr.filter(p=>typeof p==='object').map(p=>{
                if(!p.tjera_pikat)return p;
                const fixed={...p};
                p.tjera_pikat.forEach((tp,idx)=>{if(tp&&tp.vlera&&!fixed['tjera_'+idx])fixed['tjera_'+idx]=tp.vlera;});
                return fixed;
            });
            setTimeout(()=>{applyCustomValues(pakotData);},80);
        }
        window.history.replaceState({},'','kontratat.html');
        localStorage.removeItem('oferta_per_kontrate');
    }

    document.getElementById('drawer-overlay').classList.add('active');
}

function ruajKontrate(){
    const emri=document.getElementById('m-emri').value.trim();
    const lloji=document.getElementById('m-lloji').value;
    const fillimi=document.getElementById('m-fillimi').value.trim();
    const mbarimi=document.getElementById('m-mbarimi').value.trim();
    const email=document.getElementById('m-email')?document.getElementById('m-email').value.trim():'';
    const adresa=document.getElementById('m-adresa').value.trim();
    const nrPersonal=document.getElementById('m-nr-personal').value.trim();
    const nrBiznesit=document.getElementById('m-nr-biznesit').value.trim();

    const llojiSelected=document.querySelector('.drawer-lloji-btn.active');
    if(!llojiSelected){tregoNotification('Zgjidhni kategorinë (Individuale, Familjare, ose Biznese)','error');return;}
    if(!emri){tregoNotification('Shkruani emrin e klientit','error');return;}
    if(!email){tregoNotification('Shkruani email-in e klientit','error');return;}
    if(spSelectedPakot.size===0){tregoNotification('Zgjidhni së paku një paketë','error');return;}
    if(!adresa){tregoNotification('Plotësoni adresën','error');return;}
    if(lloji==='biznes'&&!nrBiznesit){tregoNotification('Plotësoni NRB (Nr. Biznesit)','error');return;}
    if((lloji==='individ'||lloji==='familje')&&!nrPersonal){tregoNotification('Plotësoni Nr. ID (Nr. Personal)','error');return;}
    if(lloji==='biznes'&&!document.getElementById('m-perfaqesuesi').value.trim()){tregoNotification('Plotësoni emrin e përfaqësuesit','error');return;}
    if(!document.getElementById('m-data-kontrates').value.trim()){tregoNotification('Plotësoni datën e kontratës','error');return;}
    if(!fillimi){tregoNotification('Plotësoni datën e fillimit','error');return;}
    if(!mbarimi){tregoNotification('Plotësoni datën e mbarimit','error');return;}

    const pakotAktuale=[];
    spSelectedPakot.forEach(pakoId=>{
        const vlerat={id:pakoId};
        document.querySelectorAll('td.sp-cell[data-pako="'+pakoId+'"]').forEach(td=>{
            const field=td.dataset.field;
            let val=td.textContent.trim().replace(/^€\s*/,'').replace(/\/(vit|muaj)$/,'').trim();
            if(val==='—')val='';
            vlerat[field]=val;
        });
        if(spCustomValues){const cv=spCustomValues.find(c=>typeof c==='object'&&c.id===pakoId);if(cv){for(let ti=0;ti<9;ti++){const key='tjera_'+ti;if(!vlerat[key]&&cv[key])vlerat[key]=cv[key];}}}
        const pakotList=lloji==='individ'?PAKOT.individ:PAKOT.familje_biznes;
        const found=pakotList.find(pk=>pk.id===pakoId);
        if(found)vlerat.emri=found.emri;
        pakotAktuale.push(vlerat);
    });

    const pakotEmra=pakotAktuale.map(p=>'Pako '+(p.emri||p.id));

    const kontrata={
        emri,lloji,adresa,
        nrBiznesit,nrPersonal,
        perfaqesuesi:document.getElementById('m-perfaqesuesi').value.trim(),
        pozita:document.getElementById('m-pozita').value.trim(),
        dataKontrates:document.getElementById('m-data-kontrates').value,
        pakot:pakotEmra,
        pakotData:pakotAktuale,
        fillimi,mbarimi,email,
        faturimiLloji:document.getElementById('m-faturimi-lloji')?document.getElementById('m-faturimi-lloji').value:'mujor',
        dataKrijimit:new Date().toISOString().split('T')[0]
    };

    if(editIndex>=0){kontratat[editIndex]=kontrata;}
    else{
        kontratat.push(kontrata);
        const faturimi=JSON.parse(localStorage.getItem('faturimi_klientet'))||[];
        faturimi.push({emri:kontrata.emri,kontrataNr:kontrata.lloji==='biznes'?kontrata.nrBiznesit:kontrata.nrPersonal,nrPersonal:kontrata.nrPersonal,nrBiznesit:kontrata.nrBiznesit,lloji:kontrata.lloji,dataFillimit:kontrata.fillimi,dataMbarimit:kontrata.mbarimi,email:kontrata.email,faturimiLloji:kontrata.faturimiLloji||'mujor',dergesa:'email',afati:30,statuset:{}});
        localStorage.setItem('faturimi_klientet',JSON.stringify(faturimi));
    }
    ruajNeStorage();mbyllDrawer();renderTabela();
    tregoNotification(editIndex>=0?'Kontrata u përditësua':'Kontrata u krijua me sukses','success');
}

function editoKontrate(index){
    editIndex=index;const k=kontratat[index];
    document.getElementById('modal-title').textContent='Edito Kontratë';
    document.getElementById('m-emri').value=k.emri;
    if(document.getElementById('m-email'))document.getElementById('m-email').value=k.email||'';
    document.getElementById('m-adresa').value=k.adresa||'';
    document.getElementById('m-nr-biznesit').value=k.nrBiznesit||'';
    document.getElementById('m-nr-personal').value=k.nrPersonal||'';
    document.getElementById('m-perfaqesuesi').value=k.perfaqesuesi||'';
    document.getElementById('m-pozita').value=k.pozita||'';
    document.getElementById('m-data-kontrates').value=k.dataKontrates||'';
    document.getElementById('m-fillimi').value=k.fillimi||'';
    document.getElementById('m-mbarimi').value=k.mbarimi||'';
    if(document.getElementById('m-faturimi-lloji'))document.getElementById('m-faturimi-lloji').value=k.faturimiLloji||'mujor';

    spSelectedPakot.clear();spFoldOpen=false;
    const pakotData=k.pakotData||[];
    spLocked=pakotData.length>0;
    spCustomValues=pakotData.length>0?pakotData:null;
    pakotData.forEach(p=>{if(typeof p==='object'&&p.id)spSelectedPakot.add(p.id);});
    if(pakotData.length===0&&k.pakot){
        const lloji=k.lloji;const pakotList=lloji==='individ'?PAKOT.individ:PAKOT.familje_biznes;
        (k.pakot||[]).forEach(pe=>{const found=pakotList.find(p=>'Pako '+p.emri===pe||p.emri===pe);if(found)spSelectedPakot.add(found.id);});
    }

    const btns=document.querySelectorAll('.drawer-lloji-btn');
    const llojiMap={individ:0,familje:1,biznes:2};
    zgjidhLlojin(k.lloji,btns[llojiMap[k.lloji]||0]);
    if(pakotData.length>0){
        const fixed=pakotData.map(p=>{if(typeof p!=='object'||!p.tjera_pikat)return p;const f={...p};p.tjera_pikat.forEach((tp,idx)=>{if(tp&&tp.vlera&&!f['tjera_'+idx])f['tjera_'+idx]=tp.vlera;});return f;});
        setTimeout(()=>{applyCustomValues(fixed);},80);
    }
    document.getElementById('drawer-overlay').classList.add('active');
}

function fshijKontrate(index){if(confirm('A jeni i sigurt që doni të fshini këtë kontratë?')){kontratat.splice(index,1);ruajNeStorage();renderTabela();}}

function rinovoKontrate(index){
    if(!confirm('Rinovo kontratën për 1 vit?'))return;
    const k=kontratat[index];kontratat[index].arkivuar=true;
    const fillimRi=k.mbarimi?new Date(parseDate(k.mbarimi).getTime()+86400000).toISOString().split('T')[0]:new Date().toISOString().split('T')[0];
    const mbarimRi=new Date(new Date(fillimRi).setFullYear(new Date(fillimRi).getFullYear()+1)-86400000).toISOString().split('T')[0];
    const kontratRe={...k,fillimi:fillimRi,mbarimi:mbarimRi,dataKontrates:fillimRi,dataKrijimit:new Date().toISOString().split('T')[0],arkivuar:false};
    kontratat.push(kontratRe);ruajNeStorage();
    const faturimi=JSON.parse(localStorage.getItem('faturimi_klientet'))||[];
    const idxF=faturimi.findIndex(f=>f.emri===k.emri&&(f.nrPersonal===k.nrPersonal||f.nrBiznesit===k.nrBiznesit));
    if(idxF>=0){faturimi[idxF].dataFillimit=fillimRi;faturimi[idxF].dataMbarimit=mbarimRi;localStorage.setItem('faturimi_klientet',JSON.stringify(faturimi));}
    renderTabela();
}

async function gjeneroWord(index){
    const k=kontratat[index];
    try{const response=await fetch('https://sigal-platform-production.up.railway.app/api/gjenero-kontrate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(k)});
    const data=await response.json();if(data.success)window.open('https://sigal-platform-production.up.railway.app/api/shkarko/'+data.fileName,'_blank');else alert('Gabim: '+data.error);}catch(err){alert('Serveri nuk është aktiv!');}
}

async function dergoEmail(index){
    const k=kontratat[index];
    if(!k.email){tregoNotification('Kjo kontratë nuk ka email','error');return;}
    if(!confirm('Dërgo kontratën me email te '+k.email+'?'))return;
    try{
        const response=await fetch('https://sigal-platform-production.up.railway.app/api/gjenero-kontrate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(k)});
        const data=await response.json();
        if(data.success){
            const emailRes=await fetch('https://sigal-platform-production.up.railway.app/api/konfirmo-oferte',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:k.email,emri:k.emri,subject:'Kontrata juaj - SIGAL Health',message:'I/e nderuar '+k.emri+',\n\nBashkëngjitur gjeni kontratën tuaj të sigurimit shëndetësor.\n\nMë respekt,\nSIGAL Insurance Group'})});
            tregoNotification('Kontrata u dërgua me email te '+k.email,'success');
        }else{tregoNotification('Gabim në gjenerimin e Word: '+data.error,'error');}
    }catch(err){tregoNotification('Serveri nuk është aktiv','error');}
}

function filtro(){renderTabela();}
let skadVitetOpen={};
function toggleSkadViti(viti){skadVitetOpen[viti]=!skadVitetOpen[viti];renderTabela();}

function renderTabela(){
    const filterLloji=document.getElementById('filter-lloji').value;
    const filterViti=document.getElementById('filter-viti')?.value||'all';
    const filterMuaji=document.getElementById('filter-muaji')?.value||'all';
    const search=document.getElementById('search-kontrate').value.toLowerCase();
    const matchesPeriudha=k=>{
        if(filterViti==='all'&&filterMuaji==='all')return true;
        const dt=k.fillimi||k.dataKontrates||k.dataKrijimit||'';
        if(!dt)return false;
        let y='',m='';
        if(dt.includes('-')){const p=dt.split('-');y=p[0]||'';m=p[1]||'';}
        else if(dt.includes('/')){const p=dt.split('/');m=p[1]||'';y=p[2]||'';}
        if(filterViti!=='all'&&y!==filterViti)return false;
        if(filterMuaji!=='all'&&m!==filterMuaji)return false;
        return true;
    };
    const kontratatRolit=filtroSipasRolit(kontratat,'krijuarNga').filter(matchesPeriudha);
    const aktive=kontratatRolit.filter(k=>!k.arkivuar&&llogaritStatus(k.mbarimi)!=='skaduar');
    const skaduar=kontratatRolit.filter(k=>llogaritStatus(k.mbarimi)==='skaduar'||k.arkivuar);

    document.getElementById('tab-count-aktive').textContent=aktive.length;
    document.getElementById('tab-count-skaduar').textContent=skaduar.length;

    const joArkivuar=kontratatRolit.filter(k=>!k.arkivuar);
    document.getElementById('st-total').textContent=joArkivuar.length;
    document.getElementById('st-aktive').textContent=joArkivuar.filter(k=>llogaritStatus(k.mbarimi)==='aktive').length;
    document.getElementById('st-skadon').textContent=joArkivuar.filter(k=>llogaritStatus(k.mbarimi)==='skadon').length;
    document.getElementById('st-skaduar').textContent=joArkivuar.filter(k=>llogaritStatus(k.mbarimi)==='skaduar').length;

    const llojiNames={individ:'Individ',familje:'Familje',biznes:'Biznes'};
    document.getElementById('st-llojet').innerHTML=['individ','familje','biznes'].map(ll=>({ll,total:joArkivuar.filter(k=>k.lloji===ll).length})).filter(d=>d.total>0).map(d=>'<span class="strip-chip"><span class="sc-num">'+d.total+'</span> '+llojiNames[d.ll]+'</span>').join('');

    const stTotal=joArkivuar.length;const stAktive=joArkivuar.filter(k=>llogaritStatus(k.mbarimi)==='aktive').length;const stSkadon=joArkivuar.filter(k=>llogaritStatus(k.mbarimi)==='skadon').length;
    var barEl=document.getElementById('st-bar');
    var legEl=document.getElementById('st-legend');
    if(barEl&&legEl){
        if(stTotal>0){var pA=Math.round(stAktive/stTotal*100);var pS=Math.round(stSkadon/stTotal*100);var pSk=100-pA-pS;barEl.innerHTML='<div class="strip-bar-seg" style="width:'+pA+'%;background:#4ade80;border-radius:3px 0 0 3px;"></div><div class="strip-bar-seg" style="width:'+pS+'%;background:#fbbf24;"></div><div class="strip-bar-seg" style="width:'+pSk+'%;background:#fca5a5;border-radius:0 3px 3px 0;"></div>';legEl.innerHTML='<span><span class="sl-dot" style="background:#4ade80;"></span>Aktive</span><span><span class="sl-dot" style="background:#fbbf24;"></span>Skadon shpejt</span><span><span class="sl-dot" style="background:#fca5a5;"></span>Skaduar</span>';}
        else{barEl.innerHTML='';legEl.innerHTML='';}
    }

    const tbody=document.getElementById('kontratat-tbody');

    if(activeTab==='aktive'){
        const filtered=aktive.filter(k=>{return(filterLloji==='all'||k.lloji===filterLloji)&&(k.emri.toLowerCase().includes(search)||(k.nrPersonal||'').toLowerCase().includes(search)||(k.nrBiznesit||'').toLowerCase().includes(search));});
        const sorted=[...filtered].sort((a,b)=>{if(activeSort==='re')return(b.dataKrijimit||'').localeCompare(a.dataKrijimit||'');if(!a.mbarimi)return 1;if(!b.mbarimi)return-1;return parseDate(a.mbarimi)-parseDate(b.mbarimi);});
        if(sorted.length===0){tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:40px;color:#888;">Nuk ka kontrata aktive.</td></tr>';if(typeof lucide!=='undefined')lucide.createIcons();return;}
        tbody.innerHTML=sorted.map(k=>renderRow(k)).join('');if(typeof lucide!=='undefined')lucide.createIcons();return;
    }

    const filtered=skaduar.filter(k=>{return(filterLloji==='all'||k.lloji===filterLloji)&&(k.emri.toLowerCase().includes(search)||(k.nrPersonal||'').toLowerCase().includes(search)||(k.nrBiznesit||'').toLowerCase().includes(search));});
    if(filtered.length===0){tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:40px;color:#888;">Nuk ka kontrata të skaduara.</td></tr>';if(typeof lucide!=='undefined')lucide.createIcons();return;}
    const sipasVitit={};
    filtered.forEach(k=>{let viti='?';const mb=k.mbarimi||'';if(mb.includes('-'))viti=mb.substring(0,4);else if(mb.includes('/')){const parts=mb.split('/');viti=parts[2]||'?';}if(!sipasVitit[viti])sipasVitit[viti]=[];sipasVitit[viti].push(k);});
    const vitetSorted=Object.keys(sipasVitit).sort((a,b)=>b.localeCompare(a));
    let html='';
    vitetSorted.forEach(viti=>{const lista=sipasVitit[viti];const isOpen=skadVitetOpen[viti]!==false;
        html+='<tr><td colspan="8" style="padding:0;border:none;"><div onclick="toggleSkadViti(\''+viti+'\')" style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:#f0f4ff;cursor:pointer;border-bottom:1px solid #e5e9f0;user-select:none;"><span style="font-size:10px;color:#1e3a8a;">'+(isOpen?'▾':'▸')+'</span><span style="font-size:12px;font-weight:700;color:#1e3a8a;">'+viti+'</span><span style="font-size:10px;background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:white;padding:1px 8px;border-radius:10px;font-weight:700;">'+lista.length+'</span></div></td></tr>';
        if(isOpen){const sorted=[...lista].sort((a,b)=>{if(!a.mbarimi)return 1;if(!b.mbarimi)return-1;return parseDate(b.mbarimi)-parseDate(a.mbarimi);});html+=sorted.map(k=>renderRow(k)).join('');}
    });
    tbody.innerHTML=html;
    if(typeof lucide!=='undefined')lucide.createIcons();
}

function renderRow(k){
    const idx=kontratat.indexOf(k);const statusi=llogaritStatus(k.mbarimi);const ditet=llogaritDitet(k.mbarimi);
    const nrId=k.lloji==='biznes'?(k.nrBiznesit||'-'):(k.nrPersonal||'-');
    const llojiLabels={individ:'Individ',biznes:'Biznes',familje:'Familje'};
    const statusLabels={aktive:'Aktive',skaduar:'Skaduar','ne-pritje':'Në Pritje',skadon:'Skadon'};
    var dotColor='#10b981',skadonCls='green';if(ditet.klasa==='skadon-warning'){dotColor='#f59e0b';skadonCls='orange';}if(ditet.klasa==='skadon-expired'){dotColor='#ef4444';skadonCls='red';}
    const pakotArr=k.pakot||[];let pakotTxt='-';
    if(pakotArr.length<=2)pakotTxt=pakotArr.join(', ');
    else pakotTxt=pakotArr.slice(0,2).join(', ')+' <span style="background:#e5e9f0;color:#1e3a8a;font-size:9px;padding:1px 5px;border-radius:8px;font-weight:700;">+'+(pakotArr.length-2)+'</span>';
    return '<tr><td><div class="klient-name">'+k.emri+(k.arkivuar?' <span style="font-size:9px;color:#94a3b8;font-weight:600;">RINOVUAR</span>':'')+'</div><div class="klient-sub">'+(k.adresa||'')+'</div></td><td style="font-size:11px;color:#6b7a8d;">'+nrId+'</td><td><span class="badge-lloji '+k.lloji+'">'+(llojiLabels[k.lloji]||k.lloji)+'</span></td><td style="font-size:11px;color:#6b7a8d;">'+pakotTxt+'</td><td style="font-size:11px;color:#6b7a8d;">'+formatData(k.fillimi)+'</td><td><div class="skadon-cell '+skadonCls+'"><span class="skadon-dot"></span>'+ditet.teksti+'</div></td><td><span class="badge-status '+statusi+'">'+(statusLabels[statusi]||statusi)+'</span></td><td style="text-align:right;"><div class="action-icon-btns" style="justify-content:flex-end;"><button onclick="editoKontrate('+idx+')" title="Modifiko"><i data-lucide="pencil"></i></button><button class="btn-word" onclick="gjeneroWord('+idx+')" title="Word"><i data-lucide="file-text"></i> Word</button><button onclick="dergoEmail('+idx+')" title="Email"><i data-lucide="mail"></i></button><button onclick="fshijKontrate('+idx+')" title="Fshi"><i data-lucide="trash-2"></i></button></div></td></tr>';
}

document.addEventListener('DOMContentLoaded',function(){
    document.getElementById('m-fillimi').addEventListener('input',function(){let v=this.value.replace(/\D/g,'').slice(0,8);if(v.length>=3)v=v.slice(0,2)+'/'+v.slice(2);if(v.length>=6)v=v.slice(0,5)+'/'+v.slice(5);this.value=v;if(v.length===10){const[d,m,y]=v.split('/');const fillimi=new Date(y+'-'+m+'-'+d);if(isNaN(fillimi))return;const mbarimi=new Date(fillimi);mbarimi.setFullYear(mbarimi.getFullYear()+1);mbarimi.setDate(mbarimi.getDate()-1);document.getElementById('m-mbarimi').value=String(mbarimi.getDate()).padStart(2,'0')+'/'+String(mbarimi.getMonth()+1).padStart(2,'0')+'/'+mbarimi.getFullYear();}});
    ['m-mbarimi','m-data-kontrates'].forEach(id=>{document.getElementById(id).addEventListener('input',function(){let v=this.value.replace(/\D/g,'').slice(0,8);if(v.length>=3)v=v.slice(0,2)+'/'+v.slice(2);if(v.length>=6)v=v.slice(0,5)+'/'+v.slice(5);this.value=v;});});
    renderTabela();
    if(typeof lucide!=='undefined')lucide.createIcons();
    const params=new URLSearchParams(window.location.search);
    if(params.get('nga_oferta')==='true')shtoKontrate();
});

// ============================================================
// SHTESË PËR RINOVIME
// ============================================================
(function(){
    var params=new URLSearchParams(window.location.search);
    var rinId=params.get('nga_rinovimi');
    if(!rinId)return;
    var rinData=JSON.parse(localStorage.getItem('rinovim_per_kontrate')||'{}');
    if(!rinData.nga_rinovimi)return;

    setTimeout(function(){
        shtoKontrate();
        setTimeout(function(){
            if(rinData.emri)document.getElementById('m-emri').value=rinData.emri;
            if(rinData.kontraktues_id){
                document.getElementById('m-nr-personal').value=rinData.kontraktues_id;
                document.getElementById('m-nr-biznesit').value=rinData.kontraktues_id;
            }
            if(rinData.data_mbarimit){
                var mbOld=rinData.data_mbarimit;var fillRi;
                if(mbOld.includes('.')){var parts=mbOld.split('.');fillRi=new Date(parseInt(parts[2]),parseInt(parts[1])-1,parseInt(parts[0])+1);}
                else{fillRi=new Date(new Date(mbOld).getTime()+86400000);}
                if(!isNaN(fillRi.getTime())){
                    var mbRi=new Date(fillRi);mbRi.setFullYear(mbRi.getFullYear()+1);mbRi.setDate(mbRi.getDate()-1);
                    var fmt=function(dt){return String(dt.getDate()).padStart(2,'0')+'/'+String(dt.getMonth()+1).padStart(2,'0')+'/'+dt.getFullYear();};
                    document.getElementById('m-fillimi').value=fmt(fillRi);
                    document.getElementById('m-mbarimi').value=fmt(mbRi);
                    document.getElementById('m-data-kontrates').value=fmt(new Date());
                }
            }
            document.getElementById('modal-title').textContent='Kontratë nga Rinovimi';
            window.history.replaceState({},'','kontratat.html');
            localStorage.removeItem('rinovim_per_kontrate');
        },200);
    },300);
})();

// ============================================================
// STATS KPI CLICKABLE FILTER
// ============================================================
document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('.kpi-card').forEach(function(card){
        card.addEventListener('click',function(){
            var lbl=card.querySelector('.sm-lbl');
            if(!lbl)return;
            var t=lbl.textContent.trim().toLowerCase();
            if(t==='aktive')ndryshoTab('aktive');
            else if(t==='skaduar')ndryshoTab('skaduar');
            else if(t==='skadon shpejt'){ndryshoTab('aktive');activeSort='skadon';document.getElementById('sort-skadon').classList.add('active');document.getElementById('sort-re').classList.remove('active');filtro();}
            else if(t==='total'){ndryshoTab('aktive');}
        });
    });
});