// src/lib/backend.js
export async function callBackend(
  action,
  { payload = {}, method = "POST", query = {} } = {}
) {
  try {
    const res = await fetch("/api/bridge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload, method, query }),
    });

    let json;
    try {
      json = await res.json();
    } catch {
      json = { ok: false, error: "Non-JSON response", status: res.status };
    }

    if (!res.ok || !json?.ok) {
      return {
        ok: false,
        status: json?.status ?? res.status,
        error: json?.error || json?.data?.error || "Backend unreachable",
      };
    }

    return json; // { ok: true, ... }
  } catch (err) {
    return { ok: false, status: 0, error: String(err?.message || err) };
  }
}
