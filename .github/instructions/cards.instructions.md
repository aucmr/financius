---
name: "FlyonUI Card Patterns"
description: "Use when creating or modifying cards, metric surfaces, empty states, form panels, or other structured visual content in TSX."
applyTo:
  - "src/**/*.tsx"
---

# Card Patterns

Use FlyonUI card primitives to create consistent, readable surfaces without
turning every section into a floating container. Start with the local pattern
that best matches the content, then add only the modifiers needed for the
specific layout.

## Standard surfaces

- Neutral content surface: `card bg-base-100 shadow-md`.
- Card content: `card-body`.
- Card heading: `card-title`.
- Metric group: `stats` with `stat` children, following the dashboard pattern.
- Intentional bordered card: add `card-border` only when the border communicates
  meaning; do not add `border border-base-300` to every card.
- Intentional callout: a card may use a dashed border or tinted background when
  it represents attention, setup, or status rather than ordinary content.

The default FlyonUI card already supplies its radius, base surface, and card
shadow. Prefer the shared component classes over repeating custom radius,
border, and shadow utilities. Use `card-sm`, `card-md`, `card-lg`, or `card-xl`
only when the content density requires a deliberate size choice.

## Composition

Use the optional card parts only when the content has a real semantic split:

- `card-header` for a distinct heading/control region.
- `card-body` for the primary content region.
- `card-actions` for actions associated with the card content.
- `card-footer` for a distinct closing or metadata region.

Do not add empty structural parts just to match an example. Do not place a card
inside another card. Keep page headings and global toolbar controls outside a
card unless they belong exclusively to that card's content.

## Empty states

Use `card bg-base-100 shadow-md` with `card-body` for a meaningful empty state
when the page needs a contained, centered surface. Keep the message specific,
provide the next useful action when one exists, and preserve an accessible
heading or description.

Do not use FlyonUI empty-card behavior that requires JavaScript unless the
project has explicitly initialized the required runtime. A static `card` and
`card-body` composition is the default for this application.

## Forms and metric groups

Use cards to separate substantial form panels or independent pieces of content.
Keep the form action row outside the panels when the actions submit the whole
form. Preserve field validation, loading, and error states while changing only
the surface composition.

Use one `stats` shell for related metrics rather than three unrelated card
surfaces. Keep each `stat` child focused on one value, label, and description,
and preserve responsive orientation at the breakpoint established by the
nearby reference component.

## Tables and dense data

Do not turn every dense row or data item into an individual card. A populated
table may live inside one card when the page needs a contained surface. In that
case, keep the section title and page-level count outside the card, use
`card-body p-0` to avoid unnecessary padding, and preserve a nested
`overflow-x-auto` wrapper for small screens.

If a table needs a contained empty state, the empty branch may use the same
card convention as the populated branch. Keep the two states intentional and
testable, and preserve the table's minimum width and row grouping.

## Responsive and accessibility rules

- Choose stable layout constraints so cards do not resize unexpectedly as labels,
  loading text, or actions change.
- Keep content readable at mobile widths; use responsive grids or stacking rather
  than shrinking text until it becomes difficult to scan.
- Maintain heading hierarchy inside cards and do not use a card as a substitute
  for semantic sections.
- Preserve accessible names, descriptions, and keyboard order for card actions.
- Use links for navigation and buttons for mutations, following the button
  policy in `.github/instructions/buttons.instructions.md`.
- Do not change routes, copy, data behavior, or action callbacks merely to
  standardize a card surface.

## Local references

Use these existing components as visual references before inventing a new card
composition:

- `src/app/(app)/dashboard/_components/dashboard-overview.tsx` for `stats`,
  neutral cards, and responsive metric groups.
- `src/app/(app)/_components/financial-section-page.tsx` for a centered empty
  state using `card-body`.
