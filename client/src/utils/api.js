import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'ecommerce-session-id';

export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5001`
).replace(/\/$/, '');

export const FALLBACK_IMAGE = '/images/no-image.svg';

function getSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export { getSessionId };

export function resolveImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return FALLBACK_IMAGE;
  const trimmed = imageUrl.trim();
  if (!trimmed) return FALLBACK_IMAGE;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('/')) return `${API_BASE}${trimmed}`;
  return `${API_BASE}/${trimmed.replace(/^\.?\//, '')}`;
}

async function apiFetch(endpoint, options = {}) {
  const { method = 'GET', body, headers = {}, retries = 1 } = options;
  const token = localStorage.getItem('shopverse_token');

  const config = {
    method,
    headers: {
      'x-session-id': getSessionId(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(body);
  } else if (body) {
    config.body = body;
  }

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

// Convenience methods
export const api = {
  get: (endpoint) => apiFetch(endpoint),
  post: (endpoint, body) => apiFetch(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => apiFetch(endpoint, { method: 'PUT', body }),
  delete: (endpoint) => apiFetch(endpoint, { method: 'DELETE' }),
  upload: (endpoint, formData) =>
    apiFetch(endpoint, {
      method: 'POST',
      body: formData,
    }),
};

export default api;
