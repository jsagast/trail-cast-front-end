import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import styles from './Forecast.module.css';
import ForecastLocationRow from '../ForecastLocationRow/ForecastLocationRow.jsx';
import { ListsContext } from '../../contexts/ListsContext.jsx';

const MAX_WINDOW_DAYS = 5;

const readCssPx = (el, varName, fallback) => {
  const v = getComputedStyle(el).getPropertyValue(varName).trim();
  const n = parseFloat(v.replace('px', ''));
  return Number.isFinite(n) ? n : fallback;
};

const dateKeyFromStartTime = (startTime) => startTime?.slice(0, 10); // "YYYY-MM-DD"

const weekdayLabel = (dateKey) => {
  // Use midday to avoid timezone edge weirdness
  const d = new Date(`${dateKey}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short' });
};

const buildDayColumns = (forecast) => {
  const order = [];
  const seen = new Set();

  for (const p of forecast || []) {
    const dk = dateKeyFromStartTime(p.startTime);
    if (!dk || seen.has(dk)) continue;
    seen.add(dk);
    order.push(dk);
  }

  // Keep up to 7 days available from NWS, but we will DISPLAY a window.
  return order.slice(0, 7).map((dk) => ({ dateKey: dk, label: weekdayLabel(dk) }));
};

// Stable identifier for a location. Names are not unique/stable.
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

// Context bridge so Forecast DOES NOT subscribe unless dropdown is shown.
const ListsBridge = ({ children }) => {
  const { lists, listsLoading, listsError } = useContext(ListsContext);
  return children({ lists, listsLoading, listsError });
};

const Forecast = ({
  weatherData,
  mode = 'newestTop',
  limit = 5,
  initialTopName = null,

  // controlled mode (CreateList/Landing/ShowList)
  locations: controlledLocations,
  setLocations: setControlledLocations,

  reorderable = false,
  showListDropdown = true,
}) => {
  const [internalLocations, setInternalLocations] = useState([]);
  const locations = controlledLocations ?? internalLocations;
  const setLocations = setControlledLocations ?? setInternalLocations;

  // 7-day columns (available)
  const dayColumns = useMemo(() => {
    if (!locations.length) return [];
    return buildDayColumns(locations[0]?.forecast);
  }, [locations]);

  // window offset (0..maxOffset)
  const [dayOffset, setDayOffset] = useState(0);

  // how many day columns are visible right now (<= 5)
  const [visibleDays, setVisibleDays] = useState(MAX_WINDOW_DAYS);

  const windowDays = Math.max(1, Math.min(visibleDays, dayColumns.length));
  const maxOffset = Math.max(0, dayColumns.length - windowDays);

  // signature to detect column-set changes (new location / new forecast)
  const daySig = useMemo(() => dayColumns.map((c) => c.dateKey).join('|'), [dayColumns]);

  // scroll container ref (we animate by scrollTo)
  const tableRef = useRef(null);

  // Recompute visible day columns when the table resizes (window changes)
  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;

    const recompute = () => {
      const dayPx = readCssPx(el, '--day-col-w', 240);
      const leftPx = readCssPx(el, '--left-col-w', 180);

      const fit = Math.floor((el.clientWidth - leftPx) / dayPx);
      const days = Math.max(1, Math.min(MAX_WINDOW_DAYS, fit || 1));

      setVisibleDays(days);
    };

    recompute();

    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(recompute);
      ro.observe(el);
    } else {
      window.addEventListener('resize', recompute);
    }

    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', recompute);
    };
  }, [dayColumns.length]);

  // Reset window when the underlying days change (and start at the beginning)
  useEffect(() => {
    setDayOffset(0);
    const el = tableRef.current;
    if (el) el.scrollTo({ left: 0, behavior: 'auto' });
  }, [daySig]);

  // Clamp offset if the window gets smaller/larger
  useEffect(() => {
    setDayOffset((v) => Math.min(v, maxOffset));
  }, [maxOffset]);

  // Animate the slide: arrow clicks drive dayOffset; we scroll smoothly to that offset
  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;

    const dayPx = readCssPx(el, '--day-col-w', 240);
    const clamped = Math.max(0, Math.min(maxOffset, dayOffset));

    if (clamped !== dayOffset) setDayOffset(clamped);

    el.scrollTo({ left: clamped * dayPx, behavior: 'smooth' });
  }, [dayOffset, maxOffset]);

  // Uncontrolled mode: merge incoming weatherData into the list
  useEffect(() => {
    if (!weatherData?.name) return;

    const incomingKey = locationKey(weatherData);

    setLocations((prev) => {
      const withoutThis = prev.filter((l) => locationKey(l) !== incomingKey);

      // keep initial location at top if requested (only for init loads)
      if (mode === 'newestTop' && initialTopName && weatherData.source === 'init') {
        if (weatherData.name === initialTopName) return [weatherData, ...withoutThis].slice(0, limit);
        if (withoutThis[0]?.name === initialTopName) {
          return [withoutThis[0], weatherData, ...withoutThis.slice(1)].slice(0, limit);
        }
      }

      // legacy "pinFirst" mode
      if (mode === 'pinFirst' && withoutThis.length) {
        const pinned = withoutThis[0];
        if (weatherData.name === pinned.name) return [weatherData, ...withoutThis.slice(1)].slice(0, limit);
        return [pinned, weatherData, ...withoutThis.slice(1)].slice(0, limit);
      }

      return [weatherData, ...withoutThis].slice(0, limit);
    });
  }, [weatherData, mode, limit, initialTopName, setLocations]);

  const moveLocation = (fromIdx, toIdx) => {
    setLocations((prev) => {
      if (toIdx < 0 || toIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      return copy;
    });
  };

  const removeLocation = (idx) => {
    setLocations((prev) => prev.filter((_, i) => i !== idx));
  };

  if (!locations.length || !dayColumns.length) return <main>Forecast Loading</main>;

  const gridStyle = {
    gridTemplateColumns: `var(--left-col-w) repeat(${dayColumns.length}, var(--day-col-w))`,
    gridTemplateRows: `var(--header-h) repeat(${locations.length}, var(--cell-h))`,
  };

  const prevDisabled = dayOffset === 0;
  const nextDisabled = dayOffset === maxOffset;

  const renderRows = ({ lists = [], listsLoading = false, listsError = '' } = {}) =>
    locations.map((loc, idx) => (
      <ForecastLocationRow
        key={locationKey(loc) || loc.name}
        weatherData={loc}
        dayColumns={dayColumns}
        reorder={
          reorderable
            ? {
                enabled: true,
                index: idx,
                total: locations.length,
                onMove: moveLocation,
                onRemove: removeLocation,
              }
            : null
        }
        showListDropdown={showListDropdown}
        lists={lists}
        listsLoading={listsLoading}
        listsError={listsError}
      />
    ));

  return (
    <main className={styles.wrap}>
      <div ref={tableRef} className={styles.table} style={gridStyle}>
        <div className={styles.corner}>
          <div className={styles.cornerInner}>
            <div className={styles.cornerTitle}>Weather</div>

            <div className={styles.dayNav}>
              <button
                type="button"
                onClick={() => setDayOffset((v) => Math.max(0, v - 1))}
                disabled={prevDisabled}
                aria-label="Previous day"
              >
                ←
              </button>

              <button
                type="button"
                onClick={() => setDayOffset((v) => Math.min(maxOffset, v + 1))}
                disabled={nextDisabled}
                aria-label="Next day"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {dayColumns.map((c) => (
          <div key={c.dateKey} className={styles.dayHeader}>
            {c.label}
          </div>
        ))}

        {showListDropdown ? (
          <ListsBridge>{(lp) => <>{renderRows(lp)}</>}</ListsBridge>
        ) : (
          <>{renderRows()}</>
        )}
      </div>
    </main>
  );
};

export default Forecast;