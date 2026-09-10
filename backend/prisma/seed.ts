import { PrismaClient } from "@prisma/client";
import seedData from "./seed_data.json";

const prisma = new PrismaClient();

// Some Lists-sheet columns have more rows of values than others (columns are different
// lengths), so pull unique non-null values per column rather than assuming row alignment.
function uniqueColumn(rows: Record<string, any>[], key: string): string[] {
  const values = rows.map((r) => r[key]).filter((v) => v !== null && v !== undefined && v !== "");
  return Array.from(new Set(values.map(String)));
}

async function main() {
  console.log("Seeding controlled lists...");

  const statusLabels = uniqueColumn(seedData.lists, "Status");
  const maintenanceTypeLabels = uniqueColumn(seedData.lists, "Maintenance Type");
  const tacticLabels = uniqueColumn(seedData.lists, "Tactic");
  const disciplineLabels = uniqueColumn(seedData.lists, "Discipline");
  const riskLabels = uniqueColumn(seedData.lists, "Risk");
  const frequencyUnitLabels = uniqueColumn(seedData.lists, "Frequency Unit");
  const evidenceTypeLabels = uniqueColumn(seedData.lists, "Evidence Type");

  const [statuses, maintenanceTypes, tactics, disciplines, riskLevels, frequencyUnits, evidenceTypes] =
    await Promise.all([
      Promise.all(
        statusLabels.map((label, i) =>
          prisma.status.upsert({ where: { label }, update: {}, create: { label, sortOrder: i } })
        )
      ),
      Promise.all(
        maintenanceTypeLabels.map((label) =>
          prisma.maintenanceType.upsert({ where: { label }, update: {}, create: { label } })
        )
      ),
      Promise.all(
        tacticLabels.map((label) =>
          prisma.tactic.upsert({ where: { label }, update: {}, create: { label } })
        )
      ),
      Promise.all(
        disciplineLabels.map((label) =>
          prisma.discipline.upsert({ where: { label }, update: {}, create: { label } })
        )
      ),
      Promise.all(
        riskLabels.map((label, i) =>
          prisma.riskLevel.upsert({ where: { label }, update: {}, create: { label, sortOrder: i } })
        )
      ),
      Promise.all(
        frequencyUnitLabels.map((label) =>
          prisma.frequencyUnit.upsert({ where: { label }, update: {}, create: { label } })
        )
      ),
      Promise.all(
        evidenceTypeLabels.map((label) =>
          prisma.evidenceType.upsert({ where: { label }, update: {}, create: { label } })
        )
      ),
    ]);

  const byLabel = <T extends { label: string }>(rows: T[]) =>
    Object.fromEntries(rows.map((r) => [r.label, r]));

  const statusMap = byLabel(statuses);
  const maintenanceTypeMap = byLabel(maintenanceTypes);
  const tacticMap = byLabel(tactics);
  const disciplineMap = byLabel(disciplines);
  const riskMap = byLabel(riskLevels);
  const frequencyUnitMap = byLabel(frequencyUnits);
  const evidenceTypeMap = byLabel(evidenceTypes);

  console.log("Seeding tasks from Task Register...");

  for (const row of seedData.taskRegister as Record<string, any>[]) {
    const taskId = row["Task ID"];
    const operations = (seedData.operations as Record<string, any>[]).filter(
      (o) => o["Task ID"] === taskId
    );
    const labour = (seedData.labour as Record<string, any>[]).filter((l) => l["Task ID"] === taskId);
    const materials = (seedData.materials as Record<string, any>[]).filter(
      (m) => m["Task ID"] === taskId
    );
    const safety = (seedData.safetyControls as Record<string, any>[]).filter(
      (s) => s["Task ID"] === taskId
    );
    const references = (seedData.references as Record<string, any>[]).filter(
      (r) => r["Task ID"] === taskId
    );

    await prisma.task.upsert({
      where: { taskId },
      update: {},
      create: {
        taskId,
        currentRevision: String(row["Revision"] ?? "1.0"),
        title: row["Task Title"],
        assetClass: row["Asset Class"] ?? undefined,
        equipmentType: row["Equipment Type"] ?? undefined,
        applicableMakeModel: row["Applicable Make / Model"] ?? undefined,
        failureModeAddressed: row["Failure Mode Addressed"] ?? undefined,
        maintenanceObjective: row["Maintenance Objective"] ?? undefined,
        frequency: row["Frequency"] ?? undefined,
        tolerance: row["Tolerance"] ?? undefined,
        systemCondition: row["System Condition"] ?? undefined,
        estimatedDurationH: row["Estimated Duration (h)"] ?? undefined,
        taskOwner: row["Task Owner"] ?? undefined,
        technicalApprover: row["Technical Approver"] ?? undefined,
        effectiveDate: row["Effective Date"] ? new Date(row["Effective Date"]) : undefined,
        reviewDate: row["Review Date"] ? new Date(row["Review Date"]) : undefined,
        sapTaskList: row["SAP Task List"] ?? undefined,
        plannerGroup: row["Planner Group"] ?? undefined,
        workCentre: row["Work Centre"] ?? undefined,

        statusId: statusMap[row["Status"]].id,
        maintenanceTypeId: maintenanceTypeMap[row["Maintenance Type"]].id,
        tacticId: tacticMap[row["Tactic"]].id,
        disciplineId: disciplineMap[row["Discipline"]].id,
        riskLevelId: riskMap[row["Risk"]].id,
        frequencyUnitId: frequencyUnitMap[row["Frequency Unit"]].id,

        operations: {
          create: operations.map((o) => ({
            operationNo: o["Operation No."],
            title: o["Operation Title"],
            workInstruction: o["Detailed Work Instruction"],
            acceptanceCriteria: o["Acceptance Criteria / Tolerance"] ?? undefined,
            holdPoint: o["Hold Point / Decision"] ?? undefined,
            evidenceDescription: o["Evidence Required"] ?? undefined,
            evidenceTypeId: evidenceTypeMap[o["Evidence Required"]]?.id ?? undefined,
            durationH: o["Duration (h)"] ?? undefined,
            workCentre: o["Primary Work Centre"] ?? undefined,
            systemCondition: o["System Condition"] ?? undefined,
          })),
        },
        labourRequirements: {
          create: labour.map((l) => ({
            roleTrade: l["Role / Trade"],
            competency: l["Competency / Authorisation"] ?? undefined,
            persons: l["Persons"],
            hoursPerPerson: l["Hours per Person"],
            supportNotes: l["Support / Notes"] ?? undefined,
          })),
        },
        materialItems: {
          create: materials.map((m) => ({
            itemType: m["Item Type"],
            partMaterial: m["Part / Material"],
            partNumber: m["Part Number"] ?? undefined,
            quantity: m["Quantity"],
            unit: m["Unit"],
            mandatory: m["Mandatory"] === "Yes",
            kittingNotes: m["Kitting / Specification Notes"] ?? undefined,
          })),
        },
        safetyControls: {
          create: safety.map((s) => ({
            hazard: s["Hazard / Critical Risk"],
            controlRequirement: s["Control Requirement"],
            permitIsolation: s["Permit / Isolation"] ?? undefined,
            ppe: s["PPE"] ?? undefined,
            verificationHoldPoint: s["Verification / Hold Point"] ?? undefined,
            environmentalControl: s["Environmental Control"] ?? undefined,
          })),
        },
        referenceDocs: {
          create: references.map((r) => ({
            referenceType: r["Reference Type"],
            title: r["Reference Title / Description"],
            documentNumber: r["Document Number"] ?? undefined,
            revision: r["Revision"] ?? undefined,
            sourceUrl: r["Source / URL"] ?? undefined,
            mandatoryReview: r["Mandatory Review Before Use"] === "Yes",
          })),
        },
        revisions: {
          create: {
            revision: String(row["Revision"] ?? "1.0"),
            statusId: statusMap[row["Status"]].id,
            changeReason: row["Change Reason"] ?? "Initial issue",
            changedBy: row["Task Owner"] ?? undefined,
          },
        },
      },
    });

    console.log(`  seeded ${taskId}`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
