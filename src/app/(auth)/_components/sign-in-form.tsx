"use client";

import {
    signInInputSchema,
    type SignInInput,
} from "@/src/app/(auth)/_lib/schemas";
import { getNotyf } from "@/src/lib/utils/notyf";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

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
            const notyf = getNotyf();
            notyf?.error("Invalid email or password.");
            return;
        }

        if (result.url) {
            router.push("/dashboard");
        }
    };

    return (
        <section className="card w-full border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-4">
                <h1 className="card-title text-2xl">Sign In</h1>
                <p className="text-sm text-base-content/70">
                    Access your account using your registered credentials.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-2 flex flex-col gap-3" noValidate>
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
                    <button type="submit" className="btn mt-2" disabled={isSubmitting}>
                        {isSubmitting ? "Signing in..." : "Continue"}
                    </button>
                </form>
            </div>
        </section>
    );
}
