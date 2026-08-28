# Architecture

- **Frontend**: Next.js (TypeScript) + Firebase SDK
- **Backend**: FastAPI (Python)
- **Database**: Cloud Firestore
- **Storage**: Firebase Storage

Browser -> Next.js -> Firebase Auth -> Next.js Protected Routes
Firestore -> User Data
Storage -> File Storage
FastAPI -> Server Operations & Admin Verification

## Workflow Architecture

### 1. Customer Vertical Slice
- **Search Flow**: Customers search for treatments via `searchProviders` which queries `hospitals` collection for `PUBLISHED` status.
- **Provider Profile**: Fetches public hospital information and `costEstimates`. 
- **Case Creation**: Intake form securely writes to `cases` using client-side SDK.

### 2. Support Case-Management Slice
- **Support Queue**: Support users query `cases` using assignment fields (`assignedSupportId`).
- **Case Assignment**: Authorized roles update `assignedSupportId` to lock cases to specific personnel. Generates `CASE_ASSIGNED` event.
- **Internal Notes (`caseNotes`)**: Strictly segregated collection invisible to customers, readable only by authorized support.
- **Messaging (`caseMessages`)**: Segregated message stream. Customers read/write using `patientId` authorization, Support read/write via assignment permissions.
- **Stage & Priority Transitions**: Controlled transitions generating `STAGE_CHANGED` logs.

## Security Model
- Firestore Security Rules enforce access at the database level.
- Cases are isolated: a customer can only see a case where `resource.data.patientId == request.auth.uid`.
- Support agents can only read/write cases and messages mapped to their `uid`.
- Verification data and Provider records cannot be modified by customers or support agents.
