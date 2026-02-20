# Anime Catalog Monorepo

Monorepo full-stack con:

- **Backend**: Node.js + Express + MongoDB Atlas + Mongoose
- **Frontend Angular**: app con routing, formularios reactivos y Bootstrap
- **Frontend React**: Vite + React Router + Axios + Bootstrap

Ambos frontends consumen la **misma API** (`http://localhost:3000/api/v1`).

## Estructura

- `backend`
- `frontend-angular`
- `frontend-react`

## Nota sobre `.env`

- No se versionan credenciales reales.
- Usa `backend/.env.example` como plantilla.
- `backend/.env` está ignorado en `backend/.gitignore`.

## Comandos exactos

### 1) Instalar dependencias backend

```bash
cd backend
npm install
```

### 2) Levantar backend

```bash
cd backend
npm run dev
```

### 3) Correr seed

```bash
cd backend
npm run seed
```

### 4) Levantar Angular

```bash
cd frontend-angular
npm install
npm start
```

### 5) Levantar React

```bash
cd frontend-react
npm install
npm run dev
```

## Endpoints principales

Base: `/api/v1`

- `GET /api/v1/health`
- `GET|POST /api/v1/studios`
- `GET|PATCH|DELETE /api/v1/studios/:id`
- `GET|POST /api/v1/animes`
- `GET|PATCH|DELETE /api/v1/animes/:id`

## Reglas de negocio

1. No duplicados de `Studio.name` (case-insensitive).
2. No duplicados de `Anime.title` (case-insensitive).
3. `rating` en rango `0..10`.
4. `episodes >= 1`.
5. `genres` con mínimo un valor y filtro por `genre` en listado de animes.

## Filtros y paginación (animes)

`GET /api/v1/animes` soporta:

- `page`, `limit`
- `search`
- `genre`
- `isOngoing`
- `studioId`
- `minRating`, `maxRating`

Respuesta:

```json
{
  "data": [],
  "page": 1,
  "limit": 10,
  "total": 0,
  "totalPages": 1
}
```
