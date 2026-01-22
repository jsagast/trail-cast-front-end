
import Forecast from '../Forecast/Forecast.jsx';
import LocationSearch from '../LocationSearch/LocationSearch.jsx';
import styles from './Landing.module.css';

const Landing = () => {
  console.log()


  return (
    <main className={styles.container}>
      <Forecast />
      <LocationSearch />
      List of popular lists <br />
      Search lists
    </main>
  );
};

export default Landing;