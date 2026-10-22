import 'dart:math' as math;
import 'package:flutter/material.dart';

typedef UravuuLoading = UravinLoading;
typedef UravalLoading = UravinLoading;

class UravinLoading extends StatefulWidget {
  final double size;
  final String? message;
  final bool showCard;

  const UravinLoading({
    super.key,
    this.size = 100,
    this.message,
    this.showCard = false,
  });

  @override
  State<UravinLoading> createState() => _UravinLoadingState();
}

class _UravinLoadingState extends State<UravinLoading>
    with TickerProviderStateMixin {
  late final AnimationController _rotationController;
  late final AnimationController _pulseController;
  late final Animation<double> _scaleAnimation;
  late final Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    // Continuous smooth rotation for outer heritage golden halo
    _rotationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat();

    // Gentle breathing pulse for the center logo
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    _scaleAnimation = Tween<double>(begin: 0.93, end: 1.05).animate(
      CurvedAnimation(
        parent: _pulseController,
        curve: Curves.easeInOutSine,
      ),
    );

    _glowAnimation = Tween<double>(begin: 0.2, end: 0.55).animate(
      CurvedAnimation(
        parent: _pulseController,
        curve: Curves.easeInOutSine,
      ),
    );
  }

  @override
  void dispose() {
    _rotationController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  Widget _buildContent() {
    final logoSize = widget.size * 0.70;

    return Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SizedBox(
          width: widget.size,
          height: widget.size,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Outer rotating heritage golden halo
              AnimatedBuilder(
                animation: _rotationController,
                builder: (context, child) {
                  return Transform.rotate(
                    angle: _rotationController.value * 2 * math.pi,
                    child: child,
                  );
                },
                child: SizedBox(
                  width: widget.size,
                  height: widget.size,
                  child: CustomPaint(
                    painter: _HeritageLoadingHaloPainter(
                      isCompact: widget.size <= 32,
                    ),
                  ),
                ),
              ),

              // Soft glowing golden backdrop behind logo (only for larger sizes)
              if (widget.size > 32)
                AnimatedBuilder(
                  animation: _glowAnimation,
                  builder: (context, child) {
                    return Container(
                      width: logoSize * 0.9,
                      height: logoSize * 0.9,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFD4AF37)
                                .withValues(alpha: _glowAnimation.value),
                            blurRadius: 18,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                    );
                  },
                ),

              // Pulsing Uravin Logo
              AnimatedBuilder(
                animation: _scaleAnimation,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _scaleAnimation.value,
                    child: child,
                  );
                },
                child: Container(
                  width: logoSize,
                  height: logoSize,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF7F3EB),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFFDDD1BF),
                      width: widget.size <= 32 ? 0.8 : 1.5,
                    ),
                    boxShadow: widget.size <= 32
                        ? null
                        : [
                            BoxShadow(
                              color: const Color(0xFF432C20)
                                  .withValues(alpha: 0.15),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                  ),
                  padding: EdgeInsets.all(
                    logoSize * (widget.size <= 32 ? 0.08 : 0.12),
                  ),
                  child: Image.asset(
                    'assets/images/uravin-logo.png',
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) =>
                        const Icon(
                      Icons.account_balance,
                      color: Color(0xFF8A5A1E),
                      size: 20,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        if (widget.message != null) ...[
          const SizedBox(height: 14),
          Text(
            widget.message!,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFF432C20),
              letterSpacing: 0.3,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.showCard) {
      return Center(child: _buildContent());
    }

    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
        decoration: BoxDecoration(
          color: const Color(0xFFF7F3EB),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFDDD1BF), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF432C20).withValues(alpha: 0.14),
              blurRadius: 20,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: _buildContent(),
      ),
    );
  }
}

class _HeritageLoadingHaloPainter extends CustomPainter {
  final bool isCompact;

  const _HeritageLoadingHaloPainter({this.isCompact = false});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final inset = isCompact ? 2.5 : 6.0;
    final radius = (size.width - inset) / 2;

    final rect = Rect.fromCircle(center: center, radius: radius);

    final sweepGradient = SweepGradient(
      colors: [
        const Color(0xFFB68A3D).withValues(alpha: 0.0),
        const Color(0xFFD4AF37).withValues(alpha: 0.2),
        const Color(0xFFB68A3D).withValues(alpha: 0.7),
        const Color(0xFF7A2E1E), // Heritage Crimson accent dot
      ],
      stops: const [0.0, 0.4, 0.85, 1.0],
    );

    final paint = Paint()
      ..shader = sweepGradient.createShader(rect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = isCompact ? 2.0 : 3.5
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(rect, 0, math.pi * 1.75, false, paint);
  }

  @override
  bool shouldRepaint(covariant _HeritageLoadingHaloPainter oldDelegate) =>
      oldDelegate.isCompact != isCompact;
}
