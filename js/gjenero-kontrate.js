const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

// ============================================
// FORMAT DATA — fix NaN.NaN.NaN
// Pranon: dd/mm/yyyy, yyyy-mm-dd, ose ISO string
// ============================================
function formatData(dateStr) {
    if (!dateStr) return '__.__.____';

    // Format dd/mm/yyyy
    if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        if (d && m && y) return `${d.padStart(2,'0')}.${m.padStart(2,'0')}.${y}`;
    }

    // Format yyyy-mm-dd ose ISO
    if (dateStr.includes('-')) {
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) {
            const [y, m, d] = parts;
            return `${d.padStart(2,'0')}.${m.padStart(2,'0')}.${y}`;
        }
    }

    return dateStr;
}

// ============================================
// PAKO TEMPLATE MAPPING
// ============================================
const PAKO_FILES_INDIVID = {
    'Pako Bazë': 'PAKOT_INDIVID_BAZE.docx',
    'Pako Standard': 'PAKOT_INDIVID_STANDARD.docx',
    'Pako Standard Plus': 'PAKOT_INDIVID_STANDARD PLUS.docx',
};
const PAKO_FILES_FAMILJE_BIZNES = {
    'Pako Bazë': 'PAKOT_FAMILJE_DHE_BIZNES_BAZE.docx',
    'Pako Standard': 'PAKOT_FAMILJE_DHE_BIZNES_STANARD.docx',
    'Pako Standard Plus': 'PAKOT_FAMILJE_DHE_BIZNES_STANDARD_PLUS.docx',
    'Pako Premium': 'PAKOT_FAMILJE_DHE_BIZNES_PREMIUM.docx',
    'Pako Silver': 'PAKOT_FAMILJE_DHE_BIZNES_SILVER.docx',
    'Pako Gold': 'PAKOT_FAMILJE_DHE_BIZNES_GOLD.docx',
};
const PAKO_RENDITJA = ['Pako Bazë', 'Pako Standard', 'Pako Standard Plus', 'Pako Premium', 'Pako Silver', 'Pako Gold'];

// ============================================
// APPLY CUSTOM VALUES — zëvendëson limite në XML
// ============================================
const ROW_MAP = {
    1: 'zona', 2: 'shuma',
    19: 'tjera_0', 20: 'tjera_1', 21: 'tjera_2', 22: 'tjera_3',
    23: 'tjera_4', 24: 'tjera_5', 25: 'tjera_6', 26: 'tjera_7', 27: 'tjera_8',
    29: 'primi_madh', 30: 'primi_femije',
};
const HOSP_ROWS = [4, 5, 6, 7, 8, 9, 10];
const AMB_ROWS = [12, 13, 14, 15, 16, 17];

function escapeXml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function replaceTextInCell(tcXml, newText) {
    const wRunRegex = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g;
    let runs = [];
    let m;
    while ((m = wRunRegex.exec(tcXml)) !== null) {
        runs.push({ full: m[0], content: m[1], index: m.index });
    }
    if (runs.length === 0) return tcXml;

    let firstRun = runs[0].full;
    firstRun = firstRun.replace(/<w:t[^>]*>[^<]*<\/w:t>/, '<w:t xml:space="preserve">' + escapeXml(newText) + '</w:t>');

    let newTc = tcXml;
    for (let i = runs.length - 1; i >= 0; i--) {
        newTc = newTc.replace(runs[i].full, i === 0 ? firstRun : '');
    }
    return newTc;
}

function applyCustomValues(docXml, pakoData) {
    if (pakoData.tjera_pikat && Array.isArray(pakoData.tjera_pikat)) {
        pakoData.tjera_pikat.forEach((tp, idx) => {
            const key = 'tjera_' + idx;
            if (!pakoData[key] && tp && tp.vlera) pakoData[key] = tp.vlera;
        });
    }

    const trRegex = /<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/g;
    let rowIndex = 0;
    const rows = [];
    let match;

    while ((match = trRegex.exec(docXml)) !== null) {
        rows.push({ full: match[0], content: match[1], index: rowIndex, start: match.index });
        rowIndex++;
    }

    let result = docXml;
    for (let i = rows.length - 1; i >= 0; i--) {
        const row = rows[i];
        const ri = row.index;
        let newValue = null;

        if (ROW_MAP[ri] && pakoData[ROW_MAP[ri]] !== undefined && pakoData[ROW_MAP[ri]] !== '') {
            newValue = pakoData[ROW_MAP[ri]];
            if (ri === 2 && newValue && !newValue.startsWith('€')) newValue = '€ ' + newValue;
            if (ri === 29 && newValue && !newValue.startsWith('€')) newValue = '€ ' + newValue + ',00';
            if (ri === 30 && newValue && !newValue.startsWith('€')) newValue = '€ ' + newValue + ',00';
        }

        if (HOSP_ROWS.includes(ri) && pakoData.hospitalore && pakoData.hospitalore !== '') {
            newValue = pakoData.hospitalore;
        }

        if (AMB_ROWS.includes(ri) && pakoData.ambulantore && pakoData.ambulantore !== '') {
            newValue = pakoData.ambulantore;
        }

        if (newValue !== null) {
            const tcRegex = /<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/g;
            let tcMatch;
            let tcCount = 0;
            let newRow = row.full;

            tcRegex.lastIndex = 0;
            while ((tcMatch = tcRegex.exec(row.full)) !== null) {
                tcCount++;
                if (tcCount === 2) {
                    const oldTc = tcMatch[0];
                    const newTc = replaceTextInCell(oldTc, newValue);
                    newRow = newRow.replace(oldTc, newTc);
                    break;
                }
            }
            result = result.replace(row.full, newRow);
        }
    }

    return result;
}

