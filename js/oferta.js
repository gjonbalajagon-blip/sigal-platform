let ofertat = JSON.parse(localStorage.getItem('ofertat')) || [];
let editIndex = -1;

// ====== TRACKING STATUSET ======
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

// ====== MODAL ======
function shtoOferte(){
    editIndex=-1;
    document.getElementById('modal-title').textContent='Ofertë e Re';
    document.getElementById('m-emri').value='';
    document.getElementById('m-email').value='';
    document.getElementById('m-kerkuar-nga').value='direkt';
    document.getElementById('m-agjenti').value='';
    document.getElementById('field-agjenti').style.display='none';
    document.getElementById('version-panel').style.display='none';
    zgjidhLlojin('individ',document.querySelectorAll('.drawer-lloji-btn')[0]);
    document.getElementById('drawer-overlay').classList.add('active');
}
function mbyllDrawer(){document.getElementById('drawer-overlay').classList.remove('active');}
function mbyllModal(){mbyllDrawer();}
function tregoBoxAgjenti(){document.getElementById('field-agjenti').style.display=document.getElementById('m-kerkuar-nga').value==='agjenti'?'block':'none';}

// ====== SPREADSHEET PAKO EDITOR ======
const SP_FIELDS=[
    {section:'info',rows:[{key:'zona',label:'Zona'},{key:'shuma',label:'Shuma'}]},
    {section:'Hospitalore',rows:[{key:'hospitalore',label:'Mbulimi'}]},
    {section:'Ambulantore',rows:[{key:'ambulatore',label:'Mbulimi'}]},
    {section:'Trajtime tjera',foldable:true,rows:[
        {key:'shtatzania',label:'Shtatzënia'},{key:'dentar',label:'Dentar'},
        {key:'optik',label:'Optik'},{key:'degim',label:'Dëgim'},
        {key:'psikiatrik',label:'Psikiatrik'},{key:'fizioterapi',label:'Fizioterapi'},
        {key:'autoambulanca',label:'Autoambulanca'},{key:'aksidentit',label:'Aksidenti'},
        {key:'onkologjike',label:'Onkologjike'}
    ]}
];
let spSelectedPakot=new Set();
let spFoldOpen=false;

