import { CategoryManagementPage } from "@/src/app/(app)/categorias/_components/category-management-page";
import { getCategoryManagementPageData } from "@/src/app/(app)/categorias/queries";

export default async function CategoriesPage() {
  const data = await getCategoryManagementPageData();
  return <CategoryManagementPage data={data} />;
}
