import { useEffect, useRef, useState } from "react";
import moveSound from "@/assets/move.mp3";
import { AppRail } from "@/components/game/AppRail";
import { Board } from "@/components/game/Board";
import { ConfirmActionDialog } from "@/components/game/ConfirmActionDialog";
import { GameSidebar } from "@/components/game/GameSidebar";
import { PlayerRow } from "@/components/game/PlayerRow";
import { Button } from "@/components/ui/button";
import { useGameSettings } from "@/hooks/useGameSettings";
import { useGameState } from "@/hooks/useGameState";

export default function Game() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resignConfirmOpen, setResignConfirmOpen] = useState(false);
  const { state, botThinking, selectSquare, setMode, setBotLevel, resign, resetGame, undoMove } =
    useGameState();
  const { settings, updateSetting } = useGameSettings();
  const lastMoveRef = useRef(state.lastMove);
  const opponent = state.players.find((player) => !player.isYou) ?? state.players[0];
  const you = state.players.find((player) => player.isYou) ?? state.players[state.players.length - 1];

  const isWinState =
    state.status === "checkmate" ||
    state.status === "resigned" ||
    state.status === "timeout" ||
    state.status === "draw";
  const winnerSeat =
    state.status === "ongoing" || state.status === "draw"
      ? null
      : state.activeSeat === "white"
        ? "black"
        : "white";
  const didYouWin = winnerSeat === you.seat;
  const terminalTitle =
    state.status === "timeout"
      ? "Time expired"
      : state.status === "resigned"
        ? "Resignation"
        : state.status === "draw"
          ? "Draw"
          : "Checkmate";
  const terminalMessage =
    state.status === "timeout"
      ? didYouWin
        ? "You won on time."
        : "You lost on time."
      : state.status === "resigned"
        ? didYouWin
          ? "You won by resignation."
          : "You lost by resignation."
        : state.status === "draw"
          ? "Stalemate — no legal moves remain and the king is not in check."
          : didYouWin
            ? "You won the game."
            : "You lost the game.";

  useEffect(() => {
    const moved = state.lastMove && state.lastMove !== lastMoveRef.current;

    if (settings.sound && moved) {
      const audio = new Audio(moveSound);
      audio.volume = 0.55;
      audio.play().catch(() => {
        // ignore autoplay restrictions until the user interacts; the app still works
      });
    }

    lastMoveRef.current = state.lastMove;
  }, [state.lastMove, settings.sound]);

  return (
    <>
      <main className="flex h-screen overflow-hidden bg-background text-foreground">
        <AppRail onSettingsClick={() => setSettingsOpen((open) => !open)} />

        <section className="flex min-w-0 flex-1 items-center justify-center px-3 py-2">
          <div className="flex min-h-0 w-full max-w-[900px] flex-col items-center gap-1.5">
            <PlayerRow
              player={opponent}
              active={state.activeSeat === opponent.seat}
              thinking={botThinking}
            />

            <Board
              board={state.board}
              activeSeat={state.activeSeat}
              selectedSquare={state.selectedSquare}
              legalTargets={state.legalTargets}
              lastMove={state.lastMove}
              boardTheme={settings.boardTheme}
              boardSize={settings.boardSize}
              showCoordinates={settings.showCoordinates}
              showLegalMoves={settings.showLegalMoves}
              traceDurationMs={settings.arrowDurationMs * 1000}
              onSquareClick={selectSquare}
            />

            <PlayerRow player={you} active={state.activeSeat === you.seat} />
          </div>
        </section>

        <GameSidebar
        state={state}
        botThinking={botThinking}
        capturedByYou={state.captured.byYou}
        settings={settings}
        settingsOpen={settingsOpen}
        onSettingsOpenChange={setSettingsOpen}
        onModeChange={setMode}
        onBotLevelChange={setBotLevel}
        onSettingChange={updateSetting}
        onOfferDraw={() => console.log("offer draw")}
        onFlipBoard={() => console.log("flip board")}
        onReset={resetGame}
        onUndo={undoMove}
        onResign={() => {
          if (settings.confirmResign) setResignConfirmOpen(true);
          else resign();
        }}
      />

        <ConfirmActionDialog
          open={resignConfirmOpen}
          title="Resign game?"
          body="This will end the current game for you."
          confirmLabel="Resign"
          danger
          onCancel={() => setResignConfirmOpen(false)}
          onConfirm={() => {
            setResignConfirmOpen(false);
            resign();
          }}
        />
      </main>

      {isWinState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
          <div className="w-full max-w-sm rounded-[24px] border border-border/70 bg-card px-5 py-5 text-center shadow-xl">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.24em] text-amber-500">
              {didYouWin ? "Victory" : "Defeat"}
            </div>
            <div className="mb-1 text-2xl font-bold text-foreground">{terminalTitle}</div>
            <p className="mb-4 text-sm text-muted-foreground">{terminalMessage}</p>

            <div className="flex justify-center gap-2">
              <Button variant="outline" className="rounded-xl" onClick={resetGame}>
                Rematch
              </Button>
              <Button className="rounded-xl" onClick={() => setSettingsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
