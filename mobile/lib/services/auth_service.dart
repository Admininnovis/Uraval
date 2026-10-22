import '../constants/api_endpoints.dart';
import '../models/user_model.dart';
import 'api_service.dart';

class AuthService {
  static Future<UserModel> login(String email, String password) async {
    final res = await ApiService.post(
      ApiEndpoints.login,
      body: {
        'email': email.trim().toLowerCase(),
        'password': password,
      },
      needsAuth: false,
    );

    if (res['token'] != null) {
      await ApiService.saveToken(res['token']);
    }

    if (res['user'] != null) {
      return UserModel.fromJson(res['user']);
    }
    throw Exception('Invalid response from server');
  }

  static Future<UserModel> register(String name, String email, String password) async {
    final res = await ApiService.post(
      ApiEndpoints.register,
      body: {
        'name': name.trim(),
        'email': email.trim().toLowerCase(),
        'password': password,
      },
      needsAuth: false,
    );

    if (res['token'] != null) {
      await ApiService.saveToken(res['token']);
    }

    if (res['user'] != null) {
      return UserModel.fromJson(res['user']);
    }
    throw Exception('Invalid response from server');
  }

  static Future<UserModel?> getMe() async {
    try {
      final token = await ApiService.getToken();
      if (token == null || token.isEmpty) return null;

      final res = await ApiService.get(ApiEndpoints.me);
      if (res['user'] != null) {
        return UserModel.fromJson(res['user']);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  static Future<void> sendOtp(String email) async {
    await ApiService.post(
      ApiEndpoints.forgotSendOtp,
      body: {'email': email.trim().toLowerCase()},
      needsAuth: false,
    );
  }

  static Future<void> verifyOtp(String email, String otp) async {
    await ApiService.post(
      ApiEndpoints.forgotVerifyOtp,
      body: {
        'email': email.trim().toLowerCase(),
        'otp': otp.trim(),
      },
      needsAuth: false,
    );
  }

  static Future<void> resetPassword(
      String email, String otp, String newPassword) async {
    await ApiService.post(
      ApiEndpoints.forgotResetPassword,
      body: {
        'email': email.trim().toLowerCase(),
        'otp': otp.trim(),
        'newPassword': newPassword,
      },
      needsAuth: false,
    );
  }

  static Future<void> logout() async {
    await ApiService.clearToken();
  }

  static Future<void> deleteAccount() async {
    await ApiService.delete(ApiEndpoints.deleteAccount);
    await ApiService.clearToken();
  }
}
