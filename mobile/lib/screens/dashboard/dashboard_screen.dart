import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../providers/ledger_provider.dart';
import '../../widgets/event_book_cover.dart';
import '../../widgets/fast_entry_sheet.dart';
import '../../widgets/uravin_loading.dart';
import '../events/create_event_dialog.dart';
import '../events/event_detail_screen.dart';

class DashboardScreen extends StatefulWidget {
  final Function(int) onNavigateTab;

  const DashboardScreen({
    super.key,
    required this.onNavigateTab,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<LedgerProvider>(context, listen: false).fetchDashboard();
      Provider.of<LedgerProvider>(context, listen: false).fetchEvents();
      Provider.of<LedgerProvider>(context, listen: false).fetchPeople();
    });
  }

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);
    final auth = Provider.of<AuthProvider>(context);
    final ledger = Provider.of<LedgerProvider>(context);

    final stats = ledger.dashboardStats;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // Background Vanakkam Hands Template Silhouette in the back
          Positioned(
            bottom: 20,
            right: -40,
            child: Opacity(
              opacity: 0.07,
              child: Image.asset(
                'assets/images/moi-vanakkam-hands.png',
                width: 360,
                errorBuilder: (_, _, _) => const SizedBox(),
              ),
            ),
          ),

          SafeArea(
            child: RefreshIndicator(
              color: AppColors.gold,
              backgroundColor: AppColors.surfaceLight,
              onRefresh: () => ledger.refreshAll(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Welcome & Heritage Header
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primaryDark.withValues(alpha: 0.2),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                        border: Border.all(
                          color: AppColors.gold.withValues(alpha: 0.4),
                          width: 1.2,
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.stars,
                                      size: 14,
                                      color: AppColors.goldAccent,
                                    ),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        lang.t('traditional_records'),
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.goldAccent,
                                          letterSpacing: 1.0,
                                          height: 1.3,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '${lang.t('greeting')}, ${auth.currentUser?.name ?? 'Admin'}',
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.surfaceLight,
                                    height: 1.3,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  lang.t('at_a_glance'),
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppColors.surface.withValues(alpha: 0.85),
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.goldAccent, width: 1.5),
                              color: AppColors.primaryDark,
                            ),
                            child: ClipOval(
                              child: Image.asset(
                                'assets/images/uravin-logo.png',
                                fit: BoxFit.cover,
                                errorBuilder: (_, _, _) => const Icon(
                                  Icons.menu_book,
                                  color: AppColors.goldAccent,
                                  size: 26,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Quick Action Buttons
                    Row(
                      children: [
                        Expanded(
                          child: _QuickActionButton(
                            icon: Icons.add_circle_outline,
                            label: lang.t('new_entry'),
                            color: AppColors.primary,
                            textColor: AppColors.goldAccent,
                            onTap: () {
                              FastEntrySheet.show(context, isReturnMode: false);
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _QuickActionButton(
                            icon: Icons.bookmark_add_outlined,
                            label: lang.t('new_event'),
                            color: AppColors.surface,
                            textColor: AppColors.primary,
                            onTap: () {
                              showDialog(
                                context: context,
                                builder: (_) => const CreateEventDialog(),
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _QuickActionButton(
                            icon: Icons.currency_rupee,
                            label: lang.t('return_money'),
                            color: AppColors.surface,
                            textColor: AppColors.primary,
                            onTap: () {
                              FastEntrySheet.show(context, isReturnMode: true);
                            },
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // Financial Summary Cards
                    Row(
                      children: [
                        Expanded(
                          child: _StatCard(
                            title: lang.t('total_received'),
                            amount: currencyFormat.format(stats?.totalReceived ?? 0),
                            subtitle: '${stats?.totalEvents ?? 0} ${lang.t('total_events')}',
                            icon: Icons.call_received,
                            color: AppColors.primary,
                            onTap: () => widget.onNavigateTab(1),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StatCard(
                            title: lang.t('total_returned'),
                            amount: currencyFormat.format(stats?.totalReturned ?? 0),
                            subtitle: '${stats?.totalPeople ?? 0} ${lang.t('total_people')}',
                            icon: Icons.call_made,
                            color: AppColors.gold,
                            onTap: () => widget.onNavigateTab(2),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(
                          child: _StatCard(
                            title: lang.t('need_to_return'),
                            amount: currencyFormat.format(stats?.needToReturn ?? 0),
                            subtitle: lang.t('pending_returns'),
                            icon: Icons.arrow_outward,
                            color: AppColors.error,
                            onTap: () => widget.onNavigateTab(2),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _StatCard(
                            title: lang.t('need_to_receive'),
                            amount: currencyFormat.format(stats?.needToReceive ?? 0),
                            subtitle: lang.t('pending_collections'),
                            icon: Icons.arrow_downward,
                            color: AppColors.success,
                            onTap: () => widget.onNavigateTab(2),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 22),

                    // Active Event Books Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            lang.t('active_books'),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                              height: 1.3,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        TextButton(
                          onPressed: () => widget.onNavigateTab(1),
                          style: TextButton.styleFrom(
                            padding: EdgeInsets.zero,
                            visualDensity: VisualDensity.compact,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                lang.t('view_all_books'),
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.gold,
                                ),
                              ),
                              const Icon(
                                Icons.chevron_right,
                                size: 16,
                                color: AppColors.gold,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 10),

                    // Active Event Books List
                    if (ledger.isLoadingEvents && ledger.events.isEmpty) ...[
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: UravinLoading(size: 70),
                        ),
                      ),
                    ] else if (ledger.events.isEmpty) ...[
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Center(
                          child: Column(
                            children: [
                              const Icon(
                                Icons.menu_book_outlined,
                                size: 40,
                                color: AppColors.textSubtle,
                              ),
                              const SizedBox(height: 10),
                              Text(
                                lang.t('no_active_books'),
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: AppColors.textMuted,
                                ),
                              ),
                              const SizedBox(height: 12),
                              ElevatedButton(
                                onPressed: () {
                                  showDialog(
                                    context: context,
                                    builder: (_) => const CreateEventDialog(),
                                  );
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: AppColors.goldAccent,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                child: Text(lang.t('open_first_book')),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ] else ...[
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: ledger.events.take(3).length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final event = ledger.events[index];
                          return EventBookCover(
                            event: event,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => EventDetailScreen(eventId: event.id),
                                ),
                              );
                            },
                          );
                        },
                      ),
                    ],

                    const SizedBox(height: 22),

                    // Ledger Insights & Traditional Honor Quote
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(
                                Icons.lightbulb_outline,
                                size: 18,
                                color: AppColors.gold,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  lang.t('ledger_insights'),
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primary,
                                    height: 1.3,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          if (stats?.highestCollectionEvent != null) ...[
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  lang.t('highest_collection'),
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textMuted,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    '${stats!.highestCollectionEvent!.name} (${currencyFormat.format(stats.highestCollectionEvent!.collection)})',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.primary,
                                    ),
                                    textAlign: TextAlign.end,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            const Divider(color: AppColors.border, height: 1),
                            const SizedBox(height: 8),
                          ],
                          Text(
                            lang.t('quote'),
                            style: const TextStyle(
                              fontSize: 12.5,
                              fontStyle: FontStyle.italic,
                              color: AppColors.textDark,
                              height: 1.45,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Align(
                            alignment: Alignment.centerRight,
                            child: Text(
                              '— ${lang.t('accountant')}',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppColors.gold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final Color textColor;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.textColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: color == AppColors.primary
                ? AppColors.gold.withValues(alpha: 0.4)
                : AppColors.border,
            width: 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.primaryDark.withValues(alpha: 0.06),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, size: 20, color: textColor),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: textColor,
                height: 1.3,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String amount;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  const _StatCard({
    required this.title,
    required this.amount,
    required this.subtitle,
    required this.icon,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(14),
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMuted,
                      height: 1.3,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Icon(icon, size: 16, color: color),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              amount,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: color,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSubtle,
                height: 1.3,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
