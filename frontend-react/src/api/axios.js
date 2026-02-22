import axios from 'axios';

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: apiBaseUrl,
});
