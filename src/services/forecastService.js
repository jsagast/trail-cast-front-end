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
        const res = await fetch(`${BASE_URL}place/weather?lon=${longitude}&lat=${latitude}`)
        const data = await res.json();
        console.log(res)
        console.log(data)
        return data.location.forecast
    } catch (err) {
        console.log('Error fetching locations:', err.message)
    }
};

//Comment
const createComment = async (locationId, commentFormData) => {
  try {
    const res = await fetch(`${BASE_URL}/${locationId}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentFormData),
    });
    return res.json();
  } catch (error) {
    console.log(error);
  }
};


const updateComment = async (locationId, commentId, commentFormData)=> {
  try {
    const res = await fetch(`${BASE_URL}/${locationId}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentFormData),
    });
    return res.json();
  } catch (error) {
    console.log(error);
  }
}

const deleteComment = async (locationId, commentId) => {
  try {
    const res = await fetch(`${BASE_URL}/${locationId}/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return res.json();
  } catch (error) {
    console.log(error);
  }
};

//LOG
const createActivity = async (locationId, commentFormData) => {
  try {
    const res = await fetch(`${BASE_URL}/${locationId}/logs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentFormData),
    });
    return res.json();
  } catch (error) {
    console.log(error);
  }
};

const updateActivity = async (locationId, logId, logFormData)=> {
  try {
    const res = await fetch(`${BASE_URL}/${locationId}/comments/${logId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logFormData),
    });
    return res.json();
  } catch (error) {
    console.log(error);
  }
};

const deleteActivity = async (locationId, logId) => {
  try {
    const res = await fetch(`${BASE_URL}/${locationId}/comments/${logId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return res.json();
  } catch (error) {
    console.log(error);
  }
};

export {
    searchLocations,
    getWeather,
    createComment,
    updateComment,
    deleteComment,
    createActivity,
    updateActivity,
    deleteActivity
}