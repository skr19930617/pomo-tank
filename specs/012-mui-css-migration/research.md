# Research: MUI & CSS Framework Migration

**Feature**: 012-mui-css-migration
**Date**: 2026-03-26

## R1: MUI Version & React 19 Compatibility

**Decision**: Use MUI v6 (latest stable) which has first-class React 19 support.

**Rationale**:
- MUI v6 was released with React 19 support.
- MUI v5 also works with React 19 but v6 is the recommended path for new installations.
- The project uses React 19.2.4 — MUI v6 is the natural fit.

**Alternatives considered**:
- MUI v5 (rejected: older, v6 is current and better React 19 support)
- Chakra UI (rejected: user specifically requested MUI)
- Radix/shadcn (rejected: user specifically requested MUI)

## R2: CSS-in-JS Approach — Emotion with sx Prop

**Decision**: Use MUI's built-in `sx` prop as the primary styling method, with `styled()` for reusable components that appear in multiple places.

**Rationale**:
- The `sx` prop is MUI's recommended approach for component-level styling. It's concise, type-safe, and directly accesses theme values.
- Current inline styles are all component-local (no shared styled components). The `sx` prop is a direct 1:1 migration path from `style={{ ... }}` to `sx={{ ... }}`.
- For values that reference the theme (colors, typography), `sx` automatically resolves theme tokens.
- `styled()` is reserved for cases where the same style needs to be applied to multiple instances (e.g., a reusable StoreItemRow).

**Alternatives considered**:
- `styled()` only (rejected: more verbose for one-off styles, which is most of this codebase)
- CSS Modules (rejected: doesn't integrate with MUI's theme system)
- Tailwind (rejected: different paradigm, doesn't leverage MUI's component props)

## R3: MUI Theme Configuration

**Decision**: Create a custom dark MUI theme using `createTheme()` with the exact color palette currently hardcoded in inline styles.

**Rationale**:
- All current colors are hardcoded hex values scattered across components. Centralizing them in a theme ensures consistency and enables one-place changes.
- MUI's theme supports custom palette extensions, so we can add project-specific color slots (e.g., `palette.debug.main` for the orange debug accent).
- Typography is set to 'PixelFont' with fallback to monospace, matching the current @font-face setup.

**Theme palette mapping**:
| Current Usage | Hex Value | MUI Theme Location |
|---------------|-----------|-------------------|
| Main background | `#181825` | `palette.background.default` |
| Panel/card background | `#2a2a40` | `palette.background.paper` |
| Settings body | `#222238` | Custom `palette.background.panel` |
| Primary text | `#ccccdd` | `palette.text.primary` |
| Secondary text | `#aabbcc` | `palette.text.secondary` |
| Bright text | `#eeeeff` | Custom `palette.text.bright` |
| Border color | `#444466` | Custom `palette.border.main` |
| Dark border | `#333355` | Custom `palette.border.dark` |
| Buy/success bg | `#2a4a2a` | `palette.success.dark` |
| Buy/success text | `#aaddaa` | `palette.success.light` |
| Buy/success border | `#448844` | `palette.success.main` |
| Locked bg | `#333` | `palette.action.disabledBackground` |
| Locked text | `#777` | `palette.action.disabled` |
| Debug accent | `#ff6633` | Custom `palette.debug.main` |
| Debug bg | `#2a1a10` | Custom `palette.debug.dark` |
| Debug text | `#ffcc88` | Custom `palette.debug.light` |
| Fish cost color | `#88aacc` | Custom `palette.info.light` |
| Notification bg | `rgba(40,40,60,0.9)` | Custom or Snackbar override |

## R4: MUI Component Mapping

**Decision**: Map current HTML elements to MUI components as follows.

| Current | MUI Replacement | Notes |
|---------|----------------|-------|
| `<button>` (Store, Buy, etc.) | `<Button>` | variant="outlined" or "contained", disableRipple for pixel aesthetic |
| `<button>` (Close "X") | `<IconButton>` | With Close icon or text |
| `<input type="number">` | `<TextField>` | type="number", size="small", InputProps for dark styling |
| Store overlay (`<div>` abs pos) | `<Drawer>` or `<Dialog>` fullScreen | Drawer (anchor="top") preserves scroll behavior |
| Settings collapsible | `<Accordion>` | With `<AccordionSummary>` and `<AccordionDetails>` |
| Notification toast | `<Snackbar>` | With auto-hide duration, anchorOrigin top-center |
| Layout `<div>`s | `<Box>` | sx prop for flexbox layouts |
| Text `<span>` | `<Typography>` | variant="body2" or custom |
| `<label>` | `<Typography>` or `<InputLabel>` | Depends on context |

## R5: Esbuild Compatibility with Emotion

**Decision**: No esbuild config changes needed. Emotion works out of the box with esbuild's `jsx: 'automatic'` setting.

**Rationale**:
- esbuild already uses `jsx: 'automatic'` (React 17+ transform).
- Emotion's CSS-in-JS generates `<style>` tags at runtime, which is allowed by the existing CSP (`style-src 'unsafe-inline'`).
- No Babel plugins needed — MUI v6 + Emotion works with standard JSX transform.
- The IIFE bundle format is compatible with Emotion's runtime style injection.

**Alternatives considered**:
- Adding Emotion's Babel plugin for css prop (rejected: not needed, sx prop doesn't require it)

## R6: CSS File Strategy

**Decision**: Strip `style.css` down to only global resets and canvas-specific rules. All component styling moves to MUI theme + sx prop.

**Rationale**:
- Current style.css contains ~194 lines mixing global resets, canvas rules, and component styles (`.action-btn`, `.store-item`, etc.).
- Most CSS classes are unused by the React components (they use inline styles instead). The CSS classes appear to be legacy.
- Only 3 essential rules need to remain: universal reset, body base styles, and `canvas { image-rendering: pixelated }`.
- The @font-face declaration moves to the MUI theme or remains in the HTML template (already injected inline by tank-panel.ts).

**What remains in style.css**:
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
canvas { image-rendering: pixelated; image-rendering: crisp-edges; }
```
Body styling handled by CssBaseline + theme.
