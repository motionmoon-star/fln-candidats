import React, { useState, useEffect, useMemo } from 'react';
import { Candidate, CouncilType } from './types';
import { INITIAL_CANDIDATES } from './data/initialCandidates';
import { Language, TRANSLATIONS } from './data/translations';
import { 
  getStoredCandidates, 
  saveCandidatesToStorage, 
  calculateCampaignStats, 
  exportCandidatesToCSV,
  getDossierCompliance,
  fetchCandidatesFromServer,
  syncCandidatesToServer
} from './utils/candidateUtils';
import { Header } from './components/Header';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { CandidateTable } from './components/CandidateTable';
import { CandidateModal } from './components/CandidateModal';
import { CandidateFormModal } from './components/CandidateFormModal';
import { DossierPrintView } from './components/DossierPrintView';
import { ListPrintView } from './components/ListPrintView';
import { OfficialLegalGuideModal } from './components/OfficialLegalGuideModal';
import { AdminNumberingModal } from './components/AdminNumberingModal';
import { AiScannerAssistantModal } from './components/AiScannerAssistantModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AdminLoginView } from './components/AdminLoginView';
import { AdminProfileModal } from './components/AdminProfileModal';
import { DatabaseManagerModal } from './components/DatabaseManagerModal';
import { CandidatePortalView } from './components/CandidatePortalView';
import { ExtractedDocumentData, AuthSession, AdminUser } from './types';
import { getAuthSession, logout } from './utils/authUtils';
import { Scale, Info, CheckCircle2, AlertCircle, ShieldCheck, KeyRound, LogOut, UserCheck } from 'lucide-react';

