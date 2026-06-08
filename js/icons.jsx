/* icons.jsx — inline SVG icon set (NO EMOJI) + brand metadata */

function Icon({ name, size = 18, sw = 1.8, style }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round", style };
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></>,
    filter: <path d="M3 5h18l-7 8v6l-4-2v-4z" />,
    sort: <><path d="M7 4v16" /><path d="m4 8 3-4 3 4" /><path d="M14 7h6M14 12h5M14 17h4" /></>,
    calendar: <><rect x="3.5" y="4.5" width="17" height="16" rx="2.5" /><path d="M3.5 9h17M8 3v3M16 3v3" /></>,
    check: <path d="m5 12.5 4.5 4.5L19 7" />,
    chevdown: <path d="m6 9 6 6 6-6" />,
    chevleft: <path d="m14 6-6 6 6 6" />,
    chevright: <path d="m10 6 6 6-6 6" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></>,
    moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
    overview: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    export: <><path d="M12 15V4" /><path d="m8 8 4-4 4 4" /><path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    drag: <><circle cx="9" cy="6" r="1.3" /><circle cx="15" cy="6" r="1.3" /><circle cx="9" cy="12" r="1.3" /><circle cx="15" cy="12" r="1.3" /><circle cx="9" cy="18" r="1.3" /><circle cx="15" cy="18" r="1.3" /></>,
    users: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.2a3.2 3.2 0 0 1 0 6.1M17.5 19a5.5 5.5 0 0 0-3-4.9" /></>,
    layers: <><path d="m12 3 8 4.5-8 4.5-8-4.5z" /><path d="m4 12 8 4.5 8-4.5" /></>,
    megaphone: <><path d="M4 10v4a1 1 0 0 0 1 1h2l9 4V5L7 9H5a1 1 0 0 0-1 1z" /><path d="M19 8a4 4 0 0 1 0 8" /></>,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.6" fill="currentColor" /></>,
    trending: <><path d="M3 17l6-6 4 4 8-8" /><path d="M16 7h5v5" /></>,
    pen: <><path d="M14 5l5 5L8 21H3v-5z" /><path d="M13 6l5 5" /></>,
    inbox: <><path d="M3.5 12.5 6 5h12l2.5 7.5" /><path d="M3.5 12.5V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-5.5" /><path d="M3.5 12.5H9l1.5 2.5h3L15 12.5h5.5" /></>,
    robot: <><rect x="5" y="8" width="14" height="11" rx="3" /><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16.5h5" /><circle cx="12" cy="4" r="1.3" /></>,
    chart: <><path d="M4 4v16h16" /><rect x="7" y="11" width="3" height="6" rx="1" /><rect x="12" y="8" width="3" height="9" rx="1" /><rect x="17" y="13" width="3" height="4" rx="1" /></>,
    settings: <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" /></>,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></>,
    flag: <><path d="M5 21V4" /><path d="M5 4h12l-2 3 2 3H5" /></>,
    panel: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><path d="M9 4.5v15" /></>,
    list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  };
  return <svg {...p}>{paths[name] || null}</svg>;
}

/* ---- platform metadata: brand-colored enamel chips, monogram glyphs (no logos) ---- */
const PLATFORMS = {
  instagram:     { label: "Instagram",     g: "IG", bg: "linear-gradient(135deg,#f9ce34,#ee2a7b 45%,#6228d7)" },
  facebook:      { label: "Facebook",      g: "f",  bg: "linear-gradient(180deg,#3b88ff,#1877f2)" },
  linkedin:      { label: "LinkedIn",      g: "in", bg: "linear-gradient(180deg,#1c84e0,#0a66c2)" },
  x:             { label: "X",             g: "X",  bg: "linear-gradient(180deg,#2a2d33,#15181c)" },
  reddit:        { label: "Reddit",        g: "r",  bg: "linear-gradient(180deg,#ff6a33,#ff4500)" },
  quora:         { label: "Quora",         g: "Q",  bg: "linear-gradient(180deg,#d23a35,#b92b27)" },
  medium:        { label: "Medium",        g: "M",  bg: "linear-gradient(180deg,#2a2d33,#15181c)" },
  "google-ads":  { label: "Google Ads",    g: "G",  bg: "linear-gradient(135deg,#4285f4,#34a853 50%,#fbbc05 75%,#ea4335)" },
  "meta-ads":    { label: "Meta Ads",      g: "M",  bg: "linear-gradient(180deg,#1a86ff,#0668e1)" },
  "linkedin-ads":{ label: "LinkedIn Ads",  g: "in", bg: "linear-gradient(180deg,#1c84e0,#0a66c2)" },
  jiohotstar:    { label: "JioHotstar",    g: "JH", bg: "linear-gradient(180deg,#3a2f74,#1f1a4d)" },
  seo:           { label: "Organic / SEO", g: "S",  bg: "linear-gradient(180deg,#1aa0b2,#13808f)" },
};

const DISCIPLINES = {
  social:      { label: "Social Media", color: "#6c5ce7", icon: "megaphone" },
  performance: { label: "Performance",  color: "#2563eb", icon: "target" },
  seo:         { label: "SEO",          color: "#13808f", icon: "trending" },
  content:     { label: "Content",      color: "#ef7d1c", icon: "pen" },
};

const AVATAR_BG = {
  ad: "linear-gradient(180deg,#6c5ce7,#4b3fc4)",
  rk: "linear-gradient(180deg,#2f86f0,#1f5fd8)",
  mj: "linear-gradient(180deg,#1aa0b2,#127686)",
  sc: "linear-gradient(180deg,#ef9a3c,#dd7615)",
  aa: "linear-gradient(180deg,#3ec27d,#1e8e5a)",
};

Object.assign(window, { Icon, PLATFORMS, DISCIPLINES, AVATAR_BG });
