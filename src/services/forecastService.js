const BASE_URL = `${import.meta.env.VITE_BACK_END_SERVER_URL}/locations/`;

const assertOkJson = async (res) => {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${body ? ` - ${body.slice(0, 120)}` : ''}`);
  }
  return res.json();
};

const searchLocations = async (query) => {
  const q = encodeURIComponent((query ?? '').toString());
  const res = await fetch(`${BASE_URL}places?search=${q}`);
  return assertOkJson(res);
};

const getWeather = async (longitude, latitude) => {
  const res = await fetch(
    `${BASE_URL}weather?lon=${encodeURIComponent(longitude)}&lat=${encodeURIComponent(latitude)}`
  );
  const data = await assertOkJson(res);
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
  const data = await assertOkJson(res);
  return data.results ?? data; // ✅ normalize return shape
}

// Back-compat helper (some code calls this)
const getWeatherData = async (location) => {
  const name = location?.name;
  const longitude = location?.longitude ?? location?.lon;
  const latitude = location?.latitude ?? location?.lat;

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
