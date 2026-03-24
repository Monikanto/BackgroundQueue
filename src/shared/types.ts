export type TaskType = "email" | "image" | "data";

export interface Task {
  id: string;
  type: TaskType;
  payload: any;
  createdAt: number;
}

export interface Metrics {
  processed: number;
  failed: number;
  pending: number;
}