function zgjidhLlojin(lloji,btn){
    document.getElementById('m-lloji').value=lloji;
    document.querySelectorAll('.drawer-lloji-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    spSelectedPakot.clear();
    spFoldOpen=false;
    renderSpreadsheet();
}

function renderSpreadsheet(){
    const lloji=document.getElementById('m-lloji').value;
    const pakotList=lloji==='individ'?PAKOT.individ:PAKOT.familje_biznes;
    const eshteIndivid=lloji==='individ';
    const container=document.getElementById('pakot-container');

    // Ndaj 3+3
    const half=Math.ceil(pakotList.length/2);
    const grup1=pakotList.slice(0,half);
    const grup2=pakotList.slice(half);

    let h='<div class="sp-container">';
    h+='<div class="sp-toolbar"><div class="sp-toolbar-left">';
    h+='<label class="sp-select-all"><input type="checkbox" id="sp-sel-all" onchange="spToggleAll(this.checked)"> Selekto të gjitha</label>';
    h+='</div><span class="sp-hint">Kliko çelulën për edit</span></div>';

    // Grup 1
    if(pakotList.length>3) h+='<div class="sp-group-label">Grupi 1</div>';
    h+=spTableHTML(grup1,eshteIndivid,'g1');

    // Grup 2
    if(grup2.length>0){
        h+='<div class="sp-group-label" style="margin-top:10px;">Grupi 2</div>';
        h+=spTableHTML(grup2,eshteIndivid,'g2');
    }
    h+='</div>';
    container.innerHTML=h;
    spUpdateSelectAll();
}

function spTableHTML(pakot,eshteIndivid,prefix){
    const colW=Math.floor(85/pakot.length);
    let h='<div class="sp-table-wrap"><table class="sp-table"><thead><tr>';
    h+='<td></td>';
    pakot.forEach(p=>{
        const sel=spSelectedPakot.has(p.id);
        h+='<td><div class="sp-pako-hdr'+(sel?' selected':'')+'" onclick="spTogglePako(\''+p.id+'\')">';
        h+='<div class="sp-ph-name"><input type="checkbox" '+(sel?'checked':'')+' onclick="event.stopPropagation();spTogglePako(\''+p.id+'\')"> '+p.emri+'</div>';
        h+='<div class="sp-ph-shuma">€ '+p.shuma+'</div>';
        h+='</div></td>';
    });
    h+='</tr></thead><tbody>';

    SP_FIELDS.forEach(sec=>{
        if(sec.section==='info'){
            // Nuk ka header për info
        }else if(sec.foldable){
            h+='<tr class="sp-fold-row" onclick="spToggleFold()"><td colspan="'+(pakot.length+1)+'"><span class="sp-fold-arrow'+(spFoldOpen?' open':'')+'">▸</span> '+sec.section+' ('+sec.rows.length+')</td></tr>';
        }else{
            h+='<tr class="sp-section-row"><td colspan="'+(pakot.length+1)+'">'+sec.section+'</td></tr>';
        }

        const shouldShow=sec.foldable?spFoldOpen:true;
        sec.rows.forEach(r=>{
            if(sec.foldable&&!shouldShow)return;
            h+='<tr><td>'+r.label+'</td>';
            pakot.forEach(p=>{
                const sel=spSelectedPakot.has(p.id);
                const val=p[r.key]||'';
                const display=val||'—';
                const cls=sel?(val?'sp-cell':'sp-cell empty'):'sp-cell unselected';
                h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="'+r.key+'" onclick="spEditCell(this)">'+display+'</td>';
            });
            h+='</tr>';
        });
    });

    // Primi row
    h+='<tr class="sp-primi-row"><td style="font-weight:600;color:#6b7a8d;">Primi</td>';
    pakot.forEach(p=>{
        const sel=spSelectedPakot.has(p.id);
        const suffix=eshteIndivid?'/vit':'/muaj';
        const val=p.primi_madh||'';
        const cls=sel?'sp-cell':'sp-cell unselected';
        h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="primi_madh" onclick="spEditCell(this)">€ '+val+suffix+'</td>';
    });
    h+='</tr>';

    // Primi fëmijë (vetëm familje/biznes)
    if(!eshteIndivid){
        h+='<tr><td style="color:#6b7a8d;font-size:10px;">Primi fëmijë</td>';
        pakot.forEach(p=>{
            const sel=spSelectedPakot.has(p.id);
            const val=p.primi_femije||'';
            const cls=sel?(val?'sp-cell':'sp-cell empty'):'sp-cell unselected';
            h+='<td class="'+cls+'" data-pako="'+p.id+'" data-field="primi_femije" onclick="spEditCell(this)">'+(val?'€ '+val+'/muaj':'—')+'</td>';
        });
        h+='</tr>';
    }

    h+='</tbody></table></div>';
    return h;
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

function spToggleFold(){
    spFoldOpen=!spFoldOpen;
    renderSpreadsheet();
}

function spEditCell(td){
    if(td.querySelector('input'))return;
    if(td.classList.contains('unselected'))return;
    const field=td.dataset.field;
    const raw=td.textContent.trim();

    // Largo € dhe suffix
    let editVal=raw.replace(/^€\s*/,'').replace(/\/(vit|muaj)$/,'').trim();
    if(editVal==='—')editVal='';

    const inp=document.createElement('input');
    inp.type='text';
    inp.value=editVal;
    td.textContent='';
    td.appendChild(inp);
    inp.focus();
    inp.select();

    const finalize=()=>{
        const nv=inp.value.trim();
        // Rikthe display-in
        if(field==='primi_madh'){
            const lloji=document.getElementById('m-lloji').value;
            td.textContent=nv?'€ '+nv+(lloji==='individ'?'/vit':'/muaj'):'—';
        }else if(field==='primi_femije'){
            td.textContent=nv?'€ '+nv+'/muaj':'—';
        }else if(field==='shuma'){
            td.textContent=nv||'—';
            // Përditëso header
            spUpdateHeaderShuma(td.dataset.pako,nv);
        }else{
            td.textContent=nv||'—';
        }
        td.classList.toggle('empty',!nv);
    };

    inp.addEventListener('blur',finalize);
    inp.addEventListener('keydown',e=>{
        if(e.key==='Enter'){e.preventDefault();inp.blur();}
        if(e.key==='Escape'){td.textContent=raw;} 
        // Tab: kalo në çelulën tjetër
        if(e.key==='Tab'){
            e.preventDefault();
            inp.blur();
            const nextTd=e.shiftKey?td.previousElementSibling:td.nextElementSibling;
            if(nextTd&&nextTd.classList.contains('sp-cell')&&!nextTd.classList.contains('unselected')){
                nextTd.click();
            }
        }
    });
}

function spUpdateHeaderShuma(pakoId,val){
    document.querySelectorAll('.sp-pako-hdr').forEach(hdr=>{
        const cb=hdr.querySelector('input[type=checkbox]');
        // Gjej pakon me ID
        const nameEl=hdr.querySelector('.sp-ph-name');
        if(!nameEl)return;
        // Kontrollo nëse ky header i përket pakos
        const shumaEl=hdr.querySelector('.sp-ph-shuma');
        // Duhet mënyrë tjetër — skip for now, do te përditësohet me renderSpreadsheet
    });
}

// ====== VERSIONING ======
function toggleVersions(){document.getElementById('version-body').classList.toggle('open');}

function renderVersions(versione,oferta){
    if(!versione||versione.length===0)return;
    const body=document.getElementById('version-body');
    document.getElementById('version-count').textContent=versione.length;
    body.innerHTML=versione.map((v,i)=>{
        const pakotTxt=(v.pakot||[]).map(p=>typeof p==='object'?(p.emri||p.id):p).join(', ');
        return`<div class="version-item-block"><div class="version-item" onclick="this.nextElementSibling.classList.toggle('open')"><span class="version-dot"></span><span class="v-date">${v.data||'-'}</span><span class="v-pakot">${pakotTxt||'-'}</span><div style="margin-left:auto;display:flex;gap:6px;align-items:center;"><span class="v-detail-toggle">Detajet ▾</span><button class="v-restore" onclick="event.stopPropagation();riktheVersion(${i})">Rikthe</button></div></div><div class="v-details-panel"><div style="padding:8px 12px;font-size:11px;color:#6b7a8d;">Pakot: ${pakotTxt}</div></div></div>`;
    }).reverse().join('');
}

function riktheVersion(vIdx){
    if(editIndex<0)return;
    const o=ofertat[editIndex],v=o.versione[vIdx];
    if(!v||!confirm('Rikthe versionin e dates '+(v.data||'?')+'?'))return;
    const btns=document.querySelectorAll('.drawer-lloji-btn');
    const llojiMap={'individ':0,'familje':1,'biznes':2};
    zgjidhLlojin(v.lloji||o.lloji,btns[llojiMap[v.lloji||o.lloji]||0]);
    setTimeout(()=>{
        const pakotIds=(v.pakot||[]).map(p=>typeof p==='object'?p.id:p);
        spSelectedPakot.clear();
        pakotIds.forEach(id=>spSelectedPakot.add(id));
        renderSpreadsheet();
        // Vendos vlerat custom
        (v.pakot||[]).forEach(p=>{
            if(typeof p!=='object')return;
            document.querySelectorAll(`td.sp-cell[data-pako="${p.id}"]`).forEach(td=>{
                const field=td.dataset.field;
                if(p[field]!==undefined){
                    const lloji=document.getElementById('m-lloji').value;
                    if(field==='primi_madh')td.textContent='€ '+p[field]+(lloji==='individ'?'/vit':'/muaj');
                    else if(field==='primi_femije')td.textContent=p[field]?'€ '+p[field]+'/muaj':'—';
                    else td.textContent=p[field]||'—';
                    td.classList.toggle('empty',!p[field]);
                }
            });
        });
    },50);
}

// ====== RUAJ ======
function ruajOferte(){
    const emri=document.getElementById('m-emri').value.trim();
    if(!emri){alert('Ju lutem shkruani emrin e klientit!');return;}
    const lloji=document.getElementById('m-lloji').value;
    const eshteIndivid=lloji==='individ';

    if(spSelectedPakot.size===0){alert('Ju lutem zgjidhni së paku një paketë!');return;}

    const today=new Date(),skadon=new Date(today);
    skadon.setDate(skadon.getDate()+30);
    const kerkuarNga=document.getElementById('m-kerkuar-nga').value;
    const agjenti=document.getElementById('m-agjenti').value.trim();

    // Lexo vlerat nga spreadsheet cells
    const pakotAktuale=[];
    spSelectedPakot.forEach(pakoId=>{
        const vlerat={id:pakoId};
        document.querySelectorAll(`td.sp-cell[data-pako="${pakoId}"]`).forEach(td=>{
            const field=td.dataset.field;
            let val=td.textContent.trim();
            // Pastro
            val=val.replace(/^€\s*/,'').replace(/\/(vit|muaj)$/,'').trim();
            if(val==='—')val='';
            vlerat[field]=val;
        });
        pakotAktuale.push(vlerat);
    });

    const oferta={
        emri,lloji,
        email:document.getElementById('m-email').value.trim(),
        kerkuarNga,agjenti:kerkuarNga==='agjenti'?agjenti:'',
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
        const versionetEVjetra=ofertat[editIndex].versione||[];
        versionetEVjetra.push({data:ofertat[editIndex].dataKrijimit||new Date().toISOString().split('T')[0],lloji:ofertat[editIndex].lloji,pakot:ofertat[editIndex].pakot,emri:ofertat[editIndex].emri});
        oferta.versione=versionetEVjetra;
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
    // Set selected pakot
    spSelectedPakot.clear();
    (o.pakot||[]).forEach(p=>{
        const id=typeof p==='object'?p.id:p;
        spSelectedPakot.add(id);
    });
    zgjidhLlojin(o.lloji,btns[llojiMap[o.lloji]||0]);

    // Vendos vlerat custom pas renderimit
    setTimeout(()=>{
        (o.pakot||[]).forEach(p=>{
            if(typeof p!=='object')return;
            document.querySelectorAll(`td.sp-cell[data-pako="${p.id}"]`).forEach(td=>{
                const field=td.dataset.field;
                if(p[field]!==undefined&&p[field]!==''){
                    const lloji=o.lloji;
                    if(field==='primi_madh')td.textContent='€ '+p[field]+(lloji==='individ'?'/vit':'/muaj');
                    else if(field==='primi_femije')td.textContent=p[field]?'€ '+p[field]+'/muaj':'—';
                    else td.textContent=p[field];
                    td.classList.toggle('empty',!p[field]);
                }
            });
        });
    },80);

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
    const o=ofertat[index];
    if(!o.email){alert('Klienti nuk ka email te regjistruar!');return;}
    const link=`https://sigal-platform-shendet.vercel.app/pages/oferta-view.html?id=${index}`;
    const subject=encodeURIComponent('Ofertë nga SIGAL Insurance Group - '+o.emri);
    const body=encodeURIComponent('I nderuar '+o.emri+',\n\nJu dërgojmë ofertën tonë për sigurim shëndetësor.\n\nJu lutem klikoni linkun më poshtë për të parë paketën dhe për të konfirmuar zgjedhjen tuaj:\n\n'+link+'\n\nValiditeti: 30 ditë nga '+o.dataKrijimit+'\n\nMe respekt,\nSIGAL Insurance Group');
    window.open('mailto:'+o.email+'?subject='+subject+'&body='+body);
    ofertat[index].statusi=ofertat[index].statusi==='e_krijuar'?'e_derguar':ofertat[index].statusi;
    ruajNeStorage();
    try{fetch(TAPI+'/api/oferta-derguar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ofertaId:String(index)})});}catch(e){}
}

function krijoKontrate(index){
    if(!confirm('A jeni i sigurt qe doni te krijoni kontrate?\nOferta eshte pranuar?'))return;
    const o=ofertat[index];
    const kontratData={emri:o.emri,lloji:o.lloji,email:o.email||'',pakot:o.pakot||[],ngaOferta:true};
    ofertat[index].realizuar=true;ofertat[index].statusi='kontrate';ruajNeStorage();
    localStorage.setItem('oferta_per_kontrate',JSON.stringify(kontratData));
    window.location.href='kontratat.html?nga_oferta=true';
}

async function gjeneroWord(index){
    const o=ofertat[index];
    try{
        const pakotEmra=(o.pakot||[]).map(p=>{
            if(typeof p==='object'){const pakotList=o.lloji==='individ'?PAKOT.individ:PAKOT.familje_biznes;const found=pakotList.find(pk=>pk.id===p.id);return found?`Pako ${found.emri}`:p.id;}
            return p;
        });
        const response=await fetch('https://sigal-platform-production.up.railway.app/api/gjenero-oferte',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({emri:o.emri,lloji:o.lloji==='familje'||o.lloji==='biznes'?'familje_biznes':o.lloji,pakot:pakotEmra})});
        const data=await response.json();
        if(data.success)window.open('https://sigal-platform-production.up.railway.app/api/shkarko/'+data.fileName,'_blank');
        else alert('Gabim: '+data.error);
    }catch(err){alert('Serveri nuk eshte aktiv!');}
}

function kopjoLink(index){
    const link=`https://sigal-platform-shendet.vercel.app/pages/oferta-view.html?id=${index}`;
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(link).then(()=>tregoToast('Linku u kopjua!')).catch(()=>kopjoFallback(link));}
    else{kopjoFallback(link);}
    ofertat[index].statusi=ofertat[index].statusi==='e_krijuar'?'e_derguar':ofertat[index].statusi;
    ruajNeStorage();
    try{fetch(TAPI+'/api/oferta-derguar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ofertaId:String(index)})});}catch(e){}
}
function kopjoFallback(text){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');tregoToast('Linku u kopjua!');}catch(e){alert('Kopjimi dështoi. Linku: '+text);}document.body.removeChild(ta);}
function tregoToast(msg){let toast=document.getElementById('toast-msg');if(!toast){toast=document.createElement('div');toast.id='toast-msg';toast.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#002B5C;color:white;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;opacity:0;transition:opacity 0.3s;';document.body.appendChild(toast);}toast.textContent=msg;toast.style.opacity='1';setTimeout(()=>{toast.style.opacity='0';},2000);}
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
    if(filtered.length===0){tbody.innerHTML='<tr><td colspan="9" style="text-align:center;padding:40px;color:#888;">Nuk ka oferta. Shtoni me "+ Ofertë e Re"</td></tr>';return;}

    tbody.innerHTML=filtered.map(o=>{
        const idx=ofertat.indexOf(o);
        const ditet=llogaritDitet(o.dataSkadon);
        const kerkuar=o.kerkuarNga==='agjenti'?'Agjenti: '+o.agjenti:(kerkuarLabels[o.kerkuarNga]||'-');
        const vCount=(o.versione||[]).length;
        const vBadge=vCount>0?' <span style="background:#e5e9f0;color:#002B5C;font-size:9px;padding:1px 5px;border-radius:8px;font-weight:700;">'+vCount+'v</span>':'';
        let dotColor='#22c55e';
        if(ditet.klasa==='skadon-warning')dotColor='#f59e0b';
        if(ditet.klasa==='skadon-expired')dotColor='#ef4444';
        const skadonHtml='<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:50%;background:'+dotColor+';flex-shrink:0"></span>'+ditet.teksti+'</span>';
        const trackStatus=getTrackStatus(o);
        return'<tr>'+
            '<td>'+o.emri+vBadge+'</td>'+
            '<td><span class="badge-lloji '+o.lloji+'">'+(llojiLabels[o.lloji]||o.lloji)+'</span></td>'+
            '<td>'+((o.pakot||[]).map(p=>typeof p==='object'?p.emri||p.id:p).join(', ')||'-')+'</td>'+
            '<td>'+(o.krijuarNgaEmri||o.krijuarNga||'-')+'</td>'+
            '<td>'+kerkuar+'</td>'+
            '<td>'+(o.dataKrijimit||'-')+'</td>'+
            '<td>'+skadonHtml+'</td>'+
            '<td>'+trackBadge(trackStatus)+'</td>'+
            '<td><div class="action-btns">'+
                '<button class="btn-edit" onclick="editoOferte('+idx+')" title="Edito"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>'+
                '<button class="btn-word" onclick="gjeneroWord('+idx+')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg> Word</button>'+
                '<button class="btn-email" onclick="dergoEmail('+idx+')" title="Email"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></button>'+
                '<button class="btn-kontrate" onclick="krijoKontrate('+idx+')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg> Kontrate</button>'+
                '<button class="btn-delete" onclick="fshijOferte('+idx+')" title="Fshi"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>'+
                '<button class="btn-link" onclick="kopjoLink('+idx+')" title="Kopjo Link"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>'+
            '</div></td></tr>';
    }).join('');
}

document.addEventListener('DOMContentLoaded',renderTabela);