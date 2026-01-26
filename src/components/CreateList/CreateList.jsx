import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import Forecast from '../Forecast/Forecast.jsx';
import LocationSearch from '../LocationSearch/LocationSearch.jsx';
import styles from './CreateList.module.css';

import { useWeatherList } from '../../hooks/useWeatherList.js';
import * as listService from '../../services/listService.js';
import * as forecastService from '../../services/forecastService.js';

const EPS = 1e-6;
const sameCoords = (aLon, aLat, bLon, bLat) =>
  Math.abs(Number(aLon) - Number(bLon)) < EPS && Math.abs(Number(aLat) - Number(bLat)) < EPS;

const CreateList = ({ mode }) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { listId } = useParams();

  const initialLocation = state?.initialLocation;

  const { locations, setLocations, addLocation } = useWeatherList({
    initialLocation,
    limit: 20,
  });

  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ====== EDIT MODE: load list + build Forecast-friendly locations ======
  useEffect(() => {
    if (mode !== 'edit') return;
    if (!listId) return;

    (async () => {
      try {
        setLoading(true);
        setError('');

        const fetched = await listService.getList(listId);

        // Prefill form
        setForm({
          name: fetched?.name ?? '',
          description: fetched?.description ?? '',
        });

        // Build local "weatherData-like" objects for Forecast
        const built = [];
        for (const entry of fetched.locations || []) {
          const locDoc = entry.location; // populated Location doc
          if (!locDoc) continue;

          const forecast = await forecastService.getWeather(locDoc.longitude, locDoc.latitude);

          built.push({
            _id: locDoc._id,
            name: locDoc.name,
            lon: locDoc.longitude,
            lat: locDoc.latitude,
            forecast,
            source: 'init',
          });
        }

        setLocations(built);
      } catch (err) {
        setError(err.message || 'Failed to load list for editing.');
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, listId, setLocations]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ====== SAVE (create vs edit) ======
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

      // ---------- CREATE ----------
      if (mode === 'create') {
        const created = await listService.createList({
          name: form.name.trim(),
          description: form.description.trim(),
        });

        // Add each location IN CURRENT ORDER
        for (const loc of locations) {
          if (loc?.lon == null || loc?.lat == null) continue;

          await listService.addLocationToList(created._id, {
            name: loc.name,
            longitude: loc.lon,
            latitude: loc.lat,
            description: '',
          });
        }

        // Go to the route you actually have: /lists/:listId
        navigate(`/lists/${created._id}`, {
          state: { list: created, locations }, // optional fast-render
        });
        return;
      }

      // ---------- EDIT ----------
      // 1) update metadata
      await listService.updateList(listId, {
        name: form.name.trim(),
        description: form.description.trim(),
      });

      // 2) ensure every UI location exists in this list
      for (const loc of locations) {
        if (loc?._id) continue;

        const updatedList = await listService.addLocationToList(listId, {
          name: loc.name,
          longitude: loc.lon,
          latitude: loc.lat,
          description: '',
        });

        // find the created/upserted location id and attach it to this loc
        const match = (updatedList.locations || []).find((e) => {
          const doc = e.location;
          return doc && sameCoords(doc.longitude, doc.latitude, loc.lon, loc.lat);
        });

        if (match?.location?._id) {
          // attach id directly
          loc._id = match.location._id;
        }
      }

      // 3) remove any locations that are no longer in UI
      const serverNow = await listService.getList(listId);
      const serverIds = (serverNow.locations || [])
        .map((e) => e.location?._id)
        .filter(Boolean)
        .map(String);

      const uiIds = locations
        .map((l) => l._id)
        .filter(Boolean)
        .map(String);

      for (const id of serverIds) {
        if (!uiIds.includes(id)) {
          await listService.removeLocationFromList(listId, id);
        }
      }

      // 4) persist reorder (0..n-1) using UI order
      await listService.reorderListLocations(listId, uiIds);

      // 5) go to ShowList
      navigate(`/lists/${listId}`, {
        state: { list: { ...serverNow, name: form.name.trim(), description: form.description.trim() }, locations },
      });
    } catch (err) {
      setError(err.message || 'Failed to save list.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className={styles.container}>Loading…</main>;
  }

  return (
    <main className={styles.container}>
      <h2>{mode === 'create' ? 'Create a List' : `Edit List`}</h2>

      {/* Title + description inputs */}
      <div className={styles.formRow}>
        <label>
          Title
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Favorite trailheads"
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

        {error ? <p className={styles.error}>{error}</p> : null}

        <button type="button" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : mode === 'create' ? 'Save List' : 'Save Changes'}
        </button>
      </div>

      <Forecast
        locations={locations}
        setLocations={setLocations}
        reorderable={true}
        limit={20}
        showListDropdown={false}
      />

      <LocationSearch
        getWeather={addLocation}
        autoLoad={false}
      />
    </main>
  );
};

export default CreateList;
