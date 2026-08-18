import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BOT_LEVELS, chooseBotMove } from "@/game/bot";
import {
  INITIAL_BOARD,
  applyMoveToBoard,
  cloneBoard,
  getAllLegalMoves,
  getLegalMovesForPiece,
  isPlayerInCheck,
  isWhite,
  opposingSeat,
  pieceSeat,
  samePosition,
  toNotation,
} from "@/game/engine";
import type {
  BotLevelId,
  GameModeId,
  GameState,
  PieceSymbol,
  Position,
} from "@/types/chess";

const HUMAN_SEAT = "white";
const BOT_SEAT = "black";

const BOT_RATINGS: Record<BotLevelId, number> = {
  beginner: 600,
  casual: 1100,
  club: 1500,
  expert: 1850,
};

function parseClockSeconds(clock: string): number {
  const parts = String(clock).split(":").map(Number);
  if (parts.some((part) => Number.isNaN(part))) {
    return 0;
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return parts[0] * 60 + (parts[1] ?? 0);
}

function formatClockFromSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function applyMove(state: GameState, from: Position, to: Position): GameState {
  const moving = state.board[from.row][from.col] as PieceSymbol;
  const captured = state.board[to.row][to.col] as PieceSymbol | "";
  const board = applyMoveToBoard(state.board, from, to);

  const moveText = toNotation(from, to, moving, !!captured);
  const moves = [...state.moves];

  if (state.activeSeat === "white") {
    moves.push({ white: moveText });
  } else {
    const last = moves[moves.length - 1];
    if (last && !last.black) {
      moves[moves.length - 1] = { ...last, black: moveText };
    } else {
      moves.push({ white: "...", black: moveText });
    }
  }

  const nextSeat = opposingSeat(state.activeSeat);
  const isOpponentInCheck = isPlayerInCheck(board, nextSeat);
  const opponentHasMoves = getAllLegalMoves(board, nextSeat).length > 0;

  return {
    ...state,
    board,
    activeSeat: nextSeat,
    selectedSquare: null,
    legalTargets: [],
    lastMove: { from, to },
    moves,
    hint: null,
    captured: captured
      ? {
          byYou: isWhite(captured)
            ? state.captured.byYou
            : [...state.captured.byYou, captured],
          byOpponent: isWhite(captured)
            ? [...state.captured.byOpponent, captured]
            : state.captured.byOpponent,
        }
      : state.captured,
    status: opponentHasMoves ? state.status : isOpponentInCheck ? "checkmate" : "draw",
  };
}

function createInitialState(botLevel: BotLevelId): GameState {
  return {
    modeId: "classic",
    board: cloneBoard(INITIAL_BOARD),

    players: [
      {
        id: "bot",
        name: `${BOT_LEVELS[botLevel].name} bot`,
        rating: BOT_RATINGS[botLevel],
        clock: "10:00",
        seat: BOT_SEAT,
        team: BOT_SEAT,
      },
      {
        id: "you",
        name: "You",
        rating: 1204,
        clock: "10:00",
        seat: HUMAN_SEAT,
        team: HUMAN_SEAT,
        isYou: true,
      },
    ],

    activeSeat: HUMAN_SEAT,

    selectedSquare: null,
    legalTargets: [],

    lastMove: null,

    moves: [],

    botLevel,
    hint: null,

    captured: {
      byYou: [],
      byOpponent: [],
    },

    status: "ongoing",
  };
}

export function useGameState(initialBotLevel: BotLevelId = "casual") {
  const [state, setState] = useState<GameState>(() => createInitialState(initialBotLevel));
  const [, setHistory] = useState<GameState[]>([]);
  const botTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (state.status !== "ongoing") {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setState((prev) => {
        if (prev.status !== "ongoing") {
          return prev;
        }

        const activeIndex = prev.players.findIndex(
          (player) => player.seat === prev.activeSeat
        );

        if (activeIndex === -1) {
          return prev;
        }

        const activePlayer = prev.players[activeIndex];
        const nextSeconds = Math.max(0, parseClockSeconds(activePlayer.clock) - 1);

        if (nextSeconds <= 0) {
          // The seat left active at a terminal status is the losing one.
          return {
            ...prev,
            players: prev.players.map((player, index) =>
              index === activeIndex ? { ...player, clock: "0:00" } : player
            ),
            status: "timeout",
          };
        }

        return {
          ...prev,
          players: prev.players.map((player, index) =>
            index === activeIndex
              ? { ...player, clock: formatClockFromSeconds(nextSeconds) }
              : player
          ),
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [state.status, state.activeSeat]);

  useEffect(() => {
    if (state.status !== "ongoing" || state.activeSeat !== BOT_SEAT) {
      return undefined;
    }

    botTimerRef.current = window.setTimeout(() => {
      setState((prev) => {
        if (prev.status !== "ongoing" || prev.activeSeat !== BOT_SEAT) {
          return prev;
        }

        const move = chooseBotMove(prev.board, BOT_SEAT, prev.botLevel);

        if (!move) {
          return {
            ...prev,
            status: isPlayerInCheck(prev.board, BOT_SEAT) ? "checkmate" : "draw",
          };
        }

        return applyMove(prev, move.from, move.to);
      });
    }, BOT_LEVELS[state.botLevel].minThinkMs);

    return () => {
      if (botTimerRef.current !== null) {
        window.clearTimeout(botTimerRef.current);
        botTimerRef.current = null;
      }
    };
  }, [state.activeSeat, state.status, state.botLevel]);

  const selectSquare = useCallback((pos: Position) => {
    setState((prev) => {
      if (prev.status !== "ongoing") {
        return prev;
      }

      if (prev.activeSeat !== HUMAN_SEAT) {
        const bot = prev.players.find((player) => player.seat === BOT_SEAT);
        return { ...prev, hint: `Wait for ${bot?.name ?? "the bot"} to move` };
      }

      const piece = prev.board[pos.row][pos.col];
      const selected = prev.selectedSquare;
      const selectedPiece = selected ? prev.board[selected.row][selected.col] : "";
      const isLegalTarget = prev.legalTargets.some((target) => samePosition(target, pos));

      if (selected && selectedPiece && isLegalTarget) {
        setHistory((previous) => [...previous, prev]);
        return applyMove(prev, selected, pos);
      }

      if (piece && pieceSeat(piece) === HUMAN_SEAT) {
        // Real chess rule: while in check you may move any piece, as long as
        // the resulting position removes the check.
        const legalTargets = getLegalMovesForPiece(prev.board, pos);

        return {
          ...prev,
          selectedSquare: pos,
          legalTargets,
          hint: legalTargets.length
            ? null
            : isPlayerInCheck(prev.board, HUMAN_SEAT)
              ? "You are in check — that piece cannot stop it"
              : "That piece has no legal moves",
        };
      }

      return {
        ...prev,
        selectedSquare: null,
        legalTargets: [],
        hint: selected
          ? "That square is not a legal move for the selected piece"
          : piece
            ? "That is your opponent's piece"
            : "Pick one of your pieces to see its legal moves",
      };
    });
  }, []);

  const setMode = useCallback((modeId: GameModeId) => {
    setState((prev) => ({ ...prev, modeId }));
  }, []);

  const setBotLevel = useCallback((botLevel: BotLevelId) => {
    setHistory([]);
    setState(createInitialState(botLevel));
  }, []);

  const resign = useCallback(() => {
    setState((prev) => ({ ...prev, status: "resigned" }));
  }, []);

  const resetGame = useCallback(() => {
    setHistory([]);
    setState((prev) => createInitialState(prev.botLevel));
  }, []);

  /** Takes back the human move together with the bot's reply. */
  const undoMove = useCallback(() => {
    setHistory((previous) => {
      const last = previous[previous.length - 1];
      if (!last) {
        return previous;
      }

      if (botTimerRef.current !== null) {
        window.clearTimeout(botTimerRef.current);
        botTimerRef.current = null;
      }

      setState({ ...last, hint: null });
      return previous.slice(0, -1);
    });
  }, []);

  const activePlayer = useMemo(
    () => state.players.find((player) => player.seat === state.activeSeat) ?? state.players[0],
    [state.activeSeat, state.players]
  );

  return {
    state,
    activePlayer,
    botThinking: state.status === "ongoing" && state.activeSeat === BOT_SEAT,
    selectSquare,
    setMode,
    setBotLevel,
    resign,
    resetGame,
    undoMove,
  };
}
