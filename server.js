const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const multer = require('multer');
const app = express();

app.use(cors({ origin: '*' }));
const upload = multer({ storage: multer.memoryStorage() });

app.post('/upload-part', upload.single('chunk'), async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing url' });

    const response = await fetch(url, {
      method: 'PUT',
      body: req.file.buffer,
      headers: { 'Content-Type': 'application/octet-stream' }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: 'S3 upload failed', detail: text });
    }

    const etag = (response.headers.get('etag') || '').replace(/"/g, '');
    res.json({ ok: true, etag });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));
app.listen(process.env.PORT || 3000, () => console.log('Proxy running'));
