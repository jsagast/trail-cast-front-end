import { useState } from 'react';
import Forecast from '../Forecast/Forecast.jsx';
import LocationSearch from '../LocationSearch/LocationSearch.jsx';
import * as forecastService from '../../services/forecastService.js';
import styles from './Landing.module.css';

const Landing = () => {
  const [weatherData, setWeatherData] = useState({});

  const getWeather = async (location) => {
    let { name, longitude, latitude } = location
    const weatherData = await forecastService.getWeather(longitude, latitude)
    setWeatherData({name: name.replace(', United States of America', ''), forecast: weatherData})
  }

  return (
    <main className={styles.container}>
      <Forecast weatherData={weatherData}/>
      <LocationSearch getWeather={getWeather} />
      List of popular lists <br />
      Search lists
    </main>
  );
};

export default Landing;