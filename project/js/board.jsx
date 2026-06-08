/* board.jsx — Column + Board with status / discipline / assignee / swimlane grouping */

const STATUS_META = {
  backlog:    { color: "#8a93a6" },
  todo:       { color: "#2563eb" },
  inprogress: { color: "#ef7d1c" },
  review:     { color: "#6c5ce7" },
  done:       { color: "#1e8e5a" },
};

function Column({ title, swatch, tasks, members, target, draggingId, onOpen, onDropCard, onDragStart, onDragEnd }) {
  const [over, setOver] = React.useState(false);
  const active = !!draggingId;
  return (
    <div className="column">
      <div className="col-head">
        <span className="swatch" style={{ background: `linear-gradient(180deg,${tint(swatch, 28)},${swatch})` }} />
        <span className="ttl">{title}</span>
        <span className="num">{tasks.length}</span>
      </div>
      <div
        className={"col-body" + (over && active ? " dragover" : "")}
        onDragOver={(e) => { if (active) { e.preventDefault(); setOver(true); } }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); onDropCard(target); }}
      >
        {tasks.length === 0
          ? <EmptyState title="Nothing here" sub={active ? "Drop a card to move it" : "No matching tasks"} />
          : tasks.map(t => (
              <TaskCard key={t.id} task={t} members={members} dragging={draggingId === t.id}
                onOpen={onOpen} onDragStart={onDragStart} onDragEnd={onDragEnd} />
            ))}
      </div>
    </div>
  );
}

function Board({ board, tasks, group, members, draggingId, onOpen, onDropCard, onDragStart, onDragEnd }) {
  const common = { members, draggingId, onOpen, onDropCard, onDragStart, onDragEnd };

  // ----- swimlanes: rows = discipline, cols = status -----
  if (group === "swim") {
    return (
      <div className="board swim">
        {board.disciplines.map(lane => {
          const laneTasks = tasks.filter(t => t.discipline === lane.id);
          const d = DISCIPLINES[lane.id];
          return (
            <div className="lane" key={lane.id}>
              <div className="lane-head">
                <span className="swatch" style={{ background: `linear-gradient(180deg,${tint(d.color, 28)},${d.color})` }} />
                <span className="ttl">{lane.name}</span>
                <span className="num">{laneTasks.length}</span>
              </div>
              <div className="lane-cols">
                {board.columns.map(col => (
                  <Column key={col.id} title={col.name} swatch={STATUS_META[col.id].color}
                    tasks={laneTasks.filter(t => t.status === col.id)}
                    target={{ status: col.id, discipline: lane.id }} {...common} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ----- single-axis grouping -----
  let cols;
  if (group === "discipline") {
    cols = board.disciplines.map(d => ({
      title: d.name, swatch: DISCIPLINES[d.id].color,
      tasks: tasks.filter(t => t.discipline === d.id), target: { discipline: d.id },
    }));
  } else if (group === "assignee") {
    cols = board.members.map(m => ({
      title: m.name, swatch: (AVATAR_BG[m.id] || "#7b8699").match(/#[0-9a-f]{6}/i)[0],
      tasks: tasks.filter(t => t.assignee === m.id), target: { assignee: m.id },
    }));
  } else { // status
    cols = board.columns.map(c => ({
      title: c.name, swatch: STATUS_META[c.id].color,
      tasks: tasks.filter(t => t.status === c.id), target: { status: c.id },
    }));
  }

  return (
    <div className="board">
      {cols.map((c, i) => (
        <Column key={i} title={c.title} swatch={c.swatch} tasks={c.tasks} target={c.target} {...common} />
      ))}
    </div>
  );
}

Object.assign(window, { Board, Column, STATUS_META });
