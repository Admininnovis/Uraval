import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, AlertCircle, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { LegalModal } from '../components/LegalModal';
import vanakkamHandsImg from '../assets/moi-vanakkam-hands.png';
import heritageHeaderImg from '../assets/moi-heritage-header.png';
import uravinLogo from '../assets/uravin-logo.png';

const Register = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [legalModal, setLegalModal] = useState({ isOpen: false, type: 'privacy' });
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDE5D8] flex flex-col justify-center items-center p-3 sm:p-6 font-sans text-[#432C20] relative overflow-hidden">
      
      {/* Background Decorative Heritage Header Image */}
      <div className="absolute top-0 right-0 w-80 sm:w-[500px] md:w-[650px] opacity-15 pointer-events-none select-none overflow-hidden">
        <img
          src={heritageHeaderImg}
          alt=""
          className="w-full h-auto object-contain filter sepia-[0.3]"
        />
      </div>

      {/* Main Authentication Card styled exactly like Dashboard cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[440px] relative z-10 my-4"
      >
        <div className="bg-[#F7F3EB] border border-[#DDD1BF] rounded-2xl shadow-md p-6 sm:p-8 relative overflow-hidden">
          
          {/* Subtle Top Accent Line in Antique Gold */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#B68A3D] via-[#D4AF37] to-[#B68A3D]"></div>

          {/* Top Bar with Language Switcher */}
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#DDD1BF]/60 gap-2">
            <span className="text-xs sm:text-[14px] font-bold text-[#B68A3D] uppercase font-sans truncate">
              {language === 'ta' ? 'புதிய கணக்கு' : 'CREATE ACCOUNT'}
            </span>

            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EDE5D8] hover:bg-[#DDD1BF] text-[#432C20] text-xs sm:text-[14px] font-semibold transition-colors shrink-0"
              title="Toggle Language"
            >
              <Globe size={15} className="text-[#B68A3D]" />
              <span>{language === 'ta' ? 'English' : 'தமிழ்'}</span>
            </button>
          </div>

          {/* Header Branding */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <img
                src={uravinLogo}
                alt="Uravin Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-full border-2 border-[#B68A3D] shadow-md bg-[#FAF7F0] p-1"
              />
            </div>
            <div className="inline-flex items-center justify-center gap-2 mb-1">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#432C20]">
                Uravin
              </h1>
              <img
                src={vanakkamHandsImg}
                alt="Vanakkam"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain inline-block select-none"
              />
            </div>
            <p className="text-[#B68A3D] text-xs sm:text-[14px] font-bold uppercase mt-0.5">
              {language === 'ta' ? 'உறவின் • டிஜிட்டல் பதிவேடு' : 'Uravin • Digital Ledger'}
            </p>
            <p className="text-stone-600 text-xs sm:text-[14px] mt-1.5 font-sans leading-relaxed">
              {t('auth.createYourAccount')}
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2.5"
              >
                <AlertCircle size={17} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-[14px] font-medium leading-snug">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-[14px] font-bold text-stone-700 mb-1.5">
                {t('auth.fullName')} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('auth.namePlaceholder')}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#EDE5D8]/70 border border-[#DDD1BF] focus:border-[#B68A3D] focus:ring-2 focus:ring-[#B68A3D]/20 rounded-xl text-[14px] text-[#432C20] outline-none transition-colors placeholder-[#7A6553]/50"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[14px] font-bold text-stone-700 mb-1.5">
                {t('auth.emailAddress')} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('auth.emailPlaceholder')}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#EDE5D8]/70 border border-[#DDD1BF] focus:border-[#B68A3D] focus:ring-2 focus:ring-[#B68A3D]/20 rounded-xl text-[14px] text-[#432C20] outline-none transition-colors placeholder-[#7A6553]/50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[14px] font-bold text-stone-700 mb-1.5">
                {t('auth.password')} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#EDE5D8]/70 border border-[#DDD1BF] focus:border-[#B68A3D] focus:ring-2 focus:ring-[#B68A3D]/20 rounded-xl text-[14px] text-[#432C20] outline-none transition-colors placeholder-[#7A6553]/50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] py-2.5 px-4 bg-[#432C20] hover:bg-[#322118] text-[#FAF7F0] rounded-xl text-[14px] font-semibold shadow-md transition-all hover:shadow active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? t('auth.creatingAccount') : t('auth.createAccountBtn')}
              </button>
            </div>

            {/* Terms & Conditions and Privacy Policy notice */}
            <div className="pt-3 text-center text-[11.5px] text-stone-500 leading-relaxed">
              <span>{t('settings.byRegisteringAgree') || 'By creating an account, you agree to our'}{' '}</span>
              <button
                type="button"
                onClick={() => setLegalModal({ isOpen: true, type: 'terms' })}
                className="font-bold text-[#432C20] underline hover:text-[#B68A3D] transition-colors"
              >
                {t('settings.termsAndConditions') || 'Terms & Conditions'}
              </button>
              <span>{' '}{t('settings.and') || 'and'}{' '}</span>
              <button
                type="button"
                onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}
                className="font-bold text-[#432C20] underline hover:text-[#B68A3D] transition-colors"
              >
                {t('settings.privacyPolicy') || 'Privacy Policy'}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-6 pt-5 border-t border-[#DDD1BF]/70 text-center flex flex-wrap items-center justify-center gap-1.5 text-xs sm:text-[14px]">
            <span className="text-stone-600">
              {t('auth.alreadyHaveAccount')}{' '}
            </span>
            <Link
              to="/login"
              className="font-bold text-[#B68A3D] hover:text-[#8E6725] transition-colors underline"
            >
              {t('auth.signInToYourAccount')}
            </Link>
          </div>

        </div>
      </motion.div>

      <LegalModal
        isOpen={legalModal.isOpen}
        type={legalModal.type}
        onClose={() => setLegalModal({ isOpen: false, type: 'privacy' })}
      />
    </div>
  );
};

export default Register;
