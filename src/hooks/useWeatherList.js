import { useCallback, useEffect, useRef, useState } from 'react';
import * as forecastService from '../services/forecastService.js';

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
    async (location) => {
      const { name, longitude, latitude } = location;
      const forecast = await forecastService.getWeather(longitude, latitude);

      const next = {
        name: name?.replace?.(', United States of America', '') ?? name ?? 'Selected Location',
        forecast,
        lon: longitude,
        lat: latitude,
      };

      setLocations((prev) => {
        const without = prev.filter((l) => l.name !== next.name);
        const nextList = [...without, next]; // add to bottom
        return nextList.slice(-limit); // keep last `limit`
      });
    },
    [limit]
  );

  return { locations, setLocations, addLocation };
}
