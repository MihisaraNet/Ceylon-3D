/**
 * api.js — Axios HTTP Client Instance with JWT Authentication
 *
 * Pre-configured Axios instance for all API requests to the LayerForge 3D backend.
 *
 * Features:
 *   - Base URL set from config.js (points to the backend server)
 *   - 15-second request timeout
 *   - Request interceptor: Automatically attaches the JWT token from AsyncStorage
 *     to every request's Authorization header as a Bearer token
 *   - Response interceptor: On 401/403 responses (expired/invalid token),
 *     automatically clears stored auth data to force re-login
 *
 * Usage:
 *   import api from '../lib/api';
 *   const { data } = await api.get('/api/products');
 *   await api.post('/auth/login', { email, password });
 *
 * @module lib/api
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 60000 });

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
