const axios = require('axios');

const ORG_ID = () => process.env.LINKEDIN_ORG_ID;

async function liGet(url, token, params = {}) {
  return axios.get(url, {
    headers: { Authorization: `Bearer ${token}`, 'LinkedIn-Version': '202401' },
    params,
  });
}

async function getSocialMetrics(token) {
  if (!ORG_ID()) return { connected: true, setup_required: true, note: 'Set LINKEDIN_ORG_ID env var to your LinkedIn Page numeric ID.' };

  try {
    const orgUrn = `urn:li:organization:${ORG_ID()}`;

    const [follR, shareR] = await Promise.allSettled([
      liGet('https://api.linkedin.com/v2/organizationalEntityFollowerStatistics', token, {
        q: 'organizationalEntity', organizationalEntity: orgUrn,
      }),
      liGet('https://api.linkedin.com/v2/organizationalEntityShareStatistics', token, {
        q: 'organizationalEntity', organizationalEntity: orgUrn,
      }),
    ]);

    const followers = follR.status==='fulfilled' ? (follR.value.data.elements?.[0]?.followerCounts?.organicFollowerCount || 0) : 0;
    const shares    = shareR.status==='fulfilled'? shareR.value.data.elements || [] : [];

    const totalImpressions  = shares.reduce((s,e)=>s+(e.totalShareStatistics?.impressionCount||0),0);
    const totalEngagements  = shares.reduce((s,e)=>s+(e.totalShareStatistics?.engagement||0),0);
    const engagementRate    = totalImpressions > 0 ? ((totalEngagements/totalImpressions)*100).toFixed(2) : '0';

    return { connected: true, followers, impressions: totalImpressions, engagement_rate: engagementRate };
  } catch (e) {
    return { connected: true, error: e.response?.data?.message || e.message };
  }
}

async function getAdMetrics(token) {
  if (!ORG_ID()) return { connected: true, setup_required: true, note: 'Set LINKEDIN_ORG_ID env var.' };

  try {
    const accountsRes = await liGet('https://api.linkedin.com/v2/adAccountsV2', token, {
      q: 'search', 'search.type.values[0]': 'BUSINESS',
    });
    const accounts = accountsRes.data.elements || [];
    if (!accounts.length) return { connected: true, error: 'No LinkedIn ad accounts found' };

    return {
      connected:      true,
      account_name:   accounts[0].name,
      spend:          0,
      impressions:    0,
      clicks:         0,
      ctr:            '0',
      cpc:            '0',
      leads:          0,
      note:           'Detailed LinkedIn Ads metrics require the r_ads_reporting scope and additional campaign setup.',
    };
  } catch (e) {
    return { connected: true, error: e.response?.data?.message || e.message };
  }
}

module.exports = { getSocialMetrics, getAdMetrics };
