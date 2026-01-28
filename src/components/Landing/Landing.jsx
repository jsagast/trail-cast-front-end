import { useCallback, useEffect } from 'react';
import Forecast from '../Forecast/Forecast.jsx';
import { useWeatherList } from '../../hooks/useWeatherList.js';
import Sidebar from '../Sidebar/Sidebar.jsx';
import { SEED_LOCATIONS } from '../../constants/seedLocations.js';
import styles from './Landing.module.css';

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
