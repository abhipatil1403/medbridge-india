'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getConflictById, resolveConflict } from '../../../../features/admin/conflictService';
import { FieldConflict } from '../../../../types/models';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { useAuth } from '../../../../components/AuthProvider';
import Link from 'next/link';

function ConflictDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { currentUser } = useAuth();
  
  const [conflict, setConflict] = useState<FieldConflict | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [manualValue, setManualValue] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getConflictById(id);
        setConflict(data);
        if (data && typeof data.canonicalValue === 'string') {
          setManualValue(data.canonicalValue);
        } else if (data) {
          setManualValue(JSON.stringify(data.canonicalValue));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleResolve = async (status: FieldConflict['status'], resolvedValue: any) => {
    if (!currentUser || !conflict) return;
    setActionLoading(true);
    setError('');
    
    try {
      await resolveConflict(conflict.id!, conflict, status, resolvedValue, currentUser.uid, reviewerNotes);
      router.push('/admin/conflicts');
    } catch (err: any) {
      setError(err.message || 'Error resolving conflict');
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading conflict...</div>;
  if (!conflict) return <div className="p-8">Conflict not found.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/admin/conflicts" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Queue</Link>
      <h1 className="text-2xl font-bold mb-6">Resolve Field Conflict</h1>
      
      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">Canonical (Existing)</h2>
          <div className="mb-4">
            <span className="text-sm text-gray-500 uppercase">Field:</span>
            <p className="font-mono text-lg font-bold text-blue-900">{conflict.fieldName}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500 uppercase">Value:</span>
            <div className="bg-gray-50 p-3 rounded mt-1 font-mono break-words">
              {conflict.canonicalValue === null || conflict.canonicalValue === undefined ? <span className="italic text-gray-400">Empty</span> : JSON.stringify(conflict.canonicalValue)}
            </div>
          </div>
          
          {conflict.status === 'PENDING' && (
            <button 
              onClick={() => handleResolve('RESOLVED_CANONICAL', conflict.canonicalValue)}
              disabled={actionLoading}
              className="mt-6 w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Keep Canonical Value
            </button>
          )}
        </div>
        
        <div className="space-y-6">
          {conflict.candidateValues.map((cv: any, idx: number) => (
            <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-6 shadow-sm">
              <h2 className="font-bold text-orange-800 mb-4 border-b border-orange-200 pb-2">Source: {cv.sourceId}</h2>
              <div className="mb-4">
                <span className="text-sm text-orange-600 uppercase">Value:</span>
                <div className="bg-white p-3 rounded mt-1 border border-orange-100 font-mono break-words">
                  {JSON.stringify(cv.value)}
                </div>
              </div>
              <p className="text-xs text-orange-600 mb-4">Retrieved: {new Date(cv.retrievedAt).toLocaleString()}</p>
              
              {conflict.status === 'PENDING' && (
                <button 
                  onClick={() => handleResolve('RESOLVED_SOURCE', cv.value)}
                  disabled={actionLoading}
                  className="w-full bg-orange-600 text-white p-2 rounded hover:bg-orange-700"
                >
                  Accept This Source
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {conflict.status === 'PENDING' && (
        <div className="bg-white border rounded-lg p-6 shadow-sm mb-6">
          <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">Manual Resolution / Rejection</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Manual Value Override</label>
            <input 
              type="text" 
              value={manualValue} 
              onChange={e => setManualValue(e.target.value)} 
              className="w-full border p-2 rounded"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Reviewer Notes (Optional)</label>
            <textarea 
              value={reviewerNotes} 
              onChange={e => setReviewerNotes(e.target.value)} 
              className="w-full border p-2 rounded" 
              rows={2}
            ></textarea>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => handleResolve('RESOLVED_MANUAL', manualValue)}
              disabled={actionLoading}
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
            >
              Apply Manual Value
            </button>
            
            <button 
              onClick={() => handleResolve('REJECTED', conflict.canonicalValue)}
              disabled={actionLoading}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ml-auto"
            >
              Reject Conflict (Discard)
            </button>
          </div>
        </div>
      )}
      
      {conflict.status !== 'PENDING' && (
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-green-800">
          <h2 className="font-bold mb-2">Conflict Resolved</h2>
          <p>Status: {conflict.status}</p>
          <p>Resolved By: {conflict.resolvedBy}</p>
          <p>Resolution: {JSON.stringify(conflict.resolution)}</p>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DATA_REVIEWER']}>
      <ConflictDetail />
    </ProtectedRoute>
  );
}
