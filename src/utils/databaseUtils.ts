import { Candidate, CouncilType, Gender, MilitaryStatus } from '../types';
import { ADMINISTRATIVE_DOCUMENTS } from '../data/documentsList';

/**
 * Build default administrative documents for a candidate
 */
export function buildDefaultDocuments(allConforme: boolean = false): Record<string, any> {
  const docs: Record<string, any> = {};
  for (const def of ADMINISTRATIVE_DOCUMENTS) {
    docs[def.key] = {
      id: `${def.key}-${Math.random().toString(36).substring(2, 7)}`,
      key: def.key,
      nameFr: def.nameFr,
      nameAr: def.nameAr,
      status: allConforme ? 'conforme' : 'en_attente',
      conforme: allConforme,
      issueDate: allConforme ? new Date().toISOString().slice(0, 10) : undefined,
      notes: allConforme ? 'Document vérifié et conforme' : 'En attente de délivrance',
    };
  }
  return docs;
}

/**
 * Validate and normalize a single candidate object
 */
export function normalizeCandidate(raw: any, index: number): Candidate {
  const id = raw.id && typeof raw.id === 'string' && raw.id.trim()
    ? raw.id.trim()
    : `cand-fln-${Date.now()}-${index + 1}`;

  const council: CouncilType = raw.council === 'APW' || String(raw.council || '').toUpperCase().includes('APW') || String(raw.council || '').includes('ولائي')
    ? 'APW'
    : 'APC';

  const rawGender = String(raw.gender || raw.sexe || '').toUpperCase();
  const gender: Gender = rawGender === 'F' || rawGender.includes('FEM') || rawGender.includes('أنثى')
    ? 'F'
    : 'H';

  const rawMilitary = String(raw.militaryStatus || raw.service_national || '').toLowerCase();
  let militaryStatus: MilitaryStatus = 'accompli';
  if (rawMilitary.includes('disp') || rawMilitary.includes('معفى') || rawMilitary.includes('إعفاء')) {
    militaryStatus = 'dispense';
  } else if (rawMilitary.includes('exemp') || rawMilitary.includes('مستثنى')) {
    militaryStatus = 'exempte';
  } else if (rawMilitary.includes('surs') || rawMilitary.includes('تأجيل')) {
    militaryStatus = 'sursis';
  } else if (gender === 'F' || rawMilitary.includes('non') || rawMilitary.includes('غير معني')) {
    militaryStatus = 'non_concerne';
  }

  const rawRank = raw.listRank ?? raw.rank ?? raw.num ?? null;
  const listRank = rawRank !== null && rawRank !== '' && !isNaN(Number(rawRank)) && Number(rawRank) > 0
    ? Number(rawRank)
    : null;

  // Documents
  let documents = raw.documents;
  if (!documents || typeof documents !== 'object' || Object.keys(documents).length === 0) {
    documents = buildDefaultDocuments(false);
  } else {
    // Ensure all 11 documents exist
    for (const def of ADMINISTRATIVE_DOCUMENTS) {
      if (!documents[def.key]) {
        documents[def.key] = {
          id: `${def.key}-${Math.random().toString(36).substring(2, 7)}`,
          key: def.key,
          nameFr: def.nameFr,
          nameAr: def.nameAr,
          status: 'en_attente',
          conforme: false,
          notes: 'En attente de délivrance',
        };
      }
    }
  }

  // University graduate check
  const isUniv = Boolean(
    raw.isUniversityGraduate === true ||
    String(raw.isUniversityGraduate || '').toLowerCase() === 'true' ||
    String(raw.isUniversityGraduate || '').toLowerCase() === 'oui' ||
    String(raw.isUniversityGraduate || '').includes('نعم')
  );

  return {
    id,
    listRank,
    assignedByAdmin: listRank !== null,
    council,
    photoUrl: raw.photoUrl || undefined,
    lastNameFr: String(raw.lastNameFr || raw.nom || '').trim() || 'CANDIDAT',
    firstNameFr: String(raw.firstNameFr || raw.prenom || '').trim() || 'Fln',
    lastNameAr: String(raw.lastNameAr || raw.nom_ar || raw.اللقب || '').trim() || (raw.lastNameFr || 'مترشح'),
    firstNameAr: String(raw.firstNameAr || raw.prenom_ar || raw.الاسم || '').trim() || (raw.firstNameFr || 'حر'),
    gender,
    birthDate: String(raw.birthDate || raw.date_naissance || raw['تاريخ الميلاد'] || '1985-01-01').trim(),
    birthPlace: String(raw.birthPlace || raw.lieu_naissance || raw['مكان الميلاد'] || 'Bologhine, Alger').trim(),
    nationalIdNumber: String(raw.nationalIdNumber || raw.nin || raw['رقم التعريف الوطني'] || '1085161400000').trim(),
    addressNeighborhood: String(raw.addressNeighborhood || raw.quartier || raw.adresse || raw['الحي'] || 'Bologhine').trim(),
    phoneNumber: String(raw.phoneNumber || raw.telephone || raw.phone || raw['الهاتف'] || '0550 00 00 00').trim(),
    email: String(raw.email || raw['البريد'] || '').trim() || `${id}@fln-bologhine.dz`,
    profession: String(raw.profession || raw['المهنة'] || 'Cadre / Fonctionnaire').trim(),
    educationLevel: String(raw.educationLevel || raw.niveau || raw['المستوى التعليمي'] || 'Universitaire').trim(),
    isUniversityGraduate: isUniv,
    partyMembershipNumber: String(raw.partyMembershipNumber || raw.carte_fln || raw['بطاقة المناضل'] || `FLN-BO-${raw.partyJoinYear || 2020}-001`).trim(),
    partyJoinYear: Number(raw.partyJoinYear || raw.annee_adhesion || raw['سنة الانخراط'] || 2015),
    partyRole: String(raw.partyRole || raw['الصفة الحزبية'] || 'Militant').trim(),
    militaryStatus,
    notes: raw.notes ? String(raw.notes).trim() : '',
    password: raw.password ? String(raw.password).trim() : undefined,
    customUsername: raw.customUsername ? String(raw.customUsername).trim() : undefined,
    dossierStatus: raw.dossierStatus || 'en_cours',
    documents,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Parse JSON string containing candidates list
 */
export function parseCandidatesJson(jsonString: string): {
  success: boolean;
  candidates?: Candidate[];
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    let list: any[] = [];
    if (Array.isArray(parsed)) {
      list = parsed;
    } else if (parsed && Array.isArray(parsed.candidates)) {
      list = parsed.candidates;
    } else if (parsed && typeof parsed === 'object') {
      // Check if it's an object of candidates
      const values = Object.values(parsed);
      if (values.length > 0 && typeof values[0] === 'object') {
        list = values;
      }
    }

    if (list.length === 0) {
      return { success: false, error: 'Le fichier JSON ne contient aucune liste de candidats valide.' };
    }

    const candidates = list.map((item, idx) => normalizeCandidate(item, idx));
    return { success: true, candidates };
  } catch (err: any) {
    return { success: false, error: `Erreur de syntaxe JSON : ${err.message}` };
  }
}

/**
 * Split a CSV line respecting quoted commas
 */
function splitCsvLine(line: string, delimiter: string = ','): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
  return result;
}

