---
name: "shadcn Button Patterns"
description: "Use when creating or modifying buttons, button-like links, action controls, or responsive icon-only controls in TSX."
applyTo:
  - "src/**/*.tsx"
---

# Button Patterns

Use the shadcn `Button` (`@/src/components/ui/button`) consistently across
public, authentication, and authenticated UI. Choose one variant and only the
size, layout, and icon modifiers required by the control.

## Action hierarchy

- Primary mutations and form submits: default variant.
- Ordinary secondary actions (cancel, import, back): `variant="secondary"` or `variant="outline"`.
- Destructive actions: `variant="destructive"`.
- Shell toggles, menu items and low-emphasis actions: `variant="ghost"`.
- Inline text actions: `variant="link"`.

## Sizes

`xs`, `sm`, default, `lg`, plus `icon`, `icon-xs`, `icon-sm`, `icon-lg` for
icon-only buttons. Icon-only buttons must have an accessible name.

## Links as buttons

This project uses base-ui, so there is no `asChild`. Use `buttonVariants`:

```tsx
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { buttonVariants } from "@/src/components/ui/button";

<Link href="/despesas/nova" className={buttonVariants()}>
  <PlusIcon data-icon="inline-start" aria-hidden="true" />
  Nova despesa
</Link>
```

## Icons and loading

- Icons come from `lucide-react` and are placed with `data-icon="inline-start"` or `"inline-end"`; never add `size-*` classes to them.
- There is no `isLoading` prop. Compose `Spinner` and `disabled`:

```tsx
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting && <Spinner data-icon="inline-start" />}
  {isSubmitting ? "Salvando..." : "Salvar"}
</Button>
```

## Responsive icon-only controls

Hide the label on small screens with `sr-only`/`sm:not-sr-only` or switch size
with responsive classes, keeping an `aria-label` whenever the text is hidden.

Do not use raw colors or override variant colors through `className`.
