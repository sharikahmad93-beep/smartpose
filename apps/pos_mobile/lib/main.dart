import 'package:flutter/material.dart';
import 'models/models.dart';

void main() {
  runApp(const SmartRestaurantUnifiedApp());
}

class SmartRestaurantUnifiedApp extends StatelessWidget {
  const SmartRestaurantUnifiedApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smart Restaurant POS Hub',
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
      home: const UnifiedAppRootScreen(),
    );
  }
}

class UnifiedAppRootScreen extends StatefulWidget {
  const UnifiedAppRootScreen({super.key});

  @override
  State<UnifiedAppRootScreen> createState() => _UnifiedAppRootScreenState();
}

class _UnifiedAppRootScreenState extends State<UnifiedAppRootScreen> {
  // Current active role in the single codebase
  AppRole _currentRole = AppRole.waiter;

  // Navigation indices for sub-views
  int _waiterTabIndex = 0; // 0: Tables, 1: Order, 2: KOTs
  int _managerTabIndex = 0; // 0: Cash/Shift, 1: 86 Stock, 2: Floor Audit
  String _kdsStationFilter = 'ALL';

  // Selected Table for Waiter Ordering
  DiningTable? _selectedTable;

  // Sample Live Tables Data
  final List<DiningTable> _tables = [
    DiningTable(id: 't1', name: 'T-01', section: 'Main AC Hall', capacity: 2, status: 'OCCUPIED', runningAmount: 640, activeGuests: 2, elapsedMinutes: 24),
    DiningTable(id: 't2', name: 'T-02', section: 'Main AC Hall', capacity: 4, status: 'VACANT'),
    DiningTable(id: 't3', name: 'T-03', section: 'Main AC Hall', capacity: 4, status: 'OCCUPIED', runningAmount: 1850, activeGuests: 4, elapsedMinutes: 42),
    DiningTable(id: 't4', name: 'T-04', section: 'Main AC Hall', capacity: 6, status: 'BILLING', runningAmount: 3200, activeGuests: 5, elapsedMinutes: 65),
    DiningTable(id: 'g1', name: 'G-01', section: 'Garden Lawn', capacity: 4, status: 'OCCUPIED', runningAmount: 1120, activeGuests: 3, elapsedMinutes: 18),
    DiningTable(id: 'g2', name: 'G-02', section: 'Garden Lawn', capacity: 4, status: 'VACANT'),
    DiningTable(id: 'r1', name: 'R-01', section: 'Rooftop Lounge', capacity: 8, status: 'OCCUPIED', runningAmount: 4950, activeGuests: 7, elapsedMinutes: 55),
    DiningTable(id: 'r2', name: 'R-02', section: 'Rooftop Lounge', capacity: 4, status: 'VACANT'),
  ];

  // Master Menu Catalog
  final List<MenuItem> _menu = [
    MenuItem(id: 'm1', name: 'Special Mutton Dum Biryani', category: 'Biryani', price: 380, isVeg: false, inStock: true, description: 'Tender baby goat handi biryani with mirchi ka salan'),
    MenuItem(id: 'm2', name: 'Royal Chicken Dum Biryani', category: 'Biryani', price: 290, isVeg: false, inStock: true, description: 'Fragrant saffron basmati with spiced chicken'),
    MenuItem(id: 'm3', name: 'Nawabi Paneer Dum Biryani', category: 'Biryani', price: 240, isVeg: true, inStock: true, description: 'Fresh malai paneer dum biryani with raita'),
    MenuItem(id: 'm4', name: 'Chicken 65 (Crispy Andhra)', category: 'Tandoor', price: 260, isVeg: false, inStock: true, description: 'Curry leaves & mustard tempered crispy chicken'),
    MenuItem(id: 'm5', name: 'Tandoori Paneer Tikka', category: 'Tandoor', price: 230, isVeg: true, inStock: true, description: 'Charred spiced cottage cheese skewers'),
    MenuItem(id: 'm6', name: 'Murgh Malai Kebab', category: 'Tandoor', price: 280, isVeg: false, inStock: false, description: 'Melt-in-mouth cream marinated chicken (86 Stock)'),
    MenuItem(id: 'm7', name: 'Butter Naan', category: 'Breads', price: 50, isVeg: true, inStock: true, description: 'Soft tandoori leavened bread with butter'),
    MenuItem(id: 'm8', name: 'Garlic Herb Naan', category: 'Breads', price: 65, isVeg: true, inStock: true, description: 'Roasted garlic & coriander naan'),
    MenuItem(id: 'm9', name: 'Hot Gulab Jamun (2 Pcs)', category: 'Desserts', price: 80, isVeg: true, inStock: true, description: 'Warm khoya dumplings in saffron syrup'),
    MenuItem(id: 'm10', name: 'Irani Masala Chai', category: 'Beverages', price: 40, isVeg: true, inStock: true, description: 'Slow brewed cardamom cutting chai'),
  ];

