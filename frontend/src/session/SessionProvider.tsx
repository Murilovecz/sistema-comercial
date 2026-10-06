import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createSessionLoader, type SessionState, type AuthMutation } from "./session";
import { type ContextPair, type Credentials } from "../api/auth";

interface SessionContextValue {
  state: SessionState;
  refreshSession: () => Promise<void>;
  mutation: AuthMutation;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
  changeContext: (pair: ContextPair) => Promise<void>;
  contextReady: boolean;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  const [mutation, setMutation] = useState<AuthMutation>({ status: "idle" });
  const loader = useMemo(() => createSessionLoader(setState, setMutation), []);
  useEffect(() => {
    void loader.refresh();
    return loader.cancel;
  }, [loader]);
  const contextReady = state.status === "authenticated" && state.session.companyId !== null
    && state.session.unitId !== null && mutation.status !== "pending";
  return <SessionContext.Provider value={{ state, mutation, contextReady, refreshSession: loader.refresh,
    login: loader.login, logout: loader.logout, changeContext: loader.changeContext }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession precisa estar dentro de SessionProvider.");
  return session;
}
