const PizZip = require('pizzip');

async function mergeDocx(buffers) {
    if (buffers.length === 1) return buffers[0];
    
    const mainZip = new PizZip(buffers[0]);
    let mainXml = mainZip.file('word/document.xml').asText();
    
    // Gjej sectPr-in e fundit te dokumentit kryesor (page setup)
    const sectPrMatch = mainXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/g);
    const lastSectPr = sectPrMatch ? sectPrMatch[sectPrMatch.length - 1] : '';
    
    for (let i = 1; i < buffers.length; i++) {
        const zip = new PizZip(buffers[i]);
        const xml = zip.file('word/document.xml').asText();
        const body = xml.match(/<w:body>([\s\S]*?)<\/w:body>/);
        if (body) {
            let content = body[1];
            // Fshi sectPr nga dokumenti shtese
            content = content.replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/g, '');
            // Shto page break para contentit te ri
            const pageBreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
            // Fute para </w:body> por pas sectPr te dokumentit kryesor
            mainXml = mainXml.replace(/<\/w:body>/, pageBreak + content + '</w:body>');
        }
        
        // Kopjo relationships nga dokumenti shtese
        const relsPath = 'word/_rels/document.xml.rels';
        if (zip.file(relsPath) && mainZip.file(relsPath)) {
            let mainRels = mainZip.file(relsPath).asText();
            const addRels = zip.file(relsPath).asText();
            
            // Gjej ID-te ekzistuese
            const existingIds = new Set();
            const idRegex = /Id="(rId\d+)"/g;
            let match;
            while ((match = idRegex.exec(mainRels)) !== null) {
                existingIds.add(match[1]);
            }
            
            // Gjej max rId
            let maxId = 0;
            existingIds.forEach(id => {
                const num = parseInt(id.replace('rId', ''));
                if (num > maxId) maxId = num;
            });
            
            // Shto relationships te reja qe nuk ekzistojne
            const relRegex = /<Relationship[^>]*\/>/g;
            let relMatch;
            while ((relMatch = relRegex.exec(addRels)) !== null) {
                const rel = relMatch[0];
                const target = rel.match(/Target="([^"]+)"/);
                if (target && !mainRels.includes(`Target="${target[1]}"`)) {
                    maxId++;
                    const newRel = rel.replace(/Id="rId\d+"/, `Id="rId${maxId}"`);
                    mainRels = mainRels.replace('</Relationships>', newRel + '</Relationships>');
                }
            }
            mainZip.file(relsPath, mainRels);
        }
    }
    
    mainZip.file('word/document.xml', mainXml);
    return mainZip.generate({ type: 'nodebuffer' });
}

module.exports = mergeDocx;