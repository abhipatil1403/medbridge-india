'use client';
import React, { useEffect, useState } from 'react';
import { adminSourceService } from '../../../features/admin/adminSourceService';
import { Source } from '../../../types/models';

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await adminSourceService.getSources();
        setSources(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-6">Loading sources...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Sources Management</h1>
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Job</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Failures</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sources.map((src) => (
              <tr key={src.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{src.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{src.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    src.health === 'HEALTHY' ? 'bg-green-100 text-green-800' :
                    src.health === 'FAILING' ? 'bg-red-100 text-red-800' :
                    src.health === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                    src.health === 'DISABLED' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {src.health || 'UNKNOWN'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{src.lastJobId || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{src.consecutiveFailures || 0}</td>
              </tr>
            ))}
            {sources.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No sources found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