/**
 * Parse CSV string containing candidates
 */
export function parseCandidatesCsv(csvString: string): {
  success: boolean;
  candidates?: Candidate[];
  error?: string;
} {
  try {
    // Remove BOM if present
    const cleaned = csvString.replace(/^\uFEFF/, '').trim();
    if (!cleaned) {
      return { success: false, error: 'Le fichier CSV est vide.' };
    }

    const lines = cleaned.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) {
      return { success: false, error: 'Le fichier CSV doit contenir une ligne d\'en-tête et au moins un candidat.' };
    }

    // Determine delimiter: comma, semicolon, or tab
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes(';') && firstLine.split(';').length > firstLine.split(',').length) {
      delimiter = ';';
    } else if (firstLine.includes('\t') && firstLine.split('\t').length > firstLine.split(',').length) {
      delimiter = '\t';
    }

    const headers = splitCsvLine(firstLine, delimiter).map(h => h.trim().toLowerCase());
    const candidates: Candidate[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = splitCsvLine(lines[i], delimiter);
      if (values.length === 0 || (values.length === 1 && !values[0])) continue;

      const rowObj: Record<string, any> = {};
      headers.forEach((h, colIdx) => {
        rowObj[h] = values[colIdx] || '';
      });

      // Match common header variations
      const raw: any = {};
      
      // NIN
      raw.nationalIdNumber = rowObj['nin'] || rowObj['nationalidnumber'] || rowObj['رقم التعريف الوطني'] || rowObj['n_national'] || '';
      
      // Names
      raw.lastNameFr = rowObj['nom'] || rowObj['lastnamefr'] || rowObj['nom_fr'] || '';
      raw.firstNameFr = rowObj['prenom'] || rowObj['firstnamefr'] || rowObj['prenom_fr'] || '';
      raw.lastNameAr = rowObj['اللقب'] || rowObj['nom_ar'] || rowObj['lastnamear'] || raw.lastNameFr;
      raw.firstNameAr = rowObj['الاسم'] || rowObj['prenom_ar'] || rowObj['firstnamear'] || raw.firstNameFr;
      
      // Council
      raw.council = rowObj['conseil'] || rowObj['council'] || rowObj['المجلس'] || rowObj['type'] || 'APC';
      
      // Rank
      raw.listRank = rowObj['n° ordre'] || rowObj['ordre'] || rowObj['rang'] || rowObj['num'] || rowObj['الرقم'] || rowObj['الترتيب'] || '';
      
      // Gender
      raw.gender = rowObj['sexe'] || rowObj['gender'] || rowObj['الجنس'] || 'H';
      
      // Birth
      raw.birthDate = rowObj['date naissance'] || rowObj['date_naissance'] || rowObj['birthdate'] || rowObj['تاريخ الميلاد'] || '1985-01-01';
      raw.birthPlace = rowObj['lieu naissance'] || rowObj['lieu_naissance'] || rowObj['birthplace'] || rowObj['مكان الميلاد'] || 'Bologhine';
      
      // Neighborhood & contact
      raw.addressNeighborhood = rowObj['quartier bologhine'] || rowObj['quartier'] || rowObj['adresse'] || rowObj['الحي'] || 'Bologhine Centre';
      raw.phoneNumber = rowObj['téléphone'] || rowObj['telephone'] || rowObj['phone'] || rowObj['الهاتف'] || '';
      raw.email = rowObj['email'] || rowObj['courriel'] || rowObj['البريد'] || '';
      
      // Profession & studies
      raw.profession = rowObj['profession'] || rowObj['المهنة'] || '';
      raw.educationLevel = rowObj['niveau études'] || rowObj['niveau'] || rowObj['المستوى التعليمي'] || '';
      raw.isUniversityGraduate = rowObj['diplômé univ.'] || rowObj['diplome'] || rowObj['جامعي'] || '';
      
      // Party FLN
      raw.partyMembershipNumber = rowObj['n° carte fln'] || rowObj['carte_fln'] || rowObj['بطاقة المناضل'] || '';
      raw.partyJoinYear = rowObj['année adhésion'] || rowObj['adhesion'] || rowObj['سنة الانخراط'] || '';
      raw.partyRole = rowObj['role'] || rowObj['الصفة الحزبية'] || 'Militant';
      
      // Military
      raw.militaryStatus = rowObj['situation militaire'] || rowObj['service_national'] || rowObj['الخدمة الوطنية'] || 'accompli';
      
      // Notes
      raw.notes = rowObj['notes'] || rowObj['remarques'] || rowObj['ملاحظات'] || '';

      candidates.push(normalizeCandidate(raw, i - 1));
    }

    if (candidates.length === 0) {
      return { success: false, error: 'Aucun candidat n\'a pu être extrait des lignes du fichier CSV.' };
    }

    return { success: true, candidates };
  } catch (err: any) {
    return { success: false, error: `Erreur d'analyse du fichier CSV : ${err.message}` };
  }
}

