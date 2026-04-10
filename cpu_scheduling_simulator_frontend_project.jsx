import React, { useState, useRef, useEffect } from "react";

const COLORS = ["#ef4444","#3b82f6","#22c55e","#f59e0b","#a855f7","#06b6d4","#ec4899"];

export default function CPUScheduler() {
  const [processes, setProcesses] = useState([]);
  const [pid, setPid] = useState("");
  const [arrival, setArrival] = useState("");
  const [burst, setBurst] = useState("");
  const [algo, setAlgo] = useState("FCFS");
  const [quantum, setQuantum] = useState(2);

  const [timeline, setTimeline] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [finalResult, setFinalResult] = useState(null);

  const intervalRef = useRef(null);

  // assign colors dynamically
  const getColor = (pid) => {
    if (pid === "Idle") return "#6b7280";
    const index = processes.findIndex(p => p.pid === pid);
    return COLORS[index % COLORS.length];
  };

  const recompute = (procs) => {
    if (!procs.length) return;

    let res;
    if (algo === "FCFS") res = fcfsTimeline(procs);
    if (algo === "SJF") res = sjfTimeline(procs);
    if (algo === "RR") res = rrTimeline(procs, quantum);

    setTimeline(res);
    setCurrentStep(0);

    let full;
    if (algo === "FCFS") full = fcfs(procs);
    if (algo === "SJF") full = sjf(procs);
    if (algo === "RR") full = rr(procs, quantum);

    setFinalResult(full);
  };

  const addProcess = () => {
    if (!pid || arrival === "" || burst === "") return;
    const updated = [...processes, { pid, arrival: +arrival, burst: +burst }];
    setProcesses(updated);
    setPid(""); setArrival(""); setBurst("");

    // FIX 1: auto update immediately
    recompute(updated);
  };

  // also recompute when algo/quantum changes
  useEffect(() => {
    recompute(processes);
  }, [algo, quantum]);

  const startSimulation = () => {
    if (!timeline.length) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= timeline.length - 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
  };

  const stepForward = () => {
    if (currentStep < timeline.length - 1) setCurrentStep(currentStep + 1);
  };

  const reset = () => {
    setCurrentStep(0);
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">⚡ CPU Scheduling Simulator (Advanced)</h1>

      {/* Input */}
      <div className="bg-gray-100 p-4 rounded-xl shadow">
        <div className="flex gap-2 flex-wrap">
          <input placeholder="PID" value={pid} onChange={e=>setPid(e.target.value)} className="border p-2 rounded" />
          <input placeholder="Arrival" type="number" value={arrival} onChange={e=>setArrival(e.target.value)} className="border p-2 rounded" />
          <input placeholder="Burst" type="number" value={burst} onChange={e=>setBurst(e.target.value)} className="border p-2 rounded" />
          <button onClick={addProcess} className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
        </div>

        <div className="mt-4 flex gap-3 items-center">
          <select value={algo} onChange={e=>setAlgo(e.target.value)} className="border p-2 rounded">
            <option>FCFS</option>
            <option>SJF</option>
            <option>RR</option>
          </select>

          {algo === "RR" && (
            <input type="number" value={quantum} onChange={e=>setQuantum(+e.target.value)} className="border p-2 rounded" />
          )}
        </div>
      </div>

      {/* Controls */}
      {timeline.length > 0 && (
        <div className="mt-6 flex gap-3">
          <button onClick={startSimulation} className="bg-green-600 text-white px-4 py-2 rounded">▶ Play</button>
          <button onClick={stepForward} className="bg-blue-600 text-white px-4 py-2 rounded">⏭ Step</button>
          <button onClick={reset} className="bg-red-600 text-white px-4 py-2 rounded">⏹ Reset</button>
        </div>
      )}

      {/* LIVE CHART */}
      {timeline.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold">📊 Live Execution</h2>
          <div className="flex mt-4 overflow-x-auto border p-4 bg-white">
            {timeline.slice(0, currentStep + 1).map((step, i) => (
              <div key={i} className="text-center">
                <div
                  className="mx-1 flex items-center justify-center text-white"
                  style={{ width: 60, height: 80, backgroundColor: getColor(step.pid) }}
                >
                  {step.pid}
                </div>
                <div className="text-xs">t={step.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FINAL GANTT */}
      {finalResult && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold">📊 Final Gantt Chart</h2>
          <div className="flex overflow-x-auto border p-4 bg-white">
            {finalResult.gantt.map((g, i) => (
              <div key={i} className="text-center">
                <div
                  className="text-white mx-1 flex items-center justify-center"
                  style={{ width: g.duration * 60, height: 80, backgroundColor: getColor(g.pid) }}
                >
                  {g.pid}
                </div>
                <div className="text-xs">{g.start}</div>
              </div>
            ))}
            <div className="self-end text-sm">{finalResult.endTime}</div>
          </div>

          <h2 className="text-xl font-semibold mt-6">📋 Process Table</h2>
          <table className="w-full border mt-2">
            <thead className="bg-gray-200">
              <tr><th>PID</th><th>WT</th><th>TAT</th></tr>
            </thead>
            <tbody>
              {finalResult.table.map(r => (
                <tr key={r.pid} className="text-center border">
                  <td>{r.pid}</td>
                  <td>{r.wt}</td>
                  <td>{r.tat}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 text-lg">
            Avg WT: {finalResult.avgWT.toFixed(2)} | Avg TAT: {finalResult.avgTAT.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== SAME ALGO LOGIC (unchanged) =====
function fcfs(proc) {
  let time = 0, gantt = [], table = [];
  const sorted = [...proc].sort((a,b)=>a.arrival-b.arrival);
  sorted.forEach(p => {
    if (time < p.arrival) time = p.arrival;
    let start = time;
    time += p.burst;
    let tat = time - p.arrival;
    let wt = tat - p.burst;
    gantt.push({ pid: p.pid, start, duration: p.burst });
    table.push({ pid: p.pid, wt, tat });
  });
  return finalize(gantt, table, time);
}

function sjf(proc) {
  let time = 0, gantt = [], table = [];
  let remaining = [...proc];
  while (remaining.length) {
    let available = remaining.filter(p => p.arrival <= time);
    if (!available.length) { time++; continue; }
    available.sort((a,b)=>a.burst-b.burst);
    let p = available[0];
    let start = time;
    time += p.burst;
    let tat = time - p.arrival;
    let wt = tat - p.burst;
    gantt.push({ pid: p.pid, start, duration: p.burst });
    table.push({ pid: p.pid, wt, tat });
    remaining = remaining.filter(x=>x!==p);
  }
  return finalize(gantt, table, time);
}

function rr(proc, q) {
  let time = 0, gantt = [], table = [];
  let queue = [];
  let remaining = proc.map(p => ({...p, rem: p.burst}));

  while (remaining.length || queue.length) {
    remaining.forEach(p => {
      if (p.arrival === time) queue.push(p);
    });

    if (!queue.length) { time++; continue; }

    let p = queue.shift();
    let exec = Math.min(q, p.rem);
    let start = time;

    time += exec;
    gantt.push({ pid: p.pid, start, duration: exec });

    remaining.forEach(x => {
      if (x.arrival > start && x.arrival <= time) queue.push(x);
    });

    p.rem -= exec;
    if (p.rem > 0) queue.push(p);
    else {
      let tat = time - p.arrival;
      let wt = tat - p.burst;
      table.push({ pid: p.pid, wt, tat });
      remaining = remaining.filter(x=>x.pid!==p.pid);
    }
  }

  return finalize(gantt, table, time);
}

function finalize(gantt, table, endTime) {
  let avgWT = table.reduce((s,p)=>s+p.wt,0)/table.length;
  let avgTAT = table.reduce((s,p)=>s+p.tat,0)/table.length;
  return { gantt, table, avgWT, avgTAT, endTime };
}

// TIMELINE
function fcfsTimeline(proc) {
  let time = 0, timeline = [];
  const sorted = [...proc].sort((a,b)=>a.arrival-b.arrival);
  sorted.forEach(p => {
    if (time < p.arrival) time = p.arrival;
    for (let i = 0; i < p.burst; i++) {
      timeline.push({ pid: p.pid, time, active: true });
      time++;
    }
  });
  return timeline;
}

function sjfTimeline(proc) {
  let time = 0, timeline = [], remaining = [...proc];
  while (remaining.length) {
    let available = remaining.filter(p => p.arrival <= time);
    if (!available.length) {
      timeline.push({ pid: "Idle", time, active: false });
      time++;
      continue;
    }
    available.sort((a,b)=>a.burst-b.burst);
    let p = available[0];
    for (let i = 0; i < p.burst; i++) {
      timeline.push({ pid: p.pid, time, active: true });
      time++;
    }
    remaining = remaining.filter(x=>x!==p);
  }
  return timeline;
}

function rrTimeline(proc, q) {
  let time = 0, timeline = [], queue = [];
  let remaining = proc.map(p => ({...p, rem: p.burst}));

  while (remaining.length || queue.length) {
    remaining.forEach(p => {
      if (p.arrival === time) queue.push(p);
    });

    if (!queue.length) {
      timeline.push({ pid: "Idle", time, active: false });
      time++;
      continue;
    }

    let p = queue.shift();
    let exec = Math.min(q, p.rem);

    for (let i = 0; i < exec; i++) {
      timeline.push({ pid: p.pid, time, active: true });
      time++;
      remaining.forEach(x => {
        if (x.arrival === time) queue.push(x);
      });
    }

    p.rem -= exec;
    if (p.rem > 0) queue.push(p);
    else remaining = remaining.filter(x=>x.pid!==p.pid);
  }

  return timeline;
}
