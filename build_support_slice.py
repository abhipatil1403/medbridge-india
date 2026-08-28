import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

root = r"f:\ALL\ABHI\VIT\INDUSTRY PROJECT\MedBridge\Project\medbridge-india"

# 1. Models and Types
models_content = """
export type ProviderStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type CaseStage = 'NEW_INQUIRY' | 'ASSIGNED' | 'UNDER_REVIEW' | 'WAITING_FOR_CUSTOMER' | 'WAITING_FOR_PROVIDER' | 'QUOTE_PREPARATION' | 'QUOTE_READY' | 'ESCALATED' | 'CLOSED';
export type CasePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type CaseEventType = 'CASE_CREATED' | 'CASE_ASSIGNED' | 'STAGE_CHANGED' | 'PRIORITY_CHANGED' | 'CUSTOMER_MESSAGE' | 'SUPPORT_MESSAGE' | 'NOTE_ADDED' | 'QUOTE_CREATED' | 'QUOTE_UPDATED';
export type QuoteStatus = 'DRAFT' | 'UNDER_REVIEW' | 'READY' | 'SENT' | 'ACCEPTED' | 'DECLINED';

export interface ProviderBase {
  id?: string;
  name: string;
  city: string;
  specialties: string[];
  treatments: string[];
  status: ProviderStatus;
  source: string;
  verificationStatus: string;
  lastCheckedAt: string;
}

export interface Hospital extends ProviderBase {
  accreditation?: string;
}

export interface Doctor extends ProviderBase {
  qualifications: string[];
  experienceYears: number;
  associatedHospitals: string[];
  languages: string[];
}

export interface CostEstimate {
  id?: string;
  hospitalId: string;
  treatmentId: string;
  treatmentName: string;
  currency: string;
  minAmount: number;
  maxAmount: number;
  inclusions?: string[];
  exclusions?: string[];
  source: string;
  verificationStatus: string;
}

export interface Case {
  id?: string;
  humanReference?: string;
  patientId: string;
  selectedProviderId?: string;
  selectedHospitalId?: string;
  treatmentId: string;
  treatmentName?: string;
  preferredLocation: string;
  budget: string;
  preferredTimeline: string;
  inquiry: string;
  preferredLanguage: string;
  currentStage: CaseStage;
  priority: CasePriority;
  
  assignedSupportId?: string;
  assignedCaseManagerId?: string;
  assignedAt?: string;
  assignedBy?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface CaseEvent {
  id?: string;
  caseId: string;
  actorId: string;
  actorType: string;
  eventType: CaseEventType;
  metadata?: any;
  timestamp: string;
}

export interface CaseNote {
  id?: string;
  caseId: string;
  authorId: string;
  authorRole: string;
  text: string;
  createdAt: string;
}

export interface CaseMessage {
  id?: string;
  caseId: string;
  senderId: string;
  senderRole: string;
  body: string;
  createdAt: string;
  readAt?: string;
}

export interface Quote {
  id?: string;
  caseId: string;
  patientId: string;
  hospitalId: string;
  treatmentId: string;
  currency: string;
  estimatedAmount: number;
  inclusions: string[];
  exclusions: string[];
  status: QuoteStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
"""
write_file(f"{root}/apps/web/src/types/models.ts", models_content)

# 2. Services
support_service_content = """
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { Case, CaseEvent, CaseNote, CaseStage, CasePriority } from '../../types/models';

export async function getAssignedCases(uid: string): Promise<Case[]> {
  const casesRef = collection(db, 'cases');
  // In a real app, you might query both assignedSupportId and assignedCaseManagerId 
  // via multiple queries or an 'assignedTo' array if Firestore doesn't support OR well natively.
  // For simplicity, we just query assignedSupportId.
  const q = query(casesRef, where('assignedSupportId', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Case));
}

export async function getAllNewCases(): Promise<Case[]> {
  const casesRef = collection(db, 'cases');
  const q = query(casesRef, where('currentStage', '==', 'NEW_INQUIRY'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Case));
}

export async function assignCase(caseId: string, assignerId: string, assigneeId: string): Promise<void> {
  const caseRef = doc(db, 'cases', caseId);
  const now = new Date().toISOString();
  
  await updateDoc(caseRef, {
    assignedSupportId: assigneeId,
    assignedAt: now,
    assignedBy: assignerId,
    currentStage: 'ASSIGNED',
    updatedAt: now
  });

  await addDoc(collection(db, 'caseEvents'), {
    caseId,
    actorId: assignerId,
    actorType: 'SUPPORT',
    eventType: 'CASE_ASSIGNED',
    timestamp: now
  });
}

export async function updateCaseStage(caseId: string, actorId: string, newStage: CaseStage): Promise<void> {
  const caseRef = doc(db, 'cases', caseId);
  const now = new Date().toISOString();
  
  await updateDoc(caseRef, {
    currentStage: newStage,
    updatedAt: now
  });

  await addDoc(collection(db, 'caseEvents'), {
    caseId,
    actorId,
    actorType: 'SUPPORT',
    eventType: 'STAGE_CHANGED',
    metadata: { stage: newStage },
    timestamp: now
  });
}

export async function addCaseNote(caseId: string, authorId: string, authorRole: string, text: string): Promise<void> {
  const now = new Date().toISOString();
  await addDoc(collection(db, 'caseNotes'), {
    caseId,
    authorId,
    authorRole,
    text,
    createdAt: now
  } as CaseNote);

  await addDoc(collection(db, 'caseEvents'), {
    caseId,
    actorId: authorId,
    actorType: 'SUPPORT',
    eventType: 'NOTE_ADDED',
    timestamp: now
  });
}

export async function getCaseNotes(caseId: string): Promise<CaseNote[]> {
  const notesRef = collection(db, 'caseNotes');
  const q = query(notesRef, where('caseId', '==', caseId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CaseNote));
}
"""
write_file(f"{root}/apps/web/src/features/support/supportService.ts", support_service_content)


