# Anime Catalog Backend

API REST para catálogo de animes y estudios usando Node.js, Express y MongoDB (Mongoose).

## Setup

1. Instalar dependencias:

```bash
npm install
```

2. Crear archivo `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

3. Completar `MONGODB_URI` en `.env` con tu cadena de MongoDB Atlas.

4. Ejecutar en modo desarrollo:

```bash
npm run dev
```

## Variables de entorno

- `PORT`: puerto del servidor (default 3000)
- `MONGODB_URI`: URI de conexión a MongoDB Atlas

## Reglas de negocio

1. No se permiten estudios duplicados por nombre (insensible a mayúsculas/minúsculas).
2. No se permiten animes duplicados por título (insensible a mayúsculas/minúsculas).
3. `rating` debe estar en el rango `0..10`.
4. `episodes` debe ser `>= 1`.
5. `genres` debe incluir al menos un valor y se soporta filtro por `genre` en listados.

## Base URL

`/api/v1`

## Health

- `GET /api/v1/health`
- Respuesta:

```json
{ "ok": true }
```

## Endpoints Studios

### GET /api/v1/studios

Obtiene todos los estudios.

### GET /api/v1/studios/:id

Obtiene un estudio por ID.

### POST /api/v1/studios

Body ejemplo:

```json
{
  "name": "Bones",
  "country": "Japan",
  "foundedDate": "1998-10-01",
  "isActive": true
}
```

Respuesta `201` (ejemplo):

```json
{
  "_id": "65f1a2...",
  "name": "Bones",
  "country": "Japan",
  "foundedDate": "1998-10-01T00:00:00.000Z",
  "isActive": true,
  "createdAt": "2026-02-17T12:00:00.000Z",
  "updatedAt": "2026-02-17T12:00:00.000Z"
}
```

### PATCH /api/v1/studios/:id

Actualiza parcialmente un estudio.

### DELETE /api/v1/studios/:id

Elimina un estudio. Respuesta `204` sin body.

## Endpoints Animes

### GET /api/v1/animes

Listado con paginación y filtros.

Query params:

- `page`, `limit`
- `search` (por `title`, case-insensitive)
- `genre` (valor dentro de `genres`)
- `season` (`Winter|Spring|Summer|Fall`)
- `year`
- `isOngoing` (`true`/`false`)
- `studioId`
- `minRating`, `maxRating`
- `sortBy` (`createdAt|rating|releaseDate|title|episodes`)
- `order` (`asc|desc`)

Respuesta:

```json
{
  "data": [],
  "page": 1,
  "limit": 10,
  "total": 20,
  "totalPages": 2
}
```

### GET /api/v1/animes/discover

Devuelve secciones listas para home estilo streaming:

- `hero`
- `topRated`
- `trending`
- `ongoing`
- `upcoming`
- `genres`
- `stats` (`total`, `ongoing`, `upcoming`)

### GET /api/v1/animes/:id

Obtiene un anime por ID.

### POST /api/v1/animes

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

### PATCH /api/v1/animes/:id

Actualiza parcialmente un anime.

### DELETE /api/v1/animes/:id

Elimina un anime. Respuesta `204` sin body.

## Status codes

- `201` create
- `200` read/update
- `204` delete
- `400` validación o ID inválido
- `404` no encontrado
- `409` duplicado

## Seed

Ejecuta seed con mínimo 5 estudios y 20 animes:

```bash
npm run seed
```

## Ejemplo paginación + filtros

```http
GET /api/v1/animes?page=1&limit=5&search=man&genre=Action&isOngoing=true&minRating=7&maxRating=10
```
