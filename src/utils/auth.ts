const ACCESS_TOKEN_KEYS = ['accessToken', 'access_token'] as const;
const PRIMARY_ACCESS_TOKEN_KEY = ACCESS_TOKEN_KEYS[0];

export const getAccessToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  for (const key of ACCESS_TOKEN_KEYS) {
    const token = window.localStorage.getItem(key);

    if (token) {
      return token;
    }
  }

  return null;
};

export const setAccessToken = (token: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(PRIMARY_ACCESS_TOKEN_KEY, token);

  for (const key of ACCESS_TOKEN_KEYS.slice(1)) {
    window.localStorage.removeItem(key);
  }
};

export const clearAccessToken = () => {
  if (typeof window === 'undefined') {
    return;
  }

  for (const key of ACCESS_TOKEN_KEYS) {
    window.localStorage.removeItem(key);
  }
};
