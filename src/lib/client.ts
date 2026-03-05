export const client = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const baseURL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  const method = options.method || "GET";
  const headers = new Headers(options.headers);

  // Nie wysyłaj Content-Type dla GET/HEAD/DELETE
  if (!["GET", "HEAD", "DELETE"].includes(method)) {
    headers.set("Content-Type", "application/json");
  }

  // Dla video requestów, dodaj Range header (backend tego wymaga)
  const isVideoRequest =
    url.includes("/videos/") && !url.includes("/info");
  if (method === "GET" && isVideoRequest && !headers.has("Range")) {
    headers.set("Range", "bytes=0-");
  }

  const response = await fetch(`${baseURL}${url}`, {
    ...options,
    method,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return null as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (
    contentType.includes("video/") ||
    contentType.includes("image/") ||
    contentType.includes("application/octet-stream")
  ) {
    const blob = await response.blob();
    return {
      data: blob,
      status: response.status,
      headers: response.headers,
    } as T;
  }

  return response.json();
};
