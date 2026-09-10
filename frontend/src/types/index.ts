export interface LookupValue {
  id: string;
  label: string;
}

export interface Lists {
  statuses: LookupValue[];
  "maintenance-types": LookupValue[];
  tactics: LookupValue[];
  disciplines: LookupValue[];
  "risk-levels": LookupValue[];
  "frequency-units": LookupValue[];
  "evidence-types": LookupValue[];
}

export interface Operation {
  id?: string;
  operationNo: number;
  title: string;
  workInstruction: string;
  acceptanceCriteria?: string;
  holdPoint?: string;
  evidenceDescription?: string;
  evidenceTypeId?: string | null;
  durationH?: number;
  workCentre?: string;
  systemCondition?: string;
}

export interface LabourRequirement {
  id?: string;
  roleTrade: string;
  competency?: string;
  persons: number;
  hoursPerPerson: number;
  supportNotes?: string;
}

export interface MaterialItem {
  id?: string;
  itemType: string;
  partMaterial: string;
  partNumber?: string;
  quantity: number;
  unit: string;
  mandatory: boolean;
  kittingNotes?: string;
}

export interface SafetyControl {
  id?: string;
  hazard: string;
  controlRequirement: string;
  permitIsolation?: string;
  ppe?: string;
  verificationHoldPoint?: string;
  environmentalControl?: string;
}

export interface ReferenceDoc {
  id?: string;
  referenceType: string;
  title: string;
  documentNumber?: string;
  revision?: string;
  sourceUrl?: string;
  mandatoryReview: boolean;
}

export interface TaskRevision {
  id: string;
  revision: string;
  status: LookupValue;
  changeReason?: string;
  changedBy?: string;
  approvedBy?: string;
  approvedDate?: string;
  createdAt: string;
}

export interface Task {
  id?: string;
  taskId: string;
  currentRevision: string;
  title: string;
  assetClass?: string;
  equipmentType?: string;
  applicableMakeModel?: string;
  failureModeAddressed?: string;
  maintenanceObjective?: string;
  frequency?: number;
  tolerance?: string;
  systemCondition?: string;
  estimatedDurationH?: number;
  taskOwner?: string;
  technicalApprover?: string;
  effectiveDate?: string;
  reviewDate?: string;
  sapTaskList?: string;
  plannerGroup?: string;
  workCentre?: string;

  statusId: string;
  status?: LookupValue;
  maintenanceTypeId: string;
  maintenanceType?: LookupValue;
  tacticId: string;
  tactic?: LookupValue;
  disciplineId: string;
  discipline?: LookupValue;
  riskLevelId: string;
  riskLevel?: LookupValue;
  frequencyUnitId: string;
  frequencyUnit?: LookupValue;

  changeReason?: string;
  changedBy?: string;

  operations: Operation[];
  labourRequirements: LabourRequirement[];
  materialItems: MaterialItem[];
  safetyControls: SafetyControl[];
  referenceDocs: ReferenceDoc[];
  revisions?: TaskRevision[];
  totalLabourHours?: number;
  _count?: { operations: number; materialItems: number; safetyControls: number };
}