  // Waiter Active Cart
  final List<CartItem> _cart = [];

  // Live KOTs for Kitchen KDS
  final List<KotTicket> _kots = [
    KotTicket(
      id: 'k1',
      kotNumber: 104,
      tableName: 'T-03',
      time: '13:42',
      status: 'COOKING',
      items: [
        CartItem(dish: MenuItem(id: 'm1', name: 'Special Mutton Dum Biryani', category: 'Biryani', price: 380, isVeg: false), quantity: 2, notes: 'Spicy / Double Masala'),
        CartItem(dish: MenuItem(id: 'm7', name: 'Butter Naan', category: 'Breads', price: 50, isVeg: true), quantity: 3),
      ],
    ),
    KotTicket(
      id: 'k2',
      kotNumber: 105,
      tableName: 'G-01',
      time: '13:51',
      status: 'COOKING',
      items: [
        CartItem(dish: MenuItem(id: 'm4', name: 'Chicken 65 (Crispy Andhra)', category: 'Tandoor', price: 260, isVeg: false), quantity: 1, notes: 'Extra crispy with onions'),
        CartItem(dish: MenuItem(id: 'm2', name: 'Royal Chicken Dum Biryani', category: 'Biryani', price: 290, isVeg: false), quantity: 1),
      ],
    ),
    KotTicket(
      id: 'k3',
      kotNumber: 106,
      tableName: 'R-01',
      time: '13:55',
      status: 'COOKING',
      items: [
        CartItem(dish: MenuItem(id: 'm5', name: 'Tandoori Paneer Tikka', category: 'Tandoor', price: 230, isVeg: true), quantity: 2),
        CartItem(dish: MenuItem(id: 'm10', name: 'Irani Masala Chai', category: 'Beverages', price: 40, isVeg: true), quantity: 4),
      ],
    ),
  ];

  String _selectedCategory = 'ALL';
  String _searchQuery = '';
  bool _onlyVeg = false;

