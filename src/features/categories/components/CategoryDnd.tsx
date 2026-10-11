"use client";

import { useCallback, useRef } from "react";
import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type ScreenReaderInstructions,
} from "@dnd-kit/core";
import type { Category } from "../types/category.type";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const typeLabel = (c: Category) => (c.type === "ingreso" ? "ingresos" : "gastos");

/**
 * Por qué no se puede meter `dragged` dentro de `target` (o `null` si se puede).
 * `short` va sobre la tarjeta; `full`, en el aviso al soltar.
 */
export function nestProblem(
  dragged: Category,
  target: Category,
  subCountOf: (id: string) => number,
): { short: string; full: string } | null {
  const subs = subCountOf(dragged.id);
  if (subs > 0) {
    return {
      short: `"${dragged.name}" tiene ${plural(subs, "subcategoría", "subcategorías")}`,
      full: `"${dragged.name}" tiene ${plural(subs, "subcategoría", "subcategorías")}, así que no puede quedar dentro de otra categoría. Saca primero sus subcategorías.`,
    };
  }
  if ((dragged.type ?? "egreso") !== (target.type ?? "egreso")) {
    return {
      short: `"${target.name}" es de ${typeLabel(target)}`,
      full: `Solo puedes agrupar categorías del mismo tipo: "${dragged.name}" es de ${typeLabel(dragged)} y "${target.name}" es de ${typeLabel(target)}.`,
    };
  }
  return null;
}

/**
 * Mouse: arrastra al moverse 6px (un clic normal abre la tarjeta).
 * Táctil: mantener presionado ~0,2 s (deslizar sigue haciendo scroll).
 * Teclado: Espacio para tomar, flechas para mover, Espacio para soltar.
 */
export function useCategorySensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );
}

/** Con puntero, donde está el dedo; con teclado, la tarjeta que más se cruza. */
export const categoryCollision: CollisionDetection = (args) => {
  const byPointer = pointerWithin(args);
  return byPointer.length ? byPointer : rectIntersection(args);
};

export const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    "Para mover esta categoría, presiona Espacio. Usa las flechas para llevarla sobre otra categoría y presiona Espacio para soltarla, o Escape para cancelar.",
};

export function categoryAnnouncements(nameOf: (id: string | number) => string): Announcements {
  return {
    onDragStart: ({ active }) => `Tomaste ${nameOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} está sobre ${nameOf(over.id)}.` : `${nameOf(active.id)} no está sobre ninguna categoría.`,
    onDragEnd: ({ active, over }) =>
      over ? `Soltaste ${nameOf(active.id)} sobre ${nameOf(over.id)}.` : `Soltaste ${nameOf(active.id)}.`,
    onDragCancel: ({ active }) => `Cancelaste el movimiento de ${nameOf(active.id)}.`,
  };
}

/**
 * Tras arrastrar, el navegador puede disparar un clic sobre la tarjeta: este
 * guardia lo ignora para no abrirla por accidente.
 */
export function useClickGuard() {
  const lastDragEnd = useRef(0);
  const markDragEnd = useCallback(() => {
    lastDragEnd.current = Date.now();
  }, []);
  const guard = useCallback(
    (fn: () => void) => () => {
      if (Date.now() - lastDragEnd.current > 300) fn();
    },
    [],
  );
  return { markDragEnd, guard };
}
