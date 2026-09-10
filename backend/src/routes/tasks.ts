import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";

const router = Router();

const TASK_INCLUDE = {
  status: true,
  maintenanceType: true,
  tactic: true,
  discipline: true,
  riskLevel: true,
  frequencyUnit: true,
  operations: { orderBy: { operationNo: "asc" as const }, include: { evidenceType: true } },
  labourRequirements: true,
  materialItems: true,
  safetyControls: true,
  referenceDocs: true,
  revisions: { orderBy: { createdAt: "desc" as const } },
};

// GET /api/tasks — Task Register list view. Supports basic filtering for the browse screen.
router.get("/", async (req, res) => {
  const { status, discipline, q } = req.query;

  const tasks = await prisma.task.findMany({
    where: {
      status: status ? { label: String(status) } : undefined,
      discipline: discipline ? { label: String(discipline) } : undefined,
      title: q ? { contains: String(q), mode: "insensitive" } : undefined,
    },
    include: {
      status: true,
      maintenanceType: true,
      tactic: true,
      discipline: true,
      riskLevel: true,
      frequencyUnit: true,
      _count: { select: { operations: true, materialItems: true, safetyControls: true } },
      labourRequirements: true,
    },
    orderBy: { taskId: "asc" },
  });

  // Calculated columns, per the workbook: these are never stored, always derived.
  const withTotals = tasks.map((t: (typeof tasks)[number]) => ({
    ...t,
    totalLabourHours: t.labourRequirements.reduce(
      (sum: number, l: (typeof t.labourRequirements)[number]) => sum + l.persons * Number(l.hoursPerPerson),
      0
    ),
  }));

  res.json(withTotals);
});

// GET /api/tasks/:taskId — full detail view (taskId is the human-readable business key, e.g. PMP-ST-001)
router.get("/:taskId", async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { taskId: req.params.taskId },
    include: TASK_INCLUDE,
  });
  if (!task) return res.status(404).json({ error: "Task not found" });

  const totalLabourHours = task.labourRequirements.reduce(
    (sum: number, l: (typeof task.labourRequirements)[number]) => sum + l.persons * Number(l.hoursPerPerson),
    0
  );
  res.json({ ...task, totalLabourHours });
});

// ─── Validation for create/update ───

const operationSchema = z.object({
  operationNo: z.number().int(),
  title: z.string().min(1),
  workInstruction: z.string().min(1),
  acceptanceCriteria: z.string().optional(),
  holdPoint: z.string().optional(),
  evidenceDescription: z.string().optional(),
  evidenceTypeId: z.string().uuid().optional().nullable(),
  durationH: z.number().optional(),
  workCentre: z.string().optional(),
  systemCondition: z.string().optional(),
});

const labourSchema = z.object({
  roleTrade: z.string().min(1),
  competency: z.string().optional(),
  persons: z.number().int().min(1),
  hoursPerPerson: z.number().min(0),
  supportNotes: z.string().optional(),
});

const materialSchema = z.object({
  itemType: z.string().min(1),
  partMaterial: z.string().min(1),
  partNumber: z.string().optional(),
  quantity: z.number(),
  unit: z.string().min(1),
  mandatory: z.boolean().default(false),
  kittingNotes: z.string().optional(),
});

const safetyControlSchema = z.object({
  hazard: z.string().min(1),
  controlRequirement: z.string().min(1),
  permitIsolation: z.string().optional(),
  ppe: z.string().optional(),
  verificationHoldPoint: z.string().optional(),
  environmentalControl: z.string().optional(),
});

const referenceDocSchema = z.object({
  referenceType: z.string().min(1),
  title: z.string().min(1),
  documentNumber: z.string().optional(),
  revision: z.string().optional(),
  sourceUrl: z.string().optional(),
  mandatoryReview: z.boolean().default(true),
});

const taskSchema = z.object({
  taskId: z.string().min(1),
  currentRevision: z.string().default("1.0"),
  title: z.string().min(1),
  assetClass: z.string().optional(),
  equipmentType: z.string().optional(),
  applicableMakeModel: z.string().optional(),
  failureModeAddressed: z.string().optional(),
  maintenanceObjective: z.string().optional(),
  frequency: z.number().optional(),
  tolerance: z.string().optional(),
  systemCondition: z.string().optional(),
  estimatedDurationH: z.number().optional(),
  taskOwner: z.string().optional(),
  technicalApprover: z.string().optional(),
  effectiveDate: z.string().datetime().optional(),
  reviewDate: z.string().datetime().optional(),
  sapTaskList: z.string().optional(),
  plannerGroup: z.string().optional(),
  workCentre: z.string().optional(),

  statusId: z.string().uuid(),
  maintenanceTypeId: z.string().uuid(),
  tacticId: z.string().uuid(),
  disciplineId: z.string().uuid(),
  riskLevelId: z.string().uuid(),
  frequencyUnitId: z.string().uuid(),

  changeReason: z.string().optional(),
  changedBy: z.string().optional(),

  operations: z.array(operationSchema).default([]),
  labourRequirements: z.array(labourSchema).default([]),
  materialItems: z.array(materialSchema).default([]),
  safetyControls: z.array(safetyControlSchema).default([]),
  referenceDocs: z.array(referenceDocSchema).default([]),
});

