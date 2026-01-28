import { request, ApiError } from './apiClient.js';

const BASE_PATH = '/lists';

// re-export for callers that import ApiError from listService
export { ApiError };

// ---------- API: Lists CRUD ----------
export const getMyLists = async () => {
  return await request(BASE_PATH);
};

export const createList = async ({ name, description = '' }) => {
  return await request(BASE_PATH, {
    method: 'POST',
    body: { name, description },
  });
};

export const getList = async (listId) => {
  return await request(`${BASE_PATH}/${listId}`);
};

export const updateList = async (listId, { name, description }) => {
  return await request(`${BASE_PATH}/${listId}`, {
    method: 'PUT',
    body: { name, description },
  });
};

export const deleteList = async (listId) => {
  return await request(`${BASE_PATH}/${listId}`, {
    method: 'DELETE',
  });
};

// ---------- API: Locations inside a list ----------
export const addLocationToList = async (
  listId,
  { locationId, name, longitude, latitude, description = '' }
) => {
  const payload = locationId
    ? { locationId }
    : { name, longitude, latitude, description };

  return await request(`${BASE_PATH}/${listId}/locations`, {
    method: 'POST',
    body: payload,
  });
};

export const removeLocationFromList = async (listId, locationId) => {
  return await request(`${BASE_PATH}/${listId}/locations/${locationId}`, {
    method: 'DELETE',
  });
};

export const reorderListLocations = async (listId, orderedLocationIds) => {
  return await request(`${BASE_PATH}/${listId}/reorder`, {
    method: 'PUT',
    body: { orderedLocationIds },
  });
};

/* create a list AND add locations in current order */
export const createListWithLocations = async ({
  name,
  description = '',
  locations = [],
}) => {
  const created = await createList({ name, description });

  // Add sequentially to preserve order and avoid hammering server
  for (const loc of locations) {
    if (!loc || loc.lon == null || loc.lat == null) continue;
    await addLocationToList(created._id, {
      name: loc.name,
      longitude: loc.lon,
      latitude: loc.lat,
      description: '',
    });
  }
  return created;
};

export const searchAllLists = async (q, { signal } = {}) => {
  return await request(`${BASE_PATH}/search`, {
    query: { q },
    signal,
    timeoutMs: 8000,
  });
};

export default {
  getMyLists,
  createList,
  getList,
  updateList,
  deleteList,
  addLocationToList,
  removeLocationFromList,
  reorderListLocations,
  createListWithLocations,
  searchAllLists,
};

