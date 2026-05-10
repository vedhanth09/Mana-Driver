"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiGet, apiPatch, ApiClientError } from "@/lib/api";
import type { Notification } from "@/models/Notification";
import { NOTIFICATION_POLL_INTERVAL_MS } from "@/lib/constants/enums";

type ClientNotification = Omit<Notification, "_id" | "userId" | "relatedJobId" | "createdAt" | "updatedAt"> & {
  _id: string;
  userId: string;
  relatedJobId: string | null;
  createdAt: string;
  updatedAt: string;
};

type NotificationContextValue = {
  notifications: ClientNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

type Payload = {
  notifications: ClientNotification[];
  unreadCount: number;
};

type ProviderProps = {
  children: ReactNode;
  enabled?: boolean;
  intervalMs?: number;
};

export function NotificationProvider({
  children,
  enabled = true,
  intervalMs = NOTIFICATION_POLL_INTERVAL_MS,
}: ProviderProps) {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled || inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      const data = await apiGet<Payload>("/api/notifications");
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError(null);
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 401) {
        // Not authenticated — silently stop, layout handles redirect.
        setError(null);
      } else {
        setError(e instanceof Error ? e.message : "Failed to load notifications");
      }
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [enabled]);

  const markAllRead = useCallback(async () => {
    try {
      await apiPatch("/api/notifications/read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mark notifications");
    }
  }, []);

  // Polling lifecycle: start / stop based on document visibility.
  useEffect(() => {
    if (!enabled) return;

    const startPolling = () => {
      if (intervalRef.current) return;
      void refresh();
      intervalRef.current = setInterval(() => {
        void refresh();
      }, intervalMs);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        stopPolling();
      } else {
        startPolling();
      }
    };

    if (document.visibilityState === "visible") startPolling();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, intervalMs, refresh]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, error, markAllRead, refresh }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
