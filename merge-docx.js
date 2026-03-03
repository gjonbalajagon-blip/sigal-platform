const PizZip = require('pizzip');

async function mergeDocx(buffers) {
    if (buffers.length === 1) return buffers[0];
    
    const mainZip = new PizZip(buffers[0]);
    let mainXml = mainZip.file('word/document.xml').asText();
    
    for (let i = 1; i < buffers.length; i++) {
        const zip = new PizZip(buffers[i]);
        const xml = zip.file('word/document.xml').asText();
        const body = xml.match(/<w:body>([\s\S]*?)<\/w:body>/);
        if (!body) continue;
        
        let content = body[1];
        content = content.replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/g, '');
        
        // --- Kopjo media files (imazhet) ---
        const mediaFiles = {};
        zip.folder('word/media')?.forEach((relativePath, file) => {
            mediaFiles[relativePath] = file;
        });
        
        // --- Kopjo relationships dhe riemero media ---
        const relsPath = 'word/_rels/document.xml.rels';
        let mainRels = mainZip.file(relsPath) ? mainZip.file(relsPath).asText() : '';
        const addRels = zip.file(relsPath) ? zip.file(relsPath).asText() : '';
        
        // Gjej max rId ne main
        let maxId = 0;
        const idRegex = /Id="rId(\d+)"/g;
        let match;
        while ((match = idRegex.exec(mainRels)) !== null) {
            const num = parseInt(match[1]);
            if (num > maxId) maxId = num;
        }
        
        // Map per rId te vjetra -> te reja
        const rIdMap = {};
        
        // Gjej te gjitha relationships nga dokumenti shtese
        const relRegex = /<Relationship\s+([^>]*)\/>/g;
        let relMatch;
        while ((relMatch = relRegex.exec(addRels)) !== null) {
            const relStr = relMatch[0];
            const idMatch = relStr.match(/Id="(rId\d+)"/);
            const targetMatch = relStr.match(/Target="([^"]+)"/);
            const typeMatch = relStr.match(/Type="([^"]+)"/);
            
            if (!idMatch || !targetMatch || !typeMatch) continue;
            
            const oldId = idMatch[1];
            const target = targetMatch[1];
            const type = typeMatch[1];
            
            // Kontrollo nese ky target ekziston tashme
            if (mainRels.includes(`Target="${target}"`)) {
                // Gjej rId ekzistues per kete target
                const existMatch = mainRels.match(new RegExp(`Id="(rId\\d+)"[^>]*Target="${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
                if (existMatch) {
                    rIdMap[oldId] = existMatch[1];
                }
                continue;
            }
            
            maxId++;
            const newId = `rId${maxId}`;
            rIdMap[oldId] = newId;
            
            // Nese eshte media file, kopjoje
            if (target.startsWith('media/')) {
                const mediaFile = zip.file('word/' + target);
                if (mediaFile) {
                    mainZip.file('word/' + target, mediaFile.asUint8Array());
                }
            }
            
            const newRel = `<Relationship Id="${newId}" Type="${type}" Target="${target}"/>`;
            mainRels = mainRels.replace('</Relationships>', newRel + '\n</Relationships>');
        }
        
        // Zevendeso rId-te e vjetra me te rejat ne content
        for (const [oldId, newId] of Object.entries(rIdMap)) {
            if (oldId !== newId) {
                const regex = new RegExp(`r:embed="${oldId}"`, 'g');
                content = content.replace(regex, `r:embed="${newId}"`);
                const regex2 = new RegExp(`r:id="${oldId}"`, 'g');
                content = content.replace(regex2, `r:id="${newId}"`);
                const regex3 = new RegExp(`r:link="${oldId}"`, 'g');
                content = content.replace(regex3, `r:link="${newId}"`);
            }
        }
        
        // Shto page break + content
        const pageBreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
        mainXml = mainXml.replace(/<\/w:body>/, pageBreak + content + '</w:body>');
        
        // Ruaj relationships
        if (mainRels) {
            mainZip.file(relsPath, mainRels);
        }
    }
    
    mainZip.file('word/document.xml', mainXml);
    return mainZip.generate({ type: 'nodebuffer' });
}

module.exports = mergeDocx;