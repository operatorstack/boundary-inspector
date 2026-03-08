# boundary-inspector

Inspect deterministic boundary execution over probabilistic systems.

`boundary-inspector` is an open source UI for exploring how boundary runtimes execute, fail, repair, and succeed.

It turns raw boundary event streams into an interactive view of:

- **runs** — top-level contract executions
- **attempts** — retry cycles within a run
- **events** — verification, repair, retry, and terminal outcomes

The goal is simple: make probabilistic systems understandable when they are embedded inside deterministic software.

---

# The problem

Systems built on probabilistic components (LLMs, agents, automation systems) behave differently from traditional software.

They don't fail once.  
They **iterate, repair, retry, and converge**.

Raw logs make this behavior difficult to understand:

- Where exactly did the failure occur?
- What triggered a repair?
- How did the system evolve between attempts?
- Why did the run ultimately succeed or fail?

`boundary-inspector` exists to make these execution boundaries visible.

---

# The model

Boundary runtimes enforce deterministic guarantees around probabilistic outputs.

Execution typically follows a pattern like:

```

input
↓
probabilistic system (LLM, agent, automation)
↓
verification
↓
repair
↓
retry
↓
terminal outcome

```

`boundary-inspector` visualizes this lifecycle as structured execution traces.

---

# Architecture

The inspector is designed to sit on top of boundary event streams.

```

Producer (llm-contract or other boundary runtime)
↓
BoundaryEvent stream
↓
boundary-inspector

```

The UI itself is runtime-agnostic. Any system that emits compatible boundary events can be inspected.

---

# Supported connection modes

Currently supported:

- import or paste JSON event arrays
- live WebSocket event stream

Future versions will support additional transport adapters.

---

# Running locally

```

npm install
npm run dev

````

---

# Event contract

The inspector expects events shaped like:

```ts
type BoundaryEvent = {
  system: string
  runId: string
  ts: string
  type: string
  level?: "info" | "warn" | "error"
  attempt?: number
  data: Record<string, unknown>
}
````

Events are grouped into runs and attempts automatically by the UI.

---

# Interface overview

The UI is organized into three main views.

### Runs

Top-level executions.

Shows:

* run id
* terminal status
* attempt count
* duration

---

### Run inspector

Visualizes the retry lifecycle for a selected run.

Each attempt contains a sequence of events such as:

* attempt started
* output observed
* verification failed
* repair generated
* retry scheduled
* verification passed

---

### Event details

Displays the raw payload for the selected event, including failure explanations and reproduction payloads.

This allows developers to inspect exactly how a boundary execution evolved.

---

# Screenshot anchors

Stable DOM anchors are included to support documentation screenshots and automated capture.

Available targets:

* header: `#shot-header`
* controls: `#shot-controls`
* runs list: `#shot-runs-list`
* run inspector: `#shot-run-inspector`
* event details: `#shot-event-details`
* full layout: `#shot-layout`

---

# Roadmap

Planned improvements include:

* richer attempt timeline visualization
* event filtering and search
* attempt-to-attempt diffing
* replay debugger mode
* OTEL and JSONL adapters
* multi-run comparison

---

# Project status

`boundary-inspector` is an early stage project.

Event schemas and UI behavior may evolve as boundary runtimes mature.

---

# Contributing

Issues and PRs are welcome.

If proposing schema changes, please include:

* sample events
* migration guidance
* expected UI behavior impact

---

# License

MIT