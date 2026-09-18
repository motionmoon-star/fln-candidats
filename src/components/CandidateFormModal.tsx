import React, { useState, useRef, useMemo } from 'react';
import { Candidate, CouncilType, Gender, MilitaryStatus, ExtractedDocumentData } from '../types';
import { Language, TRANSLATIONS } from '../data/translations';
import { ADMINISTRATIVE_DOCUMENTS } from '../data/documentsList';
import { processAndOptimizeImage, scanDocumentWithAI, isGeminiKeyMissing, isGeminiQuotaExceeded } from '../utils/documentScanner';
import { 
  processAnyDocumentFile, 
  downloadDocumentFile, 
  downloadOfficialModelWord,
  extractTextFromWordOrTextFile
} from '../utils/documentFileHandler';
import { parseCandidateText } from '../utils/textParser';
import { getStoredCandidates } from '../utils/candidateUtils';
import { 
  X, 
  Save, 
  User, 
  Building2, 
  Landmark, 
  FileText, 
  CheckSquare, 
  Square, 
  Sparkles,
  MapPin,
  GraduationCap,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  CreditCard,
  Image as ImageIcon,
  Download,
  FileCode,
  Trash2,
  Eye,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  Award,
  ShieldCheck,
  Check,
  Copy,
  Clipboard,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  PenLine,
  Maximize2,
  FileSignature,
  Users,
  Home
} from 'lucide-react';
import { CameraCaptureModal } from './CameraCaptureModal';
import { DocumentTextModal } from './DocumentTextModal';

interface CandidateFormModalProps {
  initialCandidate?: Candidate | null;
  initialExtractedData?: ExtractedDocumentData | null;
  initialScannedFile?: { dataUrl: string; fileName: string } | null;
  existingCandidates?: Candidate[];
  language: Language;
  onClose: () => void;
  onSave: (candidate: Candidate) => void;
  nextRankAPC: number;
  nextRankAPW: number;
}

type TabType = 'identity' | 'candidacy' | 'documents';

