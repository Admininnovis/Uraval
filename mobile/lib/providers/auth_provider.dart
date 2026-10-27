import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/billing_service.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _currentUser;
  Map<String, dynamic>? _accountAccess;
  bool _isInitializing = true;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get currentUser => _currentUser;
  Map<String, dynamic>? get accountAccess => _accountAccess;
  bool get isAuthenticated => _currentUser != null;
  bool get isInitializing => _isInitializing;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Returns true if user's account maintenance / free access is expired
  bool get isAccessExpired {
    if (_accountAccess == null) return false;
    final status = _accountAccess!['status'];
    final isAccessActive =
        _accountAccess!['isAccessActive'] ?? _accountAccess!['isActive'];
    if (status == 'expired' || isAccessActive == false) {
      return true;
    }
    return false;
  }

  AuthProvider() {
    checkAuthStatus();
  }

  Future<void> refreshAccountAccess() async {
    if (_currentUser == null) {
      _accountAccess = null;
      notifyListeners();
      return;
    }
    try {
      final billingRes = await BillingService.getAccessStatus();
      if (billingRes.containsKey('access') && billingRes['access'] is Map) {
        _accountAccess = Map<String, dynamic>.from(billingRes['access']);
      }
    } catch (_) {}
    notifyListeners();
  }

  Future<void> checkAuthStatus() async {
    _isInitializing = true;
    notifyListeners();
    try {
      _currentUser = await AuthService.getMe();
      if (_currentUser != null) {
        await refreshAccountAccess();
      }
    } catch (_) {
      _currentUser = null;
      _accountAccess = null;
    } finally {
      _isInitializing = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      _currentUser = await AuthService.login(email, password);
      if (_currentUser != null) {
        await refreshAccountAccess();
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String name, String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      _currentUser = await AuthService.register(name, email, password);
      if (_currentUser != null) {
        await refreshAccountAccess();
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await AuthService.logout();
    _currentUser = null;
    _accountAccess = null;
    notifyListeners();
  }

  Future<bool> deleteAccount() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      await AuthService.deleteAccount();
      _currentUser = null;
      _accountAccess = null;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
