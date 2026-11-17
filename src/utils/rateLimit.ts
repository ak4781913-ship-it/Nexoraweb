const localTimestamps = new Map<string, number>();

export function checkClientCooldown(key: string, cooldownMs: number): number {
  const now = Date.now();
  const storageKey = `mawa_rl_${key}`;
  let last = localTimestamps.get(key) || 0;

  if (typeof window !== 'undefined') {
    try {
      const saved = Number(window.sessionStorage.getItem(storageKey) || '0');
      if (Number.isFinite(saved) && saved > last) {
        last = saved;
      }
    } catch {
      // Ignore restricted sessionStorage contexts
    }
  }

  const remaining = cooldownMs - (now - last);
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

export function markClientCooldown(key: string): void {
  const now = Date.now();
  localTimestamps.set(key, now);
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(`mawa_rl_${key}`, String(now));
    } catch {
      // Ignore restricted sessionStorage contexts
    }
  }
}
