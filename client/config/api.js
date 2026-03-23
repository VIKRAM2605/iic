const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const normalizeUrl = (url = "") => (url.endsWith("/") ? url.slice(0, -1) : url);

export const BACKEND_BASE_URL = normalizeUrl(API_BASE_URL);

export const API_ROUTES = {
	health: "/",
	eventDetails: "/api/event-details",
};

export const getApiUrl = (route) => {
	const safeRoute = route.startsWith("/") ? route : `/${route}`;
	return `${BACKEND_BASE_URL}${safeRoute}`;
};

export const API_URLS = {
	health: getApiUrl(API_ROUTES.health),
	eventDetails: getApiUrl(API_ROUTES.eventDetails),
};

export const createEventDetails = async (formData) => {
	const response = await fetch(API_URLS.eventDetails, {
		method: "POST",
		body: formData,
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(payload.message || "Failed to upload event details.");
	}

	return payload;
};
