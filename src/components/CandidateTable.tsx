import React, { useState, useMemo } from 'react';
import { Candidate, CouncilType, Gender } from '../types';
import { Language, TRANSLATIONS } from '../data/translations';
import { ADMINISTRATIVE_DOCUMENTS } from '../data/documentsList';
import { calculateAge, getDossierCompliance, isYouth, formatPhoneNumber, getCleanTelUrl } from '../utils/candidateUtils';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  Edit3, 
  Trash2, 
  Printer, 
  Building2, 
  Landmark, 
  Sparkles, 
  GraduationCap, 
  BadgeCheck, 
  Phone, 
  MapPin,
  Check,
  X,
  FileText,
  ShieldCheck,
  Crown,
  Hash,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Table as TableIcon,
  LayoutGrid,
  Briefcase
} from 'lucide-react';

interface CandidateTableProps {
  candidates: Candidate[];
  language: Language;
  currentCouncilFilter: CouncilType | 'ALL';
  onSelectCandidate: (candidate: Candidate) => void;
  onEditCandidate: (candidate: Candidate) => void;
  onDeleteCandidate: (id: string) => void;
  onPrintDossierSlip: (candidate: Candidate) => void;
  onOpenNumberingManager: () => void;
  onAssignRankDirect: (candidateId: string, rank: number | null) => void;
}

