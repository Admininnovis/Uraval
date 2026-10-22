import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/entry_model.dart';
import 'ledger_service.dart';
import 'network_status_service.dart';

class OfflineQueueService {
  static const String _queueKey = 'uravin_offline_queue';
  static bool _isSyncing = false;

  /// Initialize listener to auto-sync when network is restored
  static void init() {
    NetworkStatusService.isOnline.addListener(() {
      if (NetworkStatusService.isOnline.value) {
        syncPendingEntries();
      }
    });
  }

  /// Get raw queued items
  static Future<List<Map<String, dynamic>>> getQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_queueKey);
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = jsonDecode(raw) as List<dynamic>;
      return list.map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (_) {
      return [];
    }
  }

  /// Save raw queued items
  static Future<void> _saveQueue(List<Map<String, dynamic>> queue) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_queueKey, jsonEncode(queue));
  }

  /// Queue an Event Entry (Moi contribution received)
  static Future<EventEntryModel> queueEventEntry({
    required String eventId,
    String? personId,
    required String name,
    required String village,
    required num amount,
    String? notes,
  }) async {
    final id = 'offline_event_${DateTime.now().millisecondsSinceEpoch}';
    final now = DateTime.now();

    final item = <String, dynamic>{
      'id': id,
      'type': 'event_entry',
      'eventId': eventId,
      'personId': personId ?? '',
      'name': name.trim(),
      'village': village.trim(),
      'amount': amount,
      'notes': notes?.trim() ?? '',
      'createdAt': now.toIso8601String(),
    };

    final queue = await getQueue();
    queue.add(item);
    await _saveQueue(queue);

    return EventEntryModel(
      id: id,
      personId: personId ?? id,
      personName: name.trim(),
      personVillage: village.trim(),
      eventId: eventId,
      amount: amount,
      notes: notes?.trim(),
      createdAt: now,
      isOffline: true,
    );
  }

  /// Queue a Personal Ledger Entry (Returned money / direct giving)
  static Future<PersonalLedgerEntryModel> queuePersonalEntry({
    String? personId,
    required String name,
    required String village,
    required String eventName,
    required num amount,
    DateTime? date,
    String? notes,
  }) async {
    final id = 'offline_personal_${DateTime.now().millisecondsSinceEpoch}';
    final now = DateTime.now();
    final entryDate = date ?? now;

    final item = <String, dynamic>{
      'id': id,
      'type': 'personal_entry',
      'personId': personId ?? '',
      'name': name.trim(),
      'village': village.trim(),
      'eventName': eventName.trim(),
      'amount': amount,
      'date': entryDate.toIso8601String(),
      'notes': notes?.trim() ?? '',
      'createdAt': now.toIso8601String(),
    };

    final queue = await getQueue();
    queue.add(item);
    await _saveQueue(queue);

    return PersonalLedgerEntryModel(
      id: id,
      personId: personId ?? id,
      personName: name.trim(),
      personVillage: village.trim(),
      eventName: eventName.trim(),
      amount: amount,
      date: entryDate,
      notes: notes?.trim(),
      createdAt: now,
      isOffline: true,
    );
  }

  /// Get pending offline entries for a specific event
  static Future<List<EventEntryModel>> getPendingEntriesForEvent(String eventId) async {
    final queue = await getQueue();
    return queue
        .where((e) => e['type'] == 'event_entry' && e['eventId'] == eventId)
        .map((e) => EventEntryModel(
              id: e['id'] ?? '',
              personId: e['personId'] ?? '',
              personName: e['name'] ?? '',
              personVillage: e['village'] ?? '',
              eventId: eventId,
              amount: (e['amount'] as num?) ?? 0,
              notes: e['notes'],
              createdAt: DateTime.tryParse(e['createdAt'] ?? '') ?? DateTime.now(),
              isOffline: true,
            ))
        .toList();
  }

  /// Get pending offline personal entries for a specific person
  static Future<List<PersonalLedgerEntryModel>> getPendingEntriesForPerson(String personId) async {
    final queue = await getQueue();
    return queue
        .where((e) => e['type'] == 'personal_entry' && e['personId'] == personId)
        .map((e) => PersonalLedgerEntryModel(
              id: e['id'] ?? '',
              personId: personId,
              personName: e['name'] ?? '',
              personVillage: e['village'] ?? '',
              eventName: e['eventName'] ?? '',
              amount: (e['amount'] as num?) ?? 0,
              date: DateTime.tryParse(e['date'] ?? '') ?? DateTime.now(),
              notes: e['notes'],
              createdAt: DateTime.tryParse(e['createdAt'] ?? '') ?? DateTime.now(),
              isOffline: true,
            ))
        .toList();
  }

  /// Number of pending offline entries
  static Future<int> getPendingCount() async {
    final queue = await getQueue();
    return queue.length;
  }

  /// Synchronize all pending offline items to the server database
  static Future<int> syncPendingEntries() async {
    if (_isSyncing) return 0;
    if (!NetworkStatusService.isOnline.value) return 0;

    final queue = await getQueue();
    if (queue.isEmpty) return 0;

    _isSyncing = true;
    int syncedCount = 0;
    final List<Map<String, dynamic>> remainingQueue = [];

    debugPrint('[OfflineQueue] Starting auto-sync for ${queue.length} items...');

    for (final item in queue) {
      try {
        final type = item['type'];
        String personId = item['personId'] ?? '';
        final name = item['name'] ?? '';
        final village = item['village'] ?? '';
        final notes = item['notes'];
        final amount = (item['amount'] as num?) ?? 0;

        // If personId is empty or offline-generated, create or resolve person on server
        if (personId.isEmpty || personId.startsWith('offline_')) {
          if (name.isNotEmpty) {
            final person = await LedgerService.createPerson(
              name: name,
              village: village,
              notes: notes,
              autoLink: true,
            );
            personId = person.id;
          }
        }

        if (type == 'event_entry') {
          final eventId = item['eventId'];
          if (eventId != null && eventId.isNotEmpty && personId.isNotEmpty) {
            await LedgerService.addEventEntry(
              eventId: eventId,
              personId: personId,
              amount: amount,
              notes: notes,
            );
            syncedCount++;
          } else {
            remainingQueue.add(item);
          }
        } else if (type == 'personal_entry') {
          final eventName = item['eventName'] ?? 'Return Money';
          final dateStr = item['date'];
          final date = dateStr != null ? DateTime.tryParse(dateStr) ?? DateTime.now() : DateTime.now();

          if (personId.isNotEmpty) {
            await LedgerService.createLedgerEntry(
              personId: personId,
              eventName: eventName,
              amount: amount,
              date: date,
              notes: notes,
            );
            syncedCount++;
          } else {
            remainingQueue.add(item);
          }
        }
      } catch (e) {
        debugPrint('[OfflineQueue] Sync failed for item: $e');
        // Keep in queue for next sync attempt
        remainingQueue.add(item);
      }
    }

    await _saveQueue(remainingQueue);
    _isSyncing = false;

    debugPrint('[OfflineQueue] Sync finished. Synced: $syncedCount, Remaining: ${remainingQueue.length}');
    return syncedCount;
  }
}
