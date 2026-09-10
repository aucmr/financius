---
name: "FlyonUI Button Patterns"
description: "Use when creating or modifying buttons, button-like links, action controls, or responsive icon-only controls in TSX."
applyTo:
  - "src/**/*.tsx"
---

# Button Patterns

Use FlyonUI button classes consistently across public, authentication, and
authenticated UI. Start with `btn`, then add one semantic color or style and
only the size, layout, icon, or responsive modifiers required by the control.

## Action hierarchy

- Primary mutations and form submits: `btn btn-primary`.
- Ordinary secondary actions such as cancel, edit, navigation, or logout:
  `btn btn-soft btn-secondary`.
- Destructive actions: use an error variant such as
  `btn btn-soft btn-error`; keep destructive icon controls compact when they
  appear in a table.
- Shell and disclosure controls such as the mobile menu or sidebar collapse:
  `btn btn-text` with `btn-square` or `btn-circle` when icon-only.

Do not combine conflicting visual or semantic variants such as
`btn-primary btn-ghost`. Keep `btn-soft`, `btn-outline`, and `btn-text` as
style choices that are intentionally paired with a semantic color when the
control needs one.

## Common recipes

```tsx
<button type="submit" className="btn btn-primary" disabled={isSubmitting}>
  {isSubmitting ? "Saving..." : "Save"}
</button>

<Link href="/items" className="btn btn-soft btn-secondary">
  Cancel
</Link>

<button
  type="button"
  className="btn btn-soft btn-error btn-square btn-sm"
  aria-label="Delete item"
  title="Delete item"
>
  <span className="icon-[tabler--trash] size-4" aria-hidden="true" />
</button>
```

Preserve existing `btn-sm`, `gap-*`, `btn-square`, `btn-circle`, and responsive
modifiers when they communicate the control's format. Keep the base/mobile
layout usable when a collapsed desktop state uses an icon-only presentation;
apply icon-only modifiers and hidden labels at the desktop breakpoint rather
than globally.

## Accessibility and state

- Use `type="button"` for non-submit buttons and `type="submit"` only for form submission.
- Give every icon-only control an accessible name with visible text, `aria-label`, or an equivalent labelled relationship.
- Keep `title` as supplemental text for unfamiliar icon-only controls; it does not replace an accessible name.
- Preserve disabled and loading states during asynchronous actions. A loading
  control must remain understandable and must not allow duplicate submission.
- Use links for navigation and buttons for mutations or in-place state changes;
  a link may use button classes when it is intentionally presented as an action.
- Do not change action copy, routes, callbacks, or confirmation behavior merely
  to standardize classes.
