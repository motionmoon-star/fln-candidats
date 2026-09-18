import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

// Increase payload limit for scanned documents and camera photos (base64)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// =========================================================================
// BASE DE DONNÉES JSON (persistante sur serveur, partagée entre appareils)
// Fichier : <racine>/base/candidats.db.json
// =========================================================================
const DB_DIR = path.join(process.cwd(), "base");
const DB_FILE = path.join(DB_DIR, "candidats.db.json");

function readDbFile(): { candidates: any[] } {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.candidates)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Erreur de lecture de la base de données:", error);
  }
  return { candidates: [] };
}

function writeDbFile(data: { candidates: any[] }): void {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const tmpFile = DB_FILE + ".tmp";
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmpFile, DB_FILE);
}

function requireDbKey(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const configuredKey = process.env.DB_ADMIN_KEY;
  if (!configuredKey) return next();
  const provided = req.header("x-db-key");
  if (provided !== configuredKey) {
    res.status(403).json({ success: false, error: "Clé d'administration base de données invalide" });
    return;
  }
  next();
}

app.get("/api/db/candidates", (_req, res) => {
  try {
    const db = readDbFile();
    res.json({ success: true, candidates: db.candidates });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || "Erreur de lecture de la base" });
  }
});

app.put("/api/db/candidates", requireDbKey, (req, res) => {
  try {
    const { candidates } = req.body || {};
    if (!Array.isArray(candidates)) {
      return res.status(400).json({ success: false, error: "Format invalide : 'candidates' doit être une liste" });
    }
    writeDbFile({ candidates });
    res.json({ success: true, count: candidates.length, updatedAt: new Date().toISOString() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || "Erreur d'enregistrement dans la base" });
  }
});

