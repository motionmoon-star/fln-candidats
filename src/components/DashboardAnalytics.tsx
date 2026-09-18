import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { Candidate, CampaignStats } from '../types';
import { Language, TRANSLATIONS } from '../data/translations';
import { 
  Users, 
  GraduationCap, 
  Sparkles, 
  ShieldAlert, 
  FileCheck, 
  ChevronRight,
  MapPin,
  BarChart3
} from 'lucide-react';
import { getDossierCompliance } from '../utils/candidateUtils';

interface DashboardAnalyticsProps {
  stats: CampaignStats;
  candidates: Candidate[];
  language: Language;
  onSelectCandidate: (candidate: Candidate) => void;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  stats,
  candidates,
  language,
  onSelectCandidate,
}) => {
  const t = TRANSLATIONS[language];
  const isAr = language === 'ar';

  const apcCandidates = candidates.filter(c => c.council === 'APC');
  const apcTotal = apcCandidates.length;
  const apcCompleted = apcCandidates.filter(c => {
    const comp = getDossierCompliance(c);
    return comp.isComplete || c.dossierStatus === 'complet';
  }).length;
  const apcPercentage = apcTotal > 0 ? Math.round((apcCompleted / apcTotal) * 100) : 0;
  const apcPending = Math.max(0, apcTotal - apcCompleted);

  const apwCandidates = candidates.filter(c => c.council === 'APW');
  const apwTotal = apwCandidates.length;
  const apwCompleted = apwCandidates.filter(c => {
    const comp = getDossierCompliance(c);
    return comp.isComplete || c.dossierStatus === 'complet';
  }).length;
  const apwPercentage = apwTotal > 0 ? Math.round((apwCompleted / apwTotal) * 100) : 0;
  const apwPending = Math.max(0, apwTotal - apwCompleted);

  const rechartsProgressData = [
    {
      councilKey: 'APC',
      name: isAr ? 'قائمة البلدية (APC)' : 'Liste APC Bologhine',
      shortName: 'APC Bologhine',
      percentage: apcPercentage,
      completed: apcCompleted,
      total: apcTotal,
      pending: apcPending,
      color: '#0b5c39',
    },
    {
      councilKey: 'APW',
      name: isAr ? 'قائمة الولاية (APW)' : 'Liste APW Alger',
      shortName: 'APW Alger',
      percentage: apwPercentage,
      completed: apwCompleted,
      total: apwTotal,
      pending: apwPending,
      color: '#2563eb',
    },
  ];

  const CustomRechartsTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="text-gold-100 p-3 rounded-xl shadow-xl text-xs min-w-[210px] z-50 border border-gold-500/50" style={{ background: 'rgba(3,29,20,0.97)' }}>
          <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-gold-500/40">
            <span className="font-bold text-sm text-white">{data.shortName}</span>
            <span 
              className="px-2 py-0.5 rounded text-[11px] font-extrabold text-white"
              style={{ backgroundColor: data.color }}
            >
              {data.percentage}%
            </span>
          </div>
          <div className="space-y-1 text-gold-200/85">
            <div className="flex items-center justify-between">
              <span>{isAr ? 'الملفات المكتملة 100%:' : 'Dossiers complets 100% :'}</span>
              <span className="font-bold text-gold-300">{data.completed} / {data.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{isAr ? 'الملفات قيد الاستكمال:' : 'Dossiers en attente :'}</span>
              <span className="font-medium text-amber-300">{data.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{isAr ? 'الهدف المطلوب:' : 'Objectif ANIE :'}</span>
              <span className="font-bold text-slate-300">100%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const criticalRiskCandidates = candidates.filter(c => {
    const comp = getDossierCompliance(c);
    if (comp.isComplete) return false;
    const docs = c.documents || {};
    return (
      docs.police_record?.status !== 'conforme' ||
      docs.tax_clearance?.status !== 'conforme' ||
      (c.gender === 'H' && docs.military_status?.status !== 'conforme') ||
      docs.nationality_certificate?.status !== 'conforme'
    );
  });

  const neighborhoodCounts: Record<string, number> = {};
  for (const c of candidates) {
    const n = c.addressNeighborhood || 'Bologhine';
    neighborhoodCounts[n] = (neighborhoodCounts[n] || 0) + 1;
  }

  const kpiCard =
    'bg-paper rounded-xl p-3 sm:p-4 border border-gold-200/80 shadow-[0_10px_24px_-18px_rgba(110,84,24,0.35)] transition-colors flex flex-col justify-between relative overflow-hidden';
  const kpiCardTopRule =
    'absolute top-0 inset-x-3 h-[2px] rounded-full bg-gradient-to-r from-gold-500 via-gold-300 to-transparent';

  return (
    <div className="space-y-4">
      {/* Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">

        {/* Metric 1: Dossiers Complets 100% */}
        <div className={`${kpiCard} hover:border-gold-400`}>
          <span className={kpiCardTopRule} />
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-semibold text-inksoft uppercase tracking-wider truncate">
                {t.dossiersComplete}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gold-100 text-gold-800 flex items-center justify-center shrink-0">
                <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-display font-black text-fln-900">
                {stats.completedDossiers}
              </span>
              <span className="text-[11px] sm:text-xs text-inksoft font-medium">
                / {stats.totalCandidates} ({stats.totalCandidates > 0 ? Math.round((stats.completedDossiers / stats.totalCandidates) * 100) : 0}%)
              </span>
            </div>
          </div>
          <div className="mt-2.5">
            <div className="w-full bg-gold-100/80 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.totalCandidates > 0 ? (stats.completedDossiers / stats.totalCandidates) * 100 : 0}%`, background: 'linear-gradient(90deg,#a57f2f,#c9a24c)' }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-[11px] text-inksoft">
              <span>{stats.pendingDossiers} {isAr ? 'قيد المعالجة' : 'en cours'}</span>
              <span>{stats.incompleteDossiers} {isAr ? 'ناقص' : 'incomplets'}</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Représentation Féminine */}
        <div className={`${kpiCard} hover:border-rose-300`}>
          <span className={kpiCardTopRule} />
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-semibold text-inksoft uppercase tracking-wider truncate">
                {t.electoralParity}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-display font-black text-fln-900">
                {stats.womenPercentage}%
              </span>
              <span className="text-[11px] sm:text-xs text-inksoft font-medium">
                ({stats.womenCount} {isAr ? 'مرشحة' : 'femmes'})
              </span>
            </div>
          </div>
          <div className="mt-2.5">
            <div className="w-full bg-rose-100/70 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.womenPercentage)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-inksoft">{isAr ? 'القانون:' : 'Cible:'} ≥ 30%</span>
              <span className={`font-semibold ${stats.womenPercentage >= 30 ? 'text-fln-700' : 'text-amber-600'}`}>
                {stats.womenPercentage >= 30 ? (isAr ? 'مستوفى' : 'Conforme') : (isAr ? 'ناقص' : 'À renforcer')}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Quota Jeunes */}
        <div className={`${kpiCard} hover:border-amber-300`}>
          <span className={kpiCardTopRule} />
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-semibold text-inksoft uppercase tracking-wider truncate">
                {t.youthRatio}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-display font-black text-fln-900">
                {stats.youthUnder35Percentage}%
              </span>
              <span className="text-[11px] sm:text-xs text-inksoft font-medium">
                ({stats.youthUnder35Count} {isAr ? 'شاب' : '< 35 ans'})
              </span>
            </div>
          </div>
          <div className="mt-2.5">
            <div className="w-full bg-amber-100/70 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.youthUnder35Percentage)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-inksoft">{isAr ? 'القانون:' : 'Seuil:'} ≥ 30%</span>
              <span className={`font-semibold ${stats.youthUnder35Percentage >= 30 ? 'text-fln-700' : 'text-amber-600'}`}>
                {stats.youthUnder35Percentage >= 30 ? (isAr ? 'ممتاز' : 'Atteint') : (isAr ? 'ناقص' : 'En cours')}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Diplômés Universitaires */}
        <div className={`${kpiCard} hover:border-blue-300`}>
          <span className={kpiCardTopRule} />
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-semibold text-inksoft uppercase tracking-wider truncate">
                {t.degreeRatio}
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-2.5 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-display font-black text-fln-900">
                {stats.universityGraduatesPercentage}%
              </span>
              <span className="text-[11px] sm:text-xs text-inksoft font-medium truncate">
                ({stats.universityGraduatesCount} {isAr ? 'جامعي' : 'diplômés'})
              </span>
            </div>
          </div>
          <div className="mt-2.5">
            <div className="w-full bg-blue-100/70 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.universityGraduatesPercentage)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-inksoft">{isAr ? 'المطلب:' : 'Cible:'} ≥ 50%</span>
              <span className={`font-semibold ${stats.universityGraduatesPercentage >= 50 ? 'text-fln-700' : 'text-blue-600'}`}>
                {stats.universityGraduatesPercentage >= 50 ? (isAr ? 'قوي' : 'Atteint') : (isAr ? 'مقبول' : 'Correct')}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* RECHARTS VISUAL PROGRESS BAR */}
      <div className="bg-paper rounded-2xl border border-gold-300/70 p-4 sm:p-5 shadow-[0_18px_40px_-28px_rgba(110,84,24,0.5)]">
        {/* En-tête cérémoniale */}
        <div className="flex items-center gap-2 mb-1">
          <span className="w-8 h-[2px] rounded-full bg-gold-500 inline-block" />
          <span className="text-[10px] tracking-[0.24em] uppercase text-gold-700 font-bold">
            {isAr ? 'المؤشرات الرسمية لقسمة بولوغين' : 'Indicateurs Officiels de la Kasma'}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-pulse" />
              <h3 className="text-sm sm:text-base font-display font-bold text-fln-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gold-700" />
                <span>
                  {isAr 
                    ? 'نسبة اكتمال الملفات مقابل إجمالي المترشحين (قائمتي APC و APW)' 
                    : 'Barre de Progression de Complétude des Dossiers (Listes APC & APW)'}
                </span>
              </h3>
            </div>
            <p className="text-xs text-inksoft mt-0.5">
              {isAr
                ? 'رسم بياني تفاعلي باستخدام Recharts يوضح نسبة اكتمال ملفات المترشحين القانونية 100% لكل قائمة'
                : 'Visualisation graphique Recharts : Pourcentage de dossiers finalisés (11/11 pièces conformes) par rapport au total des candidats inscrits'}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-fln-50 border border-fln-200 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-fln-700 inline-block" />
              <span className="font-bold text-fln-900">APC Bologhine ({apcCompleted}/{apcTotal})</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <span className="font-bold text-blue-900">APW Alger ({apwCompleted}/{apwTotal})</span>
            </div>
          </div>
        </div>

        {/* Recharts Horizontal Bar Chart */}
        <div className="w-full h-44 sm:h-48 pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rechartsProgressData}
              layout="vertical"
              margin={{ top: 10, right: 35, left: 10, bottom: 5 }}
              barCategoryGap="28%"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e3dfd4" />
              <XAxis 
                type="number" 
                domain={[0, 100]} 
                unit="%" 
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 11, fill: '#5d584c' }} 
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={140} 
                tick={{ fontSize: 12, fill: '#22302a', fontWeight: 600 }} 
              />
              <Tooltip content={<CustomRechartsTooltip />} />
              <ReferenceLine 
                x={100} 
                stroke="#0b5c39" 
                strokeDasharray="4 4" 
                label={{ 
                  value: isAr ? 'الهدف 100%' : 'Objectif 100%', 
                  position: 'top', 
                  fill: '#6e5418', 
                  fontSize: 10,
                  fontWeight: 700 
                }} 
              />
              <Bar 
                dataKey="percentage" 
                radius={[0, 8, 8, 0]} 
                name={isAr ? 'نسبة الاكتمال' : 'Taux de complétude'}
                isAnimationActive={true}
              >
                {rechartsProgressData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Panels Récapitulatifs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3.5 mt-2 border-t border-gold-100">
          {/* APC Status Card */}
          <div className="bg-fln-50/70 border border-fln-200/90 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-black text-xs shadow-xs" style={{ background: 'linear-gradient(180deg,#0b5c39,#073b27)' }}>
                APC
              </div>
              <div>
                <div className="text-xs font-bold text-fln-900">
                  {isAr ? 'المجلس الشعبي البلدي - بولوغين' : 'Liste APC Bologhine'}
                </div>
                <div className="text-[11px] text-fln-800 mt-0.5">
                  <span className="font-bold">{apcCompleted}</span> {isAr ? 'ملف مكتمل من إجمالي' : 'dossier(s) complet(s) sur'} <span className="font-bold">{apcTotal}</span> {isAr ? 'مترشح' : 'candidat(s)'}
                  {apcPending > 0 && (
                    <span className="text-amber-800 ms-1">
                      ({apcPending} {isAr ? 'في الانتظار' : 'en cours'})
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-fln-800">{apcPercentage}%</span>
              <div className="text-[10px] text-fln-800 font-bold uppercase tracking-wider">
                {apcPercentage === 100 ? (isAr ? 'مكتمل 100%' : '100% Validé') : (isAr ? 'قيد الإنجاز' : 'En cours')}
              </div>
            </div>
          </div>

          {/* APW Status Card */}
          <div className="bg-blue-50/70 border border-blue-200/90 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                APW
              </div>
              <div>
                <div className="text-xs font-bold text-blue-950">
                  {isAr ? 'المجلس الشعبي الولائي - الجزائر' : 'Liste APW Alger (Wilaya)'}
                </div>
                <div className="text-[11px] text-blue-800 mt-0.5">
                  <span className="font-bold">{apwCompleted}</span> {isAr ? 'ملف مكتمل من إجمالي' : 'dossier(s) complet(s) sur'} <span className="font-bold">{apwTotal}</span> {isAr ? 'مترشح' : 'candidat(s)'}
                  {apwPending > 0 && (
                    <span className="text-amber-800 ms-1">
                      ({apwPending} {isAr ? 'في الانتظار' : 'en cours'})
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-blue-700">{apwPercentage}%</span>
              <div className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">
                {apwTotal === 0 ? (isAr ? 'لا يوجد مترشح' : 'Non démarré') : apwPercentage === 100 ? (isAr ? 'مكتمل 100%' : '100% Validé') : (isAr ? 'قيد الإنجاز' : 'En cours')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis & Vigilance Alert Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">

        {/* Rejection Prevention & Alert Box */}
        <div className="lg:col-span-2 rounded-xl p-4 border border-gold-300/80" style={{ background: 'linear-gradient(135deg,#faf6ec 0%,#fdf0cf 55%,#fdeee3 100%)' }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-sm font-display font-bold text-fln-900">
                  {isAr 
                    ? 'تنبيهات التدقيق والمطابقة لتفادي رفض الملفات لدى السلطة المستقلة (ANIE)' 
                    : 'Cellule de Vigilance ANIE & Risques de Non-Conformité'}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-gold-600 text-white border border-gold-500">
                  {criticalRiskCandidates.length} {isAr ? 'ملفات بحاجة لتسوية سريعة' : 'dossiers à régulariser'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                {isAr
                  ? 'يرجى استيفاء شهادات الضرائب المصفاة (Extrait de rôle fiscal)، صحيفة السوابق العدلية B3 الحديثة، وتبرير الوضعية تجاه الخدمة الوطنية قبل انقضاء آجال الإيداع الرسمية.'
                  : 'Vérifiez impérativement la validité de l\'extrait de rôle (mention Apuré), le B3 judiciaire (< 3 mois), et la situation du service national pour éviter toute irrecevabilité légale.'}
              </p>

              {criticalRiskCandidates.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {criticalRiskCandidates.slice(0, 5).map(c => (
                    <button
                      key={c.id}
                      onClick={() => onSelectCandidate(c)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-xs font-medium text-slate-800 border border-gold-400/70 shadow-xs transition-colors cursor-pointer"
                    >
                      <AlertIcon />
                      <span>{c.lastNameFr} {c.firstNameFr}</span>
                      <span className="text-[10px] text-gold-800 bg-gold-100 px-1 rounded">
                        {c.council} #{c.listRank}
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </button>
                  ))}
                  {criticalRiskCandidates.length > 5 && (
                    <span className="text-xs text-gold-800 font-medium self-center">
                      +{criticalRiskCandidates.length - 5} {isAr ? 'آخرين' : 'autres'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bologhine Neighborhood Coverage Card */}
        <div className="bg-paper rounded-xl p-4 border border-gold-200/80 shadow-[0_10px_24px_-18px_rgba(110,84,24,0.35)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-fln-900 flex items-center gap-1.5 font-display">
                <MapPin className="w-3.5 h-3.5 text-gold-700" />
                {isAr ? 'تغطية أحياء بلدية بولوغين' : 'Couverture des Quartiers'}
              </span>
              <span className="text-[11px] text-inksoft font-medium">
                {Object.keys(neighborhoodCounts).length} {isAr ? 'أحياء ممثلة' : 'quartiers'}
              </span>
            </div>
            <p className="text-[11px] text-inksoft mb-2.5">
              {isAr ? 'توزيع المترشحين على القطاعات الحضرية لبولوغين لضمان امتداد شعبي متوازن:' : 'Répartition sur le territoire communal de Bologhine :'}
            </p>
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {Object.entries(neighborhoodCounts).map(([neighborhood, count]) => (
                <div key={neighborhood} className="flex items-center justify-between text-xs py-0.5 border-b border-gold-100/70">
                  <span className="text-slate-800 truncate max-w-[170px]">{neighborhood}</span>
                  <span className="font-semibold text-fln-900 bg-gold-100/80 px-1.5 py-0.5 rounded text-[11px]">
                    {count} {isAr ? 'مرشح' : 'candidat(s)'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-gold-100 flex items-center justify-between text-[11px] text-inksoft">
            <span>{isAr ? 'قسمة بولوغين - محافظة باب الوادي' : 'Kasma Bologhine FLN'}</span>
            <span className="font-medium text-fln-800">
              {stats.globalComplianceRate}% {isAr ? 'جاهزية عامة' : 'prêt global'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

const AlertIcon = () => (
  <svg className="w-3.5 h-3.5 text-gold-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);