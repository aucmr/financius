---
name: "Forms with shadcn, React Hook Form, and Zod"
description: "Use when creating or modifying forms, Zod schemas, React Hook Form components, shadcn controls, validation feedback, or Server Actions."
applyTo:
  - "src/app/**/_components/**/*form*.tsx"
  - "src/app/**/_lib/schemas.ts"
  - "src/app/**/actions.ts"
---

# Form Patterns

Use Zod as the single source of truth for form input, React Hook Form for
client-side state and validation feedback, and shadcn `Field` components for visual
controls. Keep the schema in the feature `_lib/schemas.ts` file and export its
inferred TypeScript type.

## Zod schema

```ts
import { z } from "zod";

export const profileFormSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome."),
    email: z.email("Informe um e-mail valido."),
    category: z.enum(["personal", "business"]),
    active: z.boolean(),
  })
  .strict();

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
```

Use `.strict()` for application forms so server-only fields such as `userId`,
`householdId`, timestamps, ownership and future-only fields are rejected when
sent by the client.

## React Hook Form with shadcn

Forms that use React Hook Form must be Client Components. Connect the schema
with `zodResolver`, pass server-provided values through `defaultValues`, and
render field errors near the corresponding control.

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/src/components/ui/native-select";
import { Spinner } from "@/src/components/ui/spinner";

import {
  profileFormSchema,
  type ProfileFormValues,
} from "@/src/app/profile/_lib/schemas";
import { saveProfileAction } from "@/src/app/profile/actions";

export function ProfileForm({
  initialValues,
}: {
  initialValues: ProfileFormValues;
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: initialValues,
  });

  async function onSubmit(values: ProfileFormValues) {
    const result = await saveProfileAction(values);

    if (!result.ok) {
      Object.entries(result.fieldErrors ?? {}).forEach(([field, message]) => {
        setError(field as keyof ProfileFormValues, { message });
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
          {errors.name?.message && <FieldError>{errors.name.message}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="category">Categoria</FieldLabel>
          <NativeSelect id="category" className="w-full" {...register("category")}>
            <NativeSelectOption value="personal">Pessoal</NativeSelectOption>
            <NativeSelectOption value="business">Profissional</NativeSelectOption>
          </NativeSelect>
        </Field>

        <Field orientation="horizontal">
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <Checkbox
                id="active"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
          />
          <FieldLabel htmlFor="active">Perfil ativo</FieldLabel>
        </Field>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </FieldGroup>
    </form>
  );
}
```

Use these shadcn patterns consistently:

- Layout: `FieldGroup` wrapping one `Field` per control; no `space-y-*` or raw `div` grids for the form itself.
- Text input: `FieldLabel` + `Input` (use `InputGroup`/`InputGroupAddon` for prefixes such as "R$").
- Select: `NativeSelect` with `NativeSelectOption`, compatible with `register`.
- Multiline input: `Textarea`.
- Boolean input: `Checkbox` driven by `Controller`.
- Validation: `data-invalid` on `Field`, `aria-invalid` on the control, and `FieldError` / `FieldDescription` below it.
- Submit action: default `Button`, disabled while `isSubmitting`, with `Spinner`.
- Feedback: `toast.success` / `toast.error` from `sonner`.

Do not register the same field as both a `select` and a `checkbox` in a real
form. Use the control matching the schema field type. HTML select values are
strings, so use a transform or controlled field when a select represents a
boolean.

For dependent selects, derive the options from the watched parent field and
clear the child field when its current value is no longer valid.

## Server Action boundary

Client-side validation improves the user experience but is not a security
boundary. Server Actions must accept `unknown`, parse the payload again with
the same Zod schema, and derive authenticated fields on the server.

```ts
"use server";

export async function saveProfileAction(values: unknown) {
  const parsed = profileFormSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false as const,
      message: "Confira os dados informados.",
      fieldErrors: getFieldErrors(parsed.error),
    };
  }

  const context = await getAuthContext();
  await updateProfile(context.userId, parsed.data);

  return { ok: true as const, message: "Perfil atualizado com sucesso." };
}
```

Never trust `userId`, `householdId`, ownership, authorization or audit fields
from the browser. Validate relationships and permissions again in the service
layer before calling the repository. Revalidate affected paths after a
successful mutation and return a discriminated `{ ok, message }` result so the
client can display success and field-level errors consistently.
