'use client';

import React, { useEffect, useState } from 'react';
import { getCaseById, getCaseEvents, acceptQuote, declineQuote } from '../../../../features/cases/caseService';
import { getCaseMessages, sendCaseMessage } from '../../../../features/cases/messageService';
import { getCaseQuotes } from '../../../../features/support/supportService'; // We can use this to fetch quotes since backend rules protect it. Actually let's use it.
import { Case, CaseMessage, CaseEvent, Quote, STAGE_LABELS } from '../../../../types/models';
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
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actioningQuote, setActioningQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (currentUser && id) {
      try {
        const data = await getCaseById(id, currentUser.uid);
        setCaseData(data);
        if (data) {
          const [ms, ev, qs] = await Promise.all([
            getCaseMessages(id),
            getCaseEvents(id),
            getCaseQuotes(id),
          ]);
          setMessages(ms);
          
          // Filter customer-safe events
          const safeTypes = ['CASE_CREATED', 'SUPPORT_RESPONSE', 'QUOTE_READY', 'QUOTE_SENT', 'QUOTE_ACCEPTED', 'QUOTE_DECLINED', 'CASE_CLOSED'];
          setEvents(ev.filter(e => safeTypes.includes(e.eventType) || (e.actorRole === 'CUSTOMER' && e.eventType === 'CUSTOMER_MESSAGE')));
          
          setQuotes(qs.filter(q => ['READY', 'SENT', 'ACCEPTED', 'DECLINED'].includes(q.status)));
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

  const handleQuoteAction = async (quoteId: string, action: 'ACCEPT' | 'DECLINE') => {
    if (!currentUser || !caseData) return;
    setActioningQuote(true);
    setError(null);
    try {
      if (action === 'ACCEPT') {
        await acceptQuote(quoteId, caseData.id!, currentUser.uid);
      } else {
        await declineQuote(quoteId, caseData.id!, currentUser.uid);
      }
      // Reload quotes
      const qs = await getCaseQuotes(caseData.id!);
      setQuotes(qs.filter(q => ['READY', 'SENT', 'ACCEPTED', 'DECLINED'].includes(q.status)));
    } catch (err) {
      setError('Unable to process quote action. Please try again.');
      console.error(err);
    } finally {
      setActioningQuote(false);
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

        {/* Quotes Section */}
        {quotes.length > 0 && (
          <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2 text-gray-900">Available Quotes</h2>
            <div className="space-y-4">
              {quotes.map(quote => (
                <div key={quote.id} className="border p-4 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{quote.currency} {quote.estimatedAmount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Status: <span className="font-medium">{quote.status}</span></p>
                    </div>
                    {quote.status === 'SENT' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleQuoteAction(quote.id!, 'DECLINE')}
                          disabled={actioningQuote}
                          className="px-4 py-1.5 border border-red-200 text-red-600 rounded-md text-sm hover:bg-red-50 disabled:opacity-50"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleQuoteAction(quote.id!, 'ACCEPT')}
                          disabled={actioningQuote}
                          className="px-4 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          Accept
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {quote.inclusions.length > 0 && (
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Inclusions</p>
                        <ul className="list-disc list-inside text-gray-700">
                          {quote.inclusions.map((inc, i) => <li key={i}>{inc}</li>)}
                        </ul>
                      </div>
                    )}
                    {quote.exclusions.length > 0 && (
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Exclusions</p>
                        <ul className="list-disc list-inside text-gray-700">
                          {quote.exclusions.map((exc, i) => <li key={i}>{exc}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Section */}
        <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2 text-gray-900">Case Timeline</h2>
          {events.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No events to display.</p>
          ) : (
            <div className="space-y-4">
              {events.map((ev, i) => (
                <div key={ev.id || i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5" />
                    {i < events.length - 1 && <div className="w-px flex-1 bg-gray-200" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-900">
                      {ev.eventType.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(ev.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
