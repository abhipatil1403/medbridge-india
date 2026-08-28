export type ProviderStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type CaseStage =
  | 'NEW_INQUIRY'
  | 'ASSIGNED'
  | 'UNDER_REVIEW'
  | 'WAITING_FOR_CUSTOMER'
  | 'WAITING_FOR_PROVIDER'
  | 'QUOTE_PREPARATION'
  | 'QUOTE_READY'
  | 'ESCALATED'
  | 'CLOSED';

export type CasePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type CaseEventType =
  | 'CASE_CREATED'
  | 'CASE_ASSIGNED'
  | 'STAGE_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'CUSTOMER_MESSAGE'
  | 'SUPPORT_MESSAGE'
  | 'NOTE_ADDED'
  | 'QUOTE_CREATED'
  | 'QUOTE_UPDATED';

export type QuoteStatus = 'DRAFT' | 'UNDER_REVIEW' | 'READY' | 'SENT' | 'ACCEPTED' | 'DECLINED';

/** Allowed stage transitions — key is current stage, value is list of valid next stages */
export const STAGE_TRANSITIONS: Record<CaseStage, CaseStage[]> = {
  NEW_INQUIRY: ['ASSIGNED'],
  ASSIGNED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['WAITING_FOR_CUSTOMER', 'WAITING_FOR_PROVIDER', 'QUOTE_PREPARATION', 'ESCALATED'],
  WAITING_FOR_CUSTOMER: ['UNDER_REVIEW', 'ESCALATED'],
  WAITING_FOR_PROVIDER: ['UNDER_REVIEW', 'QUOTE_PREPARATION', 'ESCALATED'],
  QUOTE_PREPARATION: ['QUOTE_READY', 'ESCALATED'],
  QUOTE_READY: ['CLOSED'],
  ESCALATED: ['UNDER_REVIEW'],
  CLOSED: [],
};

/** Human-readable stage labels */
export const STAGE_LABELS: Record<CaseStage, string> = {
  NEW_INQUIRY: 'New Inquiry',
  ASSIGNED: 'Assigned',
  UNDER_REVIEW: 'Under Review',
  WAITING_FOR_CUSTOMER: 'Waiting for Customer',
  WAITING_FOR_PROVIDER: 'Waiting for Provider',
  QUOTE_PREPARATION: 'Quote Preparation',
  QUOTE_READY: 'Quote Ready',
  ESCALATED: 'Escalated',
  CLOSED: 'Closed',
};

/** Priority display configuration */
export const PRIORITY_CONFIG: Record<CasePriority, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
};

/** Stage display configuration */
export const STAGE_CONFIG: Record<CaseStage, { color: string }> = {
  NEW_INQUIRY: { color: 'bg-purple-100 text-purple-800' },
  ASSIGNED: { color: 'bg-blue-100 text-blue-800' },
  UNDER_REVIEW: { color: 'bg-indigo-100 text-indigo-800' },
  WAITING_FOR_CUSTOMER: { color: 'bg-yellow-100 text-yellow-800' },
  WAITING_FOR_PROVIDER: { color: 'bg-amber-100 text-amber-800' },
  QUOTE_PREPARATION: { color: 'bg-cyan-100 text-cyan-800' },
  QUOTE_READY: { color: 'bg-green-100 text-green-800' },
  ESCALATED: { color: 'bg-red-100 text-red-800' },
  CLOSED: { color: 'bg-gray-200 text-gray-600' },
};

// ── Provider Models ──────────────────────────────────────────────────

export interface ProviderBase {
  id?: string;
  name: string;
  city: string;
  specialties: string[];
  treatments: string[];
  status: ProviderStatus;
  source: string;
  verificationStatus: string;
  lastCheckedAt: string;
}

export interface Hospital extends ProviderBase {
  accreditation?: string;
}

export interface Doctor extends ProviderBase {
  qualifications: string[];
  experienceYears: number;
  associatedHospitals: string[];
  languages: string[];
}

export interface CostEstimate {
  id?: string;
  hospitalId: string;
  treatmentId: string;
  treatmentName: string;
  currency: string;
  minAmount: number;
  maxAmount: number;
  inclusions?: string[];
  exclusions?: string[];
  source: string;
  verificationStatus: string;
  status: ProviderStatus;
}

// ── Case Models ──────────────────────────────────────────────────────

export interface Case {
  id?: string;
  humanReference?: string;
  patientId: string;
  selectedProviderId?: string;
  selectedHospitalId?: string;
  treatmentId: string;
  treatmentName?: string;
  preferredLocation: string;
  budget: string;
  preferredTimeline: string;
  inquiry: string;
  preferredLanguage: string;
  currentStage: CaseStage;
  priority: CasePriority;

  // Assignment fields — operational, does not overwrite patientId
  assignedSupportId?: string;
  assignedCaseManagerId?: string;
  assignedAt?: string;
  assignedBy?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CaseEvent {
  id?: string;
  caseId: string;
  actorId: string;
  actorRole: string;
  eventType: CaseEventType;
  metadata?: Record<string, string>;
  timestamp: string;
}

export interface CaseNote {
  id?: string;
  caseId: string;
  authorId: string;
  authorRole: string;
  text: string;
  createdAt: string;
}

export interface CaseMessage {
  id?: string;
  caseId: string;
  senderId: string;
  senderRole: string;
  body: string;
  createdAt: string;
  readAt?: string;
}

export interface Quote {
  id?: string;
  caseId: string;
  patientId: string;
  hospitalId: string;
  treatmentId: string;
  currency: string;
  estimatedAmount: number;
  inclusions: string[];
  exclusions: string[];
  status: QuoteStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── Admin Models ─────────────────────────────────────────────────────

export type SourceTier = 'TIER_1' | 'TIER_2' | 'TIER_3';
export type SourceStatus = 'ACTIVE' | 'INACTIVE';

export interface Source {
  id?: string;
  name: string;
  url: string;
  type: string;
  tier: SourceTier;
  publisher: string;
  status: SourceStatus;
  lastCheckedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type VerificationStatus = 'UNVERIFIED' | 'REVIEWED' | 'CLAIMED_CONFIRMED' | 'CONFIRMED' | 'DISPUTED';

export interface SourceRecord {
  id?: string;
  sourceId: string;
  entityType: 'HOSPITAL' | 'DOCTOR' | 'COST_ESTIMATE';
  entityId: string;
  fieldName: string;
  rawValue: string;
  retrievedAt: string;
  status: VerificationStatus;
}

export interface DataField {
  value: any;
  sourceId: string;
  retrievedAt: string;
  verificationStatus: VerificationStatus;
  reviewerId?: string;
}

export interface Specialty {
  id?: string;
  name: string;
  description?: string;
  status: ProviderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Treatment {
  id?: string;
  name: string;
  specialtyId: string;
  description?: string;
  status: ProviderStatus;
  createdAt: string;
  updatedAt: string;
}

export type CorrectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES';

export interface CorrectionRequest {
  id?: string;
  targetType: 'HOSPITAL' | 'DOCTOR' | 'COST_ESTIMATE';
  targetId: string;
  field: string;
  currentValue: any;
  proposedValue: any;
  reason: string;
  requestedBy: string;
  reviewedBy?: string;
  status: CorrectionStatus;
  createdAt: string;
  reviewedAt?: string;
}

export type ComplianceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES';

export interface ComplianceReview {
  id?: string;
  reviewerId?: string;
  targetType: 'HOSPITAL' | 'DOCTOR';
  targetId: string;
  status: ComplianceStatus;
  decision?: string;
  notes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface AuditLog {
  id?: string;
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
