import 'package:flutter/material.dart';
import 'models/models.dart';

void main() {
  runApp(const SmartPosCaptainApp());
}

class SmartPosCaptainApp extends StatelessWidget {
  const SmartPosCaptainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Captain POS Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFEA580C),
          primary: const Color(0xFFEA580C),
          surface: const Color(0xFFF8FAFC),
        ),
        fontFamily: 'Roboto',
      ),
      home: const MobileMainScreen(),
    );
  }
}

class MobileMainScreen extends StatefulWidget {
  const MobileMainScreen({super.key});

  @override
  State<MobileMainScreen> createState() => _MobileMainScreenState();
}

class _MobileMainScreenState extends State<MobileMainScreen> {
  int _currentIndex = 0;
  DiningTable? _selectedTable;

  final List<DiningTable> _tables = [
    DiningTable(id: 't1', name: 'T-01', section: 'Main Hall', capacity: 2, status: 'OCCUPIED', runningAmount: 640, activeGuests: 2, elapsedMinutes: 24),
    DiningTable(id: 't2', name: 'T-02', section: 'Main Hall', capacity: 4, status: 'VACANT'),
    DiningTable(id: 't3', name: 'T-03', section: 'Main Hall', capacity: 4, status: 'OCCUPIED', runningAmount: 1850, activeGuests: 4, elapsedMinutes: 42),
    DiningTable(id: 't4', name: 'T-04', section: 'Main Hall', capacity: 6, status: 'BILLING', runningAmount: 3200, activeGuests: 5, elapsedMinutes: 65),
    DiningTable(id: 'g1', name: 'G-01', section: 'Garden', capacity: 4, status: 'OCCUPIED', runningAmount: 1120, activeGuests: 3, elapsedMinutes: 18),
    DiningTable(id: 'g2', name: 'G-02', section: 'Garden', capacity: 4, status: 'VACANT'),
    DiningTable(id: 'r1', name: 'R-01', section: 'Rooftop', capacity: 8, status: 'OCCUPIED', runningAmount: 4950, activeGuests: 7, elapsedMinutes: 55),
  ];

  final List<MenuItem> _menu = [
    MenuItem(id: 'm1', name: 'Royal Chicken Dum Biryani', category: 'Biryani', price: 340, isVeg: false, description: 'Slow cooked aromatic basmati with chicken'),
    MenuItem(id: 'm2', name: 'Special Mutton Dum Biryani', category: 'Biryani', price: 460, isVeg: false, description: 'Tender baby goat pieces cooked in sealed handi'),
    MenuItem(id: 'm3', name: 'Hyderabadi Veg Dum Biryani', category: 'Biryani', price: 280, isVeg: true, description: 'Fresh veggies, paneer & fragrant spices'),
    MenuItem(id: 'm4', name: 'Chicken Tikka Kebab (8 Pcs)', category: 'Tandoor', price: 320, isVeg: false, description: 'Charred boneless chicken skewers'),
    MenuItem(id: 'm5', name: 'Paneer Malai Tikka', category: 'Tandoor', price: 290, isVeg: true, description: 'Creamy soft cottage cheese cardamom'),
    MenuItem(id: 'm6', name: 'Garlic Butter Naan', category: 'Breads', price: 65, isVeg: true, description: 'Tandoori bread with crushed garlic & butter'),
    MenuItem(id: 'm7', name: 'Royal Masala Chai (Kulhad)', category: 'Beverages', price: 60, isVeg: true, description: 'Steaming ginger & cardamom tea'),
  ];

  final List<CartItem> _cart = [];
  final List<KotTicket> _kots = [
    KotTicket(
      id: 'k1',
      kotNumber: 201,
      tableName: 'T-03',
      time: '13:42',
      status: 'COOKING',
      items: [
        CartItem(dish: MenuItem(id: 'm1', name: 'Royal Chicken Dum Biryani', category: 'Biryani', price: 340, isVeg: false), quantity: 2, notes: 'Spicy'),
      ],
    ),
  ];

  String _selectedCategory = 'ALL';
  String _searchQuery = '';
  final bool _onlyVeg = false;

