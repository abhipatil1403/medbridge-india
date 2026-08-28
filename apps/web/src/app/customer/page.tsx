import { ProtectedRoute } from '../../components/ProtectedRoute';
import Link from 'next/link';

export default function CustomerPage() {
  return (
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Welcome to MedBridge India</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border p-6 rounded bg-blue-50">
            <h2 className="text-xl font-semibold mb-2">Find a Treatment</h2>
            <p className="text-gray-600 mb-4">Search for hospitals, doctors, and treatments across India.</p>
            <Link href="/customer/search" className="bg-blue-600 text-white px-4 py-2 rounded inline-block">
              Search Providers
            </Link>
          </div>
          
          <div className="border p-6 rounded bg-green-50">
            <h2 className="text-xl font-semibold mb-2">My Cases</h2>
            <p className="text-gray-600 mb-4">View and manage your quote requests and medical journey.</p>
            <Link href="/customer/cases" className="bg-green-600 text-white px-4 py-2 rounded inline-block">
              View Cases
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
