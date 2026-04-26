const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

// ============================================
// FORMAT DATA — fix NaN.NaN.NaN
// ============================================
function formatData(dateStr) {
    if (!dateStr) return '__.__.____';
    if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        if (d && m && y) return `${d.padStart(2,'0')}.${m.padStart(2,'0')}.${y}`;
    }
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
// APPLY CUSTOM VALUES
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
    let runs = [], m;
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
            let tcMatch, tcCount = 0, newRow = row.full;
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
// MERGE MEDIA — kopjon vetëm images (jo OLE/embedded docs)
// ============================================
function mergeMediaAndRels(sourceZip, targetZip) {
    const ridMap = {};
    const sourceRelsFile = sourceZip.file('word/_rels/document.xml.rels');
    if (!sourceRelsFile) return ridMap;
    const sourceRels = sourceRelsFile.asText();
    const targetRelsFile = targetZip.file('word/_rels/document.xml.rels');
    if (!targetRelsFile) return ridMap;
    let targetRels = targetRelsFile.asText();

    const ridNums = [];
    const ridRegex = /Id="rId(\d+)"/g;
    let rm;
    while ((rm = ridRegex.exec(targetRels)) !== null) {
        ridNums.push(parseInt(rm[1]));
    }
    let nextRid = ridNums.length > 0 ? Math.max(...ridNums) + 1 : 100;

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

        // Kopjo VETËM images — jo package/oleObject (që prishin dokumentin)
        if (!type.includes('image')) continue;

        const sourcePath = 'word/' + relTarget;
        const sourceFile = sourceZip.file(sourcePath);
        if (!sourceFile) continue;

        const ext = path.extname(relTarget);
        const newFileName = 'media/merged_' + nextRid + ext;

        targetZip.file('word/' + newFileName, sourceFile.asUint8Array());

        const newRid = 'rId' + nextRid;
        const newRel = `<Relationship Id="${newRid}" Type="${type}" Target="${newFileName}"/>`;
        targetRels = targetRels.replace('</Relationships>', newRel + '</Relationships>');

        ridMap[oldRid] = newRid;
        nextRid++;
    }

    targetZip.file('word/_rels/document.xml.rels', targetRels);
    return ridMap;
}

function remapRids(xmlContent, ridMap) {
    let result = xmlContent;
    const sortedOldRids = Object.keys(ridMap).sort((a, b) => {
        return parseInt(b.replace('rId', '')) - parseInt(a.replace('rId', ''));
    });
    for (const oldRid of sortedOldRids) {
        const newRid = ridMap[oldRid];
        result = result.replace(new RegExp('r:embed="' + oldRid + '"', 'g'), 'r:embed="' + newRid + '"');
        result = result.replace(new RegExp('r:id="' + oldRid + '"', 'g'), 'r:id="' + newRid + '"');
        result = result.replace(new RegExp('r:link="' + oldRid + '"', 'g'), 'r:link="' + newRid + '"');
    }
    return result;
}