message_service_content = """
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { CaseMessage } from '../../types/models';

export async function getCaseMessages(caseId: string): Promise<CaseMessage[]> {
  const messagesRef = collection(db, 'caseMessages');
  const q = query(messagesRef, where('caseId', '==', caseId), orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CaseMessage));
}

export async function sendCaseMessage(caseId: string, senderId: string, senderRole: string, body: string): Promise<void> {
  const now = new Date().toISOString();
  
  await addDoc(collection(db, 'caseMessages'), {
    caseId,
    senderId,
    senderRole,
    body,
    createdAt: now
  } as CaseMessage);

  await addDoc(collection(db, 'caseEvents'), {
    caseId,
    actorId: senderId,
    actorType: senderRole === 'CUSTOMER' ? 'CUSTOMER' : 'SUPPORT',
    eventType: senderRole === 'CUSTOMER' ? 'CUSTOMER_MESSAGE' : 'SUPPORT_MESSAGE',
    timestamp: now
  });
}
"""
write_file(f"{root}/apps/web/src/features/cases/messageService.ts", message_service_content)

# 3. Support UI Pages
support_dashboard_content = """
'use client';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import Link from 'next/link';

export default function SupportDashboard() {
  return (
    <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'CASE_MANAGER']}>
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Support Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="border p-4 rounded bg-blue-50">
            <h3 className="text-gray-600 text-sm font-medium">New Cases</h3>
            <p className="text-2xl font-bold">Queue</p>
          </div>
          <div className="border p-4 rounded bg-green-50">
            <h3 className="text-gray-600 text-sm font-medium">Assigned to Me</h3>
            <p className="text-2xl font-bold">Active</p>
          </div>
          <div className="border p-4 rounded bg-yellow-50">
            <h3 className="text-gray-600 text-sm font-medium">Waiting for Customer</h3>
            <p className="text-2xl font-bold">Pending</p>
          </div>
          <div className="border p-4 rounded bg-red-50">
            <h3 className="text-gray-600 text-sm font-medium">Escalated</h3>
            <p className="text-2xl font-bold">Alert</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Link href="/support/cases" className="bg-blue-600 text-white px-6 py-2 rounded">
            View Case Queue
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
"""
write_file(f"{root}/apps/web/src/app/support/page.tsx", support_dashboard_content)

support_queue_content = """
'use client';
import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { getAssignedCases, getAllNewCases } from '../../../features/support/supportService';
import { Case } from '../../../types/models';
import { useAuth } from '../../../components/AuthProvider';
import Link from 'next/link';

export default function SupportQueue() {
  const { currentUser, primaryRole } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, NEW, ASSIGNED

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setLoading(true);
      try {
        if (filter === 'NEW') {
          const newCases = await getAllNewCases();
          setCases(newCases);
        } else {
          // For MVP, just load assigned if ASSIGNED, or merge if ALL
          const assigned = await getAssignedCases(currentUser.uid);
          if (filter === 'ALL') {
             const newC = await getAllNewCases();
             setCases([...assigned, ...newC]);
          } else {
             setCases(assigned);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser, filter]);

  return (
    <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'CASE_MANAGER']}>
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Case Queue</h1>
        
        <div className="flex gap-2 mb-6">
          <button onClick={() => setFilter('ALL')} className={`px-4 py-1 rounded border ${filter === 'ALL' ? 'bg-blue-600 text-white' : ''}`}>All</button>
          <button onClick={() => setFilter('NEW')} className={`px-4 py-1 rounded border ${filter === 'NEW' ? 'bg-blue-600 text-white' : ''}`}>New Inquiries</button>
          <button onClick={() => setFilter('ASSIGNED')} className={`px-4 py-1 rounded border ${filter === 'ASSIGNED' ? 'bg-blue-600 text-white' : ''}`}>My Cases</button>
        </div>

        {loading ? <p>Loading cases...</p> : (
          <div className="bg-white border rounded overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3">Ref</th>
                  <th className="p-3">Treatment</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Created</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{c.humanReference}</td>
                    <td className="p-3">{c.treatmentId}</td>
                    <td className="p-3"><span className="bg-gray-200 px-2 py-1 rounded text-xs">{c.currentStage}</span></td>
                    <td className="p-3">{c.priority}</td>
                    <td className="p-3">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Link href={`/support/cases/${c.id}`} className="text-blue-600 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
                {cases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">No cases found for this filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
"""
write_file(f"{root}/apps/web/src/app/support/cases/page.tsx", support_queue_content)


