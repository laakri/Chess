import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  BoardSizeId,
  BoardThemeId,
  GameSettings,
} from "@/types/chess";

import {
  Eye,
  Grid2X2,
  Maximize2,
  Palette,
  RotateCcw,
  Volume2,
} from "lucide-react";

import type React from "react";

interface SettingsPanelProps {
  settings: GameSettings;
  compact?: boolean;
  onSettingChange: <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => void;
  onReset?: () => void;
}

const boardThemes: { id: BoardThemeId; label: string; swatches: string[] }[] =
  [
    { id: "walnut", label: "Walnut", swatches: ["#e5c79c", "#94613d"] },
    { id: "tournament", label: "Green", swatches: ["#d7e8c1", "#6f9a61"] },
    { id: "midnight", label: "Blue", swatches: ["#b9c4d8", "#33415f"] },
    { id: "graphite", label: "Graphite", swatches: ["#d8d8d2", "#777c7a"] },
  ];

const boardSizes: { id: BoardSizeId; label: string }[] = [
  { id: "comfortable", label: "Comfort" },
  { id: "large", label: "Large" },
  { id: "huge", label: "Huge" },
];

export function SettingsPanel({
  settings,
  compact = false,
  onSettingChange,
  onReset,
}: SettingsPanelProps) {
  if (compact) {
    return (
      <div className="space-y-2">
        {/* Board themes */}
        <div className="grid grid-cols-4 gap-1">
          {boardThemes.map((theme) => (
            <Button
              key={theme.id}
              type="button"
              variant={
                settings.boardTheme === theme.id ? "default" : "ghost"
              }
              className="h-8 rounded-2xl px-2 hover:bg-foreground/7"
              onClick={() =>
                onSettingChange("boardTheme", theme.id)
              }
            >
              <span className="flex overflow-hidden rounded-md">
                {theme.swatches.map((swatch) => (
                  <span
                    key={swatch}
                    className="size-3.5"
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </span>
            </Button>
          ))}
        </div>

        {/* Board sizes */}
        <div className="grid grid-cols-3 gap-1">
          {boardSizes.map((size) => (
            <Button
              key={size.id}
              type="button"
              variant={
                settings.boardSize === size.id ? "default" : "ghost"
              }
              className="h-8 rounded-2xl px-2 text-xs hover:bg-foreground/7"
              onClick={() =>
                onSettingChange("boardSize", size.id)
              }
            >
              {size.label}
            </Button>
          ))}
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-x-3 rounded-3xl bg-foreground/[0.04] px-3 py-1.5">
          <ToggleRow
            label="Coords"
            checked={settings.showCoordinates}
            onChange={(v) =>
              onSettingChange("showCoordinates", v)
            }
          />
          <ToggleRow
            label="Hints"
            checked={settings.showLegalMoves}
            onChange={(v) =>
              onSettingChange("showLegalMoves", v)
            }
          />
          <ToggleRow
            label="Moves"
            checked={settings.showMoveList}
            onChange={(v) =>
              onSettingChange("showMoveList", v)
            }
          />
          <ToggleRow
            label="Captured"
            checked={settings.showCaptured}
            onChange={(v) =>
              onSettingChange("showCaptured", v)
            }
          />
          <ToggleRow
            label="Sound"
            checked={settings.sound}
            onChange={(v) => onSettingChange("sound", v)}
          />
          <ToggleRow
            label="Confirm"
            checked={settings.confirmResign}
            onChange={(v) =>
              onSettingChange("confirmResign", v)
            }
          />
        </div>

        <div className="rounded-3xl bg-foreground/[0.04] p-3">
          <RangeRow
            label="Arrow time"
            min={1}
            max={60}
            step={1}
            value={settings.arrowDurationMs}
            onChange={(value) => onSettingChange("arrowDurationMs", value)}
            suffix="s"
          />
        </div>

        {/* PIECE SETS locked to Images (no selection) */}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* BOARD THEME */}
      <SettingGroup icon={<Palette className="size-4" />} title="Board theme">
        <div className="grid grid-cols-2 gap-2">
          {boardThemes.map((theme) => (
            <Button
              key={theme.id}
              type="button"
              variant={
                settings.boardTheme === theme.id
                  ? "default"
                  : "outline"
              }
              className="h-10 justify-start gap-2"
              onClick={() =>
                onSettingChange("boardTheme", theme.id)
              }
            >
              <span className="flex overflow-hidden rounded-sm border">
                {theme.swatches.map((swatch) => (
                  <span
                    key={swatch}
                    className="size-4"
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </span>
              {theme.label}
            </Button>
          ))}
        </div>
      </SettingGroup>

      {/* BOARD SIZE */}
      <SettingGroup icon={<Maximize2 className="size-4" />} title="Board size">
        <div className="grid grid-cols-3 gap-2">
          {boardSizes.map((size) => (
            <Button
              key={size.id}
              type="button"
              variant={
                settings.boardSize === size.id
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                onSettingChange("boardSize", size.id)
              }
            >
              {size.label}
            </Button>
          ))}
        </div>
      </SettingGroup>

      {/* Pieces are locked to images */}

      {/* DISPLAY */}
      <SettingGroup icon={<Eye className="size-4" />} title="Display">
        <ToggleRow
          label="Coordinates"
          checked={settings.showCoordinates}
          onChange={(v) =>
            onSettingChange("showCoordinates", v)
          }
        />
        <ToggleRow
          label="Legal moves"
          checked={settings.showLegalMoves}
          onChange={(v) =>
            onSettingChange("showLegalMoves", v)
          }
        />
        <ToggleRow
          label="Captured pieces"
          checked={settings.showCaptured}
          onChange={(v) =>
            onSettingChange("showCaptured", v)
          }
        />
        <ToggleRow
          label="Move list"
          checked={settings.showMoveList}
          onChange={(v) =>
            onSettingChange("showMoveList", v)
          }
        />
        <ToggleRow
          label="Mode panel"
          checked={settings.showModePanel}
          onChange={(v) =>
            onSettingChange("showModePanel", v)
          }
        />
      </SettingGroup>

      {/* GAME */}
      <SettingGroup icon={<Grid2X2 className="size-4" />} title="Game behavior">
        <ToggleRow
          label="Auto queen"
          checked={settings.autoQueen}
          onChange={(v) =>
            onSettingChange("autoQueen", v)
          }
        />
        <ToggleRow
          label="Confirm resign"
          checked={settings.confirmResign}
          onChange={(v) =>
            onSettingChange("confirmResign", v)
          }
        />
        <ToggleRow
          label="Sound"
          checked={settings.sound}
          icon={<Volume2 className="size-4" />}
          onChange={(v) => onSettingChange("sound", v)}
        />
        <RangeRow
          label="Arrow time"
          min={1}
          max={60}
          step={1}
          value={settings.arrowDurationMs}
          onChange={(value) => onSettingChange("arrowDurationMs", value)}
          suffix="s"
        />
      </SettingGroup>

      {/* RESET */}
      {onReset && (
        <div className={compact ? "" : "lg:col-span-2"}>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={onReset}
          >
            <RotateCcw className="size-4" />
            Reset preferences
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---------------- helpers ---------------- */

function SettingGroup({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

function RangeRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 border-b py-2 last:border-b-0">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}{suffix ?? ""}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full accent-amber-500"
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  icon,
  onChange,
}: {
  label: string;
  checked: boolean;
  icon?: React.ReactNode;
  onChange: (checked: boolean) => void;
}) {
  const tooltipText = {
    Coordinates: "Show file and rank labels around the board.",
    "Legal moves": "Highlight squares the selected piece can move to.",
    "Captured pieces": "Show captured pieces across the sidebar.",
    "Move list": "Display the notation history for the game.",
    "Mode panel": "Show the mode selector and game controls.",
    "Auto queen": "Automatically promote pawns to a queen.",
    "Confirm resign": "Ask for confirmation before resigning.",
    Sound: "Play move and notification sounds.",
    Coords: "Show file and rank labels around the board.",
    Hints: "Highlight legal move targets.",
    Moves: "Display the move history.",
    Captured: "Show recently captured pieces.",
    Confirm: "Ask before resigning.",
  }[label] ?? "Toggle this setting.";

  return (
    <label className="flex min-h-9 items-center justify-between gap-3 border-b py-2 last:border-b-0">
      <Tooltip>
        <TooltipTrigger
          type="button"
          className="flex cursor-help items-center gap-2 bg-transparent p-0 text-left text-sm"
        >
          {icon}
          {label}
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-current"
      />
    </label>
  );
}