# Estructura y buenas prácticas — Savvi Frontend

Cómo está organizado el proyecto, qué convenciones se siguen hoy y qué se espera de
cualquier código nuevo. La línea visual está en [`linea-grafica.md`](./linea-grafica.md).

---

## 1. Stack

| Pieza | Versión / herramienta |
| --- | --- |
| Framework | Next.js 16 — **App Router**, Turbopack |
| UI | React 19 + TypeScript 5 (`strict: true`) |
| Estilos | Tailwind CSS v4 (config dentro del CSS) |
| Primitivas | Radix UI (dialog, select, popover, slot) + shadcn |
| Iconos | `lucide-react` (principal), `@heroicons/react` (heredado) |
| Gráficas | Chart.js + `react-chartjs-2` (+ plugin de zoom) |
| Formularios | Estado controlado con `useState` (sin librería de formularios) |
| Feedback | `react-hot-toast` |
| Archivos | `react-dropzone` + subida directa a S3 con URL prefirmada |
| Documentación viva | Storybook 10 (`@storybook/nextjs-vite`) |
| Pruebas | Vitest 4 + Playwright (navegador) vía `@storybook/addon-vitest` |
| Backend | API NestJS aparte (`savvi-backed`), consumida por HTTP con JWT |

Scripts: `npm run dev`, `build`, `start`, `lint`, `storybook`, `build-storybook`.

---

## 2. Árbol del proyecto

```
savvi-frontend/
├── app/                        # App Router: solo rutas y composición de página
│   ├── layout.tsx              # fuentes, AuthProvider, ToasterCustom, MainLayout
│   ├── globals.css             # tokens de diseño (Tailwind v4)
│   ├── api/auth/[...nextauth]/ # route handler de autenticación
│   ├── dashboard/  transactions/  accounts/  categories/
│   ├── budget/[id]/  planificador/  transferencias/  savvi-ia/
│   └── login/  register/  list/
├── src/
│   ├── components/             # UI reutilizable, SIN reglas de negocio
│   │   ├── ui/                 # primitivas shadcn/Radix (button, dialog, select…)
│   │   ├── Modal/ Table/ Select/ File/ Inputs/ Tabs/ Banner/
│   │   ├── ProgressBar/ Loaders/ Spinner/ Pagination/ FeedBack/
│   │   └── auth/ProtectedRoute.tsx
│   ├── features/<feature>/     # una carpeta por dominio (ver §3)
│   ├── layouts/                # MainLayout, SideBarMenu
│   ├── hooks/                  # hooks transversales (useS3Upload)
│   ├── lib/                    # helpers sin estado (HTTP, auth, formato, límites)
│   └── types/                  # tipos compartidos (api-error.type.ts)
├── docs/                       # esta documentación
├── public/                     # estáticos (icons/, imágenes)
└── .storybook/                 # configuración de Storybook
```

**Alias de importación:** `@/*` → `src/*` (definido en `tsconfig.json`).
Usa siempre el alias para cruzar carpetas; deja las rutas relativas (`../types/…`)
solo para moverte dentro de la misma feature.

---

## 3. Organización por features

Cada dominio vive en `src/features/<feature>/` con esta forma:

```
src/features/transactions/
├── components/          # UI del dominio
│   └── modals/          # modales del dominio
├── hooks/               # estado + orquestación (useTransactions, useTransactionDocuments)
├── services/            # cliente HTTP del dominio (transaction.service.ts)
├── types/               # modelos y DTOs (transactions.types.ts, catalog.types.ts)
├── utils/               # lógica pura (filtros, formato, defaults)
└── constants/           # constantes del dominio
```

Features existentes: `accounts`, `auth`, `budgets`, `categories`, `dashboard`,
`layout`, `payment-planner`, `savvi-ia`, `transactions`, `transfer-templates`,
`waitinglist`. Algunas añaden `dto/`, `context/` (auth) o `mocks/`.

**Dónde poner cada cosa**

| Lo que vas a escribir | Va en |
| --- | --- |
| Componente que solo sirve a un dominio | `features/<feature>/components/` |
| Componente reutilizable por varios dominios | `src/components/` |
| Llamada HTTP | `features/<feature>/services/` |
| Estado + toasts + orquestación | `features/<feature>/hooks/` |
| Función pura (formato, filtros, validación) | `features/<feature>/utils/` o `src/lib/` |
| Tipo del dominio | `features/<feature>/types/` |
| Helper usado por todo el sistema | `src/lib/` |

---

## 4. Arquitectura en capas

```
app/<ruta>/page.tsx        →  compone la pantalla; sin fetch ni lógica de negocio
  └── hook de feature      →  estado, carga, toasts, orquestación
        └── service        →  HTTP, cabeceras, parseo de error, normalización
              └── API NestJS
```

Ejemplo real de transacciones:

```
app/transactions/page.tsx
  useTransactions()                     → transactions, loading, create/update/remove
    TransactionService.update(id, dto)  → PATCH /transactions/:id
  useTransactionDocuments(id, enabled)  → adjuntos + borrado individual
```

Reglas:

