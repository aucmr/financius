"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteExpenseAction } from "@/src/app/(app)/despesas/actions";
import { getNotyf } from "@/src/lib/utils/notyf";

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
            getNotyf()?.error(result.message);
            setIsDeleting(false);
            return;
        }

        getNotyf()?.success(result.message);
        router.refresh();
    }

    return (
        <button
            type="button"
            className="btn btn-soft btn-error btn-square btn-sm"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={`Excluir ${description}`}
            title="Excluir despesa"
        >
            <span className="icon-[tabler--trash] size-4" aria-hidden="true" />
        </button>
    );
}
