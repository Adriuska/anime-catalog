# Anime Catalog Monorepo

Monorepo full-stack para catálogo de animes y estudios con un backend único y dos clientes frontend.

- Backend: Node.js + Express + MongoDB + Mongoose
- Frontend React: Vite + React Router + Axios + Bootstrap
- Frontend Angular: Angular standalone + Router + HttpClient + Bootstrap

Ambos frontends consumen la misma API REST en `http://localhost:3000/api/v1`.

---

## 1) Qué hace el proyecto

El sistema permite gestionar:

- Estudios (crear, listar, ver detalle, editar, eliminar)
- Animes (CRUD completo + filtros + paginación + endpoint de discover)

Además, incluye:

- Validaciones de negocio y de esquema en backend
- Manejo centralizado de errores HTTP
- Seed de datos iniciales (estudios + animes)
- UI React y Angular para operar sobre la misma base de datos

---

## 2) Estructura del repositorio

```text
anime-catalog/
├─ backend/            # API REST (Express + Mongoose)
├─ frontend-react/     # Cliente React (Vite)
└─ frontend-angular/   # Cliente Angular (standalone)
```

---

## 3) Arquitectura y flujo general

1. El frontend (React o Angular) hace peticiones HTTP al backend.
2. Express enruta a controladores (`controllers`).
3. Controladores aplican filtros/paginación/lógica de negocio.
4. Modelos Mongoose (`models`) validan y persisten en MongoDB.
5. Middlewares gestionan errores, rutas inexistentes e IDs inválidos.

### Backend (arranque)

- `server.js` carga variables de entorno y conecta MongoDB (`connectDB`).
- Si MongoDB conecta, levanta `app.js` en `PORT` (default `3000`).
- `app.js` monta rutas bajo `/api/v1`.

Importante: `http://localhost:3000/` devuelve 404 por diseño. Usa rutas bajo `/api/v1`.

---

## 4) Requisitos

- Node.js (LTS recomendado)
- npm
- MongoDB (Atlas o local) accesible con URI válida

Variables necesarias en `backend/.env`:

```env
PORT=3000
MONGODB_URI=mongodb+srv://...
```

---

## 5) Puesta en marcha rápida

### 5.1 Backend

```bash
cd backend
npm install
npm run dev
```

Comprobar salud:

```bash
GET http://localhost:3000/api/v1/health
```

Respuesta esperada:

```json
{ "ok": true }
```

### 5.2 Seed de datos

```bash
cd backend
npm run seed
```

El seed limpia colecciones y vuelve a insertar estudios y animes.

### 5.3 Frontend React

```bash
cd frontend-react
npm install
npm run dev
```

URL habitual: `http://localhost:5173`

### 5.4 Frontend Angular

```bash
cd frontend-angular
npm install
npm start
```

URL habitual: `http://localhost:4200`

---

## 6) Backend en detalle

### 6.1 Scripts (`backend/package.json`)

- `npm run dev`: levanta con nodemon
- `npm start`: levanta con node
- `npm run seed`: ejecuta semilla

### 6.2 Middlewares

- `validateObjectId`: devuelve 400 si `:id` no es ObjectId válido
- `notFound`: marca 404 para rutas inexistentes
- `errorHandler`: normaliza errores en formato JSON

Formato de error:

```json
{
  "error": {
    "message": "...",
    "statusCode": 400
  }
}
```

Reglas del `errorHandler`:

- `ValidationError` (Mongoose) -> 400
- `CastError` -> 400
- `code 11000` (duplicado unique index) -> 409
- resto -> 500 (o status previamente asignado)

### 6.3 Modelos y reglas de negocio

#### Studio

Campos principales:

- `name` (requerido)
- `nameNormalized` (interno, unique, minúsculas)
- `country` (opcional)
- `foundedDate` (opcional)
- `isActive` (boolean, default `true`)

Regla clave:

- No permite estudios duplicados por nombre (case-insensitive) usando `nameNormalized`.

#### Anime

Campos principales:

