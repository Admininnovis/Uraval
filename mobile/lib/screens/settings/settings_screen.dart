import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../constants/api_endpoints.dart';
import '../../constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../widgets/app_toast.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/legal_dialogs.dart';
import '../../widgets/uravin_loading.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        elevation: 0,
        title: Text(
          lang.t('nav_settings'),
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.surfaceLight,
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // User Profile Section
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.surfaceLight,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border, width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primaryDark.withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: AppColors.primary,
                    child: Text(
                      auth.currentUser?.name.isNotEmpty == true
                          ? auth.currentUser!.name[0].toUpperCase()
                          : 'U',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppColors.goldAccent,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          auth.currentUser?.name ?? 'Admin',
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textDark,
                            height: 1.3,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          auth.currentUser?.email ?? '',
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Subscription & Maintenance Section
            _SectionContainer(
              title: lang.isTamil ? 'கணக்கு பராமரிப்பு' : 'Account Maintenance',
              subtitle: lang.isTamil
                  ? 'பராமரிப்பு மற்றும் விலைப்பட்டியல்'
                  : 'Subscription status & statutory receipts',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            auth.isAccessExpired
                                ? Icons.warning_amber_rounded
                                : Icons.verified_user_rounded,
                            size: 20,
                            color: auth.isAccessExpired
                                ? AppColors.error
                                : const Color(0xFF16A34A),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            auth.isAccessExpired
                                ? (lang.isTamil ? 'காலாவதியானது' : 'Access Expired')
                                : (lang.isTamil ? 'செயலில் உள்ளது' : 'Active Account'),
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: auth.isAccessExpired
                                  ? AppColors.error
                                  : const Color(0xFF16A34A),
                            ),
                          ),
                        ],
                      ),
                      if (auth.accountAccess?['daysRemaining'] != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Text(
                            lang.isTamil
                                ? '${auth.accountAccess!['daysRemaining']} நாட்கள் உள்ளன'
                                : '${auth.accountAccess!['daysRemaining']} days left',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: () async {
                      final uri = Uri.parse(ApiEndpoints.webSubscriptionUrl);
                      try {
                        await launchUrl(
                          uri,
                          mode: LaunchMode.externalApplication,
                        );
                      } catch (_) {
                        if (context.mounted) {
                          AppToast.showError(
                            context,
                            'Please visit: ${ApiEndpoints.webSubscriptionUrl}',
                          );
                        }
                      }
                    },
                    icon: const Icon(Icons.open_in_browser_rounded, size: 16),
                    label: Text(
                      lang.isTamil
                          ? 'இணையதளத்தில் புதுப்பிக்கவும் / நிர்வகிக்கவும்'
                          : 'Manage & Renew on Website',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.gold),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Language Selection
            _SectionContainer(
              title: lang.t('language_preference'),
              subtitle: lang.t('choose_language_desc'),
              child: Row(
                children: [
                  Expanded(
                    child: _LanguageOptionCard(
                      title: 'English',
                      subtitle: 'Default',
                      isSelected: !lang.isTamil,
                      onTap: () => lang.setLanguage('en'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _LanguageOptionCard(
                      title: 'தமிழ்',
                      subtitle: 'Tamil',
                      isSelected: lang.isTamil,
                      onTap: () => lang.setLanguage('ta'),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // About Uravuu
            _SectionContainer(
              title: lang.t('about_uravuu'),
              subtitle: 'v1.0.0 • Digital Heritage',
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Image.asset(
                        'assets/images/uravin-logo.png',
                        width: 28,
                        height: 28,
                        errorBuilder: (context, error, stackTrace) => const Icon(
                          Icons.menu_book,
                          color: AppColors.gold,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          'Uravuu (உறவு) — Traditional Moi Ledgers & Honor Books',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Legal & Privacy (Privacy Policy & Terms and Conditions)
            _SectionContainer(
              title: lang.t('legal_privacy'),
              subtitle: 'Data protection & service agreements',
              child: Column(
                children: [
                  _LegalTile(
                    icon: Icons.security_outlined,
                    title: lang.t('privacy_policy'),
                    subtitle: lang.t('privacy_policy_desc'),
                    onTap: () => LegalDialogs.showPrivacyPolicy(context),
                  ),
                  const Divider(color: AppColors.border, height: 16),
                  _LegalTile(
                    icon: Icons.gavel_outlined,
                    title: lang.t('terms_conditions'),
                    subtitle: lang.t('terms_conditions_desc'),
                    onTap: () => LegalDialogs.showTermsAndConditions(context),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Sign Out Button
            CustomButton(
              text: lang.t('logout'),
              icon: Icons.logout,
              isSecondary: true,
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    backgroundColor: AppColors.background,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: const BorderSide(color: AppColors.border),
                    ),
                    title: Text(
                      lang.t('logout'),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                    content: Text(
                      lang.t('logout_confirm'),
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textDark,
                      ),
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        child: Text(lang.t('cancel')),
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: () => Navigator.pop(ctx, true),
                        child: Text(lang.t('logout')),
                      ),
                    ],
                  ),
                );

                if (confirm == true) {
                  await auth.logout();
                }
              },
            ),

            const SizedBox(height: 16),

            // Delete Account Danger Action
            OutlinedButton.icon(
              icon: const Icon(
                Icons.delete_forever_outlined,
                size: 20,
                color: AppColors.error,
              ),
              label: Text(
                lang.t('delete_account'),
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.error,
                ),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.error, width: 1.2),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                backgroundColor: AppColors.error.withValues(alpha: 0.05),
              ),
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    backgroundColor: AppColors.background,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: const BorderSide(color: AppColors.error),
                    ),
                    title: Row(
                      children: [
                        const Icon(
                          Icons.warning_amber_rounded,
                          color: AppColors.error,
                          size: 24,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            lang.t('delete_account'),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppColors.error,
                            ),
                          ),
                        ),
                      ],
                    ),
                    content: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          lang.t('delete_account_confirm'),
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textDark,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          lang.t('delete_account_warning'),
                          style: const TextStyle(
                            fontSize: 12.5,
                            color: AppColors.textMuted,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, false),
                        child: Text(lang.t('cancel')),
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.error,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: () => Navigator.pop(ctx, true),
                        child: Text(lang.t('delete_account')),
                      ),
                    ],
                  ),
                );

                if (confirm == true && context.mounted) {
                  // Show loading indicator dialog
                  showDialog(
                    context: context,
                    barrierDismissible: false,
                    builder: (ctx) => PopScope(
                      canPop: false,
                      child: AlertDialog(
                        backgroundColor: AppColors.background,
                        content: Row(
                          children: [
                            const UravinLoading(size: 32),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Text(
                                lang.t('deleting_account'),
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: AppColors.textDark,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );

                  final success = await auth.deleteAccount();
                  if (context.mounted) {
                    Navigator.of(context, rootNavigator: true).pop();
                    if (!success && auth.errorMessage != null) {
                      AppToast.showError(context, auth.errorMessage!);
                    }
                  }
                }
              },
            ),

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _SectionContainer extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget child;

  const _SectionContainer({
    required this.title,
    required this.subtitle,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryDark.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.primary,
              height: 1.3,
            ),
          ),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textMuted,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _LanguageOptionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onTap;

  const _LanguageOptionCard({
    required this.title,
    required this.subtitle,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? AppColors.gold : AppColors.border,
            width: isSelected ? 1.6 : 1.0,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color:
                        isSelected ? AppColors.goldAccent : AppColors.textDark,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 11,
                    color: isSelected
                        ? AppColors.surface.withValues(alpha: 0.8)
                        : AppColors.textMuted,
                  ),
                ),
              ],
            ),
            if (isSelected)
              const Icon(
                Icons.check_circle,
                size: 18,
                color: AppColors.goldAccent,
              ),
          ],
        ),
      ),
    );
  }
}

class _LegalTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _LegalTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 20, color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textDark,
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 11.5,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right,
              size: 20,
              color: AppColors.textSubtle,
            ),
          ],
        ),
      ),
    );
  }
}
