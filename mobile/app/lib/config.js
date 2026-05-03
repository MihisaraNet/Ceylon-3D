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
// The fallback URL should point to your production backend (e.g. Render, Heroku, or a custom domain).
// Ensure this matches your latest branding (LayerForge 3D).
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://layerforge3d-backend.onrender.com';
export const API_ROOT_URL = API_BASE_URL;

export const getImageUri = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_ROOT_URL}${imagePath}`;
};
