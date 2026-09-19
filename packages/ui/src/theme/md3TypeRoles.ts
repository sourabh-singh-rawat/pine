export type Md3TypeRole = {
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  lineHeight: number;
};

export type Md3TypeRoleName =
  | "displayLarge"
  | "displayMedium"
  | "displaySmall"
  | "headlineLarge"
  | "headlineMedium"
  | "headlineSmall"
  | "titleLarge"
  | "titleMedium"
  | "titleSmall"
  | "bodyLarge"
  | "bodyMedium"
  | "bodySmall"
  | "labelLarge"
  | "labelMedium"
  | "labelSmall";

export const md3TypeRoles = {
  displayLarge: {
    fontSize: 57,
    fontWeight: 400,
    letterSpacing: -0.25,
    lineHeight: 1.12,
  },
  displayMedium: {
    fontSize: 45,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.16,
  },
  displaySmall: {
    fontSize: 36,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.22,
  },
  headlineLarge: {
    fontSize: 32,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.25,
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.29,
  },
  headlineSmall: {
    fontSize: 24,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.33,
  },
  titleLarge: {
    fontSize: 22,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.27,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: 500,
    letterSpacing: 0.15,
    lineHeight: 1.5,
  },
  titleSmall: {
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: 0.1,
    lineHeight: 1.43,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: 400,
    letterSpacing: 0.5,
    lineHeight: 1.5,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: 0.25,
    lineHeight: 1.43,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: 0.4,
    lineHeight: 1.33,
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: 0.1,
    lineHeight: 1.43,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: 0.5,
    lineHeight: 1.33,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: 0.5,
    lineHeight: 1.45,
  },
} satisfies Record<Md3TypeRoleName, Md3TypeRole>;

export type Md3TypeRoles = typeof md3TypeRoles;
