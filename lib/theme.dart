import 'package:flutter/material.dart';

/// 紫色系主题
class AppColors {
  static const primary = Color(0xFF7C4DFF);
  static const primaryDeep = Color(0xFF5E35B1);
  static const primarySoft = Color(0xFFEDE7F6);
  static const bg = Color(0xFFF6F4FA);
  static const legalRed = Color(0xFFF3C9C9);
  static const adjustOrange = Color(0xFFFDF3E3);
  static const customBlue = Color(0xFFCDDDF5);
  static const leavePurple = Color(0xFFD5CBEE);
  static const offGray = Color(0xFFF1F2F4);
}

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: AppColors.primary,
    primary: AppColors.primary,
    secondary: AppColors.primaryDeep,
    surface: Colors.white,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: AppColors.bg,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      centerTitle: true,
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: Color(0xFFE3DDF2)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: AppColors.primarySoft,
      iconTheme: WidgetStateProperty.resolveWith((s) => IconThemeData(
            color: s.contains(WidgetState.selected)
                ? AppColors.primary
                : Colors.grey,
          )),
      labelTextStyle: WidgetStateProperty.resolveWith((s) => TextStyle(
            fontSize: 12,
            fontWeight: s.contains(WidgetState.selected)
                ? FontWeight.bold
                : FontWeight.w400,
            color: s.contains(WidgetState.selected)
                ? AppColors.primaryDeep
                : Colors.grey,
          )),
    ),
    chipTheme: ChipThemeData(
      side: const BorderSide(color: AppColors.primary),
      backgroundColor: Colors.white,
      selectedColor: AppColors.primary,
      checkmarkColor: Colors.white,
      labelStyle: const TextStyle(color: AppColors.primaryDeep, fontSize: 12),
      secondaryLabelStyle: const TextStyle(color: Colors.white, fontSize: 12),
      shape: const StadiumBorder(),
    ),
  );
}
