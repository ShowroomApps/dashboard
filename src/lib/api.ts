import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    let orgId = localStorage.getItem('current_org_id');
    if (!orgId || orgId === 'undefined' || orgId === 'null' || orgId === '') {
      orgId = null;
      const savedOrgsStr = localStorage.getItem('current_orgs');
      if (savedOrgsStr) {
        try {
          const orgs = JSON.parse(savedOrgsStr);
          if (Array.isArray(orgs) && orgs.length > 0 && orgs[0]?.id) {
            orgId = orgs[0].id;
            localStorage.setItem('current_org_id', orgId!);
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
    }

    if (orgId && orgId !== 'undefined' && orgId !== 'null') {
      config.headers['X-Organization-Id'] = orgId;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return response.data;
    }
    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    const errPayload = error.response?.data?.error || error.response?.data || {};
    const code = errPayload.code || '';

    if ((status === 401 || status === 403) && typeof window !== 'undefined') {
      if (code === 'ORGANIZATION_DEACTIVATED' || code === 'SUBSCRIPTION_EXPIRED' || code === 'TRIAL_EXPIRED') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('current_user');
        localStorage.removeItem('current_org_id');
        localStorage.removeItem('current_orgs');
        sessionStorage.setItem(
          'deactivation_message',
          errPayload.message || 'Your account is deactivated because your trial or subscription has expired. Please contact the administrator.',
        );

        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = `/login?reason=${code}`;
        }
      } else if (status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('current_user');
        localStorage.removeItem('current_org_id');
        localStorage.removeItem('current_orgs');

        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?expired=true';
        }
      }
    }

    const errorData = errPayload.code
      ? errPayload
      : {
          code: status === 401 ? 'UNAUTHORIZED' : 'NETWORK_ERROR',
          message: error.response?.data?.message || error.message || 'An unexpected error occurred',
        };
    return Promise.reject(errorData);
  },
);

export const fetcher = (url: string) => apiClient.get(url).then((res: any) => res.data);
