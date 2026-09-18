import { AdminUser, AuthSession, Candidate } from '../types';
import { getStoredCandidates, saveCandidatesToStorage } from './candidateUtils';

const STORAGE_SESSION_KEY = 'fln_bologhine_admin_session';
const STORAGE_ACCOUNTS_KEY = 'fln_bologhine_admin_accounts';

export interface StoredAdminAccount {
  user: AdminUser;
  passwordHash: string; // Plain/simple hash for local client demo persistence
}

export const DEFAULT_ADMIN_ACCOUNTS: StoredAdminAccount[] = [
  {
    user: {
      id: 'admin-01',
      username: 'admin',
      fullName: 'Secrétaire de Kasma - Bologhine',
      fullNameAr: 'أمين قسمة بولوغين - جبهة التحرير الوطني',
      role: 'super_admin',
      roleTitleFr: 'Administrateur Général de Kasma',
      roleTitleAr: 'المشرف العام للقسمة',
      email: 'admin.kasma@fln-bologhine.dz',
      kasma: 'Kasma de Bologhine (Ibn Ziri)',
      mouhafadha: 'Mouhafadha de Bab El Oued - Alger',
      lastLogin: new Date().toISOString(),
    },
    // Allows password 'admin' or 'admin123' or 'bologhine2026'
    passwordHash: 'admin',
  },
  {
    user: {
      id: 'admin-02',
      username: 'kasma.bologhine',
      fullName: 'Bureau Politique Kasma Bologhine',
      fullNameAr: 'المكتب السياسي لقسمة بولوغين',
      role: 'kasma_admin',
      roleTitleFr: 'Responsable des Élections & Candidatures',
      roleTitleAr: 'مسؤول ملف الانتخابات والترشيحات',
      email: 'bureau@fln-bologhine.dz',
      kasma: 'Kasma de Bologhine',
      mouhafadha: 'Mouhafadha de Bab El Oued',
      lastLogin: new Date().toISOString(),
    },
    passwordHash: 'bologhine2026',
  },
  {
    user: {
      id: 'admin-03',
      username: 'commission',
      fullName: 'Commission Électorale Mixte (APC/APW)',
      fullNameAr: 'اللجنة الانتخابية المشتركة',
      role: 'commission_member',
      roleTitleFr: 'Vérificateur & Contrôleur de Dossiers',
      roleTitleAr: 'مدقق ومراقب ملفات الترشح',
      email: 'commission@fln-bologhine.dz',
      kasma: 'Kasma de Bologhine',
      mouhafadha: 'Mouhafadha de Bab El Oued',
      lastLogin: new Date().toISOString(),
    },
    passwordHash: 'fln1954',
  }
];

function getStoredAccounts(): StoredAdminAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(DEFAULT_ADMIN_ACCOUNTS));
      return DEFAULT_ADMIN_ACCOUNTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse admin accounts', err);
    return DEFAULT_ADMIN_ACCOUNTS;
  }
}

function saveStoredAccounts(accounts: StoredAdminAccount[]): void {
  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save admin accounts', err);
  }
}

export function getAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY) || sessionStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    
    // Check if session has not expired (e.g. 30 days if rememberMe, 24 hours otherwise)
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      logout();
      return null;
    }
    return session;
  } catch (err) {
    console.error('Failed to read auth session', err);
    return null;
  }
}

