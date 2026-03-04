const PizZip = require('pizzip');
const fs = require('fs');

async function mergeDocx(buffers) {
    if (buffers.length === 1) return buffers[0];
    
    const mainZip = new PizZip(buffers[0]);
    
    for (let i = 1; i < buffers.length; i++) {
        const addZip = new PizZip(buffers[i]);
        
        // 1. Lexo XML-te
        let mainXml = mainZip.file('word/document.xml').asText();
        const addXml = addZip.file('word/document.xml').asText();
        const addBody = addXml.match(/<w:body>([\s\S]*?)<\/w:body>/);
        if (!addBody) continue;
        
        let content = addBody[1];
        content = content.replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/g, '');
        
        // 2. Lexo relationships
        const mainRelsPath = 'word/_rels/document.xml.rels';
        let mainRels = mainZip.file(mainRelsPath).asText();
        const addRels = addZip.file(mainRelsPath) ? addZip.file(mainRelsPath).asText() : '';
        
        // Gjej max rId ne main
        let maxId = 0;
        const allIds = mainRels.match(/Id="rId(\d+)"/g) || [];
        allIds.forEach(m => {
            const num = parseInt(m.match(/\d+/)[0]);
            if (num > maxId) maxId = num;
        });
        
        // 3. Proceso cdo relationship nga aneksi
        const rIdMap = {};
        const relRegex = /<Relationship\s+[^>]*>/g;
        let relMatch;
        
        while ((relMatch = relRegex.exec(addRels)) !== null) {
            const rel = relMatch[0];
            const idMatch = rel.match(/Id="(rId(\d+))"/);
            const targetMatch = rel.match(/Target="([^"]+)"/);
            const typeMatch = rel.match(/Type="([^"]+)"/);
            const modeMatch = rel.match(/TargetMode="([^"]+)"/);
            
            if (!idMatch || !targetMatch || !typeMatch) continue;
            
            const oldId = idMatch[1];
            const target = targetMatch[1];
            const type = typeMatch[1];
            const isExternal = modeMatch && modeMatch[1] === 'External';
            
            // Skip styles, settings, numbering, fontTable, theme, webSettings
            if (type.includes('/styles') || type.includes('/settings') || 
                type.includes('/fontTable') || type.includes('/theme') ||
                type.includes('/webSettings')) continue;
            
            maxId++;
            const newId = `rId${maxId}`;
            rIdMap[oldId] = newId;
            
            // Kopjo file-in nese nuk eshte external
            if (!isExternal) {
                const filePath = 'word/' + target;
                const addFile = addZip.file(filePath);
                if (addFile) {
                    // Nese ekziston tashme, riemero
                    let newTarget = target;
                    if (mainZip.file('word/' + target)) {
                        const ext = target.split('.').pop();
                        const base = target.replace(/\.[^.]+$/, '');
                        newTarget = base + '_merged' + i + '.' + ext;
                    }
                    mainZip.file('word/' + newTarget, addFile.asUint8Array());
                    
                    let newRel = `<Relationship Id="${newId}" Type="${type}" Target="${newTarget}"/>`;
                    mainRels = mainRels.replace('</Relationships>', newRel + '\n</Relationships>');
                } else {
                    // File nuk ekziston, shto relationship pa file
                    let newRel = `<Relationship Id="${newId}" Type="${type}" Target="${target}"/>`;
                    mainRels = mainRels.replace('</Relationships>', newRel + '\n</Relationships>');
                }
            } else {
                // External link (hyperlink, etj)
                let newRel = `<Relationship Id="${newId}" Type="${type}" Target="${target}" TargetMode="External"/>`;
                mainRels = mainRels.replace('</Relationships>', newRel + '\n</Relationships>');
            }
        }
        
        // 4. Zevendeso rId-te ne content
        for (const [oldId, newId] of Object.entries(rIdMap)) {
            const patterns = [
                new RegExp(`r:embed="${oldId}"`, 'g'),
                new RegExp(`r:id="${oldId}"`, 'g'),
                new RegExp(`r:link="${oldId}"`, 'g'),
                new RegExp(`w:id="${oldId}"`, 'g'),
            ];
            patterns.forEach(regex => {
                content = content.replace(regex, regex.source.replace(oldId, newId).replace(/\\/g, ''));
            });
        }
        
        // 5. Zevendeso rId me menyre ma te sigurt
        for (const [oldId, newId] of Object.entries(rIdMap)) {
            content = content.split(`"${oldId}"`).join(`"${newId}"`);
        }
        
        // 6. Kopjo numbering nese ekziston
        if (addZip.file('word/numbering.xml') && !mainZip.file('word/numbering.xml')) {
            mainZip.file('word/numbering.xml', addZip.file('word/numbering.xml').asUint8Array());
            // Shto numbering relationship ne main
            if (!mainRels.includes('/numbering')) {
                maxId++;
                const numRel = `<Relationship Id="rId${maxId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>`;
                mainRels = mainRels.replace('</Relationships>', numRel + '\n</Relationships>');
            }
        }
        
        // 7. Update Content_Types nese duhet
        let contentTypes = mainZip.file('[Content_Types].xml').asText();
        if (!contentTypes.includes('image/x-emf') && content.includes('.emf')) {
            contentTypes = contentTypes.replace('</Types>', '<Default Extension="emf" ContentType="image/x-emf"/></Types>');
        }
        if (!contentTypes.includes('image/jpeg') && content.includes('.jpeg')) {
            contentTypes = contentTypes.replace('</Types>', '<Default Extension="jpeg" ContentType="image/jpeg"/></Types>');
        }
        if (!contentTypes.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') && addZip.file('word/embeddings/Microsoft_Word_Document1.docx')) {
            // Kopjo embedded document
            mainZip.file('word/embeddings/Microsoft_Word_Document1.docx', 
                addZip.file('word/embeddings/Microsoft_Word_Document1.docx').asUint8Array());
            if (!contentTypes.includes('docx')) {
                contentTypes = contentTypes.replace('</Types>', 
                    '<Override PartName="/word/embeddings/Microsoft_Word_Document1.docx" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document"/></Types>');
            }
        }
        mainZip.file('[Content_Types].xml', contentTypes);
        
        // 8. Fut content ne document
        const pageBreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
        mainXml = mainXml.replace(/<\/w:body>/, pageBreak + content + '</w:body>');
        
        // Ruaj
        mainZip.file('word/document.xml', mainXml);
        mainZip.file(mainRelsPath, mainRels);
    }
    
    return mainZip.generate({ type: 'nodebuffer' });
}

module.exports = mergeDocx;