'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../components/AuthProvider';
import { getAssignedCases, getCaseManagerCases, getNewCases } from '../../features/support/supportService';
import { Case, CaseStage, STAGE_LABELS, STAGE_CONFIG, PRIORITY_CONFIG } from '../../types/models';
import Link from 'next/link';

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
        // Merge and deduplicate
        const allMyCases = [...assigned];
        for (const mc of managerCases) {
          if (!allMyCases.find(c => c.id === mc.id)) {
            allMyCases.push(mc);
          }
        }
        setMyCases(allMyCases);

        // Get new cases (CASE_MANAGER and ADMIN can see the queue)
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
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Dashboard</h1>
            <p className="text-gray-500 mt-1">
              {primaryRole === 'CASE_MANAGER' ? 'Case Manager' : 'Support Agent'} Overview
            </p>
          </div>
          <Link
            href="/support/cases"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            View Case Queue
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading dashboard...</div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {(primaryRole === 'CASE_MANAGER' || primaryRole === 'ADMIN' || primaryRole === 'SUPER_ADMIN') && (
                <Link href="/support/cases?filter=NEW_INQUIRY" className="block">
                  <div className="border border-purple-200 bg-purple-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-purple-600">New Cases</p>
                    <p className="text-3xl font-bold text-purple-900 mt-1">{counts.newCases}</p>
                  </div>
                </Link>
              )}
              <Link href="/support/cases?filter=ASSIGNED" className="block">
                <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-blue-600">Assigned to Me</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{counts.assignedToMe}</p>
                </div>
              </Link>
              <div className="border border-yellow-200 bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-yellow-600">Waiting for Customer</p>
                <p className="text-3xl font-bold text-yellow-900 mt-1">{counts.waitingCustomer}</p>
              </div>
              <div className="border border-amber-200 bg-amber-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-amber-600">Waiting for Provider</p>
                <p className="text-3xl font-bold text-amber-900 mt-1">{counts.waitingProvider}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="border border-indigo-200 bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-indigo-600">In Progress</p>
                <p className="text-3xl font-bold text-indigo-900 mt-1">{counts.inProgress}</p>
              </div>
              <div className="border border-cyan-200 bg-cyan-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-cyan-600">Quote Preparation</p>
                <p className="text-3xl font-bold text-cyan-900 mt-1">{counts.quotePreparation}</p>
              </div>
              <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-red-600">Escalated</p>
                <p className="text-3xl font-bold text-red-900 mt-1">{counts.escalated}</p>
              </div>
              <div className="border border-gray-200 bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Total Assigned</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{counts.total}</p>
              </div>
            </div>

            {/* Recently Updated Cases */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">Recently Updated Cases</h2>
              </div>
              {recentCases.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No cases assigned yet.
                  {(primaryRole === 'CASE_MANAGER' || primaryRole === 'ADMIN') && (
                    <> Check the <Link href="/support/cases" className="text-blue-600 hover:underline">case queue</Link> for new inquiries.</>
                  )}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-left">
                    <tr>
                      <th className="p-3 font-medium">Reference</th>
                      <th className="p-3 font-medium">Treatment</th>
                      <th className="p-3 font-medium">Stage</th>
                      <th className="p-3 font-medium">Priority</th>
                      <th className="p-3 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCases.map(c => (
                      <tr key={c.id} className="border-t hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <Link href={`/support/cases/${c.id}`} className="text-blue-600 hover:underline font-medium">
                            {c.humanReference}
                          </Link>
                        </td>
                        <td className="p-3 text-gray-700">{c.treatmentName || c.treatmentId}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${STAGE_CONFIG[c.currentStage]?.color || ''}`}>
                            {STAGE_LABELS[c.currentStage]}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_CONFIG[c.priority]?.color || ''}`}>
                            {PRIORITY_CONFIG[c.priority]?.label}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500">{new Date(c.updatedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
