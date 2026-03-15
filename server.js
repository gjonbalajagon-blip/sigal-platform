const express = require('express');

// ===== BREVO EMAIL (zëvendëson Resend) =====
const BREVO_API_KEY = process.env.BREVO_API_KEY;

async function dergoPosto(to, subject, html) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': BREVO_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            sender: { name: 'SIGAL Insurance', email: process.env.SENDER_EMAIL || 'gjonbalajagon@gmail.com' },
            to: [{ email: to }],
            subject,
            htmlContent: html
        })
    });
    const data = await res.json();
    if (!res.ok) {
        console.error('Brevo error:', data);
        throw new Error(data.message || 'Email dështoi');
    }
    return data;
}

const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { gjenerKontrate } = require('./gjenero-kontrate');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Krijo output folder nese nuk ekziston
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Endpoint per gjenerimin e kontrates
app.post('/api/gjenero-kontrate', async (req, res) => {
    try {
        const klienti = req.body;
        const outputPath = await gjenerKontrate(klienti, outputDir);
        const fileName = path.basename(outputPath);
        res.json({ success: true, fileName });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Endpoint per gjenerimin e ofertes
app.post('/api/gjenero-oferte', async (req, res) => {
    try {
        const o = req.body;
        const PizZip = require('pizzip');
        const fs = require('fs');
        const path = require('path');

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

        const PAKO_FILES = o.lloji === 'individ' ? PAKO_FILES_INDIVID : PAKO_FILES_FAMILJE_BIZNES;
        const renditja = ['Pako Bazë', 'Pako Standard', 'Pako Standard Plus', 'Pako Premium', 'Pako Silver', 'Pako Gold'];
        const pakotRenditura = renditja.filter(p => (o.pakot || []).includes(p));

        if (pakotRenditura.length === 0) {
            return res.status(400).json({ success: false, error: 'Nuk keni zgjedhur asnjë pako!' });
        }

        // Merr dokumentin e pare si baze
        const firstFile = PAKO_FILES[pakotRenditura[0]];
        const firstPath = path.join(__dirname, 'templates', firstFile);
        if (!fs.existsSync(firstPath)) {
            return res.status(400).json({ success: false, error: 'Template nuk u gjet: ' + firstFile });
        }

        const mainZip = new PizZip(fs.readFileSync(firstPath));
        let mainXml = mainZip.file('word/document.xml').asText();

        // Shto pakot e tjera
        for (let i = 1; i < pakotRenditura.length; i++) {
            const fileName = PAKO_FILES[pakotRenditura[i]];
            const filePath = path.join(__dirname, 'templates', fileName);
            if (!fs.existsSync(filePath)) continue;

            const pakoZip = new PizZip(fs.readFileSync(filePath));
            const pakoXml = pakoZip.file('word/document.xml').asText();
            const body = pakoXml.match(/<w:body>([\s\S]*?)<\/w:body>/);
            if (body) {
                let content = body[1];
                content = content.replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/g, '');
                content = content.replace(/(<w:p[^>]*>\s*<\/w:p>\s*)+$/g, '');
                const pageBreak = '<w:p w:rsidR="00000000"><w:r><w:br w:type="page"/></w:r></w:p>';
                mainXml = mainXml.replace(/<\/w:body>/, pageBreak + content + '</w:body>');
            }
        }

        mainZip.file('word/document.xml', mainXml);
        const outputBuf = mainZip.generate({ type: 'nodebuffer' });

        const outputName = `Oferta_${o.emri.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
        const outputPath = path.join(__dirname, 'output', outputName);
        fs.writeFileSync(outputPath, outputBuf);

        res.json({ success: true, fileName: outputName });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Endpoint per konfirmimin e ofertes — dergon email te AGJENTI + KLIENTI
app.post('/api/konfirmo-oferte', async (req, res) => {
    try {
        const { emriKlientit, emailKlientit, pakaZgjedhur, koment, emailAgjentit } = req.body;

        // 1. Email te AGJENTI
        await dergoPosto(
            emailAgjentit || process.env.SENDER_EMAIL || 'gjonbalajagon@gmail.com',
            `Konfirmim Oferte - ${emriKlientit}`,
            `<h2>Konfirmim i Ofertës</h2>
            <p><strong>Klienti:</strong> ${emriKlientit}</p>
            <p><strong>Paketa e zgjedhur:</strong> ${pakaZgjedhur}</p>
            <p><strong>Koment:</strong> ${koment || 'Pa koment'}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleDateString('sq-AL')}</p>`
        );

        // 2. Email te KLIENTI
        if (emailKlientit) {
            await dergoPosto(
                emailKlientit,
                `Konfirmimi i Ofertës - SIGAL Insurance Group`,
                `<h2>Faleminderit, ${emriKlientit}!</h2>
                <p>Zgjedhja juaj është regjistruar me sukses.</p>
                <p><strong>Paketa e zgjedhur:</strong> ${pakaZgjedhur}</p>
                <p>Agjenti ynë do t'ju kontaktojë së shpejti.</p>
                <br>
                <p>Me respekt,<br><strong>SIGAL KS Insurance Group</strong></p>`
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Endpoint per shkarkimin e skedarit
app.get('/api/shkarko/:fileName', (req, res) => {
    const filePath = path.join(__dirname, 'output', req.params.fileName);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'Skedari nuk u gjet' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveri eshte aktiv ne port ${PORT}`);
});