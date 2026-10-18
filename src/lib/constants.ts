/** Build-time configuration shared across the app. */

/**
 * `VITE_API_DIRECT_URL` wins when present so the client can bypass the dev
 * proxy. Otherwise the relative default is used, which the Vite dev server
 * proxies in development and a reverse proxy handles in production.
 */
export const API_BASE_URL: string = (
  import.meta.env.VITE_API_DIRECT_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api/v1'
).replace(/\/+$/, '');

export const APP_NAME: string = import.meta.env.VITE_APP_NAME || 'SkillBridge LMS';

export const DEFAULT_PAGE_SIZE = 12;

export const REFRESH_ENDPOINT = '/auth/refresh';

export const LOGIN_REDIRECT_KEY = 'skillbridge:redirect';
