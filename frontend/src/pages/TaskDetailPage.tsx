import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import type {
  Lists,
  Task,
  Operation,
  LabourRequirement,
  MaterialItem,
  SafetyControl,
  ReferenceDoc,
} from "../types";

const emptyTask: Task = {
  taskId: "",
  currentRevision: "1.0",
  title: "",
  statusId: "",
  maintenanceTypeId: "",
  tacticId: "",
  disciplineId: "",
  riskLevelId: "",
  frequencyUnitId: "",
  operations: [],
  labourRequirements: [],
  materialItems: [],
  safetyControls: [],
  referenceDocs: [],
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm";

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const isNew = taskId === "new";
  const navigate = useNavigate();

  const [lists, setLists] = useState<Lists | null>(null);
  const [task, setTask] = useState<Task>(emptyTask);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getLists().then(setLists).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew || !taskId) return;
    setLoading(true);
    api
      .getTask(taskId)
      .then(setTask)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [taskId, isNew]);

  function update<K extends keyof Task>(key: K, value: Task[K]) {
    setTask((t) => ({ ...t, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload = { ...task };
      if (isNew) {
        const created = await api.createTask(payload);
        navigate(`/tasks/${created.taskId}`);
      } else {
        const updated = await api.updateTask(taskId!, payload);
        setTask(updated);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!taskId || isNew) return;
    if (!confirm(`Delete ${taskId}? This cannot be undone.`)) return;
    await api.deleteTask(taskId);
    navigate("/");
  }

  if (loading) return <p className="text-slate-500 text-sm">Loading...</p>;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {isNew ? "New Task" : task.taskId}
          </h2>
          {!isNew && <p className="text-sm text-slate-500">Revision {task.currentRevision}</p>}
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-sm rounded-md border border-red-200 text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Task Register fields */}
      <Section title="Task Register">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Task ID">
            <input
              className={inputClass}
              value={task.taskId}
              disabled={!isNew}
              onChange={(e) => update("taskId", e.target.value)}
            />
          </Field>
          <Field label="Title">
            <input className={inputClass} value={task.title} onChange={(e) => update("title", e.target.value)} />
          </Field>
          <Field label="Revision">
            <input
              className={inputClass}
              value={task.currentRevision}
              onChange={(e) => update("currentRevision", e.target.value)}
            />
          </Field>
          <Field label="Status">
            <select className={inputClass} value={task.statusId} onChange={(e) => update("statusId", e.target.value)}>
              <option value="">Select...</option>
              {lists?.statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Maintenance Type">
            <select
              className={inputClass}
              value={task.maintenanceTypeId}
              onChange={(e) => update("maintenanceTypeId", e.target.value)}
            >
              <option value="">Select...</option>
              {lists?.["maintenance-types"].map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tactic">
            <select className={inputClass} value={task.tacticId} onChange={(e) => update("tacticId", e.target.value)}>
              <option value="">Select...</option>
              {lists?.tactics.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Discipline">
            <select
              className={inputClass}
              value={task.disciplineId}
              onChange={(e) => update("disciplineId", e.target.value)}
            >
              <option value="">Select...</option>
              {lists?.disciplines.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Risk">
            <select
              className={inputClass}
              value={task.riskLevelId}
              onChange={(e) => update("riskLevelId", e.target.value)}
            >
              <option value="">Select...</option>
              {lists?.["risk-levels"].map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Frequency">
            <div className="flex gap-2">
              <input
                type="number"
                className={inputClass}
                value={task.frequency ?? ""}
                onChange={(e) => update("frequency", Number(e.target.value))}
              />
              <select
                className={inputClass}
                value={task.frequencyUnitId}
                onChange={(e) => update("frequencyUnitId", e.target.value)}
              >
                <option value="">Unit...</option>
                {lists?.["frequency-units"].map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </Field>
          <Field label="Asset Class">
            <input
              className={inputClass}
              value={task.assetClass ?? ""}
              onChange={(e) => update("assetClass", e.target.value)}
            />
          </Field>
          <Field label="Equipment Type">
            <input
              className={inputClass}
              value={task.equipmentType ?? ""}
              onChange={(e) => update("equipmentType", e.target.value)}
            />
          </Field>
          <Field label="Applicable Make / Model">
            <input
              className={inputClass}
              value={task.applicableMakeModel ?? ""}
              onChange={(e) => update("applicableMakeModel", e.target.value)}
            />
          </Field>
          <Field label="Estimated Duration (h)">
            <input
              type="number"
              className={inputClass}
              value={task.estimatedDurationH ?? ""}
              onChange={(e) => update("estimatedDurationH", Number(e.target.value))}
            />
          </Field>
          <Field label="Task Owner">
            <input
              className={inputClass}
              value={task.taskOwner ?? ""}
              onChange={(e) => update("taskOwner", e.target.value)}
            />
          </Field>
          <Field label="Technical Approver">
            <input
              className={inputClass}
              value={task.technicalApprover ?? ""}
              onChange={(e) => update("technicalApprover", e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Field label="Failure Mode Addressed">
            <textarea
              className={inputClass}
              rows={2}
              value={task.failureModeAddressed ?? ""}
              onChange={(e) => update("failureModeAddressed", e.target.value)}
            />
          </Field>
          <Field label="Maintenance Objective">
            <textarea
              className={inputClass}
              rows={2}
              value={task.maintenanceObjective ?? ""}
              onChange={(e) => update("maintenanceObjective", e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Field label="Change Reason (this revision)">
            <input
              className={inputClass}
              value={task.changeReason ?? ""}
              onChange={(e) => update("changeReason", e.target.value)}
            />
          </Field>
          <Field label="Changed By">
            <input
              className={inputClass}
              value={task.changedBy ?? ""}
              onChange={(e) => update("changedBy", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      {/* Operations */}
      <Section title="Operations">
        <RepeatingTable
          rows={task.operations}
          onChange={(rows) => update("operations", rows as Operation[])}
          newRow={() => ({
            operationNo: (task.operations.at(-1)?.operationNo ?? 0) + 10,
            title: "",
            workInstruction: "",
          })}
          columns={[
            { key: "operationNo", label: "No.", type: "number", width: "w-16" },
            { key: "title", label: "Title" },
            { key: "workInstruction", label: "Instruction", type: "textarea" },
            { key: "acceptanceCriteria", label: "Acceptance Criteria", type: "textarea" },
            { key: "holdPoint", label: "Hold Point", type: "textarea" },
            { key: "evidenceDescription", label: "Evidence" },
            { key: "durationH", label: "Duration (h)", type: "number", width: "w-24" },
          ]}
        />
      </Section>

      {/* Labour */}
      <Section title="Labour Requirements">
        <RepeatingTable
          rows={task.labourRequirements}
          onChange={(rows) => update("labourRequirements", rows as LabourRequirement[])}
          newRow={() => ({ roleTrade: "", persons: 1, hoursPerPerson: 0 })}
          columns={[
            { key: "roleTrade", label: "Role / Trade" },
            { key: "competency", label: "Competency" },
            { key: "persons", label: "Persons", type: "number", width: "w-20" },
            { key: "hoursPerPerson", label: "Hrs / Person", type: "number", width: "w-24" },
            { key: "supportNotes", label: "Notes" },
          ]}
        />
      </Section>

      {/* Materials */}
      <Section title="Materials, Parts & Consumables">
        <RepeatingTable
          rows={task.materialItems}
          onChange={(rows) => update("materialItems", rows as MaterialItem[])}
          newRow={() => ({ itemType: "Part", partMaterial: "", quantity: 1, unit: "ea", mandatory: true })}
          columns={[
            { key: "itemType", label: "Item Type", width: "w-28" },
            { key: "partMaterial", label: "Part / Material" },
            { key: "partNumber", label: "Part No." },
            { key: "quantity", label: "Qty", type: "number", width: "w-20" },
            { key: "unit", label: "Unit", width: "w-20" },
            { key: "mandatory", label: "Mandatory", type: "checkbox", width: "w-20" },
            { key: "kittingNotes", label: "Notes" },
          ]}
        />
      </Section>

      {/* Safety Controls */}
      <Section title="Safety Controls">
        <RepeatingTable
          rows={task.safetyControls}
          onChange={(rows) => update("safetyControls", rows as SafetyControl[])}
          newRow={() => ({ hazard: "", controlRequirement: "" })}
          columns={[
            { key: "hazard", label: "Hazard", type: "textarea" },
            { key: "controlRequirement", label: "Control Requirement", type: "textarea" },
            { key: "permitIsolation", label: "Permit / Isolation" },
            { key: "ppe", label: "PPE" },
            { key: "verificationHoldPoint", label: "Verification / Hold Point", type: "textarea" },
            { key: "environmentalControl", label: "Environmental Control" },
          ]}
        />
      </Section>

      {/* References */}
      <Section title="Technical References">
        <RepeatingTable
          rows={task.referenceDocs}
          onChange={(rows) => update("referenceDocs", rows as ReferenceDoc[])}
          newRow={() => ({ referenceType: "OEM Manual", title: "", mandatoryReview: true })}
          columns={[
            { key: "referenceType", label: "Type", width: "w-32" },
            { key: "title", label: "Title / Description" },
            { key: "documentNumber", label: "Document No." },
            { key: "revision", label: "Revision", width: "w-24" },
            { key: "sourceUrl", label: "Source / URL" },
            { key: "mandatoryReview", label: "Mandatory", type: "checkbox", width: "w-20" },
          ]}
        />
      </Section>

      {/* Revision history (read-only, server-generated) */}
      {!isNew && task.revisions && task.revisions.length > 0 && (
        <Section title="Revision History">
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-medium text-slate-500 uppercase">
              <tr>
                <th className="px-3 py-2">Revision</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Change Reason</th>
                <th className="px-3 py-2">Changed By</th>
                <th className="px-3 py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {task.revisions.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-mono text-xs">{r.revision}</td>
                  <td className="px-3 py-2">{r.status.label}</td>
                  <td className="px-3 py-2">{r.changeReason}</td>
                  <td className="px-3 py-2">{r.changedBy}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-lg p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">{title}</h3>
      {children}
    </section>
  );
}

type ColumnType = "text" | "number" | "textarea" | "checkbox";
interface Column {
  key: string;
  label: string;
  type?: ColumnType;
  width?: string;
}

function RepeatingTable<T extends Record<string, any>>({
  rows,
  onChange,
  columns,
  newRow,
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  columns: Column[];
  newRow: () => T;
}) {
  function updateCell(index: number, key: string, value: any) {
    const next = rows.slice();
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  }
  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs font-medium text-slate-500 uppercase">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-2 py-2 ${c.width ?? ""}`}>
                {c.label}
              </th>
            ))}
            <th className="px-2 py-2 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key} className="px-2 py-1.5 align-top">
                  {c.type === "textarea" ? (
                    <textarea
                      className="w-full border border-slate-200 rounded px-2 py-1 text-sm"
                      rows={2}
                      value={row[c.key] ?? ""}
                      onChange={(e) => updateCell(i, c.key, e.target.value)}
                    />
                  ) : c.type === "checkbox" ? (
                    <input
                      type="checkbox"
                      checked={!!row[c.key]}
                      onChange={(e) => updateCell(i, c.key, e.target.checked)}
                    />
                  ) : (
                    <input
                      type={c.type === "number" ? "number" : "text"}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-sm"
                      value={row[c.key] ?? ""}
                      onChange={(e) =>
                        updateCell(i, c.key, c.type === "number" ? Number(e.target.value) : e.target.value)
                      }
                    />
                  )}
                </td>
              ))}
              <td className="px-2 py-1.5">
                <button
                  onClick={() => removeRow(i)}
                  className="text-slate-400 hover:text-red-600 text-xs"
                  title="Remove row"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={() => onChange([...rows, newRow()])}
        className="mt-2 text-xs font-medium text-slate-600 hover:text-slate-900"
      >
        + Add row
      </button>
    </div>
  );
}
