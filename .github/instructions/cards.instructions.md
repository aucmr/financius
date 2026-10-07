---
name: "shadcn Card Patterns"
description: "Use when creating or modifying cards, metric surfaces, empty states, form panels, or other structured visual content in TSX."
applyTo:
  - "src/**/*.tsx"
---

# Card Patterns

Use the shadcn `Card` (`@/src/components/ui/card`) as the standard neutral
content surface with its full composition:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Titulo</CardTitle>
    <CardDescription>Descricao</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>
</Card>
```

## Rules

- Do not dump everything inside `CardContent`; use header, title and description.
- Use `size="sm"` for compact metric cards and lay metric groups out with a responsive grid (`grid gap-4 sm:grid-cols-3`).
- Put an action on the right of a header with `CardAction` or grid placement classes.
- Do not nest cards or wrap each row of a dense table in a card. Put the `Table` inside a single card (`CardContent className="p-0"`).
- Use `Empty` (`EmptyHeader`, `EmptyTitle`, `EmptyDescription`) for empty states, `Alert` for callouts and `Badge` for status labels.
- Use semantic tokens such as `bg-muted` and `text-muted-foreground`; never raw colors.
- Use `gap-*` for spacing, not `space-y-*`.
