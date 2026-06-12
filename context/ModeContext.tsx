import React, { createContext, useContext, useState } from 'react';
import type { Mode } from '@/lib/constants';

type ModeContextValue = {
  mode: Mode;
  setMode: (mode: Mode) => void;
};

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('personal');
  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used within ModeProvider');
  return ctx;
}
