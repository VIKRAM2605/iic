import { clearAuthSession } from "../src/utils/auth.js";

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
	iicApplied: "/api/iic-applied",
	rdCellActivities: "/api/rd-cell-activities",
	adminApprovedBusinesses: "/api/business-details/admin/approved",
	adminApprovedBusinessFilterOptions: "/api/business-details/admin/approved/filter-options",
	adminBusinessReviewQueue: "/api/business-details/admin/review-queue",
	facultyMyBusinesses: "/api/business-details/faculty/mine",
	adminApprovedIicApplied: "/api/iic-applied/admin/approved",
	adminApprovedIicAppliedFilterOptions: "/api/iic-applied/admin/approved/filter-options",
	adminIicAppliedReviewQueue: "/api/iic-applied/admin/review-queue",
	facultyMyIicApplied: "/api/iic-applied/faculty/mine",
	adminApprovedRdCellActivities: "/api/rd-cell-activities/admin/approved",
	adminApprovedRdCellActivitiesFilterOptions: "/api/rd-cell-activities/admin/approved/filter-options",
	adminRdCellActivitiesReviewQueue: "/api/rd-cell-activities/admin/review-queue",
	facultyMyRdCellActivities: "/api/rd-cell-activities/faculty/mine",
	rdCellNominations: "/api/rd-cell-nominations",
	adminApprovedRdCellNominations: "/api/rd-cell-nominations/admin/approved",
	adminApprovedRdCellNominationFilterOptions: "/api/rd-cell-nominations/admin/approved/filter-options",
	adminRdCellReviewQueue: "/api/rd-cell-nominations/admin/review-queue",
	facultyMyRdCellNominations: "/api/rd-cell-nominations/faculty/mine",
	rdFacilitiesServices: "/api/rd-facilities-services",
	adminApprovedRdFacilitiesServices: "/api/rd-facilities-services/admin/approved",
	adminApprovedRdFacilitiesServicesFilterOptions: "/api/rd-facilities-services/admin/approved/filter-options",
	adminRdFacilitiesServicesReviewQueue: "/api/rd-facilities-services/admin/review-queue",
	facultyMyRdFacilitiesServices: "/api/rd-facilities-services/faculty/mine",
	rdEquipmentsServices: "/api/rd-equipments-services",
	adminApprovedRdEquipmentsServices: "/api/rd-equipments-services/admin/approved",
	adminApprovedRdEquipmentsServicesFilterOptions: "/api/rd-equipments-services/admin/approved/filter-options",
	adminRdEquipmentsServicesReviewQueue: "/api/rd-equipments-services/admin/review-queue",
	facultyMyRdEquipmentsServices: "/api/rd-equipments-services/faculty/mine",
	rdProjectsOutputs: "/api/rd-projects-outputs",
	adminApprovedRdProjectsOutputs: "/api/rd-projects-outputs/admin/approved",
	adminApprovedRdProjectsOutputsFilterOptions: "/api/rd-projects-outputs/admin/approved/filter-options",
	adminRdProjectsOutputsReviewQueue: "/api/rd-projects-outputs/admin/review-queue",
	facultyMyRdProjectsOutputs: "/api/rd-projects-outputs/faculty/mine",
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
	iicApplied: getApiUrl(API_ROUTES.iicApplied),
	rdCellActivities: getApiUrl(API_ROUTES.rdCellActivities),
	adminApprovedBusinesses: getApiUrl(API_ROUTES.adminApprovedBusinesses),
	adminApprovedBusinessFilterOptions: getApiUrl(API_ROUTES.adminApprovedBusinessFilterOptions),
	adminBusinessReviewQueue: getApiUrl(API_ROUTES.adminBusinessReviewQueue),
	facultyMyBusinesses: getApiUrl(API_ROUTES.facultyMyBusinesses),
	adminApprovedIicApplied: getApiUrl(API_ROUTES.adminApprovedIicApplied),
	adminApprovedIicAppliedFilterOptions: getApiUrl(API_ROUTES.adminApprovedIicAppliedFilterOptions),
	adminIicAppliedReviewQueue: getApiUrl(API_ROUTES.adminIicAppliedReviewQueue),
	facultyMyIicApplied: getApiUrl(API_ROUTES.facultyMyIicApplied),
	adminApprovedRdCellActivities: getApiUrl(API_ROUTES.adminApprovedRdCellActivities),
	adminApprovedRdCellActivitiesFilterOptions: getApiUrl(API_ROUTES.adminApprovedRdCellActivitiesFilterOptions),
	adminRdCellActivitiesReviewQueue: getApiUrl(API_ROUTES.adminRdCellActivitiesReviewQueue),
	facultyMyRdCellActivities: getApiUrl(API_ROUTES.facultyMyRdCellActivities),
	rdCellNominations: getApiUrl(API_ROUTES.rdCellNominations),
	adminApprovedRdCellNominations: getApiUrl(API_ROUTES.adminApprovedRdCellNominations),
	adminApprovedRdCellNominationFilterOptions: getApiUrl(API_ROUTES.adminApprovedRdCellNominationFilterOptions),
	adminRdCellReviewQueue: getApiUrl(API_ROUTES.adminRdCellReviewQueue),
	facultyMyRdCellNominations: getApiUrl(API_ROUTES.facultyMyRdCellNominations),
	rdFacilitiesServices: getApiUrl(API_ROUTES.rdFacilitiesServices),
	adminApprovedRdFacilitiesServices: getApiUrl(API_ROUTES.adminApprovedRdFacilitiesServices),
	adminApprovedRdFacilitiesServicesFilterOptions: getApiUrl(API_ROUTES.adminApprovedRdFacilitiesServicesFilterOptions),
	adminRdFacilitiesServicesReviewQueue: getApiUrl(API_ROUTES.adminRdFacilitiesServicesReviewQueue),
	facultyMyRdFacilitiesServices: getApiUrl(API_ROUTES.facultyMyRdFacilitiesServices),
	rdEquipmentsServices: getApiUrl(API_ROUTES.rdEquipmentsServices),
	adminApprovedRdEquipmentsServices: getApiUrl(API_ROUTES.adminApprovedRdEquipmentsServices),
	adminApprovedRdEquipmentsServicesFilterOptions: getApiUrl(API_ROUTES.adminApprovedRdEquipmentsServicesFilterOptions),
	adminRdEquipmentsServicesReviewQueue: getApiUrl(API_ROUTES.adminRdEquipmentsServicesReviewQueue),
	facultyMyRdEquipmentsServices: getApiUrl(API_ROUTES.facultyMyRdEquipmentsServices),
	rdProjectsOutputs: getApiUrl(API_ROUTES.rdProjectsOutputs),
	adminApprovedRdProjectsOutputs: getApiUrl(API_ROUTES.adminApprovedRdProjectsOutputs),
	adminApprovedRdProjectsOutputsFilterOptions: getApiUrl(API_ROUTES.adminApprovedRdProjectsOutputsFilterOptions),
	adminRdProjectsOutputsReviewQueue: getApiUrl(API_ROUTES.adminRdProjectsOutputsReviewQueue),
	facultyMyRdProjectsOutputs: getApiUrl(API_ROUTES.facultyMyRdProjectsOutputs),
};

