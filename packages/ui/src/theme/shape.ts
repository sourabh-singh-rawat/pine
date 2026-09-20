import "./mui-augmentation";

export type PineShape = {
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
};

export const pineShape = {
  borderRadiusNone: "0",
  borderRadiusExtraSmall: "0.25rem",
  borderRadiusSmall: "0.2rem",
  borderRadiusMedium: "0.4rem",
  borderRadiusLarge: "0.6rem",
  borderRadiusLargeIncreased: "1.25rem",
  borderRadiusExtraLarge: "1rem",
  borderRadiusExtraLargeIncreased: "2rem",
  borderRadiusExtraExtraLarge: "1.6rem",
  borderRadiusRounded: "9000px",
} satisfies PineShape;

type ThemeShapeSource = {
  shape: {
    borderRadius?: string | number;
    borderRadiusMedium?: string | number;
    borderRadiusExtraSmall?: string | number;
    borderRadiusSmall?: string | number;
    borderRadiusLarge?: string | number;
    borderRadiusExtraLarge?: string | number;
    borderRadiusRounded?: string | number;
  };
};

export const themeBorderRadiusMedium = (theme: ThemeShapeSource): string | number =>
  theme.shape.borderRadiusMedium ?? theme.shape.borderRadius ?? pineShape.borderRadiusMedium;

export const themeBorderRadiusExtraSmall = (theme: ThemeShapeSource): string | number =>
  theme.shape.borderRadiusExtraSmall ?? pineShape.borderRadiusExtraSmall;

export const themeBorderRadiusSmall = (theme: ThemeShapeSource): string | number =>
  theme.shape.borderRadiusSmall ?? pineShape.borderRadiusSmall;

export const themeBorderRadiusLarge = (theme: ThemeShapeSource): string | number =>
  theme.shape.borderRadiusLarge ?? pineShape.borderRadiusLarge;

export const themeBorderRadiusExtraLarge = (theme: ThemeShapeSource): string | number =>
  theme.shape.borderRadiusExtraLarge ?? pineShape.borderRadiusExtraLarge;

export const themeBorderRadiusRounded = (theme: ThemeShapeSource): string | number =>
  theme.shape.borderRadiusRounded ?? pineShape.borderRadiusRounded;
