import React from 'react';
import { Candidate } from '../types';
import { ADMINISTRATIVE_DOCUMENTS } from '../data/documentsList';
import { getDossierCompliance, calculateAge, formatPhoneNumber } from '../utils/candidateUtils';
import { Printer, X, Check, Clock, AlertCircle } from 'lucide-react';
import { BologhineLogo } from './BologhineLogo';

interface DossierPrintViewProps {
  candidate: Candidate;
  onClose: () => void;
}

export const DossierPrintView: React.FC<DossierPrintViewProps> = ({ candidate, onClose }) => {
  const comp = getDossierCompliance(candidate);
  const age = calculateAge(candidate.birthDate);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden">
        
        {/* Screen Toolbar (Hidden on Print) */}
        <div className="no-print p-3 sm:p-4 border-b border-slate-200 bg-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <span>Aperçu avant impression (Format A4 Officiel)</span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-700">{candidate.lastNameFr} {candidate.firstNameFr}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / Sauvegarder PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible">
          
          {/* Official Algerian & FLN Header */}
          <div className="text-center border-b-2 border-emerald-900 pb-3 mb-4">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1 font-arabic">
              <span>الجمهورية الجزائرية الديمقراطية الشعبية</span>
              <span>RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</span>
            </div>

            <div className="my-2 py-1.5 border-y border-slate-200 bg-slate-50/70 flex items-center justify-between px-3">
              <div className="text-left text-xs font-semibold text-emerald-900">
                PARTI DU FRONT DE LIBÉRATION NATIONALE<br />
                MOUHAFADHA DE BAB EL OUED<br />
                <span className="font-bold text-slate-900">KASMA DE BOLOGHINE</span>
              </div>
              <BologhineLogo size="lg" className="w-14 h-14" />
              <div className="text-right text-xs font-semibold text-emerald-900 font-arabic">
                حزب جبهة التحرير الوطني<br />
                محافظة باب الوادي<br />
                <span className="font-bold text-slate-900">قسمة بولوغين (ابن الزيري)</span>
              </div>
            </div>

            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase tracking-wide mt-2">
              BORDEREAU OFFICIEL DE CONFORMITÉ DU DOSSIER DE CANDIDATURE
            </h1>
            <h2 className="text-sm font-bold text-emerald-900 font-arabic mt-0.5">
              استمارة المراقبة والتدقيق الإداري لملف الترشح للمجالس الشعبية المنتخبة
            </h2>
            <div className="mt-1 inline-block px-3 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              Scrutin : {candidate.council === 'APC' ? 'المجلس الشعبي البلدي لبلدية بولوغين (A.P.C Bologhine)' : 'المجلس الشعبي الولائي لولاية الجزائر (A.P.W Alger)'}
              {' '}— {candidate.listRank !== null ? (candidate.listRank === 1 ? '★ N° 1 (Tête de liste)' : `N° ${candidate.listRank}`) : 'N° en attente d\'attribution (Admin)'}
            </div>
          </div>

          {/* Candidate Identification Box */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-4 border border-slate-300 rounded-lg p-3 bg-slate-50/50">
            <div>
              <span className="text-slate-500 font-medium">Nom & Prénom : </span>
              <span className="font-bold text-slate-900 uppercase">{candidate.lastNameFr} {candidate.firstNameFr}</span>
            </div>
            <div className="text-right font-arabic">
              <span className="text-slate-500 font-medium">اللقب والاسم : </span>
              <span className="font-bold text-slate-900">{candidate.lastNameAr} {candidate.firstNameAr}</span>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Date & Lieu de Naissance : </span>
              <span className="font-semibold text-slate-800">{candidate.birthDate} ({age} ans) à {candidate.birthPlace}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">N° Identification National (NIN) : </span>
              <span className="font-semibold text-slate-800">{candidate.nationalIdNumber}</span>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Quartier de Résidence : </span>
              <span className="font-semibold text-slate-800">{candidate.addressNeighborhood}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Téléphone : </span>
              <span className="font-semibold text-slate-800 font-mono">{formatPhoneNumber(candidate.phoneNumber)}</span>
            </div>

            <div>
              <span className="text-slate-500 font-medium">Profession & Niveau : </span>
              <span className="font-semibold text-slate-800">{candidate.profession} — {candidate.educationLevel}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium">N° Carte Militant FLN : </span>
              <span className="font-bold text-emerald-900">{candidate.partyMembershipNumber} (Adhérent {candidate.partyJoinYear})</span>
            </div>
          </div>

          {/* The 11 Required Documents Audit Table */}
          <table className="w-full text-left text-xs border border-slate-300 mb-4">
            <thead>
              <tr className="bg-slate-200/80 border-b border-slate-300 text-slate-800 font-bold text-[11px]">
                <th className="p-2 w-8 text-center border-r border-slate-300">N°</th>
                <th className="p-2 border-r border-slate-300">Désignation du Document Administratif</th>
                <th className="p-2 border-r border-slate-300 text-right font-arabic">تسمية الوثيقة الإدارية</th>
                <th className="p-2 w-28 text-center border-r border-slate-300">Statut / Conformité</th>
                <th className="p-2 w-44">Date & Observations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ADMINISTRATIVE_DOCUMENTS.map((docDef, index) => {
                const userDoc = candidate.documents?.[docDef.key];
                const isConforme = userDoc?.status === 'conforme' || userDoc?.conforme === true;

                return (
                  <tr key={docDef.key} className={isConforme ? 'bg-white' : 'bg-amber-50/50'}>
                    <td className="p-1.5 text-center font-bold text-slate-700 border-r border-slate-300">
                      {index + 1}
                    </td>
                    <td className="p-1.5 font-semibold text-slate-900 border-r border-slate-300">
                      {docDef.nameFr}
                      <span className="block text-[10px] text-slate-500 font-normal">{docDef.validityFr}</span>
                    </td>
                    <td className="p-1.5 text-right font-arabic font-medium text-slate-800 border-r border-slate-300">
                      {docDef.nameAr}
                    </td>
                    <td className="p-1.5 text-center border-r border-slate-300">
                      {isConforme ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10px] border border-emerald-300">
                          [CONFORME]
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px] border border-amber-300">
                          EN ATTENTE
                        </span>
                      )}
                    </td>
                    <td className="p-1.5 text-[10px] text-slate-600">
                      {userDoc?.issueDate ? `Délivré le ${userDoc.issueDate}` : 'En cours de délivrance'}
                      {userDoc?.notes && ` • ${userDoc.notes}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Conclusion & Official Signatures */}
          <div className="border border-slate-300 rounded-lg p-3.5 bg-slate-50/70 text-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-bold text-slate-800">Bilan de la Commission Électorale de Kasma : </span>
                <span className={`font-bold ${comp.isComplete ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {comp.conformeCount} / 11 Pièces Validées ({comp.percentage}%) — {comp.isComplete ? 'DOSSIER RECEVABLE ET PRÊT POUR DÉPÔT ANIE' : 'DOSSIER EN COURS DE COMPLÈTEMENT'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Fait à Bologhine, le {new Date().toLocaleDateString('fr-FR')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-300 text-center">
              <div>
                <p className="font-semibold text-slate-700 mb-12">
                  Émargement du Candidat(e)<br />
                  <span className="text-[10px] font-normal text-slate-500 font-arabic">توقيع المترشح(ة) والمصادقة على صحة الوثائق</span>
                </p>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-400">
                  Signature précédée de la mention "Lu et approuvé"
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-700 mb-12">
                  Le Secrétaire de Kasma / Président de la Commission<br />
                  <span className="text-[10px] font-normal text-slate-500 font-arabic">أمين القسمة / رئيس لجنة دراسة الترشيحات</span>
                </p>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-400">
                  Signature & Cachet Officiel FLN Kasma Bologhine
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
