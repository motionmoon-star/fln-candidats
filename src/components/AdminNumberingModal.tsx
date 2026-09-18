import React, { useState } from 'react';
import { Candidate, CouncilType } from '../types';
import { Language, TRANSLATIONS } from '../data/translations';
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  Crown, 
  Save, 
  RotateCcw, 
  Sparkles, 
  Building2, 
  Landmark, 
  CheckCircle2, 
  Hash,
  ShieldCheck,
  UserCheck,
  Trash2
} from 'lucide-react';
import { getDossierCompliance } from '../utils/candidateUtils';

interface AdminNumberingModalProps {
  candidates: Candidate[];
  language: Language;
  currentCouncil: CouncilType;
  onClose: () => void;
  onSaveOrder: (updatedCandidates: Candidate[]) => void;
  onDeleteCandidate?: (id: string) => void;
  onDeleteAllExceptHasbaloui?: () => void;
}

export const AdminNumberingModal: React.FC<AdminNumberingModalProps> = ({
  candidates,
  language,
  currentCouncil: initialCouncil,
  onClose,
  onSaveOrder,
  onDeleteCandidate,
  onDeleteAllExceptHasbaloui,
}) => {
  const isAr = language === 'ar';
  const [council, setCouncil] = useState<CouncilType>(initialCouncil);

  // Local list of candidates for this council
  const [localCandidates, setLocalCandidates] = useState<Candidate[]>(() => {
    return [...candidates].sort((a, b) => {
      if (a.council !== b.council) return a.council === 'APC' ? -1 : 1;
      const rankA = a.listRank ?? 9999;
      const rankB = b.listRank ?? 9999;
      return rankA - rankB;
    });
  });

  const councilCandidates = localCandidates.filter(c => c.council === council);

  // Delete a single candidate as Administrator
  const handleDeleteSingle = (candidateId: string, fullName: string) => {
    const confirmMsg = isAr
      ? `إجراء إداري: هل أنت متأكد من حذف المترشح "${fullName}" نهائياً من القائمة؟`
      : `Action Administrateur : Êtes-vous sûr de vouloir supprimer définitivement le candidat "${fullName}" de la liste ?`;
    
    if (window.confirm(confirmMsg)) {
      setLocalCandidates(prev => {
        const remaining = prev.filter(c => c.id !== candidateId);
        // Re-number council candidates cleanly
        const otherCouncils = remaining.filter(c => c.council !== council);
        const thisCouncil = remaining.filter(c => c.council === council).map((c, idx) => ({
          ...c,
          listRank: c.listRank ? idx + 1 : null,
        }));
        return [...otherCouncils, ...thisCouncil];
      });

      if (onDeleteCandidate) {
        onDeleteCandidate(candidateId);
      }
    }
  };

  // Delete all except Hasbaloui as Administrator
  const handleKeepOnlyHasbaloui = () => {
    const confirmMsg = isAr
      ? 'إجراء إداري حاسم: هل تريد حذف جميع المترشحين والإبقاء على مترشح واحد فقط (حسبلاوي)؟'
      : 'Action Administrateur : Supprimer TOUS les candidats de la liste sauf Hasbaloui (1 seul candidat restant) ?';

    if (window.confirm(confirmMsg)) {
      if (onDeleteAllExceptHasbaloui) {
        onDeleteAllExceptHasbaloui();
        onClose();
      } else {
        const hasbaoui = localCandidates.find(c => {
          const lFr = (c.lastNameFr || '').toUpperCase();
          const fFr = (c.firstNameFr || '').toUpperCase();
          const lAr = c.lastNameAr || '';
          return lFr.includes('HASBA') || lFr.includes('HASBAL') || fFr.includes('HASBA') || lAr.includes('حسبلا');
        });
        if (hasbaoui) {
          setLocalCandidates([hasbaoui]);
          onSaveOrder([hasbaoui]);
        }
      }
    }
  };

  // Set specific rank for a candidate and shift others
  const handleSetRank = (candidateId: string, newRankStr: string) => {
    const newRank = parseInt(newRankStr);
    if (isNaN(newRank) || newRank <= 0) return;

    setLocalCandidates(prev => {
      const otherCouncils = prev.filter(c => c.council !== council);
      const currentList = prev.filter(c => c.council === council);

      const target = currentList.find(c => c.id === candidateId);
      if (!target) return prev;

      // Remove target and insert at desired index
      const remaining = currentList.filter(c => c.id !== candidateId);
      const insertIndex = Math.min(Math.max(0, newRank - 1), remaining.length);
      remaining.splice(insertIndex, 0, { ...target, listRank: newRank, assignedByAdmin: true });

      // Re-index cleanly 1..N
      const reindexed = remaining.map((c, idx) => ({
        ...c,
        listRank: idx + 1,
        assignedByAdmin: true,
      }));

      return [...otherCouncils, ...reindexed];
    });
  };

  // Move candidate up in the list
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setLocalCandidates(prev => {
      const otherCouncils = prev.filter(c => c.council !== council);
      const list = [...prev.filter(c => c.council === council)];

      // Swap
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;

      // Re-assign ranks 1..N
      const reindexed = list.map((c, idx) => ({
        ...c,
        listRank: idx + 1,
        assignedByAdmin: true,
      }));

      return [...otherCouncils, ...reindexed];
    });
  };

  // Move candidate down in the list
  const handleMoveDown = (index: number) => {
    if (index >= councilCandidates.length - 1) return;
    setLocalCandidates(prev => {
      const otherCouncils = prev.filter(c => c.council !== council);
      const list = [...prev.filter(c => c.council === council)];

      // Swap
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;

      // Re-assign ranks 1..N
      const reindexed = list.map((c, idx) => ({
        ...c,
        listRank: idx + 1,
        assignedByAdmin: true,
      }));

      return [...otherCouncils, ...reindexed];
    });
  };

  // Set candidate as Tête de liste (Rank #1)
  const handleSetTeteDeListe = (candidateId: string) => {
    handleSetRank(candidateId, '1');
  };

  // Remove number (unassign)
  const handleUnassignRank = (candidateId: string) => {
    setLocalCandidates(prev => {
      return prev.map(c => {
        if (c.id === candidateId) {
          return { ...c, listRank: null, assignedByAdmin: false };
        }
        return c;
      });
    });
  };

  // Auto-number sequentially 1..N
  const handleAutoNumberSequentially = () => {
    setLocalCandidates(prev => {
      const otherCouncils = prev.filter(c => c.council !== council);
      const list = prev.filter(c => c.council === council);
      const reindexed = list.map((c, idx) => ({
        ...c,
        listRank: idx + 1,
        assignedByAdmin: true,
      }));
      return [...otherCouncils, ...reindexed];
    });
  };

  const handleSave = () => {
    onSaveOrder(localCandidates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  {isAr ? 'صلاحيات الإدارة / أمين القسمة' : 'Espace Administrateur'}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {isAr ? 'ترتيب وتعيين أرقام المترشحين في القائمة' : 'Numérotation & Ordre Officiel des Candidats'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr 
                  ? 'الترتيب الرسمي للقائمة يمنحه حصرياً مسؤول الإدارة / أمين القسمة وفق معايير الحزب وتوافق اللجنة' 
                  : 'L\'attribution du numéro de liste (Tête de liste, rangs 2, 3...) relève de la décision exclusive de l\'administrateur.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Council Selector & Auto-number toolbar */}
        <div className="p-3 sm:px-6 bg-slate-100/75 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          
          {/* Council Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCouncil('APC')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                council === 'APC'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>APC Bologhine ({localCandidates.filter(c => c.council === 'APC').length})</span>
            </button>

            <button
              onClick={() => setCouncil('APW')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                council === 'APW'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>APW Alger ({localCandidates.filter(c => c.council === 'APW').length})</span>
            </button>
          </div>

          {/* Quick Admin Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleAutoNumberSequentially}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              title="Renuméroter consécutivement de 1 à N"
            >
              <RotateCcw className="w-3 h-3 text-emerald-700" />
              <span>{isAr ? 'ترقيم تسلسلي (1..N)' : 'Renuméroter (1..N)'}</span>
            </button>

            {/* Admin Delete Action: Keep only Hasbaloui */}
            <button
              onClick={handleKeepOnlyHasbaloui}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-colors cursor-pointer"
              title={isAr ? 'حذف كل المترشحين والإبقاء فقط على حسبلاوي (مرشح واحد)' : 'Supprimer tous les candidats sauf Hasbaloui (1 seul candidat)'}
            >
              <Trash2 className="w-3 h-3 text-rose-600" />
              <span>{isAr ? 'حذف الكل عدا حسبلاوي' : 'Garder uniquement Hasbaloui'}</span>
            </button>
          </div>
        </div>

        {/* Candidates List with Re-order Controls */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
          {councilCandidates.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              {isAr ? 'لا يوجد أي مترشح مسجل في هذا المجلس' : 'Aucun candidat inscrit pour ce conseil.'}
            </div>
          ) : (
            councilCandidates.map((c, index) => {
              const comp = getDossierCompliance(c);
              const isTete = c.listRank === 1;
              const hasRank = c.listRank !== null && c.listRank > 0;

              return (
                <div
                  key={c.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                    isTete
                      ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                      : hasRank
                      ? 'bg-white border-slate-200 hover:border-emerald-300'
                      : 'bg-slate-50 border-dashed border-slate-300 opacity-80'
                  }`}
                >
                  {/* Left: Number & Identity */}
                  <div className="flex items-center gap-3">
                    
                    {/* Admin Number Badge / Input */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={c.listRank ?? ''}
                          onChange={e => handleSetRank(c.id, e.target.value)}
                          placeholder="—"
                          className={`w-11 h-11 text-center font-extrabold text-sm rounded-xl border shadow-2xs focus:ring-2 focus:ring-emerald-600 outline-none transition-all ${
                            isTete
                              ? 'bg-amber-400 text-amber-950 border-amber-500 ring-2 ring-amber-200'
                              : hasRank
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : 'bg-white text-slate-400 border-slate-300'
                          }`}
                          title={isAr ? 'الرقم الممنوح من الإدارة (انقر للتعديل)' : 'Numéro attribué par l\'administrateur (Cliquez pour modifier)'}
                        />
                        {isTete && (
                          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                            <Crown className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                        {isAr ? 'رقم الإدارة' : 'N° Admin'}
                      </span>
                    </div>

                    {/* Candidate Details */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
                          {c.lastNameFr} {c.firstNameFr}
                        </span>
                        <span className="text-xs text-slate-500 font-arabic">
                          ({c.lastNameAr} {c.firstNameAr})
                        </span>
                        {isTete && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded border border-amber-400">
                            <Crown className="w-3 h-3 text-amber-800" />
                            <span>{isAr ? 'متصدر القائمة (Tête de liste)' : 'Tête de Liste'}</span>
                          </span>
                        )}
                        {!hasRank && (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                            {isAr ? 'غير مرقم (في الانتظار)' : 'Non numéroté'}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>{c.profession}</span>
                        <span>•</span>
                        <span>{c.addressNeighborhood}</span>
                        <span>•</span>
                        <span className="text-emerald-800 font-semibold">{c.partyMembershipNumber}</span>
                        <span>•</span>
                        <span className={comp.isComplete ? 'text-emerald-700 font-medium' : 'text-amber-700'}>
                          {comp.conformeCount}/11 {isAr ? 'وثائق' : 'pièces'} ({comp.percentage}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Admin Action Buttons (Up, Down, Tête de liste, etc.) */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    
                    {/* Move Up */}
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title={isAr ? 'تقديم المترشح (رفع الرتبة)' : 'Monter dans la liste (priorité)'}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === councilCandidates.length - 1}
                      className="p-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title={isAr ? 'تأخير المترشح (إنزال الرتبة)' : 'Descendre dans la liste'}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Designate Tête de Liste */}
                    {!isTete && (
                      <button
                        onClick={() => handleSetTeteDeListe(c.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors"
                        title={isAr ? 'تعيين كمتصدر للقائمة (رقم 1)' : 'Nommer Tête de liste (N°1)'}
                      >
                        <Crown className="w-3 h-3 text-amber-700" />
                        <span className="hidden md:inline">{isAr ? 'متصدر #1' : 'N° 1 Tête'}</span>
                      </button>
                    )}

                    {/* Unassign / Remove Rank */}
                    {hasRank && (
                      <button
                        onClick={() => handleUnassignRank(c.id)}
                        className="px-2 py-1 text-[11px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title={isAr ? 'إلغاء الرقم المؤقت' : 'Retirer le numéro'}
                      >
                        {isAr ? 'إلغاء' : 'Dénuméroter'}
                      </button>
                    )}

                    {/* Delete Candidate (Action Administrateur) */}
                    <button
                      type="button"
                      onClick={() => handleDeleteSingle(c.id, `${c.lastNameFr} ${c.firstNameFr}`)}
                      className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer"
                      title={isAr ? 'حذف المترشح من القائمة (إجراء إداري)' : 'Supprimer ce candidat de la liste (Action Administrateur)'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-700" />
            <span>
              {isAr 
                ? 'يتم تطبيق الأرقام فور اعتماد الإدارة وحفظ التعديلات' 
                : 'L\'ordre officiel s\'appliquera sur toutes les listes, fiches et exports'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
            >
              {isAr ? 'إلغاء' : 'Annuler'}
            </button>

            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isAr ? 'اعتماد وتثبيت ترتيب الإدارة' : 'Confirmer la Numérotation Officielle'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
