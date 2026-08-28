export type ProviderStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type CaseStage = 'NEW_INQUIRY' | 'ASSIGNED' | 'UNDER_REVIEW' | 'WAITING_FOR_CUSTOMER' | 'WAITING_FOR_PROVIDER' | 'QUOTE_PREPARATION' | 'QUOTE_READY' | 'ESCALATED' | 'CLOSED';
export type CasePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type CaseEventType = 'CASE_CREATED' | 'CASE_ASSIGNED' | 'STAGE_CHANGED' | 'PRIORITY_CHANGED' | 'CUSTOMER_MESSAGE' | 'SUPPORT_MESSAGE' | 'NOTE_ADDED' | 'QUOTE_CREATED' | 'QUOTE_UPDATED';
export type QuoteStatus = 'DRAFT' | 'UNDER_REVIEW' | 'READY' | 'SENT' | 'ACCEPTED' | 'DECLINED';

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
}

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
  actorType: string;
  eventType: CaseEventType;
  metadata?: any;
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
