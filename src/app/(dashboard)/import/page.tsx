import { ImportCSVClient } from "@/components/csv-import-client";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Import Expenses</h1>
        <p className="mt-2 text-gray-600">
          Import expenses from credit card statements (XP or BTG format)
        </p>
      </div>

      <ImportCSVClient />
    </div>
  );
}
