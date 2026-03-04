export const client = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  
  const response = await fetch(`${baseURL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  // Jeśli response jest pusty (204, DELETE), zwróć null
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null as T;
  }

  return response.json();
};