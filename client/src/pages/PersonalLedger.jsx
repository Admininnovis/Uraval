import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { Plus, User, Search, MapPin, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import HTMLFlipBook from 'react-pageflip';

const Page = React.forwardRef((props, ref) => {
  return (
    <div className="bg-ledger-paper relative overflow-hidden flex flex-col shadow-[inset_0_0_15px_rgba(0,0,0,0.1)] border border-ledger-brown/20 rounded-sm" ref={ref}>
      <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none z-0"></div>
      <div className="absolute top-0 bottom-0 left-8 md:left-12 w-[2px] bg-ledger-red/30 z-0"></div>

      <div className="p-4 md:p-6 flex-1 flex flex-col relative z-10 pb-4 md:pb-6 max-h-full">
        <div className="flex justify-end items-end border-b-2 border-ledger-brown/30 pb-2 mb-2 shrink-0 mt-2">
          <span className="text-ledger-brown/60 font-bold text-sm md:text-base">Pg. {props.number}</span>
        </div>
        <div className="flex-1 flex flex-col justify-start overflow-y-auto pr-2 custom-scrollbar">
          {props.children}
        </div>
      </div>
    </div>
  );
});

const CoverPage = React.forwardRef((props, ref) => {
  return (
    <div className="bg-[#2A2118] relative overflow-hidden flex flex-col shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border-2 border-[#D4AF37]/30 rounded-sm items-center justify-center" ref={ref} data-density="hard">
      <div className="absolute inset-0 opacity-20 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] pointer-events-none"></div>
      <div className="absolute top-0 bottom-0 left-4 md:left-6 w-12 bg-gradient-to-r from-black/60 to-transparent z-0"></div>
      <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center h-full w-full">
        <div className="border-2 border-[#D4AF37]/40 p-8 rounded-lg bg-black/40 backdrop-blur-sm w-[80%] max-w-[400px]">
          <h1 className="text-3xl md:text-5xl font-bold text-[#D4AF37] font-serif mb-6 tracking-widest uppercase">{props.title}</h1>
          <div className="h-[2px] w-32 bg-[#D4AF37]/50 mx-auto mb-6"></div>
          <p className="text-[#D4AF37]/80 italic text-lg md:text-xl font-serif leading-relaxed">"A record of our bonds and blessings"</p>
        </div>
      </div>
    </div>
  );
});

const BackCoverPage = React.forwardRef((props, ref) => {
  return (
    <div className="bg-[#2A2118] relative overflow-hidden flex flex-col shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] border-2 border-[#D4AF37]/30 rounded-sm items-center justify-center" ref={ref} data-density="hard">
      <div className="absolute inset-0 opacity-20 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] pointer-events-none"></div>
      <div className="absolute top-0 bottom-0 right-4 md:right-6 w-12 bg-gradient-to-l from-black/60 to-transparent z-0"></div>
      <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center h-full">
        <div className="w-24 h-24 border-2 border-[#D4AF37]/20 rounded-full flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-[#D4AF37]/20 rotate-45"></div>
        </div>
      </div>
    </div>
  );
});

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
};