export const CandidateFormModal: React.FC<CandidateFormModalProps> = ({
  initialCandidate,
  initialExtractedData,
  initialScannedFile,
  existingCandidates,
  language,
  onClose,
  onSave,
  nextRankAPC,
  nextRankAPW,
}) => {
  const isEditing = !!initialCandidate;
  const t = TRANSLATIONS[language];
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<TabType>('identity');

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const wordInputRef = useRef<HTMLInputElement | null>(null);
  const portraitInputRef = useRef<HTMLInputElement | null>(null);

  // Word file text extraction states
  const [extractedWordFileName, setExtractedWordFileName] = useState<string | null>(null);
  const [extractedWordRawText, setExtractedWordRawText] = useState<string | null>(null);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [extractedFieldsSummary, setExtractedFieldsSummary] = useState<string[]>([]);
  const [showPasteTextModal, setShowPasteTextModal] = useState(false);
  const [pasteTextContent, setPasteTextContent] = useState('');
  const [isDraggingWordFile, setIsDraggingWordFile] = useState(false);
  const [copiedTextSuccess, setCopiedTextSuccess] = useState(false);
  const [selectedOtherDocKey, setSelectedOtherDocKey] = useState<string>('nationality_certificate');

  // Hidden inputs for each doc upload
  const docUploadRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const docCameraRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const defaultCouncil: CouncilType = initialCandidate?.council || 'APC';
  const [council, setCouncil] = useState<CouncilType>(defaultCouncil);
  const [listRank, setListRank] = useState<number | null>(
    initialCandidate?.listRank ?? (isEditing ? null : (defaultCouncil === 'APC' ? nextRankAPC : nextRankAPW))
  );
  
  // Photo portrait of candidate
  const [photoUrl, setPhotoUrl] = useState<string>(initialCandidate?.photoUrl || '');

  // Civil & political fields
  const [lastNameFr, setLastNameFr] = useState(initialCandidate?.lastNameFr || initialExtractedData?.lastNameFr || '');
  const [firstNameFr, setFirstNameFr] = useState(initialCandidate?.firstNameFr || initialExtractedData?.firstNameFr || '');
  const [lastNameAr, setLastNameAr] = useState(initialCandidate?.lastNameAr || initialExtractedData?.lastNameAr || '');
  const [firstNameAr, setFirstNameAr] = useState(initialCandidate?.firstNameAr || initialExtractedData?.firstNameAr || '');
  const [gender, setGender] = useState<Gender>(initialCandidate?.gender || initialExtractedData?.gender || 'H');
  const [birthDate, setBirthDate] = useState(initialCandidate?.birthDate || initialExtractedData?.birthDate || '1990-01-01');
  const [birthPlace, setBirthPlace] = useState(initialCandidate?.birthPlace || initialExtractedData?.birthPlace || 'Bologhine, Alger');
  const [nationalIdNumber, setNationalIdNumber] = useState(initialCandidate?.nationalIdNumber || initialExtractedData?.nationalIdNumber || '');
  const [addressNeighborhood, setAddressNeighborhood] = useState(initialCandidate?.addressNeighborhood || initialExtractedData?.addressNeighborhood || 'Bologhine Centre');
  const [phoneNumber, setPhoneNumber] = useState(initialCandidate?.phoneNumber || '');
  const [email, setEmail] = useState(initialCandidate?.email || '');
  const [profession, setProfession] = useState(initialCandidate?.profession || initialExtractedData?.profession || '');
  const [educationLevel, setEducationLevel] = useState(initialCandidate?.educationLevel || initialExtractedData?.educationLevel || 'Licence');
  const [isUniversityGraduate, setIsUniversityGraduate] = useState<boolean>(initialCandidate?.isUniversityGraduate ?? initialExtractedData?.isUniversityGraduate ?? true);
  const [partyMembershipNumber, setPartyMembershipNumber] = useState(initialCandidate?.partyMembershipNumber || initialExtractedData?.partyMembershipNumber || `FLN-BO-${new Date().getFullYear()}-000`);
  const [partyJoinYear, setPartyJoinYear] = useState<number>(initialCandidate?.partyJoinYear || 2018);
  const [partyRole, setPartyRole] = useState(initialCandidate?.partyRole || 'Militant(e) Kasma Bologhine');
  const [militaryStatus, setMilitaryStatus] = useState<MilitaryStatus>(initialCandidate?.militaryStatus || initialExtractedData?.militaryStatus || (gender === 'F' ? 'non_concerne' : 'accompli'));
  const [notes, setNotes] = useState(initialCandidate?.notes || '');

  // Real-time duplicate detection for national identity card / NIN
  const cleanNIN = (nin: string) => (nin || '').replace(/[\s\-_./]/g, '').trim().toLowerCase();
  const currentCleanNIN = cleanNIN(nationalIdNumber);

  const duplicateCandidate = useMemo(() => {
    // Only trigger check if candidate entered at least 4 digits to avoid annoying false alerts on first keystrokes
    if (!currentCleanNIN || currentCleanNIN.length < 4) return null;
    const allCandidates = existingCandidates && existingCandidates.length > 0 
      ? existingCandidates 
      : getStoredCandidates();

    return allCandidates.find(c => {
      // If editing an existing candidate, exclude the candidate themselves
      if (initialCandidate && c.id === initialCandidate.id) return false;
      const otherClean = cleanNIN(c.nationalIdNumber || '');
      return otherClean.length >= 4 && otherClean === currentCleanNIN;
    }) || null;
  }, [currentCleanNIN, existingCandidates, initialCandidate]);

  // Document attachments (photos/scans/Word/PDF/Text notes)
  const [attachedScans, setAttachedScans] = useState<Record<string, {
    fileDataUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: 'image' | 'word' | 'pdf' | 'other';
    scannedAt?: string;
    referenceNumber?: string;
    issueDate?: string;
    notes?: string;
    authority?: string;
  }>>(() => {
    const res: Record<string, any> = {};
    if (initialCandidate?.documents) {
      for (const [k, v] of Object.entries(initialCandidate.documents)) {
        if (v.fileDataUrl || v.notes || v.referenceNumber) {
          res[k] = {
            fileDataUrl: v.fileDataUrl,
            fileName: v.fileName,
            fileSize: v.fileSize,
            fileType: v.fileType || 'image',
            scannedAt: v.scannedAt,
            referenceNumber: v.referenceNumber,
            issueDate: v.issueDate,
            notes: v.notes,
          };
        }
      }
    }
    // If initial scanned file from assistant was passed, attach to identity_card
    if (initialScannedFile && !res['identity_card']) {
      res['identity_card'] = {
        fileDataUrl: initialScannedFile.dataUrl,
        fileName: initialScannedFile.fileName,
        fileType: 'image',
        scannedAt: new Date().toISOString(),
        referenceNumber: initialExtractedData?.referenceNumber,
        issueDate: initialExtractedData?.issueDate,
      };
    }
    return res;
  });

  // Camera Live Capture Modal State
  const [cameraModalConfig, setCameraModalConfig] = useState<{
    isOpen: boolean;
    docKey: string;
    titleFr: string;
    titleAr: string;
    defaultFacingMode: 'environment' | 'user';
    isPortrait?: boolean;
  }>({
    isOpen: false,
    docKey: 'document',
    titleFr: '',
    titleAr: '',
    defaultFacingMode: 'environment',
  });

  // Document Text / Reference Modal State
  const [textModalConfig, setTextModalConfig] = useState<{
    isOpen: boolean;
    docKey: string;
    titleFr: string;
    titleAr: string;
    initialReferenceNumber?: string;
    initialIssueDate?: string;
    initialNotes?: string;
  }>({
    isOpen: false,
    docKey: '',
    titleFr: '',
    titleAr: '',
  });

  // Image Preview Modal State
  const [previewModal, setPreviewModal] = useState<{
    dataUrl: string;
    title: string;
    fileName?: string;
  } | null>(null);

  // Pre-checked documents state
  const [docStatuses, setDocStatuses] = useState<Record<string, boolean>>(() => {
    const res: Record<string, boolean> = {};
    for (const d of ADMINISTRATIVE_DOCUMENTS) {
      if (initialCandidate?.documents?.[d.key]) {
        res[d.key] = initialCandidate.documents[d.key].conforme === true || initialCandidate.documents[d.key].status === 'conforme';
      } else {
        res[d.key] = false;
      }
    }
    // If initial scanned file was passed, mark identity_card as checked
    if (initialScannedFile) {
      res['identity_card'] = true;
    }
    return res;
  });

  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [processingDocKey, setProcessingDocKey] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(
    initialScannedFile ? "Données pré-remplies depuis la numérisation du document." : null
  );
  const [lastScannedPreview, setLastScannedPreview] = useState<string | null>(
    initialScannedFile?.dataUrl || null
  );

  // Helper to map detected doc to official keys
  const getDocumentKeyFromType = (typeDetected: string): string => {
    const typeLow = (typeDetected || '').toLowerCase();
    if (typeLow.includes('naissance') || typeLow.includes('12') || typeLow.includes('ميلاد')) return 'birth_certificate';
    if (typeLow.includes('diplome') || typeLow.includes('universit') || typeLow.includes('شهادة') || typeLow.includes('cv')) return 'diploma_cv';
    if (typeLow.includes('nationalite') || typeLow.includes('جنسية')) return 'nationality_certificate';
    if (typeLow.includes('casier') || typeLow.includes('justice') || typeLow.includes('b3') || typeLow.includes('سوابق')) return 'police_record';
    if (typeLow.includes('service') || typeLow.includes('militaire') || typeLow.includes('عسكرية') || typeLow.includes('خدمة')) return 'military_status';
    if (typeLow.includes('residence') || typeLow.includes('habite') || typeLow.includes('إقامة')) return 'residence_certificate';
    if (typeLow.includes('fiscal') || typeLow.includes('impot') || typeLow.includes('ضرائب') || typeLow.includes('role')) return 'tax_clearance';
    if (typeLow.includes('electeur') || typeLow.includes('vote') || typeLow.includes('ناخب')) return 'voter_card';
    if (typeLow.includes('militant') || typeLow.includes('fln') || typeLow.includes('مناضل')) return 'party_card';
    return 'identity_card';
  };

  // Core Auto-fill function from extracted text (Word document, .txt file, or pasted text)
  const applyExtractedTextToForm = async (text: string, sourceName: string) => {
    if (!text || text.trim().length === 0) {
      setScanMessage(isAr ? 'لم يتم العثور على أي نص داخل الملف' : "Aucun texte lisible n'a pu être extrait du fichier.");
      return;
    }

    setIsScanning(true);
    setScanMessage(null);
    setExtractedWordFileName(sourceName);
    setExtractedWordRawText(text);

    // 1. Immediate local regex & heuristic parsing for instantaneous form filling
    const local = parseCandidateText(text);
    const filledList: string[] = [];

    if (local.lastNameFr) {
      setLastNameFr(local.lastNameFr.toUpperCase());
      filledList.push(isAr ? 'اللقب (فرنسية)' : 'Nom (FR)');
    }
    if (local.firstNameFr) {
      setFirstNameFr(local.firstNameFr);
      filledList.push(isAr ? 'الاسم (فرنسية)' : 'Prénom (FR)');
    }
    if (local.lastNameAr) {
      setLastNameAr(local.lastNameAr);
      filledList.push(isAr ? 'اللقب (عربية)' : 'Nom (AR)');
    }
    if (local.firstNameAr) {
      setFirstNameAr(local.firstNameAr);
      filledList.push(isAr ? 'الاسم (عربية)' : 'Prénom (AR)');
    }
    if (local.nationalIdNumber) {
      setNationalIdNumber(local.nationalIdNumber);
      filledList.push(isAr ? 'رقم التعريف الوطني (NIN)' : 'NIN (18 chiffres)');
    }
    if (local.birthDate) {
      setBirthDate(local.birthDate);
      filledList.push(isAr ? 'تاريخ الميلاد' : 'Date de naissance');
    }
    if (local.birthPlace) {
      setBirthPlace(local.birthPlace);
      filledList.push(isAr ? 'مكان الميلاد' : 'Lieu de naissance');
    }
    if (local.gender) {
      setGender(local.gender);
      filledList.push(isAr ? 'الجنس' : 'Sexe');
    }
    if (local.phoneNumber) {
      setPhoneNumber(local.phoneNumber);
      filledList.push(isAr ? 'رقم الهاتف' : 'Téléphone');
    }
    if (local.email) {
      setEmail(local.email);
      filledList.push(isAr ? 'البريد الإلكتروني' : 'Email');
    }
    if (local.addressNeighborhood) {
      setAddressNeighborhood(local.addressNeighborhood);
      filledList.push(isAr ? 'حي الإقامة' : 'Quartier');
    }
    if (local.profession) {
      setProfession(local.profession);
      filledList.push(isAr ? 'المهنة' : 'Profession');
    }
    if (local.educationLevel) {
      setEducationLevel(local.educationLevel);
      filledList.push(isAr ? 'المستوى الدراسي' : 'Niveau d\'études');
    }
    if (typeof local.isUniversityGraduate === 'boolean') {
      setIsUniversityGraduate(local.isUniversityGraduate);
    }
    if (local.militaryStatus) {
      setMilitaryStatus(local.militaryStatus);
      filledList.push(isAr ? 'الخدمة الوطنية' : 'Service National');
    }
    if (local.partyMembershipNumber) {
      setPartyMembershipNumber(local.partyMembershipNumber);
      filledList.push(isAr ? 'بطاقة الحزب FLN' : 'N° Carte FLN');
    }
    if (local.partyJoinYear) {
      setPartyJoinYear(local.partyJoinYear);
    }
    if (local.council) {
      setCouncil(local.council);
    }

    setExtractedFieldsSummary([...filledList]);

    // 2. Call Gemini AI extraction endpoint to refine Arabic names, diplomatic/administrative nuances, and fill remaining fields
    try {
      const aiExtracted = await scanDocumentWithAI(
        undefined,
        'text/plain',
        "Fiche de candidature ou CV d'un candidat Kasma FLN Bologhine",
        text
      );

      if (aiExtracted.lastNameFr && !local.lastNameFr) {
        setLastNameFr(aiExtracted.lastNameFr.toUpperCase());
        if (!filledList.includes(isAr ? 'اللقب (فرنسية)' : 'Nom (FR)')) filledList.push(isAr ? 'اللقب (فرنسية)' : 'Nom (FR)');
      }
      if (aiExtracted.firstNameFr && !local.firstNameFr) {
        setFirstNameFr(aiExtracted.firstNameFr);
        if (!filledList.includes(isAr ? 'الاسم (فرنسية)' : 'Prénom (FR)')) filledList.push(isAr ? 'الاسم (فرنسية)' : 'Prénom (FR)');
      }
      if (aiExtracted.lastNameAr && !local.lastNameAr) {
        setLastNameAr(aiExtracted.lastNameAr);
        if (!filledList.includes(isAr ? 'اللقب (عربية)' : 'Nom (AR)')) filledList.push(isAr ? 'اللقب (عربية)' : 'Nom (AR)');
      }
      if (aiExtracted.firstNameAr && !local.firstNameAr) {
        setFirstNameAr(aiExtracted.firstNameAr);
        if (!filledList.includes(isAr ? 'الاسم (عربية)' : 'Prénom (AR)')) filledList.push(isAr ? 'الاسم (عربية)' : 'Prénom (AR)');
      }
      if (aiExtracted.nationalIdNumber && !local.nationalIdNumber) {
        setNationalIdNumber(aiExtracted.nationalIdNumber);
        if (!filledList.includes(isAr ? 'رقم التعريف الوطني (NIN)' : 'NIN (18 chiffres)')) filledList.push(isAr ? 'رقم التعريف الوطني (NIN)' : 'NIN (18 chiffres)');
      }
      if (aiExtracted.birthDate && !local.birthDate) {
        setBirthDate(aiExtracted.birthDate);
        if (!filledList.includes(isAr ? 'تاريخ الميلاد' : 'Date de naissance')) filledList.push(isAr ? 'تاريخ الميلاد' : 'Date de naissance');
      }
      if (aiExtracted.birthPlace && !local.birthPlace) {
        setBirthPlace(aiExtracted.birthPlace);
        if (!filledList.includes(isAr ? 'مكان الميلاد' : 'Lieu de naissance')) filledList.push(isAr ? 'مكان الميلاد' : 'Lieu de naissance');
      }
      if (aiExtracted.gender && !local.gender) {
        setGender(aiExtracted.gender);
      }
      if (aiExtracted.phoneNumber && !local.phoneNumber) {
        setPhoneNumber(aiExtracted.phoneNumber);
        if (!filledList.includes(isAr ? 'رقم الهاتف' : 'Téléphone')) filledList.push(isAr ? 'رقم الهاتف' : 'Téléphone');
      }
      if (aiExtracted.email && !local.email) {
        setEmail(aiExtracted.email);
        if (!filledList.includes(isAr ? 'البريد الإلكتروني' : 'Email')) filledList.push(isAr ? 'البريد الإلكتروني' : 'Email');
      }
      if (aiExtracted.addressNeighborhood && !local.addressNeighborhood) {
        setAddressNeighborhood(aiExtracted.addressNeighborhood);
      }
      if (aiExtracted.profession && !local.profession) {
        setProfession(aiExtracted.profession);
        if (!filledList.includes(isAr ? 'المهنة' : 'Profession')) filledList.push(isAr ? 'المهنة' : 'Profession');
      }
      if (aiExtracted.educationLevel && !local.educationLevel) {
        setEducationLevel(aiExtracted.educationLevel);
      }
      if (typeof aiExtracted.isUniversityGraduate === 'boolean' && typeof local.isUniversityGraduate !== 'boolean') {
        setIsUniversityGraduate(aiExtracted.isUniversityGraduate);
      }
      if (aiExtracted.militaryStatus && !local.militaryStatus) {
        setMilitaryStatus(aiExtracted.militaryStatus);
      }
      if (aiExtracted.partyMembershipNumber && !local.partyMembershipNumber) {
        setPartyMembershipNumber(aiExtracted.partyMembershipNumber);
      }
      if (aiExtracted.partyJoinYear && !local.partyJoinYear) {
        setPartyJoinYear(aiExtracted.partyJoinYear);
      }
      if (aiExtracted.council && !local.council) {
        setCouncil(aiExtracted.council as CouncilType);
      }

      setExtractedFieldsSummary([...filledList]);
    } catch (err) {
      console.warn("AI refinement complete or bypassed:", err);
    } finally {
      setIsScanning(false);
    }

    setScanMessage(
      isAr
        ? `✓ تم استخراج النص وملء ${filledList.length} خانة تلقائياً من الملف (${sourceName})!`
        : `✓ Fichier "${sourceName}" extrait avec succès : ${filledList.length} cases remplies automatiquement !`
    );
  };

  // Upload handler for Word (.docx, .doc) or Text files (.txt, .rtf)
  const handleWordOrTextFileUpload = async (file: File) => {
    try {
      setIsScanning(true);
      setScanMessage(null);
      const { text, fileName } = await extractTextFromWordOrTextFile(file);
      if (!text || text.trim().length === 0) {
        setScanMessage(
          isAr
            ? 'تعذر قراءة النص من هذا الملف. يرجى التأكد من أنه ملف Word (.docx) أو نص (.txt) صالح'
            : "Impossible d'extraire du texte de ce fichier. Vérifiez qu'il s'agit d'un fichier Word (.docx) ou texte (.txt) valide."
        );
        setIsScanning(false);
        return;
      }
      await applyExtractedTextToForm(text, fileName);
    } catch (err: any) {
      console.error("Word/Text file upload error:", err);
      setScanMessage(isAr ? 'خطأ أثناء استخراج النص' : (err.message || "Erreur lors de l'extraction"));
      setIsScanning(false);
    }
  };

  // Global scan / OCR handler (top banner)
  const handleProcessScanFile = async (file: File) => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const processed = await processAnyDocumentFile(file);
      setLastScannedPreview(processed.dataUrl);

      // If Word or Text file was uploaded through the general picker, route to applyExtractedTextToForm!
      if (processed.rawText && processed.rawText.trim().length > 15) {
        await applyExtractedTextToForm(processed.rawText, processed.fileName);
        return;
      }

      // Call OCR endpoint for images / PDF scans
      const extracted = await scanDocumentWithAI(
        processed.fileType === 'word' ? undefined : processed.dataUrl,
        processed.mimeType,
        undefined,
        processed.rawText
      );

      // Auto-fill form fields
      if (extracted.lastNameFr) setLastNameFr(extracted.lastNameFr.toUpperCase());
      if (extracted.firstNameFr) setFirstNameFr(extracted.firstNameFr);
      if (extracted.lastNameAr) setLastNameAr(extracted.lastNameAr);
      if (extracted.firstNameAr) setFirstNameAr(extracted.firstNameAr);
      if (extracted.birthDate) setBirthDate(extracted.birthDate);
      if (extracted.birthPlace) setBirthPlace(extracted.birthPlace);
      if (extracted.nationalIdNumber) setNationalIdNumber(extracted.nationalIdNumber);
      if (extracted.gender) setGender(extracted.gender);
      if (extracted.phoneNumber) setPhoneNumber(extracted.phoneNumber);
      if (extracted.email) setEmail(extracted.email);
      if (extracted.addressNeighborhood) setAddressNeighborhood(extracted.addressNeighborhood);
      if (extracted.profession) setProfession(extracted.profession);
      if (extracted.educationLevel) setEducationLevel(extracted.educationLevel);
      if (typeof extracted.isUniversityGraduate === 'boolean') {
        setIsUniversityGraduate(extracted.isUniversityGraduate);
      }
      if (extracted.militaryStatus) setMilitaryStatus(extracted.militaryStatus);
      if (extracted.partyMembershipNumber) setPartyMembershipNumber(extracted.partyMembershipNumber);
      if (extracted.partyJoinYear) setPartyJoinYear(extracted.partyJoinYear);
      if (extracted.council) setCouncil(extracted.council as CouncilType);

      const targetDocKey = getDocumentKeyFromType(extracted.documentTypeDetected || '');

      setAttachedScans(prev => ({
        ...prev,
        [targetDocKey]: {
          fileDataUrl: processed.dataUrl,
          fileName: processed.fileName,
          fileSize: processed.fileSize,
          fileType: processed.fileType,
          scannedAt: new Date().toISOString(),
          referenceNumber: extracted.referenceNumber,
          issueDate: extracted.issueDate,
        }
      }));

      setDocStatuses(prev => ({
        ...prev,
        [targetDocKey]: true,
      }));

      setScanMessage(
        isAr 
          ? `تم مسح الوثيقة بنجاح (${extracted.documentTypeDetected || 'وثيقة رسمية'}) وملء بيانات المترشح تلقائياً!`
          : `Document numérisé avec succès (${extracted.documentTypeDetected || 'Document officiel'}) ! Données du candidat insérées automatiquement.`
      );
    } catch (err: any) {
      console.error(err);
      if (isGeminiQuotaExceeded(err)) {
        setScanMessage(
          isAr
            ? 'وصل المسح الذكي إلى الحد المجاني (20 طلباً/يوم). أعد المحاولة غداً أو استعمل مفتاحاً آخر.'
            : 'Le scan intelligent a atteint le quota gratuit (20 req/jour). Réessayez demain ou changez de clé.'
        );
        return;
      }
      setScanMessage(
        isGeminiKeyMissing(err)
          ? (isAr 
              ? 'الاستخراج الذكي غير مفعل: أضف مفتاح GEMINI_API_KEY إلى ملف .env ثم أعد تشغيل الخادم (npm run dev).'
              : 'Extraction IA non activée : ajoutez GEMINI_API_KEY dans le fichier .env puis redémarrez le serveur (npm run dev).')
          : (isAr ? 'تعذر استخراج البيانات من الوثيقة' : (err.message || "Erreur lors de l'analyse OCR"))
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Specific OCR scan handler for a designated document (e.g. birth certificate, CNI, etc.)
  const handleScanSpecificDoc = async (docKey: string, file: File) => {
    setProcessingDocKey(docKey);
    try {
      const docDef = ADMINISTRATIVE_DOCUMENTS.find(d => d.key === docKey);
      const processed = await processAnyDocumentFile(file);

      // Run OCR with specific hint
      const hint = `${docDef?.nameFr || ''} (${docDef?.nameAr || ''}) pour dossier électoral algérien`;
      const extracted = await scanDocumentWithAI(
        processed.fileType === 'word' ? undefined : processed.dataUrl,
        processed.mimeType,
        hint,
        processed.rawText
      );

      // Targeted field filling based on document type
      if (docKey === 'birth_certificate') {
        if (extracted.birthDate) setBirthDate(extracted.birthDate);
        if (extracted.birthPlace) setBirthPlace(extracted.birthPlace);
        if (extracted.lastNameFr && !lastNameFr) setLastNameFr(extracted.lastNameFr.toUpperCase());
        if (extracted.firstNameFr && !firstNameFr) setFirstNameFr(extracted.firstNameFr);
        if (extracted.lastNameAr && !lastNameAr) setLastNameAr(extracted.lastNameAr);
        if (extracted.firstNameAr && !firstNameAr) setFirstNameAr(extracted.firstNameAr);
        if (extracted.gender) setGender(extracted.gender);
      } else if (docKey === 'identity_card') {
        if (extracted.nationalIdNumber) setNationalIdNumber(extracted.nationalIdNumber);
        if (extracted.lastNameFr) setLastNameFr(extracted.lastNameFr.toUpperCase());
        if (extracted.firstNameFr) setFirstNameFr(extracted.firstNameFr);
        if (extracted.lastNameAr) setLastNameAr(extracted.lastNameAr);
        if (extracted.firstNameAr) setFirstNameAr(extracted.firstNameAr);
        if (extracted.addressNeighborhood) setAddressNeighborhood(extracted.addressNeighborhood);
      } else if (docKey === 'diploma_cv') {
        setIsUniversityGraduate(true);
        if (extracted.educationLevel) setEducationLevel(extracted.educationLevel);
        if (extracted.profession && !profession) setProfession(extracted.profession);
      } else if (docKey === 'military_status') {
        if (extracted.militaryStatus) setMilitaryStatus(extracted.militaryStatus);
      } else if (docKey === 'party_card') {
        if (extracted.partyMembershipNumber) setPartyMembershipNumber(extracted.partyMembershipNumber);
      }

      setAttachedScans(prev => ({
        ...prev,
        [docKey]: {
          fileDataUrl: processed.dataUrl,
          fileName: processed.fileName,
          fileSize: processed.fileSize,
          fileType: processed.fileType,
          scannedAt: new Date().toISOString(),
          referenceNumber: extracted.referenceNumber,
          issueDate: extracted.issueDate,
        }
      }));

      setDocStatuses(prev => ({
        ...prev,
        [docKey]: true,
      }));

      setScanMessage(
        isAr 
          ? `✓ تم مسح واستخراج بيانات: ${docDef?.nameAr || docKey} بنجاح!` 
          : `✓ ${docDef?.nameFr || docKey} numérisé par OCR : données et conformité validées !`
      );
    } catch (err: any) {
      console.error(err);
      if (isGeminiQuotaExceeded(err)) {
        alert(
          isAr
            ? 'وصل المسح الذكي إلى الحد المجاني (20 طلباً/يوم). أعد المحاولة غداً أو استعمل مفتاحاً آخر.'
            : 'Le scan intelligent a atteint le quota gratuit (20 req/jour). Réessayez demain ou changez de clé.'
        );
        return;
      }
      alert(
        isGeminiKeyMissing(err)
          ? (isAr
              ? 'الاستخراج الذكي غير مفعل: أضف مفتاح GEMINI_API_KEY إلى ملف .env ثم أعد تشغيل الخادم.'
              : 'Extraction IA non activée : ajoutez GEMINI_API_KEY dans le fichier .env puis redémarrez le serveur.')
          : (isAr ? 'خطأ أثناء المعالجة الضوئية' : (err.message || 'Erreur lors du traitement'))
      );
    } finally {
      setProcessingDocKey(null);
    }
  };

  // Direct file upload for any document (Photo, PDF, Word, Text)
  const handleUploadFileForDoc = async (docKey: string, file: File) => {
    setProcessingDocKey(docKey);
    try {
      const docDef = ADMINISTRATIVE_DOCUMENTS.find(d => d.key === docKey);
      const processed = await processAnyDocumentFile(file);

      // Extract data if usable content is present (Word, Text, Image, or PDF)
      let extractedData: ExtractedDocumentData | undefined;
      const hint = `${docDef?.nameFr || ''} (${docDef?.nameAr || ''}) pour dossier électoral FLN`;
      
      if (processed.rawText && processed.rawText.length > 20) {
        try {
          extractedData = await scanDocumentWithAI(
            undefined,
            processed.mimeType,
            hint,
            processed.rawText
          );
        } catch {
          // Fallback if AI text extraction fails
        }
      } else if (processed.dataUrl && (processed.fileType === 'image' || processed.fileType === 'pdf')) {
        try {
          extractedData = await scanDocumentWithAI(
            processed.dataUrl,
            processed.mimeType,
            hint
          );
        } catch {
          // Fallback if AI image/PDF scan fails
        }
      }

      // Auto-populate candidate form fields based on extracted document data
      if (extractedData) {
        if (docKey === 'birth_certificate') {
          if (extractedData.birthDate) setBirthDate(extractedData.birthDate);
          if (extractedData.birthPlace) setBirthPlace(extractedData.birthPlace);
          if (extractedData.lastNameFr && !lastNameFr) setLastNameFr(extractedData.lastNameFr.toUpperCase());
          if (extractedData.firstNameFr && !firstNameFr) setFirstNameFr(extractedData.firstNameFr);
          if (extractedData.lastNameAr && !lastNameAr) setLastNameAr(extractedData.lastNameAr);
          if (extractedData.firstNameAr && !firstNameAr) setFirstNameAr(extractedData.firstNameAr);
          if (extractedData.gender) setGender(extractedData.gender);
        } else if (docKey === 'identity_card') {
          if (extractedData.nationalIdNumber) setNationalIdNumber(extractedData.nationalIdNumber);
          if (extractedData.lastNameFr && !lastNameFr) setLastNameFr(extractedData.lastNameFr.toUpperCase());
          if (extractedData.firstNameFr && !firstNameFr) setFirstNameFr(extractedData.firstNameFr);
          if (extractedData.lastNameAr && !lastNameAr) setLastNameAr(extractedData.lastNameAr);
          if (extractedData.firstNameAr && !firstNameAr) setFirstNameAr(extractedData.firstNameAr);
          if (extractedData.birthDate && !birthDate) setBirthDate(extractedData.birthDate);
          if (extractedData.birthPlace && !birthPlace) setBirthPlace(extractedData.birthPlace);
          if (extractedData.addressNeighborhood) setAddressNeighborhood(extractedData.addressNeighborhood);
        } else if (docKey === 'residence_certificate') {
          if (extractedData.addressNeighborhood) setAddressNeighborhood(extractedData.addressNeighborhood);
        } else if (docKey === 'diploma_cv') {
          setIsUniversityGraduate(true);
          if (extractedData.educationLevel) setEducationLevel(extractedData.educationLevel);
          if (extractedData.profession && !profession) setProfession(extractedData.profession);
        } else if (docKey === 'military_status') {
          if (extractedData.militaryStatus) setMilitaryStatus(extractedData.militaryStatus);
        } else if (docKey === 'party_card') {
          if (extractedData.partyMembershipNumber) setPartyMembershipNumber(extractedData.partyMembershipNumber);
        }
      }

      // If document is photos, set photoUrl as official candidate picture
      if (docKey === 'photos' && processed.dataUrl) {
        setPhotoUrl(processed.dataUrl);
      }

      setAttachedScans(prev => ({
        ...prev,
        [docKey]: {
          fileDataUrl: processed.dataUrl,
          fileName: processed.fileName,
          fileSize: processed.fileSize,
          fileType: processed.fileType,
          scannedAt: new Date().toISOString(),
          referenceNumber: extractedData?.referenceNumber,
          issueDate: extractedData?.issueDate,
        }
      }));

      // Mark as conforme automatically
      setDocStatuses(prev => ({
        ...prev,
        [docKey]: true,
      }));

      const isWord = processed.fileType === 'word';
      const isImg = processed.fileType === 'image';
      const isPdf = processed.fileType === 'pdf';
      setScanMessage(
        isAr 
          ? `✓ تم إرفاق ملف ${isWord ? 'Word' : isPdf ? 'PDF' : isImg ? 'صورة' : 'نص'} (${processed.fileName}) لـ ${docDef?.nameAr} وملء الحقول تلقائياً!` 
          : `✓ Fichier ${isWord ? 'Word' : isPdf ? 'PDF' : isImg ? 'Photo' : 'Texte'} (${processed.fileName}) joint pour ${docDef?.nameFr} avec auto-complétion !`
      );
    } catch (err: any) {
      console.error(err);
      alert(isAr ? 'خطأ أثناء إرفاق الملف' : (err.message || 'Erreur lors du téléchargement du fichier'));
    } finally {
      setProcessingDocKey(null);
    }
  };

  // Remove attached file only (keep text note if any)
  const handleRemoveFileOnly = (docKey: string) => {
    setAttachedScans(prev => {
      const current = prev[docKey];
      if (!current) return prev;
      if (current.notes || current.referenceNumber) {
        return {
          ...prev,
          [docKey]: {
            notes: current.notes,
            referenceNumber: current.referenceNumber,
            issueDate: current.issueDate,
          }
        };
      }
      const next = { ...prev };
      delete next[docKey];
      return next;
    });
  };

  // Remove text note only (keep file if any)
  const handleRemoveTextNote = (docKey: string) => {
    setAttachedScans(prev => {
      const current = prev[docKey];
      if (!current) return prev;
      if (current.fileDataUrl) {
        const copy = { ...current };
        delete copy.notes;
        delete copy.referenceNumber;
        return {
          ...prev,
          [docKey]: copy,
        };
      }
      const next = { ...prev };
      delete next[docKey];
      return next;
    });
  };

  // Save textual notes and references for a document
  const handleSaveDocumentText = (
    docKey: string,
    data: { referenceNumber?: string; issueDate?: string; notes?: string; authority?: string }
  ) => {
    setAttachedScans(prev => ({
      ...prev,
      [docKey]: {
        ...(prev[docKey] || {}),
        referenceNumber: data.referenceNumber,
        issueDate: data.issueDate,
        notes: data.notes,
        authority: data.authority,
        scannedAt: prev[docKey]?.scannedAt || new Date().toISOString(),
      }
    }));
    setDocStatuses(prev => ({
      ...prev,
      [docKey]: true,
    }));
    const docDef = ADMINISTRATIVE_DOCUMENTS.find(d => d.key === docKey);
    setScanMessage(
      isAr 
        ? `✓ تم تدوين بيانات ومرجع وثيقة: ${docDef?.nameAr || docKey} بنجاح!` 
        : `✓ Référence et mentions enregistrées pour ${docDef?.nameFr || docKey} !`
    );
  };

  // Live camera photo capture for any document or candidate portrait
  const handleCameraCapture = async (dataUrl: string, fileName: string) => {
    const docKey = cameraModalConfig.docKey;
    if (cameraModalConfig.isPortrait) {
      setPhotoUrl(dataUrl);
      setAttachedScans(prev => ({
        ...prev,
        photos: {
          fileDataUrl: dataUrl,
          fileName,
          fileSize: Math.round((dataUrl.length * 3) / 4),
          fileType: 'image',
          scannedAt: new Date().toISOString(),
        }
      }));
      setDocStatuses(prev => ({ ...prev, photos: true }));
      setScanMessage(isAr ? '✓ تم التقاط صورة المترشح الرسمية بنجاح!' : '✓ Photo officielle du candidat enregistrée avec succès !');
      return;
    }

    const docDef = ADMINISTRATIVE_DOCUMENTS.find(d => d.key === docKey);
    setAttachedScans(prev => ({
      ...prev,
      [docKey]: {
        ...(prev[docKey] || {}),
        fileDataUrl: dataUrl,
        fileName,
        fileSize: Math.round((dataUrl.length * 3) / 4),
        fileType: 'image',
        scannedAt: new Date().toISOString(),
      }
    }));
    setDocStatuses(prev => ({ ...prev, [docKey]: true }));

    // Run OCR analysis to auto-populate form fields
    try {
      const hint = `${docDef?.nameFr || ''} (${docDef?.nameAr || ''}) pour dossier électoral algérien`;
      const extracted = await scanDocumentWithAI(dataUrl, 'image/jpeg', hint);
      
      if (docKey === 'birth_certificate') {
        if (extracted.birthDate) setBirthDate(extracted.birthDate);
        if (extracted.birthPlace) setBirthPlace(extracted.birthPlace);
        if (extracted.lastNameFr && !lastNameFr) setLastNameFr(extracted.lastNameFr.toUpperCase());
        if (extracted.firstNameFr && !firstNameFr) setFirstNameFr(extracted.firstNameFr);
        if (extracted.lastNameAr && !lastNameAr) setLastNameAr(extracted.lastNameAr);
        if (extracted.firstNameAr && !firstNameAr) setFirstNameAr(extracted.firstNameAr);
        if (extracted.gender) setGender(extracted.gender);
      } else if (docKey === 'identity_card') {
        if (extracted.nationalIdNumber) setNationalIdNumber(extracted.nationalIdNumber);
        if (extracted.lastNameFr && !lastNameFr) setLastNameFr(extracted.lastNameFr.toUpperCase());
        if (extracted.firstNameFr && !firstNameFr) setFirstNameFr(extracted.firstNameFr);
        if (extracted.lastNameAr && !lastNameAr) setLastNameAr(extracted.lastNameAr);
        if (extracted.firstNameAr && !firstNameAr) setFirstNameAr(extracted.firstNameAr);
        if (extracted.addressNeighborhood) setAddressNeighborhood(extracted.addressNeighborhood);
      } else if (docKey === 'police_record') {
        if (extracted.referenceNumber) {
          setAttachedScans(prev => ({
            ...prev,
            police_record: {
              ...prev.police_record,
              referenceNumber: extracted.referenceNumber,
              issueDate: extracted.issueDate || prev.police_record?.issueDate,
            }
          }));
        }
      } else if (docKey === 'residence_certificate') {
        if (extracted.addressNeighborhood) setAddressNeighborhood(extracted.addressNeighborhood);
      } else if (docKey === 'diploma_cv') {
        setIsUniversityGraduate(true);
        if (extracted.educationLevel) setEducationLevel(extracted.educationLevel);
        if (extracted.profession && !profession) setProfession(extracted.profession);
      } else if (docKey === 'military_status') {
        if (extracted.militaryStatus) setMilitaryStatus(extracted.militaryStatus);
      } else if (docKey === 'party_card') {
        if (extracted.partyMembershipNumber) setPartyMembershipNumber(extracted.partyMembershipNumber);
      }

      setScanMessage(
        isAr 
          ? `✓ تم التقاط صورة وثيقة: ${docDef?.nameAr || docKey} واستخراج البيانات بنجاح!` 
          : `✓ Photo de ${docDef?.nameFr || docKey} capturée et données extraites !`
      );
    } catch {
      setScanMessage(
        isAr 
          ? `✓ تم التقاط وإرفاق صورة: ${docDef?.nameAr || docKey} بنجاح!` 
          : `✓ Photo de ${docDef?.nameFr || docKey} jointe au dossier !`
      );
    }
  };

  // Remove attached scan/file
  const handleRemoveFileForDoc = (docKey: string) => {
    setAttachedScans(prev => {
      const next = { ...prev };
      delete next[docKey];
      return next;
    });
  };

  // Candidate portrait upload
  const handlePortraitUpload = async (file: File) => {
    try {
      const { dataUrl } = await processAndOptimizeImage(file);
      setPhotoUrl(dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDoc = (key: string) => {
    setDocStatuses(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleAllDocs = (status: boolean) => {
    const updated: Record<string, boolean> = {};
    for (const d of ADMINISTRATIVE_DOCUMENTS) {
      updated[d.key] = status;
    }
    setDocStatuses(updated);
  };

  const conformDocsCount = Object.values(docStatuses).filter(Boolean).length;
  const conformPercentage = Math.round((conformDocsCount / ADMINISTRATIVE_DOCUMENTS.length) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicate national ID number before submitting
    if (duplicateCandidate) {
      setActiveTab('identity');
      setScanMessage(
        isAr 
          ? `⚠️ لا يمكن حفظ المترشح: رقم بطاقة التعريف الوطنية (${nationalIdNumber}) مسجل بالفعل باسم المترشح: ${duplicateCandidate.lastNameAr || duplicateCandidate.lastNameFr} ${duplicateCandidate.firstNameAr || duplicateCandidate.firstNameFr}`
          : `⚠️ Enregistrement bloqué : Le numéro de carte d'identité (${nationalIdNumber}) est déjà enregistré pour le candidat : ${duplicateCandidate.lastNameFr} ${duplicateCandidate.firstNameFr}.`
      );
      return;
    }

    // Build the 11 documents record with attached files
    const documents: Record<string, any> = {};
    for (const def of ADMINISTRATIVE_DOCUMENTS) {
      const isConforme = !!docStatuses[def.key];
      const scan = attachedScans[def.key];

      documents[def.key] = {
        id: initialCandidate?.documents?.[def.key]?.id || `${def.key}-${Math.random().toString(36).substring(2, 7)}`,
        key: def.key,
        nameFr: def.nameFr,
        nameAr: def.nameAr,
        status: isConforme ? 'conforme' : 'en_attente',
        conforme: isConforme,
        issueDate: scan?.issueDate || (isConforme ? (initialCandidate?.documents?.[def.key]?.issueDate || new Date().toISOString().slice(0, 10)) : undefined),
        referenceNumber: scan?.referenceNumber || initialCandidate?.documents?.[def.key]?.referenceNumber,
        notes: scan?.notes || initialCandidate?.documents?.[def.key]?.notes || (isConforme ? 'Document vérifié et conforme' : 'En attente de délivrance'),
        fileDataUrl: scan?.fileDataUrl || initialCandidate?.documents?.[def.key]?.fileDataUrl,
        fileName: scan?.fileName || initialCandidate?.documents?.[def.key]?.fileName,
        fileType: scan?.fileType || initialCandidate?.documents?.[def.key]?.fileType,
        fileSize: scan?.fileSize || initialCandidate?.documents?.[def.key]?.fileSize,
        scannedAt: scan?.scannedAt || initialCandidate?.documents?.[def.key]?.scannedAt,
      };
    }

    const candidateToSave: Candidate = {
      id: initialCandidate?.id || `cand-fln-${Date.now()}`,
      listRank,
      assignedByAdmin: listRank !== null,
      council,
      photoUrl: photoUrl || undefined,
      lastNameFr: lastNameFr.toUpperCase().trim(),
      firstNameFr: firstNameFr.trim(),
      lastNameAr: lastNameAr.trim(),
      firstNameAr: firstNameAr.trim(),
      gender,
      birthDate,
      birthPlace,
      nationalIdNumber,
      addressNeighborhood,
      phoneNumber,
      email,
      profession,
      educationLevel,
      isUniversityGraduate,
      partyMembershipNumber,
      partyJoinYear,
      partyRole,
      militaryStatus,
      notes,
      dossierStatus: Object.values(docStatuses).every(Boolean) ? 'complet' : 'en_cours',
      documents,
      createdAt: initialCandidate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(candidateToSave);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-hidden">
      <div 
        className="bg-white rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 w-full max-w-3xl h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <User className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {isEditing 
                  ? (isAr ? `تعديل: ${initialCandidate.lastNameFr} ${initialCandidate.firstNameFr}` : `Modifier : ${initialCandidate.lastNameFr} ${initialCandidate.firstNameFr}`)
                  : (isAr ? 'إضافة ملف مترشح جديد - قسمة بولوغين' : 'Nouveau Candidat - Kasma Bologhine')}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-emerald-800 font-arabic">حزب جبهة التحرير الوطني</span>
                <span>•</span>
                <span className="bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.2 rounded text-[11px]">
                  {council === 'APW' ? 'APW Alger' : 'APC Bologhine'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs - Highly Accessible for Mobile Phones */}
        <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'identity'
                ? 'bg-emerald-800 text-white shadow-xs'
                : duplicateCandidate
                ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{isAr ? '1. الحالة المدنية' : '1. État Civil'}</span>
            {duplicateCandidate && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                ! {isAr ? 'تكرار' : 'Doublon'}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('candidacy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'candidacy'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>{isAr ? '2. الترشح والحزب' : '2. Candidature & FLN'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isAr ? '3. الوثائق الإدارية (11)' : '3. Pièces Administratives (11)'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeTab === 'documents' ? 'bg-amber-400 text-slate-900' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {conformDocsCount}/11
            </span>
          </button>
        </div>

        {/* Global OCR Scanner Banner (Visible on all tabs) */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 p-3 sm:p-3.5 text-white shrink-0 border-b border-emerald-800/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-wide text-amber-300 uppercase">
                    {isAr ? 'المسح الذكي للوثائق (OCR / Word / PDF)' : 'Numérisation IA & Import Direct (Word / Photo)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate">
                  {isAr 
                    ? 'مسح شهادة الميلاد، بطاقة التعريف أو ملف Word لملء الحقول تلقائياً' 
                    : 'Scannez l\'acte de naissance ou importez un fichier Word/PDF pour renseigner la fiche.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {/* Camera Photo */}
              <button
                type="button"
                disabled={isScanning}
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Photographier avec le smartphone"
              >
                <Camera className="w-3.5 h-3.5 text-amber-300" />
                <span>{isAr ? 'كاميرا' : 'Photo'}</span>
              </button>

              {/* Upload Word / Text / PDF / Photo */}
              <button
                type="button"
                disabled={isScanning}
                onClick={() => wordInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-emerald-500/50 text-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Insérer un fichier Word (.docx, .doc) ou fichier texte (.txt) pour remplir automatiquement"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>{isAr ? 'ملف Word / نص' : 'Fichier Word / Texte'}</span>
              </button>
            </div>
          </div>

          {/* Hidden inputs for scan / word import */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleProcessScanFile(f);
              e.target.value = '';
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".doc,.docx,.txt,.text,.rtf,.pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleProcessScanFile(f);
              e.target.value = '';
            }}
          />
          <input
            ref={wordInputRef}
            type="file"
            accept=".docx,.doc,.txt,.text,.rtf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleWordOrTextFileUpload(f);
              e.target.value = '';
            }}
          />

          {/* Processing / Result Notification */}
          {isScanning && (
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-600/30 animate-pulse">
              <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>{isAr ? 'جارِ معالجة الوثيقة بالذكاء الاصطناعي...' : 'Analyse du document et extraction OCR en cours...'}</span>
            </div>
          )}

          {scanMessage && !isScanning && (
            <div className="mt-2 flex items-center justify-between gap-2 text-xs bg-emerald-900/60 text-emerald-200 p-2 rounded-lg border border-emerald-500/30">
              <div className="flex items-center gap-1.5 min-w-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{scanMessage}</span>
              </div>
              <button 
                type="button"
                onClick={() => setScanMessage(null)}
                className="text-slate-400 hover:text-white text-xs shrink-0"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Form Body with Tabs */}
        <form id="candidate-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">

          {/* TAB 1: ÉTAT CIVIL & IDENTITÉ */}
          {activeTab === 'identity' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* SECTION: INSERTION FICHIER WORD / TEXTE & EXTRACTION AUTOMATIQUE */}
              <div 
                onDragOver={e => {
                  e.preventDefault();
                  setIsDraggingWordFile(true);
                }}
                onDragLeave={() => setIsDraggingWordFile(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDraggingWordFile(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleWordOrTextFileUpload(file);
                }}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  isDraggingWordFile 
                    ? 'border-emerald-500 bg-emerald-50/90 ring-4 ring-emerald-500/20 shadow-md' 
                    : 'border-dashed border-emerald-300 bg-gradient-to-r from-emerald-50/60 via-slate-50 to-blue-50/40 hover:border-emerald-400'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-800">
                          {isAr ? 'إدراج ملف Word أو ملف نص لاستخراج البيانات تلقائياً' : 'Insérer un Fichier Word (.docx/.doc) ou Fichier Texte (.txt)'}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          {isAr ? 'ملء تلقائي فوري' : 'Auto-remplissage des cases'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
                        {isAr 
                          ? 'اختر أو اسحب ملف وورد أو نص يحتوي على بيانات المترشح (اللقب، الاسم، NIN، الهاتف، المهنة...) وسيتم ملء الاستمارة تلقائياً.' 
                          : 'Sélectionnez ou glissez un fichier Word ou texte contenant les coordonnées du candidat : le texte est extrait et remplit instantanément toutes les cases correspondantes.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={() => wordInputRef.current?.click()}
                      disabled={isScanning}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isAr ? 'اختيار ملف Word / نص' : 'Choisir Fichier Word / Texte'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPasteTextModal(prev => !prev)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                      title="Coller du texte brut (ex: depuis WhatsApp, email ou bloc-notes)"
                    >
                      <Clipboard className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isAr ? 'لصق نص' : 'Coller texte'}</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible Paste Text Area */}
                {showPasteTextModal && (
                  <div className="mt-3.5 pt-3.5 border-t border-slate-200 space-y-2 animate-in fade-in duration-150">
                    <label className="block text-xs font-bold text-slate-700">
                      {isAr ? 'الصق نص معلومات المترشح هنا:' : 'Collez ici le texte des informations du candidat :'}
                    </label>
                    <textarea
                      rows={4}
                      value={pasteTextContent}
                      onChange={e => setPasteTextContent(e.target.value)}
                      placeholder={
                        isAr 
                          ? 'مثال:\nاللقب: بلحاج\nالاسم: كمال\nرقم التعريف الوطني (NIN): 198216010012345678\nتاريخ الميلاد: 15/04/1982 بولوغين\nالهاتف: 0550123456\nالمهنة: محامي' 
                          : 'Exemple :\nNom : BENALI\nPrénom : Mohamed\nNIN : 198516010012345678\nDate de naissance : 12/05/1985 à Bologhine\nTéléphone : 0550 12 34 56\nEmail : m.benali@gmail.com\nProfession : Enseignant universitaire'
                      }
                      className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasteTextModal(false);
                          setPasteTextContent('');
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                      >
                        {isAr ? 'إلغاء' : 'Annuler'}
                      </button>
                      <button
                        type="button"
                        disabled={!pasteTextContent.trim() || isScanning}
                        onClick={async () => {
                          const txt = pasteTextContent.trim();
                          if (txt) {
                            await applyExtractedTextToForm(txt, isAr ? 'نص ملصوق' : 'Texte collé');
                            setShowPasteTextModal(false);
                            setPasteTextContent('');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>{isAr ? 'استخراج وملء الحقول' : 'Extraire et Remplir les Cases'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Feedback of Extracted File & Fields */}
                {extractedWordFileName && extractedWordRawText && (
                  <div className="mt-3 pt-3 border-t border-emerald-200/60 flex flex-col gap-2">
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold min-w-0">
                        <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          {isAr 
                            ? `تم استخراج النص من: ${extractedWordFileName}` 
                            : `Fichier analysé : ${extractedWordFileName}`}
                        </span>
                        <span className="text-[11px] font-normal text-slate-500">
                          ({extractedWordRawText.length} {isAr ? 'حرف' : 'caractères'})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowExtractedText(prev => !prev)}
                          className="text-[11px] font-bold text-slate-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>
                            {showExtractedText 
                              ? (isAr ? 'إخفاء النص المستخرج' : 'Masquer le texte') 
                              : (isAr ? 'عرض النص المستخرج' : 'Voir le texte extrait')}
                          </span>
                          {showExtractedText ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setExtractedWordFileName(null);
                            setExtractedWordRawText(null);
                            setShowExtractedText(false);
                            setExtractedFieldsSummary([]);
                          }}
                          className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                          title="Fermer ce volet"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Summary badges of filled fields */}
                    {extractedFieldsSummary.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-600">
                          {isAr ? 'الحقول المملوءة:' : 'Cases remplies :'}
                        </span>
                        {extractedFieldsSummary.map((fName, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300 shadow-2xs"
                          >
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                            {fName}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expandable Raw Text Viewer */}
                    {showExtractedText && (
                      <div className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono max-h-48 overflow-y-auto relative border border-slate-700">
                        <div className="flex items-center justify-between sticky top-0 bg-slate-900/90 pb-1 mb-1 border-b border-slate-800">
                          <span className="text-[10px] text-slate-400 font-sans uppercase font-bold">
                            {isAr ? 'محتوى النص المستخرج من الملف' : 'Contenu texte extrait du fichier'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(extractedWordRawText);
                              setCopiedTextSuccess(true);
                              setTimeout(() => setCopiedTextSuccess(false), 2000);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            {copiedTextSuccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedTextSuccess ? (isAr ? 'تم النسخ' : 'Copié !') : (isAr ? 'نسخ' : 'Copier')}</span>
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-200">
                          {extractedWordRawText}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION: PIÈCES ADMINISTRATIVES & REMPLISSAGE DU FORMULAIRE */}
              <div className="bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-emerald-300/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-emerald-200">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-extrabold text-emerald-950">
                          {isAr ? 'الوثائق الإدارية لملء الاستمارة تلقائياً' : 'Documents Administratifs pour Remplissage Automatique'}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {isAr ? 'كاميرا • صورة • PDF • نص' : 'Caméra • Photo • PDF • Texte'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {isAr
                          ? 'التقاط صورة مباشرة بالكاميرا أو إرفاق ملف (صورة / PDF / نص) لملء وتدعيم ملف المترشح (شهادة الميلاد، السوابق، الإقامة، الهوية)'
                          : 'Prenez une photo en direct ou joignez un fichier (Photo, PDF, Texte) pour la fiche familiale, casier judiciaire B3, résidence, CNI et autres documents.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('documents')}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-300 shadow-2xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{isAr ? 'عرض الملف الكامل (11 وثيقة) ➔' : 'Voir les 11 pièces administratives ➔'}</span>
                    </button>
                  </div>
                </div>

                {/* 4 PRIORITY DOCUMENTS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* 1. FICHE FAMILIALE & ACTE DE NAISSANCE */}
                  {(() => {
                    const docKey = 'birth_certificate';
                    const scan = attachedScans[docKey];
                    const isConform = docStatuses[docKey];
                    const isProcessing = processingDocKey === docKey;
                    const isImg = scan?.fileType === 'image';

                    return (
                      <div className="p-3.5 rounded-xl bg-white border border-emerald-200/90 shadow-2xs hover:border-emerald-400 transition-all flex flex-col justify-between gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                              <Users className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {isAr ? 'البطاقة العائلية وشهادة الميلاد (عقد 12)' : 'Fiche familiale & Acte de naissance'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                {isAr ? 'عقد الميلاد 12 أو الدفتر العائلي لاستخراج السن والنسب' : 'Renseigne automatiquement : Nom, Prénom, Date/Lieu naiss.'}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isConform || scan ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {isAr ? 'جاهز' : 'Validé'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                {isAr ? 'مطلوب' : 'Requis'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Attachment Preview (if any) */}
                        {scan && (
                          <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              {scan.fileDataUrl && isImg ? (
                                <img
                                  src={scan.fileDataUrl}
                                  alt="Aperçu"
                                  onClick={() => setPreviewModal({
                                    dataUrl: scan.fileDataUrl!,
                                    title: 'Fiche familiale & Acte de naissance',
                                    fileName: scan.fileName
                                  })}
                                  className="w-7 h-7 rounded object-cover border border-emerald-400 cursor-pointer shrink-0"
                                  title="Agrandir"
                                />
                              ) : (
                                <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <span className="font-semibold text-emerald-950 text-[11px] truncate block">
                                  {scan.fileName || 'Fiche familiale jointe'}
                                </span>
                                {(scan.referenceNumber || scan.issueDate) && (
                                  <span className="text-[10px] text-emerald-800 block">
                                    {scan.referenceNumber ? `Réf: ${scan.referenceNumber}` : ''} {scan.issueDate ? `(${scan.issueDate})` : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {scan.fileDataUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewModal({
                                    dataUrl: scan.fileDataUrl!,
                                    title: 'Fiche familiale & Acte de naissance',
                                    fileName: scan.fileName
                                  })}
                                  className="p-1 rounded text-emerald-700 hover:bg-emerald-200"
                                  title="Aperçu"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveFileOnly(docKey)}
                                className="p-1 rounded text-rose-600 hover:bg-rose-100"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => setCameraModalConfig({
                              isOpen: true,
                              docKey,
                              titleFr: 'Fiche familiale & Acte de naissance (عقد 12)',
                              titleAr: 'البطاقة العائلية وشهادة الميلاد (عقد 12)',
                              defaultFacingMode: 'environment'
                            })}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-600 transition-all cursor-pointer shadow-2xs truncate"
                            title="Prendre une photo par la caméra pour remplir automatiquement"
                          >
                            <Camera className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                            <span className="truncate">{isAr ? 'كاميرا' : 'Caméra'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => docUploadRefs.current[docKey]?.click()}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-300 hover:bg-emerald-50 hover:text-emerald-800 transition-all cursor-pointer shadow-2xs truncate"
                            title="Joindre un fichier (Photo, PDF, Word ou Texte)"
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span className="truncate">{isAr ? 'ملف/PDF' : 'Photo/PDF'}</span>
                          </button>
                          <input
                            ref={el => { docUploadRefs.current[docKey] = el; }}
                            type="file"
                            accept=".pdf,image/*,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadFileForDoc(docKey, f);
                              e.target.value = '';
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => setTextModalConfig({
                              isOpen: true,
                              docKey,
                              titleFr: 'Fiche familiale & Acte de naissance',
                              titleAr: 'البطاقة العائلية وشهادة الميلاد',
                              initialReferenceNumber: scan?.referenceNumber,
                              initialIssueDate: scan?.issueDate,
                              initialNotes: scan?.notes
                            })}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs truncate"
                            title="Saisir les références officielles ou notes"
                          >
                            <PenLine className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{isAr ? 'تدوين نص' : 'Texte/Réf'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 2. CASIER JUDICIAIRE (BULLETIN N°3) */}
                  {(() => {
                    const docKey = 'police_record';
                    const scan = attachedScans[docKey];
                    const isConform = docStatuses[docKey];
                    const isProcessing = processingDocKey === docKey;
                    const isImg = scan?.fileType === 'image';

                    return (
                      <div className="p-3.5 rounded-xl bg-white border border-emerald-200/90 shadow-2xs hover:border-emerald-400 transition-all flex flex-col justify-between gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                              <Award className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {isAr ? 'صحيفة السوابق القضائية (القسيمة رقم 3)' : 'Casier Judiciaire (Bulletin n°3)'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                {isAr ? 'صادر عن محكمة باب الوادي أو وزارة العدل (- 3 أشهر)' : 'Tribunal de Bab El Oued ou Guichet Justice (- 3 mois)'}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isConform || scan ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {isAr ? 'جاهز' : 'Validé'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                {isAr ? 'مطلوب' : 'Requis'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Attachment Preview */}
                        {scan && (
                          <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              {scan.fileDataUrl && isImg ? (
                                <img
                                  src={scan.fileDataUrl}
                                  alt="Aperçu"
                                  onClick={() => setPreviewModal({
                                    dataUrl: scan.fileDataUrl!,
                                    title: 'Casier Judiciaire (B3)',
                                    fileName: scan.fileName
                                  })}
                                  className="w-7 h-7 rounded object-cover border border-emerald-400 cursor-pointer shrink-0"
                                  title="Agrandir"
                                />
                              ) : (
                                <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <span className="font-semibold text-emerald-950 text-[11px] truncate block">
                                  {scan.fileName || 'Casier judiciaire joint'}
                                </span>
                                {(scan.referenceNumber || scan.issueDate) && (
                                  <span className="text-[10px] text-emerald-800 block">
                                    {scan.referenceNumber ? `N° B3: ${scan.referenceNumber}` : ''} {scan.issueDate ? `(${scan.issueDate})` : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {scan.fileDataUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewModal({
                                    dataUrl: scan.fileDataUrl!,
                                    title: 'Casier Judiciaire (B3)',
                                    fileName: scan.fileName
                                  })}
                                  className="p-1 rounded text-emerald-700 hover:bg-emerald-200"
                                  title="Aperçu"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveFileOnly(docKey)}
                                className="p-1 rounded text-rose-600 hover:bg-rose-100"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => setCameraModalConfig({
                              isOpen: true,
                              docKey,
                              titleFr: 'Casier Judiciaire (Bulletin n°3)',
                              titleAr: 'صحيفة السوابق القضائية (القسيمة رقم 3)',
                              defaultFacingMode: 'environment'
                            })}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-600 transition-all cursor-pointer shadow-2xs truncate"
                            title="Photographier le casier B3 pour extraction et pièce jointe"
                          >
                            <Camera className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                            <span className="truncate">{isAr ? 'كاميرا' : 'Caméra'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => docUploadRefs.current[docKey]?.click()}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-300 hover:bg-emerald-50 hover:text-emerald-800 transition-all cursor-pointer shadow-2xs truncate"
                            title="Joindre un fichier (Photo, PDF ou Texte)"
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span className="truncate">{isAr ? 'ملف/PDF' : 'Photo/PDF'}</span>
                          </button>
                          <input
                            ref={el => { docUploadRefs.current[docKey] = el; }}
                            type="file"
                            accept=".pdf,image/*,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadFileForDoc(docKey, f);
                              e.target.value = '';
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => setTextModalConfig({
                              isOpen: true,
                              docKey,
                              titleFr: 'Casier Judiciaire (Bulletin n°3)',
                              titleAr: 'صحيفة السوابق القضائية (القسيمة رقم 3)',
                              initialReferenceNumber: scan?.referenceNumber,
                              initialIssueDate: scan?.issueDate,
                              initialNotes: scan?.notes
                            })}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs truncate"
                            title="Saisir le numéro de bulletin et la date de délivrance"
                          >
                            <PenLine className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{isAr ? 'تدوين نص' : 'Texte/Réf'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 3. CERTIFICAT DE RÉSIDENCE */}
                  {(() => {
                    const docKey = 'residence_certificate';
                    const scan = attachedScans[docKey];
                    const isConform = docStatuses[docKey];
                    const isProcessing = processingDocKey === docKey;
                    const isImg = scan?.fileType === 'image';

                    return (
                      <div className="p-3.5 rounded-xl bg-white border border-emerald-200/90 shadow-2xs hover:border-emerald-400 transition-all flex flex-col justify-between gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                              <Home className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {isAr ? 'شهادة الإقامة ببلدية بولوغين' : 'Certificat de Résidence'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                {isAr ? 'إثبات الإقامة الفعلية في بلدية بولوغين أو الدائرة الانتخابية' : 'Atteste l\'établissement effectif dans la commune de Bologhine'}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isConform || scan ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {isAr ? 'جاهز' : 'Validé'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                {isAr ? 'مطلوب' : 'Requis'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Attachment Preview */}
                        {scan && (
                          <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              {scan.fileDataUrl && isImg ? (
                                <img
                                  src={scan.fileDataUrl}
                                  alt="Aperçu"
                                  onClick={() => setPreviewModal({
                                    dataUrl: scan.fileDataUrl!,
                                    title: 'Certificat de Résidence',
                                    fileName: scan.fileName
                                  })}
                                  className="w-7 h-7 rounded object-cover border border-emerald-400 cursor-pointer shrink-0"
                                  title="Agrandir"
                                />
                              ) : (
                                <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <span className="font-semibold text-emerald-950 text-[11px] truncate block">
                                  {scan.fileName || 'Certificat de résidence joint'}
                                </span>
                                {(scan.referenceNumber || addressNeighborhood) && (
                                  <span className="text-[10px] text-emerald-800 block">
                                    {addressNeighborhood ? `Quartier: ${addressNeighborhood}` : ''} {scan.referenceNumber ? `(Réf: ${scan.referenceNumber})` : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {scan.fileDataUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewModal({
                                    dataUrl: scan.fileDataUrl!,
                                    title: 'Certificat de Résidence',
                                    fileName: scan.fileName
                                  })}
                                  className="p-1 rounded text-emerald-700 hover:bg-emerald-200"
                                  title="Aperçu"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveFileOnly(docKey)}
                                className="p-1 rounded text-rose-600 hover:bg-rose-100"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => setCameraModalConfig({
                              isOpen: true,
                              docKey,
                              titleFr: 'Certificat de Résidence',
                              titleAr: 'شهادة الإقامة ببلدية بولوغين',
                              defaultFacingMode: 'environment'
                            })}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-600 transition-all cursor-pointer shadow-2xs truncate"
                            title="Prendre photo de la résidence avec caméra"
                          >
                            <Camera className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                            <span className="truncate">{isAr ? 'كاميرا' : 'Caméra'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => docUploadRefs.current[docKey]?.click()}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-300 hover:bg-emerald-50 hover:text-emerald-800 transition-all cursor-pointer shadow-2xs truncate"
                            title="Joindre un fichier (Photo, PDF ou Texte)"
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span className="truncate">{isAr ? 'ملف/PDF' : 'Photo/PDF'}</span>
                          </button>
                          <input
                            ref={el => { docUploadRefs.current[docKey] = el; }}
                            type="file"
                            accept=".pdf,image/*,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadFileForDoc(docKey, f);
                              e.target.value = '';
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => setTextModalConfig({
                              isOpen: true,
                              docKey,
                              titleFr: 'Certificat de Résidence',
                              titleAr: 'شهادة الإقامة ببلدية بولوغين',
                              initialReferenceNumber: scan?.referenceNumber,
                              initialIssueDate: scan?.issueDate,
                              initialNotes: scan?.notes
                            })}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs truncate"
                            title="Saisir adresse et référence"
                          >
                            <PenLine className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{isAr ? 'تدوين نص' : 'Texte/Réf'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 4. PHOTO D'IDENTITÉ & CARTE NATIONALE CNI */}
                  {(() => {
                    const cniScan = attachedScans['identity_card'];
                    const photoScan = attachedScans['photos'];
                    const hasPhoto = Boolean(photoUrl || photoScan);
                    const isCniConform = docStatuses['identity_card'];

                    return (
                      <div className="p-3.5 rounded-xl bg-white border border-emerald-200/90 shadow-2xs hover:border-emerald-400 transition-all flex flex-col justify-between gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 mt-0.5">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {isAr ? 'صورة الهوية & بطاقة التعريف (CNI)' : 'Photo d\'Identité & Carte CNI'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                {isAr ? 'صورة شمسية رسمية وبطاقة التعريف البيومترية (NIN)' : 'Photo officielle du candidat et numéro NIN'}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {hasPhoto || isCniConform ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {isAr ? 'جاهز' : 'Validé'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                {isAr ? 'مطلوب' : 'Requis'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Previews: Photo & CNI */}
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt="Photo candidat"
                              className="w-8 h-9 rounded object-cover border border-emerald-500 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-9 rounded bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                              <Camera className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-900 text-[11px] truncate block">
                              {photoUrl ? (isAr ? '✓ الصورة الرسمية مسجلة' : '✓ Photo officielle enregistrée') : (isAr ? 'الصورة غير متوفرة' : 'Photo en attente')}
                            </span>
                            <span className="text-[10px] text-slate-600 truncate block">
                              {nationalIdNumber ? `NIN: ${nationalIdNumber}` : (cniScan?.fileName ? `CNI: ${cniScan.fileName}` : (isAr ? 'بطاقة التعريف البيومترية' : 'Carte d\'identité biométrique'))}
                            </span>
                          </div>
                          {photoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setPhotoUrl('');
                                handleRemoveFileOnly('photos');
                              }}
                              className="p-1 rounded text-rose-600 hover:bg-rose-100 shrink-0"
                              title="Supprimer la photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100">
                          {/* Photo Portrait with live camera */}
                          <button
                            type="button"
                            onClick={() => setCameraModalConfig({
                              isOpen: true,
                              docKey: 'photos',
                              titleFr: 'Photo d\'identité officielle du candidat',
                              titleAr: 'التقاط الصورة الرسمية للمترشح (سيلفي / بورتريه)',
                              defaultFacingMode: 'user',
                              isPortrait: true
                            })}
                            className="flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-600 transition-all cursor-pointer shadow-2xs truncate"
                            title="Prendre la photo d'identité officielle directement par caméra selfie/webcam"
                          >
                            <Camera className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                            <span className="truncate">{isAr ? 'صورة كاميرا' : 'Photo Caméra'}</span>
                          </button>

                          {/* Scanner CNI with camera */}
                          <button
                            type="button"
                            onClick={() => setCameraModalConfig({
                              isOpen: true,
                              docKey: 'identity_card',
                              titleFr: 'Carte Nationale d\'Identité (CNI)',
                              titleAr: 'مسح بطاقة التعريف الوطنية البيومترية',
                              defaultFacingMode: 'environment'
                            })}
                            className="flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 transition-all cursor-pointer shadow-2xs truncate"
                            title="Scanner la carte d'identité CNI par caméra"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{isAr ? 'مسح CNI' : 'Scanner CNI'}</span>
                          </button>

                          {/* Upload CNI or Photo file */}
                          <button
                            type="button"
                            onClick={() => docUploadRefs.current['identity_card']?.click()}
                            className="flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-300 hover:bg-emerald-50 transition-all cursor-pointer shadow-2xs truncate"
                            title="Joindre un fichier Photo, PDF ou Texte de la CNI"
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span className="truncate">{isAr ? 'ملف CNI' : 'Fichier CNI'}</span>
                          </button>
                          <input
                            ref={el => { docUploadRefs.current['identity_card'] = el; }}
                            type="file"
                            accept=".pdf,image/*,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadFileForDoc('identity_card', f);
                              e.target.value = '';
                            }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 5. AUTRES DOCUMENTS DU DOSSIER (SÉLECTEUR RAPIDE : NATIONALITÉ, FISC, MILITAIRE, DIPLÔME, FLN...) */}
                {(() => {
                  const otherDocDef = ADMINISTRATIVE_DOCUMENTS.find(d => d.key === selectedOtherDocKey) || ADMINISTRATIVE_DOCUMENTS[3];
                  const scan = attachedScans[selectedOtherDocKey];
                  const isConform = docStatuses[selectedOtherDocKey];
                  const isProcessing = processingDocKey === selectedOtherDocKey;

                  return (
                    <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                            {isAr ? 'وثيقة إدارية أخرى للملف:' : 'Autre document administratif du dossier :'}
                          </span>
                          <select
                            value={selectedOtherDocKey}
                            onChange={e => setSelectedOtherDocKey(e.target.value)}
                            className="text-xs font-bold text-emerald-950 bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs"
                          >
                            <option value="nationality_certificate">
                              {isAr ? 'شهادة الجنسية الجزائرية' : 'Certificat de nationalité'}
                            </option>
                            <option value="tax_clearance">
                              {isAr ? 'مستخرج جدول الضرائب (مصفى)' : 'Extrait de rôle fiscal (Apuré)'}
                            </option>
                            <option value="military_status">
                              {isAr ? 'الوضعية تجاه الخدمة الوطنية' : 'Situation militaire (Service national)'}
                            </option>
                            <option value="voter_card">
                              {isAr ? 'بطاقة الناخب (ANIE)' : 'Carte d\'électeur (ANIE)'}
                            </option>
                            <option value="diploma_cv">
                              {isAr ? 'الشهادة العلمية والسيرة الذاتية' : 'Diplôme universitaire & CV'}
                            </option>
                            <option value="party_card">
                              {isAr ? 'بطاقة المناضل لحزب FLN' : 'Carte de militant FLN'}
                            </option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          {isConform || scan ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {isAr ? 'هذه الوثيقة مرفقة' : 'Document joint'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-700">
                              {isAr ? 'غير مرفق بعد' : 'Non joint'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selected doc attachment preview */}
                      {scan && (
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            {scan.fileDataUrl && scan.fileType === 'image' ? (
                              <img
                                src={scan.fileDataUrl}
                                alt="Aperçu"
                                onClick={() => setPreviewModal({
                                  dataUrl: scan.fileDataUrl!,
                                  title: otherDocDef.nameFr,
                                  fileName: scan.fileName
                                })}
                                className="w-7 h-7 rounded object-cover border border-emerald-400 cursor-pointer shrink-0"
                              />
                            ) : (
                              <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <span className="font-semibold text-emerald-950 text-[11px] truncate block">
                                {scan.fileName || otherDocDef.nameFr}
                              </span>
                              {(scan.referenceNumber || scan.issueDate) && (
                                <span className="text-[10px] text-emerald-800 block">
                                  {scan.referenceNumber ? `Réf: ${scan.referenceNumber}` : ''} {scan.issueDate ? `(${scan.issueDate})` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {scan.fileDataUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewModal({
                                  dataUrl: scan.fileDataUrl!,
                                  title: otherDocDef.nameFr,
                                  fileName: scan.fileName
                                })}
                                className="p-1 rounded text-emerald-700 hover:bg-emerald-200"
                                title="Aperçu"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveFileOnly(selectedOtherDocKey)}
                              className="p-1 rounded text-rose-600 hover:bg-rose-100"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action buttons for other document */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => setCameraModalConfig({
                            isOpen: true,
                            docKey: selectedOtherDocKey,
                            titleFr: otherDocDef.nameFr,
                            titleAr: otherDocDef.nameAr,
                            defaultFacingMode: 'environment'
                          })}
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-600 transition-all cursor-pointer shadow-2xs"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-300" />
                          <span>{isAr ? 'أخذ صورة بالكاميرا' : 'Photo Caméra'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => docUploadRefs.current[selectedOtherDocKey]?.click()}
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-300 hover:bg-emerald-50 transition-all cursor-pointer shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{isAr ? 'إرفاق ملف (صورة / PDF / نص)' : 'Joindre Fichier (Photo, PDF, Texte)'}</span>
                        </button>
                        <input
                          ref={el => { docUploadRefs.current[selectedOtherDocKey] = el; }}
                          type="file"
                          accept=".pdf,image/*,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadFileForDoc(selectedOtherDocKey, f);
                            e.target.value = '';
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => setTextModalConfig({
                            isOpen: true,
                            docKey: selectedOtherDocKey,
                            titleFr: otherDocDef.nameFr,
                            titleAr: otherDocDef.nameAr,
                            initialReferenceNumber: scan?.referenceNumber,
                            initialIssueDate: scan?.issueDate,
                            initialNotes: scan?.notes
                          })}
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                        >
                          <PenLine className="w-3.5 h-3.5 text-blue-600" />
                          <span>{isAr ? 'تدوين نص / مرجع' : 'Saisir Texte / Réf'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Photo & Main Names Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {/* Photo Portrait Upload */}
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl bg-slate-200 border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center relative shadow-xs">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Portrait" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-60" />
                        <span className="text-[10px] block leading-tight font-medium">Photo officielle</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => portraitInputRef.current?.click()}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs"
                  >
                    <Camera className="w-3 h-3" />
                    <span>{photoUrl ? (isAr ? 'تغيير الصورة' : 'Changer') : (isAr ? 'إضافة صورة' : 'Photo')}</span>
                  </button>
                  <input
                    ref={portraitInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handlePortraitUpload(f);
                      e.target.value = '';
                    }}
                  />
                </div>

                {/* Identity Names Fields */}
                <div className="flex-1 w-full space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t.lastNameFr} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={lastNameFr}
                        onChange={e => setLastNameFr(e.target.value.toUpperCase())}
                        placeholder="EX: BELKACEMI"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t.firstNameFr} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={firstNameFr}
                        onChange={e => setFirstNameFr(e.target.value)}
                        placeholder="Ex: Amar"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-arabic" dir="rtl">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t.lastNameAr} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={lastNameAr}
                        onChange={e => setLastNameAr(e.target.value)}
                        placeholder="اللقب بالعربية (مثال: بلقاسمي)"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t.firstNameAr} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={firstNameAr}
                        onChange={e => setFirstNameAr(e.target.value)}
                        placeholder="الاسم بالعربية (مثال: عمار)"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Civil Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.gender} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={e => {
                      const newGender = e.target.value as Gender;
                      setGender(newGender);
                      if (newGender === 'F') setMilitaryStatus('non_concerne');
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="H">{isAr ? 'رجل (ذكر)' : 'Homme'}</option>
                    <option value="F">{isAr ? 'امرأة (أنثى)' : 'Femme'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.birthDate} (YYYY-MM-DD) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.birthPlace} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={birthPlace}
                    onChange={e => setBirthPlace(e.target.value)}
                    placeholder="Ex: Bologhine, Alger"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              {/* NIN & Neighborhood with Real-time Duplicate Detection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      {isAr ? 'الرقم التعريفي الوطني (NIN - 18 رقم)' : 'N° d\'Identification National (NIN)'} <span className="text-rose-500">*</span>
                    </label>

                    {/* Real-time Status Badge */}
                    {duplicateCandidate ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-300 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>{isAr ? 'تكرار مسجل !' : 'Doublon Détecté !'}</span>
                      </span>
                    ) : currentCleanNIN.length === 18 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{isAr ? 'NIN 18 رقم فريد' : 'NIN 18 ch. unique'}</span>
                      </span>
                    ) : currentCleanNIN.length >= 5 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        <span>{isAr ? `${currentCleanNIN.length}/18 رقم` : `${currentCleanNIN.length}/18 car.`}</span>
                      </span>
                    ) : null}
                  </div>

                  <div className="relative">
                    <CreditCard className={`w-4 h-4 absolute left-3 top-2.5 transition-colors ${
                      duplicateCandidate ? 'text-rose-500' : 'text-slate-400'
                    }`} />
                    <input
                      type="text"
                      maxLength={18}
                      value={nationalIdNumber}
                      onChange={e => setNationalIdNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ex: 119850116000000000"
                      className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border font-mono transition-all ${
                        duplicateCandidate
                          ? 'border-rose-500 bg-rose-50/70 text-rose-950 focus:ring-2 focus:ring-rose-500 ring-2 ring-rose-400/40 shadow-xs'
                          : currentCleanNIN.length === 18
                          ? 'border-emerald-500 bg-emerald-50/30 text-slate-900 focus:ring-2 focus:ring-emerald-600'
                          : 'border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-700'
                      }`}
                    />
                  </div>

                  {/* High-visibility Warning Box if Duplicate is Detected */}
                  {duplicateCandidate && (
                    <div className="mt-2 p-3 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 shadow-xs animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-200/90 text-rose-700 flex items-center justify-center shrink-0 border border-rose-300">
                          <ShieldAlert className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black tracking-wide text-rose-900 uppercase">
                              {isAr ? '⚠️ تنبيه قانوني: رقم بطاقة التعريف مسجل مسبقاً' : '⚠️ DOUBLON DÉTECTÉ : N° de carte d\'identité déjà attribué'}
                            </span>
                            <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded">
                              {isAr ? 'ترشح مكرر ممنوع' : 'Bloquant'}
                            </span>
                          </div>
                          
                          <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                            {isAr ? (
                              <>
                                الرقم <strong className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-rose-200">{nationalIdNumber}</strong> مسجل بالفعل في قاعدة بيانات Kasma بولوغين للمترشح:{' '}
                                <strong className="underline decoration-rose-500 font-bold">
                                  {duplicateCandidate.lastNameAr || duplicateCandidate.lastNameFr} {duplicateCandidate.firstNameAr || duplicateCandidate.firstNameFr}
                                </strong>{' '}
                                ({duplicateCandidate.council === 'APC' ? 'المجلس الشعبي البلدي بولوغين' : 'المجلس الشعبي الولائي الجزائر'}
                                {duplicateCandidate.listRank ? ` - الترتيب: ${duplicateCandidate.listRank}` : ''}).
                              </>
                            ) : (
                              <>
                                Le numéro <strong className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-rose-200">{nationalIdNumber}</strong> est déjà attribué au candidat :{' '}
                                <strong className="underline decoration-rose-500 font-bold">
                                  {duplicateCandidate.lastNameFr} {duplicateCandidate.firstNameFr}
                                </strong>{' '}
                                ({duplicateCandidate.council === 'APC' ? 'Liste APC Bologhine' : 'Liste APW Alger'}
                                {duplicateCandidate.listRank ? `, Rang N°${duplicateCandidate.listRank}` : ''}).
                              </>
                            )}
                          </p>

                          {/* Mini Details Card for Duplicate Candidate */}
                          <div className="mt-2 p-2 bg-white/95 rounded-lg border border-rose-200 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-[11px] shrink-0 border border-rose-300">
                                {duplicateCandidate.firstNameFr?.[0] || 'C'}
                              </div>
                              <div className="truncate">
                                <span className="font-bold text-slate-800">
                                  {duplicateCandidate.lastNameFr} {duplicateCandidate.firstNameFr}
                                </span>
                                <span className="text-slate-500 text-[11px] ml-1.5">
                                  • {duplicateCandidate.addressNeighborhood || 'Bologhine'}
                                  {duplicateCandidate.phoneNumber ? ` • 📞 ${duplicateCandidate.phoneNumber}` : ''}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setNationalIdNumber('')}
                              className="text-[11px] text-rose-700 hover:text-rose-900 font-bold underline shrink-0 cursor-pointer"
                            >
                              {isAr ? 'مسح الرقم' : 'Effacer'}
                            </button>
                          </div>

                          <p className="text-[10px] text-rose-700 mt-1.5 font-medium">
                            {isAr 
                              ? 'يرجى مراجعة رقم بطاقة التعريف أو تعديل ملف المترشح المسجل لتجنب إلغاء القائمة من قبل المندوبية.' 
                              : 'Conformément au code électoral, une double candidature avec le même numéro d\'identité entraîne le rejet de la liste.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Positive Reassurance if Unique */}
                  {!duplicateCandidate && currentCleanNIN.length >= 9 && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {isAr 
                          ? `رقم بطاقة تعريف فريد (لا يوجد أي تكرار في قاعدة بيانات المترشحين)` 
                          : `N° de pièce d'identité unique : aucun doublon dans la base FLN Bologhine.`}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.addressNeighborhood} (Bologhine)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={addressNeighborhood}
                      onChange={e => setAddressNeighborhood(e.target.value)}
                      placeholder="Ex: Notre Dame d'Afrique, Bologhine"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.phoneNumber}
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="Ex: 0550 12 34 56"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Ex: candidat@kasma-bologhine.dz"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              {/* Quick Jump to Next Tab */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('candidacy')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <span>{isAr ? 'التالي: بيانات الترشح' : 'Suivant : Candidature & FLN'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CANDIDATURE & FLN */}
          {activeTab === 'candidacy' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Council & Ranking Banner */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-800" />
                  <span>{isAr ? 'الهيئة المنتخبة والرتبة الرسمية' : 'Conseil Électoral & Rang de Liste'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.council} <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCouncil('APC');
                          if (!isEditing && listRank === nextRankAPW) setListRank(nextRankAPC);
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          council === 'APC'
                            ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        APC Bologhine
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCouncil('APW');
                          if (!isEditing && listRank === nextRankAPC) setListRank(nextRankAPW);
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          council === 'APW'
                            ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        APW Alger
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isAr ? 'الرقم الترتيبي الممنوح من الإدارة' : 'N° d\'Ordre Officiel (Attribué par l\'Admin)'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={listRank ?? ''}
                      onChange={e => {
                        const v = e.target.value ? parseInt(e.target.value, 10) : null;
                        setListRank(v);
                      }}
                      placeholder="Laisser vide si non encore classé"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-700"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {isAr ? '1 = متصدر القائمة الرسمي' : 'Ex: 1 = Tête de liste officielle'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profession & Education */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.profession} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profession}
                    onChange={e => setProfession(e.target.value)}
                    placeholder="Ex: Ingénieur en informatique"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.educationLevel}
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={educationLevel}
                      onChange={e => {
                        const lvl = e.target.value;
                        setEducationLevel(lvl);
                        setIsUniversityGraduate(['Licence', 'Master', 'Doctorat', 'Ingénieur', 'Magistère'].includes(lvl));
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700"
                    >
                      <option value="Doctorat">Doctorat (دكتوراه)</option>
                      <option value="Master">Master / Magister (ماستر)</option>
                      <option value="Ingénieur">Ingénieur d'État (مهندس دولة)</option>
                      <option value="Licence">Licence (ليسانس)</option>
                      <option value="TS / DEUA">TS / Technicien Supérieur</option>
                      <option value="Secondaire">Secondaire / Baccalauréat</option>
                      <option value="Autre">Autre niveau</option>
                    </select>

                    <label className="flex items-center gap-1.5 text-xs text-slate-700 whitespace-nowrap cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={isUniversityGraduate}
                        onChange={e => setIsUniversityGraduate(e.target.checked)}
                        className="rounded text-emerald-800 focus:ring-emerald-700 w-4 h-4"
                      />
                      <span>{isAr ? 'جامعي (Quota)' : 'Universitaire'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Militantisme FLN */}
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-3">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-800" />
                  <span>{isAr ? 'البيانات النضالية بحزب جبهة التحرير الوطني' : 'Données Militantes FLN (Kasma Bologhine)'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isAr ? 'رقم بطاقة الانخراط' : 'N° Carte Militant'}
                    </label>
                    <input
                      type="text"
                      value={partyMembershipNumber}
                      onChange={e => setPartyMembershipNumber(e.target.value)}
                      placeholder="FLN-BO-2024-..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isAr ? 'سنة الانخراط' : 'Année d\'Adhésion'}
                    </label>
                    <input
                      type="number"
                      min={1962}
                      max={new Date().getFullYear()}
                      value={partyJoinYear}
                      onChange={e => setPartyJoinYear(parseInt(e.target.value, 10) || 2018)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isAr ? 'الصفة أو المهمة بالحزب' : 'Fonction / Rôle Organique'}
                    </label>
                    <input
                      type="text"
                      value={partyRole}
                      onChange={e => setPartyRole(e.target.value)}
                      placeholder="Militant de Kasma, Responsable de cellule..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Service Militaire & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.militaryStatus}
                  </label>
                  <select
                    value={militaryStatus}
                    onChange={e => setMilitaryStatus(e.target.value as MilitaryStatus)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="accompli">{isAr ? 'أدى الخدمة الوطنية (شهادة أداء)' : 'Accompli (Certificat)'}</option>
                    <option value="dispense">{isAr ? 'معفى بموجب إجراءات قانونية' : 'Dispensé'}</option>
                    <option value="exempte">{isAr ? 'معفى لأسباب طبية / كفالة' : 'Exempté (Médical / Soutien de famille)'}</option>
                    <option value="sursis">{isAr ? 'تأجيل نظامي ساري المفعول' : 'Sursis régulier en cours'}</option>
                    <option value="non_concerne">{isAr ? 'غير معني (إناث)' : 'Non concerné(e)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'ملاحظات إدارية' : 'Notes & Observations Administratives'}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Observations particulières..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              {/* Tab Navigation Buttons */}
              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('identity')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isAr ? 'السابق: الحالة المدنية' : 'Précédent : État Civil'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('documents')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <span>{isAr ? 'التالي: الوثائق الإدارية الـ 11' : 'Suivant : Les 11 Pièces Administratives'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: LES 11 PIÈCES ADMINISTRATIVES (UPLOAD / DOWNLOAD WORD / OCR) */}
          {activeTab === 'documents' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* Compliance Overview Bar */}
              <div className="bg-gradient-to-r from-slate-50 to-emerald-50/70 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {isAr ? 'نسبة اكتمال الوثائق الرسمية:' : 'Conformité des 11 pièces électorales :'}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      {conformDocsCount} / {ADMINISTRATIVE_DOCUMENTS.length} ({conformPercentage}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full sm:w-56 h-2 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className={`h-full transition-all duration-300 ${conformPercentage === 100 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                      style={{ width: `${conformPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleAllDocs(true)}
                    className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    {isAr ? 'تحديد الكل كمطابق' : 'Tout cocher conforme'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAllDocs(false)}
                    className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    {isAr ? 'إلغاء التحديد' : 'Décocher'}
                  </button>
                </div>
              </div>

              {/* List of 11 Documents */}
              <div className="space-y-3">
                {ADMINISTRATIVE_DOCUMENTS.map((docDef, idx) => {
                  const isChecked = !!docStatuses[docDef.key];
                  const scan = attachedScans[docDef.key];
                  const isProcessing = processingDocKey === docDef.key;
                  const isWord = scan?.fileType === 'word' || scan?.fileName?.endsWith('.doc') || scan?.fileName?.endsWith('.docx');
                  const isPdf = scan?.fileType === 'pdf' || scan?.fileName?.endsWith('.pdf');

                  return (
                    <div
                      key={docDef.key}
                      className={`rounded-xl border transition-all p-3.5 ${
                        isChecked
                          ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Document Header Line */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                        
                        {/* Title & Checkbox */}
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleDoc(docDef.key)}
                            className="text-emerald-800 mt-0.5 shrink-0 hover:scale-105 transition-transform cursor-pointer"
                            title={isChecked ? 'Marquer non conforme' : 'Marquer conforme'}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-emerald-700" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-400" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-extrabold text-slate-900">
                                {idx + 1}. {docDef.nameFr}
                              </span>
                              <span className="text-xs text-slate-500 font-arabic font-normal">
                                ({docDef.nameAr})
                              </span>
                              {docDef.criticality === 'critical' && (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                                  {isAr ? 'إجباري' : 'Obligatoire'}
                                </span>
                              )}
                              {isChecked && (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                  <Check className="w-3 h-3" />
                                  <span>{isAr ? 'مطابق' : 'Conforme'}</span>
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {isAr ? docDef.descriptionAr : docDef.descriptionFr}
                            </p>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {isAr ? 'الصلاحية: ' : 'Validité : '}{isAr ? docDef.validityAr : docDef.validityFr}
                            </span>
                          </div>
                        </div>

                        {/* Action Toolbar for this Document - 4 Flexible Options: Live Camera Photo, File (Photo/PDF), Text/Reference Note, Word Model */}
                        <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center gap-1.5 mt-2.5 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 shrink-0">
                          
                          {/* 1. 📸 Prendre Photo en Direct par Caméra / Webcam */}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => {
                              setCameraModalConfig({
                                isOpen: true,
                                docKey: docDef.key,
                                titleFr: docDef.nameFr,
                                titleAr: docDef.nameAr,
                                defaultFacingMode: docDef.key === 'photos' ? 'user' : 'environment',
                                isPortrait: docDef.key === 'photos',
                              });
                            }}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-900 transition-all cursor-pointer shadow-xs disabled:opacity-50 text-center truncate"
                            title={isAr ? 'التقاط صورة للوثيقة مباشرة بالكاميرا' : 'Prendre une photo directe du document avec la caméra'}
                          >
                            <Camera className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                            <span className="truncate">{isAr ? 'كاميرا' : 'Photo'}</span>
                          </button>

                          {/* 2. 📁 Importer Fichier (Photo ou PDF ou Word) */}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => docUploadRefs.current[docDef.key]?.click()}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs text-center truncate"
                            title={isAr ? 'إرفاق ملف صورة (JPG/PNG) أو مستند PDF' : 'Joindre un fichier Photo (JPG/PNG) ou document PDF'}
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                            <span className="truncate">{isAr ? 'ملف (PDF/صورة)' : 'Fichier / PDF'}</span>
                          </button>
                          <input
                            ref={el => { docUploadRefs.current[docDef.key] = el; }}
                            type="file"
                            accept=".pdf,image/*,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadFileForDoc(docDef.key, f);
                              e.target.value = '';
                            }}
                          />

                          {/* 3. ✍️ Saisie de Texte / Référence officielle */}
                          <button
                            type="button"
                            onClick={() => {
                              setTextModalConfig({
                                isOpen: true,
                                docKey: docDef.key,
                                titleFr: docDef.nameFr,
                                titleAr: docDef.nameAr,
                                initialReferenceNumber: scan?.referenceNumber,
                                initialIssueDate: scan?.issueDate,
                                initialNotes: scan?.notes,
                              });
                            }}
                            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs text-center truncate ${
                              scan?.referenceNumber || scan?.notes
                                ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-amber-50 hover:text-amber-800'
                            }`}
                            title={isAr ? 'كتابة نص توضيحي أو إدخال رقم تسجيل وتاريخ الوثيقة' : 'Saisir du texte, un numéro de référence ou une date de délivrance'}
                          >
                            <PenLine className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">
                              {scan?.referenceNumber || scan?.notes
                                ? (isAr ? 'تعديل النص' : 'Réf / Texte')
                                : (isAr ? 'نص / مرجع' : 'Texte / Réf')}
                            </span>
                          </button>

                          {/* 4. 📥 Télécharger le modèle officiel Word (.doc) */}
                          <button
                            type="button"
                            onClick={() => {
                              downloadOfficialModelWord(
                                docDef.key, 
                                docDef.nameFr, 
                                docDef.nameAr, 
                                { 
                                  lastNameFr, 
                                  firstNameFr, 
                                  lastNameAr, 
                                  firstNameAr, 
                                  birthDate, 
                                  birthPlace, 
                                  nationalIdNumber, 
                                  council, 
                                  listRank, 
                                  profession 
                                }
                              );
                            }}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold bg-slate-50 text-slate-700 border border-slate-300 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs text-center truncate"
                            title={isAr ? 'تحميل نموذج رسمي فارغ بصيغة Word' : 'Télécharger le modèle officiel Word (.doc) pré-rempli'}
                          >
                            <Download className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span className="truncate">{isAr ? 'نموذج' : 'Modèle'}</span>
                          </button>
                        </div>
                      </div>

                      {/* 1. Attached File Card Banner (Photo or PDF or Word) */}
                      {scan?.fileDataUrl && (
                        <div className="mt-2.5 pt-2 border-t border-emerald-200/70 flex items-center justify-between gap-2 bg-emerald-100/50 p-2 rounded-lg text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            {isWord ? (
                              <span className="px-1.5 py-0.5 rounded bg-blue-700 text-white text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                                <FileCode className="w-3 h-3" />
                                DOCX
                              </span>
                            ) : isPdf ? (
                              <span className="px-1.5 py-0.5 rounded bg-rose-700 text-white text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                                <FileText className="w-3 h-3" />
                                PDF
                              </span>
                            ) : (
                              <div 
                                className="relative group cursor-pointer shrink-0"
                                onClick={() => setPreviewModal({
                                  dataUrl: scan.fileDataUrl!,
                                  title: `${docDef.nameFr} (${docDef.nameAr})`,
                                  fileName: scan.fileName,
                                })}
                                title={isAr ? 'اضغط لتكبير الصورة' : 'Cliquer pour agrandir la photo'}
                              >
                                <img
                                  src={scan.fileDataUrl}
                                  alt="Aperçu document"
                                  className="w-8 h-8 rounded-md object-cover border border-emerald-500 hover:opacity-90 shadow-2xs"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 rounded-md flex items-center justify-center transition-opacity">
                                  <Maximize2 className="w-3 h-3 text-white" />
                                </div>
                              </div>
                            )}

                            <div className="min-w-0">
                              <span className="font-semibold text-emerald-950 truncate block text-[11px]">
                                {scan.fileName || 'document_joint'}
                              </span>
                              <span className="text-[10px] text-emerald-800">
                                {formatFileSize(scan.fileSize)} • {isAr ? 'ملف مرفق بالملف' : 'Fichier joint'}
                                {scan.scannedAt && ` (${new Date(scan.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => downloadDocumentFile(scan.fileDataUrl!, scan.fileName || `${docDef.key}.file`)}
                              className="p-1 rounded text-emerald-800 hover:text-emerald-950 hover:bg-emerald-200 transition-colors"
                              title={isAr ? 'تحميل الملف' : 'Télécharger'}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFileOnly(docDef.key)}
                              className="p-1 rounded text-rose-600 hover:text-rose-800 hover:bg-rose-100 transition-colors"
                              title={isAr ? 'حذف هذا الملف فقط' : 'Supprimer ce fichier uniquement'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 2. Textual Reference & Notes Banner */}
                      {(scan?.referenceNumber || scan?.notes || scan?.issueDate) && (
                        <div className="mt-2 pt-1.5 border-t border-amber-200/60 flex items-start justify-between gap-2 bg-amber-50/80 p-2 rounded-lg text-xs">
                          <div className="flex items-start gap-2 min-w-0">
                            <FileSignature className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div className="min-w-0 text-[11px] space-y-0.5">
                              {scan.referenceNumber && (
                                <div className="font-bold text-amber-950 flex items-center gap-1">
                                  <span>{isAr ? 'الرقم المرجعي:' : 'Réf / N° :'}</span>
                                  <span className="font-mono bg-white px-1.5 py-0.2 rounded border border-amber-300">
                                    {scan.referenceNumber}
                                  </span>
                                </div>
                              )}
                              {scan.issueDate && (
                                <div className="text-amber-900 text-[10px]">
                                  {isAr ? 'تاريخ الإصدار: ' : 'Délivré le : '}{scan.issueDate}
                                </div>
                              )}
                              {scan.notes && (
                                <p className="text-amber-900/90 text-[10px] italic leading-tight">
                                  "{scan.notes}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setTextModalConfig({
                                  isOpen: true,
                                  docKey: docDef.key,
                                  titleFr: docDef.nameFr,
                                  titleAr: docDef.nameAr,
                                  initialReferenceNumber: scan.referenceNumber,
                                  initialIssueDate: scan.issueDate,
                                  initialNotes: scan.notes,
                                });
                              }}
                              className="p-1 rounded text-amber-800 hover:text-amber-950 hover:bg-amber-200 transition-colors"
                              title={isAr ? 'تعديل البيانات النصية' : 'Modifier les mentions textuelles'}
                            >
                              <PenLine className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveTextNote(docDef.key)}
                              className="p-1 rounded text-rose-600 hover:text-rose-800 hover:bg-rose-100 transition-colors"
                              title={isAr ? 'حذف هذا البيان النصي' : 'Supprimer cette mention'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tab Navigation Buttons */}
              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('candidacy')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{isAr ? 'السابق: بيانات الترشح' : 'Précédent : Candidature'}</span>
                </button>

                <button
                  type="button"
                  disabled={!!duplicateCandidate}
                  onClick={e => handleSubmit(e as any)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md"
                  title={duplicateCandidate ? (isAr ? 'يرجى تصحيح رقم بطاقة التعريف المكرر للمتابعة' : 'Veuillez corriger le doublon de carte d\'identité avant d\'enregistrer') : undefined}
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>{isAr ? 'حفظ المترشح والملف' : 'Enregistrer le Candidat'}</span>
                </button>
              </div>
            </div>
          )}

        </form>

        {/* Modal Sticky Footer - Guaranteed Reachable on Mobile Phones */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 shadow-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>

          <div className="flex items-center gap-2">
            {duplicateCandidate && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-rose-700 bg-rose-100/90 border border-rose-300 px-2.5 py-1 rounded-lg font-bold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{isAr ? 'تكرار رقم بطاقة التعريف' : 'Doublon NIN détecté'}</span>
              </div>
            )}

            {activeTab !== 'documents' ? (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'identity') setActiveTab('candidacy');
                  else if (activeTab === 'candidacy') setActiveTab('documents');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors cursor-pointer"
              >
                <span>{isAr ? 'متابعة' : 'Continuer'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}

            <button
              type="submit"
              form="candidate-form"
              disabled={!!duplicateCandidate}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              title={duplicateCandidate ? (isAr ? 'يرجى تصحيح رقم بطاقة التعريف المكرر للمتابعة' : 'Veuillez corriger le doublon de carte d\'identité avant d\'enregistrer') : undefined}
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{isAr ? 'حفظ ملف المترشح' : 'Enregistrer le Candidat'}</span>
              <span className="text-[10px] font-extrabold bg-emerald-700 px-1.5 py-0.2 rounded ml-0.5 text-amber-300">
                {conformDocsCount}/11
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Live Camera Photo Capture Modal */}
      <CameraCaptureModal
        isOpen={cameraModalConfig.isOpen}
        onClose={() => setCameraModalConfig(prev => ({ ...prev, isOpen: false }))}
        onCapture={handleCameraCapture}
        titleFr={cameraModalConfig.titleFr}
        titleAr={cameraModalConfig.titleAr}
        documentKey={cameraModalConfig.docKey}
        defaultFacingMode={cameraModalConfig.defaultFacingMode}
        isPortrait={cameraModalConfig.isPortrait}
        language={language}
      />

      {/* Manual Document Text / References Modal */}
      <DocumentTextModal
        isOpen={textModalConfig.isOpen}
        onClose={() => setTextModalConfig(prev => ({ ...prev, isOpen: false }))}
        onSave={(k, data) => handleSaveDocumentText(k, data)}
        docKey={textModalConfig.docKey}
        titleFr={textModalConfig.titleFr}
        titleAr={textModalConfig.titleAr}
        initialReferenceNumber={textModalConfig.initialReferenceNumber}
        initialIssueDate={textModalConfig.initialIssueDate}
        initialNotes={textModalConfig.initialNotes}
        language={language}
      />

      {/* Image Fullscreen Preview Modal */}
      {previewModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewModal(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="min-w-0">
                <h4 className="text-sm font-bold truncate">{previewModal.title}</h4>
                {previewModal.fileName && (
                  <span className="text-xs text-slate-400 truncate block font-mono">
                    {previewModal.fileName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => downloadDocumentFile(previewModal.dataUrl, previewModal.fileName || 'document.jpg')}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Télécharger l'image"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModal(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-950 p-4 flex items-center justify-center overflow-auto">
              <img
                src={previewModal.dataUrl}
                alt="Aperçu document"
                className="max-w-full max-h-[70vh] object-contain rounded-lg border border-slate-800 shadow-lg"
              />
            </div>
            <div className="p-3 bg-slate-900 text-slate-400 text-xs flex items-center justify-between">
              <span>{isAr ? 'معاينة الصورة عالية الجودة' : 'Aperçu haute résolution'}</span>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
