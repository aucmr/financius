type FinancialSectionPageProps = {
    icon: string;
    label: string;
    title: string;
    description: string;
    emptyTitle: string;
    emptyDescription: string;
};

export function FinancialSectionPage({
    icon,
    label,
    title,
    description,
    emptyTitle,
    emptyDescription,
}: FinancialSectionPageProps) {
    return (
        <section className="mx-auto w-full max-w-7xl space-y-8">
            <header className="space-y-2">
                <span className="badge badge-soft badge-primary">{label}</span>
                <h1 className="text-3xl font-semibold tracking-tight text-base-content sm:text-4xl">{title}</h1>
                <p className="max-w-2xl text-base text-base-content/60">{description}</p>
            </header>

            <div className="card bg-base-100 shadow-md">
                <div className="card-body min-h-80 items-center justify-center gap-4 text-center">
                    <span className={`${icon} size-12 text-primary/70`} aria-hidden="true" />
                    <div className="max-w-lg space-y-2">
                        <h2 className="card-title justify-center text-xl">{emptyTitle}</h2>
                        <p className="text-base text-base-content/60">{emptyDescription}</p>
                    </div>
                    <span className="badge badge-outline">Em preparação</span>
                </div>
            </div>
        </section>
    );
}
