import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/src/components/ui/button";

import { cn } from "@/src/lib/utils/cn";
import { formatMonthLabel, shiftMonth } from "@/src/lib/utils/date";

import { MonthPicker } from "./month-picker";

type MonthNavigationProps = {
    month: string;
    basePath?: string;
    showMonthPicker?: boolean;
};

export function MonthNavigation({
    month,
    basePath = "/despesas",
    showMonthPicker = false,
}: MonthNavigationProps) {
    return (
        <div
          className="flex flex-col gap-1"
          role="group"
          aria-label="Competência mensal"
        >
          {!showMonthPicker && (
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Competência
            </p>
          )}
          <div
            className={cn(
                "flex items-center gap-2",
                showMonthPicker && "items-end gap-1",
            )}
            role="group"
            aria-label="Navegação mensal"
          >
            <Link
                href={`${basePath}?month=${shiftMonth(month, -1)}`}
                className={buttonVariants({ variant: "secondary", size: "icon-sm" })}
                aria-label="Mês anterior"
                title="Mês anterior"
            >
                <ChevronLeftIcon aria-hidden="true" />
            </Link>
            {showMonthPicker ? (
                <MonthPicker
                    key={month}
                    month={month}
                    basePath={basePath}
                />
            ) : (
                <p className="min-w-36 text-center capitalize font-semibold text-foreground">
                  {formatMonthLabel(month)}
                </p>
            )}
            <Link
                href={`${basePath}?month=${shiftMonth(month, 1)}`}
                className={buttonVariants({ variant: "secondary", size: "icon-sm" })}
                aria-label="Próximo mês"
                title="Próximo mês"
            >
                <ChevronRightIcon aria-hidden="true" />
            </Link>
          </div>
        </div>
    );
}