export const CandidateTable: React.FC<CandidateTableProps> = ({
  candidates,
  language,
  currentCouncilFilter,
  onSelectCandidate,
  onEditCandidate,
  onDeleteCandidate,
  onPrintDossierSlip,
  onOpenNumberingManager,
  onAssignRankDirect,
}) => {
  const t = TRANSLATIONS[language];
  const isAr = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'complet' | 'en_cours' | 'incomplet'>('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | Gender>('ALL');
  const [youthFilter, setYouthFilter] = useState<boolean>(false);
  const [degreeFilter, setDegreeFilter] = useState<boolean>(false);
  
  // Default to table view on desktop (>= 1024px) for full administrative clarity, and cards on smaller screens
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      return 'table';
    }
    return 'cards';
  });

  // Accordion state to expand the 11 pieces breakdown on phone
  const [expandedDocsCandidateId, setExpandedDocsCandidateId] = useState<string | null>(null);

  // Direct quick rank modal state for administrator
  const [quickRankCandidate, setQuickRankCandidate] = useState<Candidate | null>(null);
  const [quickRankValue, setQuickRankValue] = useState<string>('');

  // Filtered & sorted candidates
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter(c => {
        // Council filter
        if (currentCouncilFilter !== 'ALL' && c.council !== currentCouncilFilter) {
          return false;
        }

        // Search text
        if (searchTerm.trim() !== '') {
          const q = searchTerm.toLowerCase();
          const matchFr = `${c.firstNameFr} ${c.lastNameFr}`.toLowerCase().includes(q);
          const matchAr = `${c.firstNameAr} ${c.lastNameAr}`.includes(q);
          const matchProfession = c.profession?.toLowerCase().includes(q);
          const matchNIN = c.nationalIdNumber?.includes(q);
          const matchPhone = c.phoneNumber?.includes(q);
          const matchNeighborhood = c.addressNeighborhood?.toLowerCase().includes(q);
          const matchParty = c.partyMembershipNumber?.toLowerCase().includes(q);

          if (!matchFr && !matchAr && !matchProfession && !matchNIN && !matchPhone && !matchNeighborhood && !matchParty) {
            return false;
          }
        }

        // Dossier status filter
        if (statusFilter !== 'ALL') {
          const comp = getDossierCompliance(c);
          if (statusFilter === 'complet' && !comp.isComplete) return false;
          if (statusFilter === 'en_cours' && (comp.isComplete || comp.conformeCount < 8)) return false;
          if (statusFilter === 'incomplet' && comp.conformeCount >= 8) return false;
        }

        // Gender filter
        if (genderFilter !== 'ALL' && c.gender !== genderFilter) {
          return false;
        }

        // Youth filter (< 35)
        if (youthFilter && !isYouth(c.birthDate)) {
          return false;
        }

        // Degree filter
        if (degreeFilter && !c.isUniversityGraduate) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by council first if ALL
        if (currentCouncilFilter === 'ALL' && a.council !== b.council) {
          return a.council === 'APC' ? -1 : 1;
        }
        // Candidates with assigned rank come first
        const hasRankA = a.listRank !== null && a.listRank > 0;
        const hasRankB = b.listRank !== null && b.listRank > 0;
        if (hasRankA && !hasRankB) return -1;
        if (!hasRankA && hasRankB) return 1;
        if (hasRankA && hasRankB) {
          return (a.listRank as number) - (b.listRank as number);
        }
        return a.lastNameFr.localeCompare(b.lastNameFr);
      });
  }, [candidates, currentCouncilFilter, searchTerm, statusFilter, genderFilter, youthFilter, degreeFilter]);

  return (
    <div className="bg-paper rounded-xl border border-gold-300/70 shadow-[0_18px_40px_-28px_rgba(110,84,24,0.5)] overflow-hidden">
      
      {/* Search and Filters Toolbar */}
      <div className="p-4 border-b border-gold-200/70 bg-gold-50/40 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gold-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gold-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick toggle view & counters */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-display font-bold text-fln-900 bg-gold-100 px-2.5 py-1 rounded-md border border-gold-300">
              {filteredCandidates.length} {isAr ? 'مترشحين معروضين' : 'candidats affichés'}
            </span>

            <div className="inline-flex rounded-xl border border-gold-300 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
                title={isAr ? 'عرض الجدول الإداري الكامل (المطابقة، النضال، الرتبة)' : 'Tableau administratif complet'}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>{isAr ? 'عرض الجدول' : 'Vue Tableau'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
                title={isAr ? 'عرض بطاقات المترشحين بالتفصيل الإداري' : 'Grille de fiches individuelles'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isAr ? 'عرض البطاقات' : 'Vue Fiches'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center flex-wrap gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Filter className="w-3 h-3" />
            {isAr ? 'تصفية حسب:' : 'Filtrer:'}
          </span>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1 rounded-md bg-white border border-gold-300 text-slate-700 font-medium text-xs focus:ring-1 focus:ring-gold-500 outline-none"
          >
            <option value="ALL">{t.allStatuses}</option>
            <option value="complet">✓ {t.statusComplete}</option>
            <option value="en_cours">⏳ {t.statusPending}</option>
            <option value="incomplet">⚠️ {t.statusIncomplete}</option>
          </select>

          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={e => setGenderFilter(e.target.value as any)}
            className="px-2.5 py-1 rounded-md bg-white border border-gold-300 text-slate-700 font-medium text-xs focus:ring-1 focus:ring-gold-500 outline-none"
          >
            <option value="ALL">{isAr ? 'الكل (رجال ونساء)' : 'Tous genres'}</option>
            <option value="F">{isAr ? 'نساء فقط (المرأة)' : 'Femmes uniquement'}</option>
            <option value="H">{isAr ? 'رجال فقط' : 'Hommes uniquement'}</option>
          </select>

          {/* Quota Jeunes Filter */}
          <button
            onClick={() => setYouthFilter(!youthFilter)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium text-xs transition-colors border ${
              youthFilter
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>{isAr ? 'الشباب (< 35 سنة)' : 'Jeunes (< 35 ans)'}</span>
          </button>

          {/* Universitaires Filter */}
          <button
            onClick={() => setDegreeFilter(!degreeFilter)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-medium text-xs transition-colors border ${
              degreeFilter
                ? 'bg-blue-100 text-blue-900 border-blue-300 font-semibold'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-3 h-3 text-blue-600" />
            <span>{isAr ? 'إطارات جامعية' : 'Diplômés Univ.'}</span>
          </button>

          {/* Admin Numbering Direct Access Button */}
          <button
            onClick={onOpenNumberingManager}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors ml-auto shadow-2xs"
            title="Gérer la numérotation officielle des candidats (Réservé à l'administrateur)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            <span>{isAr ? 'ترتيب وتعيين الأرقام (الإدارة)' : 'Ordre & Numérotation (Admin)'}</span>
          </button>

          {/* Clear filters if active */}
          {(statusFilter !== 'ALL' || genderFilter !== 'ALL' || youthFilter || degreeFilter || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setGenderFilter('ALL');
                setYouthFilter(false);
                setDegreeFilter(false);
                setSearchTerm('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium underline underline-offset-2 ml-1"
            >
              {isAr ? 'إعادة ضبط' : 'Réinitialiser'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Table View or Cards View */}
      {filteredCandidates.length === 0 ? (
        <div className="p-12 text-center">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            {isAr ? 'لا يوجد أي مترشح يطابق هذه المعايير' : 'Aucun candidat ne correspond à ces critères'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {isAr ? 'يرجى تغيير خيارات البحث أو التصفية' : 'Essayez de modifier vos filtres ou termes de recherche'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-fln-900 text-gold-100 uppercase text-[10px] tracking-wider font-bold border-b border-gold-500/60">
                <th className="py-3 px-3 w-16 text-center">
                  <div className="flex flex-col items-center">
                    <span>{isAr ? 'رقم الإدارة' : 'N° Admin'}</span>
                    <span className="text-[8px] text-gold-300 normal-case font-bold">{isAr ? 'ممنوح' : 'Officiel'}</span>
                  </div>
                </th>
                <th className="py-3 px-3">{isAr ? 'المترشح (الاسم واللقب)' : 'Candidat'}</th>
                <th className="py-3 px-3">{isAr ? 'المجلس' : 'Conseil'}</th>
                <th className="py-3 px-3">{isAr ? 'الحي والاتصال' : 'Quartier & Contact'}</th>
                <th className="py-3 px-3">{isAr ? 'المهنة والمستوى' : 'Profession & Niveau'}</th>
                <th className="py-3 px-3">{isAr ? 'نضال FLN' : 'Militant FLN'}</th>
                <th className="py-3 px-3 text-center">
                  <div className="flex flex-col items-center">
                    <span>{isAr ? 'الوثائق الـ 11' : '11 Pièces'}</span>
                    <span className="text-[9px] text-gold-200/70 normal-case font-normal">
                      {isAr ? 'مطابقة إدارية' : 'Conformité'}
                    </span>
                  </div>
                </th>
                <th className="py-3 px-3 text-center">{isAr ? 'حالة الملف' : 'Statut'}</th>
                <th className="py-3 px-3 text-right">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.map(c => {
                const comp = getDossierCompliance(c);
                const age = calculateAge(c.birthDate);
                const youth = isYouth(c.birthDate);
                const hasRank = c.listRank !== null && c.listRank > 0;

                return (
                  <tr 
                    key={c.id} 
                    className="hover:bg-emerald-50/30 transition-colors group cursor-pointer"
                    onClick={() => onSelectCandidate(c)}
                  >
                    {/* Rank (Assigned by Administrator) */}
                    <td className="py-3 px-2 text-center" onClick={e => e.stopPropagation()}>
                      {hasRank ? (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickRankCandidate(c);
                            setQuickRankValue(String(c.listRank));
                          }}
                          className="group/rank inline-flex flex-col items-center justify-center p-1 rounded-lg hover:bg-amber-100/60 transition-all cursor-pointer"
                          title={isAr ? 'الرقم ممنوح من الإدارة - انقر لتعديل الترتيب' : 'Numéro officiel attribué par l\'administrateur - Cliquez pour modifier'}
                        >
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold shadow-2xs border transition-all ${
                            c.listRank === 1 
                              ? 'bg-amber-400 text-amber-950 border-amber-500 ring-2 ring-amber-200' 
                              : 'bg-white text-emerald-950 border-emerald-300 group-hover/rank:border-emerald-600'
                          }`}>
                            {c.listRank}
                          </span>
                          <span className="text-[8px] font-bold text-amber-800 mt-0.5 uppercase tracking-tighter">
                            Admin
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickRankCandidate(c);
                            setQuickRankValue('');
                          }}
                          className="inline-flex flex-col items-center justify-center px-1.5 py-1 rounded-lg border border-dashed border-amber-400 bg-amber-50/80 hover:bg-amber-100 text-amber-900 transition-colors cursor-pointer"
                          title={isAr ? 'تعيين رقم للمترشح من طرف الإدارة' : 'Attribuer un numéro officiel (Décision Administrateur)'}
                        >
                          <span className="text-[10px] font-bold">+ N°</span>
                          <span className="text-[7px] font-semibold text-amber-700">Admin</span>
                        </button>
                      )}
                    </td>

                    {/* Candidate Name & Bio */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        {c.photoUrl ? (
                          <img
                            src={c.photoUrl}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-emerald-500 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            c.gender === 'F' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {c.firstNameFr.charAt(0)}{c.lastNameFr.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-display font-bold text-fln-900 flex items-center gap-1.5 flex-wrap">
                            <span className="tracking-wide">{c.lastNameFr} {c.firstNameFr}</span>
                            <span className="text-slate-400 text-[11px] font-normal">
                              ({c.lastNameAr} {c.firstNameAr})
                            </span>
                            {c.listRank === 1 && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-300">
                                {isAr ? 'متصدر القائمة' : 'Tête de Liste'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{age} {isAr ? 'سنة' : 'ans'}</span>
                            <span>•</span>
                            <span className={c.gender === 'F' ? 'text-rose-600 font-medium' : 'text-slate-600'}>
                              {c.gender === 'F' ? (isAr ? 'أنثى' : 'Femme') : (isAr ? 'ذكر' : 'Homme')}
                            </span>
                            {youth && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1 rounded">
                                <Sparkles className="w-2.5 h-2.5" />
                                {isAr ? 'شاب' : 'Jeune'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Council Badge */}
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        c.council === 'APC'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      }`}>
                        {c.council === 'APC' ? <Building2 className="w-3 h-3" /> : <Landmark className="w-3 h-3" />}
                        <span>{c.council} {c.council === 'APC' ? (isAr ? 'بولوغين' : 'Bologhine') : (isAr ? 'الجزائر' : 'Alger')}</span>
                      </span>
                    </td>

                    {/* Neighborhood & Contact */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 text-slate-700 font-medium text-[11px]">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[140px]">{c.addressNeighborhood || 'بولوغين'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-[10px] mt-0.5">
                        <Phone className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        <a 
                          href={getCleanTelUrl(c.phoneNumber)}
                          onClick={e => e.stopPropagation()}
                          className="font-mono text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold hover:underline"
                          title={isAr ? 'انقر للاتصال المباشر' : 'Appeler directement'}
                        >
                          {formatPhoneNumber(c.phoneNumber)}
                        </a>
                      </div>
                    </td>

                    {/* Profession & Degree */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 truncate max-w-[160px]">
                        {c.profession}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        {c.isUniversityGraduate && <GraduationCap className="w-3 h-3 text-blue-600" />}
                        <span className="truncate max-w-[150px]">{c.educationLevel}</span>
                      </div>
                    </td>

                    {/* FLN Party Membership */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-emerald-900 text-[11px] flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                        <span>{c.partyMembershipNumber}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {isAr ? `منذ سنة ${c.partyJoinYear}` : `Adhérent ${c.partyJoinYear}`}
                      </div>
                    </td>

                    {/* 11 Document Micro-Matrix */}
                    <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {ADMINISTRATIVE_DOCUMENTS.map((docDef, idx) => {
                          const doc = c.documents?.[docDef.key];
                          const isDocConforme = doc?.status === 'conforme' || doc?.conforme === true;
                          const isDocNonConforme = doc?.status === 'non_conforme';

                          return (
                            <span
                              key={docDef.key}
                              title={`${idx + 1}. ${docDef.nameFr} (${docDef.nameAr}): ${
                                isDocConforme ? 'Conforme ✓' : isDocNonConforme ? 'Non conforme ✕' : 'En attente ⏳'
                              }`}
                              className={`w-2.5 h-2.5 rounded-full inline-block cursor-help transition-transform hover:scale-125 ${
                                isDocConforme 
                                  ? 'bg-emerald-600' 
                                  : isDocNonConforme
                                  ? 'bg-rose-600 ring-1 ring-rose-300'
                                  : 'bg-amber-400'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <div className="text-[10px] font-bold text-slate-600 mt-1">
                        {comp.conformeCount} / 11 {isAr ? 'وثائق' : 'pièces'}
                      </div>
                    </td>

                    {/* Overall Dossier Status */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        comp.isComplete
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : comp.conformeCount >= 8
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {comp.isComplete ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>100% {isAr ? 'جاهز' : 'Prêt'}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{comp.percentage}%</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        
                        {/* Audit Dossier Details */}
                        <button
                          onClick={() => onSelectCandidate(c)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                          title={t.viewDetails}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Print Official Slip for this candidate */}
                        <button
                          onClick={() => onPrintDossierSlip(c)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                          title={t.printOfficialSlip}
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Quick Rank */}
                        <button
                          onClick={() => {
                            setQuickRankCandidate(c);
                            setQuickRankValue(c.listRank ? String(c.listRank) : '');
                          }}
                          className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                          title={isAr ? 'تعيين / تعديل رقم الترتيب' : 'Numéro officiel'}
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                        </button>

                        {/* Edit Candidate */}
                        <button
                          onClick={() => onEditCandidate(c)}
                          className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                          title={t.editCandidate}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (window.confirm(isAr ? `هل أنت متأكد من حذف المترشح ${c.lastNameFr} ${c.firstNameFr}؟` : `Supprimer le candidat ${c.lastNameFr} ${c.firstNameFr} ?`)) {
                              onDeleteCandidate(c.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title={t.deleteCandidate}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Executive Cards Grid View ("Vue Fiches Administratives") */
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCandidates.map(c => {
            const comp = getDossierCompliance(c);
            const age = calculateAge(c.birthDate);
            const youth = isYouth(c.birthDate);
            const isDocsExpanded = expandedDocsCandidateId === c.id;
            const hasRank = c.listRank !== null && c.listRank > 0;

            return (
              <div
                key={c.id}
                id={`candidate-card-${c.id}`}
                className="bg-paper rounded-2xl border border-gold-200/80 hover:border-gold-500/80 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Council Badge & Official Electoral Rank */}
                  <div className="px-4 py-3 bg-gold-50/80 border-b border-gold-100 flex items-center justify-between gap-2">
                    {/* Conseil Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs ${
                      c.council === 'APC'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300/80'
                        : 'bg-indigo-100 text-indigo-900 border border-indigo-300/80'
                    }`}>
                      {c.council === 'APC' ? <Building2 className="w-3.5 h-3.5 text-emerald-700" /> : <Landmark className="w-3.5 h-3.5 text-indigo-700" />}
                      <span>{c.council === 'APC' ? (isAr ? 'بلدي APC بولوغين' : 'APC Bologhine') : (isAr ? 'ولائي APW الجزائر' : 'APW Alger')}</span>
                    </span>

                    {/* Official List Rank (Admin Controlled) */}
                    <div>
                      {hasRank ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickRankCandidate(c);
                            setQuickRankValue(c.listRank ? String(c.listRank) : '');
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black shadow-2xs transition-transform active:scale-95 cursor-pointer border ${
                            c.listRank === 1
                              ? 'bg-amber-400 text-amber-950 border-amber-500 ring-2 ring-amber-200'
                              : 'bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800'
                          }`}
                          title={isAr ? 'الترتيب الرسمي للمترشح - انقر للتعديل' : 'Numéro officiel du candidat - Cliquer pour modifier'}
                        >
                          {c.listRank === 1 ? (
                            <>
                              <Crown className="w-3.5 h-3.5 text-amber-950" />
                              <span className="font-mono">N° 01</span>
                              <span className="text-[10px] font-bold">{isAr ? 'متصدر' : 'Tête'}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-[10px] font-semibold text-emerald-200">Rang</span>
                              <span className="font-mono text-xs">{String(c.listRank).padStart(2, '0')}</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickRankCandidate(c);
                            setQuickRankValue('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-amber-900 bg-white hover:bg-amber-50 border border-dashed border-slate-300 hover:border-amber-400 transition-colors cursor-pointer shadow-2xs"
                          title={isAr ? 'تعيين رقم رسمي للمترشح' : 'Attribuer un rang officiel'}
                        >
                          <Hash className="w-3 h-3 text-slate-400" />
                          <span>{isAr ? '+ تعيين رقم' : '+ N° Officiel'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Candidate Identity Section */}
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-start gap-3">
                      {/* Photo / Avatar */}
                      <div className="relative shrink-0">
                        {c.photoUrl ? (
                          <img
                            src={c.photoUrl}
                            alt=""
                            className={`w-14 h-14 rounded-full object-cover border-2 shadow-xs ${
                              comp.isComplete 
                                ? 'border-emerald-600 ring-2 ring-emerald-100' 
                                : comp.conformeCount >= 8 
                                ? 'border-amber-500 ring-2 ring-amber-100' 
                                : 'border-rose-400 ring-2 ring-rose-100'
                            }`}
                          />
                        ) : (
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-base shadow-xs border-2 ${
                            c.gender === 'F' 
                              ? 'bg-rose-100 text-rose-800 border-rose-300' 
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}>
                            {c.firstNameFr.charAt(0)}{c.lastNameFr.charAt(0)}
                          </div>
                        )}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white ${
                          comp.isComplete ? 'bg-emerald-600' : comp.conformeCount >= 8 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}>
                          {comp.isComplete ? '✓' : '!'}
                        </span>
                      </div>

                      {/* Names & Demographics */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-display font-bold text-fln-900 text-base leading-snug font-arabic">
                          {c.lastNameAr} {c.firstNameAr}
                        </h4>
                        <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide mt-0.5 truncate">
                          {c.lastNameFr} {c.firstNameFr}
                        </p>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 flex-wrap">
                          <span className="font-display font-medium text-fln-900 bg-gold-100/80 px-2 py-0.5 rounded-md">
                            {age} {isAr ? 'سنة' : 'ans'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-medium text-xs ${
                            c.gender === 'F' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {c.gender === 'F' ? (isAr ? 'أنثى' : 'Femme') : (isAr ? 'ذكر' : 'Homme')}
                          </span>
                          {youth && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              <span>{isAr ? 'شاب (< 35)' : 'Jeune (< 35)'}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Candidate Details: 4. Quartier & Résidence, 5. Profession & Niveau, 6. Militantisme FLN */}
                  <div className="p-4 space-y-3 text-xs">
                    {/* 4. Quartier & Résidence */}
                    <div className="bg-ivory/80 p-2.5 rounded-xl border border-gold-200/70 space-y-1.5">
                      <div className="text-[10.5px] font-bold text-slate-700 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{isAr ? '4. الحي والإقامة' : '4. Quartier & Résidence'}</span>
                        </span>
                        <span className="font-semibold text-slate-900 text-xs">
                          {c.addressNeighborhood || 'Bologhine'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-0.5 border-t border-slate-200/60">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{isAr ? 'الهاتف المباشر' : 'Tél direct'}</span>
                        <a
                          href={getCleanTelUrl(c.phoneNumber)}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gold-100/90 hover:bg-gold-200 text-fln-950 border border-gold-300 font-mono font-bold text-xs transition-colors shrink-0"
                          title={isAr ? 'انقر للاتصال المباشر' : 'Appel direct'}
                        >
                          <Phone className="w-3 h-3 text-gold-700" />
                          <span>{formatPhoneNumber(c.phoneNumber)}</span>
                        </a>
                      </div>
                    </div>

                    {/* 5. Profession & Niveau */}
                    <div className="bg-ivory/80 p-2.5 rounded-xl border border-gold-200/70 space-y-1">
                      <div className="flex items-center gap-1 text-[10.5px] font-bold text-slate-700">
                        <Briefcase className="w-3 h-3 text-blue-600" />
                        <span>{isAr ? '5. المهنة والمستوى' : '5. Profession & Niveau'}</span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs truncate">
                        {c.profession}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center justify-between gap-1 mt-0.5 flex-wrap">
                        <span className="truncate">{c.educationLevel}</span>
                        {c.isUniversityGraduate && (
                          <span className="inline-flex items-center gap-0.5 font-bold text-[10px] text-blue-900 bg-blue-100 px-1.5 py-0.2 rounded border border-blue-200">
                            <GraduationCap className="w-2.5 h-2.5 text-blue-600" />
                            <span>{isAr ? 'إطار جامعي (33%)' : 'Diplômé Univ. (Quota 33%)'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 6. Militantisme FLN */}
                    <div className="bg-ivory/80 p-2.5 rounded-xl border border-gold-200/70 space-y-1">
                      <div className="flex items-center gap-1 text-[10.5px] font-bold text-slate-700">
                        <BadgeCheck className="w-3 h-3 text-emerald-700" />
                        <span>{isAr ? '6. نضال FLN' : '6. Militantisme FLN'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className="font-mono font-bold text-emerald-950 text-xs bg-emerald-100/70 px-1.5 py-0.5 rounded border border-emerald-200">
                          بطاقة: {c.partyMembershipNumber}
                        </span>
                        <span className="text-[11px] text-slate-600 font-medium">
                          {isAr ? `منخرط ${c.partyJoinYear}` : `Adhérent ${c.partyJoinYear}`}
                        </span>
                      </div>
                    </div>

                    {/* 7. Les 11 Pièces (Conformité) */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-800">
                            {isAr ? '7. الوثائق الـ 11 (مطابقة إدارية)' : '7. Les 11 Pièces (Conformité)'}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          comp.isComplete
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : comp.conformeCount >= 8
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}>
                          {comp.isComplete ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                          <span>{comp.conformeCount}/11 ({comp.percentage}%)</span>
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            comp.isComplete ? 'bg-emerald-600' : comp.conformeCount >= 8 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${comp.percentage}%` }}
                        />
                      </div>

                      {/* 11 Document Micro Indicators */}
                      <div className="grid grid-cols-11 gap-1 py-0.5">
                        {ADMINISTRATIVE_DOCUMENTS.map((docDef, idx) => {
                          const doc = c.documents?.[docDef.key];
                          const isDocConforme = doc?.status === 'conforme' || doc?.conforme === true;
                          const isDocNonConforme = doc?.status === 'non_conforme';

                          return (
                            <div
                              key={docDef.key}
                              title={`${idx + 1}. ${docDef.nameAr} (${docDef.nameFr}): ${
                                isDocConforme ? 'مطابق / Conforme' : isDocNonConforme ? 'غير مطابق / Non conforme' : 'قيد الانتظار / En attente'
                              }`}
                              className={`h-5 rounded flex items-center justify-center text-[9px] font-bold transition-all shadow-2xs ${
                                isDocConforme
                                  ? 'bg-emerald-600 text-white'
                                  : isDocNonConforme
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-amber-300 text-amber-950 border border-amber-400'
                              }`}
                            >
                              {idx + 1}
                            </div>
                          );
                        })}
                      </div>

                      {/* Accordion detail button */}
                      <button
                        type="button"
                        onClick={() => setExpandedDocsCandidateId(isDocsExpanded ? null : c.id)}
                        className="w-full text-center py-1 text-[11px] font-semibold text-fln-800 hover:text-fln-900 bg-gold-100/70 hover:bg-gold-100 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>
                          {isDocsExpanded 
                            ? (isAr ? 'إخفاء تفاصيل الوثائق ▲' : 'Masquer le détail des pièces ▲') 
                            : (isAr ? 'عرض تفاصيل حالة الـ 11 وثيقة ▼' : 'Afficher le détail des 11 pièces ▼')}
                        </span>
                      </button>

                      {/* Expanded checklist */}
                      {isDocsExpanded && (
                        <div className="p-2.5 bg-ivory rounded-xl border border-gold-200/70 space-y-1.5 animate-in fade-in duration-150">
                          {ADMINISTRATIVE_DOCUMENTS.map((docDef, idx) => {
                            const doc = c.documents?.[docDef.key];
                            const isDocConforme = doc?.status === 'conforme' || doc?.conforme === true;
                            const isDocNonConforme = doc?.status === 'non_conforme';

                            return (
                              <div key={docDef.key} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200/60 last:border-b-0">
                                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                                  <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span>{isAr ? docDef.nameAr : docDef.nameFr}</span>
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isDocConforme 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : isDocNonConforme 
                                    ? 'bg-rose-100 text-rose-800' 
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isDocConforme ? '✓ مطابق' : isDocNonConforme ? '✕ غير مطابق' : '⏳ قيد الانتظار'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Administrator Action Bar */}
                <div className="p-3 bg-gold-50/70 border-t border-gold-200 flex items-center justify-between gap-1.5">
                  {/* View Full Dossier */}
                  <button
                    type="button"
                    onClick={() => onSelectCandidate(c)}
                    className="flex-1 py-2 px-2.5 rounded-xl text-white font-display font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer min-h-[38px]"
                    style={{ background: 'linear-gradient(180deg,#0b5c39,#073b27)' }}
                    title={t.viewDetails}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isAr ? 'فحص الملف' : 'Dossier'}</span>
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => onEditCandidate(c)}
                    className="py-2 px-2.5 rounded-xl bg-white hover:bg-gold-100 text-slate-800 border border-gold-300 font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer min-h-[38px]"
                    title={t.editCandidate}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    <span className="hidden sm:inline">{isAr ? 'تعديل' : 'Modifier'}</span>
                  </button>

                  {/* Print Slip */}
                  <button
                    type="button"
                    onClick={() => onPrintDossierSlip(c)}
                    className="py-2 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer min-h-[38px]"
                    title={t.printOfficialSlip}
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">{isAr ? 'وصل' : 'Bordereau'}</span>
                  </button>

                  {/* Official Rank Quick Action */}
                  <button
                    type="button"
                    onClick={() => {
                      setQuickRankCandidate(c);
                      setQuickRankValue(c.listRank ? String(c.listRank) : '');
                    }}
                    className="py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer min-h-[38px]"
                    title={isAr ? 'تعيين رقم الترتيب الرسمي' : 'Numéro officiel'}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span className="hidden sm:inline">{isAr ? 'ترتيب' : 'Rang'}</span>
                  </button>

                  {/* Delete Candidate */}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(isAr ? `هل أنت متأكد من حذف المترشح ${c.lastNameFr} ${c.firstNameFr} نهائياً؟` : `Êtes-vous sûr de vouloir supprimer définitivement le candidat ${c.lastNameFr} ${c.firstNameFr} ?`)) {
                        onDeleteCandidate(c.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-300 transition-all active:scale-95 cursor-pointer min-h-[38px] flex items-center justify-center"
                    title={t.deleteCandidate}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend & Summary Footer */}
      <div className="p-3 bg-gold-50/60 border-t border-gold-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-slate-700">{isAr ? 'دليل الوثائق:' : 'Légende :'}:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
            <span>{isAr ? 'مستوفي ومطابق (Conforme)' : 'Conforme & vérifié'}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
            <span>{isAr ? 'قيد الانتظار أو الاستخراج' : 'En attente de délivrance'}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
            <span>{isAr ? 'غير مطابق / منتهي الصلاحية' : 'Non conforme / Expiré'}</span>
          </span>
        </div>

        <div className="text-slate-600 font-medium">
          {isAr ? 'قسمة بولوغين - لجنة الترشيحات والاستمارات' : 'Kasma Bologhine - Commission de Dépôt ANIE'}
        </div>
      </div>

      {/* Quick Admin Rank Assignment Popover Modal */}
      {quickRankCandidate && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-fln-950/70 backdrop-blur-2xs"
          onClick={() => setQuickRankCandidate(null)}
        >
          <div 
            className="bg-paper rounded-2xl shadow-2xl border border-gold-400/70 w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gold-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gold-100 text-gold-900 flex items-center justify-center border border-gold-300">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gold-800">
                    {isAr ? 'صلاحيات الإدارة' : 'Décision Administrateur'}
                  </h3>
                  <p className="text-sm font-display font-bold text-fln-900">
                    {isAr ? 'تعيين رقم المترشح في القائمة' : 'Numérotation Officielle'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setQuickRankCandidate(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-2.5 rounded-lg bg-gold-50 border border-gold-200 text-xs">
                <div className="font-bold text-slate-800">
                  {quickRankCandidate.lastNameFr} {quickRankCandidate.firstNameFr}
                </div>
                <div className="text-slate-500 font-arabic text-[11px]">
                  {quickRankCandidate.lastNameAr} {quickRankCandidate.firstNameAr}
                </div>
                <div className="text-slate-500 mt-1 flex items-center gap-1.5">
                  <span className="font-semibold text-emerald-800">
                    {quickRankCandidate.council === 'APC' ? 'APC Bologhine' : 'APW Alger'}
                  </span>
                  <span>•</span>
                  <span>{quickRankCandidate.profession}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'الرقم الممنوح رسمياً (1 = متصدر القائمة):' : 'Numéro attribué par l\'administrateur (1 = Tête de liste) :'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={quickRankValue}
                    onChange={e => setQuickRankValue(e.target.value)}
                    placeholder="Ex: 1, 2, 3..."
                    className="flex-1 px-3 py-2 text-base font-extrabold text-slate-900 bg-white border-2 border-emerald-600/60 rounded-xl focus:border-emerald-600 focus:outline-none text-center"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {isAr 
                    ? 'هذا الرقم يمنحه أمين القسمة / مسؤول الانتخابات فقط.' 
                    : 'Ce numéro de liste est réservé à l\'administrateur de Kasma.'}
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isAr ? 'اختصارات سريعة:' : 'Raccourcis rapides :'}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setQuickRankValue('1')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200"
                  >
                    <Crown className="w-3 h-3 text-amber-700" />
                    <span>N° 1 Tête</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickRankValue('2')}
                    className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200"
                  >
                    N° 2
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickRankValue('3')}
                    className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200"
                  >
                    N° 3
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickRankValue('4')}
                    className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200"
                  >
                    N° 4
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickRankValue('5')}
                    className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200"
                  >
                    N° 5
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onAssignRankDirect) {
                    onAssignRankDirect(quickRankCandidate.id, null);
                  }
                  setQuickRankCandidate(null);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors font-medium"
              >
                {isAr ? 'إلغاء الرقم' : 'Non classé'}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickRankCandidate(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {isAr ? 'إلغاء' : 'Fermer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseInt(quickRankValue);
                    const finalRank = isNaN(parsed) || parsed <= 0 ? null : parsed;
                    if (onAssignRankDirect) {
                      onAssignRankDirect(quickRankCandidate.id, finalRank);
                    }
                    setQuickRankCandidate(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-fln-800 hover:bg-fln-900 rounded-lg shadow-xs cursor-pointer border border-gold-500/60"
                >
                  {isAr ? 'تأكيد الرقم' : 'Attribuer N°'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
