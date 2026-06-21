import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Book } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ENTRIES_PER_PAGE = 10;

const NotebookView = ({ event, person, entries, type = "event", onClose }) => {
  const { t, language } = useLanguage();
  const [currentSpread, setCurrentSpread] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Chronological order: First entered data shows first
  const chronologicalEntries = [...entries].reverse();

  // Group entries into single pages
  const pages = [];
  for (let i = 0; i < chronologicalEntries.length; i += ENTRIES_PER_PAGE) {
    pages.push(chronologicalEntries.slice(i, i + ENTRIES_PER_PAGE));
  }

  if (pages.length === 0) pages.push([]); // At least one empty page

  // Calculate spreads (2 pages per spread on desktop, 1 page on mobile)
  const totalPages = isMobile ? pages.length + 1 : Math.ceil((pages.length + 1) / 2);

  const handleNext = () => {
    if (currentSpread < totalPages - 1) {
      setDirection(1);
      setCurrentSpread(currentSpread + 1);
    }
  };

  const handlePrev = () => {
    if (currentSpread > 0) {
      setDirection(-1);
      setCurrentSpread(currentSpread - 1);
    }
  };

  const leftPageVariants = {
    initial: (dir) => ({
      rotateY: dir > 0 ? 90 : 0,
      opacity: 1,
      zIndex: dir > 0 ? 10 : 1,
    }),
    animate: (dir) => ({
      rotateY: 0,
      opacity: 1,
      zIndex: dir > 0 ? 10 : 1,
      transition: {
        rotateY: { duration: 0.4, delay: dir > 0 ? 0.4 : 0, ease: "easeOut" },
        opacity: { duration: 0.1 }
      }
    }),
    exit: (dir) => ({
      rotateY: dir < 0 ? 90 : 0,
      opacity: 1,
      zIndex: dir < 0 ? 10 : 1,
      transition: {
        rotateY: { duration: 0.4, ease: "easeIn" },
        opacity: { duration: 0.8 }
      }
    })
  };

  const rightPageVariants = {
    initial: (dir) => ({
      rotateY: dir < 0 ? -90 : 0,
      opacity: 1,
      zIndex: dir < 0 ? 10 : 1,
    }),
    animate: (dir) => ({
      rotateY: 0,
      opacity: 1,
      zIndex: dir < 0 ? 10 : 1,
      transition: {
        rotateY: { duration: 0.4, delay: dir < 0 ? 0.4 : 0, ease: "easeOut" },
        opacity: { duration: 0.1 }
      }
    }),
    exit: (dir) => ({
      rotateY: dir > 0 ? -90 : 0,
      opacity: 1,
      zIndex: dir > 0 ? 10 : 1,
      transition: {
        rotateY: { duration: 0.4, ease: "easeIn" },
        opacity: { duration: 0.8 }
      }
    })
  };

  const mobileVariants = {
    initial: (dir) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    animate: { x: 0, opacity: 1, transition: { duration: 0.4 } },
    exit: (dir) => ({ x: dir > 0 ? -100 : 100, opacity: 0, transition: { duration: 0.4 } })
  };

  // Determine which pages to show
  let leftPageIdx = null;
  let rightPageIdx = null;

  if (isMobile) {
    if (currentSpread === 0) {
      leftPageIdx = null; // Summary page
    } else {
      leftPageIdx = currentSpread - 1;
    }
  } else {
    leftPageIdx = currentSpread === 0 ? null : currentSpread * 2 - 1;
    rightPageIdx = currentSpread === 0 ? 0 : currentSpread * 2;
  }

  const leftPageEntries = leftPageIdx !== null ? pages[leftPageIdx] : null;
  const rightPageEntries = rightPageIdx !== null ? pages[rightPageIdx] : [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8">
      {/* Close button outside the book */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        onClick={onClose}
        className="absolute top-8 right-8 text-white hover:text-[var(--secondary)] transition-colors z-[60]"
      >
        <X size={32} />
      </motion.button>

      {/* Increased height and width of the notebook with Page Turn Animation */}
      <motion.div
        initial={{ rotateY: -90, opacity: 0, scale: 0.9, x: -100 }}
        animate={{ rotateY: 0, opacity: 1, scale: 1, x: 0 }}
        exit={{ rotateY: 90, opacity: 0, scale: 0.9, x: 100 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
        style={{ perspective: 2000, transformStyle: "preserve-3d", transformOrigin: "center left" }}
        className="w-[95vw] h-[95vh] max-w-7xl flex relative shadow-2xl rounded-lg"
      >
        {/* Binding Shadow down the middle */}
        <div className="absolute left-1/2 top-0 bottom-0 w-12 -ml-6 bg-gradient-to-r from-black/5 via-black/30 to-black/5 z-20 pointer-events-none shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]"></div>

        {/* Left Page (Or Single Mobile Page) */}
        <div className="w-full md:w-1/2 h-full relative" style={{ perspective: "2500px" }}>
          <AnimatePresence custom={direction} initial={false}>
            <motion.div
              key={currentSpread}
              custom={direction}
              variants={isMobile ? mobileVariants : leftPageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={!isMobile ? { transformOrigin: "right center", backfaceVisibility: "hidden" } : {}}
              className="absolute inset-0 bg-[#FFFAF0] rounded-lg md:rounded-r-none md:rounded-l-lg overflow-hidden flex flex-col shadow-[inset_0_0_15px_rgba(0,0,0,0.1)] md:shadow-[inset_-5px_0_15px_rgba(0,0,0,0.1)]"
            >
              {/* Subtle paper texture */}
              <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none z-0"></div>
              {/* Red line margin */}
              <div className="absolute top-0 bottom-0 left-10 md:left-16 w-[2px] bg-red-500/30 z-0"></div>

              <div className="p-8 md:p-12 pl-16 md:pl-20 flex-1 flex flex-col relative z-10">
                {currentSpread === 0 ? (
                  // Summary Page
                  <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8 mt-12">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-4">
                      <Book className="text-[var(--primary)]" size={40} />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-tamil font-bold text-[var(--primary)] leading-tight">
                      {type === 'event' ? event?.eventName : person?.name}
                    </h1>
                    <p className="text-xl md:text-2xl font-serif text-[var(--text-muted)] border-b-2 border-[var(--primary)]/20 pb-4 inline-block px-8">
                      {type === 'event'
                        ? (event?.eventDate ? new Date(event.eventDate).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : '')
                        : (person?.village || t('personalLedger.unknownVillage'))}
                    </p>
                    <div className="grid grid-cols-2 gap-12 pt-8 w-full">
                      <div className="space-y-2 text-right">
                        <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">{t('eventLedgerDetail.totalEntries')}</p>
                        <p className="text-4xl font-bold text-[var(--primary)] font-serif">{entries.length}</p>
                      </div>
                      <div className="space-y-2 text-left border-l-2 border-[var(--primary)]/10 pl-12">
                        <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">
                          {type === 'event' ? t('eventLedgerDetail.totalCollection') : t('personalLedgerDetail.currentBalance')}
                        </p>
                        <p className={`text-4xl font-bold font-serif ${type === 'personal' && ((person?.totalReceived || 0) - (person?.totalReturned || 0)) < 0 ? 'text-red-700' : 'text-green-700'}`}>
                          {type === 'personal' && ((person?.totalReceived || 0) - (person?.totalReturned || 0)) < 0 ? '-' : ''}₹{Math.abs(type === 'event' ? (event?.totalCollection || 0) : ((person?.totalReceived || 0) - (person?.totalReturned || 0))).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Left Page Entries
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-end border-b-2 border-[var(--primary)]/20 pb-4 mb-4">
                      <h2 className="text-2xl font-tamil text-[var(--primary)] font-bold">{t('eventLedgerDetail.entriesTitle')}</h2>
                      <span className="text-[var(--text-muted)] font-serif font-bold text-lg">Pg. {leftPageIdx + 1}</span>
                    </div>

                    <div className="flex-1 space-y-2">
                      {leftPageEntries?.map((entry, idx) => (
                        <div key={entry._id || idx} className="flex justify-between items-end border-b border-[var(--primary)]/10 pb-2 group">
                          <div className="w-8 text-[var(--text-muted)]/50 font-serif text-sm font-bold">
                            {(leftPageIdx * ENTRIES_PER_PAGE) + idx + 1}.
                          </div>
                          <div className="flex-1">
                            <div className="flex items-end gap-2 flex-wrap mb-0.5">
                              {type === 'event' && entry.personId?.editHistory?.map((h, i) => (
                                <span key={i} className="text-[10px] text-red-500 line-through font-tamil">
                                  {h.name}
                                </span>
                              ))}
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-base text-[var(--text)] font-tamil leading-none">
                                  {type === 'event' ? (entry.personId?.name || t('eventLedgerDetail.unknownPerson')) : entry.description}
                                </p>
                                {entry.notes && (
                                  <span className="text-[9px] font-serif text-[var(--text-muted)] italic border border-[var(--primary)]/10 bg-[var(--primary)]/5 px-1.5 py-0.5 rounded-full shrink-0">
                                    {entry.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {type === 'event' && entry.personId?.editHistory?.map((h, i) => (
                                <span key={i} className="text-[9px] text-red-400 line-through font-serif">
                                  {h.village}
                                </span>
                              ))}
                              <p className="text-xs font-serif text-[var(--text-muted)] leading-none">
                                {type === 'event' ? (entry.personId?.village || t('eventLedgerDetail.unknownVillage')) : new Date(entry.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="w-40 text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {entry.editHistory?.map((h, i) => (
                                <span key={i} className="text-[11px] font-serif text-red-500 line-through">
                                  ₹{h.amount.toLocaleString('en-IN')}
                                </span>
                              ))}
                              <p className={`font-bold text-xl font-serif leading-none ${type === 'personal' && !entry.isPositive ? 'text-red-700' : 'text-green-700'}`}>
                                {type === 'personal' && !entry.isPositive ? '-' : ''}₹{Math.abs(entry.amount || 0).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Prev Button */}
              {currentSpread > 0 && (
                <button onClick={handlePrev} className="absolute bottom-6 left-4 md:left-6 p-3 md:p-4 bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 rounded-full text-[var(--primary)] z-20 transition-all hover:-translate-x-1 border border-[var(--primary)]/10">
                  <ChevronLeft size={24} />
                </button>
              )}

              {/* Next Button on mobile (since right page is hidden) */}
              {isMobile && currentSpread < totalPages - 1 && (
                <button onClick={handleNext} className="absolute bottom-6 right-4 p-3 bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 rounded-full text-[var(--primary)] z-30 transition-all hover:translate-x-1 border border-[var(--primary)]/10">
                  <ChevronRight size={24} />
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Page (Hidden on Mobile) */}
        {!isMobile && (
          <div className="hidden md:block w-1/2 h-full relative" style={{ perspective: "2500px" }}>
            <AnimatePresence custom={direction} initial={false}>
              <motion.div
                key={currentSpread}
                custom={direction}
                variants={rightPageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ transformOrigin: "left center", backfaceVisibility: "hidden" }}
                className="absolute inset-0 bg-[#FFFAF0] rounded-r-lg overflow-hidden flex flex-col shadow-[inset_5px_0_15px_rgba(0,0,0,0.05)]"
              >
                {/* Subtle paper texture */}
                <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none z-0"></div>
                {/* Red line margin */}
                <div className="absolute top-0 bottom-0 left-12 md:left-16 w-[2px] bg-red-500/30 z-0"></div>

                <div className="p-8 md:p-12 pl-16 md:pl-20 flex-1 relative z-10 flex flex-col">
                  <div className="flex justify-between items-end border-b-2 border-[var(--primary)]/20 pb-4 mb-4">
                    <h2 className="text-2xl font-tamil text-[var(--primary)] font-bold opacity-0">Spacer</h2>
                    <span className="text-[var(--text-muted)] font-serif font-bold text-lg">Pg. {rightPageIdx + 1}</span>
                  </div>

                  <div className="flex-1 space-y-2">
                    {rightPageEntries?.map((entry, idx) => (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                        key={entry._id} className="flex justify-between items-end border-b border-[var(--primary)]/10 pb-2 group"
                      >
                        <div className="w-8 text-[var(--text-muted)]/50 font-serif text-sm font-bold">
                          {(rightPageIdx * ENTRIES_PER_PAGE) + idx + 1}.
                        </div>
                        <div className="flex-1">
                          <div className="flex items-end gap-2 flex-wrap mb-0.5">
                            {entry.personId?.editHistory?.map((h, i) => (
                              <span key={i} className="text-[10px] text-red-500 line-through font-tamil">
                                {h.name}
                              </span>
                            ))}
                            <p className="font-bold text-base text-[var(--text)] font-tamil leading-none">{entry.personId?.name || t('eventLedgerDetail.unknownPerson')}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {entry.personId?.editHistory?.map((h, i) => (
                              <span key={i} className="text-[9px] text-red-400 line-through font-serif">
                                {h.village}
                              </span>
                            ))}
                            <p className="text-xs font-serif text-[var(--text-muted)] leading-none">{entry.personId?.village || t('eventLedgerDetail.unknownVillage')}</p>
                          </div>
                        </div>
                        <div className="w-40 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {entry.editHistory?.map((h, i) => (
                              <span key={i} className="text-[11px] font-serif text-red-500 line-through">
                                ₹{h.amount.toLocaleString('en-IN')}
                              </span>
                            ))}
                            <p className="font-bold text-xl font-serif text-green-700 leading-none">₹{entry.amount.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Next Button */}
                {currentSpread < totalPages - 1 && (
                  <button onClick={handleNext} className="absolute bottom-6 right-6 p-4 bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 rounded-full text-[var(--primary)] z-30 transition-all hover:translate-x-1 border border-[var(--primary)]/10">
                    <ChevronRight size={28} />
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default NotebookView;
