/**
 * Constantes de rutas de la aplicación
 * Centraliza todas las rutas para evitar inconsistencias
 */

export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  ANIMES: '/animes',
  ANIME_DETAIL: (id) => `/animes/${id}`,
  LIBRARY: '/library',
  FAVORITES: '/favorites',
  STUDIOS: '/studios',
  STUDIO_NEW: '/studios/new',
  STUDIO_DETAIL: (id) => `/studios/${id}`,
  STUDIO_EDIT: (id) => `/studios/${id}/edit`,
  IMPORT: '/import',
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const NAV_ITEMS = [
  { label: 'Explorar', path: ROUTES.ANIMES, exact: true },
  { label: 'Mis listas', path: ROUTES.LIBRARY, requiresAuth: true },
  { label: 'Favoritos', path: ROUTES.FAVORITES, requiresAuth: true },
  { label: 'Estudios', path: ROUTES.STUDIOS, requiresAuth: true },
];
