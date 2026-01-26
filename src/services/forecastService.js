const BASE_URL = `${import.meta.env.VITE_BACK_END_SERVER_URL}/locations/`;

const searchLocations = async (query) => {
  const q = encodeURIComponent((query ?? '').toString());
  const res = await fetch(`${BASE_URL}places?search=${q}`);
  const data = await res.json();
  return data;
};

const getWeather = async (longitude, latitude) => {
  const res = await fetch(`${BASE_URL}weather?lon=${encodeURIComponent(longitude)}&lat=${encodeURIComponent(latitude)}`);
  const data = await res.json();
  return data.location.forecast;
};

const getWeatherBatch = async (locations) => {
  const payload = {
    locations: (locations || []).map((l) => ({
      name: l?.name,
      lat: l?.latitude ?? l?.lat,
      lon: l?.longitude ?? l?.lon,
    })),
  };

  const res = await fetch(`${BASE_URL}weather/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return res.json();
};

// Back-compat helper (some code calls this)
const getWeatherData = async ({ name, longitude, latitude }) => {
  const forecast = await getWeather(longitude, latitude);
  return {
    name: name?.replace?.(', United States of America', '') ?? name ?? 'Selected Location',
    forecast,
    lon: longitude,
    lat: latitude,
  };
};

export {
  searchLocations,
  getWeather,
  getWeatherBatch,
  getWeatherData
};