- `title` (requerido)
- `titleNormalized` (interno, unique, minúsculas)
- `description` (mínimo 10 caracteres)
- `posterUrl` (requerido, `http://` o `https://`)
- `bannerUrl` y `trailerUrl` (opcionales, URL HTTP/S si existen)
- `episodes` (mínimo 1)
- `durationMinutes` (opcional, mínimo 1)
- `releaseDate` (requerido)
- `season` (`Winter|Spring|Summer|Fall`)
- `year` (1950..2100, autocalculado desde `releaseDate` si no se envía)
- `ageRating` (`G|PG|PG-13|R|R+|RX`)
- `isOngoing` (requerido)
- `rating` (0..10)
- `genres` (array con al menos 1 valor)
- `studio` (ObjectId ref `Studio`, opcional)

Lógica automática en `pre('validate')`:

- Normaliza título/nombre para controlar duplicados
- Limpia `genres` (trim, elimina vacíos y repetidos)
- Completa `year` desde `releaseDate` cuando falta

---

## 7) API REST detallada

Base URL: `/api/v1`

### 7.1 Health

#### GET `/health`

Comprueba que la API está viva.

Respuesta 200:

```json
{ "ok": true }
```

---

### 7.2 Studios

#### GET `/studios`

Lista estudios ordenados por nombre ascendente.

#### GET `/studios/:id`

Devuelve un estudio por ID.

- 200 si existe
- 404 si no existe
- 400 si `id` inválido

#### POST `/studios`

Crea un estudio.

Body ejemplo:

```json
{
  "name": "Bones",
  "country": "Japan",
  "foundedDate": "1998-10-01",
  "isActive": true
}
```

Respuesta:

- 201 con documento creado
- 400 por validación
- 409 por duplicado de nombre

#### PATCH `/studios/:id`

Actualiza parcialmente un estudio.

#### DELETE `/studios/:id`

Elimina estudio.

- 204 sin body en éxito

---

### 7.3 Animes

#### GET `/animes`

Listado con filtros, paginación y orden.

Query params soportados:

- `page` (default `1`)
- `limit` (default `10`)
- `search` (regex sobre `title`, case-insensitive)
- `genre` (match en `genres`)
- `season` (`winter|spring|summer|fall` o capitalizado)
- `year` (numérico)
- `isOngoing` (`true|false`)
- `studioId` (ObjectId)
- `minRating`, `maxRating` (rango)
- `sortBy` (`createdAt|rating|releaseDate|title|episodes`)
- `order` (`asc|desc`, default `desc`)

Respuesta ejemplo:

```json
{
  "data": [],
  "page": 1,
  "limit": 10,
  "total": 0,
  "totalPages": 1,
  "sortBy": "createdAt",
  "order": "desc"
}
```

#### GET `/animes/discover`

Endpoint para home tipo streaming con bloques prefiltrados.

Respuesta:

- `hero`: anime destacado
- `topRated`: top por rating
- `trending`: estrenos/recientes (`releaseDate <= now`)
- `ongoing`: en emisión
- `upcoming`: próximos (`releaseDate > now`)
- `genres`: listado de géneros únicos ordenados
- `stats`: `{ total, ongoing, upcoming }`

#### GET `/animes/:id`

Detalle de anime por ID (con `studio` poblado).

#### POST `/animes`

Crea anime.

Body ejemplo:

```json
{
  "title": "Demon Slayer",
  "description": "A young swordsman joins a corps to cure his sister and fight demons.",
  "posterUrl": "https://via.placeholder.com/300x450?text=Demon+Slayer",
  "bannerUrl": "https://images.example.com/demon-slayer-banner.jpg",
  "trailerUrl": "https://www.youtube.com/watch?v=example",
  "episodes": 55,
  "durationMinutes": 24,
  "releaseDate": "2019-04-06",
  "season": "Spring",
  "year": 2019,
  "ageRating": "PG-13",
  "isOngoing": true,
  "rating": 8.6,
  "genres": ["Action", "Fantasy"],
  "studio": "65f1a2..."
}
```

#### PATCH `/animes/:id`

Actualización parcial.

#### DELETE `/animes/:id`

