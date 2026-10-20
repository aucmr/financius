export type ManagedSubcategory = {
  id: string;
  name: string;
  archivedAt: string | null;
};

export type ManagedCategory = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  sortOrder: number;
  archivedAt: string | null;
  subcategories: ManagedSubcategory[];
};

export type CategoryManagementPageData = {
  householdName: string;
  areaCategories: ManagedCategory[];
  profileCategories: ManagedCategory[];
};
