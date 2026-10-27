import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../models/entry_model.dart';
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

  DateTime _selectedDate = DateTime.now();

  List<PersonModel> _matchingPeople = [];
  bool _showSuggestions = false;

  List<String> _villageSuggestions = [];
  bool _showVillageSuggestions = false;

  bool _isSubmitting = false;
  bool _isSelectingPerson = false;

  List<EventEntryModel> _currentEventEntries = [];

  List<EventEntryModel> get _exactMatchesInCurrentLedger {
    if (_isReturnMode || _currentEventEntries.isEmpty) return [];
    final cleanName = _cleanCompare(_nameController.text);
    final cleanVillage = _cleanCompare(_villageController.text);
    if (cleanName.length < 2) return [];

    return _currentEventEntries.where((e) {
      final eName = _cleanCompare(e.personName);
      final eVillage = _cleanCompare(e.personVillage);
      if (cleanVillage.isEmpty) {
        return eName == cleanName;
      }
      return eName == cleanName && eVillage == cleanVillage;
    }).toList();
  }

  bool get _isNoteRequired => _exactMatchesInCurrentLedger.isNotEmpty;

  bool get _duplicateWithExactNote {
    if (!_isNoteRequired) return false;
    final currentNoteClean = _cleanCompare(_notesController.text);
    if (currentNoteClean.isEmpty) return false;
    return _exactMatchesInCurrentLedger.any((e) {
      final enNoteClean = _cleanCompare(e.notes ?? e.personNotes);
      return enNoteClean == currentNoteClean;
    });
  }

  Future<void> _loadCurrentEventEntries(String? eventId) async {
    if (eventId == null || eventId.isEmpty || _isReturnMode) {
      if (mounted) {
        setState(() => _currentEventEntries = []);
      }
      return;
    }
    try {
      final data = await LedgerService.getEventById(eventId);
      if (mounted) {
        setState(() {
          _currentEventEntries =
              (data['entries'] as List<EventEntryModel>? ?? []);
        });
      }
    } catch (_) {}
  }

  static String _cleanCompare(String? text) {
    return (text ?? '').trim().toUpperCase().replaceAll(RegExp(r'\s+'), ' ');
  }

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

    // Load entries for duplicate detection
    _loadCurrentEventEntries(_selectedEventId);

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
    _villageController.addListener(_onVillageChanged);
    _notesController.addListener(_onNotesChanged);
  }

  @override
  void dispose() {
    _nameController.removeListener(_onNameChanged);
    _villageController.removeListener(_onVillageChanged);
    _notesController.removeListener(_onNotesChanged);
    _nameController.dispose();
    _villageController.dispose();
    _amountController.dispose();
    _notesController.dispose();
    _returnEventNameController.dispose();
    super.dispose();
  }

  void _onNotesChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  void _onNameChanged() {
    if (_isSelectingPerson) return;
    final query = _cleanCompare(_nameController.text);
    if (_selectedPersonId != null) {
      // Clear selected person ID if user edits the text
      _selectedPersonId = null;
    }

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
      final pName = _cleanCompare(p.name);
      final pVillage = _cleanCompare(p.village);
      final pNotes = _cleanCompare(p.notes);
      return pName.contains(query) ||
          pVillage.contains(query) ||
          pNotes.contains(query);
    }).take(5).toList();

    if (mounted) {
      setState(() {
        _matchingPeople = matches;
        _showSuggestions = matches.isNotEmpty;
      });
    }
  }

  void _onVillageChanged() {
    final query = _cleanCompare(_villageController.text);
    if (query.isEmpty) {
      if (mounted) {
        setState(() {
          _villageSuggestions = [];
          _showVillageSuggestions = false;
        });
      }
      return;
    }

    final allPeople =
        Provider.of<LedgerProvider>(context, listen: false).people;
    final Set<String> uniqueVillages = {};
    for (final p in allPeople) {
      if (p.village.trim().isNotEmpty &&
          _cleanCompare(p.village).contains(query)) {
        uniqueVillages.add(p.village.trim().toUpperCase());
      }
    }

    final matches = uniqueVillages.take(5).toList();
    if (mounted) {
      setState(() {
        _villageSuggestions = matches;
        _showVillageSuggestions = matches.isNotEmpty;
      });
    }
  }

  void _selectPerson(PersonModel person) {
    _isSelectingPerson = true;
    setState(() {
      _nameController.text = person.name;
      _villageController.text = person.village;
      if (_notesController.text.isEmpty && person.notes != null) {
        _notesController.text = person.notes!;
      }
      _selectedPersonId = person.id;
      _matchingPeople = [];
      _showSuggestions = false;
    });
    _isSelectingPerson = false;
    FocusScope.of(context).unfocus();
  }

  void _selectVillage(String village) {
    setState(() {
      _villageController.text = village;
      _villageSuggestions = [];
      _showVillageSuggestions = false;
    });
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: ThemeData.light().copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              surface: AppColors.surface,
              onSurface: AppColors.textDark,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
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
      // Duplicate detection in Event Ledger
      if (!_isReturnMode) {
        if (_selectedEventId == null || _selectedEventId!.isEmpty) {
          throw Exception(lang.t('select_event_prompt'));
        }

        try {
          final eventData =
              await LedgerService.getEventById(_selectedEventId!);
          final existingEntries =
              eventData['entries'] as List<EventEntryModel>? ?? [];

          final cleanTypedName = _cleanCompare(name);
          final cleanTypedVillage = _cleanCompare(village);
          final cleanTypedNotes = _cleanCompare(notes);

          final samePersonMatches = existingEntries.where((e) {
            return _cleanCompare(e.personName) == cleanTypedName &&
                _cleanCompare(e.personVillage) == cleanTypedVillage;
          }).toList();

          if (samePersonMatches.isNotEmpty) {
            if (cleanTypedNotes.isEmpty) {
              final matched = samePersonMatches.first;
              if (mounted) {
                AppToast.showError(
                  context,
                  lang.isTamil
                      ? '"${matched.personName}" (${matched.personVillage}) ஏற்கனவே இந்த நோட்டில் உள்ளார். வேறுபடுத்த குறிப்பு (Note) அவசியம்!'
                      : '"${matched.personName}" (${matched.personVillage}) already exists in this event. A Note is required to distinguish them.',
                );
              }
              return;
            }

            final exactDuplicate = samePersonMatches.any((e) =>
                _cleanCompare(e.notes) == cleanTypedNotes);
            if (exactDuplicate) {
              if (mounted) {
                AppToast.showError(
                  context,
                  lang.isTamil
                      ? 'இதே பெயர், ஊர் மற்றும் குறிப்புடன் உள்ளீடு ஏற்கனவே உள்ளது!'
                      : 'An entry with this exact Name, Village, and Note already exists in this event.',
                );
              }
              return;
            }
          }
        } catch (_) {}
      }

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
          date: _selectedDate,
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
      decoration: BoxDecoration(
        color: const Color(0xFFF7F3EB),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
        border: Border.all(color: const Color(0xFFDDD1BF), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF432C20).withValues(alpha: 0.18),
            blurRadius: 28,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Top Golden Accent Line
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 4,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Color(0xFFB68A3D),
                    Color(0xFFD4AF37),
                    Color(0xFFB68A3D),
                  ],
                ),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(24),
                  topRight: Radius.circular(24),
                ),
              ),
            ),
          ),

          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag Handle (Swipe down gesture to dismiss)
              Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 6),
                  width: 48,
                  height: 5,
                  decoration: BoxDecoration(
                    color: const Color(0xFFDDD1BF),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),

              // Header Title
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEDE5D8),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFDDD1BF)),
                      ),
                      child: const Icon(
                        Icons.edit_note,
                        color: Color(0xFF8A5A1E),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _isReturnMode
                                ? lang.t('return_entry_title')
                                : lang.t('quick_entry_title'),
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF432C20),
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            lang.t('fast_moi_record'),
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF8A5A1E),
                              height: 1.2,
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
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ),
                        ButtonSegment(
                          value: true,
                          label: Text(
                            lang.t('returned'),
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                      selected: {_isReturnMode},
                      onSelectionChanged: (set) {
                        setState(() {
                          _isReturnMode = set.first;
                        });
                        if (!_isReturnMode && _selectedEventId != null) {
                          _loadCurrentEventEntries(_selectedEventId);
                        }
                      },
                      style: ButtonStyle(
                        visualDensity: VisualDensity.compact,
                        backgroundColor: WidgetStateProperty.resolveWith(
                          (states) => states.contains(WidgetState.selected)
                              ? const Color(0xFF7A2E1E)
                              : const Color(0xFFEDE5D8),
                        ),
                        foregroundColor: WidgetStateProperty.resolveWith(
                          (states) => states.contains(WidgetState.selected)
                              ? const Color(0xFFFAF7F2)
                              : const Color(0xFF432C20),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const Divider(color: Color(0xFFDDD1BF), height: 1),

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
                              if (val != null) {
                                _loadCurrentEventEntries(val);
                              }
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
                      if (ledger.events.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: ledger.events.map((e) {
                              return Padding(
                                padding: const EdgeInsets.only(right: 6),
                                child: ActionChip(
                                  visualDensity: VisualDensity.compact,
                                  backgroundColor: const Color(0xFFEDE5D8),
                                  label: Text(
                                    lang.tData(e.eventName),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Color(0xFF432C20),
                                    ),
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _returnEventNameController.text = e.eventName;
                                    });
                                  },
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ],
                      const SizedBox(height: 14),
                      // Return Date Picker
                      InkWell(
                        onTap: _pickDate,
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
                                '${lang.t('date')}: ${DateFormat('dd MMM yyyy').format(_selectedDate)}',
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
                      const SizedBox(height: 14),
                    ],

                    // Real-time Amber Duplicate Banner (matches Web EventLedgerDetail.jsx 100%)
                    if (!_isReturnMode && _exactMatchesInCurrentLedger.isNotEmpty) ...[
                      Builder(
                        builder: (context) {
                          final match = _exactMatchesInCurrentLedger.first;
                          final matchVillage = match.personVillage.isNotEmpty
                              ? match.personVillage
                              : (lang.isTamil ? 'தெரியாத ஊர்' : 'Unknown Village');
                          final notesText = _notesController.text.trim();
                          final isExactCollision = _duplicateWithExactNote;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 14),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFFBEB), // amber-50
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: const Color(0xFFFBBF24), // amber-400
                                width: 1.6,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFD97706).withValues(alpha: 0.08),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Icon(
                                      Icons.warning_amber_rounded,
                                      color: Color(0xFFD97706),
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: RichText(
                                        text: TextSpan(
                                          style: const TextStyle(
                                            fontSize: 13,
                                            color: Color(0xFF78350F), // amber-900
                                            height: 1.35,
                                          ),
                                          children: [
                                            TextSpan(
                                              text: '"${match.personName}" ',
                                              style: const TextStyle(fontWeight: FontWeight.bold),
                                            ),
                                            TextSpan(
                                              text: '($matchVillage) ',
                                              style: const TextStyle(color: Color(0xFF92400E)),
                                            ),
                                            TextSpan(
                                              text: lang.isTamil
                                                  ? 'ஏற்கனவே இந்த நோட்டில் உள்ளார்!'
                                                  : 'already exists in this ledger!',
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    // Last Entry info
                                    Flexible(
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            lang.isTamil ? 'கடைசி பதிவு: ' : 'Last Entry: ',
                                            style: const TextStyle(
                                              fontSize: 11,
                                              color: Color(0xFFB45309),
                                            ),
                                          ),
                                          Text(
                                            '₹${match.amount}',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF78350F),
                                            ),
                                          ),
                                          if (match.notes != null && match.notes!.isNotEmpty) ...[
                                            const SizedBox(width: 6),
                                            Flexible(
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFFFDE68A).withValues(alpha: 0.6),
                                                  borderRadius: BorderRadius.circular(4),
                                                  border: Border.all(color: const Color(0xFFFCD34D)),
                                                ),
                                                child: Text(
                                                  match.notes!,
                                                  style: const TextStyle(
                                                    fontSize: 10,
                                                    fontStyle: FontStyle.italic,
                                                    color: Color(0xFF78350F),
                                                  ),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    // Live status badge
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: notesText.isEmpty
                                            ? const Color(0xFFF59E0B) // Amber
                                            : (isExactCollision
                                                ? const Color(0xFFFFE4E6) // Rose-100
                                                : const Color(0xFFD1FAE5)), // Emerald-100
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(
                                          color: notesText.isEmpty
                                              ? const Color(0xFFD97706)
                                              : (isExactCollision
                                                  ? const Color(0xFFFDA4AF)
                                                  : const Color(0xFF6EE7B7)),
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          if (notesText.isNotEmpty && !isExactCollision) ...[
                                            const Icon(
                                              Icons.check_circle_rounded,
                                              size: 11,
                                              color: Color(0xFF065F46),
                                            ),
                                            const SizedBox(width: 3),
                                          ],
                                          Text(
                                            notesText.isEmpty
                                                ? (lang.isTamil ? '* குறிப்பு அவசியம்' : '* NOTE REQUIRED')
                                                : (isExactCollision
                                                    ? (lang.isTamil ? 'இதே குறிப்பு உள்ளது' : 'NOTE COLLISION')
                                                    : (lang.isTamil ? 'வேறுபடுத்தப்பட்டது ✓' : 'DIFFERENTIATED ✓')),
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                              letterSpacing: 0.5,
                                              color: notesText.isEmpty
                                                  ? Colors.white
                                                  : (isExactCollision
                                                      ? const Color(0xFFBE123C)
                                                      : const Color(0xFF065F46)),
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
                        },
                      ),
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
                              color: AppColors.primaryDark.withValues(alpha: 0.08),
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

                    if (_showVillageSuggestions && _villageSuggestions.isNotEmpty) ...[
                      Container(
                        margin: const EdgeInsets.only(top: 4, bottom: 8),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.gold, width: 1.2),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primaryDark.withValues(alpha: 0.08),
                              blurRadius: 6,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _villageSuggestions.length,
                          separatorBuilder: (context, index) =>
                              const Divider(height: 1, color: AppColors.border),
                          itemBuilder: (context, idx) {
                            final villageName = _villageSuggestions[idx];
                            return InkWell(
                              onTap: () => _selectVillage(villageName),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 10,
                                ),
                                child: Row(
                                  children: [
                                    const Icon(
                                      Icons.location_on_outlined,
                                      size: 18,
                                      color: AppColors.gold,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      villageName,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textDark,
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

                    // Notes Field with dynamic amber border and note required badge
                    CustomTextField(
                      controller: _notesController,
                      label: lang.t('notes'),
                      hint: _isNoteRequired
                          ? (lang.isTamil ? 'எ.கா: பெரிய வீடு / மகன்...' : 'e.g. Periya Veedu / Son of...')
                          : lang.t('notes_placeholder'),
                      maxLines: 2,
                      borderColor: _isNoteRequired
                          ? (_notesController.text.trim().isEmpty
                              ? const Color(0xFFF59E0B) // Amber
                              : (_duplicateWithExactNote
                                  ? const Color(0xFFEF4444) // Rose / Red
                                  : const Color(0xFF10B981))) // Emerald
                          : null,
                      headerTrailing: _isNoteRequired
                          ? Text(
                              _notesController.text.trim().isEmpty
                                  ? (lang.isTamil ? '* குறிப்பு அவசியம்' : '* Note Required')
                                  : (_duplicateWithExactNote
                                      ? (lang.isTamil ? 'இதே குறிப்பு உள்ளது' : 'Duplicate Note')
                                      : (lang.isTamil ? 'வேறுபடுத்தப்பட்டது ✓' : 'Differentiated ✓')),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: _notesController.text.trim().isEmpty
                                    ? const Color(0xFFD97706)
                                    : (_duplicateWithExactNote
                                        ? const Color(0xFFE11D48)
                                        : const Color(0xFF059669)),
                              ),
                            )
                          : null,
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
    ],
  ),
);
  }
}
