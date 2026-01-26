// src/components/Forecast/Forecast.jsx
import { useEffect, useMemo, useState } from 'react';
import styles from './Forecast.module.css';
import ForecastLocationRow from '../ForecastLocationRow/ForecastLocationRow.jsx';

const dateKeyFromStartTime = (startTime) => startTime?.slice(0, 10);

const weekdayLabel = (dateKey) => {
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

  return order.slice(0, 7).map((dk) => ({ dateKey: dk, label: weekdayLabel(dk) }));
};

const Forecast = ({
  weatherData,
  mode = 'newestTop',
  limit = 5,
  initialTopName = null,

  // controlled mode (CreateList)
  locations: controlledLocations,
  setLocations: setControlledLocations,

  // NEW
  reorderable = false,
}) => {
  const [internalLocations, setInternalLocations] = useState([]);
  const locations = controlledLocations ?? internalLocations;
  const setLocations = setControlledLocations ?? setInternalLocations;

  useEffect(() => {
    if (!weatherData?.name) return;

    setLocations((prev) => {
      const withoutThis = prev.filter((l) => l.name !== weatherData.name);

      if (mode === 'newestTop' && initialTopName && weatherData.source === 'init') {
        if (weatherData.name === initialTopName) {
          return [weatherData, ...withoutThis].slice(0, limit);
        }
        if (withoutThis[0]?.name === initialTopName) {
          return [withoutThis[0], weatherData, ...withoutThis.slice(1)].slice(0, limit);
        }
      }

      if (mode === 'pinFirst' && withoutThis.length) {
        const pinned = withoutThis[0];
        if (weatherData.name === pinned.name) {
          return [weatherData, ...withoutThis.slice(1)].slice(0, limit);
        }
        return [pinned, weatherData, ...withoutThis.slice(1)].slice(0, limit);
      }

      return [weatherData, ...withoutThis].slice(0, limit);
    });
  }, [weatherData, mode, limit, initialTopName, setLocations]);

  // reorder helpers (only used when reorderable = true)
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

  const dayColumns = useMemo(() => {
    if (!locations.length) return [];
    return buildDayColumns(locations[0].forecast);
  }, [locations]);

  if (!locations.length || !dayColumns.length) return <main>Forecast Loading</main>;

  const gridStyle = {
    gridTemplateColumns: `var(--left-col-w) repeat(${dayColumns.length}, var(--day-col-w))`,
    gridTemplateRows: `var(--header-h) repeat(${locations.length}, var(--cell-h))`,
  };

  return (
    <main>
      <div className={styles.table} style={gridStyle}>
        <div className={styles.corner}>Weather for:</div>

        {dayColumns.map((c) => (
          <div key={c.dateKey} className={styles.dayHeader}>
            {c.label}
          </div>
        ))}

        {locations.map((loc, idx) => (
          <ForecastLocationRow
            key={loc.name}
            weatherData={loc}
            dayColumns={dayColumns}
            reorder={
              reorderable
                ? { enabled: true, index: idx, total: locations.length, onMove: moveLocation, onRemove: removeLocation }
                : null
            }
          />
        ))}
      </div>
    </main>
  );
};

export default Forecast;

