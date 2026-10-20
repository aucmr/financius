import { PayableManagementPage } from "@/src/app/(app)/contas-a-pagar/_components/payable-management-page";
import { getPayableManagementPageData } from "@/src/app/(app)/contas-a-pagar/queries";

export default async function ManagePayablesPage() {
  const data = await getPayableManagementPageData();

  return <PayableManagementPage data={data} />;
}
