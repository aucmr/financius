"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { signUpAction } from "@/src/app/(auth)/actions";
import {
    signUpInputSchema,
    type SignUpInput,
} from "@/src/app/(auth)/_lib/schemas";
import { getNotyf } from "@/src/lib/utils/notyf";
import { signIn } from "next-auth/react";

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
            const notyf = getNotyf();
            notyf?.error(result.message);
            return;
        }

        const signInResult = await signIn("credentials", {
            email: values.email,
            password: values.password,
            redirect: false,
            callbackUrl: "/dashboard",
        });

        if (!signInResult || signInResult.error) {
            const notyf = getNotyf();
            notyf?.error("Account created, but automatic sign-in failed.");
            router.push("/sign-in");
            return;
        }

        if (signInResult.url) {
            router.push("/dashboard");
        }
    };

    return (
        <section className="card w-full border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-4">
                <h1 className="card-title text-2xl">Create Account</h1>
                <p className="text-sm text-base-content/70">
                    Register an account to start using the application.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-2 flex flex-col gap-3" noValidate>
                    <label className="form-control w-full">
                        <span className="label-text mb-1">Name</span>
                        <input
                            type="text"
                            placeholder="Your name"
                            className="input input-bordered w-full"
                            {...register("name")}
                        />
                        {errors.name?.message ? (
                            <span className="label text-error text-xs">{errors.name.message}</span>
                        ) : null}
                    </label>
                    <label className="form-control w-full">
                        <span className="label-text mb-1">Email</span>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            className="input input-bordered w-full"
                            {...register("email")}
                        />
                        {errors.email?.message ? (
                            <span className="label text-error text-xs">{errors.email.message}</span>
                        ) : null}
                    </label>
                    <label className="form-control w-full">
                        <span className="label-text mb-1">Password</span>
                        <input
                            type="password"
                            placeholder="At least 8 characters"
                            className="input input-bordered w-full"
                            {...register("password")}
                        />
                        {errors.password?.message ? (
                            <span className="label text-error text-xs">{errors.password.message}</span>
                        ) : null}
                    </label>
                    <button type="submit" className="btn btn-primary mt-2" disabled={isSubmitting}>
                        {isSubmitting ? "Creating account..." : "Create account"}
                    </button>
                </form>
            </div>
        </section>
    );
}
