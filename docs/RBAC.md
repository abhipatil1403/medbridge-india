# Role-Based Access Control (RBAC)

## Roles
- `CUSTOMER`: Customer Panel. Can manage own profile, create inquiries, and message support on their own cases.
- `SUPPORT_AGENT`: Support Panel. Can access only cases assigned to them, reply to customer messages, and add internal notes.
- `CASE_MANAGER`: Support Panel. Can manage assigned cases, assign unassigned cases, update case stages, and prepare quotes.
- `DATA_REVIEWER`: Admin Panel. (Future)
- `COMPLIANCE_REVIEWER`: Admin Panel. (Future)
- `ADMIN`: Admin Panel. Unrestricted read/write on most operational records.
- `SUPER_ADMIN`: Admin Panel. Unrestricted full access.

## Security Model
- Firestore Security Rules enforce access at the database level.
- Frontend Route Guards prevent unauthorized UI access.
- Roles are trusted only from server/Firebase Auth custom claims.
- Users cannot assign their own roles.
- Customer case isolation is strictly enforced via UID checks on `patientId` and `senderId`.
- Internal notes (`caseNotes`) are hidden from CUSTOMER roles.
- Case assignments restrict Support members to their authorized scope (`assignedSupportId`).
