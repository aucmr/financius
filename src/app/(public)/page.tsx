import Link from "next/link";
import {
  ArrowRightIcon,
  CreditCardIcon,
  ScaleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/src/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { buttonVariants } from "@/src/components/ui/button";

const features: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: UsersIcon,
    title: "Despesas compartilhadas",
    description:
      "Os dois acompanham os gastos da casa e têm uma visão comum do que já foi registrado.",
  },
  {
    icon: ScaleIcon,
    title: "Divisão por pessoa",
    description:
      "Entendam como as despesas se distribuem entre vocês, com os valores organizados por pessoa.",
  },
  {
    icon: SparklesIcon,
    title: "Categorias sugeridas pelo histórico",
    description:
      "Ao importar uma fatura de cartão, o Financius usa o histórico do casal para sugerir categorias aos lançamentos.",
  },
];

export default function PublicHomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-6">
        <header className="flex items-center justify-between gap-6 border-b border-border/70 py-5">
          <Link
            href="/"
            className="flex items-center gap-3 text-foreground"
            aria-label="Financius, página inicial"
          >
            <span
              className="flex size-10 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground"
              aria-hidden="true"
            >
              F
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Financius
            </span>
          </Link>

          <nav
            aria-label="Navegação principal"
            className="flex items-center gap-3 sm:gap-6"
          >
            <a
              href="#recursos"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Como funciona
            </a>
            <Link
              href="/sign-in"
              className={buttonVariants({ variant: "outline" })}
            >
              Entrar
            </Link>
          </nav>
        </header>

        <section
          aria-labelledby="hero-title"
          className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16"
        >
          <div className="flex flex-col items-start">
            <Badge variant="secondary" className="mb-5">
              CONTROLE DE GASTOS PARA CASAIS
            </Badge>
            <h1
              id="hero-title"
              className="max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl"
            >
              As despesas da casa, claras para os dois.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Compartilhem os gastos, acompanhem a divisão por pessoa e importem
              faturas de cartão com categorias sugeridas pelo histórico do
              casal.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/sign-in"
                className={buttonVariants({ size: "lg" })}
              >
                Entrar no Financius
                <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
              </Link>
              <a
                href="#recursos"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                })}
              >
                Conhecer os recursos
              </a>
            </div>

            <div className="mt-5 flex max-w-lg items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheckIcon
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <p>
                Acesso restrito: novas contas são liberadas manualmente pelo
                administrador.
              </p>
            </div>
          </div>

          <div
            role="group"
            aria-label="Prévia ilustrativa do controle de despesas do casal"
            className="mx-auto w-full max-w-xl"
          >
            <Card className="shadow-xl shadow-foreground/5">
              <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/70 pb-4">
                <div className="flex flex-col gap-1">
                  <CardDescription>Prévia ilustrativa</CardDescription>
                  <CardTitle>Resumo do casal</CardTitle>
                </div>
                <Badge variant="outline">
                  <UsersIcon data-icon="inline-start" aria-hidden="true" />
                  2 pessoas
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-5 py-5">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Despesas compartilhadas no mês
                  </p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight">
                    R$ 3.240,90
                  </p>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">
                        Divisão por pessoa
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Exemplo ilustrativo
                      </p>
                    </div>
                    <ScaleIcon
                      className="size-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <div
                    aria-hidden="true"
                    className="mt-4 flex h-2 gap-1 overflow-hidden rounded-full bg-muted"
                  >
                    <span className="w-[52%] rounded-full bg-primary" />
                    <span className="flex-1 rounded-full bg-primary/20" />
                  </div>
                  <div className="mt-3 flex justify-between gap-4 text-xs">
                    <span>Você · 52%</span>
                    <span>Seu par · 48%</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <CreditCardIcon
                      className="size-5"
                      aria-hidden="true"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Fatura importada</p>
                    <p className="text-xs text-muted-foreground">
                      Categoria sugerida pelo histórico
                    </p>
                  </div>
                  <Badge variant="secondary">Mercado</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <section
        id="recursos"
        aria-labelledby="features-title"
        className="border-y border-border/70 bg-muted/30"
      >
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Feito para a vida a dois
            </p>
            <h2
              id="features-title"
              className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Mais clareza para organizar o que vocês compartilham.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              O Financius reúne as despesas do casal e ajuda a reduzir o
              trabalho de classificar cada nova fatura.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card key={feature.title} size="sm" className="h-full">
                  <CardHeader className="gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-muted">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <CardTitle role="heading" aria-level={3}>
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="leading-6">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="access-title"
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-16 sm:flex-row sm:items-center sm:justify-between sm:py-20"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Acesso por liberação manual
          </p>
          <h2
            id="access-title"
            className="mt-3 text-3xl font-semibold tracking-tight"
          >
            Já tem acesso? Entrem para organizar as despesas.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Para manter o ambiente restrito aos casais convidados, novas contas
            são liberadas pelo administrador.
          </p>
        </div>
        <Link
          href="/sign-in"
          className={buttonVariants({ size: "lg" })}
        >
          Entrar no Financius
          <ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
        </Link>
      </section>

      <footer className="mt-auto border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-foreground">Financius</span>
          <span>Controle de gastos compartilhados para casais.</span>
        </div>
      </footer>
    </main>
  );
}
