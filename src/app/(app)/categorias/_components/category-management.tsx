"use client";

import { useState, useTransition } from "react";
import {
  ArchiveIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  archiveCategoryAction,
  archiveSubcategoryAction,
  moveCategoryAction,
  restoreCategoryAction,
  restoreSubcategoryAction,
  type CategoryActionResult,
} from "@/src/app/(app)/categorias/actions";
import { CategoryForm } from "@/src/app/(app)/categorias/_components/category-form";
import { SubcategoryForm } from "@/src/app/(app)/categorias/_components/subcategory-form";
import type {
  CategoryManagementPageData,
  ManagedCategory,
  ManagedSubcategory,
} from "@/src/app/(app)/categorias/_lib/types";
import { CategoryIcon } from "@/src/components/category-icon";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/src/components/ui/empty";
import { Separator } from "@/src/components/ui/separator";
import type { CategoryKindValue } from "@/src/lib/categories/catalog";

type CategoryMutation = (values: unknown) => Promise<CategoryActionResult>;

type CategoryManagementProps = {
  data: CategoryManagementPageData;
};

type CategoryListProps = {
  kind: CategoryKindValue;
  categories: ManagedCategory[];
};

type CategoryItemProps = {
  kind: CategoryKindValue;
  category: ManagedCategory;
  index: number;
  activeCount: number;
  isPending: boolean;
  runMutation: (action: CategoryMutation, values: unknown) => void;
};

type SubcategoryListProps = {
  category: ManagedCategory;
  categoryArchived: boolean;
  isPending: boolean;
  runMutation: (action: CategoryMutation, values: unknown) => void;
};

function CategoryItem({
  kind,
  category,
  index,
  activeCount,
  isPending,
  runMutation,
}: CategoryItemProps) {
  const [editing, setEditing] = useState(false);
  const isArchived = category.archivedAt !== null;

  if (editing) {
    return (
      <li className="py-4">
        <CategoryForm
          kind={kind}
          category={category}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="border-b py-4 last:border-b-0">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <CategoryIcon
                name={category.icon}
                className="size-4"
                style={{ color: category.color }}
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0 truncate text-sm font-semibold">
              {category.name}
            </span>
            {isArchived ? <Badge variant="secondary">Arquivada</Badge> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isArchived ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  aria-label={`Mover categoria ${category.name} para cima`}
                  title={`Mover ${category.name} para cima`}
                  disabled={isPending || index === 0}
                  onClick={() =>
                    runMutation(moveCategoryAction, {
                      categoryId: category.id,
                      direction: "up",
                    })
                  }
                >
                  <ChevronUpIcon data-icon="inline-start" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  aria-label={`Mover categoria ${category.name} para baixo`}
                  title={`Mover ${category.name} para baixo`}
                  disabled={isPending || index === activeCount - 1}
                  onClick={() =>
                    runMutation(moveCategoryAction, {
                      categoryId: category.id,
                      direction: "down",
                    })
                  }
                >
                  <ChevronDownIcon data-icon="inline-start" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => setEditing(true)}
                >
                  <PencilIcon data-icon="inline-start" aria-hidden="true" />
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  aria-label={`Arquivar categoria ${category.name}`}
                  disabled={isPending}
                  onClick={() =>
                    runMutation(archiveCategoryAction, {
                      categoryId: category.id,
                    })
                  }
                >
                  <ArchiveIcon data-icon="inline-start" aria-hidden="true" />
                  Arquivar
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                aria-label={`Restaurar categoria ${category.name}`}
                disabled={isPending}
                onClick={() =>
                  runMutation(restoreCategoryAction, {
                    categoryId: category.id,
                  })
                }
              >
                <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
                Restaurar
              </Button>
            )}
          </div>
        </div>

        {kind === "AREA" ? (
          <SubcategoryList
            category={category}
            categoryArchived={isArchived}
            isPending={isPending}
            runMutation={runMutation}
          />
        ) : null}
      </div>
    </li>
  );
}

