import React, { useState } from 'react';
import { AdminUser, Language } from '../types';
import { changeAdminPassword, updateAdminProfile } from '../utils/authUtils';
import { 
  X, 
  ShieldCheck, 
  KeyRound, 
  User, 
  Building2, 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  LogOut,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

interface AdminProfileModalProps {
  admin: AdminUser;
  language: Language;
  onClose: () => void;
  onLogout: () => void;
  onUpdateAdmin: (updated: AdminUser) => void;
  onToast: (message: string) => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  admin,
  language,
  onClose,
  onLogout,
  onUpdateAdmin,
  onToast,
}) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form state
  const [fullName, setFullName] = useState(admin.fullName);
  const [email, setEmail] = useState(admin.email);

  // Security / Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateAdminProfile(admin.username, { fullName, email });
    if (res.success && res.updatedUser) {
      onUpdateAdmin(res.updatedUser);
      onToast(isAr ? 'تم تحديث بيانات المسؤول بنجاح' : 'Profil administrateur mis à jour');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg(isAr ? 'كلمتا المرور الجديدتان غير متطابقتين' : 'Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg(isAr ? 'يجب أن تتكون كلمة المرور من 4 أحرف على الأقل' : 'Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }

    const res = changeAdminPassword(admin.username, currentPassword, newPassword);
    if (res.success) {
      setSuccessMsg(isAr ? 'تم تغيير كلمة المرور بنجاح !' : 'Mot de passe modifié avec succès !');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onToast(isAr ? 'تم حفظ كلمة المرور الجديدة' : 'Nouveau mot de passe enregistré');
    } else {
      setErrorMsg(res.error || (isAr ? 'كلمة المرور الحالية غير صحيحة' : 'Mot de passe actuel incorrect'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Algerian ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-white to-red-600" />

        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isAr ? 'الملف الشخصي للمشرف وأمان الحساب' : 'Profil & Sécurité Administrateur'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? admin.roleTitleAr : admin.roleTitleFr} • {admin.kasma}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-5 pt-2 bg-slate-50/50 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{isAr ? 'بيانات الحساب' : 'Informations du Compte'}</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isAr ? 'تغيير كلمة المرور' : 'Changer le Mot de Passe'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'profile' ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Account Card Badge */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-700 text-white font-bold text-sm flex items-center justify-center shadow-inner">
                    {admin.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {isAr ? admin.fullNameAr || admin.fullName : admin.fullName}
                    </div>
                    <div className="text-emerald-800 font-mono text-[11px] font-semibold">
                      @{admin.username}
                    </div>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-700 text-white shadow-2xs">
                  {isAr ? 'مشرف معتمد' : 'Admin Actif'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {isAr ? 'اسم المستخدم (Fixe)' : 'Nom d\'utilisateur'}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={admin.username}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {isAr ? 'الهيئة الحزبية' : 'Structure de rattachement'}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={admin.kasma}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isAr ? 'الاسم واللقب للمسؤول' : 'Nom complet & Fonction'}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isAr ? 'البريد الإلكتروني المهني' : 'Adresse Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 text-slate-800"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {isAr ? 'آخر تسجيل دخول :' : 'Dernière session :'} {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'En cours'}
                </span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition-colors cursor-pointer shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isAr ? 'حفظ التعديلات' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <p className="text-slate-500 leading-relaxed">
                {isAr
                  ? 'يمكنك هنا تغيير كلمة المرور المخصصة للوصول إلى واجهة المشرف لقسمة بولوغين.'
                  : 'Modifiez le mot de passe d\'accès au panneau d\'administration de la Kasma Bologhine.'}
              </p>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isAr ? 'كلمة المرور الحالية' : 'Mot de passe actuel'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isAr ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirmer le nouveau mot de passe'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-mono focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition-colors cursor-pointer shadow-sm"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isAr ? 'تحديث كلمة المرور' : 'Mettre à jour'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer with Logout Button */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-700 hover:bg-rose-100/80 rounded-lg font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isAr ? 'تسجيل الخروج من الجلسة' : 'Déconnexion'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Fermer'}
          </button>
        </div>

      </div>
    </div>
  );
};
