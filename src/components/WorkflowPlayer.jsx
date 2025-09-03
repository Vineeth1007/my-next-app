// src/components/WorkflowPlayer.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, CheckCircle2, XCircle, Rocket, Sparkles, TerminalSquare, ArrowRight } from "lucide-react";

// Auto-generated, cinematic “video-style” playback (no manual videos).
// Feels like a video, plays like a video, but rendered with Framer Motion and DOM.
// You can reuse this on any page or in modals.

function typewriterFrames(text, chunk = 2, delay = 0.04) {
  const frames = [];
  for (let i = 0; i <= text.length; i += chunk) {
    frames.push({ t: i * delay, s: text.slice(0, i) });
  }
  return frames;
}

export default function WorkflowPlayer({
  action = "pipeline.run",
  status = "idle",          // "idle" | "running" | "success" | "error"
  steps = [],               // [{title, detail, icon}]
  responsePreview = "",     // string preview (e.g., backend response snippet)
  onClose,
}) {
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  // Default step script if not provided
  const program = useMemo(() => {
    if (steps.length) return steps;
    const nice = action.replace(/\./g, " · ");
    return [
      { title: "Parsing Intent", detail: `Understanding action: ${nice}`, icon: Sparkles },
      { title: "Routing", detail: "Selecting backend microservice", icon: ArrowRight },
      { title: "Executing", detail: "Running pipeline & applying rules", icon: TerminalSquare },
      { title: "Finalizing", detail: "Formatting output and sending back", icon: Rocket },
    ];
  }, [action, steps]);

  // “Playhead” animation
  useEffect(() => {
    if (!playing) return;
    let raf;
    const start = performance.now();
    const total = 4000 + program.length * 600;
    const loop = (now) => {
      const p = Math.min(1, (now - start) / total);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, program.length]);

  const pct = Math.round(progress * 100);

  const headline = useMemo(() => {
    const frames = typewriterFrames(`Running: ${action}`);
    const idx = Math.min(frames.length - 1, Math.floor(progress * frames.length));
    return frames[idx]?.s ?? "";
  }, [action, progress]);

  const StateIcon = status === "success" ? CheckCircle2 : status === "error" ? XCircle : Rocket;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <StateIcon className={status === "success" ? "text-green-600" : status === "error" ? "text-red-600" : "text-indigo-600"} />
            <div className="text-lg font-semibold">{headline || "…"}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPlaying((v) => !v)}
              className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
            >
              {playing ? <span className="inline-flex items-center gap-1"><Pause size={16}/>Pause</span> : <span className="inline-flex items-center gap-1"><Play size={16}/>Play</span>}
            </button>
            <button
              onClick={onClose}
              className="rounded-full border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <motion.div
              className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500">{pct}%</div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          {program.map((step, i) => {
            const active = progress >= (i / program.length);
            const Icon = step.icon || Sparkles;
            return (
              <motion.div
                key={i}
                className={`rounded-2xl border p-4 ${active ? "shadow-md" : "opacity-60"}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: active ? 1 : 0.6, y: active ? 0 : 10 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-center gap-3">
                  <Icon className={active ? "text-indigo-600" : "text-gray-400"} />
                  <div className="font-medium">{step.title}</div>
                </div>
                <div className="mt-1 text-sm text-gray-600">{step.detail}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Response preview */}
        <AnimatePresence>
          {responsePreview ? (
            <motion.pre
              className="mx-6 mb-6 rounded-2xl bg-gray-900 text-gray-100 p-4 text-xs overflow-auto"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
{responsePreview}
            </motion.pre>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
