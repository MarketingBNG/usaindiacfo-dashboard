/* card.jsx — TaskCard + TaskModal */

function TaskCard({ task, members, dragging, onOpen, onDragStart, onDragEnd }) {
  const d = DISCIPLINES[task.discipline];
  const member = members[task.assignee];
  return (
    <article
      className={"card" + (dragging ? " dragging" : "")}
      draggable
      onClick={() => onOpen(task.id)}
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
    >
      <span className="rail" style={{ color: d ? d.color : "#888", background: `linear-gradient(180deg,${tint(d ? d.color : "#888", 20)},${d ? d.color : "#888"})` }} />
      <div className="card-top">
        <span className="pid">{task.id}</span>
        <span style={{ color: "var(--text-faint)", display: "inline-flex" }}><Icon name="drag" size={15} /></span>
        <span className="right"><PriorityTag level={task.priority} /></span>
      </div>
      <h3>{task.title}</h3>
      <p className="desc">{task.description}</p>
      <ProgressBar items={task.checklist} />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        <DisciplineChip id={task.discipline} />
        <PlatformChip id={task.platform} compact />
      </div>
      <div className="card-foot">
        <Due due={task.due} />
        <span className="av"><Avatar member={member} cls="av-sm" /></span>
      </div>
    </article>
  );
}

function TaskModal({ task, members, onClose, onToggleCheck }) {
  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  if (!task) return null;
  const member = members[task.assignee];
  const s = dueState(task.due);
  const done = task.checklist ? task.checklist.filter(c => c.done).length : 0;
  const total = task.checklist ? task.checklist.length : 0;
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal grain" role="dialog" aria-modal="true">
        <div className="modal-head">
          <span className="pid">{task.id}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close" size={17} /></button>
          <h2>{task.title}</h2>
          <div className="modal-meta">
            <PriorityTag level={task.priority} />
            <DisciplineChip id={task.discipline} />
            <PlatformChip id={task.platform} />
          </div>
        </div>
        <div className="modal-body">
          <div className="m-sec">
            <div className="lbl">Description</div>
            <p>{task.description}</p>
          </div>
          <div className="m-sec">
            <div className="m-grid">
              <div className="m-field">
                <div className="k">Assignee</div>
                <div className="v"><Avatar member={member} cls="av-sm" />{member ? member.name : "Unassigned"}</div>
              </div>
              <div className="m-field">
                <div className="k">Due date</div>
                <div className="v" style={{ color: s.cls === "over" ? "var(--danger)" : s.cls === "soon" ? "var(--warning)" : "var(--text)" }}>
                  <Icon name="calendar" size={15} />{s.txt}
                </div>
              </div>
            </div>
          </div>
          {total > 0 && (
            <div className="m-sec">
              <div className="lbl">Checklist · {done}/{total}</div>
              <div className="check">
                {task.checklist.map((c, i) => (
                  <div key={i} className={"row" + (c.done ? " on" : "")} onClick={() => onToggleCheck(task.id, i)}>
                    <span className="box">{c.done && <Icon name="check" size={14} sw={2.4} />}</span>
                    <span className="txt">{c.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {task.labels && task.labels.length > 0 && (
            <div className="m-sec" style={{ marginBottom: 0 }}>
              <div className="lbl">Labels</div>
              <div className="taglist">{task.labels.map(l => <span key={l} className="tag">{l}</span>)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TaskCard, TaskModal });
