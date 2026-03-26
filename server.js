const express = require('express');
const fetch = require('node-fetch');
const multer = require('multer');
const app = express();

// Manual CORS — runs before everything including multer
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB per chunk
});

app.post('/upload-part', upload.single('chunk'), async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing url' });
    if (!req.file) return res.status(400).json({ error: 'Missing chunk' });

    const response = await fetch(url, {
      method: 'PUT',
      body: req.file.buffer,
      headers: { 'Content-Length': req.file.size.toString() }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: 'S3 failed', detail: text });
    }

    const etag = (response.headers.get('etag') || '').replace(/"/g, '');
    res.json({ ok: true, etag });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));
app.listen(process.env.PORT || 3000, () => console.log('Proxy running'));
