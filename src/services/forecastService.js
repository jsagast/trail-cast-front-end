const BASE_URL = `${import.meta.env.VITE_BACK_END_SERVER_URL}/locations/`;

const searchLocations = async (location) => {
    try {
        const res = await fetch(`${BASE_URL}places?search=${location}`)
        const data = await res.json();
        console.log(res)
        console.log(data)
        return data
    } catch (err) {
        console.log('Error fetching locations:', err.message)
    }
};

const getWeather = async (longitude, latitude) => {
    try {
        const res = await fetch(`${BASE_URL}weather?lon=${longitude}&lat=${latitude}`)
        const data = await res.json();
        console.log(res)
        console.log(data)
        return data.location.forecast
    } catch (err) {
        console.log('Error fetching locations:', err.message)
    }
};

const createLocation = async (locationData) => {
  try {
    const res = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(locationData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create location');
    }

    return await res.json(); 
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getLocationByCoords = async (lat, lon) => {
  try {
    const res = await fetch(`${BASE_URL}by-coords?lat=${lat}&lon=${lon}`)
    const location = await res.json();
    return location
  } catch (err) {
    console.error('Error fetching location by coords:', err);
    return null;
  }
};

export {
    searchLocations,
    getWeather,
    createLocation,
    getLocationByCoords,
}