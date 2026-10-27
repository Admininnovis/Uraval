import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { billingApi } from '../services/api';
import { loadRazorpayScript } from '../utils/razorpay';
import {
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  CheckCircle,
  FileText,
  Lock,
  ArrowRight,
  LogOut,
} from 'lucide-react';

export default function AccessExpiredScreen() {
  const { accountAccess, refreshAccountAccess, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRenewNow = async () => {
    setLoading(true);
    setError(null);
    setStatusMessage('Preparing maintenance renewal...');

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Could not load payment checkout SDK. Please check your internet connection.');
      }

      setStatusMessage('Creating renewal order...');
      const response = await billingApi.createMaintenancePurchase();
      const { purchaseReference, amount, currency, razorpayOrderId, razorpayKeyId } = response.data;

      setStatusMessage('Opening Razorpay Checkout...');

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
          color: '#B68A3D',
        },
        handler: async function (checkoutRes) {
          try {
            setStatusMessage('Verifying payment on server...');
            const verifyRes = await billingApi.verifyPayment({
              purchaseReference,
              razorpay_order_id: checkoutRes.razorpay_order_id,
              razorpay_payment_id: checkoutRes.razorpay_payment_id,
              razorpay_signature: checkoutRes.razorpay_signature,
            });

            if (verifyRes.data.success) {
              setSuccess(true);
              setStatusMessage('Payment verified! Six months of access granted.');
              await refreshAccountAccess();
              setTimeout(() => {
                window.location.reload();
              }, 1200);
            } else {
              throw new Error(verifyRes.data.message || 'Payment verification failed.');
            }
          } catch (verErr) {
            console.error('Verification error:', verErr);
            setError(verErr.response?.data?.message || verErr.message || 'Payment verification failed');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: async function () {
            setStatusMessage('Checking payment recovery status...');
            try {
              const recoverRes = await billingApi.recoverPurchaseStatus(purchaseReference);
              if (recoverRes.data.status === 'captured') {
                setSuccess(true);
                setStatusMessage('Payment confirmed! Six months of access granted.');
                await refreshAccountAccess();
                setTimeout(() => {
                  window.location.reload();
                }, 1200);
                return;
              }
            } catch (recErr) {
              console.warn('Recovery error:', recErr);
            }
            setLoading(false);
            setStatusMessage('');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (failRes) {
        console.error('Payment failed:', failRes);
        setError(`Payment failed: ${failRes.error?.description || 'Transaction unsuccessful'}`);
        setLoading(false);
        setStatusMessage('');
      });

      rzp.open();
    } catch (err) {
      console.error('Renewal checkout error:', err);
      setError(err.response?.data?.message || err.message || 'Could not initiate renewal checkout');
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center py-12 px-4 selection:bg-amber-100">
      <div className="max-w-2xl w-full mx-auto font-sans text-[#432C20]">
        <div className="bg-[#FAF7F2] border-2 border-amber-600/40 rounded-3xl shadow-2xl p-6 md:p-10 text-center relative overflow-hidden">
          {/* Top lock ornament */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 mb-6 shadow-sm">
            <Lock size={32} />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold font-serif text-[#432C20] mb-2">
            Application Access Expired
          </h1>
          <p className="text-xs uppercase tracking-wider font-bold text-amber-700 mb-6">
            Account Maintenance Required
          </p>

          {/* Statutory Required Notice */}
          <div className="p-4 md:p-5 rounded-xl bg-amber-50/90 border border-amber-300 text-stone-800 text-sm md:text-base leading-relaxed font-semibold mb-6 shadow-xs">
            “Your application access has expired. Renew for ₹100 to access all your booklets for six months.”
          </div>

          <div className="text-left bg-white/70 p-4 rounded-xl border border-[#DDD1BF] text-xs text-stone-600 space-y-2 mb-6">
            <div className="flex items-center gap-2 text-stone-800 font-bold">
              <ShieldCheck size={16} className="text-[#B68A3D]" />
              <span>All your data is safely preserved:</span>
            </div>
            <p>• Your booklets, contributor entries, and attachments are 100% intact.</p>
            <p>• One ₹100 renewal covers your <strong>entire account</strong> and all present and future booklets for six calendar months.</p>
            <p>• Manual renewal only — no hidden recurring auto-debits.</p>
            {accountAccess?.currentAccessExpiry && (
              <p className="pt-1 text-stone-500 border-t border-stone-200">
                Access expired on: {new Date(accountAccess.currentAccessExpiry).toLocaleDateString()}
              </p>
            )}
          </div>

          {statusMessage && (
            <div className="p-3 mb-4 text-xs font-semibold rounded-lg bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-center gap-2">
              <RefreshCw size={14} className="animate-spin text-blue-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 mb-4 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 mb-4 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center gap-2">
              <CheckCircle size={16} className="text-emerald-600" />
              <span>Payment successful! Your access is restored.</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-xs transition"
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
            <button
              onClick={handleRenewNow}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#B68A3D] to-[#966E2E] hover:from-[#A57A30] hover:to-[#855E22] text-white font-bold text-sm shadow-md transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  <span>Renew for ₹100</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
