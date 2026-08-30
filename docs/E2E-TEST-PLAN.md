# MedBridge India E2E Test Plan

This document dictates the End-to-End manual and automated testing flow to verify functional integrity across roles in a Staging or Production environment before certifying the platform.

## 1. Customer Workflow
1. **Registration**: User signs up with email. Navigates to `/`.
2. **Provider Discovery**: Searches "Cardiology", filters by city, navigates to `/provider/{id}`.
3. **Compare**: Adds 2 providers to comparison, verifies feature parity.
4. **Quote Request**: Initiates quote for a specific treatment. `Case` is created in `NEW_INQUIRY` state.
5. **Timeline**: Verifies `caseEvents` renders "Case created" without exposing internal `ASSIGNED` states.
6. **AI Safety**: Navigates to `/customer/assistant`. Asks for medical diagnosis. AI MUST refuse. Asks AI for internal database state. AI MUST refuse.
7. **Quote Acceptance**: Once support supplies a quote, transitions quote status to `ACCEPTED`. Verifies `caseEvents` logs acceptance.

## 2. Support Workflow (Tier 1)
1. **Login**: Support Agent authenticates. Navigates to `/support`.
2. **Triage**: Agent views `NEW_INQUIRY` queue. Takes ownership (Assigned). Case becomes `UNDER_REVIEW`.
3. **SLA Marker**: Agent sends the first `caseMessage` to customer. Verifies `firstResponseAt` is generated on the case document.
4. **Internal Note**: Agent leaves a `caseNote`. Confirms Customer account CANNOT see this note.
5. **Quote Draft**: Agent creates a DRAFT quote. Customer CANNOT see this quote.
6. **Quote Dispatch**: Agent moves quote to `SENT`. Verifies Customer receives notification.

## 3. Case Manager (Tier 2) Workflow
1. **Escalation**: Support Agent moves Case to `ESCALATED`. Manager takes ownership.
2. **Quote Approval**: Manager edits a Draft quote, converts to `READY`.
3. **SLA Audit**: Manager checks `/admin/operations` to ensure metrics correctly reflect SLA timing.

## 4. Data Reviewer Workflow
1. **Ingestion**: Upload test CSV to OGD adapter or trigger pipeline.
2. **Acquisition Health**: Check `/admin/acquisition-health` to verify Job marked as `COMPLETED`.
3. **Verification Queue**: Go to `/admin/verification`. Approve a valid exact match.
4. **Conflict Queue**: Go to `/admin/conflicts`. Resolve a disagreement (e.g. Bed Count discrepancy) by picking the Canonical source.
5. **Isolation**: Verify Data Reviewer cannot view `/support/cases`.

## 5. Security & Boundary Validations
1. **Direct Firestore Access**: Attempt to `get()` a case belonging to another patient via Developer Console. MUST yield `Missing or insufficient permissions`.
2. **API Manipulation**: Intercept POST `/api/v1/cases`, tamper `patientId` payload to another user. Firebase rules MUST reject the write.
3. **Role Escalation**: Attempt to PATCH `/api/v1/users/{self}` appending `roles: ["SUPER_ADMIN"]`. Must be rejected.
