# Operational Intelligence (Phase 10)

## Overview
Phase 10 implemented a suite of read-only operational dashboards and client-side intelligence services to surface key insights across the MedBridge platform. 

In adherence to the free-tier infrastructure constraint, all intelligence aggregation is performed using bounded client-side queries (`limit()`, `orderBy()`) from existing canonical models. **No paid cloud functions, big data platforms, or excessive collection duplications were introduced.**

## Dashboards

### 1. Operations (`/admin/operations`)
Serves as the high-level system overview. 
- **Needs Attention:** Highlights unassigned cases, cases that have gone stale (no updates in 24+ hours), and recent failed acquisition jobs.
- **Metrics:** Bounded aggregation of Case volume (New, Under Review) and Quote volume/acceptance rates.

### 2. SLA Analytics (`/admin/sla`)
Tracks the efficiency of operational responses.
- Extracts `createdAt` and `firstResponseAt` timestamps directly from the Case model.
- Calculates the average First Response Time across the most recent bounded cases.

### 3. Support Workload (`/admin/support-performance`)
Measures the workload distribution among agents.
- Queries recent cases and quotes, mapping them back to `assignedSupportId` and `createdBy` respectively.
- Exposes Open Cases, Closed Cases, Quotes Prepared, and Quotes Sent per agent.

### 4. Quote Analytics (`/admin/quote-analytics`)
Measures the funnel performance of price quotes.
- Calculates overall acceptance and decline rates (Acceptances / (Sent + Accepted + Declined)).
- Reconciles cases with 0, 1, and 2+ quotes to identify cases lacking adequate provider comparisons.

### 5. Provider Analytics (`/admin/provider-analytics`)
Measures individual provider performance.
- Iterates over quotes mapping by `providerId`.
- Calculates specific provider quote acceptance rates, serving as a proxy for provider competitiveness.

### 6. Acquisition Health (`/admin/acquisition-health`)
Tracks the ETL (Extract-Transform-Load) status of the OGD pipeline.
- Surfaces `startedAt`, `status`, and volume (Found vs Accepted vs Rejected) directly from `acquisitionJobs`.
- Highlights failed runs prominently.

### 7. Data Quality (`/admin/data-quality`)
Extended the existing data quality dashboard.
- Includes metrics for Pending vs Resolved `fieldConflicts`.
- Exposes a CSV export containing the pipeline health snapshot.

### 8. Notification Center (`/notifications`)
A universal notification hub accessible to all users.
- Filters heavily by Role and Ownership. 
- Read/Unread toggling via `updateDoc`.
- Includes smart routing to the correct Case variant (Support view vs Customer view).

## Export Utility
A pure client-side CSV generator (`csvExport.ts`) allows administrators to download table metrics securely without exposing sensitive payload data or triggering massive backend data egress.

## Security Constraints
- **Admin Dashboards:** Explicitly restricted to `ADMIN`, `SUPER_ADMIN`, and optionally `DATA_REVIEWER` via RBAC `<ProtectedRoute>`.
- **Customer Isolation:** Customers cannot hit `/admin/*` routes.
- **Firestore Integrity:** Dashboard reads never write or modify state except for explicit "Mark as Read" actions in the Notifications center. Rules were not loosened for analytics.
