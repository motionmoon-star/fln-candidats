import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Trash2, Sparkles, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { DocumentItem, Language, ExtractedDocumentData } from '../types';
import { scanDocumentWithAI } from '../utils/documentScanner';

interface DocumentScanModalProps {
  document: DocumentItem;
  candidateName: string;
  language?: Language;
  onClose: () => void;
  onDeleteScan?: () => void;
  onReScanAI?: () => void;
  onApplyExtractedData?: (extracted: ExtractedDocumentData) => void;
  isAnalyzing?: boolean;
}

export const DocumentScanModal: React.FC<DocumentScanModalProps> = ({
  document,
  candidateName,
  language = 'fr',
  onClose,
  onDeleteScan,
  onReScanAI,
  onApplyExtractedData,
  isAnalyzing = false,
}) => {
  const isAr = language === 'ar';
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [internalAnalyzing, setInternalAnalyzing] = useState(false);

  const effectiveAnalyzing = isAnalyzing || internalAnalyzing;

  const handleRunAiOcr = async () => {
    if (onReScanAI) {
      onReScanAI();
      return;
    }
    if (!document.fileDataUrl) return;
    setInternalAnalyzing(true);
    try {
      const result = await scanDocumentWithAI(document.fileDataUrl);
      if (onApplyExtractedData) {
        onApplyExtractedData(result);
      }
    } catch (err) {
      console.error("AI OCR error:", err);
    } finally {
      setInternalAnalyzing(false);
    }
  };

  const handleDownload = () => {
    if (!document.fileDataUrl) return;
    const link = window.document.createElement('a');
    link.href = document.fileDataUrl;
    link.download = `${document.key}_${candidateName.replace(/\s+/g, '_')}.jpg`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isAr ? document.nameAr : document.nameFr}
              </h3>
              <p className="text-xs text-slate-300">
                {candidateName} {document.referenceNumber && `— Réf: ${document.referenceNumber}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunAiOcr}
              disabled={effectiveAnalyzing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              title="Analyser et extraire les informations par IA"
            >
              <Sparkles className={`w-3.5 h-3.5 ${effectiveAnalyzing ? 'animate-spin' : ''}`} />
              <span>{effectiveAnalyzing ? (isAr ? 'جاري التحليل...' : 'Analyse en cours...') : (isAr ? 'استخراج البيانات بالذكاء الاصطناعي' : 'Extraction IA')}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title={isAr ? 'تحميل الصورة' : 'Télécharger le fichier'}
            >
              <Download className="w-4 h-4" />
            </button>

            {onDeleteScan && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذه الوثيقة الممسوحة ضوئياً؟' : 'Supprimer ce document scanné ?')) {
                    onDeleteScan();
                    onClose();
                  }
                }}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 transition-colors"
                title={isAr ? 'حذف الوثيقة' : 'Supprimer'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span className="font-semibold">
              {document.fileName || 'document_scan.jpg'}
            </span>
            {document.scannedAt && (
              <span className="text-slate-400">
                • {isAr ? 'تاريخ المسح:' : 'Numérisé le:'} {new Date(document.scannedAt).toLocaleDateString()}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              document.status === 'conforme' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {document.status === 'conforme' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {document.status === 'conforme' ? (isAr ? 'مطابق' : 'Conforme') : (isAr ? 'قيد المراجعة' : 'En attente')}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
              title="Zoom arrière"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(z => Math.min(3, z + 0.25))}
              className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
              title="Zoom avant"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="p-1.5 rounded hover:bg-slate-200 text-slate-700 ml-1"
              title="Pivoter de 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setRotation(0);
              }}
              className="text-[11px] px-2 py-1 rounded hover:bg-slate-200 text-slate-700 font-medium ml-1"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Image Display Canvas Area */}
        <div className="flex-1 bg-slate-900/95 overflow-auto p-4 flex items-center justify-center min-h-[360px] relative">
          {document.fileDataUrl ? (
            <img
              src={document.fileDataUrl}
              alt={document.nameFr}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.15s ease-out',
                maxHeight: '75vh',
              }}
              className="rounded shadow-xl object-contain origin-center select-none"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-slate-400 text-sm text-center">
              {isAr ? 'لا توجد صورة مسجلة لهذه الوثيقة' : 'Aucune photo enregistrée pour ce document.'}
            </div>
          )}

          {effectiveAnalyzing && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-2xs flex flex-col items-center justify-center text-white z-10">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-3" />
              <p className="text-sm font-bold text-emerald-400">
                {isAr ? 'جاري مسح واستخراج البيانات عبر الذكاء الاصطناعي...' : 'Analyse OCR & extraction intelligente en cours...'}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                {isAr ? 'قراءة النصوص والتواريخ والأرقام الرسمية' : 'Lecture des noms, dates et numéros officiels'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
