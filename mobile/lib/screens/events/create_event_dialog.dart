import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../providers/language_provider.dart';
import '../../providers/ledger_provider.dart';
import '../../services/ledger_service.dart';
import '../../widgets/app_toast.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';

class CreateEventDialog extends StatefulWidget {
  const CreateEventDialog({super.key});

  @override
  State<CreateEventDialog> createState() => _CreateEventDialogState();
}

class _CreateEventDialogState extends State<CreateEventDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _locationController = TextEditingController();
  final _descriptionController = TextEditingController();

  String _eventType = 'Wedding';
  DateTime _eventDate = DateTime.now();
  bool _isLoading = false;

  final List<String> _eventTypes = [
    'Wedding',
    'Housewarming',
    'Seemantham',
    'Birthday',
    'Ear Piercing',
    'Temple Function',
    'Custom',
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _locationController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    final lang = Provider.of<LanguageProvider>(context, listen: false);
    final ledger = Provider.of<LedgerProvider>(context, listen: false);

    setState(() => _isLoading = true);

    try {
      await LedgerService.createEvent(
        eventName: _nameController.text.trim(),
        eventType: _eventType,
        eventDate: _eventDate,
        location: _locationController.text.trim(),
        description: _descriptionController.text.trim(),
      );

      await ledger.refreshAll();

      if (mounted) {
        Navigator.pop(context, true);
        AppToast.showSuccess(context, lang.t('book_opened_success'));
      }
    } catch (e) {
      if (mounted) {
        AppToast.showError(context, e.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);

    return Dialog(
      backgroundColor: AppColors.background,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: AppColors.border, width: 1.2),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.book_outlined,
                      size: 20,
                      color: AppColors.goldAccent,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          lang.t('create_new_book'),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                            height: 1.3,
                          ),
                        ),
                        Text(
                          lang.t('book_subtitle'),
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textMuted,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),
              const Divider(color: AppColors.border, height: 1),
              const SizedBox(height: 16),

              // Event Name
              CustomTextField(
                controller: _nameController,
                label: lang.t('event_name'),
                hint: lang.t('event_name_placeholder'),
                validator: (val) => val == null || val.trim().isEmpty
                    ? lang.t('event_name')
                    : null,
              ),

              const SizedBox(height: 14),

              // Event Type
              Text(
                lang.t('event_type'),
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
                    value: _eventType,
                    items: _eventTypes.map((type) {
                      return DropdownMenuItem<String>(
                        value: type,
                        child: Text(
                          lang.tData(type),
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textDark,
                          ),
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() => _eventType = val);
                      }
                    },
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // Date Picker
              Text(
                lang.t('date'),
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textDark,
                  height: 1.3,
                ),
              ),
              const SizedBox(height: 6),
              InkWell(
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _eventDate,
                    firstDate: DateTime(2000),
                    lastDate: DateTime(2100),
                    builder: (context, child) {
                      return Theme(
                        data: Theme.of(context).copyWith(
                          colorScheme: const ColorScheme.light(
                            primary: AppColors.primary,
                            onPrimary: AppColors.goldAccent,
                            surface: AppColors.background,
                          ),
                        ),
                        child: child!,
                      );
                    },
                  );
                  if (picked != null) {
                    setState(() => _eventDate = picked);
                  }
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border, width: 1.2),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.calendar_month_outlined,
                        size: 18,
                        color: AppColors.textMuted,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        DateFormat('dd MMMM yyyy').format(_eventDate),
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.textDark,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // Location
              CustomTextField(
                controller: _locationController,
                label: lang.t('location'),
                hint: lang.t('location_placeholder'),
              ),

              const SizedBox(height: 14),

              // Description
              CustomTextField(
                controller: _descriptionController,
                label: lang.t('notes'),
                hint: lang.t('notes_placeholder'),
                maxLines: 2,
              ),

              const SizedBox(height: 22),

              Row(
                children: [
                  Expanded(
                    child: CustomButton(
                      text: lang.t('cancel'),
                      isSecondary: true,
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: CustomButton(
                      text: lang.t('open_book'),
                      isLoading: _isLoading,
                      onPressed: _handleSave,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
