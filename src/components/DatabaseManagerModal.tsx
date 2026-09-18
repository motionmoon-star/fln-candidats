import React, { useState, useRef } from 'react';
import {
  Database,
  Upload,
  Download,
  Github,
  FileSpreadsheet,
  FileCode,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  X,
  Layers,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Trash2,
  Search,
  UserCheck
} from 'lucide-react';
import { Candidate, Language } from '../types';
import {
  parseCandidatesJson,
  parseCandidatesCsv,
  getCsvDatabaseTemplate,
  getJsonDatabaseTemplate,
  generateInitialCandidatesTsCode
} from '../utils/databaseUtils';

interface DatabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  candidates: Candidate[];
  onImportCandidates: (newCandidates: Candidate[], mode: 'replace' | 'merge') => void;
  showToast: (message: string) => void;
  onDeleteCandidate?: (id: string) => void;
  onDeleteAllExceptHasbaloui?: () => void;
}

export const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
  isOpen,
  onClose,
  language,
  candidates,
  onImportCandidates,
  showToast,
  onDeleteCandidate,
  onDeleteAllExceptHasbaloui,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'github' | 'admin_clean'>('import');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [parsedPreview, setParsedPreview] = useState<Candidate[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isAr = language === 'ar';

  // Process text or file content
  const handleProcessFileContent = (content: string, name: string) => {
    setFileName(name);
    setParseError(null);
    setParsedPreview(null);

    const isJson = name.endsWith('.json') || content.trim().startsWith('{') || content.trim().startsWith('[');

    if (isJson) {
      const res = parseCandidatesJson(content);
      if (res.success && res.candidates) {
        setParsedPreview(res.candidates);
      } else {
        setParseError(res.error || 'Erreur lors de l\'analyse du fichier JSON.');
      }
    } else {
      const res = parseCandidatesCsv(content);
      if (res.success && res.candidates) {
        setParsedPreview(res.candidates);
      } else {
        setParseError(res.error || 'Erreur lors de l\'analyse du fichier CSV.');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleProcessFileContent(text, file.name);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleProcessFileContent(text, file.name);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmImport = () => {
    if (!parsedPreview || parsedPreview.length === 0) return;
    onImportCandidates(parsedPreview, importMode);
    showToast(
      isAr
        ? `تم استيراد ${parsedPreview.length} مترشح بنجاح في قاعدة البيانات`
        : `${parsedPreview.length} candidat(s) importé(s) avec succès dans la base`
    );
    setParsedPreview(null);
    setFileName(null);
    onClose();
  };

  // Download utilities
  const downloadFile = (content: string, fileName: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJsonDb = () => {
    const json = JSON.stringify(candidates, null, 2);
    downloadFile(json, `fln_bologhine_database_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    showToast(isAr ? 'تم تحميل ملف قاعدة البيانات JSON' : 'Base de données JSON téléchargée');
  };

  const handleDownloadInitialCandidatesTs = () => {
    const code = generateInitialCandidatesTsCode(candidates);
    downloadFile(code, 'initialCandidates.ts', 'text/typescript');
    showToast(isAr ? 'تم تحميل ملف initialCandidates.ts الخاص بـ GitHub' : 'Fichier initialCandidates.ts pour GitHub téléchargé');
  };

  const handleDownloadCsvTemplate = () => {
    const csv = getCsvDatabaseTemplate();
    downloadFile(csv, 'modele_import_candidats_fln.csv', 'text/csv;charset=utf-8;');
    showToast(isAr ? 'تم تحميل نموذج CSV الجاهز للتعبئة' : 'Modèle CSV prêt à remplir téléchargé');
  };

  const handleDownloadJsonTemplate = () => {
    const json = getJsonDatabaseTemplate();
    downloadFile(json, 'modele_import_candidats_fln.json', 'application/json');
    showToast(isAr ? 'تم تحميل نموذج JSON الجاهز للتعبئة' : 'Modèle JSON prêt à remplir téléchargé');
  };

  const handleCopyTsCode = () => {
    const code = generateInitialCandidatesTsCode(candidates);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
    showToast(isAr ? 'تم نسخ كود TypeScript إلى الحافظة' : 'Code TypeScript copié dans le presse-papier');
  };

  const gitCliCommands = `# Commandes pour pousser votre projet et vos données sur GitHub :
git init
git add .
git commit -m "Mise a jour de la liste des candidats FLN Bologhine"
git branch -M main
# Remplacez l'URL par l'adresse de votre nouveau dépôt GitHub :
git remote add origin https://github.com/votre-nom/fln-bologhine-elections.git
git push -u origin main`;

  const handleCopyGitCommands = () => {
    navigator.clipboard.writeText(gitCliCommands);
    setCopiedGitCmd(true);
    setTimeout(() => setCopiedGitCmd(false), 2500);
    showToast(isAr ? 'تم نسخ أوامر Git' : 'Commandes Git copiées');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700/80 border border-emerald-500/80 flex items-center justify-center shadow-md">
              <Database className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white font-arabic">
                  {isAr ? 'إدارة قاعدة بيانات المترشحين والمزامنة مع GitHub' : 'Gestion de la Base de Données & Export GitHub'}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono bg-emerald-900 px-2 py-0.5 rounded text-emerald-300 border border-emerald-700">
                  <Github className="w-3 h-3 text-white" />
                  <span>GitHub Ready</span>
                </span>
              </div>
              <p className="text-xs text-emerald-300/90 font-arabic">
                {isAr
                  ? 'استيراد القائمة من ملف قاعدة بيانات (JSON / CSV) أو تصديرها ورفعها إلى مستودع GitHub'
                  : 'Remplissez ou importez votre base de données (JSON / CSV) et synchronisez avec GitHub'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 sm:px-6 pt-2 shrink-0 gap-1 sm:gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`pb-3 pt-2 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'import'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{isAr ? '1. استيراد وتعبئة القائمة' : '1. Importer & Remplir la Base'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`pb-3 pt-2 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{isAr ? '2. تصدير وحفظ النسخة' : '2. Exporter & Sauvegarder'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`pb-3 pt-2 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'github'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Github className="w-4 h-4 text-slate-900" />
            <span className="text-slate-900 font-black">{isAr ? '3. الرفع إلى GitHub' : '3. Uploader vers GitHub'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin_clean')}
            className={`pb-3 pt-2 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'admin_clean'
                ? 'border-rose-600 text-rose-800 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-rose-600 hover:text-rose-800'
            }`}
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span className="font-bold">{isAr ? '4. إدارة وحذف المترشحين' : '4. Supprimer / Nettoyer (Admin)'}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* TAB 1: IMPORTER / REMPLIR LA LISTE */}
          {activeTab === 'import' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Instructions and templates banner */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5 font-arabic">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span>{isAr ? 'تعبئة القائمة بملف قاعدة بيانات جاهز' : 'Remplir automatiquement avec une base de données'}</span>
                  </h4>
                  <p className="text-xs text-emerald-800 font-arabic">
                    {isAr
                      ? 'يمكنك سحب وإفلات ملف JSON أو جدول CSV من Excel. يتعرف النظام تلقائياً على كل الحقول بالعربية والفرنسية.'
                      : 'Glissez un fichier JSON ou CSV (Excel). Le système mappe automatiquement tous les champs en français ou en arabe.'}
                  </p>
                </div>

                {/* Templates download buttons */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs transition-colors cursor-pointer"
                    title="Télécharger le fichier modèle CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{isAr ? 'نموذج Excel CSV' : 'Modèle CSV Excel'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadJsonTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs transition-colors cursor-pointer"
                    title="Télécharger le fichier modèle JSON"
                  >
                    <FileCode className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{isAr ? 'نموذج JSON' : 'Modèle JSON'}</span>
                  </button>
                </div>
              </div>

              {/* Mode Selection: Replace or Merge */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-700 font-arabic">
                  {isAr ? 'طريقة معالجة البيانات المستوردة:' : 'Mode d\'importation des données :'}
                </span>

                <div className="flex items-center gap-2">
                  <label
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                      importMode === 'replace'
                        ? 'bg-amber-100/90 border-amber-400 text-amber-950 shadow-2xs'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>{isAr ? 'استبدال كل القائمة الحالية (تفريغ وملء)' : 'Remplacer toute la liste actuelle'}</span>
                  </label>

                  <label
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                      importMode === 'merge'
                        ? 'bg-emerald-100/90 border-emerald-400 text-emerald-950 shadow-2xs'
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{isAr ? 'دمج وإضافة دون حذف الموجودين' : 'Fusionner & Ajouter'}</span>
                  </label>
                </div>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                  dragOver
                    ? 'border-emerald-500 bg-emerald-50 scale-[0.99]'
                    : 'border-slate-300 hover:border-emerald-400 bg-white hover:bg-slate-50/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,text/csv,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 shadow-xs">
                  <Upload className="w-7 h-7 text-emerald-700" />
                </div>

                <h5 className="font-bold text-slate-900 text-sm sm:text-base font-arabic">
                  {isAr ? 'انقر لاختيار ملف قاعدة البيانات أو اسحبه هنا' : 'Cliquez pour sélectionner le fichier ou glissez-le ici'}
                </h5>
                <p className="text-xs text-slate-500 mt-1 font-arabic">
                  {isAr
                    ? 'يدعم ملفات JSON (.json) أو جداول إكسل (.csv)'
                    : 'Prend en charge les formats JSON (.json) et tableaux CSV (.csv)'}
                </p>

                {fileName && (
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-xs font-bold border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{fileName}</span>
                  </div>
                )}
              </div>

              {/* Parsing Error Message */}
              {parseError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">{isAr ? 'خطأ في قراءة الملف :' : 'Erreur de lecture du fichier :'}</span>
                    <span>{parseError}</span>
                  </div>
                </div>
              )}

              {/* Preview of Parsed Candidates */}
              {parsedPreview && parsedPreview.length > 0 && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h5 className="font-black text-slate-900 text-sm font-arabic">
                        {isAr
                          ? `معاينة البيانات المستخرجة (${parsedPreview.length} مترشح)`
                          : `Aperçu des données extraites (${parsedPreview.length} candidats)`}
                      </h5>
                      <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5 flex-wrap">
                        <span className="font-semibold text-emerald-800">
                          APC : {parsedPreview.filter(c => c.council === 'APC').length}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-indigo-800">
                          APW : {parsedPreview.filter(c => c.council === 'APW').length}
                        </span>
                        <span>•</span>
                        <span>
                          {isAr ? 'نساء :' : 'Femmes :'} {parsedPreview.filter(c => c.gender === 'F').length}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {importMode === 'replace'
                          ? (isAr ? 'تأكيد واستبدال القائمة بالكامل' : 'Confirmer & Remplacer la liste')
                          : (isAr ? 'تأكيد والدمج مع القائمة الحالية' : 'Confirmer & Fusionner')}
                      </span>
                    </button>
                  </div>

                  {/* Sample table preview (first 5 candidates) */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs max-h-48 overflow-y-auto text-xs">
                    <table className="w-full text-start">
                      <thead className="bg-slate-100 text-slate-700 text-[11px] font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-2">N°</th>
                          <th className="p-2">{isAr ? 'المجلس' : 'Conseil'}</th>
                          <th className="p-2">{isAr ? 'الاسم واللقب' : 'Nom & Prénom'}</th>
                          <th className="p-2">NIN</th>
                          <th className="p-2">{isAr ? 'المهنة' : 'Profession'}</th>
                          <th className="p-2">{isAr ? 'الهاتف' : 'Téléphone'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedPreview.slice(0, 10).map((c, i) => (
                          <tr key={c.id || i} className="hover:bg-slate-50/70">
                            <td className="p-2 font-mono font-bold text-slate-700">
                              {c.listRank ? String(c.listRank).padStart(2, '0') : '--'}
                            </td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                c.council === 'APC' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                              }`}>
                                {c.council}
                              </span>
                            </td>
                            <td className="p-2 font-semibold text-slate-900 font-arabic">
                              {c.lastNameAr} {c.firstNameAr} <span className="text-slate-400 font-normal">({c.lastNameFr} {c.firstNameFr})</span>
                            </td>
                            <td className="p-2 font-mono text-[11px] text-slate-600">{c.nationalIdNumber || '—'}</td>
                            <td className="p-2 text-slate-600 truncate max-w-[150px]">{c.profession || '—'}</td>
                            <td className="p-2 text-slate-600 font-mono text-[11px]">{c.phoneNumber || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedPreview.length > 10 && (
                    <p className="text-[11px] text-slate-500 text-center italic">
                      {isAr
                        ? `... والمزيد (${parsedPreview.length - 10} مترشح آخر سيتم حفظهم في قاعدة البيانات)`
                        : `... et ${parsedPreview.length - 10} autre(s) candidat(s) qui seront également enregistrés.`}
                    </p>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: EXPORTER & SAUVEGARDER */}
          {activeTab === 'export' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm font-arabic">
                    {isAr ? 'حالة قاعدة البيانات الحالية' : 'État de la base de données actuelle'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {isAr
                      ? `تحتوي القاعدة على ${candidates.length} مترشح (${candidates.filter(c => c.council === 'APC').length} بلدي APC، ${candidates.filter(c => c.council === 'APW').length} ولائي APW).`
                      : `La base contient ${candidates.length} candidat(s) enregistrés (${candidates.filter(c => c.council === 'APC').length} APC, ${candidates.filter(c => c.council === 'APW').length} APW).`}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                  {candidates.length}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Export JSON */}
                <div className="p-4 bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl shadow-2xs transition-all space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm font-arabic">
                      {isAr ? 'تصدير كملف JSON كامل' : 'Exporter la Base Complète (JSON)'}
                    </h5>
                    <p className="text-xs text-slate-500 mt-1 font-arabic">
                      {isAr
                        ? 'نسخة احتياطية مطابقة مع كافة البيانات والوثائق لتخزينها أو نقلها لأي حاسوب آخر.'
                        : 'Sauvegarde complète avec toutes les métadonnées, documents et statuts pour transfert ou archivage.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadJsonDb}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isAr ? 'تحميل ملف JSON الكامل' : 'Télécharger la Base JSON'}</span>
                  </button>
                </div>

                {/* Export CSV */}
                <div className="p-4 bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl shadow-2xs transition-all space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm font-arabic">
                      {isAr ? 'تصدير كجدول Excel / CSV' : 'Exporter au Format Excel / CSV'}
                    </h5>
                    <p className="text-xs text-slate-500 mt-1 font-arabic">
                      {isAr
                        ? 'جدول تفصيلي متوافق مع برامج مايكروسوفت إكسل وجداول بيانات غوغل للطباعة والإحصاء.'
                        : 'Fichier tabulaire avec encodage UTF-8 (support de l\'arabe) prêt pour Microsoft Excel ou Google Sheets.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadCsvTemplate}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isAr ? 'تحميل جدول CSV Excel' : 'Télécharger le Tableau CSV'}</span>
                  </button>
                </div>
              </div>

              {/* TypeScript code generation */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-xs sm:text-sm font-mono text-emerald-300">
                      src/data/initialCandidates.ts
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyTsCode}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? (isAr ? 'تم النسخ' : 'Copié !') : (isAr ? 'نسخ الكود' : 'Copier')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadInitialCandidatesTs}
                      className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تحميل الملف' : 'Télécharger .ts'}</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-arabic">
                  {isAr
                    ? 'هذا الملف يمثل الكود المصدري البرمجي للبيانات الافتراضية. يمكنك استبداله مباشرة في مشروعك ليظهر عند رفع الكود إلى GitHub.'
                    : 'Ce fichier TypeScript intègre vos données directement dans le code source pour qu\'elles soient immédiatement actives dès le clone du dépôt GitHub.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: GITHUB & UPLOAD */}
          {activeTab === 'github' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Main Step-by-Step AI Studio Upload */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl border border-slate-700 shadow-lg space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                    <Github className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-base sm:text-lg text-white font-arabic">
                      {isAr ? 'طريقة رفع المشروع وقاعدة البيانات إلى GitHub' : 'Comment Uploader votre Projet et Base de Données sur GitHub'}
                    </h4>
                    <p className="text-xs text-slate-300 font-arabic">
                      {isAr
                        ? 'Google AI Studio يوفر تصديراً ومزامنة مباشرة وسريعة مع حسابك على GitHub.'
                        : 'Google AI Studio permet d\'exporter et synchroniser directement votre application vers GitHub.'}
                    </p>
                  </div>
                </div>

                {/* Direct AI Studio Step */}
                <div className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs sm:text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>{isAr ? 'الخيار الأسهل والأسرع (مباشرة من المتصفح) :' : 'Méthode 1 : Export Direct depuis AI Studio (Recommandé)'}</span>
                  </div>

                  <ol className="space-y-2 text-xs text-slate-200 font-arabic list-decimal list-inside">
                    <li className="leading-relaxed">
                      {isAr ? (
                        <>في أعلى شاشة Google AI Studio (في الزاوية العليا)، انقر على <strong>أيقونة القائمة / الإعدادات (Settings / Share)</strong>.</>
                      ) : (
                        <>Dans la barre supérieure de Google AI Studio, cliquez sur le menu ou l'icône <strong>Paramètres (Settings / Share)</strong>.</>
                      )}
                    </li>
                    <li className="leading-relaxed">
                      {isAr ? (
                        <>اختر <strong>"Export to GitHub"</strong> (أو "Download ZIP" إذا أردت تنزيله على جهازك أولاً).</>
                      ) : (
                        <>Sélectionnez <strong>« Export to GitHub »</strong> (ou « Download ZIP » si vous souhaitez l'enregistrer sur votre ordinateur).</>
                      )}
                    </li>
                    <li className="leading-relaxed">
                      {isAr ? (
                        <>اربط حسابك على GitHub وقم بتسمية المستودع (مثال: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400 font-mono">fln-bologhine-elections-2026</code>) ثم اضغط <strong>Create / Push</strong>.</>
                      ) : (
                        <>Connectez votre compte GitHub, nommez votre dépôt (ex : <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400 font-mono">fln-bologhine-elections-2026</code>) et validez.</>
                      )}
                    </li>
                  </ol>
                </div>

                {/* Permanent Data in GitHub button */}
                <div className="p-4 bg-emerald-950/70 border border-emerald-700/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-bold text-xs sm:text-sm text-emerald-200 flex items-center gap-1.5 font-arabic">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>{isAr ? 'تثبيت قاعدة البيانات الحالية داخل كود GitHub' : 'Intégrer vos candidats dans le code GitHub'}</span>
                    </span>
                    <p className="text-[11px] text-emerald-300/80 font-arabic">
                      {isAr
                        ? 'حمّل ملف initialCandidates.ts واستبدله في مشروعك قبل الرفع لتظهر بيانات المترشحين دائماً لأي مستخدم.'
                        : 'Téléchargez ce fichier pour que votre dépôt GitHub intègre par défaut toute votre liste de candidats actuelle.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadInitialCandidatesTs}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isAr ? 'تحميل ملف البيانات لـ GitHub' : 'Télécharger initialCandidates.ts'}</span>
                  </button>
                </div>

                {/* Git CLI Alternative */}
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {isAr ? 'أوامر Git في سطر الأوامر (Terminal) :' : 'Méthode 2 : Ligne de commande Git (Terminal)'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyGitCommands}
                      className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedGitCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedGitCmd ? (isAr ? 'تم النسخ' : 'Copié') : (isAr ? 'نسخ الأوامر' : 'Copier')}</span>
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-emerald-400 bg-slate-900/90 p-3 rounded-xl overflow-x-auto select-all leading-relaxed">
                    {gitCliCommands}
                  </pre>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: ADMIN SUPPRESSION & NETTOYAGE */}
          {activeTab === 'admin_clean' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Important Admin Warning Header */}
              <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-950 font-arabic">
                      {isAr ? 'منطقة المشرف: حذف المترشحين وتنظيف قاعدة البيانات' : 'Espace Administrateur : Suppression & Nettoyage de la Base'}
                    </h4>
                    <p className="text-xs text-rose-800/90 font-arabic mt-0.5">
                      {isAr
                        ? 'إمكانية حذف مرشحين بشكل فردي، أو الإبقاء حصرياً على المترشح حسبلاوي (مرشح واحد فقط)'
                        : 'Supprimez des candidats individuellement ou appliquez la réinitialisation exclusive sur Hasbaloui.'}
                    </p>
                  </div>
                </div>

                {/* Primary Admin Action: Keep only Hasbaloui */}
                <button
                  type="button"
                  onClick={() => {
                    const confirmMsg = isAr
                      ? 'تأكيد الإدارة: هل أنت متأكد من حذف جميع المترشحين والإبقاء على مترشح واحد فقط (حسبلاوي)؟'
                      : 'Action Administrateur : Voulez-vous supprimer TOUS les candidats et ne garder que le candidat Hasbaloui (1 seul candidat) ?';
                    if (window.confirm(confirmMsg)) {
                      if (onDeleteAllExceptHasbaloui) {
                        onDeleteAllExceptHasbaloui();
                      }
                      onClose();
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isAr ? 'حذف الكل عدا حسبلاوي (1 فقط)' : 'Garder uniquement Hasbaloui'}</span>
                </button>
              </div>

              {/* Individual Candidate Management & Search */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 font-arabic flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-700" />
                      <span>{isAr ? 'قائمة المترشحين المسجلين حالياً' : 'Liste des candidats actuellement enregistrés'}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full text-slate-700 border border-slate-200">
                        {candidates.length} {isAr ? 'مترشح' : 'candidat(s)'}
                      </span>
                    </h5>
                    <p className="text-xs text-slate-500 font-arabic">
                      {isAr ? 'اضغط على زر الحذف باللون الأحمر لإزالة المترشح فوراً من السجلات' : 'Cliquez sur le bouton rouge pour supprimer immédiatement un candidat'}
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      placeholder={isAr ? 'بحث بالاسم أو اللقب...' : 'Rechercher par nom...'}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-rose-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Candidate Rows */}
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto rounded-xl border border-slate-100">
                  {candidates
                    .filter(c => {
                      if (!candidateSearch.trim()) return true;
                      const q = candidateSearch.toLowerCase();
                      const fullFr = `${c.lastNameFr} ${c.firstNameFr}`.toLowerCase();
                      const fullAr = `${c.lastNameAr || ''} ${c.firstNameAr || ''}`;
                      return fullFr.includes(q) || fullAr.includes(q) || (c.nationalIdNumber && c.nationalIdNumber.includes(q));
                    })
                    .map((c) => {
                      const isHasbaloui = (c.lastNameFr || '').toUpperCase().includes('HASBA');
                      return (
                        <div
                          key={c.id}
                          className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                              c.council === 'APC' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {c.council} {c.listRank ? `#${c.listRank}` : ''}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {c.lastNameFr} {c.firstNameFr}
                                </span>
                                {c.lastNameAr && (
                                  <span className="text-xs text-slate-500 font-arabic truncate">
                                    {c.lastNameAr} {c.firstNameAr}
                                  </span>
                                )}
                                {isHasbaloui && (
                                  <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-900 rounded border border-amber-300">
                                    {isAr ? 'المترشح الرئيسي' : 'Candidat conservé'}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>{c.profession || 'Sans profession renseignée'}</span>
                                <span>•</span>
                                <span>{c.addressNeighborhood || 'Bologhine'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const confirmMsg = isAr
                                  ? `تأكيد الإدارة: هل أنت متأكد من حذف المترشح "${c.lastNameFr} ${c.firstNameFr}" نهائياً من قاعدة البيانات؟`
                                  : `Action Administrateur : Supprimer définitivement "${c.lastNameFr} ${c.firstNameFr}" de la base de données ?`;
                                if (window.confirm(confirmMsg)) {
                                  if (onDeleteCandidate) {
                                    onDeleteCandidate(c.id);
                                  }
                                  showToast(
                                    isAr
                                      ? `تم حذف المترشح ${c.lastNameFr} ${c.firstNameFr} بنجاح`
                                      : `Candidat ${c.lastNameFr} ${c.firstNameFr} supprimé`
                                  );
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                              title={isAr ? 'حذف هذا المترشح (إدارة)' : 'Supprimer ce candidat'}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span className="hidden sm:inline">{isAr ? 'حذف' : 'Supprimer'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {candidates.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-500 font-arabic">
                      {isAr ? 'لا يوجد أي مترشح في قاعدة البيانات حالياً' : 'Aucun candidat dans la base de données.'}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-arabic flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              {isAr
                ? `قاعدة البيانات نشطة ومؤمنة (${candidates.length} مترشح)`
                : `Base de données active & synchronisée (${candidates.length} candidats)`}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};