function SubcategoryRow({
  categoryId,
  subcategory,
  isPending,
  runMutation,
}: {
  categoryId: string;
  subcategory: ManagedSubcategory;
  isPending: boolean;
  runMutation: (action: CategoryMutation, values: unknown) => void;
}) {
  const [editing, setEditing] = useState(false);
  const isArchived = subcategory.archivedAt !== null;

  if (editing) {
    return (
      <li className="py-2">
        <SubcategoryForm
          categoryId={categoryId}
          subcategoryId={subcategory.id}
          initialName={subcategory.name}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="min-w-0 truncate text-sm text-muted-foreground">
          {subcategory.name}
        </span>
        {isArchived ? <Badge variant="secondary">Arquivada</Badge> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {!isArchived ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              aria-label={`Editar subcategoria ${subcategory.name}`}
              onClick={() => setEditing(true)}
            >
              <PencilIcon data-icon="inline-start" aria-hidden="true" />
              Editar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              aria-label={`Arquivar subcategoria ${subcategory.name}`}
              disabled={isPending}
              onClick={() =>
                runMutation(archiveSubcategoryAction, {
                  categoryId,
                  subcategoryId: subcategory.id,
                })
              }
            >
              <ArchiveIcon data-icon="inline-start" aria-hidden="true" />
              Arquivar
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            aria-label={`Restaurar subcategoria ${subcategory.name}`}
            disabled={isPending}
            onClick={() =>
              runMutation(restoreSubcategoryAction, {
                categoryId,
                subcategoryId: subcategory.id,
              })
            }
          >
            <RotateCcwIcon data-icon="inline-start" aria-hidden="true" />
            Restaurar
          </Button>
        )}
      </div>
    </li>
  );
}

function SubcategoryList({
  category,
  categoryArchived,
  isPending,
  runMutation,
}: SubcategoryListProps) {
  const activeSubcategories = category.subcategories.filter(
    (subcategory) => subcategory.archivedAt === null,
  );
  const archivedSubcategories = category.subcategories.filter(
    (subcategory) => subcategory.archivedAt !== null,
  );

  return (
    <div className="flex flex-col gap-3 ps-4">
      <Separator />
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Subcategorias
      </h3>
      {!categoryArchived ? (
        <SubcategoryForm categoryId={category.id} />
      ) : null}
      {category.subcategories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma subcategoria cadastrada.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {activeSubcategories.map((subcategory) => (
            <SubcategoryRow
              key={subcategory.id}
              categoryId={category.id}
              subcategory={subcategory}
              isPending={isPending || categoryArchived}
              runMutation={runMutation}
            />
          ))}
          {archivedSubcategories.map((subcategory) => (
            <SubcategoryRow
              key={subcategory.id}
              categoryId={category.id}
              subcategory={subcategory}
              isPending={isPending || categoryArchived}
              runMutation={runMutation}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryList({ kind, categories }: CategoryListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const activeCategories = categories.filter(
    (category) => category.archivedAt === null,
  );
  const archivedCategories = categories.filter(
    (category) => category.archivedAt !== null,
  );
  const isAreaCategory = kind === "AREA";

  function runMutation(action: CategoryMutation, values: unknown) {
    startTransition(async () => {
      const result = await action(values);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isAreaCategory ? "Categorias de área" : "Categorias de perfil"}
        </CardTitle>
        <CardDescription>
          {isAreaCategory
            ? "As categorias de área agrupam as despesas e contêm subcategorias."
            : "As categorias de perfil aparecem no seletor de despesas."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <CategoryForm kind={kind} />

        {activeCategories.length > 0 ? (
          <ul className="flex flex-col">
            {activeCategories.map((category, index) => (
              <CategoryItem
                key={category.id}
                kind={kind}
                category={category}
                index={index}
                activeCount={activeCategories.length}
                isPending={isPending}
                runMutation={runMutation}
              />
            ))}
          </ul>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CategoryIcon name={isAreaCategory ? "shapes" : "sliders-horizontal"} aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>
                Nenhuma categoria {isAreaCategory ? "de área" : "de perfil"} ativa
              </EmptyTitle>
              <EmptyDescription>
                Use o formulário acima para cadastrar uma categoria.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {archivedCategories.length > 0 ? (
          <section className="flex flex-col gap-4">
            <Separator />
            <div>
              <h3 className="text-sm font-semibold">Categorias arquivadas</h3>
              <p className="text-sm text-muted-foreground">
                Elas não aparecem em novos lançamentos; o histórico continua preservado.
              </p>
            </div>
            <ul className="flex flex-col">
              {archivedCategories.map((category, index) => (
                <CategoryItem
                  key={category.id}
                  kind={kind}
                  category={category}
                  index={index}
                  activeCount={archivedCategories.length}
                  isPending={isPending}
                  runMutation={runMutation}
                />
              ))}
            </ul>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CategoryManagement({ data }: CategoryManagementProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <CategoryList kind="AREA" categories={data.areaCategories} />
      <CategoryList kind="PROFILE" categories={data.profileCategories} />
    </div>
  );
}
