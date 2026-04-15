const ACCESS_TOKEN_KEYS = ['accessToken', 'access_token'] as const;

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
