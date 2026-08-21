import { Button } from "@/components/ui/button";
import { botLevelList } from "@/game/bot";
import { GAME_MODES } from "@/game/modes";
import type {
  BotLevelId,
  ChessSeat,
  GameSettings,
  GameState,
  PieceSymbol,
} from "@/types/chess";
import { Info, Palette, RefreshCw, Repeat2, Settings, Timer, Undo2, X } from "lucide-react";
import { CapturedPieces } from "./CapturedPieces";
import { MoveList } from "./MoveList";
import { SettingsPanel } from "./SettingsPanel";
import { CoachPanel } from "./CoachPanel";
import { useState } from "react";

interface GameSidebarProps {
  state: GameState;
  botThinking: boolean;
  capturedByYou: PieceSymbol[];
  settings: GameSettings;
  settingsOpen: boolean;
  onSettingsOpenChange: (open: boolean) => void;
  onPlayerSeatChange: (playerSeat: ChessSeat) => void;
  onStartBot: (level: BotLevelId, playerSeat: ChessSeat) => void;
  onSettingChange: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => void;
  onFlipBoard: () => void;
  onSwitchColors: () => void;
  onReset: () => void;
  onUndo: () => void;
}

export function GameSidebar({
  state,
  botThinking,
  capturedByYou,
  settings,
  settingsOpen,
  onSettingsOpenChange,
  onPlayerSeatChange,
  onStartBot,
  onSettingChange,
  onFlipBoard,
  onSwitchColors,
  onReset,
  onUndo,
}: GameSidebarProps) {
  const mode = GAME_MODES[state.modeId];
  const [selectedBotLevel, setSelectedBotLevel] = useState<BotLevelId>(state.botLevel);
  const [selectedPlayerSeat, setSelectedPlayerSeat] = useState<ChessSeat>("white");
  const activePlayer = state.players.find((player) => player.id === state.turnSlot.toLowerCase())
    ?? state.players.find((player) => player.seat === state.activeSeat);
  const turnLabel = botThinking
    ? `${activePlayer?.name ?? "Bot"} is thinking…`
    : `Turn: ${activePlayer?.name ?? state.activeSeat}`;

  return (
    <aside className="flex h-full min-h-0 w-[300px] shrink-0 flex-col px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold">{mode.name}</div>
          <div className="truncate text-xs text-muted-foreground">{turnLabel}</div>
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
          {(state.modeId === "bot" || state.modeId === "two-v-two-bot") && !state.botStarted ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-5">
                <div className="mb-1 text-lg font-semibold">Play against a bot</div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Choose a level, then start your practice game.
                </p>
              </div>

              <div className="space-y-2">
                {botLevelList.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                      selectedBotLevel === level.id
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/70 bg-foreground/[0.03] hover:bg-foreground/[0.07]"
                    }`}
                    onClick={() => setSelectedBotLevel(level.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{level.name}</span>
                      <span className="text-[11px] opacity-60">{level.depth === 0 ? "Easy" : `Depth ${level.depth}`}</span>
                    </div>
                    <div className="mt-1 text-xs opacity-70">{level.description}</div>
                  </button>
                ))}
              </div>

              <div className="mt-5">
                <div className="mb-2 text-xs font-medium text-muted-foreground">Play as</div>
                <div className="grid grid-cols-2 gap-2">
                  {(["white", "black"] as ChessSeat[]).map((seat) => (
                    <button
                      key={seat}
                      type="button"
                      className={`rounded-2xl border px-3 py-2 text-sm font-semibold capitalize transition ${
                        selectedPlayerSeat === seat
                          ? "border-foreground bg-foreground text-background"
                          : "border-border/70 bg-foreground/[0.03] hover:bg-foreground/[0.07]"
                      }`}
                      onClick={() => {
                        setSelectedPlayerSeat(seat);
                        onPlayerSeatChange(seat);
                      }}
                    >
                      {seat}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                className="mt-5 w-full rounded-2xl"
                onClick={() => onStartBot(selectedBotLevel, selectedPlayerSeat)}
              >
                Start game
              </Button>
            </div>
          ) : (
            <>
          <CoachPanel feedback={state.moveFeedback} botThinking={botThinking} />

          {state.hint && (
            <div className="mb-3 flex items-start gap-2 rounded-2xl bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
              <Info className="mt-px size-3.5 shrink-0" />
              <span>{state.hint}</span>
            </div>
          )}

          {state.modeId !== "bot" && state.modeId !== "two-v-two-bot" && (
            <div className="mb-3 flex items-center gap-2 rounded-3xl bg-foreground/[0.04] px-3 py-2">
              <Timer className="size-4 text-muted-foreground" />
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Time control</div>
                <div className="text-sm font-medium">{mode.timeControl}</div>
              </div>
            </div>
          )}

          <div className="mb-3 grid grid-cols-2 gap-1">
            <ActionButton icon={<Repeat2 className="size-4" />} label="Flip" onClick={onFlipBoard} />
            <ActionButton icon={<Palette className="size-4" />} label="Colors" onClick={onSwitchColors} />
            <ActionButton icon={<Undo2 className="size-4" />} label="Undo" onClick={onUndo} />
            <ActionButton icon={<RefreshCw className="size-4" />} label="Reset" onClick={onReset} />
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
