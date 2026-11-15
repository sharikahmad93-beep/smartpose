class DiningTable {
  final String id;
  final String name;
  final String section;
  final int capacity;
  final String status; // 'VACANT', 'OCCUPIED', 'BILLING'
  final double runningAmount;
  final int activeGuests;
  final int elapsedMinutes;

  DiningTable({
    required this.id,
    required this.name,
    required this.section,
    required this.capacity,
    required this.status,
    this.runningAmount = 0.0,
    this.activeGuests = 0,
    this.elapsedMinutes = 0,
  });
}

class MenuItem {
  final String id;
  final String name;
  final String category;
  final double price;
  final bool isVeg;
  final bool inStock;
  final String description;

  MenuItem({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.isVeg,
    this.inStock = true,
    this.description = '',
  });
}

class CartItem {
  final MenuItem dish;
  int quantity;
  String? notes;

  CartItem({
    required this.dish,
    this.quantity = 1,
    this.notes,
  });

  double get total => dish.price * quantity;
}

class KotTicket {
  final String id;
  final int kotNumber;
  final String tableName;
  final String time;
  final List<CartItem> items;
  String status; // 'COOKING', 'READY'

  KotTicket({
    required this.id,
    required this.kotNumber,
    required this.tableName,
    required this.time,
    required this.items,
    this.status = 'COOKING',
  });
}
