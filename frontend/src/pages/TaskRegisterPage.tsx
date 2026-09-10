import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Task, Lists } from "../types";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700",
  "Under Review": "bg-amber-100 text-amber-800",
  Approved: "bg-emerald-100 text-emerald-800",
  Superseded: "bg-red-100 text-red-700",
};

export default function TaskRegisterPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<Lists | null>(null);
  const [status, setStatus] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getLists().then(setLists).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .getTasks({ status: status || undefined, discipline: discipline || undefined, q: q || undefined })
      .then(setTasks)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [status, discipline, q]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Search title</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tasks..."
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm w-56"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            {lists?.statuses.map((s) => (
              <option key={s.id} value={s.label}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Discipline</label>
          <select
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            {lists?.disciplines.map((d) => (
              <option key={d.id} value={d.label}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading ? (
        <p className="text-slate-500 text-sm">Loading tasks...</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Task ID</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Tactic</th>
                <th className="px-4 py-3">Discipline</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Labour (h)</th>
                <th className="px-4 py-3">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((t) => (
                <tr key={t.taskId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link to={`/tasks/${t.taskId}`} className="text-slate-900 font-medium hover:underline">
                      {t.taskId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{t.title}</td>
                  <td className="px-4 py-3 text-slate-500">{t.tactic?.label}</td>
                  <td className="px-4 py-3 text-slate-500">{t.discipline?.label}</td>
                  <td className="px-4 py-3 text-slate-500">{t.riskLevel?.label}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[t.status?.label ?? ""] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {t.status?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{t.totalLabourHours}</td>
                  <td className="px-4 py-3 text-slate-500">{t._count?.operations ?? 0}</td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    No tasks match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
