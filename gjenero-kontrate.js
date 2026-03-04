const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

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
    content = content.replace(/(<w:p[^>]*>\s*<\/w:p>\s*)+$/g, '');
    content = content.replace(/<w:p[^>]*>\s*<w:r>\s*<w:br w:type="page"\/>\s*<\/w:r>\s*<\/w:p>\s*$/g, '');
    return content;
}

async function gjenerKontrate(k, outputDir) {
    const templateFile = k.lloji === 'individ' ? 'kontrata-individ.docx' :
                         k.lloji === 'familje' ? 'kontrata-familje.docx' : 'kontrata-biznes.docx';

    const templatePath = path.join(__dirname, 'templates', templateFile);

    const kontraktuesEmri = k.lloji === 'biznes' ? k.emri :
                            k.lloji === 'familje' ? k.perfaqesuesi : k.emri;
    const emriKlientit = k.lloji === 'individ' ? k.emri : k.perfaqesuesi;
    const pozitaKlientit = k.lloji === 'biznes' ? (k.pozita || 'Drejtor') :
                           k.lloji === 'familje' ? 'Kryefamiljar' : '';

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

    // HAPI 1: Fut tabelat ne XML para docxtemplater
    const zip1 = new PizZip(fs.readFileSync(templatePath));
    let xml = zip1.file('word/document.xml').asText();

    // Fshi bookmark _GoBack
    xml = xml.replace(/<w:bookmarkStart[^>]*w:name="_GoBack"[^>]*\/>/g, '');

    if (tabelatXML) {
        const idx = xml.indexOf('{~pakot}');
        if (idx > -1) {
            // Gjej mbylljen e paragrafit pas {~pakot}
            const pEnd = xml.indexOf('</w:p>', idx);
            if (pEnd > -1) {
                // Fut tabelat menjehere pas mbylljes se paragrafit
                xml = xml.substring(0, pEnd + 6) + tabelatXML + xml.substring(pEnd + 6);
            }
            // Fshi {~pakot} tekstin
            xml = xml.replace('{~pakot}', '');
        }
    } else {
        xml = xml.replace('{~pakot}', '');
    }

    zip1.file('word/document.xml', xml);
    const modifiedBuf = zip1.generate({ type: 'nodebuffer' });

    // HAPI 2: Docxtemplater per placeholders e tjera
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

    // HAPI 3: Ruaj kontratën (pa merge me aneks2 per tash)
    const outputName = `Kontrata_${k.emri.replace(/\s+/g, '_')}_${formatData(k.dataKontrates)}.docx`;
    const outputPath = path.join(outputDir || path.join(__dirname, 'output'), outputName);

    fs.writeFileSync(outputPath, kontrataBuf);

    return outputPath;
}

module.exports = { gjenerKontrate };