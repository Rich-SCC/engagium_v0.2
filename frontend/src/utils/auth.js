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
    const parts = token.split('.');
    if (parts.length < 2) return false;

    // JWT payload is base64url, so normalize before decoding.
    const base64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded));
    const now = Date.now() / 1000;

    return Number.isFinite(payload.exp) && payload.exp > now;
  } catch {
    return false;
  }
};

export const getAuthToken = () => {
  const token = getToken();
  return token ? `Bearer ${token}` : null;
};