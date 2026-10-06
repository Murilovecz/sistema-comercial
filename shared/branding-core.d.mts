export interface Branding {displayName: string; primaryColor: string; accentColor: string; themeMode: 'LIGHT' | 'DARK' | 'SYSTEM'; revision: number}
export interface BrandingContext {companyId: string; unitId: string; sessionId: string}
export interface BrandingState {contextKey: string; branding: Branding; status: 'loading' | 'ready' | 'default'}
export const DEFAULT_BRANDING: Readonly<Branding>;
export function parseBranding(value: unknown): Branding | null;
export function contrast(a: string, b: string): number;
export function brandTokens(value: unknown, prefersDark?: boolean): Record<string, string>;
export function contextKey(context: BrandingContext | null): string;
export function createBrandingLoader(publish: (state: BrandingState) => void, read: (context: BrandingContext, signal: AbortSignal) => Promise<unknown>): {load: (context: BrandingContext | null) => Promise<void>; cancel: () => void};
