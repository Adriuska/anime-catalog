import { api } from './axios';

export const meApi = {
  getFavorites: () => api.get('/me/favorites').then((res) => res.data),
  addFavorite: (animeId, externalAnime) =>
    api.post('/me/favorites', { animeId, externalAnime }).then((res) => res.data),
  removeFavorite: (animeId) => api.delete(`/me/favorites/${animeId}`),

  getLists: () => api.get('/me/lists').then((res) => res.data),
  createList: (name) => api.post('/me/lists', { name }).then((res) => res.data),
  updateList: (listId, name) => api.patch(`/me/lists/${listId}`, { name }).then((res) => res.data),
  deleteList: (listId) => api.delete(`/me/lists/${listId}`),

  getListItems: (listId) => api.get(`/me/lists/${listId}/items`).then((res) => res.data),
  addListItem: (listId, animeId, externalAnime) =>
    api.post(`/me/lists/${listId}/items`, { animeId, externalAnime }).then((res) => res.data),
  removeListItem: (listId, animeId) => api.delete(`/me/lists/${listId}/items/${animeId}`),
};
