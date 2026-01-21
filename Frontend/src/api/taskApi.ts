import type {
  Task,
  TaskDependency,
  GraphData,
  CreateTaskPayload,
  UpdateStatusPayload,
  BulkUpdatePayload,
  DependencyPayload,
  BatchDependencyPayload,
  CircularCheckPayload,
  CircularCheckResponse,
} from '@/types/task';

const API_BASE = 'http://localhost:8000/api';

// Mock data for preview when backend is unavailable
const MOCK_TASKS: Task[] = [
  { id: 1, title: 'Design Database Schema', description: 'Create the initial database schema for the project', status: 'completed', created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-16T14:30:00Z' },
  { id: 2, title: 'Setup Django Project', description: 'Initialize Django project with REST framework', status: 'completed', created_at: '2024-01-15T11:00:00Z', updated_at: '2024-01-17T09:00:00Z' },
  { id: 3, title: 'Create Task Model', description: 'Implement the Task model with all required fields', status: 'in_progress', created_at: '2024-01-16T08:00:00Z', updated_at: '2024-01-18T16:00:00Z' },
  { id: 4, title: 'Build API Endpoints', description: 'Create REST API endpoints for task CRUD operations', status: 'pending', created_at: '2024-01-17T09:00:00Z', updated_at: '2024-01-17T09:00:00Z' },
  { id: 5, title: 'Implement Dependencies', description: 'Add task dependency tracking functionality', status: 'blocked', created_at: '2024-01-17T10:00:00Z', updated_at: '2024-01-17T10:00:00Z' },
  { id: 6, title: 'Frontend Development', description: 'Build React frontend with Tailwind CSS', status: 'pending', created_at: '2024-01-18T08:00:00Z', updated_at: '2024-01-18T08:00:00Z' },
  { id: 7, title: 'Graph Visualization', description: 'Create SVG-based dependency graph', status: 'pending', created_at: '2024-01-18T09:00:00Z', updated_at: '2024-01-18T09:00:00Z' },
  { id: 8, title: 'Testing & QA', description: 'Write tests and perform quality assurance', status: 'pending', created_at: '2024-01-19T08:00:00Z', updated_at: '2024-01-19T08:00:00Z' },
];

const MOCK_DEPENDENCIES = [
  { task: 2, depends_on: 1 },
  { task: 3, depends_on: 2 },
  { task: 4, depends_on: 3 },
  { task: 5, depends_on: 3 },
  { task: 5, depends_on: 4 },
  { task: 6, depends_on: 4 },
  { task: 7, depends_on: 6 },
  { task: 8, depends_on: 5 },
  { task: 8, depends_on: 7 },
];

let mockTasks = [...MOCK_TASKS];
let mockDependencies = [...MOCK_DEPENDENCIES];
let nextId = 9;

async function fetchWithFallback<T>(
  url: string,
  options: RequestInit | undefined,
  mockFn: () => T
): Promise<T> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || error.message || 'Request failed');
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.warn('Backend unavailable, using mock data for preview');
      return mockFn();
    }
    throw error;
  }
}

