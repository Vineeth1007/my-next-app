// src/pages/index.jsx
import React from "react";
import { MultiChannelBehavior } from "../components/MultiChannelBehavior";
import ActionBridge from "@/components/ActionBridge";
// import "@/styles/global.css";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <ActionBridge>
        <MultiChannelBehavior />
      </ActionBridge>
    </main>
  );
}
