import styles from './ForecastLocationRow.module.css';

const dateKeyFromStartTime = (startTime) => startTime?.slice(0, 10);

const ForecastLocationRow = ({ weatherData, dayColumns }) => {
  // Build lookup: dateKey -> { day, night }
  const byDate = {};
  for (const p of weatherData.forecast || []) {
    const dk = dateKeyFromStartTime(p.startTime);
    if (!dk) continue;
    if (!byDate[dk]) byDate[dk] = { day: null, night: null };
    if (p.isDaytime) byDate[dk].day = p;
    else byDate[dk].night = p;
  }

  const renderHalf = (period, isNight) => {
    if (!period) return <div className={`${styles.half} ${styles.empty}`}>—</div>;

    return (
      <div className={`${styles.half} ${isNight ? styles.night : styles.day}`}>
        <img src={period.icon} alt={period.shortForecast} className={styles.icon} />
        <div className={styles.condition}>{period.shortForecast}</div>
        <div className={styles.temp}>
          {period.temperature}°{period.temperatureUnit}
        </div>
        <div className={styles.meta}>
          <div>💧 {period.probabilityOfPrecipitation?.value ?? 0}%</div>
          <div>༄ {period.windSpeed}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={styles.locationCell}>{weatherData.name}</div>

      {dayColumns.map(({ dateKey }) => {
        const pair = byDate[dateKey] || { day: null, night: null };

        return (
          <div key={`${weatherData.name}-${dateKey}`} className={styles.cell}>
            <div className={styles.cellInner}>
              {renderHalf(pair.day, false)}
              {renderHalf(pair.night, true)}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default ForecastLocationRow;
