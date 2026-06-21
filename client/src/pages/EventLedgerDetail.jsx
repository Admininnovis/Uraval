import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { Book, ChevronLeft, Plus, Edit2, X, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotebookView from '../components/NotebookView';
import { BananaTree, TempleGopuram, PalmLeafManuscript, KolamPattern, CornerMark } from '../components/Illustrations';
import { useLanguage } from '../context/LanguageContext';

const EventLedgerDetail = () => {
  const { t, language } = useLanguage();
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBookView, setIsBookView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ENTRIES_PER_PAGE = 13;

  // Form State
  const [personName, setPersonName] = useState('');
  const [village, setVillage] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [editingEntryId, setEditingEntryId] = useState(null);

  // Autocomplete State
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Village Autocomplete State
  const [villageSuggestions, setVillageSuggestions] = useState([]);
  const [showVillageSuggestions, setShowVillageSuggestions] = useState(false);

  // Focus Refs for fast entry
  const nameRef = React.useRef(null);
  const villageRef = React.useRef(null);
  const amountRef = React.useRef(null);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data.event);
      setEntries(response.data.entries);
      setCurrentPage(1); // Reset to first page on fetch
    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = async (e) => {
    const value = e.target.value;
    setPersonName(value);
    setSelectedPersonId(null); // Reset if they edit

    if (value.length > 1) {
      try {
        const response = await api.get(`/people/search?query=${value}`);
        const allResults = response.data.results || [];
        const existingIds = new Set(entries.map(en => en.personId?._id));
        const filteredResults = allResults.filter(p => !existingIds.has(p._id));

        setSuggestions(filteredResults);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleVillageChange = async (e) => {
    const value = e.target.value;
    setVillage(value);

    if (value.length > 1) {
      try {
        const response = await api.get(`/people/search?query=${value}`);
        const results = response.data.results || [];
        // Extract unique villages
        const uniqueVillages = [...new Set(results.map(p => p.village).filter(Boolean))];
        setVillageSuggestions(uniqueVillages);
        setShowVillageSuggestions(true);
      } catch (error) {
        console.error('Error fetching village suggestions:', error);
      }
    } else {
      setVillageSuggestions([]);
      setShowVillageSuggestions(false);
    }
  };

  const handleSelectVillageSuggestion = (villageName) => {
    setVillage(villageName);
    setShowVillageSuggestions(false);
    setTimeout(() => amountRef.current?.focus(), 50);
  };

  const handleSelectSuggestion = (person) => {
    setPersonName(person.name);
    setVillage(person.village || '');
    setNotes(person.notes || '');
    setSelectedPersonId(person._id);
    setShowSuggestions(false);

    // Auto jump cursor
    setTimeout(() => {
      if (person.village) {
        amountRef.current?.focus();
      } else {
        villageRef.current?.focus();
      }
    }, 50);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      } else {
        villageRef.current?.focus();
      }
    }
  };

  const handleVillageKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showVillageSuggestions && villageSuggestions.length > 0) {
        handleSelectVillageSuggestion(villageSuggestions[0]);
      } else {
        amountRef.current?.focus();
      }
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (editingEntryId) {
        const entry = entries.find(en => en._id === editingEntryId);
        // Update person if changed and person exists
        if (entry.personId && (personName !== entry.personId.name || village !== entry.personId.village || notes !== entry.personId.notes)) {
          await api.put(`/people/${entry.personId._id}`, {
            name: personName,
            village: village,
            notes: notes
          });
        }

        // Update existing entry
        await api.put(`/events/${id}/entries/${editingEntryId}`, {
          amount: Number(amount),
          notes,
        });
      } else {
        let personId = selectedPersonId;

        // Create person if not selected from suggestions
        if (!personId) {
          const personRes = await api.post('/people', {
            name: personName,
            village: village,
            notes: notes,
            autoLink: true // Important to allow auto-linking without 409 error
          });
          personId = personRes.data.person._id;
        }

        // Create ledger entry
        await api.post(`/events/${id}/entries`, {
          personId,
          amount: Number(amount),
          notes,
        });

        // Update the person's notes so they are saved for autocomplete
        if (personId && notes) {
          await api.put(`/people/${personId}`, { notes: notes });
        }
      }

      // Clear form and refetch
      cancelEdit();
      fetchEventDetails();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert(error.response.data.message || 'This person has already contributed to this event.');
      } else {
        console.error('Error submitting entry:', error);
        alert('Failed to submit entry.');
      }
    }
  };

  const handleEditClick = (entry) => {
    setEditingEntryId(entry._id);
    setPersonName(entry.personId?.name || t('eventLedgerDetail.unknownPerson'));
    setVillage(entry.personId?.village || t('eventLedgerDetail.unknownVillage'));
    setAmount(entry.amount);
    setNotes(entry.notes || '');
  };

  const cancelEdit = () => {
    setEditingEntryId(null);
    setPersonName('');
    setVillage('');
    setAmount('');
    setNotes('');
    setSelectedPersonId(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setTimeout(() => nameRef.current?.focus(), 50);
  };

  if (loading) return (
    <Layout>
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--primary)]/20 border-t-[var(--secondary)]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 bg-[var(--secondary)] rounded-full"></div>
          </div>
        </div>
      </div>
    </Layout>
  );

  if (!event) return <Layout><div className="text-center mt-20 text-xl font-tamil">{t('eventLedgerDetail.ledgerNotFound')}</div></Layout>;

  if (isBookView) {
    return <NotebookView event={event} entries={entries} onClose={() => setIsBookView(false)} />;
  }

  return (
    <Layout noPadding noScroll>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.04] text-ledger-brown">
        <div className="absolute top-10 left-10 w-64 h-64"><BananaTree className="w-full h-full" /></div>
        <div className="absolute bottom-10 right-10 w-80 h-80"><TempleGopuram className="w-full h-full" /></div>
        <div className="absolute top-1/2 left-1/4 w-48 h-24 transform -rotate-12"><PalmLeafManuscript className="w-full h-full" /></div>
        <div className="absolute -top-10 -right-10 w-64 h-64 transform rotate-12"><KolamPattern className="w-full h-full" /></div>
        <div className="absolute top-24 left-4 w-8 h-8"><CornerMark className="w-full h-full" /></div>
        <div className="absolute top-24 right-4 w-8 h-8 transform rotate-90"><CornerMark className="w-full h-full" /></div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen flex flex-col relative pt-4 pb-20 z-10">
        {/* Compact Header Summary */}
        <div className="flex justify-between items-end mb-2 border-b-2 border-ledger-brown pb-2 px-2 shrink-0">
          <div className="flex items-center gap-3">
            <Link to="/events" className="p-1 text-ledger-brown hover:bg-ledger-brown/10 rounded transition-colors">
              <ChevronLeft size={20} />
            </Link>
            <div className="flex items-baseline gap-4">
              <h1 className="text-xl md:text-2xl font-bold text-ledger-ink font-tamil">
                {event.eventName}
              </h1>
              <p className="text-[10px] md:text-xs font-bold text-ledger-brown/80 uppercase tracking-widest hidden sm:block">
                {new Date(event.eventDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} • {event.location}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsBookView(true)}
            className="px-2 py-1 bg-ledger-paper text-ledger-ink border border-ledger-brown text-[10px] font-bold uppercase tracking-wider hover:bg-ledger-brown/10 transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <Book size={12} className="hidden sm:block" /> {t('eventLedgerDetail.viewCompleteLedger')}
          </button>
        </div>

        {/* Compact Horizontal Summary Strip */}
        <div className="flex justify-between md:justify-start gap-4 md:gap-12 mb-2 bg-ledger-paper/60 py-1.5 px-4 border border-ledger-brown/20 shrink-0">
          <div className="flex items-baseline gap-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-ledger-brown/70">{t('eventLedgerDetail.totalEntries')}:</p>
            <p className="text-lg font-serif text-ledger-ink font-bold leading-none">{entries.length}</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-ledger-brown/70">{t('eventLedgerDetail.totalCollection')}:</p>
            <motion.p key={event.totalCollection} initial={{ scale: 1.1, color: '#388E3C' }} animate={{ scale: 1, color: '#2E4C24' }} className="text-lg font-serif text-ledger-green font-bold tracking-tight leading-none">₹{event.totalCollection?.toLocaleString('en-IN') || 0}</motion.p>
          </div>
          <div className="hidden md:flex items-baseline gap-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-ledger-brown/70">{t('eventLedgerDetail.lastEntry')}:</p>
            <p className="text-lg font-serif text-ledger-ink font-bold tracking-tight leading-none">
              {entries.length > 0 ? `₹${entries[0].amount}` : '-'}
            </p>
          </div>
        </div>

        {/* Entries Area - Dense Notebook Style */}
        <div className="flex-1 flex flex-col min-h-0 bg-ledger-paper relative">
          <div className="absolute top-0 bottom-0 left-10 md:left-14 w-0 border-l-2 border-ledger-red/30 z-0"></div>

          <div className="flex-1 border-t-2 border-ledger-brown relative flex flex-col">
            <div className={`overflow-y-auto custom-scrollbar flex-1 pb-2 transition-all duration-500 ${isFormOpen ? 'pb-[400px]' : 'pb-2'} md:pb-2`}>
              <AnimatePresence>
                {(() => {
                  const remainder = entries.length % ENTRIES_PER_PAGE;
                  const firstPageSize = remainder === 0 || entries.length === 0 ? ENTRIES_PER_PAGE : remainder;

                  let startIndex, endIndex;
                  if (currentPage === 1) {
                    startIndex = 0;
                    endIndex = firstPageSize;
                  } else {
                    startIndex = firstPageSize + (currentPage - 2) * ENTRIES_PER_PAGE;
                    endIndex = startIndex + ENTRIES_PER_PAGE;
                  }

                  return entries.slice(startIndex, endIndex).reverse().map((entry, idx) => {
                    const originalIdx = entries.indexOf(entry);
                    const isEven = idx % 2 === 0;

                    return (
                      <motion.div
                        key={entry._id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.1 }}
                        className={`flex items-center justify-between py-1 px-1 md:px-2 border-b border-ledger-brown/15 hover:bg-ledger-brown/10 transition-colors group relative z-10 ${isEven ? 'bg-transparent' : 'bg-ledger-brown/[0.02]'}`}
                      >
                        <div className="flex items-center gap-2 md:gap-4 flex-1 pl-1 md:pl-2">
                          <div className="w-6 md:w-8 text-right text-ledger-brown/60 font-serif text-xs md:text-sm">
                            {entries.length - originalIdx}.
                          </div>
                          <div className="flex flex-1 items-baseline gap-2 md:gap-4 pl-2 md:pl-4">
                            <div className="flex flex-col">
                              {entry.personId?.editHistory?.map((h, i) => (
                                <div key={i} className="text-[9px] text-ledger-red line-through decoration-1 flex gap-1 font-tamil">
                                  <span>{h.name}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm md:text-[15px] font-tamil text-ledger-ink line-clamp-1">{entry.personId?.name || t('eventLedgerDetail.unknownPerson')}</p>
                              {entry.notes && (
                                <span className="text-[9px] md:text-[10px] font-serif text-ledger-brown/80 italic border border-ledger-brown/20 bg-ledger-brown/5 px-1.5 py-0.5 rounded-full shrink-0">
                                  {entry.notes}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] md:text-xs font-serif text-ledger-brown/80 hidden sm:block line-clamp-1">{entry.personId?.village || t('eventLedgerDetail.unknownVillage')}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4 text-right pr-2 md:pr-4">
                          <div className="hidden md:flex flex-col items-end">
                            {entry.editHistory?.length > 0 && <span className="text-[8px] uppercase font-bold text-ledger-brown border border-ledger-brown/30 px-1 rounded-sm">{t('eventLedgerDetail.edited')}</span>}
                          </div>
                          <div className="w-16 md:w-24 shrink-0">
                            <div className="flex flex-col items-end">
                              {entry.editHistory?.map((h, i) => (
                                <span key={i} className="text-[9px] font-serif text-ledger-red line-through decoration-1">
                                  ₹{h.amount.toLocaleString('en-IN')}
                                </span>
                              ))}
                            </div>
                            <p className="font-bold text-base md:text-lg font-serif text-ledger-green tracking-tight">₹{entry.amount.toLocaleString('en-IN')}</p>
                          </div>
                        </div>

                        {/* Fast hover edit button */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-ledger-paper shadow-sm">
                          <button onClick={() => handleEditClick(entry)} className="p-1 md:p-1.5 text-ledger-brown hover:bg-ledger-brown hover:text-ledger-paper border border-ledger-brown/20 transition-colors">
                            <Edit2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                })()}
                {entries.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-ledger-brown/50 font-serif italic text-xs">{t('eventLedgerDetail.noEntriesYet')}</p>
                  </div>
                )}
              </AnimatePresence>

              {/* Pagination Controls - Hugging the entries */}
              {Math.ceil(entries.length / ENTRIES_PER_PAGE) > 1 && (
                <div className="flex items-center justify-between py-2 px-4 mt-2 border-t border-ledger-brown/20 z-10 bg-ledger-brown/[0.03] rounded mx-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs font-bold text-ledger-ink hover:bg-ledger-brown/10 disabled:opacity-30 rounded transition-colors flex items-center shadow-sm border border-transparent hover:border-ledger-brown/20 bg-white"
                  >
                    <ChevronLeft size={14} /> {t('common.previous') || 'Prev'}
                  </button>
                  <span className="text-xs font-bold text-ledger-brown/70 bg-white px-3 py-1 rounded shadow-sm">
                    Page {currentPage} of {Math.ceil(entries.length / ENTRIES_PER_PAGE)}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(entries.length / ENTRIES_PER_PAGE), p + 1))}
                    disabled={currentPage === Math.ceil(entries.length / ENTRIES_PER_PAGE)}
                    className="px-3 py-1 text-xs font-bold text-ledger-ink hover:bg-ledger-brown/10 disabled:opacity-30 rounded transition-colors flex items-center shadow-sm border border-transparent hover:border-ledger-brown/20 bg-white"
                  >
                    {t('common.next') || 'Next'} <ChevronLeft size={14} className="rotate-180" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Centered Floating Fast Entry Form - Premium Dark Theme */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`fixed bottom-16 md:bottom-6 left-0 right-0 z-30 flex justify-center pointer-events-none md:px-8 transition-transform duration-500 ease-in-out md:translate-y-0 ${!isFormOpen ? 'translate-y-[calc(100%-3.5rem)]' : 'translate-y-0'}`}
        >
          <div className="pointer-events-auto w-full max-w-6xl bg-[#2A2118] md:rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.5)] border-t border-l border-r md:border-2 border-[#D4AF37]/40 p-4 pt-1 md:p-6 relative rounded-t-xl">
            
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

            {/* Subtle leather texture overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay rounded-t-xl md:rounded-xl" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

            <div className="relative z-10">
              {editingEntryId && (
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#D4AF37]/20">
                  <p className="text-sm font-bold text-[#D4AF37] flex items-center gap-2 uppercase tracking-widest"><Edit2 size={14} /> {t('eventLedgerDetail.editingEntry')}</p>
                  <button onClick={cancelEdit} className="text-[#D4AF37] hover:text-white p-1.5 rounded transition-colors bg-white/10"><X size={16} /></button>
                </div>
              )}
              <form onSubmit={handleSubmitForm} className="flex flex-col md:flex-row gap-4 md:gap-5 items-stretch md:items-end">
                <div className="flex-[2] w-full relative">
                  <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 text-[#D4AF37]/80">{t('eventLedgerDetail.nameInitial')}</label>
                  <input ref={nameRef} type="text" required value={personName} onChange={handleNameChange} onKeyDown={handleNameKeyDown} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} className="w-full bg-[#FDFBF7] border-2 border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/20 rounded-md outline-none text-lg md:text-xl font-bold font-tamil px-3 py-2.5 md:py-3 transition-all placeholder-[#2A2118]/30 text-[#2A2118] shadow-inner" placeholder={t('eventLedgerDetail.namePlaceholder')} />

                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 w-full mb-2 bg-[#FDFBF7] shadow-2xl border-2 border-[#D4AF37]/40 z-50 max-h-48 overflow-y-auto custom-scrollbar rounded-md">
                      {suggestions.map((person) => (
                        <div
                          key={person._id}
                          onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(person); }}
                          className="px-4 py-3 hover:bg-[#D4AF37]/20 cursor-pointer border-b border-[#2A2118]/10 last:border-0 transition-colors flex justify-between items-start"
                        >
                          <div className="flex flex-col gap-0.5">
                            <p className="font-bold text-base font-tamil text-[#2A2118] leading-none">{person.name}</p>
                            {person.notes && (
                              <span className="text-[10px] text-ledger-brown/80 italic font-serif leading-tight">
                                {person.notes}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-serif text-[#2A2118]/70 mt-0.5">{person.village || t('eventLedgerDetail.unknownVillage')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-[1.5] w-full relative">
                  <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 text-[#D4AF37]/80">{t('eventLedgerDetail.village')}</label>
                  <input ref={villageRef} type="text" value={village} onChange={handleVillageChange} onKeyDown={handleVillageKeyDown} onFocus={() => villageSuggestions.length > 0 && setShowVillageSuggestions(true)} onBlur={() => setTimeout(() => setShowVillageSuggestions(false), 200)} className="w-full bg-[#FDFBF7] border-2 border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/20 rounded-md outline-none text-lg md:text-xl font-serif px-3 py-2.5 md:py-3 transition-all placeholder-[#2A2118]/30 text-[#2A2118] shadow-inner" placeholder={t('eventLedgerDetail.villagePlaceholder')} />

                  {showVillageSuggestions && villageSuggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 w-full mb-2 bg-[#FDFBF7] shadow-2xl border-2 border-[#D4AF37]/40 z-50 max-h-48 overflow-y-auto custom-scrollbar rounded-md">
                      {villageSuggestions.map((v, idx) => (
                        <div
                          key={idx}
                          onMouseDown={(e) => { e.preventDefault(); handleSelectVillageSuggestion(v); }}
                          className="px-4 py-3 hover:bg-[#D4AF37]/20 cursor-pointer border-b border-[#2A2118]/10 last:border-0 transition-colors"
                        >
                          <p className="font-bold text-base font-tamil text-[#2A2118]">{v}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-full md:w-36 shrink-0">
                  <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 text-[#D4AF37]/80">{t('eventLedgerDetail.amount')}</label>
                  <input ref={amountRef} type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[#FDFBF7] border-2 border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/20 rounded-md outline-none text-xl md:text-3xl font-bold text-[#1B4332] px-3 py-2 md:py-2.5 transition-all placeholder-[#2A2118]/30 text-right shadow-inner" placeholder="₹" />
                </div>
                <div className="flex-[1.5] w-full">
                  <label className="block text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1.5 text-[#D4AF37]/80">{t('eventLedgerDetail.notes')}</label>
                  <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-[#FDFBF7] border-2 border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/20 rounded-md outline-none text-base md:text-lg font-serif px-3 py-2.5 md:py-3 transition-all placeholder-[#2A2118]/30 text-[#2A2118] shadow-inner" placeholder={t('eventLedgerDetail.optionalNotes')} />
                </div>
                <button type="submit" className={`w-full md:w-auto px-8 md:px-12 py-3 md:py-4 text-base md:text-lg font-bold uppercase tracking-[0.2em] transition-all rounded-lg h-[52px] md:h-[64px] flex items-center justify-center gap-3 shadow-[0_8px_20px_rgba(155,44,44,0.3)] hover:shadow-[0_12px_25px_rgba(155,44,44,0.5)] ${editingEntryId ? 'bg-white text-ledger-red hover:bg-ledger-paper' : 'bg-gradient-to-r from-ledger-red via-[#801b1b] to-ledger-red text-white hover:scale-[1.02] active:scale-95 border border-[#c54545]/30'}`}>
                  {editingEntryId ? 'UPDATE' : (
                    <>
                      <Plus size={20} className="text-white/80" />
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

export default EventLedgerDetail;
