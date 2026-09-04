import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { ProviderService, Hospital, Location } from '../../types/models';

export interface TreatmentOption {
  service: ProviderService;
  provider: Hospital | null; // Currently uses Hospital which inherits ProviderBase
  location: Location | null;
  matchScore?: number; // transparent matching score
  matchReasons?: string[];
}

export interface OptionsFilters {
  treatmentId: string;
  budgetMax?: number;
  city?: string;
  accommodation?: boolean;
  transport?: boolean;
}

export async function getTreatmentOptions(filters: OptionsFilters): Promise<TreatmentOption[]> {
  const servicesRef = collection(db, 'providerServices');
  
  // 1. Find ProviderServices for the Treatment
  const servicesQuery = query(
    servicesRef,
    where('treatmentId', '==', filters.treatmentId),
    where('status', '==', 'PUBLISHED')
  );

  const serviceDocs = await getDocs(servicesQuery);
  const services = serviceDocs.docs.map(d => ({ id: d.id, ...d.data() } as ProviderService));

  if (services.length === 0) return [];

  const options: TreatmentOption[] = [];

  // 2. Fetch associated Providers and Locations
  for (const service of services) {
    let provider: Hospital | null = null;
    let location: Location | null = null;
    let matchScore = 0;
    const matchReasons: string[] = ['Treatment availability found'];

    try {
      const providerDoc = await getDoc(doc(db, 'providers', service.providerId));
      if (providerDoc.exists()) {
        provider = { id: providerDoc.id, ...providerDoc.data() } as Hospital;
        
        // Location matching (if they have coordinates or nearestAirportId we would fetch Location, but for simplicity we rely on city/state on Provider first)
        // In a full implementation, we'd fetch the Location document if it exists as a separate collection.
      }
    } catch (e) {
      console.warn('Failed to fetch provider for service', service.id);
    }

    // Apply patient filters & matching
    let skip = false;

    // Budget match
    if (filters.budgetMax && service.estimatedCostMax) {
      if (service.estimatedCostMin && service.estimatedCostMin > filters.budgetMax) {
        // Skip if even the minimum cost is way out of budget
        skip = true;
      } else if (service.estimatedCostMax <= filters.budgetMax) {
        matchScore += 2;
        matchReasons.push('Matches your budget preference');
      }
    }

    // City match
    if (filters.city && provider) {
      if (provider.city?.toLowerCase() === filters.city.toLowerCase()) {
        matchScore += 3;
        matchReasons.push('Located in your preferred city');
      }
    }

    // Logistics match
    if (filters.accommodation) {
      if (provider?.accommodationReferences && provider.accommodationReferences.length > 0) {
        matchScore += 1;
        matchReasons.push('✓ Has accommodation references');
      } else {
        matchReasons.push('△ Accommodation information unavailable');
      }
    }

    if (filters.transport) {
      if (provider?.localTransportAvailability) {
        matchScore += 1;
        matchReasons.push('✓ Has local transport options');
      } else {
        matchReasons.push('△ Transport information unavailable');
      }
    }
    
    // Additional ranking signals
    if (provider?.nearestAirportId) {
      matchScore += 1;
      matchReasons.push('✓ Airport access information available');
    }

    if (!skip && provider) {
      options.push({
        service,
        provider,
        location,
        matchScore,
        matchReasons
      });
    }
  }

  // Sort by transparent match score (highest first)
  return options.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}

export async function getTreatmentOptionsByIds(serviceIds: string[]): Promise<TreatmentOption[]> {
  if (!serviceIds.length) return [];
  
  const options: TreatmentOption[] = [];
  
  for (const id of serviceIds) {
    try {
      const serviceDoc = await getDoc(doc(db, 'providerServices', id));
      if (!serviceDoc.exists()) continue;
      
      const service = { id: serviceDoc.id, ...serviceDoc.data() } as ProviderService;
      
      const providerDoc = await getDoc(doc(db, 'providers', service.providerId));
      if (providerDoc.exists()) {
        const provider = { id: providerDoc.id, ...providerDoc.data() } as Hospital;
        options.push({
          service,
          provider,
          location: null
        });
      }
    } catch (e) {
      console.error('Error fetching service/provider for comparison:', e);
    }
  }
  
  return options;
}