/**
 * Generate CSV template with sample data
 */
export function getCsvDatabaseTemplate(): string {
  const headers = [
    'N° Ordre',
    'Conseil',
    'Nom',
    'Prénom',
    'اللقب',
    'الاسم',
    'Sexe',
    'Date Naissance',
    'Lieu Naissance',
    'NIN',
    'Quartier Bologhine',
    'Téléphone',
    'Email',
    'Profession',
    'Niveau Études',
    'Diplômé Univ.',
    'N° Carte FLN',
    'Année Adhésion',
    'Situation Militaire',
    'Notes'
  ];

  const sampleRows = [
    [
      '1',
      'APC',
      'BELKACEMI',
      'Amar',
      'بلقاسمي',
      'عمار',
      'H',
      '1975-04-12',
      'Bologhine, Alger',
      '107516140023400001',
      'Bologhine Centre (Ibn Ziri)',
      '0550 12 34 56',
      'amar.belkacemi@fln-bologhine.dz',
      'Médecin Généraliste - Santé Publique',
      'Doctorat en Médecine',
      'Oui',
      'FLN-BO-1998-041',
      '1998',
      'accompli',
      'Tête de liste APC Bologhine'
    ].map(v => `"${v}"`).join(','),
    [
      '2',
      'APC',
      'BENALI',
      'Karima',
      'بن علي',
      'كريمة',
      'F',
      '1992-09-18',
      'Bab El Oued, Alger',
      '209216140087600002',
      'Notre Dame d\'Afrique',
      '0661 98 76 54',
      'karima.benali@fln-bologhine.dz',
      'Ingénieur d\'État en Informatique',
      'Master / Ingénieur',
      'Oui',
      'FLN-BO-2016-112',
      '2016',
      'non_concerne',
      'Candidate Jeunesse & Cadre technique'
    ].map(v => `"${v}"`).join(','),
    [
      '1',
      'APW',
      'MEZIANE',
      'Rachid',
      'مزيان',
      'رشيد',
      'H',
      '1968-11-03',
      'Alger Centre',
      '106816140054300003',
      'Raïs Hamidou - Bologhine',
      '0770 45 67 89',
      'rachid.meziane@fln-bologhine.dz',
      'Professeur Universitaire en Droit',
      'Doctorat d\'État',
      'Oui',
      'FLN-BO-1990-008',
      '1990',
      'accompli',
      'Candidat APW Alger'
    ].map(v => `"${v}"`).join(','),
  ];

  return '\uFEFF' + [headers.join(','), ...sampleRows].join('\n');
}

