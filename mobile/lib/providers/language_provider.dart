import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../l10n/app_translations.dart';
import '../utils/translator.dart';

class LanguageProvider extends ChangeNotifier {
  static const String _prefKey = 'uravin_language_code';
  String _currentLanguage = 'en';

  String get currentLanguage => _currentLanguage;
  bool get isTamil => _currentLanguage == 'ta';

  LanguageProvider() {
    _loadPreference();
  }

  Future<void> _loadPreference() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_prefKey);
    if (saved != null && (saved == 'en' || saved == 'ta')) {
      _currentLanguage = saved;
      notifyListeners();
    }
  }

  Future<void> setLanguage(String langCode) async {
    if (langCode != 'en' && langCode != 'ta') return;
    _currentLanguage = langCode;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, langCode);
  }

  void toggleLanguage() {
    if (_currentLanguage == 'en') {
      setLanguage('ta');
    } else {
      setLanguage('en');
    }
  }

  String t(String key) {
    if (_currentLanguage == 'ta') {
      return AppTranslations.ta[key] ?? AppTranslations.en[key] ?? key;
    }
    return AppTranslations.en[key] ?? key;
  }

  /// Translates live database values (e.g. eventName, eventType, village, personName, notes)
  String tData(dynamic text) {
    return AppTranslator.translateLiveData(text, _currentLanguage);
  }
}
