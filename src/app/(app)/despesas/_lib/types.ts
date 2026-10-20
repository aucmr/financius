export type ExpenseCategoryOption = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  sortOrder: number;
  isArchived: boolean;
  subcategories: {
    id: string;
    name: string;
    isArchived: boolean;
  }[];
};

export type ExpenseProfileOption = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  sortOrder: number;
  isArchived: boolean;
};

export type ExpenseMemberOption = {
  id: string;
  name: string;
  email: string;
};

export type ExpenseOptions = {
  areaCategories: ExpenseCategoryOption[];
  profileCategories: ExpenseProfileOption[];
  members: ExpenseMemberOption[];
};

export type ExpenseListItem = {
  id: string;
  description: string;
  amount: string;
  date: string;
  creditCardTransactionDate?: string | null;
  importSource?: string | null;
  importFileName?: string | null;
  notes: string | null;
  recurring: boolean;
  shared: boolean;
  areaCategory: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
    sortOrder: number;
    isArchived: boolean;
  };
  areaSubcategory: {
    id: string;
    name: string;
  };
  profileCategory: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
  };
  creator: {
    id: string;
    name: string;
  };
  responsibleUser: {
    id: string;
    name: string;
  };
};

export type ExpensePageData = {
  month: string;
  householdName: string;
  currentUserId: string;
  members: ExpenseMemberOption[];
  options: ExpenseOptions;
  expenses: ExpenseListItem[];
  totalAmount: string;
  sharedAmount: string;
};
