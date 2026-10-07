"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { deleteExpenseAction } from "@/src/app/(app)/despesas/actions";
import { Button } from "@/src/components/ui/button";

type DeleteExpenseButtonProps = {
    expenseId: string;
    description: string;
};

export function DeleteExpenseButton({ expenseId, description }: DeleteExpenseButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        if (!window.confirm(`Excluir a despesa "${description}"? Essa ação não pode ser desfeita.`)) {
            return;
        }

        setIsDeleting(true);
        const result = await deleteExpenseAction(expenseId);

        if (!result.ok) {
            toast.error(result.message);
            setIsDeleting(false);
            return;
        }

        toast.success(result.message);
        router.refresh();
    }

    return (
        <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={`Excluir ${description}`}
            title="Excluir despesa"
        >
            <Trash2Icon aria-hidden="true" />
        </Button>
    );
}