// Lazy getter for Google GenAI client to handle optional or missing key gracefully
function getGeminiClient(): GoogleGenAI | null {
  const rawKey = process.env.GEMINI_API_KEY;
  const apiKey = (rawKey || "").trim();
  // Accept any non-placeholder key of plausible length (AIza... API keys or AQ... tokens).
  if (
    apiKey.length < 20 ||
    /COLLEZ|VOTRE_CLE|YOUR_API|MY_GEMINI|PASTE_|CHANGE_ME|PLACEHOLDER/i.test(apiKey)
  ) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Document OCR & Data Extraction Endpoint
app.post("/api/extract-document", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", documentHint, textContent } = req.body;

    if (!imageBase64 && !textContent) {
      return res.status(400).json({
        success: false,
        error: "Aucun document (image, PDF ou texte) fourni pour l'analyse",
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        success: false,
        error:
          "Clé GEMINI_API_KEY non configurée sur le serveur. " +
          "Créez un fichier .env contenant GEMINI_API_KEY=votre_cle (https://aistudio.google.com/apikey) puis redémarrez le serveur.",
        code: "GEMINI_API_KEY_MISSING",
      });
    }

    const systemInstruction = `Tu es un expert assermenté en vérification administrative et transcription de documents d'identité et dossiers électoraux pour la République Algérienne Démocratique et Populaire (Kasma FLN Bologhine, Mouhafadha de Bab El Oued).
Tu analyses des photos prises par smartphone, scans, documents Word ou formulaires officiels :
- Carte Nationale d'Identité Biométrique (CNI / بطاقة التعريف الوطنية البيومترية)
- Extrait / Acte de naissance N° 12-kh (عقد الميلاد)
- Certificat de nationalité algérienne (شهادة الجنسية الجزائرية)
- Casier judiciaire Bulletin N° 3 (صحيفة السوابق القضائية)
- Diplôme d'études supérieures ou attestation universitaire (الشهادة الجامعية)
- Attestation de situation vis-à-vis du Service National (بطاقة الخدمة الوطنية / إعفاء / تأجيل)
- Carte d'adhérent / militant FLN (بطاقة مناضل حزب جبهة التحرير الوطني)
- Certificat de résidence ou attestation de régularité fiscale (شهادة الإقامة / الوضعية الجبائية)

Tâche :
1. Détecte le type précis de document.
2. Extrais fidèlement toutes les données textuelles lisibles en français et en arabe.
3. Pour les dates, normalise toujours au format YYYY-MM-DD.
4. Pour le NIN (Numéro d'Identification National), cherche le numéro à 18 chiffres sur la CNI algérienne.
5. Extrais le nom de famille (en majuscules en français et en arabe) et les prénoms (français et arabe).
6. Identifie le niveau d'instruction et la profession mentionnée si applicable.
7. Si une information n'est pas lisible ou absente du document, laisse la chaîne vide "" ou null. Ne fabrique pas de fausse information.`;

    const promptText = `Analyse ce document officiel algérien.${
      documentHint ? ` Indice sur le document attendu : ${documentHint}.` : ""
    } Extrais les informations nécessaires pour constituer la fiche du candidat et renseigner les champs administratifs.`;

    const contentsPayload: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
      // If PDF or image, use inlineData
      const effectiveMime = mimeType === 'application/pdf' ? 'application/pdf' : (mimeType.startsWith('image/') ? mimeType : 'image/jpeg');
      contentsPayload.push({
        inlineData: {
          mimeType: effectiveMime,
          data: cleanBase64,
        },
      });
    }
    if (textContent) {
      contentsPayload.push({
        text: `Contenu textuel extrait du document (Word/texte) :\n${textContent}`,
      });
    }
    contentsPayload.push({
      text: promptText,
    });

    let responseText = "{}";
    // Try several models: each has its own free-tier quota, so retrying on
    // a different model often succeeds when one model's quota is exhausted.
    // gemini-3.8-flash is tried twice (503 "high demand" is usually transient);
    // gemini-flash-lite-latest remains available on the free tier when the
    // main flash quota is used up.
    const modelsToTry = [
      "gemini-3.8-flash",
      "gemini-flash-latest",
      "gemini-flash-lite-latest",
      "gemini-3.8-flash",
      "gemini-2.5-flash",
      "gemini-1.5-flash",
    ];
    let lastError: any = null;
    let sawQuotaError = false;
    let sawOverloadError = false;

    // Guard against model calls that hang (no response) by racing with a timeout.
    const withCallTimeout = (promise: Promise<any>, ms: number) =>
      new Promise<any>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Modèle non disponible (délai dépassé)")), ms);
        promise.then(
          (value) => {
            clearTimeout(timer);
            resolve(value);
          },
          (err) => {
            clearTimeout(timer);
            reject(err);
          }
        );
      });

    for (const modelCandidate of modelsToTry) {
      try {
        const response = await withCallTimeout(ai.models.generateContent({
          model: modelCandidate,
          contents: contentsPayload,
          config: {
            systemInstruction,
            temperature: 0.1, // Basse température pour une extraction factuelle rigoureuse
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                documentTypeDetected: {
                  type: Type.STRING,
                  description: "Type de document identifié (ex: CNI, Acte de Naissance, Diplôme Universitaire, Casier Judiciaire, Service National, etc.)",
                },
                lastNameFr: {
                  type: Type.STRING,
                  description: "Nom de famille en français (ex: BENALI)",
                },
                firstNameFr: {
                  type: Type.STRING,
                  description: "Prénom en français (ex: Mohamed)",
                },
                lastNameAr: {
                  type: Type.STRING,
                  description: "Nom de famille en arabe (ex: بن علي)",
                },
                firstNameAr: {
                  type: Type.STRING,
                  description: "Prénom en arabe (ex: محمد)",
                },
                gender: {
                  type: Type.STRING,
                  description: "'H' pour Homme (Masculin / ذكر) ou 'F' pour Femme (Féminin / أنثى)",
                },
                birthDate: {
                  type: Type.STRING,
                  description: "Date de naissance au format YYYY-MM-DD",
                },
                birthPlace: {
                  type: Type.STRING,
                  description: "Lieu de naissance (ex: Bologhine, Alger, Bab El Oued)",
                },
                nationalIdNumber: {
                  type: Type.STRING,
                  description: "Numéro d'Identification National (NIN à 18 chiffres) ou numéro de carte",
                },
                addressNeighborhood: {
                  type: Type.STRING,
                  description: "Quartier ou adresse de résidence si mentionnée (ex: Notre Dame d'Afrique, Bologhine)",
                },
                phoneNumber: {
                  type: Type.STRING,
                  description: "Numéro de téléphone du candidat si présent (ex: 0550123456)",
                },
                email: {
                  type: Type.STRING,
                  description: "Adresse email du candidat si mentionnée",
                },
                profession: {
                  type: Type.STRING,
                  description: "Profession ou fonction mentionnée sur le document",
                },
                educationLevel: {
                  type: Type.STRING,
                  description: "Niveau d'instruction (Doctorat, Master/Ingénieur, Licence, Technicien, Secondaire)",
                },
                isUniversityGraduate: {
                  type: Type.BOOLEAN,
                  description: "Vrai si titulaire d'un diplôme d'études supérieures (Licence, Master, Ingénieur, Doctorat)",
                },
                council: {
                  type: Type.STRING,
                  description: "Conseil électoral si mentionné: 'APC' pour APC Bologhine ou 'APW' pour APW Alger",
                },
                partyMembershipNumber: {
                  type: Type.STRING,
                  description: "Numéro de carte de militant FLN si carte du parti ou mentionné",
                },
                partyJoinYear: {
                  type: Type.INTEGER,
                  description: "Année d'adhésion au FLN (ex: 2018)",
                },
                partyRole: {
                  type: Type.STRING,
                  description: "Rôle dans le parti ou kasma FLN",
                },
                militaryStatus: {
                  type: Type.STRING,
                  description: "Situation service national: 'accompli', 'dispense', 'exempte', 'sursis', 'non_concerne'",
                },
                confidenceNotes: {
                  type: Type.STRING,
                  description: "Remarque sur la clarté de la photo/scan et remarques d'authenticité",
                },
              },
              required: ["documentTypeDetected"],
            },
          },
        }), 12000);

        responseText = response.text?.trim() || "{}";
        lastError = null;
        break; // Succès !
      } catch (err: any) {
        lastError = err;
        const rawMsg = String(err?.message || "");
        console.warn(`Tentative OCR échouée avec ${modelCandidate}:`, err?.message || err);
        if (/429|quota|RESOURCE_EXHAUSTED|rate.limit/i.test(rawMsg)) sawQuotaError = true;
        if (/503|high demand|surcharge|busy/i.test(rawMsg)) sawOverloadError = true;
        const isQuotaErr = sawQuotaError;
        const isTimeoutErr = /délai dépassé|ECONNRESET|ETIMEDOUT|fetch failed/i.test(rawMsg);
        // Wait only briefly on transient server errors; quota/timeout issues need no delay.
        if (!isQuotaErr && !isTimeoutErr && !sawOverloadError) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
      }
    }

    if (lastError && responseText === "{}") {
      const isQuota = sawQuotaError;
      const isOverloaded = sawOverloadError;
      if (isQuota) {
        return res.status(429).json({
          success: false,
          code: "GEMINI_QUOTA_EXCEEDED",
          error:
            "Quota d'extraction Gemini dépassé (offre gratuite : 20 requêtes/jour/projet). " +
            "Réessayez plus tard, utilisez une autre clé GEMINI_API_KEY ou activez la facturation. " +
            "الحد المجاني لاستخراج Gemini بلغ الحد الأقصى (20 طلبا/يوم/مشروع). أعد المحاولة لاحقا أو استعمل مفتاحا آخر.",
        });
      }
      if (isOverloaded) {
        return res.status(503).json({
          success: false,
          code: "GEMINI_OVERLOADED",
          error:
            "Le modèle Gemini est temporairement saturé (forte demande). Merci de réessayer dans quelques minutes. " +
            "نموذج Gemini مشبع مؤقتا بسبب الطلب المرتفع. أعد المحاولة بعد بضع دقائق.",
        });
      }
      throw lastError;
    }

    const parsedData = JSON.parse(responseText);

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Erreur d'analyse OCR du document:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Erreur lors de l'extraction des données du document",
    });
  }
});

