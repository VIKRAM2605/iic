const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const normalizeUrl = (url = "") => (url.endsWith("/") ? url.slice(0, -1) : url);

export const BACKEND_BASE_URL = normalizeUrl(API_BASE_URL);

export const API_ROUTES = {
	health: "/",
	authLogin: "/api/auth/login",
	authGoogle: "/api/auth/google",
	authMe: "/api/auth/me",
	authLogout: "/api/auth/logout",
	eventDetails: "/api/event-details",
	ideaDetails: "/api/idea-details",
	prototypeDetails: "/api/prototype-details",
	adminApprovedEvents: "/api/event-details/admin/approved",
	adminApprovedFilterOptions: "/api/event-details/admin/approved/filter-options",
	adminReviewQueue: "/api/event-details/admin/review-queue",
	facultyMyEvents: "/api/event-details/faculty/mine",
	adminApprovedIdeas: "/api/idea-details/admin/approved",
	adminApprovedIdeaFilterOptions: "/api/idea-details/admin/approved/filter-options",
	adminIdeaReviewQueue: "/api/idea-details/admin/review-queue",
	facultyMyIdeas: "/api/idea-details/faculty/mine",
	adminApprovedPrototypes: "/api/prototype-details/admin/approved",
	adminApprovedPrototypeFilterOptions: "/api/prototype-details/admin/approved/filter-options",
	adminPrototypeReviewQueue: "/api/prototype-details/admin/review-queue",
	facultyMyPrototypes: "/api/prototype-details/faculty/mine",
	businessDetails: "/api/business-details",
	adminApprovedBusinesses: "/api/business-details/admin/approved",
	adminApprovedBusinessFilterOptions: "/api/business-details/admin/approved/filter-options",
	adminBusinessReviewQueue: "/api/business-details/admin/review-queue",
	facultyMyBusinesses: "/api/business-details/faculty/mine",
};

export const getApiUrl = (route) => {
	const safeRoute = route.startsWith("/") ? route : `/${route}`;
	return `${BACKEND_BASE_URL}${safeRoute}`;
};

export const API_URLS = {
	health: getApiUrl(API_ROUTES.health),
	authLogin: getApiUrl(API_ROUTES.authLogin),
	authGoogle: getApiUrl(API_ROUTES.authGoogle),
	authMe: getApiUrl(API_ROUTES.authMe),
	authLogout: getApiUrl(API_ROUTES.authLogout),
	eventDetails: getApiUrl(API_ROUTES.eventDetails),
	ideaDetails: getApiUrl(API_ROUTES.ideaDetails),
	prototypeDetails: getApiUrl(API_ROUTES.prototypeDetails),
	adminApprovedEvents: getApiUrl(API_ROUTES.adminApprovedEvents),
	adminApprovedFilterOptions: getApiUrl(API_ROUTES.adminApprovedFilterOptions),
	adminReviewQueue: getApiUrl(API_ROUTES.adminReviewQueue),
	facultyMyEvents: getApiUrl(API_ROUTES.facultyMyEvents),
	adminApprovedIdeas: getApiUrl(API_ROUTES.adminApprovedIdeas),
	adminApprovedIdeaFilterOptions: getApiUrl(API_ROUTES.adminApprovedIdeaFilterOptions),
	adminIdeaReviewQueue: getApiUrl(API_ROUTES.adminIdeaReviewQueue),
	facultyMyIdeas: getApiUrl(API_ROUTES.facultyMyIdeas),
	adminApprovedPrototypes: getApiUrl(API_ROUTES.adminApprovedPrototypes),
	adminApprovedPrototypeFilterOptions: getApiUrl(API_ROUTES.adminApprovedPrototypeFilterOptions),
	adminPrototypeReviewQueue: getApiUrl(API_ROUTES.adminPrototypeReviewQueue),
	facultyMyPrototypes: getApiUrl(API_ROUTES.facultyMyPrototypes),
	businessDetails: getApiUrl(API_ROUTES.businessDetails),
	adminApprovedBusinesses: getApiUrl(API_ROUTES.adminApprovedBusinesses),
	adminApprovedBusinessFilterOptions: getApiUrl(API_ROUTES.adminApprovedBusinessFilterOptions),
	adminBusinessReviewQueue: getApiUrl(API_ROUTES.adminBusinessReviewQueue),
	facultyMyBusinesses: getApiUrl(API_ROUTES.facultyMyBusinesses),
};

