import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { CategoryManagement } from "@/src/app/(app)/categorias/_components/category-management";
import type { CategoryManagementPageData } from "@/src/app/(app)/categorias/_lib/types";
import { Badge } from "@/src/components/ui/badge";
import { buttonVariants } from "@/src/components/ui/button";

export function CategoryManagementPage({
  data,
}: {
  data: CategoryManagementPageData;
}) {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col items-start gap-2">
          <Badge variant="secondary">Cadastros</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Gerenciar categorias
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Cadastros compartilhados com {data.householdName}. A ordem definida
            aqui também será usada nas despesas.
          </p>
        </div>
        <Link
          href="/despesas"
          className={buttonVariants({ variant: "secondary" })}
        >
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          Voltar às despesas
        </Link>
      </header>

      <CategoryManagement data={data} />
    </section>
  );
}
