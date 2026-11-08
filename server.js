const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));

// Home page render
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// HTML Code se Direct Web App Package Download Route
app.post('/build', (req, res) => {
    const { appName, packageName, htmlCode } = req.body;

    if (!appName || !htmlCode) {
        return res.status(400).send('त्रुटि: ऐप का नाम और HTML कोड देना ज़रूरी है!');
    }

    const safeName = (packageName || appName).replace(/[^a-z0-9_-]/gi, "_").toLowerCase();

    // Standalone Ready App HTML Template Generation
    const fullAppHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${appName}</title>
    <style>
        html, body { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; background: #000; }
    </style>
</head>
<body>
${htmlCode}
</body>
</html>`;

    // Direct Browser Download Header Set Karna
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_app.html"`);
    
    // File send karna
    return res.send(fullAppHTML);
});

app.listen(PORT, () => {
    console.log(`GAMER KING Backend Live on Port ${PORT}`);
});