function extractBodyContent(xml) {
    const body = xml.match(/<w:body>([\s\S]*?)<\/w:body>/);
    if (!body) return '';
    let content = body[1];
    content = content.replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/g, '');
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

    // Render me docxtemplater — por shto {~pakot} si null që mos dalë "undefined"
    const doc = new Docxtemplater(mainZip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: function() { return ''; }
    });

    const kontraktuesEmri = k.lloji === 'individ' ? k.emri : k.perfaqesuesi;
    const pozitaKlientit = k.lloji === 'biznes' ? k.pozita : 'Kontraktues';

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
    });

    const renderedZip = doc.getZip();
    let mainXml = renderedZip.file('word/document.xml').asText();

    // --- HAPI 2: Gjej pozicionin e {~pakot} placeholder ---
    // Docxtemplater e ka zëvendësuar {~pakot} me '' (bosh) falë nullGetter
    // Duhet gjetur paragrafën bosh ku ishte {~pakot} — mes "dhe Primet" dhe tabelës së nënshkrimit
    // Strategjia: gjej paragrafën bosh pas "dhe Primet" dhe zëvendëso me pakot content

    // Gjej pozicionin ku do insertohen pakot:
    // Kërko "dhe Primet" ose "Aneksi 1" në XML, pastaj inserto pakot pas asaj paragrafe
    const PAKOT_MARKER = 'dhe Primet';
    const markerIdx = mainXml.lastIndexOf(PAKOT_MARKER);
    let insertPoint = -1;

    if (markerIdx > 0) {
        // Gjej fundin e paragrafës që përmban "dhe Primet"
        const afterMarker = mainXml.indexOf('</w:p>', markerIdx);
        if (afterMarker > 0) {
            insertPoint = afterMarker + '</w:p>'.length;
        }
    }

    // --- HAPI 3: Ndërto pako content ---
    const PAKO_FILES = k.lloji === 'individ' ? PAKO_FILES_INDIVID : PAKO_FILES_FAMILJE_BIZNES;

    const pakotDataMap = {};
    if (k.pakotData && Array.isArray(k.pakotData)) {
        k.pakotData.forEach(pd => {
            if (pd && pd.emri) pakotDataMap['Pako ' + pd.emri] = pd;
            if (pd && pd.id) pakotDataMap[pd.id] = pd;
        });
    }

    const pakotEmra = k.pakot || [];
    const pakotRenditura = PAKO_RENDITJA.filter(p => pakotEmra.includes(p));
    let allPakoContent = '';

    pakotRenditura.forEach((pakoEmri, pakoIdx) => {
        const fileName = PAKO_FILES[pakoEmri];
        if (!fileName) return;
        const filePath = path.join(templatesDir, fileName);
        if (!fs.existsSync(filePath)) return;

        const pakoZip = new PizZip(fs.readFileSync(filePath));
        let pakoXml = pakoZip.file('word/document.xml').asText();

        const pakoData = pakotDataMap[pakoEmri];
        if (pakoData) {
            pakoXml = applyCustomValues(pakoXml, { ...pakoData });
        }

        const ridMap = mergeMediaAndRels(pakoZip, renderedZip);
        let pakoContent = extractBodyContent(pakoXml);
        if (Object.keys(ridMap).length > 0) {
            pakoContent = remapRids(pakoContent, ridMap);
        }

        if (pakoContent) {
            // Page break para çdo pakos (përveç të parës nëse insertohet direkt pas titullit)
            if (pakoIdx > 0) {
                allPakoContent += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
            }
            allPakoContent += pakoContent;
        }
    });

    // --- HAPI 4: Inserto pakot në pozicionin e saktë ---
    if (insertPoint > 0 && allPakoContent) {
        // Heq paragrafën bosh pas markerit (ku ishte {~pakot})
        // Gjej paragrafën bosh menjëherë pas insertPoint
        const nextParagraph = mainXml.substring(insertPoint).match(/^\s*<w:p\b[^>]*>(\s*<w:r>\s*<w:t>\s*<\/w:t>\s*<\/w:r>\s*)?<\/w:p>/);
        if (nextParagraph) {
            // Zëvendëso paragrafën bosh me pakot content
            mainXml = mainXml.substring(0, insertPoint) + allPakoContent + mainXml.substring(insertPoint + nextParagraph[0].length);
        } else {
            // Inserto direkt pas markerit
            mainXml = mainXml.substring(0, insertPoint) + allPakoContent + mainXml.substring(insertPoint);
        }
    } else if (allPakoContent) {
        // Fallback: inserto para </w:body> (si para)
        mainXml = mainXml.replace(/<\/w:body>/, allPakoContent + '</w:body>');
    }

    // --- HAPI 5: Bashko aneksi2.docx (vetëm 1 herë, në fund, para nënshkrimit nuk ka sens — pas gjithçkaje) ---
    const aneksPath = path.join(templatesDir, 'aneksi2.docx');
    if (fs.existsSync(aneksPath)) {
        const aneksZip = new PizZip(fs.readFileSync(aneksPath));
        const aneksXml = aneksZip.file('word/document.xml').asText();

        // Kopjo vetëm images (jo embedded docs)
        const ridMap = mergeMediaAndRels(aneksZip, renderedZip);
        let aneksContent = extractBodyContent(aneksXml);
        if (Object.keys(ridMap).length > 0) {
            aneksContent = remapRids(aneksContent, ridMap);
        }

        // Heq OLE objects / embedded docs nga aneks content (prishin Word-in)
        aneksContent = aneksContent.replace(/<w:object\b[\s\S]*?<\/w:object>/g, '');
        aneksContent = aneksContent.replace(/<o:OLEObject[\s\S]*?\/>/g, '');

        if (aneksContent) {
            const pageBreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
            mainXml = mainXml.replace(/<\/w:body>/, pageBreak + aneksContent + '</w:body>');
        }
    }

    // --- HAPI 6: Ruaj ---
    renderedZip.file('word/document.xml', mainXml);
    const buf = renderedZip.generate({ type: 'nodebuffer' });
    const outputName = `Kontrata_${(k.emri || 'klient').replace(/\s+/g, '_')}_${formatData(k.dataKontrates).replace(/\./g, '-')}.docx`;
    const outputPath = path.join(outputDir || path.join(__dirname, '..', 'output'), outputName);
    fs.writeFileSync(outputPath, buf);

    return outputPath;
}

module.exports = { gjenerKontrate };