import React, { useState } from 'react';
import { BologhineLogo } from './BologhineLogo';
import { Language, AuthSession } from '../types';
import { loginAdmin, loginCandidate } from '../utils/authUtils';
import { ThemeToggle } from './ThemeToggle';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Languages, 
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
  Shield,
  FileCheck,
  ScrollText
} from 'lucide-react';

interface AdminLoginViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLoginSuccess: (session: AuthSession) => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  language,
  onLanguageChange,
  onLoginSuccess,
}) => {
  const isAr = language === 'ar';
  const [loginMode, setLoginMode] = useState<'admin' | 'candidate'>('admin');
  
  // Admin form state (confidential credentials - not prefilled)
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Candidate form state
  const [candidateIdentifier, setCandidateIdentifier] = useState('');
  const [candidatePassword, setCandidatePassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = loginAdmin(adminUsername, adminPassword, rememberMe);
      setIsLoading(false);

      if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        // Fallback: check if they entered candidate credentials by accident
        const candResult = loginCandidate(adminUsername, adminPassword, rememberMe);
        if (candResult.success && candResult.session) {
          onLoginSuccess(candResult.session);
          return;
        }

        setErrorMessage(
          isAr
            ? (result.error || 'بيانات الدخول غير صحيحة. يرجى التحقق من اسم المستخدم وكلمة المرور.')
            : (result.error || 'Identifiants incorrects. Veuillez vérifier votre nom d\'utilisateur et mot de passe.')
        );
      }
    }, 200);
  };

  const handleCandidateLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = loginCandidate(candidateIdentifier, candidatePassword, rememberMe);
      setIsLoading(false);

      if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        // Fallback: check if they entered admin credentials
        const admResult = loginAdmin(candidateIdentifier, candidatePassword, rememberMe);
        if (admResult.success && admResult.session) {
          onLoginSuccess(admResult.session);
          return;
        }

        setErrorMessage(
          isAr
            ? (result.error || 'لم يتم العثور على ملف المترشح أو كلمة المرور خاطئة. يرجى التأكد من المعطيات.')
            : (result.error || 'Dossier introuvable ou mot de passe erroné. Veuillez vérifier vos accès.')
        );
      }
    }, 200);
  };

  const inputBase =
    'w-full pl-9.5 pr-9 py-2.5 bg-white/95 text-ink border border-gold-200 focus:border-gold-700 rounded-[10px] text-[13px] font-medium shadow-inner placeholder:text-slate-400 outline-none transition-colors';

  return (
    <div className={`theme-surface min-h-screen flex flex-col relative overflow-x-hidden font-sans selection:bg-gold-200 selection:text-fln-900 ${isAr ? 'rtl' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Fond cérémonial : vert FLN profond + halo or */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'var(--login-grad)' }} />
      {/* Cadre or intérieur */}
      <div className="absolute inset-3 sm:inset-5 rounded-2xl border border-gold-500/35 pointer-events-none" />
      {/* Guirlande décorative haute */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-gold-500/50 text-sm tracking-[14px] hidden md:block pointer-events-none select-none">
        ✦ ✦ ✦
      </div>

      {/* Ruban national */}
      <div className="h-1.5 w-full bg-gradient-to-r from-fln-600 via-white to-crimson relative z-20" />

      {/* Barre supérieure : titre + choix de langue */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <BologhineLogo size="xs" className="ring-2 ring-gold-500/60 rounded-full" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-bold tracking-[0.18em] uppercase text-gold-300 leading-tight truncate">
              <span className="hidden md:inline">
                {isAr ? 'منصة المترشح لانتخابات المجالس الشعبية 2026 • قسمة بولوغين' : 'Portail des Candidatures • APC & APW 2026 Bologhine'}
              </span>
              <span className="md:hidden">
                {isAr ? 'منصة المترشح • انتخابات 2026' : 'Portail Candidat • 2026'}
              </span>
            </div>
            <div className="text-fln-200/70 text-[11px] font-display italic font-medium truncate">
              {isAr ? 'حزب جبهة التحرير الوطني' : 'Front de Libération Nationale'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onLanguageChange(isAr ? 'fr' : 'ar')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold-500/50 bg-white/5 hover:bg-white/10 text-gold-100 text-xs font-semibold transition-colors cursor-pointer shrink-0 backdrop-blur-sm"
          title="Changer de langue / تغيير اللغة"
        >
          <Languages className="w-3.5 h-3.5 text-gold-300" />
          <span>{isAr ? 'Français' : 'العربية'}</span>
        </button>

        <ThemeToggle compact />
      </header>

      {/* Conteneur principal */}
      <main className="relative z-10 flex-1 flex items-start sm:items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="w-full grid lg:grid-cols-[1.02fr_.98fr] gap-8 lg:gap-6 max-w-5xl items-center">

          {/* ====== Panneau gauche : présentation cérémoniale ====== */}
          <div className="hidden lg:flex flex-col justify-center text-left space-y-6 pr-6">
            <div className="flex items-center gap-3">
              <span className="text-[11px] tracking-[0.28em] uppercase text-gold-300 font-bold">
                {isAr ? 'انتخابات المجالس الشعبية 2026' : 'Élections · Assemblées populaires 2026'}
              </span>
              <span className="gold-rule flex-1 max-w-[70px]" />
            </div>

            <h1 className="font-display font-bold text-white leading-[1.12] text-[34px] xl:text-[44px] tracking-tight">
              {isAr ? (
                <>بوابة رسمية لملفات<br /><em className="not-italic text-gold-300">الترشح</em> لقسمة بولوغين</>
              ) : (
                <>Portail officiel des<br />candidatures <em className="not-italic text-gold-300">FLN</em><br />— Bologhine</>
              )}
            </h1>

            <p className="text-[15px] leading-[1.8] text-fln-100/85 max-w-[48ch] font-medium">
              {isAr
                ? 'منصة السيادية لقسمة بولوغين المخصصة لمعالجة ملفات الترشح للمجالس الشعبية البلدية والولائية، ومتابعة الوثائق الإدارية الـ 11.'
                : 'Plateforme souveraine de la Kasma de Bologhine dédiée au traitement des dossiers de candidature aux assemblées populaires communales et de wilaya.'}
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <span className="ribbon-algerie"><span className="g"></span><span className="w"></span><span className="r"></span></span>
              <span className="text-gold-300/80 text-sm orn">✦ ✦ ✦</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap pt-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gold-500/40 bg-white/5 text-gold-100 text-xs font-semibold">
                <FileCheck className="w-3.5 h-3.5 text-gold-300" />
                {isAr ? 'تدقيق الوثائق الـ 11' : 'Audit des 11 pièces'}
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gold-500/40 bg-white/5 text-gold-100 text-xs font-semibold">
                <Users className="w-3.5 h-3.5 text-gold-300" />
                {isAr ? 'حصص المناصفة والشباب' : 'Quotas & parité'}
              </span>
            </div>
          </div>

          {/* ====== Panneau droit : carte d'accès ====== */}
          <div className="flex items-center justify-center">
            <div className="frame-double bg-paper text-ink rounded-[18px] w-full max-w-[400px] px-6 sm:px-8 py-7 sm:py-8 border border-gold-600/70 shadow-[0_4px_0_#a57f2f,0_34px_70px_-22px_rgba(0,0,0,0.6)]">

              {/* En-tête : sceau + titres */}
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="seal-fln w-[78px] h-[78px] rounded-full flex items-center justify-center">
                      <BologhineLogo size="md" className="opacity-95" />
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 text-white rounded-full p-1.5 border-2 border-gold-100 transition-colors ${
                      loginMode === 'candidate' ? 'bg-crimson' : 'bg-fln-700'
                    }`}>
                      {loginMode === 'candidate'
                        ? <User className="w-3.5 h-3.5" />
                        : <ShieldCheck className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10.5px] tracking-[0.22em] uppercase text-gold-700 font-bold">
                    {isAr ? 'جبهة التحرير الوطني • F.L.N' : 'Front de Libération Nationale • F.L.N'}
                  </div>
                  <h2 className="font-display font-bold text-[21px] text-fln-900 leading-tight mt-1.5">
                    {loginMode === 'candidate'
                      ? (isAr ? 'فضاء المترشح' : 'Espace Candidat')
                      : (isAr ? 'لوحة إدارة القسمة' : 'Espace d\'administration')}
                  </h2>
                  <div className="text-[12px] text-ink-soft font-arabic mt-0.5">
                    {isAr ? 'قسمة بولوغين (ابن الزيري) • محافظة باب الوادي' : 'Kasma de Bologhine (Ibn Ziri) • Bab El Oued'}
                  </div>
                </div>
              </div>

              {/* Bascule Admin / Candidat */}
              <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-gold-100/70 rounded-[12px] border border-gold-200 text-xs font-bold mt-5">
                <button
                  type="button"
                  onClick={() => { setLoginMode('admin'); setErrorMessage(null); }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-[9px] transition-all cursor-pointer font-bold ${
                    loginMode === 'admin'
                      ? 'theme-dark-solid bg-fln-800 text-gold-100 shadow-sm ring-1 ring-gold-500/60'
                      : 'text-gold-900 hover:bg-white/70'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{isAr ? 'فضاء الإدارة' : 'Espace Admin'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMode('candidate'); setErrorMessage(null); }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-[9px] transition-all cursor-pointer font-bold ${
                    loginMode === 'candidate'
                      ? 'theme-dark-solid bg-fln-800 text-gold-100 shadow-sm ring-1 ring-gold-500/60'
                      : 'text-gold-900 hover:bg-white/70'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{isAr ? 'فضاء المترشح' : 'Espace Candidat'}</span>
                </button>
              </div>

              {/* Bannière d'erreur */}
              {errorMessage && (
                <div className="p-3 bg-[#fdecee] border border-crimson/40 text-crimson-deep rounded-[10px] text-xs flex items-start gap-2.5 mt-4">
                  <AlertCircle className="w-4 h-4 text-crimson shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="font-bold block">{isAr ? 'تنبيه المصادقة :' : 'Erreur d\'accès :'}</strong>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* MODE 1 : ADMIN */}
              {loginMode === 'admin' ? (
                <form onSubmit={handleAdminLogin} className="space-y-3.5 mt-5">
                  <div>
                    <label className="block text-[11px] font-bold tracking-wide text-fln-900 mb-1.5">
                      {isAr ? 'اسم المستخدم' : 'Nom d\'utilisateur'} <span className="text-gold-700">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gold-600">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={adminUsername}
                        onChange={e => setAdminUsername(e.target.value)}
                        placeholder={isAr ? 'اسم المستخدم' : 'Nom d\'utilisateur'}
                        className={inputBase}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wide text-fln-900 mb-1.5">
                      {isAr ? 'كلمة المرور' : 'Mot de passe'} <span className="text-gold-700">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gold-600">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={adminPassword}
                        onChange={e => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputBase}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-fln-800 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="rounded border-gold-300 text-fln-700 focus:ring-gold-500 bg-white"
                      />
                      <span>{isAr ? 'تذكر الجلسة' : 'Mémoriser la session'}</span>
                    </label>
                    <span className="text-[10px] font-display italic text-gold-700 hidden sm:inline">
                      {isAr ? 'جلسة معتمدة وآمنة' : 'Session officielle & sécurisée'}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="theme-dark-solid w-full py-3 px-4 rounded-[10px] cursor-pointer font-display font-bold text-[15px] tracking-wide text-white transition-all shadow-[0_10px_22px_-8px_rgba(7,59,39,0.65)] hover:-translate-y-px active:translate-y-0 disabled:opacity-70"
                    style={{ background: 'linear-gradient(180deg,#0b5c39,#073b27 92%)', border: '1px solid #c9a24c' }}
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center gap-2 justify-center">
                        <span className="w-4 h-4 border-2 border-gold-200/40 border-t-gold-200 rounded-full animate-spin" />
                        {isAr ? 'جارٍ التحقق...' : 'Vérification...'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center gap-2">
                        <span>{isAr ? 'دخول لوحة إدارة القسمة' : 'Accéder à la gestion de la Kasma'}</span>
                        <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                      </span>
                    )}
                  </button>
                </form>
              ) : (
                /* MODE 2 : CANDIDAT */
                <div className="space-y-4 mt-5">
                  <div className="p-3.5 bg-gold-50 border border-gold-200 rounded-[10px] text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-fln-900 font-bold">
                      <Lock className="w-4 h-4 text-gold-700 shrink-0" />
                      <span>{isAr ? 'فضاء خاص بالمترشحين فقط' : 'Espace Sécurisé pour Candidats'}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      {isAr
                        ? 'تسجيل دخول سري للمترشحين لمعاينة الملف الإداري وتصحيح البيانات. (معرف الدخول: اللقب، رقم الهاتف، أو NIN).'
                        : 'Accès sécurisé et individuel pour chaque candidat. Identifiez-vous avec votre Nom, Téléphone ou NIN.'}
                    </p>
                  </div>

                  <form onSubmit={handleCandidateLogin} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold tracking-wide text-fln-900 mb-1.5">
                        {isAr ? 'معرف المترشح (اللقب، الهاتف أو NIN)' : 'Identifiant (Nom, Téléphone ou NIN)'} <span className="text-gold-700">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gold-600">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={candidateIdentifier}
                          onChange={e => setCandidateIdentifier(e.target.value)}
                          placeholder="Ex: belkacemi ou 0550123456"
                          className={inputBase}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold tracking-wide text-fln-900 mb-1.5">
                        {isAr ? 'كلمة المرور' : 'Mot de passe candidat'} <span className="text-gold-700">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gold-600">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={candidatePassword}
                          onChange={e => setCandidatePassword(e.target.value)}
                          placeholder="••••••••"
                          className={inputBase}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-fln-800 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="theme-dark-solid w-full py-3 px-4 rounded-[10px] cursor-pointer font-display font-bold text-[15px] tracking-wide text-white transition-all shadow-[0_10px_22px_-8px_rgba(7,59,39,0.65)] hover:-translate-y-px active:translate-y-0 disabled:opacity-70"
                      style={{ background: 'linear-gradient(180deg,#0b5c39,#073b27 92%)', border: '1px solid #c9a24c' }}
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center gap-2 justify-center">
                          <span className="w-4 h-4 border-2 border-gold-200/40 border-t-gold-200 rounded-full animate-spin" />
                          {isAr ? 'جارٍ التحقق...' : 'Vérification...'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-2">
                          <ScrollText className="w-4 h-4 text-gold-300" />
                          <span>{isAr ? 'معاينة وتصحيح ملف المترشح' : 'Consulter mon dossier'}</span>
                        </span>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Pied de la carte */}
              <div className="pt-4 mt-5 border-t border-gold-100 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
                <span className="text-gold-700">✦</span>
                <span>{isAr ? 'النظام الرقمي لقسمة بولوغين 2026' : 'Système Électoral Numérique FLN Bologhine 2026'}</span>
                <span className="text-gold-700">✦</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Pied de page */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full px-4 py-3.5 text-center text-[11.5px] text-fln-200/60">
        <div className="flex items-center justify-center gap-3">
          <span className="gold-rule flex-1 max-w-[160px]" />
          <span className="flex items-center gap-2 flex-wrap justify-center">
            <Sparkles className="w-3 h-3 text-gold-500" />
            {isAr
              ? 'الجمهورية الجزائرية الديمقراطية الشعبية • جبهة التحرير الوطني • قسمة بولوغين'
              : 'République Algérienne Démocratique et Populaire • Front de Libération Nationale • Kasma de Bologhine'}
            <Sparkles className="w-3 h-3 text-gold-500" />
          </span>
          <span className="gold-rule flex-1 max-w-[160px]" />
        </div>
      </footer>
    </div>
  );
};