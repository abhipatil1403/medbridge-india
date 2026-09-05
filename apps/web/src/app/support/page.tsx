'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../components/AuthProvider';
import { getAssignedCases, getCaseManagerCases, getNewCases } from '../../features/support/supportService';
import { Case, CaseStage, STAGE_LABELS, STAGE_CONFIG, PRIORITY_CONFIG } from '../../types/models';
import Link from 'next/link';
import { Badge } from '../../components/Badge';

interface DashboardCounts {
  newCases: number;
  assignedToMe: number;
  inProgress: number;
  waitingCustomer: number;
  waitingProvider: number;
  quotePreparation: number;
  escalated: number;
  total: number;
}

function countByStage(cases: Case[], stage: CaseStage): number {
  return cases.filter(c => c.currentStage === stage).length;
}

export default function SupportDashboard() {
  const { currentUser, primaryRole } = useAuth();
  const [myCases, setMyCases] = useState<Case[]>([]);
  const [newCasesList, setNewCasesList] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setLoading(true);
      setError(null);
      try {
        const assigned = await getAssignedCases(currentUser.uid);
        let managerCases: Case[] = [];
        if (primaryRole === 'CASE_MANAGER' || primaryRole === 'ADMIN' || primaryRole === 'SUPER_ADMIN') {
          managerCases = await getCaseManagerCases(currentUser.uid);
        }
        
        const allMyCases = [...assigned];
        for (const mc of managerCases) {
          if (!allMyCases.find(c => c.id === mc.id)) {
            allMyCases.push(mc);
          }
        }
        setMyCases(allMyCases);

        if (primaryRole === 'CASE_MANAGER' || primaryRole === 'ADMIN' || primaryRole === 'SUPER_ADMIN') {
          const newC = await getNewCases();
          setNewCasesList(newC);
        }
      } catch (err) {
        setError('Unable to load dashboard data. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser, primaryRole]);

  const counts: DashboardCounts = {
    newCases: newCasesList.length,
    assignedToMe: myCases.filter(c => c.currentStage !== 'CLOSED').length,
    inProgress: countByStage(myCases, 'UNDER_REVIEW'),
    waitingCustomer: countByStage(myCases, 'WAITING_FOR_CUSTOMER'),
    waitingProvider: countByStage(myCases, 'WAITING_FOR_PROVIDER'),
    quotePreparation: countByStage(myCases, 'QUOTE_PREPARATION'),
    escalated: countByStage(myCases, 'ESCALATED'),
    total: myCases.length,
  };

  const recentCases = [...myCases]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'CASE_MANAGER', 'ADMIN', 'SUPER_ADMIN']}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Support Center</h1>
            <p className="text-slate-600">
              {primaryRole === 'CASE_MANAGER' ? 'Case Manager' : 'Support Agent'} Workspace
            </p>
          </div>
          <Link
            href="/support/cases"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors shadow-sm text-center"
          >
            Open Case Queue
          </Link>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-center gap-2 text-sm font-medium">
             <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <p className="text-slate-500 font-medium animate-pulse">Loading cases...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
              {(primaryRole === 'CASE_MANAGER' || primaryRole === 'ADMIN' || primaryRole === 'SUPER_ADMIN') && (
                <Link href="/support/cases?filter=NEW_INQUIRY" className="block group">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm group-hover:border-purple-300 group-hover:shadow-md transition-all relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full blur-2xl -mr-10 -mt-10 opacity-70"></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">New Inquiries</p>
                    <p className="text-3xl font-black text-purple-700">{counts.newCases}</p>
                  </div>
                </Link>
              )}
              <Link href="/support/cases?filter=ASSIGNED" className="block group">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm group-hover:border-blue-300 group-hover:shadow-md transition-all relative overflow-hidden h-full">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10 opacity-70"></div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned to Me</p>
                  <p className="text-3xl font-black text-blue-700">{counts.assignedToMe}</p>
                </div>
              </Link>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-50 rounded-full blur-2xl -mr-10 -mt-10 opacity-70"></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Wait: Customer</p>
                <p className="text-3xl font-black text-yellow-600">{counts.waitingCustomer}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-2xl -mr-10 -mt-10 opacity-70"></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Wait: Provider</p>
                <p className="text-3xl font-black text-amber-600">{counts.waitingProvider}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">In Progress</p>
                <p className="text-3xl font-black text-indigo-700">{counts.inProgress}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quote Prep</p>
                <p className="text-3xl font-black text-emerald-700">{counts.quotePreparation}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
                {counts.escalated > 0 && <span className="absolute top-3 right-3 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span></span>}
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Escalated</p>
                <p className="text-3xl font-black text-rose-700">{counts.escalated}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Assigned</p>
                <p className="text-3xl font-black text-slate-900">{counts.total}</p>
              </div>
            </div>

            {/* Recently Updated Cases */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Recently Updated Cases</h2>
                <Link href="/support/cases" className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center gap-1 transition-colors">
                  View All <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
              {recentCases.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  No cases assigned yet.
                  {(primaryRole === 'CASE_MANAGER' || primaryRole === 'ADMIN') && (
                    <div className="mt-2"> Check the <Link href="/support/cases" className="text-indigo-600 hover:underline font-medium">case queue</Link> for new inquiries.</div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white border-b border-slate-200 text-left">
                      <tr>
                        <th className="px-5 py-3 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Reference</th>
                        <th className="px-5 py-3 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Treatment</th>
                        <th className="px-5 py-3 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Stage</th>
                        <th className="px-5 py-3 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Priority</th>
                        <th className="px-5 py-3 font-bold text-slate-500 text-[11px] uppercase tracking-wider">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentCases.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <Link href={`/support/cases/${c.id}`} className="text-indigo-600 hover:text-indigo-900 font-bold">
                              {c.humanReference}
                            </Link>
                          </td>
                          <td className="px-5 py-4 text-slate-900 font-medium whitespace-nowrap">{c.treatmentName || c.treatmentId}</td>
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
                          <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{new Date(c.updatedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
