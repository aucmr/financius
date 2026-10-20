import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/src/components/ui/button";

import { formatMonthLabel, shiftMonth } from "@/src/lib/utils/date";

type MonthNavigationProps = {
    month: string;
    basePath?: string;
};

export function MonthNavigation({ month, basePath = "/despesas" }: MonthNavigationProps) {
    return (
        <div className="flex items-center gap-2" aria-label="Navegação mensal">
            <Link
                href={`${basePath}?month=${shiftMonth(month, -1)}`}
                className={buttonVariants({ variant: "secondary", size: "icon-sm" })}
                aria-label="Mês anterior"
                title="Mês anterior"
            >
                <ChevronLeftIcon aria-hidden="true" />
            </Link>
            <div className="min-w-36 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Competência
                </p>
                <p className="capitalize font-semibold text-foreground">{formatMonthLabel(month)}</p>
            </div>
            <Link
                href={`${basePath}?month=${shiftMonth(month, 1)}`}
                className={buttonVariants({ variant: "secondary", size: "icon-sm" })}
                aria-label="Próximo mês"
                title="Próximo mês"
            >
                <ChevronRightIcon aria-hidden="true" />
            </Link>
        </div>
    );
}
