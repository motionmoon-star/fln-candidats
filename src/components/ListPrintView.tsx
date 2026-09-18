import React from 'react';
import { Candidate, CouncilType } from '../types';
import { calculateAge, getDossierCompliance, isYouth } from '../utils/candidateUtils';
import { Printer, X } from 'lucide-react';
import { BologhineLogo } from './BologhineLogo';

interface ListPrintViewProps {
  candidates: Candidate[];
  council: CouncilType | 'ALL';
  onClose: () => void;
}

export const ListPrintView: React.FC<ListPrintViewProps> = ({ candidates, council, onClose }) => {
  const filtered = council === 'ALL' ? candidates : candidates.filter(c => c.council === council);
  const sorted = [...filtered].sort((a, b) => {
    if (council === 'ALL' && a.council !== b.council) {
      return a.council === 'APC' ? -1 : 1;
    }
    const rA = a.listRank ?? 9999;
    const rB = b.listRank ?? 9999;
    if (rA !== rB) return rA - rB;
    return a.lastNameFr.localeCompare(b.lastNameFr);
  });

  const apcCount = sorted.filter(c => c.council === 'APC').length;
  const apwCount = sorted.filter(c => c.council === 'APW').length;
  const womenCount = sorted.filter(c => c.gender === 'F').length;
  const youthCount = sorted.filter(c => isYouth(c.birthDate)).length;
  const degreeCount = sorted.filter(c => c.isUniversityGraduate).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden">
        
        {/* Screen Toolbar */}
        <div className="no-print p-3 sm:p-4 border-b border-slate-200 bg-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <span>Aperçu de la Liste Officielle des Candidats</span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-700">
              {council === 'ALL' ? 'APC & APW' : council === 'APC' ? 'APC Bologhine' : 'APW Alger'} ({sorted.length} candidats)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer la Liste</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible">
          
          {/* Header */}
          <div className="text-center border-b-2 border-emerald-900 pb-3 mb-4">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1 font-arabic">
              <span>الجمهورية الجزائرية الديمقراطية الشعبية</span>
              <span>RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</span>
            </div>

            <div className="my-2 py-1.5 border-y border-slate-200 bg-slate-50 flex items-center justify-between px-3">
              <div className="text-left text-xs font-semibold text-emerald-900">
                PARTI DU FRONT DE LIBÉRATION NATIONALE<br />
                MOUHAFADHA DE BAB EL OUED<br />
                <span className="font-bold text-slate-900">KASMA DE BOLOGHINE</span>
              </div>
              <BologhineLogo size="lg" className="w-14 h-14" />
              <div className="text-right text-xs font-semibold text-emerald-900 font-arabic">
                حزب جبهة التحرير الوطني<br />
                محافظة باب الوادي<br />
                <span className="font-bold text-slate-900">قسمة بولوغين</span>
              </div>
            </div>

            <h1 className="text-base font-extrabold text-slate-900 uppercase">
              LISTE OFFICIELLE DES CANDIDATURES PROPOSÉES AUX ÉLECTIONS
            </h1>
            <h2 className="text-sm font-bold text-emerald-900 font-arabic mt-0.5">
              {council === 'APC' 
                ? 'قائمة مترشحي المجلس الشعبي البلدي لبلدية بولوغين (A.P.C)' 
                : council === 'APW'
                ? 'قائمة مترشحي المجلس الشعبي الولائي لولاية الجزائر (A.P.W)'
                : 'قوائم الترشح للمجالس الشعبية البلدية والولائية (قسمة بولوغين)'}
            </h2>
          </div>

          {/* Table */}
          <table className="w-full text-left text-xs border border-slate-300 mb-4">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-bold text-[10px] uppercase">
                <th className="p-1.5 text-center border-r border-slate-300 w-10">N°</th>
                <th className="p-1.5 border-r border-slate-300">Nom & Prénom</th>
                <th className="p-1.5 border-r border-slate-300 text-right font-arabic">اللقب والاسم</th>
                <th className="p-1.5 border-r border-slate-300 text-center w-12">Scrutin</th>
                <th className="p-1.5 border-r border-slate-300 text-center w-12">Sexe/Âge</th>
                <th className="p-1.5 border-r border-slate-300">Profession & Niveau</th>
                <th className="p-1.5 border-r border-slate-300">Quartier (Bologhine)</th>
                <th className="p-1.5 border-r border-slate-300">N° Carte FLN</th>
                <th className="p-1.5 text-center w-24">Dossier (11 docs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {sorted.map(c => {
                const comp = getDossierCompliance(c);
                const age = calculateAge(c.birthDate);

                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-1.5 text-center font-bold border-r border-slate-300">
                      {c.listRank !== null ? (
                        c.listRank
                      ) : (
                        <span className="text-[9px] text-slate-400 font-normal italic">En attente</span>
                      )}
                    </td>
                    <td className="p-1.5 font-bold uppercase text-slate-900 border-r border-slate-300">
                      {c.lastNameFr} {c.firstNameFr}
                      {c.listRank === 1 && (
                        <span className="ml-1 text-[9px] bg-amber-100 text-amber-900 px-1 rounded font-bold">
                          Tête
                        </span>
                      )}
                    </td>
                    <td className="p-1.5 text-right font-arabic font-bold text-slate-900 border-r border-slate-300">
                      {c.lastNameAr} {c.firstNameAr}
                    </td>
                    <td className="p-1.5 text-center font-semibold border-r border-slate-300">
                      {c.council}
                    </td>
                    <td className="p-1.5 text-center border-r border-slate-300">
                      {c.gender} / {age}a
                    </td>
                    <td className="p-1.5 border-r border-slate-300">
                      <span className="font-medium text-slate-800">{c.profession}</span>
                      <span className="block text-[10px] text-slate-500">{c.educationLevel}</span>
                    </td>
                    <td className="p-1.5 border-r border-slate-300 text-slate-700">
                      {c.addressNeighborhood}
                    </td>
                    <td className="p-1.5 border-r border-slate-300 font-semibold text-emerald-900">
                      {c.partyMembershipNumber}
                    </td>
                    <td className="p-1.5 text-center font-bold">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        comp.isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {comp.conformeCount}/11 ({comp.percentage}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Quota Statistical Summary */}
          <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 text-xs flex items-center justify-between flex-wrap gap-2 mb-6">
            <div>
              <span className="font-bold text-slate-900">Total Candidats : </span>
              <span className="font-semibold text-emerald-900">{sorted.length}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900">Femmes : </span>
              <span className="font-semibold text-rose-800">
                {womenCount} ({sorted.length > 0 ? Math.round((womenCount / sorted.length) * 100) : 0}%)
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-900">Jeunes (&lt; 35 ans) : </span>
              <span className="font-semibold text-amber-800">
                {youthCount} ({sorted.length > 0 ? Math.round((youthCount / sorted.length) * 100) : 0}%)
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-900">Diplômés d'Enseignement Supérieur : </span>
              <span className="font-semibold text-blue-800">
                {degreeCount} ({sorted.length > 0 ? Math.round((degreeCount / sorted.length) * 100) : 0}%)
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 text-center text-xs pt-4 border-t border-slate-300">
            <div>
              <p className="font-bold text-slate-800 mb-14">
                La Commission Électorale de Kasma<br />
                <span className="text-[10px] font-normal font-arabic">اللجنة الانتخابية لقسمة بولوغين</span>
              </p>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">
                Cachet et signature
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-800 mb-14">
                Le Mouhafadh de Bab El Oued<br />
                <span className="text-[10px] font-normal font-arabic">محافظ حزب جبهة التحرير الوطني لباب الوادي</span>
              </p>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">
                Visa et validation officielle
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
