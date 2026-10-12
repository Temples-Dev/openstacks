import * as Tabs from "@radix-ui/react-tabs";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { fetchGatewayStatus } from "./lib/api";
import { cn } from "./lib/utils";

const SECTIONS = ["Dashboard", "Catalog", "Circulation", "Patrons"] as const;
type Section = (typeof SECTIONS)[number];

const SECTION_COPY: Record<Section, string> = {
  Dashboard: "Branch activity, overdue items, and holds land here.",
  Catalog: "MARC records, metadata search, and holdings land here.",
  Circulation: "Checkouts, returns, renewals, and fines land here.",
  Patrons: "Patron records and memberships land here.",
};

export default function App() {
  const [active, setActive] = useState<Section>("Dashboard");
  const [gateway, setGateway] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchGatewayStatus(controller.signal)
      .then((result) => setGateway(result.status))
      .catch(() => setGateway(null));
    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <Toaster />
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold tracking-tight">ShellNexa</h1>
          <p className="text-sm text-zinc-500" role="status">
            {gateway ? `Gateway ${gateway}` : "Connecting to gateway…"}
          </p>
        </div>
      </header>
      <Tabs.Root
        value={active}
        onValueChange={(value) => setActive(value as Section)}
        className="mx-auto max-w-6xl px-6 py-6"
      >
        <Tabs.List aria-label="Library sections" className="flex gap-1">
          {SECTIONS.map((section) => (
            <Tabs.Trigger
              key={section}
              value={section}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900",
                "data-[state=active]:bg-zinc-900 data-[state=active]:text-white",
              )}
            >
              {section}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {SECTIONS.map((section) => (
          <Tabs.Content key={section} value={section} className="py-6">
            <h2 className="text-lg font-medium">{section}</h2>
            <p className="mt-2 text-sm text-zinc-600">{SECTION_COPY[section]}</p>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
}
