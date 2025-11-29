// src/App.js
import React, { useMemo, useState } from "react";
import "./index.css";

// Helper to normalize and validate processes
function normalizeProcesses(list) {
  const result = [];
  list.forEach((p, index) => {
    const pid = (p.pid ?? "").trim();
    const arrival = Number(p.arrival);
    const burst = Number(p.burst);
    if (!pid) return;
    if (!Number.isFinite(arrival) || !Number.isFinite(burst)) return;
    if (burst <= 0) return;
    result.push({ pid, arrival, burst, index });
  });
  return result;
}

// FCFS (non-preemptive) with arrival times and idle periods
function computeFCFS(list) {
  const ps = normalizeProcesses(list).sort((a, b) =>
    a.arrival !== b.arrival ? a.arrival - b.arrival : a.index - b.index
  );

  let t = 0;
  const rows = [];
  const timeline = [];

  const pushIdle = (from, to) => {
    if (to > from) {
      timeline.push({
        pid: "IDLE",
        start: from,
        end: to,
        duration: to - from,
        idle: true,
      });
    }
  };

  for (const p of ps) {
    if (t < p.arrival) {
      pushIdle(t, p.arrival);
      t = p.arrival;
    }
    const start = t;
    const completion = start + p.burst;
    const waiting = start - p.arrival;
    const turnaround = completion - p.arrival;

    rows.push({
      pid: p.pid,
      arrival: p.arrival,
      burst: p.burst,
      start,
      completion,
      waiting,
      turnaround,
    });

    timeline.push({
      pid: p.pid,
      start,
      end: completion,
      duration: p.burst,
      idle: false,
    });

    t = completion;
  }

  let sw = 0;
  let st = 0;
  for (const r of rows) {
    sw += r.waiting;
    st += r.turnaround;
  }

  const n = rows.length || 1;
  const avgWaiting = sw / n;
  const avgTurnaround = st / n;
  const makespan = timeline.length
    ? timeline[timeline.length - 1].end - timeline[0].start
    : 0;

  return { rows, avgWaiting, avgTurnaround, timeline, makespan };
}

// SJF (non-preemptive) with arrival times
function computeSJF(list) {
  const base = normalizeProcesses(list);

  const remaining = base
    .slice()
    .sort((a, b) =>
      a.arrival !== b.arrival ? a.arrival - b.arrival : a.index - b.index
    );

  const ready = [];
  const rows = [];
  const timeline = [];
  let t = 0;

  const pushIdle = (from, to) => {
    if (to > from) {
      timeline.push({
        pid: "IDLE",
        start: from,
        end: to,
        duration: to - from,
        idle: true,
      });
    }
  };

  const bringArrivals = () => {
    while (remaining.length > 0 && remaining[0].arrival <= t) {
      ready.push(remaining.shift());
    }
  };

  while (remaining.length > 0 || ready.length > 0) {
    bringArrivals();

    if (ready.length === 0) {
      const nextArrival = remaining[0].arrival;
      pushIdle(t, nextArrival);
      t = nextArrival;
      bringArrivals();
      if (ready.length === 0) continue;
    }

    // choose shortest job; ties by arrival then original index
    let best = 0;
    for (let i = 1; i < ready.length; i++) {
      const a = ready[i];
      const b = ready[best];
      if (
        a.burst < b.burst ||
        (a.burst === b.burst &&
          (a.arrival < b.arrival ||
            (a.arrival === b.arrival && a.index < b.index)))
      ) {
        best = i;
      }
    }

    const p = ready.splice(best, 1)[0];

    const start = Math.max(t, p.arrival);
    if (t < start) {
      pushIdle(t, start);
    }

    const completion = start + p.burst;
    const waiting = start - p.arrival;
    const turnaround = completion - p.arrival;

    rows.push({
      pid: p.pid,
      arrival: p.arrival,
      burst: p.burst,
      start,
      completion,
      waiting,
      turnaround,
    });

    timeline.push({
      pid: p.pid,
      start,
      end: completion,
      duration: p.burst,
      idle: false,
    });

    t = completion;
  }

  let sw = 0;
  let st = 0;
  for (const r of rows) {
    sw += r.waiting;
    st += r.turnaround;
  }

  const n = rows.length || 1;
  const avgWaiting = sw / n;
  const avgTurnaround = st / n;
  const makespan = timeline.length
    ? timeline[timeline.length - 1].end - timeline[0].start
    : 0;

  return { rows, avgWaiting, avgTurnaround, timeline, makespan };
}

