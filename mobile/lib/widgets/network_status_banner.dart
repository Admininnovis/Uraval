import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/language_provider.dart';
import '../services/network_status_service.dart';

class NetworkStatusBanner extends StatelessWidget {
  final Widget child;

  const NetworkStatusBanner({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([
        NetworkStatusService.isOnline,
        NetworkStatusService.showRestoredBanner,
      ]),
      builder: (context, _) {
        final isOnline = NetworkStatusService.isOnline.value;
        final showRestored = NetworkStatusService.showRestoredBanner.value;
        final showBanner = !isOnline || showRestored;

        return Stack(
          children: [
            child,
            if (showBanner)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: Material(
                  color: Colors.transparent,
                  child: SafeArea(
                    bottom: false,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      margin: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: !isOnline
                            ? const Color(0xFFC62828)
                            : const Color(0xFF2E7D32),
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.18),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Icon(
                            !isOnline
                                ? Icons.wifi_off_rounded
                                : Icons.wifi_rounded,
                            color: Colors.white,
                            size: 18,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Builder(
                              builder: (ctx) {
                                String msg = !isOnline
                                    ? 'No Internet Connection • Reconnecting...'
                                    : 'Back Online';
                                try {
                                  final lang = Provider.of<LanguageProvider>(
                                    ctx,
                                    listen: false,
                                  );
                                  msg = !isOnline
                                      ? '${lang.t('no_internet')} • ${lang.t('no_internet_desc')}'
                                      : lang.t('connection_restored');
                                } catch (_) {}
                                return Text(
                                  msg,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                );
                              },
                            ),
                          ),
                          if (!isOnline) ...[
                            const SizedBox(width: 8),
                            GestureDetector(
                              onTap: () async {
                                final isBack =
                                    await NetworkStatusService.checkConnection();
                                if (isBack) {
                                  NetworkStatusService.markOnline();
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'Retry',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
