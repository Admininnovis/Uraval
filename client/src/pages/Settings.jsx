import React, { useContext, useState } from 'react';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  User,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Mail,
  BookOpen,
  Info,
  Gavel
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LegalModal } from '../components/LegalModal';

const Settings = () => {
  const { t, language } = useLanguage();
  const { user } = useContext(AuthContext);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [legalModal, setLegalModal] = useState({ isOpen: false, type: 'privacy' });

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'S';

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setProfileLoading(true);

    try {
      await api.put('/auth/profile', profileForm);
      setSuccess(t('settings.profileUpdated') || 'Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || t('settings.errorUpdatingProfile') || 'Error updating profile');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <Layout>
      <div className="w-full space-y-3 sm:space-y-3.5 md:space-y-4 font-sans max-w-5xl mx-auto">
        
        {/* ======================================================== */}
        {/* 1. Header: Page Title & Account Identity Banner           */}
        {/* ======================================================== */}
        <section aria-label="Settings Header" className="bg-[#F7F3EB] border border-[#DDD1BF] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 md:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold text-[#B68A3D] uppercase font-sans leading-normal">
                {t('settings.accountPreferences')}
              </p>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#432C20] mt-0.5 leading-snug">
                {t('settings.title') || 'Settings'}
              </h1>
              <p className="text-stone-600 text-xs sm:text-sm mt-0.5 leading-normal">
                {t('settings.settingsSubtitle')}
              </p>
            </div>

            {/* Quick Profile Pill */}
            <div className="flex items-center gap-3 bg-[#EDE5D8]/70 border border-[#DDD1BF] rounded-xl px-3.5 py-2 shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#432C20] text-[#FAF7F0] flex items-center justify-center font-bold text-sm shadow-sm">
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm text-[#432C20] truncate">
                  {user?.name || t('settings.accountHolder')}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-stone-500 truncate">
                  <ShieldCheck size={12} className="text-[#B68A3D]" />
                  <span>{user?.email || ''}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* Alerts: Success & Error Feedback                          */}
        {/* ======================================================== */}
        {error && (
          <div className="p-3 sm:p-3.5 bg-[#FEECEC] border border-[#FCA5A5] rounded-xl flex items-start gap-2.5 text-[#C62828] text-xs sm:text-sm shadow-xs animate-in fade-in">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-[#C62828]" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 sm:p-3.5 bg-[#E8F8EC] border border-[#A3E6B4] rounded-xl flex items-start gap-2.5 text-[#2E7D32] text-xs sm:text-sm shadow-xs animate-in fade-in">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-[#2E7D32]" />
            <p className="font-medium">{success}</p>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. Main Content: Profile Settings                         */}
        {/* ======================================================== */}
        <div className="w-full">
          <section aria-label="Profile Settings" className="flex flex-col">
            <div className="bg-[#F7F3EB] border border-[#DDD1BF] rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
              <div>
                {/* Header */}
                <div className="flex items-center gap-2 mb-4 pb-2.5 border-b border-[#DDD1BF]/70">
                  <div className="w-8 h-8 rounded-lg bg-[#EDE5D8] flex items-center justify-center text-[#B68A3D]">
                    <User size={18} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-base sm:text-lg text-[#432C20]">
                      {t('settings.profileSettings') || 'Profile Settings'}
                    </h2>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                      {t('settings.fullName') || 'Full Name'} *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                        <User size={15} />
                      </div>
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#EDE5D8]/60 border border-[#DDD1BF] focus:border-[#B68A3D] focus:ring-2 focus:ring-[#B68A3D]/20 rounded-xl text-xs sm:text-sm outline-none text-[#432C20] transition-colors"
                        placeholder={t('settings.namePlaceholder')}
                      />
                    </div>
                  </div>

                  {/* Email Address (Read-only) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                        {t('settings.emailAddress') || 'Email Address'}
                      </label>
                      <span className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Lock size={10} />
                        <span>{t('settings.emailCannotBeChanged') || 'Cannot be changed'}</span>
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                        <Mail size={15} />
                      </div>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#EDE5D8]/90 border border-[#DDD1BF] rounded-xl text-xs sm:text-sm text-stone-600 cursor-not-allowed select-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="w-full sm:w-auto min-h-[42px] px-6 py-2 bg-[#432C20] hover:bg-[#322118] text-[#FAF7F0] rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow active:scale-[0.98] disabled:opacity-50"
                    >
                      {profileLoading ? (
                        <span>{t('settings.saving') || 'Saving...'}</span>
                      ) : (
                        <span>{t('settings.saveChanges') || 'Save Changes'}</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </div>

        {/* ======================================================== */}
        {/* 3. Bottom Section: About Moi Ledger Application           */}
        {/* ======================================================== */}
        <section aria-label="About Application" className="w-full">
          <div className="bg-[#F7F3EB] border border-[#DDD1BF] rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#DDD1BF]/60">
              <div className="w-7 h-7 rounded-lg bg-[#EDE5D8] flex items-center justify-center text-[#B68A3D]">
                <BookOpen size={16} strokeWidth={2.2} />
              </div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-[#432C20]">
                {t('settings.about') || 'About Moi Ledger'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-[#EDE5D8]/70 border border-[#DDD1BF] rounded-xl p-3">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500 font-sans">
                  {t('settings.application') || 'Application'}
                </p>
                <p className="font-serif font-bold text-sm sm:text-base text-[#432C20] mt-0.5">
                  Moi Ledger
                </p>
              </div>

              <div className="bg-[#EDE5D8]/70 border border-[#DDD1BF] rounded-xl p-3">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500 font-sans">
                  {t('settings.version') || 'Version'}
                </p>
                <p className="font-serif font-bold text-sm sm:text-base text-[#B68A3D] mt-0.5">
                  {t('settings.stableEdition')}
                </p>
              </div>

              <div className="bg-[#EDE5D8]/70 border border-[#DDD1BF] rounded-xl p-3">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-stone-500 font-sans">
                  {t('settings.tagline') || 'Tagline'}
                </p>
                <p className="font-serif font-bold text-xs sm:text-sm text-[#432C20] mt-0.5">
                  {t('settings.taglineText') || 'Traditional Records. Digital Management.'}
                </p>
              </div>
            </div>

            <div className="border-t border-[#DDD1BF]/60 mt-3.5 pt-3">
              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
                {t('settings.description') ||
                  'Uravin is a digital record management system designed specifically for Tamil families to maintain and track traditional Moi records.'}
              </p>
              <p className="text-[11px] text-stone-400 mt-2 font-serif italic text-right">
                {t('settings.quote')}
              </p>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 4. Legal & Privacy Policies                               */}
        {/* ======================================================== */}
        <section aria-label="Legal & Policies" className="w-full">
          <div className="bg-[#F7F3EB] border border-[#DDD1BF] rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#DDD1BF]/60">
              <div className="w-7 h-7 rounded-lg bg-[#EDE5D8] flex items-center justify-center text-[#B68A3D]">
                <ShieldCheck size={16} strokeWidth={2.2} />
              </div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-[#432C20]">
                {t('settings.legalAndPrivacy') || 'Legal & Policies'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}
                className="flex items-center justify-between p-3.5 bg-[#EDE5D8]/70 hover:bg-[#EDE5D8] border border-[#DDD1BF] rounded-xl text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#432C20]/10 rounded-lg text-[#432C20]">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="font-serif font-bold text-sm text-[#432C20]">
                      {t('settings.privacyPolicy') || 'Privacy Policy'}
                    </p>
                    <p className="text-xs text-stone-500">
                      How we protect your records and privacy
                    </p>
                  </div>
                </div>
                <span className="text-[#B68A3D] font-bold text-xs group-hover:translate-x-0.5 transition-transform">
                  &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLegalModal({ isOpen: true, type: 'terms' })}
                className="flex items-center justify-between p-3.5 bg-[#EDE5D8]/70 hover:bg-[#EDE5D8] border border-[#DDD1BF] rounded-xl text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#432C20]/10 rounded-lg text-[#432C20]">
                    <Gavel size={18} />
                  </div>
                  <div>
                    <p className="font-serif font-bold text-sm text-[#432C20]">
                      {t('settings.termsAndConditions') || 'Terms & Conditions'}
                    </p>
                    <p className="text-xs text-stone-500">
                      Terms of service and ledger usage guidelines
                    </p>
                  </div>
                </div>
                <span className="text-[#B68A3D] font-bold text-xs group-hover:translate-x-0.5 transition-transform">
                  &rarr;
                </span>
              </button>
            </div>
          </div>
        </section>

      </div>

      <LegalModal
        isOpen={legalModal.isOpen}
        type={legalModal.type}
        onClose={() => setLegalModal({ isOpen: false, type: 'privacy' })}
      />
    </Layout>
  );
};

export default Settings;
