/**
 * Grupos de categorías (dos niveles): una categoría principal puede tener
 * subcategorías. Aquí vive toda la lógica de jerarquía para que cada pantalla
 * filtre, sume y nombre las categorías igual.
 */

export interface CategoryNode {
  id: string;
  name: string;
  parentId?: string | null;
}

export interface CategoryGroup<T extends CategoryNode> {
  category: T;
  children: T[];
}

/** Separador de "Grupo › Subcategoría". */
export const CATEGORY_PATH_SEPARATOR = " › ";

const byName = (a: CategoryNode, b: CategoryNode) =>
  a.name.localeCompare(b.name, "es", { sensitivity: "base" });

/**
 * Árbol ordenado por nombre. Una subcategoría cuyo grupo no está en la lista
 * (p. ej. filtrado) se muestra como principal para no perderla.
 */
export function buildCategoryTree<T extends CategoryNode>(
  categories: T[],
): CategoryGroup<T>[] {
  const ids = new Set(categories.map((c) => c.id));
  const childrenByParent = new Map<string, T[]>();
  const roots: T[] = [];

  for (const category of categories) {
    if (category.parentId && ids.has(category.parentId)) {
      const list = childrenByParent.get(category.parentId) ?? [];
      list.push(category);
      childrenByParent.set(category.parentId, list);
    } else {
      roots.push(category);
    }
  }

  return roots.sort(byName).map((category) => ({
    category,
    children: (childrenByParent.get(category.id) ?? []).sort(byName),
  }));
}

/** Lista plana en orden de árbol: cada grupo seguido de sus subcategorías. */
export function flattenCategoryTree<T extends CategoryNode>(categories: T[]): T[] {
  return buildCategoryTree(categories).flatMap((g) => [g.category, ...g.children]);
}

/** "Mercado › Plaza" para una categoría que ya trae su grupo (p. ej. desde una transacción). */
export function categoryPath(
  category: { name: string; parent?: { name: string } | null } | null | undefined,
  fallback = "Sin categoría",
): string {
  if (!category) return fallback;
  return category.parent
    ? `${category.parent.name}${CATEGORY_PATH_SEPARATOR}${category.name}`
    : category.name;
}

/** Consultas de jerarquía sobre el catálogo completo de categorías. */
export function createCategoryIndex<T extends CategoryNode>(categories: T[]) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const childrenByParent = new Map<string, string[]>();
  for (const c of categories) {
    if (c.parentId && byId.has(c.parentId)) {
      const list = childrenByParent.get(c.parentId) ?? [];
      list.push(c.id);
      childrenByParent.set(c.parentId, list);
    }
  }

  const parentOf = (id: string): T | undefined => {
    const parentId = byId.get(id)?.parentId;
    return parentId ? byId.get(parentId) : undefined;
  };

  return {
    get: (id: string) => byId.get(id),
    parentOf,
    /** Id del grupo (o la misma categoría si es principal). */
    rootId: (id: string) => parentOf(id)?.id ?? id,
    childrenOf: (id: string) =>
      (childrenByParent.get(id) ?? []).map((cid) => byId.get(cid)!),
    /** La categoría y sus subcategorías: lo que cuenta al filtrar o sumar por ella. */
    groupIds: (id: string) => new Set([id, ...(childrenByParent.get(id) ?? [])]),
    /** "Mercado › Plaza", o el nombre si es principal. */
    label: (id: string, fallback = "Sin categoría") => {
      const category = byId.get(id);
      if (!category) return fallback;
      const parent = parentOf(id);
      return parent
        ? `${parent.name}${CATEGORY_PATH_SEPARATOR}${category.name}`
        : category.name;
    },
  };
}

export type CategoryIndex<T extends CategoryNode = CategoryNode> = ReturnType<
  typeof createCategoryIndex<T>
>;

/**
 * Opciones para un select: en orden de árbol y con la ruta completa. `all` es
 * el catálogo completo, para nombrar el grupo aunque la lista venga filtrada.
 */
export function categorySelectOptions<T extends CategoryNode>(
  categories: T[],
  all: CategoryNode[] = categories,
): { label: string; value: string }[] {
  const index = createCategoryIndex(all);
  return flattenCategoryTree(categories).map((c) => ({
    label: index.label(c.id),
    value: c.id,
  }));
}