export default function App() {
  const [processes, setProcesses] = useState([
    { pid: "P1", arrival: 0, burst: 3 },
    { pid: "P2", arrival: 2, burst: 6 },
    { pid: "P3", arrival: 4, burst: 4 },
  ]);

  const [algo, setAlgo] = useState("FCFS");

  const { rows, avgWaiting, avgTurnaround, timeline, makespan } = useMemo(
    () => (algo === "FCFS" ? computeFCFS(processes) : computeSJF(processes)),
    [processes, algo]
  );

  const changeText = (i, e) => {
    const next = processes.slice();
    next[i].pid = e.target.value;
    setProcesses(next);
  };

  const changeNum = (i, field, e) => {
    const next = processes.slice();
    const v = e.target.value;
    next[i][field] = v === "" ? "" : Number(v);
    setProcesses(next);
  };

  const addRow = () =>
    setProcesses((p) =>
      p.concat({
        pid: "P" + (p.length + 1),
        arrival: 0,
        burst: 1,
      })
    );

  const removeRow = (i) =>
    setProcesses((p) => p.filter((_, index) => index !== i));

  const loadSample = () =>
    setProcesses([
      { pid: "P1", arrival: 0, burst: 3 },
      { pid: "P2", arrival: 2, burst: 6 },
      { pid: "P3", arrival: 4, burst: 4 },
      { pid: "P4", arrival: 6, burst: 5 },
    ]);

  return (
    <div className="page">
      <header className="header">
        <h1>{algo} (Non-Preemptive) Scheduler</h1>
        <p className="muted">
          Enter PID, Arrival, Burst.{" "}
          {algo === "FCFS"
            ? "FCFS runs by earliest arrival; no preemption."
            : "SJF runs the ready process with the shortest burst time; ties use FCFS; non-preemptive."}
        </p>
        <div className="algo-toggle">
          <span className="algo-label">Algorithm:</span>
          <label>
            <input
              type="radio"
              name="algo"
              value="FCFS"
              checked={algo === "FCFS"}
              onChange={() => setAlgo("FCFS")}
            />
            FCFS
          </label>
          <label>
            <input
              type="radio"
              name="algo"
              value="SJF"
              checked={algo === "SJF"}
              onChange={() => setAlgo("SJF")}
            />
            SJF
          </label>
        </div>
      </header>

      <section className="card">
        <div className="card-head">
          <h2>Input</h2>
          <div className="actions">
            <button className="btn" onClick={addRow}>
              + Add
            </button>
            <button className="btn ghost" onClick={loadSample}>
              Load Sample
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>PID</th>
                <th>Arrival</th>
                <th>Burst</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {processes.length === 0 && (
                <tr>
                  <td colSpan="4" className="muted">
                    No processes.
                  </td>
                </tr>
              )}
              {processes.map((p, i) => (
                <tr key={i}>
                  <td>
                    <input
                      className="input"
                      value={p.pid}
                      onChange={(e) => changeText(i, e)}
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={p.arrival}
                      onChange={(e) => changeNum(i, "arrival", e)}
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={p.burst}
                      onChange={(e) => changeNum(i, "burst", e)}
                    />
                  </td>
                  <td className="cell-right">
                    <button
                      className="btn danger"
                      onClick={() => removeRow(i)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid">
        <div className="card">
          <div className="card-head">
            <h2>Results</h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>PID</th>
                  <th>Arrival</th>
                  <th>Burst</th>
                  <th>Start</th>
                  <th>Completion</th>
                  <th>Waiting</th>
                  <th>Turnaround</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="7" className="muted">
                      No valid rows.
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.pid}</td>
                    <td>{r.arrival}</td>
                    <td>{r.burst}</td>
                    <td>{r.start}</td>
                    <td>{r.completion}</td>
                    <td>{r.waiting}</td>
                    <td>{r.turnaround}</td>
                  </tr>
                ))}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="5" className="cell-right">
                      <strong>Average waiting time</strong>
                    </td>
                    <td colSpan="2">
                      <strong>{avgWaiting.toFixed(2)}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="5" className="cell-right">
                      <strong>Average turnaround time</strong>
                    </td>
                    <td colSpan="2">
                      <strong>{avgTurnaround.toFixed(2)}</strong>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Timeline (Gantt)</h2>
          </div>
          <div className="gantt">
            {timeline.length === 0 && (
              <div className="muted">No timeline to show.</div>
            )}
            {timeline.length > 0 && (
              <div className="gantt-inner">
                <div className="gantt-bar">
                  {timeline.map((b, i) => {
                    const w =
                      makespan > 0 ? (b.duration / makespan) * 100 : 0;
                    const isFirst = i === 0;
                    const isLast = i === timeline.length - 1;
                    const showLeft = isFirst; // only first block shows left tick
                    const showRight = true; // every block shows right tick

                    return (
                      <div
                        key={i}
                        className={
                          "block " +
                          (b.idle ? "idle " : "") +
                          (isFirst ? "first " : "") +
                          (isLast ? "last " : "")
                        }
                        style={{ width: w + "%" }}
                        title={`${b.pid}: ${b.start} \u2192 ${b.end} (${b.duration})`}
                      >
                        <span className="block-label">{b.pid}</span>
                        {showLeft && (
                          <span className="block-time left">
                            {b.start}
                          </span>
                        )}
                        {showRight && (
                          <span className="block-time right">
                            {b.end}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="gantt-legend">
                  <div className="legend-item">
                    <span className="legend-box running"></span>
                    <span>Running</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-box idle-box"></span>
                    <span>Idle</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="footer muted">
        <p>
          {algo} is <em>non-preemptive</em>: once running, a process finishes.
        </p>
      </footer>
    </div>
  );
}
