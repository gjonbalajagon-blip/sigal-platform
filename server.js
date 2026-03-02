const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { gjenerKontrate } = require('./gjenero-kontrate');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Endpoint për gjenerimin e kontratës
app.post('/api/gjenero-kontrate', (req, res) => {
    try {
        const klienti = req.body;
        const outputPath = gjenerKontrate(klienti, path.join(__dirname, 'output'));
        const fileName = path.basename(outputPath);
        res.json({ success: true, fileName });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Endpoint për shkarkimin e skedarit
app.get('/api/shkarko/:fileName', (req, res) => {
    const filePath = path.join(__dirname, 'output', req.params.fileName);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'Skedari nuk u gjet' });
    }
});

app.listen(3000, () => {
    console.log('✅ Serveri është aktiv në http://localhost:3000');
});
