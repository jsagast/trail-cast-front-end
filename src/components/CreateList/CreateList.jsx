// src/components/CreateList/CreateList.jsx
import { useLocation, useParams } from 'react-router-dom';
import Forecast from '../Forecast/Forecast.jsx';
import LocationSearch from '../LocationSearch/LocationSearch.jsx';
import styles from './CreateList.module.css';
import { useWeatherList } from '../../hooks/useWeatherList.js';

const CreateList = ({ mode }) => {
  const { state } = useLocation();
  const initialLocation = state?.initialLocation;
  const { listId } = useParams();

  const { locations, setLocations, addLocation } = useWeatherList({
    initialLocation,
    limit: 20,
  });

  return (
    <main className={styles.container}>
      {mode === 'create' ? <h2>Create a List</h2> : <h2>Edit List {listId}</h2>}

      <Forecast
        locations={locations}
        setLocations={setLocations}
        reorderable={true}
        limit={20}
      />

      <LocationSearch getWeather={addLocation} autoLoad={false} />
    </main>
  );
};

export default CreateList;
