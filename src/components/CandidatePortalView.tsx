import React, { useState } from 'react';
import { Candidate, Language, DocumentItem, Gender, MilitaryStatus } from '../types';
import { BologhineLogo } from './BologhineLogo';
import { ADMINISTRATIVE_DOCUMENTS } from '../data/documentsList';
import { getDossierCompliance, calculateAge, isYouth, formatPhoneNumber, getCleanTelUrl } from '../utils/candidateUtils';
import { updateCandidateData, changeCandidatePassword } from '../utils/authUtils';
import {
  User,
  Shield,
  FileText,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit3,
  Save,
  X,
  LogOut,
  Languages,
  Upload,
  FileCheck,
  Building2,
  Landmark,
  KeyRound,
  Info,
  BadgeCheck,
  Smartphone,
  Sparkles
} from 'lucide-react';

interface CandidatePortalViewProps {
  candidate: Candidate;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
  onCandidateUpdated: (updated: Candidate) => void;
  onSwitchToAdmin?: () => void;
  onToast: (msg: string) => void;
}

export const CandidatePortalView: React.FC<CandidatePortalViewProps> = ({
  candidate,
  language,
  onLanguageChange,
  onLogout,
  onCandidateUpdated,
  onSwitchToAdmin,
  onToast,
}) => {
  const isAr = language === 'ar';
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'documents'>('info');

  // Correction Form State
  const [formData, setFormData] = useState({
    lastNameFr: candidate.lastNameFr,
    firstNameFr: candidate.firstNameFr,
    lastNameAr: candidate.lastNameAr,
    firstNameAr: candidate.firstNameAr,
    gender: candidate.gender,
    birthDate: candidate.birthDate,
    birthPlace: candidate.birthPlace,
    phoneNumber: candidate.phoneNumber,
    email: candidate.email,
    addressNeighborhood: candidate.addressNeighborhood,
    profession: candidate.profession,
    educationLevel: candidate.educationLevel,
    isUniversityGraduate: candidate.isUniversityGraduate,
    militaryStatus: candidate.militaryStatus,
    partyMembershipNumber: candidate.partyMembershipNumber,
    partyJoinYear: candidate.partyJoinYear,
    notes: candidate.notes || '',
  });

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Document upload state
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);

  const compliance = getDossierCompliance(candidate);
  const age = calculateAge(candidate.birthDate);
  const youth = isYouth(candidate.birthDate);

  const handleSaveCorrections = (e: React.FormEvent) => {
    e.preventDefault();
    const result = updateCandidateData(candidate.id, {
      ...formData,
      // Security: listRank is explicitly NEVER passed from form and cannot be modified by the candidate
    });

    if (result.success && result.candidate) {
      onCandidateUpdated(result.candidate);
      setIsEditing(false);
      onToast(
        isAr 
          ? 'تم حفظ وتصحيح معلوماتك بنجاح في سجل القسمة' 
          : 'Vos informations ont été corrigées et enregistrées avec succès.'
      );
    } else {
      onToast(result.error || (isAr ? 'حدث خطأ أثناء الحفظ' : 'Erreur lors de l\'enregistrement.'));
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 4) {
      setPasswordError(isAr ? 'يجب أن تتكون كلمة المرور من 4 أحرف على الأقل' : 'Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(isAr ? 'كلمتا المرور غير متطابقتين' : 'Les mots de passe ne correspondent pas.');
      return;
    }

    const res = changeCandidatePassword(candidate.id, newPassword);
    if (res.success) {
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      onToast(isAr ? 'تم تغيير كلمة المرور بنجاح' : 'Votre mot de passe a été mis à jour avec succès.');
    } else {
      setPasswordError(res.error || (isAr ? 'فشل التحديث' : 'Erreur lors du changement de mot de passe.'));
    }
  };

  const handleDocumentFileUpload = (docKey: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const currentDoc = candidate.documents?.[docKey] || {
        id: `${docKey}-${Date.now()}`,
        key: docKey,
        nameFr: ADMINISTRATIVE_DOCUMENTS.find(d => d.key === docKey)?.nameFr || docKey,
        nameAr: ADMINISTRATIVE_DOCUMENTS.find(d => d.key === docKey)?.nameAr || docKey,
        status: 'en_attente',
        conforme: false,
      };

      const updatedDocuments: Record<string, DocumentItem> = {
        ...candidate.documents,
        [docKey]: {
          ...currentDoc,
          fileDataUrl: dataUrl,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          scannedAt: new Date().toISOString(),
          status: 'en_attente', // Placed in review for Kasma committee
          notes: isAr ? 'تم إيداع الوثيقة من قبل المترشح وفي انتظار مراجعة اللجنة' : 'Document déposé par le candidat - En attente de validation Kasma'
        }
      };

      const res = updateCandidateData(candidate.id, { documents: updatedDocuments });
      if (res.success && res.candidate) {
        onCandidateUpdated(res.candidate);
        setUploadingDocKey(null);
        onToast(isAr ? 'تم تحميل الوثيقة بنجاح وإرسالها للجنة' : 'Document téléversé avec succès et transmis à la commission.');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`min-h-screen texture-ivory text-ink flex flex-col font-sans ${isAr ? 'font-arabic' : ''}`}>
      
      {/* Algerian National Ribbon */}
      <div className="h-1.5 w-full ribbon-algerie rounded-none block relative z-30">
        <span className="g !w-full !h-full"></span>
        <span className="w !w-full !h-full"></span>
        <span className="r !w-full !h-full"></span>
      </div>

      {/* Top Header */}
      <header className="bg-paper/95 border-b border-gold-300/70 sticky top-0 z-30 shadow-xs backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 sm:gap-3">
            
            {/* Left: Emblem & Official Kasma Title */}
            <div className="flex items-center justify-between min-w-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <BologhineLogo size="sm" withBorder interactive={false} className="shrink-0 shadow-xs" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {isAr ? 'جبهة التحرير الوطني • FLN' : 'F.L.N • Kasma Bologhine'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                      {isAr ? 'فضاء المترشح' : 'Espace Candidat'}
                    </span>
                  </div>
                  <h1 className="font-display text-xs sm:text-sm md:text-base font-black text-fln-900 leading-tight truncate mt-0.5">
                    <span className="hidden sm:inline">
                      {isAr 
                        ? 'منصة المترشح • انتخابات المجالس الشعبية البلدية والولائية 2026' 
                        : 'Portail du Candidat • Élections APC & APW 2026'}
                    </span>
                    <span className="sm:hidden">
                      {isAr ? 'منصة المترشح • انتخابات 2026' : 'Portail Candidat • 2026'}
                    </span>
                  </h1>
                </div>
              </div>

              {/* Mobile Quick Action Buttons (visible only on mobile) */}
              <div className="flex items-center gap-1.5 md:hidden shrink-0">
                <button
                  type="button"
                  onClick={() => onLanguageChange(isAr ? 'fr' : 'ar')}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                  title="Changer de langue / تغيير اللغة"
                >
                  <Languages className="w-4 h-4 text-emerald-600" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                  title={isAr ? 'تغيير كلمة المرور' : 'Modifier mot de passe'}
                >
                  <KeyRound className="w-4 h-4 text-amber-600" />
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                  title={isAr ? 'تسجيل الخروج' : 'Déconnexion'}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Candidate Summary Card & Desktop Actions */}
            <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              
              {/* Candidate Info Pill */}
              <div className="flex items-center gap-2 bg-slate-50/90 border border-slate-200/90 px-2.5 py-1.5 rounded-xl min-w-0">
                {candidate.photoUrl ? (
                  <img
                    src={candidate.photoUrl}
                    alt={`${candidate.lastNameFr} ${candidate.firstNameFr}`}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {candidate.lastNameAr?.charAt(0) || candidate.lastNameFr?.charAt(0) || 'م'}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-slate-900 text-xs sm:text-sm truncate">
                      {isAr ? `${candidate.lastNameAr} ${candidate.firstNameAr}` : `${candidate.firstNameFr} ${candidate.lastNameFr}`}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                      candidate.council === 'APC'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                    }`}>
                      {candidate.council === 'APC' ? (isAr ? 'APC بولوغين' : 'APC Bologhine') : (isAr ? 'APW الجزائر' : 'APW Alger')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <span>{compliance.isComplete ? (isAr ? '✓ الملف مكتمل (11/11)' : '✓ Dossier complet') : `${compliance.conformeCount}/11 ${isAr ? 'مطابقة' : 'conformes'}`}</span>
                  </div>
                </div>
              </div>

              {/* Desktop Actions Bar */}
              <div className="hidden md:flex items-center gap-2 shrink-0">
                {/* Language Switch */}
                <button
                  type="button"
                  onClick={() => onLanguageChange(isAr ? 'fr' : 'ar')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                  title="Changer de langue / تغيير اللغة"
                >
                  <Languages className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'Français' : 'العربية'}</span>
                </button>

                {/* Password Security */}
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                  title={isAr ? 'تغيير كلمة المرور' : 'Modifier mot de passe'}
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isAr ? 'كلمة المرور' : 'Sécurité'}</span>
                </button>

                {/* Admin Switch (if demo/assisted mode) */}
                {onSwitchToAdmin && (
                  <button
                    type="button"
                    onClick={onSwitchToAdmin}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer transition-colors"
                    title={isAr ? 'العودة للوحة الإدارة' : 'Mode Admin'}
                  >
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden lg:inline">{isAr ? 'الإدارة' : 'Admin'}</span>
                  </button>
                )}

                {/* Logout */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                  title={isAr ? 'تسجيل الخروج' : 'Déconnexion'}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isAr ? 'خروج' : 'Déconnexion'}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* STRICT CONFIDENTIALITY & RULE BANNER: RANK NUMBER CONCEALMENT */}
      <div className="theme-surface px-3 sm:px-6 py-2 shadow-inner border-b border-gold-500/40" style={{ background: 'var(--security-grad)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-bold border border-amber-500/40 shrink-0 text-[11px]">
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>{isAr ? 'سرية ترتيب القائمة' : 'Confidentialité Électorale'}</span>
            </span>
            <span className="font-medium text-emerald-100 text-xs leading-relaxed">
              {isAr 
                ? 'رقم الترتيب في القائمة سري ومحفوظ حصرياً لمداولة لجنة القسمة والمحافظة (غير معلن للمترشحين).'
                : 'Numéro d\'ordre dans la liste : Délibéré confidentiel et souverain de la Commission de Kasma (Non communicable).'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-300 self-start md:self-auto shrink-0 flex-wrap">
            <span className="bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-700/60">
              NIN: {candidate.nationalIdNumber ? `${candidate.nationalIdNumber.substring(0, 6)}******` : 'Enregistré'}
            </span>
            <span className="bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-700/60 font-sans font-semibold">
              {candidate.council === 'APC' ? 'APC Bologhine' : 'APW Alger'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        
        {/* Welcome Card & Verification Invitation */}
        <div className="bg-paper rounded-2xl border border-gold-300/70 shadow-[0_18px_40px_-28px_rgba(110,84,24,0.5)] p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-gold-900 bg-gold-100 px-2 py-0.5 rounded border border-gold-300 mb-1">
              <BadgeCheck className="w-3.5 h-3.5 text-gold-700" />
              <span>{isAr ? 'بوابة التحقق والتصحيح الذاتي' : 'Espace de Consultation & Correction Individuelle'}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-display font-black text-fln-900">
              {isAr 
                ? `مرحباً بك يا ${candidate.firstNameAr} ${candidate.lastNameAr}`
                : `Bienvenue, ${candidate.firstNameFr} ${candidate.lastNameFr}`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              {isAr
                ? 'يرجى مراجعة كافة بياناتك الشخصية وحالة ملفك الإداري المودع لدى قسمة بولوغين. إذا لاحظت أي خطأ في الاسم، تاريخ الميلاد، الشهادة، أو رقم الهاتف، يمكنك تصحيحه فوراً بالضغط على زر "تصحيح بياناتي".'
                : 'Veuillez vérifier attentivement vos informations et les pièces de votre dossier de candidature. En cas d\'erreur d\'orthographe, de contact ou de qualification, vous pouvez rectifier vos données immédiatement en cliquant sur "Corriger mes informations".'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>{isAr ? 'تصحيح وتعديل بياناتي' : 'Corriger mes informations'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>{isAr ? 'إلغاء التعديل' : 'Fermer le mode édition'}</span>
              </button>
            )}

            {onSwitchToAdmin && (
              <button
                type="button"
                onClick={onSwitchToAdmin}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer"
                title="Accès Administrateur Démo"
              >
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span>{isAr ? 'فضاء الإدارة' : 'Mode Admin'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Compliance Progress Overview */}
        <div className="bg-paper rounded-2xl border border-gold-300/70 shadow-[0_18px_40px_-28px_rgba(110,84,24,0.5)] p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                {isAr ? 'مستوى اكتمال ومطابقة ملف الترشح' : 'Conformité du Dossier Administratif'}
              </span>
              <p className="text-xs text-slate-500">
                {compliance.conformeCount} / {compliance.totalCount} {isAr ? 'وثيقة مطابقة ومعتمدة قانونياً' : 'pièces conformes et validées par la commission'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                compliance.isComplete 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {compliance.percentage}% {compliance.isComplete ? (isAr ? 'ملف مكتمل' : 'Complet') : (isAr ? 'قيد الاستكمال' : 'En cours')}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                compliance.isComplete ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
              style={{ width: `${compliance.percentage}%` }}
            />
          </div>

          {/* Missing docs warning if any */}
          {compliance.missingDocs.length > 0 && (
            <div className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block">
                  {isAr ? 'وثائق متبقية لاستكمال الملف :' : 'Pièces en attente pour finalisation du dossier :'}
                </strong>
                <span className="text-[11px] text-amber-800">
                  {compliance.missingDocs.slice(0, 3).join(' • ')} {compliance.missingDocs.length > 3 ? `(+${compliance.missingDocs.length - 3} autres)` : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* View vs Edit Mode */}
        {isEditing ? (
          /* ================= CORRECTION FORM ================= */
          <form onSubmit={handleSaveCorrections} className="bg-paper rounded-2xl border-2 border-gold-500/80 shadow-md p-4 sm:p-6 space-y-6">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-800">
                  {isAr ? 'تصحيح وتعديل بيانات المترشح' : 'Formulaire de Rectification des Informations'}
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {isAr ? 'قم بتصحيح الأخطاء واضغط حفظ' : 'Corrigez les erreurs et cliquez sur Enregistrer'}
              </span>
            </div>

            {/* Notice */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                {isAr 
                  ? 'ملاحظة: رقم الترتيب في القائمة ومجلس الترشح (APC/APW) محجوزان لإدارة القسمة ولن يتم تعديلهما. يمكنك تصحيح كافة المعلومات الشخصية، المهنية ورقم الهاتف.'
                  : 'Note : Le conseil de candidature (APC/APW) et le classement sur la liste sont réservés à la commission de Kasma. Vous pouvez rectifier toute votre identité, vos contacts et vos diplômes.'}
              </p>
            </div>

            {/* Section 1: Nom & Prénom FR / AR */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                {isAr ? '1. الهوية والاسم واللقب' : '1. Identité & État Civil'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom de famille (Français) *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastNameFr}
                    onChange={e => setFormData({ ...formData, lastNameFr: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prénom (Français) *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstNameFr}
                    onChange={e => setFormData({ ...formData, firstNameFr: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اللقب بالعربية *</label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={formData.lastNameAr}
                    onChange={e => setFormData({ ...formData, lastNameAr: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-arabic font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاسم بالعربية *</label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={formData.firstNameAr}
                    onChange={e => setFormData({ ...formData, firstNameAr: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-arabic font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Date & Lieu de Naissance, Sexe, Service National */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                {isAr ? '2. تاريخ ومكان الميلاد والخدمة الوطنية' : '2. Date & Lieu de Naissance'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'تاريخ الميلاد' : 'Date de Naissance'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'مكان الميلاد' : 'Lieu de Naissance'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.birthPlace}
                    onChange={e => setFormData({ ...formData, birthPlace: e.target.value })}
                    placeholder="Bologhine, Alger"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'الجنس' : 'Genre'}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="H">{isAr ? 'رجل (Homme)' : 'Homme'}</option>
                    <option value="F">{isAr ? 'امرأة (Femme)' : 'Femme'}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'الخدمة الوطنية' : 'Service National'}
                  </label>
                  <select
                    value={formData.militaryStatus}
                    onChange={e => setFormData({ ...formData, militaryStatus: e.target.value as MilitaryStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                  >
                    <option value="accompli">{isAr ? 'مؤدى (Accompli)' : 'Accompli'}</option>
                    <option value="dispense">{isAr ? 'معفى (Dispensé)' : 'Dispensé'}</option>
                    <option value="exempte">{isAr ? 'معفى طبياً (Exempté)' : 'Exempté'}</option>
                    <option value="sursis">{isAr ? 'مؤجل (Sursis)' : 'Sursis'}</option>
                    <option value="non_concerne">{isAr ? 'غير معني (Non concerné)' : 'Non concerné'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Contact & Quartier Bologhine */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                {isAr ? '3. الاتصال والإقامة في بولوغين' : '3. Coordonnées & Résidence à Bologhine'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'رقم الهاتف المحمول' : 'Numéro de Téléphone'} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="0550 12 34 56"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'البريد الإلكتروني' : 'Adresse Email'} *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nom@exemple.dz"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'الحي السكني ببولوغين' : 'Quartier de Résidence (Bologhine)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.addressNeighborhood}
                    onChange={e => setFormData({ ...formData, addressNeighborhood: e.target.value })}
                    placeholder={isAr ? "السيدة الإفريقية، ابن الزيري، إلخ." : "Notre Dame d'Afrique, Ibn Ziri, etc."}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Profession & Niveau d'études */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                {isAr ? '4. المهنة والمستوى الدراسي' : '4. Profession & Niveau d\'études'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'المهنة والوظيفة الحالية' : 'Profession Actuelle'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.profession}
                    onChange={e => setFormData({ ...formData, profession: e.target.value })}
                    placeholder="Médecin, Enseignant, Ingénieur, etc."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'المستوى الدراسي والشهادة' : 'Niveau d\'études / Diplôme'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.educationLevel}
                    onChange={e => setFormData({ ...formData, educationLevel: e.target.value })}
                    placeholder="Doctorat, Master, Licence, Technicien, etc."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isUniversityGraduate}
                      onChange={e => setFormData({ ...formData, isUniversityGraduate: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-800">
                      {isAr ? 'حاصل على شهادة جامعية (Quota Universitaire)' : 'Titulaire d\'un diplôme universitaire'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 5: Militantisme FLN */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                {isAr ? '5. بيانات الانخراط بحزب جبهة التحرير الوطني' : '5. Militantisme F.L.N'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'رقم بطاقة الانخراط' : 'N° Carte de Militant FLN'}
                  </label>
                  <input
                    type="text"
                    value={formData.partyMembershipNumber}
                    onChange={e => setFormData({ ...formData, partyMembershipNumber: e.target.value })}
                    placeholder="FLN-BO-2020-XXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'سنة الانخراط الأولى' : 'Année d\'adhésion au FLN'}
                  </label>
                  <input
                    type="number"
                    value={formData.partyJoinYear}
                    onChange={e => setFormData({ ...formData, partyJoinYear: parseInt(e.target.value) || 2020 })}
                    placeholder="2012"
                    min={1954}
                    max={2026}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Observations / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'ملاحظات أو توضيحات موجهة للجنة الانتخابية للقسمة' : 'Observations ou précisions à l\'attention de la Kasma'}
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder={isAr ? 'أي ملاحظة تصحيحية خاصة بالملف...' : 'Précision sur un document, changement de situation...'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isAr ? 'حفظ وتثبيت التصحيحات' : 'Enregistrer les corrections'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* ================= VIEW MODE ================= */
          <div className="space-y-5">
            {/* Tabs for Candidate: Infos vs Documents */}
            <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'info'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span className="truncate">{isAr ? 'المعلومات الشخصية' : 'Fiche Informations'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'documents'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="truncate">{isAr ? 'الـ 11 وثيقة' : '11 Pièces'}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === 'documents' ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-100 text-slate-700'}`}>
                  {compliance.conformeCount}/11
                </span>
              </button>
            </div>

            {activeTab === 'info' && (
              <div className="space-y-4">
                {/* 8-SECTION PHONE-OPTIMIZED SUMMARY CARD ("Mise en page Phone") */}
                <div className="bg-white rounded-2xl border-2 border-emerald-600/30 shadow-sm overflow-hidden">
                  <div className="p-3 text-white flex items-center justify-between gap-2" style={{ background: 'linear-gradient(90deg,#0b5c39,#042c1c 70%)' }}>
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-300" />
                      <span className="font-bold text-xs">
                        {isAr ? 'بطاقة عرض المترشح (وفق النموذج الإداري المعتمد)' : 'Fiche Récapitulative du Candidat (Modèle Officiel)'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-700/80 text-emerald-100 px-2 py-0.5 rounded-full border border-emerald-600">
                      {candidate.council === 'APC' ? (isAr ? 'مجلس بلدي APC' : 'APC Bologhine') : (isAr ? 'مجلس ولائي APW' : 'APW Alger')}
                    </span>
                  </div>

                  {/* 1. المترشح (الاسم واللقب) + 2. المجلس */}
                  <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {candidate.photoUrl ? (
                          <img
                            src={candidate.photoUrl}
                            alt=""
                            className="w-14 h-14 rounded-full object-cover border-2 border-emerald-600 shadow-xs"
                          />
                        ) : (
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-base shadow-xs border ${
                            candidate.gender === 'F'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}>
                            {candidate.firstNameFr.charAt(0)}{candidate.lastNameFr.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {isAr ? '1. المترشح:' : '1. Candidat :'}
                          </span>
                          <h3 className="font-bold text-slate-900 text-base sm:text-lg font-arabic leading-tight">
                            {candidate.lastNameAr} {candidate.firstNameAr}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mt-0.5">
                          {candidate.lastNameFr} {candidate.firstNameFr}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                          <span className="font-medium text-slate-700">{age} {isAr ? 'سنة' : 'ans'}</span>
                          <span>•</span>
                          <span>{candidate.gender === 'F' ? (isAr ? 'أنثى' : 'Femme') : (isAr ? 'ذكر' : 'Homme')}</span>
                          {youth && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                              <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                              <span>{isAr ? 'شاب (< 35)' : 'Jeune'}</span>
                            </span>
                          )}
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                            <Lock className="w-2.5 h-2.5 text-slate-400" />
                            <span>{isAr ? 'الترتيب سري (قرار اللجنة)' : 'Numéro réservé'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. المجلس */}
                    <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto">
                      <div className="p-2 bg-emerald-100/70 text-emerald-900 rounded-xl border border-emerald-300/80 flex items-center gap-2">
                        {candidate.council === 'APC' ? <Building2 className="w-4 h-4 text-emerald-700" /> : <Landmark className="w-4 h-4 text-indigo-700" />}
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">
                            {isAr ? '2. المجلس المرشح له' : '2. Conseil Électoral'}
                          </span>
                          <span className="font-bold text-xs text-emerald-950">
                            {candidate.council === 'APC' 
                              ? (isAr ? 'المجلس الشعبي البلدي (بولوغين)' : 'APC Bologhine') 
                              : (isAr ? 'المجلس الشعبي الولائي (الجزائر)' : 'APW Alger')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Quartier & Résidence, 5. Profession & Niveau, 6. Militantisme FLN */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3.5 border-b border-slate-100 text-xs bg-slate-50/50">
                    
                    {/* 4. Quartier & Résidence */}
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold">{isAr ? '4. الحي والإقامة والاتصال' : '4. Quartier & Résidence'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">{isAr ? 'حي الإقامة ببولوغين:' : 'Quartier & Résidence :'}</span>
                          <span className="font-bold text-slate-800 text-xs mt-0.5 block">{candidate.addressNeighborhood || 'Bologhine Centre (Ibn Ziri)'}</span>
                        </div>
                        {candidate.nationalIdNumber && (
                          <div>
                            <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">{isAr ? 'الرقم التعريفي الوطني (NIN):' : 'N° National (NIN) :'}</span>
                            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                              {candidate.nationalIdNumber}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">{isAr ? 'الهاتف المباشر:' : 'Tél direct :'}</span>
                        {candidate.phoneNumber ? (
                          <a
                            href={getCleanTelUrl(candidate.phoneNumber)}
                            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-300 font-mono font-bold text-xs hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer active:scale-95"
                            title={isAr ? 'انقر للاتصال المباشر من الهاتف' : 'Appeler directement'}
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>{formatPhoneNumber(candidate.phoneNumber)}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px] block">{isAr ? 'غير مسجل' : 'Non renseigné'}</span>
                        )}

                        {candidate.email && (
                          <div className="pt-1">
                            <a href={`mailto:${candidate.email}`} className="text-blue-700 hover:underline truncate block text-[11px] font-medium">
                              {candidate.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 5. Profession & Niveau */}
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                          <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                            <Briefcase className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold">{isAr ? '5. المهنة والمستوى العلمي' : '5. Profession & Niveau'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">{isAr ? 'المهنة أو الوظيفة:' : 'Profession :'}</span>
                          <span className="font-bold text-slate-800 block text-xs mt-0.5 leading-snug">{candidate.profession || 'Sans profession'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">{isAr ? 'المستوى والمؤهل الدراسي:' : 'Niveau & Diplôme :'}</span>
                          <span className="font-medium text-slate-700 text-xs mt-0.5 block">{candidate.educationLevel}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        {candidate.isUniversityGraduate && (
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-900 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 w-full">
                            <GraduationCap className="w-4 h-4 text-blue-700 shrink-0" />
                            <span className="truncate">{isAr ? 'إطار جامعي (شرط الـ 33%)' : 'Diplômé Univ. (Quota 33%)'}</span>
                          </div>
                        )}
                        {candidate.militaryStatus && (
                          <div className="text-[10px] text-slate-500 font-medium">
                            <span className="text-slate-400 uppercase font-bold">{isAr ? 'الخدمة الوطنية: ' : 'Service Nat. : '}</span>
                            <span className="text-slate-700 font-semibold">{candidate.militaryStatus}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 6. Militantisme FLN */}
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <BadgeCheck className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold">{isAr ? '6. النضال في صفوف FLN' : '6. Militantisme FLN'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{isAr ? 'بطاقة المناضل:' : 'بطاقة / Carte :'}</span>
                          <span className="font-mono font-bold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-xs">
                            {candidate.partyMembershipNumber || 'FLN-BO-1998-041'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{isAr ? 'سنة الانخراط:' : 'Adhésion :'}</span>
                          <span className="font-semibold text-slate-800">
                            {candidate.partyJoinYear 
                              ? (isAr ? `منخرط ${candidate.partyJoinYear} (${new Date().getFullYear() - candidate.partyJoinYear} سنة)` : `Adhérent ${candidate.partyJoinYear} (${new Date().getFullYear() - candidate.partyJoinYear} ans)`)
                              : (isAr ? 'مناضل' : 'Militant FLN')}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-slate-400 text-[10px] block uppercase font-bold tracking-wider">{isAr ? 'الصفة بالقسمة:' : 'Rôle Kasma :'}</span>
                        <span className="text-xs text-slate-800 font-semibold truncate block mt-0.5">
                          {candidate.partyRole || (isAr ? 'مناضل بالقسمة' : 'Militant actif')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 7. Les 11 Pièces (Conformité) */}
                  <div className="p-4 bg-white border-b border-slate-100 space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-black text-xs sm:text-sm text-slate-900 block">
                            {isAr ? '7. الوثائق الـ 11 (مطابقة إدارية)' : '7. Les 11 Pièces (Conformité)'}
                          </span>
                          <span className="text-[10.5px] text-slate-500 font-medium">
                            {isAr ? 'الملف القانوني المودع لدى السلطة الوطنية المستقلة للانتخابات (ANIE)' : 'Dossier officiel réglementaire selon les conditions d\'éligibilité ANIE'}
                          </span>
                        </div>
                      </div>

                      {/* Badge 11/11 (100%) */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-2xs ${
                          compliance.isComplete
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-100 text-amber-950 border border-amber-300'
                        }`}>
                          {compliance.isComplete ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Clock className="w-4 h-4 text-amber-700" />}
                          <span>{compliance.conformeCount}/11 ({compliance.percentage}%)</span>
                          <span className="font-normal text-[11px] opacity-90">
                            • {compliance.isComplete ? (isAr ? 'مكتمل 100%' : 'Complet') : (isAr ? 'قيد الاستكمال' : 'En cours')}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Clean progress bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/80">
                      <div 
                        className={`h-full transition-all duration-300 rounded-full ${
                          compliance.isComplete ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${compliance.percentage}%` }}
                      />
                    </div>

                    {/* 11 Document Cards Grid (Structured matrix with Number, Document Name and Conformity Status) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pt-1">
                      {ADMINISTRATIVE_DOCUMENTS.map((docDef, idx) => {
                        const doc = candidate.documents?.[docDef.key];
                        const isDocConforme = doc?.status === 'conforme' || doc?.conforme === true;
                        const isDocNonConforme = doc?.status === 'non_conforme';

                        return (
                          <button
                            key={docDef.key}
                            type="button"
                            onClick={() => setActiveTab('documents')}
                            className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer hover:shadow-xs active:scale-98 flex items-center justify-between gap-2 ${
                              isDocConforme
                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 hover:bg-emerald-100/80'
                                : isDocNonConforme
                                ? 'bg-rose-50/70 border-rose-300 text-rose-950 hover:bg-rose-100/80'
                                : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center font-mono font-black text-xs ${
                                isDocConforme
                                  ? 'bg-emerald-600 text-white'
                                  : isDocNonConforme
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-xs truncate leading-tight">
                                  {isAr ? docDef.nameAr : docDef.nameFr}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                                  {isAr ? docDef.nameFr : docDef.nameAr}
                                </p>
                              </div>
                            </div>
                            
                            <div className="shrink-0">
                              {isDocConforme ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>{isAr ? 'مطابق' : 'Conforme'}</span>
                                </span>
                              ) : isDocNonConforme ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300">
                                  <X className="w-3.5 h-3.5 text-rose-700" />
                                  <span>{isAr ? 'مرفوض' : 'Rejeté'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                                  <span>{isAr ? 'ناقص' : 'En attente'}</span>
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>{isAr ? 'انقر على أي وثيقة لعرض النسخة ورفع التحديثات' : 'Cliquez sur une pièce pour afficher le scan et téléverser votre document'}</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('documents')}
                        className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isAr ? 'فحص وتعديل الوثائق الـ 11' : 'Gérer les 11 pièces'}</span>
                        <FileCheck className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 8. الإجراءات */}
                  <div className="p-3.5 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      {isAr ? '8. الإجراءات المتاحة للمترشح:' : '8. Actions du Candidat :'}
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'تصحيح وتعديل بياناتي' : 'Corriger mes données'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isAr ? 'تغيير كلمة المرور' : 'Changer mot de passe'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('documents')}
                        className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>{isAr ? 'مراجعة الوثائق الـ 11' : 'Vérifier les 11 pièces'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detailed Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1: Identité & État civil */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        {isAr ? 'الحالة المدنية والهوية' : 'État Civil & Identité'}
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        {isAr ? 'البيانات المسجلة رسمياً' : 'Données certifiées de la candidature'}
                      </span>
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div>
                      <dt className="text-slate-400 font-medium">Nom (Français)</dt>
                      <dd className="font-bold text-slate-800 uppercase">{candidate.lastNameFr}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">Prénom (Français)</dt>
                      <dd className="font-bold text-slate-800">{candidate.firstNameFr}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">اللقب (بالعربية)</dt>
                      <dd className="font-bold text-slate-800 font-arabic">{candidate.lastNameAr}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">الاسم (بالعربية)</dt>
                      <dd className="font-bold text-slate-800 font-arabic">{candidate.firstNameAr}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">{isAr ? 'تاريخ الميلاد' : 'Date de Naissance'}</dt>
                      <dd className="font-semibold text-slate-800">
                        {candidate.birthDate} <span className="text-slate-400">({age} ans)</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">{isAr ? 'مكان الميلاد' : 'Lieu de Naissance'}</dt>
                      <dd className="font-semibold text-slate-800">{candidate.birthPlace}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">{isAr ? 'الجنس' : 'Genre'}</dt>
                      <dd className="font-semibold text-slate-800">
                        {candidate.gender === 'H' ? (isAr ? 'ذكر (Homme)' : 'Homme') : (isAr ? 'أنثى (Femme)' : 'Femme')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">{isAr ? 'الخدمة الوطنية' : 'Service National'}</dt>
                      <dd className="font-semibold text-slate-800 capitalize">{candidate.militaryStatus}</dd>
                    </div>
                  </dl>

                  {/* STRICT REQUIREMENT: HIDE LIST RANK */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-400" />
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">
                            {isAr ? 'رقم الترتيب في القائمة' : 'Numéro d\'Ordre sur la Liste'}
                          </span>
                          <span className="font-bold text-slate-700 italic">
                            {isAr ? 'محجوز وسري (قرار اللجنة)' : 'Confidentiel (Réservé à la Commission)'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                        {candidate.council}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Contact & Résidence */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        {isAr ? 'الاتصال والإقامة في بولوغين' : 'Résidence & Contact'}
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        {isAr ? 'العنوان المعتمد للاتصال' : 'Coordonnées de communication directe'}
                      </span>
                    </div>
                  </div>

                  <dl className="space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <dt className="text-slate-400 font-medium">{isAr ? 'الهاتف المحمول' : 'Numéro de Téléphone'}</dt>
                        <dd className="font-bold text-slate-800 font-mono text-sm">
                          {candidate.phoneNumber ? (
                            <a
                              href={getCleanTelUrl(candidate.phoneNumber)}
                              className="text-emerald-800 hover:text-emerald-950 hover:underline inline-flex items-center gap-1.5"
                              title={isAr ? 'انقر للاتصال' : 'Appeler'}
                            >
                              <span>{formatPhoneNumber(candidate.phoneNumber)}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400">{isAr ? 'غير مسجل' : 'Non renseigné'}</span>
                          )}
                        </dd>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <dt className="text-slate-400 font-medium">{isAr ? 'البريد الإلكتروني' : 'Adresse Email'}</dt>
                        <dd className="font-bold text-slate-800 break-all">{candidate.email || 'Non renseigné'}</dd>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <dt className="text-slate-400 font-medium">{isAr ? 'الحي السكني ببولوغين' : 'Quartier (Commune de Bologhine)'}</dt>
                        <dd className="font-bold text-slate-800">{candidate.addressNeighborhood}</dd>
                      </div>
                    </div>
                  </dl>
                </div>

                {/* Card 3: Formation & Profession */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        {isAr ? 'المسار الأكاديمي والمهني' : 'Parcours & Profession'}
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        {isAr ? 'الكفاءة العلمية والمهنية' : 'Qualification et niveau d\'études'}
                      </span>
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <div className="col-span-2">
                      <dt className="text-slate-400 font-medium">{isAr ? 'المهنة الحالية' : 'Profession Actuelle'}</dt>
                      <dd className="font-bold text-slate-800 text-sm mt-0.5">{candidate.profession}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">{isAr ? 'المستوى الدراسي' : 'Niveau d\'études'}</dt>
                      <dd className="font-semibold text-slate-800">{candidate.educationLevel}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">{isAr ? 'شهادة جامعية' : 'Diplôme Universitaire'}</dt>
                      <dd>
                        {candidate.isUniversityGraduate ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isAr ? 'خريج جامعة' : 'Universitaire (Quota 33%)'}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600">{isAr ? 'مستوى ثانوي / تقني' : 'Niveau Secondaire / Technicien'}</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Card 4: Militantisme FLN */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        {isAr ? 'الانخراط الحزبي (جبهة التحرير الوطني)' : 'Militantisme au sein du F.L.N'}
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        {isAr ? 'قسمة بولوغين • محافظة باب الوادي' : 'Kasma de Bologhine • Mouhafadha de Bab El Oued'}
                      </span>
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-slate-400 font-medium">{isAr ? 'رقم بطاقة المناضل' : 'N° Carte Militant'}</dt>
                      <dd className="font-bold text-slate-800 font-mono">{candidate.partyMembershipNumber || 'Non renseigné'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400 font-medium">{isAr ? 'سنة الانخراط' : 'Année d\'adhésion'}</dt>
                      <dd className="font-bold text-slate-800 font-mono">{candidate.partyJoinYear || 'N/A'}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-400 font-medium">{isAr ? 'المسؤولية الحزبية' : 'Rôle / Responsabilité'}</dt>
                      <dd className="font-medium text-slate-700 mt-0.5">{candidate.partyRole || 'Militant(e) de la Kasma'}</dd>
                    </div>
                    {candidate.notes && (
                      <div className="col-span-2 pt-2 border-t border-slate-100">
                        <dt className="text-slate-400 font-medium">{isAr ? 'ملاحظات' : 'Remarques'}</dt>
                        <dd className="text-slate-600 text-[11px] italic mt-0.5">{candidate.notes}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          )}

            {/* TAB 2: 11 ADMINISTRATIVE DOCUMENTS */}
            {activeTab === 'documents' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {isAr ? 'بيان الوثائق الإدارية الـ 11 المطلوبة قانونياً' : 'Contrôle des 11 Pièces Officielles du Dossier'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isAr 
                        ? 'طبقاً للأمر رقم 21-01 المتضمن القانون العضوي المتعلق بنظام الانتخابات'
                        : 'Conformément à l\'Ordonnance 21-01 portant loi organique relative au régime électoral'}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {isAr ? 'يمكنك إيداع أو استبدال النسخة الممسوحة ضوئياً' : 'Vous pouvez déposer ou remplacer vos pièces scannées'}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {ADMINISTRATIVE_DOCUMENTS.map((docDef, index) => {
                    const doc = candidate.documents?.[docDef.key];
                    const isConforme = doc?.conforme || doc?.status === 'conforme';
                    const isPending = doc?.status === 'en_attente' || (!doc && true);
                    const isNonConforme = doc?.status === 'non_conforme';

                    return (
                      <div key={docDef.key} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <div>
                            <div className="font-bold text-slate-800 text-sm">
                              {isAr ? docDef.nameAr : docDef.nameFr}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {isAr ? docDef.nameFr : docDef.nameAr}
                            </div>
                            {doc?.notes && (
                              <div className="text-[11px] text-slate-600 italic mt-0.5">
                                {doc.notes}
                              </div>
                            )}
                            {doc?.fileName && (
                              <div className="text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5">
                                <FileCheck className="w-3 h-3" />
                                <span>{doc.fileName}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                          {/* Status badge */}
                          {isConforme && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{isAr ? 'مطابقة ومقبولة' : 'Conforme'}</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>{isAr ? 'قيد المراجعة / معلقة' : 'En attente'}</span>
                            </span>
                          )}
                          {isNonConforme && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>{isAr ? 'غير مطابقة / تجديد' : 'Non conforme'}</span>
                            </span>
                          )}

                          {/* Upload / Replace Document button */}
                          <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
                            <Upload className="w-3 h-3 text-slate-500" />
                            <span>{doc?.fileDataUrl ? (isAr ? 'استبدال' : 'Remplacer') : (isAr ? 'إيداع الوثيقة' : 'Déposer scan')}</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleDocumentFileUpload(docDef.key, file);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: CHANGE CANDIDATE PASSWORD */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-fln-950/70 backdrop-blur-xs">
          <div className="bg-paper rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-gold-400/70 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                  {isAr ? 'تغيير كلمة المرور الخاصة بك' : 'Modifier votre mot de passe'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl pr-9 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'} *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {isAr ? 'تأكيد التغيير' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-paper border-t border-gold-300/70 py-3 text-center text-xs text-inksoft mt-auto">
        <p>
          {isAr
            ? 'قسمة بولوغين (ابن الزيري) • محافظة باب الوادي • حزب جبهة التحرير الوطني'
            : 'Kasma de Bologhine (Ibn Ziri) • Mouhafadha de Bab El Oued • Front de Libération Nationale (F.L.N)'}
        </p>
      </footer>
    </div>
  );
};