const parseJsonResponse = async (response, fallbackMessage) => {
	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(payload.message || fallbackMessage);
	}

	return payload;
};

export const loginUser = async ({ email, password }) => {
	const response = await fetch(API_URLS.authLogin, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ email, password }),
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(payload.message || "Login failed.");
	}

	return payload;
};

export const googleLoginUser = async ({ credential }) => {
	const response = await fetch(API_URLS.authGoogle, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ credential }),
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(payload.message || "Google login failed.");
	}

	return payload;
};

export const getCurrentUser = async (token) => {
	const response = await fetch(API_URLS.authMe, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(payload.message || "Failed to fetch current user.");
	}

	return payload;
};

export const logoutUser = async (token) => {
	const response = await fetch(API_URLS.authLogout, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(payload.message || "Logout failed.");
	}

	return payload;
};

export const createEventDetails = async (formData, token) => {
	const response = await fetch(API_URLS.eventDetails, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: formData,
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(payload.message || "Failed to upload event details.");
	}

	return payload;
};

export const createIdeaDetails = async (formData, token) => {
	const response = await fetch(API_URLS.ideaDetails, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: formData,
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(payload.message || "Failed to upload idea details.");
	}

	return payload;
};

export const createPrototypeDetails = async (formData, token) => {
	const response = await fetch(API_URLS.prototypeDetails, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: formData,
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(payload.message || "Failed to upload prototype details.");
	}

	return payload;
};

