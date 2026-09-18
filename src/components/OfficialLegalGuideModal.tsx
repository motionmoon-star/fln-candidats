import React from 'react';
import { Language } from '../data/translations';
import { ADMINISTRATIVE_DOCUMENTS } from '../data/documentsList';
import { X, BookOpen, Scale, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface OfficialLegalGuideModalProps {
  language: Language;
  onClose: () => void;
}

export const OfficialLegalGuideModal: React.FC<OfficialLegalGuideModalProps> = ({ language, onClose }) => {
  const isAr = language === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isAr ? 'الدليل القانوني ومواصفات قبول ملفات الترشح (ANIE)' : 'Guide Légal & Critères de Recevabilité du Dossier (ANIE)'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? 'القانون العضوي المنظم للانتخابات - المجالس الشعبية البلدية والولائية' : 'Ordonnance relative au régime électoral - APC & APW'}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-slate-700">
          
          {/* Key Legal Thresholds */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <span className="font-bold text-rose-900 block text-sm mb-1">
                {isAr ? 'المناصفة وتمثيل المرأة' : 'Parité & Quota Féminin'}
              </span>
              <p className="text-rose-800 leading-relaxed">
                {isAr 
                  ? 'يجب مراعاة تمثيل النساء بنسب محددة وفق الدائرة الانتخابية لضمان دستورية القائمة.' 
                  : 'Présence impérative des candidates féminines selon les ratios prévus par la loi organique.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="font-bold text-amber-900 block text-sm mb-1">
                {isAr ? 'شرط الشباب (< 35 سنة)' : 'Quota Jeunesse (< 35 ans)'}
              </span>
              <p className="text-amber-800 leading-relaxed">
                {isAr 
                  ? 'تخصيص ثلث (1/3) القائمة للمترشحين الذين تقل أعمارهم عن 35 أو 40 سنة لدعم جيل الشباب.' 
                  : 'Au moins un tiers des candidats doivent être âgés de moins de 35 ans pour dynamiser la relève.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="font-bold text-blue-900 block text-sm mb-1">
                {isAr ? 'الكفاءات الجامعية' : 'Diplômés Universitaires'}
              </span>
              <p className="text-blue-800 leading-relaxed">
                {isAr 
                  ? 'ضرورة إدراج نسبة معتبرة من حملة الشهادات الجامعية العليا لقيادة المجالس باحترافية.' 
                  : 'Exigence de cadres et diplômés d\'État pour assurer une gestion rigoureuse des affaires locales.'}
              </p>
            </div>
          </div>

          {/* List of 11 Documents with Legal Points */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>{isAr ? 'شروط تدقيق الوثائق الـ 11 لتفادي الإقصاء:' : 'Vérification des 11 documents administratifs :'}</span>
            </h3>

            <div className="space-y-2">
              {ADMINISTRATIVE_DOCUMENTS.map((doc, i) => (
                <div key={doc.key} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{doc.nameFr} ({doc.nameAr})</span>
                      <span className="text-[10px] font-semibold text-slate-500">{doc.validityFr}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{doc.legalNoticeFr}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition-colors"
          >
            {isAr ? 'إغلاق' : 'Compris'}
          </button>
        </div>
      </div>
    </div>
  );
};