export default function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => getAuthSession());
  const [isAdminProfileOpen, setIsAdminProfileOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>(() => getStoredCandidates());
  const [councilFilter, setCouncilFilter] = useState<CouncilType | 'ALL'>('ALL');
  const [language, setLanguage] = useState<Language>('fr');

  // Modals & views state
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);
  const [extractedDataForNew, setExtractedDataForNew] = useState<ExtractedDocumentData | null>(null);
  const [scannedFileForNew, setScannedFileForNew] = useState<{ dataUrl: string; fileName: string } | null>(null);
  const [isNumberingManagerOpen, setIsNumberingManagerOpen] = useState(false);
  const [printingDossierCandidate, setPrintingDossierCandidate] = useState<Candidate | null>(null);
  const [isPrintingList, setIsPrintingList] = useState(false);
  const [isShowingLegalGuide, setIsShowingLegalGuide] = useState(false);
  const [isDatabaseManagerOpen, setIsDatabaseManagerOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    saveCandidatesToStorage(candidates);
    const timer = setTimeout(() => syncCandidatesToServer(candidates), 500);
    return () => clearTimeout(timer);
  }, [candidates]);

  // Load the shared database from the server when available (never overrides local on Pages/offline)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const serverList = await fetchCandidatesFromServer();
      if (!cancelled && serverList && serverList.length > 0) {
        setCandidates(serverList);
        saveCandidatesToStorage(serverList);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Adjust document direction for Arabic support
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Handlers
  const handleUpdateCandidate = (updated: Candidate) => {
    setCandidates(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    if (selectedCandidate && selectedCandidate.id === updated.id) {
      setSelectedCandidate(updated);
    }
    showToast(language === 'ar' ? 'تم تحديث بيانات المترشح والوثائق بنجاح' : 'Dossier candidat mis à jour avec succès');
  };

  const handleSaveNewOrEditedCandidate = (candidate: Candidate) => {
    // Duplicate NIN safeguard
    const clean = (s: string) => (s || '').replace(/[\s\-_./]/g, '').trim().toLowerCase();
    const targetNIN = clean(candidate.nationalIdNumber);
    if (targetNIN.length >= 4) {
      const dup = candidates.find(c => c.id !== candidate.id && clean(c.nationalIdNumber) === targetNIN);
      if (dup) {
        showToast(
          language === 'ar' 
            ? `تنبيه: رقم بطاقة التعريف الوطنية مسجل مسبقاً للمترشح ${dup.lastNameAr || dup.lastNameFr} ${dup.firstNameAr || dup.firstNameFr}`
            : `Doublon détecté : Le NIN est déjà attribué à ${dup.lastNameFr} ${dup.firstNameFr}`
        );
        return;
      }
    }

    if (editingCandidate) {
      setCandidates(prev => prev.map(c => (c.id === candidate.id ? candidate : c)));
      showToast(language === 'ar' ? 'تم حفظ التعديلات' : 'Modifications enregistrées');
      setEditingCandidate(null);
    } else {
      setCandidates(prev => [candidate, ...prev]);
      showToast(language === 'ar' ? 'تمت إضافة المترشح إلى القائمة بنجاح' : 'Candidat ajouté avec succès à la liste');
      setIsAddingCandidate(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm(language === 'ar' ? 'هل تريد استعادة البيانات الافتراضية لقسمة بولوغين؟' : 'Réinitialiser toutes les données aux valeurs par défaut de Bologhine ?')) {
      setCandidates(INITIAL_CANDIDATES);
      saveCandidatesToStorage(INITIAL_CANDIDATES);
      showToast(language === 'ar' ? 'تمت استعادة البيانات النموذجية' : 'Données réinitialisées');
    }
  };

  const handleExportCSV = () => {
    exportCandidatesToCSV(candidates);
    showToast(language === 'ar' ? 'تم تصدير ملف CSV' : 'Exportation CSV effectuée');
  };

  const handleImportCandidates = (newCandidates: Candidate[], mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      setCandidates(newCandidates);
      saveCandidatesToStorage(newCandidates);
    } else {
      setCandidates(prev => {
        const merged = [...prev];
        for (const cand of newCandidates) {
          const existingIdx = merged.findIndex(
            c => (cand.nationalIdNumber && c.nationalIdNumber === cand.nationalIdNumber) || c.id === cand.id
          );
          if (existingIdx >= 0) {
            merged[existingIdx] = { ...merged[existingIdx], ...cand, id: merged[existingIdx].id };
          } else {
            merged.push(cand);
          }
        }
        saveCandidatesToStorage(merged);
        return merged;
      });
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    return calculateCampaignStats(candidates, councilFilter);
  }, [candidates, councilFilter]);

  // Next rank counters
  const nextRankAPC = useMemo(() => {
    const apcRanks = candidates
      .filter(c => c.council === 'APC' && c.listRank !== null)
      .map(c => c.listRank as number);
    return apcRanks.length > 0 ? Math.max(...apcRanks) + 1 : 1;
  }, [candidates]);

  const nextRankAPW = useMemo(() => {
    const apwRanks = candidates
      .filter(c => c.council === 'APW' && c.listRank !== null)
      .map(c => c.listRank as number);
    return apwRanks.length > 0 ? Math.max(...apwRanks) + 1 : 1;
  }, [candidates]);

  const handleSelectDataForNewCandidate = (data: ExtractedDocumentData, scannedDataUrl: string, fileName: string) => {
    setExtractedDataForNew(data);
    setScannedFileForNew({ dataUrl: scannedDataUrl, fileName });
    setIsAiScannerOpen(false);
    setIsAddingCandidate(true);
  };

  const handleUpdateExistingCandidateViaScanner = (
    candidateId: string,
    data: ExtractedDocumentData,
    scannedDataUrl: string,
    fileName: string
  ) => {
    setCandidates(prev =>
      prev.map(c => {
        if (c.id !== candidateId) return c;

        const docKey = data.detectedDocType || 'cni';
        const existingDoc = c.documents[docKey];

        const updatedDoc = {
          id: existingDoc?.id || `${docKey}-${Date.now()}`,
          key: docKey,
          nameFr: existingDoc?.nameFr || '',
          nameAr: existingDoc?.nameAr || '',
          status: 'conforme' as const,
          conforme: true,
          issueDate: data.issueDate || existingDoc?.issueDate || new Date().toISOString().slice(0, 10),
          referenceNumber: data.referenceNumber || existingDoc?.referenceNumber,
          notes: data.confidenceNotes || 'Document photographié/scanné et conforme',
          fileDataUrl: scannedDataUrl,
          fileName,
          scannedAt: new Date().toISOString(),
          extractedData: data,
        };

        const updatedCandidate: Candidate = {
          ...c,
          lastNameFr: c.lastNameFr || data.lastNameFr || '',
          firstNameFr: c.firstNameFr || data.firstNameFr || '',
          lastNameAr: c.lastNameAr || data.lastNameAr || '',
          firstNameAr: c.firstNameAr || data.firstNameAr || '',
          nationalIdNumber: c.nationalIdNumber || data.nationalIdNumber || '',
          birthDate: c.birthDate || data.birthDate || '',
          birthPlace: c.birthPlace || data.birthPlace || '',
          profession: c.profession || data.profession || '',
          documents: {
            ...c.documents,
            [docKey]: updatedDoc,
          },
          updatedAt: new Date().toISOString(),
        };

        return updatedCandidate;
      })
    );

    setIsAiScannerOpen(false);
    showToast(language === 'ar' ? 'تم مسح الوثيقة وتحديث ملف المترشح بنجاح' : 'Document scanné et dossier mis à jour avec succès');
  };

  const handleSaveNumbering = (updatedCandidates: Candidate[]) => {
    setCandidates(updatedCandidates);
    saveCandidatesToStorage(updatedCandidates);
    showToast(
      language === 'ar'
        ? 'تم حفظ واعتماد الترتيب والأرقام الرسمية بنجاح'
        : 'Numérotation et classement officiels enregistrés'
    );
  };

  const handleDeleteCandidate = (candidateId: string) => {
    const updated = candidates.filter(c => c.id !== candidateId);
    setCandidates(updated);
    saveCandidatesToStorage(updated);
    if (selectedCandidate && selectedCandidate.id === candidateId) {
      setSelectedCandidate(null);
    }
    showToast(
      language === 'ar'
        ? 'تم حذف المترشح من القائمة بنجاح'
        : 'Candidat supprimé de la liste avec succès'
    );
  };

  const handleDeleteAllExceptHasbaloui = () => {
    // Find candidate Hasbaloui
    const hasbaoui = candidates.find(c => {
      const lFr = (c.lastNameFr || '').toUpperCase();
      const fFr = (c.firstNameFr || '').toUpperCase();
      const lAr = c.lastNameAr || '';
      return lFr.includes('HASBA') || lFr.includes('HASBAL') || fFr.includes('HASBA') || lAr.includes('حسبلا');
    });

    const singleCandidate = hasbaoui || INITIAL_CANDIDATES[0];
    setCandidates([singleCandidate]);
    saveCandidatesToStorage([singleCandidate]);
    if (selectedCandidate && selectedCandidate.id !== singleCandidate.id) {
      setSelectedCandidate(null);
    }
    showToast(
      language === 'ar'
        ? 'تم حذف جميع المترشحين والإبقاء على المترشh حسبلاوي (مترشح واحد فقط)'
        : 'Tous les candidats ont été supprimés sauf Hasbaloui (1 seul candidat)'
    );
  };

  // Enforce migration to single candidate Hasbaloui if old mock list is loaded
  useEffect(() => {
    const hasLegacyMocks = candidates.some(c => 
      ['BELKACEMI', 'BOUZIDI', 'MEZIANE', 'CHAOUCHE', 'HAMDANI'].includes((c.lastNameFr || '').toUpperCase())
    );
    if (hasLegacyMocks || (candidates.length > 1 && !candidates.some(c => (c.lastNameFr || '').toUpperCase().includes('HASBA')))) {
      handleDeleteAllExceptHasbaloui();
    }
  }, []);

  const handleAssignRankDirect = (candidateId: string, newRank: number | null) => {
    const updated = candidates.map(c => {
      if (c.id === candidateId) {
        return {
          ...c,
          listRank: newRank,
          assignedByAdmin: newRank !== null,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    setCandidates(updated);
    saveCandidatesToStorage(updated);
    showToast(
      newRank !== null
        ? (language === 'ar' ? `تم تعيين الرقم ${newRank} للمترشح بنجاح` : `Numéro ${newRank} attribué au candidat`)
        : (language === 'ar' ? 'تم إلغاء رقم المترشح (غير مصنف حالياً)' : 'Numéro du candidat retiré')
    );
  };

  const apcCount = useMemo(() => candidates.filter(c => c.council === 'APC').length, [candidates]);
  const apwCount = useMemo(() => candidates.filter(c => c.council === 'APW').length, [candidates]);
  const completeCount = useMemo(() => candidates.filter(c => getDossierCompliance(c).isComplete).length, [candidates]);

  // Authentication Guard: If not logged in, enforce Login Portal
  if (!authSession) {
    return (
      <AdminLoginView
        language={language}
        onLanguageChange={setLanguage}
        onLoginSuccess={(session) => {
          setAuthSession(session);
          if (session.type === 'candidate' && session.candidateId) {
            const cand = candidates.find(c => c.id === session.candidateId);
            showToast(
              language === 'ar'
                ? `مرحباً بك يا ${cand ? cand.firstNameAr : ''} في فضائك الشخصي كمترشح`
                : `Bienvenue ${cand ? cand.firstNameFr : ''} sur votre espace candidat`
            );
          } else if (session.user) {
            showToast(
              language === 'ar'
                ? `مرحباً بك يا ${session.user.fullNameAr || session.user.fullName} في لوحة إدارة قسمة بولوغين`
                : `Bienvenue ${session.user.fullName} sur l'espace d'administration FLN Bologhine`
            );
          }
        }}
      />
    );
  }

  // Candidate Session Interface (Strictly hides listRank / list number)
  if (authSession.type === 'candidate' && authSession.candidateId) {
    const currentCandidate = candidates.find(c => c.id === authSession.candidateId);
    if (currentCandidate) {
      return (
        <>
          {notification && (
            <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-[0_18px_40px_-16px_rgba(3,29,20,0.8)] text-xs font-medium flex items-center gap-2 border border-gold-500/50 animate-in fade-in slide-in-from-bottom-4 duration-200" style={{ background: 'rgba(3,29,20,0.97)', color: '#f3e9d2' }}>
              <CheckCircle2 className="w-4 h-4 text-gold-400" />
              <span>{notification}</span>
            </div>
          )}
          <CandidatePortalView
            candidate={currentCandidate}
            language={language}
            onLanguageChange={setLanguage}
            onLogout={() => {
              logout();
              setAuthSession(null);
              showToast(language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Déconnexion réussie');
            }}
            onCandidateUpdated={(updated) => {
              handleUpdateCandidate(updated);
            }}
            onSwitchToAdmin={() => {
              logout();
              setAuthSession(null);
            }}
            onToast={showToast}
          />
        </>
      );
    }
  }

  // Ensure admin user exists for admin dashboard
  if (!authSession.user) {
    return (
      <AdminLoginView
        language={language}
        onLanguageChange={setLanguage}
        onLoginSuccess={(session) => setAuthSession(session)}
      />
    );
  }

  const currentAdminUser = authSession.user;

  return (
    <div className={`min-h-screen texture-ivory text-ink flex flex-col font-sans ${language === 'ar' ? 'font-arabic' : ''}`}>
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-[0_18px_40px_-16px_rgba(3,29,20,0.8)] text-xs font-medium flex items-center gap-2 border border-gold-500/50 animate-in fade-in slide-in-from-bottom-4 duration-200" style={{ background: 'rgba(3,29,20,0.97)', color: '#f3e9d2' }}>
          <CheckCircle2 className="w-4 h-4 text-gold-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Header with Admin Session Controls */}
      <Header
        currentCouncil={councilFilter}
        onCouncilChange={setCouncilFilter}
        language={language}
        onLanguageChange={setLanguage}
        onOpenAddModal={() => setIsAddingCandidate(true)}
        onOpenNumberingManager={() => setIsNumberingManagerOpen(true)}
        onOpenAiScanner={() => setIsAiScannerOpen(true)}
        onOpenDatabaseManager={() => setIsDatabaseManagerOpen(true)}
        onExportCSV={handleExportCSV}
        onPrintList={() => setIsPrintingList(true)}
        onResetData={handleResetData}
        adminUser={currentAdminUser}
        onOpenAdminProfile={() => setIsAdminProfileOpen(true)}
        onLogout={() => {
          logout();
          setAuthSession(null);
          showToast(language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Déconnexion réussie');
        }}
        apcCount={apcCount}
        apwCount={apwCount}
        completeCount={completeCount}
        totalCount={candidates.length}
      />

      {/* Admin Security & Authority Bar */}
      <div className="theme-surface px-3.5 sm:px-6 py-2.5 sm:py-2.5 border-b border-gold-500/40 shadow-inner" style={{ background: 'var(--security-grad)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 text-xs">
          
          {/* Admin Identity & Authority Section */}
          <div className="space-y-1.5 min-w-0">
            {/* Top row status badge & username */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-fln-950/60 text-gold-200 px-2.5 py-0.5 rounded-md text-[10px] font-bold border border-gold-500/40 shadow-2xs shrink-0">
                <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse shadow-xs" />
                <span>{language === 'ar' ? 'جلسة مسؤول معتمدة' : 'Session Administrateur Active'}</span>
              </span>

              <span className="text-gold-200 font-mono text-[11px] bg-fln-950/70 px-2 py-0.5 rounded border border-gold-500/40 font-bold shrink-0">
                @{currentAdminUser.username}
              </span>

              <span className="text-gold-400/60 hidden md:inline">•</span>

              <span className="text-gold-200/80 text-[11px] hidden md:inline">
                {language === 'ar' ? currentAdminUser.roleTitleAr : currentAdminUser.roleTitleFr}
              </span>
            </div>

            {/* Admin Full Name and Kasma Title */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-gold-500 border border-gold-300 text-fln-950 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-fln-900" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-white text-xs sm:text-sm leading-tight font-arabic truncate">
                  {language === 'ar' ? currentAdminUser.fullNameAr || currentAdminUser.fullName : currentAdminUser.fullName}
                </div>
                <div className="text-[10px] text-gold-200/80 md:hidden truncate font-medium">
                  {language === 'ar' ? currentAdminUser.roleTitleAr : currentAdminUser.roleTitleFr}
                </div>
              </div>
            </div>
          </div>

          {/* Action Controls - Responsive: Touch-friendly 2-column grid on phone, inline on desktop */}
          <div className="grid grid-cols-2 md:flex md:items-center gap-2 w-full md:w-auto shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-gold-500/30">
            <button
              type="button"
              onClick={() => setIsAdminProfileOpen(true)}
              className="min-h-[44px] md:min-h-0 py-2 md:py-1 px-3 rounded-xl md:rounded-lg text-xs md:text-[11px] font-bold md:font-medium text-on-surface bg-chip hover:bg-chip-strong active:scale-95 border border-gold-500/40 flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Paramètres de sécurité et profil / أمان الحساب"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate">{language === 'ar' ? 'أمان الحساب وكلمة المرور' : 'Sécurité & Mot de passe'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                logout();
                setAuthSession(null);
                showToast(language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Déconnexion réussie');
              }}
              className="min-h-[44px] md:min-h-0 py-2 md:py-1 px-3 rounded-xl md:rounded-lg text-xs md:text-[11px] font-bold md:font-medium text-rose-200 bg-rose-950/80 hover:bg-rose-900 active:scale-95 border border-rose-800/80 flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Quitter la session / تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-300 shrink-0" />
              <span className="truncate">{language === 'ar' ? 'تسجيل الخروج' : 'Déconnexion'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-5 space-y-3.5 sm:space-y-5 pb-24 md:pb-8">
        
        {/* Sub-header Banner with Kasma Campaign Identity & Legal Guide Link */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 bg-paper p-3 sm:p-3.5 rounded-xl border border-gold-300/70 shadow-2xs">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-2 h-7 sm:w-2.5 sm:h-8 bg-gold-600 rounded-full shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-fln-900 flex items-center gap-2 truncate">
                <span>
                  {councilFilter === 'ALL' 
                    ? (language === 'ar' ? 'المتابعة الشاملة لملفات الترشح (APC & APW)' : 'Dossiers de Candidature : APC Bologhine & APW Alger') 
                    : councilFilter === 'APC'
                    ? (language === 'ar' ? 'ملفات ترشح المجلس الشعبي البلدي - بولوغين (23 مقعد)' : 'Candidatures au Conseil Populaire Communal de Bologhine (APC)')
                    : (language === 'ar' ? 'ملفات ترشح المجلس الشعبي الولائي - دائرة باب الوادي' : 'Candidatures au Conseil Populaire de Wilaya d\'Alger (APW)')}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-inksoft truncate">
                {language === 'ar'
                  ? 'مراقبة الـ 11 وثيقة الإدارية، إحصائيات المناصفة والشباب، وتجهيز الإيداع'
                  : 'Suivi de conformité des 11 pièces administratives, quotas et consolidation de liste'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsShowingLegalGuide(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-gold-50 hover:bg-gold-100 text-gold-900 border border-gold-300 transition-colors cursor-pointer w-full sm:w-auto justify-center"
            >
              <Scale className="w-3.5 h-3.5 text-gold-700" />
              <span>{language === 'ar' ? 'شروط الترشح (ANIE)' : 'Conditions Légales ANIE'}</span>
            </button>
          </div>
        </div>

        {/* Campaign Analytics & Vigilance Section */}
        <DashboardAnalytics
          stats={stats}
          candidates={candidates}
          language={language}
          onSelectCandidate={setSelectedCandidate}
        />

        {/* Candidate Table & 11 Documents Management */}
        <CandidateTable
          candidates={candidates}
          language={language}
          currentCouncilFilter={councilFilter}
          onSelectCandidate={setSelectedCandidate}
          onEditCandidate={cand => setEditingCandidate(cand)}
          onDeleteCandidate={handleDeleteCandidate}
          onPrintDossierSlip={cand => setPrintingDossierCandidate(cand)}
          onOpenNumberingManager={() => setIsNumberingManagerOpen(true)}
          onAssignRankDirect={handleAssignRankDirect}
        />
      </main>

      {/* Footer */}
      <footer className="bg-paper border-t border-gold-300/70 py-4 mt-6 sm:mt-8 mb-16 md:mb-0 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-inksoft text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center">
            <span className="font-bold text-fln-900 font-display">حزب جبهة التحرير الوطني</span>
            <span className="text-gold-600">•</span>
            <span>قسمة بولوغين - محافظة باب الوادي</span>
          </div>
          <div className="text-[11px]">
            {language === 'ar' 
              ? 'تطبيق إدارة وتدقيق ملفات الترشح للانتخابات المحلية والولائية' 
              : 'Application de gestion et d\'analyse des dossiers de candidature APC / APW'}
          </div>
        </div>
      </footer>

      {/* Candidate Dossier Detail Audit Modal */}
      {selectedCandidate && (
        <CandidateModal
          candidate={selectedCandidate}
          language={language}
          onClose={() => setSelectedCandidate(null)}
          onUpdateCandidate={handleUpdateCandidate}
          onDeleteCandidate={handleDeleteCandidate}
          onPrintSlip={cand => {
            setSelectedCandidate(null);
            setPrintingDossierCandidate(cand);
          }}
        />
      )}

      {/* Add / Edit Candidate Modal */}
      {(isAddingCandidate || editingCandidate) && (
        <CandidateFormModal
          initialCandidate={editingCandidate}
          initialExtractedData={extractedDataForNew}
          initialScannedFile={scannedFileForNew}
          existingCandidates={candidates}
          language={language}
          onClose={() => {
            setIsAddingCandidate(false);
            setEditingCandidate(null);
            setExtractedDataForNew(null);
            setScannedFileForNew(null);
          }}
          onSave={handleSaveNewOrEditedCandidate}
          nextRankAPC={nextRankAPC}
          nextRankAPW={nextRankAPW}
        />
      )}

      {/* Printable Single Dossier Official Slip */}
      {printingDossierCandidate && (
        <DossierPrintView
          candidate={printingDossierCandidate}
          onClose={() => setPrintingDossierCandidate(null)}
        />
      )}

      {/* Printable Full Candidate List */}
      {isPrintingList && (
        <ListPrintView
          candidates={candidates}
          council={councilFilter}
          onClose={() => setIsPrintingList(false)}
        />
      )}

      {/* Official Legal Requirements Modal */}
      {isShowingLegalGuide && (
        <OfficialLegalGuideModal
          language={language}
          onClose={() => setIsShowingLegalGuide(false)}
        />
      )}

      {/* Admin Official Candidate Numbering and Ordering Manager */}
      {isNumberingManagerOpen && (
        <AdminNumberingModal
          candidates={candidates}
          language={language}
          currentCouncil={councilFilter === 'ALL' ? 'APC' : councilFilter}
          onClose={() => setIsNumberingManagerOpen(false)}
          onSaveOrder={handleSaveNumbering}
          onDeleteCandidate={handleDeleteCandidate}
          onDeleteAllExceptHasbaloui={handleDeleteAllExceptHasbaloui}
        />
      )}

      {/* AI Document & Camera Scanner Assistant */}
      {isAiScannerOpen && (
        <AiScannerAssistantModal
          candidates={candidates}
          language={language}
          currentCouncil={councilFilter === 'ALL' ? 'APC' : councilFilter}
          onClose={() => setIsAiScannerOpen(false)}
          onSelectDataForNewCandidate={handleSelectDataForNewCandidate}
          onUpdateExistingCandidate={handleUpdateExistingCandidateViaScanner}
        />
      )}

      {/* Admin Profile & Security Settings Modal */}
      {isAdminProfileOpen && (
        <AdminProfileModal
          admin={currentAdminUser}
          language={language}
          onClose={() => setIsAdminProfileOpen(false)}
          onLogout={() => {
            setIsAdminProfileOpen(false);
            logout();
            setAuthSession(null);
            showToast(language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Déconnexion réussie');
          }}
          onUpdateAdmin={(updated) => {
            setAuthSession({ ...authSession, user: updated });
          }}
          onToast={showToast}
        />
      )}

      {/* Database Manager & GitHub Synchronization Modal */}
      {isDatabaseManagerOpen && (
        <DatabaseManagerModal
          isOpen={isDatabaseManagerOpen}
          onClose={() => setIsDatabaseManagerOpen(false)}
          language={language}
          candidates={candidates}
          onImportCandidates={handleImportCandidates}
          showToast={showToast}
          onDeleteCandidate={handleDeleteCandidate}
          onDeleteAllExceptHasbaloui={handleDeleteAllExceptHasbaloui}
        />
      )}

      {/* Sticky Bottom Navigation Bar for Mobile Phones */}
      <MobileBottomNav
        language={language}
        onOpenAddModal={() => {
          setEditingCandidate(null);
          setExtractedDataForNew(null);
          setScannedFileForNew(null);
          setIsAddingCandidate(true);
        }}
        onOpenAiScanner={() => setIsAiScannerOpen(true)}
        onOpenNumberingManager={() => setIsNumberingManagerOpen(true)}
        onPrintList={() => setIsPrintingList(true)}
        onOpenLegalGuide={() => setIsShowingLegalGuide(true)}
      />

    </div>
  );
}
