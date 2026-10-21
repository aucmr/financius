"use client";

import {
    signInInputSchema,
    type SignInInput,
} from "@/src/app/(auth)/_lib/schemas";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function SignInForm() {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInInput>({
        resolver: zodResolver(signInInputSchema),
    });

    const onSubmit = async (values: SignInInput) => {
        const result = await signIn("credentials", {
            email: values.email,
            password: values.password,
            redirect: false,
            callbackUrl: "/dashboard",
        });

        if (!result || result.error) {
            toast.error("E-mail ou senha inválidos.");
            return;
        }

        if (result.url) {
            router.push("/dashboard");
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-2xl">Entrar no Financius</CardTitle>
                <CardDescription>
                    Acesse sua conta para acompanhar as despesas do casal.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <FieldGroup>
                        <Field data-invalid={errors.email ? true : undefined}>
                            <FieldLabel htmlFor="email">E-mail</FieldLabel>
                            <Input
                                id="email"
                                type="email"
                                placeholder="voce@exemplo.com"
                                aria-invalid={errors.email ? true : undefined}
                                {...register("email")}
                            />
                            {errors.email?.message ? <FieldError>{errors.email.message}</FieldError> : null}
                        </Field>
                        <Field data-invalid={errors.password ? true : undefined}>
                            <FieldLabel htmlFor="password">Senha</FieldLabel>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Mínimo de 8 caracteres"
                                aria-invalid={errors.password ? true : undefined}
                                {...register("password")}
                            />
                            {errors.password?.message ? <FieldError>{errors.password.message}</FieldError> : null}
                        </Field>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Entrando..." : "Entrar"}
                        </Button>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    );
}
