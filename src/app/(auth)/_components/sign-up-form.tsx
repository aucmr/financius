"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { signUpAction } from "@/src/app/(auth)/actions";
import {
    signUpInputSchema,
    type SignUpInput,
} from "@/src/app/(auth)/_lib/schemas";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

export function SignUpForm() {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignUpInput>({
        resolver: zodResolver(signUpInputSchema),
    });

    const onSubmit = async (values: SignUpInput) => {
        const result = await signUpAction(values);

        if (!result.ok) {
            toast.error(result.message);
            return;
        }

        const signInResult = await signIn("credentials", {
            email: values.email,
            password: values.password,
            redirect: false,
            callbackUrl: "/dashboard",
        });

        if (!signInResult || signInResult.error) {
            toast.error("Account created, but automatic sign-in failed.");
            router.push("/sign-in");
            return;
        }

        if (signInResult.url) {
            router.push("/dashboard");
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-2xl">Create Account</CardTitle>
                <CardDescription>Register an account to start using the application.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <FieldGroup>
                        <Field data-invalid={errors.name ? true : undefined}>
                            <FieldLabel htmlFor="name">Name</FieldLabel>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Your name"
                                aria-invalid={errors.name ? true : undefined}
                                {...register("name")}
                            />
                            {errors.name?.message ? <FieldError>{errors.name.message}</FieldError> : null}
                        </Field>
                        <Field data-invalid={errors.email ? true : undefined}>
                            <FieldLabel htmlFor="email">Email</FieldLabel>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                aria-invalid={errors.email ? true : undefined}
                                {...register("email")}
                            />
                            {errors.email?.message ? <FieldError>{errors.email.message}</FieldError> : null}
                        </Field>
                        <Field data-invalid={errors.password ? true : undefined}>
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <Input
                                id="password"
                                type="password"
                                placeholder="At least 8 characters"
                                aria-invalid={errors.password ? true : undefined}
                                {...register("password")}
                            />
                            {errors.password?.message ? <FieldError>{errors.password.message}</FieldError> : null}
                        </Field>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating account..." : "Create account"}
                        </Button>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    );
}
