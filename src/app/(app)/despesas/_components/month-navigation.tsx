import Link from "next/link";

import { formatMonthLabel, shiftMonth } from "@/src/lib/utils/date";

type MonthNavigationProps = {
    month: string;
};

export function MonthNavigation({ month }: MonthNavigationProps) {
    return (
        <div className="flex items-center gap-2" aria-label="Navegação mensal">
            <Link
                href={`/despesas?month=${shiftMonth(month, -1)}`}
                className="btn btn-soft btn-secondary btn-square btn-sm"
                aria-label="Mês anterior"
                title="Mês anterior"
            >
                <span className="icon-[tabler--chevron-left] size-4" aria-hidden="true" />
            </Link>
            <div className="min-w-36 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-base-content/45">
                    Competência
                </p>
                <p className="capitalize font-semibold text-base-content">{formatMonthLabel(month)}</p>
            </div>
            <Link
                href={`/despesas?month=${shiftMonth(month, 1)}`}
                className="btn btn-soft btn-secondary btn-square btn-sm"
                aria-label="Próximo mês"
                title="Próximo mês"
            >
                <span className="icon-[tabler--chevron-right] size-4" aria-hidden="true" />
            </Link>
        </div>
    );
}
