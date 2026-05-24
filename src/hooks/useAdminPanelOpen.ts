import { useCallback, useState } from 'react';

const STORAGE_KEY = 'teamcal.adminPanelOpen';

function readStoredPanelOpen(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return true;
    return stored === 'true';
  } catch {
    return true;
  }
}

export function useAdminPanelOpen() {
  const [open, setOpen] = useState(readStoredPanelOpen);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const setPanelOpen = useCallback((value: boolean) => {
    setOpen(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // ignore storage errors
    }
  }, []);

  return { adminPanelOpen: open, toggleAdminPanel: toggle, setAdminPanelOpen: setPanelOpen };
}
