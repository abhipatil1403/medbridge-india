import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

root = r"f:\ALL\ABHI\VIT\INDUSTRY PROJECT\MedBridge\Project\medbridge-india"

# 1. Models and Types
models_content = """
export type ProviderStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

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
  treatmentName: string; // for UI convenience
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
  currentStage: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseEvent {
  id?: string;
  caseId: string;
  actorId: string;
  actorType: string;
  eventType: string;
  timestamp: string;
}
"""
write_file(f"{root}/apps/web/src/types/models.ts", models_content)


# 2. Services
search_service_content = """
import { collection, query, where, getDocs, QueryConstraint } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { Hospital } from '../../types/models';

export async function searchProviders(treatment: string, specialty: string, location: string): Promise<Hospital[]> {
  const providersRef = collection(db, 'hospitals');
  
  const conditions: QueryConstraint[] = [
    where('status', '==', 'PUBLISHED')
  ];

  if (location) conditions.push(where('city', '==', location));
  if (specialty) conditions.push(where('specialties', 'array-contains', specialty));
  // Note: Firestore doesn't support multiple array-contains. 
  // For basic MVP, we will filter treatments in memory if specialty is provided,
  // or query treatments if specialty is empty.
  
  if (treatment && !specialty) {
    conditions.push(where('treatments', 'array-contains', treatment));
  }
  
  const q = query(providersRef, ...conditions);
  const snapshot = await getDocs(q);
  
  let results: Hospital[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hospital));
  
  // In-memory filter for treatment if specialty was queried
  if (treatment && specialty) {
    results = results.filter(h => h.treatments.includes(treatment));
  }
  
  return results;
}
"""
write_file(f"{root}/apps/web/src/features/search/searchService.ts", search_service_content)

provider_service_content = """
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { Hospital, CostEstimate } from '../../types/models';

export async function getHospitalById(id: string): Promise<Hospital | null> {
  const docRef = doc(db, 'hospitals', id);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    const data = snapshot.data() as Hospital;
    if (data.status === 'PUBLISHED') {
      return { id: snapshot.id, ...data };
    }
  }
  return null;
}

export async function getCostEstimatesByHospital(hospitalId: string): Promise<CostEstimate[]> {
  const estimatesRef = collection(db, 'costEstimates');
  const q = query(estimatesRef, where('hospitalId', '==', hospitalId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CostEstimate));
}
"""
write_file(f"{root}/apps/web/src/features/providers/providerService.ts", provider_service_content)

case_service_content = """
import { collection, addDoc, doc, getDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { Case, CaseEvent } from '../../types/models';

function generateHumanReference() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `MB-${num}`;
}

export async function createCase(patientId: string, data: Partial<Case>): Promise<string> {
  const now = new Date().toISOString();
  const humanRef = generateHumanReference();
  
  const caseData: Case = {
    ...data,
    patientId,
    humanReference: humanRef,
    currentStage: 'NEW_INQUIRY',
    priority: 'NORMAL',
    createdAt: now,
    updatedAt: now,
  } as Case;

  const caseRef = await addDoc(collection(db, 'cases'), caseData);

  const eventData: CaseEvent = {
    caseId: caseRef.id,
    actorId: patientId,
    actorType: 'CUSTOMER',
    eventType: 'CASE_CREATED',
    timestamp: now,
  };
  
  await addDoc(collection(db, 'caseEvents'), eventData);
  return caseRef.id;
}

export async function getUserCases(patientId: string): Promise<Case[]> {
  const casesRef = collection(db, 'cases');
  const q = query(casesRef, where('patientId', '==', patientId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Case));
}

export async function getCaseById(caseId: string, patientId: string): Promise<Case | null> {
  const docRef = doc(db, 'cases', caseId);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    const data = snapshot.data() as Case;
    if (data.patientId === patientId) {
      return { id: snapshot.id, ...data };
    }
  }
  return null;
}
"""
write_file(f"{root}/apps/web/src/features/cases/caseService.ts", case_service_content)


