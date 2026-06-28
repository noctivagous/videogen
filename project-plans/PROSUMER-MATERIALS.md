# Prosumer materials & controls

VideoGen uses a small set of **material tiers** and **control variants** so chrome reads as physical surfaces (matte planes, relief buttons, inset wells, floating menus) instead of flat web UI.

Class names live in [`app/globals.css`](../app/globals.css) (`@layer components`). Constants: [`lib/constants/prosumer-surfaces.ts`](../lib/constants/prosumer-surfaces.ts).

## Material tiers

| Tier | Class | Depth | Typical use |
|------|-------|-------|-------------|
| **Matte plane** | `pro-surface-matte`, `pro-toolbar`, `pro-panel` | Flat | Header bar, side panel background, legend tags |
| **Inset** | `pro-surface-inset`, `pro-inset-box`, `pro-field`, `pro-header-legend` | Recessed | Text fields, value pills, inspector rails, prompt wells |
| **Group well** | `pro-group` | Slight recess | Labeled parameter fieldsets in side panels |
| **Relief** | `pro-surface-relief`, `pro-btn`, `pro-trigger` | Raised | Clickable controls attached to a surface |
| **Floating relief** | `pro-menu`, `pro-popover` | Raised + drop shadow | Dropdowns, context menus, autocomplete, hover previews |
| **Matte glass (lifted)** | `pro-matte-glass` | Raised matte on inset parent | Header provider badges, model group picker on legend rails |
| **Pane + titlebar** | `pro-pane`, `pro-pane-titlebar`, `pro-pane-body` | Inset body + matte title strip | Side panel sections (Mannequins, Lighting, etc.) |

**Rule of thumb:** content *in* the UI plane uses **inset** or **group wells**; things you *push* use **relief**; controls sitting on inset rails use **pro-matte-glass** (lifted, not carved in); things that *detach* and float above use **pro-menu** / **pro-popover**. Never use inset styling for dropdown panels — menus should read as raised cards. Form `<select>` / `pro-field` stays **inset** inside pane bodies.

## Control variants

Use more than one button style so hierarchy stays clear:

| Variant | Classes | When |
|---------|---------|------|
| **Standard relief** | `pro-btn` (+ `pro-btn--compact`) | Nav arrows, folder icon, segment toggles, generic actions |
| **Tint relief** | `pro-btn pro-btn--tint` + launcher inline styles | App launcher split control, accent-colored chrome |
| **Ghost relief** | `pro-btn pro-btn--ghost-relief` | Secondary actions in dense toolbars |
| **Icon relief** | `pro-btn pro-btn--icon pro-btn--compact` | Square icon-only controls |
| **Brand CTA** | `pro-btn pro-btn--brand` | Generate, bake, primary workflow commits |
| **Wide trigger** | `pro-trigger` | Project switcher — relief button with rich content |
| **Matte glass opener** | `pro-matte-glass` | Provider badges, model group picker on inset header rails |
| **Menu item** | `pro-menu-item` (+ `--active`, `--destructive`) | Rows inside `pro-menu` panels |

Active/selected toggle states: `pro-btn--active` or `pro-btn.active` (brand gradient).

## Composition examples

```
Header toolbar (matte)
  └─ Legend rail (inset) pro-header-legend
       └─ Project trigger (relief) pro-trigger
       └─ Folder button (relief) pro-btn pro-btn--compact
  └─ Launcher split (tint relief) pro-btn pro-btn--tint
  └─ Dropdown panel (floating relief) pro-menu
       └─ Row pro-menu-item
```

```
Side panel (matte) pro-panel
  └─ Fieldset (group well) workflow-step-fieldset / pro-group
       └─ Label pro-label
       └─ Select trigger (inset) pro-field
       └─ Slider track (inset) + thumb (relief)
```

## Migration checklist

When adding or restyling UI:

1. Pick the **material tier** first (matte / inset / relief / floating).
2. Pick a **control variant** from the table — avoid defaulting everything to plain `pro-btn`.
3. Dropdown `role="menu"` panels → `pro-menu`, not `pro-inset-box` or flat `bg-surface-800`.
4. Menu rows → `pro-menu-item`, not bare `hover:bg-surface-700`.
5. Wide openers with thumbnails/labels → `pro-trigger`.
6. Small ephemeral panels → `pro-popover`.

## Tokens

Core CSS variables on `:root`: `--pro-bg`, `--pro-panel`, `--pro-group`, `--pro-inset`, `--pro-btn-top/bot`, `--pro-brand`, etc. Prefer these over one-off hex in new styles.

## GUI textures (xAI)

Tileable JPGs in [`public/textures/gui/`](../public/textures/gui/), generated via `npm run textures:gui` from [`public/stock/app-styling/gui-textures-prompts.json`](../public/stock/app-styling/gui-textures-prompts.json).

| File | Applied to |
|------|------------|
| `toolbar-matte.jpg` | `.pro-toolbar` |
| `panel-matte.jpg` | `.pro-panel`, `.glass` |
| `panel-matte.jpg` | Also used on `.pro-field`, `.pro-inset-box`, `.pro-pane`, legend rails (not `inset-well`) |
| `matte-glass.jpg` | `.pro-matte-glass` |
| `relief-button.jpg` | `.pro-btn`, `.pro-menu`, `.pro-trigger`, visual dropdown triggers |
| `pane-titlebar.jpg` | `.pro-pane-titlebar` |
| `workspace-bg.jpg` | `#studio-preview-panel` |

Textures tile at `--pro-tex-tile` (128px) under a color scrim gradient so base hues stay on-token.

## Scrollbars

Global prosumer scrollbars in `app/globals.css` apply to all scrollable regions (vertical and horizontal):

- **Track** — recessed groove (`--pro-track-top/bot`), inset shadow
- **Thumb** — beveled relief cap (`--pro-scroll-thumb-top/bot`), matches range-slider thumbs
- **Size** — `--pro-scroll-size` (10px)

Firefox: `scrollbar-width: thin` + `scrollbar-color`. WebKit: `*::-webkit-scrollbar` with both `width` and `height` set so vertical and horizontal bars share the same track/thumb styling.