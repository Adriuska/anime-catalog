const apiBaseUrl =
	(import.meta as ImportMeta & { env?: Record<string, string> }).env?.[
		'NG_APP_API_BASE_URL'
	]?.trim() || 'http://localhost:3000/api/v1';

export const API_BASE_URL = apiBaseUrl;
