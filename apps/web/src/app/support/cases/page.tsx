'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { useAuth } from '../../../components/AuthProvider';
import {
  getAssignedCases,
  getCaseManagerCases,
  getNewCases,
  getCasesByStage,
} from '../../../features/support/supportService';
import {
  Case,
  CaseStage,
  CasePriority,
  STAGE_LABELS,
  STAGE_CONFIG,
  PRIORITY_CONFIG,
} from '../../../types/models';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type FilterMode = 'ALL' | 'MY_CASES' | CaseStage;

const FILTER_OPTIONS: { value: FilterMode; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'MY_CASES', label: 'My Cases' },
  { value: 'NEW_INQUIRY', label: 'New' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'UNDER_REVIEW', label: 'In Progress' },
  { value: 'WAITING_FOR_CUSTOMER', label: 'Waiting Customer' },
  { value: 'WAITING_FOR_PROVIDER', label: 'Waiting Provider' },
  { value: 'QUOTE_PREPARATION', label: 'Quote Prep' },
  { value: 'ESCALATED', label: 'Escalated' },
  { value: 'CLOSED', label: 'Closed' },
];

const PRIORITY_FILTERS: { value: CasePriority | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Priorities' },
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH', label: 'High' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'LOW', label: 'Low' },
];

function SupportCaseQueueContent() {
  const { currentUser, primaryRole } = useAuth();
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get('filter') as FilterMode) || 'ALL';

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<FilterMode>(initialFilter);
  const [priorityFilter, setPriorityFilter] = useState<CasePriority | 'ALL'>('ALL');

  const isCaseManagerOrAbove =
    primaryRole === 'CASE_MANAGER' || primaryRole === 'ADMIN' || primaryRole === 'SUPER_ADMIN';

  const loadCases = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      let result: Case[] = [];

      if (stageFilter === 'MY_CASES') {
        result = await getAssignedCases(currentUser.uid);
        if (isCaseManagerOrAbove) {
          const mgr = await getCaseManagerCases(currentUser.uid);
          for (const mc of mgr) {
            if (!result.find(c => c.id === mc.id)) result.push(mc);
          }
        }
      } else if (stageFilter === 'ALL') {
        // Load assigned + new cases
        result = await getAssignedCases(currentUser.uid);
        if (isCaseManagerOrAbove) {
          const mgr = await getCaseManagerCases(currentUser.uid);
          for (const mc of mgr) {
            if (!result.find(c => c.id === mc.id)) result.push(mc);
          }
          const newC = await getNewCases();
          for (const nc of newC) {
            if (!result.find(c => c.id === nc.id)) result.push(nc);
          }
        }
      } else if (stageFilter === 'NEW_INQUIRY' && isCaseManagerOrAbove) {
        result = await getNewCases();
      } else {
        // Query specific stage from assigned cases
        const assigned = await getAssignedCases(currentUser.uid);
        result = assigned.filter(c => c.currentStage === stageFilter);
      }

      // Apply priority filter client-side
      if (priorityFilter !== 'ALL') {
        result = result.filter(c => c.priority === priorityFilter);
      }

      // Sort by updatedAt descending
      result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      setCases(result);
    } catch (err) {
      setError('Unable to load cases. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, stageFilter, priorityFilter, isCaseManagerOrAbove]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  return (
    <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'CASE_MANAGER', 'ADMIN', 'SUPER_ADMIN']}>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Case Queue</h1>
            <p className="text-sm text-gray-500 mt-1">{cases.length} case{cases.length !== 1 ? 's' : ''} found</p>
          </div>
          <Link href="/support" className="text-blue-600 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex flex-wrap gap-1.5">
            {FILTER_OPTIONS.map(opt => {
              // Hide NEW_INQUIRY filter from SUPPORT_AGENT (they can't query it)
              if (opt.value === 'NEW_INQUIRY' && !isCaseManagerOrAbove) return null;
              return (
                <button
                  key={opt.value}
                  onClick={() => setStageFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    stageFilter === opt.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as CasePriority | 'ALL')}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-xs bg-white"
          >
            {PRIORITY_FILTERS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading cases...</div>
        ) : cases.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 border rounded-lg">
            <p className="text-gray-500">No cases match the current filters.</p>
          </div>
        ) : (
          <div className="bg-white border rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b text-gray-600">
                <tr>
                  <th className="p-3 font-medium">Ref</th>
                  <th className="p-3 font-medium">Treatment</th>
                  <th className="p-3 font-medium">Location</th>
                  <th className="p-3 font-medium">Stage</th>
                  <th className="p-3 font-medium">Priority</th>
                  <th className="p-3 font-medium hidden md:table-cell">Assigned</th>
                  <th className="p-3 font-medium hidden md:table-cell">Created</th>
                  <th className="p-3 font-medium hidden lg:table-cell">Updated</th>
                  <th className="p-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium text-gray-900">{c.humanReference}</td>
                    <td className="p-3 text-gray-700">{c.treatmentName || c.treatmentId}</td>
                    <td className="p-3 text-gray-500">{c.preferredLocation}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${STAGE_CONFIG[c.currentStage]?.color || ''}`}>
                        {STAGE_LABELS[c.currentStage]}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_CONFIG[c.priority]?.color || ''}`}>
                        {PRIORITY_CONFIG[c.priority]?.label}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 hidden md:table-cell text-xs">
                      {c.assignedSupportId ? 'Assigned' : '—'}
                    </td>
                    <td className="p-3 text-gray-500 hidden md:table-cell">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-gray-500 hidden lg:table-cell">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/support/cases/${c.id}`}
                        className="text-blue-600 hover:underline font-medium text-xs"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
export default function SupportCaseQueue() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading queue...</div>}>
      <SupportCaseQueueContent />
    </Suspense>
  );
}
