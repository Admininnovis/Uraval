class ApiEndpoints {
  // Dynamically selects 10.0.2.2 for Android emulator, 127.0.0.1 for iOS/desktop/web
  static const String liveProductionUrl =
      'https://moi-kanakku-server-production.up.railway.app/api';

  static String get defaultBaseUrl {
    const envUrl = String.fromEnvironment('API_URL');
    if (envUrl.isNotEmpty) {
      return envUrl;
    }
    return liveProductionUrl;
  }

  static String baseUrl = defaultBaseUrl;

  static String get login => '$baseUrl/auth/login';
  static String get register => '$baseUrl/auth/register';
  static String get me => '$baseUrl/auth/me';
  static String get forgotSendOtp => '$baseUrl/auth/forgot-password/send-otp';
  static String get forgotVerifyOtp => '$baseUrl/auth/forgot-password/verify-otp';
  static String get forgotResetPassword => '$baseUrl/auth/forgot-password/reset-password';
  static String get deleteAccount => '$baseUrl/auth/account';

  static String get events => '$baseUrl/events';
  static String eventDetail(String id) => '$baseUrl/events/$id';
  static String eventEntries(String id) => '$baseUrl/events/$id/entries';
  static String updateEntry(String eventId, String entryId) => '$baseUrl/events/$eventId/entries/$entryId';

  static String get people => '$baseUrl/people';
  static String personDetail(String id) => '$baseUrl/people/$id';
  static String get personalLedger => '$baseUrl/ledger';
  static String updateLedgerEntry(String id) => '$baseUrl/ledger/$id';

  static String get dashboardStats => '$baseUrl/reports/dashboard';

  // Web Portal URLs for Payments & Booklet Creation
  static const String defaultWebPortalUrl = 'https://www.uravuu.com';

  static String get webPortalUrl {
    const envUrl = String.fromEnvironment('WEB_URL');
    if (envUrl.isNotEmpty) {
      return envUrl;
    }
    return defaultWebPortalUrl;
  }

  static String get webSubscriptionUrl => '$webPortalUrl/subscription';
  static String get webCreateBookletUrl => '$webPortalUrl/dashboard';

  // Billing API
  static String get billingAccessStatus => '$baseUrl/billing/access-status';
}
