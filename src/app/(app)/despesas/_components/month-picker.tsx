"use client";

import { useRouter } from "next/navigation";

import { Field, FieldGroup, FieldLabel } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";

import { isValidMonth } from "@/src/lib/utils/date";

type MonthPickerProps = {
    month: string;
    basePath: string;
};

export function MonthPicker({ month, basePath }: MonthPickerProps) {
    const router = useRouter();

    return (
        <FieldGroup className="w-48 max-w-[calc(100%_-_4rem)] shrink-0 flex-row items-end gap-1">
            <Field className="w-auto gap-1">
                <FieldLabel
                    htmlFor="month-navigation-month"
                    className="text-xs font-medium text-muted-foreground"
                >
                    Competência
                </FieldLabel>
                <Input
                    id="month-navigation-month"
                    type="month"
                    defaultValue={month}
                    className="w-40"
                    required
                    onChange={(event) => {
                        const nextMonth = event.currentTarget.value;

                        if (!isValidMonth(nextMonth) || nextMonth === month) {
                            return;
                        }

                        router.push(`${basePath}?month=${nextMonth}`, {
                            scroll: false,
                        });
                    }}
                />
            </Field>
        </FieldGroup>
    );
}
