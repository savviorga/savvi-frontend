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
import toast from "react-hot-toast";
import type { Category } from "../types/category.type";
import { CategoryCard, CategoryMenu, type CategoryMenuActions, type DropState } from "./CategoryCard";
import {
  categoryAnnouncements,
  categoryCollision,
  nestProblem,
  screenReaderInstructions,
  useCategorySensors,
  useClickGuard,
} from "./CategoryDnd";

export interface BoardEntry {
  category: Category;
  subCount: number;
  transactions: number;
  note?: string;
}

function BoardCard({
  entry,
  index,
  drop,
  pop,
  onOpen,
  actions,
}: {
  entry: BoardEntry;
  index: number;
  drop: DropState;
  pop: boolean;
  onOpen: () => void;
  actions: CategoryMenuActions;
}) {
  const { category } = entry;
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: category.id,
  });
  const { setNodeRef: setDropRef } = useDroppable({ id: category.id });

  return (
    <li
      className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:duration-300"
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
    >
      <CategoryCard
        ref={(node) => {
          setDragRef(node);
          setDropRef(node);
        }}
        {...attributes}
        {...listeners}
        aria-roledescription="categoría arrastrable"
        aria-label={`${category.name}. Enter para ver sus subcategorías.`}
        onClick={onOpen}
        onKeyDown={(e) => {
          listeners?.onKeyDown?.(e);
          if (e.key === "Enter") onOpen();
        }}
        category={category}
        subCount={entry.subCount}
        transactions={entry.transactions}
        note={entry.note}
        drop={drop}
        pop={pop}
        placeholder={isDragging}
        showChevron
        menu={<CategoryMenu category={category} actions={actions} />}
      />
    </li>
  );
}

/**
 * Lista principal de categorías. Arrastrar una sobre otra la vuelve su
 * subcategoría al instante; si no se puede, se explica por qué.
 */
export default function CategoryBoard({
  entries,
  subCountOf,
  onOpen,
  onNest,
  actions,
}: {
  entries: BoardEntry[];
  subCountOf: (id: string) => number;
  onOpen: (category: Category) => void;
  onNest: (dragged: Category, target: Category) => Promise<boolean>;
  actions: CategoryMenuActions;
}) {
  const sensors = useCategorySensors();
  const { markDragEnd, guard } = useClickGuard();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [poppedId, setPoppedId] = useState<string | null>(null);

  const byId = new Map(entries.map((e) => [e.category.id, e]));
  const active = activeId ? byId.get(activeId) : undefined;
  const nameOf = (id: string | number) => byId.get(String(id))?.category.name ?? "la categoría";

  const dropStateFor = (target: Category): DropState => {
    if (!active || target.id === active.category.id) return { kind: "idle" };
    const problem = nestProblem(active.category, target, subCountOf);
    if (overId === target.id) {
      return problem
        ? { kind: "blocked", message: problem.short }
        : { kind: "over", message: `Soltar para meter en ${target.name}` };
    }
    return problem ? { kind: "idle" } : { kind: "available" };
  };

  const handleDragEnd = async ({ active: dragged, over }: DragEndEvent) => {
    markDragEnd();
    setActiveId(null);
    setOverId(null);
    if (!over || over.id === dragged.id) return;

    const source = byId.get(String(dragged.id))?.category;
    const target = byId.get(String(over.id))?.category;
    if (!source || !target) return;

    const problem = nestProblem(source, target, subCountOf);
    if (problem) {
      toast.error(problem.full, { duration: 5000 });
      return;
    }

    if (await onNest(source, target)) {
      setPoppedId(target.id);
      window.setTimeout(() => setPoppedId((id) => (id === target.id ? null : id)), 600);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={categoryCollision}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      accessibility={{ announcements: categoryAnnouncements(nameOf), screenReaderInstructions }}
      onDragStart={({ active: a }) => setActiveId(String(a.id))}
      onDragOver={({ over }) => setOverId(over ? String(over.id) : null)}
      onDragCancel={() => {
        markDragEnd();
        setActiveId(null);
        setOverId(null);
      }}
      onDragEnd={(event) => void handleDragEnd(event)}
    >
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {entries.map((entry, index) => (
          <BoardCard
            key={entry.category.id}
            entry={entry}
            index={index}
            drop={dropStateFor(entry.category)}
            pop={poppedId === entry.category.id}
            onOpen={guard(() => onOpen(entry.category))}
            actions={actions}
          />
        ))}
      </ul>

      <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
        {active ? (
          <CategoryCard
            category={active.category}
            subCount={active.subCount}
            transactions={active.transactions}
            overlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
