import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:uravin/main.dart';
import 'package:uravin/providers/auth_provider.dart';
import 'package:uravin/providers/language_provider.dart';
import 'package:uravin/providers/ledger_provider.dart';

void main() {
  testWidgets('Uravin app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => LanguageProvider()),
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider(create: (_) => LedgerProvider()),
        ],
        child: const UravinApp(),
      ),
    );

    // Initial render smoke test passes
    expect(find.byType(UravinApp), findsOneWidget);
  });
}
