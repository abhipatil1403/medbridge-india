# MedBridge India Security Matrix (RBAC)

This document outlines the strict Role-Based Access Control (RBAC) boundaries enforced across the platform via Firestore Security Rules, frontend route protection, and API gateways.

## Roles

| Role | Description |
|---|---|
| **CUSTOMER** | An authenticated patient/end-user. Owns cases and profile data. |
| **SUPPORT_AGENT** | Tier 1 support. Can message customers, draft quotes, and triage cases. |
| **CASE_MANAGER** | Tier 2 support/supervisor. Handles escalations, quote finalization, and SLA monitoring. |
| **DATA_REVIEWER** | Domain expert responsible for data ingestion, deduplication, and field conflict resolution. |
| **COMPLIANCE_REVIEWER** | Responsible for auditing actions, managing compliance queue overrides. |
| **ADMIN** | Full operational visibility, analytics, user administration, minus destructive overrides. |
| **SUPER_ADMIN** | Absolute system authority. Can revoke roles, force deletions, and bypass standard workflow checks. |

## Collection Access Matrix

| Collection | CUSTOMER | SUPPORT_AGENT | CASE_MANAGER | DATA_REVIEWER | ADMIN |
|---|---|---|---|---|---|
| `users` | Own only | All | All | - | All |
| `patients` | Own only | All | All | - | All |
| `hospitals` | PUBLISHED | PUBLISHED | PUBLISHED | All | All |
| `cases` | Own only | Assigned/New | Assigned/New | - | All |
| `caseEvents`| Own (Safe*) | All | All | - | All |
| `caseNotes` | **DENY** | All | All | - | All |
| `caseMessages`| Own | All | All | - | All |
| `quotes` | Own (Ready+) | Assigned | All | - | All |
| `notifications`| Own only | Own only | Own only | Own only | All |
| `acquisitionJobs`| **DENY** | **DENY** | **DENY** | Read-Only | Read-Only |
| `rawRecords` | **DENY** | **DENY** | **DENY** | Read-Only | Read-Only |
| `acquisitionReviews`| **DENY**| **DENY** | **DENY** | All | All |
| `fieldConflicts`| **DENY**| **DENY** | **DENY** | All | All |
| `auditLogs` | **DENY** | **DENY** | **DENY** | Read-Only | Read-Only |
| `aiConversations`| Own only | Own only | Own only | Own only | Read-Only |

*\* Customers can only read `caseEvents` explicitly marked in the customer-safe allowlist (e.g., `CASE_CREATED`, `CUSTOMER_MESSAGE`, `QUOTE_SENT`). Internal SLA transitions and notes are filtered at the database level.*

## Key Security Principles

1. **Firestore as the Boundary**: The React frontend is completely untrusted. Security boundaries are strictly enforced by `firestore.rules` and `storage.rules`.
2. **Immutable SLAs**: Timestamps like `firstResponseAt` and `closedAt` are one-way transitions. Firestore rejects arbitrary modification requests.
3. **Data Silos**: Support teams cannot publish providers. Data reviewers cannot view patient cases. Roles are granted granular access only to what they need.
4. **Deny by Default**: Any collection not explicitly named in the rules is blocked.
