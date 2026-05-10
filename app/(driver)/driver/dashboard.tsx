"use client";

import { useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/constants/enums";
import { TabBrowseJobs } from "./tabs/tab-browse-jobs";
import { TabApplications } from "./tabs/tab-applications";
import { TabActiveJobs } from "./tabs/tab-active-jobs";
import { TabCompletedJobs } from "./tabs/tab-completed-jobs";

type TabKey = "browse" | "applications" | "active" | "completed";

const TABS: ReadonlyArray<{
  key: TabKey;
  label: string;
  Icon: typeof Search;
}> = [
  { key: "browse", label: "Browse Jobs", Icon: Search },
  { key: "applications", label: "My Applications", Icon: ClipboardList },
  { key: "active", label: "Active", Icon: Briefcase },
  { key: "completed", label: "Completed", Icon: CheckCircle2 },
];

export function DriverDashboard({
  driverName,
  driverLanguages,
}: {
  driverName: string;
  driverLanguages: Language[];
}) {
  const [tab, setTab] = useState<TabKey>("browse");

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1-mobile font-bold text-foreground md:text-h1">
          Welcome back, {driverName.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Find jobs, manage applications, and track your work in one place.
        </p>
      </header>

      <nav
        role="tablist"
        aria-label="Driver dashboard sections"
        className="sticky top-16 z-10 -mx-4 flex gap-1 overflow-x-auto border-b border-border bg-background/90 px-4 backdrop-blur md:mx-0 md:rounded-lg md:border md:bg-card md:px-2 md:py-1.5"
      >
        {TABS.map(({ key, label, Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 px-3 py-2.5 text-sm font-semibold transition-colors md:rounded-md md:px-4",
                active
                  ? "border-b-2 border-primary text-primary md:border-b-0 md:bg-primary md:text-primary-foreground"
                  : "border-b-2 border-transparent text-muted-foreground hover:text-foreground md:border-b-0 md:hover:bg-muted",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </nav>

      <section role="tabpanel" className="flex flex-col gap-4">
        {tab === "browse" && <TabBrowseJobs driverLanguages={driverLanguages} />}
        {tab === "applications" && <TabApplications />}
        {tab === "active" && <TabActiveJobs />}
        {tab === "completed" && <TabCompletedJobs />}
      </section>
    </main>
  );
}
