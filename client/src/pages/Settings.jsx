import React, { useContext, useState } from 'react';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Lock, User, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Settings = () => {
  const { t } = useLanguage();
  const { user } = useContext(AuthContext);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.put('/auth/profile', profileForm);
      setSuccess(t('settings.profileUpdated'));
    } catch (err) {
      setError(err.response?.data?.message || t('settings.errorUpdatingProfile'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError(t('settings.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setSuccess(t('settings.passwordChanged'));
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || t('settings.errorChangingPassword'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-2xl">
        <h1 className="text-4xl font-bold text-amber-900">{t('settings.title')}</h1>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Profile Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-900">
          <div className="flex items-center space-x-3 mb-6">
            <User size={28} className="text-amber-900" />
            <h2 className="text-2xl font-bold text-amber-900">{t('settings.profileSettings')}</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                {t('settings.fullName')}
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                {t('settings.mobileNumber')}
              </label>
              <input
                type="tel"
                value={profileForm.mobile}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, mobile: e.target.value })
                }
                className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                {t('settings.emailAddress')}
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-amber-300 rounded-lg bg-amber-50 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('settings.emailCannotBeChanged')}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('settings.saving') : t('settings.saveChanges')}
            </button>
          </form>
        </div>

        {/* Password Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-600">
          <div className="flex items-center space-x-3 mb-6">
            <Lock size={28} className="text-red-600" />
            <h2 className="text-2xl font-bold text-amber-900">{t('settings.changePassword')}</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                {t('settings.currentPassword')}
              </label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    oldPassword: e.target.value,
                  })
                }
                required
                className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                {t('settings.newPassword')}
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                required
                className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-amber-900 mb-2">
                {t('settings.confirmNewPassword')}
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                required
                className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('settings.updating') : t('settings.changePassword')}
            </button>
          </form>
        </div>

        {/* Additional Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-900">
          <h2 className="text-2xl font-bold text-amber-900 mb-6">{t('settings.about')}</h2>
          <div className="space-y-4 text-amber-700">
            <p>
              <span className="font-semibold">{t('settings.application')}</span> Moi Kanakku
            </p>
            <p>
              <span className="font-semibold">{t('settings.version')}</span> 1.0.0
            </p>
            <p>
              <span className="font-semibold">{t('settings.tagline')}</span> {t('settings.taglineText')}
            </p>
            <p className="text-sm">
              {t('settings.description')}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