1. **Los componentes no hacen `fetch` directo.** Siempre pasan por un service.
2. **Los services no muestran toasts.** Lanzan `ApiError`; el hook decide qué mostrar.
3. **Los hooks no lanzan.** Devuelven `boolean` (o `null`) y notifican al usuario.
4. **Las páginas no arman payloads del API**; reciben el del formulario y delegan.

---

## 5. Services (cliente HTTP)

Patrón establecido en `src/features/transactions/services/transaction.service.ts`:

```ts
function transactionsApi(): string {
  const root = getPublicApiUrl();
  if (!root) throw { message: "Falta NEXT_PUBLIC_API_URL…", error: "Config", statusCode: 500 } satisfies ApiError;
  return `${root}/transactions`;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) throw await parseHttpErrorResponse(res);
  return res.json();
}

export const TransactionService = {
  getAll: async (): Promise<Transaction[]> => {
    const res = await fetch(transactionsApi(), { headers: getBearerAuthHeaders() });
    return (await handleResponse<Transaction[]>(res)).map(normalizeTransaction);
  },
  // …
};
```

Lo que aporta cada helper de `src/lib/`:

| Helper | Para qué |
| --- | --- |
| `public-api-url.ts` | lee `NEXT_PUBLIC_API_URL` y quita la barra final |
| `api-auth.ts` | `getBearerAuthHeaders()` (FormData) y `getJsonAuthHeaders()` (JSON) |
| `parse-http-error-response.ts` | convierte cualquier respuesta fallida en `ApiError`, incluso HTML de nginx (`413`) |
| `api-fetch.ts` | `apiUrl()` + `apiFetch()` con mensaje claro si el API no responde |
| `document-constraints.ts` | límites y MIME permitidos de adjuntos, compartidos con el backend |
| `utils.ts` | `cn()` |

Convenciones:

- Un objeto `XService` exportado por dominio, con métodos nombrados como la intención
  (`getAll`, `getById`, `create`, `update`, `remove`, `getDocuments`…).
- **Normaliza en el borde:** lo que el API entrega raro se arregla aquí, no en la vista
  (ejemplo: `amount` llega como string por el `decimal` de Postgres → `Number(...)`).
- Nunca envíes `userId`: el backend lo toma del token.
- `api.ts` (instancia de axios) queda de la etapa anterior: **el estándar es `fetch`**.

---

## 6. Hooks de feature

```ts
export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  async function update(id: string, payload: Partial<TransactionFormPayload>): Promise<boolean> {
    try { …; toast.success("Transacción actualizada exitosamente"); return true; }
    catch (error) { notifyError(error, "Error al actualizar la transacción"); return false; }
  }

  useEffect(() => { load(); }, []);
  return { transactions, loading, create, update, remove, reload: load };
}
```

- Exponen datos + `loading` + acciones + `reload`.
- Devuelven `boolean` para que la página decida si cerrar el modal.
- Concentran los mensajes al usuario (un `toast` por mensaje de validación del API).
- Recargan desde el servidor tras escribir (`await load()`), salvo borrados donde se
  actualiza la lista en memoria.

---

## 7. Tipos y manejo de errores

- Un archivo de tipos por dominio: modelo (`Transaction`), DTO de creación
  (`CreateTransactionDto`), DTO de edición (`UpdateTransactionDto`) y el payload del
  formulario (`TransactionFormPayload`). Comenta el porqué cuando el tipo no es obvio.
- Error estándar en `src/types/api-error.type.ts`:

```ts
if (isApiError(error)) getErrorMessages(error).forEach((m) => toast.error(m));
else toast.error("Error al …");
```

- `getErrorMessages` cubre el caso de NestJS que devuelve `message` como arreglo.
- **Evita `any`.** Quedan usos heredados (`ViewModal`, `BulkModal`); no agregues más.
- Los mensajes de error deben decir qué hacer, no solo qué falló
  (ver `parse-http-error-response.ts` y `useS3Upload`).

---

## 8. Autenticación

- `AuthProvider` (`features/auth/context/AuthContext.tsx`) guarda `{ user, access_token }`
  en `localStorage` bajo la clave **`savvi_auth`**, con lectura defensiva (`try/catch`
  y guarda de SSR).
- Los services obtienen el token mediante `getBearerAuthHeaders()`; **ningún componente
  arma el header a mano**.
- `ProtectedRoute` redirige a `/login?callbackUrl=…` cuando no hay sesión.
- `MainLayout` decide si muestra el sidebar según la ruta y la sesión.

---

## 9. Subida de archivos (S3)

Flujo por defecto — **URL prefirmada**, para no chocar con el límite de cuerpo del hosting:

```
useS3Upload.uploadFiles(files, `transactions/${id}`)
  1. POST /s3/presigned-url      → { url, key }   (expira en 60 s)
  2. PUT  <url> directo a S3     (sin Authorization; progreso vía XHR)
  3. vincular en el backend:
     · al crear  → POST /transactions/confirm-upload
     · al editar → PATCH /transactions/:id con filesToAdd
```

Prácticas aplicadas:

