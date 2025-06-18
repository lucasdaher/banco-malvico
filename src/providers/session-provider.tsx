"use client";

import { createContext, useContext } from "react";
import type { SessionPayload } from "@/lib/session";

const SessionContext = createContext<SessionPayload | null>(null);

interface SessionProviderProps {
  children: React.ReactNode;
  user: SessionPayload | null;
}

export function SessionProvider({ children, user }: SessionProviderProps) {
  return (
    <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession deve ser usado dentro de um SessionProvider");
  }
  return { user: context };
}