  void _showRoleSwitcherSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Switch Role / Mode',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.orange.shade200),
                    ),
                    child: const Text(
                      '1 Single Codebase',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFEA580C)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'This single app compiles to Android & iOS with role-based UI views:',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 16),
              _buildRoleTile(
                role: AppRole.waiter,
                title: 'Captain / Waiter App',
                subtitle: 'Table Floor Map, Fast KOT Punching, Modifiers (PIN: 1111)',
                icon: Icons.table_restaurant,
                color: Colors.blue,
              ),
              _buildRoleTile(
                role: AppRole.kitchen,
                title: 'Kitchen KDS App',
                subtitle: 'Order Bump Bar, Station Routing, Prep Timers (PIN: 2222)',
                icon: Icons.kitchen,
                color: Colors.amber.shade800,
              ),
              _buildRoleTile(
                role: AppRole.manager,
                title: 'Store Manager App',
                subtitle: 'Shift Opening/Closing, 86 Item Stock Toggle, Void/Discount (PIN: 3333)',
                icon: Icons.badge,
                color: Colors.purple,
              ),
              _buildRoleTile(
                role: AppRole.owner,
                title: 'Owner Analytics App',
                subtitle: 'Live Net Revenue, Swiggy/Zomato Splits, Multi-outlet P&L (PIN: 9999)',
                icon: Icons.analytics,
                color: const Color(0xFF059669),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRoleTile({
    required AppRole role,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    final isSelected = _currentRole == role;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isSelected ? color.withOpacity(0.08) : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSelected ? color : Colors.grey.shade200,
          width: isSelected ? 2 : 1,
        ),
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withOpacity(0.15),
          child: Icon(icon, color: color, size: 22),
        ),
        title: Text(
          title,
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: isSelected ? color : Colors.black87),
        ),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 11)),
        trailing: isSelected ? Icon(Icons.check_circle, color: color) : null,
        onTap: () {
          setState(() {
            _currentRole = role;
          });
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Switched to ${role.title}'),
              duration: const Duration(seconds: 1),
              behavior: SnackBarBehavior.floating,
            ),
          );
        },
      ),
    );
  }

  void _addToCart(MenuItem item) {
    if (!item.inStock) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Colors.red.shade700,
          content: Text('${item.name} is 86\'d (Out of Stock)! Ask Manager to restock.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

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
        duration: const Duration(milliseconds: 600),
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
          kotNumber: 100 + _kots.length + 1,
          tableName: _selectedTable!.name,
          time: '${TimeOfDay.now().hour}:${TimeOfDay.now().minute.toString().padLeft(2, '0')}',
          items: List.from(_cart),
        ),
      );
      _cart.clear();
      _waiterTabIndex = 2; // Jump to KOT tracking
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF15803D),
        content: Text('⚡ KOT #${_kots.first.kotNumber} Dispatched to Kitchen & KDS!'),
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
                  _currentRole.title,
                  style: const TextStyle(fontSize: 11, color: Color(0xFFFB923C), fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ],
        ),
        actions: [
          // Role Switcher Button in Header
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: InkWell(
              onTap: _showRoleSwitcherSheet,
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withOpacity(0.2)),
                ),
                child: Row(
                  children: [
                    Text(
                      _currentRole.badge,
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const Icon(Icons.arrow_drop_down, color: Colors.white70, size: 18),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      body: _buildRoleSpecificView(),
      bottomNavigationBar: _buildBottomBarForRole(),
    );
  }

  Widget _buildRoleSpecificView() {
    switch (_currentRole) {
      case AppRole.waiter:
        return _buildWaiterView();
      case AppRole.kitchen:
        return _buildKitchenKdsView();
      case AppRole.manager:
        return _buildManagerView();
      case AppRole.owner:
        return _buildOwnerView();
    }
  }

  Widget? _buildBottomBarForRole() {
    if (_currentRole == AppRole.waiter) {
      return NavigationBar(
        selectedIndex: _waiterTabIndex,
        onDestinationSelected: (idx) => setState(() => _waiterTabIndex = idx),
        destinations: [
          const NavigationDestination(icon: Icon(Icons.table_restaurant_outlined), selectedIcon: Icon(Icons.table_restaurant), label: 'Tables'),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: _cart.isNotEmpty,
              label: Text('${_cart.fold(0, (sum, i) => sum + i.quantity)}'),
              child: const Icon(Icons.restaurant_menu_outlined),
            ),
            selectedIcon: const Icon(Icons.restaurant_menu),
            label: 'Punch Menu',
          ),
          NavigationDestination(
            icon: Badge(label: Text('${_kots.length}'), child: const Icon(Icons.receipt_long_outlined)),
            selectedIcon: const Icon(Icons.receipt_long),
            label: 'Active KOTs',
          ),
        ],
      );
    } else if (_currentRole == AppRole.manager) {
      return NavigationBar(
        selectedIndex: _managerTabIndex,
        onDestinationSelected: (idx) => setState(() => _managerTabIndex = idx),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.account_balance_wallet_outlined), selectedIcon: Icon(Icons.account_balance_wallet), label: 'Shift Drawer'),
          NavigationDestination(icon: Icon(Icons.block_outlined), selectedIcon: Icon(Icons.block), label: '86 Stock Toggle'),
          NavigationDestination(icon: Icon(Icons.fact_check_outlined), selectedIcon: Icon(Icons.fact_check), label: 'Floor Audit'),
        ],
      );
    }
    // Kitchen and Owner views don't need sub-navigation bars as they have full-screen dashboards
    return null;
  }

  // ===========================================================================
  // 1. WAITER / CAPTAIN APP VIEW
  // ===========================================================================
  Widget _buildWaiterView() {
    switch (_waiterTabIndex) {
      case 0:
        return _buildTablesView();
      case 1:
        return _buildOrderView();
      case 2:
      default:
        return _buildActiveKotsView();
    }
  }

  Widget _buildTablesView() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Restaurant Floor Layout', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                Text(
                  _selectedTable != null ? 'Selected: ${_selectedTable!.name} (${_selectedTable!.section})' : 'Tap any table to start punch',
                  style: TextStyle(fontSize: 12, color: _selectedTable != null ? const Color(0xFFEA580C) : Colors.grey),
                ),
              ],
            ),
            if (_selectedTable != null)
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFEA580C),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                icon: const Icon(Icons.arrow_forward, size: 16),
                label: const Text('Open Menu', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                onPressed: () => setState(() => _waiterTabIndex = 1),
              ),
          ],
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 0.88,
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
                  _waiterTabIndex = 1; // Go to Order screen
                });
              },
              borderRadius: BorderRadius.circular(14),
              child: Container(
                decoration: BoxDecoration(
                  color: isSel
                      ? const Color(0xFFFFEDD5)
                      : isOcc
                          ? const Color(0xFFFEE2E2)
                          : isBill
                              ? const Color(0xFFFEF3C7)
                              : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSel ? const Color(0xFFEA580C) : Colors.grey.shade300,
                    width: isSel ? 2 : 1,
                  ),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4, offset: const Offset(0, 2)),
                  ],
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
                          radius: 5,
                          backgroundColor: isOcc ? Colors.red : isBill ? Colors.amber : Colors.green,
                        ),
                      ],
                    ),
                    Text(t.section, style: const TextStyle(fontSize: 9, color: Colors.grey)),
                    if (isOcc || isBill) ...[
                      Text('₹${t.runningAmount.toInt()}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      Text('${t.elapsedMinutes}m • ${t.activeGuests} Guests', style: TextStyle(fontSize: 9, color: Colors.grey.shade700)),
                    ] else ...[
                      Text('${t.capacity} Seats', style: TextStyle(fontSize: 10, color: Colors.grey.shade600)),
                      const Text('VACANT', style: TextStyle(fontSize: 9, color: Colors.green, fontWeight: FontWeight.bold)),
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
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          color: Colors.white,
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      onChanged: (val) => setState(() => _searchQuery = val),
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.search, size: 20),
                        hintText: 'Search dishes or punch code...',
                        hintStyle: const TextStyle(fontSize: 13),
                        isDense: true,
                        contentPadding: const EdgeInsets.all(10),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade300)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilterChip(
                    label: const Text('Veg', style: TextStyle(fontSize: 11)),
                    selected: _onlyVeg,
                    onSelected: (val) => setState(() => _onlyVeg = val),
                    avatar: Icon(Icons.eco, size: 14, color: _onlyVeg ? Colors.white : Colors.green),
                    selectedColor: Colors.green,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: ['ALL', 'Biryani', 'Tandoor', 'Breads', 'Desserts', 'Beverages'].map((cat) {
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
                  borderRadius: BorderRadius.circular(14),
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
                          Text(dish.description, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Text('₹${dish.price.toInt()}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                              const SizedBox(width: 8),
                              if (!dish.inStock)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(color: Colors.red.shade100, borderRadius: BorderRadius.circular(4)),
                                  child: const Text('86\'D OUT OF STOCK', style: TextStyle(fontSize: 9, color: Colors.red, fontWeight: FontWeight.bold)),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: dish.inStock ? const Color(0xFFEA580C) : Colors.grey,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: dish.inStock ? () => _addToCart(dish) : null,
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
                      Text('${_selectedTable?.name ?? "Table"} • ${_cart.length} Dishes', style: const TextStyle(fontSize: 11, color: Colors.grey)),
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

  Widget _buildActiveKotsView() {
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
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: kot.status == 'READY' ? Colors.green.shade100 : Colors.amber.shade100,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      kot.status,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: kot.status == 'READY' ? Colors.green.shade800 : Colors.amber.shade900,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 16),
              ...kot.items.map((it) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('${it.quantity}x ${it.dish.name}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                        if (it.notes != null)
                          Text('(${it.notes})', style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Colors.orange)),
                      ],
                    ),
                  )),
            ],
          ),
        );
      },
    );
  }

  // ===========================================================================
  // 2. KITCHEN APP (KDS - KITCHEN DISPLAY SYSTEM)
  // ===========================================================================
  Widget _buildKitchenKdsView() {
    return Column(
      children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              const Text('KDS Station:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(width: 8),
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: ['ALL', 'Biryani', 'Tandoor', 'Breads', 'Beverages'].map((stn) {
                      final isSel = _kdsStationFilter == stn;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ChoiceChip(
                          label: Text(stn, style: TextStyle(fontSize: 11, color: isSel ? Colors.white : Colors.black87)),
                          selected: isSel,
                          selectedColor: const Color(0xFF0F172A),
                          onSelected: (_) => setState(() => _kdsStationFilter = stn),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: _kots.length,
            separatorBuilder: (_, __) => const SizedBox(height: 14),
            itemBuilder: (context, idx) {
              final kot = _kots[idx];
              final isReady = kot.status == 'READY';

              return Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isReady ? Colors.green : const Color(0xFFEA580C),
                    width: 2,
                  ),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 3)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Ticket Header
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: isReady ? Colors.green.shade50 : const Color(0xFFFFF7ED),
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Text(
                                'KOT #${kot.kotNumber}',
                                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                              ),
                              const SizedBox(width: 10),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: Colors.grey.shade300),
                                ),
                                child: Text(
                                  kot.tableName,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                              ),
                            ],
                          ),
                          Row(
                            children: [
                              const Icon(Icons.timer_outlined, size: 16, color: Colors.grey),
                              const SizedBox(width: 4),
                              Text(kot.time, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    // Ticket Items
                    Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ...kot.items.map((it) => Padding(
                                padding: const EdgeInsets.symmetric(vertical: 4),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF0F172A),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        '${it.quantity}x',
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            it.dish.name,
                                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                                          ),
                                          if (it.notes != null)
                                            Text(
                                              'Chef Note: ${it.notes}',
                                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.orange.shade800),
                                            ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              )),
                          const SizedBox(height: 12),
                          // Bump Bar Button
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: isReady ? Colors.green : const Color(0xFFEA580C),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              icon: Icon(isReady ? Icons.check_circle : Icons.done_all, size: 18),
                              label: Text(
                                isReady ? 'COMPLETED & SERVED' : 'BUMP TO READY (COOKED)',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              onPressed: () {
                                setState(() {
                                  kot.status = isReady ? 'COOKING' : 'READY';
                                });
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // ===========================================================================
  // 3. STORE MANAGER APP VIEW
  // ===========================================================================
  Widget _buildManagerView() {
    switch (_managerTabIndex) {
      case 0:
        return _buildManagerShiftView();
      case 1:
        return _buildManagerStockToggleView();
      case 2:
      default:
        return _buildManagerFloorAuditView();
    }
  }

  Widget _buildManagerShiftView() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFF0F172A), Color(0xFF1E293B)]),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Active Shift #108', style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 13)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: Colors.green.shade900, borderRadius: BorderRadius.circular(6)),
                    child: const Text('OPEN', style: TextStyle(color: Colors.greenAccent, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Text('Total Shift Collection', style: TextStyle(color: Colors.white70, fontSize: 12)),
              const SizedBox(height: 4),
              const Text('₹53,250', style: TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.bold)),
              const Divider(color: Colors.white24, height: 24),
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Opening Float: ₹5,000', style: TextStyle(color: Colors.white70, fontSize: 11)),
                  Text('Cash In Drawer: ₹18,400', style: TextStyle(color: Colors.white70, fontSize: 11)),
                  Text('UPI / Cards: ₹29,850', style: TextStyle(color: Colors.white70, fontSize: 11)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text('Manager Quick Approvals', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        _buildActionTile(
          icon: Icons.discount,
          title: 'Apply Special Discount (10% / 20%)',
          subtitle: 'Authorize customer goodwill or VIP discount on active bill',
          btnText: 'Apply',
          onTap: () {},
        ),
        _buildActionTile(
          icon: Icons.cancel_presentation,
          title: 'Void / Cancel Bill Request',
          subtitle: 'Table T-04 requested cancellation (Requires Manager PIN)',
          btnText: 'Review',
          onTap: () {},
        ),
        _buildActionTile(
          icon: Icons.move_up,
          title: 'Transfer / Merge Tables',
          subtitle: 'Shift running KOT from Table G-01 to T-02',
          btnText: 'Shift',
          onTap: () {},
        ),
      ],
    );
  }

  Widget _buildManagerStockToggleView() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('86 Out-of-Stock Kill Switch', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const Text('Instantly turn items ON/OFF across Captain Handheld POS, KDS & Swiggy/Zomato', style: TextStyle(fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 16),
        ..._menu.map((dish) {
          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(dish.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      Text('${dish.category} • ₹${dish.price.toInt()}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                    ],
                  ),
                ),
                Switch(
                  value: dish.inStock,
                  activeColor: Colors.green,
                  onChanged: (val) {
                    setState(() {
                      final idx = _menu.indexWhere((m) => m.id == dish.id);
                      if (idx >= 0) {
                        _menu[idx] = MenuItem(
                          id: dish.id,
                          name: dish.name,
                          category: dish.category,
                          price: dish.price,
                          isVeg: dish.isVeg,
                          inStock: val,
                          description: dish.description,
                        );
                      }
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('${dish.name} is now ${val ? "IN STOCK" : "86-D (OUT OF STOCK)"}'),
                        duration: const Duration(seconds: 1),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildManagerFloorAuditView() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Live Staff & Attendance', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        _buildStaffTile('Ramesh Gowda', 'Captain / Waiter', 'Active • Table T-01, T-03', Colors.blue),
        _buildStaffTile('Suresh Nair', 'Captain / Waiter', 'Active • Table G-01, G-02', Colors.blue),
        _buildStaffTile('Chef Altaf', 'Head Chef (Biryani Station)', 'Active • KDS Station #1', Colors.amber.shade800),
        _buildStaffTile('Priya Sharma', 'Front Cashier', 'Shift #108 Open', Colors.purple),
      ],
    );
  }

  Widget _buildStaffTile(String name, String role, String status, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
      child: Row(
        children: [
          CircleAvatar(backgroundColor: color.withOpacity(0.15), child: Icon(Icons.person, color: color, size: 20)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                Text(role, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.bold)),
                Text(status, style: const TextStyle(fontSize: 10, color: Colors.grey)),
              ],
            ),
          ),
          const Icon(Icons.check_circle, color: Colors.green, size: 18),
        ],
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required String btnText,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
      child: Row(
        children: [
          CircleAvatar(backgroundColor: Colors.orange.shade50, child: Icon(icon, color: const Color(0xFFEA580C), size: 20)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                Text(subtitle, style: const TextStyle(fontSize: 10, color: Colors.grey)),
              ],
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0F172A),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: onTap,
            child: Text(btnText, style: const TextStyle(fontSize: 11)),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // 4. OWNER ANALYTICS APP VIEW
  // ===========================================================================
  Widget _buildOwnerView() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Hero Revenue Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFF0F172A), Color(0xFF1E293B)]),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4)),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("Today's Net Revenue", style: TextStyle(color: Colors.white70, fontSize: 13)),
                  Text("LIVE SYNC", style: TextStyle(color: Colors.greenAccent, fontSize: 10, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 8),
              const Text("₹48,250", style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900)),
              const SizedBox(height: 6),
              const Text("+18.4% vs Yesterday • 112 Bills Settled", style: TextStyle(color: Colors.greenAccent, fontSize: 12)),
              const Divider(color: Colors.white24, height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildStatPill('Avg Bill (AOV)', '₹430'),
                  _buildStatPill('Food Cost', '28.5%'),
                  _buildStatPill('Net Margin', '24.2%'),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Channel Distribution
        const Text('Sales Channel Breakdown', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        _buildChannelRow('Dine-In (AC & Lawn)', '₹27,985', '58%', Colors.blue),
        _buildChannelRow('Swiggy Direct', '₹11,580', '24%', Colors.orange),
        _buildChannelRow('Zomato Online', '₹6,755', '14%', Colors.red),
        _buildChannelRow('Takeaway Counter', '₹1,930', '4%', Colors.purple),

        const SizedBox(height: 16),
        // Multi-Outlet Comparison
        const Text('Multi-Outlet Performance', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        _buildOutletCard('Biryani Express - Flagship Indiranagar', '₹48,250', '112 Orders', 'TOP PERFORMER', Colors.green),
        _buildOutletCard('Biryani Express - Koramangala Hub', '₹34,120', '84 Orders', 'ON TARGET', Colors.blue),
        _buildOutletCard('Biryani Express - HSR Cloud Kitchen', '₹28,900', '71 Orders', 'GROWING', Colors.purple),
      ],
    );
  }

  Widget _buildStatPill(String label, String val) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white60, fontSize: 10)),
        const SizedBox(height: 2),
        Text(val, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }

  Widget _buildChannelRow(String name, String amount, String share, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              CircleAvatar(radius: 5, backgroundColor: color),
              const SizedBox(width: 8),
              Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            ],
          ),
          Row(
            children: [
              Text(amount, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(6)),
                child: Text(share, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 10)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOutletCard(String outlet, String sales, String orders, String tag, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: Colors.grey.shade200)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(outlet, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 2),
                Text('$sales • $orders', style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(6)),
            child: Text(tag, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 9)),
          ),
        ],
      ),
    );
  }
}
