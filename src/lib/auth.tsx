import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export type AccountRole = "user" | "agency";

const GUEST_KEY = "amlakyar.guest";

type AuthValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  role: AccountRole | null;
  isGuest: boolean;
  continueAsGuest: () => void;
  exitGuest: () => void;
  refreshRole: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AccountRole | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  const loadRole = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setRole(null);
      return;
    }
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    setRole((data?.role as AccountRole | undefined) ?? null);
  }, []);

  useEffect(() => {
    try {
      setIsGuest(window.localStorage.getItem(GUEST_KEY) === "1");
    } catch {
      setIsGuest(false);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_OUT") setRole(null);
      else void loadRole(next?.user?.id);
    });

    void (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await loadRole(data.session?.user?.id);
      setLoading(false);
    })();

    return () => sub.subscription.unsubscribe();
  }, [loadRole]);

  const value = useMemo<AuthValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      role,
      isGuest,
      continueAsGuest: () => {
        try {
          window.localStorage.setItem(GUEST_KEY, "1");
        } catch {
          /* storage unavailable */
        }
        setIsGuest(true);
      },
      exitGuest: () => {
        try {
          window.localStorage.removeItem(GUEST_KEY);
        } catch {
          /* storage unavailable */
        }
        setIsGuest(false);
      },
      refreshRole: async () => {
        await loadRole(session?.user?.id);
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setRole(null);
        setSession(null);
      },
    }),
    [loading, session, role, isGuest, loadRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth باید داخل AuthProvider استفاده شود.");
  return ctx;
}
