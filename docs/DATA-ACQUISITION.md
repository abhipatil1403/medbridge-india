# Data Acquisition Pipeline Design

## 1. Objective
Design a reliable, source-backed data acquisition architecture for hospitals, doctors, specialties, treatments, cost estimates, accreditation, and public provider facts. The pipeline ensures external data never directly overwrites published provider records without validation and review.

## 2. End-to-End Pipeline
```
External Source 
  ↓ (Scheduled/Manual triggers)
Source Registry 
  ↓ (Adapters)
Acquisition Job 
  ↓ (Fetch)
Raw Snapshot 
  ↓ (Extract)
Normalization 
  ↓ (Deterministic Rules)
Validation 
  ↓ (Field requirements)
Deduplication 
  ↓ (Matching)
Provenance 
  ↓ (Audit Trails)
Review Queue 
  ↓ (Human-in-the-loop)
Admin / Data Reviewer 
  ↓ (Approval)
Publication
  ↓ (Status: PUBLISHED)
Customer Search
```

## 3. Core Principles
- **No Automatic Overwrites**: Canonical published entities (`hospitals`, `doctors`) are never directly mutated by automated scrapers.
- **Immutability of Raw Data**: Raw snapshots are append-only.
- **Traceable Provenance**: Every externally sourced fact traces back to a specific `sourceId` and timestamp.
- **Free Technology Stack**: Python, FastAPI, Firebase (Firestore, Storage), BeautifulSoup, Pydantic. No paid infrastructure.

## 4. Components

### Source Registry (`sources`)
Defines the metadata for an external source. Includes `type` (OFFICIAL_API, HOSPITAL_WEBSITE, etc.), `tier` (1, 2, 3), and `status`. Tiers reflect priority/provenance confidence, not absolute truth.

### Acquisition Jobs (`acquisitionJobs` - Proposed)
Tracks the execution of a data pull. Fields: `jobId`, `sourceId`, `status`, `startedAt`, `completedAt`, `recordsFound`, `recordsAccepted`. Should reside in Firestore.

### Raw Data (`rawRecords` - Proposed)
Appended-only snapshot of acquired data. Large HTML/JSON payloads are ideally stored in **Firebase Storage**, while metadata (`contentHash`, `retrievedAt`, `sourceId`) resides in Firestore. This enables change detection via hashes without bloating Firestore.

*[STAGING / DEVELOPMENT ONLY: Firebase Storage is deferred because the current Firebase staging project requires the Blaze plan for Storage provisioning. The current staging architecture uses local artifact storage (`apps/api/.data/raw_artifacts`) instead.]*

### Normalization & Validation
Normalizes raw payloads into `Candidate` records (e.g., `HospitalCandidate`). Deterministic validation checks required fields (e.g., `minAmount <= maxAmount` for cost estimates). LLMs may assist in unstructured extraction but output remains unverified until human review.

### Deduplication
Attempts deterministic matches (e.g., EXACT_MATCH, PROBABLE_MATCH). Uncertain matches fall back to human review.

### Conflict Resolution & Review
If a normalized candidate contradicts existing published data, a `correctionRequest` is generated. A Data Reviewer or Admin must manually approve or reject the conflict.

## 5. Security & Isolation
- **Raw/Acquisition Data**: Read/Write locked to `ADMIN` and `DATA_REVIEWER`.
- **Customer Impact**: Customers only read from the canonical collections (`hospitals`, `doctors`, `costEstimates`) where `status == 'PUBLISHED'`. Customers never see raw records, internal conflicts, or drafts.

## 6. Firebase Cost Considerations
- **Storage over Firestore**: Storing raw HTML in Storage prevents excessive Firestore document reads/writes and size limits.
- **Hash-based updates**: Only changed records (detected via `contentHash`) proceed through normalization, saving compute and database writes.
- **No Cloud Functions**: To prevent forcing the project onto a paid Blaze plan, scheduled jobs will eventually be executed via an external free-tier CRON (e.g., GitHub Actions) calling secure FastAPI endpoints.