// ============================================
// MERGE HELPER — kopjon media + relationships nga source zip në target zip
// Kthen mapping { oldRid → newRid } për XML rewrite
// ============================================
function mergeMediaAndRels(sourceZip, targetZip) {
    const ridMap = {};

    // Lexo relationships nga source
    const sourceRelsFile = sourceZip.file('word/_rels/document.xml.rels');
    if (!sourceRelsFile) return ridMap;
    const sourceRels = sourceRelsFile.asText();

    // Lexo relationships nga target
    const targetRelsFile = targetZip.file('word/_rels/document.xml.rels');
    if (!targetRelsFile) return ridMap;
    let targetRels = targetRelsFile.asText();

    // Gjej max rId në target
    const ridNums = [];
    const ridRegex = /Id="rId(\d+)"/g;
    let rm;
    while ((rm = ridRegex.exec(targetRels)) !== null) {
        ridNums.push(parseInt(rm[1]));
    }
    let nextRid = ridNums.length > 0 ? Math.max(...ridNums) + 1 : 100;

    // Gjej të gjitha relationships me media/image/embed/oleObject në source
    const relRegex = /<Relationship\s+([^>]+?)\/>/g;
    let relMatch;
    while ((relMatch = relRegex.exec(sourceRels)) !== null) {
        const attrs = relMatch[1];
        const idMatch = attrs.match(/Id="([^"]+)"/);
        const targetMatch = attrs.match(/Target="([^"]+)"/);
        const typeMatch = attrs.match(/Type="([^"]+)"/);
        if (!idMatch || !targetMatch || !typeMatch) continue;

        const oldRid = idMatch[1];
        const relTarget = targetMatch[1];
        const type = typeMatch[1];

        // Kopjo image, oleObject, package relationships
        if (!type.includes('image') && !type.includes('oleObject') && !type.includes('package')) continue;

        // Kopjo skedarin nga source në target me emër unik
        const sourcePath = 'word/' + relTarget;
        const sourceFile = sourceZip.file(sourcePath);
        if (!sourceFile) continue;

        const ext = path.extname(relTarget);
        const baseName = relTarget.includes('/') ? relTarget.split('/').pop() : relTarget;
        const newFileName = relTarget.includes('/') ?
            relTarget.replace(baseName, 'merged_' + nextRid + ext) :
            'media/merged_' + nextRid + ext;

        // Kopjo binary content
        targetZip.file('word/' + newFileName, sourceFile.asUint8Array());

        // Shto relationship të re në target
        const newRid = 'rId' + nextRid;
        const modeAttr = attrs.includes('TargetMode') ? ' TargetMode="External"' : '';
        const newRel = `<Relationship Id="${newRid}" Type="${type}" Target="${newFileName}"${modeAttr}/>`;
        targetRels = targetRels.replace('</Relationships>', newRel + '</Relationships>');

        ridMap[oldRid] = newRid;
        nextRid++;
    }

    // Ruaj relationships të përditësuara
    targetZip.file('word/_rels/document.xml.rels', targetRels);

    return ridMap;
}

// Zëvendëson rId references në XML content
function remapRids(xmlContent, ridMap) {
    let result = xmlContent;
    // Zëvendëso nga rId me numër më të madh për të shmangur konflikte
    const sortedOldRids = Object.keys(ridMap).sort((a, b) => {
        const na = parseInt(a.replace('rId', ''));
        const nb = parseInt(b.replace('rId', ''));
        return nb - na;
    });
    for (const oldRid of sortedOldRids) {
        const newRid = ridMap[oldRid];
        result = result.replace(new RegExp('r:embed="' + oldRid + '"', 'g'), 'r:embed="' + newRid + '"');
        result = result.replace(new RegExp('r:id="' + oldRid + '"', 'g'), 'r:id="' + newRid + '"');
        result = result.replace(new RegExp('r:link="' + oldRid + '"', 'g'), 'r:link="' + newRid + '"');
    }
    return result;
}

