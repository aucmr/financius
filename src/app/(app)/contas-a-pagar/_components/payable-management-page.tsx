import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { PayableItemsManager } from "@/src/app/(app)/contas-a-pagar/_components/payable-items-manager";
import type { PayableManagementPageData } from "@/src/app/(app)/contas-a-pagar/_lib/types";
import { Badge } from "@/src/components/ui/badge";
import { buttonVariants } from "@/src/components/ui/button";

type PayableManagementPageProps = {
  data: PayableManagementPageData;
};

export function PayableManagementPage({ data }: PayableManagementPageProps) {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col items-start gap-2">
          <Badge variant="secondary">Cadastros</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Gerenciar contas a pagar
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Edite os itens compartilhados de {data.householdName}.
          </p>
        </div>
        <Link
          href="/contas-a-pagar"
          className={buttonVariants({ variant: "secondary" })}
        >
          <ArrowLeftIcon data-icon="inline-start" aria-hidden="true" />
          Voltar à checklist
        </Link>
      </header>

      <PayableItemsManager items={data.items} />
    </section>
  );
}
