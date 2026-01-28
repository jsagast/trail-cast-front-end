import { request } from './apiClient.js';

const BASE_PATH = '/users';

export const index = async () => {
  return await request(BASE_PATH);
};

export default { index };
