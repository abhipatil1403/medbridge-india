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
  const q = query(
    estimatesRef, 
    where('hospitalId', '==', hospitalId),
    where('status', '==', 'PUBLISHED')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CostEstimate));
}
