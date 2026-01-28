import { useCallback, useEffect } from 'react';
import Forecast from '../Forecast/Forecast.jsx';
import { useWeatherList } from '../../hooks/useWeatherList.js';
import Sidebar from '../Sidebar/Sidebar.jsx';
import styles from './Landing.module.css';

// Seed locations with precomputed coords so Landing doesn't need Geoapify on load.
const SEED_LOCATIONS = [
  { name: 'New York, NY', latitude: 40.7128, longitude: -74.0060 },
  { name: 'Los Angeles, CA', latitude: 34.0522, longitude: -118.2437 },
  { name: 'Chicago, IL', latitude: 41.8781, longitude: -87.6298 },
  { name: 'Dallas, TX', latitude: 32.7767, longitude: -96.7970 },
  { name: 'Houston, TX', latitude: 29.7604, longitude: -95.3698 },
  { name: 'Washington, DC', latitude: 38.9072, longitude: -77.0369 },
  { name: 'Philadelphia, PA', latitude: 39.9526, longitude: -75.1652 },
  { name: 'Miami, FL', latitude: 25.7617, longitude: -80.1918 },
  { name: 'Atlanta, GA', latitude: 33.7490, longitude: -84.3880 },
  { name: 'Phoenix, AZ', latitude: 33.4484, longitude: -112.0740 },
  { name: 'Boston, MA', latitude: 42.3601, longitude: -71.0589 },
  { name: 'San Francisco, CA', latitude: 37.7749, longitude: -122.4194 },
  { name: 'Seattle, WA', latitude: 47.6062, longitude: -122.3321 },
  { name: 'Denver, CO', latitude: 39.7392, longitude: -104.9903 },
  { name: 'Portland, OR', latitude: 45.5152, longitude: -122.6784 },
  { name: 'Sacramento, CA', latitude: 38.5816, longitude: -121.4944 },
];

const pickRandomUnique = (arr, n) => {
  const copy = [...arr];
  const picked = [];
  const count = Math.min(n, copy.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    picked.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return picked;
};

const Landing = () => {
  const { locations, setLocations, addLocation, addLocationsBatch } = useWeatherList({ limit: 5 });

  // When a user selects a location from search, it should feel immediate
  const getWeather = useCallback(
    async (location) => {
      await addLocation(location, { insertAt: 'top' });
    },
    [addLocation]
  );

  // Fast Landing load:
  useEffect(() => {
    let cancelled = false;

    // 1) Seed cities (don’t block on geolocation)
    (async () => {
      try {
        const seeds = pickRandomUnique(SEED_LOCATIONS, 4);
        await addLocationsBatch(seeds, { insertAt: 'bottom' });
      } catch (e) {
        if (!cancelled) console.error('Landing seed load failed:', e);
      }
    })();

    // 2) Your Location (optional; not pinned)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          try {
            // Put it at the top so it's visible, but it's NOT pinned.
            await addLocation(
              {
                name: 'Your Location',
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              },
              { insertAt: 'top' }
            );
          } catch (e) {
            if (!cancelled) console.error('Landing geolocation forecast failed:', e);
          }
        },
        () => {}
      );
    }

    return () => {
      cancelled = true;
    };
  }, [addLocationsBatch, addLocation]);

  return (
    <main className={styles.container}>
      <section className={styles.gridArea}>
        <Forecast
          locations={locations}
          setLocations={setLocations}
          mode="newestTop"
          reorderable={true}
          limit={5}
        />
      </section>

      <Sidebar getWeather={getWeather} />
    </main>
  );
};

export default Landing;
