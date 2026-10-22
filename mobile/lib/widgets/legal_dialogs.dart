import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../providers/language_provider.dart';

/// Modal dialogs for Privacy Policy and Terms & Conditions.
class LegalDialogs {
  static void showPrivacyPolicy(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context, listen: false);
    final isTamil = lang.isTamil;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceLight,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: AppColors.border, width: 1.2),
        ),
        titlePadding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        actionsPadding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.security_outlined,
                color: AppColors.primary,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isTamil ? 'தனியுரிமைக் கொள்கை' : 'Privacy Policy',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                  Text(
                    isTamil ? 'கடைசியாக புதுப்பிக்கப்பட்டது: 2026' : 'Last updated: 2026',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSection(
                  title: isTamil ? '1. தகவல் சேகரிப்பு' : '1. Information We Collect',
                  body: isTamil
                      ? 'உறவின் செயலியில் உங்கள் பெயர், மின்னஞ்சல் முகவரி, நிகழ்வு விவரங்கள் (திருமணம், காதணி விழா, புதுமனை புகுவிழா போன்றவை), மற்றும் மொய் வரவு/செலவு பதிவுகள் மட்டுமே சேமிக்கப்படுகின்றன.'
                      : 'Uravin collects your name, email address, event details (weddings, family ceremonies), and financial ledger entries for recording Moi and personal gifts.',
                ),
                _buildSection(
                  title: isTamil ? '2. தரவு பாதுகாப்பு' : '2. Data Confidentiality & Security',
                  body: isTamil
                      ? 'உங்கள் மொய் மற்றும் தனிப்பட்ட கணக்கு விபரங்கள் முற்றிலும் ரகசியமானவை. நவீன பாதுகாப்பு முறைகள் மூலம் உங்கள் தரவுகள் பாதுகாக்கப்படுகின்றன.'
                      : 'Your traditional ledger entries and financial numbers are strictly private to your account. We employ secure standards to protect your data.',
                ),
                _buildSection(
                  title: isTamil ? '3. மூன்றாம் தரப்பினருடன் பகிர்வதில்லை' : '3. No Third-Party Sharing',
                  body: isTamil
                      ? 'உங்கள் குடும்ப அல்லது வரவு-செலவு தகவல்கள் விளம்பரதாரர்களுக்கோ அல்லது பிற மூன்றாம் நபர்களுக்கோ ஒருபோதும் பகிரப்படவோ விற்கப்படவோ மாட்டாது.'
                      : 'We never sell, rent, or trade your personal ledger data with advertisers or third parties.',
                ),
                _buildSection(
                  title: isTamil ? '4. பயனர் கட்டுப்பாடு & உரிமை' : '4. User Ownership & Control',
                  body: isTamil
                      ? 'உங்கள் கணக்கிலுள்ள அனைத்து பதிவுகளுக்கும் நீங்களே முழு உரிமையாளர். எப்போது வேண்டுமானாலும் உங்கள் பதிவுகளை திருத்தவோ அல்லது நீக்கவோ முடியும்.'
                      : 'You retain 100% ownership of your recorded data. You can edit, export, or delete your ledger entries at any time.',
                ),
              ],
            ),
          ),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.goldAccent,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            onPressed: () => Navigator.pop(ctx),
            child: Text(isTamil ? 'சரி' : 'Close'),
          ),
        ],
      ),
    );
  }

  static void showTermsAndConditions(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context, listen: false);
    final isTamil = lang.isTamil;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceLight,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: AppColors.border, width: 1.2),
        ),
        titlePadding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        actionsPadding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.gavel_outlined,
                color: AppColors.primary,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isTamil ? 'விதிமுறைகள் மற்றும் நிபந்தனைகள்' : 'Terms & Conditions',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                  Text(
                    isTamil ? 'உறவின் பயன்பாட்டு விதிமுறைகள்' : 'Terms of Service',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSection(
                  title: isTamil ? '1. விதிமுறைகளை ஏற்றுக்கொள்ளுதல்' : '1. Acceptance of Terms',
                  body: isTamil
                      ? 'உறவின் செயலியில் கணக்கு தொடங்குவதன் மூலம் அல்லது சேவைகளைப் பயன்படுத்துவதன் மூலம் இந்த பயன்பாட்டு விதிமுறைகளை நீங்கள் ஏற்றுக்கொள்கிறீர்கள்.'
                      : 'By creating an account or using Uravin, you agree to comply with and be bound by these Terms and Conditions.',
                ),
                _buildSection(
                  title: isTamil ? '2. சேவையின் நோக்கம்' : '2. Purpose of Service',
                  body: isTamil
                      ? 'உறவின் செயலி பாரம்பரிய மொய் கணக்குகள், குடும்ப சுபநிகழ்ச்சிகள் மற்றும் தனிநபர் வரவு-செலவு கணக்குகளை டிஜிட்டல் முறையில் பாதுகாப்பாக பராமரிப்பதற்காக வடிவமைக்கப்பட்டுள்ளது.'
                      : 'Uravin is designed to facilitate digital management of traditional Moi ceremony contributions, gift accounting, and family records.',
                ),
                _buildSection(
                  title: isTamil ? '3. கணக்கின் பாதுகாப்பு' : '3. Account Responsibility',
                  body: isTamil
                      ? 'உங்கள் கடவுச்சொல் மற்றும் கணக்கு தகவல்களை பாதுகாப்பாக வைத்துக்கொள்வது உங்கள் பொறுப்பாகும். பதிவிடும் தொகைகள் மற்றும் விபரங்களின் துல்லியத்திற்கு பயனரே பொறுப்பாவார்.'
                      : 'You are responsible for maintaining the confidentiality of your login credentials and ensuring the accuracy of your recorded contributions.',
                ),
                _buildSection(
                  title: isTamil ? '4. அறிவுசார் சொத்துரிமை' : '4. Intellectual Property',
                  body: isTamil
                      ? 'உறவின் செயலியின் வடிவமைப்பு, பாரம்பரிய சின்னங்கள், மற்றும் மென்பொருள் அனைத்தும் பதிப்புரிமை பெற்றவையாகும்.'
                      : 'All proprietary software, heritage designs, logos, and booklet styling belong to Uravin and are protected by law.',
                ),
              ],
            ),
          ),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.goldAccent,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            onPressed: () => Navigator.pop(ctx),
            child: Text(isTamil ? 'சரி' : 'Close'),
          ),
        ],
      ),
    );
  }

  static Widget _buildSection({required String title, required String body}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w700,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            body,
            style: const TextStyle(
              fontSize: 12.5,
              color: AppColors.textDark,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}
