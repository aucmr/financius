import Link from "next/link";
import { auth } from "@/src/lib/auth/auth";
import { redirect } from "next/navigation";

import { Badge } from "@/src/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card";
import { buttonVariants } from "@/src/components/ui/button";

export default async function SignUpPage() {
    const session = await auth();

    if (session?.user) {
        redirect("/dashboard");
    }

    return (
        <main className="mx-auto flex min-h-[80vh] w-full max-w-md items-center px-6 py-16">
            <Card className="w-full">
                <CardHeader>
                    <Badge variant="outline">Acesso restrito</Badge>
                    <CardTitle role="heading" aria-level={1}>
                        Cadastro por convite
                    </CardTitle>
                    <CardDescription>
                        Novas contas do Financius são liberadas manualmente pelo
                        administrador. Se você já tem acesso, entre com sua conta.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-start gap-3">
                    <Link
                        href="/sign-in"
                        className={buttonVariants()}
                    >
                        Entrar no Financius
                    </Link>
                    <Link
                        href="/"
                        className={buttonVariants({ variant: "link" })}
                    >
                        Voltar para a página inicial
                    </Link>
                </CardContent>
            </Card>
        </main>
    );
}
