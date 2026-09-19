# Línea gráfica — Savvi Frontend

Guía visual del aplicativo. Todo lo que está aquí sale del código actual
(`app/globals.css`, `src/components/**`, `src/features/**`); si algo cambia en el
código, este documento se actualiza, no al revés.

- **Framework de estilos:** Tailwind CSS v4 (configuración dentro del CSS, sin `tailwind.config.js`)
- **Fuente de la verdad de los tokens:** `app/globals.css`
- **Utilidad para componer clases:** `cn()` en `src/lib/utils.ts` (`clsx` + `tailwind-merge`)

---

## 1. Identidad

La marca se apoya en dos colores: un **verde menta** para lo vivo (acciones, foco,
acentos, datos positivos) y un **azul noche** para lo sólido (encabezados, superficies
oscuras, texto fuerte). El resto es una escala neutra de grises/slate.

| Rol | Valor | Dónde vive |
| --- | --- | --- |
| Mint Savvi (acento principal) | `#00C49A` | literal en componentes (48 usos) |
| Mint token (utilidades `bg-mint`, `text-mint`) | `#00d4aa` → `--color-mint` | `globals.css` |
| Mint atenuado | `#00b892` → `--color-mint-dim` | `globals.css` |
| Navy Savvi (texto/superficie fuerte) | `#0B1829` | literal en componentes (33 usos) |
| Cosmos (fondo profundo) | `#0b0f1a` → `--color-cosmos` | `globals.css` |
| Fondo del sidebar | `#0A1622` | `src/layouts/SideBarMenu.tsx` |
| Fondo de cabecera de modal | `#0a1118` | `src/components/Modal/Modal.tsx` |

> **Regla:** para colores nuevos usa el token (`bg-mint`, `text-accent`, `border-border`).
> Los literales `#00C49A` / `#0B1829` existen por historia; no agregues más si el token sirve.

### Degradado de marca

Franja de 1–3 px que aparece sobre el contenido autenticado y sobre las tarjetas/banners:

```
bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500
```

Se usa en `MainLayout` (`h-[3px]`), en `Header` y en `SavvyBanner` (`h-1`).
La tabla usa una variante sólida: `h-[2px] bg-[#00C49A]`.

---

## 2. Tokens de color (sistema shadcn/Radix)

Definidos en `:root` (claro) y `.dark` (oscuro) en formato **oklch**, y expuestos a
Tailwind en el bloque `@theme inline`:

| Token | Utilidades | Uso típico |
| --- | --- | --- |
| `--background` / `--foreground` | `bg-background`, `text-foreground` | lienzo y texto base |
| `--card`, `--popover` | `bg-card`, `bg-popover` | tarjetas, menús flotantes |
| `--primary` | `bg-primary`, `text-primary-foreground` | botón principal (navy) |
| `--secondary` | `bg-secondary` | botón secundario |
| `--muted` / `--muted-foreground` | `bg-muted`, `text-muted-foreground` | fondos suaves, texto auxiliar |
| `--accent` / `--accent-foreground` | `bg-accent`, `text-accent` | realces, hover de filas |
| `--destructive` | `bg-destructive` | acciones de borrado |
| `--border`, `--input`, `--ring` | `border-border`, `ring-ring` | bordes y anillos de foco |
| `--chart-1…5` | — | series de gráficas de shadcn |
| `--sidebar-*` | — | variante de tokens para el menú lateral |

El modo oscuro está **preparado pero no activado**: existe el variante
`@custom-variant dark (&:is(.dark *))` y el bloque `.dark`, pero ningún componente
alterna la clase todavía. Si se activa, hay que revisar los literales hex.

---

## 3. Colores semánticos

Se usan escalas de Tailwind, no tokens propios:

| Significado | Clases | Ejemplo real |
| --- | --- | --- |
| Éxito / ingreso | `emerald-*`, `text-emerald-500` | monto de ingreso en la tabla |
| Error / egreso / borrar | `red-*`, `rose-*` | monto de egreso, botón Eliminar |
| Advertencia | `amber-*` | `ProgressBar variant="orange"` |
| Información | `sky-*` / `cyan-*` | toast de carga, avatar del sidebar |
| Neutro / inactivo | `slate-*`, `gray-*` | `StatusBadge` inactivo |

