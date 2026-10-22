import 'dart:math' as math;
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

/// A realistic 3D physical book paper-swipe widget with smooth Right-to-Left outward turn.
///
/// Features:
/// 1. Smooth Right-to-Left horizontal paper swipe hinged at the left spine.
/// 2. Turns OUTSIDE (swings towards the reader in 3D, +Z perspective lift, not receding inside).
/// 3. Dynamic paper curvature sheen and drop shadow sweeping right-to-left.
/// 4. Stationary revealed underlying page.
/// 5. Smooth 400ms easing for flings, dragging, and navigation buttons.
class RealPaperPageView extends StatefulWidget {
  final PageController controller;
  final int itemCount;
  final IndexedWidgetBuilder itemBuilder;
  final ValueChanged<int>? onPageChanged;

  const RealPaperPageView({
    super.key,
    required this.controller,
    required this.itemCount,
    required this.itemBuilder,
    this.onPageChanged,
  });

  @override
  State<RealPaperPageView> createState() => _RealPaperPageViewState();
}

class _RealPaperPageViewState extends State<RealPaperPageView> {
  double _lastDragPosition = 0.0;
  bool _isAnimating = false;

  @override
  Widget build(BuildContext context) {
    if (widget.itemCount <= 0) {
      return const SizedBox.shrink();
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final double width = constraints.maxWidth;
        final double height = constraints.maxHeight;

        return Stack(
          fit: StackFit.expand,
          children: [
            // 1. The Right-to-Left Outward 3D Paper Renderer
            AnimatedBuilder(
              animation: widget.controller,
              builder: (context, _) {
                double page = 0.0;
                if (widget.controller.hasClients &&
                    widget.controller.position.haveDimensions) {
                  page = widget.controller.page ??
                      widget.controller.initialPage.toDouble();
                } else {
                  page = widget.controller.initialPage.toDouble();
                }

                // Guard bounds
                page = page.clamp(0.0, (widget.itemCount - 1).toDouble());

                final int lowerIndex = page.floor();
                final double fraction = page - lowerIndex;

                // When resting stationary on a single page
                if (fraction <= 0.001) {
                  return Stack(
                    fit: StackFit.expand,
                    children: [
                      widget.itemBuilder(context, lowerIndex),
                      _buildSpineCrease(),
                      _buildStackEdgeShadow(),
                    ],
                  );
                }

                // In transition: lowerIndex (top sheet turning from right to left)
                // and upperIndex (bottom sheet revealed underneath)
                final int upperIndex =
                    math.min(lowerIndex + 1, widget.itemCount - 1);

                return Stack(
                  fit: StackFit.expand,
                  children: [
                    // A. Underlying Sheet (stays flat at desk level)
                    _buildRevealedPage(context, upperIndex, fraction),

                    // B. Top Sheet turning Right-to-Left OUTSIDE towards viewer
                    _buildTurningTopPage(
                      context,
                      lowerIndex,
                      fraction,
                      width,
                      height,
                    ),

                    // C. Book Spine Crease along left edge
                    _buildSpineCrease(),

                    // D. Stack paper edge on right
                    _buildStackEdgeShadow(),
                  ],
                );
              },
            ),

            // 2. Invisible PageView that provides ScrollPosition & dimensions to controller
            IgnorePointer(
              child: Opacity(
                opacity: 0.0,
                child: PageView.builder(
                  controller: widget.controller,
                  itemCount: widget.itemCount,
                  physics: const ClampingScrollPhysics(),
                  onPageChanged: widget.onPageChanged,
                  itemBuilder: (context, index) => const SizedBox.expand(),
                ),
              ),
            ),

            // 3. Interactive Touch & Mouse Swipe Layer
            Listener(
              onPointerSignal: (pointerSignal) {
                if (pointerSignal is PointerScrollEvent) {
                  if (!widget.controller.hasClients ||
                      !widget.controller.position.haveDimensions) {
                    return;
                  }
                  if (_isAnimating) return;
                  final delta = pointerSignal.scrollDelta.dx != 0
                      ? pointerSignal.scrollDelta.dx
                      : pointerSignal.scrollDelta.dy;
                  if (delta.abs() > 30) {
                    final currentPage = widget.controller.page ?? 0.0;
                    if (delta > 0 && currentPage < widget.itemCount - 1) {
                      _isAnimating = true;
                      widget.controller
                          .nextPage(
                            duration: const Duration(milliseconds: 400),
                            curve: Curves.easeInOutCubic,
                          )
                          .then((_) => _isAnimating = false);
                    } else if (delta < 0 && currentPage > 0) {
                      _isAnimating = true;
                      widget.controller
                          .previousPage(
                            duration: const Duration(milliseconds: 400),
                            curve: Curves.easeInOutCubic,
                          )
                          .then((_) => _isAnimating = false);
                    }
                  }
                }
              },
              child: GestureDetector(
                behavior: HitTestBehavior.translucent,
                onHorizontalDragStart: (details) {
                  _lastDragPosition = details.globalPosition.dx;
                },
                onHorizontalDragUpdate: (details) {
                  if (!widget.controller.hasClients ||
                      !widget.controller.position.haveDimensions) {
                    return;
                  }
                  final delta = details.globalPosition.dx - _lastDragPosition;
                  _lastDragPosition = details.globalPosition.dx;

                  final currentOffset = widget.controller.offset;
                  final maxOffset = widget.controller.position.maxScrollExtent;
                  final newOffset =
                      (currentOffset - delta).clamp(0.0, maxOffset);
                  widget.controller.jumpTo(newOffset);
                },
                onHorizontalDragEnd: (details) {
                  if (!widget.controller.hasClients ||
                      !widget.controller.position.haveDimensions) {
                    return;
                  }
                  final velocity = details.primaryVelocity ?? 0.0;
                  final currentPage = widget.controller.page ?? 0.0;

                  int targetPage;
                  if (velocity < -240) {
                    // Flung left -> Turn to next page
                    targetPage =
                        (currentPage.floor() + 1).clamp(0, widget.itemCount - 1);
                  } else if (velocity > 240) {
                    // Flung right -> Turn to previous page
                    targetPage =
                        (currentPage.ceil() - 1).clamp(0, widget.itemCount - 1);
                  } else {
                    // Dragged past threshold -> snap to closest
                    targetPage =
                        currentPage.round().clamp(0, widget.itemCount - 1);
                  }

                  widget.controller.animateToPage(
                    targetPage,
                    duration: const Duration(milliseconds: 400),
                    curve: Curves.easeInOutCubic,
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }

  /// Underlying sheet revealed beneath the turning page.
  Widget _buildRevealedPage(
    BuildContext context,
    int pageIndex,
    double fraction,
  ) {
    // Shadow cast by turning sheet sweeping right-to-left
    final double shadowOpacity = ((1.0 - fraction) * 0.40).clamp(0.0, 0.40);
    final double shadowSweep = (1.0 - fraction * 0.70).clamp(0.1, 1.0);

    return IgnorePointer(
      ignoring: true,
      child: Stack(
        fit: StackFit.expand,
        children: [
          widget.itemBuilder(context, pageIndex),

          // Shadow cast by turning sheet
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    Colors.black.withValues(alpha: shadowOpacity),
                    Colors.black.withValues(alpha: shadowOpacity * 0.65),
                    Colors.black.withValues(alpha: shadowOpacity * 0.18),
                    Colors.transparent,
                  ],
                  stops: [
                    0.0,
                    (0.20 * shadowSweep).clamp(0.05, 0.40),
                    (0.70 * shadowSweep).clamp(0.35, 0.85),
                    1.0,
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Top sheet turning Right-to-Left OUTSIDE towards the viewer.
  Widget _buildTurningTopPage(
    BuildContext context,
    int pageIndex,
    double fraction,
    double width,
    double height,
  ) {
    // 3D Outward Lift (+Z): As the page turns from right to left, it arches OUT towards viewer!
    final double liftZ = math.sin(fraction * math.pi) * 38.0;
    final double scale = 1.0 + (math.sin(fraction * math.pi) * 0.035);

    // Angle around left spine: 0.0 (flat) to -88 degrees into spine
    final double angleY = -fraction * (math.pi / 2.05);

    // Subtle natural vertical paper curvature
    final double flexion = math.sin(fraction * math.pi) * 0.02;

    final Matrix4 outwardTransform = Matrix4.identity()
      ..setEntry(3, 2, -0.0009) // Perspective: positive Z expands outward towards viewer!
      ..translateByDouble(0.0, 0.0, liftZ, 1.0)
      ..rotateY(angleY)
      ..scaleByDouble(scale, scale - flexion, 1.0, 1.0);

    // Curvature lighting sheen sweeps right-to-left across the page
    final double sheenPos = (1.0 - fraction * 0.85).clamp(0.05, 0.95);
    final double sheenAlpha = math.sin(fraction * math.pi) * 0.35;
    final double creaseDarkness = fraction * 0.35;

    // Smooth fade near edge-on 90 degrees to prevent popping
    final double pageOpacity = fraction > 0.88
        ? ((1.0 - fraction) / 0.12).clamp(0.0, 1.0)
        : 1.0;

    return IgnorePointer(
      ignoring: true,
      child: Transform(
        alignment: Alignment.centerLeft,
        transform: outwardTransform,
        child: Opacity(
          opacity: pageOpacity,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Page Content
              widget.itemBuilder(context, pageIndex),

              // Dynamic paper curl sheen & crease shadow sweeping Right to Left
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                      colors: [
                        Colors.black.withValues(alpha: creaseDarkness * 0.45),
                        Colors.black.withValues(alpha: 0.04),
                        Colors.white.withValues(alpha: sheenAlpha),
                        Colors.black.withValues(alpha: creaseDarkness * 0.70),
                      ],
                      stops: [
                        0.0,
                        (sheenPos - 0.25).clamp(0.0, 0.80),
                        sheenPos,
                        1.0,
                      ],
                    ),
                  ),
                ),
              ),

              // Lifting Right Edge Drop Shadow (casts soft shadow behind the lifting edge)
              Positioned(
                top: 0,
                bottom: 0,
                right: 0,
                width: 28,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                      colors: [
                        Colors.transparent,
                        Colors.black.withValues(
                          alpha: 0.30 * math.sin(fraction * math.pi),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Authentic bound spine gutter shadow along the left margin.
  Widget _buildSpineCrease() {
    return Positioned(
      left: 0,
      top: 0,
      bottom: 0,
      width: 18,
      child: IgnorePointer(
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [
                Colors.black.withValues(alpha: 0.28),
                Colors.black.withValues(alpha: 0.12),
                Colors.black.withValues(alpha: 0.03),
                Colors.transparent,
              ],
              stops: const [0.0, 0.25, 0.65, 1.0],
            ),
          ),
        ),
      ),
    );
  }

  /// Subtle paper stack edge depth along the right margin.
  Widget _buildStackEdgeShadow() {
    return Positioned(
      right: 0,
      top: 0,
      bottom: 0,
      width: 6,
      child: IgnorePointer(
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [
                Colors.transparent,
                Colors.black.withValues(alpha: 0.08),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
