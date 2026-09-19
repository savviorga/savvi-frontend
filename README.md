This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Docker

Este proyecto incluye un `Dockerfile` multi-etapa que usa la salida `standalone` de Next.js para generar una imagen de producción liviana.

### Variables de entorno: build vs. runtime

Es **clave** entender esta diferencia para que la app funcione en Docker:

- **`NEXT_PUBLIC_*`** (p. ej. `NEXT_PUBLIC_API_URL`) → se **inyectan en tiempo de build**
  (`npm run build`) y quedan "horneadas" dentro del bundle de JavaScript del navegador.
  Hay que pasarlas como **build arg** con `--build-arg`. Pasarlas solo con `--env-file`
  o `-e` en el `run` **NO** funciona: quedarán como `undefined` (síntoma típico: peticiones
  a `http://.../undefined/auth/login` que devuelven `404`).
- **Variables solo de servidor** (p. ej. `NEXTAUTH_SECRET`, `PORT`) → se leen en
  **tiempo de ejecución** y se pasan con `--env-file .env` o `-e` en el `run`.

### Construir la imagen

Pasa la URL del backend como build arg (debe ser una IP/host accesible **desde el navegador**
del usuario, no desde dentro del contenedor):

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://192.168.1.11:4051 \
  -t savvi-frontend .
```

### Ejecutar el contenedor

```bash
docker run -d --name savvi-frontend --restart unless-stopped -p 4050:3000 --env-file .env savvi-frontend
```

Esto deja el contenedor corriendo en segundo plano (`-d`), lo reinicia automáticamente
salvo que se detenga manualmente (`--restart unless-stopped`), expone la app en el
puerto `4050` del host (mapeado al `3000` interno) y carga las variables de servidor del archivo `.env`.

Luego abre [http://localhost:4050](http://localhost:4050) en tu navegador.

El puerto interno se puede cambiar con la variable `PORT` (por defecto `3000`):

```bash
docker run -p 8080:8080 -e PORT=8080 savvi-frontend
```

### Detener, eliminar y reiniciar el contenedor

Comandos básicos de gestión:

```bash
# Detener el contenedor
docker stop savvi-frontend

# Iniciar de nuevo un contenedor ya existente (sin recrearlo)
docker start savvi-frontend

# Reiniciar el contenedor
docker restart savvi-frontend

# Eliminar el contenedor (debe estar detenido)
docker rm savvi-frontend

# Detener y eliminar en un solo paso (forzado)
docker rm -f savvi-frontend
```

### Aplicar cambios en las variables de entorno

- Si cambiaste una variable **de servidor** (`NEXTAUTH_SECRET`, `PORT`, …): basta con
  recrear el contenedor, ya que el `.env` se lee solo al crearlo (un `restart` **no** toma
  los nuevos valores):

  ```bash
  docker rm -f savvi-frontend
  docker run -d --name savvi-frontend --restart unless-stopped -p 4050:3000 --env-file .env savvi-frontend
  ```

- Si cambiaste una variable **`NEXT_PUBLIC_*`** (como `NEXT_PUBLIC_API_URL`): debes
  **reconstruir la imagen** con el nuevo `--build-arg` y luego recrear el contenedor
  (ver siguiente sección). Recrear el contenedor por sí solo no basta.

### Traer nuevos cambios del código

Cuando hagas `git pull` con cambios de código, hay que reconstruir la imagen y recrear
el contenedor:

```bash
git pull
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://192.168.1.11:4051 \
  -t savvi-frontend .
docker rm -f savvi-frontend
docker run -d --name savvi-frontend --restart unless-stopped -p 4050:3000 --env-file .env savvi-frontend
```

### Ver logs y estado

```bash
# Ver el estado del contenedor
docker ps -a --filter name=savvi-frontend

# Seguir los logs en tiempo real
docker logs -f savvi-frontend
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
