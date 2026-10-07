import type { LucideIcon } from "lucide-react";

import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/src/components/ui/empty";

type FinancialSectionPageProps = {
    icon: LucideIcon;
    label: string;
    title: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
};

export function FinancialSectionPage({
    icon: Icon,
    label,
    title,
    description,
    emptyTitle,
    emptyDescription,
}: FinancialSectionPageProps) {
    return (
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
            <header className="flex flex-col items-start gap-2">
                <Badge variant="secondary">{label}</Badge>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
                <p className="max-w-2xl text-base text-muted-foreground">{description}</p>
            </header>

            <Card>
                <CardContent>
                    <Empty className="min-h-80">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Icon aria-hidden="true" />
                            </EmptyMedia>
                            <EmptyTitle>{emptyTitle}</EmptyTitle>
                            <EmptyDescription>{emptyDescription}</EmptyDescription>
                        </EmptyHeader>
                        <Badge variant="outline">Em preparação</Badge>
                    </Empty>
                </CardContent>
            </Card>
        </section>
    );
}
