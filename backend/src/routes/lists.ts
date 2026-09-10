import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

const LIST_KEYS = [
  "statuses",
  "maintenance-types",
  "tactics",
  "disciplines",
  "risk-levels",
  "frequency-units",
  "evidence-types",
] as const;

type ListKey = (typeof LIST_KEYS)[number];

function isListKey(key: string): key is ListKey {
  return (LIST_KEYS as readonly string[]).includes(key);
}

// GET /api/lists — every controlled list in one payload, for populating dropdowns.
router.get("/", async (_req, res) => {
  const [statuses, maintenanceTypes, tactics, disciplines, riskLevels, frequencyUnits, evidenceTypes] =
    await Promise.all([
      prisma.status.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.maintenanceType.findMany({ orderBy: { label: "asc" } }),
      prisma.tactic.findMany({ orderBy: { label: "asc" } }),
      prisma.discipline.findMany({ orderBy: { label: "asc" } }),
      prisma.riskLevel.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.frequencyUnit.findMany({ orderBy: { label: "asc" } }),
      prisma.evidenceType.findMany({ orderBy: { label: "asc" } }),
    ]);

  res.json({
    statuses,
    "maintenance-types": maintenanceTypes,
    tactics,
    disciplines,
    "risk-levels": riskLevels,
    "frequency-units": frequencyUnits,
    "evidence-types": evidenceTypes,
  });
});

// POST /api/lists/:listKey — add a new controlled value (e.g. a new Tactic).
router.post("/:listKey", async (req, res) => {
  const { listKey } = req.params;
  const { label } = req.body as { label?: string };
  if (!label || typeof label !== "string") {
    return res.status(400).json({ error: "label is required" });
  }
  if (!isListKey(listKey)) {
    return res.status(404).json({ error: `Unknown list: ${listKey}` });
  }

  try {
    let created;
    switch (listKey) {
      case "statuses":
        created = await prisma.status.create({ data: { label } });
        break;
      case "maintenance-types":
        created = await prisma.maintenanceType.create({ data: { label } });
        break;
      case "tactics":
        created = await prisma.tactic.create({ data: { label } });
        break;
      case "disciplines":
        created = await prisma.discipline.create({ data: { label } });
        break;
      case "risk-levels":
        created = await prisma.riskLevel.create({ data: { label } });
        break;
      case "frequency-units":
        created = await prisma.frequencyUnit.create({ data: { label } });
        break;
      case "evidence-types":
        created = await prisma.evidenceType.create({ data: { label } });
        break;
    }
    res.status(201).json(created);
  } catch (err) {
    res.status(409).json({ error: "Value already exists or is invalid", detail: String(err) });
  }
});

export default router;
