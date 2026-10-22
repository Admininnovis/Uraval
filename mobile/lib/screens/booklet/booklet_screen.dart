import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../models/entry_model.dart';
import '../../models/event_model.dart';
import '../../providers/language_provider.dart';
import '../../widgets/real_paper_page_view.dart';

class BookletScreen extends StatefulWidget {
  final EventModel? event;
  final String title;
  final String subtitle;
  final List<EventEntryModel> entries;
  final num totalAmount;
  final String? personName;
  final String? personVillage;

  const BookletScreen({
    super.key,
    this.event,
    required this.title,
    required this.subtitle,
    required this.entries,
    required this.totalAmount,
    this.personName,
    this.personVillage,
  });

  @override
  State<BookletScreen> createState() => _BookletScreenState();
}

class _BookletScreenState extends State<BookletScreen> {
  late final PageController _pageController;
  int _currentPage = 0;
  static const int _entriesPerPage = 8;

  late final List<List<EventEntryModel>> _pages;
  late final int _totalPages;

  final currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  @override
  void initState() {
    super.initState();
    _pageController = PageController();

    // Chronological order: first entered shown first like a traditional ledger
    final chronological = List<EventEntryModel>.from(widget.entries.reversed);

    _pages = [];
    for (int i = 0; i < chronological.length; i += _entriesPerPage) {
      final end = (i + _entriesPerPage < chronological.length)
          ? i + _entriesPerPage
          : chronological.length;
      _pages.add(chronological.sublist(i, end));
    }
    if (_pages.isEmpty) {
      _pages.add([]);
    }

    // Total pages = Cover (1) + Summary (1) + Inner Pages (_pages.length) + Back Cover (1)
    _totalPages = 2 + _pages.length + 1;
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _nextPage() {
    if (_currentPage < _totalPages - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 380),
        curve: Curves.easeOutCubic,
      );
    }
  }

  void _prevPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 380),
        curve: Curves.easeOutCubic,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFF1E130D),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.goldAccent),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.surfaceLight,
          ),
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          Center(
            child: Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primaryDark,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.gold.withValues(alpha: 0.5)),
                ),
                child: Text(
                  _getPageTitle(lang),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppColors.goldAccent,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Booklet Page Flip Area
            Expanded(
              child: Center(
                child: AspectRatio(
                  aspectRatio: 0.68,
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.45),
                          blurRadius: 20,
                          spreadRadius: 2,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: RealPaperPageView(
                        controller: _pageController,
                        itemCount: _totalPages,
                        onPageChanged: (page) => setState(() => _currentPage = page),
                        itemBuilder: (context, index) {
                          if (index == 0) {
                            return _buildFrontCover(lang);
                          } else if (index == 1) {
                            return _buildSummaryPage(lang);
                          } else if (index == _totalPages - 1) {
                            return _buildBackCover(lang);
                          } else {
                            final innerIdx = index - 2;
                            return _buildLedgerPage(lang, innerIdx, _pages[innerIdx]);
                          }
                        },
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // Bottom Navigation Toolbar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: const BoxDecoration(
                color: Color(0xFF281810),
                border: Border(
                  top: BorderSide(color: Color(0xFF432C20), width: 1.2),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios, size: 20),
                    color: _currentPage > 0
                        ? AppColors.goldAccent
                        : AppColors.textSubtle.withValues(alpha: 0.4),
                    onPressed: _currentPage > 0 ? _prevPage : null,
                  ),
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${lang.t('page')} ${_currentPage + 1} ${lang.t('of')} $_totalPages',
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.goldAccent,
                          ),
                        ),
                        Text(
                          lang.t('swipe_to_turn'),
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.surface.withValues(alpha: 0.7),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.arrow_forward_ios, size: 20),
                    color: _currentPage < _totalPages - 1
                        ? AppColors.goldAccent
                        : AppColors.textSubtle.withValues(alpha: 0.4),
                    onPressed: _currentPage < _totalPages - 1 ? _nextPage : null,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getPageTitle(LanguageProvider lang) {
    if (_currentPage == 0) return lang.t('front_cover');
    if (_currentPage == 1) return lang.t('summary_page');
    if (_currentPage == _totalPages - 1) return lang.t('back_cover');
    return '${lang.t('page')} ${_currentPage - 1}';
  }

  // 1. Front Leather Cover
  Widget _buildFrontCover(LanguageProvider lang) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF3A2218),
      ),
      child: Stack(
        children: [
          // Spine 3D shadow on left edge
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            width: 20,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.black.withValues(alpha: 0.5),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // Double Gold Border
          Positioned.fill(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.gold, width: 2),
                  borderRadius: BorderRadius.circular(10),
                ),
                padding: const EdgeInsets.all(4),
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: AppColors.gold.withValues(alpha: 0.5),
                      width: 1,
                    ),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Seal emblem
                          Container(
                            width: 68,
                            height: 68,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.goldAccent, width: 2),
                              color: AppColors.primaryDark,
                            ),
                            child: ClipOval(
                              child: Image.asset(
                                'assets/images/uravin-logo.png',
                                fit: BoxFit.cover,
                                errorBuilder: (_, _, _) => const Icon(
                                  Icons.menu_book,
                                  color: AppColors.goldAccent,
                                  size: 34,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),

                          Text(
                            lang.t('traditional_records'),
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppColors.goldAccent,
                              letterSpacing: 2.0,
                            ),
                          ),
                          const SizedBox(height: 12),

                          Text(
                            lang.tData(widget.title),
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: AppColors.surfaceLight,
                              height: 1.3,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),

                          if (widget.subtitle.isNotEmpty)
                            Text(
                              lang.tData(widget.subtitle),
                              style: TextStyle(
                                fontSize: 13,
                                color: AppColors.surface.withValues(alpha: 0.85),
                                height: 1.3,
                              ),
                              textAlign: TextAlign.center,
                            ),

                          const SizedBox(height: 24),
                          Container(
                            height: 1.5,
                            width: 60,
                            color: AppColors.goldAccent,
                          ),
                          const SizedBox(height: 24),

                          Text(
                            '${widget.entries.length} ${lang.t('entries_count')} • ${currencyFormat.format(widget.totalAmount)}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.goldAccent,
                            ),
                          ),
                          const SizedBox(height: 16),

                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                '${lang.t('swipe_to_turn')} →',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.surface.withValues(alpha: 0.6),
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // 2. Summary Page (Right Page)
  Widget _buildSummaryPage(LanguageProvider lang) {
    return Container(
      color: const Color(0xFFFFFDF5),
      child: Stack(
        children: [
          // Vertical Red Accounting Margin Line
          Positioned(
            left: 36,
            top: 0,
            bottom: 0,
            width: 1.5,
            child: Container(color: Colors.red.withValues(alpha: 0.35)),
          ),

          // Spine 3D shadow on left edge
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            width: 16,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.black.withValues(alpha: 0.12),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(48, 28, 24, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.auto_stories,
                  size: 40,
                  color: AppColors.gold,
                ),
                const SizedBox(height: 12),

                Text(
                  widget.title,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                    height: 1.3,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),

                Text(
                  widget.subtitle,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textMuted,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                const Divider(color: AppColors.border, height: 1),
                const SizedBox(height: 24),

                // Key metrics
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        children: [
                          Text(
                            lang.t('total_collection'),
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textMuted,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            currencyFormat.format(widget.totalAmount),
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: 1,
                      height: 40,
                      color: AppColors.border,
                    ),
                    Expanded(
                      child: Column(
                        children: [
                          Text(
                            lang.t('entries_count'),
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textMuted,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${widget.entries.length}',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 32),
                const Divider(color: AppColors.border, height: 1),
                const SizedBox(height: 20),

                // Traditional Honor Quotation
                Text(
                  lang.t('quote'),
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontStyle: FontStyle.italic,
                    color: AppColors.textDark,
                    height: 1.45,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),
                Text(
                  '— ${lang.t('accountant')}',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.gold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 3. Inner Ruled Ledger Page
  Widget _buildLedgerPage(
    LanguageProvider lang,
    int pageIndex,
    List<EventEntryModel> pageEntries,
  ) {
    final startIdx = pageIndex * _entriesPerPage;

    return Container(
      color: const Color(0xFFFFFDF5),
      child: Stack(
        children: [
          // Vertical Red Accounting Margin Line
          Positioned(
            left: 36,
            top: 0,
            bottom: 0,
            width: 1.5,
            child: Container(color: Colors.red.withValues(alpha: 0.35)),
          ),

          // Spine 3D shadow on left edge
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            width: 16,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.black.withValues(alpha: 0.12),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Page Header
              Padding(
                padding: const EdgeInsets.fromLTRB(48, 16, 18, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      widget.title,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      '${lang.t('page')} ${pageIndex + 1}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.gold,
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(color: AppColors.primary, height: 1.2, thickness: 1.2),

              // Ruled Rows
              Expanded(
                child: pageEntries.isEmpty
                    ? Center(
                        child: Text(
                          lang.t('no_entries_yet'),
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.textSubtle,
                          ),
                        ),
                      )
                    : ListView.separated(
                        physics: const NeverScrollableScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        itemCount: pageEntries.length,
                        separatorBuilder: (context, index) => Container(
                          height: 1,
                          color: const Color(0xFFE5DDD0),
                        ),
                        itemBuilder: (context, idx) {
                          final entry = pageEntries[idx];
                          final rowNum = startIdx + idx + 1;

                          return SizedBox(
                            height: 48,
                            child: Row(
                              children: [
                                // Left margin index
                                SizedBox(
                                  width: 24,
                                  child: Text(
                                    '$rowNum',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textMuted,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                                const SizedBox(width: 12),

                                // Person Name & Village / Notes
                                Expanded(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        lang.tData(entry.personName),
                                        style: const TextStyle(
                                          fontSize: 13.5,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.textDark,
                                          height: 1.2,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      Row(
                                        children: [
                                          if (entry.personVillage.isNotEmpty)
                                            Flexible(
                                              child: Text(
                                                lang.tData(entry.personVillage),
                                                style: const TextStyle(
                                                  fontSize: 11,
                                                  color: AppColors.textMuted,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                          if (entry.notes != null &&
                                              entry.notes!.isNotEmpty) ...[
                                            const SizedBox(width: 6),
                                            Flexible(
                                              child: Text(
                                                '• ${lang.tData(entry.notes!)}',
                                                style: const TextStyle(
                                                  fontSize: 10.5,
                                                  fontStyle: FontStyle.italic,
                                                  color: AppColors.textSubtle,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ],
                                  ),
                                ),

                                // Amount
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  child: Text(
                                    currencyFormat.format(entry.amount),
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),

              // Page footer ruled line
              Container(
                height: 1.5,
                color: AppColors.gold.withValues(alpha: 0.5),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 18),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Uravuu • Traditional Ledgers',
                      style: TextStyle(
                        fontSize: 10,
                        color: AppColors.textSubtle.withValues(alpha: 0.8),
                      ),
                    ),
                    Text(
                      '${lang.t('page')} ${pageIndex + 1} / ${_pages.length}',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // 4. Back Leather Cover
  Widget _buildBackCover(LanguageProvider lang) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF3A2218),
      ),
      child: Stack(
        children: [
          // Spine 3D shadow on right edge
          Positioned(
            right: 0,
            top: 0,
            bottom: 0,
            width: 20,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.black.withValues(alpha: 0.5),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          Positioned.fill(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.gold, width: 2),
                  borderRadius: BorderRadius.circular(10),
                ),
                padding: const EdgeInsets.all(4),
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: AppColors.gold.withValues(alpha: 0.5),
                      width: 1,
                    ),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.goldAccent,
                                width: 1.5,
                              ),
                              color: AppColors.primaryDark,
                            ),
                            child: const Center(
                              child: Icon(
                                Icons.check_circle_outline,
                                color: AppColors.goldAccent,
                                size: 32,
                              ),
                            ),
                          ),
                          const SizedBox(height: 18),

                          Text(
                            lang.t('end_of_booklet'),
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.goldAccent,
                              letterSpacing: 0.8,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),

                          Text(
                            '${widget.entries.length} ${lang.t('entries_count')} • ${currencyFormat.format(widget.totalAmount)}',
                            style: TextStyle(
                              fontSize: 13,
                              color: AppColors.surface.withValues(alpha: 0.9),
                            ),
                          ),
                          const SizedBox(height: 24),

                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.gold,
                              foregroundColor: AppColors.primaryDark,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 10,
                              ),
                            ),
                            icon: const Icon(Icons.arrow_back, size: 16),
                            label: Text(lang.t('front_cover')),
                            onPressed: () {
                              _pageController.animateToPage(
                                0,
                                duration: const Duration(milliseconds: 500),
                                curve: Curves.easeInOutCubic,
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
