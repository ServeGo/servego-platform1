/**
 * Enterprise-grade API client with retry logic, error handling, and token refresh
 */

const API_BASE_URL = 'http://localhost:4000/api';
const SOCKET_URL = 'http://localhost:4000';
const API_BASES = [API_BASE_URL];

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 500, 502, 503, 504]
};

let accessToken = null;
let refreshToken = null;

export function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== 'undefined') {
    if (access) localStorage.setItem('servego_token', access);
    if (refresh) localStorage.setItem('servego_refresh_token', refresh);
  }
}

export function getStoredTokens() {
  if (typeof window === 'undefined') return { access: null, refresh: null };
  return {
    access: localStorage.getItem('servego_token'),
    refresh: localStorage.getItem('servego_refresh_token')
  };
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('servego_token');
    localStorage.removeItem('servego_refresh_token');
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shouldRetry(status, config) {
  return config.retryableStatuses.includes(status);
}

async function refreshAccessToken() {
  const { refresh } = getStoredTokens();
  if (!refresh) return null;

  try {
    for (const baseUrl of API_BASES) {
      try {
        const response = await fetch(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refresh })
        });
        if (shouldRetry(response.status, DEFAULT_RETRY_CONFIG)) continue;
        if (!response.ok) break;
        const payload = await response.json();
        const data = payload?.success === true ? payload.data : payload;
        if (data?.accessToken) {
          setTokens(data.accessToken, data.refreshToken);
          return data.accessToken;
        }
        break;
      } catch {
        // Network error, try next base URL
      }
    }
    clearTokens();
    return null;
  } catch (err) {
    console.error('[API] Token refresh failed:', err);
    clearTokens();
    return null;
  }
}

function createHeaders(additionalHeaders = {}) {
  const headers = new Headers(additionalHeaders);
  const token = accessToken || getStoredTokens().access;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(additionalHeaders instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

async function apiRequest(endpoint, options = {}) {
  const config = { ...DEFAULT_RETRY_CONFIG, ...options.retryConfig };
  let lastError = null;
  let lastResponse = null;
  let tokenRefreshed = false;

  for (const baseUrl of API_BASES) {
    const url = `${baseUrl}${endpoint}`;
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const headers = createHeaders(options.headers);
        const fetchOptions = {
          ...options,
          headers,
          signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined
        };
        const response = await fetch(url, fetchOptions);

        if (response.status === 401 && !tokenRefreshed) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            tokenRefreshed = true;
            continue;
          }
        }

        if (response.status === 429) {
          lastError = new Error('Request rate limited');
        }

        if (shouldRetry(response.status, config)) {
          if (attempt < config.maxRetries) {
            await sleep(config.retryDelay * Math.pow(2, attempt));
            continue;
          }
          lastResponse = response;
          break;
        }

        const contentType = response.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        if (response.ok && data?.success === true && Object.hasOwn(data, 'data')) {
          data = data.data;
        }

        return { ok: response.ok, status: response.status, data, headers: response.headers };
      } catch (err) {
        lastError = err;
        if (attempt < config.maxRetries) {
          await sleep(config.retryDelay * Math.pow(2, attempt));
          continue;
        }
      }
    }
  }

  if (lastResponse) {
    return { ok: false, status: lastResponse.status, data: { error: 'Backend service is temporarily unavailable.' }, headers: lastResponse.headers };
  }
  return {
    ok: false,
    status: 0,
    data: { error: lastError?.message || 'Request failed after retries' },
    error: lastError
  };
}

export const api = {
  get: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'GET' }),

  post: (endpoint, body, options = {}) =>
    apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body)
    }),

  put: (endpoint, body, options = {}) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: typeof body === 'string' ? body : JSON.stringify(body)
    }),

  patch: (endpoint, body, options = {}) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: typeof body === 'string' ? body : JSON.stringify(body)
    }),

  delete: (endpoint, options = {}) =>
    apiRequest(endpoint, { ...options, method: 'DELETE' })
};

export { API_BASE_URL, SOCKET_URL };

export function initializeTokens() {
  const { access, refresh } = getStoredTokens();
  accessToken = access;
  refreshToken = refresh;
  return { access, refresh };
}