/**
 * Generate JSON template with sample data
 */
export function getJsonDatabaseTemplate(): string {
  const sample = [
    {
      id: 'cand-fln-01',
      listRank: 1,
      council: 'APC',
      lastNameFr: 'BELKACEMI',
      firstNameFr: 'Amar',
      lastNameAr: 'بلقاسمي',
      firstNameAr: 'عمار',
      gender: 'H',
      birthDate: '1975-04-12',
      birthPlace: 'Bologhine, Alger',
      nationalIdNumber: '107516140023400001',
      addressNeighborhood: 'Bologhine Centre (Ibn Ziri)',
      phoneNumber: '0550 12 34 56',
      email: 'amar.belkacemi@fln-bologhine.dz',
      profession: 'Médecin Généraliste - Santé Publique',
      educationLevel: 'Doctorat en Médecine',
      isUniversityGraduate: true,
      partyMembershipNumber: 'FLN-BO-1998-041',
      partyJoinYear: 1998,
      partyRole: 'Tête de Liste APC',
      militaryStatus: 'accompli',
      notes: 'Ancien cadre associatif et militant respecté.',
    },
    {
      id: 'cand-fln-02',
      listRank: 2,
      council: 'APC',
      lastNameFr: 'BENALI',
      firstNameFr: 'Karima',
      lastNameAr: 'بن علي',
      firstNameAr: 'كريمة',
      gender: 'F',
      birthDate: '1992-09-18',
      birthPlace: 'Bab El Oued, Alger',
      nationalIdNumber: '209216140087600002',
      addressNeighborhood: 'Notre Dame d\'Afrique',
      phoneNumber: '0661 98 76 54',
      email: 'karima.benali@fln-bologhine.dz',
      profession: 'Ingénieur d\'État en Informatique',
      educationLevel: 'Master / Ingénieur',
      isUniversityGraduate: true,
      partyMembershipNumber: 'FLN-BO-2016-112',
      partyJoinYear: 2016,
      partyRole: 'Représentante Jeunesse',
      militaryStatus: 'non_concerne',
      notes: 'Candidate Jeunesse & Cadre technique.',
    }
  ];

  return JSON.stringify(sample, null, 2);
}

/**
 * Generate TypeScript code for src/data/initialCandidates.ts ready to be pushed to GitHub
 */
export function generateInitialCandidatesTsCode(candidates: Candidate[]): string {
  const serialized = JSON.stringify(candidates, null, 2);

  return `import { Candidate } from '../types';

/**
 * Base de données des candidats du Front de Libération Nationale (FLN)
 * Kasma de Bologhine - Élections APC & APW
 * Fichier généré automatiquement pour le dépôt GitHub
 * Date de génération : ${new Date().toLocaleString('fr-FR')}
 * Total candidats : ${candidates.length} (APC: ${candidates.filter(c => c.council === 'APC').length} | APW: ${candidates.filter(c => c.council === 'APW').length})
 */

export const INITIAL_CANDIDATES: Candidate[] = ${serialized};
`;
}
