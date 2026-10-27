import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../models/event_model.dart';
import '../providers/language_provider.dart';

class EventBookCover extends StatelessWidget {
  final EventModel event;
  final VoidCallback onTap;

  const EventBookCover({
    super.key,
    required this.event,
    required this.onTap,
  });

  IconData _getEventIcon(String type) {
    switch (type.toLowerCase()) {
      case 'marriage':
      case 'wedding':
        return Icons.favorite_outline;
      case 'ear piercing':
      case 'earpiercing':
        return Icons.child_care;
      case 'house warming':
      case 'housewarming':
        return Icons.home_outlined;
      case 'seemantham':
      case 'baby shower':
        return Icons.pregnant_woman;
      case 'temple function':
      case 'temple':
        return Icons.temple_hindu_outlined;
      case 'puberty function':
        return Icons.celebration_outlined;
      case 'birthday':
        return Icons.cake_outlined;
      default:
        return Icons.menu_book_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);
    final currencyFormat = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 0,
    );

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        height: 140,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.28),
              blurRadius: 10,
              offset: const Offset(4, 5),
            ),
          ],
        ),
        child: Stack(
          children: [
            // 1. Stacked Pages Layer (Visible on right edge for 3D book thickness)
            Positioned(
              right: 0,
              top: 5,
              bottom: 5,
              width: 14,
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF5EED9),
                  borderRadius: const BorderRadius.only(
                    topRight: Radius.circular(8),
                    bottomRight: Radius.circular(8),
                  ),
                  border: Border.all(
                    color: const Color(0xFFD4C39E),
                    width: 1,
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: List.generate(
                    12,
                    (_) => Container(
                      height: 1,
                      color: const Color(0xFFD4C39E).withValues(alpha: 0.7),
                    ),
                  ),
                ),
              ),
            ),

            // 2. Main Leather Cover
            Positioned(
              left: 0,
              top: 0,
              bottom: 0,
              right: 8,
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF382014),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(10),
                    bottomLeft: Radius.circular(10),
                    topRight: Radius.circular(6),
                    bottomRight: Radius.circular(6),
                  ),
                  border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.45),
                    width: 1.5,
                  ),
                ),
                child: Stack(
                  children: [
                    // Leather spine on the left
                    Positioned(
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 28,
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFF24140B),
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(9),
                            bottomLeft: Radius.circular(9),
                          ),
                          border: Border(
                            right: BorderSide(
                              color: AppColors.gold.withValues(alpha: 0.35),
                              width: 1.5,
                            ),
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: List.generate(
                            5,
                            (index) => Container(
                              height: 3,
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              decoration: BoxDecoration(
                                color: AppColors.gold.withValues(alpha: 0.6),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),

                    // Red Bookmark Ribbon hanging from top
                    Positioned(
                      top: 0,
                      right: 32,
                      width: 14,
                      height: 38,
                      child: Container(
                        decoration: const BoxDecoration(
                          color: Color(0xFFC62828),
                          borderRadius: BorderRadius.only(
                            bottomLeft: Radius.circular(4),
                            bottomRight: Radius.circular(4),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black38,
                              blurRadius: 4,
                              offset: Offset(0, 2),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Gold Corner Brackets (Top Right & Bottom Right)
                    Positioned(
                      top: 8,
                      right: 8,
                      width: 16,
                      height: 16,
                      child: Container(
                        decoration: BoxDecoration(
                          border: Border(
                            top: BorderSide(
                              color: AppColors.goldAccent.withValues(alpha: 0.8),
                              width: 2,
                            ),
                            right: BorderSide(
                              color: AppColors.goldAccent.withValues(alpha: 0.8),
                              width: 2,
                            ),
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 8,
                      right: 8,
                      width: 16,
                      height: 16,
                      child: Container(
                        decoration: BoxDecoration(
                          border: Border(
                            bottom: BorderSide(
                              color: AppColors.goldAccent.withValues(alpha: 0.8),
                              width: 2,
                            ),
                            right: BorderSide(
                              color: AppColors.goldAccent.withValues(alpha: 0.8),
                              width: 2,
                            ),
                          ),
                        ),
                      ),
                    ),

                    // Book Content
                    Padding(
                      padding: const EdgeInsets.fromLTRB(40, 14, 20, 14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Event Header Tag
                          Row(
                            children: [
                              Icon(
                                _getEventIcon(event.eventType),
                                size: 16,
                                color: AppColors.goldAccent,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  lang.tData(event.eventType).toUpperCase(),
                                  style: const TextStyle(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.goldAccent,
                                    letterSpacing: 1.0,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                DateFormat('dd MMM yyyy').format(event.eventDate),
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.surface.withValues(alpha: 0.8),
                                ),
                              ),
                            ],
                          ),

                          // Event Title
                          Text(
                            lang.tData(event.eventName),
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              color: AppColors.surfaceLight,
                              height: 1.25,
                              letterSpacing: 0.3,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),

                          // Bottom Gold Embossed Ribbon: Collection & Entries
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.currency_rupee,
                                      size: 15,
                                      color: AppColors.goldAccent,
                                    ),
                                    Flexible(
                                      child: Text(
                                        currencyFormat.format(event.totalCollection),
                                        style: const TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w800,
                                          color: AppColors.goldAccent,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.black.withValues(alpha: 0.4),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                    color: AppColors.gold.withValues(alpha: 0.4),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.edit_note,
                                      size: 14,
                                      color: AppColors.goldAccent,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${event.totalEntries} Entries',
                                      style: const TextStyle(
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.surfaceLight,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
