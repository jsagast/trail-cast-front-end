const BASE_URL = `${import.meta.env.VITE_BACK_END_SERVER_URL}/locations`;

const createActivity = async (locationId, activityFormData) => {
  try {
    const res = await fetch(`${BASE_URL}/${locationId}/activities`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activityFormData),
    });
    return res.json();
  } catch (error) {
    console.log(error);
  }
};

// const updateActivity = async (locationId, logId, logFormData)=> {
//   try {
//     const res = await fetch(`${BASE_URL}/${locationId}/activities/${activityId}`, {
//       method: 'PUT',
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem('token')}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(logFormData),
//     });
//     return res.json();
//   } catch (error) {
//     console.log(error);
//   }
// };

// const deleteActivity = async (locationId, logId) => {
//   try {
//     const res = await fetch(`${BASE_URL}/${locationId}/activities/${activityId}`, {
//       method: 'DELETE',
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem('token')}`,
//       },
//     });
//     return res.json();
//   } catch (error) {
//     console.log(error);
//   }
// };

export {
    createActivity,
    // updateActivity,
    // deleteActivity
}