import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import UravinLoading from '../components/UravinLoading';
import { billingApi } from '../services/api';
import { loadRazorpayScript } from '../utils/razorpay';
import {
  ShieldCheck,
  Calendar,
  Clock,
  CreditCard,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Info,
} from 'lucide-react';
import TaxInvoiceTemplate from '../components/TaxInvoiceTemplate';
import { downloadInvoiceElementPdf } from '../utils/pdfGenerator';

export default function Subscription() {
  const [accessData, setAccessData] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentState, setPaymentState] = useState('ready'); // ready, processing, success, failed
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [downloadingRef, setDownloadingRef] = useState(null);
  const [activeInvoice, setActiveInvoice] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accessRes, purchasesRes] = await Promise.all([
        billingApi.getAccessStatus(),
        billingApi.getUserPurchases(),
      ]);
      setAccessData(accessRes.data);
      setPurchases(purchasesRes.data.purchases || []);
    } catch (err) {
      console.error('Error loading subscription info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRenewNow = async () => {
    try {
      setPaymentState('processing');
      setFeedbackMessage('Preparing account maintenance checkout...');

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Could not load payment checkout SDK. Please check your internet connection.');
      }

      const res = await billingApi.createMaintenancePurchase();
      const { purchaseReference, amount, currency, razorpayOrderId, razorpayKeyId } = res.data;

      setFeedbackMessage('Opening Razorpay Checkout...');

      const options = {
        key: razorpayKeyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'Uravuu - Moi Ledger',
        description: 'Account Maintenance Renewal (6 Months)',
        order_id: razorpayOrderId,
        notes: {
          application: 'uravuu',
          internal_purchase_reference: purchaseReference,
          payment_purpose: 'account_maintenance',
        },
        theme: {
          color: '#7A2E1E',
        },
        handler: async function (checkoutRes) {
          try {
            setFeedbackMessage('Verifying payment on server...');
            const verifyRes = await billingApi.verifyPayment({
              purchaseReference,
              razorpay_order_id: checkoutRes.razorpay_order_id,
              razorpay_payment_id: checkoutRes.razorpay_payment_id,
              razorpay_signature: checkoutRes.razorpay_signature,
            });

            if (verifyRes.data.success) {
              setPaymentState('success');
              setFeedbackMessage('Payment verified! 6 months of full account access granted.');
              await loadData();
            } else {
              throw new Error(verifyRes.data.message || 'Payment verification failed.');
            }
          } catch (verErr) {
            console.error('Verification error:', verErr);
            setPaymentState('failed');
            setFeedbackMessage(verErr.response?.data?.message || verErr.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: async function () {
            setFeedbackMessage('Checking payment recovery status...');
            try {
              const recoverRes = await billingApi.recoverPurchaseStatus(purchaseReference);
              if (recoverRes.data.status === 'captured') {
                setPaymentState('success');
                setFeedbackMessage('Payment confirmed! Six months of access granted.');
                await loadData();
                return;
              }
            } catch (recErr) {
              console.warn('Recovery error:', recErr);
            }
            setPaymentState('ready');
            setFeedbackMessage('');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setPaymentState('failed');
        setFeedbackMessage(`Payment failed: ${resp.error?.description || 'Unknown error'}`);
      });
      rzp.open();
    } catch (err) {
      console.error('Error initiating maintenance purchase:', err);
      setPaymentState('failed');
      setFeedbackMessage(err.response?.data?.message || err.message || 'Could not start checkout.');
    }
  };

  const handleRecover = async (purchaseReference) => {
    try {
      setFeedbackMessage(`Checking status for ${purchaseReference}...`);
      const res = await billingApi.recoverPurchaseStatus(purchaseReference);
      if (res.data.status === 'captured') {
        setPaymentState('success');
        setFeedbackMessage(`Payment confirmed! Purchase ${purchaseReference} has been fulfilled.`);
        await loadData();
      } else if (res.data.status === 'failed') {
        setPaymentState('ready');
        setFeedbackMessage(`Payment was not completed for ${purchaseReference}. Status marked as failed.`);
        await loadData();
      } else {
        setFeedbackMessage(`Purchase ${purchaseReference} is ${res.data.status}.`);
        await loadData();
      }
    } catch (err) {
      console.error('Recovery failed:', err);
      setFeedbackMessage('Could not retrieve status. Please try again shortly.');
      await loadData();
    }
  };

  const handleDownloadReceipt = async (purchaseReference) => {
    try {
      setDownloadingRef(purchaseReference);
      setFeedbackMessage(`Preparing official tax invoice for ${purchaseReference}...`);
      const res = await billingApi.getReceipt(purchaseReference);
      const invoiceData = res.data?.invoice;
      if (!invoiceData) {
        throw new Error('Invoice data not available.');
      }
      setActiveInvoice(invoiceData);

      setTimeout(async () => {
        try {
          await downloadInvoiceElementPdf('client-tax-invoice-export', invoiceData.invoiceNumber);
          setFeedbackMessage(`Tax Invoice ${invoiceData.invoiceNumber} downloaded successfully!`);
        } catch (genErr) {
          console.error('PDF generation error:', genErr);
          setFeedbackMessage('Failed to download invoice PDF.');
        } finally {
          setDownloadingRef(null);
          setActiveInvoice(null);
        }
      }, 400);
    } catch (err) {
      console.error('Receipt download error:', err);
      alert('Could not download invoice: ' + (err.response?.data?.message || err.message));
      setDownloadingRef(null);
      setActiveInvoice(null);
      setFeedbackMessage('');
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

  // Derived display state
  const access = accessData?.access;
  const isAccessActive = access?.isAccessActive ?? access?.isActive ?? false;
  const isExpired = access?.status === 'expired' || !isAccessActive;
  const isExpiringSoon = access?.isExpiringSoon || (access?.daysRemaining <= 14 && isAccessActive);
  const isPaid = access?.status === 'active_paid' && isAccessActive;

  let displayStatus = 'Free access';
  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (isExpired) {
    displayStatus = 'Expired';
    badgeColor = 'bg-red-100 text-red-800 border-red-300';
  } else if (isExpiringSoon) {
    displayStatus = 'Expiring soon';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
  } else if (isPaid) {
    displayStatus = 'Paid maintenance active';
    badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-6 md:px-8 pt-2 sm:pt-4 pb-12 font-sans text-[#432C20]">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-serif text-[#432C20] flex items-start sm:items-center gap-2.5 sm:gap-3">
            <ShieldCheck className="text-[#B68A3D] shrink-0 mt-0.5 sm:mt-0" size={28} />
            <span>Account Maintenance & Subscription</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed">
            Uravuu operates on a clean, fair business model: 6 months free access upon registration, then ₹100 per six calendar months for your entire account.
          </p>
        </div>

        {/* Access Status Card */}
        <div className="bg-[#FAF7F2] border border-[#DDD1BF] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DDD1BF]/70">
            <div>
              <span className="text-[11px] sm:text-xs uppercase font-bold text-stone-500 tracking-wider">
                Current Account Status
              </span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5">
                <span className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
                  {displayStatus}
                </span>
                {isAccessActive ? (
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle size={14} className="shrink-0" /> Full Application Access Active
                  </span>
                ) : (
                  <span className="text-xs text-red-700 font-semibold flex items-center gap-1">
                    <AlertTriangle size={14} className="shrink-0" /> Access Expired — Renewal Required
                  </span>
                )}
              </div>
            </div>

            {/* Quick Renewal CTA Button — Shown only when expiring within 14 days */}
            {isExpiringSoon && (
              <div className="w-full sm:w-auto shrink-0">
                <button
                  onClick={handleRenewNow}
                  disabled={paymentState === 'processing'}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#7A2E1E] to-[#9B3A27] hover:from-[#652417] hover:to-[#7A2E1E] text-white rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
                >
                  {paymentState === 'processing' ? (
                    <>
                      <RefreshCw size={15} className="animate-spin text-amber-300" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={15} className="text-amber-300" />
                      <span>Renew Maintenance • ₹100</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Feedback & Notifications */}
          {feedbackMessage && (
            <div
              className={`mt-4 p-3.5 sm:p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                paymentState === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : paymentState === 'failed'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {paymentState === 'success' ? (
                <CheckCircle size={16} className="text-emerald-600 shrink-0" />
              ) : paymentState === 'failed' ? (
                <AlertCircle size={16} className="text-red-600 shrink-0" />
              ) : (
                <RefreshCw size={16} className="animate-spin text-blue-600 shrink-0" />
              )}
              <span className="break-words">{feedbackMessage}</span>
            </div>
          )}

          {/* Key Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 md:gap-6 pt-5 sm:pt-6 text-sm">
            <div className="bg-white/80 p-3.5 sm:p-4 rounded-xl border border-[#DDD1BF]/60 shadow-2xs">
              <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold mb-1">
                <Calendar size={14} className="text-[#B68A3D] shrink-0" />
                <span>Initial Free Period</span>
              </div>
              <p className="font-bold text-[#432C20] text-xs sm:text-sm break-words">
                {access?.initialFreePeriodStart ? new Date(access.initialFreePeriodStart).toLocaleDateString() : '—'}
                {' to '}
                {access?.initialFreePeriodExpiry ? new Date(access.initialFreePeriodExpiry).toLocaleDateString() : '—'}
              </p>
              <p className="text-[11px] text-stone-500 mt-1 leading-tight">Starts immediately on account creation (6 months free)</p>
            </div>

            <div className="bg-white/80 p-3.5 sm:p-4 rounded-xl border border-[#DDD1BF]/60 shadow-2xs">
              <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold mb-1">
                <Clock size={14} className="text-[#B68A3D] shrink-0" />
                <span>Paid Maintenance Expiry</span>
              </div>
              <p className="font-bold text-[#432C20] text-xs sm:text-sm break-words">
                {access?.paidMaintenanceExpiry ? new Date(access.paidMaintenanceExpiry).toLocaleDateString() : 'No renewals yet'}
              </p>
              <p className="text-[11px] text-stone-500 mt-1 leading-tight">Extended by 6 calendar months on each verified renewal</p>
            </div>

            <div className="bg-white/80 p-3.5 sm:p-4 rounded-xl border border-[#DDD1BF]/60 shadow-2xs sm:col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold mb-1">
                <ShieldCheck size={14} className="text-[#B68A3D] shrink-0" />
                <span>Effective Access Valid Until</span>
              </div>
              <p className="font-bold text-[#432C20] text-xs sm:text-sm break-words">
                {access?.currentAccessExpiry ? new Date(access.currentAccessExpiry).toLocaleDateString() : '—'}
              </p>
              <p className="text-[11px] text-stone-500 mt-1 leading-tight">Derived as later of free period or paid maintenance</p>
            </div>
          </div>

          {/* Business Model Clarification Note */}
          <div className="mt-5 sm:mt-6 p-3.5 sm:p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-stone-700 flex items-start gap-2.5 sm:gap-3">
            <Info size={18} className="text-amber-800 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] sm:text-xs leading-relaxed">
              <p className="font-bold text-[#432C20]">Important Renewal Terms:</p>
              <p>• ₹100 covers the <strong>entire account</strong> and <strong>all your booklets</strong> for six calendar months.</p>
              <p>• Manual renewal only — we never set up recurring auto-debits without explicit consent.</p>
              <p>• If access expires, all your booklets and entries remain 100% safe. You only pay ₹100 for the forward 6 months to resume access.</p>
            </div>
          </div>
        </div>

        {/* Payment History & Recovery */}
        <div className="bg-[#FAF7F2] border border-[#DDD1BF] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold font-serif text-[#432C20]">Payment History & Recovery</h2>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#B68A3D] hover:underline p-1 min-h-[36px]"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>

          {purchases.length === 0 ? (
            <p className="text-xs sm:text-sm text-stone-500 py-6 text-center">No payment transactions recorded yet.</p>
          ) : (
            <>
              {/* Mobile Card List (< 768px) */}
              <div className="block md:hidden space-y-3">
                {purchases.map((p) => (
                  <div
                    key={p._id}
                    className="bg-white/90 border border-[#DDD1BF]/80 rounded-xl p-3.5 space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono font-bold text-[#432C20] truncate" title={p.purchaseReference}>
                          {p.purchaseReference}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {p.purpose === 'booklet_creation' ? 'Booklet Creation' : 'Account Maintenance'}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'captured'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#DDD1BF]/40 text-xs">
                      <div>
                        <span className="font-bold text-[#432C20] text-sm">
                          ₹{(p.amount / 100).toFixed(2)}
                        </span>
                        <span className="text-[11px] text-stone-400 ml-2">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div>
                        {p.status === 'captured' ? (
                          <button
                            onClick={() => handleDownloadReceipt(p.purchaseReference)}
                            disabled={downloadingRef === p.purchaseReference}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EDE5D8] hover:bg-[#E0D5C3] active:bg-[#D5C6AF] text-[#432C20] rounded-lg text-xs font-bold transition-colors disabled:opacity-50 min-h-[36px]"
                          >
                            <FileText size={13} className="text-[#8A5A1E]" />
                            <span>{downloadingRef === p.purchaseReference ? 'Downloading...' : 'Receipt'}</span>
                          </button>
                        ) : p.status === 'failed' ? (
                          <span className="text-stone-400 italic text-[11px]">Payment Failed</span>
                        ) : (
                          <button
                            onClick={() => handleRecover(p.purchaseReference)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors min-h-[36px]"
                          >
                            <RefreshCw size={12} />
                            <span>Check</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#DDD1BF] text-stone-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Reference</th>
                      <th className="py-2.5 px-3">Purpose</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DDD1BF]/60 text-stone-700">
                    {purchases.map((p) => (
                      <tr key={p._id} className="hover:bg-white/50 transition">
                        <td className="py-3 px-3 font-mono font-semibold text-[#432C20]">
                          {p.purchaseReference}
                        </td>
                        <td className="py-3 px-3 capitalize">
                          {p.purpose === 'booklet_creation' ? 'Booklet Creation' : 'Account Maintenance'}
                        </td>
                        <td className="py-3 px-3 font-bold text-[#432C20]">
                          ₹{(p.amount / 100).toFixed(2)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              p.status === 'captured'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-stone-500">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          {p.status === 'captured' ? (
                            <button
                              onClick={() => handleDownloadReceipt(p.purchaseReference)}
                              disabled={downloadingRef === p.purchaseReference}
                              className="inline-flex items-center gap-1 text-[#B68A3D] hover:underline font-semibold disabled:opacity-50"
                              title="Download Official Tax Invoice PDF"
                            >
                              <FileText size={13} />
                              <span>{downloadingRef === p.purchaseReference ? 'Downloading...' : 'Receipt'}</span>
                            </button>
                          ) : p.status === 'failed' ? (
                            <span className="text-stone-400 italic text-[11px]">Payment Failed</span>
                          ) : (
                            <button
                              onClick={() => handleRecover(p.purchaseReference)}
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                            >
                              <RefreshCw size={13} /> Check / Recover
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Off-screen Container for Instant Invoice PDF Generation */}
        {activeInvoice && (
          <div
            style={{
              position: 'fixed',
              left: '-9999px',
              top: '0px',
              width: '794px',
              zIndex: -9999,
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            <TaxInvoiceTemplate invoice={activeInvoice} id="client-tax-invoice-export" />
          </div>
        )}
      </div>
    </Layout>
  );
}
