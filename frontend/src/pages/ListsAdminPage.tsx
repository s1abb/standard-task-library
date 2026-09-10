import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Lists } from "../types";

const LIST_LABELS: Record<keyof Lists, string> = {
  statuses: "Status",
  "maintenance-types": "Maintenance Type",
  tactics: "Tactic",
  disciplines: "Discipline",
  "risk-levels": "Risk Level",
  "frequency-units": "Frequency Unit",
  "evidence-types": "Evidence Type",
};

export default function ListsAdminPage() {
  const [lists, setLists] = useState<Lists | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  function reload() {
    api.getLists().then(setLists).catch((e) => setError(String(e)));
  }

  useEffect(reload, []);

  async function addValue(key: keyof Lists) {
    const label = drafts[key]?.trim();
    if (!label) return;
    try {
      await api.addListValue(key, label);
      setDrafts((d) => ({ ...d, [key]: "" }));
      reload();
    } catch (e) {
      setError(String(e));
    }
  }

  if (!lists) return <p className="text-slate-500 text-sm">Loading...</p>;

  return (
    <div>
      <p className="text-sm text-slate-500 mb-6">
        These are the dropdown values used throughout the Task Register. Add a value here and it becomes
        immediately available when authoring any task — no code change needed.
      </p>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <div className="grid grid-cols-2 gap-6">
        {(Object.keys(LIST_LABELS) as (keyof Lists)[]).map((key) => (
          <section key={key} className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">{LIST_LABELS[key]}</h3>
            <ul className="space-y-1 mb-3">
              {lists[key].map((v) => (
                <li key={v.id} className="text-sm text-slate-700 px-2 py-1 bg-slate-50 rounded">
                  {v.label}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                value={drafts[key] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addValue(key)}
                placeholder={`Add ${LIST_LABELS[key].toLowerCase()}...`}
                className="flex-1 border border-slate-300 rounded-md px-3 py-1.5 text-sm"
              />
              <button
                onClick={() => addValue(key)}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800"
              >
                Add
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
