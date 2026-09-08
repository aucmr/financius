import { FinancialSectionPage } from "@/src/app/(app)/_components/financial-section-page";

export default function DespesasPage() {
    return (
        <FinancialSectionPage
            icon="icon-[tabler--receipt-2]"
            label="Despesas"
            title="Despesas do casal"
            description="Acompanhe as saídas e prepare a divisão mensal dos gastos compartilhados."
            emptyTitle="Nenhuma despesa registrada"
            emptyDescription="Esta área receberá categorias, perfis e a marcação de despesas compartilhadas."
        />
    );
}
