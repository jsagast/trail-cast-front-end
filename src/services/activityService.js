// const BASE_URL = `${import.meta.env.VITE_BACK_END_SERVER_URL}/locations/`;

// const createActivity = async (locationId, activityFormData) => {
//   try {
//     const res = await fetch(`${BASE_URL}/${locationId}/activities`, {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem('token')}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(activityFormData),
//     });
//     return res.json();
//   } catch (error) {
//     console.log(error);
//   }
// };

// const updateActivity = async (locationId, activityId, logFormData)=> {
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

// const deleteActivity = async (locationId, activityId) => {
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



import { request } from './apiClient.js';

const BASE_PATH = '/locations';

export const createActivity = async (locationId, logFormData) => {
  return await request(`${BASE_PATH}/${locationId}/activities`, {
    method: 'POST',
    body: logFormData,
  });
};

export const updateActivity = async (locationId, activityId, logFormData) => {
  return await request(`${BASE_PATH}/${locationId}/activities/${activityId}`, {
    method: 'PUT',
    body: logFormData,
  });
};

export const deleteActivity = async (locationId, activityId) => {
  return await request(`${BASE_PATH}/${locationId}/activities/${activityId}`, {
    method: 'DELETE',
  });
};

export default {
  createActivity,
  updateActivity,
  deleteActivity,
};

// export {
//   createActivity,
//   updateActivity,
//   deleteActivity,
// };
