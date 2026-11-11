const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  status: number;
  details?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Prevent multiple simultaneous token refresh requests.
let refreshPromise: Promise<boolean> | null = null;

// Send a request to the backend.
async function sendRequest(
  endpoint: string,
  options: RequestInit
): Promise<Response> {
  const headers = new Headers(options.headers);

  // Do not manually set Content-Type for FormData.
  // The browser must generate its multipart boundary.
  if (
    options.body !== undefined &&
    options.body !== null &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });
}

// Request a new access token using the refresh cookie.
async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        return response.ok;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

// Endpoints that must not trigger automatic token refresh.
function shouldSkipRefresh(endpoint: string): boolean {
  const excludedEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/logout',
    '/auth/refresh',
  ];

  return excludedEndpoints.includes(endpoint);
}

// Main API request function.
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      'API URL is not configured. Check frontend/.env.local.'
    );
  }

  let response: Response;

  try {
    response = await sendRequest(endpoint, options);

    // If access token expired, attempt to refresh it.
    if (
      response.status === 401 &&
      !shouldSkipRefresh(endpoint)
    ) {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        // Retry the original request with the new access token.
        response = await sendRequest(endpoint, options);
      }
    }
  } catch {
    throw new Error(
      'Unable to connect to the server. Please check your internet connection or try again.'
    );
  }

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const errorData = responseData as ApiErrorResponse | null;

    throw new ApiError(
      errorData?.message || 'Something went wrong. Please try again.',
      response.status,
      errorData?.errors
    );
  }

  return responseData as T;
}
// ==========================================
// BINARY FILE API REQUEST
// Used for PDF previews and file downloads.
// ==========================================

export async function apiBlobRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Blob> {
  if (!API_BASE_URL) {
    throw new Error(
      'API URL is not configured. Check frontend/.env.local.'
    );
  }

  let response: Response;

  try {
    response = await sendRequest(endpoint, options);

    // Automatically refresh an expired access token.
    if (
      response.status === 401 &&
      !shouldSkipRefresh(endpoint)
    ) {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        response = await sendRequest(endpoint, options);
      }
    }
  } catch {
    throw new Error(
      'Unable to connect to the server. Please try again.'
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    const error = errorData as ApiErrorResponse | null;

    throw new ApiError(
      error?.message || 'Unable to retrieve the requested file.',
      response.status,
      error?.errors
    );
  }

  return response.blob();
}
/*
| Functionality        | Purpose                                      |
|----------------------|----------------------------------------------|
| API URL              | Reads backend address from `.env.local`      |
| `apiRequest()`       | Sends requests to Express                    |
| `credentials: include` | Allows browser authentication cookies      |
| `ApiError`           | Handles backend errors                       |
| Error handling       | Handles network and server failures          |

### API Improvements

- **API requests**
  - Before: Manual
  - Now: Automatic

- **Access-token expiry**
  - Before: Request fails
  - Now: Attempts refresh

- **Refresh token**
  - Before: Not automatically used
  - Now: Automatically used

- **Multiple refresh requests**
  - Before: Possible
  - Now: Shared refresh request

- **Original request**
  - Before: Fails on expired token
  - Now: Automatically retried

- **File upload support**
  - Before: JSON header always applied
  - Now: Supports `FormData`


*/