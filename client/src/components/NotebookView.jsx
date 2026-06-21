import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Book } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import HTMLFlipBook from 'react-pageflip';

const ENTRIES_PER_PAGE = 14;

// Custom Page Component
const Page = React.forwardRef((props, ref) => {
  return (
    <div className="page bg-[#FFFAF0] shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col" ref={ref} data-density={props.density || "soft"}>
      {/* Subtle paper texture */}
      <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none z-0"></div>
      
      {/* Red line margin */}
      {props.hasMargin && (
        <div className="absolute top-0 bottom-0 left-10 md:left-14 w-[2px] bg-red-500/30 z-0"></div>
      )}

      <div className="flex-1 flex flex-col relative z-10 p-4 md:p-8">
        {props.children}
      </div>

      {props.showPrev && (
        <button onClick={props.onPrev} className="absolute bottom-4 md:bottom-6 left-4 md:left-6 p-2 md:p-3 bg-ledger-brown/5 hover:bg-ledger-brown/10 rounded-full text-ledger-brown z-30 transition-all hover:-translate-x-1 border border-ledger-brown/10">
          <ChevronLeft size={24} />
        </button>
      )}
      
      {props.showNext && (
        <button onClick={props.onNext} className="absolute bottom-4 md:bottom-6 right-4 md:right-6 p-2 md:p-3 bg-ledger-brown/5 hover:bg-ledger-brown/10 rounded-full text-ledger-brown z-30 transition-all hover:translate-x-1 border border-ledger-brown/10">
          <ChevronRight size={24} />
        </button>
      )}
    </div>
  );
});

// Front and Back Cover Component
const CoverPage = React.forwardRef((props, ref) => {
  return (
    <div className="page bg-[#3A2218] relative overflow-hidden shadow-2xl" ref={ref} data-density="hard">
      {/* Leather texture */}
      <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/leather.png')] pointer-events-none z-0"></div>
      
      {/* Binding accent */}
      <div className={`absolute top-0 bottom-0 w-8 bg-black/20 ${props.isBack ? 'right-0' : 'left-0'}`}></div>

      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10 text-center">
        {props.children}
      </div>
    </div>
  );
});

