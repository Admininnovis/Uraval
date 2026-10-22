class PersonModel {
  final String id;
  final String name;
  final String village;
  final String? notes;
  final num totalReceived;
  final num totalReturned;
  final num balance;
  final String status;
  final DateTime? updatedAt;

  PersonModel({
    required this.id,
    required this.name,
    required this.village,
    this.notes,
    this.totalReceived = 0,
    this.totalReturned = 0,
    this.balance = 0,
    this.status = 'Settled',
    this.updatedAt,
  });

  factory PersonModel.fromJson(Map<String, dynamic> json) {
    final rec = (json['totalReceived'] as num?) ?? 0;
    final ret = (json['totalReturned'] as num?) ?? 0;
    final bal = (json['balance'] as num?) ?? (rec - ret);

    String st = json['status'] ?? '';
    if (st.isEmpty) {
      if (bal > 0) {
        st = 'Need To Return';
      } else if (bal < 0) {
        st = 'Need To Receive';
      } else {
        st = 'Settled';
      }
    }

    return PersonModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      village: json['village'] ?? '',
      notes: json['notes'],
      totalReceived: rec,
      totalReturned: ret,
      balance: bal,
      status: st,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'village': village,
    'notes': notes,
  };
}
