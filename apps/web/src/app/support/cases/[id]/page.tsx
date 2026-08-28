'use client';
import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { getCaseById } from '../../../../features/cases/caseService';
import { updateCaseStage, assignCase, getCaseNotes, addCaseNote } from '../../../../features/support/supportService';
import { getCaseMessages, sendCaseMessage } from '../../../../features/cases/messageService';
import { Case, CaseNote, CaseMessage, CaseStage } from '../../../../types/models';
import { useAuth } from '../../../../components/AuthProvider';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase/client';

export default function SupportCaseDetail() {
  const { id } = useParams() as { id: string };
  const { currentUser, primaryRole } = useAuth();
  
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const loadCase = async () => {
    if (!id || !currentUser) return;
    try {
      const docRef = doc(db, 'cases', id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setCaseData({ id: snapshot.id, ...snapshot.data() } as Case);
        const ns = await getCaseNotes(id);
        setNotes(ns);
        const ms = await getCaseMessages(id);
        setMessages(ms);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCase(); }, [id, currentUser]);

  const handleAssignToMe = async () => {
    if (!currentUser || !caseData) return;
    await assignCase(caseData.id!, currentUser.uid, currentUser.uid);
    await loadCase();
  };

  const handleStageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!currentUser || !caseData) return;
    await updateCaseStage(caseData.id!, currentUser.uid, e.target.value as CaseStage);
    await loadCase();
  };

  const handleAddNote = async () => {
    if (!currentUser || !caseData || !newNote) return;
    await addCaseNote(caseData.id!, currentUser.uid, primaryRole || 'SUPPORT_AGENT', newNote);
    setNewNote('');
    await loadCase();
  };

  const handleSendMessage = async () => {
    if (!currentUser || !caseData || !newMessage) return;
    await sendCaseMessage(caseData.id!, currentUser.uid, primaryRole || 'SUPPORT_AGENT', newMessage);
    setNewMessage('');
    await loadCase();
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!caseData) return <div className="p-4">Case not found.</div>;

  return (
    <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'CASE_MANAGER']}>
      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border p-6 rounded">
             <div className="flex justify-between items-center mb-4">
               <h1 className="text-2xl font-bold">Case: {caseData.humanReference}</h1>
               <select value={caseData.currentStage} onChange={handleStageChange} className="border rounded p-1 text-sm bg-gray-50">
                 <option value="NEW_INQUIRY">NEW_INQUIRY</option>
                 <option value="ASSIGNED">ASSIGNED</option>
                 <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                 <option value="WAITING_FOR_CUSTOMER">WAITING_FOR_CUSTOMER</option>
                 <option value="QUOTE_PREPARATION">QUOTE_PREPARATION</option>
                 <option value="CLOSED">CLOSED</option>
               </select>
             </div>
             
             <div className="grid grid-cols-2 gap-4 text-sm mb-4">
               <div><span className="text-gray-500">Treatment:</span> {caseData.treatmentId}</div>
               <div><span className="text-gray-500">Provider:</span> {caseData.selectedHospitalId}</div>
               <div><span className="text-gray-500">Budget:</span> {caseData.budget}</div>
               <div><span className="text-gray-500">Location:</span> {caseData.preferredLocation}</div>
             </div>
             <div>
               <p className="text-gray-500 text-sm">Customer Inquiry:</p>
               <p className="text-sm bg-gray-50 p-2 rounded">{caseData.inquiry}</p>
             </div>
          </div>

          <div className="bg-white border p-6 rounded">
             <h2 className="text-lg font-bold mb-4">Customer Messages</h2>
             <div className="space-y-4 mb-4 max-h-60 overflow-y-auto bg-gray-50 p-4 rounded">
               {messages.map(m => (
                 <div key={m.id} className={`p-2 rounded max-w-[80%] ${m.senderRole === 'CUSTOMER' ? 'bg-blue-100 mr-auto' : 'bg-green-100 ml-auto'}`}>
                   <p className="text-xs text-gray-500">{m.senderRole} - {new Date(m.createdAt).toLocaleString()}</p>
                   <p className="text-sm">{m.body}</p>
                 </div>
               ))}
               {messages.length === 0 && <p className="text-sm text-gray-500">No messages yet.</p>}
             </div>
             <div className="flex gap-2">
               <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} className="border p-2 rounded flex-1" placeholder="Type a message to the customer..." />
               <button onClick={handleSendMessage} className="bg-blue-600 text-white px-4 rounded">Send</button>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border p-4 rounded">
             <h3 className="font-bold mb-2">Assignment</h3>
             <p className="text-sm mb-2">Assigned To: {caseData.assignedSupportId || 'Unassigned'}</p>
             {!caseData.assignedSupportId && (
               <button onClick={handleAssignToMe} className="bg-gray-800 text-white px-3 py-1 rounded text-sm w-full">Assign to Me</button>
             )}
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
             <h3 className="font-bold mb-2 text-yellow-800">Internal Notes</h3>
             <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
               {notes.map(n => (
                 <div key={n.id} className="bg-white p-2 rounded border text-xs">
                   <p className="text-gray-500">{new Date(n.createdAt).toLocaleDateString()} - {n.authorRole}</p>
                   <p>{n.text}</p>
                 </div>
               ))}
             </div>
             <textarea value={newNote} onChange={e => setNewNote(e.target.value)} className="w-full border p-2 rounded text-sm mb-2" placeholder="Add an internal note..."></textarea>
             <button onClick={handleAddNote} className="bg-yellow-600 text-white px-3 py-1 rounded text-sm w-full">Add Note</button>
          </div>
        </div>

      </div>
    </ProtectedRoute>
  );
}
