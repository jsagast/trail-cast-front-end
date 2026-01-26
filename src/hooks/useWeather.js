import { useCallback, useRef, useState } from 'react';
import * as forecastService from '../services/forecastService.js';

export function useWeather() {
  const [weatherData, setWeatherData] = useState({});
  const latestReqId = useRef(0);

  const getWeather = useCallback(async (location, source = 'user') => {
    const reqId = ++latestReqId.current;

    const { name, longitude, latitude } = location;
    const forecast = await forecastService.getWeather(longitude, latitude);

    // ignore stale results finishing late
    if (reqId !== latestReqId.current) return;

    setWeatherData({
      name: name?.replace?.(', United States of America', '') ?? name ?? 'Selected Location',
      forecast,
      source,
      lon: longitude,
      lat: latitude,
    });
  }, []);

  return { weatherData, setWeatherData, getWeather };
}
