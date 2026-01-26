import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import styles from './ForecastLocationRow.module.css';

const dateKeyFromStartTime = (startTime) => startTime?.slice(0, 10);

// deterministic index from a string (so it doesn't change every render)
const variantIndexFromKey = (key, mod = 3) => {
  if (!key) return 0;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
};

const ForecastLocationRow = ({ weatherData, dayColumns, reorder }) => {
  const navigate = useNavigate();
  const [listChoice, setListChoice] = useState('');

  const lists = []; // TODO: replace with real lists when you fetch them

  // Build lookup: dateKey -> { day, night }
  const byDate = {};
  for (const p of weatherData.forecast || []) {
    const dk = dateKeyFromStartTime(p.startTime);
    if (!dk) continue;
    if (!byDate[dk]) byDate[dk] = { day: null, night: null };
    if (p.isDaytime) byDate[dk].day = p;
    else byDate[dk].night = p;
  }

  const handleListChange = (e) => {
    const value = e.target.value;
    setListChoice('');

    if (value === 'new list') {
      navigate('/lists/new', { state: { initialLocation: weatherData } });
      return;
    }

    // later: if value is existing listId, navigate to edit page
    // navigate(`/lists/${value}/edit`, { state: { initialLocation: weatherData } });
  };

  const renderHalf = (period, isNight) => {
    if (!period) return <div className={`${styles.half} ${styles.empty}`}>—</div>;

    let nightStarsClass = '';
    if (isNight) {
      const variants = [
        styles.starsA,
        styles.starsB,
        styles.starsC,
        styles.starsD,
        styles.starsE,
        styles.starsF,
      ];
      const idx = variantIndexFromKey(period.startTime, variants.length);
      nightStarsClass = variants[idx];
    }

    return (
      <div
        className={[
          styles.half,
          isNight ? styles.night : styles.day,
          isNight ? nightStarsClass : '',
        ].join(' ')}
      >
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
      <div className={styles.locationCell}>

        <Link
          to={`/location?name=${encodeURIComponent(weatherData.name)}&lon=${weatherData.lon}&lat=${weatherData.lat}`}
          state={{ weatherData }}
        >
          {weatherData.name}
        </Link>

        {/* Reorder buttons (optional, only if passed in) */}
        {reorder?.enabled && (
          <div className={styles.reorderControls}>
            <button
              type="button"
              onClick={() => reorder.onMove(reorder.index, reorder.index - 1)}
              disabled={reorder.index === 0}
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => reorder.onMove(reorder.index, reorder.index + 1)}
              disabled={reorder.index === reorder.total - 1}
              aria-label="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => reorder.onRemove(reorder.index)}
              aria-label="Remove"
            >
              ✕
            </button>
          </div>
        )}

        <select
          id="listId"
          name="listId"
          value={listChoice}
          onChange={handleListChange}
        >
          <option value="" disabled hidden>
            Add to list?
          </option>

          {lists.map((list) => (
            <option key={list._id} value={list._id}>
              {list.name}
            </option>
          ))}

          <option value="new list">new list</option>
        </select>
      </div>

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
