import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingApi } from '../services/api';
import { loadRazorpayScript } from '../utils/razorpay';
import { AlertTriangle, ShieldCheck, RefreshCw, X, CheckCircle, ArrowRight } from 'lucide-react';

export default function AccessExpiredModal({ forceShow = false, onClose = null }) {
  const [isOpen, setIsOpen] = useState(forceShow);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleExpired = () => {
      setIsOpen(true);
    };
    window.addEventListener('uravuu:access_expired', handleExpired);
    return () => window.removeEventListener('uravuu:access_expired', handleExpired);
  }, []);

  useEffect(() => {
    if (forceShow) setIsOpen(true);
  }, [forceShow]);

  const handleRenewNow = async () => {
    setLoading(true);
    setError(null);
    setStatusMessage('Preparing maintenance purchase...');

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
              setStatusMessage('Access granted! Six months of full account access is now active.');
              setTimeout(() => {
                setIsOpen(false);
                window.location.reload();
              }, 1500);
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
            // Check provider / recovery in case payment succeeded via UPI or background
            setStatusMessage('Checking payment status...');
            try {
              const recoverRes = await billingApi.recoverPurchaseStatus(purchaseReference);
              if (recoverRes.data.status === 'captured') {
                setSuccess(true);
                setStatusMessage('Payment confirmed! Six months of access granted.');
                setTimeout(() => {
                  setIsOpen(false);
                  window.location.reload();
                }, 1500);
                return;
              }
            } catch (recErr) {
              console.warn('Recovery check:', recErr);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#FAF7F2] border-2 border-[#D4AF37] rounded-2xl shadow-2xl p-6 md:p-8 text-[#432C20]">
        {onClose && (
          <button
            onClick={() => {
              setIsOpen(false);
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-200/50"
          >
            <X size={20} />
          </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
            <AlertTriangle size={26} />
          </div>
          <div>
            <h3 className="text-xl font-bold font-serif text-[#432C20]">Application Access Expired</h3>
            <p className="text-xs text-[#B68A3D] font-medium uppercase tracking-wider">Account Maintenance Required</p>
          </div>
        </div>

        {/* Required Exact Specification Message */}
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-stone-800 my-4 text-sm leading-relaxed font-medium">
          “Your application access has expired. Renew for ₹100 to access all your booklets for six months.”
        </div>

        <div className="space-y-2.5 text-xs text-stone-600 mb-6 bg-white/60 p-3.5 rounded-lg border border-[#DDD1BF]">
          <div className="flex items-center gap-2 text-stone-700 font-semibold">
            <ShieldCheck size={16} className="text-[#B68A3D]" />
            <span>All your data is completely safe and preserved</span>
          </div>
          <p>
            • One ₹100 renewal covers your <strong>entire account</strong> and all present and future booklets.
          </p>
          <p>• No separate maintenance charges per booklet.</p>
          <p>• Manual renewal only — no automatic debit or hidden recurring deductions.</p>
        </div>

        {statusMessage && (
          <div className="p-3 mb-4 text-xs font-semibold rounded-lg bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-2">
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
          <div className="p-3 mb-4 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-600" />
            <span>Payment successful! Your access is restored.</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
          <button
            onClick={handleRenewNow}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#B68A3D] to-[#966E2E] hover:from-[#A57A30] hover:to-[#855E22] text-white font-bold text-sm shadow-md transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>Renew for ₹100</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
