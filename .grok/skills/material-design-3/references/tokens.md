# M3 tokens ↔ Pine theme

Source of truth: `@pine/ui` (`packages/ui/src/theme/`). Apps assemble with `createTheme` in `apps/*/src/bootstrap/theme.tsx`.

```ts
import {
  pineShape,
  pinePaletteLight,
  pinePaletteDark,
  pineTypography,
  pineMotion,
  pineColorSeed,
} from "@pine/ui";
```

## Color roles

| Export             | Mode           |
| ------------------ | -------------- |
| `pineColorSeed`    | `#9147ff`      |
| `pinePaletteLight` | light role map |
| `pinePaletteDark`  | dark role map  |

Roles on each map: `primary`, `onPrimary`, `primaryContainer`, `onPrimaryContainer`, `secondary*`, `tertiary*`, `error*`, `surface`, `surfaceContainerLowest`…`Highest`, `onSurface`, `onSurfaceVariant`, `outline`, `outlineVariant`, `inverseSurface`, `inverseOnSurface`, `inversePrimary`, `scrim`.

Apps still own `createTheme({ palette })` today. Adopt roles in a follow-up (map into MUI `palette` / custom keys); do not hardcode hex in features when a role exists.

## Corner radius scale (`pineShape`)

| Key                               | Value     | M3 step               |
| --------------------------------- | --------- | --------------------- |
| `borderRadiusNone`                | `0`       | none                  |
| `borderRadiusExtraSmall`          | `0.25rem` | extra small (~4)      |
| `borderRadiusSmall`               | `0.2rem`  | small                 |
| `borderRadiusMedium`              | `0.4rem`  | medium                |
| `borderRadiusLarge`               | `0.6rem`  | large                 |
| `borderRadiusLargeIncreased`      | `1.25rem` | large increased       |
| `borderRadiusExtraLarge`          | `1rem`    | extra large           |
| `borderRadiusExtraLargeIncreased` | `2rem`    | extra large increased |
| `borderRadiusExtraExtraLarge`     | `1.6rem`  | extra extra large     |
| `borderRadiusRounded`             | `9000px`  | full                  |

MUI `Shape` is augmented in `@pine/ui` (`mui-augmentation.ts`). Helper: `themeBorderRadiusMedium(theme)`.

pine-web keeps app-local `borderWidth*` on `theme.shape`.

## Typography (`pineTypography`)

30 roles: `display|headline|title|body|label` × `Large|Medium|Small` × baseline + `Emphasized`.

Each style: `{ fontWeight, fontSize, lineHeight, letterSpacing }`. Font family stays app-owned (Inter / Noto Sans).

## Motion (`pineMotion`)

| Field                         | Content                           |
| ----------------------------- | --------------------------------- |
| `scheme`                      | `"expressive"` (default)          |
| `duration.short1`…`short4`    | 50–200 ms                         |
| `duration.medium1`…`medium4`  | 250–400 ms                        |
| `duration.long1`…`long4`      | 450–600 ms                        |
| `easing.emphasizedDecelerate` | `cubic-bezier(0.05, 0.7, 0.1, 1)` |
| `easing.emphasizedAccelerate` | `cubic-bezier(0.3, 0, 0.8, 0.15)` |
| `easing.standard`             | `cubic-bezier(0.2, 0, 0, 1)`      |

## Spacing

M3 uses a 4 dp grid; Pine themes use `spacing: 8`. Prefer `theme.spacing(1|1.5|2|3|4)`.
