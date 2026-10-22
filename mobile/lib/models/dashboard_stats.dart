class DashboardStats {
  final num totalReceived;
  final num totalReturned;
  final num needToReturn;
  final num needToReceive;
  final int totalPeople;
  final int totalEvents;
  final num monthCollection;
  final num yearCollection;

  final List<DashboardActiveEvent> activeEvents;
  final DashboardInsightEvent? highestCollectionEvent;
  final List<DashboardActivity> recentActivities;

  DashboardStats({
    this.totalReceived = 0,
    this.totalReturned = 0,
    this.needToReturn = 0,
    this.needToReceive = 0,
    this.totalPeople = 0,
    this.totalEvents = 0,
    this.monthCollection = 0,
    this.yearCollection = 0,
    this.activeEvents = const [],
    this.highestCollectionEvent,
    this.recentActivities = const [],
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    final stats = json['stats'] as Map<String, dynamic>? ?? {};
    final insights = json['insights'] as Map<String, dynamic>? ?? {};

    final activeEventsJson = json['activeEvents'] as List<dynamic>? ?? [];
    final activeEventsList = activeEventsJson
        .map((e) => DashboardActiveEvent.fromJson(e as Map<String, dynamic>))
        .toList();

    DashboardInsightEvent? highest;
    if (insights['highestCollectionEvent'] != null) {
      highest = DashboardInsightEvent.fromJson(
          insights['highestCollectionEvent'] as Map<String, dynamic>);
    }

    final activitiesJson = json['recentActivities'] as List<dynamic>? ?? [];
    final activitiesList = activitiesJson
        .map((e) => DashboardActivity.fromJson(e as Map<String, dynamic>))
        .toList();

    return DashboardStats(
      totalReceived: (stats['totalReceived'] as num?) ?? 0,
      totalReturned: (stats['totalReturned'] as num?) ?? 0,
      needToReturn: (stats['needToReturn'] as num?) ?? 0,
      needToReceive: (stats['needToReceive'] as num?) ?? 0,
      totalPeople: (stats['totalPeople'] as num?)?.toInt() ?? 0,
      totalEvents: (stats['totalEvents'] as num?)?.toInt() ?? 0,
      monthCollection: (stats['monthCollection'] as num?) ?? 0,
      yearCollection: (stats['yearCollection'] as num?) ?? 0,
      activeEvents: activeEventsList,
      highestCollectionEvent: highest,
      recentActivities: activitiesList,
    );
  }
}

class DashboardActiveEvent {
  final String id;
  final String eventName;
  final String eventType;
  final DateTime eventDate;
  final int totalEntries;
  final num currentBalance;

  DashboardActiveEvent({
    required this.id,
    required this.eventName,
    required this.eventType,
    required this.eventDate,
    required this.totalEntries,
    required this.currentBalance,
  });

  factory DashboardActiveEvent.fromJson(Map<String, dynamic> json) {
    return DashboardActiveEvent(
      id: json['_id'] ?? json['id'] ?? '',
      eventName: json['eventName'] ?? '',
      eventType: json['eventType'] ?? 'Marriage',
      eventDate: json['eventDate'] != null
          ? DateTime.tryParse(json['eventDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      totalEntries: (json['totalEntries'] as num?)?.toInt() ?? 0,
      currentBalance: (json['currentBalance'] as num?) ?? 0,
    );
  }
}

class DashboardInsightEvent {
  final String id;
  final String name;
  final int entries;
  final num collection;

  DashboardInsightEvent({
    required this.id,
    required this.name,
    required this.entries,
    required this.collection,
  });

  factory DashboardInsightEvent.fromJson(Map<String, dynamic> json) {
    return DashboardInsightEvent(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      entries: (json['entries'] as num?)?.toInt() ?? 0,
      collection: (json['collection'] as num?) ?? 0,
    );
  }
}

class DashboardActivity {
  final String type;
  final String personName;
  final String? eventName;
  final String description;
  final DateTime? date;
  final num? amount;

  DashboardActivity({
    required this.type,
    required this.personName,
    this.eventName,
    required this.description,
    this.date,
    this.amount,
  });

  factory DashboardActivity.fromJson(Map<String, dynamic> json) {
    return DashboardActivity(
      type: json['type'] ?? 'entry',
      personName: json['personName'] ?? '',
      eventName: json['eventName'],
      description: json['description'] ?? '',
      date: json['date'] != null
          ? DateTime.tryParse(json['date'].toString())
          : null,
      amount: json['amount'] as num?,
    );
  }
}
