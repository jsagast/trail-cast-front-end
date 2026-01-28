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
  titleColor,
}) => {
  const navigate = useNavigate();

  const [listChoice, setListChoice] = useState('');
  const [selectLabel, setSelectLabel] = useState(DEFAULT_LABEL);
  const [savingToList, setSavingToList] = useState(false);

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

      setSelectLabel('Added!');
    } catch (err) {
      setSelectLabel('Failed to add');
    } finally {
      setSavingToList(false);
    }
  };

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

  const renderHalf = (p, isNight) => {
    if (!p) {
      return <div className={`${styles.half} ${styles.empty}`}>—</div>;
    }

    const base = isNight ? styles.night : styles.day;
    const starsClass = isNight ? STAR_VARIANTS[variantIndexFromKey(p.startTime, STAR_VARIANTS.length)] : '';

    return (
      <div className={`${styles.half} ${base} ${starsClass}`}>
        {p.icon && <img className={styles.icon} src={p.icon} alt={p.shortForecast || 'forecast icon'} />}
        <div className={styles.condition}>{p.shortForecast}</div>
        <div className={styles.temp}>
          {p.temperature}°{p.temperatureUnit}
        </div>
        <div className={styles.meta}>
          <span>{p.windSpeed}</span>
          <span>{p.windDirection}</span>
        </div>
      </div>
    );
  };

  useLayoutEffect(() => {
    if (!selectRef.current || !measureRef.current) return;

    const ARROW_PAD_PX = 44;
    const textW = measureRef.current.getBoundingClientRect().width;
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
          style={titleColor ? { '--hoverColor': titleColor } : undefined}
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
              ▲
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
              ▼
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

              <option value="new">+ Create new list</option>
            </select>

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
