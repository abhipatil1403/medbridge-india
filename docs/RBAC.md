# Role-Based Access Control (RBAC)

## Roles

| Role | Panel | Status |
|------|-------|--------|
| `CUSTOMER` | Customer Panel | Implemented |
| `SUPPORT_AGENT` | Support Panel | Implemented |
| `CASE_MANAGER` | Support Panel | Implemented |
| `DATA_REVIEWER` | Admin Panel | Planned |
| `COMPLIANCE_REVIEWER` | Admin Panel | Planned |
| `ADMIN` | Admin Panel | Infrastructure only |
| `SUPER_ADMIN` | Admin Panel | Infrastructure only |

## CUSTOMER Permissions
- **Can**: View own profile, search providers, create cases, view own cases, send/read messages on own cases.
- **Cannot**: Access other patients' cases, read internal notes, modify case stage/priority, assign cases, modify quotes, access Support/Admin panels.

## SUPPORT_AGENT Permissions
- **Can**: View assigned cases, read customer request info for assigned cases, send/read messages on assigned cases, add internal notes to assigned cases, update permitted stages on assigned cases, update priority on assigned cases, view quote drafts for assigned cases.
- **Cannot**: View unassigned cases (except NEW_INQUIRY for awareness), assign cases, create/modify quotes, change user roles, access unrelated patient data, modify provider data.

## CASE_MANAGER Permissions
- **Can**: All SUPPORT_AGENT capabilities, plus: view NEW_INQUIRY queue, assign/reassign cases, manage case stages, create and update quote drafts, escalate cases.
- **Cannot**: Change user roles, modify provider verification data, access audit logs directly.

## ADMIN Permissions
- **Can**: Platform-wide case access, manage support operations, all CASE_MANAGER capabilities.

## SUPER_ADMIN Permissions
- **Can**: Unrestricted administrative access across all collections.

## Security Enforcement
- **Firestore Security Rules**: Primary enforcement layer. Rules check `request.auth.token` for role claims.
- **Frontend Route Guards**: `ProtectedRoute` component checks `allowedRoles` prop against user's role array.
- **Service Layer**: Functions accept `actorRole` from authenticated context, never from untrusted client input.
- **Default Deny**: The catch-all rule `match /{document=**} { allow read, write: if false; }` ensures anything not explicitly allowed is denied.

## Assignment Model
- `assignedSupportId`: The support agent working on the case.
- `assignedCaseManagerId`: The case manager overseeing the case.
- `assignedAt` / `assignedBy`: Audit trail for assignment.
- `patientId`: The customer who owns the case — never overwritten by assignment.

## Internal Notes Isolation
- `caseNotes` collection rules: `allow read: if isSupportStaff() || isAdmin()`
- Customer roles are completely denied — this is enforced at the database level, not just the UI.
