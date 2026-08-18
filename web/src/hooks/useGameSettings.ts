import { useCallback, useEffect, useMemo, useState } from "react";
import type { GameSettings } from "@/types/chess";

const STORAGE_KEY = "chess.ui.settings.v1";

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  boardTheme: "walnut",
  pieceSet: "image",
  boardSize: "huge",
  showCoordinates: true,
  showLegalMoves: true,
  showCaptured: true,
  showMoveList: true,
  showModePanel: true,
  sound: true,
  confirmResign: true,
  autoQueen: false,
  arrowDurationMs: 3,
};

function readSettings() {
  if (typeof window === "undefined") {
    return DEFAULT_GAME_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const merged = raw ? { ...DEFAULT_GAME_SETTINGS, ...JSON.parse(raw) } : DEFAULT_GAME_SETTINGS;
    // Force pieceSet to 'image' to lock images as the only piece set
    merged.pieceSet = "image";
    return merged;
  } catch {
    return DEFAULT_GAME_SETTINGS;
  }
}

export function useGameSettings() {
  const [settings, setSettings] = useState<GameSettings>(readSettings);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_GAME_SETTINGS);
  }, []);

  return useMemo(
    () => ({ settings, updateSetting, resetSettings }),
    [settings, updateSetting, resetSettings]
  );
}
