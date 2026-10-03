import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://newtonite.onrender.com/api',
});

api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  return config;
});
