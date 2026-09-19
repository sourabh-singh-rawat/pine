---
name: material-design-3
description: >
  Material Design 3 playbook for Pine web UI (expressive color, type, shape,
  motion, layout, a11y) mapped to MUI/@pine/ui. Use when redesigning UI, theme
  tokens, or /material-design-3.
when-to-use: >
  M3, Material Design 3, expressive UI, theme tokens, redesign UI, pineShape,
  pinePalette, accessibility
---

# Material Design 3

Visual system only — not feature wiring. Prefer **M3 Expressive** unless the user asks for a utilitarian feel. Canonical source: [m3.material.io](https://m3.material.io/). Related: `web-feature`.

Stack: React + MUI + Emotion + `@pine/ui`. Tokens: `packages/ui/src/theme/` (`pineShape`, `pinePaletteLight`/`Dark`, `pineTypography`, `pineMotion`). Apps assemble `createTheme` in `apps/*/src/bootstrap/theme.tsx`. Tables: [references/tokens.md](./references/tokens.md), [references/mui-mapping.md](./references/mui-mapping.md).

## Goal for Pine

Build an **expressive** app: clear hierarchy, vivid but accessible color, emphasized type for key moments, intentional shape contrast, and springy motion on hero interactions — without clutter or gimmicks.

Usability first ([M3 usability](https://m3.material.io/foundations/usability)): guide attention with containment, size, shape, color, and type. Delight sparingly.

## Agent workflow

When implementing or redesigning UI:

1. **Read the surface** — layout, hierarchy, primary action, empty/error/loading states.
2. **Apply tokens, not one-off hex** — map to theme palette / shape / typography; extend the theme when a role is missing instead of hardcoding colors in components.
3. **Choose expression level** — baseline for dense work surfaces (lists, tables, sidebars); expressive for hero moments (empty states, success, onboarding, FABs, key CTAs, dialogs).
4. **Prefer MUI + `@pine/ui`** — compose existing primitives; restyle via theme `components` and `sx` using theme values. Do not add a second design kit.
5. **Verify** — desktop + mobile viewports; contrast; focus rings; reduced-motion path. Use browser tools when UI changed.
6. **Do not** invent parallel token names; align naming with M3 roles below when extending theme.

## Foundations

### Color

Use **roles**, not raw brand hex in feature code. M3 dynamic color builds a scheme from a source color into roles: primary / on-primary / primary-container / on-primary-container, secondary*, tertiary*, error*, surface / surface-container-* / on-surface / on-surface-variant, outline / outline-variant, inverse*, scrim, shadow.

Guidance:

- **Primary** — key actions and active states (Pine brand purple `#9147ff` is the current source seed; keep one primary).
- **Secondary / tertiary** — supporting accents and hierarchy; prefer contrast pairs over near-identical hues for emphasis ([usability](https://m3.material.io/foundations/usability)).
- **Surface containers** — nest elevation via surface tiers (`surface`, `surface-container-low` … `highest`), not heavy shadows. M3 reduces reliance on elevation shadows.
- **Error / success / warning** — semantic only; never reuse for decoration.
- **Outline** — dividers and unselected borders; prefer `outline-variant` for quiet separators.
- Always meet contrast for text/icons on their container (aim WCAG AA; prefer AAA for body text where practical).

Theme work: extend `palette` (and eventually CSS variables / `colorSchemes` if migrating) in `theme.tsx` rather than scattering `sx={{ color: "#…" }}`.

### Typography

M3 type scale: **15 baseline + 15 emphasized** roles across display, headline, title, body, label ([typography](https://m3.material.io/styles/typography)).

| Role family | Use |
| --- | --- |
| Display | Rare hero / empty-state titles |
| Headline | Page and section titles |
| Title | Card headers, dialog titles, nav section labels |
| Body | Reading content, list secondary lines |
| Label | Buttons, chips, dense UI, overlines |

**Emphasized** styles: stronger weight/optical sizing for priority moments (unread counts, primary CTA labels, recording/start actions). Do not emphasize everything — contrast makes emphasis work.

Pine today maps loosely to MUI `h1`–`h6` / `body1` / `body2` with Inter. When touching type:

- Prefer `Typography` variants from theme over ad-hoc `fontSize`.
- When extending theme, name custom variants after M3 roles (`titleMedium`, `labelLarge`, `bodyLargeEmphasized`) rather than one-off sizes.
- Keep line length readable; pair shape language with type geometry (rounded type ↔ softer corners, or deliberate contrast).

### Shape

Corner scale ([shape](https://m3.material.io/styles/shape)): none 0 → XS 4 → S 8 → M 12 → L 16 → L+ 20 → XL 28 → XL+ 32 → XXL 48 → full.

Pine `shape` tokens today (`borderRadiusSmall` … `borderRadiusRounded`) approximate this scale in rem — **map components to the scale consistently**:

| Component class | Typical corner |
| --- | --- |
| Dense list rows / inputs in toolbars | XS–S |
| Buttons, text fields, chips | full or M–L depending on variant |
| Cards, menus, popovers | M–XL |
| Dialogs / sheets | L–XL |
| FABs / pills / avatars | full |

Expressive tactics:

- Mix **round and sharper** corners to create tension and hierarchy (not every surface the same radius).
- Use the **shape library** (35 shapes) only on decorative crops, avatars, empty-state art — not on text-heavy panels.
- **Shape morph** for state changes (selected segment, loading indicator) when platform support exists; otherwise approximate with radius/width transitions using motion tokens.

### Motion

Default scheme for Pine: **Expressive** ([motion physics](https://m3.material.io/styles/motion/overview/how-it-works)).

- **Spatial springs** — position, size, rotation, corner radius (may overshoot / bounce).
- **Effects springs** — color, opacity (no overshoot).
- **Standard** scheme — utilitarian flows (settings, dense data); use when bounce would distract.

Transition patterns to prefer ([transitions](https://m3.material.io/styles/motion/transitions)):

1. Container transform (card → detail)
2. Forward / backward
3. Lateral
4. Top level (nav destinations)
5. Enter / exit
6. Skeleton loaders

Rules:

- Motion explains hierarchy and continuity; it is not decoration spam.
- Respect `prefers-reduced-motion`: replace spatial travel with cross-fade / instant.
- Durations: short controls ~100–200ms; large expressive transitions ~400–600ms; prefer springs over hand-tuned curves when available.
- Avoid implying fake elevation with scale/Z on enter-exit (M3 reduced elevation model).

In MUI: `theme.transitions`, `Collapse`/`Fade`/`Grow`, and CSS transitions via `sx`. Prefer theme transition durations/easings over magic numbers.

### Layout, containment, density

- **Containment** — group related content in surfaces with padding from the spacing scale (`theme.spacing`, 8px base).
- **Navigation** — clear landmark regions (nav rail / drawer / top app bar / main). Sidebar trees should remain scannable: baseline density, expressive only for selection/hover.
- **Touch / click targets** — ≥ 40×40 dp/px for interactive controls; do not let nested `ListItem` padding defaults steal clicks (see existing Spaces sidebar fix patterns).
- **Responsive** — reflow columns; collapse nav to rail/drawer; check mobile viewport when layout changes.
- **Empty / error / success** — use emphasized type + shape/color accents; keep copy short.

## Components (expression rules)

Apply across pine-web / identity-web / `@pine/ui`:

| Pattern | Expressive guidance |
| --- | --- |
| Primary button | Filled primary; emphasized label; clear hover/focus/pressed; one primary per region |
| Secondary / tertiary actions | Tonal, outlined, or text — lower visual weight |
| Icon buttons | 40+ target; tooltip; selected state uses container color, not only icon tint |
| FAB | Reserved for the single most important create/action on a screen |
| Lists / nav | Selected row: secondary container or primary container tint; avoid heavy shadows |
| Cards | Surface container; optional tonal border (`outline-variant`); clickable cards use container transform cues |
| Text fields | Outline or filled per density; error uses error role; helper text in `on-surface-variant` |
| Chips / filters | Filter chips show selected morph/container; input chips stay quieter |
| Dialogs / sheets | Scrim + surface; title = title role; actions right-aligned / stacked on narrow |
| Snackbars | Short, one action max; semantic color only when needed |
| Progress | Prefer expressive loading indicator / morph when available; otherwise linear/circular with primary |

Prefer `@pine/ui` buttons/modals/fields when they fit; restyle via theme rather than forking.

## States

Every interactive component needs: enabled, disabled, hover, focus-visible, pressed, and when relevant dragged / selected / error.

- Focus rings must remain visible (never `outline: none` without a replacement that meets contrast).
- Disabled: reduce opacity / use `on-surface` at lower emphasis; not low-contrast primary.
- Loading: preserve layout (skeletons or inline indicators); avoid layout jump.

## Accessibility

- Semantic HTML / MUI components with correct roles; do not replace buttons with non-focusable `div`s.
- Label icon-only controls (`aria-label` or tooltip that is keyboard accessible).
- Color is not the only signal — pair with icons/text.
- Hit targets and spacing for pointer and touch.
- Test keyboard order matches visual order.
- Live regions for urgent status when appropriate.

## Theme extension checklist

When evolving `theme.tsx` / `@pine/ui` toward fuller M3:

1. Seed primary (and optional secondary/tertiary) → generate role-like palette entries (`primaryContainer`, `onPrimary`, surface tiers) even if hand-maintained at first.
2. Align `shape` keys to the 10-step corner scale; document mapping in [references/tokens.md](./references/tokens.md).
3. Add typography variants for M3 roles used in product (at least title/body/label + emphasized pair for CTA/hero).
4. Set `components` defaultProps/`styleOverrides` once (Button, ListItemButton, Dialog, Chip, Fab, TextField) so features inherit expression.
5. Light + dark schemes stay role-parallel (same roles, different values).
6. Theme augmentations: module augmentation (already started for `Shape`), not type assertions.

## Canonical links

- [M3 home](https://m3.material.io/)
- [M3 Expressive overview](https://m3.material.io/blog/building-with-m3-expressive)
- [Color roles](https://m3.material.io/styles/color/roles)
- [Typography](https://m3.material.io/styles/typography)
- [Shape](https://m3.material.io/styles/shape)
- [Motion](https://m3.material.io/styles/motion/overview/how-it-works)
- [Components](https://m3.material.io/components)
- [Usability](https://m3.material.io/foundations/usability)
- [Accessibility](https://m3.material.io/foundations/accessible-design)

## Anti-patterns

- Hardcoded hex/rgb in feature components when a theme role exists or should exist
- Emphasizing every label, animating every list row, or decorative shapes on data tables
- A second component library, or copying Material Web components wholesale into React
- Ignoring reduced motion or focus visibility
- Screenshot-only verification when UI behavior changed

## Done when

- Tokens/roles come from theme / `@pine/ui`, not one-off hex in features
- Expression level matches surface density (baseline vs hero)
- Focus, contrast, and reduced-motion paths checked
- Desktop + mobile verified in browser when UI changed (`web-feature` for wiring)
