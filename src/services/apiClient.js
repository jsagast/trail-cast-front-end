const API_ROOT = import.meta.env.VITE_BACK_END_SERVER_URL;

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

export const joinUrl = (...parts) => {
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

export const buildQueryString = (query = {}) => {
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
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return text;
    }
  }

  return await res.text();
};

const inferErrorMessage = (data, res) => {
  if (data && typeof data === 'object') {
    return data.err || data.message || `Request failed: ${res.status}`;
  }
  if (typeof data === 'string' && data.trim()) return data;
  return `Request failed: ${res.status}`;
};

// ---------- Core request ----------
export const request = async (
  path,
  {
    method = 'GET',
    query,
    body,
    headers: customHeaders,
    timeoutMs = 15000,
    signal: externalSignal,
    withAuth = true,
  } = {}
) => {
  if (!API_ROOT) {
    throw new Error(
      'Missing VITE_BACK_END_SERVER_URL. Check your .env and restart Vite.'
    );
  }

  const url = joinUrl(API_ROOT, path) + buildQueryString(query);

  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else
      externalSignal.addEventListener('abort', () => controller.abort(), {
        once: true,
      });
  }

  const headers = new Headers(customHeaders || {});
  headers.set('Accept', 'application/json');

  if (withAuth) {
    const token = getToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const opts = {
    method,
    headers,
    signal: controller.signal,
  };

  if (body !== undefined) {
    if (isFormData(body)) {
      opts.body = body;
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
    if (err?.name === 'AbortError') {
      // Aborts can be timeouts OR caller-cancelled requests.
      if (timedOut) {
        throw new ApiError('Request timed out. Please try again.', {
          status: 408,
          data: null,
          url,
          method,
        });
      }
      throw new ApiError('Request cancelled', {
        status: 0,
        data: null,
        url,
        method,
      });
    }

    if (err instanceof ApiError) throw err;

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
