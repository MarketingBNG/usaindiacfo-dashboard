/* chrome.jsx — AppBar, Sidebar, Controls (toolbar + filters), Menu, Toast */

function useOutside(ref, onOut) {
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onOut(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onOut]);
}

function Menu({ trigger, children, align = "right", width }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef();
  useOutside(ref, () => setOpen(false));
  return (
    <div className="menu-wrap" ref={ref}>
      {React.cloneElement(trigger, { onClick: () => setOpen(o => !o), "aria-expanded": open })}
      {open && (
        <div className="menu" style={{ [align]: 0, minWidth: width }} onClick={(e) => e.stopPropagation()}>
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

function AppBar({ theme, onToggleTheme, user }) {
  return (
    <header className="appbar grain">
      <div className="brand">
        <img className="diamond" src="assets/cfo-diamond.png" alt="USA India CFO" />
        <div className="names">
          <span className="b1">USA India CFO</span>
          <span className="b2">Best of Both Worlds</span>
        </div>
      </div>
      <div className="divider" />
      <div className="org"><img src="assets/bng-logo.png" alt="BNG Group" /></div>
      <div className="spacer" />
      <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme" title="Toggle light / dark">
        <span className="ico sun"><Icon name="sun" size={13} /></span>
        <span className="ico moon"><Icon name="moon" size={12} /></span>
        <span className="knob">{theme === "dark" ? <Icon name="moon" size={12} /> : <Icon name="sun" size={13} />}</span>
      </button>
      <RoleBadge role={user.role} />
      <Avatar member={user} />
    </header>
  );
}

const NAV = [
  { id: "board", label: "Task Board", icon: "panel" },
  { id: "overview", label: "Overview", icon: "overview" },
  { id: "social", label: "Social Media", icon: "megaphone" },
  { id: "performance", label: "Performance", icon: "target" },
  { id: "seo", label: "SEO", icon: "trending" },
  { id: "inbox", label: "Inbox", icon: "inbox" },
  { id: "automation", label: "Automation", icon: "robot" },
  { id: "reports", label: "Reports", icon: "chart" },
  { id: "settings", label: "Settings", icon: "settings" },
];

function Sidebar({ collapsed, onToggle, active, setActive }) {
  return (
    <aside className={"sidebar grain" + (collapsed ? " collapsed" : "")}>
      <div className="profile-switch">
        <p className="lbl">Company Profile</p>
        <div className="profile-card">
          <Avatar member={{ id: "ad", initials: "UI", name: "USA India CFO", role: "Company" }} cls="av-sm" />
          <div>
            <div className="pc-name">USA India CFO</div>
            <div className="pc-sub">Active</div>
          </div>
          <span className="pc-check"><Icon name="check" size={16} sw={2.4} /></span>
        </div>
        <div className="profile-card coming" style={{ marginTop: 6 }}>
          <Avatar member={{ id: "x", initials: "BA", name: "BNG Adviser", role: "Coming soon" }} cls="av-sm" />
          <div><div className="pc-name">BNG Adviser</div><div className="pc-sub">Coming soon</div></div>
        </div>
      </div>
      <div className="nav-sec">Sections</div>
      {NAV.map(n => (
        <button key={n.id} className={"nav-item" + (active === n.id ? " active" : "")} onClick={() => setActive(n.id)}>
          <Icon name={n.icon} size={18} /><span className="nav-txt">{n.label}</span>
        </button>
      ))}
      <div className="grow" />
      <button className="collapse-btn" onClick={onToggle}>
        <Icon name={collapsed ? "chevright" : "chevleft"} size={16} />
        <span className="nav-txt">Collapse</span>
      </button>
    </aside>
  );
}

const SORTS = [
  { id: "due", label: "Due date" },
  { id: "priority", label: "Priority" },
  { id: "progress", label: "Progress" },
  { id: "title", label: "Title (A–Z)" },
];
const GROUPS = [
  { id: "status", label: "Status" },
  { id: "discipline", label: "Discipline" },
  { id: "assignee", label: "Assignee" },
  { id: "swim", label: "Swimlanes" },
];

function Controls({ q, setQ, group, setGroup, sort, setSort, filters, setFilters, members, board, onExport, total, shown }) {
  const toggleFilter = (kind, val) => setFilters(f => {
    const cur = new Set(f[kind]);
    cur.has(val) ? cur.delete(val) : cur.add(val);
    return { ...f, [kind]: [...cur] };
  });
  const activeChips = [
    ...filters.priority.map(v => ({ kind: "priority", val: v, label: v[0].toUpperCase() + v.slice(1) + " priority" })),
    ...filters.assignee.map(v => ({ kind: "assignee", val: v, label: members[v] ? members[v].name : v })),
    ...filters.discipline.map(v => ({ kind: "discipline", val: v, label: DISCIPLINES[v] ? DISCIPLINES[v].label : v })),
  ];

  return (
    <React.Fragment>
      <div className="tb-row">
        <div className="search well">
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks, labels, IDs…" />
        </div>

        <div className="segment well">
          {GROUPS.map(g => (
            <button key={g.id} className={group === g.id ? "on" : ""} onClick={() => setGroup(g.id)}>{g.label}</button>
          ))}
        </div>

        <Menu width={196} trigger={
          <button className="btn"><Icon name="sort" size={16} />Sort
            <span className="count">{SORTS.find(s => s.id === sort).label}</span></button>
        }>
          {(close) => (<React.Fragment>
            <div className="mh">Sort by</div>
            {SORTS.map(s => (
              <button key={s.id} className="mi" onClick={() => { setSort(s.id); close(); }}>
                {s.label}{sort === s.id && <span className="ck"><Icon name="check" size={15} sw={2.4} /></span>}
              </button>
            ))}
          </React.Fragment>)}
        </Menu>

        <Menu width={210} trigger={
          <button className="btn"><Icon name="filter" size={16} />Filter
            {activeChips.length > 0 && <span className="count">{activeChips.length}</span>}</button>
        }>
          <div className="mh">Priority</div>
          {["high", "med", "low"].map(p => (
            <button key={p} className="mi" onClick={() => toggleFilter("priority", p)}>
              <PriorityTag level={p} />
              {filters.priority.includes(p) && <span className="ck"><Icon name="check" size={15} sw={2.4} /></span>}
            </button>
          ))}
          <div className="msep" />
          <div className="mh">Discipline</div>
          {board.disciplines.map(d => (
            <button key={d.id} className="mi" onClick={() => toggleFilter("discipline", d.id)}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: DISCIPLINES[d.id].color, boxShadow: "0 0 0 1px rgba(0,0,0,.2)" }} />
              {d.name}
              {filters.discipline.includes(d.id) && <span className="ck"><Icon name="check" size={15} sw={2.4} /></span>}
            </button>
          ))}
          <div className="msep" />
          <div className="mh">Assignee</div>
          {board.members.map(m => (
            <button key={m.id} className="mi" onClick={() => toggleFilter("assignee", m.id)}>
              <Avatar member={m} cls="mav" />{m.name}
              {filters.assignee.includes(m.id) && <span className="ck"><Icon name="check" size={15} sw={2.4} /></span>}
            </button>
          ))}
        </Menu>

        <div className="tb-spacer" />
        <button className="btn primary" onClick={onExport}><Icon name="export" size={16} />Export</button>
      </div>

      {activeChips.length > 0 && (
        <div className="filterbar">
          <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".8px", textTransform: "uppercase", color: "var(--text-faint)" }}>
            {shown} of {total} ·
          </span>
          {activeChips.map(c => (
            <span key={c.kind + c.val} className="fchip">
              {c.label}
              <button className="x" onClick={() => toggleFilter(c.kind, c.val)} aria-label="Remove filter"><Icon name="close" size={12} sw={2.2} /></button>
            </span>
          ))}
          <button className="fclear" onClick={() => setFilters({ priority: [], assignee: [], discipline: [] })}>Clear all</button>
        </div>
      )}
    </React.Fragment>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="toast-wrap">
      <div className="toast"><span className="ti"><Icon name="check" size={15} sw={2.6} /></span>{msg}</div>
    </div>
  );
}

Object.assign(window, { AppBar, Sidebar, Controls, Menu, Toast, NAV });