// Logo management endpoints
app.post("/api/save-logo", (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "Image manquante" });
    }
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    const assetsDir = path.join(process.cwd(), "public", "assets");
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    const targetPath = path.join(assetsDir, "fln-bologhine-logo.png");
    fs.writeFileSync(targetPath, buffer);

    return res.json({ success: true, path: "/assets/fln-bologhine-logo.png" });
  } catch (error: any) {
    console.error("Erreur enregistrement logo:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/logo-status", (_req, res) => {
  const customLogoPath = path.join(process.cwd(), "public", "assets", "fln-bologhine-logo.png");
  const hasCustomLogo = fs.existsSync(customLogoPath);
  res.json({
    hasCustomPng: hasCustomLogo,
    pngUrl: hasCustomLogo ? "/assets/fln-bologhine-logo.png" : null,
    svgUrl: "/assets/fln-bologhine-logo.svg"
  });
});

// Vite middleware and static serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur Kasma FLN Bologhine démarré sur http://0.0.0.0:${PORT}`);
    const keyPresent = getGeminiClient() !== null;
    console.log(`OCR / extraction de données Gemini : ${keyPresent ? "ACTIVÉ (GEMINI_API_KEY présente)" : "DÉSACTIVÉ (GEMINI_API_KEY manquante - ajoutez-la au fichier .env)"}`);
    console.log(`Base de données candidates : ${DB_FILE}`);
  });
}

start();
