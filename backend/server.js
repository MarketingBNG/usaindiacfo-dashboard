require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

const ALLOWED = (process.env.ALLOWED_ORIGINS || 'https://marketingbng.github.io,http://localhost:8080,http://localhost:3000')
  .split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, cb) => cb(null, !origin || ALLOWED.some(a => origin.startsWith(a))),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
app.use('/auth',          require('./routes/oauth'));
app.use('/api/platforms', require('./routes/platforms'));
app.use('/api/metrics',   require('./routes/metrics'));

db.init()
  .then(() => {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`API listening on :${PORT}`));
  })
  .catch(err => { console.error('DB init failed:', err.message); process.exit(1); });
