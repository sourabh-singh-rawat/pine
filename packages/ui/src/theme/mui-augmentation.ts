import type { CSSProperties } from "react";
import type {} from "@mui/material/styles";
import type {} from "@mui/material/styles/createTheme";
import type {} from "@mui/material/Typography";
import type {} from "@mui/system";

declare module "@mui/system" {
  interface Shape {
    borderRadiusNone: string;
    borderRadiusExtraSmall: string;
    borderRadiusSmall: string;
    borderRadiusMedium: string;
    borderRadiusLarge: string;
    borderRadiusLargeIncreased: string;
    borderRadiusExtraLarge: string;
    borderRadiusExtraLargeIncreased: string;
    borderRadiusExtraExtraLarge: string;
    borderRadiusRounded: string;
  }
}

declare module "@mui/material/styles" {
  interface Shape {
    borderRadiusNone: string;
    borderRadiusExtraSmall: string;
    borderRadiusSmall: string;
    borderRadiusMedium: string;
    borderRadiusLarge: string;
    borderRadiusLargeIncreased: string;
    borderRadiusExtraLarge: string;
    borderRadiusExtraLargeIncreased: string;
    borderRadiusExtraExtraLarge: string;
    borderRadiusRounded: string;
  }

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

declare module "@mui/material/styles/createTheme" {
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

export type MuiAugmentation = true;