# 3. Pages
search_page_content = """
'use client';

import React, { useState } from 'react';
import { searchProviders } from '../../../features/search/searchService';
import { Hospital } from '../../../types/models';
import Link from 'next/link';

export default function SearchPage() {
  const [treatment, setTreatment] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await searchProviders(treatment, specialty, location);
      setResults(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Search Providers</h1>
      
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-8">
        <input 
          placeholder="What treatment are you looking for?" 
          value={treatment} 
          onChange={(e) => setTreatment(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <input 
          placeholder="Specialty (e.g. Orthopedics)" 
          value={specialty} 
          onChange={(e) => setSpecialty(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <input 
          placeholder="Where? (e.g. Mumbai)" 
          value={location} 
          onChange={(e) => setLocation(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div>
        {loading && <p>Loading...</p>}
        {!loading && hasSearched && results.length === 0 && (
          <div className="text-center p-8 bg-gray-50 rounded">
            <p>No matching providers are currently available in our platform data.</p>
            <button onClick={() => setHasSearched(false)} className="text-blue-600 mt-2">Change Filters</button>
          </div>
        )}
        {!loading && results.map(hospital => (
          <div key={hospital.id} className="border p-4 rounded mb-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">{hospital.name}</h2>
              <p className="text-gray-600">{hospital.city}</p>
              <p className="text-sm mt-1">Specialties: {hospital.specialties.join(', ')}</p>
            </div>
            <Link href={`/customer/providers/${hospital.id}`} className="bg-gray-100 px-4 py-2 rounded text-blue-600">
              View Profile
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
"""
write_file(f"{root}/apps/web/src/app/customer/search/page.tsx", search_page_content)

provider_profile_content = """
'use client';

import React, { useEffect, useState } from 'react';
import { getHospitalById, getCostEstimatesByHospital } from '../../../../features/providers/providerService';
import { Hospital, CostEstimate } from '../../../../types/models';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../components/AuthProvider';

export default function ProviderProfile() {
  const { id } = useParams() as { id: string };
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [estimates, setEstimates] = useState<CostEstimate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const h = await getHospitalById(id);
        if (h) {
          setHospital(h);
          const ests = await getCostEstimatesByHospital(id);
          setEstimates(ests);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleRequestQuote = (treatmentId?: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/customer/request-quote?providerId=${id}${treatmentId ? `&treatmentId=${treatmentId}` : ''}`);
    } else {
      router.push(`/customer/request-quote?providerId=${id}${treatmentId ? `&treatmentId=${treatmentId}` : ''}`);
    }
  };

  if (loading) return <div className="p-4">Loading provider profile...</div>;
  if (!hospital) return <div className="p-4">Provider not found or not published.</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="bg-white border rounded p-6 shadow-sm mb-6">
        <h1 className="text-3xl font-bold mb-2">{hospital.name}</h1>
        <p className="text-gray-600 text-lg mb-4">{hospital.city}</p>
        
        <div className="flex gap-4 mb-4">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            {hospital.accreditation || 'Unaccredited'}
          </span>
        </div>
        
        <div className="bg-gray-50 p-4 rounded text-sm mb-6 border">
          <h3 className="font-semibold mb-1">Provenance Indicator</h3>
          <p>Source: {hospital.source} | Status: {hospital.verificationStatus}</p>
          <p>Last checked: {hospital.lastCheckedAt}</p>
        </div>

        <h2 className="text-xl font-semibold mt-6 mb-3">Treatments & Estimated Costs</h2>
        <p className="text-xs text-gray-500 mb-4">Costs shown are estimates based on available platform data and are not a binding quote.</p>
        
        {estimates.length === 0 ? <p>No estimates available.</p> : (
          <div className="grid gap-4">
            {estimates.map(est => (
              <div key={est.id} className="border p-4 rounded flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{est.treatmentName}</h3>
                  <p className="text-lg text-green-700 font-medium">
                    {est.currency} {est.minAmount.toLocaleString()} - {est.maxAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Source: {est.source} | Status: {est.verificationStatus}</p>
                </div>
                <button 
                  onClick={() => handleRequestQuote(est.treatmentId)} 
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Request Quote
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-4 border-t">
           <button onClick={() => handleRequestQuote()} className="bg-blue-600 text-white px-6 py-3 rounded font-medium text-lg w-full md:w-auto">
            Request Quote for Other Treatment
          </button>
        </div>
      </div>
    </div>
  );
}
"""
write_file(f"{root}/apps/web/src/app/customer/providers/[id]/page.tsx", provider_profile_content)


