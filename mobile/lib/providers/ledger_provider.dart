import 'package:flutter/material.dart';
import '../models/dashboard_stats.dart';
import '../models/entry_model.dart';
import '../models/event_model.dart';
import '../models/person_model.dart';
import '../services/ledger_service.dart';

class LedgerProvider extends ChangeNotifier {
  DashboardStats? _dashboardStats;
  List<EventModel> _events = [];
  List<PersonModel> _people = [];
  List<PersonalLedgerEntryModel> _personalEntries = [];

  bool _isLoadingDashboard = false;
  bool _isLoadingEvents = false;
  bool _isLoadingPeople = false;
  bool _isLoadingPersonal = false;

  DashboardStats? get dashboardStats => _dashboardStats;
  List<EventModel> get events => _events;
  List<PersonModel> get people => _people;
  List<PersonalLedgerEntryModel> get personalEntries => _personalEntries;

  bool get isLoadingDashboard => _isLoadingDashboard;
  bool get isLoadingEvents => _isLoadingEvents;
  bool get isLoadingPeople => _isLoadingPeople;
  bool get isLoadingPersonal => _isLoadingPersonal;

  Future<void> fetchDashboard() async {
    _isLoadingDashboard = true;
    notifyListeners();
    try {
      _dashboardStats = await LedgerService.getDashboardStats();
    } catch (e) {
      debugPrint('Error fetching dashboard: $e');
    } finally {
      _isLoadingDashboard = false;
      notifyListeners();
    }
  }

  Future<void> fetchEvents({String? eventType}) async {
    _isLoadingEvents = true;
    notifyListeners();
    try {
      _events = await LedgerService.getEvents(eventType: eventType);
    } catch (e) {
      debugPrint('Error fetching events: $e');
    } finally {
      _isLoadingEvents = false;
      notifyListeners();
    }
  }

  Future<void> fetchPeople({String? search, String? village}) async {
    _isLoadingPeople = true;
    notifyListeners();
    try {
      _people = await LedgerService.getPeople(search: search, village: village);
    } catch (e) {
      debugPrint('Error fetching people: $e');
    } finally {
      _isLoadingPeople = false;
      notifyListeners();
    }
  }

  Future<void> fetchPersonalLedger({String? personId}) async {
    _isLoadingPersonal = true;
    notifyListeners();
    try {
      _personalEntries =
          await LedgerService.getPersonalLedger(personId: personId);
    } catch (e) {
      debugPrint('Error fetching personal ledger: $e');
    } finally {
      _isLoadingPersonal = false;
      notifyListeners();
    }
  }

  Future<void> refreshAll() async {
    await Future.wait([
      fetchDashboard(),
      fetchEvents(),
      fetchPeople(),
      fetchPersonalLedger(),
    ]);
  }
}
