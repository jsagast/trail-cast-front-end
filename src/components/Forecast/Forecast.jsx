import { useEffect, useMemo, useState } from 'react';
import styles from './Forecast.module.css';
import ForecastLocationRow from '../ForecastLocationRow/ForecastLocationRow.jsx';

const dateKeyFromStartTime = (startTime) => startTime?.slice(0, 10); // "YYYY-MM-DD"

const weekdayLabel = (dateKey) => {
  // Use midday to avoid timezone edge weirdness
  const d = new Date(`${dateKey}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short' });
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

  // keep same number of “days” you expect (ex: 7)
  const days = order.slice(0, 7);
  return days.map((dk) => ({ dateKey: dk, label: weekdayLabel(dk) }));
};

const Forecast = ({ weatherData }) => {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (!weatherData?.name) return;

    setLocations((prev) => {
      const withoutThis = prev.filter((l) => l.name !== weatherData.name);
      return [...withoutThis, weatherData];
    });
  }, [weatherData]);

  const dayColumns = useMemo(() => {
    if (!locations.length) return [];
    return buildDayColumns(locations[0].forecast);
  }, [locations]);

  if (!locations.length || !dayColumns.length) return <main>Forecast Loading</main>;

  // 1 label col + N day cols
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

        {locations.map((loc) => (
          <ForecastLocationRow key={loc.name} weatherData={loc} dayColumns={dayColumns} />
        ))}
      </div>
    </main>
  );
};

export default Forecast;
