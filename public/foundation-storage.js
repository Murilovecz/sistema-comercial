/* Preferências e rascunhos pertencem à identidade e ao contexto verificados. */
(() => {
  let prefix = null;
  window.foundationSetStorageScope = scope => {
    prefix = scope && [scope.userId, scope.companyId, scope.unitId].every(v => typeof v === 'string' && v.length)
      ? 'foundation-v1:' + encodeURIComponent(JSON.stringify([scope.userId, scope.companyId, scope.unitId])) + ':' : null;
  };
  const scoped = area => {
    const storage = () => window[area];
    const keys = () => {
      if (!prefix) return [];
      const result = [], source = storage();
      for (let i = 0; i < source.length; i++) {
        const key = source.key(i);
        if (key && key.startsWith(prefix)) result.push(key);
      }
      return result;
    };
    return Object.freeze({
      get length() { return keys().length; },
      key(index) { const key = keys()[index]; return key === undefined ? null : key.slice(prefix.length); },
      getItem(key) { return prefix ? storage().getItem(prefix + String(key)) : null; },
      setItem(key, value) { if (prefix) storage().setItem(prefix + String(key), String(value)); },
      removeItem(key) { if (prefix) storage().removeItem(prefix + String(key)); },
      clear() { for (const key of keys()) storage().removeItem(key); }
    });
  };
  window.scopedLocalStorage = scoped('localStorage');
  window.scopedSessionStorage = scoped('sessionStorage');
})();
