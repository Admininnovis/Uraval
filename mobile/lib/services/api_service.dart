import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_endpoints.dart';

class ApiService {
  static const String _tokenKey = 'uravin_jwt_token';
  static const String _customBaseUrlKey = 'uravin_custom_base_url';

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final customUrl = prefs.getString(_customBaseUrlKey);
    if (customUrl != null && customUrl.isNotEmpty) {
      ApiEndpoints.baseUrl = customUrl;
    }
  }

  static Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    String formattedUrl = url.trim();
    if (formattedUrl.endsWith('/')) {
      formattedUrl = formattedUrl.substring(0, formattedUrl.length - 1);
    }
    if (!formattedUrl.endsWith('/api')) {
      formattedUrl = '$formattedUrl/api';
    }
    await prefs.setString(_customBaseUrlKey, formattedUrl);
    ApiEndpoints.baseUrl = formattedUrl;
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  static Future<Map<String, String>> _headers({bool needsAuth = true}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (needsAuth) {
      final token = await getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  static const Duration _timeout = Duration(seconds: 15);

  static Future<dynamic> get(String url, {bool needsAuth = true}) async {
    try {
      final headers = await _headers(needsAuth: needsAuth);
      final response = await http
          .get(Uri.parse(url), headers: headers)
          .timeout(_timeout);
      return _handleResponse(response);
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  static Future<dynamic> post(
    String url, {
    Map<String, dynamic>? body,
    bool needsAuth = true,
  }) async {
    try {
      final headers = await _headers(needsAuth: needsAuth);
      final response = await http
          .post(
            Uri.parse(url),
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(_timeout);
      return _handleResponse(response);
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  static Future<dynamic> put(
    String url, {
    Map<String, dynamic>? body,
    bool needsAuth = true,
  }) async {
    try {
      final headers = await _headers(needsAuth: needsAuth);
      final response = await http
          .put(
            Uri.parse(url),
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(_timeout);
      return _handleResponse(response);
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  static Future<dynamic> delete(String url, {bool needsAuth = true}) async {
    try {
      final headers = await _headers(needsAuth: needsAuth);
      final response = await http
          .delete(Uri.parse(url), headers: headers)
          .timeout(_timeout);
      return _handleResponse(response);
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  static dynamic _handleResponse(http.Response response) {
    dynamic body;
    try {
      body = jsonDecode(response.body);
    } catch (_) {
      body = {'message': response.body};
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    } else {
      if (response.statusCode == 401) {
        // Token is invalid or expired - clear stored token
        clearToken();
      }
      String errorMsg = 'Request failed with status: ${response.statusCode}';
      if (body is Map) {
        if (body['message'] != null && body['message'].toString().trim().isNotEmpty) {
          errorMsg = body['message'].toString();
        } else if (body['error'] != null && body['error'].toString().trim().isNotEmpty) {
          errorMsg = body['error'].toString();
        } else if (body['errors'] != null && body['errors'] is List && (body['errors'] as List).isNotEmpty) {
          final first = body['errors'][0];
          errorMsg = first is Map && first['msg'] != null ? first['msg'].toString() : first.toString();
        }
      }
      throw Exception(errorMsg);
    }
  }
}
