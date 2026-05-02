// API base URL — change IP for physical device testing
export const API_BASE_URL = 'http://192.168.0.4:8080';
export const API_ROOT_URL = API_BASE_URL;

export const getImageUri = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_ROOT_URL}${imagePath}`;
};
