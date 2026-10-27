import '../constants/api_endpoints.dart';
import '../models/dashboard_stats.dart';
import '../models/entry_model.dart';
import '../models/event_model.dart';
import '../models/person_model.dart';
import 'api_service.dart';

class LedgerService {
  // Dashboard
  static Future<DashboardStats> getDashboardStats() async {
    final res = await ApiService.get(ApiEndpoints.dashboardStats);
    return DashboardStats.fromJson(res);
  }

  // Events
  static Future<List<EventModel>> getEvents({String? eventType}) async {
    String url = '${ApiEndpoints.events}?limit=100';
    if (eventType != null && eventType.isNotEmpty && eventType != 'All') {
      url += '&eventType=${Uri.encodeComponent(eventType)}';
    }
    final res = await ApiService.get(url);
    final list = res['events'] as List<dynamic>? ?? [];
    return list.map((e) => EventModel.fromJson(e)).toList();
  }

  static Future<EventModel> createEvent({
    required String eventName,
    required String eventType,
    required DateTime eventDate,
    String? location,
    String? description,
  }) async {
    final res = await ApiService.post(
      ApiEndpoints.events,
      body: {
        'eventName': eventName.trim(),
        'eventType': eventType,
        'eventDate': eventDate.toIso8601String().split('T')[0],
        'location': location?.trim() ?? '',
        'description': description?.trim() ?? '',
      },
    );
    return EventModel.fromJson(res['event']);
  }

  static Future<Map<String, dynamic>> getEventById(String id) async {
    final res = await ApiService.get(ApiEndpoints.eventDetail(id));
    final event = EventModel.fromJson(res['event']);
    final entriesRaw = res['entries'] as List<dynamic>? ?? [];
    final entries = entriesRaw.map((e) => EventEntryModel.fromJson(e)).toList();
    final stats = res['stats'] as Map<String, dynamic>? ?? {};

    return {
      'event': event,
      'entries': entries,
      'stats': stats,
    };
  }

  static Future<EventEntryModel> addEventEntry({
    required String eventId,
    required String personId,
    required num amount,
    String? notes,
  }) async {
    final res = await ApiService.post(
      ApiEndpoints.eventEntries(eventId),
      body: {
        'personId': personId,
        'amount': amount,
        'notes': notes ?? '',
      },
    );
    return EventEntryModel.fromJson(res['entry']);
  }

  static Future<void> updateEventEntry({
    required String eventId,
    required String entryId,
    required num amount,
    String? notes,
  }) async {
    await ApiService.put(
      ApiEndpoints.updateEntry(eventId, entryId),
      body: {
        'amount': amount,
        'notes': notes ?? '',
      },
    );
  }

  static Future<void> deleteEvent(String id) async {
    await ApiService.delete(ApiEndpoints.eventDetail(id));
  }

  // People
  static Future<List<PersonModel>> getPeople({
    String? search,
    String? village,
  }) async {
    String url = '${ApiEndpoints.people}?limit=200';
    if (search != null && search.isNotEmpty) {
      url += '&search=${Uri.encodeComponent(search)}';
    }
    if (village != null && village.isNotEmpty && village != 'All') {
      url += '&village=${Uri.encodeComponent(village)}';
    }
    final res = await ApiService.get(url);
    final list = res['people'] as List<dynamic>? ?? [];
    return list.map((e) => PersonModel.fromJson(e)).toList();
  }

  static Future<PersonModel> createPerson({
    required String name,
    required String village,
    String? notes,
    bool autoLink = true,
  }) async {
    final res = await ApiService.post(
      '${ApiEndpoints.people}?autoLink=$autoLink',
      body: {
        'name': name.trim().toUpperCase(),
        'village': village.trim().toUpperCase(),
        'notes': notes?.trim() ?? '',
      },
    );
    return PersonModel.fromJson(res['person']);
  }

  static Future<Map<String, dynamic>> getPersonById(String id) async {
    final res = await ApiService.get(ApiEndpoints.personDetail(id));
    final person = PersonModel.fromJson(res['person']);
    final eventEntriesRaw = res['eventEntries'] as List<dynamic>? ?? [];
    final personalLedgersRaw = res['personalLedgers'] as List<dynamic>? ?? [];

    final eventEntries =
        eventEntriesRaw.map((e) => EventEntryModel.fromJson(e)).toList();
    final personalLedgers =
        personalLedgersRaw.map((e) => PersonalLedgerEntryModel.fromJson(e)).toList();

    return {
      'person': person,
      'eventEntries': eventEntries,
      'personalLedgers': personalLedgers,
    };
  }

  static Future<void> updatePerson({
    required String id,
    required String name,
    required String village,
    String? notes,
  }) async {
    await ApiService.put(
      ApiEndpoints.personDetail(id),
      body: {
        'name': name.trim().toUpperCase(),
        'village': village.trim().toUpperCase(),
        'notes': notes?.trim() ?? '',
      },
    );
  }

  // Personal Ledger
  static Future<List<PersonalLedgerEntryModel>> getPersonalLedger({
    String? personId,
  }) async {
    String url = '${ApiEndpoints.personalLedger}?limit=200';
    if (personId != null && personId.isNotEmpty) {
      url += '&personId=$personId';
    }
    final res = await ApiService.get(url);
    final list = res['entries'] as List<dynamic>? ?? [];
    return list.map((e) => PersonalLedgerEntryModel.fromJson(e)).toList();
  }

  static Future<PersonalLedgerEntryModel> createLedgerEntry({
    required String personId,
    required String eventName,
    required num amount,
    required DateTime date,
    String? notes,
  }) async {
    final res = await ApiService.post(
      ApiEndpoints.personalLedger,
      body: {
        'personId': personId,
        'eventName': eventName.trim(),
        'amount': amount,
        'date': date.toIso8601String().split('T')[0],
        'notes': notes?.trim() ?? '',
      },
    );
    return PersonalLedgerEntryModel.fromJson(res['entry']);
  }

  static Future<void> updateLedgerEntry({
    required String id,
    required String eventName,
    required num amount,
    required DateTime date,
    String? notes,
  }) async {
    await ApiService.put(
      ApiEndpoints.updateLedgerEntry(id),
      body: {
        'eventName': eventName.trim(),
        'amount': amount,
        'date': date.toIso8601String().split('T')[0],
        'notes': notes?.trim() ?? '',
      },
    );
  }
}
