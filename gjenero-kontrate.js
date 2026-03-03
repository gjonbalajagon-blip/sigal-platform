const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');
const merger = new DocxMerger({pageBreak: false}, dokumentet);
merger.save('nodebuffer', (data) => {
    fs.writeFileSync(outputPath, data);
});

const PAKO_FILES_INDIVID = {
    'Pako Bazë':         'PAKOT_INDIVID_BAZE.docx',
    'Pako Standard':     'PAKOT_INDIVID_STANDARD.docx',
    'Pako Standard Plus':'PAKOT_INDIVID_STANDARD PLUS.docx',
};

const PAKO_FILES_FAMILJE_BIZNES = {
    'Pako Bazë':         'PAKOT_FAMILJE_DHE_BIZNES_BAZE.docx',
    'Pako Standard':     'PAKOT_FAMILJE_DHE_BIZNES_STANARD.docx',
    'Pako Standard Plus':'PAKOT_FAMILJE_DHE_BIZNES_STANDARD_PLUS.docx',
    'Pako Premium':      'PAKOT_FAMILJE_DHE_BIZNES_PREMIUM.docx',
    'Pako Silver':       'PAKOT_FAMILJE_DHE_BIZNES_SILVER.docx',
    'Pako Gold':         'PAKOT_FAMILJE_DHE_BIZNES_GOLD.docx',
};

function formatData(dateStr) {
    if (!dateStr) return '__.__.____';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`;
}

function merrhTabelatXML(pakotBuf) {
    const zip = new PizZip(pakotBuf);
    const xml = zip.file('word/document.xml').asText();
    const body = xml.match(/<w:body>([\s\S]*?)<\/w:body>/);
    if (!body) return '';
    let content = body[1].replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/g, '');
    // Fshi paragrafet bosh në fund
    content = content.replace(/(<w:p[^>]*>\s*<\/w:p>\s*)+$/g, '');
    content = content.replace(/<w:p[^>]*>\s*<w:r>\s*<w:br w:type="page"\/>\s*<\/w:r>\s*<\/w:p>\s*$/g, '');
    return content;
}

function gjenerKontrate(k, outputDir) {
    const templateFile = k.lloji === 'individ' ? 'kontrata-individ.docx' :
                         k.lloji === 'familje' ? 'kontrata-familje.docx' : 'kontrata-biznes.docx';

    const templatePath = path.join(__dirname, 'templates', templateFile);

    const kontraktuesEmri = k.lloji === 'biznes' ? k.emri : 
                            k.lloji === 'familje' ? k.perfaqesuesi : k.emri;
    const emriKlientit = k.lloji === 'individ' ? k.emri : k.perfaqesuesi;
    const pozitaKlientit = k.lloji === 'biznes' ? (k.pozita || 'Drejtor') : 
                           k.lloji === 'familje' ? 'Kryefamiljar' : '';

    // Grumbull tabelat e pakove
    const renditja = ['Pako Bazë', 'Pako Standard', 'Pako Standard Plus', 'Pako Premium', 'Pako Silver', 'Pako Gold'];
    const pakotRenditura = renditja.filter(p => (k.pakot || []).includes(p));

    let tabelatXML = '';
    const PAKO_FILES = k.lloji === 'individ' ? PAKO_FILES_INDIVID : PAKO_FILES_FAMILJE_BIZNES;
pakotRenditura.forEach((pako, index) => {
    const fileName = PAKO_FILES[pako];
        if (fileName) {
            const pakotPath = path.join(__dirname, 'templates', fileName);
            if (fs.existsSync(pakotPath)) {
                const pakotBuf = fs.readFileSync(pakotPath);
                if (index > 0) {
                    tabelatXML += '<w:p w:rsidR="00000000"><w:r><w:br w:type="page"/></w:r></w:p>';
                }
                tabelatXML += merrhTabelatXML(pakotBuf);
            }
        }
    });

    // HAPI 1: Fut tabelat në XML para docxtemplater
    const zip1 = new PizZip(fs.readFileSync(templatePath));
    let xml = zip1.file('word/document.xml').asText();

    const paragrafPlaceholder = /<w:p[^>]*>(?:(?!<w:p[ >]).)*\{~pakot\}[\s\S]*?<\/w:p>/;
    if (tabelatXML && paragrafPlaceholder.test(xml)) {
        xml = xml.replace(paragrafPlaceholder, tabelatXML);
    } else if (tabelatXML) {
        xml = xml.replace('{~pakot}', tabelatXML);
    }
    zip1.file('word/document.xml', xml);
    const modifiedBuf = zip1.generate({ type: 'nodebuffer' });

    // HAPI 2: Docxtemplater për placeholders e tjera
    const zip2 = new PizZip(modifiedBuf);
    const doc = new Docxtemplater(zip2, { paragraphLoop: true, linebreaks: true });

    doc.render({
        EMRI: k.emri || '',
        ADRESA: k.adresa || '',
        NR_PERSONAL: k.nrPersonal || '',
        NR_BIZNESIT: k.nrBiznesit || '',
        PERFAQESUESI: k.perfaqesuesi || '',
        POZITA: k.pozita || '',
        DATA_KONTRATES: formatData(k.dataKontrates),
        DATA_FILLIMIT: formatData(k.fillimi),
        DATA_MBARIMIT: formatData(k.mbarimi),
        KONTRAKTUESI_EMRI: kontraktuesEmri || '',
        EMRI_KLIENTIT: emriKlientit || '',
        POZITA_KLIENTIT: pozitaKlientit,
    });

    const kontrataBuf = doc.getZip().generate({ type: 'nodebuffer' });

    // HAPI 3: Bashko me Aneksin 2
    const dokumentet = [kontrataBuf];
    const aneksi2Path = path.join(__dirname, 'templates', 'aneksi2.docx');
    if (fs.existsSync(aneksi2Path)) {
        dokumentet.push(fs.readFileSync(aneksi2Path));
    }

    const outputName = `Kontrata_${k.emri.replace(/\s+/g, '_')}_${formatData(k.dataKontrates)}.docx`;
    const outputPath = path.join(outputDir || path.join(__dirname, 'output'), outputName);

    if (dokumentet.length === 1) {
        fs.writeFileSync(outputPath, dokumentet[0]);
    } else {
     const merger = new DocxMerger({pageBreak: false}, dokumentet);
        merger.save('nodebuffer', (data) => {
            fs.writeFileSync(outputPath, data);
        });
    }

    return outputPath;
}

module.exports = { gjenerKontrate };