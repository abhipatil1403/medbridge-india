'use client';
import React, { useEffect, useState } from 'react';
import { getCaseById } from '../../../../features/cases/caseService';
import { getCaseMessages, sendCaseMessage } from '../../../../features/cases/messageService';
import { Case, CaseMessage } from '../../../../types/models';
import { useAuth } from '../../../../components/AuthProvider';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { useParams } from 'next/navigation';

export default function CaseDetailPage() {
  const { id } = useParams() as { id: string };
  const { currentUser } = useAuth();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (currentUser && id) {
      try {
        const data = await getCaseById(id, currentUser.uid);
        setCaseData(data);
        const ms = await getCaseMessages(id);
        setMessages(ms);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => { load(); }, [id, currentUser]);

  const handleSend = async () => {
    if (!currentUser || !caseData || !newMessage) return;
    await sendCaseMessage(caseData.id!, currentUser.uid, 'CUSTOMER', newMessage);
    setNewMessage('');
    await load();
  };

  if (loading) return <div className="p-4">Loading case details...</div>;
  if (!caseData) return <div className="p-4">Case not found or unauthorized.</div>;

  return (
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <div className="max-w-3xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Case {caseData.humanReference}</h1>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {caseData.currentStage.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="bg-white border rounded shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Treatment Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500 mb-1">Treatment</p><p className="font-medium">{caseData.treatmentId}</p></div>
            <div><p className="text-gray-500 mb-1">Budget</p><p className="font-medium">{caseData.budget || 'N/A'}</p></div>
          </div>
        </div>

        <div className="bg-white border rounded shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Messages</h2>
          <div className="space-y-4 mb-4 max-h-60 overflow-y-auto p-2">
            {messages.map(m => (
              <div key={m.id} className={`p-3 rounded max-w-[85%] ${m.senderRole === 'CUSTOMER' ? 'bg-blue-50 ml-auto border border-blue-100' : 'bg-gray-100 mr-auto border border-gray-200'}`}>
                <p className="text-xs text-gray-500 mb-1">{m.senderRole === 'CUSTOMER' ? 'You' : 'Support Team'} - {new Date(m.createdAt).toLocaleString()}</p>
                <p className="text-sm">{m.body}</p>
              </div>
            ))}
            {messages.length === 0 && <p className="text-sm text-gray-500">No messages yet.</p>}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} className="border p-2 rounded flex-1" placeholder="Type your message..." />
            <button onClick={handleSend} className="bg-blue-600 text-white px-4 rounded">Send</button>
          </div>
        </div>
        
      </div>
    </ProtectedRoute>
  );
}
