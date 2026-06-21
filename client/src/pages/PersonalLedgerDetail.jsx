import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import NotebookView from '../components/NotebookView';
import api from '../services/api';
import { User, ChevronLeft, ChevronRight, Edit2, X, Plus, History, ChevronDown, ChevronUp, Tag, ArrowDownLeft, ArrowUpRight, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { BananaTree, TempleGopuram, KolamPattern, CornerMark, PalmLeafManuscript } from '../components/Illustrations';

const PersonalLedgerDetail = () => {
  const { t, language } = useLanguage();
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [events, setEvents] = useState([]);
  const [personalLedgers, setPersonalLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ENTRIES_PER_PAGE = 12;

  // Form State
  const [amount, setAmount] = useState('');
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Refs for fast data entry
  const eventNameRef = useRef(null);
  const dateRef = useRef(null);
  const amountRef = useRef(null);

  useEffect(() => {
    fetchPersonDetails();
  }, [id]);

  const fetchPersonDetails = async () => {
    try {
      const response = await api.get(`/people/${id}`);
      setPerson(response.data.person);
      setEvents(response.data.eventEntries);
      setPersonalLedgers(response.data.personalLedgers);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching person details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const numericAmount = Math.abs(Number(amount));

      if (editingEntryId) {
        await api.put(`/ledger/${editingEntryId}`, {
          eventName,
          amount: numericAmount,
          date,
          notes,
        });
      } else {
        await api.post('/ledger', {
          personId: id,
          eventName,
          amount: numericAmount,
          date,
          notes,
        });
      }

      cancelEdit();
      fetchPersonDetails();

      // Focus back on eventName for next fast entry
      setTimeout(() => eventNameRef.current?.focus(), 100);
    } catch (error) {
      console.error('Error saving personal ledger entry:', error);
    }
  };

  const handleEditClick = (item) => {
    if (item.source === 'event') return; // Cannot edit event entries from here

    setEditingEntryId(item._id);
    setEventName(item.description);
    setDate(new Date(item.date).toISOString().split('T')[0]);
    setAmount(Math.abs(item.amount));
    setNotes(item.notes || '');

    setTimeout(() => eventNameRef.current?.focus(), 50);
  };

  const cancelEdit = () => {
    setEditingEntryId(null);
    setAmount('');
    setEventName('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setTimeout(() => eventNameRef.current?.focus(), 50);
  };

  const handleEventNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      dateRef.current?.focus();
    }
  };

  const handleDateKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      amountRef.current?.focus();
    }
  };

  const toggleHistory = (itemId) => {
    setExpandedHistoryId(prev => prev === itemId ? null : itemId);
  };

  if (loading) return (
    <Layout>
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-ledger-brown/20 border-t-ledger-red"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 bg-ledger-red rounded-full"></div>
          </div>
        </div>
      </div>
    </Layout>
  );

  if (!person) return <Layout><div className="text-center mt-20 text-xl font-tamil">{t('personalLedgerDetail.personNotFound')}</div></Layout>;

  // Combine events and personal ledgers for timeline
  const timeline = [
    ...events.map(e => ({
      _id: e._id,
      date: new Date(e.createdAt || e.date),
      amount: e.amount, // Positive because they gave it at our event
      description: e.eventId?.eventName || t('personalLedgerDetail.eventEntry'),
      source: 'event',
      isPositive: true,
      editHistory: e.editHistory,
      notes: e.notes
    })),
    ...personalLedgers.map(l => ({
      _id: l._id,
      date: new Date(l.date),
      amount: l.amount,
      description: l.eventName,
      notes: l.notes,
      source: 'personal',
      isPositive: false, // Always false because personal ledger is only for 'I gave'
      editHistory: l.editHistory
    }))
  ].sort((a, b) => b.date - a.date); // Sort desc

  const balance = (person.totalReceived || 0) - (person.totalReturned || 0);
  const isPositiveBalance = balance >= 0;

  const currentEntries = timeline.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE);

  return (
    <Layout noPadding>
      {/* Background illustrations */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.03] text-ledger-brown">
        <div className="absolute top-10 left-10 w-64 h-64"><BananaTree className="w-full h-full" /></div>
        <div className="absolute bottom-10 right-10 w-80 h-80"><TempleGopuram className="w-full h-full" /></div>
        <div className="absolute top-1/2 left-1/4 w-48 h-24 transform -rotate-12"><PalmLeafManuscript className="w-full h-full" /></div>
        <div className="absolute -top-10 -right-10 w-64 h-64 transform rotate-12"><KolamPattern className="w-full h-full" /></div>
        <div className="absolute top-24 left-4 w-8 h-8"><CornerMark className="w-full h-full" /></div>
        <div className="absolute top-24 right-4 w-8 h-8 transform rotate-90"><CornerMark className="w-full h-full" /></div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`min-h-screen flex flex-col relative z-10 bg-ledger-paper transition-all duration-500 ${isFormOpen ? 'pb-[500px]' : 'pb-32'} md:pb-32`}>

        {/* Premium Sticky Header (Ledger Style) */}
        <div className="sticky top-0 z-50 bg-[#F8F1DF] border-b-4 border-double border-ledger-brown/20 shadow-sm px-4 md:px-8 py-4 mb-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

            {/* Left: Person Information */}
            <div className="flex items-center gap-4">
              <Link to="/personal-ledger" className="p-2 bg-ledger-brown/5 text-ledger-brown rounded-full hover:bg-ledger-brown/10 hover:-translate-x-1 transition-all">
                <ChevronLeft size={20} />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-ledger-brown to-[#3D2314] rounded-full flex items-center justify-center shadow-md border-2 border-white">
                  <User className="text-[#D4AF37]" size={24} />
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-ledger-ink font-tamil tracking-wide drop-shadow-sm leading-tight">
                    {person.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-ledger-brown/70 bg-ledger-brown/5 px-2 py-0.5 rounded-full">
                      {person.village || t('personalLedger.unknownVillage')}
                    </span>
                    {person.mobile && (
                      <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-ledger-brown/70 bg-ledger-brown/5 px-2 py-0.5 rounded-full">
                        {person.mobile}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Balance Highlight & Book View Button */}
            <div className="flex flex-col items-end w-full md:w-auto gap-4">
              <div className="flex flex-col items-end md:items-end w-full md:w-auto bg-ledger-brown/[0.03] px-4 py-2 rounded border border-ledger-brown/10 shadow-inner">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ledger-brown/50 mb-0.5">{t('personalLedgerDetail.currentBalance')}</p>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-full ${isPositiveBalance ? 'bg-ledger-green/10 text-ledger-green' : 'bg-ledger-red/10 text-ledger-red'}`}>
                    {isPositiveBalance ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <p className={`text-2xl md:text-4xl font-serif font-bold tracking-tight ${isPositiveBalance ? 'text-ledger-green' : 'text-ledger-red'}`}>
                    {isPositiveBalance ? '+' : '-'}₹{Math.abs(balance).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Timeline Flow Area */}
        <div className="flex-1 max-w-5xl mx-auto w-full px-4 relative">

          {/* Vertical Timeline Line (Notebook Margin) */}
          {timeline.length > 0 && (
            <div className="absolute left-[3.5rem] md:left-[8rem] top-0 bottom-8 w-[2px] bg-ledger-red/30 z-0"></div>
          )}

          <div className="relative z-10 py-4">
            <AnimatePresence>
              {currentEntries.map((item, idx) => {
                const month = item.date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
                const day = item.date.toLocaleDateString('en-IN', { day: '2-digit' });
                const year = item.date.toLocaleDateString('en-IN', { year: 'numeric' });

                return (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="flex gap-4 md:gap-8 mb-6 group relative"
                  >
                    {/* Date Block */}
                    <div className="w-10 md:w-24 shrink-0 flex flex-col items-end text-right pt-4 relative z-10">
                      <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-ledger-brown/60 leading-none">{month}</span>
                      <span className="text-lg md:text-3xl font-serif font-bold text-ledger-ink leading-none mt-1">{day}</span>
                      <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-ledger-brown/40 mt-1">{year}</span>

                      {/* Timeline Dot */}
                      <div className={`absolute top-6 -right-[15px] md:-right-[23px] w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-ledger-paper z-20 transition-transform group-hover:scale-125 ${item.isPositive ? 'bg-ledger-green' : 'bg-ledger-red'}`}></div>
                    </div>

                    {/* Transaction Card (Ledger Entry Style) */}
                    <div className={`flex-1 bg-transparent border-b border-ledger-brown/10 border-l-4 ${item.isPositive ? 'border-l-ledger-green hover:bg-ledger-green/5' : 'border-l-ledger-red hover:bg-ledger-red/5'} p-4 md:p-6 relative transition-all duration-300`}>

                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-wrap gap-2 items-center">
                            {/* Source Badge */}
                            <span className={`text-[9px] px-2 py-0.5 rounded uppercase tracking-widest font-bold ${item.source === 'event' ? 'bg-[#D4AF37]/20 text-[#B8860B]' : 'bg-ledger-brown/10 text-ledger-brown'}`}>
                              {item.source === 'event' ? 'EVENT' : 'DIRECT'}
                            </span>

                            {/* Notes Tag */}
                            {item.notes && (
                              <span className="text-[10px] px-2 py-0.5 rounded border border-ledger-brown/20 text-ledger-brown/70 flex items-center gap-1 bg-ledger-brown/5">
                                <Tag size={10} /> {item.notes}
                              </span>
                            )}
                          </div>

                          {/* Amount */}
                          <div className={`px-2 py-1 font-bold font-serif text-sm md:text-lg ${item.isPositive ? 'text-ledger-green' : 'text-ledger-red'}`}>
                            {item.isPositive ? '+' : '-'} ₹{Math.abs(item.amount).toLocaleString('en-IN')}
                          </div>
                        </div>

                        <div className="flex justify-between items-end mt-2">
                          <h3 className="font-tamil font-bold text-base md:text-xl text-ledger-ink">{item.description}</h3>

                          {/* Hover Edit Button */}
                          {item.source === 'personal' && (
                            <button onClick={() => handleEditClick(item)} className="p-2 md:p-2.5 text-ledger-brown hover:bg-ledger-brown/10 rounded-full transition-all opacity-0 group-hover:opacity-100 -mb-1 -mr-1">
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>

                        {/* Expandable Edit History */}
                        {item.editHistory?.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-ledger-brown/10">
                            <button onClick={() => toggleHistory(item._id)} className="flex items-center gap-1 text-[10px] text-ledger-brown/50 hover:text-ledger-brown transition-colors uppercase font-bold tracking-widest group/btn">
                              <History size={12} className="group-hover/btn:rotate-[-45deg] transition-transform" />
                              View History
                              {expandedHistoryId === item._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>

                            <AnimatePresence>
                              {expandedHistoryId === item._id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-3 space-y-2 bg-ledger-brown/5 p-3 rounded border border-ledger-brown/10 text-xs font-serif text-ledger-red/80 line-through decoration-1">
                                    {item.editHistory.map((h, i) => (
                                      <div key={i} className="flex justify-between items-center bg-ledger-paper p-1.5 rounded">
                                        <span className="font-tamil opacity-70">{h.eventName}</span>
                                        <span className="font-bold">{h.amount > 0 ? '+' : '-'}₹{Math.abs(h.amount).toLocaleString('en-IN')}</span>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {timeline.length === 0 && (
              <div className="pl-14 md:pl-24 py-12 text-ledger-brown/50 font-serif italic text-center">
                {t('personalLedgerDetail.noTransactions')}
              </div>
            )}
          </div>

          {/* Pagination */}
          {Math.ceil(timeline.length / ENTRIES_PER_PAGE) > 1 && (
            <div className="flex items-center justify-between bg-[#F8F1DF] rounded shadow-inner p-3 md:p-4 mt-8 mb-4 border border-ledger-brown/10 max-w-md mx-auto relative z-20">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 md:px-4 py-2 text-xs md:text-sm font-bold text-ledger-brown hover:bg-ledger-brown/10 disabled:opacity-30 rounded transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={16} /> <span className="hidden sm:inline">Previous</span>
              </button>
              <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-ledger-brown/60">
                Page {currentPage} of {Math.ceil(timeline.length / ENTRIES_PER_PAGE)}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(timeline.length / ENTRIES_PER_PAGE), p + 1))}
                disabled={currentPage === Math.ceil(timeline.length / ENTRIES_PER_PAGE)}
                className="px-3 md:px-4 py-2 text-xs md:text-sm font-bold text-ledger-brown hover:bg-ledger-brown/10 disabled:opacity-30 rounded transition-colors flex items-center gap-1"
              >
                <span className="hidden sm:inline">Next</span> <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Floating Entry Form - Dark Premium Leather Theme */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`fixed bottom-16 md:bottom-0 left-0 right-0 z-50 pointer-events-none transition-transform duration-500 ease-in-out md:translate-y-0 ${!isFormOpen ? 'translate-y-[calc(100%-3.5rem)]' : 'translate-y-0'}`}
        >
          <div className="max-w-5xl mx-auto pointer-events-auto md:p-4">
            <div className="bg-[#2A2118] text-ledger-paper md:rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)] border-t border-l border-r md:border-b border-[#D4AF37]/30 p-4 pt-1 md:p-6 relative overflow-visible backdrop-blur-xl bg-opacity-95 rounded-t-xl">

              {/* Mobile Drag Handle / Toggle */}
              <div 
                className="md:hidden flex flex-col items-center justify-center w-full py-3 mb-2 cursor-pointer relative z-20"
                onClick={() => setIsFormOpen(!isFormOpen)}
              >
                <div className="w-12 h-1.5 bg-[#D4AF37]/40 rounded-full mb-1"></div>
                <div className="flex items-center gap-1 text-[#D4AF37]/70 text-[10px] uppercase font-bold tracking-widest">
                  {isFormOpen ? (
                    <><ChevronDown size={14} /> Drop Down</>
                  ) : (
                    <><ChevronUp size={14} /> Add Entry</>
                  )}
                </div>
              </div>

              {/* Leather Texture overlay */}
              <div className="absolute inset-0 opacity-20 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] pointer-events-none rounded-t-xl md:rounded-2xl"></div>

              {/* Gold accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>

              <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="text-[#D4AF37] font-bold uppercase tracking-[0.2em] text-xs md:text-sm flex items-center gap-2">
                  {editingEntryId ? <Edit2 size={14} /> : <Plus size={14} />}
                  {editingEntryId ? t('personalLedgerDetail.editingEntry') : t('personalLedgerDetail.addDirectEntry')}
                </h3>
                {editingEntryId && (
                  <button onClick={cancelEdit} className="text-[#D4AF37]/60 hover:text-[#D4AF37] bg-white/5 p-1 rounded-full transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmitForm} className="relative z-10 flex flex-col md:flex-row gap-4 md:gap-6 items-stretch md:items-end">
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">

                  {/* Event Name */}
                  <div className="md:col-span-4">
                    <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 text-[#D4AF37]/80">{t('personalLedgerDetail.eventName')}</label>
                    <input
                      ref={eventNameRef}
                      type="text"
                      required
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      onKeyDown={handleEventNameKeyDown}
                      className="w-full bg-black/20 border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 rounded-lg outline-none text-base font-tamil px-3 py-2.5 transition-all text-white placeholder-white/20"
                      placeholder={t('personalLedgerDetail.eventNamePlaceholder')}
                    />
                  </div>

                  {/* Date */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 text-[#D4AF37]/80">{t('personalLedgerDetail.date')}</label>
                    <input
                      ref={dateRef}
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      onKeyDown={handleDateKeyDown}
                      className="w-full bg-black/20 border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 rounded-lg outline-none text-sm font-serif px-3 py-2.5 transition-all text-white"
                    />
                  </div>

                  {/* Amount */}
                  <div className="md:col-span-3">
                    <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 text-[#D4AF37]/80">{t('personalLedgerDetail.amount')}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D4AF37] font-bold text-lg">₹</span>
                      <input
                        ref={amountRef}
                        type="number"
                        required
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-black/40 border-2 border-[#D4AF37]/40 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/50 rounded-lg outline-none text-xl font-serif font-bold px-3 py-2 pl-8 transition-all text-[#D4AF37] placeholder-[#D4AF37]/20"
                        placeholder={t('personalLedgerDetail.amountPlaceholder')}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-3">
                    <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 text-[#D4AF37]/80">{t('eventLedgerDetail.notes')}</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-black/20 border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 rounded-lg outline-none text-sm font-serif px-3 py-2.5 transition-all text-white placeholder-white/20"
                      placeholder={t('eventLedgerDetail.optionalNotes')}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button type="submit" className={`w-full md:w-auto px-8 md:px-10 py-3 md:py-4 text-sm md:text-base font-bold uppercase tracking-[0.15em] transition-all rounded-lg flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(155,44,44,0.4)] hover:shadow-[0_8px_25px_rgba(155,44,44,0.6)] ${editingEntryId ? 'bg-white text-ledger-red hover:bg-gray-100' : 'bg-gradient-to-r from-ledger-red via-[#8B0000] to-ledger-red text-white hover:-translate-y-1 active:scale-95 border border-white/10'}`}>
                  {editingEntryId ? 'UPDATE' : (
                    <>
                      <Plus size={18} className="text-white/80" />
                      ADD
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </motion.div>

      </motion.div>

    </Layout>
  );
};

export default PersonalLedgerDetail;
