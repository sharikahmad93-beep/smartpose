import 'package:flutter_test/flutter_test.dart';
import 'package:pos_mobile/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const SmartPosCaptainApp());
    expect(find.text('Biryani Express'), findsOneWidget);
  });
}
