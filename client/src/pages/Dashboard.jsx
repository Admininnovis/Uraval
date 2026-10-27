import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import UravinLoading from '../components/UravinLoading';
import api, { billingApi } from '../services/api';
import { loadRazorpayScript } from '../utils/razorpay';
import { useLanguage } from '../context/LanguageContext';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  BookOpen,
  BookPlus,
  Undo2,
  ArrowDown,
  ArrowUp,
  Clock,
  CornerUpLeft,
  Users,
  TrendingUp,
  BarChart3,
  Star,
  FileText,
  MoreVertical,
  ArrowRight,
  X,
  HandCoins
} from 'lucide-react';
import {
  WeddingRings,
  BabyFootprints,
  TempleGopuram,
  VillageHouse,
  HeritageLandscape
} from '../components/Illustrations';
import heritageHeaderImg from '../assets/moi-heritage-header.png';
import vanakkamHandsImg from '../assets/moi-vanakkam-hands.png';

// Handcrafted traditional leather book cover with gold-foil emblem per event type
const EventBookCover = ({ eventType = '', eventName = '' }) => {
  const typeLower = (eventType || '').toLowerCase();
  const nameLower = (eventName || '').toLowerCase();

  const isBaby =
    typeLower.includes('baby') ||
    typeLower.includes('ear') ||
    typeLower.includes('child') ||
    nameLower.includes('baby') ||
    nameLower.includes('ear') ||
    nameLower.includes('child');

  const isTemple =
    typeLower.includes('temple') ||
    typeLower.includes('kumb') ||
    nameLower.includes('temple') ||
    nameLower.includes('kovil');

  const isHouse =
    typeLower.includes('house') ||
    nameLower.includes('house') ||
    nameLower.includes('veedu');

  return (
    <div 
      aria-hidden="true"
      className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-lg bg-[#3D271D] shadow-md flex items-center justify-center relative overflow-hidden shrink-0 border border-[#2E1E17] select-none group-hover:scale-[1.02] transition-transform"
    >
      {/* Book Spine Stitching & Indentation */}
      <div className="absolute top-0 bottom-0 left-2 w-[1.5px] bg-black/50 shadow-[1px_0_0_rgba(255,255,255,0.08)]"></div>
      
      {/* Fine Gold Edge Embossing Frame */}
      <div className="absolute inset-1 rounded-sm border border-[#D4AF37]/35 pointer-events-none"></div>

      {/* Center Gold Foil Emblem */}
      <div className="text-[#D4AF37] pl-1.5 flex items-center justify-center">
        {isBaby ? (
          <BabyFootprints className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" />
        ) : isTemple ? (
          <TempleGopuram className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" />
        ) : isHouse ? (
          <VillageHouse className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" />
        ) : (
          <WeddingRings className="w-9 h-7 sm:w-10 sm:h-8 md:w-12 md:h-8" />
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { t, language, tData } = useLanguage();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    eventName: '',
    eventType: 'Marriage',
    eventDate: new Date().toISOString().split('T')[0],
    location: '',
    description: ''
  });
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentError, setPaymentError] = useState(null);

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

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreatingEvent(true);
    setPaymentError(null);
    setPaymentMessage('Preparing booklet payment...');

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Could not load payment checkout SDK. Please check your internet connection.');
      }

      const res = await billingApi.createBookletPurchase(eventForm);
      const { purchaseReference, amount, currency, razorpayOrderId, razorpayKeyId } = res.data;

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
          event_name: eventForm.eventName,
        },
        theme: {
          color: '#8B0000',
        },
        handler: async function (checkoutRes) {
          setPaymentMessage('Verifying payment and creating booklet...');
          try {
            const verifyRes = await billingApi.verifyPayment({
              purchaseReference,
              razorpay_order_id: checkoutRes.razorpay_order_id,
              razorpay_payment_id: checkoutRes.razorpay_payment_id,
              razorpay_signature: checkoutRes.razorpay_signature,
            });

            if (verifyRes.data.success) {
              setPaymentMessage('Payment verified! Opening your new booklet...');
              const newBookletId = verifyRes.data.bookletId || verifyRes.data.fulfillmentResult?.bookletId;
              setShowNewEventModal(false);
              setEventForm({
                eventName: '',
                eventType: 'Marriage',
                eventDate: new Date().toISOString().split('T')[0],
                location: '',
                description: '',
              });
              setTimeout(() => {
                if (newBookletId) {
                  navigate(`/events/${newBookletId}`);
                } else {
                  fetchDashboardData();
                }
              }, 1000);
            } else {
              throw new Error(verifyRes.data.message || 'Payment verification failed');
            }
          } catch (verErr) {
            console.error('Verification error:', verErr);
            setPaymentError(verErr.response?.data?.message || 'Payment verification failed');
            setCreatingEvent(false);
          }
        },
        modal: {
          ondismiss: async function () {
            setPaymentMessage('Checking payment status...');
            try {
              const recoverRes = await billingApi.recoverPurchaseStatus(purchaseReference);
              if (recoverRes.data.status === 'captured') {
                const recoveredId = recoverRes.data.bookletId || recoverRes.data.purchase?.booklet;
                setPaymentMessage('Payment confirmed! Opening your booklet...');
                setShowNewEventModal(false);
                setTimeout(() => {
                  if (recoveredId) {
                    navigate(`/events/${recoveredId}`);
                  } else {
                    fetchDashboardData();
                  }
                }, 1000);
                return;
              }
            } catch (e) {
              console.warn(e);
            }
            setCreatingEvent(false);
            setPaymentMessage('');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (failRes) {
        console.error('Payment failed:', failRes);
        setPaymentError(`Payment failed: ${failRes.error?.description || 'Transaction unsuccessful'}`);
        setCreatingEvent(false);
        setPaymentMessage('');
      });

      rzp.open();
    } catch (err) {
      console.error('Error creating booklet purchase:', err);
      setPaymentError(err.response?.data?.message || err.message || t('dashboard.failedToCreate'));
      setCreatingEvent(false);
      setPaymentMessage('');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[65vh]">
          <UravinLoading size="lg" />
        </div>
      </Layout>
    );
  }

  const stats = data?.stats || {};
  const activeEvents = data?.activeEvents || [];
  const insights = data?.insights || {};

  // Find user's highest collection event safely
  const highestEvent = insights?.highestCollectionEvent || null;
  const highestEventName = highestEvent?.name || '';
  const highestCollection = Number(highestEvent?.collection || 0);

  // Formatted date for header
  const todayFormatted = new Date().toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).toUpperCase();

  return (
    <Layout>
      <div className="w-full space-y-3 sm:space-y-3.5 md:space-y-4 font-sans">
        
        {/* ======================================================== */}
        {/* 1. Header: Compact Welcome Section                       */}
        {/* ======================================================== */}
        <section aria-label="Welcome and Quick Actions" className="bg-[#F7F3EB] border border-[#DDD1BF] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 md:p-5 shadow-sm relative overflow-hidden">
          {/* Heritage Temple & Palms Artwork - at backmost layer (z-0) of the div */}
          <div className="absolute inset-y-0 right-0 w-72 sm:w-[460px] md:w-[540px] lg:w-[600px] pointer-events-none select-none z-0 overflow-hidden flex items-center justify-end opacity-25 sm:opacity-35">
            <img
              src={heritageHeaderImg}
              alt=""
              aria-hidden="true"
              className="h-full w-auto max-w-none object-contain filter sepia-[0.2]"
              loading="eager"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('.vector-heritage-fallback');
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
            <div className="vector-heritage-fallback hidden w-full h-full text-[#B68A3D] opacity-25">
              <HeritageLandscape className="w-full h-full" />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 relative z-10">
            
            {/* Greeting & Date */}
            <div className="max-w-xl min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold text-[#B68A3D] uppercase font-sans leading-normal">
                {todayFormatted}
              </p>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-serif font-bold text-[#432C20] leading-snug mt-1 flex items-center gap-2.5 sm:gap-3 flex-wrap">
                <span>{t('dashboard.greeting')}</span>
                <img
                  src={vanakkamHandsImg}
                  alt=""
                  aria-hidden="true"
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 object-contain inline-block select-none"
                />
              </h1>
              <p className="text-stone-600 text-xs sm:text-sm mt-1 font-sans leading-normal">
                {t('dashboard.atAGlance')}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Link
                  to="/events"
                  className="w-full sm:w-auto min-h-[44px] px-5 sm:px-6 py-2.5 bg-[#432C20] hover:bg-[#322118] text-[#FAF7F0] rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all hover:shadow-lg active:scale-[0.98] text-center leading-snug"
                >
                  <Plus size={18} strokeWidth={2.5} className="shrink-0" />
                  <span>{t('dashboard.newEntry')}</span>
                </Link>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowNewEventModal(true)}
                    className="min-h-[44px] px-2.5 sm:px-5 py-2 sm:py-2.5 bg-[#F7F3EB]/95 hover:bg-[#EDE5D8] text-[#432C20] border border-[#DDD1BF] hover:border-[#B68A3D] rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] backdrop-blur-xs text-center leading-snug overflow-hidden"
                  >
                    <BookPlus size={16} strokeWidth={2} className="text-[#B68A3D] shrink-0" />
                    <span className="truncate">{t('dashboard.newEvent')}</span>
                  </button>

                  <Link
                    to="/personal-ledger"
                    className="min-h-[44px] px-2.5 sm:px-5 py-2 sm:py-2.5 bg-[#F7F3EB]/95 hover:bg-[#EDE5D8] text-[#432C20] border border-[#DDD1BF] hover:border-[#B68A3D] rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] backdrop-blur-xs text-center leading-snug overflow-hidden"
                  >
                    <Undo2 size={16} strokeWidth={2} className="text-[#B68A3D] shrink-0" />
                    <span className="truncate">{t('dashboard.returnMoney')}</span>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. Main Split Section: Active Books (2/3) & Insights (1/3)*/}
        {/* ======================================================== */}
        <section aria-label="Active Books and Insights" className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 md:gap-3.5 items-stretch">
          
          {/* Active Event Books (Approx 2/3: lg:col-span-8) */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="bg-[#F7F3EB] border border-[#DDD1BF] rounded-xl p-3.5 sm:p-4 md:p-5 shadow-sm h-full flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#DDD1BF]/70">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-[#B68A3D]" />
                    <h2 className="font-serif font-bold text-base sm:text-lg text-[#432C20]">
                      {t('dashboard.activeBooks')}
                    </h2>
                  </div>
                  <Link
                    to="/events"
                    className="text-xs font-semibold text-[#B68A3D] hover:text-[#432C20] flex items-center gap-1 transition-colors min-h-[32px]"
                  >
                    <span>{t('dashboard.viewAllBooks')}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Event Stack */}
                <div className="space-y-2 sm:space-y-2.5">
                  {activeEvents.length > 0 ? (
                    activeEvents.map((evt, idx) => {
                      return (
                        <div
                          key={evt._id || idx}
                          onClick={() => navigate(`/events/${evt._id}`)}
                          className="bg-[#EDE5D8]/70 hover:bg-[#EDE5D8] border border-[#DDD1BF] rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2 sm:gap-3 transition-all hover:border-[#B68A3D]/60 hover:shadow-sm cursor-pointer group"
                        >
                          {/* Left: Traditional Handcrafted Leather Book Cover */}
                          <div className="flex items-center gap-2 sm:gap-3.5 flex-1 min-w-0">
                            <EventBookCover 
                              eventType={evt.eventType} 
                              eventName={evt.eventName} 
                            />

                            {/* Middle Details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] sm:text-[11px] font-bold uppercase text-stone-500 font-sans leading-tight">
                                {new Date(evt.eventDate).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', { month: 'long', year: 'numeric' }).toUpperCase()}
                              </p>
                              <h3 className="font-serif font-bold text-sm sm:text-base text-[#432C20] truncate mt-0.5 group-hover:text-[#B68A3D] transition-colors leading-snug">
                                {tData(evt.eventName)}
                              </h3>
                              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-stone-600 mt-0.5 leading-tight">
                                <Users size={12} className="text-stone-400 shrink-0" />
                                <span>{evt.totalEntries || 0} {t('dashboard.entriesCount')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Current Balance & Link */}
                          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-[10px] text-stone-500 font-medium hidden sm:block">
                                {t('dashboard.currentBalance')}
                              </p>
                              <p className="font-serif font-bold text-sm sm:text-lg md:text-xl text-[#B68A3D] leading-tight">
                                ₹{(evt.currentBalance || 0).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                              </p>
                              <span className="text-[10px] sm:text-[11px] font-semibold text-[#B68A3D] flex items-center justify-end gap-0.5 mt-0.5 group-hover:underline leading-tight">
                                <span>{t('dashboard.viewLedger')}</span>
                                <ArrowRight size={11} />
                              </span>
                            </div>

                            <button 
                              type="button"
                              aria-label="More actions"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/events/${evt._id}`);
                              }}
                              className="p-1 text-stone-400 hover:text-[#432C20] rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            >
                              <MoreVertical size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center bg-[#EDE5D8]/50 border border-dashed border-[#DDD1BF] rounded-xl">
                      <BookOpen className="mx-auto text-stone-400 mb-1.5" size={28} />
                      <p className="font-serif text-stone-600 text-xs sm:text-sm">
                        {t('dashboard.noActiveBooks')}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowNewEventModal(true)}
                        className="mt-2.5 px-3.5 py-1.5 bg-[#432C20] text-[#FAF7F0] rounded-lg text-xs font-semibold uppercase tracking-wider min-h-[36px]"
                      >
                        {t('dashboard.openFirstBook')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ledger Insights (Approx 1/3: lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="bg-[#F7F3EB] border border-[#DDD1BF] rounded-xl p-3.5 sm:p-4 md:p-5 shadow-sm flex flex-col justify-between h-full">
              <div>
                {/* Header */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#DDD1BF]/70">
                  <BarChart3 size={18} className="text-[#B68A3D]" />
                  <h2 className="font-serif font-bold text-base sm:text-lg text-[#432C20]">
                    {t('dashboard.ledgerInsights')}
                  </h2>
                </div>

                {/* Insight 1: Highest collection */}
                <div className="flex items-start justify-between gap-3 pt-0.5">
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-stone-600">
                      <Star size={13} className="text-[#B68A3D] fill-[#B68A3D]" />
                      <span>{t('dashboard.highestCollection')}</span>
                    </div>
                    {highestCollection > 0 && highestEventName ? (
                      <>
                        <p className="font-serif font-bold text-sm sm:text-base text-[#432C20] mt-1">
                          {tData(highestEventName)}
                        </p>
                        <p className="font-serif font-bold text-xl sm:text-2xl text-[#2E7D32] mt-0.5">
                          ₹{highestCollection.toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-serif text-xs sm:text-sm text-stone-500 mt-1">
                          {language === 'ta' ? 'பதிவுகள் எதுவும் இல்லை' : 'No collection yet'}
                        </p>
                        <p className="font-serif font-bold text-xl sm:text-2xl text-stone-400 mt-0.5">
                          ₹0
                        </p>
                      </>
                    )}
                  </div>

                  <div className="text-[#B68A3D] w-12 h-9 shrink-0 opacity-80" aria-hidden="true">
                    <WeddingRings className="w-full h-full" />
                  </div>
                </div>
              </div>

              {/* Rural Accountant Quote */}
              <div className="border-t border-[#DDD1BF] pt-3 mt-4">
                <p className="text-[11px] sm:text-xs italic text-stone-500 text-center font-serif leading-relaxed">
                  {t('dashboard.quote')}
                </p>
                <p className="text-[10px] sm:text-[11px] text-stone-400 text-right mt-1 font-serif">
                  - {t('dashboard.accountant')}
                </p>
              </div>
            </div>
          </div>

        </section>

        {/* ======================================================== */}
        {/* 4. Bottom Section: Financial Summary Register (Full Width)*/}
        {/* ======================================================== */}
        <section aria-label="Financial Summary Register" className="w-full">
          <div className="bg-[#F7F3EB] border border-[#DDD1BF] rounded-xl p-3.5 sm:p-4 md:p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#DDD1BF]/60">
              <FileText size={18} className="text-[#B68A3D]" />
              <h2 className="font-serif font-bold text-base sm:text-lg text-[#432C20]">
                {t('dashboard.financialSummaryRegister')}
              </h2>
            </div>

            <div className="border border-[#DDD1BF] rounded-lg overflow-hidden bg-[#FAF7F2] shadow-xs">
              {/* Table Header */}
              <div className="bg-[#EDE5D8] border-b border-[#DDD1BF] text-stone-600 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider py-2 px-3 sm:px-4 flex justify-between items-center font-sans">
                <span>{t('dashboard.accountDescription')}</span>
                <span>{t('dashboard.amountInRupees')}</span>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-[#DDD1BF]/70 font-sans">
                <div className="py-2.5 px-3 sm:px-4 flex justify-between items-center hover:bg-[#EDE5D8]/50 transition-colors">
                  <div className="flex items-center gap-2 font-medium text-[#432C20] text-xs sm:text-sm">
                    <ArrowDown size={15} className="text-[#2E7D32]" />
                    <span>{t('dashboard.totalReceived')}</span>
                  </div>
                  <span className="font-serif font-bold text-xs sm:text-sm md:text-base text-[#2E7D32] text-right">
                    ₹{(stats?.totalReceived || 0).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                  </span>
                </div>

                <div className="py-2.5 px-3 sm:px-4 flex justify-between items-center hover:bg-[#EDE5D8]/50 transition-colors">
                  <div className="flex items-center gap-2 font-medium text-[#432C20] text-xs sm:text-sm">
                    <ArrowUp size={15} className="text-[#C62828]" />
                    <span>{t('dashboard.totalReturned')}</span>
                  </div>
                  <span className="font-serif font-bold text-xs sm:text-sm md:text-base text-[#C62828] text-right">
                    ₹{(stats?.totalReturned || 0).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                  </span>
                </div>

                <div className="py-2.5 px-3 sm:px-4 flex justify-between items-center hover:bg-[#EDE5D8]/50 transition-colors">
                  <div className="flex items-center gap-2 font-medium text-[#432C20] text-xs sm:text-sm">
                    <Clock size={15} className="text-[#B68A3D]" />
                    <span>{t('dashboard.needToReceive')}</span>
                  </div>
                  <span className="font-serif font-bold text-xs sm:text-sm md:text-base text-[#B68A3D] text-right">
                    ₹{(stats?.needToReceive || 0).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                  </span>
                </div>

                <div className="py-2.5 px-3 sm:px-4 flex justify-between items-center hover:bg-[#EDE5D8]/50 transition-colors">
                  <div className="flex items-center gap-2 font-medium text-[#432C20] text-xs sm:text-sm">
                    <CornerUpLeft size={15} className="text-[#8C5824]" />
                    <span>{t('dashboard.needToReturn')}</span>
                  </div>
                  <span className="font-serif font-bold text-xs sm:text-sm md:text-base text-[#8C5824] text-right">
                    ₹{(stats?.needToReturn || 0).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ======================================================== */}
      {/* 5. New Event Quick Modal                                 */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showNewEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#F7F3EB] border-2 border-[#B68A3D]/40 rounded-2xl shadow-2xl p-6 w-full max-w-lg relative"
            >
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#DDD1BF]">
                <h3 className="font-serif font-bold text-xl text-[#432C20] flex items-center gap-2">
                  <BookOpen size={20} className="text-[#B68A3D]" />
                  <span>{t('dashboard.createNewEventBook')}</span>
                </h3>
                <button
                  type="button"
                  aria-label="Close modal"
                  onClick={() => setShowNewEventModal(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-[#432C20] hover:bg-[#EDE5D8] transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    {t('dashboard.eventName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventForm.eventName}
                    onChange={(e) => setEventForm({ ...eventForm, eventName: e.target.value })}
                    placeholder={t('dashboard.eventNamePlaceholder')}
                    className="w-full bg-[#EDE5D8]/60 border border-[#DDD1BF] focus:border-[#B68A3D] focus:ring-2 focus:ring-[#B68A3D]/20 rounded-lg px-3 py-2 text-sm outline-none text-[#432C20]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                      {t('dashboard.eventType')}
                    </label>
                    <select
                      value={eventForm.eventType}
                      onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                      className="w-full bg-[#EDE5D8]/60 border border-[#DDD1BF] focus:border-[#B68A3D] rounded-lg px-3 py-2 text-sm outline-none text-[#432C20]"
                    >
                      <option value="Marriage">{t('dashboard.types.marriage')}</option>
                      <option value="Baby Shower">{t('dashboard.types.babyShower')}</option>
                      <option value="Birthday">{t('dashboard.types.birthday')}</option>
                      <option value="House Warming">{t('dashboard.types.houseWarming')}</option>
                      <option value="Other">{t('dashboard.types.other')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                      {t('dashboard.eventDate')}
                    </label>
                    <input
                      type="date"
                      value={eventForm.eventDate}
                      onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                      className="w-full bg-[#EDE5D8]/60 border border-[#DDD1BF] focus:border-[#B68A3D] rounded-lg px-3 py-2 text-sm outline-none text-[#432C20]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    {t('dashboard.location')}
                  </label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    placeholder={t('dashboard.locationPlaceholder')}
                    className="w-full bg-[#EDE5D8]/60 border border-[#DDD1BF] focus:border-[#B68A3D] rounded-lg px-3 py-2 text-sm outline-none text-[#432C20]"
                  />
                </div>

                {/* Booklet Fee Notice */}
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                  <div>
                    <p className="font-bold">Booklet Creation Fee</p>
                    <p className="text-[11px] text-amber-800">One-time payment • Includes 18% GST</p>
                  </div>
                  <span className="font-bold text-base text-[#432C20]">₹150</span>
                </div>

                {paymentMessage && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Clock size={14} className="animate-spin text-blue-600" />
                    <span>{paymentMessage}</span>
                  </div>
                )}

                {paymentError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold">
                    {paymentError}
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowNewEventModal(false)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-600 hover:bg-[#EDE5D8] rounded-lg transition-colors min-h-[44px]"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={creatingEvent}
                    className="px-6 py-2 bg-[#432C20] hover:bg-[#322118] text-[#FAF7F0] rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm transition-all min-h-[44px] flex items-center gap-2"
                  >
                    {creatingEvent ? 'Processing...' : 'Pay ₹150 & Create Booklet'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Dashboard;
