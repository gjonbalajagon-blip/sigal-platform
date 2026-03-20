let ofertat = JSON.parse(localStorage.getItem('ofertat')) || [];
let editIndex = -1;

const TAPI='https://sigal-platform-production.up.railway.app';
const STATUSET_TRACK={
    e_krijuar:{label:'E krijuar',color:'#6b7a8d',bg:'#f4f6f9'},
    e_derguar:{label:'E dërguar',color:'#0047AB',bg:'#dbeafe'},
    e_pare:{label:'E parë',color:'#d97706',bg:'#fef3c7'},
    e_konfirmuar:{label:'Konfirmuar ✓',color:'#059669',bg:'#dcfce7'},
    kontrate:{label:'Kontratë',color:'#002B5C',bg:'#e8f0fe'}
};
function getTrackStatus(o){if(o.realizuar)return'kontrate';if(o.konfirmuar)return'e_konfirmuar';if(o.statusi)return o.statusi;return'e_krijuar';}
function trackBadge(statusi){const s=STATUSET_TRACK[statusi]||STATUSET_TRACK.e_krijuar;return'<span style="font-size:9px;font-weight:700;padding:3px 8px;border-radius:10px;background:'+s.bg+';color:'+s.color+';white-space:nowrap">'+s.label+'</span>';}
function ruajNeStorage(){localStorage.setItem('ofertat',JSON.stringify(ofertat));}

function shtoOferte(){
    editIndex=-1;
    document.getElementById('modal-title').textContent='Ofertë e Re';
    document.getElementById('m-emri').value='';
    document.getElementById('m-email').value='';
    document.getElementById('m-kerkuar-nga').value='direkt';
    document.getElementById('m-agjenti').value='';
    document.getElementById('field-agjenti').style.display='none';
    document.getElementById('version-panel').style.display='none';
    const tb=document.getElementById('tracking-bar');if(tb)tb.remove();
    spSelectedPakot.clear();
    spFoldOpen=false;
    zgjidhLlojin('individ',document.querySelectorAll('.drawer-lloji-btn')[0]);
    document.getElementById('drawer-overlay').classList.add('active');
}
function mbyllDrawer(){document.getElementById('drawer-overlay').classList.remove('active');}
function mbyllModal(){mbyllDrawer();}
function tregoBoxAgjenti(){document.getElementById('field-agjenti').style.display=document.getElementById('m-kerkuar-nga').value==='agjenti'?'block':'none';}

// ====== SPREADSHEET — lexo limitet nga tjera_pikat ======
// Rreshtat e spreadsheet-it: lexohen nga PAKOT direkt
const SP_TJERA_LABELS=[
    {label:'Shtatzënia',idx:0},
    {label:'Dentar',idx:1},
    {label:'Optik',idx:2},
    {label:'Dëgim',idx:3},
    {label:'Psikiatrik',idx:4},
    {label:'Fizioterapi',idx:5},
    {label:'Autoambulanca',idx:6},
    {label:'Aksidenti',idx:7},
    {label:'Onkologjike',idx:8}
];

let spSelectedPakot=new Set();
let spFoldOpen=false;

