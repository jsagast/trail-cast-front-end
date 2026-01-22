import { useState } from 'react';
import * as forecastService from '../../services/forecastService.js';

const LocationSearch = () => {
  const [searchResults, setSearchResults] = useState([]);

  const handleInputChange = async (event) => {
    const query = event.target.value;
    
    if (!query) {
      setSearchResults([]);
      return;
    }

    const searchData = await forecastService.searchLocations(query);

    if (query === event.target.value) {
      setSearchResults(searchData?.places || []);
    }
  };

  return (
    <>
      <form>
        <label htmlFor="search">Search Location: </label>
        <input
          id="search"
          onChange={handleInputChange}
        />
      </form>
      <div>
        Search results: 
        <ul>
          {searchResults.map(location => (
            <li key={location.place_id}>
              {location.name}
            </li>
          ))}
        </ul>

      </div>
    </>
  );
};


export default LocationSearch;