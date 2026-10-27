import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../providers/language_provider.dart';
import '../../providers/ledger_provider.dart';
import '../../widgets/event_book_cover.dart';
import '../../widgets/uravin_loading.dart';
import '../../widgets/web_booklet_redirect_dialog.dart';
import 'event_detail_screen.dart';

class EventListScreen extends StatefulWidget {
  const EventListScreen({super.key});

  @override
  State<EventListScreen> createState() => _EventListScreenState();
}

class _EventListScreenState extends State<EventListScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<LedgerProvider>(context, listen: false).fetchEvents();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);
    final ledger = Provider.of<LedgerProvider>(context);

    // Filter events locally by search query
    final query = _searchController.text.trim().toLowerCase();
    final filteredEvents = ledger.events.where((e) {
      final matchesQuery = query.isEmpty ||
          e.eventName.toLowerCase().contains(query) ||
          (e.location != null && e.location!.toLowerCase().contains(query));
      return matchesQuery;
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        elevation: 0,
        title: Text(
          lang.t('nav_events'),
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.surfaceLight,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: AppColors.goldAccent),
            tooltip: lang.t('open_book'),
            onPressed: () {
              WebBookletRedirectDialog.show(context);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Header
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            color: AppColors.surface,
            child: TextField(
              controller: _searchController,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                hintText: lang.t('search_ledger'),
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
                          setState(() {});
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
          ),

          // Events List
          Expanded(
            child: RefreshIndicator(
              color: AppColors.gold,
              backgroundColor: AppColors.surfaceLight,
              onRefresh: () => ledger.fetchEvents(),
              child: ledger.isLoadingEvents && ledger.events.isEmpty
                  ? const Center(
                      child: UravinLoading(size: 80),
                    )
                  : filteredEvents.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.menu_book_outlined,
                                size: 48,
                                color: AppColors.textSubtle,
                              ),
                              const SizedBox(height: 12),
                              Text(
                                lang.t('no_active_books'),
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: AppColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: filteredEvents.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final event = filteredEvents[index];
                            return EventBookCover(
                              event: event,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) =>
                                        EventDetailScreen(eventId: event.id),
                                  ),
                                );
                              },
                            );
                          },
                        ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.goldAccent,
        icon: const Icon(Icons.add),
        label: Text(
          lang.t('open_book'),
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        onPressed: () {
          WebBookletRedirectDialog.show(context);
        },
      ),
    );
  }
}
