"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, LogOut, Menu, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/shared/notification-bell";
import { apiGet, apiPost, ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/constants/enums";

type AuthedUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isProfileComplete: boolean;
};

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#services", label: "Services" },
  { href: "/#business", label: "For Business" },
  { href: "/#about", label: "About Us" },
] as const;

function initialsFor(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function homeForRole(role: UserRole): string {
  if (role === "driver") return "/driver";
  if (role === "customer") return "/customer";
  return "/";
}

function profileForRole(role: UserRole): string | null {
  if (role === "driver") return "/driver/profile";
  if (role === "customer") return "/customer/profile";
  return null;
}

type Props = {
  /**
   * Pre-resolved user from a server context. When omitted, the navbar will
   * fetch /api/auth/me on mount to detect auth state.
   */
  initialUser?: AuthedUser | null;
};

export function Navbar({ initialUser = null }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<AuthedUser | null>(initialUser);
  const [resolved, setResolved] = useState<boolean>(initialUser !== null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (initialUser !== null) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiGet<{ user: AuthedUser }>("/api/auth/me");
        if (!cancelled) setUser(data.user);
      } catch (e) {
        if (!cancelled && (!(e instanceof ApiClientError) || e.status !== 401)) {
          // Network or other unexpected error — leave user null and continue.
        }
      } finally {
        if (!cancelled) setResolved(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialUser]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await apiPost("/api/auth/logout");
    } catch {
      // Ignore — we still clear UI state and navigate.
    } finally {
      setUser(null);
      setLoggingOut(false);
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold tracking-tight text-primary"
        >
          <Car className="size-7" aria-hidden="true" />
          <span className="text-h2">ManaDriver</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-foreground/80 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Account menu"
                      className={cn(
                        "rounded-full outline-none transition-shadow",
                        "focus-visible:ring-3 focus-visible:ring-ring/50",
                      )}
                    />
                  }
                >
                  <Avatar size="default">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {initialsFor(user.fullName) || <User className="size-4" />}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8}>
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">
                        {user.fullName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push(homeForRole(user.role))}
                  >
                    Dashboard
                  </DropdownMenuItem>
                  {profileForRole(user.role) && (
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(profileForRole(user.role) as string)
                      }
                    >
                      <User className="size-4" aria-hidden="true" />
                      Profile
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={loggingOut}
                    onClick={() => void handleLogout()}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="lg"
                className="hidden md:inline-flex"
                render={<Link href="/login" />}
              >
                Login
              </Button>
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                render={<Link href="/signup" />}
              >
                Sign Up
              </Button>
            </>
          )}

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open menu"
                  className="md:hidden"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 gap-0 p-6">
              <SheetTitle className="text-h3 mb-6 text-primary">
                ManaDriver
              </SheetTitle>
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6">
                {user ? (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      render={<Link href={homeForRole(user.role)} />}
                    >
                      Dashboard
                    </Button>
                    {profileForRole(user.role) && (
                      <Button
                        variant="outline"
                        size="lg"
                        render={
                          <Link href={profileForRole(user.role) as string} />
                        }
                      >
                        Profile
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => void handleLogout()}
                      disabled={loggingOut}
                    >
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      render={<Link href="/login" />}
                    >
                      Login
                    </Button>
                    <Button
                      size="lg"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      render={<Link href="/signup" />}
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {/* Hide a tiny placeholder so SSR doesn't flash before hydration resolves auth */}
      <span className="sr-only" aria-hidden="true">
        {resolved ? "" : ""}
      </span>
    </header>
  );
}
