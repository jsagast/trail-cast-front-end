import { useCallback, useRef, useState } from 'react';
import * as forecastService from '../services/forecastService.js';

export function useWeather() {
  const [weatherData, setWeatherData] = useState({});
  const latestReqId = useRef(0);

  const getWeather = useCallback(async (location, source = 'user') => {
    const reqId = ++latestReqId.current;

    const next = await forecastService.getWeatherData(location);

    // ignore stale results finishing late
    if (reqId !== latestReqId.current) return;

    setWeatherData({
      ...next,
      source,
    });
  }, []);

  return { weatherData, setWeatherData, getWeather };
}