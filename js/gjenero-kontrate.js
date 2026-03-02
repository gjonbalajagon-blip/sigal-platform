const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

function formatData(dateStr) {
    if (!dateStr) return '__.__.____';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`;
}

function gjenerKontrate(k, outputDir) {
    // Zgjidhni template-in sipas llojit
    const templateFile = k.lloji === 'individ' ? 'kontrata-individ.docx' :
                         k.lloji === 'familje' ? 'kontrata-familje.docx' : 'kontrata-biznes.docx';

    const templatePath = path.join(__dirname, 'templates', templateFile);
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    // Kontraktuesi sipas llojit
    const kontraktuesEmri = k.lloji === 'individ' ? k.emri : k.perfaqesuesi;
    const pozitaKlientit = k.lloji === 'biznes' ? k.pozita : 'Kontraktues';
    const pakotTeksti = (k.pakot || []).join(', ');

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
        EMRI_KLIENTIT: kontraktuesEmri || '',
        POZITA_KLIENTIT: pozitaKlientit,
        PAKOT_TEKSTI: pakotTeksti,
    });

    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    const outputName = `Kontrata_${k.emri.replace(/\s+/g, '_')}_${formatData(k.dataKontrates)}.docx`;
    const outputPath = path.join(outputDir || path.join(__dirname, 'output'), outputName);
    fs.writeFileSync(outputPath, buf);
    
    return outputPath;
}

module.exports = { gjenerKontrate };
