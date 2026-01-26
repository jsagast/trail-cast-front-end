import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Forecast from '../Forecast/Forecast.jsx';
import * as listService from '../../services/listService.js';
import * as forecastService from '../../services/forecastService.js';
import styles from './ShowList.module.css';

const coordKey = (lon, lat) => {
  const lo = Math.round(Number(lon) * 10000) / 10000;
  const la = Math.round(Number(lat) * 10000) / 10000;
  return `${lo}|${la}`;
};

const ShowList = () => {
  const { listId } = useParams();
  const { state } = useLocation();

  const [list, setList] = useState(state?.list ?? null);
  const [locations, setLocations] = useState(state?.locations ?? []);
  const [loading, setLoading] = useState(!(state?.locations?.length > 0));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!listId) {
      setError('Missing listId in URL.');
      setLoading(false);
      return;
    }

    // If navigated from CreateList and passed data, render immediately.
    if (state?.list && state?.locations?.length) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError('');

        const fetched = await listService.getList(listId);
        setList(fetched);

        // Collect populated Location docs in list order
        const locDocs = (fetched.locations || [])
          .map((entry) => entry.location)
          .filter(Boolean);

        if (!locDocs.length) {
          setLocations([]);
          setError('This list has no locations yet.');
          return;
        }

        // Batch weather fetch (fast + resilient)
        const batchInput = locDocs.map((loc) => ({
          name: loc.name,
          latitude: loc.latitude,
          longitude: loc.longitude,
        }));

        const batch = await forecastService.getWeatherBatch(batchInput);
        const results = batch?.results ?? batch ?? [];

        const byKey = new Map(
          results
            .filter((r) => Array.isArray(r.forecast) && r.forecast.length)
            .map((r) => [coordKey(r.lon ?? r.longitude, r.lat ?? r.latitude), r])
        );

        const built = [];
        for (const loc of locDocs) {
          const k = coordKey(loc.longitude, loc.latitude);
          const r = byKey.get(k);

          // Skip entries that failed to fetch forecast (keeps Forecast from getting stuck)
          if (!r?.forecast?.length) continue;

          built.push({
            name: loc.name,
            lon: loc.longitude,
            lat: loc.latitude,
            forecast: r.forecast,
            source: 'init',
          });
        }

        if (!built.length) {
          setLocations([]);
          setError('Could not load forecasts for this list right now.');
          return;
        }

        setLocations(built);
      } catch (err) {
        setError(err?.message || 'Failed to load list.');
      } finally {
        setLoading(false);
      }
    })();
  }, [listId]);

  if (loading) return <main className={styles.container}>Loading list…</main>;
  if (error) return <main className={styles.container}>{error}</main>;

  return (
    <main className={styles.container}>
      <h2>{list?.name ?? 'List'}</h2>
      {list?.description ? <p>{list.description}</p> : null}

      <Forecast
        locations={locations}
        reorderable={false}
        limit={20}
        showListDropdown={false}
      />
    </main>
  );
};

export default ShowList;
