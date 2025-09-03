// src/components/ActionBridge.jsx
import React from "react";
import { callBackend } from "@/lib/backend";
import { useRouter } from "next/router";

// Button text → action ids (used if data-action isn't present)
const KEYWORD_MAP = {
  gmail: "gmail.send",
  mail: "gmail.send",
  slack: "slack.post",
  whatsapp: "whatsapp.send",
  calendar: "calendar.create",
  docs: "docs.generate",
};

// Only Gmail is enabled for now; others are WIP
const ENABLED = new Set(["gmail.send"]);
const IN_PROGRESS = new Set(["slack.post", "whatsapp.send", "calendar.create", "docs.generate"]);

// Walk up the DOM; ignore any area annotated as data-ignore-actions="true"
function nearestActionElement(start) {
  let el = start;
  while (el) {
    if (el.dataset?.ignoreActions === "true") return null; // inside Playground, bail out
    if (el.dataset?.action) return el;
    if (el.tagName === "BUTTON" || el.getAttribute?.("role") === "button") return el;
    el = el.parentElement;
  }
  return null;
}

function inferActionId(el) {
  const explicit = el?.dataset?.action?.trim();
  if (explicit) return explicit;

  const raw = (el?.innerText || el?.textContent || "").toLowerCase();
  for (const key of Object.keys(KEYWORD_MAP)) {
    if (raw.includes(key)) return KEYWORD_MAP[key];
  }
  // Default: treat first word as a tool (no-op since not enabled)
  const first = (raw.split(/\s+/)[0] || "tool").replace(/\W+/g, "");
  return `${first}.run`;
}

export default function ActionBridge({ children }) {
  const router = useRouter();

  const onClickCapture = async (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const el = nearestActionElement(e.target);
    if (!el) return; // not actionable, or inside ignored zone

    const action = inferActionId(el);

    // In-progress or not enabled: do nothing (no popups/toasts)
    if (IN_PROGRESS.has(action) || !ENABLED.has(action)) {
      e.preventDefault();
      return;
    }

    // Gmail: silent backend call (dry-run for safety)
    e.preventDefault();
    try {
      const result = await callBackend(action, {
        payload: { ui: "multi-channel", dry_run: true },
        method: "POST",
        query: { dry_run: "1" },
      });

      if (!result.ok) {
        // Keep it invisible to users; log so you can diagnose locally
        console.warn("Backend call failed:", result.error);
        return;
      }

      // Success: intentionally no UI chrome as requested
      // If you ever want a subtle tick on the button, we can add it here.
    } catch (err) {
      console.warn("Unexpected error calling backend:", err);
    }
  };

  return <div onClickCapture={onClickCapture}>{children}</div>;
}
