// context/session-context.tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type SessionState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
};

type SessionContextType = SessionState;

const SessionContext = createContext<SessionContextType>({
  session: null,
  user: null,
  isLoading: true,
});

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}

// Stable supabase client instance
const supabase = createSupabaseClient();

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({
    session: null,
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setState({
        session,
        user: session?.user ?? null,
        isLoading: false,
      });
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        session,
        user: session?.user ?? null,
        isLoading: false,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(
    () => ({
      session: state.session,
      user: state.user,
      isLoading: state.isLoading,
    }),
    [state.session, state.user, state.isLoading],
  );

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}
