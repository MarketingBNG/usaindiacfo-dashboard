const axios = require('axios');
const BASE = 'https://graph.facebook.com/v20.0';

async function getPages(token) {
  const r = await axios.get(`${BASE}/me/accounts`, {
    params: { access_token: token, fields: 'id,name,access_token,instagram_business_account' },
  });
  return r.data.data || [];
}

async function getSocialMetrics(token) {
  const pages = await getPages(token);
  if (!pages.length) return { facebook: { connected: true, error: 'No Facebook pages found' }, instagram: { connected: false } };
  const page = pages[0];

  const now   = Math.floor(Date.now() / 1000);
  const since = now - 30 * 86400;

  const [fieldsR, insR, postsR] = await Promise.allSettled([
    axios.get(`${BASE}/${page.id}`, {
      params: { fields: 'name,fan_count,followers_count', access_token: page.access_token },
    }),
    axios.get(`${BASE}/${page.id}/insights`, {
      params: {
        metric: 'page_fans,page_fan_adds,page_impressions,page_reach,page_post_engagements',
        period: 'month', since, until: now,
        access_token: page.access_token,
      },
    }),
    axios.get(`${BASE}/${page.id}/posts`, {
      params: {
        fields: 'id,message,created_time,likes.summary(true),comments.summary(true),shares',
        limit: 10, access_token: page.access_token,
      },
    }),
  ]);

  const fields   = fieldsR.status === 'fulfilled' ? fieldsR.value.data : {};
  const insights = insR.status === 'fulfilled' ? insR.value.data.data : [];
  const posts    = postsR.status === 'fulfilled' ? postsR.value.data.data : [];
  const getM = (name) => { const m = insights.find(i => i.name === name); return m?.values?.[m.values.length-1]?.value || 0; };

  const facebook = {
    connected:      true,
    page_name:      fields.name || page.name,
    followers:      fields.followers_count || fields.fan_count || getM('page_fans'),
    follower_growth:getM('page_fan_adds'),
    reach:          getM('page_reach'),
    impressions:    getM('page_impressions'),
    engagement:     getM('page_post_engagements'),
    posts: posts.map(p => ({
      id: p.id,
      message: (p.message || '').slice(0, 90),
      created: p.created_time,
      likes:   p.likes?.summary?.total_count   || 0,
      comments:p.comments?.summary?.total_count|| 0,
      shares:  p.shares?.count                 || 0,
    })),
  };

  let instagram = { connected: false };
  if (page.instagram_business_account) {
    const igId = page.instagram_business_account.id;
    try {
      const [igU, igM, igI] = await Promise.all([
        axios.get(`${BASE}/${igId}`, { params: { fields: 'followers_count,media_count,username', access_token: page.access_token } }),
        axios.get(`${BASE}/${igId}/media`, { params: { fields: 'id,caption,like_count,comments_count,timestamp,media_type', limit: 10, access_token: page.access_token } }),
        axios.get(`${BASE}/${igId}/insights`, { params: { metric: 'reach,impressions,profile_views', period: 'month', since, until: now, access_token: page.access_token } }),
      ]);
      const igGet = (n) => { const m = igI.data.data?.find(i => i.name===n); return m?.values?.[m.values.length-1]?.value||0; };
      instagram = {
        connected:     true,
        username:      igU.data.username,
        followers:     igU.data.followers_count,
        posts_count:   igU.data.media_count,
        reach:         igGet('reach'),
        impressions:   igGet('impressions'),
        profile_views: igGet('profile_views'),
        media: (igM.data.data||[]).map(m => ({ id: m.id, caption: (m.caption||'').slice(0,90), likes: m.like_count, comments: m.comments_count, type: m.media_type, timestamp: m.timestamp })),
      };
    } catch (e) { instagram = { connected: true, error: e.message }; }
  }
  return { facebook, instagram };
}

async function getAdMetrics(token) {
  const r = await axios.get(`${BASE}/me/adaccounts`, {
    params: { access_token: token, fields: 'id,name,currency,account_status' },
  });
  const accounts = r.data.data || [];
  if (!accounts.length) return { connected: true, error: 'No ad accounts found' };

  const account = accounts[0];
  const since   = new Date(Date.now() - 30 * 86400000).toISOString().slice(0,10);
  const until   = new Date().toISOString().slice(0,10);

  const [insR, camR] = await Promise.allSettled([
    axios.get(`${BASE}/${account.id}/insights`, {
      params: { fields: 'impressions,clicks,spend,ctr,cpc,actions', time_range: JSON.stringify({ since, until }), access_token: token },
    }),
    axios.get(`${BASE}/${account.id}/campaigns`, {
      params: { fields: 'id,name,status,objective', access_token: token, limit: 20 },
    }),
  ]);

  const ins  = insR.status==='fulfilled'  ? insR.value.data.data?.[0] : {};
  const cams = camR.status==='fulfilled'  ? camR.value.data.data     : [];

  return {
    connected:    true,
    account_name: account.name,
    currency:     account.currency,
    spend:        parseFloat(ins?.spend || 0),
    impressions:  parseInt(ins?.impressions || 0, 10),
    clicks:       parseInt(ins?.clicks || 0, 10),
    ctr:          parseFloat(ins?.ctr || 0).toFixed(2),
    cpc:          parseFloat(ins?.cpc || 0).toFixed(2),
    leads:        parseInt(ins?.actions?.find(a => a.action_type==='lead')?.value || 0, 10),
    campaigns:    cams.map(c => ({ id: c.id, name: c.name, status: c.status })),
  };
}

module.exports = { getSocialMetrics, getAdMetrics };