function zgjidhLlojin(lloji,btn){
    document.getElementById('m-lloji').value=lloji;
    document.querySelectorAll('.drawer-lloji-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    // Nuk e pastrojmë selektimin nëse jemi duke edituar
    if(editIndex<0){
        spSelectedPakot.clear();
    }
    spFoldOpen=false;
    renderSpreadsheet();
}

function renderSpreadsheet(){
    const lloji=document.getElementById('m-lloji').value;
    const pakotList=lloji==='individ'?PAKOT.individ:PAKOT.familje_biznes;
    const eshteIndivid=lloji==='individ';
    const container=document.getElementById('pakot-container');
    const colCount=pakotList.length+1;

    let h='<div class="sp-container">';
    h+='<div class="sp-toolbar"><div class="sp-toolbar-left">';
    h+='<label class="sp-select-all"><input type="checkbox" id="sp-sel-all" onchange="spToggleAll(this.checked)"> Selekto të gjitha</label>';
    h+='</div><span class="sp-hint">Kliko çelulën për edit</span></div>';

    h+='<div class="sp-table-wrap"><table class="sp-table"><thead><tr>';
    h+='<td></td>';
    pakotList.forEach(p=>{
        const sel=spSelectedPakot.has(p.id);
        h+='<td><div class="sp-pako-hdr'+(sel?' selected':'')+'" onclick="spTogglePako(\''+p.id+'\')">';
        h+='<div class="sp-ph-name"><input type="checkbox" '+(sel?'checked':'')+' onclick="event.stopPropagation();spTogglePako(\''+p.id+'\')"> '+p.emri+'</div>';
        h+='<div class="sp-ph-shuma">€ '+p.shuma+'</div>';
        h+='</div></td>';
    });
    h+='</tr></thead><tbody>';

    // Zona
    h+='<tr><td>Zona</td>';
    pakotList.forEach(p=>{
        const sel=spSelectedPakot.has(p.id);
        const cls=sel?'sp-cell':'sp-cell unselected';
        h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="zona" onclick="spEditCell(this)">'+p.zona+'</td>';
    });
    h+='</tr>';

    // Shuma
    h+='<tr><td>Shuma</td>';
    pakotList.forEach(p=>{
        const sel=spSelectedPakot.has(p.id);
        const cls=sel?'sp-cell':'sp-cell unselected';
        h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="shuma" onclick="spEditCell(this)">'+p.shuma+'</td>';
    });
    h+='</tr>';

    // Hospitalore
    h+='<tr class="sp-section-row"><td colspan="'+colCount+'">Hospitalore</td></tr>';
    h+='<tr><td>Mbulimi</td>';
    pakotList.forEach(p=>{
        const sel=spSelectedPakot.has(p.id);
        const cls=sel?'sp-cell':'sp-cell unselected';
        h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="hospitalore" onclick="spEditCell(this)">'+p.hospitalore+'</td>';
    });
    h+='</tr>';

    // Ambulantore
    h+='<tr class="sp-section-row"><td colspan="'+colCount+'">Ambulantore</td></tr>';
    h+='<tr><td>Mbulimi</td>';
    pakotList.forEach(p=>{
        const sel=spSelectedPakot.has(p.id);
        const val=p.ambulantore||'—';
        const cls=sel?'sp-cell':'sp-cell unselected';
        h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="ambulantore" onclick="spEditCell(this)">'+val+'</td>';
    });
    h+='</tr>';

    // Trajtime tjera — foldable, lexo nga tjera_pikat
    h+='<tr class="sp-fold-row" onclick="spToggleFold()"><td colspan="'+colCount+'"><span class="sp-fold-arrow'+(spFoldOpen?' open':'')+'">▸</span> Trajtime tjera ('+SP_TJERA_LABELS.length+')</td></tr>';

    if(spFoldOpen){
        SP_TJERA_LABELS.forEach(t=>{
            h+='<tr><td>'+t.label+'</td>';
            pakotList.forEach(p=>{
                const sel=spSelectedPakot.has(p.id);
                // Lexo vlerën nga tjera_pikat[idx]
                let val='—';
                if(p.tjera_pikat&&p.tjera_pikat[t.idx]){
                    val=p.tjera_pikat[t.idx].vlera||'—';
                }
                const isEmpty=val==='—'||val==='Nuk mbulohet';
                const cls=sel?(isEmpty?'sp-cell empty':'sp-cell'):'sp-cell unselected';
                // Shkurto "Nuk mbulohet" → "—" për hapësirë
                const display=val==='Nuk mbulohet'?'—':val;
                h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="tjera_'+t.idx+'" onclick="spEditCell(this)">'+display+'</td>';
            });
            h+='</tr>';
        });
    }

    // Primi
    h+='<tr class="sp-primi-row"><td>Primi</td>';
    pakotList.forEach(p=>{
        const sel=spSelectedPakot.has(p.id);
        const suffix=eshteIndivid?'/vit':'/muaj';
        const cls=sel?'sp-cell':'sp-cell unselected';
        h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="primi_madh" onclick="spEditCell(this)">€ '+p.primi_madh+suffix+'</td>';
    });
    h+='</tr>';

    if(!eshteIndivid){
        h+='<tr><td style="color:#6b7a8d;font-size:10px;border-right:1px solid #e5e9f0;background:#fafbfc;">Primi fëmijë</td>';
        pakotList.forEach(p=>{
            const sel=spSelectedPakot.has(p.id);
            const val=p.primi_femije||'';
            const cls=sel?(val?'sp-cell':'sp-cell empty'):'sp-cell unselected';
            h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="primi_femije" onclick="spEditCell(this)">'+(val?'€ '+val+'/muaj':'—')+'</td>';
        });
        h+='</tr>';
    }

    h+='</tbody></table></div></div>';
    container.innerHTML=h;
    spUpdateSelectAll();
}

function spTogglePako(id){
    if(spSelectedPakot.has(id))spSelectedPakot.delete(id);
    else spSelectedPakot.add(id);
    renderSpreadsheet();
}
function spToggleAll(checked){
    const lloji=document.getElementById('m-lloji').value;
    const pakotList=lloji==='individ'?PAKOT.individ:PAKOT.familje_biznes;
    spSelectedPakot.clear();
    if(checked)pakotList.forEach(p=>spSelectedPakot.add(p.id));
    renderSpreadsheet();
}
function spUpdateSelectAll(){
    const lloji=document.getElementById('m-lloji').value;
    const pakotList=lloji==='individ'?PAKOT.individ:PAKOT.familje_biznes;
    const cb=document.getElementById('sp-sel-all');
    if(cb)cb.checked=spSelectedPakot.size===pakotList.length&&pakotList.length>0;
}
function spToggleFold(){spFoldOpen=!spFoldOpen;renderSpreadsheet();}

function spEditCell(td){
    if(td.querySelector('input'))return;
    if(td.classList.contains('unselected'))return;
    const field=td.dataset.field;
    const raw=td.textContent.trim();
    let editVal=raw.replace(/^€\s*/,'').replace(/\/(vit|muaj)$/,'').trim();
    if(editVal==='—')editVal='';

    const inp=document.createElement('input');
    inp.type='text';inp.value=editVal;
    td.textContent='';td.appendChild(inp);
    inp.focus();inp.select();

    const finalize=()=>{
        const nv=inp.value.trim();
        const lloji=document.getElementById('m-lloji').value;
        if(field==='primi_madh') td.textContent=nv?'€ '+nv+(lloji==='individ'?'/vit':'/muaj'):'—';
        else if(field==='primi_femije') td.textContent=nv?'€ '+nv+'/muaj':'—';
        else td.textContent=nv||'—';
        td.classList.toggle('empty',!nv||nv==='—');
    };
    inp.addEventListener('blur',finalize);
    inp.addEventListener('keydown',e=>{
        if(e.key==='Enter'){e.preventDefault();inp.blur();}
        if(e.key==='Escape'){td.textContent=raw;}
        if(e.key==='Tab'){
            e.preventDefault();inp.blur();
            const next=e.shiftKey?td.previousElementSibling:td.nextElementSibling;
            if(next&&next.classList.contains('sp-cell')&&!next.classList.contains('unselected'))next.click();
        }
    });
}

// ====== VERSIONING ======
let historyOpen=false;
function toggleVersions(){
    historyOpen=!historyOpen;
    const body=document.getElementById('version-body');
    const arrow=document.getElementById('history-arrow');
    body.style.display=historyOpen?'block':'none';
    if(arrow) arrow.textContent=historyOpen?'▾':'▸';
}
function renderVersions(versione,oferta){
    if(!versione||versione.length===0)return;
    const body=document.getElementById('version-body');
    document.getElementById('version-count').textContent=versione.length;
    document.getElementById('history-label').textContent='Historiku i ndryshimeve';

    body.innerHTML=versione.map((v,i)=>{
        const pakotTxt=(v.pakot||[]).map(p=>typeof p==='object'?(p.emri||p.id):p).join(', ');
        // Detaje për çdo pakë
        let detaje='';
        (v.pakot||[]).forEach(p=>{
            if(typeof p!=='object')return;
            const emri=p.emri||p.id||'?';
            let rows='';
            // Fushat bazë
            if(p.zona) rows+='<tr><td>Zona</td><td>'+p.zona+'</td></tr>';
            if(p.shuma) rows+='<tr><td>Shuma</td><td>€ '+p.shuma+'</td></tr>';
            if(p.hospitalore) rows+='<tr><td>Hospitalore</td><td>'+p.hospitalore+'</td></tr>';
            if(p.ambulatore) rows+='<tr><td>Ambulantore</td><td>'+p.ambulatore+'</td></tr>';
            // Trajtime tjera — formati i ri (tjera_0..tjera_8)
            const tjeraLabels=['Shtatzënia','Dentar','Optik','Dëgim','Psikiatrik','Fizioterapi','Autoambulanca','Aksidenti','Onkologjike'];
            tjeraLabels.forEach((lbl,idx)=>{
                const key='tjera_'+idx;
                if(p[key]&&p[key]!=='—') rows+='<tr><td>'+lbl+'</td><td>'+p[key]+'</td></tr>';
            });
            // Formati i vjetër (shtatzania, dentar etj. direkt)
            const oldKeys=[{k:'shtatzania',l:'Shtatzënia'},{k:'dentar',l:'Dentar'},{k:'optik',l:'Optik'},{k:'degim',l:'Dëgim'},{k:'psikiatrik',l:'Psikiatrik'},{k:'fizioterapi',l:'Fizioterapi'},{k:'autoambulanca',l:'Autoambulanca'},{k:'aksidentit',l:'Aksidenti'},{k:'onkologjike',l:'Onkologjike'}];
            oldKeys.forEach(ok=>{
                if(p[ok.k]&&p[ok.k]!=='-'&&p[ok.k]!=='—') rows+='<tr><td>'+ok.l+'</td><td>'+p[ok.k]+'</td></tr>';
            });
            if(p.primi_madh) rows+='<tr><td>Primi</td><td>€ '+p.primi_madh+'</td></tr>';
            if(p.primi_femije) rows+='<tr><td>Primi fëmijë</td><td>€ '+p.primi_femije+'</td></tr>';

            if(rows){
                detaje+='<div style="margin:6px 0;"><div style="font-size:11px;font-weight:700;color:#002B5C;padding:4px 0;border-bottom:1px solid #e5e9f0;">'+emri+'</div>';
                detaje+='<table style="width:100%;font-size:11px;border-collapse:collapse;">'+rows+'</table></div>';
            }
        });

        return '<div style="border:1px solid #e5e9f0;border-radius:6px;margin-bottom:6px;overflow:hidden;">'+
            '<div style="display:flex;align-items:center;padding:8px 12px;cursor:pointer;background:#fafbfc;" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display===\'none\'?\'block\':\'none\'">'+
                '<span style="width:8px;height:8px;border-radius:50%;background:#002B5C;margin-right:8px;flex-shrink:0;"></span>'+
                '<span style="font-size:11px;color:#6b7a8d;min-width:80px;">'+(v.data||'-')+'</span>'+
                '<span style="font-size:11px;font-weight:600;color:#1a2332;flex:1;">'+pakotTxt+'</span>'+
                '<span style="font-size:10px;color:#0047AB;margin-right:8px;">Detajet ▾</span>'+
                '<button style="font-size:10px;padding:3px 10px;border:1px solid #e5e9f0;border-radius:4px;background:white;cursor:pointer;color:#002B5C;font-weight:600;" onclick="event.stopPropagation();riktheVersion('+i+')">Rikthe</button>'+
            '</div>'+
            '<div style="display:none;padding:8px 12px;border-top:1px solid #e5e9f0;background:white;">'+
                (detaje||'<div style="font-size:11px;color:#aaa;">Pa detaje</div>')+
            '</div>'+
        '</div>';
    }).reverse().join('');
}
function riktheVersion(vIdx){
    if(editIndex<0)return;
    const o=ofertat[editIndex],v=o.versione[vIdx];
    if(!v||!confirm('Rikthe versionin e dates '+(v.data||'?')+'?'))return;
    const btns=document.querySelectorAll('.drawer-lloji-btn');
    const llojiMap={'individ':0,'familje':1,'biznes':2};
    spSelectedPakot.clear();
    (v.pakot||[]).forEach(p=>spSelectedPakot.add(typeof p==='object'?p.id:p));
    zgjidhLlojin(v.lloji||o.lloji,btns[llojiMap[v.lloji||o.lloji]||0]);
    setTimeout(()=>{applyCustomValues(v.pakot||[]);},50);
}

// Vendos vlerat custom nga oferta e ruajtur mbi spreadsheet-in
function applyCustomValues(pakotArr){
    const lloji=document.getElementById('m-lloji').value;
    pakotArr.forEach(p=>{
        if(typeof p!=='object')return;
        document.querySelectorAll('td.sp-cell[data-pako="'+p.id+'"]').forEach(td=>{
            const field=td.dataset.field;
            if(p[field]!==undefined&&p[field]!==''){
                if(field==='primi_madh') td.textContent='€ '+p[field]+(lloji==='individ'?'/vit':'/muaj');
                else if(field==='primi_femije') td.textContent=p[field]?'€ '+p[field]+'/muaj':'—';
                else td.textContent=p[field];
                td.classList.toggle('empty',!p[field]);
            }
        });
    });
}

// ====== RUAJ ======
function ruajOferte(){
    const emri=document.getElementById('m-emri').value.trim();
    if(!emri){alert('Ju lutem shkruani emrin e klientit!');return;}
    if(spSelectedPakot.size===0){alert('Ju lutem zgjidhni së paku një paketë!');return;}
    const lloji=document.getElementById('m-lloji').value;
    const today=new Date(),skadon=new Date(today);
    skadon.setDate(skadon.getDate()+30);

    const pakotAktuale=[];
    spSelectedPakot.forEach(pakoId=>{
        const vlerat={id:pakoId};
        document.querySelectorAll('td.sp-cell[data-pako="'+pakoId+'"]').forEach(td=>{
            const field=td.dataset.field;
            let val=td.textContent.trim().replace(/^€\s*/,'').replace(/\/(vit|muaj)$/,'').trim();
            if(val==='—')val='';
            vlerat[field]=val;
        });
        // Shto emrin e pakos
        const pakotList=lloji==='individ'?PAKOT.individ:PAKOT.familje_biznes;
        const found=pakotList.find(pk=>pk.id===pakoId);
        if(found) vlerat.emri=found.emri;
        pakotAktuale.push(vlerat);
    });

    const oferta={
        emri,lloji,
        email:document.getElementById('m-email').value.trim(),
        kerkuarNga:document.getElementById('m-kerkuar-nga').value,
        agjenti:document.getElementById('m-kerkuar-nga').value==='agjenti'?document.getElementById('m-agjenti').value.trim():'',
        pakot:pakotAktuale,
        krijuarNga:JSON.parse(localStorage.getItem('user_aktual'))?.username||'agon',
        krijuarNgaEmri:(()=>{const u=JSON.parse(localStorage.getItem('user_aktual'));return u?`${u.emri} ${u.mbiemri||''}`.trim():'Agon';})(),
        krijuarNgaEmail:JSON.parse(localStorage.getItem('user_aktual'))?.email||'gjonbalajagon@gmail.com',
        dataKrijimit:today.toISOString().split('T')[0],
        dataSkadon:skadon.toISOString().split('T')[0]
    };

    if(editIndex>=0){
        oferta.realizuar=ofertat[editIndex].realizuar;
        oferta.konfirmuar=ofertat[editIndex].konfirmuar;
        oferta.pakaZgjedhur=ofertat[editIndex].pakaZgjedhur;
        oferta.komentKlient=ofertat[editIndex].komentKlient;
        oferta.dataKonfirmimit=ofertat[editIndex].dataKonfirmimit;
        oferta.statusi=ofertat[editIndex].statusi;
        oferta.notification=ofertat[editIndex].notification;
        const ve=ofertat[editIndex].versione||[];
        ve.push({data:ofertat[editIndex].dataKrijimit||new Date().toISOString().split('T')[0],lloji:ofertat[editIndex].lloji,pakot:ofertat[editIndex].pakot,emri:ofertat[editIndex].emri});
        oferta.versione=ve;
        oferta.dataKrijimit=ofertat[editIndex].dataKrijimit;
        ofertat[editIndex]=oferta;
    }else{
        oferta.realizuar=false;oferta.versione=[];oferta.statusi='e_krijuar';
        ofertat.push(oferta);
    }
    ruajNeStorage();mbyllDrawer();renderTabela();
}

// ====== EDITO ======
function editoOferte(index){
    editIndex=index;
    const o=ofertat[index];
    document.getElementById('modal-title').textContent='Edito Ofertën';
    document.getElementById('m-emri').value=o.emri;
    document.getElementById('m-email').value=o.email||'';
    document.getElementById('m-kerkuar-nga').value=o.kerkuarNga||'direkt';
    document.getElementById('m-agjenti').value=o.agjenti||'';
    tregoBoxAgjenti();

    const btns=document.querySelectorAll('.drawer-lloji-btn');
    const llojiMap={'individ':0,'familje':1,'biznes':2};
    spSelectedPakot.clear();
    (o.pakot||[]).forEach(p=>spSelectedPakot.add(typeof p==='object'?p.id:p));
    spFoldOpen=false;
    zgjidhLlojin(o.lloji,btns[llojiMap[o.lloji]||0]);
    setTimeout(()=>{applyCustomValues(o.pakot||[]);},80);

    const vPanel=document.getElementById('version-panel');
    if(o.versione&&o.versione.length>0){vPanel.style.display='block';renderVersions(o.versione,o);}
    else{vPanel.style.display='none';}
    document.getElementById('drawer-overlay').classList.add('active');
}

function fshijOferte(index){if(confirm('A jeni i sigurt qe doni te fshini kete oferte?')){ofertat.splice(index,1);ruajNeStorage();renderTabela();}}
function llogaritStatus(dataSkadon){if(!dataSkadon)return'aktive';return new Date()>new Date(dataSkadon)?'skaduar':'aktive';}
function llogaritDitet(dataSkadon){
    if(!dataSkadon)return{teksti:'-',klasa:''};
    const dite=Math.ceil((new Date(dataSkadon)-new Date())/(1000*60*60*24));
    if(dite<0)return{teksti:'Skaduar',klasa:'skadon-expired'};
    if(dite<=7)return{teksti:dite+' dite',klasa:'skadon-warning'};
    return{teksti:dite+' dite',klasa:'skadon-ok'};
}
function dergoEmail(index){
    const o=ofertat[index];if(!o.email){alert('Klienti nuk ka email te regjistruar!');return;}
    const link='https://sigal-platform-shendet.vercel.app/pages/oferta-view.html?id='+index;
    const subject=encodeURIComponent('Ofertë nga SIGAL Insurance Group - '+o.emri);
    const body=encodeURIComponent('I nderuar '+o.emri+',\n\nJu dërgojmë ofertën tonë për sigurim shëndetësor.\n\nJu lutem klikoni linkun më poshtë për të parë paketën dhe për të konfirmuar zgjedhjen tuaj:\n\n'+link+'\n\nValiditeti: 30 ditë nga '+o.dataKrijimit+'\n\nMe respekt,\nSIGAL Insurance Group');
    window.open('mailto:'+o.email+'?subject='+subject+'&body='+body);
    ofertat[index].statusi=ofertat[index].statusi==='e_krijuar'?'e_derguar':ofertat[index].statusi;ruajNeStorage();
    try{fetch(TAPI+'/api/oferta-derguar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ofertaId:String(index)})});}catch(e){}
}
function krijoKontrate(index){
    if(!confirm('A jeni i sigurt qe doni te krijoni kontrate?\nOferta eshte pranuar?'))return;
    const o=ofertat[index];ofertat[index].realizuar=true;ofertat[index].statusi='kontrate';ruajNeStorage();
    localStorage.setItem('oferta_per_kontrate',JSON.stringify({emri:o.emri,lloji:o.lloji,email:o.email||'',pakot:o.pakot||[],ngaOferta:true}));
    window.location.href='kontratat.html?nga_oferta=true';
}
async function gjeneroWord(index){
    const o=ofertat[index];
    try{
        const pakotEmra=(o.pakot||[]).map(p=>{if(typeof p==='object'){const pl=o.lloji==='individ'?PAKOT.individ:PAKOT.familje_biznes;const f=pl.find(pk=>pk.id===p.id);return f?'Pako '+f.emri:p.id;}return p;});
        const r=await fetch(TAPI+'/api/gjenero-oferte',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({emri:o.emri,lloji:o.lloji==='familje'||o.lloji==='biznes'?'familje_biznes':o.lloji,pakot:pakotEmra})});
        const d=await r.json();if(d.success)window.open(TAPI+'/api/shkarko/'+d.fileName,'_blank');else alert('Gabim: '+d.error);
    }catch(err){alert('Serveri nuk eshte aktiv!');}
}
function kopjoLink(index){
    const link='https://sigal-platform-shendet.vercel.app/pages/oferta-view.html?id='+index;
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(link).then(()=>tregoToast('Linku u kopjua!')).catch(()=>kopjoFallback(link));
    else kopjoFallback(link);
    ofertat[index].statusi=ofertat[index].statusi==='e_krijuar'?'e_derguar':ofertat[index].statusi;ruajNeStorage();
    try{fetch(TAPI+'/api/oferta-derguar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ofertaId:String(index)})});}catch(e){}
}
function kopjoFallback(text){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');tregoToast('Linku u kopjua!');}catch(e){alert('Kopjimi dështoi.');}document.body.removeChild(ta);}
function tregoToast(msg){let t=document.getElementById('toast-msg');if(!t){t=document.createElement('div');t.id='toast-msg';t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#002B5C;color:white;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;opacity:0;transition:opacity 0.3s;';document.body.appendChild(t);}t.textContent=msg;t.style.opacity='1';setTimeout(()=>{t.style.opacity='0';},2000);}
function filtro(){renderTabela();}

function renderTabela(){
    const filterLloji=document.getElementById('filter-lloji').value;
    const filterStatusi=document.getElementById('filter-statusi').value;
    const search=document.getElementById('search-oferte').value.toLowerCase();
    const filterViti=document.getElementById('filter-viti')?document.getElementById('filter-viti').value:'all';
    const ofertatFiltruara=filtroSipasRolit(ofertat,'krijuarNga');
    const filtered=ofertatFiltruara.filter(o=>{
        const llojiOk=filterLloji==='all'||o.lloji===filterLloji;
        const statusi=llogaritStatus(o.dataSkadon);
        const statusOk=filterStatusi==='all'||statusi===filterStatusi;
        const searchOk=o.emri.toLowerCase().includes(search);
        const vitiOk=filterViti==='all'||(o.dataKrijimit||'').startsWith(filterViti);
        return llojiOk&&statusOk&&searchOk&&vitiOk;
    }).sort((a,b)=>{if(!a.dataSkadon)return 1;if(!b.dataSkadon)return-1;return new Date(a.dataSkadon)-new Date(b.dataSkadon);});

    document.getElementById('count-aktive').textContent=ofertatFiltruara.filter(o=>llogaritStatus(o.dataSkadon)==='aktive').length;
    document.getElementById('count-skaduar').textContent=ofertatFiltruara.filter(o=>llogaritStatus(o.dataSkadon)==='skaduar').length;
    document.getElementById('count-total').textContent=ofertat.length;
    document.getElementById('count-realizuara').textContent=ofertatFiltruara.filter(o=>o.realizuar).length;
    document.getElementById('count-individ').textContent=ofertatFiltruara.filter(o=>o.lloji==='individ').length;
    document.getElementById('count-familje').textContent=ofertatFiltruara.filter(o=>o.lloji==='familje').length;
    document.getElementById('count-biznes').textContent=ofertatFiltruara.filter(o=>o.lloji==='biznes').length;
    const rI=ofertatFiltruara.filter(o=>o.lloji==='individ'&&o.realizuar).length;
    const rF=ofertatFiltruara.filter(o=>o.lloji==='familje'&&o.realizuar).length;
    const rB=ofertatFiltruara.filter(o=>o.lloji==='biznes'&&o.realizuar).length;
    document.getElementById('count-individ-r').textContent=rI>0?rI+' realizuar':'';
    document.getElementById('count-familje-r').textContent=rF>0?rF+' realizuar':'';
    document.getElementById('count-biznes-r').textContent=rB>0?rB+' realizuar':'';

    const llojiLabels={'individ':'Individuale','familje':'Familjare','biznes':'Biznese'};
    const kerkuarLabels={'direkt':'Direkt','online':'Online','agjenti':'Agjenti'};
    const tbody=document.getElementById('ofertat-tbody');
    if(filtered.length===0){tbody.innerHTML='<tr><td colspan="9" style="text-align:center;padding:40px;color:#888;">Nuk ka oferta.</td></tr>';return;}

    tbody.innerHTML=filtered.map(o=>{
        const idx=ofertat.indexOf(o);const ditet=llogaritDitet(o.dataSkadon);
        const kerkuar=o.kerkuarNga==='agjenti'?'Agjenti: '+o.agjenti:(kerkuarLabels[o.kerkuarNga]||'-');
        const vCount=(o.versione||[]).length;
        const vBadge=vCount>0?' <span style="background:#e5e9f0;color:#002B5C;font-size:9px;padding:1px 5px;border-radius:8px;font-weight:700;">'+vCount+'v</span>':'';
        let dotColor='#22c55e';if(ditet.klasa==='skadon-warning')dotColor='#f59e0b';if(ditet.klasa==='skadon-expired')dotColor='#ef4444';
        const skadonHtml='<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:50%;background:'+dotColor+';flex-shrink:0"></span>'+ditet.teksti+'</span>';
        return'<tr><td>'+o.emri+vBadge+'</td><td><span class="badge-lloji '+o.lloji+'">'+(llojiLabels[o.lloji]||o.lloji)+'</span></td><td>'+((o.pakot||[]).map(p=>typeof p==='object'?p.emri||p.id:p).join(', ')||'-')+'</td><td>'+(o.krijuarNgaEmri||o.krijuarNga||'-')+'</td><td>'+kerkuar+'</td><td>'+(o.dataKrijimit||'-')+'</td><td>'+skadonHtml+'</td><td>'+trackBadge(getTrackStatus(o))+'</td><td><div class="action-btns"><button class="btn-edit" onclick="editoOferte('+idx+')" title="Edito"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button><button class="btn-word" onclick="gjeneroWord('+idx+')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg> Word</button><button class="btn-email" onclick="dergoEmail('+idx+')" title="Email"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></button><button class="btn-kontrate" onclick="krijoKontrate('+idx+')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg> Kontrate</button><button class="btn-delete" onclick="fshijOferte('+idx+')" title="Fshi"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button><button class="btn-link" onclick="kopjoLink('+idx+')" title="Kopjo Link"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button></div></td></tr>';
    }).join('');
}

document.addEventListener('DOMContentLoaded',renderTabela);