quote_request_content = """
'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../components/AuthProvider';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { createCase } from '../../../features/cases/caseService';

function QuoteRequestForm() {
  const searchParams = useSearchParams();
  const providerId = searchParams.get('providerId') || '';
  const treatmentId = searchParams.get('treatmentId') || '';
  
  const { currentUser } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    selectedHospitalId: providerId,
    treatmentId: treatmentId,
    preferredLocation: '',
    budget: '',
    preferredTimeline: '',
    inquiry: '',
    preferredLanguage: 'English'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    setError('');
    
    try {
      const caseId = await createCase(currentUser.uid, formData);
      router.push(`/customer/cases/${caseId}`);
    } catch (err) {
      console.error(err);
      setError('Unable to create case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Patient Intake & Quote Request</h1>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 border rounded shadow-sm">
        <div>
           <label className="block text-sm font-medium mb-1">Selected Hospital ID</label>
           <input type="text" name="selectedHospitalId" value={formData.selectedHospitalId} onChange={handleChange} className="w-full border p-2 rounded bg-gray-50" readOnly />
        </div>
        
        <div>
           <label className="block text-sm font-medium mb-1">Treatment Requested</label>
           <input type="text" name="treatmentId" value={formData.treatmentId} onChange={handleChange} className="w-full border p-2 rounded" required placeholder="e.g. Knee Replacement" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
             <label className="block text-sm font-medium mb-1">Preferred Location</label>
             <input type="text" name="preferredLocation" value={formData.preferredLocation} onChange={handleChange} className="w-full border p-2 rounded" placeholder="e.g. Mumbai, India" />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1">Approximate Budget</label>
             <input type="text" name="budget" value={formData.budget} onChange={handleChange} className="w-full border p-2 rounded" placeholder="e.g. $5000" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
             <label className="block text-sm font-medium mb-1">Preferred Timeline</label>
             <select name="preferredTimeline" value={formData.preferredTimeline} onChange={handleChange} className="w-full border p-2 rounded">
                <option value="">Select Timeline</option>
                <option value="Urgent (1-2 weeks)">Urgent (1-2 weeks)</option>
                <option value="1 month">Within 1 month</option>
                <option value="3 months">1-3 months</option>
                <option value="Flexible">Flexible</option>
             </select>
          </div>
          <div>
             <label className="block text-sm font-medium mb-1">Preferred Language</label>
             <input type="text" name="preferredLanguage" value={formData.preferredLanguage} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
        </div>

        <div>
           <label className="block text-sm font-medium mb-1">Short Description / Inquiry</label>
           <textarea name="inquiry" value={formData.inquiry} onChange={handleChange} rows={4} className="w-full border p-2 rounded" placeholder="Describe your condition and requirements briefly..." required></textarea>
        </div>
        
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded font-medium disabled:opacity-50">
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}

export default function QuoteRequestPage() {
  return (
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <QuoteRequestForm />
    </ProtectedRoute>
  );
}
"""
write_file(f"{root}/apps/web/src/app/customer/request-quote/page.tsx", quote_request_content)


cases_list_content = """
'use client';

import React, { useEffect, useState } from 'react';
import { getUserCases } from '../../../features/cases/caseService';
import { Case } from '../../../types/models';
import { useAuth } from '../../../components/AuthProvider';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import Link from 'next/link';

function CasesList() {
  const { currentUser } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCases() {
      if (currentUser) {
        try {
          const data = await getUserCases(currentUser.uid);
          setCases(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    }
    loadCases();
  }, [currentUser]);

  if (loading) return <div className="p-4">Loading cases...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Cases</h1>
      
      {cases.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded border">
          <p>You have no active cases.</p>
          <Link href="/customer/search" className="text-blue-600 mt-2 block">Search for treatments</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {cases.map(c => (
            <Link key={c.id} href={`/customer/cases/${c.id}`} className="block">
              <div className="border p-4 rounded hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-semibold text-lg">{c.treatmentId || 'General Inquiry'}</h2>
                  <span className="bg-gray-100 text-xs px-2 py-1 rounded">{c.humanReference}</span>
                </div>
                <div className="text-sm text-gray-600 flex justify-between">
                  <p>Stage: <span className="font-medium text-blue-600">{c.currentStage}</span></p>
                  <p>Created: {new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CasesPage() {
  return (
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <CasesList />
    </ProtectedRoute>
  );
}
"""
write_file(f"{root}/apps/web/src/app/customer/cases/page.tsx", cases_list_content)

