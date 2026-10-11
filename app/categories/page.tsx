"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { FolderTree, Hand, Plus, Search, Tags, X } from "lucide-react";
import { useCategories } from "@/features/categories/hooks/useCategories";
import CategoryBoard, { type BoardEntry } from "@/features/categories/components/CategoryBoard";
import CategoryDetail from "@/features/categories/components/CategoryDetail";
import CategoryFormModal from "@/features/categories/components/CategoryFormModal";
import DeleteCategoryDialog from "@/features/categories/components/DeleteCategoryDialog";
import type { CategoryMenuActions } from "@/features/categories/components/CategoryCard";
import SavvyBanner from "@/components/Banner/SavvyBanner";
import ChipSelect from "@/components/Inputs/ChipSelect";
import { Button } from "@/components/ui/shadcn-button";
import type { Category, CategoryType } from "@/features/categories/types/category.type";
import { buildCategoryTree } from "@/features/categories/utils/category-tree";

type TypeFilter = "all" | CategoryType;

const TYPE_FILTERS = [
  { label: "Todas", value: "all" },
  { label: "Gastos", value: "egreso" },
  { label: "Ingresos", value: "ingreso" },
] as const;

const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Aviso con "Deshacer" tras mover una categoría. */
function undoToast(message: string, onUndo: () => void) {
  toast.success(
    (t) => (
      <span className="flex items-center gap-3">
        <span>{message}</span>
        <button
          type="button"
          onClick={() => {
            toast.dismiss(t.id);
            onUndo();
          }}
          className="shrink-0 rounded-lg bg-mint/15 px-2.5 py-1 text-xs font-bold text-mint-dim transition-colors hover:bg-mint/25"
        >
          Deshacer
        </button>
      </span>
    ),
    { duration: 5000 },
  );
}

export default function CategoriesPage() {
  // `useSearchParams` necesita un Suspense para el render estático.
  return (
    <Suspense fallback={null}>
      <CategoriesView />
    </Suspense>
  );
}

