import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../constants/api_endpoints.dart';
import '../constants/app_colors.dart';
import '../providers/language_provider.dart';
import 'app_toast.dart';

class WebBookletRedirectDialog extends StatelessWidget {
  const WebBookletRedirectDialog({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const WebBookletRedirectDialog(),
    );
  }

  Future<void> _openWebPortal(BuildContext context) async {
    Navigator.of(context).pop();
    final uri = Uri.parse(ApiEndpoints.webCreateBookletUrl);
    try {
      final launched = await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );
      if (!launched && context.mounted) {
        AppToast.showError(
          context,
          'Please visit: ${ApiEndpoints.webCreateBookletUrl}',
        );
      }
    } catch (_) {
      if (context.mounted) {
        AppToast.showError(
          context,
          'Please visit: ${ApiEndpoints.webCreateBookletUrl}',
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);
    final isTamil = lang.isTamil;

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Icon
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.gold.withValues(alpha: 0.12),
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.gold.withValues(alpha: 0.4),
                  width: 1.5,
                ),
              ),
              child: const Center(
                child: Icon(
                  Icons.menu_book_rounded,
                  size: 36,
                  color: AppColors.primary,
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Title
            Text(
              isTamil ? 'புதிய நோட்டு புத்தகம்' : 'Create New Booklet',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: AppColors.textDark,
                letterSpacing: -0.3,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),

            // Price badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF3C7),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFFBBF24)),
              ),
              child: Text(
                isTamil ? '₹150 • ஒருமுறை கட்டணம்' : '₹150 • One-Time per Booklet',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF92400E),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Explanation
            Text(
              isTamil
                  ? 'புதிய நோட்டு புத்தகங்கள் எங்கள் அதிகாரப்பூர்வ இணையதளத்தில் மட்டுமே உருவாக்க முடியும். அங்கு ₹150 பாதுகாப்பான கட்டணம் மற்றும் ஜிஎஸ்டி வரி விலைப்பட்டியல் வழங்கப்படும்.\n\nஇணையதளத்தில் உருவாக்கியதும், அது உடனடியாக இந்த மொபைல் செயலியில் தோன்றும்!'
                  : 'New booklets are provisioned through our official web portal where secure statutory invoice & payment (₹150) are processed.\n\nOnce created on the website, your booklet will instantly appear here on mobile!',
              style: const TextStyle(
                fontSize: 13.5,
                color: AppColors.textMuted,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),

            // Open Web Portal button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () => _openWebPortal(context),
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
                            ? 'இணையதளத்திற்குச் செல்லவும்'
                            : 'Open Website (www.uravuu.com)',
                        style: const TextStyle(
                          fontSize: 14,
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
            const SizedBox(height: 10),

            // Cancel button
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(
                isTamil ? 'மூடு' : 'Close',
                style: const TextStyle(
                  fontSize: 13.5,
                  color: AppColors.textSubtle,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
