import { ExtractedDocumentData } from '../types';

/**
 * Detects whether a scan/extraction failure is caused by a missing GEMINI_API_KEY,
 * so the UI can show setup instructions instead of a cryptic server error.
 */
export function isGeminiKeyMissing(err: any): boolean {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : String(err?.message || err?.error || '');
  return msg.includes('GEMINI_API_KEY') || msg.includes('NON_CONFIGUR');
}

/**
 * Detects whether a scan/extraction failure is caused by an exhausted Gemini quota
 * (free tier is 20 requests/day/project) or a temporarily overloaded/saturated model.
 */
export function isGeminiQuotaExceeded(err: any): boolean {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : String(err?.message || err?.error || '');
  return /quota|429|RESOURCE_EXHAUSTED|limit|503|satur|high demand|surcharge|réessayer/i.test(msg) && !isGeminiKeyMissing(err);
}

/**
 * Resizes an image file/blob to a maximum dimension while maintaining aspect ratio,
 * producing a clean base64 data URL suitable for OCR extraction and local storage.
 */
export async function processAndOptimizeImage(file: File, maxDimension = 1800): Promise<{
  dataUrl: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire le fichier image sélectionné."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Format d'image non valide."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

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
            fileName: file.name,
            fileSize: file.size,
          });
          return;
        }

        // Draw and compress slightly to keep storage light and snappy
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.88);
        resolve({
          dataUrl,
          mimeType,
          fileName: file.name,
          fileSize: Math.round((dataUrl.length * 3) / 4),
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Sends a photographed or scanned document to the server for Gemini OCR analysis.
 */
export async function scanDocumentWithAI(
  dataUrl?: string,
  mimeType = 'image/jpeg',
  documentHint?: string,
  textContent?: string
): Promise<ExtractedDocumentData> {
  try {
    const response = await fetch('/api/extract-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: dataUrl,
        mimeType,
        documentHint,
        textContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur serveur (${response.status})`);
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.error || "Échec de l'extraction des données.");
    }

    return result.data as ExtractedDocumentData;
  } catch (err: any) {
    console.warn("Échec de l'extraction serveur:", err);
    throw err;
  }
}
