# Firestore Database Structure

## Collections Used in Current Implementation
- `hospitals`: Provider data (name, city, specialties, treatments).
- `costEstimates`: Estimated cost ranges for treatments.
- `cases`: Quote requests and inquiries (patientId, treatment, budget). Expanded with assignment fields (`assignedSupportId`, `assignedCaseManagerId`) and controlled stages (`NEW_INQUIRY`, `ASSIGNED`, etc.).
- `caseEvents`: Event logs (`CASE_CREATED`, `CASE_ASSIGNED`, `STAGE_CHANGED`).
- `caseNotes`: Internal support notes isolated from customer access.
- `caseMessages`: Customer-Support messaging thread for a case.
- `quotes`: (Foundation implemented) Draft quotes for treatments.

## Collections
- `users`: User profiles and role assignments.
- `patients`: Patient-specific data.
- `staffProfiles`: Staff profiles.
- `doctors`, `specialties`, `treatments`: Provider data.
- `sources`, `sourceRecords`, `dataFields`, `verificationReviews`, `correctionRequests`, `outcomeStatistics`: Verification data.
- `aiConversations`, `aiMessages`, `aiSafetyEvents`: AI data.
- `complianceReviews`, `auditLogs`, `systemConfig`: Admin data.
