const axios = require('axios');

const UA = 'USAIndiaCFO-Dashboard/1.0';

async function getSocialMetrics(token) {
  try {
    const r = await axios.get('https://oauth.reddit.com/api/v1/me', {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': UA },
    });
    const u = r.data;
    return {
      connected:     true,
      username:      u.name,
      karma:         u.total_karma,
      link_karma:    u.link_karma,
      comment_karma: u.comment_karma,
      created:       new Date(u.created_utc * 1000).toISOString(),
    };
  } catch (e) {
    return { connected: true, error: e.response?.data?.message || e.message };
  }
}

module.exports = { getSocialMetrics };
