import { ExtractedDocumentData, Gender, MilitaryStatus } from '../types';

/**
 * Parses raw text extracted from Word documents (.docx, .doc), text files (.txt),
 * or pasted text into structured candidate fields.
 */
export function parseCandidateText(rawText: string): ExtractedDocumentData {
  const result: ExtractedDocumentData = {};
  if (!rawText || typeof rawText !== 'string') return result;

  const text = rawText.trim();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. National Identification Number (NIN - 18 digits in Algeria)
  const ninMatch = text.match(/\b(19\d{16}|20\d{16}|\d{18})\b/);
  if (ninMatch) {
    result.nationalIdNumber = ninMatch[1];
  } else {
    // Try relaxed NIN pattern with spaces or dashes: 1985 1601 00...
    const relaxedNin = text.match(/(?:NIN|N\.I\.N|National|الهوية|التعريفي)[\s:=-]+([0-9\s-]{18,22})/i);
    if (relaxedNin) {
      const cleanDigits = relaxedNin[1].replace(/[\s-]/g, '');
      if (cleanDigits.length === 18) {
        result.nationalIdNumber = cleanDigits;
      }
    }
  }

  // 2. Phone number (Algerian 10 digits: 05, 06, 07, 021 or +213...)
  const phoneMatch = text.match(/(?:\+213|00213|0)(?:5|6|7|21|23)\s*[0-9]{2}\s*[0-9]{2}\s*[0-9]{2}\s*[0-9]{2}/);
  if (phoneMatch) {
    let clean = phoneMatch[0].replace(/[\s-]/g, '');
    if (clean.startsWith('+213')) clean = '0' + clean.slice(4);
    if (clean.startsWith('00213')) clean = '0' + clean.slice(5);
    result.phoneNumber = clean;
  }

  // 3. Email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  if (emailMatch) {
    result.email = emailMatch[0].toLowerCase();
  }

  // 4. Date of birth (YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY)
  const dateOfBirthMatch = text.match(/(?:naissance|né\(e\)\s*le|تاريخ\s*الميلاد|ازدياد)[\s:=-]+([0-9]{1,2}[\/\.-][0-9]{1,2}[\/\.-][0-9]{4}|[0-9]{4}[\/\.-][0-9]{1,2}[\/\.-][0-9]{1,2})/i);
  if (dateOfBirthMatch) {
    const rawDate = dateOfBirthMatch[1].replace(/\./g, '/').replace(/-/g, '/');
    const parts = rawDate.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        result.birthDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        // DD/MM/YYYY
        result.birthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }

  // 5. Gender
  if (/(?:sexe|الجنس)[\s:=-]+(?:F|Femme|Féminin|أنثى|انثى)/i.test(text) || /\b(?:Mme|Mademoiselle|السيدة|الآنسة)\b/i.test(text)) {
    result.gender = 'F' as Gender;
  } else if (/(?:sexe|الجنس)[\s:=-]+(?:M|H|Homme|Masculin|ذكر)/i.test(text) || /\b(?:Monsieur|M\.|السيد)\b/i.test(text)) {
    result.gender = 'H' as Gender;
  }

  // 6. Military status
  if (/(?:accompli|أدى|مؤدى|بطاقة\s*الخدمة)/i.test(text)) {
    result.militaryStatus = 'accompli' as MilitaryStatus;
  } else if (/(?:dispens[ée]|إعفاء|معفى)/i.test(text)) {
    result.militaryStatus = 'dispense' as MilitaryStatus;
  } else if (/(?:exempt[ée]|معفى\s*طبي)/i.test(text)) {
    result.militaryStatus = 'exempte' as MilitaryStatus;
  } else if (/(?:sursis|تأجيل)/i.test(text)) {
    result.militaryStatus = 'sursis' as MilitaryStatus;
  } else if (result.gender === 'F') {
    result.militaryStatus = 'non_concerne' as MilitaryStatus;
  }

  // 7. Education Level & University Graduate
  if (/doctorat|دكتوراه/i.test(text)) {
    result.educationLevel = 'Doctorat';
    result.isUniversityGraduate = true;
  } else if (/master|ingénieur|magister|ماستر|مهندس/i.test(text)) {
    result.educationLevel = 'Master/Ingénieur';
    result.isUniversityGraduate = true;
  } else if (/licence|جامعي|ليسانس/i.test(text)) {
    result.educationLevel = 'Licence';
    result.isUniversityGraduate = true;
  } else if (/technicien|ts|تقني/i.test(text)) {
    result.educationLevel = 'Technicien Supérieur';
    result.isUniversityGraduate = false;
  } else if (/baccalauréat|bac|ثانوي|بكالوريا/i.test(text)) {
    result.educationLevel = 'Secondaire (Bac)';
    result.isUniversityGraduate = false;
  }

  // 8. Key-value line inspection for names, place of birth, FLN card, profession, neighborhood
  for (const line of lines) {
    // Nom français
    const lastNameFrMatch = line.match(/^(?:Nom|Nom\s*de\s*famille|Nom\s*\(français\)|Nom\s*\(FR\))[\s:=-]+(.+)$/i);
    if (lastNameFrMatch && !result.lastNameFr) {
      result.lastNameFr = lastNameFrMatch[1].trim().toUpperCase();
    }

    // Prénom français
    const firstNameFrMatch = line.match(/^(?:Prénom|Prénoms|Prénom\s*\(français\)|Prénom\s*\(FR\))[\s:=-]+(.+)$/i);
    if (firstNameFrMatch && !result.firstNameFr) {
      result.firstNameFr = firstNameFrMatch[1].trim();
    }

    // Nom arabe
    const lastNameArMatch = line.match(/^(?:اللقب|اللقب\s*بالعربية|لقب)[\s:=-]+(.+)$/);
    if (lastNameArMatch && !result.lastNameAr) {
      result.lastNameAr = lastNameArMatch[1].trim();
    }

    // Prénom arabe
    const firstNameArMatch = line.match(/^(?:الاسم|الاسم\s*بالعربية|اسم)[\s:=-]+(.+)$/);
    if (firstNameArMatch && !result.firstNameAr) {
      result.firstNameAr = firstNameArMatch[1].trim();
    }

    // Lieu de naissance
    const birthPlaceMatch = line.match(/^(?:Lieu\s*de\s*naissance|Lieu|مكان\s*الميلاد|مكان\s*الازدياد)[\s:=-]+(.+)$/i);
    if (birthPlaceMatch && !result.birthPlace) {
      result.birthPlace = birthPlaceMatch[1].trim();
    }

    // Profession
    const profMatch = line.match(/^(?:Profession|Fonction|Métier|المهنة|الوظيفة)[\s:=-]+(.+)$/i);
    if (profMatch && !result.profession) {
      result.profession = profMatch[1].trim();
    }

    // Adresse / Quartier à Bologhine
    const addrMatch = line.match(/^(?:Adresse|Quartier|Résidence|العنوان|حي\s*الإقامة|الحي)[\s:=-]+(.+)$/i);
    if (addrMatch && !result.addressNeighborhood) {
      result.addressNeighborhood = addrMatch[1].trim();
    }

    // N° Adhésion FLN
    const flnMatch = line.match(/(?:FLN|militant|adhésion|بطاقة\s*مناضل|رقم\s*الانخراط)[\s:=-]+([A-Z0-9\/-]{5,25})/i);
    if (flnMatch && !result.partyMembershipNumber) {
      result.partyMembershipNumber = flnMatch[1].trim();
    }

    // Année d'adhésion FLN
    const flnYearMatch = line.match(/(?:adhésion|انخراط|depuis|depuis\s*l'année)[\s:=-]+(19[6-9][0-9]|20[0-2][0-9])/i);
    if (flnYearMatch && !result.partyJoinYear) {
      result.partyJoinYear = parseInt(flnYearMatch[1], 10);
    }

    // Council (APC ou APW)
    if (/\b(?:APW|المجلس\s*الشعبي\s*الولائي)\b/i.test(line)) {
      result.council = 'APW';
    } else if (/\b(?:APC|المجلس\s*الشعبي\s*البلدي|بلدية\s*بولوغين)\b/i.test(line)) {
      result.council = 'APC';
    }
  }

  // 9. Fallback search for Arabic full name if not caught line-by-line
  if (!result.lastNameAr || !result.firstNameAr) {
    const arabicNameBlock = text.match(/(?:السيد|السيدة|المترشح|المترشحة|المناضل|المناضلة)\s+([\u0621-\u064A\s]{4,35})/);
    if (arabicNameBlock) {
      const parts = arabicNameBlock[1].trim().split(/\s+/);
      if (parts.length >= 2) {
        if (!result.firstNameAr) result.firstNameAr = parts[0];
        if (!result.lastNameAr) result.lastNameAr = parts.slice(1).join(' ');
      }
    }
  }

  // 10. Neighborhood fallback for Bologhine
  if (!result.addressNeighborhood) {
    const bologneQuarters = [
      "Notre Dame d'Afrique",
      "Ibn Ziri",
      "ابن الزيري",
      "Malakoff",
      "La Vigie",
      "Les Deux Moulins",
      "Cité Ali Amrane",
      "Plateau Laperlier",
      "Bab El Oued",
      "Bologhine Centre",
      "سيدة إفريقيا",
      "ابن الزيري",
      "مالاكوف",
      "بولوغين المركز"
    ];
    for (const q of bologneQuarters) {
      if (text.toLowerCase().includes(q.toLowerCase())) {
        result.addressNeighborhood = q;
        break;
      }
    }
  }

  return result;
}
