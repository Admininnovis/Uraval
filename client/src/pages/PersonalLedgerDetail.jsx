import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import UravinLoading from '../components/UravinLoading';
import NotebookView from '../components/NotebookView';
import api from '../services/api';
import { User, ChevronLeft, ChevronRight, Edit2, X, Plus, History, ChevronDown, ChevronUp, Tag, ArrowDownLeft, ArrowUpRight, Book, Split } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { BananaTree, TempleGopuram, KolamPattern, CornerMark, PalmLeafManuscript } from '../components/Illustrations';

const PersonalLedgerDetail = () => {
  const { t, language, tData } = useLanguage();
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

  // Focus Refs & Touch drag
  const eventNameRef = useRef(null);
  const dateRef = useRef(null);
  const amountRef = useRef(null);
  const isSelectingEventRef = useRef(false);
  const touchStartYRef = useRef(null);

  // Event Autocomplete State
  const [availableEvents, setAvailableEvents] = useState([]);
  const [eventSuggestions, setEventSuggestions] = useState([]);
  const [showEventSuggestions, setShowEventSuggestions] = useState(false);

  const handleSheetTouchStart = (e) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleSheetTouchEnd = (e) => {
    if (touchStartYRef.current !== null) {
      const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
      if (deltaY > 35) {
        setIsFormOpen(false); // Dragged down -> close
      } else if (deltaY < -35) {
        setIsFormOpen(true); // Dragged up -> open
      }
      touchStartYRef.current = null;
    }
  };

  const handleEventNameChange = (e) => {
    const val = e.target.value;
    setEventName(val);
    if (val.trim().length > 0) {
      const filtered = availableEvents.filter(ev => 
        (ev.eventName || '').toLowerCase().includes(val.toLowerCase())
      );
      setEventSuggestions(filtered);
      setShowEventSuggestions(filtered.length > 0);
    } else {
      setEventSuggestions(availableEvents.slice(0, 6));
      setShowEventSuggestions(availableEvents.length > 0);
    }
  };

  const handleSelectEvent = (ev) => {
    isSelectingEventRef.current = false;
    setEventName(ev.eventName);
    if (ev.eventDate) {
      setDate(new Date(ev.eventDate).toISOString().split('T')[0]);
    }
    setShowEventSuggestions(false);
    setTimeout(() => dateRef.current?.focus(), 50);
  };

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

      // Fetch user's events for autocomplete suggestions
      try {
        const evRes = await api.get('/events');
        if (evRes.data?.events) {
          setAvailableEvents(evRes.data.events);
        }
      } catch (err) {
        // ignore
      }
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
        const res = await api.post('/ledger', {
          personId: id,
          eventName,
          amount: numericAmount,
          date,
          notes,
        });

        const savedItem = res.data?.ledger || res.data;
        if (savedItem) {
          setPersonalLedgers(prev => [savedItem, ...prev.filter(l => l._id !== savedItem._id)]);
          setPerson(prev => prev ? { ...prev, totalReturned: (prev.totalReturned || 0) + numericAmount } : prev);
        }
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

  const handleSplitTransaction = async (item) => {
    if (!window.confirm(t('personalLedgerDetail.confirmSplit'))) return;
    
    try {
      await api.post(`/people/${id}/split`, {
        transactionId: item._id,
        source: item.source
      });
      fetchPersonDetails();
    } catch (error) {
      console.error('Error splitting transaction:', error);
      alert(error.response?.data?.message || t('personalLedgerDetail.splitFailed'));
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <UravinLoading size="lg" />
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
      editHistory: l.editHistory,
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
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl md:text-3xl font-bold text-ledger-ink font-tamil tracking-wide drop-shadow-sm leading-tight">
                      {tData(person.name)}
                    </h1>
                    {person.notes && (
                      <span className="text-[11px] md:text-xs font-serif italic text-ledger-brown bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2.5 py-0.5 rounded-full font-medium shadow-sm">
                        {tData(person.notes)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-ledger-brown/70 bg-ledger-brown/5 px-2 py-0.5 rounded-full">
                      {tData(person.village) || t('personalLedger.unknownVillage')}
                    </span>
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
                    {isPositiveBalance ? '+' : '-'}₹{Math.abs(balance).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
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
                const month = item.date.toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', { month: 'short' }).toUpperCase();
                const day = item.date.toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', { day: '2-digit' });
                const year = item.date.toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', { year: 'numeric' });

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
                              {item.source === 'event' ? t('personalLedgerDetail.eventBadge') : t('personalLedgerDetail.directBadge')}
                            </span>

                            {/* Notes Tag */}
                            {item.notes && (
                              <span className="text-[10px] px-2 py-0.5 rounded border border-ledger-brown/20 text-ledger-brown/70 flex items-center gap-1 bg-ledger-brown/5">
                                <Tag size={10} /> {tData(item.notes)}
                              </span>
                            )}
                          </div>

                          {/* Amount */}
                          <div className={`px-2 py-1 font-bold font-serif text-sm md:text-lg ${item.isPositive ? 'text-ledger-green' : 'text-ledger-red'}`}>
                            {item.isPositive ? '+' : '-'} ₹{Math.abs(item.amount).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                          </div>
                        </div>

                        <div className="flex justify-between items-end mt-2">
                          <h3 className="font-tamil font-bold text-base md:text-xl text-ledger-ink flex-1">{tData(item.description)}</h3>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity -mb-1 -mr-1">
                            {/* Split Transaction Button */}
                            <button onClick={() => handleSplitTransaction(item)} title={t('personalLedgerDetail.separateToNewPerson')} className="p-2 md:p-2.5 text-ledger-brown hover:bg-ledger-brown/10 rounded-full transition-all">
                              <Split size={14} />
                            </button>

                            {/* Hover Edit Button */}
                            {item.source === 'personal' && (
                              <button onClick={() => handleEditClick(item)} title={t('personalLedgerDetail.editEntryTooltip')} className="p-2 md:p-2.5 text-ledger-brown hover:bg-ledger-brown/10 rounded-full transition-all">
                                <Edit2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expandable Edit History */}
                        {item.editHistory?.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-ledger-brown/10">
                            <button onClick={() => toggleHistory(item._id)} className="flex items-center gap-1 text-[10px] text-ledger-brown/50 hover:text-ledger-brown transition-colors uppercase font-bold tracking-widest group/btn">
                              <History size={12} className="group-hover/btn:rotate-[-45deg] transition-transform" />
                              {t('personalLedgerDetail.viewHistory')}
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
                                        <span className="font-tamil opacity-70">{tData(h.eventName)}</span>
                                        <span className="font-bold">{h.amount > 0 ? '+' : '-'}₹{Math.abs(h.amount).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}</span>
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
                <ChevronLeft size={16} /> <span className="hidden sm:inline">{t('common.previous')}</span>
              </button>
              <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-ledger-brown/60">
                {language === 'ta' ? `பக்கம் ${currentPage} / ${Math.ceil(timeline.length / ENTRIES_PER_PAGE)}` : `Page ${currentPage} of ${Math.ceil(timeline.length / ENTRIES_PER_PAGE)}`}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(timeline.length / ENTRIES_PER_PAGE), p + 1))}
                disabled={currentPage === Math.ceil(timeline.length / ENTRIES_PER_PAGE)}
                className="px-3 md:px-4 py-2 text-xs md:text-sm font-bold text-ledger-brown hover:bg-ledger-brown/10 disabled:opacity-30 rounded transition-colors flex items-center gap-1"
              >
                <span className="hidden sm:inline">{t('common.next')}</span> <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Floating Entry Form - Dashboard & Settings Ivory Gold Theme */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`fixed bottom-16 md:bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none md:px-8 transition-transform duration-500 ease-in-out md:translate-y-0 ${!isFormOpen ? 'translate-y-[calc(100%-3.5rem)]' : 'translate-y-0'}`}
        >
          <div className="pointer-events-auto w-full max-w-5xl bg-[#F7F3EB] md:rounded-2xl shadow-[0_20px_50px_rgba(67,44,32,0.22)] border-t-2 border-l border-r md:border-2 border-[#DDD1BF] p-4 pt-2.5 md:p-6 relative rounded-t-2xl overflow-visible">

            {/* Top Accent Line in Antique Gold */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#B68A3D] via-[#D4AF37] to-[#B68A3D] rounded-t-2xl md:rounded-t-2xl"></div>

            {/* Mobile Drag Handle (Swipe down to dismiss, swipe up to open) */}
            <div 
              className="md:hidden flex flex-col items-center justify-center w-full py-2 mb-1 cursor-grab active:cursor-grabbing relative z-20 select-none touch-none"
              onTouchStart={handleSheetTouchStart}
              onTouchEnd={handleSheetTouchEnd}
              onClick={() => setIsFormOpen(prev => !prev)}
            >
              <div className="w-14 h-1.5 bg-[#DDD1BF] rounded-full hover:bg-[#B68A3D] transition-colors"></div>
            </div>

            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#DDD1BF] relative z-10">
              <h3 className="text-[#8A5A1E] font-bold uppercase tracking-wider text-xs md:text-sm flex items-center gap-2">
                {editingEntryId ? <Edit2 size={14} /> : <Plus size={14} />}
                {editingEntryId ? t('personalLedgerDetail.editingEntry') : t('personalLedgerDetail.addDirectEntry')}
              </h3>
              {editingEntryId && (
                <button onClick={cancelEdit} className="text-[#8A5A1E] hover:text-[#432C20] bg-[#EDE5D8] p-1.5 rounded-lg transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmitForm} className="relative z-10 flex flex-col md:flex-row gap-3.5 md:gap-4 items-stretch md:items-end">
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-3.5 md:gap-4">

                {/* Event Name with Autocomplete */}
                <div className="md:col-span-4 relative">
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-[#8A5A1E] font-sans">{t('personalLedgerDetail.eventName')}</label>
                  <input
                    ref={eventNameRef}
                    type="text"
                    required
                    value={eventName}
                    onChange={handleEventNameChange}
                    onKeyDown={handleEventNameKeyDown}
                    onFocus={() => {
                      if (availableEvents.length > 0) {
                        setEventSuggestions(
                          eventName.trim() 
                            ? availableEvents.filter(ev => (ev.eventName || '').toLowerCase().includes(eventName.toLowerCase()))
                            : availableEvents.slice(0, 6)
                        );
                        setShowEventSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        if (!isSelectingEventRef.current) {
                          setShowEventSuggestions(false);
                        }
                      }, 250);
                    }}
                    className="w-full bg-white border-2 border-[#DDD1BF] focus:border-[#B68A3D] focus:ring-4 focus:ring-[#B68A3D]/20 rounded-xl outline-none text-base font-bold font-tamil px-3.5 py-2.5 transition-all text-[#432C20] placeholder-stone-400 shadow-xs"
                    placeholder={t('personalLedgerDetail.eventNamePlaceholder')}
                  />

                  {showEventSuggestions && eventSuggestions.length > 0 && (
                    <div 
                      className="absolute bottom-full left-0 w-full mb-2 bg-[#FDFBF7] shadow-2xl border-2 border-[#DDD1BF] z-[100] max-h-56 overflow-y-auto custom-scrollbar rounded-xl touch-pan-y"
                      onTouchStart={(e) => { e.stopPropagation(); isSelectingEventRef.current = true; }}
                      onTouchMove={(e) => e.stopPropagation()}
                      onMouseDown={() => { isSelectingEventRef.current = true; }}
                    >
                      {eventSuggestions.map((ev) => (
                        <div
                          key={ev._id}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            isSelectingEventRef.current = true;
                            handleSelectEvent(ev);
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            isSelectingEventRef.current = true;
                            handleSelectEvent(ev);
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelectEvent(ev);
                          }}
                          className="px-4 py-3 hover:bg-[#EDE5D8]/60 active:bg-[#EDE5D8] cursor-pointer border-b border-[#DDD1BF]/60 last:border-0 transition-colors flex justify-between items-center select-none"
                        >
                          <p className="font-bold text-base font-tamil text-[#432C20]">{tData(ev.eventName)}</p>
                          {ev.eventDate && (
                            <span className="text-xs text-stone-500 font-serif">
                              {new Date(ev.eventDate).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', { month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-[#8A5A1E] font-sans">{t('personalLedgerDetail.date')}</label>
                  <input
                    ref={dateRef}
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onKeyDown={handleDateKeyDown}
                    className="w-full bg-white border-2 border-[#DDD1BF] focus:border-[#B68A3D] focus:ring-4 focus:ring-[#B68A3D]/20 rounded-xl outline-none text-sm font-serif px-3 py-2.5 transition-all text-[#432C20] shadow-xs"
                  />
                </div>

                {/* Amount */}
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-[#8A5A1E] font-sans">{t('personalLedgerDetail.amount')}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B5E20] font-bold text-lg">₹</span>
                    <input
                      ref={amountRef}
                      type="number"
                      required
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-white border-2 border-[#DDD1BF] focus:border-[#B68A3D] focus:ring-4 focus:ring-[#B68A3D]/20 rounded-xl outline-none text-xl font-serif font-bold px-3 py-2 pl-8 transition-all text-[#1B5E20] placeholder-stone-300 shadow-xs"
                      placeholder={t('personalLedgerDetail.amountPlaceholder')}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-[#8A5A1E] font-sans">{t('eventLedgerDetail.notes')}</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white border-2 border-[#DDD1BF] focus:border-[#B68A3D] focus:ring-4 focus:ring-[#B68A3D]/20 rounded-xl outline-none text-sm font-serif px-3.5 py-2.5 transition-all text-[#432C20] placeholder-stone-400 shadow-xs"
                    placeholder={t('eventLedgerDetail.optionalNotes')}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit" className={`w-full md:w-auto px-8 md:px-10 py-3 text-base font-bold uppercase tracking-wider transition-all rounded-xl h-[48px] md:h-[52px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 ${editingEntryId ? 'bg-white text-[#7A2E1E] border-2 border-[#7A2E1E]' : 'bg-gradient-to-r from-[#7A2E1E] to-[#9B3A27] hover:from-[#652417] hover:to-[#7A2E1E] text-white border border-[#7A2E1E]'}`}>
                {editingEntryId ? t('personalLedgerDetail.updateBtn') : (
                  <>
                    <Plus size={18} className="text-amber-300" />
                    {t('personalLedgerDetail.addBtn')}
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

      </motion.div>

    </Layout>
  );
};

export default PersonalLedgerDetail;
