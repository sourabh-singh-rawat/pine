# M3 patterns → MUI / `@pine/ui`

Pine does not ship Material Web. Express M3 through MUI theme + components and `@pine/ui`.

## Prefer these building blocks

| Need         | Use                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| App theme    | `apps/*/src/bootstrap/theme.tsx` — `createTheme`, `components` overrides                                 |
| Shared shape | `packages/ui/src/theme/shape.ts` (`pineShape`, `themeBorderRadiusMedium`)                                |
| Buttons      | `@pine/ui` `PrimaryButton` / `SecondaryButton` / `Button`, or MUI `Button`/`IconButton`/`Fab`            |
| Fields       | `@pine/ui` `TextField` / `Label`, or MUI `TextField`/`FormControl`                                       |
| Dialogs      | `@pine/ui` `Modal*` or MUI `Dialog`                                                                      |
| Lists / nav  | MUI `List`, `ListItemButton`, `Drawer`; avoid broken `secondaryAction` overlays on nested clickable rows |
| Feedback     | `notistack` + shared `SnackbarContent`; MUI `Alert`                                                      |
| Layout       | MUI `Stack`, `Box`, `Container`; CSS grid via `sx` when needed                                           |

## Component expression mapping

| M3 component idea         | MUI implementation notes                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| Filled button             | `variant="contained"` + primary; theme `borderRadius` full or large                                |
| Tonal button              | `variant="contained"` with `primary.container` background via override, or `soft` styling in theme |
| Outlined / text           | `outlined` / `text`; quieter for secondary actions                                                 |
| FAB                       | `Fab`; one per screen; extended FAB for labeled create                                             |
| Navigation drawer / rail  | `Drawer` permanent/temporary; selected item → `primaryContainer` / tonal bg                        |
| Top app bar               | `AppBar`/`Toolbar` on surface container; avoid heavy elevation shadow                              |
| Cards                     | `Paper`/`Card` with surface-container + optional `outline-variant` border                          |
| Chips                     | `Chip`; selected filter chips get container color                                                  |
| Switch / checkbox / radio | MUI selection controls; keep 40px targets                                                          |
| Menus                     | `Menu` — theme already bumps radius toward XL                                                      |
| Sheets                    | `Drawer` anchor bottom or `Dialog` fullWidth on small screens                                      |
| Progress                  | `CircularProgress` / `LinearProgress`; skeletons via MUI `Skeleton`                                |
| Tooltip                   | Shared `Tooltip` — ensure contrast on inverse surface                                              |

## Theme `components` overrides (preferred lever)

Put cross-app expression in `createTheme({ components: { … } })`:

- `MuiButton` — radius, text transform (M3 often keeps sentence case), padding, tonal variants
- `MuiListItemButton` — selected/hover container colors; keep ripple policy intentional
- `MuiDialog` / `MuiMenu` / `MuiPopover` — shape XL, scrim opacity
- `MuiTextField` / `MuiOutlinedInput` — outline-variant, focused primary
- `MuiChip` / `MuiFab` / `MuiIconButton` — targets and selected shapes
- `MuiCssBaseline` — font family, reduced-motion media query defaults if needed

Feature-level `sx` should only handle layout-specific exceptions.

## Anti-patterns in this codebase

- Nested clickable rows under `ListItem` `secondaryAction` without a flex layout — clicks get eaten.
- `disableRipple` everywhere while also removing focus styles — restore visible focus-visible.
- One-off hex in feature folders while `theme.palette` exists.
- Mixing a second icon or component pack inconsistently with MUI Icons.

## Verification

After UI changes: exercise the flow in the browser; check light/dark if both ship; desktop and mobile; keyboard focus; `prefers-reduced-motion` if you added motion.
