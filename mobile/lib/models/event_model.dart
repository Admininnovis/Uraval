class EventModel {
  final String id;
  final String eventName;
  final String eventType;
  final DateTime eventDate;
  final String? location;
  final String? description;
  final num totalCollection;
  final int totalEntries;

  EventModel({
    required this.id,
    required this.eventName,
    required this.eventType,
    required this.eventDate,
    this.location,
    this.description,
    this.totalCollection = 0,
    this.totalEntries = 0,
  });

  factory EventModel.fromJson(Map<String, dynamic> json) {
    return EventModel(
      id: json['_id'] ?? json['id'] ?? '',
      eventName: json['eventName'] ?? '',
      eventType: json['eventType'] ?? 'Marriage',
      eventDate: json['eventDate'] != null 
          ? DateTime.tryParse(json['eventDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      location: json['location'],
      description: json['description'],
      totalCollection: (json['totalCollection'] as num?) ?? (json['currentBalance'] as num?) ?? 0,
      totalEntries: (json['totalEntries'] as num?)?.toInt() ??
          (json['entryCount'] as num?)?.toInt() ??
          0,
    );
  }

  Map<String, dynamic> toJson() => {
    'eventName': eventName,
    'eventType': eventType,
    'eventDate': eventDate.toIso8601String().split('T')[0],
    'location': location,
    'description': description,
  };
}
