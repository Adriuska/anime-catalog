import { useEffect, useState } from 'react';
import { meApi } from '../api/me';

/**
 * Hook para obtener y sincronizar favoritos del usuario
 */
export function useFavorites(isAuthenticated) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavorites([]);
      return;
    }

    const loadFavorites = async () => {
      try {
        setLoading(true);
        const data = await meApi.getFavorites();
        setFavorites(data || []);
      } catch {
        console.error('Error loading favorites');
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [isAuthenticated]);

  return { favorites, loading, count: favorites.length };
}
