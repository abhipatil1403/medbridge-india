# Firestore Database Structure

## Collections Used in Current Implementation

### `hospitals`
Provider data (name, city, specialties, treatments). Status-gated (`PUBLISHED`).

### `costEstimates`
Estimated cost ranges for treatments at specific hospitals.

### `cases`
Quote requests and inquiries. Core fields: `patientId`, `treatmentId`, `budget`, `currentStage`, `priority`.
Assignment fields: `assignedSupportId`, `assignedCaseManagerId`, `assignedAt`, `assignedBy`.

### `caseEvents`
Immutable event log for case lifecycle. Event types:
`CASE_CREATED`, `CASE_ASSIGNED`, `STAGE_CHANGED`, `PRIORITY_CHANGED`,
`CUSTOMER_MESSAGE`, `SUPPORT_MESSAGE`, `NOTE_ADDED`, `QUOTE_CREATED`, `QUOTE_UPDATED`.

### `caseNotes`
Internal support notes. **Customer NEVER has read access.** Enforced at the Firestore security rule level.

### `caseMessages`
Customer-Support messaging thread. Sender verification enforced on create. Read access controlled by sender identity and support role.

### `quotes`
Treatment quote drafts. Statuses: `DRAFT`, `UNDER_REVIEW`, `READY`. Customer sees only `READY`+. Created and managed only by `CASE_MANAGER` or `ADMIN`.

## Case Lifecycle Stages

```
NEW_INQUIRY → ASSIGNED → UNDER_REVIEW → WAITING_FOR_CUSTOMER
                                       → WAITING_FOR_PROVIDER
                                       → QUOTE_PREPARATION → QUOTE_READY → CLOSED
                                       → ESCALATED → UNDER_REVIEW
```

## Future Collections (Not Yet Implemented)
- `users`: User profiles and role assignments.
- `patients`: Patient-specific data.
- `staffProfiles`: Staff profiles.
- `doctors`, `specialties`, `treatments`: Provider data.
- `sources`, `sourceRecords`, `dataFields`, `verificationReviews`: Verification data.
- `aiConversations`, `aiMessages`, `aiSafetyEvents`: AI data.
- `complianceReviews`, `auditLogs`, `systemConfig`: Admin data.

## Proposed Data Acquisition Collections
- `acquisitionJobs`: Tracks execution of data pulls.
- `rawRecords`: Metadata for raw snapshots (large payloads in Storage).
- `normalizationRecords`: Intermediate parsed entities waiting for validation/deduplication.
