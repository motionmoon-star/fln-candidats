import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  UserPlus, 
  FileText, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  CreditCard, 
  RotateCw, 
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Candidate, Language, ExtractedDocumentData, CouncilType } from '../types';
import { processAndOptimizeImage, scanDocumentWithAI, isGeminiKeyMissing, isGeminiQuotaExceeded } from '../utils/documentScanner';

interface AiScannerAssistantModalProps {
  candidates: Candidate[];
  language: Language;
  currentCouncil: CouncilType;
  onClose: () => void;
  onSelectDataForNewCandidate: (data: ExtractedDocumentData, scannedDataUrl: string, fileName: string) => void;
  onUpdateExistingCandidate: (candidateId: string, data: ExtractedDocumentData, scannedDataUrl: string, fileName: string) => void;
}

export const AiScannerAssistantModal: React.FC<AiScannerAssistantModalProps> = ({
  candidates,
  language,
  currentCouncil,
  onClose,
  onSelectDataForNewCandidate,
  onUpdateExistingCandidate,
}) => {
  const isAr = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fault, setFault] = useState<'missing' | 'quota' | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedDocumentData | null>(null);
  const [selectedExistingId, setSelectedExistingId] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setFault(null);
    setIsProcessing(true);
    try {
      const { dataUrl, mimeType, fileName: name } = await processAndOptimizeImage(file);
      setPreviewUrl(dataUrl);
      setFileName(name);

      // Call AI Extraction
      const data = await scanDocumentWithAI(dataUrl, mimeType);
      setExtractedData(data);
    } catch (err: any) {
      console.error(err);
      if (isGeminiKeyMissing(err)) {
        setFault('missing');
        setErrorMsg(
          isAr
            ? 'الاستخراج الذكي غير مفعل بعد: مفتاح GEMINI_API_KEY غير مُهيأ على الخادم.'
            : 'L\'extraction intelligente n\'est pas encore activée : la clé GEMINI_API_KEY est absente du serveur.'
        );
      } else if (isGeminiQuotaExceeded(err)) {
        setFault('quota');
        setErrorMsg(
          isAr
            ? 'تم الوصول إلى الحد المجاني لاستخراج الوثائق بلغ الحد الأقصى (20 طلباً/يوم). أعد المحاولة غداً أو استعمل مفتاحاً آخر.'
            : 'Le quota gratuit d\'extraction Gemini est dépassé (20 requêtes/jour). Réessayez demain ou utilisez une autre clé.'
        );
      } else {
        setErrorMsg(err.message || (isAr ? 'تعذر استخراج البيانات من الوثيقة' : "Erreur lors de l'analyse OCR."));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Demo sample loader so users can test immediately
  const handleLoadSample = async (type: 'cni' | 'diplome' | 'naissance') => {
    setIsProcessing(true);
    setErrorMsg(null);
    setFault(null);

    // Generate high quality SVG data URL representing Algerian official document specimen
    let title = 'RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE';
    let docType = 'CARTE NATIONALE D\'IDENTITÉ BIOMÉTRIQUE';
    let sampleData: ExtractedDocumentData = {};

    if (type === 'cni') {
      docType = 'CARTE NATIONALE D\'IDENTITÉ BIOMÉTRIQUE';
      sampleData = {
        documentTypeDetected: 'Carte Nationale d\'Identité Biométrique (CNI)',
        lastNameFr: 'MADOUNI',
        firstNameFr: 'Amine',
        lastNameAr: 'مدوني',
        firstNameAr: 'أمين',
        gender: 'H',
        birthDate: '1993-06-18',
        birthPlace: 'Bologhine (Alger)',
        nationalIdNumber: '109316020084512903',
        addressNeighborhood: 'Notre Dame d\'Afrique, Bologhine',
        profession: 'Architecte d\'État',
        educationLevel: 'Master / Ingénieur',
        isUniversityGraduate: true,
        referenceNumber: 'CNI-16-049821',
        issueDate: '2023-01-15',
        expiryDate: '2033-01-14',
        confidenceNotes: 'Document biométrique conforme ANIE. Texte bilingue parfaitement lisible.',
      };
    } else if (type === 'diplome') {
      docType = 'DIPLÔME DE MASTER EN SCIENCES ÉCONOMIQUES';
      sampleData = {
        documentTypeDetected: 'Diplôme Universitaire (Master)',
        lastNameFr: 'BOUZID',
        firstNameFr: 'Nadia',
        lastNameAr: 'بوزيد',
        firstNameAr: 'نادية',
        gender: 'F',
        birthDate: '1995-11-24',
        birthPlace: 'Bab El Oued (Alger)',
        profession: 'Cadre Financier',
        educationLevel: 'Master / Ingénieur',
        isUniversityGraduate: true,
        referenceNumber: 'UNIV-ALGER3-2020-0492',
        issueDate: '2020-07-10',
        confidenceNotes: 'Diplôme d\'études supérieures légalisé avec mention Bien.',
      };
    } else {
      docType = 'EXTRAIT DES ACTES DE NAISSANCE (12-Kh)';
      sampleData = {
        documentTypeDetected: 'Acte de naissance (12-kh)',
        lastNameFr: 'CHERIF',
        firstNameFr: 'Karim',
        lastNameAr: 'شريف',
        firstNameAr: 'كريم',
        gender: 'H',
        birthDate: '1989-03-05',
        birthPlace: 'Bologhine, Alger',
        referenceNumber: 'ACTE-12KH-00841',
        issueDate: '2026-02-12',
        confidenceNotes: 'Extrait d\'acte de naissance récent émis par l\'APC de Bologhine.',
      };
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <rect width="800" height="500" fill="#f8fafc" stroke="#059669" stroke-width="8" rx="16"/>
      <rect x="20" y="20" width="760" height="70" fill="#065f46" rx="8"/>
      <text x="400" y="45" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
      <text x="400" y="70" font-family="sans-serif" font-size="16" font-weight="extrabold" fill="#fbbf24" text-anchor="middle">${docType}</text>
      
      <!-- Photo box -->
      <rect x="50" y="120" width="130" height="160" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" rx="6"/>
      <circle cx="115" cy="170" r="30" fill="#065f46"/>
      <path d="M75 250 C 75 220, 155 220, 155 250" fill="#065f46"/>
      <text x="115" y="295" font-family="sans-serif" font-size="11" fill="#64748b" text-anchor="middle">PHOTO DU TITULAIRE</text>
      
      <!-- Text details -->
      <text x="210" y="145" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Nom / اللقب :</text>
      <text x="320" y="145" font-family="sans-serif" font-size="15" font-weight="extrabold" fill="#065f46">${sampleData.lastNameFr} / ${sampleData.lastNameAr || ''}</text>
      
      <text x="210" y="180" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Prénom / الاسم :</text>
      <text x="320" y="180" font-family="sans-serif" font-size="15" font-weight="extrabold" fill="#065f46">${sampleData.firstNameFr} / ${sampleData.firstNameAr || ''}</text>
      
      <text x="210" y="215" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Date de Naiss. :</text>
      <text x="320" y="215" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">${sampleData.birthDate}</text>
      
      <text x="210" y="250" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">Lieu de Naiss. :</text>
      <text x="320" y="250" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">${sampleData.birthPlace}</text>
      
      ${sampleData.nationalIdNumber ? `
      <text x="210" y="285" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a">NIN (18 chiffres) :</text>
      <text x="340" y="285" font-family="monospace" font-size="15" font-weight="extrabold" fill="#b45309">${sampleData.nationalIdNumber}</text>
      ` : ''}

      <!-- Bottom bar -->
      <line x1="40" y1="330" x2="760" y2="330" stroke="#cbd5e1" stroke-width="2"/>
      <text x="50" y="360" font-family="sans-serif" font-size="12" font-weight="bold" fill="#475569">Profession : ${sampleData.profession || 'N/A'}</text>
      <text x="50" y="385" font-family="sans-serif" font-size="12" font-weight="bold" fill="#475569">N° de Réf. : ${sampleData.referenceNumber || 'N/A'}</text>
      <text x="50" y="410" font-family="sans-serif" font-size="12" font-weight="bold" fill="#475569">Délivré le : ${sampleData.issueDate || 'N/A'}</text>
      
      <!-- Stamp -->
      <circle cx="700" cy="400" r="45" fill="none" stroke="#dc2626" stroke-width="3" stroke-dasharray="4,2"/>
      <text x="700" y="395" font-family="sans-serif" font-size="10" font-weight="bold" fill="#dc2626" text-anchor="middle">WILAYA D'ALGER</text>
      <text x="700" y="410" font-family="sans-serif" font-size="9" font-weight="bold" fill="#dc2626" text-anchor="middle">APC BOLOGHINE</text>
    </svg>`;

    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    setPreviewUrl(dataUrl);
    setFileName(`specimen_${type}.svg`);

    // Simulate short scanning delay for smooth UX
    setTimeout(() => {
      setExtractedData(sampleData);
      setIsProcessing(false);
    }, 600);
  };

  const handleApplyToNew = () => {
    if (!extractedData || !previewUrl) return;
    onSelectDataForNewCandidate(extractedData, previewUrl, fileName);
    onClose();
  };

  const handleApplyToExisting = () => {
    if (!selectedExistingId || !extractedData || !previewUrl) return;
    onUpdateExistingCandidate(selectedExistingId, extractedData, previewUrl, fileName);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {isAr ? 'المسح الضوئي والذكاء الاصطناعي لإدخال ملفات المترشحين' : 'Scanner & Saisie Automatique de Données (OCR IA)'}
                </h2>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAr 
                  ? 'التقاط صور بالهاتف أو مسح الوثائق الرسمية (بطاقة التعريف، شهادة الميلاد، الدبلوم) واستخراج البيانات تلقائياً' 
                  : 'Photographiez ou scannez les documents officiels pour alimenter la base de données sans saisie manuelle.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action Bar: Photograph / Upload / Demo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Camera Button */}
            <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-emerald-500/50 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-600 transition-all cursor-pointer group">
              <div className="w-11 h-11 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform mb-2">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-emerald-950 text-center">
                {isAr ? 'التقاط صورة بكاميرا الهاتف / الجهاز' : 'Prendre une photo (Appareil Photo / Smartphone)'}
              </span>
              <span className="text-[10px] text-emerald-700 text-center mt-0.5">
                {isAr ? 'مباشرة عبر كاميرا الهاتف' : 'Capture instantanée CNI / Pièce'}
              </span>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Upload File Button */}
            <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer group">
              <div className="w-11 h-11 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 text-center">
                {isAr ? 'رفع ملف ممسوح ضوئياً (Scan / Image)' : 'Importer un document scanné (JPG / PNG / PDF)'}
              </span>
              <span className="text-[10px] text-slate-500 text-center mt-0.5">
                {isAr ? 'اختيار ملف من الحاسوب أو الهاتف' : 'Fichiers numérisés haute résolution'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Quick Demo Samples */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold mb-1">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>{isAr ? 'نماذج وثائق جاهزة للتجربة السريعة:' : 'Spécimens officiels pour tester :'}</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-snug">
                  {isAr 
                    ? 'جرب استخراج البيانات فوراً بنموذج بطاقة التعريف أو الشهادة الجامعية.' 
                    : 'Testez instantanément l\'extraction OCR sans document sous la main.'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleLoadSample('cni')}
                  className="px-2 py-1 rounded text-[11px] font-bold bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-50 transition-colors shadow-2xs"
                >
                  💳 CNI Biométrique
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('diplome')}
                  className="px-2 py-1 rounded text-[11px] font-bold bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  🎓 Diplôme Univ.
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('naissance')}
                  className="px-2 py-1 rounded text-[11px] font-bold bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  📄 Acte 12-kh
                </button>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            fault === 'missing' ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300">
                <div className="flex items-center gap-2.5 text-amber-900 font-bold text-sm">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <div className="mt-2 pl-7 text-[11px] leading-relaxed text-amber-800 space-y-1">
                  {isAr ? (
                    <>
                      <p>🔑 احصل على مفتاح مجاني: <span dir="ltr" className="font-mono">https://aistudio.google.com/apikey</span></p>
                      <p>📝 أنشئ ملف <span dir="ltr" className="font-mono">.env</span> بجوار <span dir="ltr" className="font-mono">package.json</span> وأضف فيه السطر:</p>
                      <p dir="ltr" className="font-mono bg-white rounded px-2 py-1 border border-amber-300">GEMINI_API_KEY=YOUR_KEY_Ici</p>
                      <p>🔄 أعد تشغيل الخادم: <span dir="ltr" className="font-mono">npm run dev</span> ثم أعد المحاولة.</p>
                      <p className="pt-1 text-amber-700">💡 يمكنك تجربة المسح فوراً بالأزرار «نماذج وثائق جاهزة» أعلاه بدون مفتاح.</p>
                    </>
                  ) : (
                    <>
                      <p>🔑 Obtenez une clé gratuite : <span dir="ltr" className="font-mono">https://aistudio.google.com/apikey</span></p>
                      <p>📝 Créez un fichier <span dir="ltr" className="font-mono">.env</span> à côté de <span dir="ltr" className="font-mono">package.json</span> et ajoutez-y la ligne :</p>
                      <p dir="ltr" className="font-mono bg-white rounded px-2 py-1 border border-amber-300">GEMINI_API_KEY=YOUR_CLE_Ici</p>
                      <p>🔄 Redémarrez le serveur : <span dir="ltr" className="font-mono">npm run dev</span> puis réessayez.</p>
                      <p className="pt-1 text-amber-700">💡 Testez instantanément via les « Spécimens officiels » ci-dessus, sans clé.</p>
                    </>
                  )}
                </div>
              </div>
            ) : fault === 'quota' ? (
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-300">
                <div className="flex items-center gap-2.5 text-orange-900 font-bold text-sm">
                  <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <div className="mt-2 pl-7 text-[11px] leading-relaxed text-orange-800 space-y-1">
                  {isAr ? (
                    <>
                      <p>⏳ خدمة Gemini مشبعة مؤقتاً أو بلغت حدّها المجاني (20 طلباً/يوم).</p>
                      <p>💡 أعد المحاولة بعد بضع دقائق (أو غداً إذا كان الحد قد بلغ)، أو استعمل مفتاح Google AI آخر في <span dir="ltr" className="font-mono">.env</span>.</p>
                      <p>🌐 أو فعّل الفوترة في لوحة تحكم Google AI Studio لرفع الحدود.</p>
                    </>
                  ) : (
                    <>
                      <p>⏳ Le service Gemini est momentanément saturé ou a atteint le quota gratuit (20/jour).</p>
                      <p>💡 Réessayez dans quelques minutes (ou demain si le quota est atteint), ou changez de clé Google AI dans <span dir="ltr" className="font-mono">.env</span>.</p>
                      <p>🌐 Ou activez la facturation dans la console Google AI Studio pour lever les limites.</p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )
          )}

          {/* Main Inspection Area: Side-by-Side View */}
          {(previewUrl || isProcessing) && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
              {/* Document Image Preview Column */}
              <div className="lg:col-span-5 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{isAr ? 'الوثيقة المصورة / الممسوحة ضوئياً' : 'Document Photographié / Scanné'}</span>
                  </span>
                  {fileName && (
                    <span className="text-[11px] text-slate-500 font-mono truncate max-w-[180px]">
                      {fileName}
                    </span>
                  )}
                </div>

                <div className="border border-slate-300 rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center p-3 relative min-h-[300px] max-h-[460px]">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Aperçu document"
                      className="max-h-[440px] max-w-full rounded object-contain shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {isProcessing && (
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-2xs flex flex-col items-center justify-center text-white p-4">
                      <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-xs font-bold text-emerald-400 text-center">
                        {isAr ? 'جاري تحليل الوثيقة واستخراج البيانات بدقة...' : 'Analyse OCR & reconnaissance des caractères...'}
                      </p>
                      <p className="text-[10px] text-slate-300 text-center mt-1">
                        Lecture du NIN, nom, prénom, date et lieu de naissance
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Extracted Data Display Column */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isAr ? 'البيانات المستخرجة آلياً' : 'Données Extraites par le Scanner IA'}</span>
                    </span>
                    {extractedData?.documentTypeDetected && (
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {extractedData.documentTypeDetected}
                      </span>
                    )}
                  </div>

                  {extractedData ? (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                      {/* Name in FR and AR */}
                      <div className="grid grid-cols-2 gap-3 p-2.5 bg-white rounded-lg border border-slate-200">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Nom & Prénom (Français)
                          </span>
                          <span className="text-sm font-extrabold text-slate-900">
                            {extractedData.lastNameFr || '—'} {extractedData.firstNameFr || ''}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase font-arabic">
                            الاسم واللقب (بالعربية)
                          </span>
                          <span className="text-sm font-extrabold text-emerald-900 font-arabic">
                            {extractedData.lastNameAr || '—'} {extractedData.firstNameAr || ''}
                          </span>
                        </div>
                      </div>

                      {/* Civil Status Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 block">
                            Date de Naissance
                          </span>
                          <span className="font-bold text-slate-800">
                            {extractedData.birthDate || '—'}
                          </span>
                        </div>

                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 block">
                            Lieu de Naissance
                          </span>
                          <span className="font-bold text-slate-800">
                            {extractedData.birthPlace || '—'}
                          </span>
                        </div>

                        <div className="p-2 bg-white rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 block">
                            Genre
                          </span>
                          <span className="font-bold text-slate-800">
                            {extractedData.gender === 'H' ? 'Homme (ذكر)' : extractedData.gender === 'F' ? 'Femme (أنثى)' : '—'}
                          </span>
                        </div>
                      </div>

                      {/* NIN and Document Reference */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {extractedData.nationalIdNumber && (
                          <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-200">
                            <span className="text-[10px] font-bold text-amber-900 block flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              <span>NIN / N° Identification National</span>
                            </span>
                            <span className="font-mono text-xs font-extrabold text-amber-950">
                              {extractedData.nationalIdNumber}
                            </span>
                          </div>
                        )}

                        {extractedData.referenceNumber && (
                          <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-500 block">
                              Numéro de Référence / Registre
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-800">
                              {extractedData.referenceNumber}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Profession & Education */}
                      {(extractedData.profession || extractedData.educationLevel) && (
                        <div className="grid grid-cols-2 gap-2.5 p-2 bg-white rounded-lg border border-slate-200">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              <span>Profession</span>
                            </span>
                            <span className="font-bold text-slate-800">
                              {extractedData.profession || 'Non spécifiée'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              <span>Niveau d'études</span>
                            </span>
                            <span className="font-bold text-emerald-900">
                              {extractedData.educationLevel || (extractedData.isUniversityGraduate ? 'Universitaire' : '—')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Notes / Reliability */}
                      {extractedData.confidenceNotes && (
                        <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 italic">
                          ℹ️ {extractedData.confidenceNotes}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
                      <p className="text-xs">
                        {isProcessing 
                          ? 'Traitement de l\'image en cours...' 
                          : 'Photographiez ou chargez un document pour afficher les données extraites ici.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Insertion Controls */}
                {extractedData && (
                  <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      {isAr ? 'الخيارات المتاحة لإدخال البيانات في النظام:' : 'Action d\'intégration des données dans la base :'}
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Option 1: Create New Candidate */}
                      <button
                        type="button"
                        onClick={handleApplyToNew}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>{isAr ? 'إنشاء مترشح جديد بهذه البيانات' : 'Créer un nouveau candidat avec ce scan'}</span>
                      </button>

                      {/* Option 2: Update existing candidate */}
                      <div className="flex items-center gap-1.5">
                        <select
                          value={selectedExistingId}
                          onChange={e => setSelectedExistingId(e.target.value)}
                          className="flex-1 px-2.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-emerald-600 outline-none"
                        >
                          <option value="">{isAr ? 'اختر مترشحاً لربط الوثيقة به...' : 'Associer à un candidat existant...'}</option>
                          {candidates.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.listRank ? `[N°${c.listRank}] ` : ''}{c.lastNameFr} {c.firstNameFr} ({c.council})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!selectedExistingId}
                          onClick={handleApplyToExisting}
                          className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
                        >
                          {isAr ? 'ربط' : 'Lier'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Kasma de Bologhine — Commission des candidatures APC/APW (Dossier Réglementaire ANIE)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
          >
            {isAr ? 'إغلاق' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};
