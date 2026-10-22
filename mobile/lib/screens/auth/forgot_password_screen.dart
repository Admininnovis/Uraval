import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/app_colors.dart';
import '../../providers/language_provider.dart';
import '../../services/auth_service.dart';
import '../../widgets/app_toast.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();

  int _step = 1; // 1: Send OTP, 2: Verify OTP, 3: Reset Password
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleSendOtp() async {
    final email = _emailController.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      _showToast('Please enter a valid email address');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await AuthService.sendOtp(email);
      setState(() {
        _step = 2;
        _isLoading = false;
      });
      _showToast('OTP sent to your email', isSuccess: true);
    } catch (e) {
      setState(() => _isLoading = false);
      _showToast(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _handleVerifyOtp() async {
    final email = _emailController.text.trim();
    final otp = _otpController.text.trim();
    if (otp.length < 4) {
      _showToast('Please enter a valid OTP');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await AuthService.verifyOtp(email, otp);
      setState(() {
        _step = 3;
        _isLoading = false;
      });
      _showToast('OTP verified successfully', isSuccess: true);
    } catch (e) {
      setState(() => _isLoading = false);
      _showToast(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _handleResetPassword() async {
    final email = _emailController.text.trim();
    final otp = _otpController.text.trim();
    final newPass = _newPasswordController.text;

    if (newPass.length < 6) {
      _showToast('Password must be at least 6 characters');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await AuthService.resetPassword(email, otp, newPass);
      setState(() => _isLoading = false);
      if (mounted) {
        _showToast('Password reset successful! Please sign in.', isSuccess: true);
        Navigator.pop(context);
      }
    } catch (e) {
      setState(() => _isLoading = false);
      _showToast(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  void _showToast(String message, {bool isSuccess = false}) {
    if (!mounted) return;
    if (isSuccess) {
      AppToast.showSuccess(context, message);
    } else {
      AppToast.showError(context, message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: AppColors.primary, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Header Icon
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.surfaceLight,
                    border: Border.all(color: AppColors.gold, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primaryDark.withOpacity(0.1),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.lock_reset,
                      size: 32,
                      color: AppColors.gold,
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                Text(
                  lang.t('reset_password_title'),
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  lang.t('reset_password_subtitle'),
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textMuted,
                    height: 1.3,
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 24),

                // Card Container
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border, width: 1.2),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primaryDark.withOpacity(0.06),
                        blurRadius: 14,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (_step == 1) ...[
                        CustomTextField(
                          controller: _emailController,
                          label: lang.t('email_address'),
                          hint: lang.t('email_placeholder'),
                          keyboardType: TextInputType.emailAddress,
                          prefixIcon: const Icon(
                            Icons.email_outlined,
                            size: 18,
                            color: AppColors.textMuted,
                          ),
                        ),
                        const SizedBox(height: 20),
                        CustomButton(
                          text: _isLoading
                              ? lang.t('sending_otp')
                              : lang.t('send_otp'),
                          isLoading: _isLoading,
                          icon: Icons.send_outlined,
                          onPressed: _handleSendOtp,
                        ),
                      ] else if (_step == 2) ...[
                        Text(
                          'OTP has been sent to ${_emailController.text}',
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.textMuted,
                          ),
                        ),
                        const SizedBox(height: 14),
                        CustomTextField(
                          controller: _otpController,
                          label: lang.t('otp_code'),
                          hint: '123456',
                          keyboardType: TextInputType.number,
                          prefixIcon: const Icon(
                            Icons.pin_outlined,
                            size: 18,
                            color: AppColors.textMuted,
                          ),
                        ),
                        const SizedBox(height: 20),
                        CustomButton(
                          text: lang.t('verify_otp'),
                          isLoading: _isLoading,
                          icon: Icons.check,
                          onPressed: _handleVerifyOtp,
                        ),
                      ] else ...[
                        CustomTextField(
                          controller: _newPasswordController,
                          label: lang.t('new_password'),
                          hint: '••••••••',
                          obscureText: true,
                          prefixIcon: const Icon(
                            Icons.lock_outline,
                            size: 18,
                            color: AppColors.textMuted,
                          ),
                        ),
                        const SizedBox(height: 20),
                        CustomButton(
                          text: lang.t('save_password'),
                          isLoading: _isLoading,
                          icon: Icons.save_outlined,
                          onPressed: _handleResetPassword,
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text(
                    lang.t('back_to_login'),
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.gold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
