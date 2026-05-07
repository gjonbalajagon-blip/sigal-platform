const express = require('express');

// ===== BREVO EMAIL =====
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
const { gjenerKontrate } = require('./js/gjenero-kontrate');

const app = express();

// ===== CORS — i kufizuar te frontend Vercel + localhost =====
const ALLOWED_ORIGINS = [
    'https://sigal-platform-shendet.vercel.app',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
];
app.use(cors({
    origin: function (origin, callback) {
        // Allow no-origin (curl, UptimeRobot, server-to-server)
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin) || /\.vercel\.app$/.test(origin)) {
            return callback(null, true);
        }
        callback(new Error('CORS: origin nuk lejohet (' + origin + ')'));
    }
}));

app.use(express.json({ limit: '10mb' }));

const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// ===== HEALTH CHECK (per Render + UptimeRobot) =====
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'sigal-platform-backend',
        time: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ============================================
// TRACKING
// ============================================
const ofertaTracking = {};

app.post('/api/oferta-track', (req, res) => {
    try {
        const { ofertaId, event, data } = req.body;
        if (!ofertaId || !event) return res.status(400).json({ error: 'Missing ofertaId or event' });
        if (!ofertaTracking[ofertaId]) {
            ofertaTracking[ofertaId] = { statusi: 'e_krijuar', hapjet: [], konfirmimi: null, kohaTotale: 0 };
        }
        const t = ofertaTracking[ofertaId];
        const now = new Date().toISOString();
        if (event === 'hapje') {
            if (t.statusi === 'e_krijuar' || t.statusi === 'e_derguar') t.statusi = 'e_pare';
            t.hapjet.push({ data: now, userAgent: data?.userAgent || '' });
        } else if (event === 'koha') {
            t.kohaTotale += (data?.sekonda || 0);
        } else if (event === 'konfirmim') {
            t.statusi = 'e_konfirmuar';
            t.konfirmimi = { data: now, pakot: data?.pakot || '', opsionale: data?.opsionale || [], koment: data?.koment || '' };
        }
        res.json({ ok: true, statusi: t.statusi });
    } catch (e) {
        console.error('Track error:', e);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/oferta-status/:id', (req, res) => {
    const t = ofertaTracking[req.params.id];
    if (!t) return res.json({ statusi: 'e_krijuar', hapjet: 0, kohaTotale: 0, konfirmimi: null });
    res.json({
        statusi: t.statusi,
        hapjet: t.hapjet.length,
        hapjaFundit: t.hapjet.length > 0 ? t.hapjet[t.hapjet.length - 1].data : null,
        kohaTotale: t.kohaTotale,
        konfirmimi: t.konfirmimi
    });
});

app.post('/api/oferta-derguar', (req, res) => {
    const { ofertaId } = req.body;
    if (!ofertaId) return res.status(400).json({ error: 'Missing ofertaId' });
    if (!ofertaTracking[ofertaId]) {
        ofertaTracking[ofertaId] = { statusi: 'e_derguar', hapjet: [], konfirmimi: null, kohaTotale: 0 };
    } else {
        if (ofertaTracking[ofertaId].statusi === 'e_krijuar') ofertaTracking[ofertaId].statusi = 'e_derguar';
    }
    res.json({ ok: true });
});

// ============================================
// KONTRATE
// ============================================
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

// ============================================
// GJENERO OFERTE — me zëvendësim të limiteve
// ============================================

// Mapping: rreshti i tabelës → fusha në pakotData
// Rreshtat 3,11,18,28 janë HEADER (nuk zëvendësohen)
const ROW_MAP = {
    1: 'zona',
    2: 'shuma',
    // Hospitalore pikat (4-10) — zëvendësohen vetëm nëse ka fushë 'hospitalore'
    // Ambulantore pikat (12-17) — zëvendësohen vetëm nëse ka fushë 'ambulantore'
    19: 'tjera_0',
    20: 'tjera_1',
    21: 'tjera_2',
    22: 'tjera_3',
    23: 'tjera_4',
    24: 'tjera_5',
    25: 'tjera_6',
    26: 'tjera_7',
    27: 'tjera_8',
    29: 'primi_madh',
    30: 'primi_femije',
};

// Rreshtat hospitalore (4-10): nëse oferta ka vlerë custom 'hospitalore', zëvendëso të gjitha
const HOSP_ROWS = [4, 5, 6, 7, 8, 9, 10];
// Rreshtat ambulantore (12-17): nëse oferta ka vlerë custom 'ambulantore', zëvendëso të gjitha
const AMB_ROWS = [12, 13, 14, 15, 16, 17];

function applyCustomValues(docXml, pakoData) {
    // Përdor regex për të gjetur dhe zëvendësuar vlerat në kolonën e dytë të tabelës
    // Kjo qasje punon me XML-në e word/document.xml direkt
    // Nuk ndryshon strukturën — vetëm tekstin brenda çelulës së dytë
 // Konverto tjera_pikat array → tjera_0..tjera_8 nëse mungojnë
    if(pakoData.tjera_pikat && Array.isArray(pakoData.tjera_pikat)){
        pakoData.tjera_pikat.forEach((tp,idx)=>{
            const key='tjera_'+idx;
            if(!pakoData[key] && tp && tp.vlera) pakoData[key]=tp.vlera;
        });
    }
    // Parse tabelën — gjej të gjitha rreshtat <w:tr>
    const trRegex = /<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/g;
    let rowIndex = 0;
    let result = docXml;
    const rows = [];
    let match;

    while ((match = trRegex.exec(docXml)) !== null) {
        rows.push({ full: match[0], content: match[1], index: rowIndex, start: match.index });
        rowIndex++;
    }

    // Për çdo rresht që ka mapping
    for (let i = rows.length - 1; i >= 0; i--) {
        const row = rows[i];
        const ri = row.index;
        let newValue = null;

        // Kontrollo nëse ka vlerë custom
        if (ROW_MAP[ri] && pakoData[ROW_MAP[ri]] !== undefined && pakoData[ROW_MAP[ri]] !== '') {
            newValue = pakoData[ROW_MAP[ri]];
            // Shto prefix për shuma
            if (ri === 2 && newValue && !newValue.startsWith('€')) newValue = '€ ' + newValue;
            if (ri === 29 && newValue && !newValue.startsWith('€')) newValue = '€ ' + newValue + ',00';
            if (ri === 30 && newValue && !newValue.startsWith('€')) newValue = '€ ' + newValue + ',00';
        }

        // Hospitalore: nëse ka custom 'hospitalore', zëvendëso gjithë rreshtat 4-10
        if (HOSP_ROWS.includes(ri) && pakoData.hospitalore && pakoData.hospitalore !== '') {
            newValue = pakoData.hospitalore;
        }

        // Ambulantore: nëse ka custom 'ambulantore', zëvendëso gjithë rreshtat 12-17
        if (AMB_ROWS.includes(ri) && pakoData.ambulantore && pakoData.ambulantore !== '') {
            newValue = pakoData.ambulantore;
        }

        if (newValue !== null) {
            // Gjej kolonën e dytë (<w:tc>) në këtë rresht
            const tcRegex = /<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/g;
            let tcMatch;
            let tcCount = 0;
            let newRow = row.full;

            // Reset regex
            tcRegex.lastIndex = 0;
            while ((tcMatch = tcRegex.exec(row.full)) !== null) {
                tcCount++;
                if (tcCount === 2) {
                    // Kjo është kolona e dytë — zëvendëso tekstin
                    const oldTc = tcMatch[0];
                    // Gjej <w:t> brenda kësaj çelule
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

function replaceTextInCell(tcXml, newText) {
    // Gjej të gjitha <w:t> brenda çelulës dhe zëvendëso me vlerën e re
    // Mbaj formatin e parë <w:r> por ndrysho tekstin
    const wRunRegex = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g;
    let runs = [];
    let m;
    while ((m = wRunRegex.exec(tcXml)) !== null) {
        runs.push({ full: m[0], content: m[1], index: m.index });
    }

    if (runs.length === 0) return tcXml;

    // Mbaj vetëm run-in e parë, zëvendëso tekstin, fshi të tjerët
    let firstRun = runs[0].full;
    // Zëvendëso <w:t>...</w:t> me vlerën e re
    firstRun = firstRun.replace(/<w:t[^>]*>[^<]*<\/w:t>/, '<w:t xml:space="preserve">' + escapeXml(newText) + '</w:t>');

    let newTc = tcXml;
    // Fshi të gjitha run-et ekzistuese
    for (let i = runs.length - 1; i >= 0; i--) {
        newTc = newTc.replace(runs[i].full, i === 0 ? firstRun : '');
    }

    return newTc;
}

function escapeXml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

app.post('/api/gjenero-oferte', async (req, res) => {
    try {
        const o = req.body;
        const PizZip = require('pizzip');

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

        // Mapping emri i pakos → data custom (nëse ka)
        const pakotDataMap = {};
        if (o.pakotData && Array.isArray(o.pakotData)) {
            o.pakotData.forEach(pd => {
                if (pd && pd.emri) {
                    pakotDataMap['Pako ' + pd.emri] = pd;
                }
            });
        }

        const firstFile = PAKO_FILES[pakotRenditura[0]];
        const firstPath = path.join(__dirname, 'templates', firstFile);
        if (!fs.existsSync(firstPath)) {
            return res.status(400).json({ success: false, error: 'Template nuk u gjet: ' + firstFile });
        }

        const mainZip = new PizZip(fs.readFileSync(firstPath));
        let mainXml = mainZip.file('word/document.xml').asText();

        // Apliko vlerat custom për pakën e parë
        const firstPakoData = pakotDataMap[pakotRenditura[0]];
        if (firstPakoData) {
            mainXml = applyCustomValues(mainXml, firstPakoData);
        }

        for (let i = 1; i < pakotRenditura.length; i++) {
            const fileName = PAKO_FILES[pakotRenditura[i]];
            const filePath = path.join(__dirname, 'templates', fileName);
            if (!fs.existsSync(filePath)) continue;
            const pakoZip = new PizZip(fs.readFileSync(filePath));
            let pakoXml = pakoZip.file('word/document.xml').asText();

            // Apliko vlerat custom për këtë pako
            const pakoData = pakotDataMap[pakotRenditura[i]];
            if (pakoData) {
                pakoXml = applyCustomValues(pakoXml, pakoData);
            }

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

app.post('/api/konfirmo-oferte', async (req, res) => {
    try {
        const { emriKlientit, emailKlientit, pakaZgjedhur, koment, emailAgjentit } = req.body;
        await dergoPosto(
            emailAgjentit || process.env.SENDER_EMAIL || 'gjonbalajagon@gmail.com',
            `Konfirmim Oferte - ${emriKlientit}`,
            `<h2>Konfirmim i Ofertës</h2>
            <p><strong>Klienti:</strong> ${emriKlientit}</p>
            <p><strong>Paketa e zgjedhur:</strong> ${pakaZgjedhur}</p>
            <p><strong>Koment:</strong> ${koment || 'Pa koment'}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleDateString('sq-AL')}</p>`
        );
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