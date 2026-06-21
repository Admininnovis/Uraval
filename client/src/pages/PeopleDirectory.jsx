import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { Plus, Trash2, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const PeopleDirectory = () => {
  const { t, language } = useLanguage();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    village: '',
    mobile: '',
    notes: '',
  });

  useEffect(() => {
    fetchPeople();
  }, [search]);

  const fetchPeople = async () => {
    try {
      const response = await api.get('/people', {
        params: { search, limit: 50 },
      });
      setPeople(response.data.people);
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePerson = async (e) => {
    e.preventDefault();
    try {
      await api.post('/people', formData);
      setFormData({
        name: '',
        village: '',
        mobile: '',
        notes: '',
      });
      setShowForm(false);
      fetchPeople();
    } catch (error) {
      console.error('Error creating person:', error);
      alert(t('peopleDirectory.errorCreating'));
    }
  };

  const handleDeletePerson = async (personId) => {
    if (window.confirm(t('peopleDirectory.deleteConfirm'))) {
      try {
        await api.delete(`/people/${personId}`);
        fetchPeople();
      } catch (error) {
        console.error('Error deleting person:', error);
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-900 border-t-amber-400"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-amber-900">{t('peopleDirectory.title')}</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 px-6 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-950 transition-colors"
          >
            <Plus size={20} />
            <span>{t('peopleDirectory.addPerson')}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={20} className="absolute left-4 top-3 text-amber-700" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('peopleDirectory.searchPlaceholder')}
            className="w-full pl-12 pr-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-900"
          />
        </div>

        {/* Create Person Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-900">
            <h2 className="text-2xl font-bold text-amber-900 mb-6">{t('peopleDirectory.addNewPerson')}</h2>
            <form onSubmit={handleCreatePerson} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-2">
                    {t('peopleDirectory.name')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-2">
                    {t('peopleDirectory.village')}
                  </label>
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) =>
                      setFormData({ ...formData, village: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-amber-900 mb-2">
                    {t('peopleDirectory.mobile')}
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) =>
                      setFormData({ ...formData, mobile: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-amber-900 mb-2">
                  {t('peopleDirectory.notes')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows="2"
                  className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-900"
                ></textarea>
              </div>
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-950 transition-colors"
                >
                  {t('peopleDirectory.addPerson')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  {t('peopleDirectory.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* People Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {people.length > 0 ? (
            people.map((person) => {
              const balance = person.totalReceived - person.totalReturned;
              const status =
                balance > 0
                  ? { label: t('peopleDirectory.needToReturn'), color: 'text-red-600', bg: 'bg-red-50' }
                  : balance < 0
                  ? { label: t('peopleDirectory.needToReceive'), color: 'text-blue-600', bg: 'bg-blue-50' }
                  : { label: t('peopleDirectory.settled'), color: 'text-green-600', bg: 'bg-green-50' };

              return (
                <div
                  key={person._id}
                  className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-900 hover:shadow-xl transition-shadow"
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-amber-900">
                        {person.name}
                      </h3>
                      <p className="text-sm text-amber-600">{person.village}</p>
                      {person.mobile && (
                        <p className="text-sm text-gray-600">{person.mobile}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t-2 border-amber-100 pt-4">
                      <div>
                        <p className="text-xs text-amber-600 font-semibold">
                          {t('peopleDirectory.received')}
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          ₹{person.totalReceived?.toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-600 font-semibold">
                          {t('peopleDirectory.returned')}
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          ₹{person.totalReturned?.toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className={`${status.bg} rounded-lg p-3 ${status.color}`}>
                      <p className="text-xs font-semibold mb-1">{status.label}</p>
                      <p className="text-2xl font-bold">
                        ₹{Math.abs(balance)?.toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                      </p>
                    </div>

                    <div className="flex space-x-2 pt-4 border-t-2 border-amber-100">
                      <button
                        onClick={() => handleDeletePerson(person._id)}
                        className="flex-1 flex items-center justify-center space-x-2 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                        <span>{t('peopleDirectory.deleteBtn')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 text-amber-600">
              <p className="text-lg">
                {search
                  ? t('peopleDirectory.noSearchMatch')
                  : t('peopleDirectory.noPeopleYet')}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PeopleDirectory;
