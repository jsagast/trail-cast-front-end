import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import styles from './ForecastLocationRow.module.css';
import * as listService from '../../services/listService.js';

const dateKeyFromStartTime = (startTime) => startTime?.slice(0, 10);

const locationKey = (loc) => {
  if (!loc) return '';
  if (loc._id) return String(loc._id);
  if (loc.lon != null && loc.lat != null) {
    const lo = Math.round(Number(loc.lon) * 10000) / 10000;
    const la = Math.round(Number(loc.lat) * 10000) / 10000;
    return `${lo}|${la}`;
  }
  return String(loc.name || '');
};

const variantIndexFromKey = (key, mod = 3) => {
  if (!key) return 0;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
};

const STAR_VARIANTS = [
  styles.starsA,
  styles.starsB,
  styles.starsC,
  styles.starsD,
  styles.starsE,
  styles.starsF,
];

const DEFAULT_LABEL = 'Add to list?';

const ForecastLocationRow = ({
  weatherData,
  dayColumns,
  reorder,
  showListDropdown = true,
  lists = [],
  listsLoading = false,
  listsError = '',
}) => {
  const navigate = useNavigate();

  // dropdown state
  const [listChoice, setListChoice] = useState('');
  const [selectLabel, setSelectLabel] = useState(DEFAULT_LABEL);
  const [savingToList, setSavingToList] = useState(false);

  const byDate = useMemo(() => {
    const map = {};
    for (const p of weatherData.forecast || []) {
      const dk = dateKeyFromStartTime(p.startTime);
      if (!dk) continue;
      if (!map[dk]) map[dk] = { day: null, night: null };
      if (p.isDaytime) map[dk].day = p;
      else map[dk].night = p;
    }
    return map;
  }, [weatherData.forecast]);

  const resetLabelIfNeeded = () => {
    if (selectLabel !== DEFAULT_LABEL) setSelectLabel(DEFAULT_LABEL);
  };

  const handleListChange = async (e) => {
    const value = e.target.value;
    setListChoice(''); // keep it on the placeholder

    if (value === 'new') {
      navigate('/lists/new', { state: { initialLocation: weatherData } });
      return;
    }

    if (!value) return;

    try {
      setSavingToList(true);

      const picked = lists.find((l) => l._id === value);
      const listName = picked?.name ?? 'list';

      await listService.addLocationToList(value, {
        name: weatherData.name,
        longitude: Number(weatherData.lon),
        latitude: Number(weatherData.lat),
        description: '',
      });

      setSelectLabel(`Added to ${listName} ✓`);
    } catch (err) {
      setSelectLabel(err?.message || 'Could not add');
    } finally {
      setSavingToList(false);
    }
  };

  const renderHalf = (period, isNight) => {
    if (!period) return <div className={`${styles.half} ${styles.empty}`}>—</div>;

    const nightStarsClass = isNight
      ? STAR_VARIANTS[variantIndexFromKey(period.startTime, STAR_VARIANTS.length)]
      : '';

    return (
      <div className={[styles.half, isNight ? styles.night : styles.day, nightStarsClass].join(' ')}>
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

        {reorder?.enabled && (
          <div className={styles.reorderControls}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                reorder.onMove(reorder.index, reorder.index - 1);
              }}
              disabled={reorder.index === 0}
              aria-label="Move up"
            >
              ↑
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                reorder.onMove(reorder.index, reorder.index + 1);
              }}
              disabled={reorder.index === reorder.total - 1}
              aria-label="Move down"
            >
              ↓
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                reorder.onRemove(reorder.index);
              }}
              aria-label="Remove"
            >
              ✕
            </button>
          </div>
        )}

        {showListDropdown && (
          <select
            id="listId"
            name="listId"
            value={listChoice}
            onChange={handleListChange}
            onPointerDown={resetLabelIfNeeded}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') resetLabelIfNeeded();
            }}
            disabled={savingToList || listsLoading || !!listsError}
          >
            <option value="" disabled>
              {savingToList
                ? 'Adding…'
                : listsLoading
                ? 'Loading lists…'
                : listsError
                ? 'Lists unavailable'
                : selectLabel}
            </option>

            {lists.map((list) => (
              <option key={list._id} value={list._id}>
                {list.name}
              </option>
            ))}

            <option value="new">+ New list…</option>
          </select>
        )}
      </div>

      {dayColumns.map(({ dateKey }) => {
        const pair = byDate[dateKey] || { day: null, night: null };

        return (
          <div key={`${locationKey(weatherData)}-${dateKey}`} className={styles.cell}>
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
