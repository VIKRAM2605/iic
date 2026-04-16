import { getAuthToken } from '../utils/auth.js';

const API_BASE = '/api';

export const API_URLS = {
  businessDetails: "/api/business-details",
  adminApprovedBusinesses: "/api/business-details/admin/approved",
  adminApprovedBusinessFilterOptions: "/api/business-details/admin/approved/filter-options",
  adminBusinessReviewQueue: "/api/business-details/admin/review-queue",
  facultyMyBusinesses: "/api/business-details/faculty/mine",
};

export const getBusinessById = async ({ token, businessId }) => {
  const response = await fetch(`${API_BASE}/business-details/${businessId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

export const reviewBusinessByAdmin = async (businessId, action, rejectionMessage = '') => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/business-details/${businessId}/review`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      ...(action === 'reject' && rejectionMessage && { rejectionMessage }),
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const createBusinessDetails = async (formData, token) => {
  const response = await fetch(`${API_BASE}/business-details`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

export const getPrototypeById = async (prototypeId) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/prototype-details/${prototypeId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

export const reviewPrototypeByAdmin = async (prototypeId, action, rejectionMessage = '') => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/prototype-details/${prototypeId}/review`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      ...(action === 'reject' && rejectionMessage && { rejectionMessage }),
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};

export const getAdminPrototypeReviewQueue = async (token) => {
  const response = await fetch(`${API_BASE}/prototype-details/review-queue`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

export const createPrototypeDetails = async (formData, token) => {
  const response = await fetch(`${API_BASE}/prototype-details`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

