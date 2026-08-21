import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BOT_LEVELS, analyzePlayerMove, chooseBotMove } from "@/game/bot";
import {
  INITIAL_BOARD,
  INITIAL_CASTLING_RIGHTS,
  INITIAL_TEAM_BOARD,
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
  updateCastlingRights,
} from "@/game/engine";
import type {
  BotLevelId,
  ChessSeat,
  GameModeId,
  GameState,
  PieceSymbol,
  Position,
  TeamTurnId,
} from "@/types/chess";

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

const TEAM_TURN_ORDER: TeamTurnId[] = ["P1", "P3", "P2", "P4"];

function nextTeamTurn(slot: TeamTurnId): TeamTurnId {
  return TEAM_TURN_ORDER[(TEAM_TURN_ORDER.indexOf(slot) + 1) % TEAM_TURN_ORDER.length];
}

function seatForTeamTurn(slot: TeamTurnId): ChessSeat {
  return slot === "P1" || slot === "P2" ? "white" : "black";
}

function applyMove(state: GameState, from: Position, to: Position): GameState {
  const moving = state.board[from.row][from.col] as PieceSymbol;
  const captured = state.board[to.row][to.col] as PieceSymbol | "";
  const board = applyMoveToBoard(state.board, from, to);
  const castlingRights = updateCastlingRights(state.castlingRights, state.board, from, to);

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

  const nextTurnSlot = state.modeId === "two-v-two-bot" ? nextTeamTurn(state.turnSlot) : null;
  const nextSeat = nextTurnSlot ? seatForTeamTurn(nextTurnSlot) : opposingSeat(state.activeSeat);
  const isOpponentInCheck = isPlayerInCheck(board, nextSeat);
  const opponentHasMoves = getAllLegalMoves(board, nextSeat, castlingRights).length > 0;

  return {
    ...state,
    board,
    activeSeat: nextSeat,
    turnSlot: nextTurnSlot ?? state.turnSlot,
    selectedSquare: null,
    legalTargets: [],
    lastMove: { from, to },
    moves,
    castlingRights,
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

function createInitialState(
  botLevel: BotLevelId,
  playerSeat: ChessSeat = "white",
  modeId: GameModeId = "bot"
): GameState {
  const botSeat = opposingSeat(playerSeat);
  const isTeamMode = modeId === "two-v-two-bot";

  return {
    modeId,
    board: cloneBoard(isTeamMode ? INITIAL_TEAM_BOARD : INITIAL_BOARD),
    boardWidth: isTeamMode ? 10 : 8,

    players: isTeamMode
      ? [
          { id: "p1", name: "Player 1", rating: 1204, clock: "10:00", seat: "white", team: "white", isYou: true },
          { id: "p3", name: "Bot Alpha", rating: BOT_RATINGS[botLevel], clock: "10:00", seat: "black", team: "black" },
          { id: "p2", name: "Player 2", rating: 1204, clock: "10:00", seat: "white", team: "white", isYou: true },
          { id: "p4", name: "Bot Beta", rating: BOT_RATINGS[botLevel], clock: "10:00", seat: "black", team: "black" },
        ]
      : [
          {
            id: "bot",
            name: `${BOT_LEVELS[botLevel].name} bot`,
            rating: BOT_RATINGS[botLevel],
            clock: "10:00",
            seat: botSeat,
            team: botSeat,
          },
          {
            id: "you",
            name: "Player 1",
            rating: 1204,
            clock: "10:00",
            seat: playerSeat,
            team: playerSeat,
            isYou: true,
          },
        ],

    activeSeat: "white",
    turnSlot: "P1",

    selectedSquare: null,
    legalTargets: [],

    lastMove: null,

    moves: [],
    moveFeedback: null,
    castlingRights: INITIAL_CASTLING_RIGHTS,

    botLevel,
    playerSeat,
    botStarted: false,
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
    const isBotMode = state.modeId === "bot" || state.modeId === "two-v-two-bot";

    if (state.status !== "ongoing" || isBotMode) {
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
  }, [state.modeId, state.botStarted, state.status, state.activeSeat]);

  useEffect(() => {
    const botSeat = opposingSeat(state.playerSeat);
    const isTeamBotTurn = state.modeId === "two-v-two-bot" && (state.turnSlot === "P3" || state.turnSlot === "P4");

    if (state.status !== "ongoing" || (state.modeId === "two-v-two-bot" ? !isTeamBotTurn : state.activeSeat !== botSeat)) {
      return undefined;
    }

    botTimerRef.current = window.setTimeout(() => {
      setState((prev) => {
        const botSeat = opposingSeat(prev.playerSeat);
        if (prev.status !== "ongoing" || (prev.modeId === "two-v-two-bot" ? !(prev.turnSlot === "P3" || prev.turnSlot === "P4") : prev.activeSeat !== botSeat)) {
          return prev;
        }

        const move = chooseBotMove(prev.board, prev.activeSeat, prev.botLevel, prev.castlingRights);

        if (!move) {
          return {
            ...prev,
            status: isPlayerInCheck(prev.board, botSeat) ? "checkmate" : "draw",
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
  }, [state.activeSeat, state.status, state.botLevel, state.playerSeat]);

  const selectSquare = useCallback((pos: Position) => {
    setState((prev) => {
      if (prev.status !== "ongoing") {
        return prev;
      }

      const botSeat = opposingSeat(prev.playerSeat);

      const isHumanTurn = prev.modeId === "two-v-two-bot"
        ? prev.turnSlot === "P1" || prev.turnSlot === "P2"
        : prev.activeSeat === prev.playerSeat;
      if (!isHumanTurn) {
        const bot = prev.players.find((player) => player.seat === botSeat);
        return { ...prev, hint: `Wait for ${bot?.name ?? "the bot"} to move` };
      }

      const piece = prev.board[pos.row][pos.col];
      const selected = prev.selectedSquare;
      const selectedPiece = selected ? prev.board[selected.row][selected.col] : "";
      const isKingThenRookCastle =
        !!selected &&
        selectedPiece.toLowerCase() === "k" &&
        !!piece &&
        piece.toLowerCase() === "r" &&
        selected.row === pos.row &&
        selected.col === 4 &&
        (pos.col === 0 || pos.col === 7);
      const castleTarget = isKingThenRookCastle
        ? { row: pos.row, col: pos.col === 7 ? 6 : 2 }
        : null;
      const moveTarget = castleTarget ?? pos;
      const isLegalTarget = prev.legalTargets.some((target) =>
        samePosition(target, moveTarget)
      );

      if (selected && selectedPiece && isLegalTarget) {
        setHistory((previous) => [...previous, prev]);
        const nextState = applyMove(prev, selected, moveTarget);
        const analysisBoard = prev.board;
        const analysisSeat = prev.playerSeat;

        window.setTimeout(() => {
          const feedback = analyzePlayerMove(
            analysisBoard,
            selected,
            moveTarget,
            analysisSeat,
            prev.castlingRights
          );
          setState((current) => {
            if (
              current.lastMove?.from.row !== selected.row ||
              current.lastMove?.from.col !== selected.col ||
              current.lastMove?.to.row !== moveTarget.row ||
              current.lastMove?.to.col !== moveTarget.col
            ) {
              return current;
            }

            return { ...current, moveFeedback: feedback };
          });
        }, 0);

        return nextState;
      }

      if (piece && pieceSeat(piece) === prev.playerSeat) {
        // Real chess rule: while in check you may move any piece, as long as
        // the resulting position removes the check.
        const legalTargets = getLegalMovesForPiece(prev.board, pos, prev.castlingRights);

        return {
          ...prev,
          selectedSquare: pos,
          legalTargets,
          hint: legalTargets.length
            ? null
            : isPlayerInCheck(prev.board, prev.playerSeat)
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
    setHistory([]);
    setState((prev) => ({ ...createInitialState(prev.botLevel, prev.playerSeat, modeId), botStarted: modeId !== "bot" && modeId !== "two-v-two-bot" }));
  }, []);

  const setBotLevel = useCallback((botLevel: BotLevelId, playerSeat: ChessSeat) => {
    setHistory([]);
    setState((prev) => ({ ...createInitialState(botLevel, playerSeat, prev.modeId), botStarted: true }));
  }, []);

  const resign = useCallback(() => {
    setState((prev) => ({ ...prev, status: "resigned" }));
  }, []);

  const resetGame = useCallback(() => {
    setHistory([]);
    setState((prev) => ({ ...createInitialState(prev.botLevel, prev.playerSeat), botStarted: prev.botStarted }));
  }, []);

  const returnToBotSetup = useCallback(() => {
    setHistory([]);
    setState((prev) => createInitialState(prev.botLevel, prev.playerSeat));
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
    botThinking:
      state.status === "ongoing" && state.activeSeat === opposingSeat(state.playerSeat),
    selectSquare,
    setMode,
    setBotLevel,
    resign,
    resetGame,
    returnToBotSetup,
    undoMove,
  };
}