// Task CRUD
export async function fetchTasks(filters?: { status?: string; title?: string }): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters?.title) {
    params.append('title', filters.title);
  }
  const query = params.toString();
  const url = `${API_BASE}/tasks/${query ? `?${query}` : ''}`;

  return fetchWithFallback(url, undefined, () => {
    let filtered = [...mockTasks];
    if (filters?.status && filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    if (filters?.title) {
      const search = filters.title.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(search));
    }
    return filtered;
  });
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  return fetchWithFallback(
    `${API_BASE}/tasks/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    () => {
      const newTask: Task = {
        id: nextId++,
        title: payload.title,
        description: payload.description || '',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockTasks.push(newTask);
      return newTask;
    }
  );
}

export async function updateTaskStatus(taskId: number, payload: UpdateStatusPayload): Promise<Task> {
  return fetchWithFallback(
    `${API_BASE}/tasks/${taskId}/update_status/`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    () => {
      const task = mockTasks.find(t => t.id === taskId);
      if (task) {
        task.status = payload.status;
        task.updated_at = new Date().toISOString();
      }
      return task!;
    }
  );
}

export async function deleteTask(taskId: number): Promise<void> {
  return fetchWithFallback(
    `${API_BASE}/tasks/${taskId}/`,
    { method: 'DELETE' },
    () => {
      mockTasks = mockTasks.filter(t => t.id !== taskId);
      mockDependencies = mockDependencies.filter(d => d.task !== taskId && d.depends_on !== taskId);
    }
  );
}

export async function bulkUpdateStatus(payload: BulkUpdatePayload): Promise<Task[]> {
  return fetchWithFallback(
    `${API_BASE}/tasks/bulk_update_status/`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    () => {
      mockTasks = mockTasks.map(t => {
        if (payload.task_ids.includes(t.id)) {
          return { ...t, status: payload.status, updated_at: new Date().toISOString() };
        }
        return t;
      });
      return mockTasks.filter(t => payload.task_ids.includes(t.id));
    }
  );
}

// Dependency info
export async function getBlockingTasks(taskId: number): Promise<Task[]> {
  return fetchWithFallback(
    `${API_BASE}/tasks/${taskId}/blocking/`,
    undefined,
    () => {
      const blockingIds = mockDependencies.filter(d => d.task === taskId).map(d => d.depends_on);
      return mockTasks.filter(t => blockingIds.includes(t.id));
    }
  );
}

export async function getBlockedByTasks(taskId: number): Promise<Task[]> {
  return fetchWithFallback(
    `${API_BASE}/tasks/${taskId}/blocked_by/`,
    undefined,
    () => {
      const blockedIds = mockDependencies.filter(d => d.depends_on === taskId).map(d => d.task);
      return mockTasks.filter(t => blockedIds.includes(t.id));
    }
  );
}

// Dependencies
export async function createDependency(payload: DependencyPayload): Promise<TaskDependency> {
  return fetchWithFallback(
    `${API_BASE}/dependencies/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    () => {
      mockDependencies.push({ task: payload.task, depends_on: payload.depends_on });
      return { id: Date.now(), task: payload.task, depends_on: payload.depends_on };
    }
  );
}

export async function batchCreateDependencies(payload: BatchDependencyPayload): Promise<TaskDependency[]> {
  return fetchWithFallback(
    `${API_BASE}/dependencies/batch_create/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    () => {
      const created: TaskDependency[] = [];
      payload.depends_on_ids.forEach(depId => {
        if (!mockDependencies.some(d => d.task === payload.task && d.depends_on === depId)) {
          mockDependencies.push({ task: payload.task, depends_on: depId });
          created.push({ id: Date.now() + depId, task: payload.task, depends_on: depId });
        }
      });
      return created;
    }
  );
}

export async function checkCircularDependency(payload: CircularCheckPayload): Promise<CircularCheckResponse> {
  return fetchWithFallback(
    `${API_BASE}/dependencies/check_circular/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    () => {
      // Simple mock circular check
      const visited = new Set<number>();
      const checkCycle = (taskId: number, target: number): boolean => {
        if (taskId === target) return true;
        if (visited.has(taskId)) return false;
        visited.add(taskId);
        const deps = mockDependencies.filter(d => d.task === taskId);
        return deps.some(d => checkCycle(d.depends_on, target));
      };
      return { is_circular: checkCycle(payload.depends_on, payload.task) };
    }
  );
}

// Graph
export async function fetchGraphData(): Promise<GraphData> {
  return fetchWithFallback(
    `${API_BASE}/tasks/graph/`,
    undefined,
    () => ({
      nodes: mockTasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        dependencies: mockDependencies.filter(d => d.task === t.id).map(d => d.depends_on),
      })),
      edges: mockDependencies.map(d => ({
        from: d.depends_on,
        to: d.task,
      })),
    })
  );
}
