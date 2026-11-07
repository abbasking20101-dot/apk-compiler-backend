const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = 'FFX_SECRET_API_KEY_2026'; // Wahi API key jo frontend mein hai

app.use(cors());
app.use(express.json());

// Folders setup
const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const upload = multer({ dest: uploadDir });

// Jobs storage (Memory mein status track karne ke liye)
const jobs = {};

// Auth middleware
const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apikey;
    if (apiKey !== API_KEY) {
        return res.status(403).json({ error: 'Unauthorized: Invalid API Key' });
    }
    next();
};

// 1. Generate / Compile Endpoint
app.post('/generate', verifyApiKey, upload.fields([{ name: 'htmlFiles' }], 10), (req, res) => {
    try {
        const { appName } = req.body;
        const files = req.files['htmlFiles'];

        if (!appName || !files || files.length === 0) {
            return res.status(400).json({ error: 'App name and HTML file are required.' });
        }

        const jobId = uuidv4().substring(0, 8);
        
        jobs[jobId] = {
            appName,
            status: 'queued',
            step: 'In queue...',
            progress: '0%',
            createdAt: new Date()
        };

        res.json({ jobId, message: 'Build started successfully.' });

        // Background me APK compilation process simulate ya run karna
        processBuild(jobId, appName, files[0].path);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Build Processor Function
async function processBuild(jobId, appName, htmlPath) {
    try {
        jobs[jobId].status = 'processing';
        jobs[jobId].step = 'Setting up Android project environment...';
        jobs[jobId].progress = '25%';

        await new Promise(resolve => setTimeout(resolve, 3000)); // Build simulation / compiling time

        jobs[jobId].step = 'Compiling HTML into APK package...';
        jobs[jobId].progress = '60%';

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Dummy APK file generate karna testing ke liye (Yahan aap apna actual APK builder script laga sakte hain)
        const outputApkPath = path.join(outputDir, `${jobId}.apk`);
        fs.writeFileSync(outputApkPath, `Dummy APK content for ${appName}`);

        jobs[jobId].status = 'done';
        jobs[jobId].step = 'Build complete';
        jobs[jobId].progress = '100%';
        jobs[jobId].apkPath = outputApkPath;

    } catch (error) {
        jobs[jobId].status = 'error';
        jobs[jobId].step = 'Build failed';
        jobs[jobId].error = error.message;
    }
}

// 2. Status Check Endpoint
app.get('/status/:jobId', verifyApiKey, (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({
        status: job.status,
        step: job.step,
        progress: job.progress,
        error: job.error
    });
});

// 3. Download Endpoint
app.get('/download/:jobId', verifyApiKey, (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job || job.status !== 'done') {
        return res.status(404).json({ error: 'APK not ready or job not found.' });
    }

    if (fs.existsSync(job.apkPath)) {
        res.download(job.apkPath, `${job.appName.replace(/[^a-zA-Z0-9]/g, '_')}.apk`);
    } else {
        res.status(404).json({ error: 'APK file missing on server.' });
    }
});

app.listen(PORT, () => {
    console.log(`Compiler Backend running on port ${PORT}`);
});
