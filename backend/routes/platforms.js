const express = require('express');
const router  = express.Router();
const db      = require('../db');

const PLATFORM_META = {
  meta:     { name: 'Meta',       covers: ['Facebook', 'Instagram', 'Meta Ads'] },
  google:   { name: 'Google',     covers: ['Google Ads', 'Search Console'] },
  linkedin: { name: 'LinkedIn',   covers: ['LinkedIn Pages', 'LinkedIn Ads'] },
  twitter:  { name: 'X / Twitter', covers: ['X (Twitter)'] },
  reddit:   { name: 'Reddit',     covers: ['Reddit'] },
};

// GET /api/platforms — connection status for all platforms
router.get('/', async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT platform, updated_at FROM platform_tokens');
    const connectedMap = Object.fromEntries(rows.map(r => [r.platform, r.updated_at]));

    const status = Object.entries(PLATFORM_META).map(([id, meta]) => ({
      id,
      ...meta,
      connected:   id in connectedMap,
      connectedAt: connectedMap[id] || null,
    }));

    res.json(status);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
