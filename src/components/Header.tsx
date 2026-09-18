import React, { useState } from 'react';
import { CouncilType } from '../types';
import { Language, TRANSLATIONS } from '../data/translations';
import { BologhineLogo } from './BologhineLogo';
import { 
  Building2, 
  Landmark, 
  Plus, 
  FileSpreadsheet, 
  Printer, 
  Languages, 
  RotateCcw,
  CheckCircle2,
  ListOrdered,
  ShieldCheck,
  Camera,
  MoreVertical,
  X,
  LogOut,
  KeyRound,
  Database
} from 'lucide-react';
import { AdminUser } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  currentCouncil: CouncilType | 'ALL';
  onCouncilChange: (council: CouncilType | 'ALL') => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenAddModal: () => void;
  onOpenNumberingManager: () => void;
  onOpenAiScanner?: () => void;
  onOpenDatabaseManager?: () => void;
  onExportCSV: () => void;
  onPrintList: () => void;
  onResetData: () => void;
  adminUser?: AdminUser | null;
  onOpenAdminProfile?: () => void;
  onLogout?: () => void;
  apcCount: number;
  apwCount: number;
  completeCount: number;
  totalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentCouncil,
  onCouncilChange,
  language,
  onLanguageChange,
  onOpenAddModal,
  onOpenNumberingManager,
  onOpenAiScanner,
  onOpenDatabaseManager,
  onExportCSV,
  onPrintList,
  onResetData,
  adminUser,
  onOpenAdminProfile,
  onLogout,
  apcCount,
  apwCount,
  completeCount,
  totalCount,
}) => {
  const t = TRANSLATIONS[language];
  const isAr = language === 'ar';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className="theme-surface pt-safe sticky top-0 z-30 shadow-[0_24px_44px_-28px_rgba(3,29,20,0.9)]"
      style={{ background: 'var(--header-grad)' }}
    >
      {/* Ruban national tricolore */}
      <div className="h-1.5 w-full ribbon-algerie rounded-none block">
        <span className="g !w-full !h-full"></span>
        <span className="w !w-full !h-full"></span>
        <span className="r !w-full !h-full"></span>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">

          {/* Identité de la Kasma */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className="seal-fln w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center">
                  <BologhineLogo size="sm" withBorder interactive className="opacity-95" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] sm:text-[10.5px] font-bold bg-gold-500 text-fln-950 border border-gold-300 tracking-wide">
                    F.L.N — ⵣ حزب جبهة التحرير الوطني
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-gold-200/80 font-medium hidden xs:inline">
                    {t.mouhafadha}
                  </span>
                </div>
                <h1 className="font-display font-bold text-white leading-tight truncate mt-0.5 text-[15px] sm:text-lg lg:text-[21px] tracking-tight">
                  {isAr ? 'منصة المترشح لانتخابات المجالس الشعبية 2026 — بولوغين' : 'Portail des Candidatures — APC & APW 2026'}
                </h1>
                <p className="text-[11px] sm:text-xs text-gold-200/70 truncate">
                  {isAr ? 'المجلس البلدي بولوغين (APC) • المجلس الولائي (APW) • قسمة ابن الزيري' : 'APC Bologhine • APW Alger (Bab El Oued) • Kasma Ibn Ziri'}
                </p>
              </div>
            </div>

            {/* Contrôles mobiles */}
            <div className="flex items-center gap-1.5 md:hidden shrink-0">
              <ThemeToggle compact />

              <button
                onClick={() => onLanguageChange(isAr ? 'fr' : 'ar')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gold-500/40 bg-white/5 text-gold-100 active:bg-white/10"
                title="Changer de langue / تغيير اللغة"
              >
                <Languages className="w-3.5 h-3.5 text-gold-300" />
                <span>{isAr ? 'FR' : 'عربي'}</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg border border-gold-500/40 text-gold-100 hover:bg-white/10 active:bg-white/15"
                title="Options et actions supplémentaires"
                aria-label="Menu des options"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-crimson" /> : <MoreVertical className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Actions desktop */}
          <div className="hidden md:flex items-center flex-wrap gap-1.5 justify-end">
            <ThemeToggle />

            <button
              onClick={() => onLanguageChange(isAr ? 'fr' : 'ar')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gold-500/40 text-gold-100 bg-white/5 hover:bg-white/10 transition-colors"
              title="Changer la langue / تغيير اللغة"
            >
              <Languages className="w-3.5 h-3.5 text-gold-300" />
              <span>{isAr ? 'Français' : 'العربية'}</span>
            </button>

            <button
              onClick={onOpenNumberingManager}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gold-100 hover:bg-gold-200 text-gold-900 border border-gold-400 transition-colors cursor-pointer"
              title="Gérer la numérotation officielle des candidats (Réservé à l'administrateur)"
            >
              <ListOrdered className="w-3.5 h-3.5 text-gold-700" />
              <span>{isAr ? 'ترتيب القائمة (الإدارة)' : 'Numérotation (Admin)'}</span>
            </button>

            {onOpenAiScanner && (
              <button
                onClick={onOpenAiScanner}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 text-gold-100 border border-gold-500/40 transition-colors cursor-pointer"
                title="Scanner ou photographier les documents administratifs (Extraction automatique IA)"
              >
                <Camera className="w-3.5 h-3.5 text-gold-300" />
                <span className="hidden xl:inline">{isAr ? 'مسح بالهاتف / تصوير (IA)' : 'Scanner / Photo (IA)'}</span>
                <span className="xl:hidden">{isAr ? 'مسح (IA)' : 'Scanner (IA)'}</span>
              </button>
            )}

            {onOpenDatabaseManager && (
              <button
                onClick={onOpenDatabaseManager}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-fln-950/70 hover:bg-fln-950 text-gold-200 border border-gold-500/50 transition-all active:scale-95 cursor-pointer"
                title={isAr ? 'قاعدة البيانات والمزامنة مع GitHub (استيراد وتصدير)' : 'Base de données & Synchronisation GitHub (Import/Export)'}
              >
                <Database className="w-3.5 h-3.5 text-gold-400" />
                <span className="hidden lg:inline">{isAr ? 'قاعدة البيانات / GitHub' : 'Base de Données / GitHub'}</span>
                <span className="lg:hidden">{isAr ? 'قاعدة البيانات' : 'Base'}</span>
              </button>
            )}

            <button
              onClick={onPrintList}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gold-500/30 text-gold-100 hover:bg-white/10 transition-colors"
              title={t.printList}
            >
              <Printer className="w-3.5 h-3.5 text-gold-300" />
              <span className="hidden sm:inline">{t.printList}</span>
            </button>

            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gold-500/30 text-gold-100 hover:bg-white/10 transition-colors"
              title={t.exportExcel}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-gold-300" />
              <span className="hidden sm:inline">{t.exportExcel}</span>
            </button>

            <button
              onClick={onResetData}
              className="p-1.5 text-gold-300/60 hover:text-gold-200 hover:bg-white/10 rounded-lg transition-colors"
              title={t.resetDemoData}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Ajouter (CTA or) */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg text-fln-950 transition-all hover:-translate-y-px active:translate-y-0 cursor-pointer shadow-[0_12px_24px_-10px_rgba(201,162,76,0.7)]"
              style={{ background: 'linear-gradient(180deg,#d9bc7f,#c9a24c 70%)', border: '1px solid #e7d5ab' }}
            >
              <Plus className="w-4 h-4" />
              <span>{t.addCandidate}</span>
            </button>

            {/* Pilule admin */}
            {adminUser && (
              <div className="flex items-center gap-1 pl-2 ml-1 border-l border-gold-500/30">
                <button
                  type="button"
                  onClick={onOpenAdminProfile}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 text-gold-100 border border-gold-500/40 transition-colors shadow-2xs cursor-pointer"
                  title={isAr ? `المشرف: ${adminUser.fullNameAr || adminUser.fullName} (انقر للإعدادات)` : `Session active : ${adminUser.fullName} (Cliquer pour gérer)`}
                >
                  <div className="relative">
                    <div className="w-5 h-5 rounded-full bg-gold-500 text-fln-950 flex items-center justify-center text-[10px] font-black">
                      {adminUser.username[0]?.toUpperCase()}
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-300 absolute -bottom-0.5 -right-0.5 ring-1 ring-fln-900" />
                  </div>
                  <span className="font-mono text-gold-100 text-[11px] max-w-[100px] truncate">
                    {adminUser.username}
                  </span>
                  <span className="text-[9px] bg-gold-500 text-fln-950 px-1 py-0.5 rounded font-black tracking-wide">
                    ADMIN
                  </span>
                </button>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-1.5 text-gold-300/60 hover:text-crimson hover:bg-crimson/20 rounded-lg transition-colors cursor-pointer"
                    title={isAr ? 'تسجيل الخروج (Déconnexion)' : 'Déconnexion de l\'interface Admin'}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2.5 p-3 rounded-xl border border-gold-500/40 space-y-2" style={{ background: 'var(--menu-bg)' }}>
            {adminUser && (
              <div className="p-2.5 rounded-lg flex items-center justify-between border border-gold-500/40" style={{ background: 'var(--chip-strong)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold-500 text-fln-950 flex items-center justify-center text-xs font-black ring-1 ring-gold-300">
                    {adminUser.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white truncate max-w-[170px]">
                      {isAr ? adminUser.fullNameAr || adminUser.fullName : adminUser.fullName}
                    </div>
                    <div className="text-[10px] text-gold-300 font-mono">
                      @{adminUser.username} • Admin Kasma
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdminProfile?.();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border border-gold-500/50 text-gold-100 bg-white/5 hover:bg-white/10 cursor-pointer shadow-2xs"
                  >
                    <KeyRound className="w-3 h-3 text-gold-300" />
                    <span>{isAr ? 'أمان الحساب' : 'Sécurité'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout?.();
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-red-200 bg-red-950/70 hover:bg-red-900 rounded-lg border border-red-800 cursor-pointer shadow-2xs"
                    title={isAr ? 'تسجيل الخروج' : 'Déconnexion'}
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-300" />
                    <span className="hidden xs:inline">{isAr ? 'خروج' : 'Sortir'}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              {onOpenDatabaseManager && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDatabaseManager();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-fln-950 text-gold-100 font-bold active:bg-fln-900 col-span-2 border border-gold-500/40 shadow-xs"
                >
                  <Database className="w-4 h-4 text-gold-400 shrink-0" />
                  <span className="truncate">{isAr ? 'قاعدة البيانات ورفع إلى GitHub' : 'Base de Données & Export GitHub'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onExportCSV();
                }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-gold-500/30 text-gold-100 font-medium active:bg-white/10"
              >
                <FileSpreadsheet className="w-4 h-4 text-gold-300 shrink-0" />
                <span className="truncate">{t.exportExcel}</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onPrintList();
                }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-gold-500/30 text-gold-100 font-medium active:bg-white/10"
              >
                <Printer className="w-4 h-4 text-gold-300 shrink-0" />
                <span className="truncate">{t.printList}</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenNumberingManager();
                }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-gold-100 border border-gold-400 text-gold-900 font-semibold active:bg-gold-200 col-span-2"
              >
                <ShieldCheck className="w-4 h-4 text-gold-700 shrink-0" />
                <span>{isAr ? 'ترتيب وتصنيف القائمة (لوحة الإدارة)' : 'Gestion du classement officiel (Admin)'}</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onResetData();
                }}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-gold-500/30 text-gold-200 font-normal active:bg-white/10 col-span-2 text-[11px]"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>{t.resetDemoData}</span>
              </button>
            </div>
          </div>
        )}

        {/* Bascule conseils APC / APW / Tous */}
        <div className="mt-2.5 sm:mt-3.5 pt-2 sm:pt-2.5 border-t border-gold-500/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="grid grid-cols-3 sm:flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl w-full sm:w-fit border border-gold-500/35" style={{ background: 'var(--tab-bg)' }}>
            <button
              onClick={() => onCouncilChange('ALL')}
              className={`py-2 sm:py-1.5 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                currentCouncil === 'ALL'
                  ? 'bg-white text-fln-900 shadow-sm'
                  : 'text-gold-100/85 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="truncate">{t.allCouncils}</span>
              <span className={`text-[10px] px-1 py-0.5 rounded font-bold ${
                currentCouncil === 'ALL' ? 'bg-gold-100 text-gold-800' : 'bg-white/10 text-gold-200'
              }`}>{totalCount}</span>
            </button>

            <button
              onClick={() => onCouncilChange('APC')}
              className={`py-2 sm:py-1.5 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                currentCouncil === 'APC'
                  ? 'text-fln-950 shadow-sm' + ' ' + (currentCouncil === 'APC' ? 'bg-gold-500' : '')
                  : 'text-gold-100/85 hover:text-white hover:bg-white/10'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />
              <span className="truncate">{t.apcTitle}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                currentCouncil === 'APC' ? 'bg-fln-900 text-gold-200' : 'bg-white/10 text-gold-200'
              }`}>
                {apcCount}
              </span>
            </button>

            <button
              onClick={() => onCouncilChange('APW')}
              className={`py-2 sm:py-1.5 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                currentCouncil === 'APW'
                  ? 'text-fln-950 shadow-sm' + ' ' + (currentCouncil === 'APW' ? 'bg-gold-500' : '')
                  : 'text-gold-100/85 hover:text-white hover:bg-white/10'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />
              <span className="truncate">{t.apwTitle}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                currentCouncil === 'APW' ? 'bg-fln-900 text-gold-200' : 'bg-white/10 text-gold-200'
              }`}>
                {apwCount}
              </span>
            </button>
          </div>

          {/* Récapitulatif dossiers */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 text-[11px] sm:text-xs px-1">
            <span className="flex items-center gap-1 text-gold-200 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-gold-400 shrink-0" />
              <span>{completeCount} / {totalCount} {isAr ? 'ملف جاهز 100%' : 'dossiers complets'}</span>
            </span>
            <span className="text-gold-500/60">|</span>
            <span className="text-gold-200/75 font-medium">
              {isAr ? '11 وثيقة إدارية' : '11 pièces par dossier'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};