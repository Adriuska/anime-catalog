# AnimeCatalog - Catálogo de Animes y Estudios

## Descripción del Proyecto

AnimeCatalog es una plataforma full-stack para gestionar un catálogo de animes y estudios de animación. El proyecto implementa una arquitectura con backend Node.js/Express + MongoDB y dos frontends independientes (Angular y React) que consumen la misma API REST.

## Problema que Resolver

El proyecto busca centralizar la gestión de información de animes y estudios para poder:

- Registrar y mantener animes con metadatos completos.
- Relacionar cada anime con su estudio de animación.
- Consultar y filtrar catálogos de forma eficiente.
- Gestionar la misma información desde dos frontends distintos (Angular y React).

## Descripción Funcional

### Funcionalidades Principales

- Gestión de Animes: CRUD completo de animes.
- Gestión de Estudios: CRUD completo de estudios.
- Catálogo con filtros: búsqueda, género, temporada, año, estado, estudio y rating.
- Paginación: listado paginado para mejorar rendimiento y experiencia.
- Discover/Home API: endpoint agregado con secciones como top, trending, ongoing y upcoming.
- Interfaz responsiva: aplicaciones adaptadas para desktop y móvil.

## Entidades del Sistema

### 1. Animes (Anime)

Representa los animes disponibles en el catálogo.

Campos:

- `_id`: ObjectId - Identificador único (automático)
- `title`: String - Título del anime (obligatorio)
- `description`: String - Descripción (mínimo 10 caracteres, obligatorio)
- `posterUrl`: String - URL del póster (`http://` o `https://`, obligatorio)
- `bannerUrl`: String - URL de banner (opcional)
- `trailerUrl`: String - URL de tráiler (opcional)
- `episodes`: Number - Número de episodios (>= 1, obligatorio)
- `durationMinutes`: Number - Duración por episodio en minutos (>= 1, opcional)
- `releaseDate`: Date - Fecha de estreno (obligatorio)
- `season`: String - Temporada (`Invierno`, `Primavera`, `Verano`, `Otoño`)
- `year`: Number - Año (1950 a 2100)
- `ageRating`: String - Clasificación (`G`, `PG`, `PG-13`, `R`, `R+`, `RX`)
- `isOngoing`: Boolean - Estado de emisión (obligatorio)
- `inLibrary`: Boolean - Marcador de biblioteca personal
- `isFavorite`: Boolean - Marcador de favorito
- `rating`: Number - Puntuación de 0 a 10 (obligatorio)
- `genres`: Array[String] - Lista de géneros (mínimo 1, obligatorio)
- `studio`: ObjectId - Referencia al estudio (`Studio`)
- `createdAt`: Date - Fecha de creación (automática)
- `updatedAt`: Date - Fecha de actualización (automática)

Ejemplo de documento:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Demon Slayer",
  "description": "A young swordsman joins a corps to cure his sister and fight demons.",
  "posterUrl": "https://via.placeholder.com/300x450?text=Demon+Slayer",
  "bannerUrl": "https://images.example.com/demon-slayer-banner.jpg",
  "trailerUrl": "https://www.youtube.com/watch?v=example",
  "episodes": 55,
  "durationMinutes": 24,
  "releaseDate": "2019-04-06T00:00:00.000Z",
  "season": "Primavera",
  "year": 2019,
  "ageRating": "PG-13",
  "isOngoing": true,
  "inLibrary": false,
  "isFavorite": false,
  "rating": 8.6,
  "genres": ["Action", "Fantasy"],
  "studio": "507f1f77bcf86cd799439099",
  "createdAt": "2026-02-24T10:30:00.000Z",
  "updatedAt": "2026-02-24T10:30:00.000Z"
}
```

Temporadas soportadas:

- Invierno, Primavera, Verano, Otoño

### 2. Estudios (Studio)

Representa los estudios de animación asociados a los animes.

Campos:

- `_id`: ObjectId - Identificador único
- `name`: String - Nombre del estudio (obligatorio)
- `country`: String - País (opcional)
- `foundedDate`: Date - Fecha de fundación (opcional)
- `isActive`: Boolean - Estado del estudio (default: `true`)
- `createdAt`: Date - Fecha de creación
- `updatedAt`: Date - Fecha de última actualización

## Reglas de Negocio

- Título único: no pueden existir dos animes con el mismo `title` (comparación case-insensitive).
- Nombre de estudio único: no pueden existir dos estudios con el mismo `name` (case-insensitive).
- Rating válido: `rating` debe estar entre 0 y 10.
- Episodios válidos: `episodes` debe ser mayor o igual a 1.
- Géneros obligatorios: `genres` debe incluir al menos un género.
- Descripción mínima: `description` debe tener al menos 10 caracteres.
- URL válida: `posterUrl` es obligatoria y debe comenzar por `http://` o `https://`.
- Normalización automática: título/estudio se normalizan internamente para validar unicidad.
- Año automático: si no se envía `year`, se calcula desde `releaseDate`.
- Validación de ID: los IDs deben ser ObjectId válidos de MongoDB.
- Actualización automática: `updatedAt` se actualiza en cada modificación.

## 🔌 API Endpoints

### 📚 Documentación General

- `GET /` - Estado general de la API.
- `GET /api/v1/health` - Healthcheck del servicio.

Base URL local:

- `http://localhost:3000/api/v1`

### 🎬 Animes (Endpoint principal con paginación y filtros)

#### `GET /api/v1/animes` - Obtener animes paginados

Parámetros de consulta:

