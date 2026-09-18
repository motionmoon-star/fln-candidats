import { Candidate, CampaignStats } from '../types';
import { ADMINISTRATIVE_DOCUMENTS } from '../data/documentsList';
import { INITIAL_CANDIDATES } from '../data/initialCandidates';

const STORAGE_KEY = 'fln_bologhine_candidates_v2';
const LEGACY_STORAGE_KEY = 'fln_bologhine_candidates_v1';

export function getStoredCandidates(): Candidate[] {
  try {
    // Check current storage key
    let saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // Check legacy storage
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        saved = legacy;
      }
    }

    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Look for candidate Hasbaloui / Hasbaoui
        const hasbaoui = parsed.find(c => {
          const lFr = (c.lastNameFr || '').toUpperCase();
          const fFr = (c.firstNameFr || '').toUpperCase();
          const lAr = c.lastNameAr || '';
          return lFr.includes('HASBA') || lFr.includes('HASBAL') || fFr.includes('HASBA') || lAr.includes('حسبلا');
        });

        if (hasbaoui) {
          // Keep only Hasbaloui (1 single candidate)
          const singleList = [hasbaoui];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(singleList));
          return singleList;
        }

        // If only legacy mock candidates were in storage (e.g., Belkacemi, Bouzidi), reset to INITIAL_CANDIDATES (Hasbaloui)
        const isLegacyMocks = parsed.some(c => 
          ['BELKACEMI', 'BOUZIDI', 'MEZIANE', 'CHAOUCHE', 'HAMDANI'].includes((c.lastNameFr || '').toUpperCase())
        );

        if (isLegacyMocks) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CANDIDATES));
          return INITIAL_CANDIDATES;
        }

        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading candidates from localStorage', err);
  }
  return INITIAL_CANDIDATES;
}

export function saveCandidatesToStorage(candidates: Candidate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
  } catch (err) {
    console.error('Error saving candidates to localStorage', err);
  }
}

export function calculateAge(birthDateString: string): number {
  if (!birthDateString) return 0;
  const birth = new Date(birthDateString);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return isNaN(age) ? 0 : age;
}

export function isYouth(birthDateString: string): boolean {
  return calculateAge(birthDateString) < 35;
}

/**
 * Format Algerian phone numbers cleanly (e.g. 0550 12 34 56 or 021 96 12 34)
 */
export function formatPhoneNumber(phone: string | undefined | null): string {
  if (!phone) return '—';
  const raw = phone.trim();
  if (!raw) return '—';

  // Extract only digits and leading plus
  let digits = raw.replace(/[^\d+]/g, '');

  // Handle +213 or 00213 prefix
  if (digits.startsWith('+213')) {
    digits = '0' + digits.slice(4);
  } else if (digits.startsWith('00213')) {
    digits = '0' + digits.slice(5);
  } else if (digits.startsWith('213') && digits.length >= 11) {
    digits = '0' + digits.slice(3);
  }

  // 10 digits mobile (e.g., 0550123456 -> 0550 12 34 56 or 05 50 12 34 56)
  if (/^0[567]\d{8}$/.test(digits)) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }

  // 9 digits fixed line (e.g., 021961234 -> 021 96 12 34)
  if (/^0[1-4]\d{7}$/.test(digits)) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
  }

  // 10 digits other
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }

  return raw;
}

/**
 * Return normalized tel: url for direct one-touch smartphone dialing
 */
export function getCleanTelUrl(phone: string | undefined | null): string {
  if (!phone) return '#';
  const digits = phone.replace(/[^\d+]/g, '');
  if (!digits) return '#';
  if (digits.startsWith('+')) return `tel:${digits}`;
  if (digits.startsWith('0')) {
    return `tel:+213${digits.slice(1)}`;
  }
  return `tel:${digits}`;
}

export function getDossierCompliance(candidate: Candidate): {
  conformeCount: number;
  totalCount: number;
  percentage: number;
  isComplete: boolean;
  missingDocs: string[];
} {
  const totalCount = ADMINISTRATIVE_DOCUMENTS.length; // 11
  let conformeCount = 0;
  const missingDocs: string[] = [];

  for (const docDef of ADMINISTRATIVE_DOCUMENTS) {
    const userDoc = candidate.documents?.[docDef.key];
    if (userDoc && (userDoc.conforme === true || userDoc.status === 'conforme')) {
      conformeCount++;
    } else {
      missingDocs.push(docDef.nameFr);
    }
  }

  const percentage = Math.round((conformeCount / totalCount) * 100);
  const isComplete = conformeCount === totalCount;

  return {
    conformeCount,
    totalCount,
    percentage,
    isComplete,
    missingDocs,
  };
}

