const token = () => localStorage.getItem("token");

export async function api(path, { method = "GET", body, form } = {}) {
  const headers = { Authorization: `Bearer ${token()}` };
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
