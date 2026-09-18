import React from 'react';
import { Plus, Camera, ShieldCheck, Printer, Scale } from 'lucide-react';
import { Language } from '../data/translations';

interface MobileBottomNavProps {
  language: Language;
  onOpenAddModal: () => void;
  onOpenAiScanner?: () => void;
  onOpenNumberingManager: () => void;
  onPrintList: () => void;
  onOpenLegalGuide: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  language,
  onOpenAddModal,
  onOpenAiScanner,
  onOpenNumberingManager,
  onPrintList,
  onOpenLegalGuide,
}) => {
  const isAr = language === 'ar';

  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Navigation mobile principale"
      className="theme-surface md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-gold-500/50 shadow-[0_-16px_36px_-22px_rgba(3,29,20,0.85)] px-2 py-1.5 pb-safe"
      style={{ background: 'var(--nav-bg)' }}
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1">
        
        {/* 1. Scanner IA */}
        <button
          onClick={onOpenAiScanner}
          className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-gold-100/85 hover:text-gold-200 active:bg-white/10 transition-colors"
          title={isAr ? 'مسح بالهاتف / تصوير (IA)' : 'Scanner IA'}
        >
          <div className="w-9 h-9 rounded-xl bg-white/10 text-gold-300 flex items-center justify-center mb-0.5 border border-gold-500/40 shadow-2xs">
            <Camera className="w-4.5 h-4.5" />
          </div>
          <span className="text-[10px] font-semibold tracking-tight text-gold-100 truncate max-w-full">
            {isAr ? 'مسح IA' : 'Scanner'}
          </span>
        </button>

        {/* 2. Numérotation Admin */}
        <button
          onClick={onOpenNumberingManager}
          className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-gold-100/85 hover:text-gold-200 active:bg-white/10 transition-colors"
          title={isAr ? 'ترتيب القائمة الرسمية' : 'Numérotation des candidats'}
        >
          <div className="w-9 h-9 rounded-xl bg-gold-100 text-gold-900 flex items-center justify-center mb-0.5 border border-gold-300 shadow-2xs">
            <ShieldCheck className="w-4.5 h-4.5 text-gold-800" />
          </div>
          <span className="text-[10px] font-semibold tracking-tight text-gold-100 truncate max-w-full">
            {isAr ? 'الترتيب' : 'Ordre'}
          </span>
        </button>

        {/* 3. Primary Center Action: Add Candidate */}
        <div className="flex flex-col items-center justify-center -mt-4">
          <button
            onClick={onOpenAddModal}
            className="w-13 h-13 rounded-full text-fln-950 flex items-center justify-center shadow-[0_14px_30px_-10px_rgba(201,162,76,0.8)] border-2 border-gold-100 active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(180deg,#d9bc7f,#c9a24c)' }}
            title={isAr ? 'إضافة مترشح جديد' : 'Nouveau Candidat'}
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
          <span className="text-[10px] font-bold text-gold-200 mt-0.5">
            {isAr ? '+ مترشح' : '+ Candidat'}
          </span>
        </div>

        {/* 4. Imprimer Liste */}
        <button
          onClick={onPrintList}
          className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-gold-100/85 hover:text-gold-200 active:bg-white/10 transition-colors"
          title={isAr ? 'طباعة القائمة الرسمية' : 'Imprimer la liste'}
        >
          <div className="w-9 h-9 rounded-xl bg-white/10 text-blue-200 flex items-center justify-center mb-0.5 border border-gold-500/40 shadow-2xs">
            <Printer className="w-4.5 h-4.5 text-blue-200" />
          </div>
          <span className="text-[10px] font-semibold tracking-tight text-gold-100 truncate max-w-full">
            {isAr ? 'طباعة' : 'Imprimer'}
          </span>
        </button>

        {/* 5. Guide ANIE */}
        <button
          onClick={onOpenLegalGuide}
          className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-gold-100/85 hover:text-gold-200 active:bg-white/10 transition-colors"
          title={isAr ? 'شروط وقوانين الترشح ANIE' : 'Conditions Légales ANIE'}
        >
          <div className="w-9 h-9 rounded-xl bg-white/10 text-gold-200 flex items-center justify-center mb-0.5 border border-gold-500/40 shadow-2xs">
            <Scale className="w-4.5 h-4.5 text-gold-300" />
          </div>
          <span className="text-[10px] font-semibold tracking-tight text-gold-100 truncate max-w-full">
            {isAr ? 'الشروط' : 'Lois'}
          </span>
        </button>

      </div>
    </nav>
  );
};