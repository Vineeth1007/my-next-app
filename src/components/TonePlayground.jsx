// src/components/TonePlayground.jsx
import React from "react";
import {
  Sparkles,
  Mail,
  Slack,
  MessageCircle,
  Play,
  RotateCcw,
  Copy,
} from "lucide-react";

const PLATFORMS = [
  { id: "gmail", label: "Gmail", icon: Mail },
  { id: "slack", label: "Slack", icon: Slack },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "other", label: "Other", icon: Sparkles },
];

const TONES = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "concise", label: "Concise" },
];

function gmailTransform({ text, tone }) {
  const clean = text.trim();
  if (!clean) return "";

  const headerLine = (s) => s.replace(/\s+/g, " ").trim();
  const summarize = (s, max = 500) =>
    s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";

  const subject = headerLine(clean.split(/\n|\. /)[0]).replace(
    /^\W+|\W+$/g,
    ""
  );
  const body =
    tone === "concise"
      ? `${summarize(clean)}\n\nRegards,\n—`
      : tone === "friendly"
      ? `Hi there,\n\n${clean}\n\nThanks!\n—`
      : `Hello,\n\n${clean}\n\nBest regards,\n—`;

  return `Subject: ${subject}\n\n${body}`;
}

function wipMessage(platform) {
  const nice =
    platform === "slack"
      ? "Slack"
      : platform === "whatsapp"
      ? "WhatsApp"
      : "This";
  const bullets =
    platform === "slack"
      ? [
          "Thread-aware formatting",
          "Mentions & code blocks",
          "Channel-safe tone presets",
        ]
      : [
          "Quick replies with tone",
          "Media-safe formatting",
          "Contact-aware suggestions",
        ];

  return [
    `${nice} integration is in progress 🚧`,
    "",
    "You’ll soon preview platform-perfect replies here:",
    ...bullets.map((b) => `• ${b}`),
    "",
    "Thanks for your patience!",
  ].join("\n");
}

export default function TonePlayground() {
  const [platform, setPlatform] = React.useState("gmail");
  const [tone, setTone] = React.useState("professional");
  const [text, setText] = React.useState("");
  const [output, setOutput] = React.useState(""); // what shows in Preview
  const [runsLeft, setRunsLeft] = React.useState(4); // 4 tries per load for Gmail
  const [loading, setLoading] = React.useState(false);

  // Tell ActionBridge to ignore everything inside this section
  const containerProps = { "data-ignore-actions": "true" };

  // Platform switch → set preview appropriately
  React.useEffect(() => {
    if (platform === "gmail") {
      setOutput("Press ▶ Play to generate a Gmail-formatted preview.");
    } else if (platform === "slack") {
      setOutput(wipMessage("slack"));
    } else if (platform === "whatsapp") {
      setOutput(wipMessage("whatsapp"));
    } else {
      setOutput(
        "Other platforms will follow the same behavior rules once enabled."
      );
    }
  }, [platform]);

  const onPlay = async () => {
    if (runsLeft <= 0) return;
    setLoading(true);
    try {
      // Send what the user typed + the current platform/tone
      const res = await callBackend("playground.generate", {
        payload: { platform, tone, text },
        method: "POST",
      });

      if (res?.ok && res?.data?.output) {
        setOutput(res.data.output);
        setRunsLeft((n) => Math.max(0, n - 1));
      } else {
        // Fallback to the existing local Gmail transform for now
        if (platform === "gmail") {
          const next = gmailTransform({ text, tone });
          setOutput(next || "Type something, then press ▶ Play.");
          setRunsLeft((n) => Math.max(0, n - 1));
        } else {
          setOutput(
            res?.error || "Backend unreachable. Try Gmail preview or retry."
          );
        }
      }
    } catch (err) {
      setOutput(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const onResetRuns = () => setRunsLeft(4);

  const copyPreview = async () => {
    try {
      await navigator.clipboard.writeText(output || "");
    } catch {}
  };

  return (
    <section {...containerProps} className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Sparkles size={16} />
        <span className="font-medium">Tone Playground</span>
        <span>• Type a request and preview platform-specific replies.</span>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {PLATFORMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setPlatform(id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
              platform === id
                ? "bg-gray-900 text-white"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
        <div className="mx-2 h-5 w-px bg-gray-200" />
        {TONES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTone(id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
              tone === id
                ? "bg-gray-900 text-white"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
        {platform === "gmail" && (
          <div className="ml-auto flex items-center gap-3 text-xs text-gray-600">
            <span>
              Runs left:{" "}
              <span className={runsLeft ? "text-green-700" : "text-red-600"}>
                {runsLeft}
              </span>
              /4
            </span>
            <button
              onClick={onResetRuns}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-1 hover:bg-gray-50"
              title="Reset counter"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        )}
      </div>

      {/* Editor + Preview */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="rounded-2xl border p-3 relative">
          <label className="text-sm font-medium text-gray-600">Your text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Summarize this week’s progress and propose next steps…"
            rows={12}
            className="mt-2 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 pr-12"
          />
          {/* Play button (Gmail only) */}
          <button
            onClick={onPlay}
            disabled={platform !== "gmail" || runsLeft <= 0 || loading}
            className={`absolute bottom-3 right-3 inline-flex items-center justify-center rounded-full border bg-white px-3 py-2 text-sm shadow-sm ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <Play size={16} />
            <span className="ml-1">{loading ? "Running..." : "Play"}</span>
          </button>

          <div className="mt-2 text-xs text-gray-500">
            {platform === "gmail"
              ? "Press ▶ Play to generate a preview. You can try up to 4 times."
              : "Preview generation is coming soon for this platform."}
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-2xl border p-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-600">Preview</label>
            <button
              onClick={copyPreview}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs hover:bg-white"
              title="Copy preview"
            >
              <Copy size={14} /> Copy
            </button>
          </div>
          <pre className="mt-2 h-[290px] overflow-auto rounded-xl bg-gray-900 text-gray-100 p-3 text-[13px] leading-6 whitespace-pre-wrap">
            {output}
          </pre>
          <div className="mt-1 text-xs text-gray-500">
            Currently, only <b>Gmail</b> preview is active. Slack, WhatsApp, and
            other platforms will follow the same behavior rules once enabled.
          </div>
        </div>
      </div>
    </section>
  );
}
