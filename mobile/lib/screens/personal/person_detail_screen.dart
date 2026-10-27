import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../models/entry_model.dart';
import '../../models/person_model.dart';
import '../../providers/language_provider.dart';
import '../../providers/ledger_provider.dart';
import '../../services/ledger_service.dart';
import '../../widgets/app_toast.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/fast_entry_sheet.dart';
import '../../widgets/uravin_loading.dart';
import '../booklet/booklet_screen.dart';

class PersonDetailScreen extends StatefulWidget {
  final String personId;

  const PersonDetailScreen({super.key, required this.personId});

  @override
  State<PersonDetailScreen> createState() => _PersonDetailScreenState();
}

class _PersonDetailScreenState extends State<PersonDetailScreen> {
  bool _isLoading = true;
  PersonModel? _person;
  List<EventEntryModel> _eventEntries = [];
  List<PersonalLedgerEntryModel> _personalLedgers = [];

  final currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  @override
  void initState() {
    super.initState();
    _fetchPerson();
  }

  Future<void> _fetchPerson() async {
    setState(() => _isLoading = true);
    try {
      final res = await LedgerService.getPersonById(widget.personId);
      if (mounted) {
        setState(() {
          _person = res['person'] as PersonModel;
          _eventEntries = res['eventEntries'] as List<EventEntryModel>;
          _personalLedgers = res['personalLedgers'] as List<PersonalLedgerEntryModel>;
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

  void _showEditPersonDialog() {
    final nameController = TextEditingController(text: _person?.name ?? '');
    final villageController =
        TextEditingController(text: _person?.village ?? '');
    final notesController = TextEditingController(text: _person?.notes ?? '');
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
              lang.t('edit_person'),
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
                ),
                const SizedBox(height: 12),
                CustomTextField(
                  controller: villageController,
                  label: lang.t('village'),
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
                        final name = nameController.text.trim().toUpperCase();
                        final village =
                            villageController.text.trim().toUpperCase();
                        if (name.isEmpty || village.isEmpty) return;

                        setDialogState(() => isSaving = true);
                        final ledger =
                            Provider.of<LedgerProvider>(context, listen: false);
                        try {
                          await LedgerService.updatePerson(
                            id: widget.personId,
                            name: name,
                            village: village,
                            notes: notesController.text.trim(),
                          );
                          if (ctx.mounted) {
                            Navigator.pop(ctx);
                          }
                          _fetchPerson();
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
                    : Text(lang.t('save')),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showEditPersonalLedgerDialog(PersonalLedgerEntryModel entry) {
    final eventNameController = TextEditingController(text: entry.eventName);
    final amountController =
        TextEditingController(text: entry.amount.toString());
    final notesController = TextEditingController(text: entry.notes ?? '');
    DateTime editDate = entry.date;
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
              lang.t('edit_entry'),
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
                    controller: eventNameController,
                    label: lang.t('event_name'),
                    hint: lang.t('event_name_placeholder'),
                  ),
                  const SizedBox(height: 12),
                  // Date Picker Tile
                  InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: editDate,
                        firstDate: DateTime(2000),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (picked != null) {
                        setDialogState(() => editDate = picked);
                      }
                    },
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: AppColors.border,
                          width: 1.2,
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.calendar_today,
                            size: 18,
                            color: AppColors.primary,
                          ),
                          const SizedBox(width: 10),
                          Text(
                            '${lang.t('date')}: ${DateFormat('dd MMM yyyy').format(editDate)}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textDark,
                            ),
                          ),
                          const Spacer(),
                          const Icon(
                            Icons.arrow_drop_down,
                            color: AppColors.textSubtle,
                          ),
                        ],
                      ),
                    ),
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
                        final newEventName = eventNameController.text.trim();
                        final newAmount =
                            num.tryParse(amountController.text.trim()) ?? 0;
                        if (newAmount <= 0) {
                          AppToast.showError(ctx, lang.t('amount_required'));
                          return;
                        }

                        setDialogState(() => isSaving = true);
                        final ledger =
                            Provider.of<LedgerProvider>(context, listen: false);
                        try {
                          await LedgerService.updateLedgerEntry(
                            id: entry.id,
                            eventName: newEventName.isEmpty
                                ? 'Return Money'
                                : newEventName,
                            amount: newAmount,
                            date: editDate,
                            notes: notesController.text.trim(),
                          );
                          if (ctx.mounted) {
                            Navigator.pop(ctx);
                          }
                          _fetchPerson();
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

    if (_person == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          backgroundColor: AppColors.primary,
        ),
        body: Center(
          child: Text(lang.t('person_not_found')),
        ),
      );
    }

