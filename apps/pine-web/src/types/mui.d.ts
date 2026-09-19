import type { CSSProperties } from "react";

declare module "@mui/material/styles" {
  interface TypographyVariants {
    displayLarge: CSSProperties;
    displayMedium: CSSProperties;
    displaySmall: CSSProperties;
    headlineLarge: CSSProperties;
    headlineMedium: CSSProperties;
    headlineSmall: CSSProperties;
    titleLarge: CSSProperties;
    titleMedium: CSSProperties;
    titleSmall: CSSProperties;
    bodyLarge: CSSProperties;
    bodyMedium: CSSProperties;
    bodySmall: CSSProperties;
    labelLarge: CSSProperties;
    labelMedium: CSSProperties;
    labelSmall: CSSProperties;
  }

  interface TypographyVariantsOptions {
    displayLarge?: CSSProperties;
    displayMedium?: CSSProperties;
    displaySmall?: CSSProperties;
    headlineLarge?: CSSProperties;
    headlineMedium?: CSSProperties;
    headlineSmall?: CSSProperties;
    titleLarge?: CSSProperties;
    titleMedium?: CSSProperties;
    titleSmall?: CSSProperties;
    bodyLarge?: CSSProperties;
    bodyMedium?: CSSProperties;
    bodySmall?: CSSProperties;
    labelLarge?: CSSProperties;
    labelMedium?: CSSProperties;
    labelSmall?: CSSProperties;
  }

  interface Theme {
    md3: {
      space: {
        dense: number;
        stack: number;
        section: number;
      };
    };
  }

  interface ThemeOptions {
    md3?: {
      space?: {
        dense?: number;
        stack?: number;
        section?: number;
      };
    };
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    displayLarge: true;
    displayMedium: true;
    displaySmall: true;
    headlineLarge: true;
    headlineMedium: true;
    headlineSmall: true;
    titleLarge: true;
    titleMedium: true;
    titleSmall: true;
    bodyLarge: true;
    bodyMedium: true;
    bodySmall: true;
    labelLarge: true;
    labelMedium: true;
    labelSmall: true;
  }
}
