import type { Lists, Task } from "../types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ? JSON.stringify(body.error) : `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getLists: () => request<Lists>("/lists"),
  addListValue: (listKey: string, label: string) =>
    request(`/lists/${listKey}`, { method: "POST", body: JSON.stringify({ label }) }),

  getTasks: (params?: { status?: string; discipline?: string; q?: string }) => {
    const search = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v) as [string, string][]
    ).toString();
    return request<Task[]>(`/tasks${search ? `?${search}` : ""}`);
  },
  getTask: (taskId: string) => request<Task>(`/tasks/${taskId}`),
  createTask: (task: Partial<Task>) =>
    request<Task>("/tasks", { method: "POST", body: JSON.stringify(task) }),
  updateTask: (taskId: string, task: Partial<Task>) =>
    request<Task>(`/tasks/${taskId}`, { method: "PUT", body: JSON.stringify(task) }),
  deleteTask: (taskId: string) => request<void>(`/tasks/${taskId}`, { method: "DELETE" }),
};
