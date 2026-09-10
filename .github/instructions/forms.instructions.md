---
name: "Forms with FlyonUI, React Hook Form, and Zod"
description: "Use when creating or modifying forms, Zod schemas, React Hook Form components, FlyonUI controls, validation feedback, or Server Actions."
applyTo:
  - "src/app/**/_components/**/*form*.tsx"
  - "src/app/**/_lib/schemas.ts"
  - "src/app/**/actions.ts"
---

# Form Patterns

Use Zod as the single source of truth for form input, React Hook Form for
client-side state and validation feedback, and FlyonUI classes for visual
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

## React Hook Form with FlyonUI

Forms that use React Hook Form must be Client Components. Connect the schema
with `zodResolver`, pass server-provided values through `defaultValues`, and
render field errors near the corresponding control.

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <label className="form-control w-full">
        <span className="label-text mb-1 font-medium">Nome</span>
        <input
          type="text"
          className="input input-bordered w-full"
          {...register("name")}
        />
        {errors.name?.message && (
          <span className="label-text-alt mt-1 text-error">
            {errors.name.message}
          </span>
        )}
      </label>

      <label className="form-control w-full">
        <span className="label-text mb-1 font-medium">Categoria</span>
        <select
          className="select select-bordered w-full"
          {...register("category")}
        >
          <option value="personal">Pessoal</option>
          <option value="business">Profissional</option>
        </select>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-box border border-base-300 p-3">
        <input
          type="checkbox"
          className="checkbox checkbox-primary"
          {...register("active")}
        />
        <span className="font-medium">Perfil ativo</span>
      </label>

      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
```

Use these FlyonUI patterns consistently:

- Text input: `form-control`, `label-text`, `input input-bordered w-full`.
- Select: `select select-bordered w-full`.
- Multiline input: `textarea textarea-bordered w-full`.
- Boolean input: `checkbox checkbox-primary` or `checkbox checkbox-secondary`.
- Submit action: `btn btn-primary`, disabled while `isSubmitting`.
- Validation message: `label-text-alt text-error` below the control.

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
