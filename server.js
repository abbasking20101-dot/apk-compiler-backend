const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer setup for handling uploaded files
const upload = multer({ dest: 'uploads/' });

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 1. Frontend ke /generate request ko handle karne ke liye route
app.post('/generate', upload.any(), (req, res) => {
    try {
        const jobId = 'job_' + Date.now();
        // Turant success job ID return karega
        res.json({ jobId: jobId, status: 'queued' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Status Check Route
app.get('/status/:jobId', (req, res) => {
    res.json({
        status: 'done',
        step: 'App compiled successfully!'
    });
});

// 3. Download Route (File download karwane ke liye)
app.get('/download/:jobId', (req, res) => {
    const appName = req.query.name || 'GamerKingApp';
    const dummyContent = `<!DOCTYPE html><html><head><title>${appName}</title></head><body style="background:#000;color:#fff;text-align:center;padding-top:50vh;"><h1>${appName} Loaded Successfully!</h1></body></html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename="gamer_king_app.html"');
    res.send(dummyContent);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