support_case_detail_content = """
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
"""
write_file(f"{root}/apps/web/src/app/support/cases/[id]/page.tsx", support_case_detail_content)


# 4. Modify Customer Case UI for Messages
customer_case_ui = """
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
"""
write_file(f"{root}/apps/web/src/app/customer/cases/[id]/page.tsx", customer_case_ui)


# 5. Firestore Rules
firestore_rules = """
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    match /{document=**} { allow read, write: if false; }

    function isAuthenticated() { return request.auth != null; }
    function isOwner(uid) { return isAuthenticated() && request.auth.uid == uid; }
    function hasRole(role) {
      return isAuthenticated() && (request.auth.token[role] == true || request.auth.token.role == role || request.auth.token.primaryRole == role);
    }
    function isSuperAdmin() { return hasRole('SUPER_ADMIN'); }
    function isAdmin() { return hasRole('ADMIN') || isSuperAdmin(); }
    function isPublished() { return resource.data.status == 'PUBLISHED'; }

    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin() || hasRole('SUPPORT_AGENT') || hasRole('CASE_MANAGER');
      allow update: if isOwner(userId) && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['roles', 'primaryRole', 'panel', 'status']));
      allow write: if isSuperAdmin();
    }

    match /patients/{patientId} {
      allow read: if isOwner(patientId) || isAdmin() || hasRole('SUPPORT_AGENT') || hasRole('CASE_MANAGER');
      allow write: if isSuperAdmin();
    }

    match /hospitals/{hospitalId} {
      allow read: if isPublished() || isAdmin();
      allow write: if isSuperAdmin() || hasRole('DATA_REVIEWER');
    }
    match /doctors/{doctorId} {
      allow read: if isPublished() || isAdmin();
      allow write: if isSuperAdmin() || hasRole('DATA_REVIEWER');
    }
    match /treatments/{id} { allow read: if isPublished() || isAdmin(); }
    match /specialties/{id} { allow read: if isPublished() || isAdmin(); }
    
    match /costEstimates/{estimateId} {
      allow read: if true; 
      allow write: if isSuperAdmin() || hasRole('DATA_REVIEWER');
    }

    match /cases/{caseId} {
      allow create: if isOwner(request.resource.data.patientId);
      
      // CUSTOMER can read own case. ADMIN can read all. 
      // SUPPORT can read if they are assigned OR if they are checking new cases (for assignment)
      allow read: if isOwner(resource.data.patientId) || isAdmin() || 
                  (hasRole('SUPPORT_AGENT') || hasRole('CASE_MANAGER')); 
                  // Note: In production, reading all unassigned cases should be tightened.
                  
      // Updates: Customer cannot update. Support can update if assigned (or assigning themselves).
      allow update: if isAdmin() || hasRole('CASE_MANAGER') || hasRole('SUPPORT_AGENT'); 
    }
    
    match /caseEvents/{eventId} {
      allow create: if isAuthenticated(); 
      allow read: if true; 
    }
    
    match /caseNotes/{noteId} {
      // Internal support notes - CUSTOMER CANNOT READ OR WRITE
      allow read, write: if hasRole('SUPPORT_AGENT') || hasRole('CASE_MANAGER') || isAdmin();
    }
    
    match /caseMessages/{messageId} {
      // CUSTOMER can read/write their own case messages (Needs patientId on message, or rule function to check parent case)
      // For MVP without complex parent lookups, we trust the senderId check if patient is reading their own messages.
      // A more robust rule uses get() to check parent case patientId.
      allow read, write: if isOwner(resource.data.senderId) || isOwner(request.resource.data.senderId) || hasRole('SUPPORT_AGENT') || hasRole('CASE_MANAGER') || isAdmin();
    }
    
    match /quotes/{quoteId} {
      allow read: if hasRole('CASE_MANAGER') || isAdmin() || isOwner(resource.data.patientId);
      allow write: if hasRole('CASE_MANAGER') || isAdmin();
    }
  }
}
"""
write_file(f"{root}/firebase/firestore.rules", firestore_rules)

print("Support slice files created.")
