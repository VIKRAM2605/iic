const AUTH_TOKEN_KEY = "auth-token";
const AUTH_USER_KEY = "auth-user";

const decodeTokenPayload = (token) => {
  try {
    const [, payloadSegment] = String(token || "").split(".");
    if (!payloadSegment) {
      return null;
    }

    const normalizedPayload = payloadSegment
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );

    return JSON.parse(atob(paddedPayload));
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const payload = decodeTokenPayload(token);
  const expiresAt = Number(payload?.exp);

  if (!payload || !Number.isFinite(expiresAt)) {
    return true;
  }

  return expiresAt * 1000 <= Date.now();
};

export const setAuthSession = ({ token, user }) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const getAuthToken = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || "";

  if (!token) {
    return "";
  }

  if (isTokenExpired(token)) {
    clearAuthSession();
    return "";
  }

  return token;
};

export const getAuthUser = () => {
  if (!getAuthToken()) {
    return null;
  }

  const rawUser = localStorage.getItem(AUTH_USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const isAuthenticated = () => Boolean(getAuthToken());

export const hasAnyRole = (allowedRoles = []) => {
  const user = getAuthUser();
  if (!user?.roleName) {
    return false;
  }

  return allowedRoles.includes(user.roleName);
};
