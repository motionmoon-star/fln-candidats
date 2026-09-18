import React, { useState } from 'react';
import { FileText, X, Check, Calendar, Hash, Building, BookmarkCheck } from 'lucide-react';
import { Language } from '../types';

interface DocumentTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (docKey: string, data: { referenceNumber?: string; issueDate?: string; notes?: string; authority?: string }) => void;
  docKey: string;
  titleFr: string;
  titleAr: string;
  initialReferenceNumber?: string;
  initialIssueDate?: string;
  initialNotes?: string;
  language: Language;
}

export const DocumentTextModal: React.FC<DocumentTextModalProps> = ({
  isOpen,
  onClose,
  onSave,
  docKey,
  titleFr,
  titleAr,
  initialReferenceNumber = '',
  initialIssueDate = new Date().toISOString().slice(0, 10),
  initialNotes = '',
  language,
}) => {
  const isAr = language === 'ar';

  const [referenceNumber, setReferenceNumber] = useState(initialReferenceNumber);
  const [issueDate, setIssueDate] = useState(initialIssueDate);
  const [authority, setAuthority] = useState('');
  const [notes, setNotes] = useState(initialNotes);

  if (!isOpen) return null;

  // Preset suggestions based on document type
  const getSuggestions = () => {
    if (docKey === 'police_record') {
      return [
        { labelFr: 'Tribunal de Bab El Oued - B3 Vierge', labelAr: 'محكمة باب الوادي - صحيفة سوابق لا سوابق بها' },
        { labelFr: 'Guichet Électronique Min. Justice (Code QR)', labelAr: 'مستخرجة إلكترونياً من موقع وزارة العدل' },
      ];
    }
    if (docKey === 'residence_certificate') {
      return [
        { labelFr: 'APC Bologhine - Quartier Notre Dame d\'Afrique', labelAr: 'بلدية بولوغين - حي السيدة الإفريقية' },
        { labelFr: 'APC Bologhine - Quartier Ibn Ziri / Zeghara', labelAr: 'بلدية بولوغين - حي ابن زيري / زغارة' },
      ];
    }
    if (docKey === 'birth_certificate') {
      return [
        { labelFr: 'Fiche familiale d\'état civil n°12 - APC Bologhine', labelAr: 'البطاقة العائلية للحالة المدنية عقد 12 - بلدية بولوغين' },
        { labelFr: 'Extrait de naissance n°12 original', labelAr: 'شهادة ميلاد أصلية رقم 12 مسجلة بسجلات الحالة المدنية' },
      ];
    }
    if (docKey === 'identity_card') {
      return [
        { labelFr: 'CNI biométrique délivrée par la Daïra de Bab El Oued', labelAr: 'بطاقة بيومترية صادرة عن دائرة باب الوادي' },
      ];
    }
    return [];
  };

  const suggestions = getSuggestions();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const combinedNotes = [
      authority ? `Organisme: ${authority}` : null,
      notes ? notes : null,
    ].filter(Boolean).join(' — ');

    onSave(docKey, {
      referenceNumber: referenceNumber.trim() || undefined,
      issueDate: issueDate || undefined,
      notes: combinedNotes || notes || (isAr ? 'تم تقييد بيانات الوثيقة يدوياً' : 'Document consigné par référence'),
      authority: authority.trim() || undefined,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isAr ? `تدوين بيانات الوثيقة: ${titleAr}` : `Saisie Textuelle : ${titleFr}`}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isAr ? 'تسجيل رقم المرجع والتواريخ والملاحظات الرسمية' : 'Enregistrer le numéro officiel, date et observations'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs">
          
          {/* Quick suggestions if available */}
          {suggestions.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600">
                {isAr ? 'نماذج وصيغ سريعة:' : 'Suggestions rapides :'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNotes(isAr ? s.labelAr : s.labelFr);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-200 text-[11px] transition-colors text-left"
                  >
                    + {isAr ? s.labelAr : s.labelFr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reference & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAr ? 'رقم المرجع / التسجيل الرسمي' : 'N° Réf / Enregistrement'}</span>
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                placeholder="Ex: REF-2026/089"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAr ? 'تاريخ الإصدار' : 'Date de délivrance'}</span>
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Issuing Authority */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'الجهة أو المصلحة المصدرة' : 'Organisme ou Service émetteur'}</span>
            </label>
            <input
              type="text"
              value={authority}
              onChange={e => setAuthority(e.target.value)}
              placeholder="Ex: Tribunal de Bab El Oued / APC de Bologhine / Recette des impôts"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Full Notes / Observations */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <BookmarkCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'نص الوثيقة أو الملاحظات الرسمية' : 'Texte / Remarques et constatations'}</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={isAr ? 'أدخل تفاصيل الوثيقة، رقم المحضر أو الوضعية...' : 'Détails du document, mentions particulières, confirmation de conformité...'}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700 leading-relaxed"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Annuler'}
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>{isAr ? 'حفظ وتأكيد المطابقة' : 'Enregistrer & Valider'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
