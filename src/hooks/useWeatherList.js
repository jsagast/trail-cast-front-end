import { useCallback, useEffect, useRef, useState } from 'react';
import * as forecastService from '../services/forecastService.js';

const normalizeName = (name) =>
  name?.replace?.(', United States of America', '') ?? name ?? 'Selected Location';

const keyFrom = (loc) => {
  const lon = loc?.longitude ?? loc?.lon;
  const lat = loc?.latitude ?? loc?.lat;
  if (lon == null || lat == null) return String(loc?.name ?? '');
  const lo = Math.round(Number(lon) * 10000) / 10000;
  const la = Math.round(Number(lat) * 10000) / 10000;
  return `${lo}|${la}`;
};

export function useWeatherList({ initialLocation = null, limit = 20 } = {}) {
  const [locations, setLocations] = useState([]);

  // seed initial location once (doesn't wipe later additions)
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    if (!initialLocation?.name) return;

    seededRef.current = true;
    setLocations([initialLocation]);
  }, [initialLocation]);

  const addLocation = useCallback(
    async (location, { insertAt = 'bottom' } = {}) => {
      const longitude = location?.longitude ?? location?.lon;
      const latitude = location?.latitude ?? location?.lat;

      const forecast = await forecastService.getWeather(longitude, latitude);

      const next = {
        name: normalizeName(location?.name),
        forecast,
        lon: longitude,
        lat: latitude,
      };

      const nextKey = keyFrom(next);

      setLocations((prev) => {
        const without = prev.filter((l) => keyFrom(l) !== nextKey);

        const merged = insertAt === 'top'
          ? [next, ...without]
          : [...without, next];

        return merged.slice(0, limit);
      });

      return next;
    },
    [limit]
  );

  const addLocationsBatch = useCallback(
    async (inputLocations, { insertAt = 'bottom' } = {}) => {
      const data = await forecastService.getWeatherBatch(inputLocations);

      const normalized = (data?.results || data || [])
        .filter((r) => Array.isArray(r.forecast) && r.forecast.length)
        .map((r) => ({
          name: normalizeName(r.name),
          forecast: r.forecast,
          lon: r.lon ?? r.longitude,
          lat: r.lat ?? r.latitude,
        }));

      setLocations((prev) => {
        const incomingKeys = new Set(normalized.map(keyFrom));
        const base = prev.filter((l) => !incomingKeys.has(keyFrom(l)));

        const merged = insertAt === 'top'
          ? [...normalized, ...base]
          : [...base, ...normalized];

        const seen = new Set();
        const out = [];
        for (const l of merged) {
          const k = keyFrom(l);
          if (seen.has(k)) continue;
          seen.add(k);
          out.push(l);
          if (out.length >= limit) break;
        }
        return out;
      });

      return normalized;
    },
    [limit]
  );

  return {
    locations,
    setLocations,
    addLocation,
    addLocationsBatch
  };
}
