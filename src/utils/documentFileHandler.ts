import { ExtractedDocumentData } from '../types';
import mammoth from 'mammoth';

export interface ProcessedDocumentFile {
  dataUrl: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
  fileType: 'image' | 'word' | 'pdf' | 'other';
  rawText?: string;
}

/**
 * Extracts raw text from a Word (.docx, .doc) or plain text (.txt, .rtf) file.
 */
export async function extractTextFromWordOrTextFile(file: File): Promise<{ text: string; fileName: string; fileType: string }> {
  const fileName = file.name || 'document';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // 1. Modern Word (.docx)
  if (ext === 'docx') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value && result.value.trim().length > 0) {
        return { text: result.value.trim(), fileName, fileType: 'docx' };
      }
    } catch (err) {
      console.warn("Mammoth docx extraction error, falling back to buffer scanner:", err);
    }
  }

  // 2. Plain Text (.txt, .rtf, .csv)
  if (ext === 'txt' || ext === 'text' || ext === 'rtf' || ext === 'csv' || file.type.startsWith('text/')) {
    try {
      const text = await file.text();
      return { text: text.trim(), fileName, fileType: 'text' };
    } catch (err) {
      console.warn("Text file read error:", err);
    }
  }

  // 3. Legacy Word (.doc) or fallback binary extraction
  try {
    const arrayBuffer = await file.arrayBuffer();
    // First try UTF-8
    const decoderUtf8 = new TextDecoder('utf-8', { fatal: false });
    const textUtf8 = decoderUtf8.decode(arrayBuffer);
    
    // Also try UTF-16LE which Word .doc uses internally
    const decoderUtf16 = new TextDecoder('utf-16le', { fatal: false });
    const textUtf16 = decoderUtf16.decode(arrayBuffer);

    // Keep printable French and Arabic characters
    const cleanUtf8 = textUtf8.replace(/[^\x20-\x7E\u0600-\u06FF\n\r\t]/g, ' ').replace(/\s{2,}/g, ' ').trim();
    const cleanUtf16 = textUtf16.replace(/[^\x20-\x7E\u0600-\u06FF\n\r\t]/g, ' ').replace(/\s{2,}/g, ' ').trim();

    const bestText = cleanUtf8.length >= cleanUtf16.length ? cleanUtf8 : cleanUtf16;
    if (bestText.length > 20) {
      return { text: bestText, fileName, fileType: ext || 'doc' };
    }
  } catch (err) {
    console.warn("Binary fallback decode error:", err);
  }

  return { text: '', fileName, fileType: ext || 'other' };
}

/**
 * Handles processing of uploaded document files:
 * - Word documents (.docx, .doc) are parsed for full text via Mammoth and stored as DataURL
 * - Plain text files (.txt, .rtf) have text extracted and stored as DataURL
 * - Images (JPEG, PNG, WebP) are optimized and converted to base64 DataURL
 * - PDFs are stored as base64 DataURL with PDF metadata
 */
