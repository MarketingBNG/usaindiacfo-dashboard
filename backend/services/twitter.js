const axios = require('axios');

async function getSocialMetrics(token) {
  try {
    const r = await axios.get('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${token}` },
      params:  { 'user.fields': 'public_metrics,name,username,description' },
    });

    const user    = r.data.data;
    const metrics = user.public_metrics;

    return {
      connected:   true,
      username:    user.username,
      name:        user.name,
      followers:   metrics.followers_count,
      following:   metrics.following_count,
      tweet_count: metrics.tweet_count,
      listed:      metrics.listed_count,
    };
  } catch (e) {
    return { connected: true, error: e.response?.data?.detail || e.message };
  }
}

module.exports = { getSocialMetrics };
