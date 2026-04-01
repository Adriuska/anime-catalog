# Plan de implementacion - Biblioteca masiva de anime (sin streaming)

## 1) Vision del proyecto

Construir una plataforma personal para **descubrir, filtrar y organizar anime** a gran escala.

- No habra reproduccion de video ni hosting de episodios.
- El objetivo es centralizar metadatos: nombre, descripcion, imagen, año, categoria, episodios, estado de emision, tipo (TV/OVA/Movie).
- El usuario podra crear **listas privadas** y guardar favoritos.

## 2) Problema que resuelve

Las plataformas comerciales no incluyen todo el catalogo (licencias, antiguedad, region).
Esta web permite:

- Tener una biblioteca masiva unificada.
- Guardar animes aunque no esten en una plataforma concreta.
- Organizar por listas y filtros avanzados.
- Mantener datos personales (favoritos/listas) incluso si falla una API externa.

## 3) Requisitos funcionales cerrados

### 3.1 Ficha minima de anime

Campos obligatorios de negocio:

- `name` (titulo)
- `description`
- `imageUrl`
- `releaseYear`
- `categories[]` (romance, psicologico, etc.)
- `episodes`
- `isOngoing` (en emision/finalizado)
- `animeType` (`TV`, `OVA`, `Movie`, `ONA`, `Special`)

### 3.2 Listas y biblioteca personal (solo privadas)

- Crear lista privada con nombre.
- Anadir/quitar anime desde detalle y desde explorar.
- Un anime puede estar en multiples listas.
- Marcar/desmarcar favorito.
- Ver filtros de biblioteca y favoritos.

### 3.3 Filtros avanzados

- Por categorias.
- Por anio (exacto y rango).
- Por estado (`isOngoing=true/false`).
- Por episodios (ej. `episodes >= 12`).
- Por tipo (`OVA`, `TV`, etc.).
- Busqueda por texto en titulo.
- Orden por rating, fecha de lanzamiento, titulo y fecha de alta.

## 4) Arquitectura objetivo

## 4.1 Capas

1. **Fuentes externas de metadatos** (AniList, Jikan, Kitsu).
2. **Backend propio** (Node/Express): ingesta, normalizacion, cache y API interna.
3. **MongoDB propia**: persiste catalogo + datos personales.
4. **Frontend React**: explora catalogo, aplica filtros, gestiona listas privadas.

## 4.2 Regla clave de persistencia

- Lo personal (favoritos/listas) **SIEMPRE** se guarda en tu backend.
- Si una API externa cae, el usuario sigue viendo y gestionando lo que ya tenia guardado.

## 5) Integracion con APIs externas

## 5.1 Estrategia

No consumir en tiempo real para cada pantalla.
Se usara un flujo de **ingesta + persistencia local**:

1. Backend consulta API externa.
2. Backend transforma datos al modelo interno.
3. Backend guarda/upserta en MongoDB.
4. Frontend consulta exclusivamente tu API (`/api/v1/...`).

Ventajas:

- Menor dependencia del proveedor externo.
- Mejor rendimiento y control de filtros.
- Evita perder informacion cuando hay caidas externas.

## 5.2 Endpoints de ingesta (backend interno)

Propuesta de endpoints administrativos (pueden protegerse con token de admin):

- `POST /api/v1/import/anilist`
- `POST /api/v1/import/jikan`
- `POST /api/v1/import/kitsu`

Body de ejemplo:

```json
{
  "page": 1,
  "limit": 100,
  "query": "romance"
}
```

Respuesta esperada:

```json
{
  "imported": 94,
  "updated": 6,
  "skipped": 0,
  "source": "anilist"
}
```

## 5.3 Politica de tolerancia a fallos

- Timeout por proveedor (ej. 8s).
- Reintentos cortos (ej. 2).
- Circuit breaker simple para no saturar.
- Si falla ingesta: no afecta lectura de catalogo ya guardado.
- Registrar fallo en coleccion `import_jobs`.

## 6) Modelo de datos propuesto (MongoDB)

## 6.1 Coleccion `animes`

Campos base:

- `title`, `titleNormalized`
- `description`
- `posterUrl`, `bannerUrl`
- `releaseDate`, `year`
- `episodes`, `isOngoing`, `animeType`
- `rating`
- `genres[]`
- `sourceRefs[]` (ej. `{ provider: "anilist", externalId: "123" }`)

Indices recomendados:

- `titleNormalized` unico
- `year`
- `isOngoing`
- `episodes`
- `animeType`
- `genres`
- indice compuesto para listados: `{ isOngoing: 1, year: -1, rating: -1 }`

## 6.2 Coleccion `users`