const NotebookView = ({ event, person, entries, type = "event", onClose }) => {
  const { t, language } = useLanguage();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const bookRef = useRef();

  useEffect(() => {
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

  const nextButtonClick = () => {
    if (bookRef.current) bookRef.current.pageFlip().flipNext();
  };

  const prevButtonClick = () => {
    if (bookRef.current) bookRef.current.pageFlip().flipPrev();
  };

  // Construct Inner Pages Array
  const innerPages = [
    // Page 3: Summary Page (Right Side)
    <Page key="summary" hasMargin={true} showPrev={isMobile} showNext={true} onPrev={prevButtonClick} onNext={nextButtonClick}>
      <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 mt-8 pl-8 md:pl-12">
        <div className="w-16 h-16 md:w-24 md:h-24 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-2">
          <Book className="text-[var(--primary)]" size={32} />
        </div>
        <h1 className="text-2xl md:text-4xl font-tamil font-bold text-[var(--primary)] leading-tight">
          {type === 'event' ? event?.eventName : person?.name}
        </h1>
        <p className="text-lg md:text-xl font-serif text-[var(--text-muted)] border-b-2 border-[var(--primary)]/20 pb-2 inline-block px-4">
          {type === 'event'
            ? (event?.eventDate ? new Date(event.eventDate).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : '')
            : (person?.village || t('personalLedger.unknownVillage'))}
        </p>
        <div className="grid grid-cols-2 gap-4 md:gap-8 pt-6 w-full">
          <div className="space-y-1 text-right">
            <p className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">{t('eventLedgerDetail.totalEntries')}</p>
            <p className="text-2xl md:text-4xl font-bold text-[var(--primary)] font-serif">{entries.length}</p>
          </div>
          <div className="space-y-1 text-left border-l-2 border-[var(--primary)]/10 pl-4 md:pl-8">
            <p className="text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
              {type === 'event' ? t('eventLedgerDetail.totalCollection') : t('personalLedgerDetail.currentBalance')}
            </p>
            <p className={`text-2xl md:text-4xl font-bold font-serif ${type === 'personal' && ((person?.totalReceived || 0) - (person?.totalReturned || 0)) < 0 ? 'text-red-700' : 'text-green-700'}`}>
              {type === 'personal' && ((person?.totalReceived || 0) - (person?.totalReturned || 0)) < 0 ? '-' : ''}₹{Math.abs(type === 'event' ? (event?.totalCollection || 0) : ((person?.totalReceived || 0) - (person?.totalReturned || 0))).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
            </p>
          </div>
        </div>
      </div>
    </Page>,
    
    // Page 4..N: Ledger Entries
    ...pages.map((pageEntries, idx) => {
      // index inside innerPages is idx + 1. 
      // If idx + 1 is odd, it falls on the Left side (needs Prev button). 
      // If even, Right side (needs Next button).
      const isLeftPage = (idx + 1) % 2 === 1;
      const isRightPage = (idx + 1) % 2 === 0;

      return (
        <Page 
          key={`page-${idx}`} 
          hasMargin={true} 
          showPrev={isMobile || isLeftPage} 
          showNext={isMobile || isRightPage} 
          onPrev={prevButtonClick} 
          onNext={nextButtonClick}
        >
          <div className="flex justify-between items-end border-b-2 border-ledger-brown/20 pb-2 md:pb-4 mb-2 md:mb-4 pl-8 md:pl-12">
            <h2 className="text-xl md:text-2xl font-tamil text-ledger-brown font-bold">{t('eventLedgerDetail.entriesTitle')}</h2>
            <span className="text-ledger-brown/60 font-serif font-bold text-sm md:text-lg">Pg. {idx + 1}</span>
          </div>

          <div className="flex-1 space-y-1 md:space-y-2 pl-6 md:pl-8">
            {pageEntries?.map((entry, eIdx) => (
              <div key={entry._id || eIdx} className="flex justify-between items-end border-b border-ledger-brown/10 pb-1.5 md:pb-2 group">
                <div className="w-6 md:w-8 text-ledger-brown/50 font-serif text-[10px] md:text-sm font-bold">
                  {(idx * ENTRIES_PER_PAGE) + eIdx + 1}.
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-end gap-1.5 flex-wrap mb-0.5">
                    {type === 'event' && entry.personId?.editHistory?.map((h, i) => (
                      <span key={i} className="text-[9px] text-red-500 line-through font-tamil">
                        {h.name}
                      </span>
                    ))}
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm md:text-base text-ledger-brown font-tamil leading-none truncate">
                        {type === 'event' ? (entry.personId?.name || t('eventLedgerDetail.unknownPerson')) : entry.description}
                      </p>
                      {entry.notes && (
                        <span className="text-[8px] md:text-[9px] font-serif text-ledger-brown/70 italic border border-ledger-brown/10 bg-ledger-brown/5 px-1.5 py-0.5 rounded-full shrink-0">
                          {entry.notes}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {type === 'event' && entry.personId?.editHistory?.map((h, i) => (
                      <span key={i} className="text-[8px] text-red-400 line-through font-serif">
                        {h.village}
                      </span>
                    ))}
                    <p className="text-[10px] md:text-xs font-serif text-ledger-brown/60 leading-none truncate">
                      {type === 'event' ? (entry.personId?.village || t('eventLedgerDetail.unknownVillage')) : new Date(entry.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="w-24 md:w-32 text-right shrink-0">
                  <div className="flex flex-col items-end justify-center">
                    {entry.editHistory?.map((h, i) => (
                      <span key={i} className="text-[9px] md:text-[11px] font-serif text-red-500 line-through">
                        ₹{h.amount.toLocaleString('en-IN')}
                      </span>
                    ))}
                    <p className={`font-bold text-base md:text-xl font-serif leading-none ${type === 'personal' && !entry.isPositive ? 'text-red-700' : 'text-green-700'}`}>
                      {type === 'personal' && !entry.isPositive ? '-' : ''}₹{Math.abs(entry.amount || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Page>
      );
    })
  ];

  // If the number of inner pages is odd, we need to add a blank inner page 
  // so the back cover falls correctly on the outside right (or just preserves the spread).
  if (innerPages.length % 2 !== 0 && !isMobile) {
    innerPages.push(<Page key="blank-pad" showPrev={true} onPrev={prevButtonClick} />);
  }

  // To prevent Next.js / Vite build issues with default exports from react-pageflip
  const FlipBook = HTMLFlipBook.default || HTMLFlipBook;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-8 overflow-hidden">
      {/* Close button outside the book */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        onClick={onClose}
        className="absolute top-4 right-4 md:top-8 md:right-8 text-white/70 hover:text-white transition-colors z-[60] bg-black/20 p-2 rounded-full"
      >
        <X size={28} />
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full h-full flex justify-center items-center"
      >
        <FlipBook
          width={isMobile ? window.innerWidth - 32 : 550}
          height={isMobile ? window.innerHeight - 80 : 750}
          size="stretch"
          minWidth={300}
          maxWidth={600}
          minHeight={400}
          maxHeight={900}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          usePortrait={isMobile}
          className="shadow-2xl mx-auto"
          ref={bookRef}
        >
          {/* Page 1: Front Cover */}
          <CoverPage key="front-cover" isBack={false}>
             <h1 className="text-3xl md:text-5xl text-[#D4AF37] font-tamil font-bold text-center border-b-[3px] border-[#D4AF37]/60 pb-6 mb-10 max-w-[80%] mx-auto leading-tight">
               {type === 'event' ? event?.eventName : person?.name}
             </h1>
             <div className="w-28 h-28 bg-[#D4AF37]/5 rounded-full flex items-center justify-center border-2 border-[#D4AF37]/40 shadow-[0_0_30px_rgba(212,175,55,0.1)]">
               <Book className="text-[#D4AF37]/90" size={48} />
             </div>
             <p className="text-[#D4AF37]/60 font-serif mt-16 tracking-[0.3em] uppercase text-sm md:text-base font-bold">Ledger Book</p>
             
             {/* Centered Next Button */}
             <button onClick={nextButtonClick} className="absolute bottom-12 left-1/2 transform -translate-x-1/2 p-4 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 rounded-full text-[#D4AF37] transition-all hover:scale-110 border border-[#D4AF37]/30 shadow-lg">
                <ChevronRight size={32} />
             </button>
          </CoverPage>

          {/* Page 2: Inside Front Cover (Blank paper) */}
          <Page key="inside-front"></Page>

          {/* Pages 3..N: Inner Content */}
          {innerPages}

          {/* Page N+1: Inside Back Cover (Blank paper) */}
          <Page key="inside-back"></Page>

          {/* Page N+2: Back Cover */}
          <CoverPage key="back-cover" isBack={true}>
             <div className="w-16 h-16 bg-[#D4AF37]/5 rounded-full flex items-center justify-center border border-[#D4AF37]/20 mb-6 shadow-inner">
               <Book className="text-[#D4AF37]/40" size={24} />
             </div>
             <p className="text-[#D4AF37]/40 font-serif text-xs md:text-sm tracking-[0.2em] uppercase">Moi Kanakku</p>

             {/* Centered Prev Button */}
             <button onClick={prevButtonClick} className="absolute bottom-12 left-1/2 transform -translate-x-1/2 p-4 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 rounded-full text-[#D4AF37] transition-all hover:scale-110 border border-[#D4AF37]/30 shadow-lg">
                <ChevronLeft size={32} />
             </button>
          </CoverPage>
        </FlipBook>
      </motion.div>
    </div>
  );
};

export default NotebookView;
