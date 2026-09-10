import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/lib/auth";

const PUBLIC_PATHS = ["/welcome", "/auth"];

export function isAuthScreen(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Sends first-time visitors to the welcome screen until they sign in or pick guest mode. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { loading, session, isGuest } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const onAuthScreen = isAuthScreen(pathname);

  useEffect(() => {
    if (loading || onAuthScreen) return;
    if (!session && !isGuest) void navigate({ to: "/welcome", replace: true });
  }, [loading, session, isGuest, onAuthScreen, navigate]);

  if (!onAuthScreen && loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