const handleUnauthorizedResponse = (response) => {
	if (response.status !== 401 || typeof window === "undefined") {
		return;
	}

	clearAuthSession();

	const currentPath = `${window.location.pathname}${window.location.search}`;
	if (currentPath && currentPath !== "/login") {
		sessionStorage.setItem("post-login-redirect", currentPath);
	}

	window.location.replace("/login");
};

const parseJsonResponse = async (response, fallbackMessage) => {
	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		handleUnauthorizedResponse(response);
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
		handleUnauthorizedResponse(response);
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
		handleUnauthorizedResponse(response);
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
		handleUnauthorizedResponse(response);
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
		handleUnauthorizedResponse(response);
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
		handleUnauthorizedResponse(response);
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
		handleUnauthorizedResponse(response);
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

export const createRdCellNomination = async (formData, token) => {
	const response = await fetch(API_URLS.rdCellNominations, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: formData,
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		handleUnauthorizedResponse(response);
		throw new Error(payload.message || "Failed to submit R&D Cell nomination.");
	}

	return payload;
};

export const createIicApplied = async (formData, token) => {
	const response = await fetch(API_URLS.iicApplied, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: formData,
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		handleUnauthorizedResponse(response);
		throw new Error(payload.message || "Failed to submit IIC Applied entry.");
	}

	return payload;
};

export const getAdminApprovedIicApplied = async ({
	token,
	facultyName,
	includeRejected,
}) => {
	const params = new URLSearchParams();
	if (facultyName) params.set("facultyName", facultyName);
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(`${API_URLS.adminApprovedIicApplied}?${params.toString()}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch approved IIC Applied entries.");
};

export const getAdminApprovedIicAppliedFilterOptions = async (token, { includeRejected } = {}) => {
	const params = new URLSearchParams();
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(
		`${API_URLS.adminApprovedIicAppliedFilterOptions}?${params.toString()}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);

	return parseJsonResponse(response, "Failed to fetch IIC Applied filter options.");
};

export const getAdminIicAppliedReviewQueue = async (token) => {
	const response = await fetch(API_URLS.adminIicAppliedReviewQueue, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch IIC Applied review queue.");
};

export const reviewIicAppliedByAdmin = async ({ token, appliedId, action, rejectionMessage }) => {
	const response = await fetch(`${API_URLS.iicApplied}/admin/${appliedId}/review`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ action, rejectionMessage }),
	});

	return parseJsonResponse(response, "Failed to update IIC Applied review status.");
};

