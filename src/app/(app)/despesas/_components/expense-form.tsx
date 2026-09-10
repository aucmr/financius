"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
    createExpenseAction,
    updateExpenseAction,
} from "@/src/app/(app)/despesas/actions";
import {
    expenseFormSchema,
    type ExpenseFormValues,
} from "@/src/app/(app)/despesas/_lib/schemas";
import type { ExpenseOptions } from "@/src/app/(app)/despesas/_lib/types";
import { getNotyf } from "@/src/lib/utils/notyf";

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
        resolver: zodResolver(expenseFormSchema),
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
            getNotyf()?.error(result.message);
            return;
        }

        getNotyf()?.success(result.message);
        router.push("/despesas");
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
                <section className="card bg-base-100 shadow-md">
                    <div className="card-body gap-5">
                        <div>
                            <h2 className="card-title text-xl">Dados do lançamento</h2>
                            <p className="text-sm text-base-content/60">
                                Registre uma saída para o household {householdName}.
                            </p>
                        </div>

                        <label className="form-control w-full">
                            <span className="label-text mb-1 font-medium">Descrição</span>
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                placeholder="Ex.: Mercado da semana"
                                {...register("description")}
                            />
                            {errors.description?.message && <span className="label-text-alt mt-1 text-error">{errors.description.message}</span>}
                        </label>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="form-control w-full">
                                <span className="label-text mb-1 font-medium">Valor</span>
                                <label className="input input-bordered flex items-center gap-2">
                                    <span className="text-sm text-base-content/50">R$</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        className="grow"
                                        placeholder="0,00"
                                        {...register("amount")}
                                    />
                                </label>
                                {errors.amount?.message && <span className="label-text-alt mt-1 text-error">{errors.amount.message}</span>}
                            </label>
                            <label className="form-control w-full">
                                <span className="label-text mb-1 font-medium">Data da despesa</span>
                                <input type="date" className="input input-bordered w-full" {...register("date")} />
                                {errors.date?.message && <span className="label-text-alt mt-1 text-error">{errors.date.message}</span>}
                            </label>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="form-control w-full">
                                <span className="label-text mb-1 font-medium">Categoria de área</span>
                                <select className="select select-bordered w-full" {...register("areaCategoryId")}>
                                    <option value="">Selecione uma área</option>
                                    {options.areaCategories.map((category) => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                </select>
                                {errors.areaCategoryId?.message && <span className="label-text-alt mt-1 text-error">{errors.areaCategoryId.message}</span>}
                            </label>
                            <label className="form-control w-full">
                                <span className="label-text mb-1 font-medium">Subcategoria</span>
                                <select
                                    className="select select-bordered w-full"
                                    disabled={!areaCategoryId}
                                    {...register("areaSubcategoryId")}
                                >
                                    <option value="">Selecione uma subcategoria</option>
                                    {subcategories.map((subcategory) => (
                                        <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                                    ))}
                                </select>
                                {errors.areaSubcategoryId?.message && <span className="label-text-alt mt-1 text-error">{errors.areaSubcategoryId.message}</span>}
                            </label>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="form-control w-full">
                                <span className="label-text mb-1 font-medium">Categoria de perfil</span>
                                <select className="select select-bordered w-full" {...register("profileCategoryId")}>
                                    <option value="">Selecione um perfil</option>
                                    {options.profileCategories.map((category) => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                </select>
                                {errors.profileCategoryId?.message && <span className="label-text-alt mt-1 text-error">{errors.profileCategoryId.message}</span>}
                            </label>
                            <label className="form-control w-full">
                                <span className="label-text mb-1 font-medium">Responsável</span>
                                <select className="select select-bordered w-full" {...register("responsibleUserId")}>
                                    <option value="">Selecione uma pessoa</option>
                                    {options.members.map((member) => (
                                        <option key={member.id} value={member.id}>{member.name}</option>
                                    ))}
                                </select>
                                {errors.responsibleUserId?.message && <span className="label-text-alt mt-1 text-error">{errors.responsibleUserId.message}</span>}
                            </label>
                        </div>

                        <label className="form-control w-full">
                            <span className="label-text mb-1 font-medium">Observações <span className="font-normal text-base-content/50">(opcional)</span></span>
                            <textarea className="textarea textarea-bordered min-h-24 w-full" placeholder="Detalhes úteis sobre este lançamento" {...register("notes")} />
                            {errors.notes?.message && <span className="label-text-alt mt-1 text-error">{errors.notes.message}</span>}
                        </label>
                    </div>
                </section>

                <section className="card h-fit bg-base-100 shadow-md">
                    <div className="card-body gap-5">
                        <div>
                            <h2 className="card-title text-xl">Classificação</h2>
                            <p className="text-sm text-base-content/60">Use as marcações para organizar a leitura mensal.</p>
                        </div>
                        <label className="flex cursor-pointer items-start gap-3 rounded-box border border-base-300 p-3">
                            <input type="checkbox" className="checkbox checkbox-primary mt-0.5" {...register("shared")} />
                            <span>
                                <span className="block font-medium">Despesa compartilhada</span>
                                <span className="mt-1 block text-xs text-base-content/60">Entra no resumo de divisão do mês.</span>
                            </span>
                        </label>
                        <label className="flex cursor-pointer items-start gap-3 rounded-box border border-base-300 p-3">
                            <input type="checkbox" className="checkbox checkbox-secondary mt-0.5" {...register("recurring")} />
                            <span>
                                <span className="block font-medium">Despesa recorrente</span>
                                <span className="mt-1 block text-xs text-base-content/60">Apenas uma marcação nesta primeira versão.</span>
                            </span>
                        </label>
                        <div className="alert alert-soft alert-info items-start text-sm">
                            <span className="icon-[tabler--credit-card] mt-0.5 size-5 shrink-0" aria-hidden="true" />
                            <p>A data da transação de cartão será preenchida pela futura importação de fatura.</p>
                        </div>
                    </div>
                </section>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link href="/despesas" className="btn btn-soft btn-secondary">Cancelar</Link>
                <button type="submit" className="btn btn-primary gap-2" disabled={isSubmitting}>
                    {isSubmitting ? <span className="loading loading-spinner loading-xs" aria-hidden="true" /> : <span className="icon-[tabler--device-floppy] size-4" aria-hidden="true" />}
                    {isSubmitting ? "Salvando..." : expenseId ? "Salvar alterações" : "Criar despesa"}
                </button>
            </div>
        </form>
    );
}