export function calculateCampaignStats(candidates: Candidate[], councilFilter: 'ALL' | 'APC' | 'APW' = 'ALL'): CampaignStats {
  const filtered = councilFilter === 'ALL' 
    ? candidates 
    : candidates.filter(c => c.council === councilFilter);

  const totalCandidates = filtered.length;
  if (totalCandidates === 0) {
    return {
      totalCandidates: 0,
      apcCandidates: 0,
      apwCandidates: 0,
      completedDossiers: 0,
      pendingDossiers: 0,
      incompleteDossiers: 0,
      womenCount: 0,
      womenPercentage: 0,
      youthUnder35Count: 0,
      youthUnder35Percentage: 0,
      universityGraduatesCount: 0,
      universityGraduatesPercentage: 0,
      totalRequiredDocuments: 0,
      totalConformeDocuments: 0,
      globalComplianceRate: 0,
    };
  }

  const apcCandidates = filtered.filter(c => c.council === 'APC').length;
  const apwCandidates = filtered.filter(c => c.council === 'APW').length;

  let completedDossiers = 0;
  let pendingDossiers = 0;
  let incompleteDossiers = 0;

  let womenCount = 0;
  let youthUnder35Count = 0;
  let universityGraduatesCount = 0;

  let totalConformeDocuments = 0;
  const totalRequiredDocuments = totalCandidates * ADMINISTRATIVE_DOCUMENTS.length;

  for (const c of filtered) {
    const comp = getDossierCompliance(c);
    totalConformeDocuments += comp.conformeCount;

    if (comp.isComplete) {
      completedDossiers++;
    } else if (comp.conformeCount >= 8) {
      pendingDossiers++;
    } else {
      incompleteDossiers++;
    }

    if (c.gender === 'F') womenCount++;
    if (isYouth(c.birthDate)) youthUnder35Count++;
    if (c.isUniversityGraduate) universityGraduatesCount++;
  }

  return {
    totalCandidates,
    apcCandidates,
    apwCandidates,
    completedDossiers,
    pendingDossiers,
    incompleteDossiers,
    womenCount,
    womenPercentage: Math.round((womenCount / totalCandidates) * 100),
    youthUnder35Count,
    youthUnder35Percentage: Math.round((youthUnder35Count / totalCandidates) * 100),
    universityGraduatesCount,
    universityGraduatesPercentage: Math.round((universityGraduatesCount / totalCandidates) * 100),
    totalRequiredDocuments,
    totalConformeDocuments,
    globalComplianceRate: Math.round((totalConformeDocuments / totalRequiredDocuments) * 100),
  };
}

export function exportCandidatesToCSV(candidates: Candidate[]): void {
  const headers = [
    'N° Ordre',
    'Conseil',
    'Nom',
    'Prénom',
    'اللقب',
    'الاسم',
    'Sexe',
    'Âge',
    'Date Naissance',
    'Lieu Naissance',
    'Quartier Bologhine',
    'Téléphone',
    'Profession',
    'Niveau Études',
    'Diplômé Univ.',
    'N° Carte FLN',
    'Année Adhésion',
    'Situation Militaire',
    'Dossier Conforme %',
    'Statut Dossier',
  ];

  const rows = candidates.map(c => {
    const comp = getDossierCompliance(c);
    const age = calculateAge(c.birthDate);
    return [
      c.listRank,
      c.council,
      `"${c.lastNameFr}"`,
      `"${c.firstNameFr}"`,
      `"${c.lastNameAr}"`,
      `"${c.firstNameAr}"`,
      c.gender,
      age,
      c.birthDate,
      `"${c.birthPlace}"`,
      `"${c.addressNeighborhood}"`,
      `"${c.phoneNumber}"`,
      `"${c.profession}"`,
      `"${c.educationLevel}"`,
      c.isUniversityGraduate ? 'Oui' : 'Non',
      `"${c.partyMembershipNumber}"`,
      c.partyJoinYear,
      c.militaryStatus,
      `${comp.percentage}%`,
      comp.isComplete ? 'Complet' : 'Incomplet',
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `FLN_Bologhine_Candidats_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Synchronisation avec la base de données JSON du serveur (base/candidats.db.json).
 * Retourne null si le serveur est injoignable ou ne contient pas encore de base.
 */
export async function fetchCandidatesFromServer(): Promise<Candidate[] | null> {
  try {
    const res = await fetch('/api/db/candidates', { method: 'GET' });
    if (!res.ok) return null;
    const body = await res.json();
    if (body && body.success && Array.isArray(body.candidates)) {
      return body.candidates as Candidate[];
    }
    return null;
  } catch (err) {
    console.error('Erreur de lecture de la base de données serveur', err);
    return null;
  }
}

/**
 * Pousse la liste vers la base de données JSON du serveur (fire-and-forget).
 */
export function syncCandidatesToServer(candidates: Candidate[]): void {
  try {
    void fetch('/api/db/candidates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidates }),
    }).catch(err => {
      console.error('Erreur de synchronisation vers la base de données serveur', err);
    });
  } catch (err) {
    console.error('Erreur de synchronisation vers la base de données serveur', err);
  }
}
