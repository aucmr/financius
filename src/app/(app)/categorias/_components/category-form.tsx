"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, SaveIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createCategoryAction,
  updateCategoryAction,
} from "@/src/app/(app)/categorias/actions";
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "@/src/app/(app)/categorias/_lib/schemas";
import type { ManagedCategory } from "@/src/app/(app)/categorias/_lib/types";
import {
  CATEGORY_ICON_OPTIONS,
  getDefaultCategoryAppearance,
  type CategoryKindValue,
} from "@/src/lib/categories/catalog";
import { Button } from "@/src/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/src/components/ui/native-select";
import { Spinner } from "@/src/components/ui/spinner";

type CategoryFormProps = {
  kind: CategoryKindValue;
  category?: ManagedCategory;
  onCancel?: () => void;
  onSaved?: () => void;
};

export function CategoryForm({
  kind,
  category,
  onCancel,
  onSaved,
}: CategoryFormProps) {
  const router = useRouter();
  const defaults = getDefaultCategoryAppearance(kind);
  const initialIcon =
    CATEGORY_ICON_OPTIONS.find(({ value }) => value === category?.icon)?.value ??
    defaults.icon;
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name ?? "",
      color: category?.color ?? defaults.color,
      icon: initialIcon,
    },
  });
  const inputId = category ? `category-name-${category.id}` : `new-category-${kind}`;
  const colorId = category ? `category-color-${category.id}` : `new-category-color-${kind}`;
  const iconId = category ? `category-icon-${category.id}` : `new-category-icon-${kind}`;

  useEffect(() => {
    reset({
      name: category?.name ?? "",
      color: category?.color ?? defaults.color,
      icon:
        CATEGORY_ICON_OPTIONS.find(({ value }) => value === category?.icon)
          ?.value ?? defaults.icon,
    });
  }, [
    category?.color,
    category?.icon,
    category?.name,
    defaults.color,
    defaults.icon,
    reset,
  ]);

  async function onSubmit(values: CategoryFormValues) {
    const result = category
      ? await updateCategoryAction({ categoryId: category.id, ...values })
      : await createCategoryAction({ kind, ...values });

    if (!result.ok) {
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        if (field === "name" || field === "color" || field === "icon") {
          setError(field, { message });
        }
      }

      toast.error(result.message);
      return;
    }

    toast.success(result.message);

    if (category) {
      onSaved?.();
    } else {
      reset({
        name: "",
        color: defaults.color,
        icon: defaults.icon,
      });
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <FieldGroup className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor={inputId}>Nome da categoria</FieldLabel>
          <Input
            id={inputId}
            maxLength={80}
            aria-invalid={errors.name ? true : undefined}
            placeholder="Ex.: Moradia"
            {...register("name")}
          />
          {errors.name?.message ? (
            <FieldError>{errors.name.message}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={errors.color ? true : undefined}>
          <FieldLabel htmlFor={colorId}>Cor</FieldLabel>
          <Input
            id={colorId}
            type="color"
            aria-invalid={errors.color ? true : undefined}
            {...register("color")}
          />
          {errors.color?.message ? (
            <FieldError>{errors.color.message}</FieldError>
          ) : (
            <FieldDescription>Identifica a categoria nas despesas.</FieldDescription>
          )}
        </Field>

        <Field data-invalid={errors.icon ? true : undefined}>
          <FieldLabel htmlFor={iconId}>Ícone</FieldLabel>
          <NativeSelect
            id={iconId}
            className="w-full"
            aria-invalid={errors.icon ? true : undefined}
            {...register("icon")}
          >
            {CATEGORY_ICON_OPTIONS.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {errors.icon?.message ? (
            <FieldError>{errors.icon.message}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Spinner data-icon="inline-start" />
          ) : category ? (
            <SaveIcon data-icon="inline-start" aria-hidden="true" />
          ) : (
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
          )}
          {isSubmitting
            ? "Salvando..."
            : category
              ? "Salvar categoria"
              : "Adicionar categoria"}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            <XIcon data-icon="inline-start" aria-hidden="true" />
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
