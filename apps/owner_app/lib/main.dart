import 'package:flutter/material.dart';

void main() {
  runApp(const RestaurantOwnerApp());
}

class RestaurantOwnerApp extends StatelessWidget {
  const RestaurantOwnerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'POS Owner Companion',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFEA580C),
          primary: const Color(0xFFEA580C),
          surface: const Color(0xFF0F172A),
        ),
      ),
      home: const OwnerHomeScreen(),
    );
  }
}

class OwnerHomeScreen extends StatefulWidget {
  const OwnerHomeScreen({super.key});

  @override
  State<OwnerHomeScreen> createState() => _OwnerHomeScreenState();
}

class _OwnerHomeScreenState extends State<OwnerHomeScreen> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Owner Dashboard', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            Text('Multi-Outlet Live Analytics', style: TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {},
          ),
        ],
      ),
      body: _tab == 0 ? _buildAnalytics() : _tab == 1 ? _buildLiveOrders() : _build86Stock(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (idx) => setState(() => _tab = idx),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Analytics'),
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'Live Orders'),
          NavigationDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2), label: '86 Stock'),
        ],
      ),
    );
  }

  Widget _buildAnalytics() {
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
              Text("Today's Gross Sales", style: TextStyle(color: Colors.white70, fontSize: 12)),
              SizedBox(height: 6),
              Text("₹48,250", style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              Text("+18.4% vs Previous Day • 112 Orders Settled", style: TextStyle(color: Colors.greenAccent, fontSize: 12)),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text("Branch Performance", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        _buildBranchCard("Indiranagar Flagship", "₹32,400", "76 Bills", true),
        _buildBranchCard("Whitefield ITPL", "₹15,850", "36 Bills", true),
      ],
    );
  }

  Widget _buildBranchCard(String name, String rev, String orders, bool isOnline) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              Text(orders, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(rev, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              const Text("ONLINE", style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 10)),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildLiveOrders() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        Text("Marketplace Stream", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        SizedBox(height: 10),
        ListTile(
          tileColor: Colors.white,
          leading: Icon(Icons.delivery_dining, color: Colors.orange),
          title: Text("Swiggy SWG-8942 • ₹480"),
          subtitle: Text("Rolls & Bowls Co. • Cooking"),
        ),
        SizedBox(height: 8),
        ListTile(
          tileColor: Colors.white,
          leading: Icon(Icons.delivery_dining, color: Colors.red),
          title: Text("Zomato ZOM-4419 • ₹820"),
          subtitle: Text("Biryani Express • Dispatched"),
        ),
      ],
    );
  }

  Widget _build86Stock() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text("86 Dishes / Out of Stock Control", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const Text("Toggle switch to stop online orders immediately across platforms", style: TextStyle(fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 14),
        SwitchListTile(
          tileColor: Colors.white,
          title: const Text("Royal Chicken Dum Biryani"),
          subtitle: const Text("In Stock across POS & Zomato"),
          value: true,
          onChanged: (val) {},
        ),
        const SizedBox(height: 8),
        SwitchListTile(
          tileColor: Colors.white,
          title: const Text("Mutton Galouti Kebab"),
          subtitle: const Text("In Stock"),
          value: true,
          onChanged: (val) {},
        ),
      ],
    );
  }
}
