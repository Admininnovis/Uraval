class EventEntryModel {
  final String id;
  final String personId;
  final String personName;
  final String personVillage;
  final String? personNotes;
  final String eventId;
  final num amount;
  final String? notes;
  final DateTime createdAt;

  EventEntryModel({
    required this.id,
    required this.personId,
    required this.personName,
    required this.personVillage,
    this.personNotes,
    required this.eventId,
    required this.amount,
    this.notes,
    required this.createdAt,
  });

  factory EventEntryModel.fromJson(Map<String, dynamic> json) {
    String pId = '';
    String pName = '';
    String pVillage = '';
    String? pNotes;

    if (json['personId'] is Map<String, dynamic>) {
      final pMap = json['personId'] as Map<String, dynamic>;
      pId = pMap['_id'] ?? pMap['id'] ?? '';
      pName = pMap['name'] ?? '';
      pVillage = pMap['village'] ?? '';
      pNotes = pMap['notes'];
    } else {
      pId = json['personId']?.toString() ?? '';
      pName = json['personName'] ?? '';
      pVillage = json['village'] ?? '';
    }

    String evId = '';
    if (json['eventId'] is Map<String, dynamic>) {
      evId = json['eventId']['_id'] ?? json['eventId']['id'] ?? '';
    } else {
      evId = json['eventId']?.toString() ?? '';
    }

    return EventEntryModel(
      id: json['_id'] ?? json['id'] ?? '',
      personId: pId,
      personName: pName,
      personVillage: pVillage,
      personNotes: pNotes,
      eventId: evId,
      amount: (json['amount'] as num?) ?? 0,
      notes: json['notes'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class PersonalLedgerEntryModel {
  final String id;
  final String personId;
  final String personName;
  final String personVillage;
  final String eventName;
  final num amount;
  final DateTime date;
  final String? notes;
  final DateTime createdAt;

  PersonalLedgerEntryModel({
    required this.id,
    required this.personId,
    required this.personName,
    required this.personVillage,
    required this.eventName,
    required this.amount,
    required this.date,
    this.notes,
    required this.createdAt,
  });

  factory PersonalLedgerEntryModel.fromJson(Map<String, dynamic> json) {
    String pId = '';
    String pName = '';
    String pVillage = '';

    if (json['personId'] is Map<String, dynamic>) {
      final pMap = json['personId'] as Map<String, dynamic>;
      pId = pMap['_id'] ?? pMap['id'] ?? '';
      pName = pMap['name'] ?? '';
      pVillage = pMap['village'] ?? '';
    } else {
      pId = json['personId']?.toString() ?? '';
      pName = json['personName'] ?? '';
      pVillage = json['village'] ?? '';
    }

    return PersonalLedgerEntryModel(
      id: json['_id'] ?? json['id'] ?? '',
      personId: pId,
      personName: pName,
      personVillage: pVillage,
      eventName: json['eventName'] ?? '',
      amount: (json['amount'] as num?) ?? 0,
      date: json['date'] != null
          ? DateTime.tryParse(json['date'].toString()) ?? DateTime.now()
          : DateTime.now(),
      notes: json['notes'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