Eliminación física del documento.

- 204 sin body

---

## 8) Frontend React (qué hace)

### Routing

- `/animes` listado + filtros + discover
- `/animes/new` crear anime
- `/animes/:id` detalle
- `/animes/:id/edit` editar
- `/studios` listado estudios
- `/studios/new` crear estudio
- `/studios/:id` detalle estudio
- `/studios/:id/edit` editar estudio

### Cliente HTTP

- `src/api/axios.js` con `baseURL = http://localhost:3000/api/v1`

### Comportamiento funcional

- Anime list consume:
  - `GET /animes`
  - `GET /animes/discover`
  - `GET /studios` (para filtros)
- Filtros avanzados: búsqueda, género, season, year, estado, studio, rating, orden
- CRUD completo en animes y studios
- Confirmación al eliminar
- Mensajes de éxito/error y loader
- Fallback de imágenes por título (`utils/animeImages.js`)

---

## 9) Frontend Angular (qué hace)

### Routing

Mismas rutas funcionales que React para animes y studios.

### Cliente HTTP

- `API_BASE_URL = http://localhost:3000/api/v1`
- `AnimeService` y `StudioService` encapsulan peticiones REST

### Comportamiento funcional

- `AnimeListComponent`: listado, filtros básicos y paginación
- `AnimeFormComponent`: alta/edición con Reactive Forms + validaciones
- `StudioListComponent` y `StudioFormComponent`: CRUD de estudios
- Confirm modal, alert y loader en componentes compartidos
- Sugerencia/fallback de imagen por título (`core/anime-images.ts`)

---

## 10) Diferencias React vs Angular

- Ambos comparten API y capacidad CRUD.
- React implementa además `discover`, bloques destacados y más filtros (`season`, `year`, `sortBy`, `order`).
- Angular mantiene una versión más compacta de listado/filtros.

---

## 11) Status codes esperados

- `200` lectura/actualización
- `201` creación
- `204` eliminación
- `400` validación / ID inválido
- `404` recurso o ruta no encontrada
- `409` duplicados (índices únicos)
- `500` error interno

---

## 12) Troubleshooting

### No responde en `http://localhost:3000/`

Es normal: la API vive en `/api/v1`, no en la raíz.

Usa:

- `http://localhost:3000/api/v1/health`
- `http://localhost:3000/api/v1/animes`
- `http://localhost:3000/api/v1/studios`

### `npm start` backend falla

Revisar:

1. `backend/.env` existe y tiene `MONGODB_URI` válida.
2. MongoDB acepta la conexión (IP whitelist/credenciales).
3. El puerto `3000` no está ocupado.

### Frontend no carga datos

1. Backend levantado en `3000`.
2. Base URL correcta (`/api/v1`).
3. Revisar consola/red para ver status y mensaje JSON de error.

---

## 13) Guía rápida para explicar el código (FAQ técnica)

### ¿Dónde están las rutas?

- `backend/src/routes/animeRoutes.js`
- `backend/src/routes/studioRoutes.js`

### ¿Dónde está la lógica de negocio?

- `backend/src/controllers/*.js`
- `backend/src/models/*.js` (validaciones de esquema)

### ¿Dónde se maneja el error global?

- `backend/src/middlewares/errorHandler.js`

### ¿Dónde se define la base URL del backend en cada frontend?

- React: `frontend-react/src/api/axios.js`
- Angular: `frontend-angular/src/app/core/api.config.ts`

### ¿Cómo se cargan datos demo?

- `backend/src/seed/seed.js`
- comando `npm run seed`

---

## 14) Comandos útiles por módulo

### Backend

```bash
npm run dev
npm start
npm run seed
```

### Frontend React

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

### Frontend Angular

```bash
npm start
npm run build
npm run test
```

---

## 15) Resumen ejecutivo

Este repo implementa una plataforma CRUD de animes/estudios con una API REST centralizada y dos interfaces cliente (React y Angular). La lógica crítica está en backend (validación, reglas de negocio, filtros, paginación, discover, errores), y ambos frontends son consumidores de ese contrato HTTP.
