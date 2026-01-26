import Forecast from '../Forecast/Forecast.jsx';
import LocationSearch from '../LocationSearch/LocationSearch.jsx';
import styles from './Landing.module.css';
import { useWeather } from '../../hooks/useWeather.js';

const Landing = () => {
  const { weatherData, getWeather } = useWeather();

  return (
    <main className={styles.container}>
      <Forecast
        weatherData={weatherData}
        mode="newestTop"
        limit={5}
        initialTopName="Your Location"
      />
      <LocationSearch getWeather={getWeather} />
    </main>
  );
};

export default Landing;