    final isReturn = _person!.balance > 0;
    final isSettled = _person!.balance == 0;
    final badgeColor = isSettled
        ? AppColors.textSubtle
        : isReturn
            ? AppColors.error
            : AppColors.success;
    final badgeText = isSettled
        ? lang.t('settled')
        : isReturn
            ? lang.t('need_to_return')
            : lang.t('need_to_receive');

    // Combine timeline items
    final List<Map<String, dynamic>> timeline = [];

    for (var e in _eventEntries) {
      timeline.add({
        'id': e.id,
        'isEvent': true,
        'type': 'received',
        'title': lang.isTamil ? 'நிகழ்வில் பெற்றது' : 'Received in Event',
        'amount': e.amount,
        'date': e.createdAt,
        'notes': e.notes,
        'raw': e,
      });
    }

    for (var l in _personalLedgers) {
      timeline.add({
        'id': l.id,
        'isEvent': false,
        'type': 'returned',
        'title': lang.isTamil
            ? 'திருப்பிச் செலுத்தியது: ${lang.tData(l.eventName)}'
            : 'Returned: ${l.eventName}',
        'amount': l.amount,
        'date': l.date,
        'notes': l.notes,
        'raw': l,
      });
    }

    timeline.sort((a, b) =>
        (b['date'] as DateTime).compareTo(a['date'] as DateTime));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new,
              color: AppColors.surfaceLight, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          lang.tData(_person!.name),
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: AppColors.surfaceLight,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.auto_stories, color: AppColors.goldAccent),
            tooltip: lang.t('booklet_view'),
            onPressed: () {
              final bookletEntries = <EventEntryModel>[];
              for (var e in _eventEntries) {
                bookletEntries.add(e);
              }
              for (var l in _personalLedgers) {
                bookletEntries.add(
                  EventEntryModel(
                    id: l.id,
                    personId: _person!.id,
                    personName: _person!.name,
                    personVillage: _person!.village,
                    eventId: '',
                    amount: l.amount,
                    notes:
                        '${l.eventName}${l.notes != null && l.notes!.isNotEmpty ? ' (${l.notes})' : ''}',
                    createdAt: l.date,
                  ),
                );
              }

              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => BookletScreen(
                    title: _person!.name,
                    subtitle:
                        '${_person!.village} • ${lang.t('personal_title')}',
                    entries: bookletEntries,
                    totalAmount: _person!.totalReceived,
                    personName: _person!.name,
                    personVillage: _person!.village,
                  ),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: AppColors.surfaceLight),
            onPressed: _showEditPersonDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          // Person Profile Card
          Container(
            padding: const EdgeInsets.all(16),
            color: AppColors.surface,
            child: Column(
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 26,
                      backgroundColor: AppColors.primary,
                      child: Text(
                        _person!.name.isNotEmpty
                            ? _person!.name[0].toUpperCase()
                            : '?',
                        style: const TextStyle(
                          fontSize: 20,
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
                            lang.tData(_person!.name),
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textDark,
                              height: 1.3,
                            ),
                          ),
                          Row(
                            children: [
                              const Icon(
                                Icons.location_on_outlined,
                                size: 14,
                                color: AppColors.textMuted,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                lang.tData(_person!.village),
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                          if (_person!.notes != null &&
                              _person!.notes!.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              lang.tData(_person!.notes!),
                              style: const TextStyle(
                                fontSize: 12,
                                fontStyle: FontStyle.italic,
                                color: AppColors.textSubtle,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: badgeColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: badgeColor),
                      ),
                      child: Text(
                        badgeText,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: badgeColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Financial metrics row
                Row(
                  children: [
                    Expanded(
                      child: _MetricCard(
                        label: lang.t('total_received'),
                        value: currencyFormat.format(_person!.totalReceived),
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _MetricCard(
                        label: lang.t('total_returned'),
                        value: currencyFormat.format(_person!.totalReturned),
                        color: AppColors.gold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _MetricCard(
                        label: lang.t('current_balance'),
                        value: currencyFormat.format(_person!.balance.abs()),
                        color: badgeColor,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Booklet View Button Banner
                InkWell(
                  onTap: () {
                    final bookletEntries = <EventEntryModel>[];
                    for (var e in _eventEntries) {
                      bookletEntries.add(e);
                    }
                    for (var l in _personalLedgers) {
                      bookletEntries.add(
                        EventEntryModel(
                          id: l.id,
                          personId: _person!.id,
                          personName: _person!.name,
                          personVillage: _person!.village,
                          eventId: '',
                          amount: l.amount,
                          notes:
                              '${l.eventName}${l.notes != null && l.notes!.isNotEmpty ? ' (${l.notes})' : ''}',
                          createdAt: l.date,
                        ),
                      );
                    }

                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => BookletScreen(
                          title: _person!.name,
                          subtitle:
                              '${_person!.village} • ${lang.t('personal_title')}',
                          entries: bookletEntries,
                          totalAmount: _person!.totalReceived,
                          personName: _person!.name,
                          personVillage: _person!.village,
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

          // Timeline Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            child: Row(
              children: [
                const Icon(
                  Icons.history,
                  size: 18,
                  color: AppColors.gold,
                ),
                const SizedBox(width: 8),
                Text(
                  lang.t('transaction_timeline'),
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),

          // Timeline List
          Expanded(
            child: timeline.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.receipt_long_outlined,
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
                      vertical: 6,
                    ),
                    itemCount: timeline.length,
                    separatorBuilder: (context, index) =>
                        const Divider(height: 1, color: AppColors.border),
                    itemBuilder: (context, index) {
                      final item = timeline[index];
                      final isRec = item['type'] == 'received';
                      final itemColor =
                          isRec ? AppColors.primary : AppColors.gold;

                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: itemColor.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                isRec
                                    ? Icons.call_received
                                    : Icons.call_made,
                                size: 16,
                                color: itemColor,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    lang.tData(item['title']),
                                    style: const TextStyle(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textDark,
                                      height: 1.3,
                                    ),
                                  ),
                                  Text(
                                    DateFormat('dd MMM yyyy')
                                        .format(item['date'] as DateTime),
                                    style: const TextStyle(
                                      fontSize: 11.5,
                                      color: AppColors.textMuted,
                                    ),
                                  ),
                                  if (item['notes'] != null &&
                                      item['notes'].toString().isNotEmpty)
                                    Text(
                                      lang.tData(item['notes']),
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontStyle: FontStyle.italic,
                                        color: AppColors.textSubtle,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            Text(
                              currencyFormat.format(item['amount']),
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: itemColor,
                              ),
                            ),
                            if (item['isEvent'] == false &&
                                item['raw'] is PersonalLedgerEntryModel) ...[
                              const SizedBox(width: 6),
                              IconButton(
                                icon: const Icon(
                                  Icons.edit_outlined,
                                  size: 16,
                                  color: AppColors.textSubtle,
                                ),
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                                tooltip: lang.t('edit_entry'),
                                onPressed: () => _showEditPersonalLedgerDialog(
                                  item['raw'] as PersonalLedgerEntryModel,
                                ),
                              ),
                            ],
                          ],
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
        icon: const Icon(Icons.currency_rupee),
        label: Text(
          lang.t('return_money'),
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        onPressed: () async {
          final added = await FastEntrySheet.show(
            context,
            initialPersonId: widget.personId,
            isReturnMode: true,
          );
          if (added == true) {
            _fetchPerson();
          }
        },
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _MetricCard({
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