function CategoriesView() {
  const router = useRouter();
  const pathname = usePathname();
  const openId = useSearchParams().get("categoria");
  const { categories, loading, saving, create, update, setActive, remove, move } = useCategories();

  const [form, setForm] = useState<{ editing: Category | null; parent: Category | null } | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const subCountOf = (id: string) => categories.filter((c) => c.parentId === id).length;

  // Solo una categoría principal se puede abrir; si dejó de serlo, se vuelve a la lista.
  const openGroup = openId ? tree.find((g) => g.category.id === openId) : undefined;
  const goTo = (id: string | null) => router.push(id ? `${pathname}?categoria=${id}` : pathname);

  /** Solo categorías principales; la búsqueda también mira dentro de cada una. */
  const entries: BoardEntry[] = useMemo(() => {
    const q = normalize(query);
    return tree.flatMap(({ category, children }): BoardEntry[] => {
      if (typeFilter !== "all" && (category.type ?? "egreso") !== typeFilter) return [];
      const transactions =
        (category.transactionsCount ?? 0) +
        children.reduce((sum, c) => sum + (c.transactionsCount ?? 0), 0);
      const base = { category, subCount: children.length, transactions };
      if (!q || normalize(category.name).includes(q)) return [base];
      const matches = children.filter((c) => normalize(c.name).includes(q));
      return matches.length
        ? [{ ...base, note: `Contiene: ${matches.map((c) => c.name).join(", ")}` }]
        : [];
    });
  }, [tree, query, typeFilter]);

  const stats = useMemo(
    () => ({
      main: tree.length,
      subs: categories.length - tree.length,
    }),
    [categories.length, tree.length],
  );

  const nest = async (dragged: Category, target: Category) => {
    const ok = await move(dragged, target.id);
    if (ok) {
      undoToast(`"${dragged.name}" ahora está dentro de "${target.name}".`, () =>
        void move({ ...dragged, parentId: target.id }, null),
      );
    }
    return ok;
  };

  const takeOut = async (child: Category) => {
    const parentId = child.parentId ?? null;
    const ok = await move(child, null);
    if (ok && parentId) {
      undoToast(`"${child.name}" volvió a la lista principal.`, () =>
        void move({ ...child, parentId: null }, parentId),
      );
    }
    return ok;
  };

  const actions: CategoryMenuActions = {
    onEdit: (category) =>
      setForm({
        editing: category,
        parent: category.parentId ? byId.get(category.parentId) ?? null : null,
      }),
    onToggleActive: (category) => void setActive(category, !category.isActive),
    onDelete: setDeleting,
  };

  const handleSubmit = (payload: Parameters<typeof create>[0]) =>
    form?.editing ? update(form.editing.id, payload) : create(payload);

  return (
    <>
      <SavvyBanner
        title="Categorías"
        subtitle="Clasifica tus ingresos y gastos. Arrastra una categoría sobre otra para convertirla en subcategoría."
      />

      {loading ? (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2" aria-busy="true" aria-label="Cargando categorías">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
              <span className="h-11 w-11 animate-pulse rounded-xl bg-slate-100" />
              <span className="flex-1 space-y-2">
                <span className="block h-3.5 w-1/3 animate-pulse rounded bg-slate-100" />
                <span className="block h-3 w-1/2 animate-pulse rounded bg-slate-100" />
              </span>
            </li>
          ))}
        </ul>
      ) : openGroup ? (
        <CategoryDetail
          parent={openGroup.category}
          subcategories={openGroup.children}
          onBack={() => goTo(null)}
          onAdd={() => setForm({ editing: null, parent: openGroup.category })}
          onEditParent={() => setForm({ editing: openGroup.category, parent: null })}
          onTakeOut={takeOut}
          actions={{ ...actions, onTakeOut: (child) => void takeOut(child) }}
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Tags className="h-4 w-4 text-mint-dim" aria-hidden />
                <strong className="text-foreground">{stats.main}</strong>{" "}
                {stats.main === 1 ? "categoría" : "categorías"}
              </span>
              {stats.subs > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <FolderTree className="h-4 w-4 text-sky-600" aria-hidden />
                  <strong className="text-foreground">{stats.subs}</strong>{" "}
                  {stats.subs === 1 ? "subcategoría" : "subcategorías"}
                </span>
              )}
            </p>
            <Button className="rounded-xl" onClick={() => setForm({ editing: null, parent: null })}>
              <Plus className="h-4 w-4" />
              Nueva categoría
            </Button>
          </div>

          {categories.length > 1 && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-mint/25 bg-mint/[0.06] p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-mint-dim shadow-sm">
                <Hand className="h-5 w-5 motion-safe:animate-[savvi-wiggle_1.2s_ease-in-out_2]" aria-hidden />
              </span>
              <p className="text-sm text-[#0B1829]">
                <strong>
                  <span className="sm:hidden">Mantén presionada</span>
                  <span className="hidden sm:inline">Arrastra</span> una categoría y suéltala sobre otra
                </strong>{" "}
                para convertirla en su subcategoría. Toca una categoría para ver lo que tiene dentro.
              </p>
            </div>
          )}

          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar categoría o subcategoría"
                aria-label="Buscar categoría"
                className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-9 text-base focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/25 sm:text-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <ChipSelect
              ariaLabel="Filtrar por tipo"
              options={TYPE_FILTERS}
              value={typeFilter}
              onChange={setTypeFilter}
            />
          </div>

          {categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mint/15 text-mint-dim">
                <Tags className="h-7 w-7" />
              </span>
              <p className="mt-4 text-base font-semibold text-[#0B1829]">Aún no tienes categorías</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Crea las categorías con las que clasificas tus ingresos y gastos.
              </p>
              <Button className="mt-5 rounded-xl" onClick={() => setForm({ editing: null, parent: null })}>
                <Plus className="h-4 w-4" />
                Crear mi primera categoría
              </Button>
            </div>
          ) : entries.length === 0 ? (
            <p className="rounded-2xl border border-border bg-white px-4 py-8 text-center text-sm text-muted-foreground">
              No hay categorías que coincidan{query ? <> con “{query}”</> : null}.
            </p>
          ) : (
            <CategoryBoard
              entries={entries}
              subCountOf={subCountOf}
              onOpen={(category) => goTo(category.id)}
              onNest={nest}
              actions={actions}
            />
          )}
        </>
      )}

      <CategoryFormModal
        open={form !== null}
        onClose={() => setForm(null)}
        editing={form?.editing ?? null}
        parent={form?.parent ?? null}
        defaultType={typeFilter === "all" ? undefined : typeFilter}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <DeleteCategoryDialog
        category={deleting}
        childrenCount={deleting ? subCountOf(deleting.id) : 0}
        saving={saving}
        onClose={() => setDeleting(null)}
        onConfirm={async (options) => {
          if (!deleting) return false;
          const ok = await remove(deleting, options);
          if (ok && deleting.id === openId) goTo(null);
          return ok;
        }}
        onDeactivate={() => (deleting ? setActive(deleting, false) : Promise.resolve(false))}
      />
    </>
  );
}
