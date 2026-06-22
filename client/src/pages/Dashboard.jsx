import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, ArrowDownRight, Plus,
  BookOpen, Library, TrendingUp, TrendingDown,
  Users, History, Star, HandCoins
} from 'lucide-react';
import { 
  PalmLeafManuscript, LedgerSeal, 
  LedgerRuler, FountainPen, StackedNotebooks, 
  TempleBell, OilLamp, VanakkamHands
} from '../components/Illustrations';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

const Dashboard = () => {
  const { t, language } = useLanguage();
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/reports/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-ledger-brown border-t-ledger-gold"></div>
          </div>
        </div>
      </Layout>
    );
  }

  const { stats, activeEvents, insights } = data;
  const totalBalance = (stats?.totalReceived || 0) - (stats?.totalReturned || 0);

  return (
    <Layout>
      <motion.div className="space-y-12 pb-20 mt-6" variants={containerVariants} initial="hidden" animate="visible">

        {/* 1. Ledger Cover Section */}
        <motion.div variants={itemVariants} className="relative bg-ledger-paper rounded border-4 border-ledger-brown shadow-notebook mx-auto max-w-4xl p-6 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none z-0"></div>

          {/* Watermarks */}
          <div className="absolute bottom-10 left-10 w-48 h-24 transform -rotate-6 pointer-events-none z-0 text-ledger-brown opacity-20"><PalmLeafManuscript className="w-full h-full" /></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 pointer-events-none z-0 text-ledger-red opacity-10 transform rotate-12"><LedgerSeal className="w-full h-full" /></div>

          <div className="absolute top-0 bottom-0 left-8 w-[2px] bg-ledger-red/30 z-0"></div>
          <div className="absolute top-0 bottom-0 left-10 w-[2px] bg-ledger-red/30 z-0"></div>

          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl font-serif text-ledger-brown/80 tracking-[0.2em] uppercase mb-4">
              {new Date().toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>
            <div className="w-24 h-1 bg-ledger-brown mx-auto mb-8"></div>

            <h1 className="text-4xl md:text-6xl font-tamil font-bold text-ledger-ink mb-6 leading-tight flex items-center justify-center gap-4">
              Vanakkam <VanakkamHands className="w-12 h-12 text-ledger-brown opacity-80" />
            </h1>
            <h1 className="text-3xl md:text-4xl font-tamil font-bold text-ledger-ink mb-6 leading-tight">
              <span>{t('dashboard.subtitle') || 'Welcome to your premium ledger.'}</span>
            </h1>

            <div className="w-full max-w-md mx-auto border-t-2 border-b-2 border-ledger-brown py-6 my-8 md:my-10">
              <p className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-ledger-brown/80 mb-2">Total Ledger Balance</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-ledger-ink break-words">
                ₹{totalBalance.toLocaleString('en-IN')}
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 md:gap-12 font-serif">
              <div className="text-center">
                <p className="text-[10px] md:text-xs uppercase tracking-widest text-ledger-brown/70 mb-1">Total Received</p>
                <p className="text-lg md:text-xl font-bold text-ledger-green">₹{(stats?.totalReceived || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="hidden sm:block w-[2px] h-12 bg-ledger-brown/20"></div>
              <div className="sm:hidden w-12 h-[2px] bg-ledger-brown/20"></div>
              <div className="text-center">
                <p className="text-[10px] md:text-xs uppercase tracking-widest text-ledger-brown/70 mb-1">Total Returned</p>
                <p className="text-lg md:text-xl font-bold text-ledger-red">₹{(stats?.totalReturned || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. Quick Actions (Ledger Tools) */}
        <motion.div variants={itemVariants} className="flex justify-center gap-4 md:gap-6 flex-wrap py-4 px-2 w-full">
          <Link to="/events" className="flex-1 min-w-[140px] sm:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 bg-ledger-aged border-2 border-ledger-brown text-ledger-ink font-bold font-serif hover:bg-ledger-paper transition-colors shadow-sm">
            <BookOpen size={20} />
            <span className="uppercase tracking-widest text-xs md:text-sm">New Event</span>
          </Link>
          <Link to="/events" className="flex-1 min-w-[140px] sm:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 bg-ledger-aged border-2 border-ledger-brown text-ledger-ink font-bold font-serif hover:bg-ledger-paper transition-colors shadow-sm">
            <Plus size={20} />
            <span className="uppercase tracking-widest text-xs md:text-sm">New Entry</span>
          </Link>
          <Link to="/personal-ledger" className="flex-1 min-w-[140px] sm:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 bg-ledger-aged border-2 border-ledger-brown text-ledger-ink font-bold font-serif hover:bg-ledger-paper transition-colors shadow-sm">
            <HandCoins size={20} />
            <span className="uppercase tracking-widest text-xs md:text-sm text-center">Return Money</span>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* LEFT COLUMN: Summary & Events */}
          <div className="lg:col-span-8 space-y-12">

            {/* 3. Financial Summary Table */}
            <motion.div variants={itemVariants} className="bg-ledger-paper p-4 md:p-8 shadow-paper relative overflow-hidden">
              <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none z-0"></div>

              {/* Table Watermarks */}
              <div className="absolute top-4 right-10 w-64 h-16 pointer-events-none z-0 text-ledger-brown opacity-10"><LedgerRuler className="w-full h-full" /></div>
              <div className="absolute bottom-4 left-4 w-32 h-32 pointer-events-none z-0 text-ledger-brown opacity-10 transform rotate-45"><FountainPen className="w-full h-full" /></div>

              <h2 className="text-2xl font-serif font-bold text-ledger-ink mb-6 relative z-10 border-b-2 border-ledger-brown pb-2">Financial Summary Register</h2>

              <div className="relative z-10 overflow-x-auto">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Account Description</th>
                      <th className="text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-semibold"><TrendingUp size={16} className="inline mr-2 text-ledger-green" /> Total Received</td>
                      <td className="text-right font-bold text-ledger-green">{(stats?.totalReceived || 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold"><TrendingDown size={16} className="inline mr-2 text-ledger-red" /> Total Returned</td>
                      <td className="text-right font-bold text-ledger-red">{(stats?.totalReturned || 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold"><ArrowUpRight size={16} className="inline mr-2 text-ledger-gold" /> Need to Receive</td>
                      <td className="text-right font-bold text-ledger-gold">{(stats?.needToReceive || 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold"><ArrowDownRight size={16} className="inline mr-2 text-indigo-700" /> Need to Return</td>
                      <td className="text-right font-bold text-indigo-700">{(stats?.needToReturn || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* 4. Active Event Ledgers */}
            <motion.div variants={itemVariants} className="relative">
              <div className="absolute -top-10 -right-10 w-48 h-48 pointer-events-none z-0 text-ledger-brown opacity-[0.03]"><StackedNotebooks className="w-full h-full" /></div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-4 border-ledger-brown pb-3 mb-8 relative z-10 gap-4 sm:gap-0">
                <h2 className="text-2xl sm:text-3xl font-bold font-tamil text-ledger-ink flex items-center gap-3">
                  <Library size={24} className="text-ledger-brown sm:w-7 sm:h-7" /> Active Event Books
                </h2>
                <Link to="/events" className="text-xs sm:text-sm font-bold uppercase tracking-widest text-ledger-brown hover:text-ledger-ink transition-colors flex items-center gap-1">
                  View All Books <ArrowRight size={16} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeEvents?.length > 0 ? activeEvents.map((event) => (
                  <div key={event._id} onClick={() => window.location.href = `/events/${event._id}`} className="notebook-cover h-64 cursor-pointer flex flex-col justify-between">
                    <div className="p-5 pl-8 flex-1 flex flex-col relative z-10 items-center justify-center text-center">
                      <div className="w-12 h-12 border-2 border-ledger-gold rounded-full flex items-center justify-center mb-4">
                        <BookOpen className="text-ledger-gold" size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-ledger-aged font-tamil leading-tight mb-2">
                        {event.eventName}
                      </h3>
                      <p className="text-ledger-aged/70 text-[10px] font-bold uppercase tracking-widest">
                        {new Date(event.eventDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="bg-ledger-ink p-4 pl-8 border-t border-white/10 relative z-10">
                      <p className="text-xs text-ledger-aged/60 uppercase tracking-widest mb-1">Current Balance</p>
                      <p className="text-xl font-bold text-ledger-gold font-serif">₹{event.currentBalance.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full p-12 bg-ledger-paper border-2 border-dashed border-ledger-brown/50 text-center">
                    <BookOpen className="mx-auto text-ledger-brown/30 mb-4" size={48} />
                    <h3 className="text-xl font-serif font-bold text-ledger-ink mb-2">No ledgers opened yet</h3>
                    <Link to="/events" className="inline-block mt-4 px-6 py-2 border-2 border-ledger-brown text-ledger-brown font-bold uppercase tracking-widest hover:bg-ledger-brown hover:text-ledger-aged transition-colors">
                      Open First Book
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Insights / Notes */}
          <div className="lg:col-span-4">
            <motion.div variants={itemVariants} className="bg-ledger-paper min-h-[600px] shadow-paper relative overflow-hidden ledger-margin-line p-6 pl-20 md:p-8 md:pl-24 border-2 border-ledger-brown">
              <div className="absolute inset-0 opacity-30 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none z-0"></div>
              <div className="absolute inset-0 bg-ledger-ruled pointer-events-none z-0"></div>

              {/* Margin Watermarks */}
              <div className="absolute top-10 left-4 w-12 h-16 pointer-events-none z-0 text-ledger-brown opacity-20"><TempleBell className="w-full h-full" /></div>
              <div className="absolute bottom-32 left-4 w-12 h-24 pointer-events-none z-0 text-ledger-brown opacity-20"><OilLamp className="w-full h-full" /></div>
              <div className="absolute top-1/2 right-4 w-24 h-24 pointer-events-none z-0 text-ledger-brown opacity-10 transform -rotate-12"><FountainPen className="w-full h-full" /></div>

              <div className="relative z-10 pt-4">
                <h3 className="text-xl font-serif font-bold text-ledger-ink mb-8 flex items-center gap-2 border-b border-ledger-brown/30 pb-2 inline-block">
                  <Star size={20} className="text-ledger-gold" /> Ledger Notes & Insights
                </h3>

                <div className="space-y-10 font-serif">
                  {insights?.highestCollectionEvent && (
                    <div className="relative">
                      <p className="text-xs font-bold uppercase tracking-widest text-ledger-brown/70 mb-1">Highest Collection</p>
                      <p className="font-bold text-lg text-ledger-ink font-tamil">{insights.highestCollectionEvent.name}</p>
                      <p className="text-xl font-bold text-ledger-green italic mt-1">₹{insights.highestCollectionEvent.collection.toLocaleString('en-IN')}</p>
                    </div>
                  )}

                  {insights?.mostActiveEvent && (
                    <div className="relative">
                      <p className="text-xs font-bold uppercase tracking-widest text-ledger-brown/70 mb-1">Most Active Event</p>
                      <p className="font-bold text-lg text-ledger-ink font-tamil">{insights.mostActiveEvent.name}</p>
                      <p className="text-xl font-bold text-ledger-brown italic mt-1">{insights.mostActiveEvent.entries} entries</p>
                    </div>
                  )}

                  <div className="relative">
                    <p className="text-xs font-bold uppercase tracking-widest text-ledger-brown/70 mb-1">This Month's Collection</p>
                    <p className="text-2xl font-bold text-ledger-ink italic mt-1">₹{(stats?.monthCollection || 0).toLocaleString('en-IN')}</p>
                  </div>

                  {/* Decorative handwritten note */}
                  <div className="mt-16 text-ledger-ink/60 italic text-sm transform -rotate-2">
                    <p>"A penny saved is a penny earned."</p>
                    <p className="text-right mt-2">- Head Accountant</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Dashboard;
