export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface TaskDependency {
  id: number;
  task: number;
  depends_on: number;
}

export interface GraphNode {
  id: number;
  title: string;
  status: TaskStatus;
  dependencies: number[];
}

export interface GraphData {
  nodes: GraphNode[];
  edges: { from: number; to: number }[];
}

export interface CreateTaskPayload {
  title: string;
  description: string;
}

export interface UpdateStatusPayload {
  status: TaskStatus;
}

export interface BulkUpdatePayload {
  task_ids: number[];
  status: TaskStatus;
}

export interface DependencyPayload {
  task: number;
  depends_on: number;
}

export interface BatchDependencyPayload {
  task: number;
  depends_on_ids: number[];
}

export interface CircularCheckPayload {
  task: number;
  depends_on: number;
}

export interface CircularCheckResponse {
  is_circular: boolean;
  message?: string;
}
