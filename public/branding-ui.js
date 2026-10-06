import {DEFAULT_BRANDING, brandTokens, createBrandingLoader} from '/branding-core.mjs';

// The legacy shell consumes the same contract and loader as React.
let branding = DEFAULT_BRANDING;
const media = window.matchMedia('(prefers-color-scheme: dark)');
function apply() {
  for (const [name, value] of Object.entries(brandTokens(branding, media.matches))) document.documentElement.style.setProperty(name, value);
  const light = brandTokens({...branding, themeMode: 'LIGHT'});
  for (const name of ['background', 'surface', 'text', 'muted', 'border', 'info-background', 'link'])
    document.documentElement.style.setProperty('--legacy-' + name, light['--ui-' + name]);
  document.title = branding.displayName;
  document.querySelectorAll('.shell .brand').forEach(node => {node.textContent = branding.displayName;});
}
const loader = createBrandingLoader(value => {branding = value.branding; apply();}, async (context, signal) => {
  const response = await fetch('/api/organization/branding', {credentials: 'same-origin', cache: 'no-store', signal,
    headers: {'X-Company-ID': context.companyId, 'X-Unit-ID': context.unitId}});
  if (!response.ok) throw Error('Branding indisponível.');
  return response.json();
});
window.organizationBranding = {
  load: context => loader.load(context?.companyId && context.unitId ? context : null),
  afterRender: apply,
};
media.addEventListener('change', apply);
void window.organizationBranding.load(window.foundationContext);
