import { useMemo } from "react";
import { useStore } from "./store";
import type { RunSummary } from "./types";

function summarizeRuns(events: ReturnType<typeof useStore.getState>["events"]): RunSummary[] {
  const byRun = new Map<string, typeof events>();
  events.forEach((event) => {
    const list = byRun.get(event.runId) ?? [];
    list.push(event);
    byRun.set(event.runId, list);
  });

  return Array.from(byRun.entries()).map(([runId, runEvents]) => {
    const attempts = runEvents.filter((event) => event.type === "attempt.started").length;
    const terminal = runEvents[runEvents.length - 1];
    const status = terminal?.type === "run.succeeded"
      ? "SUCCESS"
      : terminal?.type === "run.failed"
        ? "FAILED"
        : "RUNNING";
    const model = String(
      runEvents.find((event) => event.type === "run.started")?.data?.metadata
        && (runEvents.find((event) => event.type === "run.started")?.data.metadata as Record<string, unknown>).model
        || "unknown",
    );
    const durationMs = terminal?.data?.totalDurationMs;
    const duration = typeof durationMs === "number" ? `${(durationMs / 1000).toFixed(2)}s` : "-";
    return { runId, status, attempts, duration, model, events: runEvents };
  });
}

export function App() {
  const {
    events,
    selectedRunId,
    selectedEventIndex,
    input,
    wsURL,
    wsConnected,
    parseError,
    setInput,
    setWsURL,
    setSelectedRunId,
    setSelectedEventIndex,
    loadJSON,
    connectWS,
    disconnectWS,
  } = useStore();

  const runs = useMemo(() => summarizeRuns(events), [events]);
  const selectedRun = runs.find((run) => run.runId === selectedRunId) ?? runs[0];
  const runEvents = selectedRun?.events ?? [];
  const selectedEvent = runEvents[selectedEventIndex] ?? runEvents[0];

  return (
    <div className="app">
      <header className="header" id="shot-header" data-shot="header">
        <h1>Boundary Inspector</h1>
        <p>Run to Attempts to Events</p>
      </header>

      <section className="controls" id="shot-controls" data-shot="controls">
        <textarea value={input} onChange={(event) => setInput(event.target.value)} />
        <button onClick={loadJSON}>Load JSON</button>
        <input value={wsURL} onChange={(event) => setWsURL(event.target.value)} />
        {!wsConnected ? (
          <button onClick={connectWS}>Connect WebSocket</button>
        ) : (
          <button onClick={disconnectWS}>Disconnect</button>
        )}
        {parseError ? <p className="error">{parseError}</p> : null}
      </section>

      <section className="layout" id="shot-layout" data-shot="layout">
        <aside className="panel" id="shot-runs-list" data-shot="runs-list">
          <h2>Runs</h2>
          {runs.map((run) => (
            <button
              key={run.runId}
              className={run.runId === selectedRun?.runId ? "active" : ""}
              onClick={() => {
                setSelectedRunId(run.runId);
                setSelectedEventIndex(0);
              }}
            >
              {run.runId} · {run.status} · {run.attempts} attempts
            </button>
          ))}
        </aside>

        <main className="panel" id="shot-run-inspector" data-shot="run-inspector">
          <h2>Run Inspector</h2>
          <div className="summary">
            <span>Model: {selectedRun?.model ?? "-"}</span>
            <span>Status: {selectedRun?.status ?? "-"}</span>
            <span>Duration: {selectedRun?.duration ?? "-"}</span>
          </div>
          <div className="events">
            {runEvents.map((event, index) => (
              <button
                key={`${event.runId}-${event.type}-${index}`}
                className={index === selectedEventIndex ? "active" : ""}
                onClick={() => setSelectedEventIndex(index)}
              >
                {event.attempt ? `A${event.attempt} · ` : ""}{event.type}
              </button>
            ))}
          </div>
        </main>

        <aside className="panel" id="shot-event-details" data-shot="event-details">
          <h2>Event Details</h2>
          <pre>{JSON.stringify(selectedEvent ?? {}, null, 2)}</pre>
        </aside>
      </section>
    </div>
  );
}
