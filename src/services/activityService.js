import { request } from './apiClient.js';

const BASE_PATH = '/locations';

export const createActivity = async (locationId, logFormData) => {
  return await request(`${BASE_PATH}/${locationId}/logs`, {
    method: 'POST',
    body: logFormData,
  });
};

export const updateActivity = async (locationId, logId, logFormData) => {
  return await request(`${BASE_PATH}/${locationId}/logs/${logId}`, {
    method: 'PUT',
    body: logFormData,
  });
};

export const deleteActivity = async (locationId, logId) => {
  return await request(`${BASE_PATH}/${locationId}/logs/${logId}`, {
    method: 'DELETE',
  });
};

export default {
  createActivity,
  updateActivity,
  deleteActivity,
};
