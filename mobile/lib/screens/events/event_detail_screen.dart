import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../models/entry_model.dart';
import '../../models/event_model.dart';
import '../../providers/language_provider.dart';
import '../../providers/ledger_provider.dart';
import '../../services/ledger_service.dart';
import '../../widgets/app_toast.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/fast_entry_sheet.dart';
import '../../widgets/uravin_loading.dart';
import '../booklet/booklet_screen.dart';

class EventDetailScreen extends StatefulWidget {
  final String eventId;

  const EventDetailScreen({super.key, required this.eventId});

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  bool _isLoading = true;
  EventModel? _event;
  List<EventEntryModel> _entries = [];
  Map<String, dynamic> _stats = {};
  String _searchQuery = '';

  final currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  @override
  void initState() {
    super.initState();
    _fetchDetail();
  }

  Future<void> _fetchDetail() async {
    setState(() => _isLoading = true);
    try {
      final res = await LedgerService.getEventById(widget.eventId);
      if (mounted) {
        setState(() {
          _event = res['event'] as EventModel;
          _entries = res['entries'] as List<EventEntryModel>;
          _stats = res['stats'] as Map<String, dynamic>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        AppToast.showError(context, e.toString().replaceFirst('Exception: ', ''));
      }
    }
  }

  void _showEditEntryDialog(EventEntryModel entry) {
    final nameController = TextEditingController(text: entry.personName);
    final villageController = TextEditingController(text: entry.personVillage);
    final amountController =
        TextEditingController(text: entry.amount.toString());
    final notesController = TextEditingController(text: entry.notes ?? '');
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
              '${lang.t('edit_entry')} - ${entry.personName}',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CustomTextField(
                    controller: nameController,
                    label: lang.t('person_name'),
                  ),
                  const SizedBox(height: 12),
                  CustomTextField(
                    controller: villageController,
                    label: lang.t('village'),
                  ),
                  const SizedBox(height: 12),
                  CustomTextField(
                    controller: amountController,
                    label: lang.t('amount'),
                    keyboardType: TextInputType.number,
                    prefixIcon: const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        '₹',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  CustomTextField(
                    controller: notesController,
                    label: lang.t('notes'),
                    maxLines: 2,
                  ),
                ],
              ),
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
                        final newName = nameController.text.trim().toUpperCase();
                        final newVillage =
                            villageController.text.trim().toUpperCase();
                        final newNotes = notesController.text.trim();
                        final newAmount =
                            num.tryParse(amountController.text.trim()) ?? 0;

                        if (newName.isEmpty) {
                          AppToast.showError(ctx, lang.t('name_required'));
                          return;
                        }
                        if (newVillage.isEmpty) {
                          AppToast.showError(ctx, lang.t('village_required'));
                          return;
                        }
                        if (newAmount <= 0) {
                          AppToast.showError(ctx, lang.t('amount_required'));
                          return;
                        }

                        setDialogState(() => isSaving = true);
                        final ledger =
                            Provider.of<LedgerProvider>(context, listen: false);
                        try {
                          // Update person details if name/village/note changed
                          if (entry.personId.isNotEmpty &&
                              (newName != entry.personName.trim().toUpperCase() ||
                                  newVillage !=
                                      entry.personVillage.trim().toUpperCase() ||
                                  newNotes !=
                                      (entry.personNotes ?? '').trim())) {
                            await LedgerService.updatePerson(
                              id: entry.personId,
                              name: newName,
                              village: newVillage,
                              notes: newNotes,
                            );
                          }

                          await LedgerService.updateEventEntry(
                            eventId: widget.eventId,
                            entryId: entry.id,
                            amount: newAmount,
                            notes: newNotes,
                          );
                          if (ctx.mounted) {
                            Navigator.pop(ctx);
                          }
                          _fetchDetail();
                          ledger.refreshAll();
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
                    : Text(lang.t('save')),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _handleDeleteEvent() async {
    final lang = Provider.of<LanguageProvider>(context, listen: false);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.background,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.border),
        ),
        title: Text(
          lang.t('delete_event_confirm'),
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.error,
          ),
        ),
        content: Text(
          'Are you sure you want to delete this event ledger and all its entries?',
          style: const TextStyle(fontSize: 13, color: AppColors.textDark),
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
            child: Text(lang.t('delete')),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      if (!mounted) return;
      final ledger = Provider.of<LedgerProvider>(context, listen: false);
      try {
        await LedgerService.deleteEvent(widget.eventId);
        ledger.refreshAll();
        if (mounted) {
          AppToast.showSuccess(context, 'Event deleted successfully');
          Navigator.pop(context);
        }
      } catch (e) {
        if (mounted) {
          AppToast.showError(
            context,
            e.toString().replaceFirst('Exception: ', ''),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);

    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          elevation: 0,
        ),
        body: const Center(
          child: UravinLoading(size: 80),
        ),
      );
    }

    if (_event == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.primary,
        ),
        body: Center(
          child: Text(lang.t('event_not_found')),
        ),
      );
    }

    final filteredEntries = _entries.where((e) {
      final q = _searchQuery.toLowerCase();
      return q.isEmpty ||
          e.personName.toLowerCase().contains(q) ||
          e.personVillage.toLowerCase().contains(q) ||
          (e.notes != null && e.notes!.toLowerCase().contains(q));
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: AppColors.surfaceLight, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          lang.tData(_event!.eventName),
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: AppColors.surfaceLight,
          ),
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.auto_stories, color: AppColors.goldAccent),
            tooltip: lang.t('booklet_view'),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => BookletScreen(
                    event: _event,
                    title: lang.tData(_event!.eventName),
                    subtitle:
                        '${lang.tData(_event!.eventType)} • ${DateFormat('dd MMM yyyy').format(_event!.eventDate)}',
                    entries: _entries,
                    totalAmount: _stats['totalCollection'] ?? 0,
                  ),
                ),
              );
            },
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: AppColors.surfaceLight),
            onSelected: (val) {
              if (val == 'delete') _handleDeleteEvent();
            },
            itemBuilder: (ctx) => [
              PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    const Icon(Icons.delete_outline, color: AppColors.error, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      lang.t('delete'),
                      style: const TextStyle(color: AppColors.error),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Event Leather Info Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: const Border(
                bottom: BorderSide(color: AppColors.border, width: 1.2),
              ),
            ),
            child: Column(
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        lang.tData(_event!.eventType).toUpperCase(),
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppColors.goldAccent,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Row(
                        children: [
                          const Icon(
                            Icons.calendar_today,
                            size: 13,
                            color: AppColors.textMuted,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            DateFormat('dd MMM yyyy').format(_event!.eventDate),
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textMuted,
                            ),
                          ),
                          if (_event!.location != null &&
                              _event!.location!.isNotEmpty) ...[
                            const SizedBox(width: 10),
                            const Icon(
                              Icons.location_on_outlined,
                              size: 13,
                              color: AppColors.textMuted,
                            ),
                            const SizedBox(width: 2),
                            Expanded(
                              child: Text(
                                lang.tData(_event!.location!),
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textMuted,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Stat metrics row
                Row(
                  children: [
                    Expanded(
                      child: _MetricBadge(
                        label: lang.t('total_collection'),
                        value: currencyFormat.format(_stats['totalCollection'] ?? 0),
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _MetricBadge(
                        label: lang.t('entries_count'),
                        value: '${_stats['totalEntries'] ?? 0}',
                        color: AppColors.gold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _MetricBadge(
                        label: lang.t('highest_contribution'),
                        value: currencyFormat.format(_stats['highestContribution'] ?? 0),
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Booklet View Button Banner
                InkWell(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => BookletScreen(
                          event: _event,
                          title: lang.tData(_event!.eventName),
                          subtitle:
                              '${lang.tData(_event!.eventType)} • ${DateFormat('dd MMM yyyy').format(_event!.eventDate)}',
                          entries: _entries,
                          totalAmount: _stats['totalCollection'] ?? 0,
                        ),
                      ),
                    );
                  },
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 9,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: AppColors.gold.withValues(alpha: 0.5),
                        width: 1.2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primaryDark.withValues(alpha: 0.1),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.auto_stories,
                          size: 18,
                          color: AppColors.goldAccent,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          lang.t('open_booklet'),
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.goldAccent,
                            letterSpacing: 0.3,
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Icon(
                          Icons.arrow_forward_ios,
                          size: 12,
                          color: AppColors.goldAccent,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Search Bar inside Book
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
            child: TextField(
              onChanged: (val) => setState(() => _searchQuery = val),
              decoration: InputDecoration(
                hintText: lang.t('search_entries_placeholder'),
                hintStyle: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSubtle,
                ),
                prefixIcon: const Icon(
                  Icons.search,
                  size: 18,
                  color: AppColors.textMuted,
                ),
                filled: true,
                fillColor: AppColors.surfaceLight,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
              ),
            ),
          ),

          // Lined Ledger Notebook Pages
          Expanded(
            child: filteredEntries.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.draw_outlined,
                          size: 40,
                          color: AppColors.textSubtle,
                        ),
                        const SizedBox(height: 10),
                        Text(
                          lang.t('no_entries_yet'),
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    itemCount: filteredEntries.length,
                    separatorBuilder: (context, index) => const Divider(
                      height: 1,
                      color: AppColors.border,
                    ),
                    itemBuilder: (context, index) {
                      final entry = filteredEntries[index];
                      final rowNumber = filteredEntries.length - index;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFFDF7),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: AppColors.border,
                            width: 1.2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 5,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(9),
                          child: Stack(
                            children: [
                              // Left Leather Spine with stitches
                              Positioned(
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: 8,
                                child: Container(
                                  decoration: const BoxDecoration(
                                    color: Color(0xFF382014),
                                  ),
                                ),
                              ),

                              // Vertical Red Margin Line
                              Positioned(
                                left: 42,
                                top: 0,
                                bottom: 0,
                                width: 1.5,
                                child: Container(
                                  color: Colors.red.withValues(alpha: 0.3),
                                ),
                              ),

                              Padding(
                                padding: const EdgeInsets.fromLTRB(14, 10, 8, 10),
                                child: Row(
                                  children: [
                                    // Row number in margin
                                    SizedBox(
                                      width: 24,
                                      child: Text(
                                        '$rowNumber',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.textMuted,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                    ),
                                    const SizedBox(width: 14),

                                    // Person details
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            lang.tData(entry.personName),
                                            style: const TextStyle(
                                              fontSize: 14.5,
                                              fontWeight: FontWeight.w700,
                                              color: AppColors.textDark,
                                              height: 1.25,
                                            ),
                                          ),
                                          const SizedBox(height: 3),
                                          Row(
                                            children: [
                                              if (entry.personVillage.isNotEmpty) ...[
                                                const Icon(
                                                  Icons.location_on_outlined,
                                                  size: 13,
                                                  color: AppColors.textMuted,
                                                ),
                                                const SizedBox(width: 2),
                                                Flexible(
                                                  child: Text(
                                                    lang.tData(entry.personVillage),
                                                    style: const TextStyle(
                                                      fontSize: 11.5,
                                                      color: AppColors.textMuted,
                                                    ),
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ),
                                                if (entry.notes != null &&
                                                    entry.notes!.isNotEmpty)
                                                  const SizedBox(width: 6),
                                              ],
                                              if (entry.notes != null &&
                                                  entry.notes!.isNotEmpty)
                                                Flexible(
                                                  child: Container(
                                                    padding: const EdgeInsets.symmetric(
                                                      horizontal: 6,
                                                      vertical: 1,
                                                    ),
                                                    decoration: BoxDecoration(
                                                      color: AppColors.surface,
                                                      borderRadius: BorderRadius.circular(4),
                                                    ),
                                                    child: Text(
                                                      lang.tData(entry.notes!),
                                                      style: const TextStyle(
                                                        fontSize: 10.5,
                                                        fontStyle: FontStyle.italic,
                                                        color: AppColors.textDark,
                                                      ),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),

                                    // Amount badge
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 10,
                                        vertical: 5,
                                      ),
                                      decoration: BoxDecoration(
                                        color: AppColors.surface,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                          color: AppColors.gold.withValues(alpha: 0.6),
                                          width: 1.2,
                                        ),
                                      ),
                                      child: Text(
                                        currencyFormat.format(entry.amount),
                                        style: const TextStyle(
                                          fontSize: 14.5,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    ),

                                    // Edit entry
                                    IconButton(
                                      icon: const Icon(
                                        Icons.edit_outlined,
                                        size: 18,
                                        color: AppColors.textMuted,
                                      ),
                                      onPressed: () => _showEditEntryDialog(entry),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.goldAccent,
        icon: const Icon(Icons.add),
        label: Text(
          lang.t('new_entry'),
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        onPressed: () async {
          final added = await FastEntrySheet.show(
            context,
            initialEventId: widget.eventId,
            isReturnMode: false,
          );
          if (added == true) {
            _fetchDetail();
          }
        },
      ),
    );
  }
}

class _MetricBadge extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _MetricBadge({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              color: AppColors.textMuted,
              height: 1.3,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
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