export const getFacultyMyIicApplied = async (token) => {
	const response = await fetch(API_URLS.facultyMyIicApplied, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch faculty IIC Applied entries.");
};

export const getIicAppliedById = async ({ token, appliedId }) => {
	const response = await fetch(`${API_URLS.iicApplied}/${appliedId}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch IIC Applied details.");
};

export const createRdCellActivity = async (formData, token) => {
	const response = await fetch(API_URLS.rdCellActivities, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: formData,
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		handleUnauthorizedResponse(response);
		throw new Error(payload.message || "Failed to submit R&D Cell activity.");
	}

	return payload;
};

export const getAdminApprovedRdCellActivities = async ({
	token,
	facultyName,
	includeRejected,
}) => {
	const params = new URLSearchParams();

	if (facultyName) params.set("facultyName", facultyName);
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(
		`${API_URLS.adminApprovedRdCellActivities}?${params.toString()}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);

	return parseJsonResponse(response, "Failed to fetch approved R&D Cell activities.");
};

export const getAdminApprovedRdCellActivitiesFilterOptions = async (
	token,
	{ includeRejected } = {},
) => {
	const params = new URLSearchParams();
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(
		`${API_URLS.adminApprovedRdCellActivitiesFilterOptions}?${params.toString()}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);

	return parseJsonResponse(
		response,
		"Failed to fetch R&D Cell activity filter options.",
	);
};

export const getAdminRdCellActivitiesReviewQueue = async (token) => {
	const response = await fetch(API_URLS.adminRdCellActivitiesReviewQueue, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch R&D Cell activity review queue.");
};

export const reviewRdCellActivityByAdmin = async ({
	token,
	activityId,
	action,
	rejectionMessage,
}) => {
	const response = await fetch(
		`${API_URLS.rdCellActivities}/admin/${activityId}/review`,
		{
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ action, rejectionMessage }),
		},
	);

	return parseJsonResponse(response, "Failed to update R&D Cell activity review status.");
};

export const getFacultyMyRdCellActivities = async (token) => {
	const response = await fetch(API_URLS.facultyMyRdCellActivities, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch faculty R&D Cell activities.");
};

export const getRdCellActivityById = async ({ token, activityId }) => {
	const response = await fetch(`${API_URLS.rdCellActivities}/${activityId}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch R&D Cell activity details.");
};

export const getAdminApprovedRdCellNominations = async ({
	token,
	facultyName,
	includeRejected,
}) => {
	const params = new URLSearchParams();

	if (facultyName) params.set("facultyName", facultyName);
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(
		`${API_URLS.adminApprovedRdCellNominations}?${params.toString()}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);

	return parseJsonResponse(response, "Failed to fetch approved R&D Cell nominations.");
};

export const getAdminApprovedRdCellNominationFilterOptions = async (
	token,
	{ includeRejected } = {},
) => {
	const params = new URLSearchParams();
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(
		`${API_URLS.adminApprovedRdCellNominationFilterOptions}?${params.toString()}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);

	return parseJsonResponse(
		response,
		"Failed to fetch R&D Cell nomination filter options.",
	);
};

export const getAdminRdCellReviewQueue = async (token) => {
	const response = await fetch(API_URLS.adminRdCellReviewQueue, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch R&D Cell nomination review queue.");
};

export const reviewRdCellNominationByAdmin = async ({
	token,
	nominationId,
	action,
	rejectionMessage,
}) => {
	const response = await fetch(
		`${API_URLS.rdCellNominations}/admin/${nominationId}/review`,
		{
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ action, rejectionMessage }),
		},
	);

	return parseJsonResponse(response, "Failed to update R&D Cell nomination review status.");
};

export const getFacultyMyRdCellNominations = async (token) => {
	const response = await fetch(API_URLS.facultyMyRdCellNominations, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch faculty R&D Cell nominations.");
};

export const getRdCellNominationById = async ({ token, nominationId }) => {
	const response = await fetch(`${API_URLS.rdCellNominations}/${nominationId}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(response, "Failed to fetch R&D Cell nomination details.");
};

export const createRdFacilitiesService = async (formData, token) => {
	const response = await fetch(API_URLS.rdFacilitiesServices, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: formData,
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		handleUnauthorizedResponse(response);
		throw new Error(payload.message || "Failed to submit R&D Facilities and Services entry.");
	}

	return payload;
};

export const getAdminApprovedRdFacilitiesServices = async ({
	token,
	facultyName,
	includeRejected,
}) => {
	const params = new URLSearchParams();
	if (facultyName) params.set("facultyName", facultyName);
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(
		`${API_URLS.adminApprovedRdFacilitiesServices}?${params.toString()}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);

	return parseJsonResponse(response, "Failed to fetch approved R&D Facilities and Services.");
};

export const getAdminApprovedRdFacilitiesServicesFilterOptions = async (
	token,
	{ includeRejected } = {},
) => {
	const params = new URLSearchParams();
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(
		`${API_URLS.adminApprovedRdFacilitiesServicesFilterOptions}?${params.toString()}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);

	return parseJsonResponse(
		response,
		"Failed to fetch R&D Facilities and Services filter options.",
	);
};

export const getAdminRdFacilitiesServicesReviewQueue = async (token) => {
	const response = await fetch(API_URLS.adminRdFacilitiesServicesReviewQueue, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(
		response,
		"Failed to fetch R&D Facilities and Services review queue.",
	);
};

export const reviewRdFacilitiesServiceByAdmin = async ({
	token,
	facilityId,
	action,
	rejectionMessage,
}) => {
	const response = await fetch(
		`${API_URLS.rdFacilitiesServices}/admin/${facilityId}/review`,
		{
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ action, rejectionMessage }),
		},
	);

	return parseJsonResponse(
		response,
		"Failed to update R&D Facilities and Services review status.",
	);
};

export const getFacultyMyRdFacilitiesServices = async (token) => {
	const response = await fetch(API_URLS.facultyMyRdFacilitiesServices, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(
		response,
		"Failed to fetch faculty R&D Facilities and Services.",
	);
};

export const getRdFacilitiesServiceById = async ({ token, facilityId }) => {
	const response = await fetch(`${API_URLS.rdFacilitiesServices}/${facilityId}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(
		response,
		"Failed to fetch R&D Facilities and Services details.",
	);
};

export const createRdEquipmentsService = async (formData, token) => {
	const response = await fetch(API_URLS.rdEquipmentsServices, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: formData,
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		handleUnauthorizedResponse(response);
		throw new Error(payload.message || "Failed to submit R&D Equipments Services entry.");
	}

	return payload;
};

export const getAdminApprovedRdEquipmentsServices = async ({
	token,
	facultyName,
	includeRejected,
}) => {
	const params = new URLSearchParams();
	if (facultyName) params.set("facultyName", facultyName);
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(
		`${API_URLS.adminApprovedRdEquipmentsServices}?${params.toString()}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);

	return parseJsonResponse(response, "Failed to fetch approved R&D Equipments Services.");
};

export const getAdminApprovedRdEquipmentsServicesFilterOptions = async (
	token,
	{ includeRejected } = {},
) => {
	const params = new URLSearchParams();
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(
		`${API_URLS.adminApprovedRdEquipmentsServicesFilterOptions}?${params.toString()}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);

	return parseJsonResponse(
		response,
		"Failed to fetch R&D Equipments Services filter options.",
	);
};

export const getAdminRdEquipmentsServicesReviewQueue = async (token) => {
	const response = await fetch(API_URLS.adminRdEquipmentsServicesReviewQueue, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(
		response,
		"Failed to fetch R&D Equipments Services review queue.",
	);
};

export const reviewRdEquipmentsServiceByAdmin = async ({
	token,
	equipmentId,
	action,
	rejectionMessage,
}) => {
	const response = await fetch(
		`${API_URLS.rdEquipmentsServices}/admin/${equipmentId}/review`,
		{
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ action, rejectionMessage }),
		},
	);

	return parseJsonResponse(
		response,
		"Failed to update R&D Equipments Services review status.",
	);
};

export const getFacultyMyRdEquipmentsServices = async (token) => {
	const response = await fetch(API_URLS.facultyMyRdEquipmentsServices, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(
		response,
		"Failed to fetch faculty R&D Equipments Services.",
	);
};

export const getRdEquipmentsServiceById = async ({ token, equipmentId }) => {
	const response = await fetch(`${API_URLS.rdEquipmentsServices}/${equipmentId}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(
		response,
		"Failed to fetch R&D Equipments Services details.",
	);
};

export const createRdProjectsOutput = async (formData, token) => {
	const response = await fetch(API_URLS.rdProjectsOutputs, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: formData,
	});

	const payload = await response.json().catch(() => ({}));

	if (!response.ok) {
		handleUnauthorizedResponse(response);
		throw new Error(payload.message || "Failed to submit R&D Projects & Outputs entry.");
	}

	return payload;
};

export const getAdminApprovedRdProjectsOutputs = async ({
	token,
	facultyName,
	includeRejected,
}) => {
	const params = new URLSearchParams();
	if (facultyName) params.set("facultyName", facultyName);
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(
		`${API_URLS.adminApprovedRdProjectsOutputs}?${params.toString()}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);

	return parseJsonResponse(response, "Failed to fetch approved R&D Projects & Outputs.");
};

export const getAdminApprovedRdProjectsOutputsFilterOptions = async (
	token,
	{ includeRejected } = {},
) => {
	const params = new URLSearchParams();
	if (includeRejected) params.set("includeRejected", "true");

	const response = await fetch(
		`${API_URLS.adminApprovedRdProjectsOutputsFilterOptions}?${params.toString()}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);

	return parseJsonResponse(
		response,
		"Failed to fetch R&D Projects & Outputs filter options.",
	);
};

export const getAdminRdProjectsOutputsReviewQueue = async (token) => {
	const response = await fetch(API_URLS.adminRdProjectsOutputsReviewQueue, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(
		response,
		"Failed to fetch R&D Projects & Outputs review queue.",
	);
};

export const reviewRdProjectsOutputByAdmin = async ({
	token,
	projectId,
	action,
	rejectionMessage,
}) => {
	const response = await fetch(
		`${API_URLS.rdProjectsOutputs}/admin/${projectId}/review`,
		{
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ action, rejectionMessage }),
		},
	);

	return parseJsonResponse(
		response,
		"Failed to update R&D Projects & Outputs review status.",
	);
};

export const getFacultyMyRdProjectsOutputs = async (token) => {
	const response = await fetch(API_URLS.facultyMyRdProjectsOutputs, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(
		response,
		"Failed to fetch faculty R&D Projects & Outputs.",
	);
};

export const getRdProjectsOutputById = async ({ token, projectId }) => {
	const response = await fetch(`${API_URLS.rdProjectsOutputs}/${projectId}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	return parseJsonResponse(
		response,
		"Failed to fetch R&D Projects & Outputs details.",
	);
};

