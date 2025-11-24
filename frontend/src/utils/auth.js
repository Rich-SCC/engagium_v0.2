const TOKEN_KEY = 'engagium_token';
const REFRESH_TOKEN_KEY = 'engagium_refresh_token';

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token) => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const removeRefreshToken = () => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (accessToken, refreshToken) => {
  setToken(accessToken);
  setRefreshToken(refreshToken);
};

export const removeTokens = () => {
  removeToken();
  removeRefreshToken();
};

export const isTokenValid = () => {
  const token = getToken();
  if (!token) return false;

  try {
    // Parse JWT token to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;

    return payload.exp > now;
  } catch {
    return false;
  }
};

export const getAuthToken = () => {
  const token = getToken();
  return token ? `Bearer ${token}` : null;
};