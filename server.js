const express = require('express');
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