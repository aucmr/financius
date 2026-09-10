import { ExpenseMonthPage } from "@/src/app/(app)/despesas/_components/expense-month-page";
import { getExpensePageData } from "@/src/app/(app)/despesas/queries";

type DespesasPageProps = {
    searchParams: Promise<{
        month?: string;
    }>;
};

export default async function DespesasPage({ searchParams }: DespesasPageProps) {
    const params = await searchParams;
    const data = await getExpensePageData(params.month);

    return <ExpenseMonthPage data={data} />;
}
