import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import UravinLoading from '../components/UravinLoading';
import api, { billingApi } from '../services/api';
import { loadRazorpayScript } from '../utils/razorpay';
import { Plus, Book, ChevronRight, AlertCircle, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BananaTree, TempleGopuram, PalmLeafManuscript, KolamPattern,
  CornerMark
} from '../components/Illustrations';
import { useLanguage } from '../context/LanguageContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0, rotateY: 0 },
  visible: {
    y: 0,
    opacity: 1,
    rotateY: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  },
  hover: {
    y: -5,
    x: 8,
    scale: 1.02,
    rotateY: -5,
    boxShadow: "-12px 15px 25px rgba(0,0,0,0.4)",
    transition: { type: 'spring', stiffness: 200, damping: 20 }
  },
  tap: {
    scale: 0.95,
    rotateY: -15,
    transition: { type: 'spring', stiffness: 400, damping: 15 }
  }
};

const formVariants = {
  hidden: { opacity: 0, height: 0, scaleY: 0.8, originY: 0 },
  visible: { opacity: 1, height: "auto", scaleY: 1, transition: { type: 'spring', stiffness: 120, damping: 20 } },
  exit: { opacity: 0, height: 0, scaleY: 0.8, transition: { duration: 0.2 } }
};

const EventLedger = () => {
  const { t, language, tData } = useLanguage();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentError, setPaymentError] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    eventName: '',
    eventType: 'Wedding',
    eventDate: '',
    location: '',
    description: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const initiateBookletCheckout = async (purchaseData) => {
    const { purchaseReference, amount, currency, razorpayOrderId, razorpayKeyId, bookletId } = purchaseData;

    setPaymentMessage('Opening Razorpay Checkout...');

    const options = {
      key: razorpayKeyId,
      amount: amount,
      currency: currency || 'INR',
      name: 'Uravuu - Moi Ledger',
      description: 'Booklet Creation (One-time ₹150 incl. GST)',
      order_id: razorpayOrderId,
      notes: {
        application: 'uravuu',
        internal_purchase_reference: purchaseReference,
        payment_purpose: 'booklet_creation',
        booklet_id: bookletId,
      },
      theme: {
        color: '#8B0000',
      },
      handler: async function (checkoutRes) {
        setPaymentMessage('Verifying payment on server...');
        try {
          const verifyRes = await billingApi.verifyPayment({
            purchaseReference,
            razorpay_order_id: checkoutRes.razorpay_order_id,
            razorpay_payment_id: checkoutRes.razorpay_payment_id,
            razorpay_signature: checkoutRes.razorpay_signature,
          });

          if (verifyRes.data.success) {
            setPaymentMessage('Payment verified! Booklet created and activated successfully.');
            const newBookletId = verifyRes.data.bookletId || verifyRes.data.fulfillmentResult?.bookletId;
            setTimeout(() => {
              setShowForm(false);
              setPaymentLoading(false);
              setPaymentMessage('');
              if (newBookletId) {
                navigate(`/events/${newBookletId}`);
              } else {
                fetchEvents();
              }
            }, 1000);
          } else {
            throw new Error(verifyRes.data.message || 'Payment verification failed');
          }
        } catch (verErr) {
          console.error('Verification error:', verErr);
          setPaymentError(verErr.response?.data?.message || 'Payment verification failed');
          setPaymentLoading(false);
          fetchEvents();
        }
      },
      modal: {
        ondismiss: async function () {
          setPaymentMessage('Checking payment status...');
          try {
            const recoverRes = await billingApi.recoverPurchaseStatus(purchaseReference);
            if (recoverRes.data.status === 'captured') {
              setPaymentMessage('Payment confirmed! Booklet activated.');
              const recoveredId = recoverRes.data.bookletId || recoverRes.data.purchase?.booklet;
              setTimeout(() => {
                setShowForm(false);
                setPaymentLoading(false);
                setPaymentMessage('');
                if (recoveredId) {
                  navigate(`/events/${recoveredId}`);
                } else {
                  fetchEvents();
                }
              }, 1000);
              return;
            }
          } catch (e) {
            console.warn(e);
          }
          setPaymentLoading(false);
          setPaymentMessage('Checkout was cancelled. No booklet was created.');
          fetchEvents();
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (failRes) {
      console.error('Payment failed:', failRes);
      setPaymentError(`Payment failed: ${failRes.error?.description || 'Transaction unsuccessful'}`);
      setPaymentLoading(false);
      fetchEvents();
    });

    rzp.open();
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    setPaymentError(null);
    setPaymentMessage('Preparing booklet payment...');

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Could not load payment checkout SDK. Please check your internet connection.');
      }

      const res = await billingApi.createBookletPurchase(formData);
      await initiateBookletCheckout(res.data);
    } catch (error) {
      console.error('Error creating booklet purchase:', error);
      setPaymentError(error.response?.data?.message || error.message || 'Failed to initiate booklet purchase');
      setPaymentLoading(false);
    }
  };

  const handleResumePayment = async (event, e) => {
    if (e) e.stopPropagation();
    setPaymentLoading(true);
    setPaymentError(null);
    setPaymentMessage('Resuming booklet payment...');

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Could not load payment checkout SDK.');
      }

      const res = await billingApi.createBookletPurchase({ bookletId: event._id });
      await initiateBookletCheckout(res.data);
    } catch (error) {
      console.error('Error resuming booklet purchase:', error);
      setPaymentError(error.response?.data?.message || 'Failed to resume payment');
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <UravinLoading size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.03] text-ledger-brown">
        <div className="absolute -top-10 -left-10 w-64 h-64 transform -rotate-12"><KolamPattern className="w-full h-full" /></div>
        <div className="absolute top-10 -right-20 w-80 h-80"><BananaTree className="w-full h-full" /></div>
        <div className="absolute -bottom-10 -left-10 w-80 h-80"><TempleGopuram className="w-full h-full" /></div>
        <div className="absolute bottom-20 right-10 w-48 h-24 transform -rotate-6"><PalmLeafManuscript className="w-full h-full" /></div>
        <div className="absolute top-24 left-4 w-8 h-8"><CornerMark className="w-full h-full" /></div>
        <div className="absolute top-24 right-4 w-8 h-8 transform rotate-90"><CornerMark className="w-full h-full" /></div>
      </div>

      <motion.div
        className="relative z-10 space-y-6 max-w-7xl mx-auto pt-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="bg-[#2A2118] text-ledger-paper rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-[#D4AF37]/30 p-4 md:p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 z-10 mb-6">
          <div className="absolute inset-0 opacity-20 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] pointer-events-none"></div>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
          
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold text-[#D4AF37] font-tamil drop-shadow-sm flex items-center gap-2 md:gap-3 uppercase tracking-widest">
              <Book size={24} className="text-[#D4AF37]" />
              {t('eventLedger.title')}
            </h1>
            <p className="text-[10px] md:text-xs font-semibold tracking-widest text-[#D4AF37]/70 uppercase mt-1 pl-8 md:pl-10">{t('eventLedger.subtitle')}</p>
          </div>
          
          <motion.button
            onClick={() => setShowForm(!showForm)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 px-4 py-3 md:px-6 md:py-2.5 bg-gradient-to-r from-ledger-red via-[#8B0000] to-ledger-red text-white shadow-[0_4px_15px_rgba(155,44,44,0.4)] hover:shadow-[0_8px_25px_rgba(155,44,44,0.6)] border border-white/10 transition-all rounded-lg font-bold w-full md:w-auto justify-center"
          >
            <Plus size={18} className="text-white/80" />
            <span className="tracking-widest uppercase text-xs md:text-sm">{t('eventLedger.newLedger')}</span>
          </motion.button>
        </motion.div>

        {/* Create Event Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial="hidden" animate="visible" exit="exit" variants={formVariants}
              className="bg-ledger-paper border-2 border-ledger-brown p-8 shadow-paper mb-10 overflow-hidden relative"
            >
              <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none z-0"></div>
              
              <h2 className="text-2xl font-bold text-ledger-ink mb-6 border-b-2 border-ledger-brown/30 pb-2 font-tamil relative z-10 inline-block">{t('eventLedger.createLedgerTitle')}</h2>
              
              <form onSubmit={handleCreateEvent} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-ledger-brown/70 mb-1">{t('eventLedger.ledgerTitle')}</label>
                    <input
                      type="text"
                      value={formData.eventName}
                      onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                      required
                      className="w-full px-2 py-2 bg-transparent border-b border-ledger-brown/40 focus:border-ledger-brown outline-none transition-all font-bold text-xl text-ledger-ink font-tamil placeholder-ledger-brown/30"
                      placeholder={language === 'ta' ? 'உ.ம்: பிரியா திருமணம்' : 'e.g. Priya Wedding'}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-ledger-brown/70 mb-1">{t('eventLedger.eventType')}</label>
                    <select
                      value={formData.eventType}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                      className="w-full px-2 py-2 bg-transparent border-b border-ledger-brown/40 focus:border-ledger-brown outline-none transition-all font-bold text-lg text-ledger-ink"
                    >
                      <option value="Wedding">{t('eventLedger.types.wedding')}</option>
                      <option value="Housewarming">{t('eventLedger.types.housewarming')}</option>
                      <option value="Seemantham">{t('eventLedger.types.seemantham')}</option>
                      <option value="Birthday">{t('eventLedger.types.birthday')}</option>
                      <option value="Ear Piercing">{t('eventLedger.types.earPiercing')}</option>
                      <option value="Temple Function">{t('eventLedger.types.temple')}</option>
                      <option value="Custom">{t('eventLedger.types.custom')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-ledger-brown/70 mb-1">{t('eventLedger.date')}</label>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      required
                      className="w-full px-2 py-2 bg-transparent border-b border-ledger-brown/40 focus:border-ledger-brown outline-none transition-all font-bold text-lg text-ledger-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-ledger-brown/70 mb-1">{t('eventLedger.location')}</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-2 py-2 bg-transparent border-b border-ledger-brown/40 focus:border-ledger-brown outline-none transition-all font-bold text-lg text-ledger-ink placeholder-ledger-brown/30"
                      placeholder={language === 'ta' ? 'உ.ம்: சேலம்' : 'e.g. Salem'}
                    />
                  </div>
                </div>

                {/* Pricing & GST Notice */}
                <div className="p-3.5 bg-amber-50/90 border border-[#D4AF37] rounded-lg text-xs text-[#432C20] font-medium leading-relaxed">
                  <p className="font-bold text-[#8B0000]">Pricing Information:</p>
                  <p>“₹150 one-time charge per booklet, including GST. Account maintenance is charged separately.”</p>
                </div>

                {paymentMessage && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-lg flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-blue-600" />
                    <span>{paymentMessage}</span>
                  </div>
                )}

                {paymentError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
                    {paymentError}
                  </div>
                )}

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="px-8 py-2.5 border-2 border-ledger-brown bg-ledger-brown text-ledger-paper hover:bg-ledger-ink hover:border-ledger-ink transition-colors font-bold tracking-widest uppercase text-xs disabled:opacity-50 flex items-center gap-2"
                  >
                    {paymentLoading && <RefreshCw size={14} className="animate-spin" />}
                    <span>Pay ₹150 & Create Booklet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2.5 border-2 border-ledger-brown/30 text-ledger-brown hover:bg-ledger-brown/10 transition-colors font-bold tracking-widest uppercase text-xs"
                  >
                    {t('eventLedger.cancelBtn')}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shelf Container */}
        <div className="relative pb-24">
          {/* Notebooks Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 gap-y-12 py-8 relative z-10 px-2" style={{ perspective: '1000px' }}>
            {events.length > 0 ? (
              events.map((event) => {
                const isDraft = event.status === 'draft' || !event.isPaid;

                return (
                  <motion.div
                    key={event._id}
                    variants={itemVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => {
                      if (isDraft) {
                        handleResumePayment(event);
                      } else {
                        navigate(`/events/${event._id}`);
                      }
                    }}
                    className={`rounded-sm h-88 flex flex-col justify-between cursor-pointer group shadow-lg relative overflow-visible transform-gpu origin-bottom-left ${
                      isDraft ? 'bg-[#2E201B] border-2 border-dashed border-amber-600/70' : 'bg-[#3D2314]'
                    }`}
                  >
                    {/* Spine effect */}
                    <div className="absolute top-0 bottom-0 left-0 w-6 bg-[#2A160A] border-r border-black/40 z-20 flex flex-col justify-between py-6">
                      <div className="w-full h-1 bg-black/30"></div>
                      <div className="w-full h-1 bg-black/30"></div>
                      <div className="w-full h-1 bg-black/30"></div>
                      <div className="w-full h-1 bg-black/30"></div>
                    </div>

                    {/* Page edges effect (Right side) */}
                    <div className="absolute top-1 bottom-1 -right-2 w-2 bg-[#f4ebd0] border-y border-r border-[#d4c39e] shadow-inner rounded-r-sm z-0 flex flex-col justify-evenly overflow-hidden">
                      {[...Array(20)].map((_, i) => <div key={i} className="w-full h-[1px] bg-ledger-brown/10"></div>)}
                    </div>

                    {/* Leather Texture overlay */}
                    <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] pointer-events-none z-10"></div>

                    {/* Gold Corner Ornaments */}
                    <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37] opacity-60 z-20 rounded-tr-sm"></div>
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37] opacity-60 z-20 rounded-br-sm"></div>

                    <div className="p-4 pl-10 h-full flex flex-col text-center relative z-20">
                      {isDraft ? (
                        <div className="mx-auto px-2 py-0.5 bg-amber-500/20 border border-amber-400 text-amber-300 rounded text-[9px] font-bold tracking-widest uppercase mt-2">
                          Draft / Unpaid
                        </div>
                      ) : (
                        <div className="mx-auto w-10 h-10 border border-[#D4AF37]/40 rounded-full flex items-center justify-center mb-4 mt-2 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
                          <Book className="text-[#D4AF37]" size={18} />
                        </div>
                      )}
                      
                      <h3 className="text-lg font-bold text-[#D4AF37] font-tamil leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-2 line-clamp-3 group-hover:text-[#F3E5AB] transition-colors">
                        {tData(event.eventName)}
                      </h3>
                      
                      <p className="text-[#D4AF37]/60 text-[9px] font-semibold uppercase tracking-widest mt-2 border-t border-[#D4AF37]/20 pt-2 mx-2">
                        {new Date(event.eventDate).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', { month: 'short', year: 'numeric' })}{event.location ? ` • ${tData(event.location)}` : ''}
                      </p>

                      <div className="mt-auto bg-black/40 p-2 rounded border border-white/5 group-hover:bg-black/50 transition-colors">
                        {isDraft ? (
                          <button
                            onClick={(e) => handleResumePayment(event, e)}
                            className="w-full py-1.5 px-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded font-bold text-[10px] uppercase tracking-wider hover:opacity-90 shadow"
                          >
                            Pay ₹150 to Activate
                          </button>
                        ) : (
                          <>
                            <p className="text-[9px] text-[#D4AF37]/50 uppercase tracking-widest mb-0.5">{t('eventLedger.totalCollection')}</p>
                            <p className="text-[#F3E5AB] font-bold font-serif text-sm tracking-tight drop-shadow-md">
                              ₹{event.totalCollection?.toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN') || 0}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-24 z-10 relative">
                <div className="inline-block p-10 bg-ledger-paper/80 border-2 border-dashed border-ledger-brown/40 shadow-paper rounded">
                  <Book className="mx-auto text-ledger-brown/40 mb-4" size={48} />
                  <p className="text-xl font-tamil text-ledger-ink font-bold">{t('eventLedger.noLedgersTitle')}</p>
                  <p className="text-ledger-brown mt-2 font-serif italic">{t('eventLedger.noLedgers')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default EventLedger;
