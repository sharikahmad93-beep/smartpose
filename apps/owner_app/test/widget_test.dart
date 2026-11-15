import 'package:flutter_test/flutter_test.dart';
import 'package:owner_app/main.dart';

void main() {
  testWidgets('Owner app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const RestaurantOwnerApp());
    expect(find.text('Owner Dashboard'), findsOneWidget);
  });
}
