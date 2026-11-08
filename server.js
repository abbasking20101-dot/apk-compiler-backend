const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer setup for handling uploaded HTML files
const upload = multer({ dest: 'uploads/' });

// Serve static frontend files if needed, or serve index.html directly
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 1. Generate/Process Endpoint matching your frontend request
app.post('/generate', upload.any(), (req, res) => {
    try {
        const appName = req.body.appName || 'GamerKingApp';
        const file = req.files ? req.files[0] : null;

        if (!file) {
            return res.status(400).json({ error: 'HTML file is required.' });
        }

        // Unique Job ID generate karna
        const jobId = 'job_' + Date.now();
        
        // yahan aap chahein toh file ko read karke process kar sakte hain
        // Filhal hum ek simulation job ID return kar rahe hain jo frontend ko success degi

        res.json({ jobId: jobId, status: 'queued' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Status Check Endpoint
app.get('/status/:jobId', (req, res) => {
    // Turant 'done' status bhej raha hai taaki turant download link mil jaye
    res.json({
        status: 'done',
        step: 'Build Complete successfully!'
    });
});

// 3. Download Endpoint (Jo app package ya file download karwayega)
app.get('/download/:jobId', (req, res) => {
    // Ek sample ready HTML/Zip package download ke liye
    const dummyContent = `<!DOCTYPE html><html><head><title>App</title></head><body><h1>Packed App</h1></body></html>`;
    const fileName = "gamer_king_app.html";
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(dummyContent);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
