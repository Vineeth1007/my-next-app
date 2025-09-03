// src/pages/api/bridge.js
import { NextResponse } from "next/server";

// NOTE: Next.js Pages Router API routes run in Node; this file uses the Edge-like
// response API to keep code tidy, but we still export default function handler.
export default async function handler(req, res) {
  try {
    const PY_BACKEND_URL = process.env.PY_BACKEND_URL; // e.g. http://127.0.0.1:8000
    if (!PY_BACKEND_URL) {
      return res.status(500).json({ ok: false, error: "PY_BACKEND_URL is not set" });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Use POST" });
    }

    const { action, payload = {}, method = "POST", query = {} } = req.body || {};
    if (!action || typeof action !== "string") {
      return res.status(400).json({ ok: false, error: "Missing 'action' string" });
    }

    // Minimal opinionated mapping for common cases.
    const actionMap = {
      "gmail.send": "/gmail/send",
      "email.send": "/email/send",        // if your Python has /email/send using send_email.py
      "slack.post": "/slack/post",
      "whatsapp.send": "/whatsapp/send",
      "calendar.create": "/calendar/create",
      "pipeline.run": "/pipeline/run",
    };

    // Fallback: turn "foo.bar.baz" -> "/foo/bar/baz"
    const fallback = "/" + action.replace(/\./g, "/");
    const path = actionMap[action] || fallback;

    // Build URL with optional query params
    const url = new URL(PY_BACKEND_URL.replace(/\/+$/, "") + path);
    Object.entries(query || {}).forEach(([k, v]) => url.searchParams.set(k, String(v)));

    const upstream = await fetch(url.toString(), {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "GET" ? undefined : JSON.stringify(payload),
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return res.status(upstream.status).json({
      ok: upstream.ok,
      status: upstream.status,
      action,
      path,
      url: url.toString(),
      data,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
