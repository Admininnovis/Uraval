import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../models/person_model.dart';
import '../providers/language_provider.dart';
import '../providers/ledger_provider.dart';
import '../services/ledger_service.dart';
import 'app_toast.dart';
import 'custom_button.dart';
import 'custom_text_field.dart';

class FastEntrySheet extends StatefulWidget {
  final String? initialEventId;
  final String? initialPersonId;
  final bool isReturnMode;

  const FastEntrySheet({
    super.key,
    this.initialEventId,
    this.initialPersonId,
    this.isReturnMode = false,
  });

  static Future<bool?> show(
    BuildContext context, {
    String? initialEventId,
    String? initialPersonId,
    bool isReturnMode = false,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      enableDrag: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => FastEntrySheet(
        initialEventId: initialEventId,
        initialPersonId: initialPersonId,
        isReturnMode: isReturnMode,
      ),
    );
  }

  @override
  State<FastEntrySheet> createState() => _FastEntrySheetState();
}

class _FastEntrySheetState extends State<FastEntrySheet> {
  final _formKey = GlobalKey<FormState>();

  late bool _isReturnMode;
  String? _selectedEventId;
  String? _selectedPersonId;

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _villageController = TextEditingController();
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();
  final TextEditingController _returnEventNameController =
      TextEditingController();

  List<PersonModel> _matchingPeople = [];
  bool _showSuggestions = false;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _isReturnMode = widget.isReturnMode;
    _selectedEventId = widget.initialEventId;
    _selectedPersonId = widget.initialPersonId;

    final ledgerProvider = Provider.of<LedgerProvider>(context, listen: false);

    // If initial event not set and events exist, select first event
    if (_selectedEventId == null && ledgerProvider.events.isNotEmpty) {
      _selectedEventId = ledgerProvider.events.first.id;
    }

    // If initial person set, fill fields
    if (_selectedPersonId != null) {
      try {
        final p = ledgerProvider.people.firstWhere(
          (item) => item.id == _selectedPersonId,
        );
        _nameController.text = p.name;
        _villageController.text = p.village;
      } catch (_) {}
    }

