"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { associateHouseholdMemberAction } from "@/src/app/(app)/household/actions";
import {
    associateMemberSchema,
    type AssociateMemberValues,
} from "@/src/app/(app)/household/schemas";
import { getNotyf } from "@/src/lib/utils/notyf";

export function HouseholdMemberForm() {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<AssociateMemberValues>({ resolver: zodResolver(associateMemberSchema) });

    async function onSubmit(values: AssociateMemberValues) {
        const result = await associateHouseholdMemberAction(values);

        if (!result.ok) {
            getNotyf()?.error(result.message);
            return;
        }

        getNotyf()?.success(result.message);
        reset();
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 sm:flex-row sm:items-start" noValidate>
            <label className="form-control w-full sm:max-w-sm">
                <span className="label-text mb-1 font-medium">E-mail da outra pessoa</span>
                <input
                    type="email"
                    className="input input-bordered w-full"
                    placeholder="pessoa@exemplo.com"
                    {...register("email")}
                />
                {errors.email?.message && <span className="label-text-alt mt-1 text-error">{errors.email.message}</span>}
            </label>
            <button type="submit" className="btn btn-primary mt-6 gap-2" disabled={isSubmitting}>
                {isSubmitting ? <span className="loading loading-spinner loading-xs" aria-hidden="true" /> : <span className="icon-[tabler--user-plus] size-4" aria-hidden="true" />}
                Associar conta
            </button>
        </form>
    );
}