**Toasts** (`src/components/FeedBack/ToasterCustom.tsx`, posición `bottom-right`, 4 s):

| Tipo | Fondo | Texto | Borde |
| --- | --- | --- | --- |
| success | `#ecfdf5` | `#065f46` | `#a7f3d0` |
| error | `#fef2f2` | `#991b1b` | `#fecaca` |
| loading | `#f0f9ff` | `#075985` | `#bae6fd` |

**Badges de estado** (`StatusBadge`): activo = `bg-emerald-50 text-emerald-700 ring-emerald-600/20`
con punto `animate-ping`; inactivo = `bg-slate-100 text-slate-500`.

**Píldoras de tipo de transacción** (`ViewModal`): egreso = rojo, ingreso = acento mint,
otros = muted.

---

## 4. Gráficas

Tema centralizado en `src/features/dashboard/utils/chartTheme.ts`:

```ts
CHART_NAVY  = "#0B1829"
CHART_MUTED = "#9CA3AF"
CHART_GRID  = "rgba(11, 24, 41, 0.06)"
```

- Tipografía de las gráficas: la misma del sitio (`var(--font-geist-sans)`), 12 px.
- Animación: 720 ms `easeOutQuart`; interacción por índice sobre el eje X.
- `applySavviChartDefaults()` aplica los defaults globales **una sola vez**.

Paleta categórica (`CATEGORY_CHART_COLORS` en `dashboard.utils.ts`), en este orden:

```
rgb(0,196,154)  rgb(0,168,140)  rgb(11,24,41)   rgb(6,182,212)
rgb(99,102,241) rgb(251,146,60) rgb(234,179,8)  rgb(236,72,153)
```

Se recorre cíclicamente (`i % length`) y cada barra se pinta con un degradado
horizontal del mismo color a distintas opacidades (0.45 → 0.95).

---

## 5. Tipografía

| | |
| --- | --- |
| Fuente principal | **Geist Sans** (`next/font/google`, variable `--font-geist-sans`) |
| Monoespaciada | **Geist Mono** (`--font-geist-mono`) |
| Alias Tailwind | `font-sans`, `font-mono`, `font-body` |
| Suavizado | `antialiased` en `<body>` |

Escala en uso:

| Clase | Uso |
| --- | --- |
| `text-3xl font-bold tracking-tight` | título de banner |
| `text-xl font-bold tracking-tight` | marca en el header |
| `text-lg font-bold` | título de modal |
| `text-base font-semibold` | encabezado de sección |
| `text-sm` | cuerpo, formularios, botones |
| `text-xs` | etiquetas, ayudas, badges |
| `text-[11px]` | metadatos del sidebar |
| `uppercase tracking-wider text-xs font-semibold` | encabezados de tabla y badges |
| `tabular-nums` | **obligatorio** en cifras (montos, porcentajes, contadores) |

---

## 6. Forma, espacio y elevación

**Radios** — base `--radius: 0.625rem`:

| Clase | Uso |
| --- | --- |
| `rounded-lg` | botones de icono, celdas pequeñas, filas de archivo |
| `rounded-xl` | inputs, selects, botones de formulario, avisos |
| `rounded-2xl` | tarjetas, contenedor de tabla, modal en escritorio |
| `rounded-full` | píldoras, badges, contadores, FAB, barras de progreso |

**Espaciado:** múltiplos de 4 px. Ritmo habitual: `gap-2` (controles),
`gap-3/4` (grupos), `space-y-4` (campos de formulario), `p-4` (fila),
`px-6 py-4` (celda de tabla), `p-8` (banner).

**Elevación:** `shadow-sm` en reposo → `shadow-md` en hover (filas de archivo);
`shadow-lg`/`shadow-xl` con sombra teñida en tarjetas y banners
(`shadow-xl shadow-slate-200/50`); `shadow-lg shadow-black/20` en el FAB móvil.

**Bordes:** `border-border` (token) como opción por defecto; `border-white/10`
sobre superficies oscuras; `border-dashed` en la zona de arrastre de archivos.

---

## 7. Inventario de componentes

Reutilizables (`src/components/`):

