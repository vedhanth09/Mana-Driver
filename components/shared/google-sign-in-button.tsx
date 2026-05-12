"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

type GoogleCredentialResponse = {
  credential: string;
  select_by?: string;
};

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
        ux_mode?: "popup" | "redirect";
        use_fedcm_for_prompt?: boolean;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          type?: "standard" | "icon";
          theme?: "outline" | "filled_blue" | "filled_black";
          size?: "large" | "medium" | "small";
          text?: "signin_with" | "signup_with" | "continue_with" | "signin";
          shape?: "rectangular" | "pill" | "circle" | "square";
          logo_alignment?: "left" | "center";
          width?: number | string;
          locale?: string;
        },
      ) => void;
      disableAutoSelect?: () => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";

type ScriptStatus = "idle" | "loading" | "ready" | "error";
let scriptStatus: ScriptStatus = "idle";
const scriptListeners = new Set<(status: ScriptStatus) => void>();

function notifyScriptStatus(status: ScriptStatus): void {
  scriptStatus = status;
  for (const listener of scriptListeners) listener(status);
}

function loadGsiScript(): void {
  if (typeof window === "undefined") return;
  if (window.google?.accounts?.id) {
    if (scriptStatus !== "ready") notifyScriptStatus("ready");
    return;
  }
  if (scriptStatus === "loading" || scriptStatus === "ready") return;

  scriptStatus = "loading";
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${GSI_SRC}"]`,
  );
  const script = existing ?? document.createElement("script");
  script.src = GSI_SRC;
  script.async = true;
  script.defer = true;
  script.onload = () => notifyScriptStatus("ready");
  script.onerror = () => notifyScriptStatus("error");
  if (!existing) document.head.appendChild(script);
}

function useGsiScript(): ScriptStatus {
  const [status, setStatus] = useState<ScriptStatus>(() =>
    typeof window !== "undefined" && window.google?.accounts?.id
      ? "ready"
      : scriptStatus,
  );

  useEffect(() => {
    scriptListeners.add(setStatus);
    loadGsiScript();
    return () => {
      scriptListeners.delete(setStatus);
    };
  }, []);

  return status;
}

export interface GoogleSignInButtonProps {
  onCredential: (credential: string) => Promise<void> | void;
  text?: "signin_with" | "signup_with" | "continue_with";
  disabled?: boolean;
  onUnavailable?: (reason: "not-configured" | "script-error") => void;
}

export function GoogleSignInButton({
  onCredential,
  text = "continue_with",
  disabled = false,
  onUnavailable,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonHostRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onCredential);
  const onUnavailableRef = useRef(onUnavailable);
  const reactId = useId();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const status = useGsiScript();
  const [renderWidth, setRenderWidth] = useState<number>(360);

  callbackRef.current = onCredential;
  onUnavailableRef.current = onUnavailable;

  useEffect(() => {
    if (!clientId) {
      onUnavailableRef.current?.("not-configured");
    } else if (status === "error") {
      onUnavailableRef.current?.("script-error");
    }
  }, [clientId, status]);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") return;
    const el = containerRef.current;
    const update = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setRenderWidth(Math.min(400, Math.max(200, w)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleCredential = useCallback((response: GoogleCredentialResponse) => {
    if (!response?.credential) return;
    void callbackRef.current(response.credential);
  }, []);

  useEffect(() => {
    if (status !== "ready" || !clientId) return;
    const host = buttonHostRef.current;
    const gid = window.google?.accounts?.id;
    if (!host || !gid) return;

    gid.initialize({
      client_id: clientId,
      callback: handleCredential,
      ux_mode: "popup",
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    host.innerHTML = "";
    gid.renderButton(host, {
      type: "standard",
      theme: "outline",
      size: "large",
      text,
      shape: "rectangular",
      logo_alignment: "left",
      width: renderWidth,
    });
  }, [status, clientId, handleCredential, renderWidth, text]);

  if (!clientId) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex h-11 w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-3 text-xs text-muted-foreground"
      >
        Google sign-in is not configured.
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex h-11 w-full items-center justify-center rounded-lg border border-border bg-muted/40 px-3 text-xs text-muted-foreground"
      >
        Could not load Google sign-in. Check your connection.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-component="google-sign-in"
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
      className="relative w-full overflow-hidden rounded-lg data-[disabled]:pointer-events-none data-[disabled]:opacity-60"
    >
      <div ref={buttonHostRef} id={`gsi-${reactId}`} className="flex justify-center" />
      {status !== "ready" && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex h-11 items-center justify-center rounded-lg border border-border bg-background text-sm text-muted-foreground"
        >
          Loading Google sign-in…
        </div>
      )}
    </div>
  );
}
