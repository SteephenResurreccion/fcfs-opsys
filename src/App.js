// src/App.js
import React, { useMemo, useState } from "react";
import "./index.css";

/**
 * FCFS (non-preemptive) computation.
 * - Stable order by arrival time, then input order.
 * - CPU may be idle if next arrival > current time.
 * - start  = max(currentTime, arrival)
 * - completion = start + burst
 * - waiting = start - arrival
 * - turnaround = completion - arrival
 */
function computeFCFS(processes) {
  const parsed = processes
    .map((p, i) => ({
      ...p,
      _i: i,
      arrival: Number(p.arrival),
      burst: Number(p.burst),
    }))
    .filter(p => !Number.isNaN(p.arrival) && !Number.isNaN(p.burst) && p.burst > 0 && p.arrival >= 0);

  // Stable sort: arrival asc, then input index
  parsed.sort((a, b) => a.arrival - b.arrival || a._i - b._i);

  let t = 0;
  const rows = [];
  const timeline = [];

  for (const p of parsed) {
    // CPU idle gap
    if (t < p.arrival) {
      timeline.push({
        pid: "IDLE",
        start: t,
        end: p.arrival,
        duration: p.arrival - t,
        idle: true,
      });
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

  const n = rows.length || 1;
  const avgWaiting = rows.reduce((s, r) => s + r.waiting, 0) / n;
  const avgTurnaround = rows.reduce((s, r) => s + r.turnaround, 0) / n;

  const makespan = timeline.length ? timeline[timeline.length - 1].end - timeline[0].start : 0;

  return { rows, avgWaiting, avgTurnaround, timeline, makespan };
}

export default function App() {
  const [processes, setProcesses] = useState([
    { pid: "P1", arrival: 0, burst: 3 },
    { pid: "P2", arrival: 2, burst: 6 },
    { pid: "P3", arrival: 4, burst: 4 },
  ]);

  const { rows, avgWaiting, avgTurnaround, timeline, makespan } = useMemo(
    () => computeFCFS(processes),
    [processes]
  );

  const handleChange = (idx, field, value) => {
    setProcesses(prev => {
      const next = [...prev];
      if (field === "pid") next[idx].pid = value;
      else next[idx][field] = value === "" ? "" : Number(value);
      return next;
    });
  };

  const addRow = () => {
    const nextIndex = processes.length + 1;
    setProcesses(prev => [...prev, { pid: `P${nextIndex}`, arrival: 0, burst: 1 }]);
  };

  const removeRow = (idx) => {
    setProcesses(prev => prev.filter((_, i) => i !== idx));
  };

  const loadSample = () => {
    setProcesses([
      { pid: "P1", arrival: 0, burst: 3 },
      { pid: "P2", arrival: 2, burst: 6 },
      { pid: "P3", arrival: 4, burst: 4 },
      { pid: "P4", arrival: 6, burst: 5 },
    ]);
  };

  const clearAll = () => setProcesses([{ pid: "P1", arrival: 0, burst: 1 }]);

  return (
    <div className="page">
      <header className="header">
        <h1>FCFS (Non-Preemptive) Scheduler</h1>
        <p className="muted">
          Enter processes (PID, Arrival Time, Burst Time). FCFS schedules by earliest arrival; ties keep input order.
        </p>
      </header>

      {/* Input Table */}
      <section className="card">
        <div className="card-head">
          <h2>Input</h2>
          <div className="actions">
            <button className="btn" onClick={addRow}>+ Add Process</button>
            <button className="btn ghost" onClick={loadSample}>Load Sample</button>
            <button className="btn danger ghost" onClick={clearAll}>Clear</button>
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
              {processes.map((p, i) => (
                <tr key={i}>
                  <td>
                    <input
                      className="input"
                      value={p.pid}
                      onChange={(e) => handleChange(i, "pid", e.target.value)}
                      placeholder="P1"
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="1"
                      value={p.arrival}
                      onChange={(e) => handleChange(i, "arrival", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      step="1"
                      value={p.burst}
                      onChange={(e) => handleChange(i, "burst", e.target.value)}
                    />
                  </td>
                  <td className="cell-right">
                    <button className="btn danger" onClick={() => removeRow(i)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!processes.length && (
                <tr><td colSpan="4" className="muted">No processes. Add one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Results */}
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
                {!rows.length && (
                  <tr><td colSpan="7" className="muted">No valid rows to compute.</td></tr>
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="5" className="cell-right"><strong>Average Waiting</strong></td>
                    <td colSpan="2"><strong>{avgWaiting.toFixed(2)}</strong></td>
                  </tr>
                  <tr>
                    <td colSpan="5" className="cell-right"><strong>Average Turnaround</strong></td>
                    <td colSpan="2"><strong>{avgTurnaround.toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Gantt-like Timeline */}
        <div className="card">
          <div className="card-head">
            <h2>Timeline (Gantt)</h2>
          </div>
          <div className="gantt">
            {timeline.length === 0 && <div className="muted">No timeline to show.</div>}
            {timeline.length > 0 && (
              <div className="gantt-bar">
                {timeline.map((b, i) => {
                  const widthPct = makespan > 0 ? (b.duration / makespan) * 100 : 0;
                  return (
                    <div
                      key={i}
                      className={`block ${b.idle ? "idle" : ""}`}
                      style={{ width: `${widthPct}%` }}
                      title={`${b.pid}: ${b.start} → ${b.end} (${b.duration})`}
                    >
                      <span className="block-label">{b.pid}</span>
                      <span className="block-time">{b.start}</span>
                      <span className="block-time right">{b.end}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="footer muted">
        <p>
          FCFS is <em>non-preemptive</em>: a running process is never interrupted by arrivals.
        </p>
      </footer>
    </div>
  );
}
