import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { meApi } from '../../api/me';
import AlertMessage from '../../components/AlertMessage';
import Loader from '../../components/Loader';
import { getPreferredAnimeImage } from '../../utils/animeImages';

export default function MyListsPage({ isAuthenticated }) {
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [items, setItems] = useState([]);
  const [listPreviewMap, setListPreviewMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newListName, setNewListName] = useState('');

  const selectedList = lists.find((list) => list._id === selectedListId) || null;
  const selectedListPrimaryItem = items.length ? items[items.length - 1] : null;
  const selectedListPrimaryAnimeId = selectedListPrimaryItem?.anime?._id;

  const loadListPreviews = useCallback(async (nextLists) => {
    if (!nextLists.length) {
      setListPreviewMap({});
      return;
    }

    const previews = await Promise.all(
      nextLists.map(async (list) => {
        try {
          const response = await meApi.getListItems(list._id);
          const entries = response.data || [];
          const firstAddedItem = entries[entries.length - 1];
          return [
            list._id,
            firstAddedItem?.anime ? getPreferredAnimeImage(firstAddedItem.anime, 'poster') : '',
          ];
        } catch {
          return [list._id, ''];
        }
      })
    );

    setListPreviewMap(Object.fromEntries(previews));
  }, []);

  const loadLists = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await meApi.getLists();
      const nextLists = response.data || [];
      setLists(nextLists);
      await loadListPreviews(nextLists);

      if (!selectedListId && nextLists.length) {
        setSelectedListId(nextLists[0]._id);
      }

      if (selectedListId && !nextLists.some((list) => list._id === selectedListId)) {
        setSelectedListId(nextLists[0]?._id || '');
      }
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'No se pudieron cargar las listas.');
    } finally {
      setLoading(false);
    }
  }, [loadListPreviews, selectedListId]);

  const loadItems = useCallback(async (listId) => {
    if (!listId) {
      setItems([]);
      return;
    }

    try {
      setError('');
      const response = await meApi.getListItems(listId);
      setItems(response.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'No se pudieron cargar los items de la lista.');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadLists();
    }
  }, [isAuthenticated, loadLists]);

  useEffect(() => {
    if (isAuthenticated) {
      loadItems(selectedListId);
    }
  }, [selectedListId, isAuthenticated, loadItems]);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const createList = async (event) => {
    event.preventDefault();
    try {
      setError('');
      setSuccess('');
      if (!newListName.trim()) return;

      await meApi.createList(newListName.trim());
      setSuccess('Lista creada.');
      setNewListName('');
      await loadLists();
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'No se pudo crear la lista.');
    }
  };

  const renameList = async () => {
    if (!selectedList) return;
    const nextName = window.prompt('Nuevo nombre de la lista', selectedList.name);
    if (!nextName || !nextName.trim()) return;

    try {
      setError('');
      setSuccess('');
      await meApi.updateList(selectedList._id, nextName.trim());
      setSuccess('Lista renombrada.');
      await loadLists();
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'No se pudo renombrar la lista.');
    }
  };

  const removeList = async () => {
    if (!selectedList) return;
    const confirmed = window.confirm(`Eliminar la lista ${selectedList.name}?`);
    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');
      await meApi.deleteList(selectedList._id);
      setSuccess('Lista eliminada.');
      await loadLists();
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'No se pudo eliminar la lista.');
    }
  };

  const removeItem = async (animeId) => {
    if (!selectedList) return;
    try {
      setError('');
      setSuccess('');
      await meApi.removeListItem(selectedList._id, animeId);
      setSuccess('Anime eliminado de la lista.');
      await loadItems(selectedList._id);
      await loadLists();
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'No se pudo eliminar el item.');
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Mis listas privadas</h1>
          <p className="text-secondary mb-0">Organiza tus animes en bibliotecas personalizadas.</p>
        </div>
        <Link className="btn btn-outline-secondary" to="/animes">Ir a explorar</Link>
      </div>

      <AlertMessage message={error} type="danger" />
      <AlertMessage message={success} type="success" />
      <Loader visible={loading} />

      <div className="row g-3">
        <div className="col-lg-4">
          <form className="card border-0 shadow-sm card-body mb-3" onSubmit={createList}>
            <label className="form-label">Nueva lista</label>
            <div className="d-flex gap-2">
              <input
                className="form-control"
                value={newListName}
                onChange={(event) => setNewListName(event.target.value)}
                placeholder="Ej. No esta en Crunchy"
              />
              <button className="btn btn-primary" type="submit">Crear</button>
            </div>
          </form>

          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h2 className="h6 mb-3">Tus listas</h2>
              <div className="list-group">
                {lists.length ? (
                  lists.map((list) => (
                    <button
                      key={list._id}
                      type="button"
                      className={`list-group-item list-group-item-action list-preview-button ${selectedListId === list._id ? 'active' : ''}`}
                      onClick={() => setSelectedListId(list._id)}
                    >
                      <span className="d-flex align-items-center gap-3">
                        <span className="list-preview-thumb-shell">
                          {listPreviewMap[list._id] ? (
                            <img src={listPreviewMap[list._id]} alt={list.name} className="list-preview-thumb" />
                          ) : (
                            <span className="list-preview-thumb list-preview-thumb-placeholder">Sin portada</span>
                          )}
                        </span>
                        <span className="text-start">
                          <span className="d-block fw-semibold">{list.name}</span>
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-secondary small">Todavia no tienes listas.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-3">
                  {selectedList && listPreviewMap[selectedList._id] && (
                    selectedListPrimaryAnimeId ? (
                      <Link
                        to={`/animes/${selectedListPrimaryAnimeId}`}
                        className="list-cover-link"
                        aria-label={`Abrir primer anime de ${selectedList.name}`}
                      >
                        <img
                          src={listPreviewMap[selectedList._id]}
                          alt={selectedList.name}
                          className="list-preview-thumb list-preview-thumb-large"
                        />
                      </Link>
                    ) : (
                      <img
                        src={listPreviewMap[selectedList._id]}
                        alt={selectedList.name}
                        className="list-preview-thumb list-preview-thumb-large"
                      />
                    )
                  )}
                  <h2 className="h5 mb-0">{selectedList?.name || 'Selecciona una lista'}</h2>
                </div>
                {selectedList && (
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-secondary" onClick={renameList}>Renombrar</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={removeList}>Eliminar</button>
                  </div>
                )}
              </div>

              {selectedList ? (
                items.length ? (
                  <div className="row row-cols-1 row-cols-md-2 g-3">
                    {items.map((item) => (
                      <article key={item._id} className="col">
                        <div className="card h-100 border">
                          {item.anime?.posterUrl && (
                            <img src={getPreferredAnimeImage(item.anime, 'poster')} alt={item.anime?.title || 'Anime'} className="card-img-top anime-poster" />
                          )}
                          <div className="card-body">
                            <h3 className="h6 mb-1">{item.anime?.title || 'Anime'}</h3>
                            <div className="small text-secondary mb-3">{item.anime?.year || 'N/D'} · {item.anime?.episodes || 0} eps</div>
                            <div className="d-flex gap-2">
                              {item.anime?._id && (
                                <Link className="btn btn-sm btn-outline-primary" to={`/animes/${item.anime._id}`}>
                                  Ver detalle
                                </Link>
                              )}
                              <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => removeItem(item.animeId)}>
                                Quitar
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="text-secondary">Esta lista no tiene animes todavia.</div>
                )
              ) : (
                <div className="text-secondary">Selecciona una lista para ver sus animes.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
