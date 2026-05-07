let ofertat = JSON.parse(localStorage.getItem('ofertat')) || [];
let editIndex = -1;

const TAPI='https://sigal-platform.onrender.com';
const STATUSET_TRACK={
    e_krijuar:   {label:'E krijuar',     cls:'e_krijuar'},
    e_derguar:   {label:'E dërguar',     cls:'e_derguar'},
    e_pare:      {label:'E parë',        cls:'e_pare'},
    e_konfirmuar:{label:'Konfirmuar ✓',  cls:'e_konfirmuar'},
    kontrate:    {label:'Kontratë',      cls:'kontrate'}
};
function getTrackStatus(o){if(o.realizuar)return'kontrate';if(o.konfirmuar)return'e_konfirmuar';if(o.statusi)return o.statusi;return'e_krijuar';}
function trackBadge(statusi){
    const s=STATUSET_TRACK[statusi]||STATUSET_TRACK.e_krijuar;
    return '<span class="track-badge '+s.cls+'">'+s.label+'</span>';
}
function ruajNeStorage(){localStorage.setItem('ofertat',JSON.stringify(ofertat));}

function shtoOferte(){
    editIndex=-1;
    const mt=document.getElementById('modal-title');
    if(mt) mt.innerHTML='Ofertë <span style="font-weight:500">e Re</span>';
    document.getElementById('m-emri').value='';
    document.getElementById('m-email').value='';
    document.getElementById('m-kerkuar-nga').value='direkt';
    document.getElementById('m-agjenti').value='';
    document.getElementById('field-agjenti').style.display='none';
    const vp=document.getElementById('version-panel');
    if(vp) vp.style.display='none';
    const oldBanner=document.getElementById('konfirmim-banner');
    if(oldBanner)oldBanner.remove();
    const tb=document.getElementById('tracking-bar');if(tb)tb.remove();
    spSelectedPakot.clear();
    spFoldOpen=false;
    spLocked=false;
    spCustomValues=null;
    zgjidhLlojin('individ',document.querySelectorAll('.drawer-lloji-btn')[0]);
    document.getElementById('drawer-overlay').classList.add('active');
}
function mbyllDrawer(){document.getElementById('drawer-overlay').classList.remove('active');}
function mbyllModal(){mbyllDrawer();}
function tregoBoxAgjenti(){document.getElementById('field-agjenti').style.display=document.getElementById('m-kerkuar-nga').value==='agjenti'?'block':'none';}

// ====== SPREADSHEET ======
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
let spLocked=false;
let spCustomValues=null;