  void _addToCart(MenuItem item) {
    setState(() {
      final index = _cart.indexWhere((c) => c.dish.id == item.id);
      if (index >= 0) {
        _cart[index].quantity++;
      } else {
        _cart.add(CartItem(dish: item, quantity: 1));
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Added ${item.name} to Cart'),
        duration: const Duration(milliseconds: 700),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _punchKot() {
    if (_cart.isEmpty || _selectedTable == null) return;
    setState(() {
      _kots.insert(
        0,
        KotTicket(
          id: 'k_${DateTime.now().millisecondsSinceEpoch}',
          kotNumber: 200 + _kots.length + 1,
          tableName: _selectedTable!.name,
          time: '${TimeOfDay.now().hour}:${TimeOfDay.now().minute.toString().padLeft(2, '0')}',
          items: List.from(_cart),
        ),
      );
      _cart.clear();
      _currentIndex = 2; // Jump to KDS view
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF15803D),
        content: Text('⚡ KOT #${_kots.first.kotNumber} Dispatched to Kitchen!'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        elevation: 2,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFEA580C),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text('BE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Biryani Express', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                Text(
                  _selectedTable != null ? 'Table: ${_selectedTable!.name}' : 'Select Table',
                  style: const TextStyle(fontSize: 11, color: Color(0xFFFB923C)),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_active_outlined, color: Colors.white70),
            onPressed: () {},
          ),
        ],
      ),
      body: _buildCurrentBody(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: [
          const NavigationDestination(icon: Icon(Icons.table_restaurant_outlined), selectedIcon: Icon(Icons.table_restaurant), label: 'Tables'),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: _cart.isNotEmpty,
              label: Text('${_cart.fold(0, (sum, i) => sum + i.quantity)}'),
              child: const Icon(Icons.restaurant_menu_outlined),
            ),
            selectedIcon: const Icon(Icons.restaurant_menu),
            label: 'Order',
          ),
          NavigationDestination(
            icon: Badge(label: Text('${_kots.length}'), child: const Icon(Icons.kitchen_outlined)),
            selectedIcon: const Icon(Icons.kitchen),
            label: 'KDS',
          ),
          const NavigationDestination(icon: Icon(Icons.delivery_dining_outlined), selectedIcon: Icon(Icons.delivery_dining), label: 'Online'),
          const NavigationDestination(icon: Icon(Icons.analytics_outlined), selectedIcon: Icon(Icons.analytics), label: 'Owner'),
        ],
      ),
    );
  }

  Widget _buildCurrentBody() {
    switch (_currentIndex) {
      case 0:
        return _buildTablesView();
      case 1:
        return _buildOrderView();
      case 2:
        return _buildKdsView();
      case 3:
        return _buildOnlineFeed();
      case 4:
      default:
        return _buildOwnerStats();
    }
  }

