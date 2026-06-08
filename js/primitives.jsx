/* primitives.jsx — small reusable skeuomorphic UI atoms */

function Avatar({ member, cls = "" }) {
  if (!member) return null;
  return (
    <div className={"avatar " + cls} style={{ background: AVATAR_BG[member.id] || "linear-gradient(180deg,#7b8699,#5b6577)" }}
         title={member.name + " · " + member.role}>
      {member.initials}
    </div>
  );
}

function PriorityTag({ level }) {
  const labels = { high: "High", med: "Medium", low: "Low" };
  return (
    <span className={"prio " + level}>
      <span className="pin" />{labels[level]}
    </span>
  );
}

function DisciplineChip({ id }) {
  const d = DISCIPLINES[id];
  if (!d) return null;
  return (
    <span className="chip" style={{ background: `linear-gradient(180deg,${tint(d.color, 18)},${d.color})` }}>
      <span className="glyph"><Icon name={d.icon} size={11} sw={2} /></span>{d.label}
    </span>
  );
}

function PlatformChip({ id, compact }) {
  const p = PLATFORMS[id];
  if (!p) return null;
  return (
    <span className="chip" style={{ background: p.bg }} title={p.label}>
      <span className="glyph" style={{ fontSize: p.g.length > 1 ? 7 : 8 }}>{p.g}</span>
      {!compact && p.label}
    </span>
  );
}

function ProgressBar({ items }) {
  const total = items ? items.length : 0;
  const done = items ? items.filter(i => i.done).length : 0;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="progress">
      <span className="due" style={{ minWidth: 0 }}><Icon name="check" size={13} /></span>
      <div className="track"><div className={"fill" + (pct === 100 ? " done" : "")} style={{ width: pct + "%" }} /></div>
      <span className="pct">{done}/{total}</span>
    </div>
  );
}

function dueState(due) {
  if (!due) return { cls: "", txt: "—" };
  const d = new Date(due + "T00:00:00");
  const today = new Date("2026-06-05T00:00:00");
  const days = Math.round((d - today) / 86400000);
  const txt = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (days < 0) return { cls: "over", txt: txt + " · overdue" };
  if (days <= 3) return { cls: "soon", txt: txt + (days === 0 ? " · today" : ` · ${days}d`) };
  return { cls: "", txt };
}

function Due({ due, full }) {
  const s = dueState(due);
  return <span className={"due " + s.cls}><Icon name="calendar" size={13} />{full ? s.txt : s.txt}</span>;
}

function RoleBadge({ role }) {
  return <span className="role-badge"><span className="dot" />{role}</span>;
}

function EmptyState({ title, sub }) {
  return (
    <div className="empty">
      <div className="ec"><Icon name="inbox" size={22} /></div>
      <div className="et">{title}</div>
      {sub && <div className="es">{sub}</div>}
    </div>
  );
}

/* lighten a hex color toward white by amt% — for glossy chip top */
function tint(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r + (255 - r) * amt / 100);
  g = Math.round(g + (255 - g) * amt / 100);
  b = Math.round(b + (255 - b) * amt / 100);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

Object.assign(window, { Avatar, PriorityTag, DisciplineChip, PlatformChip, ProgressBar, Due, RoleBadge, EmptyState, dueState, tint });
