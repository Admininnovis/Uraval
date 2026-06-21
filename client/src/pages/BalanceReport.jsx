import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { AlertCircle, Download } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const BalanceReport = () => {
  const { t, language } = useLanguage();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('return');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const response = await api.get('/reports/balance');
      setReport(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    const headers = ['Name', 'Village', 'Amount', 'Last Transaction'];
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        [
          `"${row.name}"`,
          `"${row.village}"`,
          row.amount,
          new Date(row.lastTransaction).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
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
          <h1 className="text-2xl md:text-4xl font-bold text-amber-900">{t('balanceReport.title')}</h1>
          <button
            onClick={fetchReport}
            className="px-6 py-2 bg-amber-900 text-white rounded-lg hover:bg-amber-950 transition-colors"
          >
            {t('balanceReport.refresh')}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-semibold">
                  {t('balanceReport.needToReturnTitle')}
                </p>
                <p className="text-3xl font-bold text-red-900 mt-2">
                  {report?.needToReturn?.length || 0}
                </p>
              </div>
              <AlertCircle size={32} className="text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-semibold">
                  {t('balanceReport.needToReceiveTitle')}
                </p>
                <p className="text-3xl font-bold text-blue-900 mt-2">
                  {report?.needToReceive?.length || 0}
                </p>
              </div>
              <AlertCircle size={32} className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex border-b-2 border-amber-200">
            <button
              onClick={() => setActiveTab('return')}
              className={`flex-1 py-3 md:py-4 text-xs md:text-base font-semibold transition-colors ${
                activeTab === 'return'
                  ? 'bg-red-50 text-red-900 border-b-4 border-red-600'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <span className="hidden sm:inline">{t('balanceReport.needToReturnTab')}</span>
              <span className="sm:hidden">To Return</span>
               ({report?.needToReturn?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('receive')}
              className={`flex-1 py-3 md:py-4 text-xs md:text-base font-semibold transition-colors ${
                activeTab === 'receive'
                  ? 'bg-blue-50 text-blue-900 border-b-4 border-blue-600'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <span className="hidden sm:inline">{t('balanceReport.needToReceiveTab')}</span>
              <span className="sm:hidden">To Receive</span>
               ({report?.needToReceive?.length || 0})
            </button>
          </div>

          {/* Tables */}
          <div className="p-6">
            {activeTab === 'return' && (
              <div>
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={() =>
                      exportToCSV(
                        report?.needToReturn || [],
                        t('balanceReport.filenameReturn')
                      )
                    }
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Download size={18} />
                    <span>{t('balanceReport.exportCsv')}</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-red-50 border-b-2 border-red-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-red-900">
                          {t('balanceReport.name')}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-red-900">
                          {t('balanceReport.village')}
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-red-900">
                          {t('balanceReport.amount')}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-red-900">
                          {t('balanceReport.lastTransaction')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report?.needToReturn && report.needToReturn.length > 0 ? (
                        report.needToReturn.map((person) => (
                          <tr
                            key={person.id}
                            className="border-b hover:bg-red-50 transition-colors"
                          >
                            <td className="px-6 py-4 font-semibold text-amber-900">
                              {person.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-amber-600">
                              {person.village}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-red-900">
                              ₹{person.amount?.toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(
                                person.lastTransaction
                              ).toLocaleDateString('en-IN')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            {t('balanceReport.noOneToReturn')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'receive' && (
              <div>
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={() =>
                      exportToCSV(
                        report?.needToReceive || [],
                        t('balanceReport.filenameReceive')
                      )
                    }
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download size={18} />
                    <span>{t('balanceReport.exportCsv')}</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blue-50 border-b-2 border-blue-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                          {t('balanceReport.name')}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                          {t('balanceReport.village')}
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-blue-900">
                          {t('balanceReport.amount')}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">
                          {t('balanceReport.lastTransaction')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report?.needToReceive && report.needToReceive.length > 0 ? (
                        report.needToReceive.map((person) => (
                          <tr
                            key={person.id}
                            className="border-b hover:bg-blue-50 transition-colors"
                          >
                            <td className="px-6 py-4 font-semibold text-amber-900">
                              {person.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-amber-600">
                              {person.village}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-blue-900">
                              ₹{person.amount?.toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(
                                person.lastTransaction
                              ).toLocaleDateString('en-IN')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            {t('balanceReport.noOneToReceive')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BalanceReport;
