"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, SaveIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createSubcategoryAction,
  updateSubcategoryAction,
} from "@/src/app/(app)/categorias/actions";
import {
  subcategoryFormSchema,
  type SubcategoryFormValues,
} from "@/src/app/(app)/categorias/_lib/schemas";
import { Button } from "@/src/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Spinner } from "@/src/components/ui/spinner";

type SubcategoryFormProps = {
  categoryId: string;
  subcategoryId?: string;
  initialName?: string;
  onCancel?: () => void;
  onSaved?: () => void;
};

export function SubcategoryForm({
  categoryId,
  subcategoryId,
  initialName,
  onCancel,
  onSaved,
}: SubcategoryFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategoryFormSchema),
    defaultValues: { name: initialName ?? "" },
  });
  const inputId = subcategoryId
    ? `subcategory-name-${subcategoryId}`
    : `new-subcategory-${categoryId}`;

  useEffect(() => {
    reset({ name: initialName ?? "" });
  }, [initialName, reset]);

  async function onSubmit(values: SubcategoryFormValues) {
    const result = subcategoryId
      ? await updateSubcategoryAction({
          categoryId,
          subcategoryId,
          ...values,
        })
      : await createSubcategoryAction({ categoryId, ...values });

    if (!result.ok) {
      if (result.fieldErrors?.name) {
        setError("name", { message: result.fieldErrors.name });
      }

      toast.error(result.message);
      return;
    }

    toast.success(result.message);

    if (subcategoryId) {
      onSaved?.();
    } else {
      reset({ name: "" });
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 sm:flex-row sm:items-end" noValidate>
      <FieldGroup className="min-w-0 flex-1">
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor={inputId} className={subcategoryId ? "sr-only" : undefined}>
            Nome da subcategoria
          </FieldLabel>
          <Input
            id={inputId}
            maxLength={80}
            aria-invalid={errors.name ? true : undefined}
            placeholder="Ex.: Mercado"
            {...register("name")}
          />
          {errors.name?.message ? (
            <FieldError>{errors.name.message}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? (
            <Spinner data-icon="inline-start" />
          ) : subcategoryId ? (
            <SaveIcon data-icon="inline-start" aria-hidden="true" />
          ) : (
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
          )}
          {isSubmitting
            ? "Salvando..."
            : subcategoryId
              ? "Salvar"
              : "Adicionar"}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            size="sm"
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
