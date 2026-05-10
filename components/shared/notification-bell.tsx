"use client";

import { Bell } from "lucide-react";
import * as Icons from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { EmptyState } from "@/components/ui/empty-state";
import { NotificationItemSkeleton } from "@/components/ui/skeleton-loaders";
import { useNotifications } from "@/contexts/NotificationContext";
import { NOTIFICATION_META } from "@/lib/constants/notifications";
import type { NotificationType } from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

function formatRelative(date: string | Date): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - then.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString();
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const meta = NOTIFICATION_META[type];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[meta.icon] ?? Bell;
  return <IconComponent className={cn("size-5", meta.color)} aria-hidden="true" />;
}

export function NotificationBell({ className }: { className?: string }) {
  const { notifications, unreadCount, loading, error, markAllRead } = useNotifications();

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"
            }
            className={cn("relative", className)}
          />
        }
      >
        <Bell className="size-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0">
        <SheetHeader className="border-b border-border">
          <div className="flex items-center justify-between gap-2">
            <div>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </SheetDescription>
            </div>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void markAllRead()}
              >
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <NotificationItemSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-destructive">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Bell className="size-7" aria-hidden="true" />}
                title="No notifications yet"
                message="Updates about jobs, applications, and ratings will appear here."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border" role="list">
              {notifications.map((n) => (
                <li
                  key={n._id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors",
                    !n.isRead && "bg-secondary/10"
                  )}
                  aria-current={!n.isRead ? "true" : undefined}
                >
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <NotificationIcon type={n.type} />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <p
                      className={cn(
                        "text-sm leading-snug text-foreground",
                        !n.isRead && "font-medium"
                      )}
                    >
                      {n.message}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(n.createdAt)}
                    </span>
                  </div>
                  {!n.isRead && (
                    <span
                      aria-label="Unread"
                      className="mt-2 size-2 shrink-0 rounded-full bg-secondary ring-2 ring-secondary/20"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {loading && notifications.length > 0 && (
          <div className="border-t border-border py-2">
            <Loader size="sm" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