Minimo para proyecto personal:

- `email` (unico)
- `passwordHash`
- `displayName`

## 6.3 Coleccion `user_lists` (privadas)

- `userId`
- `name`
- `isPrivate` (siempre `true` en este proyecto)
- `createdAt`, `updatedAt`

Indice: `{ userId: 1, name: 1 }` unico.

## 6.4 Coleccion `user_list_items`

- `userId`
- `listId`
- `animeId`
- `addedAt`

Indice unico: `{ userId: 1, listId: 1, animeId: 1 }`.

## 6.5 Coleccion `user_favorites`

- `userId`
- `animeId`
- `addedAt`

Indice unico: `{ userId: 1, animeId: 1 }`.

## 7) API REST interna (metodos HTTP)

## 7.1 Catalogo

- `GET /api/v1/animes` -> listado con filtros y paginacion.
- `GET /api/v1/animes/:id` -> detalle.
- `GET /api/v1/animes/discover` -> bloques para home.

Filtros nuevos a soportar en `GET /animes`:

- `genre`
- `year`, `yearFrom`, `yearTo`
- `isOngoing`
- `episodesMin`, `episodesMax`
- `animeType`
- `search`
- `sortBy`, `order`

Ejemplo:

```http
GET /api/v1/animes?page=1&limit=24&genre=Romance&isOngoing=false&episodesMin=12&animeType=OVA&yearFrom=1990&yearTo=2026
```

## 7.2 Favoritos privados

- `GET /api/v1/me/favorites`
- `POST /api/v1/me/favorites` (body: `{ "animeId": "..." }`)
- `DELETE /api/v1/me/favorites/:animeId`

## 7.3 Listas privadas

- `GET /api/v1/me/lists`
- `POST /api/v1/me/lists` (body: `{ "name": "No esta en Crunchy" }`)
- `PATCH /api/v1/me/lists/:listId` (renombrar)
- `DELETE /api/v1/me/lists/:listId`
- `GET /api/v1/me/lists/:listId/items`
- `POST /api/v1/me/lists/:listId/items` (body: `{ "animeId": "..." }`)
- `DELETE /api/v1/me/lists/:listId/items/:animeId`

## 7.4 Autenticacion (minima)

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

## 8) Flujo frontend-backend

## 8.1 Frontend

- El frontend **solo** llama a tu backend (`API_BASE_URL`).
- No debe depender directamente de AniList/Jikan/Kitsu.
- Pantallas principales:
  - Explorar
  - Detalle anime
  - Favoritos
  - Mis listas privadas

## 8.2 UX esperada

- Desde explorar: boton "Anadir a lista" y selector de lista.
- Desde detalle: favorito + selector de lista.
- En listas: quitar anime rapido y reordenar (opcional).
- Indicadores de estado para peticiones y errores.

## 9) Seguridad y buenas practicas

- Mover secretos a variables de entorno (`.env`), nunca hardcodeados.
- Validar body/query con esquema (Joi/Zod o similar).
- Rate limit basico para login/import.
- Logs de errores y de importacion.

**Nota importante del estado actual**:
se detecta una URI de MongoDB embebida en codigo. Antes de implementar cambios funcionales hay que migrarla a `.env`.

## 10) Fases de implementacion

### Fase 1 - Base tecnica

- Normalizar configuracion por entorno.
- Endpoints de auth minima.
- Modelos `User`, `UserList`, `UserListItem`, `UserFavorite`.

### Fase 2 - Catalogo masivo

- Cliente(s) de API externa.
- Servicio de ingesta y mapeo.
- Endpoints `POST /import/...`.
- Indices de Mongo para filtros grandes.

### Fase 3 - Listas y favoritos privados

- CRUD de listas privadas.
- Agregar/quitar anime en listas.
- Favoritos privados por usuario.

### Fase 4 - Frontend

- Pantalla de mis listas.
- Selector "anadir a lista" desde explorar/detalle.
- Filtros nuevos (episodios, tipo, rango anio).

### Fase 5 - Robustez

- Reintentos/timeouts a APIs externas.
- Pruebas de endpoints criticos.
- Pruebas de flujos de listas y favoritos.

## 11) Criterios de aceptacion

- Se pueden crear listas privadas y anadir/eliminar animes.
- Favoritos persisten por usuario.
- Si API externa no responde, datos guardados siguen accesibles.
- Filtros avanzados responden con paginacion estable.
- Frontend ofrece flujo comodo para explorar y organizar.

## 12) Alcance (no incluido)

- Streaming/reproduccion de episodios.
- Hosting de video.
- Funciones sociales publicas (comentarios, listas publicas) para esta version.
