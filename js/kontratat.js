let kontratat = JSON.parse(localStorage.getItem('kontratat')) || [];
let editIndex = -1;

function ruajNeStorage() {
    localStorage.setItem('kontratat', JSON.stringify(kontratat));
}

function zgjidhLlojin(lloji, btn) {
    document.getElementById('m-lloji').value = lloji;
    document.querySelectorAll('.lloji-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Shfaq/fsheh fushat sipas llojit
    document.getElementById('field-nr-biznesit').style.display = (lloji === 'biznes') ? 'block' : 'none';
    document.getElementById('field-perfaqesuesi').style.display = (lloji === 'biznes' || lloji === 'familje') ? 'block' : 'none';
}

function shtoKontrate() {
    editIndex = -1;
    document.getElementById('modal-title').textContent = 'Kontratë e Re';
    document.getElementById('m-emri').value = '';
    document.getElementById('m-adresa').value = '';
    document.getElementById('m-nr-biznesit').value = '';
    document.getElementById('m-perfaqesuesi').value = '';
    document.querySelectorAll('.pako-check input').forEach(cb => cb.checked = false);
    document.getElementById('m-fillimi').value = '';
    document.getElementById('m-mbarimi').value = '';
    zgjidhLlojin('individ', document.querySelectorAll('.lloji-btn')[0]);
    document.getElementById('modal-overlay').classList.add('active');
}

function mbyllModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

function ruajKontrate() {
    const emri = document.getElementById('m-emri').value.trim();
    if (!emri) { alert('Ju lutem shkruani emrin e klientit!'); return; }

    const kontrata = {
        emri,
        lloji: document.getElementById('m-lloji').value,
        adresa: document.getElementById('m-adresa').value.trim(),
        nrBiznesit: document.getElementById('m-nr-biznesit').value.trim(),
        perfaqesuesi: document.getElementById('m-perfaqesuesi').value.trim(),
        pakot: Array.from(document.querySelectorAll('.pako-check input:checked')).map(cb => cb.value),
        fillimi: document.getElementById('m-fillimi').value,
        mbarimi: document.getElementById('m-mbarimi').value,
        dataKrijimit: new Date().toISOString().split('T')[0]
    };

    if (editIndex >= 0) {
        kontratat[editIndex] = kontrata;
    } else {
        kontratat.push(kontrata);
    }

    ruajNeStorage();
    mbyllModal();
    renderTabela();
}

function fshijKontrate(index) {
    if (confirm('A jeni i sigurt që doni të fshini këtë kontratë?')) {
        kontratat.splice(index, 1);
        ruajNeStorage();
        renderTabela();
    }
}

function editoKontrate(index) {
    editIndex = index;
    const k = kontratat[index];
    document.getElementById('modal-title').textContent = 'Edito Kontratë';
    document.getElementById('m-nr').value = k.nr || '';
    document.getElementById('m-emri').value = k.emri;
    document.getElementById('m-adresa').value = k.adresa || '';
    document.getElementById('m-nr-biznesit').value = k.nrBiznesit || '';
    document.getElementById('m-perfaqesuesi').value = k.perfaqesuesi || '';
    document.querySelectorAll('.pako-check input').forEach(cb => {
    cb.checked = (k.pakot || []).includes(cb.value);
});
    document.getElementById('m-fillimi').value = k.fillimi || '';
    document.getElementById('m-mbarimi').value = k.mbarimi || '';
    document.getElementById('m-email').value = k.email || '';
    document.getElementById('m-telefoni').value = k.telefoni || '';
    const btns = document.querySelectorAll('.lloji-btn');
    const llojiMap = { individ: 0, biznes: 1, familje: 2 };
    zgjidhLlojin(k.lloji, btns[llojiMap[k.lloji] || 0]);
    document.getElementById('modal-overlay').classList.add('active');
}

function llogaritStatus(mbarimi) {
    if (!mbarimi) return 'ne-pritje';
    const tani = new Date();
    const skadon = new Date(mbarimi);
    const dite = Math.ceil((skadon - tani) / (1000 * 60 * 60 * 24));
    if (dite < 0) return 'skaduar';
    return 'aktive';
}

function llogaritDitet(mbarimi) {
    if (!mbarimi) return { teksti: '-', klasa: '' };
    const tani = new Date();
    const skadon = new Date(mbarimi);
    const dite = Math.ceil((skadon - tani) / (1000 * 60 * 60 * 24));
    if (dite < 0) return { teksti: `Skaduar ${Math.abs(dite)}d`, klasa: 'skadon-expired' };
    if (dite <= 35) return { teksti: `⚠️ ${dite} ditë`, klasa: 'skadon-warning' };
    return { teksti: `${dite} ditë`, klasa: 'skadon-ok' };
}

function filtro() {
    renderTabela();
}

function renderTabela() {
    const filterLloji = document.getElementById('filter-lloji').value;
    const filterStatusi = document.getElementById('filter-statusi').value;
    const search = document.getElementById('search-kontrate').value.toLowerCase();

    const filtered = kontratat.filter(k => {
        const llojiOk = filterLloji === 'all' || k.lloji === filterLloji;
        const statusi = llogaritStatus(k.mbarimi);
        const statusOk = filterStatusi === 'all' || statusi === filterStatusi;
        const searchOk = k.emri.toLowerCase().includes(search) || (k.nr || '').toLowerCase().includes(search);
        return llojiOk && statusOk && searchOk;
    });

    // Stats
    document.getElementById('count-aktive').textContent = kontratat.filter(k => llogaritStatus(k.mbarimi) === 'aktive').length;
    document.getElementById('count-skadon').textContent = kontratat.filter(k => {
        if (!k.mbarimi) return false;
        const dite = Math.ceil((new Date(k.mbarimi) - new Date()) / (1000 * 60 * 60 * 24));
        return dite >= 0 && dite <= 35;
    }).length;
    document.getElementById('count-biznes').textContent = kontratat.filter(k => k.lloji === 'biznes').length;
    document.getElementById('count-total').textContent = kontratat.length;

    const statusLabels = {
        aktive: '🟢 Aktive',
        skaduar: '🔴 Skaduar',
        'ne-pritje': '🟡 Në Pritje'
    };

    const llojiLabels = {
        individ: '👤 Individ',
        biznes: '🏢 Biznes',
        familje: '👨‍👩‍👧 Familje'
    };

    const tbody = document.getElementById('kontratat-tbody');

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:40px; color:#888;">Nuk ka kontrata. Shtoni me "+ Kontratë e Re"</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(k => {
        const idx = kontratat.indexOf(k);
        const statusi = llogaritStatus(k.mbarimi);
        const ditet = llogaritDitet(k.mbarimi);
        return `
        <tr>
            <td>${k.emri}</td>
            <td><span class="badge-lloji ${k.lloji}">${llojiLabels[k.lloji]}</span></td>
            <td>${(k.pakot || []).join(', ') || '-'}</td>
            <td>${k.fillimi || '-'}</td>
            <td>${k.mbarimi || '-'}</td>
            <td class="${ditet.klasa}">${ditet.teksti}</td>
            <td><span class="badge-status ${statusi}">${statusLabels[statusi]}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="editoKontrate(${idx})">✏️</button><button class="btn-word" onclick="gjeneroWord(${idx})">📄 Word</button>
                    <button class="btn-delete" onclick="fshijKontrate(${idx})">🗑️</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

renderTabela();
async function gjeneroWord(index) {
    const k = kontratat[index];
    
    // Load libraries
    if (!window.docx) {
        const script = document.createElement('script');
        script.src = '../libs/docx.js';
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
    }

    const { Document, Paragraph, Table, TableRow, TableCell, TextRun, 
            AlignmentType, WidthType, BorderStyle, HeadingLevel, Packer } = docx;

    const pakot = k.pakot || [];
    
    // Pako data
    const pakoData = {
        'Pako Bazë':         { zona: 'KS', shuma: '€ 20.000', primi: '€ 270,00' },
        'Pako Standard':     { zona: 'KS, ALB', shuma: '€ 30.000', primi: '€ 360,00' },
        'Pako Standard Plus':{ zona: 'KS, ALB, NMK, MNE, SRB', shuma: '€ 50.000', primi: '€ 450,00' },
        'Pako Premium':      { zona: 'KS, ALB, NMK, MNE, SRB, BE', shuma: '€ 100.000', primi: '€ 600,00' },
        'Pako Silver':       { zona: 'Evropë', shuma: '€ 150.000', primi: '€ 800,00' },
        'Pako Gold':         { zona: 'Botëror', shuma: '€ 200.000', primi: '€ 1.000,00' },
    };

    const llojiLabel = { individ: 'Individ', biznes: 'Biznes', familje: 'Familje' };

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // Logo / Header
                new Paragraph({
                    children: [new TextRun({ text: 'SIGAL KS Insurance Group', bold: true, size: 28, color: '003087' })],
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                    children: [new TextRun({ text: 'Sigurim Shëndetësor Privat', size: 22, color: '0057B8' })],
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({ children: [new TextRun({ text: '' })] }),
                new Paragraph({ children: [new TextRun({ text: '' })] }),

                // Titulli
                new Paragraph({
                    children: [new TextRun({ text: `KONTRATË SIGURIMESH SHËNDETËSORE — ${llojiLabel[k.lloji] || 'Individ'}`.toUpperCase(), bold: true, size: 24 })],
                    alignment: AlignmentType.CENTER,
                }),
                new Paragraph({ children: [new TextRun({ text: '' })] }),

                // Te dhenat e klientit
                new Paragraph({ children: [new TextRun({ text: 'TË DHËNAT E KLIENTIT', bold: true, size: 22, color: '003087' })] }),
                new Paragraph({ children: [new TextRun({ text: '' })] }),

                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Emri i Klientit:', bold: true })] })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k.emri || '' })] })] }),
                        ]}),
                        new TableRow({ children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Lloji:', bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: llojiLabel[k.lloji] || '' })] })] }),
                        ]}),
                        new TableRow({ children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Adresa:', bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k.adresa || '' })] })] }),
                        ]}),
                        ...(k.lloji === 'biznes' ? [
                            new TableRow({ children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Nr. Biznesit:', bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k.nrBiznesit || '' })] })] }),
                            ]}),
                            new TableRow({ children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Përfaqësuesi:', bold: true })] })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k.perfaqesuesi || '' })] })] }),
                            ]}),
                        ] : []),
                        new TableRow({ children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Data Fillimit:', bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k.fillimi || '' })] })] }),
                        ]}),
                        new TableRow({ children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Data Mbarimit:', bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: k.mbarimi || '' })] })] }),
                        ]}),
                        new TableRow({ children: [
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Pakot e Zgjedhura:', bold: true })] })] }),
                            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: pakot.join(', ') || '' })] })] }),
                        ]}),
                    ]
                }),

                new Paragraph({ children: [new TextRun({ text: '' })] }),
                new Paragraph({ children: [new TextRun({ text: '' })] }),

                // Seksioni i nenshkrimit
                new Paragraph({ children: [new TextRun({ text: 'NËNSHKRIMET', bold: true, size: 22, color: '003087' })] }),
                new Paragraph({ children: [new TextRun({ text: '' })] }),

                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ children: [
                            new TableCell({ children: [
                                new Paragraph({ children: [new TextRun({ text: 'Për SIGAL KS Insurance Group:', bold: true })] }),
                                new Paragraph({ children: [new TextRun({ text: '' })] }),
                                new Paragraph({ children: [new TextRun({ text: '' })] }),
                                new Paragraph({ children: [new TextRun({ text: '____________________________' })] }),
                                new Paragraph({ children: [new TextRun({ text: 'Nënshkrimi dhe Vula' })] }),
                            ]}),
                            new TableCell({ children: [
                                new Paragraph({ children: [new TextRun({ text: `${llojiLabel[k.lloji] || 'Klienti'}:`, bold: true })] }),
                                new Paragraph({ children: [new TextRun({ text: k.emri || '' })] }),
                                new Paragraph({ children: [new TextRun({ text: '' })] }),
                                new Paragraph({ children: [new TextRun({ text: '____________________________' })] }),
                                new Paragraph({ children: [new TextRun({ text: 'Nënshkrimi' })] }),
                            ]}),
                        ]}),
                    ]
                }),

                new Paragraph({ children: [new TextRun({ text: '' })] }),
                new Paragraph({ 
                    children: [new TextRun({ text: `Data: ${new Date().toLocaleDateString('sq-AL')}`, italics: true })],
                    alignment: AlignmentType.RIGHT,
                }),
            ]
        }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kontrata_${k.emri.replace(/\s+/g, '_')}_${k.fillimi || 'date'}.docx`;
    a.click();
    URL.revokeObjectURL(url);
}
let templateBuffer = null;         // nëse do ta ndryshojë admini me file‑input

async function ngarkoTemplate() {
    // nëse admini ka ngarkuar diçka më parë ruajtur në variabël
    if (templateBuffer) return templateBuffer;

    // tjetër rast — marrim skedarin nga rruga e paracaktuar
    const res = await fetch('../templates/kontrate.docx');
    if (!res.ok) throw new Error('Nuk u gjet template‑i');
    templateBuffer = await res.arrayBuffer();
    return templateBuffer;
}

async function gjeneroWord(index) {
    const k = kontratat[index];
    const buffer = await ngarkoTemplate();
    const zip = new PizZip(buffer);
    const doc = new docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    // objekt me fushat që i ke në template (emrat e placeholder‑eve)
    doc.setData({
        EMRI: k.emri,
        LLOJI: llojiLabel[k.lloji] || '',
        ADRESA: k.adresa || '',
        NR_BIZNESIT: k.nrBiznesit || '',
        PERFAQESUESI: k.perfaqesuesi || '',
        FILLIM: k.fillimi || '',
        MBARIM: k.mbarimi || '',
        PAKOT: (k.pakot || []).join(', '),
        // …shtoni çdo fushë tjetër
    });

    try {
        doc.render();
    } catch (err) {
        console.error(err);
        alert('Gabim në renderimin e kontratës');
        return;
    }

    const out = doc.getZip().generate({ type: 'blob' });
    const url = URL.createObjectURL(out);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kontrata_${k.emri.replace(/\s+/g,'_')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
}