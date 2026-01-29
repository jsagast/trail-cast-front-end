import { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ListsContext } from '../../contexts/ListsContext.jsx';
import * as listService from '../../services/listService.js';
import * as forecastService from '../../services/forecastService.js';
import { SEED_LOCATIONS } from '../../constants/seedLocations.js';
import Forecast from '../Forecast/Forecast.jsx';
import LocationSearch from '../LocationSearch/LocationSearch.jsx';
import { useWeatherList } from '../../hooks/useWeatherList.js';
import styles from './CreateList.module.css';

const pickRandomSeed = () =>
  SEED_LOCATIONS[Math.floor(Math.random() * SEED_LOCATIONS.length)];

const EPS = 1e-6;
const sameCoords = (aLon, aLat, bLon, bLat) =>
  Math.abs(Number(aLon) - Number(bLon)) < EPS && Math.abs(Number(aLat) - Number(bLat)) < EPS;

const CreateList = ({ mode }) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { listId } = useParams();

  const { createList: createListCtx, updateList: updateListCtx } = useContext(ListsContext);

  const initialLocation = state?.initialLocation;
  const seedLocations = state?.seedLocations;

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


  // ====== CREATE MODE: seed from Landing "visible locations" (if provided) ======
  useEffect(() => {
    if (mode !== 'create') return;

    // Keep existing behavior when routed here from Forecast dropdown
    if (initialLocation?.name) return;

    if (!Array.isArray(seedLocations) || seedLocations.length === 0) return;

    // If the user already started building a list, don't overwrite it
    if (locations.length) return;

    const normalized = seedLocations
      .filter((l) => l && (l.lon ?? l.longitude) != null && (l.lat ?? l.latitude) != null)
      .map((l) => ({
        _id: l._id, // keep if present
        name: l.name,
        lon: l.lon ?? l.longitude,
        lat: l.lat ?? l.latitude,
        forecast: l.forecast, // optional
        source: l.source ?? 'landing',
      }));

    if (!normalized.length) return;

    setError('');
    setLocations(normalized);
  }, [mode, initialLocation, seedLocations, locations.length, setLocations]);

  // ====== CREATE MODE: if no initialLocation was passed, default to "Your Location",
  // otherwise fall back to a random seeded city (single initial item) ======
  useEffect(() => {
    if (mode !== 'create') return;

    // If we were routed here from Forecast dropdown, keep that behavior.
    if (initialLocation?.name) return;

    // If user already has something in the list, don't mess with it.
    if (Array.isArray(seedLocations) && seedLocations.length) return;

    let cancelled = false;

    const addRandomSeed = async () => {
      const seed = pickRandomSeed();
      if (!seed) return;

      try {
        await addLocation(seed, { insertAt: 'top' });
      } catch (e) {
        if (!cancelled) setError('Could not load an initial location. Please search for a city.');
      }
    };

    (async () => {
      try {
        if (!navigator.geolocation) throw new Error('Geolocation not available');

        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 8000,
            maximumAge: 0,
          });
        });

        if (cancelled) return;

        await addLocation(
          {
            name: 'Your Location',
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
          { insertAt: 'top' }
        );
      } catch (e) {
        if (!cancelled) await addRandomSeed();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, initialLocation, seedLocations, locations.length, addLocation]);

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
        const created = await createListCtx({
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
      await updateListCtx(listId, {
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
      <section className={styles.gridArea}>
        <Forecast
          locations={locations}
          setLocations={setLocations}
          reorderable={true}
          limit={20}
          showListDropdown={false}
        />
      </section>

      <aside className={styles.sidebar}>
        <div className={styles.sidebarItem}>
          <div className={styles.locationSearchWrap}>
            <LocationSearch
              getWeather={addLocation}
              autoLoad={state?.autoLoadUserLocation === true}
            />
          </div>
        </div>

        <div className={styles.sidebarItem}>
          <section className={styles.metaCard}>
            <h2 className={styles.title}>
              {mode === 'create' ? 'Create a List' : 'Edit List'}
            </h2>

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
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Tell us some interesting things about this collection of locations"
                  rows={5}
                />
              </label>

              {error ? <p className={styles.error}>{error}</p> : null}

              <button
              className={styles.saveBtn}
                type="button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : mode === 'create' ? 'Save List' : 'Save Changes'}
              </button>
            </div>
          </section>
        </div>
      </aside>
    </main>
  );
};

export default CreateList;
