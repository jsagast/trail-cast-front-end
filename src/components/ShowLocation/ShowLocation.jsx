import { useLocation, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import Forecast from '../../components/Forecast/Forecast.jsx';
import LocationSearch from '../../components/LocationSearch/LocationSearch.jsx';
import styles from './ShowLocation.module.css';
import { useWeather } from '../../hooks/useWeather.js';

const ShowLocation = () => {
  const { state } = useLocation();
  const passed = state?.weatherData;

  const [searchParams] = useSearchParams();
  const lon = searchParams.get('lon');
  const lat = searchParams.get('lat');
  const name = searchParams.get('name');

  const { weatherData, setWeatherData, getWeather } = useWeather();

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
    </main>
  );
};

export default ShowLocation;
