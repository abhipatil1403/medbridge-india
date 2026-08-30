'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { db } from '../../lib/firebase/client';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../components/AuthProvider';
import { Notification } from '../../types/models';
import Link from 'next/link';

export default function NotificationCenter() {
  const { userProfile, roles } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'UNREAD' | 'ALL'>('UNREAD');

  useEffect(() => {
    async function load() {
      if (!userProfile?.uid) return;
      try {
        setLoading(true);
        const ref = collection(db, 'notifications');
        const constraints = [
          where('userId', '==', userProfile.uid),
          orderBy('createdAt', 'desc'),
          limit(100)
        ];
        if (filter === 'UNREAD') {
          constraints.push(where('read', '==', false));
        }
        const q = query(ref, ...constraints);
        const snap = await getDocs(q);
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userProfile, filter]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const getLinkForRole = (caseId?: string) => {
    if (!caseId) return '/';
    if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) {
      return `/support/cases/${caseId}`; // Admins view cases through support interface
    }
    if (roles.includes('SUPPORT_AGENT') || roles.includes('CASE_MANAGER')) {
      return `/support/cases/${caseId}`;
    }
    return `/customer/cases/${caseId}`;
  };

  if (loading) return <div className="p-8 text-gray-500">Loading notifications...</div>;

  return (
    <ProtectedRoute allowedRoles={['CUSTOMER', 'SUPPORT_AGENT', 'CASE_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'DATA_REVIEWER', 'COMPLIANCE_REVIEWER']}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
          <div className="space-x-2">
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'UNREAD' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'ALL' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              All
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {notifications.map(n => (
            <div key={n.id} className={`p-4 rounded-lg border ${n.read ? 'bg-white text-gray-600' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`font-semibold ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</h3>
                  <p className="text-sm mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {!n.read && (
                    <button onClick={() => markAsRead(n.id!)} className="text-xs font-medium text-blue-600 hover:underline">
                      Mark as Read
                    </button>
                  )}
                  {n.caseId && (
                    <Link href={getLinkForRole(n.caseId)} className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-800">
                      View Case
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-gray-500">You have no {filter === 'UNREAD' ? 'unread' : ''} notifications.</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