// Nxjerr body content nga XML (pa sectPr, pa paragrafë boshe në fund)
function extractBodyContent(xml) {
    const body = xml.match(/<w:body>([\s\S]*?)<\/w:body>/);
    if (!body) return '';
    let content = body[1];
    // Heq sectPr
    content = content.replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/g, '');
    // Heq paragrafë boshe në fund — me ose pa pPr, me ose pa atribute
    content = content.replace(/(\s*<w:p\b[^>]*>(\s*<w:pPr>[\s\S]*?<\/w:pPr>)?\s*<\/w:p>)+\s*$/g, '');
    return content.trim();
}

// ============================================
// GJENER KONTRATE — kryesore
// ============================================
function gjenerKontrate(k, outputDir) {
    const templatesDir = path.join(__dirname, '..', 'templates');

    // --- HAPI 1: Template kontrate me docxtemplater ---
    const templateFile = k.lloji === 'individ' ? 'kontrata-individ.docx' :
                         k.lloji === 'familje' ? 'kontrata-familje.docx' : 'kontrata-biznes.docx';

    const templatePath = path.join(templatesDir, templateFile);
    const content = fs.readFileSync(templatePath, 'binary');
    const mainZip = new PizZip(content);
    const doc = new Docxtemplater(mainZip, { paragraphLoop: true, linebreaks: true });

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

    // Merr ZIP-in pas renderit
    const renderedZip = doc.getZip();
    let mainXml = renderedZip.file('word/document.xml').asText();

    // --- HAPI 2: Bashko pako template-at si aneks ---
    const PAKO_FILES = k.lloji === 'individ' ? PAKO_FILES_INDIVID : PAKO_FILES_FAMILJE_BIZNES;

    // Ndërto mapping emri → pakotData
    const pakotDataMap = {};
    if (k.pakotData && Array.isArray(k.pakotData)) {
        k.pakotData.forEach(pd => {
            if (pd && pd.emri) pakotDataMap['Pako ' + pd.emri] = pd;
            if (pd && pd.id) pakotDataMap[pd.id] = pd;
        });
    }

    // Rendit pakot sipas radhës standarde
    const pakotEmra = k.pakot || [];
    const pakotRenditura = PAKO_RENDITJA.filter(p => pakotEmra.includes(p));

    pakotRenditura.forEach(pakoEmri => {
        const fileName = PAKO_FILES[pakoEmri];
        if (!fileName) return;
        const filePath = path.join(templatesDir, fileName);
        if (!fs.existsSync(filePath)) return;

        const pakoZip = new PizZip(fs.readFileSync(filePath));
        let pakoXml = pakoZip.file('word/document.xml').asText();

        // Apliko custom values nëse ka
        const pakoData = pakotDataMap[pakoEmri];
        if (pakoData) {
            pakoXml = applyCustomValues(pakoXml, { ...pakoData });
        }

        // Kopjo media files nga pako në main zip
        const ridMap = mergeMediaAndRels(pakoZip, renderedZip);

        // Nxirr body content
        let pakoContent = extractBodyContent(pakoXml);

        // Remap rId references
        if (Object.keys(ridMap).length > 0) {
            pakoContent = remapRids(pakoContent, ridMap);
        }

        if (pakoContent) {
            const pageBreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
            mainXml = mainXml.replace(/<\/w:body>/, pageBreak + pakoContent + '</w:body>');
        }
    });

    // --- HAPI 3: Bashko aneksi2.docx (vetëm 1 herë, në fund) ---
    const aneksPath = path.join(templatesDir, 'aneksi2.docx');
    if (fs.existsSync(aneksPath)) {
        const aneksZip = new PizZip(fs.readFileSync(aneksPath));
        const aneksXml = aneksZip.file('word/document.xml').asText();

        // Kopjo media + relationships nga aneksi2 në main zip
        const ridMap = mergeMediaAndRels(aneksZip, renderedZip);

        // Nxirr body content
        let aneksContent = extractBodyContent(aneksXml);

        // Remap rId references
        if (Object.keys(ridMap).length > 0) {
            aneksContent = remapRids(aneksContent, ridMap);
        }

        if (aneksContent) {
            const pageBreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
            mainXml = mainXml.replace(/<\/w:body>/, pageBreak + aneksContent + '</w:body>');
        }
    }

    // --- HAPI 4: Ruaj dokumentin final ---
    renderedZip.file('word/document.xml', mainXml);
    const buf = renderedZip.generate({ type: 'nodebuffer' });
    const outputName = `Kontrata_${(k.emri || 'klient').replace(/\s+/g, '_')}_${formatData(k.dataKontrates).replace(/\./g, '-')}.docx`;
    const outputPath = path.join(outputDir || path.join(__dirname, 'output'), outputName);
    fs.writeFileSync(outputPath, buf);

    return outputPath;
}

module.exports = { gjenerKontrate };