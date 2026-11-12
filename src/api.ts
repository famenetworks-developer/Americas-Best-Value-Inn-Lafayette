export type CMSUser = {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "editor" | "author";
};
let csrf = "";
export function setCSRF(value: string) {
  csrf = value;
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD"].includes(options.method || "GET") && csrf)
    headers.set("X-CSRF-Token", csrf);
  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "same-origin",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}
