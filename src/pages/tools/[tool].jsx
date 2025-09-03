// src/pages/tools/[tool].jsx
import React, { useMemo, useState } from "react";
import { useRouter } from "next/router";
import WorkflowPlayer from "@/components/WorkflowPlayer";
import { callBackend } from "@/lib/backend";

export default function ToolPage() {
  const router = useRouter();
  const tool = String(router.query.tool || "unknown");
  const action = `${tool}.run`;
  const [open, setOpen] = useState(true);
  const [status, setStatus] = useState("running");
  const [preview, setPreview] = useState("");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await callBackend(action, { payload: { tool } });
        if (!cancelled) {
          setPreview(JSON.stringify(res.data, null, 2));
          setStatus("success");
        }
      } catch (e) {
        if (!cancelled) {
          setPreview(String(e.message || e));
          setStatus("error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [action, tool]);

  const steps = useMemo(() => ([
    { title: "Prepare", detail: `Initializing ${tool}`, icon: undefined },
    { title: "Call Backend", detail: `POST /${tool}/run`, icon: undefined },
    { title: "Process", detail: "Parsing + executing task", icon: undefined },
    { title: "Result", detail: "Render video-style walkthrough", icon: undefined },
  ]), [tool]);

  return (
    <div className="min-h-screen w-full bg-white">
      {/* Keep page minimal; open the player immediately */}
      {open && (
        <WorkflowPlayer
          action={action}
          status={status}
          steps={steps}
          responsePreview={preview}
          onClose={() => setOpen(false)}
        />
      )}
      {!open && (
        <div className="p-8">
          <h1 className="text-2xl font-semibold">Finished: {tool}</h1>
          <p className="text-gray-600 mt-2">You can close this tab.</p>
        </div>
      )}
    </div>
  );
}
