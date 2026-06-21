import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, Phone, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      await register(formData.name, formData.email, formData.password, formData.mobile);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Kolam Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[var(--secondary)] opacity-5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] rounded-full bg-[var(--primary)] opacity-5 blur-3xl pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-10 relative overflow-hidden rounded-3xl shadow-2xl my-8">
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--secondary)]/20 to-transparent rounded-tr-3xl"></div>

          {/* Header */}
          <div className="text-center mb-10">
            <motion.h1
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-4xl font-bold text-[var(--primary)] mb-2 font-tamil tracking-wide"
            >
              Moi Kanakku
            </motion.h1>
            <p className="text-[var(--text)] opacity-60 text-sm mt-2 uppercase tracking-widest font-semibold">{t('auth.createYourAccount')}</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3"
            >
              <AlertCircle size={20} className="text-[var(--error)] flex-shrink-0 mt-0.5" />
              <p className="text-[var(--error)] text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest">
                {t('auth.fullName')}
              </label>
              <div className="relative group">
                <User size={18} className="absolute left-4 top-3.5 text-[var(--primary)]/60 group-focus-within:text-[var(--primary)] transition-colors" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('auth.namePlaceholder')}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/50 border border-[var(--primary)]/20 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[var(--secondary)]/50 focus:border-[var(--secondary)] transition-all shadow-sm font-medium text-[var(--text)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest">
                {t('auth.emailAddress')}
              </label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-3.5 text-[var(--primary)]/60 group-focus-within:text-[var(--primary)] transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('auth.emailPlaceholder')}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/50 border border-[var(--primary)]/20 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[var(--secondary)]/50 focus:border-[var(--secondary)] transition-all shadow-sm font-medium text-[var(--text)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest">
                {t('auth.password')}
              </label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-3.5 text-[var(--primary)]/60 group-focus-within:text-[var(--primary)] transition-colors" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/50 border border-[var(--primary)]/20 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[var(--secondary)]/50 focus:border-[var(--secondary)] transition-all shadow-sm font-medium text-[var(--text)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest">
                {t('auth.mobileOptional')}
              </label>
              <div className="relative group">
                <Phone size={18} className="absolute left-4 top-3.5 text-[var(--primary)]/60 group-focus-within:text-[var(--primary)] transition-colors" />
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder={t('auth.mobilePlaceholder')}
                  className="w-full pl-12 pr-4 py-3 bg-white/50 border border-[var(--primary)]/20 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[var(--secondary)]/50 focus:border-[var(--secondary)] transition-all shadow-sm font-medium text-[var(--text)]"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-primary text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl tracking-wide mt-6"
            >
              {loading ? t('auth.creatingAccount') : t('auth.createAccountBtn')}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[var(--text)] opacity-60 font-medium">{t('auth.alreadyHaveAccount')}</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-[var(--primary)] hover:text-[var(--secondary)] font-bold transition-colors"
            >
              {t('auth.signInToYourAccount')}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
