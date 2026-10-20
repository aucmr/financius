"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { setMonthlyPayableStatusAction } from "@/src/app/(app)/contas-a-pagar/actions";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Field, FieldLabel } from "@/src/components/ui/field";
import { cn } from "@/src/lib/utils/cn";

type PayableStatusCheckboxProps = {
  itemId: string;
  itemName: string;
  month: string;
  initiallyPaid: boolean;
};

export function PayableStatusCheckbox({
  itemId,
  itemName,
  month,
  initiallyPaid,
}: PayableStatusCheckboxProps) {
  const [isPaid, setIsPaid] = useState(initiallyPaid);
  const [isPending, startTransition] = useTransition();
  const checkboxId = `payable-status-${itemId}`;

  function handleCheckedChange(checked: boolean) {
    const nextIsPaid = checked === true;

    if (nextIsPaid === isPaid || isPending) {
      return;
    }

    startTransition(async () => {
      const result = await setMonthlyPayableStatusAction({
        itemId,
        month,
        isPaid: nextIsPaid,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setIsPaid(nextIsPaid);
    });
  }

  return (
    <Field
      orientation="horizontal"
      className="border-b py-3 last:border-b-0"
      data-disabled={isPending ? true : undefined}
    >
      <Checkbox
        id={checkboxId}
        checked={isPaid}
        disabled={isPending}
        onCheckedChange={handleCheckedChange}
      />
      <FieldLabel
        htmlFor={checkboxId}
        className={cn(
          "cursor-pointer text-sm",
          isPaid && "text-muted-foreground line-through",
        )}
      >
        {itemName}
      </FieldLabel>
    </Field>
  );
}
