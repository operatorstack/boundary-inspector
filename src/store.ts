import { create } from "zustand";
import type { BoundaryEvent } from "./types";

type State = {
  events: BoundaryEvent[];
  selectedRunId: string | null;
  selectedEventIndex: number;
  input: string;
  wsURL: string;
  wsConnected: boolean;
  parseError: string | null;
  socket: WebSocket | null;
  setInput: (input: string) => void;
  setWsURL: (url: string) => void;
  setSelectedRunId: (runId: string) => void;
  setSelectedEventIndex: (index: number) => void;
  loadJSON: () => void;
  connectWS: () => void;
  disconnectWS: () => void;
};

function isBoundaryEvent(x: unknown): x is BoundaryEvent {
  if (typeof x !== "object" || x === null) {
    return false;
  }
  const c = x as Record<string, unknown>;
  return typeof c.system === "string"
    && typeof c.runId === "string"
    && typeof c.ts === "string"
    && typeof c.type === "string"
    && typeof c.data === "object"
    && c.data !== null;
}

function sampleEvents(): BoundaryEvent[] {
  return [
    { system: "llm-contract", runId: "run_8c41d1", ts: new Date().toISOString(), type: "run.started", data: { metadata: { model: "claude-3.7-sonnet" } } },
    { system: "llm-contract", runId: "run_8c41d1", ts: new Date().toISOString(), type: "attempt.started", attempt: 1, data: { maxAttempts: 3 } },
    { system: "llm-contract", runId: "run_8c41d1", ts: new Date().toISOString(), type: "verification.failed", attempt: 1, level: "warn", data: { category: "PARSE_ERROR" } },
    { system: "llm-contract", runId: "run_8c41d1", ts: new Date().toISOString(), type: "attempt.started", attempt: 2, data: { maxAttempts: 3 } },
    { system: "llm-contract", runId: "run_8c41d1", ts: new Date().toISOString(), type: "run.succeeded", data: { totalDurationMs: 1200 } },
    { system: "llm-contract", runId: "run_a9c23f", ts: new Date().toISOString(), type: "run.started", data: { metadata: { model: "gpt-4o-mini" } } },
    { system: "llm-contract", runId: "run_a9c23f", ts: new Date().toISOString(), type: "attempt.started", attempt: 1, data: { maxAttempts: 2 } },
    { system: "llm-contract", runId: "run_a9c23f", ts: new Date().toISOString(), type: "run.failed", data: { message: "Contract failed" } },
  ];
}

export const useStore = create<State>((set, get) => ({
  events: sampleEvents(),
  selectedRunId: "run_8c41d1",
  selectedEventIndex: 0,
  input: JSON.stringify(sampleEvents(), null, 2),
  wsURL: "ws://localhost:8080",
  wsConnected: false,
  parseError: null,
  socket: null,
  setInput: (input) => set({ input }),
  setWsURL: (url) => set({ wsURL: url }),
  setSelectedRunId: (runId) => set({ selectedRunId: runId, selectedEventIndex: 0 }),
  setSelectedEventIndex: (index) => set({ selectedEventIndex: index }),
  loadJSON: () => {
    try {
      const parsed = JSON.parse(get().input) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error("Input must be an array of events.");
      }
      const events = parsed.filter(isBoundaryEvent);
      if (events.length === 0) {
        throw new Error("No valid BoundaryEvent objects found.");
      }
      set({
        events,
        selectedRunId: events[0].runId,
        selectedEventIndex: 0,
        parseError: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid JSON";
      set({ parseError: message });
    }
  },
  connectWS: () => {
    const url = get().wsURL;
    const existing = get().socket;
    if (existing) {
      existing.close();
    }
    const socket = new WebSocket(url);
    socket.onopen = () => set({ wsConnected: true, parseError: null });
    socket.onclose = () => set({ wsConnected: false, socket: null });
    socket.onerror = () => set({ parseError: "WebSocket connection error." });
    socket.onmessage = (msg) => {
      try {
        const parsed = JSON.parse(msg.data) as unknown;
        const incoming: BoundaryEvent[] = Array.isArray(parsed)
          ? parsed.filter(isBoundaryEvent)
          : isBoundaryEvent(parsed)
            ? [parsed]
            : [];
        if (incoming.length === 0) {
          return;
        }
        set((state) => {
          const events = [...state.events, ...incoming];
          return {
            events,
            selectedRunId: state.selectedRunId ?? incoming[0].runId,
          };
        });
      } catch {
        set({ parseError: "Invalid event payload from WebSocket." });
      }
    };
    set({ socket });
  },
  disconnectWS: () => {
    const socket = get().socket;
    if (socket) {
      socket.close();
    }
    set({ wsConnected: false, socket: null });
  },
}));