function zgjidhLlojin(lloji,btn){
    document.getElementById('m-lloji').value=lloji;
    document.querySelectorAll('.drawer-lloji-btn').forEach(b=>b.classList.remove('active'));
    if(btn) btn.classList.add('active');
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
    if(!container) return;
    const colCount=pakotList.length+1;

    let h='<div class="sp-container">';

    h+='<div class="sp-toolbar"><div class="sp-toolbar-left">';
    if(!spLocked){
        h+='<label class="sp-select-all"><input type="checkbox" id="sp-sel-all" onchange="spToggleAll(this.checked)"> Selekto të gjitha</label>';
    }
    h+='</div><span class="sp-hint">'+(spLocked?'🔒 Kyçur':'Kliko çelulën për edit')+'</span></div>';

    h+='<div class="sp-table-wrap"><table class="sp-table"><thead><tr>';
    h+='<td></td>';
    pakotList.forEach(p=>{
        const sel=spSelectedPakot.has(p.id);
        h+='<td><div class="sp-pako-hdr'+(sel?' selected':'')+'"'+(spLocked?'':' onclick="spTogglePako(\''+p.id+'\')"')+'>';
        h+='<div class="sp-ph-name">';
        if(!spLocked) h+='<input type="checkbox" '+(sel?'checked':'')+' onclick="event.stopPropagation();spTogglePako(\''+p.id+'\')">';
        else if(sel) h+='<span style="color:#22c55e;font-weight:700;margin-right:4px;">✓</span>';
        h+=' '+p.emri+'</div>';
        h+='<div class="sp-ph-shuma">€ '+p.shuma+'</div>';
        h+='</div></td>';
    });
    h+='</tr></thead><tbody>';

    const cellClick=spLocked?'':'onclick="spEditCell(this)"';

    h+='<tr><td>Zona</td>';
    pakotList.forEach(p=>{
        const sel=spSelectedPakot.has(p.id);
        const cls=sel?'sp-cell':'sp-cell unselected';
        h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="zona" '+cellClick+'>'+p.zona+'</td>';
    });
    h+='</tr>';

    h+='<tr><td>Shuma</td>';
    pakotList.forEach(p=>{
        const sel=spSelectedPakot.has(p.id);
        const cls=sel?'sp-cell':'sp-cell unselected';
        h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="shuma" '+cellClick+'>'+p.shuma+'</td>';
    });
    h+='</tr>';

    h+='<tr class="sp-section-row"><td colspan="'+colCount+'">Hospitalore</td></tr>';
    h+='<tr><td>Mbulimi</td>';
    pakotList.forEach(p=>{
        const sel=spSelectedPakot.has(p.id);
        const cls=sel?'sp-cell':'sp-cell unselected';
        h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="hospitalore" '+cellClick+'>'+p.hospitalore+'</td>';
    });
    h+='</tr>';

    h+='<tr class="sp-section-row"><td colspan="'+colCount+'">Ambulantore</td></tr>';
    h+='<tr><td>Mbulimi</td>';
    pakotList.forEach(p=>{
        const sel=spSelectedPakot.has(p.id);
        const val=p.ambulantore||'—';
        const cls=sel?'sp-cell':'sp-cell unselected';
        h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="ambulantore" '+cellClick+'>'+val+'</td>';
    });
    h+='</tr>';

    h+='<tr class="sp-fold-row" onclick="spToggleFold()"><td colspan="'+colCount+'"><span class="sp-fold-arrow'+(spFoldOpen?' open':'')+'">▸</span> Trajtime tjera ('+SP_TJERA_LABELS.length+')</td></tr>';

    if(spFoldOpen){
        SP_TJERA_LABELS.forEach(t=>{
            h+='<tr><td>'+t.label+'</td>';
            pakotList.forEach(p=>{
                const sel=spSelectedPakot.has(p.id);
                let val='—';
                if(p.tjera_pikat&&p.tjera_pikat[t.idx]){
                    val=p.tjera_pikat[t.idx].vlera||'—';
                }
                const isEmpty=val==='—'||val==='Nuk mbulohet';
                const cls=sel?(isEmpty?'sp-cell empty':'sp-cell'):'sp-cell unselected';
                const display=val==='Nuk mbulohet'?'—':val;
                h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="tjera_'+t.idx+'" '+cellClick+'>'+display+'</td>';
            });
            h+='</tr>';
        });
    }

    h+='<tr class="sp-primi-row"><td>Primi</td>';
    pakotList.forEach(p=>{
        const sel=spSelectedPakot.has(p.id);
        const suffix=eshteIndivid?'/vit':'/muaj';
        const cls=sel?'sp-cell':'sp-cell unselected';
        h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="primi_madh" '+cellClick+'>€ '+p.primi_madh+suffix+'</td>';
    });
    h+='</tr>';

    if(!eshteIndivid){
        h+='<tr><td style="color:#6b7a8d;font-size:10px;border-right:1px solid #e5e9f0;background:#fafbfc;">Primi fëmijë</td>';
        pakotList.forEach(p=>{
            const sel=spSelectedPakot.has(p.id);
            const val=p.primi_femije||'';
            const cls=sel?(val?'sp-cell':'sp-cell empty'):'sp-cell unselected';
            h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="primi_femije" '+cellClick+'>'+(val?'€ '+val+'/muaj':'—')+'</td>';
        });
        h+='</tr>';
    }

    h+='</tbody></table></div></div>';
    container.innerHTML=h;
    spUpdateSelectAll();
    if(spLocked&&spCustomValues)setTimeout(()=>{applyCustomValues();},10);
}

