import { ProtectedRoute } from '../../components/ProtectedRoute';
export default function AdminPage() {
  return <ProtectedRoute allowedRoles={['DATA_REVIEWER', 'COMPLIANCE_REVIEWER', 'ADMIN', 'SUPER_ADMIN']}><div>Admin Panel</div></ProtectedRoute>;
}
