export type Language = 'fr' | 'ar';

export type CouncilType = 'APC' | 'APW';

export type Gender = 'H' | 'F';

export type MilitaryStatus = 'accompli' | 'dispense' | 'exempte' | 'sursis' | 'non_concerne';

export type DocumentStatus = 'conforme' | 'en_attente' | 'non_conforme';

export interface DocumentItem {
  id: string;
  key: string;
  nameFr: string;
  nameAr: string;
  status: DocumentStatus;
  conforme: boolean;
  issueDate?: string;
  expiryDate?: string;
  referenceNumber?: string;
  notes?: string;
  fileDataUrl?: string; // Image base64 ou URL du document scanné ou photographié
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  scannedAt?: string;
  extractedData?: ExtractedDocumentData;
}

export interface ExtractedDocumentData {
  documentTypeDetected?: string;
  detectedDocType?: string;
  lastNameFr?: string;
  firstNameFr?: string;
  lastNameAr?: string;
  firstNameAr?: string;
  gender?: Gender;
  birthDate?: string;
  birthPlace?: string;
  nationalIdNumber?: string;
  addressNeighborhood?: string;
  phoneNumber?: string;
  email?: string;
  profession?: string;
  educationLevel?: string;
  isUniversityGraduate?: boolean;
  referenceNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  partyMembershipNumber?: string;
  partyJoinYear?: number;
  partyRole?: string;
  council?: CouncilType;
  militaryStatus?: MilitaryStatus;
  confidenceNotes?: string;
}

export interface Candidate {
  id: string;
  listRank: number | null; // Numéro attribué par l'administrateur (1 = Tête de liste, ou null = En attente)
  assignedByAdmin?: boolean; // Numérotation confirmée par l'administrateur de Kasma
  council: CouncilType; // APC Bologhine or APW Alger
  photoUrl?: string; // Photo d'identité officielle du candidat (photographiée ou importée)
  lastNameFr: string;
  firstNameFr: string;
  lastNameAr: string;
  firstNameAr: string;
  gender: Gender;
  birthDate: string; // YYYY-MM-DD
  birthPlace: string;
  nationalIdNumber: string; // NIN
  addressNeighborhood: string; // Bologhine neighborhood: Notre Dame d'Afrique, Ibn Ziri, etc.
  phoneNumber: string;
  email: string;
  profession: string;
  educationLevel: string; // Doctorat, Master/Ingénieur, Licence, Technicien, Secondaire
  isUniversityGraduate: boolean;
  partyMembershipNumber: string; // N° Carte de militant FLN
  partyJoinYear: number; // Année d'adhésion
  partyRole?: string; // e.g. Membre du bureau de kasma, militant de base, représentant jeunesse
  militaryStatus: MilitaryStatus;
  notes?: string;
  password?: string; // Mot de passe d'accès personnel du candidat
  customUsername?: string; // Identifiant de connexion personnalisé
  dossierStatus: 'complet' | 'en_cours' | 'incomplet';
  documents: Record<string, DocumentItem>;
  createdAt: string;
  updatedAt: string;
}

export type UserSessionType = 'admin' | 'candidate';

export interface CampaignStats {
  totalCandidates: number;
  apcCandidates: number;
  apwCandidates: number;
  completedDossiers: number;
  pendingDossiers: number;
  incompleteDossiers: number;
  womenCount: number;
  womenPercentage: number;
  youthUnder35Count: number;
  youthUnder35Percentage: number;
  universityGraduatesCount: number;
  universityGraduatesPercentage: number;
  totalRequiredDocuments: number;
  totalConformeDocuments: number;
  globalComplianceRate: number;
}

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  fullNameAr: string;
  role: 'super_admin' | 'kasma_admin' | 'commission_member';
  roleTitleFr: string;
  roleTitleAr: string;
  email: string;
  kasma: string;
  mouhafadha: string;
  avatarUrl?: string;
  lastLogin?: string;
}

export interface AuthSession {
  type?: UserSessionType;
  user?: AdminUser;
  candidateId?: string;
  token: string;
  loginTime: string;
  expiresAt?: string;
  rememberMe: boolean;
}
