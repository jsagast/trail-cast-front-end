// src/components/ForecastLocationRow/ForecastLocationRow.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import styles from './ForecastLocationRow.module.css';
import * as listService from '../../services/listService.js';

const dateKeyFromStartTime = (startTime) => startTime?.slice(0, 10);

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

// Helps stabilize "same place" comparisons (and prevents float weirdness)
const normalizeCoord = (n, decimals = 6) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return NaN;
  return Number(num.toFixed(decimals));
};

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

  // drag/drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const canDrag = !!reorder?.enabled;

  const selectRef = useRef(null);
  const measureRef = useRef(null);
  const dragDepth = useRef(0);


  const displayLabel =
    savingToList ? 'Adding…'
    : listsLoading ? 'Loading lists…'
    : listsError ? 'Lists unavailable'
    : selectLabel;

  // map forecast periods to { [dateKey]: { day, night } }
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

    // always snap back to placeholder after a choice
    setListChoice('');

    if (value === 'new') {
      navigate('/lists/new', { state: { initialLocation: weatherData } });
      return;
    }

    if (!value) return;

    try {
      setSavingToList(true);

      await listService.addLocationToList(value, {
        name: weatherData.name,
        longitude: normalizeCoord(weatherData.lon),
        latitude: normalizeCoord(weatherData.lat),
        description: '',
      });

      setSelectLabel('✅ Added');
    } catch (err) {
      const rawMsg = String(err?.message || '');
      const normalized = rawMsg.toLowerCase();

      // Custom duplicate messaging (both duplicate-by-list and duplicate-by-coordinates)
      const isDuplicate =
        normalized.includes('already in this list') ||
        (normalized.includes('coordinates') && normalized.includes('already')) ||
        (normalized.includes('already') && normalized.includes('list'));

      if (isDuplicate) {
        setSelectLabel('❌ Already in list');
      } else {
        setSelectLabel('❌ Could not add');
      }
    } finally {
      setSavingToList(false);
    }
  };

  // ---- Drag and drop handlers ----
  const handleDragStart = (e) => {
    if (!canDrag) return;
    setDragActive(true);
    // store the source index in the drag payload
    e.dataTransfer.setData('text/plain', String(reorder.index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDragActive(false);
    setIsDragOver(false);
    dragDepth.current = 0;
  };

  const handleDragOver = (e) => {
    if (!canDrag) return;
    e.preventDefault(); // REQUIRED to allow drop
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = () => {
    if (!canDrag) return;
    dragDepth.current += 1;
    if (dragDepth.current === 1) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    if (!canDrag) return;
    dragDepth.current -= 1;

    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    if (!canDrag) return;

    e.preventDefault();
    setIsDragOver(false);
    setDragActive(false);
    dragDepth.current = 0;

    const from = Number(e.dataTransfer.getData('text/plain'));
    const to = reorder.index;

    if (!Number.isFinite(from) || from === to) return;

    reorder.onMove(from, to);
  };
  // -------------------------------

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

  // shrink-wrap select width to current label text
  useLayoutEffect(() => {
    if (!selectRef.current || !measureRef.current) return;

    const ARROW_PAD_PX = 44; // native arrow + padding
    const textW = measureRef.current.offsetWidth;

    selectRef.current.style.width = `${textW + ARROW_PAD_PX}px`;
  }, [displayLabel]);

  return (
    <>
      <div
        className={[
          styles.locationCell,
          dragActive ? styles.dragActive : '',
          isDragOver ? styles.dragOver : '',
        ].join(' ')}
        onDragOver={handleDragOver}
        onDragOverCapture={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {reorder?.enabled && (
          <div
            className={styles.dragHandle}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            aria-label="Drag to reorder"
            title="Drag to reorder"
          >
            ⋮⋮
          </div>
        )}

        <Link
          className={styles.locationLink}
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
          <>
            <select
              ref={selectRef}
              className={styles.listSelect}
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
                {displayLabel}
              </option>

              {lists.map((list) => (
                <option key={list._id} value={list._id}>
                  {list.name}
                </option>
              ))}

              <option value="new">+ New list…</option>
            </select>

            {/* Hidden measurer for width */}
            <span ref={measureRef} className={styles.selectMeasure} aria-hidden="true">
              {displayLabel}
            </span>
          </>
        )}
      </div>

      {dayColumns.map(({ dateKey }) => {
        const day = byDate[dateKey]?.day ?? null;
        const night = byDate[dateKey]?.night ?? null;

        return (
          <div key={dateKey} className={styles.cell}>
            <div className={styles.cellInner}>
              {renderHalf(day, false)}
              {renderHalf(night, true)}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default ForecastLocationRow;
