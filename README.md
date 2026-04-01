# AniVerse

Biblioteca personal de anime construida como TFG con backend Node.js/Express + MongoDB y frontend React.

## Estado actual

El proyecto esta enfocado en una unica aplicacion activa:

- Backend propio con persistencia en MongoDB.
- Frontend React como cliente principal.
- Autenticacion con JWT.
- Listas privadas y favoritos por usuario.
- Catalogo local con filtros avanzados.
- Busqueda federada en APIs externas y guardado posterior en base de datos.
- Importacion manual desde AniList, Jikan y Kitsu.

## Objetivo

Construir una biblioteca masiva de anime sin streaming para:

- descubrir titulos desde una sola interfaz,
- filtrar por genero, año, episodios, tipo y estado,
- guardar favoritos y listas privadas,
- mantener datos propios aunque falle una API externa.

## Arquitectura

### Backend

- Node.js
- Express
- MongoDB con Mongoose
- JWT para autenticacion
- Integracion con AniList, Jikan y Kitsu

### Frontend

- React 19
- Vite
- React Router
- Axios
- Bootstrap 5

## Estructura del repositorio

- `backend`: API REST y modelos de datos.
- `frontend-react`: interfaz web principal.
- `docs`: documentacion funcional y tecnica.

## Funcionalidades principales

### Catalogo de anime

- Listado paginado.
- Filtros en tiempo real.
- Discover con secciones destacadas.
- Soporte para resultados locales y externos en la misma busqueda.

### Persistencia personal

- Registro e inicio de sesion.
- Favoritos privados por usuario.
- Listas privadas con CRUD basico.
- Guardado desde resultados externos sin perderlos al caer el proveedor.

### Ingestion externa

- Importacion desde AniList.
- Importacion desde Jikan.
- Importacion desde Kitsu.
- Upsert de anime por referencia externa o titulo normalizado.

## Flujo principal

Cuando el usuario busca un anime:

1. El backend consulta primero el catalogo propio.
2. Si hay texto de busqueda, puede mezclar resultados externos.
3. Los resultados externos llegan marcados como `external: true`.
4. Cuando el usuario lo guarda en favoritos o en una lista, ese anime se inserta o actualiza en MongoDB.
5. A partir de ahi pasa a formar parte del catalogo persistido.

## Puesta en marcha

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend React

```bash
cd frontend-react
npm install
npm run dev
```

## URLs locales

- Backend API: `http://localhost:3000/api/v1`
- Frontend React: `http://localhost:5173`

## Documentacion adicional

- Plan funcional y tecnico: `docs/PLAN_BIBLIOTECA_MASIVA.md`
- Documentacion tecnica del backend: `backend/README.md`

## Nota sobre la API

La documentacion detallada de endpoints se mantiene en `backend/README.md` para evitar duplicaciones y desajustes.

## Licencia

Proyecto de uso educativo.