function spTogglePako(id){
    if(spLocked)return;
    if(spSelectedPakot.has(id))spSelectedPakot.delete(id);
    else spSelectedPakot.add(id);
    renderSpreadsheet();
}
function spToggleAll(checked){
    if(spLocked)return;
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

function spZhblloko(){
    if(!confirm('Zhblloko spreadsheet-in për editim?\nKjo lejon ndryshime në ofertën e konfirmuar.'))return;
    spLocked=false;
    renderSpreadsheet();
}

function spEditCell(td){
    if(spLocked)return;
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
    if(body) body.style.display=historyOpen?'block':'none';
    if(arrow) arrow.textContent=historyOpen?'▾':'▸';
}
function renderVersions(versione,oferta){
    if(!versione||versione.length===0)return;
    const body=document.getElementById('version-body');
    if(!body) return;
    const agjentVersione=versione.filter(v=>v.burim!=='konfirmim_klient');
    const vcEl=document.getElementById('version-count');
    if(vcEl) vcEl.textContent=agjentVersione.length;
    const hlEl=document.getElementById('history-label');
    if(hlEl) hlEl.textContent='Historiku i ofertës';
    if(agjentVersione.length===0){body.innerHTML='<div style="padding:10px 14px;font-size:11px;color:var(--s-text-faint);">Nuk ka versione të mëparshme.</div>';return;}

    body.innerHTML=agjentVersione.map((v,i)=>{
        const origIdx=versione.indexOf(v);
        const pakotTxt=(v.pakot||[]).map(p=>typeof p==='object'?(p.emri||p.id):p).join(', ');
        const burimBadge='<span style="background:#dbeafe;color:var(--s-brand-dark);font-size:8px;padding:1px 6px;border-radius:8px;font-weight:700;margin-left:6px;">Agjent</span>';

        let detaje='';
        (v.pakot||[]).forEach(p=>{
            if(typeof p!=='object')return;
            const emri=p.emri||p.id||'?';
            let rows='';
            if(p.zona) rows+='<tr><td>Zona</td><td>'+p.zona+'</td></tr>';
            if(p.shuma) rows+='<tr><td>Shuma</td><td>€ '+p.shuma+'</td></tr>';
            if(p.hospitalore) rows+='<tr><td>Hospitalore</td><td>'+p.hospitalore+'</td></tr>';
            const ambVal=p.ambulantore||p.ambulatore;
            if(ambVal) rows+='<tr><td>Ambulantore</td><td>'+ambVal+'</td></tr>';
            const tjeraLabels=['Shtatzënia','Dentar','Optik','Dëgim','Psikiatrik','Fizioterapi','Autoambulanca','Aksidenti','Onkologjike'];
            tjeraLabels.forEach((lbl,idx)=>{
                const key='tjera_'+idx;
                if(p[key]&&p[key]!=='—') rows+='<tr><td>'+lbl+'</td><td>'+p[key]+'</td></tr>';
            });
            const oldKeys=[{k:'shtatzania',l:'Shtatzënia'},{k:'dentar',l:'Dentar'},{k:'optik',l:'Optik'},{k:'degim',l:'Dëgim'},{k:'psikiatrik',l:'Psikiatrik'},{k:'fizioterapi',l:'Fizioterapi'},{k:'autoambulanca',l:'Autoambulanca'},{k:'aksidentit',l:'Aksidenti'},{k:'onkologjike',l:'Onkologjike'}];
            oldKeys.forEach(ok=>{
                if(p[ok.k]&&p[ok.k]!=='-'&&p[ok.k]!=='—') rows+='<tr><td>'+ok.l+'</td><td>'+p[ok.k]+'</td></tr>';
            });
            if(p.tjera_pikat&&Array.isArray(p.tjera_pikat)){
                p.tjera_pikat.forEach((tp,idx)=>{
                    if(tp&&typeof tp==='object'&&tp.vlera&&tp.vlera!=='Nuk mbulohet'&&tp.vlera!=='—'){
                        const lbl=tjeraLabels[idx]||('Tjera '+idx);
                        if(!p['tjera_'+idx]) rows+='<tr><td>'+lbl+'</td><td>'+tp.vlera+'</td></tr>';
                    }
                });
            }
            if(p.primi_madh) rows+='<tr><td>Primi</td><td>€ '+p.primi_madh+'</td></tr>';
            if(p.primi_femije) rows+='<tr><td>Primi fëmijë</td><td>€ '+p.primi_femije+'</td></tr>';

            if(rows){
                detaje+='<div style="margin:6px 0;"><div style="font-size:11px;font-weight:700;color:var(--s-brand-dark);padding:4px 0;border-bottom:1px solid var(--s-border-light);">'+emri+'</div>';
                detaje+='<table style="width:100%;font-size:11px;border-collapse:collapse;">'+rows+'</table></div>';
            }
        });

        return '<div style="border:1px solid var(--s-border-light);border-radius:6px;margin:8px 14px;overflow:hidden;">'+
            '<div style="display:flex;align-items:center;padding:8px 12px;cursor:pointer;background:rgba(240,246,255,0.5);" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display===\'none\'?\'block\':\'none\'">'+
                '<span style="width:8px;height:8px;border-radius:50%;background:var(--s-brand-dark);margin-right:8px;flex-shrink:0;"></span>'+
                '<span style="font-size:11px;color:var(--s-text-muted);min-width:80px;">'+(v.data||'-')+'</span>'+
                burimBadge+
                '<span style="font-size:11px;font-weight:600;color:var(--s-text);flex:1;margin-left:6px;">'+pakotTxt+'</span>'+
                '<span style="font-size:10px;color:var(--s-brand-dark);margin-right:8px;">Detajet ▾</span>'+
                '<button style="font-size:10px;padding:4px 11px;border:1px solid var(--s-border);border-radius:6px;background:white;cursor:pointer;color:var(--s-brand-dark);font-weight:600;" onclick="event.stopPropagation();riktheVersion('+origIdx+')">Rikthe</button>'+
            '</div>'+
            '<div style="display:none;padding:10px 12px;border-top:1px solid var(--s-border-light);background:white;">'+
                (v.koment?'<div style="font-size:10px;color:var(--s-text-muted);margin-bottom:6px;font-style:italic;">💬 '+v.koment+'</div>':'')+
                (detaje||'<div style="font-size:11px;color:var(--s-text-faint);">Pa detaje</div>')+
            '</div>'+
        '</div>';
    }).reverse().join('');
}
function riktheVersion(vIdx){
    if(editIndex<0)return;
    const o=ofertat[editIndex],v=o.versione[vIdx];
    if(!v||!confirm('Rikthe versionin e dates '+(v.data||'?')+'?'))return;
    spLocked=false;
    const btns=document.querySelectorAll('.drawer-lloji-btn');
    const llojiMap={'individ':0,'familje':1,'biznes':2};
    spSelectedPakot.clear();
    (v.pakot||[]).forEach(p=>spSelectedPakot.add(typeof p==='object'?p.id:p));
    zgjidhLlojin(v.lloji||o.lloji,btns[llojiMap[v.lloji||o.lloji]||0]);
    setTimeout(()=>{applyCustomValues(v.pakot||[]);},50);
}

function applyCustomValues(pakotArr){
    if(pakotArr)spCustomValues=pakotArr;
    if(!spCustomValues)return;
    const lloji=document.getElementById('m-lloji').value;
    spCustomValues.forEach(p=>{
        if(typeof p!=='object')return;
        if(p.tjera_pikat&&Array.isArray(p.tjera_pikat))p.tjera_pikat.forEach((tp,idx)=>{if(tp&&tp.vlera&&!p['tjera_'+idx])p['tjera_'+idx]=tp.vlera;});
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
    if(spLocked){alert('Oferta është e kyçur. Zhbllokoni para se të ruani.');return;}
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
        oferta.realizuar=false;oferta.statusi='e_krijuar';
        oferta.versione=[{
            data:oferta.dataKrijimit,
            lloji:oferta.lloji,
            pakot:pakotAktuale,
            emri:oferta.emri,
            burim:'krijim_fillestar'
        }];
        ofertat.push(oferta);
    }
    ruajNeStorage();mbyllDrawer();renderTabela();
}

// ====== EDITO ======
function editoOferte(index){
    editIndex=index;
    const o=ofertat[index];
    if(o.notification&&!o.notification.lexuar){
        ofertat[index].notification.lexuar=true;
        ruajNeStorage();
        renderTabela();
    }
    const mt=document.getElementById('modal-title');
    if(mt) mt.innerHTML='Edito <span style="font-weight:500">Ofertën</span>';
    document.getElementById('m-emri').value=o.emri;
    document.getElementById('m-email').value=o.email||'';
    document.getElementById('m-kerkuar-nga').value=o.kerkuarNga||'direkt';
    document.getElementById('m-agjenti').value=o.agjenti||'';
    tregoBoxAgjenti();

    spLocked=!!o.konfirmuar;

    const oldBanner=document.getElementById('konfirmim-banner');
    if(oldBanner)oldBanner.remove();
    if(o.konfirmuar){
        const bannerHTML='<div id="konfirmim-banner">'
            +'<div style="display:flex;align-items:center;gap:10px;">'
            +'<span style="font-size:18px;">✅</span>'
            +'<div><div style="font-size:12px;font-weight:700;color:#166534;">Klienti konfirmoi'+(o.pakaZgjedhur?' — '+o.pakaZgjedhur:'')+'</div>'
            +'<div style="font-size:10px;color:#15803d;">'+(o.dataKonfirmimit||'')+(o.komentKlient?' · 💬 '+o.komentKlient:'')+'</div></div>'
            +'</div>'
            +'<button onclick="spZhblloko()" style="font-size:10.5px;padding:6px 14px;border:1px solid rgba(16,185,129,0.4);border-radius:8px;background:white;cursor:pointer;color:#166534;font-weight:700;white-space:nowrap;">🔓 Zhblloko</button>'
            +'</div>';
        const modalTitle=document.getElementById('modal-title');
        if(modalTitle&&modalTitle.parentElement){
            modalTitle.parentElement.insertAdjacentHTML('afterend',bannerHTML);
        }
    }

    const btns=document.querySelectorAll('.drawer-lloji-btn');
    const llojiMap={'individ':0,'familje':1,'biznes':2};
    spSelectedPakot.clear();

    let pakotPerSpreadsheet=o.pakot||[];
    if(o.konfirmuar&&o.versione&&o.versione.length>0){
        const vKlient=[...o.versione].reverse().find(v=>v.burim==='konfirmim_klient');
        if(vKlient&&vKlient.pakot) pakotPerSpreadsheet=vKlient.pakot;
    }

    pakotPerSpreadsheet.forEach(p=>spSelectedPakot.add(typeof p==='object'?p.id:p));
    spFoldOpen=false;
    zgjidhLlojin(o.lloji,btns[llojiMap[o.lloji]||0]);
    setTimeout(()=>{applyCustomValues(pakotPerSpreadsheet);},80);

    const vPanel=document.getElementById('version-panel');
    historyOpen=false;
    const vb=document.getElementById('version-body');
    if(vb) vb.style.display='none';
    const ha=document.getElementById('history-arrow');if(ha)ha.textContent='▸';
    const hasVersione=(o.versione||[]).length>0;
    if(hasVersione){ if(vPanel) vPanel.style.display='block'; renderVersions(o.versione,o);}
    else{ if(vPanel) vPanel.style.display='none';}
    document.getElementById('drawer-overlay').classList.add('active');
}

function fshijOferte(index){if(confirm('A jeni i sigurt qe doni te fshini kete oferte?')){ofertat.splice(index,1);ruajNeStorage();renderTabela();}}
function llogaritStatus(dataSkadon){if(!dataSkadon)return'aktive';return new Date()>new Date(dataSkadon)?'skaduar':'aktive';}
function llogaritDitet(dataSkadon){
    if(!dataSkadon)return{teksti:'-',cls:''};
    const dite=Math.ceil((new Date(dataSkadon)-new Date())/(1000*60*60*24));
    if(dite<0)return{teksti:'Skaduar',cls:'red'};
    if(dite<=7)return{teksti:dite+'d',cls:'orange'};
    return{teksti:dite+'d',cls:'green'};
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
    let pakotPerKontrate=o.pakot||[];
    if(o.konfirmuar&&o.versione){
        const vK=[...o.versione].reverse().find(v=>v.burim==='konfirmim_klient');
        if(vK&&vK.pakot) pakotPerKontrate=vK.pakot;
    }
    const pakotEmra=pakotPerKontrate.map(p=>typeof p==='object'?'Pako '+(p.emri||p.id):p);
    const pakotFixed=pakotPerKontrate.map(p=>{if(typeof p!=='object')return p;const f={...p};if(p.tjera_pikat&&Array.isArray(p.tjera_pikat))p.tjera_pikat.forEach((tp,idx)=>{if(tp&&tp.vlera&&!f['tjera_'+idx])f['tjera_'+idx]=tp.vlera;});return f;});
    localStorage.setItem('oferta_per_kontrate',JSON.stringify({emri:o.emri,lloji:o.lloji,email:o.email||'',pakot:pakotFixed,pakotEmra:pakotEmra,ngaOferta:true}));
    window.location.href='kontratat.html?nga_oferta=true';
}
async function gjeneroWord(index){
    const o=ofertat[index];
    try{
        let pakotEmra=(o.pakot||[]).map(p=>{if(typeof p==='object'){const pl=o.lloji==='individ'?PAKOT.individ:PAKOT.familje_biznes;const f=pl.find(pk=>pk.id===p.id);return f?'Pako '+f.emri:p.id;}return p;});
        let pakotData=[];
        if(o.versione){const konfV=[...o.versione].reverse().find(v=>v.burim==='konfirmim_klient');if(konfV&&konfV.pakot){pakotData=konfV.pakot.filter(p=>typeof p==='object').map(p=>{const pl=o.lloji==='individ'?PAKOT.individ:PAKOT.familje_biznes;const f=pl.find(pk=>pk.id===p.id);const out={...p};if(f)out.emri=f.emri;if(p.tjera_pikat&&Array.isArray(p.tjera_pikat))p.tjera_pikat.forEach((tp,idx)=>{if(tp&&tp.vlera&&!out['tjera_'+idx])out['tjera_'+idx]=tp.vlera;});return out;});pakotEmra=pakotData.map(p=>'Pako '+(p.emri||p.id));}}
        const r=await fetch(TAPI+'/api/gjenero-oferte',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({emri:o.emri,lloji:o.lloji==='familje'||o.lloji==='biznes'?'familje_biznes':o.lloji,pakot:pakotEmra,pakotData:pakotData})});
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
function tregoToast(msg){
    let t=document.getElementById('toast-msg');
    if(!t){
        t=document.createElement('div');
        t.id='toast-msg';
        t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:white;padding:11px 24px;border-radius:10px;font-size:12.5px;font-weight:700;z-index:9999;opacity:0;transition:opacity 0.3s;box-shadow:0 10px 28px rgba(30,58,138,0.35);';
        document.body.appendChild(t);
    }
    t.textContent=msg;
    t.style.opacity='1';
    setTimeout(()=>{t.style.opacity='0';},2000);
}
function filtro(){renderTabela();}
function toggleLloji(ll){
    const sel=document.getElementById('filter-lloji');
    sel.value=(sel.value===ll)?'all':ll;
    filtro();
}

// ====== TABS, SORT, PERIOD ======
let activeTab='aktive';
let activeSort='skadon';

function ndryshoTab(tab){
    activeTab=tab;
    document.getElementById('tab-aktive').classList.toggle('active',tab==='aktive');
    document.getElementById('tab-skaduar').classList.toggle('active',tab==='skaduar');
    renderTabela();
}
function ndryshoSort(sort){
    activeSort=sort;
    document.getElementById('sort-skadon').classList.toggle('active',sort==='skadon');
    document.getElementById('sort-re').classList.toggle('active',sort==='re');
    renderTabela();
}
function ndryshoViti(){
    const viti=document.getElementById('filter-viti').value;
    const now=new Date();
    if(parseInt(viti)===now.getFullYear()){
        document.getElementById('filter-muaji').value=String(now.getMonth()+1).padStart(2,'0');
    } else {
        document.getElementById('filter-muaji').value='all';
    }
}

function eshteSkaduar(o){
    if(!o.dataSkadon)return false;
    const st=getTrackStatus(o);
    if(st==='e_konfirmuar'||st==='kontrate')return false;
    return new Date()>new Date(o.dataSkadon);
}

function renderTabela(){
    const filterLloji=document.getElementById('filter-lloji').value;
    const filterStatusi=document.getElementById('filter-statusi')?document.getElementById('filter-statusi').value:'all';
    const search=document.getElementById('search-oferte').value.toLowerCase();
    const filterViti=document.getElementById('filter-viti').value;
    const filterMuaji=document.getElementById('filter-muaji').value;
    const ofertatRolit=typeof filtroSipasRolit==='function'?filtroSipasRolit(ofertat,'krijuarNga'):ofertat;

    const perioda=ofertatRolit.filter(o=>{
        const dk=o.dataKrijimit||'';
        if(!dk.startsWith(filterViti))return false;
        if(filterMuaji!=='all'){
            const muaji=dk.substring(5,7);
            if(muaji!==filterMuaji)return false;
        }
        return true;
    });

    const aktive=perioda.filter(o=>!eshteSkaduar(o));
    const skaduar=perioda.filter(o=>eshteSkaduar(o));

    document.getElementById('tab-count-aktive').textContent=aktive.length;
    document.getElementById('tab-count-skaduar').textContent=skaduar.length;

    const bazaList=activeTab==='aktive'?aktive:skaduar;

    const filtered=bazaList.filter(o=>{
        const llojiOk=filterLloji==='all'||o.lloji===filterLloji;
        const st=getTrackStatus(o);
        let statusOk=true;
        // Support për KPI group "presin"
        if(window.__ofertaKpiGroup==='presin'){
            statusOk=(st==='e_krijuar'||st==='e_derguar'||st==='e_pare');
        } else {
            statusOk=filterStatusi==='all'||st===filterStatusi;
        }
        const searchOk=o.emri.toLowerCase().includes(search);
        return llojiOk&&statusOk&&searchOk;
    });

    const sorted=[...filtered].sort((a,b)=>{
        if(activeSort==='re'){
            return(b.dataKrijimit||'').localeCompare(a.dataKrijimit||'');
        }
        if(!a.dataSkadon)return 1;
        if(!b.dataSkadon)return-1;
        return new Date(a.dataSkadon)-new Date(b.dataSkadon);
    });

    // ====== STATS — KPI cards ======
    const stTotal=aktive.length;
    const stPresin=aktive.filter(o=>{const s=getTrackStatus(o);return s==='e_derguar'||s==='e_pare'||s==='e_krijuar';}).length;
    const stKonfirmuar=aktive.filter(o=>getTrackStatus(o)==='e_konfirmuar').length;
    const stRealizuar=aktive.filter(o=>getTrackStatus(o)==='kontrate').length;

    const setText=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val;};
    setText('st-total',stTotal);
    setText('st-presin',stPresin);
    setText('st-konfirmuar',stKonfirmuar);
    setText('st-realizuar',stRealizuar);

    // Llojet chips MAJTAS (clickable, filtron sipas lloji)
    const llojetCounts={};
    ['individ','familje','biznes'].forEach(ll=>{
        llojetCounts[ll]=aktive.filter(o=>o.lloji===ll).length;
    });
    const llojiNames={individ:'Individ',familje:'Familje',biznes:'Biznes'};
    const activeL=filterLloji;
    const chipsEl=document.getElementById('llojet-chips');
    if(chipsEl){
        chipsEl.innerHTML=['individ','familje','biznes'].map(ll=>{
            const isActive=activeL===ll?' active':'';
            return '<span class="ll-chip '+ll+isActive+'" onclick="toggleLloji(\''+ll+'\')"><span class="ll-num">'+llojetCounts[ll]+'</span> '+llojiNames[ll]+'</span>';
        }).join('');
    }

    // ====== TABELA ======
    const llojiLabels={'individ':'Individuale','familje':'Familjare','biznes':'Biznese'};
    const llojiTagCls={'individ':'tag-individ','familje':'tag-familje','biznes':'tag-biznes'};
    const tbody=document.getElementById('ofertat-tbody');
    if(!tbody) return;

    // Populo filtrin "Krijuar nga"
    const krijuarSet=new Set();
    ofertatRolit.forEach(o=>{if(o.krijuarNgaEmri||o.krijuarNga)krijuarSet.add(o.krijuarNgaEmri||o.krijuarNga);});
    const krijuarEl=document.getElementById('filter-krijuar');
    const krijuarVal=krijuarEl?krijuarEl.value:'all';
    if(krijuarEl) krijuarEl.innerHTML='<option value="all">Të gjithë agjentët</option>'+[...krijuarSet].map(k=>'<option value="'+k+'"'+(k===krijuarVal?' selected':'')+'>'+k+'</option>').join('');

    const filterKrijuar=krijuarEl?krijuarEl.value:'all';
    const sortedFinal=sorted.filter(o=>{
        if(filterKrijuar==='all')return true;
        return(o.krijuarNgaEmri||o.krijuarNga)===filterKrijuar;
    });

    if(sortedFinal.length===0){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--s-text-faint);">Nuk ka oferta që përputhen.</td></tr>';return;}

    tbody.innerHTML=sortedFinal.map(o=>{
        const idx=ofertat.indexOf(o);
        const ditet=llogaritDitet(o.dataSkadon);
        const st=getTrackStatus(o);
        const kerkuar=o.kerkuarNga==='agjenti'?(o.agjenti||''):'';
        const kerkuarTxt=kerkuar||((o.kerkuarNga==='direkt')?'Direkt':(o.kerkuarNga==='online'?'Online':''));
        const vCount=(o.versione||[]).length;
        const vBadge=vCount>0?' <span class="version-badge">'+vCount+'v</span>':'';
        const notifDot=(o.notification&&!o.notification.lexuar)?' <span class="notif-dot"></span>':'';
        const pakotArr=(o.pakot||[]).map(p=>typeof p==='object'?(p.emri||p.id):p);
        let pakotTxt='-';
        if(pakotArr.length<=2)pakotTxt=pakotArr.join(', ');
        else pakotTxt=pakotArr.slice(0,2).join(', ')+' <span class="pakot-more">+'+(pakotArr.length-2)+'</span>';

        const llojiCls=llojiTagCls[o.lloji]||'';
        const showKontrate=st==='e_konfirmuar';

        return '<tr>'+
            '<td><div class="klient-name">'+o.emri+vBadge+notifDot+'</div><div class="klient-sub">'+kerkuarTxt+'</div></td>'+
            '<td><span class="badge-lloji '+llojiCls+'">'+(llojiLabels[o.lloji]||o.lloji)+'</span></td>'+
            '<td><span class="pakot-cell">'+pakotTxt+'</span></td>'+
            '<td><span class="skadon-cell '+ditet.cls+'"><span class="skadon-dot"></span>'+ditet.teksti+'</span></td>'+
            '<td>'+trackBadge(st)+'</td>'+
            '<td style="text-align:right;"><div class="action-icon-btns" style="justify-content:flex-end;">'+
                (showKontrate?'<button class="btn-kontrate-text" onclick="krijoKontrate('+idx+')" title="Kontratë"><i data-lucide="file-check"></i> Kontratë</button>':'')+
                '<button onclick="editoOferte('+idx+')" title="Modifiko"><i data-lucide="pencil"></i></button>'+
                '<button class="btn-word" onclick="gjeneroWord('+idx+')" title="Word"><i data-lucide="file-text"></i> Word</button>'+
                '<button onclick="dergoEmail('+idx+')" title="Email"><i data-lucide="mail"></i></button>'+
                '<button onclick="kopjoLink('+idx+')" title="Kopjo"><i data-lucide="link"></i></button>'+
                '<button onclick="fshijOferte('+idx+')" title="Fshi"><i data-lucide="trash-2"></i></button>'+
            '</div></td>'+
        '</tr>';
    }).join('');

    if(window.lucide) lucide.createIcons();
}

document.addEventListener('DOMContentLoaded',function(){
    renderTabela();
});