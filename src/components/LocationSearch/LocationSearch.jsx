import { useState } from 'react';
import * as forecastService from '../../services/forecastService.js';
import styles from './LocationSearch.module.css';

const LocationSearch = (props) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleInputChange = async (event) => {
    const query = event.target.value;
    setSearchTerm(query);

    if (!query) {
      setSearchResults([]);
      return;
    }

    const searchData = await forecastService.searchLocations(query);

    // Race condition check: only update if the input hasn't changed
    if (query === event.target.value) {
      setSearchResults(searchData?.places || []);
    }
  };

  const handleSelectLocation = (location) => {
    setSearchTerm(location.name);
    setSearchResults([]);
    props.getWeather(location);
  };

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
          placeholder="e.g. London"
          className={styles.searchInput}
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