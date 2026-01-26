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

export {
    searchLocations,
    getWeather,
}