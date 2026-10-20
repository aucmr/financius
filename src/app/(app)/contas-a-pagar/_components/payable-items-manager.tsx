"use client";

import { useTransition } from "react";
import { ArchiveIcon, ChevronDownIcon, ChevronUpIcon, ListChecksIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  archivePayableItemAction,
  movePayableItemAction,
  type PayablesActionResult,
} from "@/src/app/(app)/contas-a-pagar/actions";
import { PayableItemNameForm } from "@/src/app/(app)/contas-a-pagar/_components/payable-item-name-form";
import type { PayableManagerItem } from "@/src/app/(app)/contas-a-pagar/_lib/types";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/src/components/ui/empty";

type PayablesMutation = (
  values: unknown,
) => Promise<PayablesActionResult>;

type PayableItemsManagerProps = {
  items: PayableManagerItem[];
};

export function PayableItemsManager({ items }: PayableItemsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const activeItems = items.filter((item) => item.archivedAt === null);
  const archivedItems = items.filter((item) => item.archivedAt !== null);

  function runMutation(action: PayablesMutation, values: unknown) {
    startTransition(async () => {
      const result = await action(values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Itens ativos</CardTitle>
          <CardDescription>
            Esta lista é compartilhada com as pessoas do household. Os novos
            itens aparecem a partir do mês em que forem adicionados.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <PayableItemNameForm />
          {activeItems.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ListChecksIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>Nenhum item ativo</EmptyTitle>
                <EmptyDescription>
                  Adicione um item para ele aparecer na checklist mensal.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="flex flex-col gap-4">
              {activeItems.map((item, index) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 border-b pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-end"
                >
                  <div className="min-w-0 flex-1">
                    <PayableItemNameForm
                      itemId={item.id}
                      initialName={item.name}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon-sm"
                      aria-label={`Mover ${item.name} para cima`}
                      title={`Mover ${item.name} para cima`}
                      disabled={isPending || index === 0}
                      onClick={() =>
                        runMutation(movePayableItemAction, {
                          itemId: item.id,
                          direction: "up",
                        })
                      }
                    >
                      <ChevronUpIcon data-icon="inline-start" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon-sm"
                      aria-label={`Mover ${item.name} para baixo`}
                      title={`Mover ${item.name} para baixo`}
                      disabled={isPending || index === activeItems.length - 1}
                      onClick={() =>
                        runMutation(movePayableItemAction, {
                          itemId: item.id,
                          direction: "down",
                        })
                      }
                    >
                      <ChevronDownIcon data-icon="inline-start" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={isPending}
                      aria-label={`Arquivar ${item.name}`}
                      onClick={() =>
                        runMutation(archivePayableItemAction, {
                          itemId: item.id,
                        })
                      }
                    >
                      <ArchiveIcon data-icon="inline-start" aria-hidden="true" />
                      Arquivar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {archivedItems.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Itens arquivados</CardTitle>
            <CardDescription>
              Esses itens não aparecem em novas competências, mas as marcações
              dos meses anteriores continuam guardadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {archivedItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 border-b pb-3 last:border-b-0 last:pb-0"
                >
                  <span className="min-w-0 truncate text-sm font-medium">
                    {item.name}
                  </span>
                  <Badge variant="secondary">Arquivado</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
