const PizZip = require('pizzip');

async function mergeDocx(buffers) {
    if (buffers.length === 1) return buffers[0];
    
    const mainZip = new PizZip(buffers[0]);
    let mainXml = mainZip.file('word/document.xml').asText();
    
    for (let i = 1; i < buffers.length; i++) {
        const zip = new PizZip(buffers[i]);
        const xml = zip.file('word/document.xml').asText();
        const body = xml.match(/<w:body>([\s\S]*?)<\/w:body>/);
        if (body) {
            let content = body[1].replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/g, '');
            mainXml = mainXml.replace('</w:body>', content + '</w:body>');
        }
    }
    
    mainZip.file('word/document.xml', mainXml);
    return mainZip.generate({ type: 'nodebuffer' });
}

module.exports = mergeDocx;