const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const metaSvc  = require('../services/meta');
const googleSvc= require('../services/google');
const liSvc    = require('../services/linkedin');
const twSvc    = require('../services/twitter');
const rdSvc    = require('../services/reddit');

const CACHE_HOURS = 1;

async function getToken(platform) {
  const { rows } = await db.query('SELECT * FROM platform_tokens WHERE platform=$1', [platform]);
  return rows[0] || null;
}

async function getCached(platform, key) {
  const { rows } = await db.query(
    `SELECT data FROM metrics_cache
     WHERE platform=$1 AND cache_key=$2
     AND fetched_at > NOW() - ($3 || ' hours')::INTERVAL`,
    [platform, key, CACHE_HOURS]
  );
  return rows[0]?.data || null;
}

async function setCache(platform, key, data) {
  await db.query(
    `INSERT INTO metrics_cache (platform, cache_key, data, fetched_at)
     VALUES ($1,$2,$3,NOW())
     ON CONFLICT (platform, cache_key) DO UPDATE SET data=$3, fetched_at=NOW()`,
    [platform, key, JSON.stringify(data)]
  );
}

async function withCache(platform, key, fetcher) {
  const cached = await getCached(platform, key);
  if (cached) return cached;
  const fresh = await fetcher();
  await setCache(platform, key, fresh);
  return fresh;
}

// GET /api/metrics/social
router.get('/social', async (_req, res) => {
  const result = {};

  const metaToken = await getToken('meta');
  if (metaToken) {
    try {
      const d = await withCache('meta', 'social', () => metaSvc.getSocialMetrics(metaToken.access_token));
      result.facebook  = d.facebook;
      result.instagram = d.instagram;
    } catch (e) {
      result.facebook = result.instagram = { connected: true, error: e.message };
    }
  } else {
    result.facebook = result.instagram = { connected: false };
  }

  for (const [platform, svc, key] of [
    ['linkedin', liSvc, 'social'],
    ['twitter',  twSvc, 'social'],
    ['reddit',   rdSvc, 'social'],
  ]) {
    const tok = await getToken(platform);
    if (tok) {
      try {
        result[platform] = await withCache(platform, key, () => svc.getSocialMetrics(tok.access_token));
      } catch (e) {
        result[platform] = { connected: true, error: e.message };
      }
    } else {
      result[platform] = { connected: false };
    }
  }

  res.json(result);
});

// GET /api/metrics/performance
router.get('/performance', async (_req, res) => {
  const result = {};

  const metaToken = await getToken('meta');
  if (metaToken) {
    try {
      result.meta_ads = await withCache('meta', 'ads', () => metaSvc.getAdMetrics(metaToken.access_token));
    } catch (e) { result.meta_ads = { connected: true, error: e.message }; }
  } else { result.meta_ads = { connected: false }; }

  const googleToken = await getToken('google');
  if (googleToken) {
    try {
      result.google_ads = await withCache('google', 'ads', () => googleSvc.getAdMetrics(googleToken.access_token, googleToken.refresh_token));
    } catch (e) { result.google_ads = { connected: true, error: e.message }; }
  } else { result.google_ads = { connected: false }; }

  const liToken = await getToken('linkedin');
  if (liToken) {
    try {
      result.linkedin_ads = await withCache('linkedin', 'ads', () => liSvc.getAdMetrics(liToken.access_token));
    } catch (e) { result.linkedin_ads = { connected: true, error: e.message }; }
  } else { result.linkedin_ads = { connected: false }; }

  res.json(result);
});

// GET /api/metrics/seo
router.get('/seo', async (_req, res) => {
  const tok = await getToken('google');
  if (!tok) return res.json({ connected: false });

  try {
    const data = await withCache('google', 'seo', () => googleSvc.getSEOMetrics(tok.access_token, tok.refresh_token));
    res.json(data);
  } catch (e) {
    res.json({ connected: true, error: e.message });
  }
});

module.exports = router;
