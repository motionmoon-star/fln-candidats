import { Candidate } from '../types';
import { ADMINISTRATIVE_DOCUMENTS } from './documentsList';

function buildDocs(conformeKeys: string[], pendingKeys: string[] = [], nonConformeKeys: string[] = []): Record<string, any> {
  const docs: Record<string, any> = {};
  for (const def of ADMINISTRATIVE_DOCUMENTS) {
    const isConforme = conformeKeys.includes(def.key);
    const isNonConforme = nonConformeKeys.includes(def.key);
    const isPending = pendingKeys.includes(def.key) || (!isConforme && !isNonConforme);

    let status: 'conforme' | 'en_attente' | 'non_conforme' = 'en_attente';
    if (isConforme) status = 'conforme';
    else if (isNonConforme) status = 'non_conforme';

    docs[def.key] = {
      id: `${def.key}-${Math.random().toString(36).substring(2, 7)}`,
      key: def.key,
      nameFr: def.nameFr,
      nameAr: def.nameAr,
      status,
      conforme: isConforme,
      issueDate: isConforme ? '2024-03-15' : undefined,
      notes: isConforme ? 'Document vérifié et conforme' : isPending ? 'En attente de délivrance' : 'Rejeté / À renouveler',
    };
  }
  return docs;
}

const allDocs = ADMINISTRATIVE_DOCUMENTS.map(d => d.key);

export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'cand-fln-hasbaloui-01',
    listRank: 1,
    council: 'APC',
    lastNameFr: 'HASBALOUI',
    firstNameFr: 'Mohamed',
    lastNameAr: 'حسبلاوي',
    firstNameAr: 'محمد',
    gender: 'H',
    birthDate: '1976-05-14',
    birthPlace: 'Bologhine, Alger',
    nationalIdNumber: '1076161400234',
    addressNeighborhood: 'Bologhine Centre (Ibn Ziri)',
    phoneNumber: '0550 12 34 56',
    email: 'mohamed.hasbaloui@fln-bologhine.dz',
    profession: 'Cadre Supérieur d\'État - Administration Publique',
    educationLevel: 'Master 2 Droit Public & Sciences Politiques',
    isUniversityGraduate: true,
    partyMembershipNumber: 'FLN-BO-1998-041',
    partyJoinYear: 1998,
    partyRole: 'Tête de Liste APC Bologhine - Membre Bureau de Kasma',
    militaryStatus: 'accompli',
    notes: 'Candidat officiel et Tête de liste APC Bologhine. Dossier validé et conforme à 100%.',
    dossierStatus: 'complet',
    documents: buildDocs(allDocs),
    createdAt: '2024-04-01T08:00:00.000Z',
    updatedAt: new Date().toISOString(),
  }
];
