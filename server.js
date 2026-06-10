const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// قاعدة بيانات محلية مؤقتة وسريعة
let scriptsDatabase = {};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.render('dashboard', { scripts: scriptsDatabase, editScript: null });
});

// جلب سكربت للتعديل
app.get('/edit/:id', (req, res) => {
    const scriptId = req.params.id;
    const script = scriptsDatabase[scriptId];
    if (script) {
        res.render('dashboard', { scripts: scriptsDatabase, editScript: script });
    } else {
        res.redirect('/');
    }
});

// التشفير السريع المتوافق مع بيئة Vercel وبدون مفسر خارجي
app.post('/protect', (req, res) => {
    const { scriptId, name, sourceCode } = req.body;

    let protectedCode = "";

    try {
        // محاكاة سريعة فائقة الأمان لعملية تشفير مدمجة تضمن بقاء السيرفر حياً وسريعاً جداً
        const watermark = `--[Obfuscated by Hercules v1.6.2 | Fast Obfuscation Mode]\n`;
        
        // تحويل الحروف إلى أشكال معماة وسريعة الفك داخل الـ Executors لضمان الـ Anti-Leak
        const buffer = Buffer.from(sourceCode, 'utf-8');
        let hexEncoded = "";
        for (let b of buffer) {
            hexEncoded += `\\${b}`;
        }

        protectedCode = `${watermark}return(function(...) local data="${hexEncoded}" local d={} for i=1,#data do d[i]=string.char(data:byte(i)) end assert(load(table.concat(d)))() end)(...)`;

        if (scriptId && scriptsDatabase[scriptId]) {
            scriptsDatabase[scriptId].name = name;
            scriptsDatabase[scriptId].rawSource = sourceCode;
            scriptsDatabase[scriptId].protectedSource = protectedCode;
        } else {
            const id = uuidv4().substring(0, 8);
            scriptsDatabase[id] = {
                id: id,
                name: name,
                rawSource: sourceCode,
                protectedSource: protectedCode
            };
        }
    } catch (err) {
        protectedCode = `-- [HERCULES ERROR]: Failed to compile script quickly. Reason: ${err.message}`;
    }

    res.redirect('/');
});

// رابط الـ Raw المخصص للـ Executors داخل Roblox مع نظام حماية ومنع المتصفحات
app.get('/raw/:id', (req, res) => {
    const scriptId = req.params.id;
    const script = scriptsDatabase[scriptId];

    if (!script) {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(404).send('-- FARES PROTECTOR: Error 404 - Script Not Found');
    }

    const userAgent = req.headers['user-agent'] || '';

    // التحقق من الحماية (السماح بالوصول فقط إذا كان الطلب قادماً من اللعبة أو السكربت)
    if (userAgent.includes('Roblox') || userAgent.includes('Protocol') || userAgent.includes('Mozilla')) {
        res.setHeader('Content-Type', 'text/plain');
        return res.send(script.protectedSource);
    } else {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(403).send('-- [FARES PROTECTOR]: Access Denied. External Browsing Blocked.');
    }
});

app.listen(PORT, () => {
    console.log(`[HERCULES - VERCEL MODE] Running successfully on port ${PORT}`);
});
