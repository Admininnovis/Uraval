import React from 'react';
import { X, ShieldCheck, Gavel } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const LegalModal = ({ isOpen, onClose, type = 'privacy' }) => {
  const { language } = useLanguage();
  const isTamil = language === 'ta';

  if (!isOpen) return null;

  const isPrivacy = type === 'privacy';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#F7F3EB] border border-[#DDD1BF] rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#DDD1BF] flex items-center justify-between bg-[#EDE5D8]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#432C20]/10 flex items-center justify-center text-[#432C20]">
              {isPrivacy ? <ShieldCheck size={22} /> : <Gavel size={22} />}
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#432C20]">
                {isPrivacy 
                  ? (isTamil ? 'தனியுரிமைக் கொள்கை' : 'Privacy Policy') 
                  : (isTamil ? 'விதிமுறைகள் மற்றும் நிபந்தனைகள்' : 'Terms & Conditions')
                }
              </h3>
              <p className="text-xs text-stone-500">
                {isTamil ? 'கடைசியாக புதுப்பிக்கப்பட்டது: 2026' : 'Last updated: 2026'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-[#DDD1BF]/40 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-stone-700 leading-relaxed font-sans">
          {isPrivacy ? (
            <>
              <div>
                <h4 className="font-bold text-[#432C20] mb-1">
                  {isTamil ? '1. தகவல் சேகரிப்பு' : '1. Information We Collect'}
                </h4>
                <p>
                  {isTamil 
                    ? 'உறவு செயலியில் உங்கள் பெயர், மின்னஞ்சல் முகவரி, நிகழ்வு விவரங்கள் (திருமணம், காதணி விழா, புதுமனை புகுவிழா போன்றவை), மற்றும் மொய் வரவு/செலவு பதிவுகள் மட்டுமே சேமிக்கப்படுகின்றன.'
                    : 'Uravuu collects your name, email address, event details (weddings, ceremonies), and financial ledger entries for recording Moi and personal gifts.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#432C20] mb-1">
                  {isTamil ? '2. தரவு பாதுகாப்பு' : '2. Data Confidentiality & Security'}
                </h4>
                <p>
                  {isTamil 
                    ? 'உங்கள் மொய் மற்றும் தனிப்பட்ட கணக்கு விபரங்கள் முற்றிலும் ரகசியமானவை. நவீன பாதுகாப்பு முறைகள் மூலம் உங்கள் தரவுகள் பாதுகாக்கப்படுகின்றன.'
                    : 'Your traditional ledger entries and financial numbers are strictly private to your account. We employ secure standards to protect your data.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#432C20] mb-1">
                  {isTamil ? '3. மூன்றாம் தரப்பினருடன் பகிர்வதில்லை' : '3. No Third-Party Sharing'}
                </h4>
                <p>
                  {isTamil 
                    ? 'உங்கள் குடும்ப அல்லது வரவு-செலவு தகவல்கள் விளம்பரதாரர்களுக்கோ அல்லது பிற மூன்றாம் நபர்களுக்கோ ஒருபோதும் பகிரப்படவோ விற்கப்படவோ மாட்டாது.'
                    : 'We never sell, rent, or trade your personal ledger data with advertisers or third parties.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#432C20] mb-1">
                  {isTamil ? '4. பயனர் கட்டுப்பாடு & உரிமை' : '4. User Ownership & Control'}
                </h4>
                <p>
                  {isTamil 
                    ? 'உங்கள் கணக்கிலுள்ள அனைத்து பதிவுகளுக்கும் நீங்களே முழு உரிமையாளர். எப்போது வேண்டுமானாலும் உங்கள் பதிவுகளை திருத்தவோ அல்லது நீக்கவோ முடியும்.'
                    : 'You retain 100% ownership of your recorded data. You can edit, export, or delete your ledger entries at any time.'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h4 className="font-bold text-[#432C20] mb-1">
                  {isTamil ? '1. விதிமுறைகளை ஏற்றுக்கொள்ளுதல்' : '1. Acceptance of Terms'}
                </h4>
                <p>
                  {isTamil 
                    ? 'உறவு தளத்தில் கணக்கு தொடங்குவதன் மூலம் அல்லது சேவைகளைப் பயன்படுத்துவதன் மூலம் இந்த பயன்பாட்டு விதிமுறைகளை நீங்கள் ஏற்றுக்கொள்கிறீர்கள்.'
                    : 'By creating an account or using Uravuu, you agree to comply with and be bound by these Terms and Conditions.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#432C20] mb-1">
                  {isTamil ? '2. சேவையின் நோக்கம்' : '2. Purpose of Service'}
                </h4>
                <p>
                  {isTamil 
                    ? 'உறவு தளம் பாரம்பரிய மொய் கணக்குகள், குடும்ப சுபநிகழ்ச்சிகள் மற்றும் தனிநபர் வரவு-செலவு கணக்குகளை டிஜிட்டல் முறையில் பாதுகாப்பாக பராமரிப்பதற்காக வடிவமைக்கப்பட்டுள்ளது.'
                    : 'Uravuu is designed to facilitate digital management of traditional Moi ceremony contributions, gift accounting, and family records.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#432C20] mb-1">
                  {isTamil ? '3. கணக்கின் பாதுகாப்பு' : '3. Account Responsibility'}
                </h4>
                <p>
                  {isTamil 
                    ? 'உங்கள் கடவுச்சொல் மற்றும் கணக்கு தகவல்களை பாதுகாப்பாக வைத்துக்கொள்வது உங்கள் பொறுப்பாகும். பதிவிடும் தொகைகள் மற்றும் விபரங்களின் துல்லியத்திற்கு பயனரே பொறுப்பாவார்.'
                    : 'You are responsible for maintaining the confidentiality of your login credentials and ensuring the accuracy of your recorded contributions.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#432C20] mb-1">
                  {isTamil ? '4. அறிவுசார் சொத்துரிமை' : '4. Intellectual Property'}
                </h4>
                <p>
                  {isTamil 
                    ? 'உறவு தளத்தின் வடிவமைப்பு, பாரம்பரிய சின்னங்கள், மற்றும் மென்பொருள் அனைத்தும் பதிப்புரிமை பெற்றவையாகும்.'
                    : 'All proprietary software, heritage designs, logos, and booklet styling belong to Uravuu and are protected by law.'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DDD1BF] bg-[#EDE5D8]/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#432C20] text-[#B68A3D] hover:bg-[#342218] rounded-xl font-bold text-sm transition-colors"
          >
            {isTamil ? 'சரி' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