- `page` (opcional): número de página (default: 1)
- `limit` (opcional): elementos por página (default: 10)
- `search` (opcional): búsqueda por título
- `genre` (opcional): filtro por género
- `season` (opcional): temporada
- `year` (opcional): año
- `isOngoing` (opcional): `true` o `false`
- `studioId` (opcional): ObjectId de estudio
- `minRating` / `maxRating` (opcional): rango de rating
- `sortBy` (opcional): `createdAt`, `rating`, `releaseDate`, `title`, `episodes`
- `order` (opcional): `asc` o `desc`

Ejemplo:

```http
GET http://localhost:3000/api/v1/animes?page=1&limit=10&search=naruto&genre=Action&order=desc
```

Respuesta exitosa (200):

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

#### `GET /api/v1/animes/discover` - Bloques para home

Respuesta (200):

```json
{
  "hero": {},
  "topRated": [],
  "trending": [],
  "ongoing": [],
  "upcoming": [],
  "genres": ["Action", "Drama"],
  "stats": {
    "total": 20,
    "ongoing": 8,
    "upcoming": 3
  }
}
```

#### `GET /api/v1/animes/:id` - Obtener anime por ID

- 200: devuelve anime
- 404: anime no encontrado
- 400: ID inválido

#### `POST /api/v1/animes` - Crear anime

Body (JSON):

```json
{
  "title": "Attack on Titan",
  "description": "Humanity fights for survival against giant titans.",
  "posterUrl": "https://images.example.com/aot-poster.jpg",
  "episodes": 87,
  "releaseDate": "2013-04-07",
  "season": "Primavera",
  "isOngoing": false,
  "rating": 9.1,
  "genres": ["Action", "Drama"]
}
```

- 201: creado correctamente
- 400: validación
- 409: duplicado

#### `PATCH /api/v1/animes/:id` - Actualizar anime

- 200: actualizado correctamente

#### `DELETE /api/v1/animes/:id` - Eliminar anime

- 204: eliminado correctamente (sin body)

### 🏢 Estudios (Studios)

#### `GET /api/v1/studios` - Obtener estudios
#### `GET /api/v1/studios/:id` - Obtener estudio por ID
#### `POST /api/v1/studios` - Crear estudio
#### `PATCH /api/v1/studios/:id` - Actualizar estudio
#### `DELETE /api/v1/studios/:id` - Eliminar estudio

Ejemplo `POST /api/v1/studios`:

```json
{
  "name": "Bones",
  "country": "Japan",
  "foundedDate": "1998-10-01",
  "isActive": true
}
```

## Ubicación del Proyecto

- `C:\Users\adriu\Desktop\anime-catalog\`

## Instalación y Configuración

### 1. Configurar Backend

```bash
cd C:\Users\adriu\Desktop\anime-catalog\backend
npm install
npm run dev
```

### 2. Configurar Frontend Angular

```bash
cd C:\Users\adriu\Desktop\anime-catalog\frontend-angular
npm install
npm start
```

### 3. Configurar Frontend React

```bash
cd C:\Users\adriu\Desktop\anime-catalog\frontend-react
npm install
npm run dev
```

## 🌐 URLs

### Locales

- Backend API: `http://localhost:3000/api/v1`
- Frontend Angular: `http://localhost:4200`
- Frontend React: `http://localhost:5173`

### Producción (vercell)

- Backend: `anime-catalog-9wds9erkz-adris-projects-d855fff9.vercel.app`
- Angular: `anime-catalog-fronted-angular-6jplf5d9u-adris-projects-d855fff9.vercel.app`
- React: `anime-catalog-fronted-react-1grkjbimk-adris-projects-d855fff9.vercel.app`

## Tecnologías Utilizadas

### Backend

- Node.js: runtime de JavaScript
- Express: framework web
- MongoDB: base de datos NoSQL
- Mongoose: ODM para MongoDB
- CORS: middleware para peticiones cross-origin

### Frontend Angular

- Angular 20 (standalone)
- Bootstrap 5
- Router de Angular
- Formularios reactivos (`@angular/forms`)

### Frontend React

- React 19
- Vite
- React Router
- Bootstrap 5
- Axios

## ⚡ Características Destacadas

### 📄 Paginación y Filtros

El sistema incluye paginación y filtros en el endpoint principal de animes:

- `GET /api/v1/animes?page=1&limit=10`
- Filtros combinables (`search`, `genre`, `season`, `year`, `rating`, etc.)
- Orden dinámico (`sortBy`, `order`)
- Respuesta con metadatos (`page`, `total`, `totalPages`)

### 🎯 Endpoint Discover

`GET /api/v1/animes/discover` agrupa contenido para una home tipo streaming:

- Anime destacado (`hero`)
- Top mejor valorados (`topRated`)
- Tendencias (`trending`)
- En emisión (`ongoing`)
- Próximos estrenos (`upcoming`)
- Estadísticas globales (`stats`)

### 📈 Beneficios de Rendimiento

- Menor carga inicial por paginación.
- Consultas optimizadas con `skip/limit`.
- Filtros en backend para reducir procesamiento en cliente.
- Escalabilidad para catálogos grandes.


## 📊 Testing y Validación

- Pruebas manuales recomendadas con Postman/Thunder Client.
- Verificación de datos y relaciones con MongoDB Compass.
- Validar casos de éxito y error (`400`, `404`, `409`) en endpoints CRUD.

## Datos de Ejemplo

El backend incluye un seed para poblar datos iniciales:

```bash
cd backend
npm run seed
```

El seed inserta al menos:

- 5+ estudios
- 20+ animes

## Autor

Proyecto académico de catálogo de anime (stack MERN/MEAN híbrido con Angular + React sobre la misma API).

## Licencia

Este proyecto es de uso educativo.