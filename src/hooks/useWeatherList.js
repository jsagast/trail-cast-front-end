import { useCallback, useEffect, useRef, useState } from 'react';
import * as forecastService from '../services/forecastService.js';

const normalizeName = (name) =>
  name?.replace?.(', United States of America', '') ?? name ?? 'Selected Location';

// --- de-dupe helpers ---
const normalizeNameKey = (name) =>
  String(normalizeName(name) ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

const coordKeyFrom = (loc) => {
  const lon = loc?.longitude ?? loc?.lon;
  const lat = loc?.latitude ?? loc?.lat;
  if (lon == null || lat == null) return null;
  const lo = Math.round(Number(lon) * 500) / 500;
  const la = Math.round(Number(lat) * 500) / 500;
  if (!Number.isFinite(lo) || !Number.isFinite(la)) return null;
  return `${lo}|${la}`;
};

const keysFrom = (loc) => ({
  nameKey: normalizeNameKey(loc?.name),
  coordKey: coordKeyFrom(loc),
});

const isDup = (a, bKeys) => {
  if (!a) return false;
  const aKeys = keysFrom(a);
  return (
    (aKeys.coordKey && bKeys.coordKey && aKeys.coordKey === bKeys.coordKey) ||
    (aKeys.nameKey && bKeys.nameKey && aKeys.nameKey === bKeys.nameKey)
  );
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

      const nextKeys = keysFrom(next);

      setLocations((prev) => {
        // Remove any existing location that matches by coords OR by name.
        const without = prev.filter((l) => !isDup(l, nextKeys));

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

      // De-dupe the incoming batch itself by coords OR name (keep first occurrence).
      const incoming = [];
      const incomingNameKeys = new Set();
      const incomingCoordKeys = new Set();
      for (const l of normalized) {
        const { nameKey, coordKey } = keysFrom(l);
        const seenByCoord = coordKey && incomingCoordKeys.has(coordKey);
        const seenByName = nameKey && incomingNameKeys.has(nameKey);
        if (seenByCoord || seenByName) continue;
        if (coordKey) incomingCoordKeys.add(coordKey);
        if (nameKey) incomingNameKeys.add(nameKey);
        incoming.push(l);
      }

      setLocations((prev) => {
        // Remove any existing location that matches *any* incoming entry by coords OR name.
        const base = prev.filter((l) => {
          const { nameKey, coordKey } = keysFrom(l);
          return !(
            (coordKey && incomingCoordKeys.has(coordKey)) ||
            (nameKey && incomingNameKeys.has(nameKey))
          );
        });

        const merged = insertAt === 'top'
          ? [...incoming, ...base]
          : [...base, ...incoming];

        // Final pass: enforce OR-uniqueness across the merged list.
        const seenName = new Set();
        const seenCoord = new Set();
        const out = [];
        for (const l of merged) {
          const { nameKey, coordKey } = keysFrom(l);
          const dupByCoord = coordKey && seenCoord.has(coordKey);
          const dupByName = nameKey && seenName.has(nameKey);
          if (dupByCoord || dupByName) continue;
          if (coordKey) seenCoord.add(coordKey);
          if (nameKey) seenName.add(nameKey);
          out.push(l);
          if (out.length >= limit) break;
        }
        return out;
      });

      return incoming;
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
