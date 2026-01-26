import { useContext, useEffect, useMemo, useState } from 'react';
import styles from './Forecast.module.css';
import ForecastLocationRow from '../ForecastLocationRow/ForecastLocationRow.jsx';
import { ListsContext } from '../../contexts/ListsContext.jsx';

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

const Forecast = ({
  weatherData,
  mode = 'newestTop',
  limit = 5,
  initialTopName = null,

  // controlled mode (CreateList)
  locations: controlledLocations,
  setLocations: setControlledLocations,

  reorderable = false,

  showListDropdown = true,
}) => {
  const { lists, listsLoading, listsError } = useContext(ListsContext)

  const [internalLocations, setInternalLocations] = useState([]);
  const locations = controlledLocations ?? internalLocations;
  const setLocations = setControlledLocations ?? setInternalLocations;

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
            key={locationKey(loc) || loc.name}
            weatherData={loc}
            dayColumns={dayColumns}
            reorder={
              reorderable
                ? { enabled: true, index: idx, total: locations.length, onMove: moveLocation, onRemove: removeLocation }
                : null
            }
            showListDropdown={showListDropdown}
            lists={lists}
            listsLoading={listsLoading}
            listsError={listsError}
          />
        ))}
      </div>
    </main>
  );
};

export default Forecast;