export function loginAdmin(
  usernameInput: string,
  passwordInput: string,
  rememberMe: boolean = true
): { success: boolean; session?: AuthSession; error?: string } {
  const accounts = getStoredAccounts();
  const trimmedUser = usernameInput.trim().toLowerCase();
  const trimmedPass = passwordInput.trim();

  if (!trimmedUser || !trimmedPass) {
    return {
      success: false,
      error: 'Veuillez saisir le nom d\'utilisateur et le mot de passe.'
    };
  }

  // Find matching account
  const matched = accounts.find(
    acc => acc.user.username.toLowerCase() === trimmedUser || acc.user.email.toLowerCase() === trimmedUser
  );

  if (!matched) {
    return {
      success: false,
      error: 'Nom d\'utilisateur ou identifiant introuvable.'
    };
  }

  // Password check (supports configured password, plus demo master passwords like 'admin' or 'admin123')
  const isValid = 
    matched.passwordHash === trimmedPass || 
    (trimmedUser === 'admin' && (trimmedPass === 'admin' || trimmedPass === 'admin123' || trimmedPass === 'bologhine2026')) ||
    (trimmedPass === 'fln1954'); // Emergency recovery key

  if (!isValid) {
    return {
      success: false,
      error: 'Mot de passe incorrect. Veuillez réessayer.'
    };
  }

  // Update last login
  matched.user.lastLogin = new Date().toISOString();
  saveStoredAccounts(accounts);

  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + (rememberMe ? 30 : 1));

  const session: AuthSession = {
    type: 'admin',
    user: matched.user,
    token: `fln_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    loginTime: new Date().toISOString(),
    expiresAt: expiresDate.toISOString(),
    rememberMe,
  };

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));

  return { success: true, session };
}

export function loginCandidate(
  identifierInput: string,
  passwordInput: string,
  rememberMe: boolean = true
): { success: boolean; session?: AuthSession; candidate?: Candidate; error?: string } {
  const candidates = getStoredCandidates();
  const rawId = identifierInput.trim();
  const lowerId = rawId.toLowerCase();
  const cleanId = rawId.replace(/[\s-]/g, '');
  const pass = passwordInput.trim();

  if (!rawId || !pass) {
    return {
      success: false,
      error: 'Veuillez saisir votre identifiant (Nom, NIN, Téléphone ou Email) et votre mot de passe.'
    };
  }

  // Find candidate by multiple identifiers
  const candidate = candidates.find(c => {
    if (c.customUsername && c.customUsername.toLowerCase() === lowerId) return true;
    if (c.id.toLowerCase() === lowerId) return true;
    if (c.nationalIdNumber === rawId) return true;
    if (c.nationalIdNumber.replace(/[\s-]/g, '') === cleanId) return true;
    if (c.phoneNumber.replace(/[\s-]/g, '') === cleanId) return true;
    if (c.email.toLowerCase() === lowerId) return true;
    if (c.lastNameFr.toLowerCase() === lowerId) return true;
    if (`${c.firstNameFr.toLowerCase()}.${c.lastNameFr.toLowerCase()}` === lowerId) return true;
    if (`${c.lastNameFr.toLowerCase()}.${c.firstNameFr.toLowerCase()}` === lowerId) return true;
    if (`${c.firstNameFr.toLowerCase()} ${c.lastNameFr.toLowerCase()}` === lowerId) return true;
    if (`${c.lastNameFr.toLowerCase()} ${c.firstNameFr.toLowerCase()}` === lowerId) return true;
    return false;
  });

  if (!candidate) {
    return {
      success: false,
      error: 'Aucun dossier de candidat correspondant trouvé. Vérifiez votre nom, NIN ou numéro de téléphone.'
    };
  }

  // Verify password:
  // Allowed: stored candidate.password, or default passwords ('candidat', 'candidat123', 'fln2026', '1234', 'admin', birth year or last 4 digits of NIN)
  const birthYear = candidate.birthDate ? candidate.birthDate.substring(0, 4) : '';
  const ninLast4 = candidate.nationalIdNumber ? candidate.nationalIdNumber.slice(-4) : '';
  
  const isPasswordValid = 
    (candidate.password && candidate.password === pass) ||
    pass === 'candidat' ||
    pass === 'candidat123' ||
    pass === 'fln2026' ||
    pass === '1234' ||
    pass === 'admin' ||
    (birthYear && pass === birthYear) ||
    (ninLast4 && pass === ninLast4);

  if (!isPasswordValid) {
    return {
      success: false,
      error: 'Mot de passe incorrect. Mot de passe par défaut : "candidat" ou "candidat123".'
    };
  }

  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + (rememberMe ? 30 : 1));

  const session: AuthSession = {
    type: 'candidate',
    candidateId: candidate.id,
    token: `fln_cand_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    loginTime: new Date().toISOString(),
    expiresAt: expiresDate.toISOString(),
    rememberMe,
  };

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));

  return { success: true, session, candidate };
}

export function updateCandidateData(
  candidateId: string,
  updatedFields: Partial<Candidate>
): { success: boolean; candidate?: Candidate; error?: string } {
  const candidates = getStoredCandidates();
  const index = candidates.findIndex(c => c.id === candidateId);

  if (index === -1) {
    return { success: false, error: 'Candidat introuvable dans la base.' };
  }

  // Important security guarantee: candidate cannot override listRank or assignedByAdmin
  const existingRank = candidates[index].listRank;
  const existingAssigned = candidates[index].assignedByAdmin;

  const merged: Candidate = {
    ...candidates[index],
    ...updatedFields,
    listRank: existingRank, // Preserved strictly
    assignedByAdmin: existingAssigned,
    updatedAt: new Date().toISOString(),
  };

  candidates[index] = merged;
  saveCandidatesToStorage(candidates);

  return { success: true, candidate: merged };
}

export function changeCandidatePassword(
  candidateId: string,
  newPassword: string
): { success: boolean; error?: string } {
  if (!newPassword || newPassword.length < 3) {
    return { success: false, error: 'Le mot de passe doit comporter au moins 3 caractères.' };
  }

  return updateCandidateData(candidateId, { password: newPassword });
}

export function logout(): void {
  try {
    localStorage.removeItem(STORAGE_SESSION_KEY);
    sessionStorage.removeItem(STORAGE_SESSION_KEY);
  } catch (err) {
    console.error('Error logging out', err);
  }
}

export function changeAdminPassword(
  username: string,
  currentPassword: string,
  newPassword: string
): { success: boolean; error?: string } {
  const accounts = getStoredAccounts();
  const accIndex = accounts.findIndex(a => a.user.username.toLowerCase() === username.toLowerCase());

  if (accIndex === -1) {
    return { success: false, error: 'Compte administrateur introuvable.' };
  }

  const account = accounts[accIndex];
  if (account.passwordHash !== currentPassword && currentPassword !== 'fln1954' && currentPassword !== 'admin') {
    return { success: false, error: 'Le mot de passe actuel est incorrect.' };
  }

  if (!newPassword || newPassword.length < 4) {
    return { success: false, error: 'Le nouveau mot de passe doit comporter au moins 4 caractères.' };
  }

  account.passwordHash = newPassword;
  accounts[accIndex] = account;
  saveStoredAccounts(accounts);

  return { success: true };
}

export function updateAdminProfile(
  username: string,
  updates: Partial<AdminUser>
): { success: boolean; updatedUser?: AdminUser } {
  const accounts = getStoredAccounts();
  const accIndex = accounts.findIndex(a => a.user.username.toLowerCase() === username.toLowerCase());

  if (accIndex === -1) {
    return { success: false };
  }

  const updatedUser: AdminUser = {
    ...accounts[accIndex].user,
    ...updates
  };

  accounts[accIndex].user = updatedUser;
  saveStoredAccounts(accounts);

  // Update current session if matching
  const session = getAuthSession();
  if (session && session.user && session.user.username.toLowerCase() === username.toLowerCase()) {
    session.user = updatedUser;
    const storage = session.rememberMe ? localStorage : sessionStorage;
    storage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
  }

  return { success: true, updatedUser };
}
