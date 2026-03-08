export type BoundaryEvent = {
  system: string;
  runId: string;
  ts: string;
  type: string;
  level?: "info" | "warn" | "error";
  attempt?: number;
  data: Record<string, unknown>;
};

export type RunSummary = {
  runId: string;
  status: "SUCCESS" | "FAILED" | "RUNNING";
  attempts: number;
  duration: string;
  model: string;
  events: BoundaryEvent[];
};
