import { WalletIcon } from "lucide-react";

import { FinancialSectionPage } from "@/src/app/(app)/_components/financial-section-page";

export default function ReceitasPage() {
    return (
        <FinancialSectionPage
            icon={WalletIcon}
            label="Receitas"
            title="Receitas do casal"
            description="Organize as entradas que compõem o planejamento financeiro de vocês."
            emptyTitle="Nenhuma receita registrada"
            emptyDescription="Esta área receberá os lançamentos de receita e o resumo da competência mensal."
        />
    );
}
