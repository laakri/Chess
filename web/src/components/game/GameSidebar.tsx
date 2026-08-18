import { Button } from "@/components/ui/button";
import { GAME_MODES, modeList } from "@/game/modes";
import type { GameModeId, GameSettings, GameState, PieceSymbol } from "@/types/chess";
import { Flag, Handshake, RefreshCw, Repeat2, Settings, Timer, Undo2, X } from "lucide-react";
import { CapturedPieces } from "./CapturedPieces";
import { MoveList } from "./MoveList";
import { SettingsPanel } from "./SettingsPanel";

interface GameSidebarProps {
  state: GameState;
  capturedByYou: PieceSymbol[];
  settings: GameSettings;
  settingsOpen: boolean;
  onSettingsOpenChange: (open: boolean) => void;
  onModeChange: (modeId: GameModeId) => void;
  onSettingChange: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
  onOfferDraw: () => void;
  onFlipBoard: () => void;
  onReset: () => void;
  onUndo: () => void;
  onResign: () => void;
}

export function GameSidebar({
  state,
  capturedByYou,
  settings,
  settingsOpen,
  onSettingsOpenChange,
  onModeChange,
  onSettingChange,
  onOfferDraw,
  onFlipBoard,
  onReset,
  onUndo,
  onResign,
}: GameSidebarProps) {
  const mode = GAME_MODES[state.modeId];
  const activePlayer = state.players.find((player) => player.seat === state.activeSeat);

  return (
    <aside className="flex h-full min-h-0 w-[300px] shrink-0 flex-col px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold">{mode.name}</div>
          <div className="truncate text-xs text-muted-foreground">Turn: {activePlayer?.name ?? state.activeSeat}</div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="rounded-2xl hover:bg-foreground/7"
          aria-label={settingsOpen ? "Close settings" : "Open settings"}
          onClick={() => onSettingsOpenChange(!settingsOpen)}
        >
          {settingsOpen ? <X className="size-5" /> : <Settings className="size-5" />}
        </Button>
      </div>

      {settingsOpen ? (
        <div className="min-h-0">
          <SettingsPanel compact settings={settings} onSettingChange={onSettingChange} />
        </div>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-3 gap-1">
            {modeList.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={item.id === state.modeId ? "default" : "ghost"}
                className="h-8 rounded-2xl px-2 text-xs hover:bg-foreground/7"
                onClick={() => onModeChange(item.id)}
              >
                {item.name.replace(" Chess", "").replace(" Preview", "")}
              </Button>
            ))}
          </div>

          <div className="mb-3 flex items-center gap-2 rounded-3xl bg-foreground/[0.04] px-3 py-2">
            <Timer className="size-4 text-muted-foreground" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Time control</div>
              <div className="text-sm font-medium">{mode.timeControl}</div>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-1">
            <ActionButton icon={<Handshake className="size-4" />} label="Draw" onClick={onOfferDraw} />
            <ActionButton icon={<Repeat2 className="size-4" />} label="Flip" onClick={onFlipBoard} />
            <ActionButton icon={<Undo2 className="size-4" />} label="Undo" onClick={onUndo} />
            <ActionButton icon={<RefreshCw className="size-4" />} label="Reset" onClick={onReset} />
            <ActionButton danger icon={<Flag className="size-4" />} label="Resign" onClick={onResign} />
          </div>

          {settings.showCaptured && (
            <div className="mb-3 rounded-3xl bg-foreground/[0.04] px-3 py-2">
              <CapturedPieces title="Captured" pieces={capturedByYou} pieceSet={"image"} />
            </div>
          )}

          {settings.showMoveList && (
            <div className="min-h-0 flex-1">
              <MoveList moves={state.moves} />
            </div>
          )}
        </>
      )}
    </aside>
  );
}

function ActionButton({
  icon,
  label,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex h-9 items-center justify-center gap-2 rounded-2xl text-sm transition hover:bg-foreground/7 ${
        danger ? "text-red-600 hover:bg-red-500/10" : "text-foreground/80"
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
