import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../constants/api_endpoints.dart';
import '../../constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../widgets/app_toast.dart';

class AccessExpiredScreen extends StatefulWidget {
  const AccessExpiredScreen({super.key});

  @override
  State<AccessExpiredScreen> createState() => _AccessExpiredScreenState();
}

class _AccessExpiredScreenState extends State<AccessExpiredScreen> {
  bool _isChecking = false;

  Future<void> _openWebsitePayment() async {
    final uri = Uri.parse(ApiEndpoints.webSubscriptionUrl);
    try {
      final launched = await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );
      if (!launched && mounted) {
        AppToast.showError(
          context,
          'Please visit: ${ApiEndpoints.webSubscriptionUrl}',
        );
      }
    } catch (_) {
      if (mounted) {
        AppToast.showError(
          context,
          'Please open browser and visit: ${ApiEndpoints.webSubscriptionUrl}',
        );
      }
    }
  }

  Future<void> _checkStatus() async {
    setState(() => _isChecking = true);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final lang = Provider.of<LanguageProvider>(context, listen: false);

    await auth.refreshAccountAccess();

    if (mounted) {
      setState(() => _isChecking = false);
      if (!auth.isAccessExpired) {
        AppToast.showSuccess(
          context,
          lang.isTamil
              ? 'பணம் செலுத்துதல் உறுதிசெய்யப்பட்டது! அணுகல் புதுப்பிக்கப்பட்டது.'
              : 'Payment confirmed! Access restored.',
        );
      } else {
        AppToast.showError(
          context,
          lang.isTamil
              ? 'பணம் செலுத்துதல் இன்னும் கண்டறியப்படவில்லை. இணையதளத்தில் பரிவர்த்தனையை முடிக்கவும்.'
              : 'Payment not detected yet. Please complete checkout on the website.',
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final lang = Provider.of<LanguageProvider>(context);
    final isTamil = lang.isTamil;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Glowing Lock Header
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFDE8E8),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.red.withValues(alpha: 0.15),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                    border: Border.all(
                      color: const Color(0xFFF87171),
                      width: 2,
                    ),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.lock_clock_rounded,
                      size: 48,
                      color: Color(0xFFDC2626),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Title
                Text(
                  isTamil
                      ? 'கணக்கு அணுகல் முடிவடைந்தது'
                      : 'Account Access Expired',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textDark,
                    letterSpacing: -0.3,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),

                // Subtitle
                Text(
                  isTamil
                      ? 'உங்கள் 6 மாத இலவச/பராமரிப்பு காலாவதியாகிவிட்டது. தரவுகளைத் தொடர்ந்து அணுக கணக்கு பராமரிப்புக் கட்டணம் செலுத்தவும்.'
                      : 'Your 6-month free trial or maintenance period has expired. Please renew maintenance to continue managing your ledgers.',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textMuted,
                    height: 1.45,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 28),

                // Plan Details Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.gold.withValues(alpha: 0.35),
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isTamil
                                    ? 'கணக்கு பராமரிப்பு'
                                    : 'Account Maintenance',
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.primary,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                isTamil
                                    ? '6 மாத முழு அணுகல்'
                                    : '6 Months Full Access',
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              '₹100',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Divider(height: 1),
                      const SizedBox(height: 14),

                      // Feature points
                      _buildFeatureItem(
                        icon: Icons.check_circle_rounded,
                        text: isTamil
                            ? 'அனைத்து நோட்டு புத்தகங்கள் மற்றும் உள்ளீடுகள்'
                            : 'All your booklets & ledger records',
                      ),
                      const SizedBox(height: 8),
                      _buildFeatureItem(
                        icon: Icons.check_circle_rounded,
                        text: isTamil
                            ? 'பாதுகாப்பான கிளவுட் காப்புப்பிரதி'
                            : 'Secure automated cloud backup',
                      ),
                      const SizedBox(height: 8),
                      _buildFeatureItem(
                        icon: Icons.check_circle_rounded,
                        text: isTamil
                            ? 'அதிகாரப்பூர்வ ஜிஎஸ்டி வரி விலைப்பட்டியல்'
                            : 'Official GST tax invoice receipt',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                // Pay on Website Button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _openWebsitePayment,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.open_in_browser_rounded, size: 20),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            isTamil
                                ? 'இணையதளத்தில் செலுத்தவும் (₹100)'
                                : 'Pay ₹100 on Website',
                            style: const TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w700,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),

                // Check Status Button
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton(
                    onPressed: _isChecking ? null : _checkStatus,
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.gold, width: 1.5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: _isChecking
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.primary,
                            ),
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.refresh_rounded,
                                size: 18,
                                color: AppColors.primary,
                              ),
                              const SizedBox(width: 8),
                              Flexible(
                                child: Text(
                                  isTamil
                                      ? 'செலுத்தியுள்ளேன் • சரிபார்க்கவும்'
                                      : 'I Have Paid • Check Status',
                                  style: const TextStyle(
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.primary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                  ),
                ),
                const SizedBox(height: 20),

                // Logout Button
                TextButton.icon(
                  onPressed: () => auth.logout(),
                  icon: const Icon(
                    Icons.logout_rounded,
                    size: 16,
                    color: AppColors.textSubtle,
                  ),
                  label: Text(
                    isTamil ? 'வெளியேறு' : 'Log Out',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSubtle,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureItem({required IconData icon, required String text}) {
    return Row(
      children: [
        Icon(icon, size: 16, color: const Color(0xFF16A34A)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 12.5,
              color: AppColors.textDark,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
}