export async function processAnyDocumentFile(file: File): Promise<ProcessedDocumentFile> {
  const fileName = file.name || 'document';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const isWord = 
    ext === 'doc' || 
    ext === 'docx' || 
    file.type === 'application/msword' || 
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  const isText = ext === 'txt' || ext === 'text' || ext === 'rtf' || ext === 'csv' || file.type.startsWith('text/');
  const isPdf = ext === 'pdf' || file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext);

  // 1. Process Plain Text Files (.txt)
  if (isText) {
    let rawText = '';
    try {
      rawText = await file.text();
    } catch {
      rawText = '';
    }
    const dataUrl = await readFileAsDataUrl(file);
    return {
      dataUrl,
      mimeType: file.type || 'text/plain',
      fileName,
      fileSize: file.size,
      fileType: 'word',
      rawText: rawText.trim(),
    };
  }

  // 2. Process Word Documents (.docx, .doc)
  if (isWord) {
    const dataUrl = await readFileAsDataUrl(file);
    let rawText: string | undefined;

    try {
      const extracted = await extractTextFromWordOrTextFile(file);
      if (extracted.text) {
        rawText = extracted.text;
      }
    } catch (err) {
      console.warn("Erreur extraction texte Word:", err);
    }

    return {
      dataUrl,
      mimeType: file.type || (ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/msword'),
      fileName,
      fileSize: file.size,
      fileType: 'word',
      rawText,
    };
  }

  // 3. Process PDFs
  if (isPdf) {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      dataUrl,
      mimeType: 'application/pdf',
      fileName,
      fileSize: file.size,
      fileType: 'pdf',
    };
  }

  // 3. Process Images with optimization (max 1800px)
  if (isImage) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Impossible de lire l'image"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => {
          // Fallback if browser can't decode (e.g. some HEIC), keep raw base64
          resolve({
            dataUrl: reader.result as string,
            mimeType: file.type || 'image/jpeg',
            fileName,
            fileSize: file.size,
            fileType: 'image',
          });
        };
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const maxDimension = 1800;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              dataUrl: reader.result as string,
              mimeType: file.type || 'image/jpeg',
              fileName,
              fileSize: file.size,
              fileType: 'image',
            });
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(mime, 0.88);

          resolve({
            dataUrl: compressedDataUrl,
            mimeType: mime,
            fileName,
            fileSize: Math.round((compressedDataUrl.length * 3) / 4),
            fileType: 'image',
          });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  // 4. Default fallback for other file formats
  const dataUrl = await readFileAsDataUrl(file);
  return {
    dataUrl,
    mimeType: file.type || 'application/octet-stream',
    fileName,
    fileSize: file.size,
    fileType: 'other',
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

/**
 * Downloads a file directly to the user's device (phone or desktop)
 */
export function downloadDocumentFile(fileDataUrl: string, fileName: string): void {
  try {
    const link = document.createElement('a');
    link.href = fileDataUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Erreur lors du téléchargement du fichier:", err);
  }
}

/**
 * Downloads an official Microsoft Word (.doc) formatted template for any administrative document
 * Pre-filled with candidate and Kasma FLN Bologhine information.
 */
export function downloadOfficialModelWord(
  docKey: string,
  docNameFr: string,
  docNameAr: string,
  candidateInfo?: {
    lastNameFr?: string;
    firstNameFr?: string;
    lastNameAr?: string;
    firstNameAr?: string;
    birthDate?: string;
    birthPlace?: string;
    nationalIdNumber?: string;
    council?: string;
    listRank?: number | null;
    profession?: string;
  }
): void {
  const candNameFr = `${candidateInfo?.lastNameFr || ''} ${candidateInfo?.firstNameFr || ''}`.trim() || 'CANDIDAT';
  const candNameAr = `${candidateInfo?.lastNameAr || ''} ${candidateInfo?.firstNameAr || ''}`.trim() || 'المترشح';
  const councilLabel = candidateInfo?.council === 'APW' ? 'المجلس الشعبي الولائي للجزائر العاصمة (APW)' : 'المجلس الشعبي البلدي لبولوغين (APC)';
  const dateToday = new Date().toLocaleDateString('fr-DZ', { year: 'numeric', month: 'long', day: 'numeric' });

  // Specific content templates based on document type
  let specificBodyContent = '';

  switch (docKey) {
    case 'birth_certificate':
      specificBodyContent = `
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; margin-bottom: 20px;">
          <h3 style="color: #065f46; margin-top: 0;">طلب واستمارة مطابقة : شهادة الميلاد (عقد رقم 12-خ)</h3>
          <p><strong>Réf :</strong> Acte de Naissance N° 12-kh / Extrait du registre d'état civil</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr><td style="padding: 6px; border: 1px solid #e2e8f0; width: 40%;"><strong>Nom & Prénom (FR) :</strong></td><td style="padding: 6px; border: 1px solid #e2e8f0;">${candNameFr}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #e2e8f0;"><strong>الاسم واللقب (عربي) :</strong></td><td style="padding: 6px; border: 1px solid #e2e8f0;">${candNameAr}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #e2e8f0;"><strong>Date de naissance / تاريخ الميلاد :</strong></td><td style="padding: 6px; border: 1px solid #e2e8f0;">${candidateInfo?.birthDate || 'JJ/MM/AAAA'}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #e2e8f0;"><strong>Lieu de naissance / مكان الميلاد :</strong></td><td style="padding: 6px; border: 1px solid #e2e8f0;">${candidateInfo?.birthPlace || 'Bologhine, Alger'}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #e2e8f0;"><strong>N° Acte / رقم عقد الميلاد :</strong></td><td style="padding: 6px; border: 1px solid #e2e8f0;">...................................................</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #e2e8f0;"><strong>Commune d'enregistrement :</strong></td><td style="padding: 6px; border: 1px solid #e2e8f0;">Bologhine (Wilaya d'Alger)</td></tr>
          </table>
          <p style="margin-top: 15px; font-size: 11pt; line-height: 1.6;">
            Le soussigné certifie sur l'honneur l'exactitude des informations d'état civil ci-dessus mentionnées, conformes aux registres officiels de la République Algérienne Démocratique et Populaire.
          </p>
        </div>
      `;
      break;

    case 'identity_card':
      specificBodyContent = `
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; margin-bottom: 20px;">
          <h3 style="color: #065f46; margin-top: 0;">Fiche de Contrôle et Copie de la Carte Nationale d'Identité Biométrique (CNI)</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr><td style="padding: 6px; border: 1px solid #e2e8f0; width: 40%;"><strong>Titulaire :</strong></td><td style="padding: 6px; border: 1px solid #e2e8f0;">${candNameFr} (${candNameAr})</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #e2e8f0;"><strong>Numéro d'Identification National (NIN à 18 chiffres) :</strong></td><td style="padding: 6px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 12pt; font-weight: bold; color: #065f46;">${candidateInfo?.nationalIdNumber || '...................................................'}</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #e2e8f0;"><strong>Date de délivrance :</strong></td><td style="padding: 6px; border: 1px solid #e2e8f0;">...................................................</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #e2e8f0;"><strong>Date d'expiration :</strong></td><td style="padding: 6px; border: 1px solid #e2e8f0;">...................................................</td></tr>
            <tr><td style="padding: 6px; border: 1px solid #e2e8f0;"><strong>Autorité de délivrance :</strong></td><td style="padding: 6px; border: 1px solid #e2e8f0;">Daïra de Bab El Oued / Ministère de l'Intérieur</td></tr>
          </table>
          <div style="margin-top: 20px; border: 2px dashed #94a3b8; padding: 40px 20px; text-align: center; color: #64748b;">
            [ EMPLACEMENT COPIE RECTO-VERSO DE LA PIÈCE D'IDENTITÉ BIOMÉTRIQUE ]
          </div>
        </div>
      `;
      break;

    case 'police_record':
      specificBodyContent = `
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; margin-bottom: 20px;">
          <h3 style="color: #065f46; margin-top: 0;">Bordereau de Conformité du Casier Judiciaire (Bulletin N° 3)</h3>
          <p><strong>Tribunal de compétence :</strong> Tribunal de Bab El Oued (Cour d'Alger)</p>
          <p>Délivré sous le N° : ............................................... en date du : ........................................</p>
          <p style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 10px; color: #065f46; font-weight: bold;">
            MENTION : NÉANT (لا شيء) - Le candidat jouit de l'intégralité de ses droits civiques et politiques.
          </p>
        </div>
      `;
      break;

    default:
      specificBodyContent = `
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; margin-bottom: 20px;">
          <h3 style="color: #065f46; margin-top: 0;">Fiche Officielle : ${docNameFr}</h3>
          <h4 style="color: #334155; margin-top: 0;">${docNameAr}</h4>
          <p><strong>Candidat concerné :</strong> ${candNameFr} / ${candNameAr}</p>
          <p><strong>Circonscription :</strong> Kasma de Bologhine (Mouhafadha Bab El Oued)</p>
          <p><strong>Conseil :</strong> ${councilLabel}</p>
          <div style="margin-top: 25px; border: 2px dashed #94a3b8; padding: 40px 20px; text-align: center; color: #64748b;">
            [ PIÈCE ADMINISTRATIVE OFFICIELLE À JOINDRE AU DOSSIER ÉLECTORAL ]
          </div>
        </div>
      `;
      break;
  }

  // Generate Word Document HTML Content
  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${docNameFr} - FLN Bologhine</title>
        <style>
          body { font-family: 'Arial', 'Calibri', sans-serif; font-size: 11pt; color: #0f172a; margin: 25px; }
          .header { text-align: center; border-bottom: 2px solid #065f46; padding-bottom: 12px; margin-bottom: 20px; }
          .party-title { font-size: 14pt; font-weight: bold; color: #065f46; margin: 2px 0; }
          .party-arabic { font-size: 15pt; font-weight: bold; color: #065f46; margin: 2px 0; font-family: 'Cairo', 'Amiri', 'Arial', sans-serif; }
          .kasma { font-size: 11pt; font-weight: bold; color: #b45309; }
          .signatures { margin-top: 40px; display: table; width: 100%; }
          .sig-cell { display: table-cell; width: 50%; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <p style="margin: 0; font-size: 10pt; color: #475569;">RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE</p>
          <p style="margin: 0; font-size: 11pt; font-weight: bold; color: #475569;">الجمهورية الجزائرية الديمقراطية الشعبية</p>
          <div class="party-arabic">حزب جبهة التحرير الوطني</div>
          <div class="party-title">PARTI DU FRONT DE LIBÉRATION NATIONALE</div>
          <div class="kasma">مـحـافـظـة بـاب الـوادي • قـسـمـة بـولـوغـيـن</div>
          <p style="margin: 3px 0 0 0; font-size: 9.5pt; color: #64748b;">Mouhafadha de Bab El Oued • Kasma de Bologhine</p>
        </div>

        <div style="margin-bottom: 15px; font-size: 10pt; color: #475569;">
          <strong>Date d'édition :</strong> ${dateToday} | <strong>Dossier Électoral :</strong> Élections Locales APC/APW
        </div>

        ${specificBodyContent}

        <div class="signatures">
          <div class="sig-cell">
            <p><strong>Émargement du Candidat</strong><br><span style="font-size: 9pt; color: #64748b;">توقيع المعني</span></p>
            <br><br><br>
            <p><strong>${candNameFr}</strong></p>
          </div>
          <div class="sig-cell">
            <p><strong>Secrétaire de Kasma FLN Bologhine</strong><br><span style="font-size: 9pt; color: #64748b;">أمين قسمة بولوغين وتأشيرة الإدارة</span></p>
            <br><br><br>
            <p><strong>(Cachet et Signature)</strong></p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Create Blob with Word mime type
  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8',
  });

  const sanitizedDocName = docNameFr.replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedCandName = candNameFr.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Modele_FLN_${sanitizedDocName}_${sanitizedCandName}.doc`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
