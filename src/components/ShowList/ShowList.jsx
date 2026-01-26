import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Forecast from '../Forecast/Forecast.jsx';
import * as listService from '../../services/listService.js';
import * as forecastService from '../../services/forecastService.js';
import styles from './ShowList.module.css';

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

    // Otherwise fetch list + forecasts
    (async () => {
      try {
        setLoading(true);
        setError('');

        const fetched = await listService.getList(listId);
        setList(fetched);

        const built = [];
        for (const entry of fetched.locations || []) {
          const locDoc = entry.location; // populated Location doc
          if (!locDoc) continue;

          const forecast = await forecastService.getWeather(locDoc.longitude, locDoc.latitude);

          built.push({
            name: locDoc.name,
            lon: locDoc.longitude,
            lat: locDoc.latitude,
            forecast,
            source: 'init',
          });
        }

        setLocations(built);
      } catch (err) {
        setError(err.message || 'Failed to load list.');
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
