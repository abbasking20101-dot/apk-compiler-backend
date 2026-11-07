const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = 'FFX_SECRET_API_KEY_2026';

app.use(cors());
app.use(express.json());

const buildBaseDir = path.join(__dirname, 'builds');
const outputDir = path.join(__dirname, 'output');
fs.ensureDirSync(buildBaseDir);
fs.ensureDirSync(outputDir);

const upload = multer({ dest: path.join(__dirname, 'uploads') });
const jobs = {};

const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apikey;
    if (apiKey !== API_KEY) {
        return res.status(403).json({ error: 'Unauthorized: Invalid API Key' });
    }
    next();
};

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
            status: 'processing',
            step: 'Initializing Cordova Build System...',
            progress: '10%'
        };

        res.json({ jobId, message: 'Build process started.' });
        buildCordovaApk(jobId, appName, files[0].path);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

function buildCordovaApk(jobId, appName, uploadedHtmlPath) {
    const projectDir = path.join(buildBaseDir, jobId);
    const safePkgName = `com.gamerking.${jobId}`;
    const safeAppName = appName.replace(/[^a-zA-Z0-9]/g, '');

    // 1. Create Cordova Project
    const createCmd = `npx cordova create "${projectDir}" "${safePkgName}" "${safeAppName}"`;
    
    exec(createCmd, (err) => {
        if (err) return failJob(jobId, 'Failed to create app framework');

        jobs[jobId].step = 'Adding Android Platform...';
        jobs[jobId].progress = '30%';

        // 2. Add Android Platform
        exec(`npx cordova platform add android`, { cwd: projectDir }, (err) => {
            if (err) return failJob(jobId, 'Failed to setup Android platform');

            jobs[jobId].step = 'Injecting HTML Assets...';
            jobs[jobId].progress = '60%';

            // 3. Replace index.html
            const wwwPath = path.join(projectDir, 'www', 'index.html');
            fs.copyFileSync(uploadedHtmlPath, wwwPath);

            jobs[jobId].step = 'Compiling Real APK Package...';
            jobs[jobId].progress = '85%';

            // 4. Build APK
            exec(`npx cordova build android`, { cwd: projectDir }, (err) => {
                if (err) return failJob(jobId, 'APK compilation failed');

                const generatedApk = path.join(projectDir, 'platforms/android/app/build/outputs/apk/debug/app-debug.apk');
                const finalApkPath = path.join(outputDir, `${jobId}.apk`);

                if (fs.existsSync(generatedApk)) {
                    fs.copySync(generatedApk, finalApkPath);
                    jobs[jobId].status = 'done';
                    jobs[jobId].step = 'Build complete';
                    jobs[jobId].progress = '100%';
                    jobs[jobId].apkPath = finalApkPath;
                } else {
                    failJob(jobId, 'APK file output missing');
                }

                // Cleanup build folder
                fs.remove(projectDir).catch(() => {});
            });
        });
    });
}

function failJob(jobId, reason) {
    jobs[jobId].status = 'error';
    jobs[jobId].step = reason;
    jobs[jobId].error = reason;
}

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
    console.log(`Cordova APK Compiler running on port ${PORT}`);
});