const PersonalLedger = () => {
  const { t, language } = useLanguage();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchVillage, setSearchVillage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [dragOverId, setDragOverId] = useState(null);
  const navigate = useNavigate();
  const [currentSpread, setCurrentSpread] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const flipBookRef = useRef(null);

  const ENTRIES_PER_PAGE = 15;
  const ENTRIES_PER_SPREAD = 30;

  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (p.village || '').toLowerCase().includes(searchVillage.toLowerCase())
  );

  let rawPagesRequired = Math.ceil(people.length / ENTRIES_PER_PAGE);
  if (rawPagesRequired === 0) rawPagesRequired = 1;
  const fixedTotalPages = rawPagesRequired % 2 !== 0 ? rawPagesRequired + 1 : rawPagesRequired;

  const pages = [];
  for (let i = 0; i < fixedTotalPages; i++) {
    const startIdx = i * ENTRIES_PER_PAGE;
    if (startIdx < filteredPeople.length) {
      pages.push(filteredPeople.slice(startIdx, startIdx + ENTRIES_PER_PAGE));
    } else {
      pages.push([]);
    }
  }

  const totalBalance = people.reduce((acc, p) => acc + ((p.totalReceived || 0) - (p.totalReturned || 0)), 0);
  const isTotalPositive = totalBalance >= 0;

  const [formData, setFormData] = useState({
    name: '',
    village: '',
    mobile: '',
    notes: '',
  });

  const handleDragStart = (e, person) => {
    e.dataTransfer.setData('sourceId', person._id);
    e.dataTransfer.setData('sourceName', person.name);
  };

  const handleDragOver = (e, personId) => {
    e.preventDefault();
    if (dragOverId !== personId) {
      setDragOverId(personId);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverId(null);
  };

  const handleDrop = async (e, targetPerson) => {
    e.preventDefault();
    setDragOverId(null);

    const sourceId = e.dataTransfer.getData('sourceId');
    const sourceName = e.dataTransfer.getData('sourceName');

    if (!sourceId || sourceId === targetPerson._id) return;

    if (window.confirm(`${t('personalLedger.mergeConfirmPart1')}${sourceName}${t('personalLedger.mergeConfirmPart2')}${targetPerson.name}${t('personalLedger.mergeConfirmPart3')}${sourceName}${t('personalLedger.mergeConfirmPart4')}`)) {
      try {
        await api.post('/people/merge', {
          sourceId,
          targetId: targetPerson._id
        });
        fetchPeople();
      } catch (error) {
        console.error('Error merging people:', error);
        alert('Failed to merge records.');
      }
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    try {
      const response = await api.get('/people', {
        params: { limit: 1000 }
      });
      setPeople(response.data.people || response.data || []);
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
      setShowForm(false);
      setFormData({ name: '', village: '', mobile: '', notes: '' });
      fetchPeople();
    } catch (error) {
      console.error('Error creating person:', error);
    }
  };

  if (loading) return (
    <Layout noPadding>
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-ledger-brown border-t-ledger-red"></div>
      </div>
    </Layout>
  );

  return (
    <Layout noPadding>
      <motion.div
        className="flex flex-col p-2 md:p-4 lg:p-8 max-w-[1600px] mx-auto w-full relative min-h-screen"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-[#2A2118] border-2 border-[#D4AF37]/40 shadow-[0_15px_50px_rgba(0,0,0,0.5)] p-6 rounded-xl w-full max-w-2xl relative"
              >
                <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay rounded-xl" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#D4AF37]/20">
                    <h2 className="text-xl font-bold text-[#D4AF37] font-tamil tracking-wide">{t('personalLedger.newLedgerTitle')}</h2>
                    <button onClick={() => setShowForm(false)} className="text-[#D4AF37] hover:text-white p-1 rounded transition-colors"><X size={20} /></button>
                  </div>

                  <form onSubmit={handleCreatePerson} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[#D4AF37]/80 mb-1">{t('personalLedger.name')}</label>
                        <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#FDFBF7] border-2 border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/20 rounded-md outline-none text-lg font-bold font-tamil px-3 py-2 text-[#2A2118]" placeholder={t('personalLedger.namePlaceholder')} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[#D4AF37]/80 mb-1">{t('personalLedger.village')}</label>
                        <input type="text" value={formData.village} onChange={(e) => setFormData({ ...formData, village: e.target.value })} className="w-full bg-[#FDFBF7] border-2 border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/20 rounded-md outline-none text-lg font-serif px-3 py-2 text-[#2A2118]" placeholder={t('personalLedger.villagePlaceholder')} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[#D4AF37]/80 mb-1">{t('personalLedger.mobile')}</label>
                        <input type="text" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} className="w-full bg-[#FDFBF7] border-2 border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/20 rounded-md outline-none text-lg font-serif px-3 py-2 text-[#2A2118]" placeholder={t('personalLedger.mobilePlaceholder')} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-[#D4AF37]/80 mb-1">{t('personalLedger.notes')}</label>
                        <input type="text" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-[#FDFBF7] border-2 border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/20 rounded-md outline-none text-lg font-serif px-3 py-2 text-[#2A2118]" placeholder={t('personalLedger.notesPlaceholder')} />
                      </div>
                    </div>
                    <div className="pt-4 flex justify-end">
                      <button type="submit" className="px-8 py-3 bg-gradient-to-r from-[#D4AF37] to-[#e4c45b] text-[#2A2118] hover:from-[#F3D568] hover:to-[#fde282] rounded-md font-bold uppercase tracking-widest shadow-lg">{t('personalLedger.createBtn')}</button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Static Header OUTSIDE the notebook */}
        {currentPage > 0 && currentPage < fixedTotalPages + 1 && (
          <div className="w-full max-w-[1200px] mx-auto relative z-10">
            <div className="w-full bg-ledger-paper rounded-t-sm border-b-2 border-ledger-brown/30 shadow-[0_5px_15px_rgba(0,0,0,0.1)] relative">
              <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none z-0"></div>

              <div className="flex flex-col md:flex-row relative z-10 w-full">
                {/* LEFT HALF */}
                <div className="flex-1 p-3 px-4 md:p-4 md:px-12 md:pr-8 border-b md:border-b-0 md:border-r border-ledger-brown/30">
                  <div className="flex justify-between items-end mb-2 pb-2 border-b border-ledger-brown/20">
                    <h1 className="text-base md:text-xl font-bold text-ledger-brown drop-shadow-sm uppercase tracking-widest">{t('personalLedger.title')}</h1>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] md:text-xs text-ledger-brown/70 font-bold uppercase tracking-widest">{t('personalLedger.totalPeople') === 'personalLedger.totalPeople' ? 'Total People' : t('personalLedger.totalPeople')}</span>
                      <span className="text-sm md:text-lg font-bold text-ledger-ink leading-none">{people.length}</span>
                    </div>
                  </div>
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ledger-brown/50" size={14} />
                    <input
                      type="text"
                      placeholder={t('personalLedger.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-transparent border border-ledger-brown/30 focus:border-ledger-brown/60 rounded outline-none text-ledger-ink px-3 py-1.5 pl-9 text-xs md:text-sm font-bold transition-all placeholder-ledger-brown/50"
                    />
                  </div>
                </div>

                {/* RIGHT HALF */}
                <div className="flex-1 p-3 px-4 md:p-4 md:px-12 md:pl-8">
                  <div className="flex justify-between items-end mb-2 pb-2 border-b border-ledger-brown/20">
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] md:text-xs text-ledger-brown/70 font-bold uppercase tracking-widest">{t('personalLedger.netBalance')}</span>
                      <span className={`text-base md:text-lg font-bold leading-none ${isTotalPositive ? 'text-ledger-green' : 'text-ledger-red'}`}>
                        {isTotalPositive ? '+' : '-'}₹{Math.abs(totalBalance).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowForm(true)}
                      className="flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#e4c45b] text-[#2A2118] shadow-md hover:from-[#F3D568] hover:to-[#fde282] transition-all rounded font-bold text-[10px] md:text-xs tracking-widest uppercase hover:-translate-y-0.5"
                    >
                      <Plus size={14} />
                      <span className="">{t('personalLedger.addPerson')}</span>
                    </button>
                  </div>
                  <div className="relative w-full">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-ledger-brown/50" size={14} />
                    <input
                      type="text"
                      placeholder={t('personalLedger.searchVillage')}
                      value={searchVillage}
                      onChange={(e) => setSearchVillage(e.target.value)}
                      className="w-full bg-transparent border border-ledger-brown/30 focus:border-ledger-brown/60 rounded outline-none text-ledger-ink px-3 py-1.5 pl-9 text-xs md:text-sm font-bold transition-all placeholder-ledger-brown/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          className={`w-full max-w-[1200px] mx-auto relative mb-8 z-0 transition-transform duration-700 ease-in-out aspect-[600/820] md:aspect-[1200/820] ${currentPage === 0
            ? 'md:-translate-x-1/4'
            : currentPage === fixedTotalPages + 1
              ? 'md:translate-x-1/4'
              : ''
            }`}
        >

          {currentPage > 0 && (
            <button
              onClick={() => flipBookRef.current?.pageFlip()?.flipPrev()}
              className="absolute left-0 md:-left-12 bottom-2 md:bottom-4 z-50 p-2 md:p-4 rounded-full bg-transparent text-ledger-brown/50 hover:text-ledger-brown transition-all hover:scale-110"
              aria-label="Previous Page"
            >
              <ChevronLeft size={32} className="md:w-12 md:h-12" />
            </button>
          )}

          {currentPage < pages.length + 1 && (
            <button
              onClick={() => flipBookRef.current?.pageFlip()?.flipNext()}
              className="absolute right-0 md:-right-12 bottom-2 md:bottom-4 z-50 p-2 md:p-4 rounded-full bg-transparent text-ledger-brown/50 hover:text-ledger-brown transition-all hover:scale-110"
              aria-label="Next Page"
            >
              <ChevronRight size={32} className="md:w-12 md:h-12" strokeWidth={1.5} />
            </button>
          )}

          <HTMLFlipBook
            key={fixedTotalPages}
            width={600}
            height={820}
            size="stretch"
            minWidth={315}
            maxWidth={1000}
            minHeight={400}
            maxHeight={1536}
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={true}
            useMouseEvents={false}
            className="mx-auto"
            ref={flipBookRef}
            onFlip={(e) => setCurrentPage(e.data)}
          >
            <CoverPage title={t('personalLedger.title')} />
            {pages.map((pageEntries, pageIndex) => {
              const isLeftPage = pageIndex % 2 === 0;

              return (
                <Page
                  key={pageIndex}
                  number={pageIndex + 1}
                >
                  {pageEntries.map((person, idx) => {
                    const balance = (person.totalReceived || 0) - (person.totalReturned || 0);
                    const isPositive = balance >= 0;
                    return (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                        key={person._id}
                        onClick={() => navigate(`/personal-ledger/${person._id}`)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, person)}
                        onDragOver={(e) => handleDragOver(e, person._id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, person)}
                        className={`flex justify-between items-center border-b border-ledger-brown/15 py-1.5 md:py-2 group cursor-pointer hover:bg-ledger-brown/5 transition-colors rounded-sm px-1 md:px-2 -mx-1 md:-mx-2 ${dragOverId === person._id ? 'bg-ledger-brown/10 ring-1 ring-ledger-brown' : ''}`}
                        title="Drag and drop onto another person to merge them"
                      >
                        <div className="w-6 md:w-8 text-ledger-brown/50 text-[10px] md:text-xs font-bold text-right pr-2">
                          {(pageIndex * ENTRIES_PER_PAGE) + idx + 1}.
                        </div>
                        <div className="flex-1 flex items-baseline gap-2">
                          <p className="font-bold text-xs md:text-sm text-ledger-ink leading-none group-hover:text-ledger-red transition-colors">{person.name}</p>
                          <p className="text-[9px] md:text-[10px] text-ledger-brown/70 leading-none truncate max-w-[80px] md:max-w-none">{person.village || t('personalLedger.unknownVillage')}</p>
                        </div>
                        <div className="w-20 md:w-28 text-right">
                          <p className={`font-bold text-sm md:text-lg tracking-tight ${isPositive ? 'text-ledger-green' : 'text-ledger-red'}`}>
                            {isPositive ? '+' : '-'}₹{Math.abs(balance).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </Page>
              );
            })}
            <BackCoverPage />
          </HTMLFlipBook>
        </div>
      </motion.div>
    </Layout>
  );
};

export default PersonalLedger;
