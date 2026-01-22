
import Forecast from '../Forecast/Forecast.jsx';
import styles from './Landing.module.css';

const Landing = () => {
  


  return (
    <main className={styles.container}>
      <Forecast />
      Search locations <br />
      List of popular lists <br />
      Search lists
    </main>
  );
};

export default Landing;