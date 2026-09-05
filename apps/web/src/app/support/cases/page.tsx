'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { useAuth } from '../../../components/AuthProvider';
import {
  getAssignedCases,
  getCaseManagerCases,
  getNewCases,
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
import { Badge } from '../../../components/Badge';

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
        const assigned = await getAssignedCases(currentUser.uid);
        result = assigned.filter(c => c.currentStage === stageFilter);
      }

      if (priorityFilter !== 'ALL') {
        result = result.filter(c => c.priority === priorityFilter);
      }

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
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-end pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Case Queue</h1>
            <p className="text-slate-600 font-medium">Manage and resolve active customer inquiries.</p>
          </div>
          <Link href="/support" className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center gap-1.5 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex flex-wrap gap-2 flex-1">
            {FILTER_OPTIONS.map(opt => {
              if (opt.value === 'NEW_INQUIRY' && !isCaseManagerOrAbove) return null;
              return (
                <button
                  key={opt.value}
                  onClick={() => setStageFilter(opt.value)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
                    stageFilter === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
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
            className="border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow md:w-48"
          >
            {PRIORITY_FILTERS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-2 text-sm font-medium mb-6">
             <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        {loading ? (
           <div className="flex flex-col items-center justify-center p-20 space-y-4">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
             <p className="text-slate-500 font-medium animate-pulse">Loading case queue...</p>
           </div>
        ) : cases.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-16 text-center shadow-sm">
             <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
             <h3 className="text-lg font-bold text-slate-800 mb-1">Queue Empty</h3>
             <p className="text-slate-500">No cases match the current filters.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
               <span className="text-sm font-bold text-slate-500">{cases.length} case{cases.length !== 1 ? 's' : ''} found</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-bold text-[11px] uppercase tracking-wider">Ref</th>
                    <th className="px-5 py-4 font-bold text-[11px] uppercase tracking-wider">Treatment</th>
                    <th className="px-5 py-4 font-bold text-[11px] uppercase tracking-wider">Location</th>
                    <th className="px-5 py-4 font-bold text-[11px] uppercase tracking-wider">Stage</th>
                    <th className="px-5 py-4 font-bold text-[11px] uppercase tracking-wider">Priority</th>
                    <th className="px-5 py-4 font-bold text-[11px] uppercase tracking-wider hidden md:table-cell">Assigned</th>
                    <th className="px-5 py-4 font-bold text-[11px] uppercase tracking-wider hidden md:table-cell">Created</th>
                    <th className="px-5 py-4 font-bold text-[11px] uppercase tracking-wider hidden lg:table-cell">Updated</th>
                    <th className="px-5 py-4 font-bold text-[11px] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/support/cases/${c.id}`} className="font-bold text-indigo-600 hover:text-indigo-900">
                           {c.humanReference}
                        </Link>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-900 whitespace-nowrap">{c.treatmentName || c.treatmentId}</td>
                      <td className="px-5 py-4 text-slate-600 font-medium whitespace-nowrap">{c.preferredLocation}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                         <Badge variant={c.currentStage === 'UNDER_REVIEW' ? 'info' : c.currentStage === 'ESCALATED' ? 'error' : 'default'}>
                            {STAGE_LABELS[c.currentStage] || c.currentStage}
                         </Badge>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                         <Badge variant={c.priority === 'HIGH' || c.priority === 'URGENT' ? 'error' : c.priority === 'NORMAL' ? 'warning' : 'default'}>
                            {PRIORITY_CONFIG[c.priority]?.label || c.priority}
                         </Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-500 hidden md:table-cell">
                        {c.assignedSupportId ? <span className="text-emerald-600 font-medium flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Assigned</span> : '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-500 hidden md:table-cell whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-slate-500 hidden lg:table-cell whitespace-nowrap">
                        {new Date(c.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/support/cases/${c.id}`}
                          className="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors inline-block"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
export default function SupportCaseQueue() {
  return (
    <Suspense fallback={
       <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading queue...</p>
       </div>
    }>
      <SupportCaseQueueContent />
    </Suspense>
  );
}
