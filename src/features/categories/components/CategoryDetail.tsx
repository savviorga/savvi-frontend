"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ArrowLeft, FolderOutput, Layers, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/shadcn-button";
import { cn } from "@/lib/utils";
import type { Category } from "../types/category.type";
import {
  CategoryAvatar,
  CategoryCard,
  CategoryMenu,
  type CategoryMenuActions,
} from "./CategoryCard";
import {
  categoryAnnouncements,
  categoryCollision,
  screenReaderInstructions,
  useCategorySensors,
  useClickGuard,
} from "./CategoryDnd";

/** Zona donde se suelta una subcategoría para devolverla a la lista principal. */
const TAKE_OUT_ID = "__take-out__";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function TakeOutZone({ dragging, parentName }: { dragging: boolean; parentName: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: TAKE_OUT_ID });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 text-sm font-semibold transition-all duration-300",
        dragging
          ? "h-20 border-sky-300 bg-sky-50 text-sky-700 opacity-100"
          : "pointer-events-none h-0 border-transparent opacity-0",
        isOver && "scale-[1.02] border-sky-500 bg-sky-100 shadow-lg shadow-sky-500/10",
      )}
      aria-hidden={!dragging}
    >
      <FolderOutput className={cn("h-5 w-5", isOver && "motion-safe:animate-bounce")} aria-hidden />
      {isOver ? "Suelta para sacarla" : `Arrastra aquí para sacarla de ${parentName}`}
    </div>
  );
}

function ChildCard({
  child,
  index,
  onOpen,
  actions,
  parentName,
}: {
  child: Category;
  index: number;
  onOpen: () => void;
  actions: CategoryMenuActions;
  parentName: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: child.id });
  return (
    <li
      className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:duration-300"
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
    >
      <CategoryCard
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        aria-roledescription="subcategoría arrastrable"
        aria-label={`${child.name}. Enter para editar.`}
        onClick={onOpen}
        onKeyDown={(e) => {
          listeners?.onKeyDown?.(e);
          if (e.key === "Enter") onOpen();
        }}
        category={child}
        transactions={child.transactionsCount ?? 0}
        placeholder={isDragging}
        menu={<CategoryMenu category={child} actions={actions} parentName={parentName} />}
      />
    </li>
  );
}

/**
 * Dentro de una categoría: sus subcategorías. Se crean aquí y, arrastrándolas
 * a la zona superior, vuelven a la lista principal.
 */
export default function CategoryDetail({
  parent,
  subcategories,
  onBack,
  onAdd,
  onEditParent,
  onTakeOut,
  actions,
}: {
  parent: Category;
  subcategories: Category[];
  onBack: () => void;
  onAdd: () => void;
  onEditParent: () => void;
  onTakeOut: (child: Category) => Promise<boolean>;
  actions: CategoryMenuActions;
}) {
  const sensors = useCategorySensors();
  const { markDragEnd, guard } = useClickGuard();
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = subcategories.find((c) => c.id === activeId);
  const nameOf = (id: string | number) =>
    id === TAKE_OUT_ID
      ? "la zona para sacarla"
      : subcategories.find((c) => c.id === id)?.name ?? "la subcategoría";

  const total =
    (parent.transactionsCount ?? 0) +
    subcategories.reduce((sum, c) => sum + (c.transactionsCount ?? 0), 0);
  const income = parent.type === "ingreso";

  const handleDragEnd = ({ active: dragged, over }: DragEndEvent) => {
    markDragEnd();
    setActiveId(null);
    if (over?.id !== TAKE_OUT_ID) return;
    const child = subcategories.find((c) => c.id === dragged.id);
    if (child) void onTakeOut(child);
  };

  return (
    <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-4 motion-safe:duration-300">
      <button
        type="button"
        onClick={onBack}
        className="group mb-3 inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white hover:text-[#0B1829] focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/50"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Categorías
      </button>

      <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <CategoryAvatar category={parent} size="lg" />
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-[#0B1829] sm:text-xl">{parent.name}</h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground sm:text-sm">
              <span className={income ? "text-emerald-600" : "text-rose-600"}>
                {income ? "Ingresos" : "Gastos"}
              </span>
              <span aria-hidden>·</span>
              <span>{plural(subcategories.length, "subcategoría", "subcategorías")}</span>
              <span aria-hidden>·</span>
              <span>{total > 0 ? plural(total, "transacción", "transacciones") : "Sin transacciones"}</span>
            </p>
            {parent.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{parent.description}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button variant="outline" className="rounded-xl" onClick={onEditParent}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button className="rounded-xl" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Subcategoría
          </Button>
        </div>
      </div>

      {subcategories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/15 text-mint-dim">
            <Layers className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-semibold text-[#0B1829]">
            {parent.name} aún no tiene subcategorías
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            Crea una aquí, o en la lista principal arrastra otra categoría sobre {parent.name}.
          </p>
          <Button className="mt-4 rounded-xl" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Crear subcategoría
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={categoryCollision}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          accessibility={{ announcements: categoryAnnouncements(nameOf), screenReaderInstructions }}
          onDragStart={({ active: a }) => setActiveId(String(a.id))}
          onDragCancel={() => {
            markDragEnd();
            setActiveId(null);
          }}
          onDragEnd={handleDragEnd}
        >
          {/* Fija bajo el header: siempre a mano aunque la lista sea larga. */}
          <div className={cn("sticky top-[84px] z-20 transition-[margin] duration-300", activeId ? "mb-3" : "mb-0")}>
            <TakeOutZone dragging={Boolean(activeId)} parentName={parent.name} />
          </div>

          <p className="mb-2.5 text-xs text-muted-foreground">
            <span className="sm:hidden">Mantén presionada</span>
            <span className="hidden sm:inline">Arrastra</span> una subcategoría hacia arriba para sacarla de{" "}
            {parent.name}.
          </p>

          <ul className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 2xl:grid-cols-3">
            {subcategories.map((child, index) => (
              <ChildCard
                key={child.id}
                child={child}
                index={index}
                onOpen={guard(() => actions.onEdit(child))}
                actions={actions}
                parentName={parent.name}
              />
            ))}
          </ul>

          <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
            {active ? (
              <CategoryCard category={active} transactions={active.transactionsCount ?? 0} overlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
