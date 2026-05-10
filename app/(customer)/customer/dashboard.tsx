"use client";

import { useState } from "react";
import { CheckCircle2, Briefcase, PlusCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { TabPostJob } from "./tabs/tab-post-job";
import { TabMyJobs } from "./tabs/tab-my-jobs";
import { TabCustomerCompleted } from "./tabs/tab-completed";

type TabKey = "post" | "jobs" | "completed";

const TABS: ReadonlyArray<{
  key: TabKey;
  label: string;
  Icon: typeof Search;
}> = [
  { key: "post", label: "Post a Job", Icon: PlusCircle },
  { key: "jobs", label: "My Jobs", Icon: Briefcase },
  { key: "completed", label: "Completed", Icon: CheckCircle2 },
];

export function CustomerDashboard({ customerName }: { customerName: string }) {
  const [tab, setTab] = useState<TabKey>("post");
  const [refreshKey, setRefreshKey] = useState(0);

  function bumpAndSwitch(key: TabKey) {
    setTab(key);
    setRefreshKey((k) => k + 1);
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-h1-mobile font-bold text-foreground md:text-h1">
          Welcome back, {customerName.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Post jobs, hire drivers, and track everything in one place.
        </p>
      </header>

      <nav
        role="tablist"
        aria-label="Customer dashboard sections"
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
        {tab === "post" && (
          <TabPostJob
            onPosted={() => bumpAndSwitch("jobs")}
          />
        )}
        {tab === "jobs" && <TabMyJobs key={refreshKey} />}
        {tab === "completed" && <TabCustomerCompleted key={refreshKey} />}
      </section>
    </main>
  );
}
