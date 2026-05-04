const ACCESS_TOKEN_EXPIRY_BUFFER_MS = 30_000;

type AccessTokenPayload = {
  exp?: number;
};

const decodeBase64Url = (value: string) => {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (normalizedValue.length % 4)) % 4;
  const paddedValue = `${normalizedValue}${'='.repeat(paddingLength)}`;

  if (typeof window === 'undefined' || typeof window.atob !== 'function') {
    throw new Error('Access token decoding is only available in the browser.');
  }

  return window.atob(paddedValue);
};

const decodeAccessTokenPayload = (
  accessToken: string,
): AccessTokenPayload | null => {
  const normalizedAccessToken = accessToken.trim();

  if (!normalizedAccessToken) {
    return null;
  }

  const tokenSegments = normalizedAccessToken.split('.');

  if (tokenSegments.length < 2) {
    return null;
  }

  try {
    const decodedPayload = decodeBase64Url(tokenSegments[1]);
    return JSON.parse(decodedPayload) as AccessTokenPayload;
  } catch {
    return null;
  }
};

export const getAccessTokenExpiryEpochMs = (accessToken: string) => {
  const decodedPayload = decodeAccessTokenPayload(accessToken);

  if (
    !decodedPayload ||
    typeof decodedPayload.exp !== 'number' ||
    !Number.isFinite(decodedPayload.exp)
  ) {
    return null;
  }

  return decodedPayload.exp * 1000;
};

export const isAccessTokenExpiringSoon = (
  accessToken: string,
  bufferMs = ACCESS_TOKEN_EXPIRY_BUFFER_MS,
) => {
  const expiryEpochMs = getAccessTokenExpiryEpochMs(accessToken);

  if (!expiryEpochMs) {
    return true;
  }

  return expiryEpochMs - Date.now() < bufferMs;
};
