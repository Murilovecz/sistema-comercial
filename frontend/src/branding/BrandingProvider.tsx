import {createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode} from "react";
import {DEFAULT_BRANDING, brandTokens, contextKey, createBrandingLoader, parseBranding, type Branding, type BrandingContext, type BrandingState} from "../../../shared/branding-core.mjs";
import {get, post, HttpError} from "../api/http";
import {useSession} from "../session/SessionProvider";

interface Value {branding: Branding; loading: boolean; prefersDark: boolean; reload: () => Promise<void>; save: (draft: Branding) => Promise<void>}
const BrandingContextValue = createContext<Value | undefined>(undefined);
export function BrandingProvider({children}: {children: ReactNode}) {
  const {state, contextReady} = useSession();
  const session = state.status === "authenticated" && contextReady ? state.session : null;
  const context: BrandingContext | null = session?.companyId && session.unitId ? {companyId: session.companyId, unitId: session.unitId, sessionId: session.sessionId} : null;
  const key = contextKey(context), latest = useRef(key); latest.current = key;
  const [value, setValue] = useState<BrandingState>({contextKey: "", branding: DEFAULT_BRANDING, status: "default"});
  const [prefersDark, setPrefersDark] = useState(false);
  const loader = useMemo(() => createBrandingLoader(setValue, (ctx, signal) => get("/api/organization/branding", {context: ctx, signal})), []);
  const current = useMemo(() => context, [key]);
  useEffect(() => {void loader.load(current); return loader.cancel;}, [current, loader]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setPrefersDark(media.matches); update();
    media.addEventListener("change", update); return () => media.removeEventListener("change", update);
  }, []);
  // Hide the old brand during the render that changes context, before effects run.
  const branding = key && value.contextKey === key ? value.branding : DEFAULT_BRANDING;
  useLayoutEffect(() => {
    const root = document.documentElement, tokens = brandTokens(branding, prefersDark);
    for (const [name, color] of Object.entries(tokens)) root.style.setProperty(name, color);
    document.title = branding.displayName;
    return () => {for (const name of Object.keys(tokens)) root.style.removeProperty(name); document.title = DEFAULT_BRANDING.displayName;};
  }, [branding, prefersDark]);
  const reload = () => loader.load(current);
  const save = async (draft: Branding) => {
    if (!session || !current || !session.permissions.includes("companies.manage")) throw new HttpError("HTTP", 403);
    const activeKey = key; loader.cancel();
    const result = parseBranding(await post("/api/organization/branding", {
      displayName: draft.displayName, primaryColor: draft.primaryColor, accentColor: draft.accentColor, themeMode: draft.themeMode, expectedRevision: draft.revision,
    }, {context: current, csrfToken: session.csrfToken}));
    if (latest.current !== activeKey) throw new HttpError("ABORT");
    if (!result) throw new HttpError("INVALID_RESPONSE");
    setValue({contextKey: key, branding: result, status: "ready"});
  };
  return <BrandingContextValue.Provider value={{branding, prefersDark, loading: !!key && (value.contextKey !== key || value.status === "loading"), reload, save}}>{children}</BrandingContextValue.Provider>;
}
export function useBranding(): Value {const value = useContext(BrandingContextValue); if (!value) throw Error("BrandingProvider necessário."); return value;}
