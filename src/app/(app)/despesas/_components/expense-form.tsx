"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCardIcon, SaveIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
    createExpenseAction,
    updateExpenseAction,
} from "@/src/app/(app)/despesas/actions";
import {
    expenseEditFormSchema,
    expenseFormSchema,
    type ExpenseFormValues,
} from "@/src/app/(app)/despesas/_lib/schemas";
import type { ExpenseOptions } from "@/src/app/(app)/despesas/_lib/types";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/src/components/ui/input-group";
import { NativeSelect, NativeSelectOption } from "@/src/components/ui/native-select";
import { Spinner } from "@/src/components/ui/spinner";
import { Textarea } from "@/src/components/ui/textarea";

type ExpenseFormProps = {
    expenseId?: string;
    options: ExpenseOptions;
    initialValues: ExpenseFormValues;
    householdName: string;
};

export function ExpenseForm({ expenseId, options, initialValues, householdName }: ExpenseFormProps) {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        control,
        setError,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseId ? expenseEditFormSchema : expenseFormSchema),
        defaultValues: initialValues,
    });
    const areaCategoryId = useWatch({ control, name: "areaCategoryId" });
    const areaSubcategoryId = useWatch({ control, name: "areaSubcategoryId" });
    const subcategories = options.areaCategories.find((category) => category.id === areaCategoryId)?.subcategories ?? [];

    useEffect(() => {
        reset(initialValues);
    }, [initialValues, reset]);

    useEffect(() => {
        const availableSubcategories = options.areaCategories.find((category) => category.id === areaCategoryId)?.subcategories ?? [];

        if (areaSubcategoryId && !availableSubcategories.some((subcategory) => subcategory.id === areaSubcategoryId)) {
            setValue("areaSubcategoryId", "");
        }
    }, [areaCategoryId, areaSubcategoryId, options.areaCategories, setValue]);

    async function onSubmit(values: ExpenseFormValues) {
        const result = expenseId
            ? await updateExpenseAction(expenseId, values)
            : await createExpenseAction(values);

        if (!result.ok) {
            Object.entries(result.fieldErrors ?? {}).forEach(([field, message]) => {
                setError(field as keyof ExpenseFormValues, { message });
            });
            toast.error(result.message);
            return;
        }

        toast.success(result.message);
        router.push("/despesas");
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Dados do lançamento</CardTitle>
                        <CardDescription>Registre uma saída para o household {householdName}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FieldGroup>
                            <Field data-invalid={errors.description ? true : undefined}>
                                <FieldLabel htmlFor="description">Descrição</FieldLabel>
                                <Input
                                    id="description"
                                    type="text"
                                    placeholder="Ex.: Mercado da semana"
                                    aria-invalid={errors.description ? true : undefined}
                                    {...register("description")}
                                />
                                {errors.description?.message ? <FieldError>{errors.description.message}</FieldError> : null}
                            </Field>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field data-invalid={errors.amount ? true : undefined}>
                                    <FieldLabel htmlFor="amount">Valor</FieldLabel>
                                    <InputGroup>
                                        <InputGroupAddon>
                                            <InputGroupText>R$</InputGroupText>
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            id="amount"
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="0,00"
                                            aria-invalid={errors.amount ? true : undefined}
                                            {...register("amount")}
                                        />
                                    </InputGroup>
                                    {errors.amount?.message ? <FieldError>{errors.amount.message}</FieldError> : null}
                                    {expenseId && <FieldDescription>Estornos importados podem permanecer com valor negativo.</FieldDescription>}
                                </Field>
                                <Field data-invalid={errors.date ? true : undefined}>
                                    <FieldLabel htmlFor="date">Data da despesa</FieldLabel>
                                    <Input id="date" type="date" aria-invalid={errors.date ? true : undefined} {...register("date")} />
                                    {errors.date?.message ? <FieldError>{errors.date.message}</FieldError> : null}
                                </Field>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                            <Field data-invalid={errors.areaCategoryId ? true : undefined}>
                                <FieldLabel htmlFor="areaCategoryId">Categoria de área</FieldLabel>
                                <NativeSelect id="areaCategoryId" className="w-full" aria-invalid={errors.areaCategoryId ? true : undefined} {...register("areaCategoryId")}>
                                    <NativeSelectOption value="">Selecione uma área</NativeSelectOption>
                                    {options.areaCategories.map((item) => (
                                        <NativeSelectOption key={item.id} value={item.id}>{item.name}</NativeSelectOption>
                                    ))}
                                </NativeSelect>
                                {errors.areaCategoryId?.message ? <FieldError>{errors.areaCategoryId.message}</FieldError> : null}
                            </Field>
                            <Field data-invalid={errors.areaSubcategoryId ? true : undefined}>
                                <FieldLabel htmlFor="areaSubcategoryId">Subcategoria</FieldLabel>
                                <NativeSelect id="areaSubcategoryId" className="w-full" aria-invalid={errors.areaSubcategoryId ? true : undefined} disabled={!areaCategoryId} {...register("areaSubcategoryId")}>
                                    <NativeSelectOption value="">Selecione uma subcategoria</NativeSelectOption>
                                    {subcategories.map((item) => (
                                        <NativeSelectOption key={item.id} value={item.id}>{item.name}</NativeSelectOption>
                                    ))}
                                </NativeSelect>
                                {errors.areaSubcategoryId?.message ? <FieldError>{errors.areaSubcategoryId.message}</FieldError> : null}
                            </Field>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                            <Field data-invalid={errors.profileCategoryId ? true : undefined}>
                                <FieldLabel htmlFor="profileCategoryId">Categoria de perfil</FieldLabel>
                                <NativeSelect id="profileCategoryId" className="w-full" aria-invalid={errors.profileCategoryId ? true : undefined} {...register("profileCategoryId")}>
                                    <NativeSelectOption value="">Selecione um perfil</NativeSelectOption>
                                    {options.profileCategories.map((item) => (
                                        <NativeSelectOption key={item.id} value={item.id}>{item.name}</NativeSelectOption>
                                    ))}
                                </NativeSelect>
                                {errors.profileCategoryId?.message ? <FieldError>{errors.profileCategoryId.message}</FieldError> : null}
                            </Field>
                            <Field data-invalid={errors.responsibleUserId ? true : undefined}>
                                <FieldLabel htmlFor="responsibleUserId">Responsável</FieldLabel>
                                <NativeSelect id="responsibleUserId" className="w-full" aria-invalid={errors.responsibleUserId ? true : undefined} {...register("responsibleUserId")}>
                                    <NativeSelectOption value="">Selecione uma pessoa</NativeSelectOption>
                                    {options.members.map((item) => (
                                        <NativeSelectOption key={item.id} value={item.id}>{item.name}</NativeSelectOption>
                                    ))}
                                </NativeSelect>
                                {errors.responsibleUserId?.message ? <FieldError>{errors.responsibleUserId.message}</FieldError> : null}
                            </Field>
                            </div>

                            <Field data-invalid={errors.notes ? true : undefined}>
                                <FieldLabel htmlFor="notes">
                                    Observações <span className="font-normal text-muted-foreground">(opcional)</span>
                                </FieldLabel>
                                <Textarea
                                    id="notes"
                                    className="min-h-24"
                                    placeholder="Detalhes úteis sobre este lançamento"
                                    aria-invalid={errors.notes ? true : undefined}
                                    {...register("notes")}
                                />
                                {errors.notes?.message ? <FieldError>{errors.notes.message}</FieldError> : null}
                            </Field>
                        </FieldGroup>
                    </CardContent>
                </Card>

                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="text-xl">Classificação</CardTitle>
                        <CardDescription>Use as marcações para organizar a leitura mensal.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FieldGroup>
                            <Controller
                                control={control}
                                name="shared"
                                render={({ field }) => (
                                    <Field orientation="horizontal">
                                        <Checkbox id="shared" name={field.name} checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                                        <FieldContent>
                                            <FieldLabel htmlFor="shared">Despesa compartilhada</FieldLabel>
                                            <FieldDescription>Entra no resumo de divisão do mês.</FieldDescription>
                                        </FieldContent>
                                    </Field>
                                )}
                            />
                            <Controller
                                control={control}
                                name="recurring"
                                render={({ field }) => (
                                    <Field orientation="horizontal">
                                        <Checkbox id="recurring" name={field.name} checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                                        <FieldContent>
                                            <FieldLabel htmlFor="recurring">Despesa recorrente</FieldLabel>
                                            <FieldDescription>Apenas uma marcação nesta primeira versão.</FieldDescription>
                                        </FieldContent>
                                    </Field>
                                )}
                            />
                            <Alert>
                                <CreditCardIcon aria-hidden="true" />
                                <AlertDescription>A data da transação de cartão será preenchida pela futura importação de fatura.</AlertDescription>
                            </Alert>
                        </FieldGroup>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link href="/despesas" className={buttonVariants({ variant: "secondary" })}>Cancelar</Link>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
                    {isSubmitting ? "Salvando..." : expenseId ? "Salvar alterações" : "Criar despesa"}
                </Button>
            </div>
        </form>
    );
}
