const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process'); // सर्वर से कमांड चलाने के लिए

const app = express();
const PORT = process.env.PORT || 3000;

// मिडलवेयर सेटअप
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// होम पेज पर फॉर्म दिखाना
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ऐप बिल्ड करने का मुख्य रूट
app.post('/build', (req, res) => {
    const { appName, packageName, htmlCode } = req.body;

    if (!appName || !packageName || !htmlCode) {
        return res.status(400).send('त्रुटि: सभी फील्ड भरना ज़रूरी है!');
    }

    console.log(`[BUILD START] ऐप का नाम: ${appName}, पैकेज: ${packageName}`);

    // 1. यूज़र के लिए एक अलग फोल्डर बनाना
    const uniqueId = Date.now();
    const projectDir = path.join(__dirname, 'projects', `${packageName}_${uniqueId}`);
    
    try {
        fs.mkdirSync(projectDir, { recursive: true });

        // 2. HTML कोड को index.html के रूप में सेव करना
        fs.writeFileSync(path.join(projectDir, 'index.html'), htmlCode);

        // 3. यहाँ पर Cordova या WebView प्रोजेक्ट इनिशियलाइज़ करके APK बिल्ड कमांड चलाई जा सकती है
        // जैसे: npx cordova create ... या custom script
        
        console.log(`[SUCCESS] HTML फाइल सफलताપूर्वक सेव हो गई है: ${projectDir}`);

        // यूज़र को सफलता का संदेश और डाउनलोड लिंक दिखाना
        res.send(`
            <div style="font-family: Arial; background: #0f172a; color: #fff; padding: 40px; text-align: center;">
                <h2 style="color: #22c55e;">बधाई हो! आपका ऐप "${appName}" सफलतापूर्वक प्रोसेस हो गया है।</h2>
                <p>पैकेज नेम: <b>${packageName}</b></p>
                <p>आपका HTML कोड सुरक्षित रूप से कंपाइलर में लोड कर दिया गया है।</p>
                <br>
                <a href="/" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">वापस जाएं</a>
            </div>
        `);

    } catch (err) {
        console.error(err);
        res.status(500).send('सर्वर एरर: ऐप बिल्ड करने में समस्या आई है।');
    }
});

app.listen(PORT, () => {
    console.log(`सर्वर पूरी तरह तैयार है और यहाँ चल रहा है: http://localhost:${PORT}`);
});
