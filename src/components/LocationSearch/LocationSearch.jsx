// src/components/LocationSearch/LocationSearch.jsx
import { useState, useEffect, useRef } from 'react';
import * as forecastService from '../../services/forecastService.js';
import styles from './LocationSearch.module.css';

const cities = [
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Dallas, TX",
  "Houston, TX",
  "Washington, DC",
  "Philadelphia, PA",
  "Miami, FL",
  "Atlanta, GA",
  "Phoenix, AZ",
  "Boston, MA",
  "San Francisco, CA",
  "Detroit, MI",
  "Seattle, WA",
  "Minneapolis, MN",
  "Tampa, FL",
  "San Diego, CA",
  "Denver, CO",
  "Baltimore, MD",
  "St. Louis, MO",
  "Orlando, FL",
  "Charlotte, NC",
  "San Antonio, TX",
  "Portland, OR",
  "Sacramento, CA",
  "Pittsburgh, PA",
  "Austin, TX",
  "Las Vegas, NV",
  "Cincinnati, OH",
  "Salt Lake City, UT",
];

// pick N unique random items
const pickRandomUnique = (arr, n) => {
  const copy = [...arr];
  const picked = [];
  const count = Math.min(n, copy.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    picked.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return picked;
};

const LocationSearch = ({ getWeather, autoLoad = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // rotating placeholder
  const [cityIndex, setCityIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // keep latest getWeather without re-running mount effect
  const getWeatherRef = useRef(getWeather);
  useEffect(() => {
    getWeatherRef.current = getWeather;
  }, [getWeather]);

  // StrictMode / re-render guard: run only once
  const didInitRef = useRef(false);

  const loadCityForecast = async (cityString) => {
    try {
      const searchData = await forecastService.searchLocations(cityString);
      const place = searchData?.places?.[0];
      if (!place) return;

      // place must have latitude/longitude for your getWeather
      await getWeatherRef.current(place, 'init');
    } catch (err) {
      console.error('Failed to load city forecast:', cityString, err);
    }
  };

  useEffect(() => {
    if (!autoLoad) return;
    if (didInitRef.current) return;
    didInitRef.current = true;

    const loadRandomCities = async (count) => {
      const randomCities = pickRandomUnique(cities, count);
      for (const city of randomCities) {
        // eslint-disable-next-line no-await-in-loop
        await loadCityForecast(city);
      }
    };

    if (!navigator.geolocation) {
      loadRandomCities(5);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // 1) user location — await so it happens first
        await getWeatherRef.current(
          {
            name: 'Your Location',
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          'init'
        );

        // 2) four random cities
        await loadRandomCities(4);
      },
      async () => {
        // fallback: five random cities
        await loadRandomCities(5);
      }
    );
  }, [autoLoad]);

  const handleInputChange = async (event) => {
    const query = event.target.value;
    setSearchTerm(query);

    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      const searchData = await forecastService.searchLocations(query);
      // ignore stale responses while user types
      if (query === event.target.value) {
        setSearchResults(searchData?.places || []);
      }
    } catch (err) {
      console.error('Location search failed:', err);
      setSearchResults([]);
    }
  };

  const handleSelectLocation = (location) => {
    setSearchTerm('');
    setSearchResults([]);
    getWeatherRef.current(location, 'user');
  };

  // placeholder animation
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCityIndex(Math.floor(Math.random() * cities.length));
        setFade(true);
      }, 350);
    }, 2100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.searchContainer}>
      <form onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="search" className={styles.searchLabel}>
          Search Location:
        </label>

        <input
          id="search"
          type="text"
          autoComplete="off"
          placeholder={`${cities[cityIndex]}`}
          className={`${styles.searchInput} ${fade ? styles.fadeIn : styles.fadeOut}`}
          value={searchTerm}
          onChange={handleInputChange}
        />
      </form>

      {searchResults.length > 0 && (
        <ul className={styles.dropdownList}>
          {searchResults.map((location) => (
            <li
              key={location.place_id}
              className={styles.dropdownItem}
              onClick={() => handleSelectLocation(location)}
            >
              {location.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationSearch;