    _nameController.addListener(_onNameChanged);
  }

  @override
  void dispose() {
    _nameController.removeListener(_onNameChanged);
    _nameController.dispose();
    _villageController.dispose();
    _amountController.dispose();
    _notesController.dispose();
    _returnEventNameController.dispose();
    super.dispose();
  }

  void _onNameChanged() {
    final query = _nameController.text.trim().toLowerCase();
    if (query.isEmpty) {
      if (mounted) {
        setState(() {
          _matchingPeople = [];
          _showSuggestions = false;
        });
      }
      return;
    }

    final allPeople =
        Provider.of<LedgerProvider>(context, listen: false).people;
    final matches = allPeople.where((p) {
      return p.name.toLowerCase().contains(query) ||
          p.village.toLowerCase().contains(query) ||
          (p.notes != null && p.notes!.toLowerCase().contains(query));
    }).take(5).toList();

    if (mounted) {
      setState(() {
        _matchingPeople = matches;
        _showSuggestions = matches.isNotEmpty;
      });
    }
  }

  void _selectPerson(PersonModel person) {
    setState(() {
      _selectedPersonId = person.id;
      _nameController.text = person.name;
      _villageController.text = person.village;
      if (_notesController.text.isEmpty && person.notes != null) {
        _notesController.text = person.notes!;
      }
      _matchingPeople = [];
      _showSuggestions = false;
    });
    FocusScope.of(context).unfocus();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final lang = Provider.of<LanguageProvider>(context, listen: false);
    final ledger = Provider.of<LedgerProvider>(context, listen: false);

    final name = _nameController.text.trim();
    final village = _villageController.text.trim();
    final amount = num.tryParse(_amountController.text.trim()) ?? 0;
    final notes = _notesController.text.trim();

    if (amount <= 0) {
      AppToast.showError(context, lang.t('amount_required'));
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      String personId = _selectedPersonId ?? '';

      // If no person selected or name changed, create/find person
      if (personId.isEmpty) {
        final person = await LedgerService.createPerson(
          name: name,
          village: village,
          notes: notes,
          autoLink: true,
        );
        personId = person.id;
      }

      if (_isReturnMode) {
        // Personal Ledger (Return money)
        final eventName = _returnEventNameController.text.trim().isEmpty
            ? 'Return Money'
            : _returnEventNameController.text.trim();

        await LedgerService.createLedgerEntry(
          personId: personId,
          eventName: eventName,
          amount: amount,
          date: DateTime.now(),
          notes: notes,
        );
      } else {
        // Event Entry (Receive in event)
        if (_selectedEventId == null || _selectedEventId!.isEmpty) {
          throw Exception(lang.t('select_event_prompt'));
        }

        await LedgerService.addEventEntry(
          eventId: _selectedEventId!,
          personId: personId,
          amount: amount,
          notes: notes,
        );
      }

      // Refresh data
      await ledger.refreshAll();

      if (mounted) {
        Navigator.pop(context, true);
        AppToast.showSuccess(context, lang.t('entry_added_success'));
      }
    } catch (e) {
      if (mounted) {
        AppToast.showError(context, e.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);
    final ledger = Provider.of<LedgerProvider>(context);
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      padding: EdgeInsets.only(bottom: bottomInset),
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag Handle (Swipe down gesture to dismiss)
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 48,
              height: 5,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),

          // Header Title
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _isReturnMode
                            ? lang.t('return_entry_title')
                            : lang.t('quick_entry_title'),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        lang.t('fast_moi_record'),
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textMuted,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
                // Toggle mode button (Event Entry / Return Money)
                SegmentedButton<bool>(
                  segments: [
                    ButtonSegment(
                      value: false,
                      label: Text(
                        lang.t('received'),
                        style: const TextStyle(fontSize: 11),
                      ),
                    ),
                    ButtonSegment(
                      value: true,
                      label: Text(
                        lang.t('returned'),
                        style: const TextStyle(fontSize: 11),
                      ),
                    ),
                  ],
                  selected: {_isReturnMode},
                  onSelectionChanged: (set) {
                    setState(() {
                      _isReturnMode = set.first;
                    });
                  },
                  style: ButtonStyle(
                    visualDensity: VisualDensity.compact,
                    backgroundColor: WidgetStateProperty.resolveWith(
                      (states) => states.contains(WidgetState.selected)
                          ? AppColors.primary
                          : AppColors.surface,
                    ),
                    foregroundColor: WidgetStateProperty.resolveWith(
                      (states) => states.contains(WidgetState.selected)
                          ? AppColors.goldAccent
                          : AppColors.textDark,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const Divider(color: AppColors.border, height: 1),

          // Scrollable Form
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Event Selection (for Event Entry mode)
                    if (!_isReturnMode) ...[
                      Text(
                        lang.t('select_event'),
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textDark,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.border, width: 1.2),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            isExpanded: true,
                            value: _selectedEventId,
                            hint: Text(
                              lang.t('select_event_prompt'),
                              style: const TextStyle(
                                fontSize: 14,
                                color: AppColors.textSubtle,
                              ),
                            ),
                            items: ledger.events.map((e) {
                              return DropdownMenuItem<String>(
                                value: e.id,
                                child: Text(
                                  lang.tData(e.eventName),
                                  style: const TextStyle(
                                    fontSize: 14,
                                    color: AppColors.textDark,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              );
                            }).toList(),
                            onChanged: (val) {
                              setState(() => _selectedEventId = val);
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                    ] else ...[
                      CustomTextField(
                        controller: _returnEventNameController,
                        label: lang.t('event_name'),
                        hint: lang.t('event_name_placeholder'),
                      ),
                      const SizedBox(height: 14),
                    ],

                    // Person Name Field with Autocomplete suggestions
                    CustomTextField(
                      controller: _nameController,
                      label: lang.t('person_name'),
                      hint: lang.t('person_name_placeholder'),
                      validator: (val) => val == null || val.trim().isEmpty
                          ? lang.t('name_required')
                          : null,
                    ),

                    // Suggestions Dropdown (Touch safe: clicks will immediately select without dismissing sheet)
                    if (_showSuggestions && _matchingPeople.isNotEmpty) ...[
                      Container(
                        margin: const EdgeInsets.only(top: 4, bottom: 8),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.gold, width: 1.2),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primaryDark.withOpacity(0.08),
                              blurRadius: 6,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _matchingPeople.length,
                          separatorBuilder: (context, index) =>
                              const Divider(height: 1, color: AppColors.border),
                          itemBuilder: (context, idx) {
                            final p = _matchingPeople[idx];
                            return InkWell(
                              onTap: () => _selectPerson(p),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 10,
                                ),
                                child: Row(
                                  children: [
                                    const Icon(
                                      Icons.person_pin_outlined,
                                      size: 18,
                                      color: AppColors.gold,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: RichText(
                                        text: TextSpan(
                                          text: lang.tData(p.name),
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.textDark,
                                          ),
                                          children: [
                                            if (p.village.isNotEmpty)
                                              TextSpan(
                                                text: '  (${lang.tData(p.village)})',
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.normal,
                                                  color: AppColors.textMuted,
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    Text(
                                      '₹${p.balance}',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: p.balance > 0
                                            ? AppColors.error
                                            : AppColors.success,
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

                    const SizedBox(height: 14),

                    // Village Field
                    CustomTextField(
                      controller: _villageController,
                      label: lang.t('village'),
                      hint: lang.t('village_placeholder'),
                      validator: (val) => val == null || val.trim().isEmpty
                          ? lang.t('village_required')
                          : null,
                    ),

                    const SizedBox(height: 14),

                    // Amount Field
                    CustomTextField(
                      controller: _amountController,
                      label: lang.t('amount'),
                      hint: '₹ 500',
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
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) {
                          return lang.t('amount_required');
                        }
                        if (num.tryParse(val.trim()) == null) {
                          return lang.t('valid_amount');
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 14),

                    // Notes Field
                    CustomTextField(
                      controller: _notesController,
                      label: lang.t('notes'),
                      hint: lang.t('notes_placeholder'),
                      maxLines: 2,
                    ),

                    const SizedBox(height: 24),

                    // Submit Button
                    CustomButton(
                      text: lang.t('save_entry'),
                      isLoading: _isSubmitting,
                      icon: Icons.check_circle_outline,
                      onPressed: _handleSubmit,
                    ),
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
