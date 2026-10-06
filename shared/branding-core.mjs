// Pure shared contract: backend, React and legacy adapter use this same source.
export const DEFAULT_BRANDING = Object.freeze({displayName: 'Sistema Comercial', primaryColor: '#17603C', accentColor: '#B88700', themeMode: 'LIGHT', revision: 0});
export function parseBranding(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const {displayName, primaryColor, accentColor, themeMode, revision} = value;
  if (typeof displayName !== 'string' || !displayName.trim() || displayName.length > 80 || /[\u0000-\u001f\u007f]/.test(displayName)
    || typeof primaryColor !== 'string' || !/^#[0-9a-f]{6}$/i.test(primaryColor)
    || typeof accentColor !== 'string' || !/^#[0-9a-f]{6}$/i.test(accentColor)
    || !['LIGHT', 'DARK', 'SYSTEM'].includes(themeMode) || !Number.isSafeInteger(revision) || revision < 0) return null;
  return {displayName: displayName.trim(), primaryColor: primaryColor.toUpperCase(), accentColor: accentColor.toUpperCase(), themeMode, revision};
}
function luminance(hex) {
  const values = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
export function contrast(a, b) {const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);}
const onColor = color => contrast(color, '#000000') >= contrast(color, '#FFFFFF') ? '#000000' : '#FFFFFF';
export function brandTokens(value, prefersDark = false) {
  const brand = parseBranding(value) || DEFAULT_BRANDING;
  const dark = brand.themeMode === 'DARK' || brand.themeMode === 'SYSTEM' && prefersDark;
  const surface = dark ? '#242424' : '#FFFFFF';
  const background = dark ? '#151515' : '#F5F5F5', info = dark ? '#303030' : '#EFEFEF';
  return {
    '--brand-primary': brand.primaryColor, '--brand-on-primary': onColor(brand.primaryColor),
    '--brand-accent': brand.accentColor, '--brand-on-accent': onColor(brand.accentColor),
    '--ui-background': background, '--ui-surface': surface,
    '--ui-text': dark ? '#F4F4F4' : '#202020', '--ui-muted': dark ? '#C4C4C4' : '#5C5C5C',
    '--ui-border': dark ? '#A6A6A6' : '#909090', '--ui-focus': dark ? '#9FC8FF' : '#1D5BA9',
    '--ui-danger': dark ? '#FFA8A8' : '#9F2525', '--ui-danger-background': dark ? '#391B1B' : '#FFF2F0',
    '--ui-info-background': info,
    '--ui-link': [surface, background, info].every(color => contrast(brand.primaryColor, color) >= 4.5) ? brand.primaryColor : dark ? '#F0F0F0' : '#303030',
    'color-scheme': dark ? 'dark' : 'light',
  };
}
export function contextKey(context) {return context ? JSON.stringify([context.sessionId, context.companyId, context.unitId]) : '';}
export function createBrandingLoader(publish, read) {
  let generation = 0, controller;
  const cancel = () => {generation++; controller?.abort(); controller = undefined;};
  const load = async context => {
    cancel(); const current = generation, key = contextKey(context);
    publish({contextKey: key, branding: DEFAULT_BRANDING, status: context ? 'loading' : 'default'});
    if (!context) return;
    const request = new AbortController(); controller = request;
    const active = () => current === generation && !request.signal.aborted;
    try {
      const value = parseBranding(await read(context, request.signal));
      if (active()) publish({contextKey: key, branding: value || DEFAULT_BRANDING, status: value ? 'ready' : 'default'});
    } catch {
      if (active()) publish({contextKey: key, branding: DEFAULT_BRANDING, status: 'default'});
    } finally {if (current === generation) controller = undefined;}
  };
  return {load, cancel};
}
