import { useLocation, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useContext } from 'react';
import Forecast from '../../components/Forecast/Forecast.jsx';
import LocationSearch from '../../components/LocationSearch/LocationSearch.jsx';
import styles from './ShowLocation.module.css';
import { useWeather } from '../../hooks/useWeather.js';
import { UserContext } from '../../contexts/UserContext';
import ActivityForm from '../ActivityForm/ActivityForm.jsx';
import * as activityService from '../../services/activityService.js';
import * as forecastService from '../../services/forecastService.js';

const ShowLocation = () => {
  const { state } = useLocation();
  const { user } = useContext(UserContext);
  const passed = state?.weatherData;

  const [searchParams] = useSearchParams();
  const lon = searchParams.get('lon');
  const lat = searchParams.get('lat');
  const name = searchParams.get('name');

  const { weatherData, setWeatherData, getWeather } = useWeather();

  const [savedLocation, setSavedLocation] = useState(null);
  const [activities, setActivities] = useState([]);
  const [editingActivity, setEditingActivity] = useState(null);
  const [error, setError] = useState('');

  const formatActivities = (list = []) =>
    list.map((activity) => ({
      _id: activity._id,
      text: activity.text,
      day: activity.day,
      createdAt: activity.createdAt || new Date().toISOString(),
      author: {
        _id: activity.author?._id,
        username: activity.author?.username || 'Unknown',
      },
    }));

  // If navigated from Link with state, use it immediately
  useEffect(() => {
    if (passed) setWeatherData(passed);
  }, [passed, setWeatherData]);

  // If opened via URL, fetch by lon/lat
  useEffect(() => {
    if (passed) return;
    if (!lon || !lat) return;

    getWeather(
      {
        name: name ? decodeURIComponent(name) : 'Selected Location',
        longitude: Number(lon),
        latitude: Number(lat),
      },
      'init'
    );
  }, [passed, lon, lat, name, getWeather]);

  useEffect(() => {
    const fetchSavedLocation = async () => {
      if (!weatherData) return;

      try {
        const loc = await forecastService.getLocationByCoords(weatherData.lat, weatherData.lon);

        if (loc) {
          setSavedLocation(loc);
          setActivities(formatActivities(loc.activities || []));
        } else {
          setSavedLocation(null);
          setActivities([]);
        }
      } catch (err) {
        console.error('Failed to fetch saved location:', err);
        setError('Failed to load activities.');
      }
    };

    fetchSavedLocation();
  }, [weatherData]);

  const handleAddActivity = async (activityFormData) => {
    try {
      setError('');

      if (!weatherData) {
        setError('No location selected.');
        return;
      }

      // FIX: use savedLocation; create it if needed
      let loc = savedLocation;
      if (!loc) {
        loc = await forecastService.createLocation({
          name: weatherData.name,
          latitude: weatherData.lat,
          longitude: weatherData.lon,
        });
        setSavedLocation(loc);
      }

      const newActivity = await activityService.createActivity(loc._id, activityFormData);

      const safeActivity = {
        _id: newActivity._id || Date.now(),
        text: newActivity.text || activityFormData.text,
        day: newActivity.day || activityFormData.day,
        createdAt: newActivity.createdAt || new Date().toISOString(),
        author: {
          _id: newActivity.author?._id || user?._id,
          username: newActivity.author?.username || 'You',
        },
      };

      setActivities((prev) => [...prev, safeActivity]);
    } catch (err) {
      console.error('Failed to add activity:', err);
      setError('Failed to add activity.');
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!savedLocation?._id) return;
    if (!window.confirm('Delete this activity?')) return;

    await activityService.deleteActivity(savedLocation._id, activityId);

    setActivities((prev) => prev.filter((a) => a._id !== activityId));

    if (editingActivity?._id === activityId) setEditingActivity(null);
  };

  const handleUpdateActivity = async (updatedActivityForm) => {
    if (!savedLocation?._id) return;

    const { _id, text, day } = updatedActivityForm;

    const updatedActivity = await activityService.updateActivity(savedLocation._id, _id, { text, day });

    setActivities((prev) =>
      prev.map((a) =>
        a._id === updatedActivity._id ? { ...a, text: updatedActivity.text, day: updatedActivity.day } : a
      )
    );

    return updatedActivity;
  };

  const pageTitle = name ?? weatherData?.name ?? 'Selected Location';

  return (
    <main className={styles.container}>
      <section className={styles.gridArea}>
        <Forecast weatherData={weatherData} mode="pinFirst" reorderable={true} limit={5} />

        <section className={styles.comments}>
          <h3>Activity Log</h3>

          <ActivityForm
            handleAddActivity={handleAddActivity}
            editingActivity={editingActivity}
            setEditingActivity={setEditingActivity}
            handleUpdateActivity={handleUpdateActivity}
          />

          {error ? <p className={styles.inlineError}>{error}</p> : null}

          {activities.length === 0 ? (
            <p>There are no activities yet.</p>
          ) : (
            activities.map((activity) => (
              <article key={activity._id} className={styles.comment}>
                <header>
                  <p>
                    {`${activity.author?._id === user?._id ? 'You' : activity.author?.username || 'Unknown'
                      } posted on ${new Date(activity.createdAt).toLocaleDateString()}`}
                  </p>
                </header>

                <div className="activity">
                  <p>
                    <strong>Activity:</strong> {activity.text}
                  </p>
                  <p>
                    <strong>Day of Activity:</strong> {new Date(activity.day).toLocaleDateString()}
                  </p>
                </div>

                {user && activity.author?._id === user._id && (
                  <div className={styles.commentActions}>
                    <button type="button" onClick={() => setEditingActivity(activity)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDeleteActivity(activity._id)}>
                      Delete
                    </button>
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      </section>

      <aside className={styles.sidebar}>
        <div className={styles.sidebarItem}>
          <section className={styles.metaCard}>
            <h2 className={styles.title}>{pageTitle}</h2>
          </section>
        </div>

        <div className={styles.sidebarItem}>
          <LocationSearch getWeather={getWeather} autoLoad={false} />
        </div>
      </aside>
    </main>
  );
};

export default ShowLocation;
