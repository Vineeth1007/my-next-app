import React, { useMemo, useState, useEffect } from "react";
import TonePlayground from "@/components/TonePlayground";
import Link from "next/link";
import {
  Mail,
  Slack,
  MessageCircle,
  Sparkles,
  Shield,
  Rocket,
  Plug,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Code2,
  ArrowRight,
  ArrowDown,
  Workflow,
  Fingerprint,
  Gauge,
  Layout,
  Settings2,
  Boxes,
  Activity,
  HelpCircle,
  TerminalSquare,
  ArrowUpRight,
  Lock,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";

/***********************************
 * Multi‑Platform AI — Full Experience
 * Sections: Hero, Integrations, How it Works,
 * Presets, Playground, Use Cases, Roadmap,
 * Core Rules, FAQ, CTA
 ***********************************/

// --- Platform presets
const PLATFORM_META = {
  gmail: {
    name: "Gmail",
    icon: Mail,
    tone: "Professional, well‑structured, polite",
    bullets: [
      "Clear subject line, greeting, and signature",
      "Structured paragraphs and courteous language",
      "Best for formal or work‑related communication",
    ],
    active: true,
  },
  slack: {
    name: "Slack",
    icon: Slack,
    tone: "Concise, collaborative, semi‑formal",
    bullets: [
      "Short sentences with bullet points",
      "Action items and quick next steps",
      "Skip formal greetings; sound like a teammate",
    ],
    active: false,
  },
  whatsapp: {
    name: "WhatsApp",
    icon: MessageCircle,
    tone: "Casual, friendly, conversational",
    bullets: [
      "Short messages and natural flow",
      "Emojis where suitable",
      "Direct and quick answers",
    ],
    active: false,
  },
  other: {
    name: "Other Platforms",
    icon: Plug,
    tone: "Adapt to the culture of the platform",
    bullets: [
      "Mirror platform norms and etiquette",
      "Stay accurate and helpful",
      "Adjust tone flexibly",
    ],
    active: false,
  },
};

function formatReply({ platform, prompt, sender = "Avery" }) {
  const trimmed = prompt.trim();
  const subject = (() => {
    const max = 8;
    const words = trimmed
      .replace(/\n+/g, " ")
      .split(/\s+/)
      .slice(0, max)
      .join(" ");
    return words
      ? `${words}${trimmed.split(/\s+/).length > max ? "…" : ""}`
      : "Follow‑up";
  })();

  if (platform === "gmail") {
    return (
      `Subject: ${subject}\n\n` +
      `Hi Team,\n\n` +
      `Thanks for the update. Here are the next steps based on your message:\n\n` +
      `• Review the latest details and confirm requirements.\n` +
      `• Draft the initial plan and share by EOD tomorrow.\n` +
      `• Call out blockers or risks early.\n\n` +
      `Please let me know if you would like me to adjust the timeline or add more context.\n\n` +
      `Best regards,\n` +
      `${sender}`
    );
  }
  if (platform === "slack") {
    return (
      `Quick takeaways:` +
      `\n• Reviewed your note` +
      `\n• Draft plan coming up` +
      `\n• Flag blockers ASAP` +
      `\n\nNext steps:` +
      `\n1) Confirm scope` +
      `\n2) Share draft by EOD tomorrow` +
      `\n3) Track risks in the thread`
    );
  }
  if (platform === "whatsapp") {
    return (
      `Got it! I’ll prep a quick draft and share tmrw. ` +
      `If anything’s urgent, ping me here 👍. ` +
      `We’ll keep it simple + fast.\n\n` +
      `Next: confirm scope, share draft, call out blockers. 😊`
    );
  }
  return (
    `I’ll adapt to this platform’s norms while staying accurate and helpful. ` +
    `Plan: confirm scope, share a draft, and surface blockers early.`
  );
}

// UI primitives
function Badge({ children, intent = "neutral" }) {
  const map = {
    success: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    warn: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
    neutral: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    info: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${map[intent]}`}
    >
      {children}
    </span>
  );
}
function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/70 shadow-sm backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}
function SectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-semibold leading-tight text-slate-900 md:text-3xl">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-slate-600">{subtitle}</p>}
    </div>
  );
}
function AnimatedInView({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}

// Smooth hash-scroll
function useSmoothScroll() {
  useEffect(() => {
    const handler = (e) => {
      const t = e.target.closest('a[href^="#"]');
      if (!t) return;
      const id = t.getAttribute("href").slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);
}

// Main
export function MultiChannelBehavior() {
  useSmoothScroll();

  // Separate selections for each section
  const [platformPresets, setPlatformPresets] = useState("gmail");
  const [platformPlayground, setPlatformPlayground] = useState("gmail");
  const [input, setInput] = useState(
    "Summarize this week’s progress and propose next steps for the integration."
  );

  // NEW: explicit generate snapshot state
  const [generatedPreview, setGeneratedPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const previewPresets = useMemo(
    () => formatReply({ platform: platformPresets, prompt: input }),
    [platformPresets, input]
  );
  const previewPlayground = useMemo(
    () => formatReply({ platform: platformPlayground, prompt: input }),
    [platformPlayground, input]
  );

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const r = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: input, platform: platformPlayground }),
      });

      const ct = r.headers.get("content-type") || "";
      const payload = ct.includes("application/json")
        ? await r.json()
        : { error: await r.text() };

      if (!r.ok) throw new Error(payload?.error || `HTTP ${r.status}`);
      setGeneratedPreview(payload.preview || "");
    } catch (err) {
      setGeneratedPreview(`(Failed to generate)\n${String(err)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const tabs = [
    { key: "gmail", label: "Gmail", meta: PLATFORM_META.gmail },
    { key: "slack", label: "Slack", meta: PLATFORM_META.slack },
    { key: "whatsapp", label: "WhatsApp", meta: PLATFORM_META.whatsapp },
    { key: "other", label: "Other", meta: PLATFORM_META.other },
  ];
  const heroGradient = "bg-gradient-to-b from-indigo-50 via-white to-white";

  return (
    <div className={`min-h-screen ${heroGradient} text-slate-800`}>
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="#top" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Sparkles size={18} />
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              Nexa AI
            </span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a href="#integrations" className="hover:text-slate-900">
              Integrations
            </a>
            <a href="#how" className="hover:text-slate-900">
              How it Works
            </a>
            <a href="#presets" className="hover:text-slate-900">
              Presets
            </a>
            <a href="#playground" className="hover:text-slate-900">
              Playground
            </a>
            <a href="#usecases" className="hover:text-slate-900">
              Use Cases
            </a>
            <a href="#roadmap" className="hover:text-slate-900">
              Roadmap
            </a>
            <a href="#faq" className="hover:text-slate-900">
              FAQ
            </a>
            <a
              href="#cta"
              className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-white"
            >
              <ArrowUpRight size={14} />
              Get Started
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2">
          <AnimatedInView>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Natural, platform‑aware AI conversations
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Integrate once, speak natively everywhere. The AI adapts tone,
              style, and format per channel— professional emails in Gmail,
              concise collaboration in Slack, and friendly chats on WhatsApp.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#playground"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Try the Tone Playground <ArrowRight size={16} />
              </a>
              <div className="flex items-center gap-2">
                <Badge intent="success">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Gmail
                </Badge>
                <Badge intent="warn">
                  <Clock className="mr-1 h-3 w-3" /> Slack
                </Badge>
                <Badge intent="warn">
                  <Clock className="mr-1 h-3 w-3" /> WhatsApp
                </Badge>
              </div>
            </div>
          </AnimatedInView>

          <AnimatedInView delay={0.1}>
            {/* INSERTED mini video demo */}
            <PromptTypeDemo className="mb-4" />
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-slate-900 p-2 text-white">
                  <Code2 size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Behavior Rules (Modular)
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Plug‑and‑play tone presets per platform. Extend without
                    rewrites.
                  </p>
                </div>
              </div>
              <pre className="mt-4 overflow-auto rounded-xl bg-slate-900 p-4 text-[11px] leading-relaxed text-slate-100">
                {`const behavior = {
  gmail: { tone: "professional", format: "email" },
  slack: { tone: "concise", format: "bullets" },
  whatsapp: { tone: "casual", format: "chat" },
  other: { tone: "adaptive", format: "flex" },
};`}
              </pre>
              <div className="mt-3 text-xs text-slate-500">
                Currently, only{" "}
                <span className="font-semibold text-slate-700">
                  Gmail integration
                </span>{" "}
                is active. Slack, WhatsApp, and others will follow the same
                behavior rules once enabled.
              </div>
            </Card>
          </AnimatedInView>
        </div>
        <div className="flex justify-center pb-8">
          <ArrowDown className="animate-bounce text-slate-400" />
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="mx-auto max-w-6xl px-4 py-12">
        <SectionTitle
          eyebrow="Integrations"
          title="Connect your channels"
          subtitle="Start with Gmail today; Slack and WhatsApp are on deck. Add more with minimal config."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <AnimatedInView>
            <IntegrationCard
              icon={Mail}
              title="Gmail"
              status={
                <Badge intent="success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active
                </Badge>
              }
            >
              Professional email composition, threading, signatures, and polite
              tone built‑in.
            </IntegrationCard>
          </AnimatedInView>
          <AnimatedInView delay={0.05}>
            <IntegrationCard
              icon={Slack}
              title="Slack"
              status={
                <Badge intent="warn">
                  <Clock className="h-3.5 w-3.5" /> Coming Soon
                </Badge>
              }
            >
              Concise updates, bullets, action items, and teammate‑friendly
              replies.
            </IntegrationCard>
          </AnimatedInView>
          <AnimatedInView delay={0.1}>
            <IntegrationCard
              icon={MessageCircle}
              title="WhatsApp"
              status={
                <Badge intent="warn">
                  <Clock className="h-3.5 w-3.5" /> Coming Soon
                </Badge>
              }
            >
              Casual, friendly tone with short messages, natural flow, and
              optional emojis.
            </IntegrationCard>
          </AnimatedInView>
        </div>
      </section>

      {/* How it Works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-12">
        <SectionTitle
          eyebrow="How it Works"
          title="From prompt to platform‑perfect reply"
          subtitle="A clean pipeline keeps behavior consistent, adaptive, and scalable."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-4">
          <AnimatedInView>
            <HowStep
              icon={Workflow}
              title="Intent Parse"
              desc="Ingest user input, infer goal, entities, and constraints."
            />
          </AnimatedInView>
          <AnimatedInView delay={0.05}>
            <HowStep
              icon={Fingerprint}
              title="Platform Preset"
              desc="Select tone + format rules by channel (email, bullets, chat)."
            />
          </AnimatedInView>
          <AnimatedInView delay={0.1}>
            <HowStep
              icon={Settings2}
              title="Compose"
              desc="Assemble content with structure: subject lines, bullets, signatures."
            />
          </AnimatedInView>
          <AnimatedInView delay={0.15}>
            <HowStep
              icon={Gauge}
              title="Polish"
              desc="Apply brevity, clarity, and etiquette checks before sending."
            />
          </AnimatedInView>
        </div>
        <AnimatedInView delay={0.2}>
          <Card className="mt-6 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-slate-900 p-2 text-white">
                <TerminalSquare size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  Config‑first design
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Extend to new platforms by adding a small preset. No rewrites.
                </p>
                <pre className="mt-4 overflow-auto rounded-xl bg-slate-900 p-4 text-[11px] leading-relaxed text-slate-100">
                  {`export const PRESETS = {
  gmail: { greeting: true, signature: true, structure: "paragraphs", tone: "professional" },
  slack: { greeting: false, bullets: true, structure: "bulleted", tone: "concise" },
  whatsapp: { greeting: false, emojis: true, structure: "chatty", tone: "friendly" },
};`}
                </pre>
              </div>
            </div>
          </Card>
        </AnimatedInView>
      </section>

      {/* Presets / Behavior Across Platforms */}
      <section id="presets" className="mx-auto max-w-6xl px-4 py-12">
        <SectionTitle
          eyebrow="Behavior Across Platforms"
          title="One brain. Many voices."
          subtitle="The AI adjusts voice, structure, and formatting to match each channel’s norms."
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tabs.map((t, idx) => (
            <AnimatedInView key={t.key} delay={idx * 0.05}>
              <PlatformCard
                meta={t.meta}
                isActive={platformPresets === t.key}
                onSelect={() => setPlatformPresets(t.key)}
              />
            </AnimatedInView>
          ))}
        </div>
      </section>

      {/* Playground */}
      <section id="playground" className="mx-auto max-w-6xl px-4 py-12">
        <AnimatedInView>
          <SectionTitle
            eyebrow="Playground"
            title="Try the tone engine"
            subtitle="Type a request and preview platform-specific replies in real time."
          />
        </AnimatedInView>

        <AnimatedInView delay={0.05}>
          <Card className="mt-6 p-5">
            <div className="flex flex-col gap-5 md:flex-row">
              {/* LEFT */}
              <div className="w-full md:w-1/2">
                <p className="text-sm font-medium text-slate-700">
                  Tone Playground
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Type the context. Pick a platform. Click{" "}
                  <strong>Generate</strong> to update the preview on the right.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {tabs.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setPlatformPlayground(t.key)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition  ${
                        platformPlayground === t.key
                          ? "bg-indigo-600 text-white ring-indigo-600"
                          : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50"
                      }`}
                      aria-pressed={platformPlayground === t.key}
                    >
                      <t.meta.icon className="h-3.5 w-3.5" /> {t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  className="mt-4 h-40 w-full rounded-xl border border-slate-300 bg-white/70 p-3 text-sm shadow-inner outline-none transition focus:ring-2 focus:ring-indigo-200"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe the email/message you want (context only)"
                />

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isGenerating ? (
                      <>
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Generate
                      </>
                    )}
                  </button>

                  {generatedPreview && (
                    <button
                      onClick={() => setGeneratedPreview(null)}
                      className="text-xs rounded-xl border border-slate-300 px-3 py-1.5 transition hover:bg-slate-50"
                      title="Clear snapshot and return to live mode"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* RIGHT */}
              <div className="w-full md:w-1/2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">Preview</p>
                  <button
                    onClick={() => {
                      const textToCopy = generatedPreview ?? previewPlayground;
                      navigator.clipboard.writeText(textToCopy);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1200);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-slate-800"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>

                <pre className="mt-3 h-56 w-full overflow-auto rounded-xl bg-slate-900 p-4 text-[12px] leading-relaxed text-slate-100">
                  {generatedPreview ?? previewPlayground}
                </pre>

                <p className="mt-3 text-xs text-slate-500">
                  Live preview updates as you type. Clicking{" "}
                  <strong>Generate</strong> takes a snapshot; use <em>Reset</em>{" "}
                  to go back to live mode.
                </p>
              </div>
            </div>
          </Card>
        </AnimatedInView>
      </section>

      {/* Use Cases */}
      <section id="usecases" className="mx-auto max-w-6xl px-4 py-12">
        <SectionTitle
          eyebrow="Use Cases"
          title="Where it shines"
          subtitle="Quickly adapt communication for teams, customers, and operations."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <AnimatedInView>
            <UseCase
              icon={Layout}
              title="Customer Support"
              desc="Resolve tickets via Gmail while posting succinct Slack updates."
            />
          </AnimatedInView>
          <AnimatedInView delay={0.05}>
            <UseCase
              icon={Boxes}
              title="Project Updates"
              desc="Summaries in Slack threads; formal weekly recaps over email."
            />
          </AnimatedInView>
          <AnimatedInView delay={0.1}>
            <UseCase
              icon={Activity}
              title="Incident Response"
              desc="Rapid WhatsApp coordination; email post‑mortems with structured actions."
            />
          </AnimatedInView>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="mx-auto max-w-6xl px-4 py-12">
        <SectionTitle
          eyebrow="Roadmap"
          title="What’s next"
          subtitle="Thoughtful, incremental rollouts with quality gates."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <AnimatedInView>
            <RoadmapCard
              stage="Now"
              title="Gmail GA"
              points={["Threading", "Smart subject lines", "Signature blocks"]}
              badge={
                <Badge intent="success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Live
                </Badge>
              }
            />
          </AnimatedInView>
          <AnimatedInView delay={0.05}>
            <RoadmapCard
              stage="Next"
              title="Slack Beta"
              points={["Bulleted replies", "Action items", "Thread etiquette"]}
              badge={
                <Badge intent="warn">
                  <Clock className="h-3.5 w-3.5" /> Beta Q&A
                </Badge>
              }
            />
          </AnimatedInView>
          <AnimatedInView delay={0.1}>
            <RoadmapCard
              stage="Soon"
              title="WhatsApp Pilot"
              points={["Casual tone", "Emoji policy", "Quick reply mode"]}
              badge={
                <Badge intent="warn">
                  <Clock className="h-3.5 w-3.5" /> Pilot
                </Badge>
              }
            />
          </AnimatedInView>
        </div>
      </section>

      {/* Principles / Core Rules */}
      <section id="principles" className="mx-auto max-w-6xl px-4 py-12">
        <SectionTitle
          eyebrow="Core Rules"
          title="Consistency, Adaptability, Scalability—without one‑size‑fits‑all"
          subtitle="Accurate and aligned with user intent across platforms, with modular behaviors for quick expansion."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <RuleCard
            icon={Shield}
            title="Consistency"
            desc="Always accurate and aligned with intent regardless of channel."
          />
          <RuleCard
            icon={Rocket}
            title="Adaptability"
            desc="Switch tone and format based on platform context."
          />
          <RuleCard
            icon={Plug}
            title="Scalability"
            desc="Add new platforms via small, modular presets."
          />
          <RuleCard
            icon={Sparkles}
            title="No One‑Size‑Fits‑All"
            desc="Tailor the style; never reuse the same reply everywhere."
          />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-4 py-12">
        <SectionTitle
          eyebrow="FAQ"
          title="You’ve got questions"
          subtitle="Short, transparent answers."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <FAQ
            q="Is Gmail the only active integration?"
            a="Yes. Slack, WhatsApp, and others will follow the same behavior rules once enabled."
          />
          <FAQ
            q="How do presets scale to new platforms?"
            a="Add a compact config (tone, format, etiquette). The composer applies it without code rewrites."
          />
          <FAQ
            q="How do you keep replies safe and compliant?"
            a="We honor channel etiquette and filter outputs for clarity, respect, and privacy. Enterprise policies can be layered in."
          />
          <FAQ
            q="Can I customize tone further?"
            a="Yes—override any preset field, or create a new one for your platform."
          />
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="mx-auto max-w-6xl px-4 pb-16">
        <AnimatedInView>
          <Card className="relative overflow-hidden p-8 md:p-10">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  Build once. Speak natively everywhere.
                </h3>
                <p className="mt-1 text-slate-600">
                  Start with Gmail today and be ready for Slack and WhatsApp
                  tomorrow.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Launch Playground — use Next Link only (no outer <a>) */}
                <a
                  href="#playground"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  <span>Launch Playground</span>
                  <ArrowRight size={16} />
                </a>

                {/* Same-page anchor is fine to keep as a plain <a> */}
                <a
                  href="#integrations"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  View Integrations <Plug size={16} />
                </a>
              </div>
            </div>
          </Card>
        </AnimatedInView>
      </section>

      {/* Footer */}
      <footer className="mt-6 border-t border-slate-200/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 md:flex-row">
          <p className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> © {new Date().getFullYear()} Nexa AI.
            All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Gmail Active
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Slack & WhatsApp Coming Soon
            </span>
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" /> Privacy‑first
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * PromptTypeDemo — “video‑like” micro demo:
 * 1) types a prompt
 * 2) shows a generating status + reply
 * 3) shrinks/parks as a corner preview (curiosity hook)
 */
function PromptTypeDemo({ className = "" }) {
  const script = "Write a crisp weekly update email with next steps.";
  const [typed, setTyped] = useState("");
  const [step, setStep] = useState("typing"); // typing -> reveal -> shrink

  useEffect(() => {
    if (step !== "typing") return;
    let i = 0;
    const id = setInterval(() => {
      setTyped(script.slice(0, i + 1));
      i++;
      if (i >= script.length) {
        clearInterval(id);
        setTimeout(() => setStep("reveal"), 600);
      }
    }, 22);
    return () => clearInterval(id);
  }, [step]);

  useEffect(() => {
    if (step === "reveal") {
      const t = setTimeout(() => setStep("shrink"), 1200);
      return () => clearTimeout(t);
    }
  }, [step]);

  return (
    <div className={`relative h-64 w-full ${className}`}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative h-full w-full overflow-visible"
      >
        <motion.div
          className="absolute left-0 top-0 w-full"
          animate={
            step === "shrink"
              ? { scale: 0.6, x: "34%", y: "-8%" }
              : { scale: 1, x: 0, y: 0 }
          }
          transition={{ type: "spring", stiffness: 140, damping: 18 }}
        >
          {/* Prompt input */}
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Prompt
            </div>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-inner">
              <span className="truncate">{typed}</span>
              {step === "typing" && (
                <span className="ml-1 inline-block h-4 w-[2px] animate-pulse bg-slate-800" />
              )}
            </div>
          </div>

          {/* Generating status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: step !== "typing" ? 1 : 0 }}
            className="mt-3 flex items-center gap-2 text-xs text-slate-500"
          >
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-indigo-600" />{" "}
            Generating…
          </motion.div>

          {/* Reply preview */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: step !== "typing" ? 1 : 0, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-md backdrop-blur"
          >
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Preview (Gmail)
            </div>
            <pre className="mt-2 max-h-36 overflow-hidden rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">{`Subject: Weekly Update — Integrations

Hi Team,
Here’s a quick summary and next steps:
• Gmail: GA, stable
• Slack: bullets prototype
• WhatsApp: tone pilot

Best,
Avery`}</pre>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Subcomponents
function PlatformCard({ meta, isActive, onSelect }) {
  const Icon = meta.icon;
  return (
    <button
      onClick={onSelect}
      className={`text-left transition ${
        isActive ? "scale-[1.01]" : "hover:scale-[1.01]"
      }`}
    >
      <Card
        className={`h-full p-5 ${
          isActive ? "ring-2 ring-indigo-500" : "ring-1 ring-transparent"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`rounded-xl p-2 ${
              isActive
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            <Icon size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{meta.name}</p>
            <p className="mt-1 text-xs text-slate-500">{meta.tone}</p>
          </div>
        </div>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {meta.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </Card>
    </button>
  );
}
function RuleCard({ icon: Icon, title, desc }) {
  return (
    <AnimatedInView>
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-900 p-2 text-white">
            <Icon size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-sm text-slate-600">{desc}</p>
          </div>
        </div>
      </Card>
    </AnimatedInView>
  );
}
function IntegrationCard({ icon: Icon, title, status, children }) {
  return (
    <Card className="h-full p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-slate-900 p-2 text-white">
          <Icon size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <div className="mt-1">{status}</div>
          <p className="mt-3 text-sm text-slate-600">{children}</p>
        </div>
      </div>
    </Card>
  );
}
function HowStep({ icon: Icon, title, desc }) {
  return (
    <Card className="h-full p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-slate-900 p-2 text-white">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{desc}</p>
        </div>
      </div>
    </Card>
  );
}
function UseCase({ icon: Icon, title, desc }) {
  return (
    <Card className="h-full p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-slate-900 p-2 text-white">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{desc}</p>
        </div>
      </div>
    </Card>
  );
}
function RoadmapCard({ stage, title, points, badge }) {
  return (
    <Card className="h-full p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {stage}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{title}</p>
        </div>
        {badge}
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {points.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </Card>
  );
}
function FAQ({ q, a }) {
  return (
    <AnimatedInView>
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-slate-900 p-2 text-white">
            <HelpCircle size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{q}</p>
            <p className="mt-1 text-sm text-slate-600">{a}</p>
          </div>
        </div>
      </Card>
    </AnimatedInView>
  );
  <TonePlayground />;
}
