import { useCallback, useEffect, useRef, useState } from 'react';
import * as listService from '../services/listService.js';

// module-level cache (shared across all components)
let cachedToken = null;
let cachedLists = null;
let cachedError = null;
let inflight = null;

export function useMyLists({ enabled = true } = {}) {
  const token = localStorage.getItem('token') || null;
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const [lists, setLists] = useState(cachedLists ?? []);
  const [loading, setLoading] = useState(enabled && !cachedLists);
  const [error, setError] = useState(cachedError ?? '');

  const load = useCallback(
    async (force = false) => {
      if (!enabled) return;

      const currentToken = tokenRef.current;

      // if auth token changed, reset cache
      if (cachedToken !== currentToken) {
        cachedToken = currentToken;
        cachedLists = null;
        cachedError = null;
        inflight = null;
      }

      // use cache unless forced
      if (!force && cachedLists) {
        setLists(cachedLists);
        setError('');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        if (!inflight) inflight = listService.getMyLists();
        const data = await inflight;
        inflight = null;

        cachedLists = Array.isArray(data) ? data : [];
        cachedError = '';

        setLists(cachedLists);
      } catch (err) {
        inflight = null;
        const msg = err?.message || 'Failed to load lists';
        cachedError = msg;

        setError(msg);
        setLists([]);
      } finally {
        setLoading(false);
      }
    },
    [enabled]
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { lists, loading, error, refresh };
}
