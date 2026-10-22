import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../models/person_model.dart';
import '../../providers/language_provider.dart';
import '../../providers/ledger_provider.dart';
import '../../services/ledger_service.dart';
import '../../widgets/app_toast.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/real_paper_page_view.dart';
import '../../widgets/uravin_loading.dart';
import 'person_detail_screen.dart';

class PersonalLedgerScreen extends StatefulWidget {
  const PersonalLedgerScreen({super.key});

  @override
  State<PersonalLedgerScreen> createState() => _PersonalLedgerScreenState();
}

class _PersonalLedgerScreenState extends State<PersonalLedgerScreen> {
  final TextEditingController _searchController = TextEditingController();
  bool _isBookView = true; // Default to book-like view as requested!

  late final PageController _pageController;
  int _currentBookPage = 0;
  static const int _peoplePerPage = 7;

  final currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<LedgerProvider>(context, listen: false).fetchPeople();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  void _showAddPersonDialog() {
    final nameController = TextEditingController();
    final villageController = TextEditingController();
    final notesController = TextEditingController();
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          final lang = Provider.of<LanguageProvider>(context);

          return AlertDialog(
            backgroundColor: AppColors.background,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: AppColors.border),
            ),
            title: Text(
              lang.t('add_person_btn'),
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CustomTextField(
                  controller: nameController,
                  label: lang.t('person_name'),
                  hint: lang.t('person_name_placeholder'),
                ),
                const SizedBox(height: 12),
                CustomTextField(
                  controller: villageController,
                  label: lang.t('village'),
                  hint: lang.t('village_placeholder'),
                ),
                const SizedBox(height: 12),
                CustomTextField(
                  controller: notesController,
                  label: lang.t('notes'),
                  maxLines: 2,
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text(
                  lang.t('cancel'),
                  style: const TextStyle(color: AppColors.textMuted),
                ),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.goldAccent,
                ),
                onPressed: isSaving
                    ? null
                    : () async {
                        final name = nameController.text.trim();
                        final village = villageController.text.trim();
                        if (name.isEmpty || village.isEmpty) return;

                        setDialogState(() => isSaving = true);
                        final ledger =
                            Provider.of<LedgerProvider>(context, listen: false);
                        try {
                          await LedgerService.createPerson(
                            name: name,
                            village: village,
                            notes: notesController.text.trim(),
                            autoLink: false,
                          );
                          if (ctx.mounted) {
                            Navigator.pop(ctx);
                          }
                          ledger.fetchPeople();
                        } catch (e) {
                          setDialogState(() => isSaving = false);
                          if (ctx.mounted) {
                            AppToast.showError(
                              ctx,
                              e.toString().replaceFirst('Exception: ', ''),
                            );
                          }
                        }
                      },
                child: isSaving
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: UravinLoading(size: 22),
                      )
                    : Text(lang.t('add_person_btn')),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);
    final ledger = Provider.of<LedgerProvider>(context);

    // Extract unique villages
    // Case-insensitive filtering across name, village, and notes
    final query = _searchController.text.trim().toLowerCase();
    final bool isSearching = query.isNotEmpty;
    final filteredPeople = ledger.people.where((p) {
      return query.isEmpty ||
          p.name.toLowerCase().contains(query) ||
          p.village.toLowerCase().contains(query) ||
          (p.notes != null && p.notes!.toLowerCase().contains(query));
    }).toList();

    // Group filtered people into pages of 7 for the booklet view
    final List<List<PersonModel>> bookPages = [];
    for (int i = 0; i < filteredPeople.length; i += _peoplePerPage) {
      final end = (i + _peoplePerPage < filteredPeople.length)
          ? i + _peoplePerPage
          : filteredPeople.length;
      bookPages.add(filteredPeople.sublist(i, end));
    }
    if (bookPages.isEmpty) {
      bookPages.add([]);
    }

    // When searching: jump straight into entries pages (no cover or summary)
    // When not searching: Cover (1) + Summary (1) + Ruled Pages (bookPages.length) + Back Cover (1)
    final totalBookPages =
        isSearching ? bookPages.length : (2 + bookPages.length + 1);

    final totalBalance = filteredPeople.fold<num>(
      0,
      (sum, p) => sum + (p.totalReceived - p.totalReturned),
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        elevation: 0,
        title: Text(
          lang.t('nav_personal'),
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.surfaceLight,
          ),
        ),
        actions: [
          // Toggle between Booklet View and List View
          IconButton(
            icon: Icon(
              _isBookView ? Icons.list_alt : Icons.auto_stories,
              color: AppColors.goldAccent,
            ),
            tooltip: _isBookView ? 'List View' : lang.t('booklet_view'),
            onPressed: () {
              setState(() {
                _isBookView = !_isBookView;
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.person_add_alt, color: AppColors.goldAccent),
            tooltip: lang.t('add_person_btn'),
            onPressed: _showAddPersonDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter Header (Searchable directly inside book view)
          Container(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
            color: AppColors.surface,
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  onChanged: (_) {
                    setState(() {
                      _currentBookPage = 0;
                    });
                    if (_isBookView && _pageController.hasClients) {
                      _pageController.jumpToPage(0);
                    }
                  },
                  decoration: InputDecoration(
                    hintText: '${lang.t('search_ledger')} (Name, Village, Notes)',
                    hintStyle: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSubtle,
                    ),
                    prefixIcon: const Icon(
                      Icons.search,
                      size: 20,
                      color: AppColors.textMuted,
                    ),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              setState(() {
                                _currentBookPage = 0;
                              });
                              if (_isBookView && _pageController.hasClients) {
                                _pageController.jumpToPage(0);
                              }
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: AppColors.surfaceLight,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: AppColors.border),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: AppColors.border),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Main Content: BOOKLET VIEW (Default) or LIST VIEW
          Expanded(
            child: ledger.isLoadingPeople && ledger.people.isEmpty
                ? const Center(
                    child: UravinLoading(size: 80),
                  )
                : _isBookView
                    ? _buildBookletView(
                        lang,
                        filteredPeople,
                        bookPages,
                        totalBookPages,
                        totalBalance,
                        isSearching,
                      )
                    : _buildFlatListView(lang, filteredPeople),
          ),
        ],
      ),
    );
  }

  // BOOKLET VIEW WIDGET
  Widget _buildBookletView(
    LanguageProvider lang,
    List<PersonModel> filteredPeople,
    List<List<PersonModel>> bookPages,
    int totalBookPages,
    num totalBalance,
    bool isSearching,
  ) {
    return Column(
      children: [
        // Booklet Page Container with 3D Book feel
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 8),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.25),
                    blurRadius: 16,
                    spreadRadius: 1,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: RealPaperPageView(
                  controller: _pageController,
                  itemCount: totalBookPages,
                  onPageChanged: (page) {
                    setState(() => _currentBookPage = page);
                  },
                  itemBuilder: (context, index) {
                    if (isSearching) {
                      return _buildRuledPeoplePage(
                        lang,
                        index,
                        bookPages[index],
                        bookPages.length,
                      );
                    }
                    if (index == 0) {
                      return _buildBookFrontCover(
                        lang,
                        filteredPeople.length,
                        totalBalance,
                      );
                    } else if (index == 1) {
                      return _buildBookSummaryPage(
                        lang,
                        filteredPeople,
                        totalBalance,
                      );
                    } else if (index == totalBookPages - 1) {
                      return _buildBookBackCover(
                        lang,
                        filteredPeople.length,
                        totalBalance,
                      );
                    } else {
                      final pageIndex = index - 2;
                      return _buildRuledPeoplePage(
                        lang,
                        pageIndex,
                        bookPages[pageIndex],
                        bookPages.length,
                      );
                    }
                  },
                ),
              ),
            ),
          ),
        ),

        // Bottom Page Flip Navigation Controls
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
          decoration: const BoxDecoration(
            color: AppColors.surface,
            border: Border(
              top: BorderSide(color: AppColors.border, width: 1.2),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back_ios, size: 18),
                color: _currentBookPage > 0
                    ? AppColors.primary
                    : AppColors.textSubtle.withValues(alpha: 0.3),
                onPressed: _currentBookPage > 0
                    ? () {
                        _pageController.previousPage(
                          duration: const Duration(milliseconds: 380),
                          curve: Curves.easeOutCubic,
                        );
                      }
                    : null,
              ),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _getBookPageLabel(lang, totalBookPages, isSearching),
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                    Text(
                      lang.t('swipe_to_turn'),
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 10.5,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.arrow_forward_ios, size: 18),
                color: _currentBookPage < totalBookPages - 1
                    ? AppColors.primary
                    : AppColors.textSubtle.withValues(alpha: 0.3),
                onPressed: _currentBookPage < totalBookPages - 1
                    ? () {
                        _pageController.nextPage(
                          duration: const Duration(milliseconds: 380),
                          curve: Curves.easeOutCubic,
                        );
                      }
                    : null,
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _getBookPageLabel(
    LanguageProvider lang,
    int totalBookPages,
    bool isSearching,
  ) {
    if (isSearching) {
      return '${lang.t('page')} ${_currentBookPage + 1} ${lang.t('of')} $totalBookPages';
    }
    if (_currentBookPage == 0) return lang.t('front_cover');
    if (_currentBookPage == 1) return lang.t('summary_page');
    if (_currentBookPage == totalBookPages - 1) return lang.t('back_cover');
    return '${lang.t('page')} ${_currentBookPage - 1} ${lang.t('of')} ${totalBookPages - 3}';
  }

  // 1. Booklet Front Cover
  Widget _buildBookFrontCover(
    LanguageProvider lang,
    int totalPeople,
    num totalBalance,
  ) {
    return Container(
      color: const Color(0xFF382014),
      child: Stack(
        children: [
          // Left Spine Binding Shadow
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            width: 24,
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFF24140B),
                border: Border(
                  right: BorderSide(
                    color: AppColors.gold.withValues(alpha: 0.4),
                    width: 1.5,
                  ),
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(
                  6,
                  (_) => Container(
                    height: 3,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: AppColors.gold.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Double Gold Border Cover
          Positioned.fill(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(36, 16, 16, 16),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.gold, width: 2),
                  borderRadius: BorderRadius.circular(10),
                ),
                padding: const EdgeInsets.all(4),
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: AppColors.gold.withValues(alpha: 0.45),
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
                          Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.goldAccent,
                                width: 2,
                              ),
                              color: AppColors.primaryDark,
                            ),
                            child: ClipOval(
                              child: Image.asset(
                                'assets/images/uravin-logo.png',
                                fit: BoxFit.cover,
                                errorBuilder: (_, _, _) => const Icon(
                                  Icons.people,
                                  color: AppColors.goldAccent,
                                  size: 32,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),

                          Text(
                            lang.t('traditional_records'),
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppColors.goldAccent,
                              letterSpacing: 2.0,
                            ),
                          ),
                          const SizedBox(height: 10),

                          Text(
                            lang.t('personal_title'),
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: AppColors.surfaceLight,
                              height: 1.3,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 6),

                          Text(
                            lang.t('personal_subtitle'),
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.surface.withValues(alpha: 0.85),
                              height: 1.3,
                            ),
                            textAlign: TextAlign.center,
                          ),

                          const SizedBox(height: 20),
                          Container(height: 1.5, width: 60, color: AppColors.goldAccent),
                          const SizedBox(height: 20),

                          Text(
                            '$totalPeople ${lang.t('total_people')} • ${currencyFormat.format(totalBalance.abs())}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.goldAccent,
                            ),
                          ),
                          const SizedBox(height: 12),

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

  // 2. Booklet Summary Page
  Widget _buildBookSummaryPage(
    LanguageProvider lang,
    List<PersonModel> people,
    num totalBalance,
  ) {
    final totalRec = people.fold<num>(0, (s, p) => s + p.totalReceived);
    final totalRet = people.fold<num>(0, (s, p) => s + p.totalReturned);
    final needToRet = people.where((p) => p.balance > 0).fold<num>(0, (s, p) => s + p.balance);
    final needToRec = people.where((p) => p.balance < 0).fold<num>(0, (s, p) => s + p.balance.abs());

    return Container(
      color: const Color(0xFFFFFDF5),
      child: Stack(
        children: [
          // Red Margin Line
          Positioned(
            left: 36,
            top: 0,
            bottom: 0,
            width: 1.5,
            child: Container(color: Colors.red.withValues(alpha: 0.35)),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(48, 24, 20, 20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.account_balance_wallet_outlined,
                  size: 38,
                  color: AppColors.gold,
                ),
                const SizedBox(height: 10),

                Text(
                  lang.t('personal_title'),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${people.length} ${lang.t('total_people')}',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 18),
                const Divider(color: AppColors.border, height: 1),
                const SizedBox(height: 16),

                // Metrics Grid
                Row(
                  children: [
                    Expanded(
                      child: _SummaryMetric(
                        title: lang.t('total_received'),
                        amount: currencyFormat.format(totalRec),
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _SummaryMetric(
                        title: lang.t('total_returned'),
                        amount: currencyFormat.format(totalRet),
                        color: AppColors.gold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: _SummaryMetric(
                        title: lang.t('need_to_return'),
                        amount: currencyFormat.format(needToRet),
                        color: AppColors.error,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _SummaryMetric(
                        title: lang.t('need_to_receive'),
                        amount: currencyFormat.format(needToRec),
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),
                const Divider(color: AppColors.border, height: 1),
                const SizedBox(height: 16),

                Text(
                  lang.t('quote'),
                  style: const TextStyle(
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                    color: AppColors.textDark,
                    height: 1.45,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 3. Ruled People Page (7 people per page)
  Widget _buildRuledPeoplePage(
    LanguageProvider lang,
    int pageIndex,
    List<PersonModel> pagePeople,
    int totalInnerPages,
  ) {
    final startIdx = pageIndex * _peoplePerPage;

    return Container(
      color: const Color(0xFFFFFDF5),
      child: Stack(
        children: [
          // Red Margin Line
          Positioned(
            left: 36,
            top: 0,
            bottom: 0,
            width: 1.5,
            child: Container(color: Colors.red.withValues(alpha: 0.35)),
          ),

          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(48, 14, 16, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      lang.t('personal_title'),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
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
                child: pagePeople.isEmpty
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
                        itemCount: pagePeople.length,
                        separatorBuilder: (_, _) => Container(
                          height: 1,
                          color: const Color(0xFFE5DDD0),
                        ),
                        itemBuilder: (context, idx) {
                          final person = pagePeople[idx];
                          final rowNum = startIdx + idx + 1;
                          final isReturn = person.balance > 0;
                          final isSettled = person.balance == 0;
                          final badgeColor = isSettled
                              ? AppColors.textSubtle
                              : isReturn
                                  ? AppColors.error
                                  : AppColors.success;

                          return InkWell(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => PersonDetailScreen(
                                    personId: person.id,
                                  ),
                                ),
                              );
                            },
                            child: SizedBox(
                              height: 52,
                              child: Row(
                                children: [
                                  // Row number in margin
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
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          lang.tData(person.name),
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
                                            if (person.village.isNotEmpty)
                                              Flexible(
                                                child: Text(
                                                  lang.tData(person.village),
                                                  style: const TextStyle(
                                                    fontSize: 11,
                                                    color: AppColors.textMuted,
                                                  ),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                            if (person.notes != null &&
                                                person.notes!.isNotEmpty) ...[
                                              const SizedBox(width: 6),
                                              Flexible(
                                                child: Text(
                                                  '• ${lang.tData(person.notes!)}',
                                                  style: const TextStyle(
                                                    fontSize: 10.5,
                                                    fontStyle:
                                                        FontStyle.italic,
                                                    color: AppColors.textSubtle,
                                                  ),
                                                  maxLines: 1,
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),

                                  // Balance and Status
                                  Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment:
                                        CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        currencyFormat
                                            .format(person.balance.abs()),
                                        style: TextStyle(
                                          fontSize: 13.5,
                                          fontWeight: FontWeight.w800,
                                          color: badgeColor,
                                        ),
                                      ),
                                      Text(
                                        isSettled
                                            ? lang.t('settled')
                                            : isReturn
                                                ? lang.t('need_to_return')
                                                : lang.t('need_to_receive'),
                                        style: TextStyle(
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.w600,
                                          color: badgeColor,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(width: 4),
                                  const Icon(
                                    Icons.chevron_right,
                                    size: 16,
                                    color: AppColors.textSubtle,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),

              // Page footer line
              Container(
                height: 1.5,
                color: AppColors.gold.withValues(alpha: 0.5),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(
                  vertical: 6,
                  horizontal: 16,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Uravuu • Personal Directory',
                      style: TextStyle(
                        fontSize: 9.5,
                        color: AppColors.textSubtle.withValues(alpha: 0.8),
                      ),
                    ),
                    Text(
                      '${lang.t('page')} ${pageIndex + 1} / $totalInnerPages',
                      style: const TextStyle(
                        fontSize: 9.5,
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

  // 4. Booklet Back Cover
  Widget _buildBookBackCover(
    LanguageProvider lang,
    int totalPeople,
    num totalBalance,
  ) {
    return Container(
      color: const Color(0xFF382014),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.goldAccent, width: 1.5),
                  color: AppColors.primaryDark,
                ),
                child: const Center(
                  child: Icon(
                    Icons.check_circle_outline,
                    color: AppColors.goldAccent,
                    size: 30,
                  ),
                ),
              ),
              const SizedBox(height: 16),

              Text(
                lang.t('end_of_booklet'),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.goldAccent,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),

              Text(
                '$totalPeople ${lang.t('total_people')} • Net ${currencyFormat.format(totalBalance.abs())}',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.surface.withValues(alpha: 0.9),
                ),
              ),
              const SizedBox(height: 20),

              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: AppColors.primaryDark,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                icon: const Icon(Icons.arrow_back, size: 16),
                label: Text(lang.t('front_cover')),
                onPressed: () {
                  _pageController.animateToPage(
                    0,
                    duration: const Duration(milliseconds: 400),
                    curve: Curves.easeInOut,
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  // FLAT LIST VIEW (Alternative view when toggled)
  Widget _buildFlatListView(
    LanguageProvider lang,
    List<PersonModel> filteredPeople,
  ) {
    if (filteredPeople.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.people_outline,
              size: 48,
              color: AppColors.textSubtle,
            ),
            const SizedBox(height: 12),
            Text(
              lang.t('no_entries_yet'),
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: filteredPeople.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final person = filteredPeople[index];
        final isReturn = person.balance > 0;
        final isSettled = person.balance == 0;
        final badgeColor = isSettled
            ? AppColors.textSubtle
            : isReturn
                ? AppColors.error
                : AppColors.success;

        return InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => PersonDetailScreen(
                  personId: person.id,
                ),
              ),
            );
          },
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.border,
                width: 1.2,
              ),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.surface,
                  child: Text(
                    person.name.isNotEmpty
                        ? person.name[0].toUpperCase()
                        : '?',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        lang.tData(person.name),
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textDark,
                          height: 1.3,
                        ),
                      ),
                      Text(
                        lang.tData(person.village),
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textMuted,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      currencyFormat.format(person.balance.abs()),
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: badgeColor,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: badgeColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        isSettled
                            ? lang.t('settled')
                            : isReturn
                                ? lang.t('need_to_return')
                                : lang.t('need_to_receive'),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: badgeColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 4),
                const Icon(
                  Icons.chevron_right,
                  size: 18,
                  color: AppColors.textSubtle,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _SummaryMetric extends StatelessWidget {
  final String title;
  final String amount;
  final Color color;

  const _SummaryMetric({
    required this.title,
    required this.amount,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textMuted,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Text(
            amount,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: color,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
