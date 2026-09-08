import { SignUpForm } from "@/src/app/(auth)/_components/sign-up-form";
import { auth } from "@/src/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
    const session = await auth();

    if (session?.user) {
        redirect("/dashboard");
    }

    return (
        <main className="mx-auto flex min-h-[80vh] w-full max-w-md items-center px-6 py-16">
            <SignUpForm />
        </main>
    );
}
