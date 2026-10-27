import '../constants/api_endpoints.dart';
import 'api_service.dart';

class BillingService {
  /// Fetches account access status, status flag, and remaining days.
  static Future<Map<String, dynamic>> getAccessStatus() async {
    try {
      final res = await ApiService.get(ApiEndpoints.billingAccessStatus);
      if (res is Map<String, dynamic>) {
        return res;
      }
      return {};
    } catch (_) {
      return {};
    }
  }
}
