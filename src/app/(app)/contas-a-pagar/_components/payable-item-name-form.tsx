"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createPayableItemAction,
  renamePayableItemAction,
} from "@/src/app/(app)/contas-a-pagar/actions";
import {
  payableItemFormSchema,
  type PayableItemFormValues,
} from "@/src/app/(app)/contas-a-pagar/_lib/schemas";
import { Button } from "@/src/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Spinner } from "@/src/components/ui/spinner";

type PayableItemNameFormProps = {
  itemId?: string;
  initialName?: string;
};

export function PayableItemNameForm({
  itemId,
  initialName,
}: PayableItemNameFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PayableItemFormValues>({
    resolver: zodResolver(payableItemFormSchema),
    defaultValues: { name: initialName ?? "" },
  });
  const inputId = itemId ? `payable-item-name-${itemId}` : "new-payable-item-name";

  useEffect(() => {
    reset({ name: initialName ?? "" });
  }, [initialName, reset]);

  async function onSubmit(values: PayableItemFormValues) {
    const result = itemId
      ? await renamePayableItemAction({ itemId, ...values })
      : await createPayableItemAction(values);

    if (!result.ok) {
      const nameError = result.fieldErrors?.name;

      if (nameError) {
        setError("name", { message: nameError });
      }

      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    reset({ name: itemId ? values.name : "" });
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      noValidate
    >
      <FieldGroup className="min-w-0 flex-1">
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel
            htmlFor={inputId}
            className={itemId ? "sr-only" : undefined}
          >
            Nome do item
          </FieldLabel>
          <Input
            id={inputId}
            type="text"
            maxLength={80}
            aria-invalid={errors.name ? true : undefined}
            placeholder={itemId ? undefined : "Ex.: Internet"}
            {...register("name")}
          />
          {errors.name?.message ? (
            <FieldError>{errors.name.message}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <Spinner data-icon="inline-start" />
        ) : itemId ? (
          <SaveIcon data-icon="inline-start" aria-hidden="true" />
        ) : (
          <PlusIcon data-icon="inline-start" aria-hidden="true" />
        )}
        {isSubmitting ? "Salvando..." : itemId ? "Salvar" : "Adicionar item"}
      </Button>
    </form>
  );
}
