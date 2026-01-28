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

  const formatActivities = (activities = []) =>
    activities.map(activity => ({
      _id: activity._id,
      text: activity.text,
      day: activity.day,
      createdAt: activity.createdAt || new Date().toISOString(),
      author: {
        _id: activity.author?._id,
        username: activity.author?.username || 'Unknown',
      },
  }));

  // if navigated from Link with state, use it immediately
  useEffect(() => {
    if (passed) setWeatherData(passed);
  }, [passed, setWeatherData]);

  // if opened via URL, fetch by lon/lat
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
      const location = await forecastService.getLocationByCoords(
        weatherData.lat,
        weatherData.lon
      );

      if (location) {
        setSavedLocation(location);
        setActivities(formatActivities(location.activities || []));
      } else {
        setSavedLocation(null);
        setActivities([]);
      };

    } catch (err) {
      console.error('Failed to fetch saved location:', err);
      setError('Failed to load activities.');
    }
  };

  fetchSavedLocation();
}, [weatherData]);

  const handleAddActivity = async (activityFormData) => {
    try {
 
      if (!location) {
        location = await forecastService.createLocation({
          name: weatherData.name,
          latitude: weatherData.lat,
          longitude: weatherData.lon
        });

        setSavedLocation(location);
      }
      console.log(savedLocation._id);

      const newActivity = await activityService.createActivity(
        // location._id,
        savedLocation._id,
        activityFormData
      );

      const safeActivity = {
        _id: newActivity._id || Date.now(),
        text: newActivity.text || activityFormData.text,
        day: newActivity.day || activityFormData.day,
        createdAt: newActivity.createdAt || new Date().toISOString(),
        author: {
          _id: newActivity.author?._id || user._id,
          username: newActivity.author?.username || 'You',
        },
      };

      setActivities(prev => [...prev, safeActivity]);
    } catch (err) {
      console.error('Failed to add activity:', err);
      setError('Failed to add activity.');
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Delete this activity?')) return;

    await activityService.deleteActivity(savedLocation._id, activityId);

    setActivities(activities =>
      activities.filter(activity => activity._id !== activityId)
    );

    if (editingActivity?._id === activityId) {
      setEditingActivity(null);
    }
  };

  const handleUpdateActivity = async (updatedActivityForm) => {
    try {
      const { _id, text, day } = updatedActivityForm;

      const updatedActivity = await activityService.updateActivity(
        savedLocation._id,
        _id,
        { text, day }
      );

      setActivities(activities =>
        activities.map(activity =>
          activity._id === updatedActivity._id
            ? { ...activity, text: updatedActivity.text, day: updatedActivity.day }
            : activity
        )
      );

      return updatedActivity;
    } catch (err) {
      console.error('Failed to update activity:', err);
      throw err;
    }
  };

  if (error) {
    return <main className={styles.container}>{error}</main>;
  }


  return (
    <main className={styles.container}>
      <h2>{name ?? 'Selected Location'}</h2>
      <Forecast
        weatherData={weatherData}
        mode="pinFirst"
        reorderable={true}
        limit={5}
      />
      <LocationSearch
        getWeather={getWeather}
        autoLoad={false}
      />
      <section className={styles.comments}>
        <h3>Activity Log</h3>

        <ActivityForm
          handleAddActivity={handleAddActivity}
          editingActivity={editingActivity}
          setEditingActivity={setEditingActivity}
          handleUpdateActivity={handleUpdateActivity}
        />

        {activities.length === 0 && (
          <p>There are no activities yet.</p>
        )}

        {activities.map(activity => (
          <article key={activity._id} className={styles.comment}>
            <header>
              <p>
                {`${activity.author._id === user._id ? 'You' : activity.author.username
                  } posted on ${new Date(activity.createdAt).toLocaleDateString()}`}
              </p>
            </header>
            <div className="activity">
              <p><strong>Activity:</strong> {activity.text}</p>
              <p>
                <strong>Day of Activity:</strong>{" "}
                {new Date(activity.day).toLocaleDateString()}
              </p>
            </div>

            {user && activity.author._id === user._id && (
              <div className={styles.commentActions}>
                <button onClick={() => setEditingActivity(activity)}>Edit</button>
                <button onClick={() => handleDeleteActivity(activity._id)}>Delete</button>
              </div>
            )}
          </article>
        ))}
      </section>

    </main>
  );
};

export default ShowLocation;
