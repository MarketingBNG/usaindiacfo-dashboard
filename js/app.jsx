/* app.jsx — root: data load, drag-drop, filter/sort/group, theme, modal */

const PRIO_RANK = { high: 0, med: 1, low: 2 };

function Skeleton() {
  return (
    <div className="board">
      {[0, 1, 2, 3].map(c => (
        <div className="column" key={c}>
          <div className="col-head"><span className="swatch" style={{ background: "var(--text-faint)", opacity: .4 }} /><span className="ttl" style={{ opacity: .3 }}>Loading</span></div>
          <div className="col-body">
            {[0, 1].map(i => (
              <div key={i} className="card" style={{ cursor: "default" }}>
                <div style={{ height: 10, width: "40%", borderRadius: 6, background: "var(--well-bg)", marginBottom: 12, boxShadow: "var(--well-shadow)" }} />
                <div style={{ height: 14, width: "85%", borderRadius: 6, background: "var(--well-bg)", marginBottom: 8, boxShadow: "var(--well-shadow)" }} />
                <div style={{ height: 9, width: "100%", borderRadius: 6, background: "var(--well-bg)", marginBottom: 16, boxShadow: "var(--well-shadow)" }} />
                <div style={{ height: 22, width: "55%", borderRadius: 999, background: "var(--well-bg)", boxShadow: "var(--well-shadow)" }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [data, setData] = React.useState(null);
  const [theme, setTheme] = React.useState(() => localStorage.getItem("uic_theme") || "dark");
  const [group, setGroup] = React.useState(() => localStorage.getItem("uic_group") || "status");
  const [sort, setSort] = React.useState("due");
  const [q, setQ] = React.useState("");
  const [filters, setFilters] = React.useState({ priority: [], assignee: [], discipline: [] });
  const [openId, setOpenId] = React.useState(null);
  const [draggingId, setDraggingId] = React.useState(null);
  const [collapsed, setCollapsed] = React.useState(false);
  const [activeNav, setActiveNav] = React.useState("board");
  const [toast, setToast] = React.useState("");
  const toastTimer = React.useRef();

  // theme persistence
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("uic_theme", theme);
  }, [theme]);
  React.useEffect(() => { localStorage.setItem("uic_group", group); }, [group]);

  // load JSON (file → inline seed fallback for offline / file://)
  React.useEffect(() => {
    let live = true;
    const seed = () => { if (live) setTimeout(() => setData(window.__SEED__), 450); };
    fetch("tasks.json")
      .then(r => { if (!r.ok) throw 0; return r.json(); })
      .then(j => { if (live) setTimeout(() => setData(j), 450); })
      .catch(seed);
    return () => { live = false; };
  }, []);

  const fireToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };

  if (!data) {
    return (
      <div className="app">
        <div className="appbar grain"><div className="brand"><img className="diamond" src="assets/cfo-diamond.png" alt="" /><div className="names"><span className="b1">USA India CFO</span><span className="b2">Best of Both Worlds</span></div></div></div>
        <div className="body"><div className="main"><div className="board-scroll"><Skeleton /></div></div></div>
      </div>
    );
  }

  const { board, tasks } = data;
  const members = Object.fromEntries(board.members.map(m => [m.id, m]));
  const user = members.ad;

  // ---- filter + search ----
  const ql = q.trim().toLowerCase();
  let visible = tasks.filter(t => {
    if (filters.priority.length && !filters.priority.includes(t.priority)) return false;
    if (filters.assignee.length && !filters.assignee.includes(t.assignee)) return false;
    if (filters.discipline.length && !filters.discipline.includes(t.discipline)) return false;
    if (ql) {
      const hay = (t.id + " " + t.title + " " + t.description + " " + (t.labels || []).join(" ")).toLowerCase();
      if (!hay.includes(ql)) return false;
    }
    return true;
  });

  // ---- sort ----
  const pct = t => { const c = t.checklist || []; return c.length ? c.filter(x => x.done).length / c.length : 0; };
  visible = [...visible].sort((a, b) => {
    if (sort === "priority") return PRIO_RANK[a.priority] - PRIO_RANK[b.priority];
    if (sort === "progress") return pct(b) - pct(a);
    if (sort === "title") return a.title.localeCompare(b.title);
    return (a.due || "9999").localeCompare(b.due || "9999"); // due
  });

  // ---- drag-drop ----
  const onDragStart = (e, id) => { setDraggingId(id); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", id); } catch (x) {} };
  const onDragEnd = () => setDraggingId(null);
  const onDropCard = (target) => {
    if (!draggingId) return;
    setData(d => ({
      ...d,
      tasks: d.tasks.map(t => t.id === draggingId ? { ...t, ...target } : t),
    }));
    setDraggingId(null);
  };

  const onToggleCheck = (id, idx) => setData(d => ({
    ...d,
    tasks: d.tasks.map(t => t.id !== id ? t : { ...t, checklist: t.checklist.map((c, i) => i === idx ? { ...c, done: !c.done } : c) }),
  }));

  const openTask = openId ? tasks.find(t => t.id === openId) : null;
  const sectionLabel = (NAV.find(n => n.id === activeNav) || {}).label || "Task Board";

  const isBoard = activeNav === "board";

  return (
    <div className="app">
      <AppBar theme={theme} onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")} user={user} />
      <div className="body">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} active={activeNav} setActive={setActiveNav} />
        <div className="main">
          <div className="toolbar">
            <div className="crumbs">
              <span>BNG Group</span><span className="sep"><Icon name="chevright" size={13} /></span>
              <span>USA India CFO</span><span className="sep"><Icon name="chevright" size={13} /></span>
              <b>{sectionLabel}</b>
            </div>
          </div>
          {isBoard ? (
            <React.Fragment>
              <Controls
                q={q} setQ={setQ} group={group} setGroup={setGroup} sort={sort} setSort={setSort}
                filters={filters} setFilters={setFilters} members={members} board={board}
                total={tasks.length} shown={visible.length}
                onExport={() => fireToast("Board exported — report.pdf is downloading")}
              />
              <div className="board-scroll">
                {visible.length === 0
                  ? <div style={{ maxWidth: 320, margin: "60px auto" }}><EmptyState title="No tasks match your filters" sub="Try clearing search or filters to see the full board." /></div>
                  : <Board board={board} tasks={visible} group={group} members={members}
                      draggingId={draggingId} onOpen={setOpenId} onDropCard={onDropCard}
                      onDragStart={onDragStart} onDragEnd={onDragEnd} />}
              </div>
            </React.Fragment>
          ) : (
            <div className="anl-wrap">
              <Analytics activeNav={activeNav} />
            </div>
          )}
        </div>
      </div>
      {openTask && <TaskModal task={openTask} members={members} onClose={() => setOpenId(null)} onToggleCheck={onToggleCheck} />}
      <Toast msg={toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
