const API_ROOT = import.meta.env.VITE_BACK_END_SERVER_URL;
const BASE_PATH = '/lists';

// ---------- Errors ----------
export class ApiError extends Error {
  constructor(message, { status, data, url, method } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.url = url;
    this.method = method;
  }
}

// ---------- Helpers ----------
const getToken = () => localStorage.getItem('token');

const joinUrl = (...parts) => {
  // join without double slashes
  return parts
    .filter(Boolean)
    .map((p, idx) => {
      const s = String(p);
      if (idx === 0) return s.replace(/\/+$/, '');
      return s.replace(/^\/+/, '').replace(/\/+$/, '');
    })
    .join('/');
};

const buildQueryString = (query = {}) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach((item) => params.append(k, String(item)));
    else params.set(k, String(v));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

const isFormData = (body) =>
  typeof FormData !== 'undefined' && body instanceof FormData;

const safeParseResponse = async (res) => {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (isJson) {
    // If the server claims JSON but returns invalid JSON, this avoids crashing.
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      // fall back to raw text so error messages are still visible
      return text;
    }
  }

  // Non-JSON (HTML error pages, etc.)
  return await res.text();
};

const inferErrorMessage = (data, res) => {
  // Prefer API-provided messages
  if (data && typeof data === 'object') {
    return data.err || data.message || `Request failed: ${res.status}`;
  }
  if (typeof data === 'string' && data.trim()) return data;
  return `Request failed: ${res.status}`;
};

// ---------- Core request ----------
const request = async (
  path,
  {
    method = 'GET',
    query,
    body,
    headers: customHeaders,
    timeoutMs = 15000,
    signal: externalSignal,
  } = {}
) => {
  if (!API_ROOT) {
    throw new Error(
      'Missing VITE_BACK_END_SERVER_URL. Check your .env and restart Vite.'
    );
  }

  const url = joinUrl(API_ROOT, path) + buildQueryString(query);

  // Timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // If caller passed a signal, we can’t merge signals directly,
  // but we can abort ours when theirs aborts.
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const headers = new Headers(customHeaders || {});
  headers.set('Accept', 'application/json');

  const token = getToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const opts = {
    method,
    headers,
    signal: controller.signal,
  };

  // Attach body (auto JSON unless it’s FormData)
  if (body !== undefined) {
    if (isFormData(body)) {
      opts.body = body;
      // DO NOT set Content-Type; browser will set boundary
    } else if (typeof body === 'string') {
      opts.body = body;
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    } else {
      opts.body = JSON.stringify(body);
      if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    }
  }

  try {
    const res = await fetch(url, opts);
    const data = await safeParseResponse(res);

    if (!res.ok) {
      throw new ApiError(inferErrorMessage(data, res), {
        status: res.status,
        data,
        url,
        method,
      });
    }

    return data;
  } catch (err) {
    // Abort / timeout errors are very common: surface a friendly message
    if (err?.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', {
        status: 408,
        data: null,
        url,
        method,
      });
    }
    // If it’s already an ApiError, bubble it
    if (err instanceof ApiError) throw err;

    // Network / CORS / server down
    throw new ApiError(err?.message || 'Network error', {
      status: 0,
      data: null,
      url,
      method,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

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

// ---------- CreateList ----------
/**
 * create a list AND add locations in current order.
 * matches CreateList workflow and keeps ordering stable.
 *
 * locations look like existing weather objects:
 *   { name, lon, lat, ... }
 */
export const createListWithLocations = async ({
  name,
  description = '',
  locations = [],
}) => {
  const created = await createList({ name, description });

  // Add sequentially to preserve order and avoid hammering server
  for (const loc of locations) {
    if (!loc || loc.lon == null || loc.lat == null) continue;
    // eslint-disable-next-line no-await-in-loop
    await addLocationToList(created._id, {
      name: loc.name,
      longitude: loc.lon,
      latitude: loc.lat,
      description: '',
    });
  }
  return created;
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
};

