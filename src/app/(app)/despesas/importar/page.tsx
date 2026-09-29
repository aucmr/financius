import { ImportWizard } from "@/src/app/(app)/despesas/importar/_components/import-wizard";
import { getImportPageData } from "@/src/app/(app)/despesas/importar/queries";

export default async function ImportExpensesPage() {
  const data = await getImportPageData();

  return <ImportWizard householdName={data.householdName} options={data.options} />;
}
