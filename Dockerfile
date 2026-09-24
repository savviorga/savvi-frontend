# syntax=docker/dockerfile:1

# ---- Etapa 1: dependencias + build ----
# Dependencias y compilación van en la MISMA etapa a propósito. Con una etapa
# `deps` aparte, node_modules (casi 1 GB, decenas de miles de archivos) se
# escribía dos veces: una al instalarlo y otra al copiarlo de etapa a etapa.
# La caché no se pierde por juntarlas: copiar primero el lockfile mantiene
# `npm ci` en su propia capa, así que solo se reinstala si cambian las
# dependencias, no cada vez que se toca el código.
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
# La caché de npm sobrevive entre builds (no se vuelve a descargar el mundo) y
# `sharing=locked` hace que dos builds simultáneos se turnen en vez de saturar
# el disco a la vez.
RUN --mount=type=cache,target=/root/.npm,sharing=locked npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* se inyecta en tiempo de build: debe estar disponible ANTES de `npm run build`.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_URL_ANALITICA
ENV NEXT_PUBLIC_URL_ANALITICA=$NEXT_PUBLIC_URL_ANALITICA
RUN npm run build

# ---- Etapa 2: runtime ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuario sin privilegios
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copia la salida standalone generada por Next.js
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
