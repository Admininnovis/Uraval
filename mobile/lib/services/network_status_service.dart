import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../constants/api_endpoints.dart';

class NetworkStatusService {
  static final ValueNotifier<bool> isOnline = ValueNotifier<bool>(true);
  static final ValueNotifier<bool> showRestoredBanner = ValueNotifier<bool>(false);
  static Timer? _recheckTimer;

  static void markOffline() {
    if (isOnline.value) {
      isOnline.value = false;
      _startAutoRecheck();
    }
  }

  static void markOnline() {
    _recheckTimer?.cancel();
    _recheckTimer = null;
    if (!isOnline.value) {
      isOnline.value = true;
      showRestoredBanner.value = true;
      Future.delayed(const Duration(milliseconds: 2800), () {
        showRestoredBanner.value = false;
      });
    }
  }

  static void _startAutoRecheck() {
    _recheckTimer?.cancel();
    // Periodically check if connection is restored every 6 seconds when offline
    _recheckTimer = Timer.periodic(const Duration(seconds: 6), (_) async {
      final success = await checkConnection();
      if (success) {
        markOnline();
      }
    });
  }

  static Future<bool> checkConnection() async {
    try {
      final uri = Uri.parse(ApiEndpoints.baseUrl.replaceAll('/api', ''));
      final response = await http.get(uri).timeout(const Duration(seconds: 4));
      return response.statusCode > 0;
    } catch (_) {
      return false;
    }
  }
}