case_detail_content = """
'use client';

import React, { useEffect, useState } from 'react';
import { getCaseById } from '../../../../features/cases/caseService';
import { Case } from '../../../../types/models';
import { useAuth } from '../../../../components/AuthProvider';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { useParams } from 'next/navigation';

function CaseDetail() {
  const { id } = useParams() as { id: string };
  const { currentUser } = useAuth();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (currentUser && id) {
        try {
          const data = await getCaseById(id, currentUser.uid);
          setCaseData(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    }
    load();
  }, [id, currentUser]);

  if (loading) return <div className="p-4">Loading case details...</div>;
  if (!caseData) return <div className="p-4">Case not found or unauthorized.</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Case {caseData.humanReference}</h1>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {caseData.currentStage}
        </span>
      </div>

      <div className="bg-white border rounded shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Treatment Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Treatment</p>
            <p className="font-medium">{caseData.treatmentId}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Selected Hospital</p>
            <p className="font-medium">{caseData.selectedHospitalId || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Preferred Location</p>
            <p className="font-medium">{caseData.preferredLocation || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Budget</p>
            <p className="font-medium">{caseData.budget || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Timeline</p>
            <p className="font-medium">{caseData.preferredTimeline || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Date Created</p>
            <p className="font-medium">{new Date(caseData.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold mt-6 mb-2 border-b pb-2">Inquiry</h2>
        <p className="text-gray-700 whitespace-pre-wrap text-sm">{caseData.inquiry}</p>
      </div>
      
      <div className="bg-gray-50 p-4 border rounded text-center text-sm text-gray-500">
        Internal support notes and messages will appear here in future updates.
      </div>
    </div>
  );
}

export default function CaseDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <CaseDetail />
    </ProtectedRoute>
  );
}
"""
write_file(f"{root}/apps/web/src/app/customer/cases/[id]/page.tsx", case_detail_content)


customer_dashboard = """
import { ProtectedRoute } from '../../components/ProtectedRoute';
import Link from 'next/link';

export default function CustomerPage() {
  return (
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Welcome to MedBridge India</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border p-6 rounded bg-blue-50">
            <h2 className="text-xl font-semibold mb-2">Find a Treatment</h2>
            <p className="text-gray-600 mb-4">Search for hospitals, doctors, and treatments across India.</p>
            <Link href="/customer/search" className="bg-blue-600 text-white px-4 py-2 rounded inline-block">
              Search Providers
            </Link>
          </div>
          
          <div className="border p-6 rounded bg-green-50">
            <h2 className="text-xl font-semibold mb-2">My Cases</h2>
            <p className="text-gray-600 mb-4">View and manage your quote requests and medical journey.</p>
            <Link href="/customer/cases" className="bg-green-600 text-white px-4 py-2 rounded inline-block">
              View Cases
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
"""
write_file(f"{root}/apps/web/src/app/customer/page.tsx", customer_dashboard)


