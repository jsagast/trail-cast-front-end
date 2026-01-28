import { useEffect, useRef, useState } from 'react';
import * as forecastService from '../../services/forecastService.js';
import { SEED_LOCATIONS } from '../../constants/seedLocations.js';
import styles from './LocationSearch.module.css';

const LocationSearch = ({ getWeather, autoLoad = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // rotating placeholder + fade (keep styling/behavior)
  const [cityIndex, setCityIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // keep latest getWeather without re-running effects
  const getWeatherRef = useRef(getWeather);
  useEffect(() => {
    getWeatherRef.current = getWeather;
  }, [getWeather]);

  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Debounced search
  useEffect(() => {
    const query = searchTerm.trim();

    if (!query) {
      setSearchResults([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const searchData = await forecastService.searchLocations(query);
        setSearchResults(searchData?.places || []);
      } catch (err) {
        console.error('Location search failed:', err);
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleSelectLocation = (location) => {
    setSearchTerm('');
    setSearchResults([]);
    getWeatherRef.current(location, 'user');
  };

  // Placeholder animation (fade out, swap, fade in)
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCityIndex(Math.floor(Math.random() * SEED_LOCATIONS.length));
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
          placeholder={`${SEED_LOCATIONS[cityIndex]?.name ?? ''}`}
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