- Validación en cliente antes de pedir la URL (`validateDocumentFile`): 20 MB, máx. 10
  archivos, lista de MIME permitidos — los mismos valores que valida el backend, en un
  solo archivo (`src/lib/document-constraints.ts`) para que no se desincronicen.
- Reintentos (2) con espera creciente y `AbortController` para cancelar.
- Progreso por archivo con `XMLHttpRequest` (fetch no expone progreso de subida).
- Las URLs de descarga son prefirmadas y **caducan en 1 hora**: se piden cada vez que se
  abre el detalle, nunca se cachean en el estado global.
- En edición, los adjuntos se **marcan** para borrar y se eliminan al guardar
  (`documentsToDelete`), para que cancelar no pierda archivos.

---

## 10. Estado y persistencia local

- Estado de servidor: hooks de feature (no hay React Query ni store global).
- Estado de UI: `useState` en el componente más cercano.
- `localStorage` solo para conveniencias, siempre con `try/catch` y guarda de SSR
  (`typeof window === "undefined"`), y con prefijo **`savvi_`**:

| Clave | Contenido |
| --- | --- |
| `savvi_auth` | sesión (usuario + token) |
| `savvi_last_transaction` | prellenado del formulario de transacciones |

---

## 11. Convenciones de código

- `"use client"` en todo componente con estado, efectos o eventos; las páginas del App
  Router lo declaran cuando usan hooks.
- Un componente por archivo, `export default`; nombre de archivo = nombre del componente
  (`PascalCase.tsx`). Hooks en `camelCase.ts` con prefijo `use`.
- Servicios `*.service.ts`, tipos `*.types.ts` / `*.type.ts`, utilidades `*.utils.ts` o
  nombre descriptivo (`transactionFilters.ts`).
- Comentarios **en español y sobre el porqué**, no sobre el qué:
  `/** `amount` llega como string por el `decimal` de Postgres. */`
- Interfaz, mensajes y documentación en español (es-CO).
- Estilos con Tailwind + `cn()`; sin CSS suelto salvo `globals.css`.
- Nada de lógica en `app/**/page.tsx` más allá de componer y enrutar callbacks.

---

## 12. Storybook y pruebas

- Los componentes reutilizables llevan `*.stories.tsx` junto al componente
  (`Modal`, `CustomTable`, `ProgressBar`, `File`, `FileUploader`, `SavvyBanner*`).
- Formato: `satisfies Meta<typeof X>` + `StoryObj`, `tags: ["autodocs"]`, `fn()` para
  acciones, y una historia por estado relevante (vacío, completo, error).
- `@storybook/addon-a11y` revisa accesibilidad; `@storybook/addon-vitest` corre las
  historias como pruebas en Chromium (Playwright).
- Ampliar cobertura de historias es la vía preferida para probar UI nueva.

---

## 13. Calidad antes de subir

```bash
npm run lint          # ESLint (next/core-web-vitals + typescript + storybook)
npx tsc --noEmit      # tipos
npm run build         # build de producción
```

Los tres deben pasar. Ten en cuenta la deuda ya conocida (no la aumentes):

- `react-hooks/set-state-in-effect` en `TransactionModal` (efecto que rellena el formulario).
- `@typescript-eslint/no-explicit-any` en `ViewModal` y `BulkModal`.
- Archivos vacíos o duplicados: `components/FormTransaction.tsx`,
  `constants/transaction.constants.ts`, `utils/transaction.utils.ts`,
  `modals/TransactionTable copy.tsx`, `src/hooks/useDocuments.ts` (copia de cuentas sin uso),
  `paleta-colores.md` (vacío; su contenido vive ahora en `docs/linea-grafica.md`).

---

## 14. Entornos y despliegue

- `NEXT_PUBLIC_API_URL` apunta al backend Nest **sin barra final**. Se inyecta en
  **tiempo de build**: en Docker va como `--build-arg`, en Vercel como variable de
  entorno + redespliegue. Si falta, los services lanzan un `ApiError` explicando cómo
  configurarla.
- Si el front está en `https://`, el API también debe estarlo (el navegador bloquea
  contenido mixto y las subidas fallan).
- El `Dockerfile` es multi-etapa y usa la salida `standalone` de Next.js.
  Detalle completo en el [`README.md`](../README.md).
- Contrato del API de transacciones y adjuntos: `savvi-backed/FRONT.md`, que mantiene el equipo de backend.

---

## 15. Checklist para una feature nueva

1. Crear `src/features/<feature>/` con `types/`, `services/`, `hooks/`, `components/`.
2. Definir modelo y DTOs en `types/` antes de escribir la primera llamada.
3. Escribir el service con `handleResponse` + `parseHttpErrorResponse` + cabeceras de `api-auth`.
4. Escribir el hook: `loading`, acciones que devuelven `boolean`, toasts en español.
5. Construir la UI reutilizando `src/components/`; crear allí lo que sirva a más de un dominio.
6. Cubrir los cuatro estados: normal, cargando, vacío y error.
7. Agregar `*.stories.tsx` si el componente es reutilizable.
8. Verificar móvil (`md` es el corte) y accesibilidad (foco, `aria-label`).
9. Correr lint + tipos + build.
