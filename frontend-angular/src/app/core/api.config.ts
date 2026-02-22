const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;

const configuredApiUrl = env?.['NG_APP_API_BASE_URL']?.trim() || env?.['VITE_API_BASE_URL']?.trim();

const isLocalEnvironment =
	typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const fallbackApiUrl = isLocalEnvironment
	? 'http://localhost:3000/api/v1'
	: 'https://anime-catalog-theta.vercel.app/api/v1';

export const API_BASE_URL = configuredApiUrl || fallbackApiUrl;
