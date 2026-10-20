import { MonthlyPayablesPage } from "@/src/app/(app)/contas-a-pagar/_components/monthly-payables-page";
import { getPayableChecklistPageData } from "@/src/app/(app)/contas-a-pagar/queries";

type PayableChecklistPageProps = {
  searchParams: Promise<{
    month?: string;
  }>;
};

export default async function PayableChecklistPage({
  searchParams,
}: PayableChecklistPageProps) {
  const params = await searchParams;
  const data = await getPayableChecklistPageData(params.month);

  return <MonthlyPayablesPage data={data} />;
}
