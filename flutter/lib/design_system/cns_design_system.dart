/// CNS (Coflanet Design System)
///
/// Usage:
/// ```dart
/// import 'package:your_app/design_system/cns_design_system.dart';
///
/// // Using palette colors
/// Container(color: CnsPalette.violet50)
///
/// // Using semantic colors (light theme)
/// Text('Hello', style: TextStyle(color: CnsLightColors.labelNormal))
///
/// // Using spacing
/// Padding(padding: EdgeInsets.all(CnsSpacing.space16))
///
/// // Using radius
/// Container(
///   decoration: BoxDecoration(
///     borderRadius: BorderRadius.circular(CnsRadius.radius24),
///   ),
/// )
/// ```

library cns_design_system;

export 'cns_colors.dart';
export 'cns_semantic_colors.dart';
export 'cns_spacing.dart';