| Componente | Ruta | Notas visuales |
| --- | --- | --- |
| `Button` | `ui/shadcn-button.tsx` | `cva` con variantes `default · destructive · outline · secondary · ghost · link` y tamaños `default · sm · lg · icon · icon-sm · icon-lg` |
| `Modal` | `Modal/Modal.tsx` | cabecera navy `#0a1118` con icono mint en caja `bg-[#0d2820]/80`; pantalla completa en móvil, `rounded-2xl` centrado en `md+`; cuerpo con `scrollbar-modal` |
| `CustomTable` | `Table/CustomTable.tsx` | franja mint superior, cabecera `bg-muted/80`, filas alternas, hover `bg-accent/10`; **tabla en `md+`, tarjetas apiladas en móvil**; estados de carga y vacío incluidos |
| `PlannerTabs` | `Tabs/PlannerTabs.tsx` | pestaña activa: `border-b-2 border-[#00C49A] text-[#0B1829]`; contador en píldora `bg-muted` |
| `SavvySelect` | `Select/Select.tsx` | Radix Select con etiqueta, placeholder y soporte de iconos de flujo |
| `SavvyDatePicker` | `SavvyDatePicker/` | `react-day-picker` dentro de popover |
| `CurrencyField` | `Inputs/CurrencyInput/` | formato COP mientras se escribe |
| `FileUploader` | `File/FileUploader.tsx` | dropzone punteada, icono en círculo mint, lista de rechazos en rojo |
| `FileList` / `FileRow` | `File/` | miniatura o glifo por extensión, tamaño formateado, acciones descargar/quitar |
| `ProgressBar` | `ProgressBar/` | variantes `teal · navy · orange · red`, `role="progressbar"` |
| `LinearLoader` | `Loaders/LinearLoader.tsx` | barra mint con keyframe `savvi-linear-loader` |
| `StatusBadge` | `FeedBack/StatusBadge.tsx` | activo/inactivo con punto |
| `ToasterCustom` | `FeedBack/ToasterCustom.tsx` | configuración global de `react-hot-toast` |
| `SavvyBanner` (+ `Home`, `Light`) | `Banner/` | cabecera de página con orbes difuminados, patrón de puntos y badge |
| `Pagination` | `Pagination/` | paginación de `CustomTable` |

De dominio: `src/features/<feature>/components/**` (ver `docs/estructura-y-buenas-practicas.md`).

---

## 8. Patrones de interfaz

**Página estándar:** `SavvyBanner` (solo `md+`) → botón de acción alineado a la derecha
(`+ Crear …`) → `PlannerTabs` → filtros → tabla. En móvil el botón se reemplaza por un
**FAB** fijo (`fixed bottom-6 right-6`, 56 px, navy, `active:scale-95`).

**Formularios:** etiqueta `text-sm font-medium` arriba del control; controles
`rounded-xl border border-border bg-white px-3 py-2 text-sm`; foco
`focus:border-accent focus:ring-2 focus:ring-accent/25` (o la variante mint
`focus:ring-[#00C49A]/25`); `textarea` con `resize-none`; secciones separadas por
`border-t border-border pt-4`; botones al pie, **Cancelar** (`outline`) a la izquierda
de **Guardar** (navy), en columna invertida en móvil (`flex-col-reverse sm:flex-row`).

**Acciones de fila:** píldora `Ver` con borde acento, `Editar` con borde neutro,
`Eliminar` en rojo que exige un segundo clic para confirmar.

**Confirmaciones destructivas:** modal chico (`max-w-sm`, sin icono) con el texto del
efecto real ("Esta acción no se puede deshacer" / "se borrará definitivamente"),
**Cancelar** + botón `destructive`.

**Estados:**

| Estado | Tratamiento |
| --- | --- |
| Cargando (lista) | `LinearLoader` centrado dentro del contenedor |
| Cargando (modal) | capa `absolute inset-0 bg-white/80 backdrop-blur-sm` con spinner; si hay subida, `ProgressBar` |
| Vacío | icono en caja `bg-muted` + título + frase de apoyo |
| Error | toast rojo con el mensaje del API (uno por mensaje de validación) |
| Progreso de subida | `ProgressBar` + botón deshabilitado con texto "Subiendo archivos…" |

