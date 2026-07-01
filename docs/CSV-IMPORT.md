# CSV Import Feature

## Overview

The CSV Import feature allows users to bulk import expenses from credit card statements (from XP or BTG banks) into Financius. Each expense is reviewed individually before being saved to the database.

## Features

### Bank Support

- **XP Bank**: Semicolon-delimited CSV files with columns: Data, Estabelecimento, Portador, Valor, Parcela
- **BTG Bank**: Comma-delimited CSV files with columns: Data, Descrição, Valor, Tipo de compra, Código de autorização, Final Cartão

### Automatic Bank Detection

The system automatically detects the bank format based on the CSV headers. Users can override this detection manually if needed.

### Expense Review Workflow

1. **Upload**: User uploads CSV file and selects credit card bill due date
2. **Review**: Each expense is presented one-by-one for confirmation:
   - Description (auto-filled from CSV, editable)
   - Amount (auto-filled from CSV, editable)
   - Date (set to the bill due date, read-only)
   - Area Category (required, must be selected)
   - Profile Category (required, must be selected)
   - Responsible User (defaults to "Husband", can be changed to "Wife")
   - Notes (optional text field)
3. **Confirm/Skip**: User can confirm the expense (saves to database) or skip it
4. **Results**: Summary of successfully imported expenses and any errors

### Amount Parsing

The system correctly handles:

- Brazilian format: `1.234,56` (period for thousands, comma for decimals)
- Standard format: `1,234.56` (comma for thousands, period for decimals)
- Currency symbol: `R$ 1.234,56`
- Negative amounts: Filtered out (payments/refunds are not imported)

### Data Validation

Each expense is validated before saving:

- Description: Required, must be non-empty
- Amount: Required, must be > 0
- Date: Required, must be valid date
- Area Category: Required
- Profile Category: Required
- Responsible User: Required (defaults to Husband)
- Notes: Optional

## File Structure

```
src/
├── lib/
│   ├── csv-parser.ts          # CSV parsing and validation logic
│   └── csv-parser.test.ts     # Unit tests for CSV parser
├── actions/
│   ├── csv-import.ts          # Server actions for import
│   └── csv-import.test.ts     # Integration tests (commented due to env issues)
├── components/
│   ├── csv-import-client.tsx  # Main import workflow component
│   └── csv-expense-review.tsx # Individual expense review component
└── app/
    └── (dashboard)/
        └── import/
            └── page.tsx       # Import page
```

## Usage

### For End Users

1. Navigate to "Import CSV" from the dashboard navigation
2. Select the financial institution (XP or BTG) - system may auto-detect
3. Choose the credit card bill due date
4. Upload the CSV file
5. Click "Review Expenses"
6. For each expense:
   - Review the pre-filled values
   - Edit as needed
   - Select Area and Profile categories
   - Select responsible person
   - Add optional notes
   - Click "Confirm & Next" or "Skip"
7. Review the import summary

### For Developers

#### Testing CSV Parsing

```typescript
import { extractExpensesFromCSV } from "@/lib/csv-parser";

const expenses = extractExpensesFromCSV(csvContent, "XP");
expenses.forEach((expense) => {
  console.log(expense.description, expense.amount);
});
```

#### Using Server Actions

```typescript
import { parseCSVImport, createBatchExpenses } from "@/actions/csv-import";

const parsed = await parseCSVImport(csvContent, "XP");
const result = await createBatchExpenses([
  {
    description: "Store Name",
    amount: 100.5,
    date: "2026-06-10",
    areaCategoryId: "cat-123",
    profileCategoryId: "cat-456",
    responsibleUserId: "user-789",
    notes: "Optional notes",
  },
]);
```

## Testing

### Run Unit Tests

```bash
npm run test:watch -- src/lib/csv-parser.test.ts --run
```

All 15 tests should pass:

- CSV parsing (semicolon/comma delimited, BOM removal)
- Bank format detection
- Amount parsing (Brazilian and standard formats)
- Expense extraction (XP and BTG formats)
- Error handling

## Technical Details

### CSV Parsing

- Uses `csv-parse/sync` library for robust CSV parsing
- Auto-detects delimiter (semicolon for XP, comma for BTG)
- Strips BOM character from file beginning
- Handles quoted fields and special characters

### Amount Conversion

The `parseAmountBRL` function:

1. Removes currency symbol ("R$")
2. Detects format by checking position of last . and ,
3. Normalizes to standard number format
4. Returns as JavaScript number

Examples:

- `"R$ 1.234,56"` → `1234.56`
- `"R$ 1,234.56"` → `1234.56`
- `"R$ -100,00"` → `-100` (preserved for filtering)

### Database Validation

Each expense is validated using the Zod schema (`expenseFormSchema`) before saving:

- All required fields are checked
- Foreign key references (categories, users) are verified
- Transaction is atomic - all succeed or all fail

## Future Enhancements

- [ ] Support for more banks
- [ ] CSV export functionality
- [ ] Batch category assignment (apply same category to multiple expenses)
- [ ] Preview total amount before importing
- [ ] Import history/audit log
- [ ] CSV template download
- [ ] Auto-categorization based on keywords
