'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { useAuth } from '../../../../components/AuthProvider';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCaseByIdForSupport, getCaseEvents } from '../../../../features/cases/caseService';
import {
  updateCaseStage,
  updateCasePriority,
  assignCase,
  getCaseNotes,
  addCaseNote,
  getCaseQuotes,
  createQuoteDraft,
  updateQuoteDraft,
  isValidStageTransition,
} from '../../../../features/support/supportService';
import { getCaseMessages, sendCaseMessage } from '../../../../features/cases/messageService';
import {
  Case,
  CaseEvent,
  CaseNote,
  CaseMessage,
  CaseStage,
  CasePriority,
  Quote,
  STAGE_TRANSITIONS,
  STAGE_LABELS,
  STAGE_CONFIG,
  PRIORITY_CONFIG,
} from '../../../../types/models';

type Tab = 'overview' | 'messages' | 'notes' | 'timeline' | 'quote';

export default function SupportCaseDetail() {
  const { id } = useParams() as { id: string };
  const { currentUser, primaryRole } = useAuth();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Form states
  const [newNote, setNewNote] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sendingNote, setSendingNote] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Quote form
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteCurrency, setQuoteCurrency] = useState('USD');
  const [quoteInclusions, setQuoteInclusions] = useState('');
  const [quoteExclusions, setQuoteExclusions] = useState('');
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [savingQuote, setSavingQuote] = useState(false);

  const isCaseManagerOrAbove =
    primaryRole === 'CASE_MANAGER' || primaryRole === 'ADMIN' || primaryRole === 'SUPER_ADMIN';

  const loadAll = useCallback(async () => {
    if (!id || !currentUser) return;
    try {
      const c = await getCaseByIdForSupport(id);
      if (!c) {
        setError('Case not found or you do not have access.');
        setLoading(false);
        return;
      }
      setCaseData(c);

      const [ev, ns, ms, qs] = await Promise.all([
        getCaseEvents(id),
        getCaseNotes(id),
        getCaseMessages(id),
        getCaseQuotes(id),
      ]);
      setEvents(ev);
      setNotes(ns);
      setMessages(ms);
      setQuotes(qs);

      // Remove pre-fill logic from initial load, we will use a selected quote for editing
    } catch (err) {
      setError('Unable to load case details. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, currentUser]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Handlers ─────────────────────────────────────────────────────

  const handleAssignToMe = async () => {
    if (!currentUser || !caseData || !isCaseManagerOrAbove) return;
    setAssigning(true);
    try {
      await assignCase(caseData.id!, currentUser.uid, primaryRole || 'CASE_MANAGER', currentUser.uid);
      await loadAll();
    } catch (err) {
      setError('Assignment failed. You may not have permission.');
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  const handleStageChange = async (newStage: CaseStage) => {
    if (!currentUser || !caseData) return;
    if (!isValidStageTransition(caseData.currentStage, newStage)) {
      setError(`Invalid transition: ${STAGE_LABELS[caseData.currentStage]} → ${STAGE_LABELS[newStage]}`);
      return;
    }
    setUpdatingStage(true);
    setError(null);
    try {
      await updateCaseStage(caseData.id!, currentUser.uid, primaryRole || 'SUPPORT_AGENT', caseData.currentStage, newStage);
      await loadAll();
    } catch (err) {
      setError('Stage update failed. Please try again.');
      console.error(err);
    } finally {
      setUpdatingStage(false);
    }
  };

  const handlePriorityChange = async (newPriority: CasePriority) => {
    if (!currentUser || !caseData) return;
    setUpdatingPriority(true);
    setError(null);
    try {
      await updateCasePriority(caseData.id!, currentUser.uid, primaryRole || 'SUPPORT_AGENT', caseData.priority, newPriority);
      await loadAll();
    } catch (err) {
      setError('Priority update failed. Please try again.');
      console.error(err);
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleAddNote = async () => {
    if (!currentUser || !caseData || !newNote.trim()) return;
    setSendingNote(true);
    try {
      await addCaseNote(caseData.id!, currentUser.uid, primaryRole || 'SUPPORT_AGENT', newNote);
      setNewNote('');
      await loadAll();
    } catch (err) {
      setError('Note creation failed.');
      console.error(err);
    } finally {
      setSendingNote(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentUser || !caseData || !newMessage.trim()) return;
    setSendingMessage(true);
    try {
      await sendCaseMessage(caseData.id!, currentUser.uid, primaryRole || 'SUPPORT_AGENT', newMessage);
      setNewMessage('');
      await loadAll();
    } catch (err) {
      setError('Message send failed.');
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEditQuote = (quote: Quote) => {
    setEditingQuoteId(quote.id!);
    setQuoteAmount(String(quote.estimatedAmount || ''));
    setQuoteCurrency(quote.currency || 'USD');
    setQuoteInclusions((quote.inclusions || []).join(', '));
    setQuoteExclusions((quote.exclusions || []).join(', '));
  };

  const handleNewQuote = () => {
    setEditingQuoteId(null);
    setQuoteAmount('');
    setQuoteCurrency('USD');
    setQuoteInclusions('');
    setQuoteExclusions('');
  };

  const handleSaveQuote = async (status?: 'DRAFT' | 'UNDER_REVIEW' | 'READY' | 'SENT') => {
    if (!currentUser || !caseData || !isCaseManagerOrAbove) return;
    setSavingQuote(true);
    setError(null);
    try {
      const inclusions = quoteInclusions.split(',').map(s => s.trim()).filter(Boolean);
      const exclusions = quoteExclusions.split(',').map(s => s.trim()).filter(Boolean);
      const amount = parseFloat(quoteAmount) || 0;

      if (editingQuoteId) {
        const quoteToUpdate = quotes.find(q => q.id === editingQuoteId);
        await updateQuoteDraft(editingQuoteId, caseData.id!, currentUser.uid, primaryRole || 'CASE_MANAGER', {
          estimatedAmount: amount,
          currency: quoteCurrency,
          inclusions,
          exclusions,
          status: status || quoteToUpdate?.status || 'DRAFT',
        });
      } else {
        await createQuoteDraft(
          caseData.id!,
          caseData.patientId,
          currentUser.uid,
          primaryRole || 'CASE_MANAGER',
          {
            hospitalId: caseData.selectedHospitalId || '',
            treatmentId: caseData.treatmentId,
            currency: quoteCurrency,
            estimatedAmount: amount,
            inclusions,
            exclusions,
          }
        );
      }
      setEditingQuoteId(null);
      await loadAll();
    } catch (err) {
      setError('Quote save failed.');
      console.error(err);
    } finally {
      setSavingQuote(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'CASE_MANAGER', 'ADMIN', 'SUPER_ADMIN']}>
        <div className="max-w-7xl mx-auto p-6 text-center py-12 text-gray-500">Loading case...</div>
      </ProtectedRoute>
    );
  }

  if (!caseData) {
    return (
      <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'CASE_MANAGER', 'ADMIN', 'SUPER_ADMIN']}>
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
            {error || 'Case not found or unauthorized.'}
          </div>
          <Link href="/support/cases" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Case Queue
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  const allowedTransitions = STAGE_TRANSITIONS[caseData.currentStage] || [];

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'messages', label: 'Messages', count: messages.length },
    { key: 'notes', label: 'Internal Notes', count: notes.length },
    { key: 'timeline', label: 'Timeline', count: events.length },
    { key: 'quote', label: 'Quote', count: quotes.length },
  ];

  return (
    <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'CASE_MANAGER', 'ADMIN', 'SUPER_ADMIN']}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <Link href="/support/cases" className="text-blue-600 hover:underline text-sm">
              ← Case Queue
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Case: {caseData.humanReference}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STAGE_CONFIG[caseData.currentStage]?.color || ''}`}>
              {STAGE_LABELS[caseData.currentStage]}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${PRIORITY_CONFIG[caseData.priority]?.color || ''}`}>
              {PRIORITY_CONFIG[caseData.priority]?.label}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="border-b mb-6 flex gap-1 overflow-x-auto">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === t.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{t.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">Customer Request</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500 block mb-0.5">Treatment</span><span className="font-medium">{caseData.treatmentName || caseData.treatmentId}</span></div>
                    <div><span className="text-gray-500 block mb-0.5">Preferred Location</span><span className="font-medium">{caseData.preferredLocation}</span></div>
                    <div><span className="text-gray-500 block mb-0.5">Budget</span><span className="font-medium">{caseData.budget || 'Not specified'}</span></div>
                    <div><span className="text-gray-500 block mb-0.5">Preferred Timeline</span><span className="font-medium">{caseData.preferredTimeline || 'Flexible'}</span></div>
                    <div><span className="text-gray-500 block mb-0.5">Preferred Language</span><span className="font-medium">{caseData.preferredLanguage || 'English'}</span></div>
                    <div><span className="text-gray-500 block mb-0.5">Created</span><span className="font-medium">{new Date(caseData.createdAt).toLocaleString()}</span></div>
                  </div>
                  {caseData.inquiry && (
                    <div className="mt-4">
                      <span className="text-gray-500 text-sm block mb-1">Customer Inquiry</span>
                      <p className="bg-gray-50 p-3 rounded text-sm text-gray-800 border">{caseData.inquiry}</p>
                    </div>
                  )}
                </div>

                {(caseData.selectedHospitalId || caseData.selectedProviderId) && (
                  <div className="bg-white border rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Selected Provider</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500 block mb-0.5">Hospital ID</span><span className="font-medium">{caseData.selectedHospitalId || '—'}</span></div>
                      <div><span className="text-gray-500 block mb-0.5">Provider ID</span><span className="font-medium">{caseData.selectedProviderId || '—'}</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Messages */}
            {activeTab === 'messages' && (
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Customer Conversation</h2>
                <div className="space-y-3 mb-4 max-h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg border">
                  {messages.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No messages yet. Start the conversation below.</p>
                  )}
                  {messages.map(m => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-lg max-w-[80%] ${
                        m.senderRole === 'CUSTOMER'
                          ? 'bg-blue-50 border border-blue-100 mr-auto'
                          : 'bg-green-50 border border-green-100 ml-auto'
                      }`}
                    >
                      <p className="text-xs text-gray-500 mb-1">
                        {m.senderRole === 'CUSTOMER' ? 'Customer' : 'Support'} · {new Date(m.createdAt).toLocaleString()}
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
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className="border border-gray-300 p-2.5 rounded-lg flex-1 text-sm"
                    placeholder="Write a message to the customer..."
                    disabled={sendingMessage}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Internal Notes */}
            {activeTab === 'notes' && (
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Internal Notes</h2>
                  <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded font-medium">Staff Only</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">These notes are not visible to the customer.</p>

                <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                  {notes.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded">No internal notes yet.</p>
                  )}
                  {notes.map(n => (
                    <div key={n.id} className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">
                        {n.authorRole} · {new Date(n.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-800">{n.text}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    className="w-full border border-gray-300 p-2.5 rounded-lg text-sm mb-2"
                    rows={3}
                    placeholder="Add an internal note..."
                    disabled={sendingNote}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={sendingNote || !newNote.trim()}
                    className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {sendingNote ? 'Adding...' : 'Add Note'}
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Timeline */}
            {activeTab === 'timeline' && (
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Case Timeline</h2>
                {events.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No events recorded.</p>
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
                          {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                            <p className="text-xs text-gray-600 mt-0.5">
                              {Object.entries(ev.metadata).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {ev.actorRole} · {new Date(ev.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Quote */}
            {activeTab === 'quote' && (
              <div className="bg-white border rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Quotes</h2>
                  {isCaseManagerOrAbove && (
                    <button
                      onClick={handleNewQuote}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      + New Quote
                    </button>
                  )}
                </div>
                
                {/* Existing Quotes List */}
                {quotes.length > 0 && (
                  <div className="space-y-4 mb-6">
                    {quotes.map(quote => (
                      <div key={quote.id} className="border p-4 rounded-lg bg-gray-50 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{quote.currency} {quote.estimatedAmount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Status: <span className="font-medium">{quote.status}</span></p>
                          <p className="text-xs text-gray-400">Updated: {new Date(quote.updatedAt).toLocaleString()}</p>
                        </div>
                        {isCaseManagerOrAbove && ['DRAFT', 'UNDER_REVIEW', 'READY'].includes(quote.status) && (
                          <button
                            onClick={() => handleEditQuote(quote)}
                            className="bg-white border hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {isCaseManagerOrAbove && quote.status === 'READY' && (
                          <button
                            onClick={() => { handleEditQuote(quote); handleSaveQuote('SENT'); }}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                          >
                            Send to Customer
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {quotes.length === 0 && !editingQuoteId && (
                  <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded mb-6">No quotes have been created yet.</p>
                )}

                {/* Quote Form */}
                {isCaseManagerOrAbove && (editingQuoteId !== null || quotes.length === 0 || quoteAmount !== '') && (
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-md font-semibold mb-4 text-gray-900">
                      {editingQuoteId ? 'Edit Quote' : 'Create New Quote'}
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Amount</label>
                          <input
                            type="number"
                            value={quoteAmount}
                            onChange={e => setQuoteAmount(e.target.value)}
                            className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                            placeholder="e.g., 15000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                          <select
                            value={quoteCurrency}
                            onChange={e => setQuoteCurrency(e.target.value)}
                            className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                          >
                            <option value="USD">USD</option>
                            <option value="INR">INR</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Inclusions (comma-separated)</label>
                        <input
                          type="text"
                          value={quoteInclusions}
                          onChange={e => setQuoteInclusions(e.target.value)}
                          className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                          placeholder="e.g., Surgery, Hospital Stay, Post-op Care"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exclusions (comma-separated)</label>
                        <input
                          type="text"
                          value={quoteExclusions}
                          onChange={e => setQuoteExclusions(e.target.value)}
                          className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                          placeholder="e.g., Travel, Visa, Accommodation"
                        />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleSaveQuote('DRAFT')}
                          disabled={savingQuote}
                          className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          {savingQuote ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button
                          onClick={() => handleSaveQuote('UNDER_REVIEW')}
                          disabled={savingQuote}
                          className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Mark Under Review
                        </button>
                        <button
                          onClick={() => handleSaveQuote('READY')}
                          disabled={savingQuote}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Mark Ready
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Assignment */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Assignment</h3>
              <div className="text-sm space-y-2">
                <div>
                  <span className="text-gray-500 block text-xs">Support Agent</span>
                  <span className="font-medium">{caseData.assignedSupportId || 'Unassigned'}</span>
                </div>
                {caseData.assignedCaseManagerId && (
                  <div>
                    <span className="text-gray-500 block text-xs">Case Manager</span>
                    <span className="font-medium">{caseData.assignedCaseManagerId}</span>
                  </div>
                )}
                {caseData.assignedAt && (
                  <div>
                    <span className="text-gray-500 block text-xs">Assigned At</span>
                    <span className="text-xs">{new Date(caseData.assignedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
              {!caseData.assignedSupportId && isCaseManagerOrAbove && (
                <button
                  onClick={handleAssignToMe}
                  disabled={assigning}
                  className="mt-3 w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {assigning ? 'Assigning...' : 'Assign to Me'}
                </button>
              )}
            </div>

            {/* Stage Transitions */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Stage</h3>
              <p className={`text-sm font-medium px-2 py-1 rounded inline-block mb-3 ${STAGE_CONFIG[caseData.currentStage]?.color || ''}`}>
                {STAGE_LABELS[caseData.currentStage]}
              </p>
              {allowedTransitions.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500">Move to:</p>
                  {allowedTransitions.map(stage => (
                    <button
                      key={stage}
                      onClick={() => handleStageChange(stage)}
                      disabled={updatingStage}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs font-medium border transition-colors hover:shadow-sm disabled:opacity-50 ${STAGE_CONFIG[stage]?.color || 'bg-gray-100'}`}
                    >
                      → {STAGE_LABELS[stage]}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No transitions available from this stage.</p>
              )}
            </div>

            {/* Priority */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Priority</h3>
              <select
                value={caseData.priority}
                onChange={e => handlePriorityChange(e.target.value as CasePriority)}
                disabled={updatingPriority}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Case Info */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Case Info</h3>
              <div className="text-xs text-gray-500 space-y-1.5">
                <div><span className="block text-gray-400">Reference</span>{caseData.humanReference}</div>
                <div><span className="block text-gray-400">Patient ID</span><span className="font-mono">{caseData.patientId.slice(0, 8)}...</span></div>
                <div><span className="block text-gray-400">Created</span>{new Date(caseData.createdAt).toLocaleString()}</div>
                <div><span className="block text-gray-400">Updated</span>{new Date(caseData.updatedAt).toLocaleString()}</div>
                {caseData.firstResponseAt && <div><span className="block text-gray-400">First Response SLA</span>{new Date(caseData.firstResponseAt).toLocaleString()}</div>}
                {caseData.quoteSentAt && <div><span className="block text-gray-400">Quote Sent SLA</span>{new Date(caseData.quoteSentAt).toLocaleString()}</div>}
                {caseData.closedAt && <div><span className="block text-gray-400">Closed SLA</span>{new Date(caseData.closedAt).toLocaleString()}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
