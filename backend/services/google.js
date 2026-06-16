const axios = require('axios');

async function refreshAccessToken(rToken) {
  const r = await axios.post('https://oauth2.googleapis.com/token', {
    client_id:     process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: rToken,
    grant_type:    'refresh_token',
  });
  return r.data.access_token;
}

async function gscRequest(url, body, token) {
  return axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } });
}

async function getSEOMetrics(accessToken, rToken) {
  let token = accessToken;

  const sitesRes = await axios.get('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(async () => {
    token = await refreshAccessToken(rToken);
    return axios.get('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  const sites = sitesRes.data.siteEntry || [];
  if (!sites.length) return { connected: true, error: 'No Search Console properties found' };

  const siteUrl = sites[0].siteUrl;
  const end   = new Date().toISOString().slice(0,10);
  const start = new Date(Date.now() - 28*86400000).toISOString().slice(0,10);
  const base  = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

  const [overR, qR, pR] = await Promise.allSettled([
    gscRequest(base, { startDate: start, endDate: end, dimensions: [], rowLimit: 1 }, token),
    gscRequest(base, { startDate: start, endDate: end, dimensions: ['query'], rowLimit: 10 }, token),
    gscRequest(base, { startDate: start, endDate: end, dimensions: ['page'],  rowLimit: 10 }, token),
  ]);

  const ov      = overR.status==='fulfilled' ? overR.value.data.rows?.[0] : null;
  const queries = qR.status==='fulfilled'    ? qR.value.data.rows || []   : [];
  const pages   = pR.status==='fulfilled'    ? pR.value.data.rows || []   : [];

  return {
    connected:    true,
    site:         siteUrl,
    clicks:       ov?.clicks      || 0,
    impressions:  ov?.impressions  || 0,
    ctr:          ov ? (ov.ctr * 100).toFixed(1) : '0',
    avg_position: ov ? ov.position.toFixed(1)    : '0',
    top_queries:  queries.map(r => ({
      query:       r.keys[0],
      clicks:      r.clicks,
      impressions: r.impressions,
      ctr:         (r.ctr * 100).toFixed(1),
      position:    r.position.toFixed(1),
    })),
    top_pages: pages.map(r => ({
      page:        r.keys[0].replace(siteUrl, '/'),
      clicks:      r.clicks,
      impressions: r.impressions,
    })),
  };
}

async function getAdMetrics(_accessToken, _rToken) {
  // Google Ads API requires a separate developer token and customer ID.
  // Returning a structured placeholder so the frontend shows a setup prompt.
  return {
    connected: true,
    setup_required: true,
    note: 'Google Ads requires a developer token from ads.google.com/home/tools/manager-accounts and a Customer ID. Add GOOGLE_ADS_DEVELOPER_TOKEN and GOOGLE_ADS_CUSTOMER_ID to the backend env vars.',
    spend: 0, clicks: 0, impressions: 0, conversions: 0, campaigns: [],
  };
}

module.exports = { getSEOMetrics, getAdMetrics };
