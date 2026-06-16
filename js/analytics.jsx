/* analytics.jsx — live platform analytics: social, performance, SEO, settings */

const BACKEND_URL = window.BACKEND_URL || '';

const PLATFORM_CFG = [
  { id: 'meta',     key: 'meta',     label: 'Meta',       covers: 'Facebook · Instagram · Meta Ads', discipline: ['social','performance'] },
  { id: 'google',   key: 'google',   label: 'Google',     covers: 'Google Ads · Search Console',     discipline: ['performance','seo']     },
  { id: 'linkedin', key: 'linkedin', label: 'LinkedIn',   covers: 'Pages · LinkedIn Ads',            discipline: ['social','performance']  },
  { id: 'twitter',  key: 'x',        label: 'X / Twitter',covers: 'X (Twitter)',                     discipline: ['social']                },
  { id: 'reddit',   key: 'reddit',   label: 'Reddit',     covers: 'Reddit',                          discipline: ['social']                },
];

/* ── hooks ─────────────────────────────────────────────────── */

function usePlatforms() {
  const [platforms, setPlatforms] = React.useState(null);
  const [loading, setLoading]     = React.useState(true);

  const refresh = React.useCallback(async () => {
    if (!BACKEND_URL) { setLoading(false); return; }
    try {
      const r = await fetch(`${BACKEND_URL}/api/platforms`);
      setPlatforms(await r.json());
    } catch (e) {
      console.error('platforms fetch:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
    const h = (e) => { if (e.data?.type === 'oauth') refresh(); };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, [refresh]);

  return { platforms, loading, refresh };
}

function useMetrics(endpoint, platforms, deps = []) {
  const [data, setData]     = React.useState(null);
  const [loading, setLoad]  = React.useState(false);

  React.useEffect(() => {
    if (!BACKEND_URL || !platforms) return;
    setLoad(true);
    fetch(`${BACKEND_URL}/api/metrics/${endpoint}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [platforms, ...deps]);

  return { data, loading };
}

/* ── shared UI ─────────────────────────────────────────────── */

function PBadge({ on }) {
  return <span className={`pbadge ${on ? 'on' : 'off'}`}>{on ? 'Live' : 'Not connected'}</span>;
}

function fmt(n) {
  if (!n) return '0';
  if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return String(n);
}

function PlatformGlyph({ platformKey, size = 28 }) {
  const p = PLATFORMS[platformKey];
  if (!p) return null;
  return (
    <span className="pglyph" style={{ background: p.bg, width: size, height: size, fontSize: size * 0.38 }}>
      {p.g}
    </span>
  );
}

function MetricTile({ label, value, sub }) {
  return (
    <div className="mtile well">
      <div className="mt-lbl">{label}</div>
      <div className="mt-val">{value ?? '—'}</div>
      {sub && <div className="mt-sub">{sub}</div>}
    </div>
  );
}

function SectionHead({ title, sub }) {
  return (
    <div className="anl-head">
      <h2 className="anl-title">{title}</h2>
      {sub && <span className="anl-sub">{sub}</span>}
    </div>
  );
}

function NoBackend() {
  return (
    <div className="anl-empty">
      <Icon name="settings" size={40} />
      <div className="ae-title">Backend not configured</div>
      <div className="ae-sub">
        Deploy the backend to Railway, then set <code>window.BACKEND_URL</code> in <code>index.html</code>.
        Connect your platforms in the Settings section.
      </div>
    </div>
  );
}

function ConnectPrompt({ label, platformKey, sub }) {
  return (
    <div className="connect-prompt">
      <PlatformGlyph platformKey={platformKey} size={36} />
      <div>
        <div className="cp-name">{label}</div>
        <div className="cp-sub">{sub || 'Connect this platform in Settings to see live metrics.'}</div>
      </div>
      <PBadge on={false} />
    </div>
  );
}

function PlatformPanel({ name, platformKey, connected, error, note, children }) {
  return (
    <div className={`anl-panel ${!connected ? 'locked' : ''}`}>
      <div className="ap-head">
        <PlatformGlyph platformKey={platformKey} size={30} />
        <span className="ap-name">{name}</span>
        <PBadge on={connected} />
      </div>
      {!connected
        ? <div className="ap-lock">Connect in Settings → Platform Connections to see live {name} data.</div>
        : error
          ? <div className="ap-error"><Icon name="flag" size={14} /> {error}</div>
          : note
            ? <div className="ap-note"><Icon name="settings" size={14} /> {note}</div>
            : children}
    </div>
  );
}

/* ── Overview ──────────────────────────────────────────────── */

function OverviewSection({ platforms }) {
  const connected = (platforms || []).filter(p => p.connected).length;

  return (
    <div className="anl-section">
      <SectionHead title="Overview" sub={`${connected} of ${PLATFORM_CFG.length} platforms connected`} />
      <div className="ov-grid">
        {PLATFORM_CFG.map(cfg => {
          const status = (platforms||[]).find(p => p.id === cfg.id);
          return (
            <div key={cfg.id} className={`ov-card ${status?.connected ? 'on' : ''}`}>
              <PlatformGlyph platformKey={cfg.key} size={36} />
              <div className="ovc-name">{cfg.label}</div>
              <div className="ovc-covers">{cfg.covers}</div>
              {status?.connected
                ? <span className="pbadge on">Live</span>
                : <button className="btn sm" onClick={() => connectPlatform(cfg.id)}>Connect</button>}
            </div>
          );
        })}
      </div>
      <div className="ov-manual">
        <Icon name="flag" size={13} />
        <span><strong>JioHotstar Ads · Quora · Medium</strong> — no public analytics API; import data manually from each platform's dashboard.</span>
      </div>
    </div>
  );
}

/* ── Social Media ──────────────────────────────────────────── */

function SocialSection({ platforms }) {
  const { data, loading } = useMetrics('social', platforms);
  if (!BACKEND_URL) return <NoBackend />;

  return (
    <div className="anl-section">
      <SectionHead title="Social Media Analytics" sub="Facebook · Instagram · LinkedIn · X / Twitter · Reddit" />
      {loading && <div className="anl-loading">Fetching live data…</div>}

      {/* Facebook */}
      <PlatformPanel name="Facebook" platformKey="facebook" connected={data?.facebook?.connected !== false}
        error={data?.facebook?.error}>
        <div className="ap-metrics">
          <MetricTile label="Followers"     value={fmt(data?.facebook?.followers)} />
          <MetricTile label="Reach (30d)"   value={fmt(data?.facebook?.reach)} />
          <MetricTile label="Impressions"   value={fmt(data?.facebook?.impressions)} />
          <MetricTile label="Engagements"   value={fmt(data?.facebook?.engagement)} />
        </div>
        {data?.facebook?.posts?.length > 0 && (
          <PostsTable posts={data.facebook.posts} cols={['message','likes','comments','shares']} />
        )}
      </PlatformPanel>

      {/* Instagram */}
      <PlatformPanel name="Instagram" platformKey="instagram" connected={data?.instagram?.connected !== false}
        error={data?.instagram?.error}>
        <div className="ap-metrics">
          <MetricTile label="Followers"     value={fmt(data?.instagram?.followers)} />
          <MetricTile label="Reach (30d)"   value={fmt(data?.instagram?.reach)} />
          <MetricTile label="Impressions"   value={fmt(data?.instagram?.impressions)} />
          <MetricTile label="Profile Views" value={fmt(data?.instagram?.profile_views)} />
        </div>
      </PlatformPanel>

      {/* LinkedIn */}
      <PlatformPanel name="LinkedIn" platformKey="linkedin" connected={data?.linkedin?.connected !== false}
        error={data?.linkedin?.error} note={data?.linkedin?.setup_required ? data?.linkedin?.note : null}>
        <div className="ap-metrics">
          <MetricTile label="Followers"       value={fmt(data?.linkedin?.followers)} />
          <MetricTile label="Impressions"     value={fmt(data?.linkedin?.impressions)} />
          <MetricTile label="Engagement Rate" value={data?.linkedin?.engagement_rate ? `${data.linkedin.engagement_rate}%` : '—'} />
        </div>
      </PlatformPanel>

      {/* X / Twitter */}
      <PlatformPanel name="X / Twitter" platformKey="x" connected={data?.twitter?.connected !== false}
        error={data?.twitter?.error}>
        <div className="ap-metrics">
          <MetricTile label="Followers"    value={fmt(data?.twitter?.followers)} />
          <MetricTile label="Following"    value={fmt(data?.twitter?.following)} />
          <MetricTile label="Tweets"       value={fmt(data?.twitter?.tweet_count)} />
        </div>
      </PlatformPanel>

      {/* Reddit */}
      <PlatformPanel name="Reddit" platformKey="reddit" connected={data?.reddit?.connected !== false}
        error={data?.reddit?.error}>
        <div className="ap-metrics">
          <MetricTile label="Total Karma"   value={fmt(data?.reddit?.karma)} />
          <MetricTile label="Link Karma"    value={fmt(data?.reddit?.link_karma)} />
          <MetricTile label="Comment Karma" value={fmt(data?.reddit?.comment_karma)} />
        </div>
      </PlatformPanel>

      {/* Manual platforms */}
      <ConnectPrompt label="Quora"  platformKey="quora"  sub="No analytics API available — track Quora stats manually." />
      <ConnectPrompt label="Medium" platformKey="medium" sub="Medium's stats API is deprecated — use Medium Partner Program dashboard." />
    </div>
  );
}

function PostsTable({ posts, cols }) {
  return (
    <div className="anl-table">
      <table>
        <thead><tr>
          {cols.map(c => <th key={c}>{c[0].toUpperCase()+c.slice(1)}</th>)}
        </tr></thead>
        <tbody>
          {posts.slice(0,5).map(p => (
            <tr key={p.id}>
              {cols.map(c => <td key={c}>{c === 'message' ? (p[c]||'—') : fmt(p[c])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Performance Marketing ─────────────────────────────────── */

function PerformanceSection({ platforms }) {
  const { data, loading } = useMetrics('performance', platforms);
  if (!BACKEND_URL) return <NoBackend />;

  return (
    <div className="anl-section">
      <SectionHead title="Performance Marketing" sub="Meta Ads · Google Ads · LinkedIn Ads · JioHotstar Ads" />
      {loading && <div className="anl-loading">Fetching ad data…</div>}

      <PlatformPanel name="Meta Ads" platformKey="meta-ads" connected={data?.meta_ads?.connected !== false}
        error={data?.meta_ads?.error}>
        <div className="ap-metrics">
          <MetricTile label="Spend (30d)"   value={`$${(data?.meta_ads?.spend||0).toLocaleString()}`} />
          <MetricTile label="Impressions"   value={fmt(data?.meta_ads?.impressions)} />
          <MetricTile label="Clicks"        value={fmt(data?.meta_ads?.clicks)} />
          <MetricTile label="CTR"           value={`${data?.meta_ads?.ctr||0}%`} />
          <MetricTile label="CPC"           value={`$${data?.meta_ads?.cpc||0}`} />
          <MetricTile label="Leads"         value={fmt(data?.meta_ads?.leads)} />
        </div>
      </PlatformPanel>

      <PlatformPanel name="Google Ads" platformKey="google-ads" connected={data?.google_ads?.connected !== false}
        error={data?.google_ads?.error} note={data?.google_ads?.setup_required ? data.google_ads.note : null}>
        {!data?.google_ads?.setup_required && (
          <div className="ap-metrics">
            <MetricTile label="Spend (30d)"   value={`$${(data?.google_ads?.spend||0).toLocaleString()}`} />
            <MetricTile label="Impressions"   value={fmt(data?.google_ads?.impressions)} />
            <MetricTile label="Clicks"        value={fmt(data?.google_ads?.clicks)} />
            <MetricTile label="Conversions"   value={fmt(data?.google_ads?.conversions)} />
          </div>
        )}
      </PlatformPanel>

      <PlatformPanel name="LinkedIn Ads" platformKey="linkedin-ads" connected={data?.linkedin_ads?.connected !== false}
        error={data?.linkedin_ads?.error} note={data?.linkedin_ads?.note}>
        {!data?.linkedin_ads?.note && (
          <div className="ap-metrics">
            <MetricTile label="Spend (30d)" value={`$${(data?.linkedin_ads?.spend||0).toLocaleString()}`} />
            <MetricTile label="Clicks"      value={fmt(data?.linkedin_ads?.clicks)} />
            <MetricTile label="CTR"         value={`${data?.linkedin_ads?.ctr||0}%`} />
            <MetricTile label="Leads"       value={fmt(data?.linkedin_ads?.leads)} />
          </div>
        )}
      </PlatformPanel>

      <ConnectPrompt label="JioHotstar Ads" platformKey="jiohotstar"
        sub="No self-serve analytics API. Download campaign reports from the JioHotstar Ads Manager and upload them here manually." />
    </div>
  );
}

/* ── SEO ───────────────────────────────────────────────────── */

function SEOSection({ platforms }) {
  const googleConnected = (platforms||[]).find(p => p.id === 'google')?.connected;
  const { data, loading } = useMetrics('seo', platforms, [googleConnected]);
  if (!BACKEND_URL) return <NoBackend />;

  return (
    <div className="anl-section">
      <SectionHead title="SEO Analytics" sub="Google Search Console · Organic Traffic · Backlinks" />
      {loading && <div className="anl-loading">Fetching Search Console data…</div>}

      <PlatformPanel name="Google Search Console" platformKey="google" connected={!!googleConnected}
        error={data?.error} note={data?.setup_required ? data.note : null}>
        {data && !data.error && !data.setup_required && (
          <React.Fragment>
            <div className="ap-metrics">
              <MetricTile label="Clicks (28d)"   value={fmt(data.clicks)} />
              <MetricTile label="Impressions"    value={fmt(data.impressions)} />
              <MetricTile label="Avg. CTR"       value={`${data.ctr}%`} />
              <MetricTile label="Avg. Position"  value={data.avg_position} />
            </div>
            {data.top_queries?.length > 0 && (
              <React.Fragment>
                <div className="anl-sub-head">Top Queries</div>
                <div className="anl-table">
                  <table>
                    <thead><tr><th>Query</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Position</th></tr></thead>
                    <tbody>
                      {data.top_queries.map((q,i) => (
                        <tr key={i}><td>{q.query}</td><td>{q.clicks}</td><td>{fmt(q.impressions)}</td><td>{q.ctr}%</td><td>{q.position}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </React.Fragment>
            )}
            {data.top_pages?.length > 0 && (
              <React.Fragment>
                <div className="anl-sub-head" style={{marginTop:20}}>Top Pages</div>
                <div className="anl-table">
                  <table>
                    <thead><tr><th>Page</th><th>Clicks</th><th>Impressions</th></tr></thead>
                    <tbody>
                      {data.top_pages.map((p,i) => (
                        <tr key={i}><td className="pg-path">{p.page}</td><td>{p.clicks}</td><td>{fmt(p.impressions)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      </PlatformPanel>
    </div>
  );
}

/* ── Settings / Connect Platforms ──────────────────────────── */

function connectPlatform(platformId) {
  if (!BACKEND_URL) {
    alert('Set window.BACKEND_URL in index.html to your Railway backend URL first.');
    return;
  }
  window.open(`${BACKEND_URL}/auth/${platformId}/start`, 'oauth', 'width=620,height=720,left=300,top=80');
}

function PlatformConnectCard({ cfg, status, onRefresh }) {
  const connected = status?.connected;
  const [disconnecting, setDis] = React.useState(false);

  const disconnect = async () => {
    setDis(true);
    try {
      await fetch(`${BACKEND_URL}/auth/${cfg.id}`, { method: 'DELETE' });
      onRefresh();
    } finally { setDis(false); }
  };

  return (
    <div className={`pf-connect-card ${connected ? 'on' : ''}`}>
      <div className="pcc-head">
        <PlatformGlyph platformKey={cfg.key} size={32} />
        <div className="pcc-info">
          <div className="pcc-name">{cfg.label}</div>
          <div className="pcc-covers">{cfg.covers}</div>
        </div>
        <PBadge on={!!connected} />
      </div>
      <div className="pcc-foot">
        {connected
          ? <button className="btn" onClick={disconnect} disabled={disconnecting}>
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          : <button className="btn primary" onClick={() => connectPlatform(cfg.id)}>
              Connect →
            </button>}
      </div>
    </div>
  );
}

function SettingsSection({ platforms, onRefresh }) {
  if (!BACKEND_URL) {
    return (
      <div className="anl-section">
        <SectionHead title="Settings" />
        <div className="anl-notice">
          <Icon name="settings" size={18} />
          <div>
            <strong>Backend not deployed yet.</strong><br/>
            Deploy the <code>backend/</code> folder to Railway, add a PostgreSQL plugin, set the environment
            variables from <code>backend/.env.example</code>, then set
            <code> window.BACKEND_URL = 'https://your-app.up.railway.app'</code> in <code>index.html</code>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="anl-section">
      <SectionHead title="Platform Connections"
        sub="Connect your accounts to pull live analytics into the dashboard" />
      <div className="pf-connect-grid">
        {PLATFORM_CFG.map(cfg => (
          <PlatformConnectCard key={cfg.id} cfg={cfg}
            status={(platforms||[]).find(p=>p.id===cfg.id)}
            onRefresh={onRefresh} />
        ))}
      </div>
      <div className="anl-manual-note">
        <Icon name="flag" size={13} />
        <span>
          <strong>JioHotstar Ads · Quora · Medium</strong> — no public analytics API available.
          Use manual CSV imports from their respective dashboards.
        </span>
      </div>
    </div>
  );
}

/* ── Coming-soon placeholder ───────────────────────────────── */

function ComingSoon({ title, sub }) {
  return (
    <div className="anl-section">
      <div className="anl-empty">
        <Icon name="clock" size={38} />
        <div className="ae-title">{title}</div>
        <div className="ae-sub">{sub}</div>
      </div>
    </div>
  );
}

/* ── Analytics root ────────────────────────────────────────── */

function Analytics({ activeNav }) {
  const { platforms, loading, refresh } = usePlatforms();
  if (loading) return <div className="anl-loading-full">Checking platform connections…</div>;

  switch (activeNav) {
    case 'overview':     return <OverviewSection    platforms={platforms} />;
    case 'social':       return <SocialSection      platforms={platforms} />;
    case 'performance':  return <PerformanceSection  platforms={platforms} />;
    case 'seo':          return <SEOSection          platforms={platforms} />;
    case 'inbox':        return <ComingSoon title="Unified Inbox"   sub="Phase 1.5 — reply to comments and messages across all platforms from one screen." />;
    case 'automation':   return <ComingSoon title="Automation"      sub="Phase 2 — keyword auto-replies and comment-to-DM on Instagram and Facebook." />;
    case 'reports':      return <ComingSoon title="Reports"         sub="Phase 1.5 — one-click PDF/CSV export and scheduled email reports to leadership." />;
    case 'settings':     return <SettingsSection     platforms={platforms} onRefresh={refresh} />;
    default:             return null;
  }
}

Object.assign(window, { Analytics });
