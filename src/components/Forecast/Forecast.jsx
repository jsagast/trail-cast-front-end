import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import styles from './Forecast.module.css';
import ForecastLocationRow from '../ForecastLocationRow/ForecastLocationRow.jsx';
import { ListsContext } from '../../contexts/ListsContext.jsx';

const MAX_WINDOW_DAYS = 5;

// --- Trail Cast brand gradient helpers (from NavBar.module.css) ---
const lerp = (a, b, t) => a + (b - a) * t;

const hexToRgb = (hex) => {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

const lerpHex = (aHex, bHex, t) => {
  const a = hexToRgb(aHex);
  const b = hexToRgb(bHex);
  return rgbToHex({
    r: lerp(a.r, b.r, t),
    g: lerp(a.g, b.g, t),
    b: lerp(a.b, b.b, t),
  });
};

// Exact Trail→Cast spectrum from NavBar.module.css:
// Trail: #fb5f04 → #f0ce1a
// Cast:  #5fd6e3 → #1692df
const TRAIL_CAST_STOPS = ['#fb5f04', '#f0ce1a', '#5fd6e3', '#1692df'];

const sampleGradient = (stops, t) => {
  if (!stops?.length) return '#ffffff';
  if (stops.length === 1) return stops[0];

  const clamped = Math.max(0, Math.min(1, t));
  const n = stops.length - 1;
  const scaled = clamped * n;
  const i = Math.floor(scaled);
  const localT = scaled - i;

  const a = stops[i];
  const b = stops[Math.min(i + 1, n)];
  return lerpHex(a, b, localT);
};

const readCssPx = (el, varName, fallback) => {
  const v = getComputedStyle(el).getPropertyValue(varName).trim();
  const n = parseFloat(v.replace('px', ''));
  return Number.isFinite(n) ? n : fallback;
};

const dateKeyFromStartTime = (startTime) => startTime?.slice(0, 10); // "YYYY-MM-DD"

const weekdayLabel = (dateKey) => {
  // Use midday to avoid timezone edge weirdness
  const d = new Date(`${dateKey}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'long' });
};

const buildDayColumns = (forecast) => {
  // returns [{ dateKey, label }]
  const order = [];
  const seen = new Set();

  for (const p of forecast || []) {
    const dk = dateKeyFromStartTime(p.startTime);
    if (!dk || seen.has(dk)) continue;
    seen.add(dk);
    order.push(dk);
  }

  // Keep up to 7 days available, but we display a window.
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

  const dayColumns = useMemo(() => {
    if (!locations.length) return [];
    return buildDayColumns(locations[0]?.forecast);
  }, [locations]);

  const [dayOffset, setDayOffset] = useState(0);
  const [visibleDays, setVisibleDays] = useState(MAX_WINDOW_DAYS);

  const windowDays = Math.max(1, Math.min(visibleDays, dayColumns.length));
  const maxOffset = Math.max(0, dayColumns.length - windowDays);

  const daySig = useMemo(() => dayColumns.map((c) => c.dateKey).join('|'), [dayColumns]);

  const tableRef = useRef(null);

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

  useEffect(() => {
    setDayOffset(0);
    const el = tableRef.current;
    if (el) el.scrollTo({ left: 0, behavior: 'auto' });
  }, [daySig]);

  useEffect(() => {
    setDayOffset((v) => Math.min(v, maxOffset));
  }, [maxOffset]);

  useEffect(() => {
    const el = tableRef.current;
    if (!el) return;

    const dayPx = readCssPx(el, '--day-col-w', 240);
    const clamped = Math.max(0, Math.min(maxOffset, dayOffset));

    if (clamped !== dayOffset) setDayOffset(clamped);

    el.scrollTo({ left: clamped * dayPx, behavior: 'smooth' });
  }, [dayOffset, maxOffset]);

  useEffect(() => {
    if (!weatherData?.name) return;

    const incomingKey = locationKey(weatherData);

    setLocations((prev) => {
      const withoutThis = prev.filter((l) => locationKey(l) !== incomingKey);

      if (mode === 'newestTop' && initialTopName && weatherData.source === 'init') {
        if (weatherData.name === initialTopName) return [weatherData, ...withoutThis].slice(0, limit);
        if (withoutThis[0]?.name === initialTopName) {
          return [withoutThis[0], weatherData, ...withoutThis.slice(1)].slice(0, limit);
        }
      }

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
    locations.map((loc, idx) => {
      // collective row spectrum (top row → bottom row)
      const tRow = locations.length <= 1 ? 0 : idx / (locations.length - 1);
      const titleColor = sampleGradient(TRAIL_CAST_STOPS, tRow);

      return (
        <ForecastLocationRow
          key={locationKey(loc) || loc.name}
          weatherData={loc}
          dayColumns={dayColumns}
          titleColor={titleColor}
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
      );
    });

  return (
    <main className={styles.main}>
      <div ref={tableRef} className={styles.table} style={gridStyle}>
        <div className={styles.corner}>
          <div className={styles.cornerInner}>
            <div className={styles.dayNav}>
              <button
                type="button"
                onClick={() => setDayOffset((v) => Math.max(0, v - 1))}
                disabled={prevDisabled}
                aria-label="Previous day"
              >
                ◀
              </button>

              <button
                type="button"
                onClick={() => setDayOffset((v) => Math.min(maxOffset, v + 1))}
                disabled={nextDisabled}
                aria-label="Next day"
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        {dayColumns.map((c, i) => {
          // collective day spectrum across all available days
          const t = dayColumns.length <= 1 ? 0 : i / (dayColumns.length - 1);
          const color = sampleGradient(TRAIL_CAST_STOPS, t);

          return (
            <div key={c.dateKey} className={styles.dayHeader} style={{ color }}>
              {c.label}
            </div>
          );
        })}

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
