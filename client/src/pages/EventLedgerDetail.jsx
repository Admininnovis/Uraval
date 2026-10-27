import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import UravinLoading from '../components/UravinLoading';
import api from '../services/api';
import { Book, ChevronLeft, Plus, Edit2, X, ChevronUp, ChevronDown, AlertTriangle, Info, CheckCircle2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotebookView from '../components/NotebookView';
import { BananaTree, TempleGopuram, PalmLeafManuscript, KolamPattern, CornerMark } from '../components/Illustrations';
import { useLanguage } from '../context/LanguageContext';

const EventLedgerDetail = () => {
  const { t, language, tData } = useLanguage();
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentRequired, setPaymentRequired] = useState(false);
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
  const notesRef = React.useRef(null);
  const isSelectingRef = React.useRef(false);
  const touchStartYRef = React.useRef(null);

  const handleSheetTouchStart = (e) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleSheetTouchEnd = (e) => {
    if (touchStartYRef.current !== null) {
      const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
      if (deltaY > 35) {
        setIsFormOpen(false); // Swiped down -> close
      } else if (deltaY < -35) {
        setIsFormOpen(true); // Swiped up -> open
      }
      touchStartYRef.current = null;
    }
  };

  // Helper to trim whitespace, collapse multiple spaces, and uppercase all for accurate exact comparison
  const cleanCompare = (text) => (text || '').toString().trim().toUpperCase().replace(/\s+/g, ' ');

  const isNameMatching = (name1, name2) => {
    const n1 = cleanCompare(name1);
    const n2 = cleanCompare(name2);
    if (!n1 || !n2) return false;
    return n1 === n2;
  };

  const isVillageMatching = (v1, v2) => {
    const c1 = cleanCompare(v1);
    const c2 = cleanCompare(v2);
    if (!c1 && !c2) return true; // both empty
    if (!c1 || !c2) return false;
    return c1 === c2;
  };

  // Existing entries in the current event ledger matching typed name
  const nameMatchesInCurrentLedger = React.useMemo(() => {
    const trimmed = personName.trim();
    if (trimmed.length < 2) return [];
    return entries.filter(en => {
      if (editingEntryId && en._id === editingEntryId) return false;
      return isNameMatching(en.personId?.name, trimmed);
    });
  }, [entries, personName, editingEntryId]);

  // Existing entries matching BOTH name and village in this event ledger
  const exactMatchesInCurrentLedger = React.useMemo(() => {
    const trimmedVillage = village.trim();
    if (nameMatchesInCurrentLedger.length === 0) return [];
    return nameMatchesInCurrentLedger.filter(en => {
      return isVillageMatching(en.personId?.village, trimmedVillage);
    });
  }, [nameMatchesInCurrentLedger, village]);

  // Check if an existing entry has the exact same name, village AND note
  const duplicateWithExactNote = React.useMemo(() => {
    if (exactMatchesInCurrentLedger.length === 0) return null;
    const currentNoteClean = cleanCompare(notes);
    return exactMatchesInCurrentLedger.find(en => {
      const enNoteClean = cleanCompare(en.notes || en.personId?.notes);
      return enNoteClean === currentNoteClean;
    });
  }, [exactMatchesInCurrentLedger, notes]);

  const isNoteRequired = exactMatchesInCurrentLedger.length > 0;

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      const evt = response.data.event;
      if (!evt.isLegacy && (!evt.isPaid || evt.status !== 'active')) {
        setPaymentRequired(true);
        return;
      }
      setEvent(evt);
      setEntries(response.data.entries);
      setCurrentPage(1); // Reset to first page on fetch
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.error === 'BOOKLET_PAYMENT_REQUIRED') {
        setPaymentRequired(true);
      } else {
        console.error('Error fetching event details:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = async (e) => {
    const value = e.target.value;
    setPersonName(value);
    setSelectedPersonId(null); // Reset if they edit

    if (value.trim().length > 0) {
      try {
        const response = await api.get(`/people/search?query=${encodeURIComponent(value.trim())}`);
        const allResults = response.data.results || [];
        setSuggestions(allResults);
        setShowSuggestions(allResults.length > 0);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleVillageChange = async (e) => {
    const value = e.target.value;
    setVillage(value);

    if (value.trim().length > 0) {
      try {
        const response = await api.get(`/people/search?query=${encodeURIComponent(value.trim())}`);
        const results = response.data.results || [];
        const uniqueVillages = [...new Set(results.map(p => p.village).filter(Boolean))];
        setVillageSuggestions(uniqueVillages);
        setShowVillageSuggestions(uniqueVillages.length > 0);
      } catch (error) {
        console.error('Error fetching village suggestions:', error);
        setVillageSuggestions([]);
        setShowVillageSuggestions(false);
      }
    } else {
      setVillageSuggestions([]);
      setShowVillageSuggestions(false);
    }
  };

  const handleSelectVillageSuggestion = (villageName) => {
    isSelectingRef.current = false;
    setVillage(villageName);
    setShowVillageSuggestions(false);
    setTimeout(() => amountRef.current?.focus(), 50);
  };

  const handleSelectSuggestion = (person) => {
    isSelectingRef.current = false;
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

  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    if (selectedPersonId) {
      setSelectedPersonId(null);
    }
  };

  const handleAmountKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (isNoteRequired && !notes.trim()) {
        e.preventDefault();
        notesRef.current?.focus();
      }
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    // Enforce unique user requirement in current event ledger
    if (isNoteRequired && !notes.trim()) {
      const matchName = exactMatchesInCurrentLedger[0]?.personId?.name || personName;
      const matchVillage = exactMatchesInCurrentLedger[0]?.personId?.village || village;
      alert(`"${matchName}" (${matchVillage}) ${t('eventLedgerDetail.exactMatchAlert')}`);
      notesRef.current?.focus();
      return;
    }

    if (duplicateWithExactNote) {
      alert(t('eventLedgerDetail.duplicateWithNoteExists'));
      notesRef.current?.focus();
      return;
    }

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
          personId = personRes.data?.person?._id || personRes.data?._id;
        }

        // Create ledger entry
        const entryRes = await api.post(`/events/${id}/entries`, {
          personId,
          amount: Number(amount),
          notes,
        });

        // Add to entries state from API response
        const savedEntry = entryRes.data?.entry || entryRes.data;
        if (savedEntry) {
          const newEntryObj = {
            ...savedEntry,
            personId: savedEntry.personId && typeof savedEntry.personId === 'object'
              ? savedEntry.personId
              : {
                  _id: personId,
                  name: personName,
                  village: village,
                  notes: notes,
                },
          };
          setEntries(prev => [newEntryObj, ...prev.filter(e => e._id !== newEntryObj._id)]);
        }

        // Update the person's notes so they are saved for autocomplete
        if (personId && notes) {
          try {
            await api.put(`/people/${personId}`, { notes: notes });
          } catch (_) {}
        }
      }

      // Clear form and refetch
      cancelEdit();
      fetchEventDetails();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert(error.response.data.message || t('eventLedgerDetail.alreadyContributed'));
      } else {
        console.error('Error submitting entry:', error);
        alert(t('eventLedgerDetail.failedToSubmit'));
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
        <UravinLoading size="lg" />
      </div>
    </Layout>
  );

  if (paymentRequired) {
    return (
      <Layout>
        <div className="max-w-md mx-auto my-16 p-8 bg-[#FAF7F2] border-2 border-amber-600/50 rounded-2xl text-center shadow-lg font-sans">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-800 mb-4">
            <Lock size={28} />
          </div>
          <h2 className="text-xl font-bold font-serif text-[#432C20] mb-2">Booklet Activation Required</h2>
          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            This booklet requires ₹150 one-time payment (incl. 18% GST) before it can be opened or entries can be added.
          </p>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#432C20] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#322118] transition shadow"
          >
            Back to Event Ledger
          </Link>
        </div>
      </Layout>
    );
  }

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
                {tData(event.eventName)}
              </h1>
              <p className="text-[10px] md:text-xs font-bold text-ledger-brown/80 uppercase tracking-widest hidden sm:block">
                {new Date(event.eventDate).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} • {tData(event.location)}
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
            <p className="text-lg font-serif text-ledger-ink font-bold leading-tight">{entries.length}</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-ledger-brown/70">{t('eventLedgerDetail.totalCollection')}:</p>
            <motion.p key={event.totalCollection} initial={{ scale: 1.1, color: '#388E3C' }} animate={{ scale: 1, color: '#2E4C24' }} className="text-lg font-serif text-ledger-green font-bold tracking-tight leading-tight">₹{event.totalCollection?.toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN') || 0}</motion.p>
          </div>
          <div className="hidden md:flex items-baseline gap-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-ledger-brown/70">{t('eventLedgerDetail.lastEntry')}:</p>
            <p className="text-lg font-serif text-ledger-ink font-bold tracking-tight leading-tight">
              {entries.length > 0 ? `₹${entries[0].amount}` : '-'}
            </p>
          </div>
        </div>

        {/* Entries Area - Dense Notebook Style with Fixed Width Columns */}
        <div className="flex-1 flex flex-col min-h-0 bg-ledger-paper relative">
          <div className="absolute top-0 bottom-0 left-10 md:left-14 w-0 border-l-2 border-ledger-red/30 z-0"></div>

          <div className="flex-1 border-t-2 border-ledger-brown relative flex flex-col">
            {/* Sticky Table Header for Fixed Columns */}
            <div className="flex items-center justify-between py-2 px-1 md:px-3 bg-[#EFE6D7] border-b-2 border-ledger-brown/30 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-ledger-brown/90 select-none sticky top-0 z-20 shadow-xs font-sans leading-snug">
              <div className="w-7 sm:w-10 md:w-12 shrink-0 text-center font-serif text-ledger-brown/70">
                {language === 'ta' ? 'எண்' : '#'}
              </div>
              <div className="flex-1 min-w-[90px] sm:min-w-[160px] md:min-w-[200px] px-1.5 sm:px-3 text-left truncate">
                {t('eventLedgerDetail.giverName')}
              </div>
              <div className="w-20 sm:w-32 md:w-48 shrink-0 px-1.5 sm:px-3 text-left border-l border-ledger-brown/15 truncate">
                {t('eventLedgerDetail.place')}
              </div>
              <div className="w-20 sm:w-28 md:w-40 shrink-0 text-right pr-1.5 sm:pr-4 border-l border-ledger-brown/15 truncate">
                {t('eventLedgerDetail.amount')}
              </div>
            </div>

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
                        className={`flex items-center justify-between py-1.5 px-1 md:px-3 border-b border-ledger-brown/15 hover:bg-ledger-brown/10 transition-colors group relative z-10 ${isEven ? 'bg-transparent' : 'bg-ledger-brown/[0.02]'}`}
                      >
                        {/* Column 1: S.No (Fixed) */}
                        <div className="w-7 sm:w-10 md:w-12 shrink-0 text-center text-ledger-brown/70 font-serif text-xs md:text-sm font-semibold">
                          {entries.length - originalIdx}.
                        </div>

                        {/* Column 2: Name & Notes (Fixed flex) */}
                        <div className="flex-1 min-w-[90px] sm:min-w-[160px] md:min-w-[200px] px-1.5 sm:px-3 flex items-center gap-2 overflow-hidden">
                          <div className="flex flex-col min-w-0">
                            {entry.personId?.editHistory?.map((h, i) => (
                              <div key={i} className="text-[9px] text-ledger-red line-through decoration-1 flex gap-1 font-tamil truncate">
                                <span>{tData(h.name)}</span>
                              </div>
                            ))}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-sm md:text-[15px] font-tamil text-ledger-ink truncate">
                                {tData(entry.personId?.name) || t('eventLedgerDetail.unknownPerson')}
                              </p>
                              {entry.notes && (
                                <span className="text-[9px] md:text-[10px] font-serif text-ledger-brown/80 italic border border-ledger-brown/20 bg-ledger-brown/5 px-1.5 py-0.5 rounded-full shrink-0">
                                  {tData(entry.notes)}
                                </span>
                              )}

                            </div>
                          </div>
                        </div>

                        {/* Column 3: Village / Place (Fixed width column) */}
                        <div className="w-20 sm:w-32 md:w-48 shrink-0 px-1.5 sm:px-3 text-left border-l border-ledger-brown/10">
                          <div className="flex flex-col min-w-0">
                            {entry.personId?.editHistory?.map((h, i) => (
                              <span key={i} className="text-[8px] text-ledger-red/70 line-through decoration-1 font-serif truncate">
                                {tData(h.village)}
                              </span>
                            ))}
                            <p className="text-xs sm:text-[13px] font-serif text-ledger-brown font-medium truncate">
                              {tData(entry.personId?.village) || t('eventLedgerDetail.unknownVillage')}
                            </p>
                          </div>
                        </div>

                        {/* Column 4: Amount (Fixed width column) */}
                        <div className="w-20 sm:w-28 md:w-40 shrink-0 text-right pr-1.5 sm:pr-4 flex items-center justify-end gap-1 sm:gap-2 border-l border-ledger-brown/10">
                          <div className="hidden md:flex flex-col items-end">
                            {entry.editHistory?.length > 0 && <span className="text-[8px] uppercase font-bold text-ledger-brown border border-ledger-brown/30 px-1 rounded-sm">{t('eventLedgerDetail.edited')}</span>}
                          </div>
                          <div className="w-16 md:w-24 shrink-0">
                            <div className="flex flex-col items-end">
                              {entry.editHistory?.map((h, i) => (
                                <span key={i} className="text-[9px] font-serif text-ledger-red line-through decoration-1">
                                  ₹{h.amount.toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                                </span>
                              ))}
                            </div>
                            <p className="font-bold text-base md:text-lg font-serif text-ledger-green tracking-tight">₹{entry.amount.toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}</p>
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
                    <ChevronLeft size={14} /> {t('common.previous')}
                  </button>
                  <span className="text-xs font-bold text-ledger-brown/70 bg-white px-3 py-1 rounded shadow-sm">
                    {language === 'ta' ? `பக்கம் ${currentPage} / ${Math.ceil(entries.length / ENTRIES_PER_PAGE)}` : `Page ${currentPage} of ${Math.ceil(entries.length / ENTRIES_PER_PAGE)}`}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(entries.length / ENTRIES_PER_PAGE), p + 1))}
                    disabled={currentPage === Math.ceil(entries.length / ENTRIES_PER_PAGE)}
                    className="px-3 py-1 text-xs font-bold text-ledger-ink hover:bg-ledger-brown/10 disabled:opacity-30 rounded transition-colors flex items-center shadow-sm border border-transparent hover:border-ledger-brown/20 bg-white"
                  >
                    {t('common.next')} <ChevronLeft size={14} className="rotate-180" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Centered Floating Fast Entry Form - Dashboard & Settings Ivory Gold Theme */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`fixed bottom-16 md:bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none md:px-8 transition-transform duration-500 ease-in-out md:translate-y-0 ${!isFormOpen ? 'translate-y-[calc(100%-3.5rem)]' : 'translate-y-0'}`}
        >
          <div className="pointer-events-auto w-full max-w-6xl bg-[#F7F3EB] md:rounded-2xl shadow-[0_20px_50px_rgba(67,44,32,0.22)] border-t-2 border-l border-r md:border-2 border-[#DDD1BF] p-4 pt-2.5 md:p-6 relative rounded-t-2xl overflow-visible">
            
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

            <div className="relative z-10">
              {editingEntryId && (
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#DDD1BF]">
                  <p className="text-sm font-bold text-[#8A5A1E] flex items-center gap-2 uppercase tracking-wider"><Edit2 size={14} /> {t('eventLedgerDetail.editingEntry')}</p>
                  <button onClick={cancelEdit} className="text-[#8A5A1E] hover:text-[#432C20] p-1.5 rounded-lg transition-colors bg-[#EDE5D8]"><X size={16} /></button>
                </div>
              )}

              {/* Unique User & Duplicate Name Alerts */}
              <AnimatePresence>
                {exactMatchesInCurrentLedger.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    className="mb-3 px-3.5 py-2.5 rounded-xl border-2 border-amber-400 bg-amber-50 text-amber-900 text-xs shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 overflow-hidden"
                  >
                    <div className="flex items-start sm:items-center gap-2.5">
                      <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5 sm:mt-0 animate-bounce" />
                      <div>
                        <span className="font-bold text-amber-900 font-tamil text-sm">
                          "{tData(exactMatchesInCurrentLedger[0].personId?.name)}"
                        </span>
                        <span className="text-amber-800 ml-1">
                          ({tData(exactMatchesInCurrentLedger[0].personId?.village) || t('eventLedgerDetail.unknownVillage')}) {t('eventLedgerDetail.exactMatchAlert')}
                        </span>
                        <div className="text-[11px] text-amber-700 mt-0.5 flex flex-wrap items-center gap-2 font-serif">
                          <span>{t('eventLedgerDetail.lastEntry')}: ₹{exactMatchesInCurrentLedger[0].amount.toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}</span>
                          {exactMatchesInCurrentLedger[0].notes && (
                            <span className="italic bg-amber-200/60 px-1.5 py-0.5 rounded border border-amber-300">
                              {t('eventLedgerDetail.notes')}: {tData(exactMatchesInCurrentLedger[0].notes)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 self-end sm:self-center">
                      {notes.trim() ? (
                        duplicateWithExactNote ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-rose-100 text-rose-700 border border-rose-300">
                            {t('eventLedgerDetail.noteCollision')}
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 size={12} /> {t('eventLedgerDetail.noteAddedUnique')}
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-amber-500 text-white animate-pulse font-sans">
                          {t('eventLedgerDetail.noteRequired')}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}

                {exactMatchesInCurrentLedger.length === 0 && nameMatchesInCurrentLedger.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    className="mb-3 px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs shadow-sm flex items-center gap-2.5 overflow-hidden"
                  >
                    <Info size={16} className="text-amber-700 shrink-0" />
                    <div className="flex-1 overflow-x-auto whitespace-nowrap custom-scrollbar py-0.5">
                      <span className="font-bold text-amber-900 mr-1.5">{t('eventLedgerDetail.nameExistsInLedger')}</span>
                      {nameMatchesInCurrentLedger.map((en, idx) => (
                        <span key={en._id} className="inline-flex items-center gap-1 mr-3 font-tamil text-[13px] text-stone-800">
                          <strong className="text-[#8A5A1E]">{tData(en.personId?.name)}</strong>
                          <span className="text-stone-500 text-xs">({tData(en.personId?.village) || t('eventLedgerDetail.unknownVillage')})</span>
                          <span className="text-emerald-700 text-xs font-serif font-bold">₹{en.amount.toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}</span>
                          {en.notes && <span className="text-[10px] italic text-stone-500 font-serif">[{tData(en.notes)}]</span>}
                          {idx < nameMatchesInCurrentLedger.length - 1 && <span className="text-stone-300 ml-2">•</span>}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmitForm} className="flex flex-col md:flex-row gap-3.5 md:gap-4 items-stretch md:items-end">
                <div className="flex-[2] w-full relative">
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-[#8A5A1E] font-sans">{t('eventLedgerDetail.nameInitial')}</label>
                  <input
                    ref={nameRef}
                    type="text"
                    required
                    value={personName}
                    onChange={handleNameChange}
                    onKeyDown={handleNameKeyDown}
                    onFocus={() => {
                      if (suggestions.length > 0) {
                        setShowSuggestions(true);
                      } else if (personName.trim()) {
                        handleNameChange({ target: { value: personName } });
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        if (!isSelectingRef.current) {
                          setShowSuggestions(false);
                        }
                      }, 250);
                    }}
                    className="w-full bg-white border-2 border-[#DDD1BF] focus:border-[#B68A3D] focus:ring-4 focus:ring-[#B68A3D]/20 rounded-xl outline-none text-base md:text-lg font-bold font-tamil px-3.5 py-2.5 md:py-3 transition-all placeholder-stone-400 text-[#432C20] shadow-xs"
                    placeholder={t('eventLedgerDetail.namePlaceholder')}
                  />

                  {showSuggestions && suggestions.length > 0 && (
                    <div 
                      className="absolute bottom-full left-0 w-full mb-2 bg-[#FDFBF7] shadow-2xl border-2 border-[#DDD1BF] z-[100] max-h-56 overflow-y-auto custom-scrollbar rounded-xl touch-pan-y"
                      onTouchStart={(e) => { e.stopPropagation(); isSelectingRef.current = true; }}
                      onTouchMove={(e) => e.stopPropagation()}
                      onMouseDown={() => { isSelectingRef.current = true; }}
                    >
                      {suggestions.map((person) => {
                        const existingInEvent = entries.find(en => en.personId?._id === person._id);
                        return (
                          <div
                            key={person._id}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              isSelectingRef.current = true;
                              handleSelectSuggestion(person);
                            }}
                            onTouchEnd={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              isSelectingRef.current = true;
                              handleSelectSuggestion(person);
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSelectSuggestion(person);
                            }}
                            className="px-4 py-3 hover:bg-[#EDE5D8]/60 active:bg-[#EDE5D8] cursor-pointer border-b border-[#DDD1BF]/60 last:border-0 transition-colors flex justify-between items-start select-none"
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-base font-tamil text-[#432C20] leading-none">{tData(person.name)}</p>
                                {existingInEvent && (
                                  <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-sans font-bold">
                                    {t('eventLedgerDetail.alreadyInThisEvent')} (₹{existingInEvent.amount})
                                  </span>
                                )}
                              </div>
                              {person.notes && (
                                <span className="text-[10px] text-stone-500 italic font-serif leading-tight">
                                  {tData(person.notes)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-serif text-stone-500 mt-0.5">{tData(person.village) || t('eventLedgerDetail.unknownVillage')}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex-[1.5] w-full relative">
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-[#8A5A1E] font-sans">{t('eventLedgerDetail.village')}</label>
                  <input
                    ref={villageRef}
                    type="text"
                    value={village}
                    onChange={handleVillageChange}
                    onKeyDown={handleVillageKeyDown}
                    onFocus={() => {
                      if (villageSuggestions.length > 0) {
                        setShowVillageSuggestions(true);
                      } else if (village.trim()) {
                        handleVillageChange({ target: { value: village } });
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        if (!isSelectingRef.current) {
                          setShowVillageSuggestions(false);
                        }
                      }, 250);
                    }}
                    className="w-full bg-white border-2 border-[#DDD1BF] focus:border-[#B68A3D] focus:ring-4 focus:ring-[#B68A3D]/20 rounded-xl outline-none text-base md:text-lg font-serif px-3.5 py-2.5 md:py-3 transition-all placeholder-stone-400 text-[#432C20] shadow-xs"
                    placeholder={t('eventLedgerDetail.villagePlaceholder')}
                  />

                  {showVillageSuggestions && villageSuggestions.length > 0 && (
                    <div 
                      className="absolute bottom-full left-0 w-full mb-2 bg-[#FDFBF7] shadow-2xl border-2 border-[#DDD1BF] z-[100] max-h-56 overflow-y-auto custom-scrollbar rounded-xl touch-pan-y"
                      onTouchStart={(e) => { e.stopPropagation(); isSelectingRef.current = true; }}
                      onTouchMove={(e) => e.stopPropagation()}
                      onMouseDown={() => { isSelectingRef.current = true; }}
                    >
                      {villageSuggestions.map((v, idx) => (
                        <div
                          key={idx}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            isSelectingRef.current = true;
                            handleSelectVillageSuggestion(v);
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            isSelectingRef.current = true;
                            handleSelectVillageSuggestion(v);
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelectVillageSuggestion(v);
                          }}
                          className="px-4 py-3 hover:bg-[#EDE5D8]/60 active:bg-[#EDE5D8] cursor-pointer border-b border-[#DDD1BF]/60 last:border-0 transition-colors select-none"
                        >
                          <p className="font-bold text-base font-tamil text-[#432C20]">{tData(v)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-full md:w-36 shrink-0">
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-[#8A5A1E] font-sans">{t('eventLedgerDetail.amount')}</label>
                  <input ref={amountRef} type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={handleAmountKeyDown} className="w-full bg-white border-2 border-[#DDD1BF] focus:border-[#B68A3D] focus:ring-4 focus:ring-[#B68A3D]/20 rounded-xl outline-none text-xl md:text-2xl font-bold text-[#1B5E20] px-3.5 py-2 md:py-2.5 transition-all placeholder-stone-400 text-right shadow-xs" placeholder="₹" />
                </div>
                <div className="flex-[1.5] w-full">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#8A5A1E] font-sans">
                      {t('eventLedgerDetail.notes')}
                    </label>
                    {isNoteRequired && (
                      <span className={`text-[9px] font-bold ${notes.trim() ? (duplicateWithExactNote ? 'text-rose-600' : 'text-emerald-700') : 'text-amber-600 animate-pulse'}`}>
                        {notes.trim() ? (duplicateWithExactNote ? t('eventLedgerDetail.duplicateNote') : t('eventLedgerDetail.differentiated')) : `* ${t('eventLedgerDetail.noteRequired')}`}
                      </span>
                    )}
                  </div>
                  <input
                    ref={notesRef}
                    type="text"
                    value={notes}
                    onChange={handleNotesChange}
                    className={`w-full bg-white border-2 rounded-xl outline-none text-base md:text-lg font-serif px-3.5 py-2.5 md:py-3 transition-all placeholder-stone-400 text-[#432C20] shadow-xs ${
                      isNoteRequired && !notes.trim()
                        ? 'border-amber-500 ring-4 ring-amber-500/20'
                        : isNoteRequired && duplicateWithExactNote
                        ? 'border-rose-500 ring-4 ring-rose-500/20'
                        : 'border-[#DDD1BF] focus:border-[#B68A3D] focus:ring-4 focus:ring-[#B68A3D]/20'
                    }`}
                    placeholder={isNoteRequired ? t('eventLedgerDetail.noteRequiredPlaceholder') : t('eventLedgerDetail.optionalNotes')}
                  />
                </div>
                <button type="submit" className={`w-full md:w-auto px-8 md:px-10 py-3 text-base font-bold uppercase tracking-wider transition-all rounded-xl h-[48px] md:h-[52px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 ${editingEntryId ? 'bg-white text-[#7A2E1E] border-2 border-[#7A2E1E]' : 'bg-gradient-to-r from-[#7A2E1E] to-[#9B3A27] hover:from-[#652417] hover:to-[#7A2E1E] text-white border border-[#7A2E1E]'}`}>
                  {editingEntryId ? t('eventLedgerDetail.updateBtn') : (
                    <>
                      <Plus size={18} className="text-amber-300" />
                      {t('eventLedgerDetail.addBtn')}
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
