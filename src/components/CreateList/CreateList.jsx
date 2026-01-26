// src/components/CreateList/CreateList.jsx
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import Forecast from '../Forecast/Forecast.jsx';
import LocationSearch from '../LocationSearch/LocationSearch.jsx';
import styles from './CreateList.module.css';
import { useWeatherList } from '../../hooks/useWeatherList.js';
import * as listService from '../../services/listService.js';

const CreateList = ({ mode }) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const initialLocation = state?.initialLocation;
  const { listId } = useParams();

  const { locations, setLocations, addLocation } = useWeatherList({
    initialLocation,
    limit: 20,
  });

  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setError('');

    if (!form.name.trim()) {
      setError('List title is required.');
      return;
    }
    if (!locations.length) {
      setError('Add at least one location before saving.');
      return;
    }

    try {
      setSaving(true);

      // 1) create list
      const created = await listService.createList({
        name: form.name.trim(),
        description: form.description.trim(),
      });

      // 2) add each location IN CURRENT ORDER (preserves order)
      // Your weatherData objects use lon/lat (not longitude/latitude)
      for (const loc of locations) {
        if (loc?.lon == null || loc?.lat == null) continue;

        // eslint-disable-next-line no-await-in-loop
        await listService.addLocationToList(created._id, {
          name: loc.name,
          longitude: loc.lon,
          latitude: loc.lat,
          description: '', // optional for now
        });
      }

      // 3) navigate to ShowList
      // Pass state so ShowList can render immediately without refetch
      navigate(`/lists/${created._id}`, {
        state: {
          list: created,
          // include the forecasts you already have
          locations,
        },
      });
    } catch (err) {
      setError(err.message || 'Failed to save list.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={styles.container}>
      {mode === 'create' ? <h2>Create a List</h2> : <h2>Edit List {listId}</h2>}

      {/* Title + description */}
      <div className={styles.formRow}>
        <label>
          Title
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Favorite ski towns"
          />
        </label>

        <label>
          Description (optional)
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="A quick note about this list"
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button type="button" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save List'}
        </button>
      </div>

      <Forecast
        locations={locations}
        setLocations={setLocations}
        reorderable={true}
        limit={20}
      />

      <LocationSearch getWeather={addLocation} autoLoad={false} />
    </main>
  );
};

export default CreateList;