---

## 9. Iconografía

- **`lucide-react`** es la librería por defecto (`Receipt`, `Eye`, `Pencil`, `Trash2`,
  `Upload`, `RotateCcw`, `TrendingUp`, `Wallet`…). Tamaños `h-3.5` (en píldoras),
  `h-4`/`h-5` (acciones), `h-6`/`h-7` (destacados), `strokeWidth={2}`.
- **`@heroicons/react/24/outline`** se mantiene en los componentes de archivo y tabla
  (`ArrowDownTrayIcon`, `DocumentIcon`, `PhotoIcon`, `XMarkIcon`).
- El icono de cabecera de modal va siempre en mint `#00C49A`.
- Iconos decorativos: `aria-hidden`. Botones de solo icono: `aria-label` obligatorio.
- Imágenes de tipo de archivo: `public/icons/pdf.png`.

---

## 10. Movimiento

- Transiciones de interfaz: `transition`/`transition-colors`, ~150–200 ms.
- Modal (Radix + `tw-animate-css`): `data-[state=open]:animate-in fade-in duration-200 ease-out`.
- Barra indeterminada: `savvi-linear-loader`, 1.25 s `ease-in-out` infinita.
- Gráficas: 720 ms `easeOutQuart`.
- Realimentación táctil: `active:scale-95` en el FAB.
- Punto "en vivo": `animate-ping` (solo en estados activos, nunca decorativo).

---

## 11. Barras de desplazamiento

Personalizadas en `globals.css` con degradado mint y 6 px de ancho:

| Clase | Uso |
| --- | --- |
| `html` (global) | página |
| `.scrollbar-clean` | navegación del sidebar |
| `.scrollbar-modal` | cuerpo de los modales |
| `.scrollbar-none` | listas horizontales (pestañas) |

---

## 12. Formato de datos

- **Moneda:** `Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" })`.
  En gráficas se compacta desde 1.000.000 (`$ 1,2 M`).
- **Fechas:** `YYYY-MM-DD` en datos y formularios.
- **Signo:** ingresos con `+` en verde, egresos con `-` en rojo.
- **Números:** siempre `tabular-nums` para que no bailen al actualizarse.
- **Idioma:** toda la interfaz en español (es-CO), incluidos errores y toasts.

---

## 13. Responsive

Un solo corte importante: **`md` (768 px)**.

| | Móvil | `md+` |
| --- | --- | --- |
| Menú | oculto (header) | `aside` fijo de 248 px |
| Banner | oculto | visible |
| Crear | FAB flotante | botón en la barra superior |
| Tablas | tarjetas apiladas | tabla clásica |
| Modales | pantalla completa | centrados, `max-w-lg/xl`, `max-h-[min(90vh,52rem)]` |
| Botones de formulario | ancho completo, apilados | en línea a la derecha |

---

## 14. Accesibilidad

Lo que ya se cumple y hay que mantener:

- `role="tablist"`/`role="tab"` + `aria-selected` en pestañas; `role="progressbar"` con
  `aria-valuenow/min/max`; `role="status"` + `aria-live="polite"` en cargas.
- `aria-label` en botones de solo icono ("Cerrar", "Crear transacción").
- Foco visible en todo control interactivo (`focus-visible:ring-2`), con el anillo mint.
- Contraste: texto secundario con `text-muted-foreground`, nunca gris sobre gris.
- Storybook trae **`@storybook/addon-a11y`**: revisar el panel al crear un componente.

---

## 15. Al agregar interfaz nueva

1. ¿Existe ya el componente en `src/components/`? Reutilízalo antes de crear otro.
2. Usa tokens (`bg-muted`, `text-muted-foreground`, `border-border`) antes que hex.
3. Compón clases con `cn()`; nunca concatenes strings de Tailwind a mano.
4. Respeta los radios (`xl` en controles, `2xl` en contenedores, `full` en píldoras).
5. Cifras con `tabular-nums` y formato COP.
6. Diseña el móvil primero: el corte es `md`.
7. Cubre los cuatro estados: normal, cargando, vacío y error.
8. Si el componente es reutilizable, agrega su `*.stories.tsx`.
