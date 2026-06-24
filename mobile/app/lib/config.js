/**
 * config.js — API Configuration & Utility Functions
 *
 * Central configuration file for connecting the mobile app to the backend server.
 *
 * Constants:
 *   - API_BASE_URL — Full URL of the backend server (IP + port).
 *                    Change the IP address when testing on a physical device
 *                    (use your machine's local network IP, not localhost).
 *   - API_ROOT_URL — Alias for API_BASE_URL, used for constructing image URLs.
 *
 * Functions:
 *   - getImageUri(imagePath) — Converts a relative image path (e.g., '/api/products/images/abc.jpg')
 *                              into a full URL. Returns the path unchanged if it's already absolute (http).
 *
 * @module lib/config
 */
// Local development backend
// Override via EXPO_PUBLIC_API_URL env var for different servers.
// Use your machine's LAN IP for Expo/phone testing so localhost points to the device, not the backend host.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.174:8080';
export const API_ROOT_URL = API_BASE_URL;

export const getImageUri = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const separator = imagePath.startsWith('/') ? '' : '/';
  return `${API_ROOT_URL}${separator}${imagePath}`;
};