// POST /api/tasks — create a task with all its sub-resources in one call, plus the opening revision entry.
router.post("/", async (req, res) => {
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data = parsed.data;

  try {
    const task = await prisma.task.create({
      data: {
        taskId: data.taskId,
        currentRevision: data.currentRevision,
        title: data.title,
        assetClass: data.assetClass,
        equipmentType: data.equipmentType,
        applicableMakeModel: data.applicableMakeModel,
        failureModeAddressed: data.failureModeAddressed,
        maintenanceObjective: data.maintenanceObjective,
        frequency: data.frequency,
        tolerance: data.tolerance,
        systemCondition: data.systemCondition,
        estimatedDurationH: data.estimatedDurationH,
        taskOwner: data.taskOwner,
        technicalApprover: data.technicalApprover,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : undefined,
        sapTaskList: data.sapTaskList,
        plannerGroup: data.plannerGroup,
        workCentre: data.workCentre,
        statusId: data.statusId,
        maintenanceTypeId: data.maintenanceTypeId,
        tacticId: data.tacticId,
        disciplineId: data.disciplineId,
        riskLevelId: data.riskLevelId,
        frequencyUnitId: data.frequencyUnitId,
        operations: { create: data.operations },
        labourRequirements: { create: data.labourRequirements },
        materialItems: { create: data.materialItems },
        safetyControls: { create: data.safetyControls },
        referenceDocs: { create: data.referenceDocs },
        revisions: {
          create: {
            revision: data.currentRevision,
            statusId: data.statusId,
            changeReason: data.changeReason ?? "Initial issue",
            changedBy: data.changedBy,
          },
        },
      },
      include: TASK_INCLUDE,
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(409).json({ error: "Could not create task", detail: String(err) });
  }
});

// PUT /api/tasks/:taskId — update task fields, replace sub-resource lists, and log a new revision
// whenever the caller supplies a changed revision label or status.
router.put("/:taskId", async (req, res) => {
  const parsed = taskSchema.partial({
    operations: true,
    labourRequirements: true,
    materialItems: true,
    safetyControls: true,
    referenceDocs: true,
  }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data = parsed.data;

  const existing = await prisma.task.findUnique({ where: { taskId: req.params.taskId } });
  if (!existing) return res.status(404).json({ error: "Task not found" });

  const revisionChanged =
    data.currentRevision !== undefined && data.currentRevision !== existing.currentRevision;
  const statusChanged = data.statusId !== undefined && data.statusId !== existing.statusId;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const task = await prisma.$transaction(async (tx: any) => {
    // Replace-in-place strategy for sub-resource lists: simplest correct approach for
    // a form-driven editor where the whole sub-table is re-submitted on save.
    if (data.operations) {
      await tx.operation.deleteMany({ where: { taskId: existing.id } });
    }
    if (data.labourRequirements) {
      await tx.labourRequirement.deleteMany({ where: { taskId: existing.id } });
    }
    if (data.materialItems) {
      await tx.materialItem.deleteMany({ where: { taskId: existing.id } });
    }
    if (data.safetyControls) {
      await tx.safetyControl.deleteMany({ where: { taskId: existing.id } });
    }
    if (data.referenceDocs) {
      await tx.referenceDoc.deleteMany({ where: { taskId: existing.id } });
    }

    const updated = await tx.task.update({
      where: { id: existing.id },
      data: {
        currentRevision: data.currentRevision,
        title: data.title,
        assetClass: data.assetClass,
        equipmentType: data.equipmentType,
        applicableMakeModel: data.applicableMakeModel,
        failureModeAddressed: data.failureModeAddressed,
        maintenanceObjective: data.maintenanceObjective,
        frequency: data.frequency,
        tolerance: data.tolerance,
        systemCondition: data.systemCondition,
        estimatedDurationH: data.estimatedDurationH,
        taskOwner: data.taskOwner,
        technicalApprover: data.technicalApprover,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : undefined,
        sapTaskList: data.sapTaskList,
        plannerGroup: data.plannerGroup,
        workCentre: data.workCentre,
        statusId: data.statusId,
        maintenanceTypeId: data.maintenanceTypeId,
        tacticId: data.tacticId,
        disciplineId: data.disciplineId,
        riskLevelId: data.riskLevelId,
        frequencyUnitId: data.frequencyUnitId,
        operations: data.operations ? { create: data.operations } : undefined,
        labourRequirements: data.labourRequirements ? { create: data.labourRequirements } : undefined,
        materialItems: data.materialItems ? { create: data.materialItems } : undefined,
        safetyControls: data.safetyControls ? { create: data.safetyControls } : undefined,
        referenceDocs: data.referenceDocs ? { create: data.referenceDocs } : undefined,
      },
      include: TASK_INCLUDE,
    });

    if (revisionChanged || statusChanged) {
      await tx.taskRevision.create({
        data: {
          taskId: existing.id,
          revision: data.currentRevision ?? existing.currentRevision,
          statusId: data.statusId ?? existing.statusId,
          changeReason: data.changeReason,
          changedBy: data.changedBy,
        },
      });
    }

    return updated;
  });

  res.json(task);
});

// DELETE /api/tasks/:taskId
router.delete("/:taskId", async (req, res) => {
  const existing = await prisma.task.findUnique({ where: { taskId: req.params.taskId } });
  if (!existing) return res.status(404).json({ error: "Task not found" });
  await prisma.task.delete({ where: { id: existing.id } });
  res.status(204).send();
});

export default router;
