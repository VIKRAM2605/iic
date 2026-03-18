const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const normalizeUrl = (url = "") => (url.endsWith("/") ? url.slice(0, -1) : url);

export const BACKEND_BASE_URL = normalizeUrl(API_BASE_URL);

export const API_ROUTES = {
	health: "/",
};

export const getApiUrl = (route) => {
	const safeRoute = route.startsWith("/") ? route : `/${route}`;
	return `${BACKEND_BASE_URL}${safeRoute}`;
};

export const API_URLS = {
	health: getApiUrl(API_ROUTES.health),
};
