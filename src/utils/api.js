const getApiBaseUrl = () => {
  // In production (served from same origin as backend), use relative URLs
  if (import.meta.env.PROD) {
    return '';
  }
  
  // In development, use explicit URL from env
  const devUrl = import.meta.env.VITE_API_URL;
  if (devUrl) {
    return devUrl;
  }
  
  // Fallback
  return 'http://localhost:5000';
};

export const API_URL = getApiBaseUrl();
