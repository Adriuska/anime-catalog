# Anime Catalog Backend

API REST del proyecto AniVerse. Gestiona autenticacion, catalogo local, integracion con proveedores externos, estudios, listas privadas y favoritos.

## Stack

- Node.js
- Express
- MongoDB con Mongoose
- JWT
- Integracion con AniList, Jikan y Kitsu

## Ejecucion local

```bash
npm install
npm run dev
```

## Configuracion

La configuracion principal del proyecto se mantiene en `src/config/database.js`.

Campos principales:

- `port`
- `mongoUri`
- `jwtSecret`
- `jwtExpiresIn`

La version actual del proyecto esta pensada para trabajar directamente con esa configuracion, sin depender de archivos `.env` para el flujo habitual de desarrollo.

## Base URL

`/api/v1`

## Endpoints publicos

### Estado

- `GET /`
- `GET /api/v1/health`

Respuesta de health:

```json
{ "ok": true }
```

### Auth

#### `POST /api/v1/auth/register`

Crea un usuario y devuelve token JWT.

Body:

```json
{
  "email": "usuario@mail.com",
  "password": "password123",
  "displayName": "Adrian"
}
```

#### `POST /api/v1/auth/login`

Autentica un usuario existente y devuelve token JWT.

Body:

```json
{
  "email": "usuario@mail.com",
  "password": "password123"
}
```

#### `GET /api/v1/auth/me`

Devuelve el usuario autenticado.

Header requerido:

```http
Authorization: Bearer <token>
```

### Catalogo de anime

#### `GET /api/v1/animes`

Listado principal con paginacion, filtros y busqueda federada.

Query params soportados:

- `page`
- `limit`
- `search`
- `genre`
- `season`
- `year`
- `yearFrom`, `yearTo`
- `isOngoing`
- `studioId`
- `episodesMin`, `episodesMax`
- `animeType`
- `minRating`, `maxRating`
- `sortBy` (`createdAt|rating|releaseDate|title|episodes`)
- `order` (`asc|desc`)
- `includeExternal` (`true|false`)

Comportamiento importante:

- Si `search` tiene valor y `includeExternal` no es `false`, el backend mezcla resultados locales con resultados externos.
- Los resultados externos llegan marcados con `external: true`.
- Los resultados externos no sustituyen automaticamente tu catalogo: se persisten al guardarlos en favoritos o listas, o al importar manualmente.

Ejemplo:

```http
GET /api/v1/animes?page=1&limit=12&search=naruto&genre=Action&animeType=TV&includeExternal=true
```

#### `GET /api/v1/animes/discover`

Devuelve bloques preparados para la portada:

- `hero`
- `topRated`
- `trending`
- `ongoing`
- `upcoming`
- `genres`
- `stats`

#### `GET /api/v1/animes/:id`

Devuelve el detalle de un anime persistido en la base de datos.

#### `POST /api/v1/animes`
#### `PATCH /api/v1/animes/:id`
#### `DELETE /api/v1/animes/:id`

Siguen disponibles para administracion o mantenimiento del catalogo local.

### Estudios

- `GET /api/v1/studios`
- `GET /api/v1/studios/:id`
- `POST /api/v1/studios`
- `PATCH /api/v1/studios/:id`
- `DELETE /api/v1/studios/:id`

## Endpoints privados

Todos requieren:

```http
Authorization: Bearer <token>
```

### Favoritos

- `GET /api/v1/me/favorites`
- `POST /api/v1/me/favorites`
- `DELETE /api/v1/me/favorites/:animeId`

Se puede guardar un anime ya persistido:

```json
{
  "animeId": "<ObjectId>"
}
```

O guardar directamente un resultado externo:

```json
{
  "externalAnime": {
    "title": "Naruto",
    "description": "...",
    "posterUrl": "https://...",
    "episodes": 220,
    "releaseDate": "2002-10-03T00:00:00.000Z",
    "isOngoing": false,
    "rating": 7.9,
    "genres": ["Action", "Adventure"],
    "animeType": "TV",
    "sourceRefs": [{ "provider": "jikan", "externalId": "20" }]
  }
}
```

En ese caso el backend hace upsert del anime y luego lo vincula al usuario.

### Listas privadas

- `GET /api/v1/me/lists`
- `POST /api/v1/me/lists`
- `PATCH /api/v1/me/lists/:listId`
- `DELETE /api/v1/me/lists/:listId`
- `GET /api/v1/me/lists/:listId/items`
- `POST /api/v1/me/lists/:listId/items`
- `DELETE /api/v1/me/lists/:listId/items/:animeId`

Para anadir items se soportan los mismos dos modos:

- `{ "animeId": "<ObjectId>" }`
- `{ "externalAnime": { ... } }`

### Importacion externa

- `POST /api/v1/import/anilist`
- `POST /api/v1/import/jikan`
- `POST /api/v1/import/kitsu`

Body opcional:

```json
{
  "page": 1,
  "limit": 25,
  "query": "romance"
}
```

Respuesta tipo:

```json
{
  "provider": "anilist",
  "page": 1,
  "limit": 25,
  "query": "romance",
  "imported": 20,
  "updated": 5,
  "totalFetched": 25
}
```

## Reglas de negocio relevantes

- No se permiten animes duplicados por titulo normalizado.
- No se permiten estudios duplicados por nombre normalizado.
- `rating` debe estar entre `0` y `10`.
- `episodes` debe ser `>= 1`.
- `genres` debe incluir al menos un valor.
- Las listas y favoritos son siempre privados y se resuelven por usuario autenticado.
- Un anime externo se consolida en MongoDB cuando el usuario lo guarda o cuando se importa manualmente.

## Status codes habituales

- `200` lectura o actualizacion correcta
- `201` creacion correcta
- `204` eliminacion correcta
- `400` validacion o parametros invalidos
- `401` autenticacion invalida
- `404` recurso no encontrado
- `409` conflicto por duplicado

## Seed

```bash
npm run seed
```

## Deploy en Vercel

El backend esta preparado para ejecutarse como funcion serverless.

- Root Directory: `backend`
- Entry point: `api/index.js`
- Config de despliegue: `vercel.json`

Health check de referencia:

```http
GET https://<tu-backend>.vercel.app/api/v1/health
```