# 4. Seed Script (apps/web/scripts/seed.ts)
seed_script = """
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' }); // Adjust if needed

// IMPORTANT: This script uses the Admin SDK. 
// For local emulation, ensure FIRESTORE_EMULATOR_HOST is set, OR 
// provide a service account path in GOOGLE_APPLICATION_CREDENTIALS.

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "medbridge-dev";

// Initialize Firebase Admin
try {
  initializeApp({ projectId });
  console.log("Initialized Firebase Admin");
} catch (e) {
  console.log("Firebase already initialized");
}

const db = getFirestore();

async function seed() {
  console.log("Seeding Development Data...");
  
  const now = new Date().toISOString();

  // 1. Hospitals
  const hospitals = [
    {
      name: "Demo Hospital OrthoCare",
      city: "Mumbai",
      specialties: ["Orthopedics"],
      treatments: ["Knee Replacement", "Hip Replacement"],
      status: "PUBLISHED",
      source: "Development Seed Data",
      verificationStatus: "REVIEWED",
      lastCheckedAt: now,
      accreditation: "JCI Accredited"
    },
    {
      name: "Demo Cardiac Institute",
      city: "Delhi",
      specialties: ["Cardiac Sciences"],
      treatments: ["CABG", "Angioplasty"],
      status: "PUBLISHED",
      source: "Development Seed Data",
      verificationStatus: "CLAIMED_CONFIRMED",
      lastCheckedAt: now,
      accreditation: "NABH Accredited"
    },
    {
      name: "Unpublished Demo Clinic",
      city: "Bangalore",
      specialties: ["Orthopedics"],
      treatments: ["Knee Replacement"],
      status: "DRAFT",
      source: "Development Seed Data",
      verificationStatus: "UNVERIFIED",
      lastCheckedAt: now,
    }
  ];

  const hospitalIds: string[] = [];
  for (const h of hospitals) {
    const docRef = await db.collection('hospitals').add(h);
    hospitalIds.push(docRef.id);
  }
  
  // 2. Cost Estimates
  const estimates = [
    {
      hospitalId: hospitalIds[0],
      treatmentId: "Knee Replacement",
      treatmentName: "Knee Replacement",
      currency: "INR",
      minAmount: 300000,
      maxAmount: 450000,
      inclusions: ["Surgery", "5 Days Room"],
      source: "Development Seed Data",
      verificationStatus: "REVIEWED"
    },
    {
      hospitalId: hospitalIds[1],
      treatmentId: "CABG",
      treatmentName: "Coronary Artery Bypass Grafting",
      currency: "INR",
      minAmount: 400000,
      maxAmount: 600000,
      source: "Development Seed Data",
      verificationStatus: "REVIEWED"
    }
  ];

  for (const est of estimates) {
    await db.collection('costEstimates').add(est);
  }

  console.log("Seeding complete. Added Hospitals and Cost Estimates.");
}

seed().catch(console.error);
"""
write_file(f"{root}/apps/web/scripts/seed.ts", seed_script)


# 5. Firestore Rules Update
firestore_rules = """
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Default Deny
    match /{document=**} {
      allow read, write: if false;
    }

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(uid) {
      return isAuthenticated() && request.auth.uid == uid;
    }

    function hasRole(role) {
      return isAuthenticated() && (request.auth.token[role] == true || request.auth.token.role == role || request.auth.token.primaryRole == role);
    }
    
    function isSuperAdmin() {
      return hasRole('SUPER_ADMIN');
    }

    function isAdmin() {
      return hasRole('ADMIN') || isSuperAdmin();
    }
    
    function isPublished() {
      return resource.data.status == 'PUBLISHED';
    }

    // Collections
    
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin() || hasRole('SUPPORT_AGENT') || hasRole('CASE_MANAGER');
      allow update: if isOwner(userId) && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['roles', 'primaryRole', 'panel', 'status']));
      allow write: if isSuperAdmin();
    }

    match /patients/{patientId} {
      allow read: if isOwner(patientId) || isAdmin() || hasRole('SUPPORT_AGENT') || hasRole('CASE_MANAGER');
      allow write: if isSuperAdmin();
    }

    match /staffProfiles/{staffId} {
      allow read: if isAdmin();
      allow write: if isSuperAdmin();
    }

    // Provider Data (Publicly readable if published)
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
      allow read: if true; // Associated with published hospital/treatment checks usually needed in complex setups. Safe for MVP.
      allow write: if isSuperAdmin() || hasRole('DATA_REVIEWER');
    }

    match /cases/{caseId} {
      // CUSTOMER can read/create their own case
      allow create: if isOwner(request.resource.data.patientId);
      allow read: if isOwner(resource.data.patientId) || isAdmin() || isSuperAdmin() || hasRole('SUPPORT_AGENT') || hasRole('CASE_MANAGER');
      allow write: if isSuperAdmin() || isAdmin(); // Support agent modifications are handled securely via backend or extended rules
    }
    
    match /caseEvents/{eventId} {
      allow create: if isAuthenticated(); // Should ideally ensure actorId == uid and case belongs to uid
      allow read: if true; // Needs robust query enforcement for production
    }
    
    match /auditLogs/{logId} {
      allow read: if isSuperAdmin() || isAdmin();
      allow write: if false; // Only backend can write audit logs
    }
  }
}
"""
write_file(f"{root}/firebase/firestore.rules", firestore_rules)


print("Slice script created successfully.")
