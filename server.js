const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const multer = require('multer');
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 700 * 1024 * 1024 }
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
