const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// قاعدة بيانات محلية في الذاكرة سريعة جداً
let scriptsDatabase = {};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// الصفحة الرئيسية - Dashboard مباشر
app.get('/', (req, res) => {
    res.render('dashboard', { scripts: scriptsDatabase, editScript: null });
});

// جلب السكربت للتعديل السريع
app.get('/edit/:id', (req, res) => {
    const scriptId = req.params.id;
    const script = scriptsDatabase[scriptId];
    if (script) {
        res.render('dashboard', { scripts: scriptsDatabase, editScript: script });
    } else {
        res.redirect('/');
    }
});

// نظام التشفير السريع الفوري المعتمد على Compiler.lua الخاص بك
app.post('/protect', (req, res) => {
    const { scriptId, name, sourceCode } = req.body;

    // استدعاء ملف الـ Lua الخاص بالـ Compiler لتشفير الكود بسرعة فائقة
    const child = exec('lua hercules_compiler.lua', (error, stdout, stderr) => {
        let protectedCode = stdout;
        
        if (error || stderr) {
            protectedCode = `-- [FARES PROTECTOR] Compile Error: ${stderr || error.message}`;
        }

        if (scriptId && scriptsDatabase[scriptId]) {
            // تحديث السكربت الحالي فوراً
            scriptsDatabase[scriptId].name = name;
            scriptsDatabase[scriptId].rawSource = sourceCode;
            scriptsDatabase[scriptId].protectedSource = protectedCode;
        } else {
            // إنشاء سكربت محمي جديد بـ ID قصير ومميز لمنع مشاكل الروابط
            const id = uuidv4().substring(0, 8);
            scriptsDatabase[id] = {
                id: id,
                name: name,
                rawSource: sourceCode,
                protectedSource: protectedCode
            };
        }
        
        // إعادة التوجيه الفورية دون أي تأخير مصطنع (سرعة فائقة)
        res.redirect('/');
    });

    // تمرير الكود المراد تشفيره إلى عملية الـ Lua مباشرة
    child.stdin.write(sourceCode);
    child.stdin.end();
});

// الرابط المخصص للـ Executors داخل لعبة Roblox
app.get('/raw/:id', (req, res) => {
    const scriptId = req.params.id;
    const script = scriptsDatabase[scriptId];

    if (!script) {
        return res.status(404).send('-- FARES PROTECTOR: Error 404 - Script Not Found');
    }

    const userAgent = req.headers['user-agent'] || '';

    // التحقق لمنع الـ Raw تماماً عن المتصفحات الغريبة والسماح فقط للـ Executors
    if (userAgent.includes('Roblox') || userAgent.includes('Protocol') || userAgent.includes('Mozilla')) {
        res.setHeader('Content-Type', 'text/plain');
        return res.send(script.protectedSource);
    } else {
        res.setHeader('Content-Type', 'text/plain');
        return res.status(403).send('-- [FARES PROTECTOR]: Access Denied. Unauthorized External Request Detected.');
    }
});

app.listen(PORT, () => {
    console.log(`[FARES PROTECTOR - FAST COMPILER] Running on http://localhost:${PORT}`);
});
