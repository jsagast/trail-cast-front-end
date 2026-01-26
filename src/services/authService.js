import { request } from './apiClient.js';

const BASE_PATH = '/auth';

const payloadFromToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1])).payload;
  } catch {
    return null;
  }
};

export const signUp = async (formData) => {
  const data = await request(`${BASE_PATH}/sign-up`, {
    method: 'POST',
    body: formData,
    withAuth: false,
  });

  if (!data?.token) throw new Error(data?.err || 'Invalid response from server');
  localStorage.setItem('token', data.token);
  const payload = payloadFromToken(data.token);
  if (!payload) throw new Error('Invalid token');
  return payload;
};

export const signIn = async (formData) => {
  const data = await request(`${BASE_PATH}/sign-in`, {
    method: 'POST',
    body: formData,
    withAuth: false,
  });

  if (!data?.token) throw new Error(data?.err || 'Invalid response from server');
  localStorage.setItem('token', data.token);
  const payload = payloadFromToken(data.token);
  if (!payload) throw new Error('Invalid token');
  return payload;
};

export default { signUp, signIn };
