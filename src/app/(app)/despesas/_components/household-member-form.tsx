"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { associateHouseholdMemberAction } from "@/src/app/(app)/household/actions";
import {
    associateMemberSchema,
    type AssociateMemberValues,
} from "@/src/app/(app)/household/schemas";
import { Button } from "@/src/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Spinner } from "@/src/components/ui/spinner";

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
            toast.error(result.message);
            return;
        }

        toast.success(result.message);
        reset();
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
            <Field className="sm:max-w-sm" data-invalid={errors.email ? true : undefined}>
                <FieldLabel htmlFor="household-member-email">E-mail da outra pessoa</FieldLabel>
                <Input
                    id="household-member-email"
                    type="email"
                    placeholder="pessoa@exemplo.com"
                    aria-invalid={errors.email ? true : undefined}
                    {...register("email")}
                />
                {errors.email?.message ? <FieldError>{errors.email.message}</FieldError> : null}
            </Field>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner data-icon="inline-start" /> : <UserPlusIcon data-icon="inline-start" />}
                Associar conta
            </Button>
        </form>
    );
}
