const express = require('express');
const router  = express.Router();
const axios   = require('axios');
const crypto  = require('crypto');
const db      = require('../db');

const BACKEND  = () => process.env.BACKEND_URL  || 'http://localhost:3001';
const FRONTEND = () => process.env.FRONTEND_URL || 'https://marketingbng.github.io/usaindiacfo-dashboard';

const PLATFORMS = {
  meta: {
    authUrl:      'https://www.facebook.com/v20.0/dialog/oauth',
    tokenUrl:     'https://graph.facebook.com/v20.0/oauth/access_token',
    scope:        'pages_show_list,pages_read_engagement,read_insights,ads_read',
    clientId:     () => process.env.META_APP_ID,
    clientSecret: () => process.env.META_APP_SECRET,
  },
  google: {
    authUrl:      'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl:     'https://oauth2.googleapis.com/token',
    scope:        'https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/adwords',
    clientId:     () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
    extras:       { access_type: 'offline', prompt: 'consent' },
  },
  linkedin: {
    authUrl:      'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl:     'https://www.linkedin.com/oauth/v2/accessToken',
    scope:        'r_organization_social r_ads r_ads_reporting',
    clientId:     () => process.env.LINKEDIN_CLIENT_ID,
    clientSecret: () => process.env.LINKEDIN_CLIENT_SECRET,
  },
  twitter: {
    authUrl:      'https://twitter.com/i/oauth2/authorize',
    tokenUrl:     'https://api.twitter.com/2/oauth2/token',
    scope:        'tweet.read users.read offline.access',
    clientId:     () => process.env.TWITTER_CLIENT_ID,
    clientSecret: () => process.env.TWITTER_CLIENT_SECRET,
    pkce:         true,
  },
  reddit: {
    authUrl:      'https://www.reddit.com/api/v1/authorize',
    tokenUrl:     'https://www.reddit.com/api/v1/access_token',
    scope:        'identity mysubreddits read',
    clientId:     () => process.env.REDDIT_CLIENT_ID,
    clientSecret: () => process.env.REDDIT_CLIENT_SECRET,
    basicAuth:    true,
    extras:       { duration: 'permanent' },
  },
};

// in-memory state+PKCE store (survives restarts fine for OAuth flows)
const stateStore = new Map();

function closePopup(res, platform, ok, error) {
  const payload = JSON.stringify({ type: 'oauth', platform, ok, error: error || null });
  res.send(`<!doctype html><html><body><script>
    try { window.opener.postMessage(${payload}, '*'); } catch(e) {}
    window.close();
  </script></body></html>`);
}

// GET /auth/:platform/start  — redirect user to platform OAuth page
router.get('/:platform/start', (req, res) => {
  const cfg = PLATFORMS[req.params.platform];
  if (!cfg)            return res.status(404).json({ error: 'Unknown platform' });
  if (!cfg.clientId()) return res.status(400).json({ error: `${req.params.platform} credentials not configured on server` });

  const state       = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${BACKEND()}/auth/${req.params.platform}/callback`;

  const params = new URLSearchParams({
    client_id:     cfg.clientId(),
    redirect_uri:  redirectUri,
    scope:         cfg.scope,
    response_type: 'code',
    state,
    ...(cfg.extras || {}),
  });

  if (cfg.pkce) {
    const verifier  = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    stateStore.set(state, { verifier });
    params.set('code_challenge',        challenge);
    params.set('code_challenge_method', 'S256');
  } else {
    stateStore.set(state, {});
  }

  res.redirect(`${cfg.authUrl}?${params}`);
});

// GET /auth/:platform/callback  — exchange code for token, store, close popup
router.get('/:platform/callback', async (req, res) => {
  const { platform } = req.params;
  const { code, state, error } = req.query;
  const cfg = PLATFORMS[platform];

  if (!cfg || error || !code) return closePopup(res, platform, false, error || 'cancelled');

  const entry = stateStore.get(state);
  if (!entry) return closePopup(res, platform, false, 'invalid_state');
  stateStore.delete(state);

  const redirectUri = `${BACKEND()}/auth/${platform}/callback`;

  try {
    const body = {
      code,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
      client_id:     cfg.clientId(),
      client_secret: cfg.clientSecret(),
      ...(entry.verifier ? { code_verifier: entry.verifier } : {}),
    };

    let tokenData;
    if (cfg.basicAuth) {
      const r = await axios.post(cfg.tokenUrl,
        new URLSearchParams(body).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          auth: { username: cfg.clientId(), password: cfg.clientSecret() },
        }
      );
      tokenData = r.data;
    } else if (platform === 'linkedin') {
      const r = await axios.post(cfg.tokenUrl,
        new URLSearchParams(body).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      tokenData = r.data;
    } else {
      const r = await axios.post(cfg.tokenUrl, body);
      tokenData = r.data;
    }

    const { access_token, refresh_token, expires_in } = tokenData;
    const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null;

    await db.query(
      `INSERT INTO platform_tokens (platform, access_token, refresh_token, expires_at, updated_at)
       VALUES ($1,$2,$3,$4,NOW())
       ON CONFLICT (platform) DO UPDATE
         SET access_token=$2, refresh_token=$3, expires_at=$4, updated_at=NOW()`,
      [platform, access_token, refresh_token || null, expiresAt]
    );

    closePopup(res, platform, true, null);
  } catch (err) {
    console.error(`OAuth token exchange (${platform}):`, err.response?.data || err.message);
    closePopup(res, platform, false, 'token_exchange_failed');
  }
});

// DELETE /auth/:platform  — disconnect platform
router.delete('/:platform', async (req, res) => {
  const { platform } = req.params;
  await db.query('DELETE FROM platform_tokens WHERE platform=$1', [platform]);
  await db.query('DELETE FROM metrics_cache   WHERE platform=$1', [platform]);
  res.json({ ok: true });
});

module.exports = router;
