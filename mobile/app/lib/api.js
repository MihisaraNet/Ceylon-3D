// Axios instance with JWT interceptor
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      await AsyncStorage.multiRemove(['token', 'authUser']);
    }
    return Promise.reject(err);
  }
);

export default api;