  Widget _buildTablesView() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Restaurant Floor Layout', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const Text('Select a table to punch order or check running bill', style: TextStyle(fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 0.9,
          ),
          itemCount: _tables.length,
          itemBuilder: (context, idx) {
            final t = _tables[idx];
            final isOcc = t.status == 'OCCUPIED';
            final isBill = t.status == 'BILLING';
            final isSel = _selectedTable?.id == t.id;

            return InkWell(
              onTap: () {
                setState(() {
                  _selectedTable = t;
                  _currentIndex = 1; // Go to Order screen
                });
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                decoration: BoxDecoration(
                  color: isSel
                      ? const Color(0xFFFFEDD5)
                      : isOcc
                          ? const Color(0xFFFEE2E2)
                          : isBill
                              ? const Color(0xFFFEF3C7)
                              : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSel ? const Color(0xFFEA580C) : Colors.grey.shade300,
                    width: isSel ? 2 : 1,
                  ),
                ),
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(t.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        CircleAvatar(
                          radius: 4,
                          backgroundColor: isOcc ? Colors.red : isBill ? Colors.amber : Colors.green,
                        ),
                      ],
                    ),
                    if (isOcc || isBill) ...[
                      Text('₹${t.runningAmount.toInt()}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      Text('${t.elapsedMinutes}m • ${t.activeGuests}p', style: TextStyle(fontSize: 10, color: Colors.grey.shade700)),
                    ] else ...[
                      Text('Seats: ${t.capacity}', style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                      const Text('VACANT', style: TextStyle(fontSize: 10, color: Colors.green, fontWeight: FontWeight.bold)),
                    ]
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildOrderView() {
    final filtered = _menu.where((item) {
      final mCat = _selectedCategory == 'ALL' || item.category == _selectedCategory;
      final mSearch = item.name.toLowerCase().contains(_searchQuery.toLowerCase());
      final mVeg = !_onlyVeg || item.isVeg;
      return mCat && mSearch && mVeg;
    }).toList();

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: Colors.white,
          child: Column(
            children: [
              TextField(
                onChanged: (val) => setState(() => _searchQuery = val),
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.search, size: 20),
                  hintText: 'Search biryani, tikka, naan...',
                  hintStyle: const TextStyle(fontSize: 13),
                  isDense: true,
                  contentPadding: const EdgeInsets.all(10),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
                ),
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ['ALL', 'Biryani', 'Tandoor', 'Breads', 'Beverages'].map((cat) {
                    final isSel = _selectedCategory == cat;
                    return Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: ChoiceChip(
                        label: Text(cat, style: TextStyle(fontSize: 11, color: isSel ? Colors.white : Colors.black87)),
                        selected: isSel,
                        selectedColor: const Color(0xFF0F172A),
                        onSelected: (_) => setState(() => _selectedCategory = cat),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: filtered.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, idx) {
              final dish = filtered[idx];
              return Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.circle, size: 10, color: dish.isVeg ? Colors.green : Colors.red),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(dish.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text('₹${dish.price.toInt()}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEA580C),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: () => _addToCart(dish),
                      child: const Text('+ ADD', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        if (_cart.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Color(0x14000000), blurRadius: 10, offset: Offset(0, -2))],
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('${_cart.length} Dishes in Cart', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                      Text(
                        'Total: ₹${_cart.fold(0.0, (sum, i) => sum + i.total).toInt()}',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFEA580C),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.flash_on, size: 18),
                  label: const Text('PUNCH KOT', style: TextStyle(fontWeight: FontWeight.bold)),
                  onPressed: _punchKot,
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildKdsView() {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _kots.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, idx) {
        final kot = _kots[idx];
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('KOT #${kot.kotNumber} • ${kot.tableName}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  Text(kot.time, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                ],
              ),
              const Divider(height: 16),
              ...kot.items.map((it) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Text('${it.quantity}x ${it.dish.name}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                  )),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    setState(() {
                      kot.status = 'READY';
                    });
                  },
                  child: Text(kot.status == 'READY' ? '✓ MARKED READY' : 'BUMP TO READY'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildOnlineFeed() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Marketplace Orders', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const Text('Swiggy, Zomato, ONDC Multi-ID orders', style: TextStyle(fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 14),
        _buildOnlineCard('SWIGGY', 'SWG-8942', 'Rolls & Bowls Co.', '2x Double Egg Roll, 1x Coke', 480, Colors.orange),
        _buildOnlineCard('ZOMATO', 'ZOM-4419', 'Biryani Express', '1x Mutton Biryani, 1x Naan', 820, Colors.red),
        _buildOnlineCard('ONDC', 'ONDC-9120', 'Biryani Express', '2x Chicken Tikka, 2x Roomali', 690, Colors.blue),
      ],
    );
  }

  Widget _buildOnlineCard(String platform, String orderId, String brand, String items, int amt, MaterialColor color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: Colors.grey.shade200)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Chip(
                label: Text(platform, style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold)),
                backgroundColor: color,
                padding: EdgeInsets.zero,
                visualDensity: VisualDensity.compact,
              ),
              Text('₹$amt', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            ],
          ),
          Text(brand, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
          Text(items, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEA580C), foregroundColor: Colors.white),
            onPressed: () {},
            child: const Text('⚡ Accept & Send to KDS', style: TextStyle(fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildOwnerStats() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFF0F172A), Color(0xFF1E293B)]),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("Today's Revenue", style: TextStyle(color: Colors.white70, fontSize: 13)),
              SizedBox(height: 6),
              Text("₹48,250", style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
              SizedBox(height: 6),
              Text("+18% vs Yesterday • 112 Bills Settled", style: TextStyle(color: Colors.greenAccent, fontSize: 12)),
            ],
          ),
        ),
      ],
    );
  }
}
