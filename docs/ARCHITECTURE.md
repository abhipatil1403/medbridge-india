# Architecture

## Technology Stack
- **Frontend**: Next.js (App Router, TypeScript) + Firebase Client SDK
- **Backend**: FastAPI (Python)
- **Database**: Cloud Firestore
- **Auth**: Firebase Authentication with custom claims for RBAC
- **Storage**: Firebase Storage (foundation) - *[STAGING / DEVELOPMENT ONLY: Firebase Storage is deferred because the current Firebase staging project requires the Blaze plan for Storage provisioning. The current staging architecture does not use Firebase Storage.]*
## Data Flow

```
Browser → Next.js (App Router) → Firebase Auth → Protected Routes
                                → Firestore (Client SDK) → Security Rules → Data
FastAPI → Server Operations & Admin Verification (future)
```

## Implemented Vertical Slices

### 1. Customer Vertical Slice
- **Search**: Customers query `hospitals` collection (`status == 'PUBLISHED'`).
- **Provider Profile**: Public hospital info + `costEstimates`.
- **Case Creation**: Intake form writes to `cases` with `patientId == auth.uid`.
- **Case View**: Customer reads own cases via `patientId` query.

### 2. Support Panel Vertical Slice
- **Support Dashboard**: Real-time counts by stage from assigned cases.
- **Case Queue**: Filterable list querying by `assignedSupportId`, `currentStage`.
- **Case Assignment**: CASE_MANAGER updates `assignedSupportId`, generates `CASE_ASSIGNED` event.
- **Case Detail**: Tabbed workspace (Overview, Messages, Notes, Timeline, Quote).
- **Messaging**: Bidirectional customer-support via `caseMessages` collection.
- **Internal Notes**: `caseNotes` collection, completely isolated from customers.
- **Stage Transitions**: Validated against `STAGE_TRANSITIONS` map, generates `STAGE_CHANGED` events.
- **Quote Drafts**: `quotes` collection with `DRAFT`/`UNDER_REVIEW`/`READY` statuses.

## Security Architecture

### Firestore Rules Strategy
- **Default deny**: `match /{document=**} { allow read, write: if false; }`
- **Customer isolation**: `isOwner(resource.data.patientId)`
- **Support assignment**: `isAssignedSupport()` checks `assignedSupportId == request.auth.uid`
- **Note isolation**: `caseNotes` rules deny all customer access
- **Message sender verification**: `isOwner(request.resource.data.senderId)` on create
- **Quote protection**: Customers only see quotes with status `READY` or beyond
- **Event immutability**: `caseEvents` allow create only, no update/delete

### Query Strategy
- Support queries use Firestore indexes on assignment fields (not load-all-then-filter).
- `assignedSupportId == uid` for agent case lists.
- `currentStage == 'NEW_INQUIRY'` for case manager queue.
- `patientId == uid` for customer case lists.

## Future Architecture (Not Yet Implemented)
- Admin Panel for provider/source/verification management (Phase 3 - Implemented)
- Data Acquisition Pipeline for external provider sourcing (Phase 4 - Designed in [DATA-ACQUISITION.md](./DATA-ACQUISITION.md))
- AI chatbot and copilot integration
- Web scraping pipeline for provider data
- Payment and booking workflows
- WhatsApp/SMS notification channels
- Partner/Provider portals
