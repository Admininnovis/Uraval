import 'package:flutter/foundation.dart';

class NetworkStatusService {
  static final ValueNotifier<bool> isOnline = ValueNotifier<bool>(true);
  static final ValueNotifier<bool> showRestoredBanner = ValueNotifier<bool>(false);

  static void markOffline() {
    // Offline mode disabled - always treat as online
  }

  static void markOnline() {
    // Already online
  }

  static Future<bool> checkConnection() async {
    return true;
  }
}