export const getAdminApprovedEvents = async ({ token, quarter, date, fromDate, toDate, facultyName }) => {
	const params = new URLSearchParams();

	if (quarter) params.set("quarter", quarter);
	if (date) params.set("date", date);
	if (fromDate) params.set("fromDate", fromDate);
	if (toDate) params.set("toDate", toDate);
	if (facultyName) params.set("facultyName", facultyName);

	const response = await fetch(`${API_URLS.adminApprovedEvents}?${params.toString()}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch approved events.");
};

export const getAdminApprovedIdeas = async ({
	token,
	quarter,
	date,
	fromDate,
	toDate,
	facultyName,
	includeRejected,
}) => {
	const params = new URLSearchParams();

	if (quarter) params.set("quarter", quarter);
	if (date) params.set("date", date);
	if (fromDate) params.set("fromDate", fromDate);
	if (toDate) params.set("toDate", toDate);
	if (facultyName) params.set("facultyName", facultyName);
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(`${API_URLS.adminApprovedIdeas}?${params.toString()}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch approved ideas.");
};

export const getAdminApprovedPrototypes = async ({
	token,
	quarter,
	date,
	fromDate,
	toDate,
	facultyName,
	includeRejected,
}) => {
	const params = new URLSearchParams();

	if (quarter) params.set("quarter", quarter);
	if (date) params.set("date", date);
	if (fromDate) params.set("fromDate", fromDate);
	if (toDate) params.set("toDate", toDate);
	if (facultyName) params.set("facultyName", facultyName);
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(`${API_URLS.adminApprovedPrototypes}?${params.toString()}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch approved prototypes.");
};

export const getAdminReviewQueue = async (token) => {
	const response = await fetch(API_URLS.adminReviewQueue, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch review queue.");
};

export const getAdminIdeaReviewQueue = async (token) => {
	const response = await fetch(API_URLS.adminIdeaReviewQueue, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch idea review queue.");
};

export const getAdminPrototypeReviewQueue = async (token) => {
	const response = await fetch(API_URLS.adminPrototypeReviewQueue, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch prototype review queue.");
};

export const getAdminApprovedFilterOptions = async (token) => {
	const response = await fetch(API_URLS.adminApprovedFilterOptions, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch filter options.");
};

export const getAdminApprovedIdeaFilterOptions = async (token, { includeRejected } = {}) => {
	const params = new URLSearchParams();
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(
		`${API_URLS.adminApprovedIdeaFilterOptions}?${params.toString()}`,
		{
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		}
	);

	return parseJsonResponse(response, "Failed to fetch idea filter options.");
};

export const getAdminApprovedPrototypeFilterOptions = async (token, { includeRejected } = {}) => {
	const params = new URLSearchParams();
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(
		`${API_URLS.adminApprovedPrototypeFilterOptions}?${params.toString()}`,
		{
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		}
	);

	return parseJsonResponse(response, "Failed to fetch prototype filter options.");
};

export const reviewEventByAdmin = async ({ token, eventId, action, rejectionMessage }) => {
	const response = await fetch(`${API_URLS.eventDetails}/admin/${eventId}/review`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ action, rejectionMessage }),
	});

	return parseJsonResponse(response, "Failed to update event review status.");
};

export const reviewIdeaByAdmin = async ({ token, ideaId, action, rejectionMessage }) => {
	const response = await fetch(`${API_URLS.ideaDetails}/admin/${ideaId}/review`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ action, rejectionMessage }),
	});

	return parseJsonResponse(response, "Failed to update idea review status.");
};

export const reviewPrototypeByAdmin = async ({ token, prototypeId, action, rejectionMessage }) => {
	const response = await fetch(`${API_URLS.prototypeDetails}/admin/${prototypeId}/review`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ action, rejectionMessage }),
	});

	return parseJsonResponse(response, "Failed to update prototype review status.");
};

export const getFacultyMyEvents = async (token) => {
	const response = await fetch(API_URLS.facultyMyEvents, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch faculty events.");
};

export const getFacultyMyIdeas = async (token) => {
	const response = await fetch(API_URLS.facultyMyIdeas, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch faculty ideas.");
};

export const getFacultyMyPrototypes = async (token) => {
	const response = await fetch(API_URLS.facultyMyPrototypes, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch faculty prototypes.");
};

export const getEventById = async ({ token, eventId }) => {
	const response = await fetch(`${API_URLS.eventDetails}/${eventId}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch event details.");
};

export const getIdeaById = async ({ token, ideaId }) => {
	const response = await fetch(`${API_URLS.ideaDetails}/${ideaId}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch idea details.");
};

export const getPrototypeById = async ({ token, prototypeId }) => {
	const response = await fetch(`${API_URLS.prototypeDetails}/${prototypeId}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch prototype details.");
};

export const createBusinessDetails = async (formData, token) => {
	const response = await fetch(API_URLS.businessDetails, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: formData,
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		throw new Error(payload.message || "Failed to upload business details.");
	}

	return payload;
};

export const getAdminApprovedBusinesses = async ({
	token,
	quarter,
	date,
	fromDate,
	toDate,
	facultyName,
	includeRejected,
}) => {
	const params = new URLSearchParams();

	if (quarter) params.set("quarter", quarter);
	if (date) params.set("date", date);
	if (fromDate) params.set("fromDate", fromDate);
	if (toDate) params.set("toDate", toDate);
	if (facultyName) params.set("facultyName", facultyName);
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(`${API_URLS.adminApprovedBusinesses}?${params.toString()}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch approved businesses.");
};

export const getAdminBusinessReviewQueue = async (token) => {
	const response = await fetch(API_URLS.adminBusinessReviewQueue, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch business review queue.");
};

export const getAdminApprovedBusinessFilterOptions = async (token, { includeRejected } = {}) => {
	const params = new URLSearchParams();
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(
		`${API_URLS.adminApprovedBusinessFilterOptions}?${params.toString()}`,
		{
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		}
	);

	return parseJsonResponse(response, "Failed to fetch business filter options.");
};

export const reviewBusinessByAdmin = async ({ token, businessId, action, rejectionMessage }) => {
	const response = await fetch(`${API_URLS.businessDetails}/admin/${businessId}/review`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ action, rejectionMessage }),
	});

	return parseJsonResponse(response, "Failed to update business review status.");
};

export const getFacultyMyBusinesses = async (token) => {
	const response = await fetch(API_URLS.facultyMyBusinesses, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch faculty businesses.");
};

export const getBusinessById = async ({ token, businessId }) => {
	const response = await fetch(`${API_URLS.businessDetails}/${businessId}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch business details.");
};

