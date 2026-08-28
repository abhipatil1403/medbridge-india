'use client';

import React, { useEffect, useState } from 'react';
import { getCaseById } from '../../../../features/cases/caseService';
import { getCaseMessages, sendCaseMessage } from '../../../../features/cases/messageService';
import { Case, CaseMessage, STAGE_LABELS } from '../../../../types/models';
import { useAuth } from '../../../../components/AuthProvider';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { useParams } from 'next/navigation';
import Link from 'next/link';

/** Map internal stages to customer-friendly display */
function getCustomerStageLabel(stage: string): string {
  const customerLabels: Record<string, string> = {
    NEW_INQUIRY: 'Submitted',
    ASSIGNED: 'Being Reviewed',
    UNDER_REVIEW: 'Under Review',
    WAITING_FOR_CUSTOMER: 'Awaiting Your Response',
    WAITING_FOR_PROVIDER: 'Awaiting Provider',
    QUOTE_PREPARATION: 'Preparing Estimate',
    QUOTE_READY: 'Estimate Ready',
    ESCALATED: 'Under Review',
    CLOSED: 'Closed',
  };
  return customerLabels[stage] || stage.replace(/_/g, ' ');
}

export default function CaseDetailPage() {
  const { id } = useParams() as { id: string };
  const { currentUser } = useAuth();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (currentUser && id) {
      try {
        const data = await getCaseById(id, currentUser.uid);
        setCaseData(data);
        if (data) {
          const ms = await getCaseMessages(id);
          setMessages(ms);
        }
      } catch (err) {
        setError('Unable to load case details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => { load(); }, [id, currentUser]);

  const handleSend = async () => {
    if (!currentUser || !caseData || !newMessage.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendCaseMessage(caseData.id!, currentUser.uid, 'CUSTOMER', newMessage);
      setNewMessage('');
      // Reload messages
      const ms = await getCaseMessages(caseData.id!);
      setMessages(ms);
    } catch (err) {
      setError('Unable to send message. Please try again.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto p-6 text-center text-gray-500">Loading case details...</div>;

  if (!caseData) {
    return (
      <ProtectedRoute allowedRoles={['CUSTOMER']}>
        <div className="max-w-3xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error || 'Case not found or you do not have access to this case.'}
          </div>
          <Link href="/customer/cases" className="text-blue-600 hover:underline mt-4 inline-block">← Back to My Cases</Link>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <div className="max-w-3xl mx-auto p-6">
        <Link href="/customer/cases" className="text-blue-600 hover:underline text-sm">← Back to My Cases</Link>

        <div className="flex justify-between items-center mt-2 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Case {caseData.humanReference}</h1>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {getCustomerStageLabel(caseData.currentStage)}
          </span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">{error}</div>
        )}

        {/* Treatment Details — customer-appropriate info only */}
        <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2 text-gray-900">Treatment Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Treatment</p>
              <p className="font-medium">{caseData.treatmentName || caseData.treatmentId}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Budget</p>
              <p className="font-medium">{caseData.budget || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Preferred Location</p>
              <p className="font-medium">{caseData.preferredLocation}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Preferred Timeline</p>
              <p className="font-medium">{caseData.preferredTimeline || 'Flexible'}</p>
            </div>
          </div>
          {caseData.inquiry && (
            <div className="mt-4">
              <p className="text-gray-500 text-sm mb-1">Your Inquiry</p>
              <p className="bg-gray-50 p-3 rounded text-sm border">{caseData.inquiry}</p>
            </div>
          )}
        </div>

        {/* Messages — customer sees their own conversation with support */}
        <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2 text-gray-900">Messages</h2>
          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto p-3 bg-gray-50 rounded-lg border">
            {messages.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No messages yet. Send a message to our support team below.
              </p>
            )}
            {messages.map(m => (
              <div
                key={m.id}
                className={`p-3 rounded-lg max-w-[85%] ${
                  m.senderRole === 'CUSTOMER'
                    ? 'bg-blue-50 border border-blue-100 ml-auto'
                    : 'bg-white border border-gray-200 mr-auto'
                }`}
              >
                <p className="text-xs text-gray-500 mb-1">
                  {m.senderRole === 'CUSTOMER' ? 'You' : 'Support Team'} · {new Date(m.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-gray-800">{m.body}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              className="border border-gray-300 p-2.5 rounded-lg flex-1 text-sm"
              placeholder="Type your message..."
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>

        {/* Case status footer — no internal details exposed */}
        <div className="text-xs text-gray-400 text-center">
          <p>Case created: {new Date(caseData.createdAt).toLocaleDateString()}</p>
          <p>Last updated: {new Date(caseData.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
