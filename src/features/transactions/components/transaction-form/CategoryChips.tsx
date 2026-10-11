import { Fragment, useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "../../types/catalog.types";
import {
  CATEGORY_PATH_SEPARATOR,
  buildCategoryTree,
  type CategoryGroup,
} from "@/features/categories/utils/category-tree";
import FormSection from "./FormSection";
import { CHIP_BASE, CHIP_IDLE, CHIP_SELECTED, enterAnimation } from "./theme";

/** Chips visibles antes de "Ver todas": caben en ~3 filas de un celular. */
const COLLAPSED_COUNT = 8;
/** Con más categorías que esto, al expandir aparece un buscador. */
const SEARCH_FROM = 12;

const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Dot({ color }: { color?: string }) {
  return (
    <span
      className="h-2.5 w-2.5 shrink-0 rounded-full bg-gray-300 motion-safe:animate-in motion-safe:zoom-in-0 motion-safe:duration-200"
      style={color ? { backgroundColor: color } : undefined}
      aria-hidden
    />
  );
}

/**
 * Categorías en chips. Un grupo (Mercado) se puede elegir tal cual o, al
 * tocarlo, se despliegan sus subcategorías (Aseo, Plaza…) por si se quiere
 * ser más específico: nunca es un paso obligatorio.
 */
export default function CategoryChips({
  categories,
  value,
  onChange,
  error,
  hint,
}: {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  error?: boolean;
  hint?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const groupOf = useMemo(() => {
    const map = new Map<string, CategoryGroup<Category>>();
    for (const group of tree) {
      map.set(group.category.id, group);
      for (const child of group.children) map.set(child.id, group);
    }
    return map;
  }, [tree]);

  const selectedGroup = value ? groupOf.get(value) : undefined;
  const selectedChild =
    selectedGroup && selectedGroup.category.id !== value
      ? selectedGroup.children.find((c) => c.id === value)
      : undefined;

  // Grupo desplegado. Si la categoría llega de fuera (prellenado, IA, edición)
  // y es una subcategoría, se abre su grupo para que se vea elegida.
  const [openGroupId, setOpenGroupId] = useState<string | null>(
    selectedChild ? selectedGroup!.category.id : null,
  );
  const [lastValue, setLastValue] = useState(value);
  if (lastValue !== value) {
    setLastValue(value);
    if (selectedChild) setOpenGroupId(selectedGroup!.category.id);
  }

  // Orden estable (los chips no saltan al tocarlos); si la elegida quedó oculta,
  // ocupa el último lugar visible para que siempre se vea.
  const collapsed = useMemo(() => {
    const head = tree.slice(0, COLLAPSED_COUNT);
    if (!selectedGroup || head.includes(selectedGroup)) return head;
    return [...head.slice(0, COLLAPSED_COUNT - 1), selectedGroup];
  }, [tree, selectedGroup]);

  const q = normalize(query.trim());
  /** Al buscar, la lista es plana e incluye subcategorías con su ruta. */
  const searchResults = useMemo(() => {
    if (!expanded || !q) return null;
    return tree.flatMap((group) => [
      ...(normalize(group.category.name).includes(q)
        ? [{ category: group.category, label: group.category.name }]
        : []),
      ...group.children
        .filter((c) => normalize(c.name).includes(q) || normalize(group.category.name).includes(q))
        .map((c) => ({
          category: c,
          label: `${group.category.name}${CATEGORY_PATH_SEPARATOR}${c.name}`,
        })),
    ]);
  }, [expanded, q, tree]);

  const visibleGroups = expanded ? tree : collapsed;
  // Cambiar de tipo o expandir vuelve a montar la lista y repite la entrada escalonada.
  const listKey = `${expanded}:${categories.map((c) => c.id).join(",")}`;
  const hiddenCount = tree.length - COLLAPSED_COUNT;

  const pickGroup = (group: CategoryGroup<Category>) => {
    const id = group.category.id;
    if (!group.children.length) {
      onChange(id);
      setOpenGroupId(null);
      return;
    }
    // Segundo toque sobre el grupo ya elegido: se pliega y queda el grupo.
    if (openGroupId === id && value === id) {
      setOpenGroupId(null);
      return;
    }
    onChange(id);
    setOpenGroupId(id);
  };

  const pickChild = (child: Category) => {
    onChange(child.id);
    const group = groupOf.get(child.id);
    if (group) setOpenGroupId(group.category.id);
  };

  return (
    <FormSection
      id="tx-section-category"
      title="¿En qué?"
      hint={hint}
      error={error}
      action={
        hiddenCount > 0 ? (
          <button
            type="button"
            onClick={() => {
              setExpanded((v) => !v);
              setQuery("");
            }}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-mint-dim transition-colors hover:bg-mint/10"
          >
            {expanded ? "Ver menos" : `Ver todas (${tree.length})`}
          </button>
        ) : null
      }
    >
      {expanded && categories.length > SEARCH_FROM && (
        <div className="relative mb-2.5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar categoría o subcategoría"
            className="h-11 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-base focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/25 sm:h-10 sm:text-sm"
          />
        </div>
      )}

      {categories.length === 0 ? (
        <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
          No tienes categorías para este tipo. Créalas en Categorías.
        </p>
      ) : searchResults ? (
        <div role="radiogroup" aria-labelledby="tx-section-category-title" className="flex flex-wrap gap-2">
          {searchResults.map(({ category, label }, index) => {
            const selected = category.id === value;
            const enter = enterAnimation(index, 20);
            return (
              <button
                key={category.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  const group = groupOf.get(category.id)!;
                  if (group.category.id === category.id) pickGroup(group);
                  else pickChild(category);
                }}
                style={enter.style}
                className={cn(CHIP_BASE, enter.className, selected ? CHIP_SELECTED : CHIP_IDLE)}
              >
                {selected ? (
                  <Check className="h-4 w-4 text-mint-dim animate-in zoom-in-50 duration-200" aria-hidden />
                ) : (
                  <Dot color={category.color} />
                )}
                <span className="max-w-[16rem] truncate">{label}</span>
              </button>
            );
          })}
          {searchResults.length === 0 && (
            <p className="text-sm text-gray-500">Sin resultados para “{query}”.</p>
          )}
        </div>
      ) : (
        <div
          key={listKey}
          role="radiogroup"
          aria-labelledby="tx-section-category-title"
          className="flex flex-wrap gap-2"
        >
          {visibleGroups.map((group, index) => {
            const { category: cat, children } = group;
            const inGroup = selectedGroup === group;
            const selected = inGroup && (value === cat.id || Boolean(selectedChild));
            const isOpen = openGroupId === cat.id && children.length > 0;
            const enter = enterAnimation(index, 25);
            return (
              <Fragment key={cat.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => pickGroup(group)}
                  style={enter.style}
                  className={cn(
                    CHIP_BASE,
                    enter.className,
                    "motion-safe:duration-300",
                    selected ? CHIP_SELECTED : CHIP_IDLE,
                  )}
                >
                  {selected ? (
                    <Check className="h-4 w-4 text-mint-dim animate-in zoom-in-50 duration-200" aria-hidden />
                  ) : (
                    <Dot color={cat.color} />
                  )}
                  <span className="max-w-[14rem] truncate">
                    {cat.name}
                    {inGroup && selectedChild && (
                      <span className="font-semibold">
                        {CATEGORY_PATH_SEPARATOR}
                        {selectedChild.name}
                      </span>
                    )}
                  </span>
                  {children.length > 0 && (
                    <span className="-mr-1 inline-flex items-center gap-0.5 rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                      {children.length}
                      <ChevronDown
                        className={cn("h-3 w-3 transition-transform duration-300", isOpen && "rotate-180")}
                        aria-hidden
                      />
                    </span>
                  )}
                </button>
                {/* El panel ocupa la línea siguiente al chip del grupo. */}
                {isOpen && (
                  <ChildrenPanel
                    group={group}
                    value={value}
                    onPick={pickChild}
                    onPickGroup={() => onChange(cat.id)}
                  />
                )}
              </Fragment>
            );
          })}
        </div>
      )}
    </FormSection>
  );
}

function ChildrenPanel({
  group,
  value,
  onPick,
  onPickGroup,
}: {
  group: CategoryGroup<Category>;
  value: string;
  onPick: (child: Category) => void;
  onPickGroup: () => void;
}) {
  return (
    <div className="basis-full rounded-2xl border border-mint/25 bg-mint/[0.06] p-2.5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-300">
      <p className="mb-2 px-0.5 text-[11px] font-semibold text-gray-500">
        ¿Más específico? <span className="font-normal">(opcional)</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          role="radio"
          aria-checked={value === group.category.id}
          onClick={onPickGroup}
          className={cn(
            CHIP_BASE,
            "min-h-9 px-3 py-1.5 text-xs",
            value === group.category.id ? CHIP_SELECTED : CHIP_IDLE,
          )}
        >
          {value === group.category.id && (
            <Check className="h-3.5 w-3.5 text-mint-dim animate-in zoom-in-50 duration-200" aria-hidden />
          )}
          Todo {group.category.name}
        </button>
        {group.children.map((child, index) => {
          const selected = child.id === value;
          const enter = enterAnimation(index + 1, 30);
          return (
            <button
              key={child.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onPick(child)}
              style={enter.style}
              className={cn(
                CHIP_BASE,
                enter.className,
                "min-h-9 px-3 py-1.5 text-xs",
                selected ? CHIP_SELECTED : CHIP_IDLE,
              )}
            >
              {selected ? (
                <Check className="h-3.5 w-3.5 text-mint-dim animate-in zoom-in-50 duration-200" aria-hidden />
              ) : (
                <Dot color={child.color} />
              )}
              <span className="max-w-[12rem] truncate">{child.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
