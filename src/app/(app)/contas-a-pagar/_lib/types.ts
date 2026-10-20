export type PayableChecklistItem = {
  id: string;
  name: string;
  isPaid: boolean;
};

export type PayableChecklistPageData = {
  month: string;
  householdName: string;
  items: PayableChecklistItem[];
  paidCount: number;
  pendingCount: number;
};

export type PayableManagerItem = {
  id: string;
  name: string;
  sortOrder: number;
  archivedAt: string | null;
};

export type PayableManagementPageData = {
  householdName: string;
  items: PayableManagerItem[];
};
